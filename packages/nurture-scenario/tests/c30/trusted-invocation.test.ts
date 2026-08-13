import { generateKeyPairSync, sign, verify } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  assertScenarioPrivateInvocationV1,
  type ScenarioPrivateInvocationV1,
} from "@my-chat/workflow-contracts";
import {
  InMemoryAtomicNurtureScenarioNonceStore,
  NurtureCanonicalJsonError,
  nurtureCanonicalJsonBytes,
  nurtureSha256Base64Url,
  signNurtureScenarioResponse,
  verifyNurtureScenarioInvocation,
  type NurtureDetachedRequestSignatureV1,
  type NurtureInvocationTrustPolicyV1,
} from "../../src/index.js";

const now = new Date("2026-08-06T08:00:00.000Z");
const hostKeys = generateKeyPairSync("ed25519");
const nurtureKeys = generateKeyPairSync("ed25519");

const declaration = {
  scenario_key: "nurture",
  endpoint_key: "nurture.subject_context.list",
  method: "POST",
  operation_key: "list_subject_contexts",
  input_schema_version: 1,
  ingress_category: "product_surface",
  ingress_key: "nurture.child_care_process_overview_v1",
  principal_origins: ["interactive_session", "durable_run_actor"],
} as const;

const trustPolicy: NurtureInvocationTrustPolicyV1 = {
  trust_version: 1,
  policy_revision: 7,
  state: "active",
  issuer: "my-chat.host",
  assertion_audience: "nurture.scenario",
  caller_subject: "my-chat-scenario-runtime",
  credential_subject: "my-chat-workload",
  key_id: "my-chat-i2-key",
  algorithm: "Ed25519",
  public_key: hostKeys.publicKey,
  valid_from: "2026-08-06T07:00:00.000Z",
  valid_until: "2026-08-06T09:00:00.000Z",
  declarations: [declaration],
};

function invocation(overrides: Partial<ScenarioPrivateInvocationV1> = {}): ScenarioPrivateInvocationV1 {
  const value: ScenarioPrivateInvocationV1 = {
    invocation_version: 1,
    contract_version: 1,
    contract_hash: "a".repeat(64),
    issuer: "my-chat.host",
    assertion_audience: "nurture.scenario",
    caller_binding: { caller_subject: "my-chat-scenario-runtime" },
    principal: {
      principal_version: 1,
      principal_kind: "human_user",
      account_ref: ref("user", "user-1"),
      actor_ref: ref("actor", "actor-1"),
      workspace_ref: ref("workspace", "workspace-1"),
      principal_origin: "interactive_session",
    },
    route: {
      scenario_key: "nurture",
      endpoint_key: "nurture.subject_context.list",
      method: "POST",
      ingress: {
        ingress_version: 1,
        ingress_category: "product_surface",
        ingress_key: "nurture.child_care_process_overview_v1",
      },
    },
    request: {
      request_id: "request-1",
      correlation_id: "correlation-1",
      issued_at: "2026-08-06T07:59:55.000Z",
      expires_at: "2026-08-06T08:00:25.000Z",
      nonce: "n".repeat(32),
    },
    operation: {
      operation_key: "list_subject_contexts",
      input_schema_version: 1,
      input: { cursor: null },
    },
  };
  return { ...value, ...overrides };
}

function requestSignature(
  value: ScenarioPrivateInvocationV1,
  input: { key_id?: string; privateKey?: typeof hostKeys.privateKey } = {},
): NurtureDetachedRequestSignatureV1 {
  const unsigned = {
    signature_version: 1,
    algorithm: "Ed25519",
    key_id: input.key_id ?? "my-chat-i2-key",
    body_sha256: nurtureSha256Base64Url(nurtureCanonicalJsonBytes(value)),
  } as const;
  return {
    ...unsigned,
    signature: sign(
      null,
      nurtureCanonicalJsonBytes(unsigned),
      input.privateKey ?? hostKeys.privateKey,
    ).toString("base64url"),
  };
}

async function verifyRequest(input: {
  value?: ScenarioPrivateInvocationV1;
  signature?: NurtureDetachedRequestSignatureV1;
  credential?: string;
  policies?: readonly NurtureInvocationTrustPolicyV1[];
  store?: InMemoryAtomicNurtureScenarioNonceStore;
  verificationNow?: Date;
} = {}) {
  const value = input.value ?? invocation();
  return verifyNurtureScenarioInvocation({
    invocation: value,
    signature: input.signature ?? requestSignature(value),
    transport_credential_subject: input.credential ?? "my-chat-workload",
    trust_policies: input.policies ?? [trustPolicy],
    nonce_store: input.store ?? new InMemoryAtomicNurtureScenarioNonceStore(),
    now: input.verificationNow ?? now,
  });
}

