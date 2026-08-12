import { generateKeyPairSync, sign } from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InMemoryAtomicNurtureScenarioNonceStore,
  NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
  NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT,
  NURTURE_FAMILY_SHARING_PRIVATE_INGRESS,
  NURTURE_FAMILY_SHARING_PRIVATE_PATH,
  NurtureFamilySharingCleanupOwner,
  nurtureCanonicalJsonBytes,
  nurtureSha256Base64Url,
  type NurtureDetachedRequestSignatureV1,
  type NurtureFamilySharingCleanupLedgerV1,
  type NurtureFamilySharingCleanupReceiptV1,
  type NurtureFamilySharingCleanupStoreReceiptV1,
  type NurtureFamilySharingCleanupScopeV1,
  type NurtureFamilySharingCurrentAuthorityReadPortV1,
  type NurtureFamilySharingExactLocalPairResolverV1,
  type NurtureInvocationTrustPolicyV1,
} from "@the-nurture/scenario";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import {
  FAMILY_SHARING_PRIVATE_REQUEST_SIGNATURE_HEADER,
  FAMILY_SHARING_PRIVATE_RESPONSE_SIGNATURE_HEADER,
  FAMILY_SHARING_PRIVATE_SERVICE_SUBJECT_HEADER,
  NURTURE_FAMILY_SHARING_PRIVATE_DECLARATIONS,
  createFamilySharingPrivateRuntime,
} from "../src/family-sharing-private-runtime.js";

const TOKEN = "family-sharing-private-token-32-characters";
const NOW = new Date("2026-08-12T08:00:00.000Z");
const hostKeys = generateKeyPairSync("ed25519");
const nurtureKeys = generateKeyPairSync("ed25519");
const closes: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closes.splice(0).map((close) => close()));
});

const localPair = Object.freeze({
  workspace_id: "workspace-1",
  child_ref: "child-local-1",
  child_care_process_ref: "process-local-1",
  family_ref: "family-local-1",
  child_association_ref: "child-association-local-1",
  family_association_ref: "family-association-local-1",
});

function pairEvidence() {
  return {
    evidence_ref: "pair-evidence-1",
    evidence_version: 7,
    verified_at: "2026-08-12T07:59:50.000Z",
    expires_at: "2026-08-12T08:01:00.000Z",
    child_anchor_ref: "child-anchor-opaque-1",
    child_owner_version: 4,
    family_anchor_ref: "family-anchor-opaque-1",
    family_owner_version: 5,
    my_chat_family_lifecycle: "active" as const,
  };
}

function target() {
  return {
    pair_evidence_ref: "pair-evidence-1",
    pair_evidence_version: 7,
    target_kind: "enrollment" as const,
    enrollment_ref: "enrollment-local-1",
    enrollment_revision: 8,
  };
}

function eligibilityInput() {
  return {
    interface_contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    pair_evidence: pairEvidence(),
    target: target(),
  };
}

function cleanupInput(categories: readonly ("media" | "focus_collaboration")[] = ["media"]) {
  return {
    cleanup_contract: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
    cleanup_command_ref: "withdrawal-command-1",
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    categories,
    pair_evidence: pairEvidence(),
    target: target(),
  };
}

function invocation(input: {
  operation?: string;
  operationInput?: unknown;
  requestId?: string;
  nonce?: string;
  issuer?: string;
  audience?: string;
  expiresAt?: string;
} = {}) {
  const operation = input.operation ?? NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION;
  return {
    invocation_version: 1,
    contract_version: 1,
    contract_hash: "a".repeat(64),
    issuer: input.issuer ?? "my-chat.host",
    assertion_audience: input.audience ?? "nurture.scenario",
    caller_binding: { caller_subject: "my-chat-family-sharing-runtime" },
    principal: {
      principal_version: 1,
      principal_kind: "human_user",
      account_ref: ref("user", "user-1"),
      actor_ref: ref("actor", "actor-1"),
      workspace_ref: ref("workspace", "workspace-1"),
      principal_origin: "durable_run_actor",
    },
    route: {
      scenario_key: "nurture",
      endpoint_key: NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT,
      method: "POST",
      ingress: {
        ingress_version: 1,
        ingress_category: "workflow_runtime",
        ingress_key: NURTURE_FAMILY_SHARING_PRIVATE_INGRESS,
      },
    },
    request: {
      request_id: input.requestId ?? "request-1",
      correlation_id: "correlation-1",
      issued_at: "2026-08-12T07:59:55.000Z",
      expires_at: input.expiresAt ?? "2026-08-12T08:00:25.000Z",
      nonce: input.nonce ?? "n".repeat(32),
    },
    operation: {
      operation_key: operation,
      input_schema_version: 1,
      input:
        input.operationInput ??
        (operation === NURTURE_FAMILY_SHARING_CLEANUP_OPERATION
          ? cleanupInput()
          : eligibilityInput()),
    },
  };
}

