import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import {
  NurtureScenarioBindingError,
  type NurtureScenarioBindingErrorCode,
  type ScenarioBindingAuthorizeInput,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";

const TOKEN = "m3-controller-service-token";
const VERIFIED_AT = new Date("2026-07-31T03:00:00.000Z");
const EXPIRES_AT = new Date("2026-07-31T03:05:00.000Z");

describe("binding-owner Nest controller", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("returns the allowlisted P7 receipt shape", async () => {
    const { baseUrl, stop } = await start(authorizer());
    close = stop;
    const response = await request(baseUrl, validBody());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "authorized",
      authorization_ref: "authorization-ref",
      workspace_id: "workspace-1",
      subject_type: "child",
      subject_id: "child-1",
      scenario_key: "nurture",
      owner_ref:
        "nurture_child_binding_anchor_v1:55a6c91b-dac9-4a17-9d61-dff098243d42",
      owner_version: 1,
      authorized_actor_id: "actor-1",
      represented_organization_id: "organization-1",
      purpose: "scenario_binding_write",
      verified_at: VERIFIED_AT.toISOString(),
      expires_at: EXPIRES_AT.toISOString(),
    });
  });

  it("maps invalid adapter input without invoking the authorizer", async () => {
    let calls = 0;
    const { baseUrl, stop } = await start({
      authorize: async () => {
        calls += 1;
        throw new Error("must not run");
      },
    });
    close = stop;
    const response = await request(baseUrl, { unknown: true });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "invalid_binding_request",
    });
    expect(calls).toBe(0);
  });

  it.each([
    ["invalid_binding_request", 400],
    ["invalid_owner_ref", 400],
    ["anchor_not_found", 409],
    ["anchor_not_current", 409],
    ["authorization_replay_conflict", 409],
    ["authorization_receipt_inactive", 409],
    ["owner_authorization_denied", 403],
    ["owner_authorization_unavailable", 503],
  ] as const)("maps %s to HTTP %i", async (code, status) => {
    const { baseUrl, stop } = await start(authorizer(code));
    close = stop;
    const response = await request(baseUrl, validBody());

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
  });

  it("maps unknown authorizer failures to a body-safe 500", async () => {
    const { baseUrl, stop } = await start({
      authorize: async () => {
        throw new Error("private failure marker");
      },
    });
    close = stop;
    const response = await request(baseUrl, validBody());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "owner_authorization_unavailable",
    });
  });
});

function authorizer(
  errorCode?: NurtureScenarioBindingErrorCode,
): ScenarioBindingOwnerAuthorizer {
  return {
    authorize: async (input) => {
      if (errorCode) {
        throw new NurtureScenarioBindingError(errorCode, "bounded test error");
      }
      return receipt(input);
    },
  };
}

function receipt(input: ScenarioBindingAuthorizeInput) {
  return {
    authorizationRef: "authorization-ref",
    workspaceId: input.workspaceId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    scenarioKey: input.scenarioKey,
    ownerRef:
      `nurture_${input.subjectType}_binding_anchor_v1:55a6c91b-dac9-4a17-9d61-dff098243d42`,
    ownerVersion: 1,
    authorizedActorId: input.actingActorId,
    representedOrganizationId: input.representedOrganizationId,
    purpose: input.purpose,
    verifiedAt: VERIFIED_AT,
    expiresAt: EXPIRES_AT,
  };
}

async function start(authorizerInput: ScenarioBindingOwnerAuthorizer) {
  const { app } = await createScenarioServiceApplication({
    bindingOwnerAuthorizer: authorizerInput,
    bindingOwnerServiceAuth: createBindingOwnerServiceAuth(TOKEN),
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    stop: () => app.close(),
  };
}

function request(baseUrl: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/internal/nurture/scenario-binding/authorize`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function validBody(): Record<string, unknown> {
  return {
    workspace_id: "workspace-1",
    acting_user_id: "user-1",
    idempotency_key: "idempotency-1",
    subject_type: "child",
    subject_id: "child-1",
    scenario_key: "nurture",
    acting_actor_id: "actor-1",
    represented_organization_id: "organization-1",
    purpose: "scenario_binding_write",
  };
}