describe("C30 Nurture trusted invocation", () => {
  it.each(["interactive_session", "durable_run_actor"] as const)(
    "accepts an exact signed %s principal and consumes its nonce",
    async (principalOrigin) => {
      const value = invocation({
        principal: { ...invocation().principal, principal_origin: principalOrigin },
      });
      const store = new InMemoryAtomicNurtureScenarioNonceStore();
      const consumeOnce = vi.spyOn(store, "consumeOnce");
      await expect(verifyRequest({ value, store })).resolves.toMatchObject({
        declaration,
        trust_policy_revision: 7,
        credential_subject: "my-chat-workload",
      });
      expect(consumeOnce).toHaveBeenCalledOnce();
    },
  );

  it("rejects an absent service credential with no fallback", async () => {
    const value = invocation();
    await expect(verifyNurtureScenarioInvocation({
      invocation: value,
      signature: requestSignature(value),
      trust_policies: [trustPolicy],
      nonce_store: new InMemoryAtomicNurtureScenarioNonceStore(),
      now,
    })).rejects.toMatchObject({ code: "transport_unauthenticated", phase: "transport" });
  });

  it.each([
    ["credential", { credential: "other-workload" }, "trust_not_found"],
    ["issuer", { value: invocation({ issuer: "other.host" }) }, "trust_not_found"],
    ["audience", { value: invocation({ assertion_audience: "other.scenario" }) }, "trust_not_found"],
    ["caller", { value: invocation({ caller_binding: { caller_subject: "other-runtime" } }) }, "trust_not_found"],
  ] as const)("rejects a wrong %s", async (_label, mutation, code) => {
    const value = "value" in mutation ? mutation.value : invocation();
    await expect(verifyRequest({ ...mutation, signature: requestSignature(value) }))
      .rejects.toMatchObject({ code });
  });

  it("rejects an unknown key before signature verification", async () => {
    const value = invocation();
    await expect(verifyRequest({
      value,
      signature: requestSignature(value, { key_id: "unknown-key" }),
    })).rejects.toMatchObject({ code: "trust_not_found" });
  });

  it("rejects a revoked or non-current trust record", async () => {
    const revoked = { ...trustPolicy, state: "revoked" } as const;
    await expect(verifyRequest({ policies: [revoked] })).rejects.toMatchObject({ code: "trust_revoked" });
    await expect(verifyRequest({
      policies: [{ ...trustPolicy, valid_until: "2026-08-06T08:00:00.000Z" }],
    })).rejects.toMatchObject({ code: "trust_not_current" });
  });

  it("rejects ambiguous exact trust policies", async () => {
    await expect(verifyRequest({ policies: [trustPolicy, { ...trustPolicy, policy_revision: 8 }] }))
      .rejects.toMatchObject({ code: "trust_ambiguous" });
  });

  it("rejects signature tampering before inspecting the delegated operation", async () => {
    const value = invocation();
    const signature = requestSignature(value);
    signature.signature = `${signature.signature.startsWith("A") ? "B" : "A"}${signature.signature.slice(1)}`;
    await expect(verifyRequest({ value, signature })).rejects.toMatchObject({ code: "signature_invalid" });
  });

  it("rejects a body changed after signing", async () => {
    const signed = invocation();
    const changed = invocation({ operation: { ...signed.operation, input: { cursor: "changed" } } });
    await expect(verifyRequest({ value: changed, signature: requestSignature(signed) }))
      .rejects.toMatchObject({ code: "body_hash_mismatch" });
  });

  it.each([
    ["endpoint", (value: ScenarioPrivateInvocationV1) => ({
      ...value,
      route: { ...value.route, endpoint_key: "nurture.subject_context.resolve" },
    })],
    ["operation", (value: ScenarioPrivateInvocationV1) => ({
      ...value,
      operation: { ...value.operation, operation_key: "resolve_subject_context" },
    })],
    ["ingress", (value: ScenarioPrivateInvocationV1) => ({
      ...value,
      route: { ...value.route, ingress: { ...value.route.ingress, ingress_key: "other.surface" } },
    })],
  ] as const)("rejects an undeclared %s", async (_label, mutate) => {
    const value = mutate(invocation());
    await expect(verifyRequest({ value })).rejects.toMatchObject({ code: "route_mismatch" });
  });

  it("rejects an expired request before nonce consumption", async () => {
    await expect(verifyRequest({ verificationNow: new Date("2026-08-06T08:00:25.000Z") }))
      .rejects.toMatchObject({ code: "clock_invalid" });
  });

  it("rejects an upstream-valid 60-second invocation expired by the local clock before nonce consumption", async () => {
    const value = invocation({
      request: {
        ...invocation().request,
        issued_at: "2026-08-06T07:59:00.000Z",
        expires_at: "2026-08-06T08:00:00.000Z",
      },
    });
    expect(() => assertScenarioPrivateInvocationV1(value)).not.toThrow();
    const store = new InMemoryAtomicNurtureScenarioNonceStore();
    const consumeOnce = vi.spyOn(store, "consumeOnce");

    await expect(verifyRequest({ value, store })).rejects.toMatchObject({
      code: "clock_invalid",
      phase: "clock",
    });
    expect(consumeOnce).not.toHaveBeenCalled();
  });

  it("allows exactly one concurrent nonce consumer", async () => {
    const value = invocation();
    const signature = requestSignature(value);
    const store = new InMemoryAtomicNurtureScenarioNonceStore();
    const results = await Promise.allSettled([
      verifyRequest({ value, signature, store }),
      verifyRequest({ value, signature, store }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")[0]).toMatchObject({
      reason: { code: "nonce_replayed" },
    });
  });

  it("fails closed when the bounded in-memory nonce store is full", async () => {
    const store = new InMemoryAtomicNurtureScenarioNonceStore(1);
    await verifyRequest({ store });
    const second = invocation({ request: { ...invocation().request, request_id: "request-2", nonce: "x".repeat(32) } });
    await expect(verifyRequest({ value: second, store })).rejects.toMatchObject({ code: "nonce_replayed" });
  });

  it("removes expired nonce records before enforcing the bound", async () => {
    const store = new InMemoryAtomicNurtureScenarioNonceStore(1);
    const common = {
      issuer: "my-chat.host",
      assertion_audience: "nurture.scenario",
      caller_subject: "my-chat-scenario-runtime",
      credential_subject: "my-chat-workload",
      request_id: "request-1",
      body_sha256: "a".repeat(43),
    };
    await expect(store.consumeOnce({
      ...common,
      nonce: "n".repeat(32),
      expires_at: "2026-08-06T08:00:01.000Z",
    }, now)).resolves.toBe(true);
    await expect(store.consumeOnce({
      ...common,
      request_id: "request-2",
      nonce: "x".repeat(32),
      expires_at: "2026-08-06T08:01:01.000Z",
    }, new Date("2026-08-06T08:00:01.000Z"))).resolves.toBe(true);
  });

  it("signs a response bound to the exact verified request", async () => {
    const verifiedRequest = await verifyRequest();
    const body = Buffer.from('{"items":[]}', "utf8");
    const signed = signNurtureScenarioResponse({
      verified: verifiedRequest,
      response_status: 200,
      response_body: body,
      identity: {
        identity_version: 1,
        issuer: "nurture.scenario",
        assertion_audience: "my-chat.host",
        caller_subject: "nurture-scenario-service",
        key_id: "nurture-i3-key",
        algorithm: "Ed25519",
        private_key: nurtureKeys.privateKey,
        validity_ms: 30_000,
      },
      now,
    });
    const { signature, ...unsigned } = signed;
    expect(verify(
      null,
      nurtureCanonicalJsonBytes(unsigned),
      nurtureKeys.publicKey,
      Buffer.from(signature, "base64url"),
    )).toBe(true);
    expect(signed.request_binding).toEqual({
      request_id: "request-1",
      request_nonce_sha256: nurtureSha256Base64Url(Buffer.from("n".repeat(32), "utf8")),
    });
    expect(signed.response_body_sha256).toBe(nurtureSha256Base64Url(body));
  });

  it("rejects a response identity that does not reverse the request trust direction", async () => {
    const verifiedRequest = await verifyRequest();
    expect(() => signNurtureScenarioResponse({
      verified: verifiedRequest,
      response_status: 200,
      response_body: Buffer.from("{}", "utf8"),
      identity: {
        identity_version: 1,
        issuer: "other.scenario",
        assertion_audience: "my-chat.host",
        caller_subject: "nurture-scenario-service",
        key_id: "nurture-i3-key",
        algorithm: "Ed25519",
        private_key: nurtureKeys.privateKey,
        validity_ms: 30_000,
      },
      now,
    })).toThrow(expect.objectContaining({ code: "trust_not_found" }));
  });
});

describe("C30 canonical JSON", () => {
  it("sorts object keys and preserves array order deterministically", () => {
    expect(nurtureCanonicalJsonBytes({ z: [2, 1], a: "value" }).toString("utf8"))
      .toBe('{"a":"value","z":[2,1]}');
  });

  it("rejects undefined, non-finite values and non-plain objects", () => {
    expect(() => nurtureCanonicalJsonBytes({ value: undefined })).toThrow(NurtureCanonicalJsonError);
    expect(() => nurtureCanonicalJsonBytes(Number.NaN)).toThrow(NurtureCanonicalJsonError);
    expect(() => nurtureCanonicalJsonBytes(new Date())).toThrow(NurtureCanonicalJsonError);
  });
});

function ref(objectType: "user" | "actor" | "workspace", objectId: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: objectType,
    object_id: objectId,
  };
}
