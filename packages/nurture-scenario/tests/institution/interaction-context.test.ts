import { describe, expect, it } from "vitest";
import {
  NurtureInteractionContextService,
  hashHostConversationRef,
  hashScenarioToken,
} from "../../src/domain/interactions/interaction-context.js";
import { createInMemoryInteractionContextRepository } from "../../src/domain/testing/in-memory-institution-ports.js";

const workspaceId = "ws-token";
const participantId = "participant-1";
const token = "A".repeat(43);

const createHarness = () => {
  let now = new Date("2026-07-13T10:00:00.000Z");
  const repository = createInMemoryInteractionContextRepository();
  const service = new NurtureInteractionContextService(repository, () => token, () => now);
  return {
    repository,
    service,
    advance(ms: number) {
      now = new Date(now.getTime() + ms);
    },
  };
};

const issue = (service: NurtureInteractionContextService, overrides: Record<string, unknown> = {}) =>
  service.issue({
    workspace_id: workspaceId,
    participant_id: participantId,
    purpose: "clarify",
    surface: "mobile_chat",
    host_conversation_ref: "conversation-1",
    payload_schema_version: 1,
    state_payload: { pending_intent: "select child", candidate_refs: [{ kind: "child", ref: "opaque" }] },
    ttl_ms: 60_000,
    ...overrides,
  });

describe("NurtureInteractionContextService", () => {
  it("persists only namespaced hashes and classifies the current binding", async () => {
    const { repository, service } = createHarness();
    await issue(service);
    const row = await repository.findByTokenHash({
      workspace_id: workspaceId,
      token_hash: hashScenarioToken(workspaceId, token),
    });
    expect(row?.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.host_conversation_ref_hash).toBe(
      hashHostConversationRef(workspaceId, "conversation-1"),
    );
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(row)).not.toContain("conversation-1");

    const classified = await service.classify({
      workspace_id: workspaceId,
      token,
      participant_id: participantId,
      purpose: "clarify",
      surface: "mobile_chat",
      host_conversation_ref: "conversation-1",
    });
    expect(classified.status).toBe("current");
  });

  it("blocks participant, purpose, surface, and conversation mismatches", async () => {
    const { service } = createHarness();
    await issue(service);
    for (const mismatch of [
      { participant_id: "participant-2" },
      { purpose: "submit_action" as const },
      { surface: "teacher_board" },
      { host_conversation_ref: "conversation-2" },
    ]) {
      const result = await service.classify({
        workspace_id: workspaceId,
        token,
        participant_id: participantId,
        purpose: "clarify",
        surface: "mobile_chat",
        host_conversation_ref: "conversation-1",
        ...mismatch,
      });
      expect(result).toEqual({ status: "blocked", reason_code: "token_mismatch" });
    }
  });

  it("derives expiry without mutating persisted lifecycle", async () => {
    const { repository, service, advance } = createHarness();
    const issued = await issue(service);
    advance(60_001);
    const result = await service.classify({
      workspace_id: workspaceId,
      token,
      participant_id: participantId,
      purpose: "clarify",
      surface: "mobile_chat",
      host_conversation_ref: "conversation-1",
    });
    expect(result).toEqual({ status: "expired", reason_code: "token_expired" });
    const row = await repository.findByTokenHash({
      workspace_id: workspaceId,
      token_hash: hashScenarioToken(workspaceId, token),
    });
    expect(row?.id).toBe(issued.context_id);
    expect(row?.status).toBe("active");
  });

  it("consumes clarify exactly once and keeps open-notification reads reusable", async () => {
    const { service } = createHarness();
    await issue(service);
    const first = await service.consume({
      workspace_id: workspaceId,
      token,
      participant_id: participantId,
      purpose: "clarify",
      surface: "mobile_chat",
      host_conversation_ref: "conversation-1",
    });
    expect(first.status).toBe("consumed");
    const replay = await service.consume({
      workspace_id: workspaceId,
      token,
      participant_id: participantId,
      purpose: "clarify",
      surface: "mobile_chat",
      host_conversation_ref: "conversation-1",
    });
    expect(replay).toEqual({ status: "blocked", reason_code: "token_replayed" });

    const notificationHarness = createHarness();
    await issue(notificationHarness.service, {
      purpose: "open_notification",
      host_conversation_ref: undefined,
    });
    const open = () =>
      notificationHarness.service.classify({
        workspace_id: workspaceId,
        token,
        participant_id: participantId,
        purpose: "open_notification",
        surface: "mobile_chat",
      });
    expect((await open()).status).toBe("current");
    expect((await open()).status).toBe("current");
  });

  it("revokes active context and forbids bodyful/cached-authorization state", async () => {
    const { service } = createHarness();
    const issued = await issue(service);
    expect(
      await service.revoke({ workspace_id: workspaceId, context_id: issued.context_id, expected_version: 0 }),
    ).toBe(true);
    const result = await service.classify({
      workspace_id: workspaceId,
      token,
      participant_id: participantId,
      purpose: "clarify",
      surface: "mobile_chat",
      host_conversation_ref: "conversation-1",
    });
    expect(result).toEqual({ status: "blocked", reason_code: "token_revoked" });

    await expect(issue(service, { state_payload: { body: "private" } })).rejects.toThrow(
      "forbidden key body",
    );
    await expect(
      issue(service, { state_payload: { policy_decision: { allowed: true } } }),
    ).rejects.toThrow("forbidden key policy_decision");
    await expect(issue(service, { state_payload: { grant_status: "active" } })).rejects.toThrow(
      "forbidden key grant_status",
    );
  });
});