function signature(value: unknown): NurtureDetachedRequestSignatureV1 {
  const unsigned = {
    signature_version: 1,
    algorithm: "Ed25519",
    key_id: "my-chat-family-sharing-key",
    body_sha256: nurtureSha256Base64Url(nurtureCanonicalJsonBytes(value)),
  } as const;
  return {
    ...unsigned,
    signature: sign(null, nurtureCanonicalJsonBytes(unsigned), hostKeys.privateKey).toString(
      "base64url",
    ),
  };
}

function trust(overrides: Partial<NurtureInvocationTrustPolicyV1> = {}): NurtureInvocationTrustPolicyV1 {
  return {
    trust_version: 1,
    policy_revision: 12,
    state: "active",
    issuer: "my-chat.host",
    assertion_audience: "nurture.scenario",
    caller_subject: "my-chat-family-sharing-runtime",
    credential_subject: "my-chat-family-sharing-workload",
    key_id: "my-chat-family-sharing-key",
    algorithm: "Ed25519",
    public_key: hostKeys.publicKey,
    valid_from: "2026-08-12T07:00:00.000Z",
    valid_until: "2026-08-12T09:00:00.000Z",
    declarations: NURTURE_FAMILY_SHARING_PRIVATE_DECLARATIONS,
    ...overrides,
  };
}

function authority(
  resolved = true,
): NurtureFamilySharingCurrentAuthorityReadPortV1 {
  return {
    loadCurrent: vi.fn(async () =>
      resolved
        ? {
            status: "resolved" as const,
            authority_version: `v1.sha256:${"b".repeat(64)}`,
            categories: [
              facts("daily_activity", "nurture_to_family"),
              facts("media", "family_to_nurture"),
              facts("focus_collaboration", "family_to_nurture"),
            ],
          }
        : { status: "unavailable" as const },
    ),
  };
}

function resolver(
  status: "resolved" | "unavailable" = "resolved",
): NurtureFamilySharingExactLocalPairResolverV1 {
  return {
    resolveExact: vi.fn(async () =>
      status === "resolved"
        ? { status: "resolved" as const, local_pair: localPair }
        : { status: "unavailable" as const },
    ),
  };
}

class MemoryCleanupLedger implements NurtureFamilySharingCleanupLedgerV1 {
  readonly receipts = new Map<string, NurtureFamilySharingCleanupReceiptV1>();
  private readonly locks = new Set<string>();
  readonly executeExclusive = vi.fn(async (input: {
    workspace_id: string;
    cleanup_command_ref: string;
    request_fingerprint: string;
    child_care_process_ref: string;
    invocation_request_ref: string;
    service_ref: string;
    operation(): Promise<
      | Readonly<{ status: "ready"; receipt: NurtureFamilySharingCleanupReceiptV1 }>
      | Readonly<{ status: "unavailable" }>
    >;
  }) => {
    const key = `${input.workspace_id}:${input.cleanup_command_ref}`;
    if (this.locks.has(key)) return { status: "unavailable" as const };
    this.locks.add(key);
    try {
      const existing = this.receipts.get(key);
      if (existing) {
        return existing.request_fingerprint === input.request_fingerprint
          ? { status: "replayed" as const, receipt: existing }
          : { status: "conflict" as const };
      }
      const prepared = await input.operation();
      if (prepared.status !== "ready") return { status: "unavailable" as const };
      this.receipts.set(key, prepared.receipt);
      return { status: "committed" as const, receipt: prepared.receipt };
    } finally {
      this.locks.delete(key);
    }
  });
}

