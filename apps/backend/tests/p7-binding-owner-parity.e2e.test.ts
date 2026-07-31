import type { AddressInfo } from "node:net";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  NurtureScenarioBindingError,
  type NurtureScenarioBindingErrorCode,
  type ScenarioBindingAuthorizeInput,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";
import { createScenarioServiceApplication } from "../../scenario-service/src/application.js";
import { createBindingOwnerServiceAuth } from "../../scenario-service/src/binding-owner-service-auth.js";
import { registerScenarioBindingOwnerRoute } from "../src/binding-owner.js";

const TOKEN = "m3-parity-service-token";
const VERIFIED_AT = new Date("2026-07-31T03:00:00.000Z");
const EXPIRES_AT = new Date("2026-07-31T03:05:00.000Z");

describe("P7 Fastify/Nest application parity", () => {
  const behavior: { error?: NurtureScenarioBindingErrorCode; unknown?: boolean } =
    {};
  const authorizer: ScenarioBindingOwnerAuthorizer = {
    authorize: async (input) => {
      if (behavior.unknown) throw new Error("private parity failure marker");
      if (behavior.error) {
        throw new NurtureScenarioBindingError(
          behavior.error,
          "bounded parity error",
        );
      }
      return receipt(input);
    },
  };
  const fastify = Fastify({ logger: false });
  let nestBaseUrl = "";
  let closeNest: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    registerScenarioBindingOwnerRoute(fastify, {
      authorizer,
      internalServiceToken: TOKEN,
    });
    await fastify.ready();
    const { app } = await createScenarioServiceApplication({
      bindingOwnerAuthorizer: authorizer,
      bindingOwnerServiceAuth: createBindingOwnerServiceAuth(TOKEN),
      logSink: () => undefined,
    });
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    nestBaseUrl = `http://127.0.0.1:${address.port}`;
    closeNest = () => app.close();
  });

  afterAll(async () => {
    await fastify.close();
    await closeNest?.();
  });

  it.each([
    {
      name: "child receipt with organization and ignored foreign input",
      body: { ...validBody(), foreign_field: "ignored" },
    },
    {
      name: "family receipt without organization",
      body: {
        ...validBody(),
        subject_type: "family",
        subject_id: "family-1",
        represented_organization_id: undefined,
      },
    },
    {
      name: "whitespace reaches the stricter domain layer",
      body: { ...validBody(), workspace_id: " " },
    },
    {
      name: "truthy non-string diagnostic value is forwarded",
      body: { ...validBody(), correlation_id: 7 },
    },
  ])("returns the same success application response: $name", async ({ body }) => {
    behavior.error = undefined;
    behavior.unknown = false;
    await expectParity({ body });
  });

  it.each([
    { name: "empty object", body: {} },
    { name: "array", body: [] },
    { name: "missing subject", body: { ...validBody(), subject_id: undefined } },
    {
      name: "invalid subject type",
      body: { ...validBody(), subject_type: "institution" },
    },
    {
      name: "wrong scenario",
      body: { ...validBody(), scenario_key: "education" },
    },
    {
      name: "empty represented organization",
      body: { ...validBody(), represented_organization_id: "" },
    },
    {
      name: "overlong HTTP identifier",
      body: { ...validBody(), workspace_id: "x".repeat(513) },
    },
  ])("returns the same adapter rejection: $name", async ({ body }) => {
    behavior.error = undefined;
    behavior.unknown = false;
    await expectParity({ body });
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
  ] as const)("returns the same %s mapping", async (code, expectedStatus) => {
    behavior.error = code;
    behavior.unknown = false;
    const result = await expectParity({ body: validBody() });
    expect(result.status).toBe(expectedStatus);
  });

  it("returns the same safe unknown-authorizer failure", async () => {
    behavior.error = undefined;
    behavior.unknown = true;
    const result = await expectParity({ body: validBody() });
    expect(result).toEqual({
      status: 500,
      body: { error: "owner_authorization_unavailable" },
    });
  });

  it("keeps text/plain in the P7 empty-body application band", async () => {
    behavior.error = undefined;
    behavior.unknown = false;
    await expectParity({
      rawBody: JSON.stringify(validBody()),
      contentType: "text/plain",
    });
  });

  it("keeps framework parser failures in separate safe response bands", async () => {
    const fastifyResult = await callFastify({
      rawBody: "{",
      contentType: "application/json",
    });
    const nestResult = await callNest({
      rawBody: "{",
      contentType: "application/json",
    });

    expect(fastifyResult.status).toBe(400);
    expect(fastifyResult.body).toMatchObject({
      code: "FST_ERR_CTP_INVALID_JSON_BODY",
    });
    expect(nestResult).toEqual({
      status: 400,
      body: { error: "invalid_request" },
    });
  });

  async function expectParity(input: {
    body?: unknown;
    rawBody?: string;
    contentType?: string;
  }) {
    const [fastifyResult, nestResult] = await Promise.all([
      callFastify(input),
      callNest(input),
    ]);
    expect(nestResult).toEqual(fastifyResult);
    return nestResult;
  }

  async function callFastify(input: {
    body?: unknown;
    rawBody?: string;
    contentType?: string;
  }) {
    const response = await fastify.inject({
      method: "POST",
      url: "/internal/nurture/scenario-binding/authorize",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": input.contentType ?? "application/json",
      },
      payload:
        input.rawBody ??
        (input.body === undefined ? undefined : JSON.stringify(input.body)),
    });
    return { status: response.statusCode, body: response.json() as unknown };
  }

  async function callNest(input: {
    body?: unknown;
    rawBody?: string;
    contentType?: string;
  }) {
    const response = await fetch(
      `${nestBaseUrl}/internal/nurture/scenario-binding/authorize`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          "content-type": input.contentType ?? "application/json",
        },
        body:
          input.rawBody ??
          (input.body === undefined ? undefined : JSON.stringify(input.body)),
      },
    );
    return { status: response.status, body: (await response.json()) as unknown };
  }
});

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
