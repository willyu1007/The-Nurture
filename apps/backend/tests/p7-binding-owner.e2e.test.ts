import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureBindingOwnerHttpSource } from "@my-chat/scenario-integrations";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// P7 joint journey: the real My-Chat binding-owner resolver source talks to
// the real Nurture owner endpoint over HTTP. Covers the authorized receipt,
// exact replay, post-revocation fail-closed denial, and the disabled/auth
// failure modes the Host maps to owner_verification_unavailable.
describe("p7-binding-owner joint journey", () => {
  const TOKEN = "p7-binding-owner-service-token-32b";
  const app = createNurtureApp({ bindingEvidenceKey: "k".repeat(32) });
  const server = buildServer(app, { internalServiceToken: TOKEN });
  const disabledApp = createNurtureApp();
  const disabledServer = buildServer(disabledApp, {
    internalServiceToken: TOKEN,
  });

  let baseUrlPromise: Promise<string> | undefined;
  const listen = () => (baseUrlPromise ??= server.listen({ host: "127.0.0.1", port: 0 }));

  afterAll(async () => {
    await server.close();
    await disabledServer.close();
    await Promise.all([app.disconnect(), disabledApp.disconnect()]);
  });

  const seedGuardian = async (workspaceId: string) => {
    const participant = await app.nurturePrisma.nurtureParticipant.create({
      data: {
        workspaceId,
        myChatUserId: `platform-user:${randomUUID()}`,
        status: "active",
      },
    });
    const role = await app.nurturePrisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId: participant.id,
        role: "guardian",
        scopeType: "family",
        scopeId: randomUUID(),
        status: "active",
        aggregateVersion: 1,
      },
    });
    return { participant, role };
  };

  const request = (workspaceId: string, actingUserId: string) => ({
    workspaceId,
    actingUserId,
    idempotencyKey: randomUUID(),
    subjectType: "child" as const,
    subjectId: `platform-child:${randomUUID()}`,
    scenarioKey: "nurture" as const,
    actingActorId: `platform-actor:${randomUUID()}`,
    purpose: "scenario_binding_write" as const,
  });

  it("authorizes, replays exactly, and fails closed after revocation", async () => {
    const baseUrl = await listen();
    const source = createNurtureBindingOwnerHttpSource({
      baseUrl,
      serviceToken: TOKEN,
    });
    const workspaceId = `ws-${randomUUID()}`;
    const { participant, role } = await seedGuardian(workspaceId);
    const first = request(workspaceId, participant.myChatUserId);

    const authorized = await source.resolve(first);
    if (authorized.status !== "authorized") {
      throw new Error(`expected authorized, got ${JSON.stringify(authorized)}`);
    }
    expect(authorized.receipt.workspaceId).toBe(workspaceId);
    expect(authorized.receipt.subjectId).toBe(first.subjectId);
    expect(authorized.receipt.ownerRef).toMatch(
      /^nurture_child_binding_anchor_v1:[0-9a-f-]{36}$/,
    );
    expect(authorized.receipt.expiresAt.getTime()).toBeGreaterThan(
      authorized.receipt.verifiedAt.getTime(),
    );

    const replay = await source.resolve(first);
    expect(replay).toEqual(authorized);

    const again = await source.resolve({
      ...first,
      idempotencyKey: randomUUID(),
    });
    if (again.status !== "authorized") {
      throw new Error(`expected authorized, got ${JSON.stringify(again)}`);
    }
    expect(again.receipt.ownerRef).toBe(authorized.receipt.ownerRef);

    await app.nurturePrisma.nurtureCareRoleAssignment.update({
      where: { id: role.id },
      data: { status: "revoked", aggregateVersion: { increment: 1 } },
    });
    const afterRevoke = await source.resolve({
      ...first,
      idempotencyKey: randomUUID(),
    });
    expect(afterRevoke).toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });
  });

  it("denies unknown users and stays unavailable without auth or the evidence key", async () => {
    const baseUrl = await listen();
    const workspaceId = `ws-${randomUUID()}`;
    await seedGuardian(workspaceId);

    const stranger = createNurtureBindingOwnerHttpSource({
      baseUrl,
      serviceToken: TOKEN,
    });
    expect(
      await stranger.resolve(request(workspaceId, `platform-user:${randomUUID()}`)),
    ).toEqual({ status: "denied", reason_code: "owner_authorization_denied" });

    const badToken = createNurtureBindingOwnerHttpSource({
      baseUrl,
      serviceToken: "wrong-token-that-is-32-chars-long",
    });
    expect(await badToken.resolve(request(workspaceId, "u"))).toEqual({
      status: "unavailable",
      reason_code: "service_auth_required",
    });

    const disabledUrl = await disabledServer.listen({
      host: "127.0.0.1",
      port: 0,
    });
    const disabled = createNurtureBindingOwnerHttpSource({
      baseUrl: disabledUrl,
      serviceToken: TOKEN,
    });
    expect(await disabled.resolve(request(workspaceId, "u"))).toEqual({
      status: "unavailable",
      reason_code: "binding_owner_disabled",
    });
  });
});