async function start(input?: {
  localPairResolver?: NurtureFamilySharingExactLocalPairResolverV1;
  currentAuthority?: NurtureFamilySharingCurrentAuthorityReadPortV1;
  cleanupOwner?: NurtureFamilySharingCleanupOwner;
  policies?: readonly NurtureInvocationTrustPolicyV1[];
  disabled?: boolean;
}) {
  const auth = createBindingOwnerServiceAuth(TOKEN);
  const runtime = input?.disabled
    ? undefined
    : createFamilySharingPrivateRuntime({
        trustPolicies: input?.policies ?? [trust()],
        nonceStore: new InMemoryAtomicNurtureScenarioNonceStore(),
        responseIdentity: {
          identity_version: 1,
          issuer: "nurture.scenario",
          assertion_audience: "my-chat.host",
          caller_subject: "nurture-scenario-service",
          key_id: "nurture-family-sharing-key",
          algorithm: "Ed25519",
          private_key: nurtureKeys.privateKey,
          validity_ms: 30_000,
        },
        localPairResolver: input?.localPairResolver ?? resolver(),
        authority: input?.currentAuthority ?? authority(),
        cleanupOwner:
          input?.cleanupOwner ??
          new NurtureFamilySharingCleanupOwner(
            new MemoryCleanupLedger(),
            [alreadyAbsentStore()],
            () => NOW,
          ),
        now: () => NOW,
      });
  const { app } = await createScenarioServiceApplication({
    bindingOwnerServiceAuth: auth,
    ...(runtime ? { familySharingPrivateRuntime: runtime } : {}),
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  closes.push(() => app.close());
  const address = app.getHttpServer().address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function post(
  baseUrl: string,
  value: unknown,
  options: { token?: string; detached?: NurtureDetachedRequestSignatureV1; subject?: string } = {},
) {
  const detached = options.detached ?? signature(value);
  return fetch(`${baseUrl}${NURTURE_FAMILY_SHARING_PRIVATE_PATH}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.token ?? TOKEN}`,
      "content-type": "application/json",
      connection: "close",
      [FAMILY_SHARING_PRIVATE_SERVICE_SUBJECT_HEADER]:
        options.subject ?? "my-chat-family-sharing-workload",
      [FAMILY_SHARING_PRIVATE_REQUEST_SIGNATURE_HEADER]: Buffer.from(
        JSON.stringify(detached),
        "utf8",
      ).toString("base64url"),
    },
    body: JSON.stringify(value),
  });
}

describe("family-sharing C3 private transport", () => {
  it("is default-off and authenticates bearer before any owner call", async () => {
    const disabled = await start({ disabled: true });
    const disabledResponse = await post(disabled, invocation());
    expect(disabledResponse.status).toBe(503);
    expect(disabledResponse.headers.get("cache-control")).toBe("private, no-store");

    const exactResolver = resolver();
    const enabled = await start({ localPairResolver: exactResolver });
    const denied = await post(enabled, invocation(), { token: "wrong-token" });
    expect(denied.status).toBe(401);
    expect(exactResolver.resolveExact).not.toHaveBeenCalled();
  });

  it("returns a signed no-store eligibility result without protected identifiers", async () => {
    const exactResolver = resolver();
    const currentAuthority = authority();
    const baseUrl = await start({ localPairResolver: exactResolver, currentAuthority });
    const response = await post(baseUrl, invocation());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    const bodyText = await response.text();
    expect(JSON.parse(bodyText)).toMatchObject({ status: "resolved" });
    expect(response.headers.get(FAMILY_SHARING_PRIVATE_RESPONSE_SIGNATURE_HEADER)).toBeTruthy();
    const protectedValues: string[] = [...Object.values(localPair),
      pairEvidence().child_anchor_ref,
      pairEvidence().family_anchor_ref,
      target().enrollment_ref,
    ];
    for (const protectedValue of protectedValues) {
      expect(bodyText).not.toContain(protectedValue);
    }
    expect(exactResolver.resolveExact).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: "workspace-1" }),
    );
    expect(currentAuthority.loadCurrent).toHaveBeenCalledOnce();
  });

  it.each([
    ["tampered signature", { detached: { ...signature(invocation()), signature: "A".repeat(86) } }, 401],
    ["wrong service subject", { subject: "other-workload" }, 401],
  ] as const)("fails closed for %s", async (_label, options, expectedStatus) => {
    const exactResolver = resolver();
    const baseUrl = await start({ localPairResolver: exactResolver });
    const response = await post(baseUrl, invocation(), options);
    expect(response.status).toBe(expectedStatus);
    expect(exactResolver.resolveExact).not.toHaveBeenCalled();
  });

  it("rejects the wrong exact audience before local-pair resolution", async () => {
    const exactResolver = resolver();
    const baseUrl = await start({ localPairResolver: exactResolver });
    const wrongAudience = invocation({ audience: "other.scenario" });
    expect((await post(baseUrl, wrongAudience)).status).toBe(401);
    expect(exactResolver.resolveExact).not.toHaveBeenCalled();
  });

  it("fails closed for revoked trust, expired invocation and nonce replay", async () => {
    const revokedBase = await start({ policies: [trust({ state: "revoked" })] });
    expect((await post(revokedBase, invocation())).status).toBe(401);

    const baseUrl = await start();
    const expired = invocation({ expiresAt: "2026-08-12T08:00:00.000Z" });
    expect((await post(baseUrl, expired)).status).toBe(401);
    const value = invocation();
    const detached = signature(value);
    expect((await post(baseUrl, value, { detached })).status).toBe(200);
    expect((await post(baseUrl, value, { detached })).status).toBe(409);
  });

  it("rejects caller-supplied local refs before resolver or cleanup owner", async () => {
    const exactResolver = resolver();
    const purge = vi.fn(async (): Promise<NurtureFamilySharingCleanupStoreReceiptV1> => ({
      store_ref: "derived-store-1",
      store_version: 1,
      disposition: "purged",
    }));
    const baseUrl = await start({
      localPairResolver: exactResolver,
      cleanupOwner: new NurtureFamilySharingCleanupOwner(
        new MemoryCleanupLedger(),
        [{ store_ref: "derived-store-1", purge }],
        () => NOW,
      ),
    });
    const malicious = invocation({
      operation: NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
      operationInput: {
        ...cleanupInput(),
        local_pair: {
          workspace_id: "attacker-workspace",
          child_care_process_ref: "attacker-process",
          family_ref: "attacker-family",
        },
      },
    });
    expect((await post(baseUrl, malicious)).status).toBe(400);
    expect(exactResolver.resolveExact).not.toHaveBeenCalled();
    expect(purge).not.toHaveBeenCalled();
  });

  it("collapses authority drift/revoke and resolver outage to unavailable", async () => {
    const drifted = await start({ currentAuthority: authority(false) });
    await expect((await post(drifted, invocation())).json()).resolves.toEqual({
      status: "unavailable",
    });
    const outage = await start({ localPairResolver: resolver("unavailable") });
    await expect((await post(outage, invocation())).json()).resolves.toEqual({
      status: "unavailable",
    });
  });
});

describe("family-sharing C3 withdrawal cleanup owner", () => {
  it("uses only Nurture-local exact scope, replays exactly and reports truthful purge count", async () => {
    const ledger = new MemoryCleanupLedger();
    const scopes: NurtureFamilySharingCleanupScopeV1[] = [];
    const purge = vi.fn(async (scope: NurtureFamilySharingCleanupScopeV1) => {
      scopes.push(scope);
      return {
        store_ref: "derived-store-1",
        store_version: 3,
        disposition: "purged" as const,
      };
    });
    const owner = new NurtureFamilySharingCleanupOwner(
      ledger,
      [{ store_ref: "derived-store-1", purge }],
      () => NOW,
    );
    const baseUrl = await start({ cleanupOwner: owner });
    const first = invocation({
      operation: NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
      requestId: "cleanup-request-1",
      nonce: "c".repeat(32),
    });
    await expect((await post(baseUrl, first)).json()).resolves.toMatchObject({
      status: "cleaned",
      disposition: "executed",
      purged_store_count: 1,
    });
    const replay = invocation({
      operation: NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
      requestId: "cleanup-request-2",
      nonce: "d".repeat(32),
    });
    await expect((await post(baseUrl, replay)).json()).resolves.toMatchObject({
      status: "cleaned",
      disposition: "replayed",
      purged_store_count: 1,
    });
    expect(purge).toHaveBeenCalledOnce();
    expect(scopes[0]).toEqual({
      workspace_id: "workspace-1",
      child_care_process_ref: "process-local-1",
      family_ref: "family-local-1",
      enrollment_ref: "enrollment-local-1",
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      categories: ["media"],
    });
    expect(JSON.stringify(scopes[0])).not.toContain("anchor");
    expect(JSON.stringify(scopes[0])).not.toContain("association");
  });

  it("counts an explicit empty-store attestation as zero purges", async () => {
    const baseUrl = await start({
      cleanupOwner: new NurtureFamilySharingCleanupOwner(
        new MemoryCleanupLedger(),
        [alreadyAbsentStore()],
        () => NOW,
      ),
    });
    const value = invocation({
      operation: NURTURE_FAMILY_SHARING_CLEANUP_OPERATION,
      nonce: "e".repeat(32),
    });
    await expect((await post(baseUrl, value)).json()).resolves.toMatchObject({
      status: "cleaned",
      purged_store_count: 0,
    });
  });

  it("does not commit success when any registered store purge fails", async () => {
    const ledger = new MemoryCleanupLedger();
    const firstPurge = vi.fn(async () => ({
      store_ref: "a-derived-store",
      store_version: 1,
      disposition: "purged" as const,
    }));
    const owner = new NurtureFamilySharingCleanupOwner(
      ledger,
      [
        { store_ref: "a-derived-store", purge: firstPurge },
        {
          store_ref: "b-derived-store",
          purge: async () => {
            throw new Error("store outage");
          },
        },
      ],
      () => NOW,
    );
    const result = await owner.cleanup({
      invocation_request_ref: "request-partial-1",
      service_ref: "my-chat-family-sharing-runtime",
      request: { wire: cleanupInput(), local_pair: localPair },
    });
    expect(result).toEqual({ status: "unavailable" });
    expect(firstPurge).toHaveBeenCalledOnce();
    expect(ledger.receipts.size).toBe(0);
  });

  it("fails closed when the cleanup ledger substitutes malformed receipt evidence", async () => {
    const owner = new NurtureFamilySharingCleanupOwner(
      {
        executeExclusive: async () => ({
          status: "committed",
          receipt: {
            receipt_version: 1,
            cleanup_receipt_ref: `cleanup.v1.${"f".repeat(64)}`,
            cleanup_command_ref: "cleanup-command-1",
            request_fingerprint: "substituted-fingerprint",
            categories: ["media"],
            store_receipts: [],
            completed_at: NOW.toISOString(),
          },
        }),
      },
      [alreadyAbsentStore()],
      () => NOW,
    );

    await expect(owner.cleanup({
      invocation_request_ref: "request-corrupt-ledger-1",
      service_ref: "my-chat-family-sharing-runtime",
      request: { wire: cleanupInput(), local_pair: localPair },
    })).resolves.toEqual({ status: "unavailable" });
  });
});

function facts(
  category_key: "daily_activity" | "media" | "focus_collaboration",
  direction: "nurture_to_family" | "family_to_nurture",
) {
  return {
    category_key,
    direction,
    role_authorized: true,
    grant_authorized: true,
    release_authorized: true,
    receiving_authorized: true,
    source_lifecycle: "active" as const,
    destination_lifecycle: "active" as const,
  };
}

function alreadyAbsentStore() {
  return {
    store_ref: "nurture.family-sharing.no-derived-store-v1",
    purge: async (): Promise<NurtureFamilySharingCleanupStoreReceiptV1> => ({
      store_ref: "nurture.family-sharing.no-derived-store-v1",
      store_version: 1,
      disposition: "already_absent",
    }),
  };
}

function ref(object_type: "user" | "actor" | "workspace", object_id: string) {
  return {
    schema_version: 1,
    namespace: "my_chat",
    object_type,
    object_id,
  };
}
