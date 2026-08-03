import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION,
  HARNESS_CONFIRMATION_TTL_MS,
  NurtureInteractionContextService,
  assertProtectedContentEnvelopeV1,
  assertProtectedContentPlaintext,
  computeHarnessInputIntegrityTag,
  hashScenarioToken,
  issueHarnessConfirmation,
  parseHarnessConfirmationPayloadV2,
  withHarnessConfirmation,
  type HarnessConfirmationPayloadV2,
  type NurtureCommandSpec,
  type NurtureCommandTransaction,
  type NurtureInteractionContextRecord,
  type NurtureInteractionContextRepository,
} from "../../src/index.js";

const INTEGRITY_KEY = "harness-integrity-key-material-32chars!";

const payload = (
  overrides: Partial<HarnessConfirmationPayloadV2> = {},
): HarnessConfirmationPayloadV2 => ({
  capability_key: "submit_family_care_question",
  capability_version: "1.0.0",
  command_request_id: "command:test-1",
  target_refs: { enrollment: "ref-1" },
  expected_heads: { acknowledgement: 0 },
  input_integrity_tag: computeHarnessInputIntegrityTag(INTEGRITY_KEY, { body: "hello" }),
  integrity_tag_version: 1,
  ...overrides,
});

describe("harness confirmation payload", () => {
  it("accepts the closed v2 shape and rejects unknown or invalid fields", () => {
    expect(parseHarnessConfirmationPayloadV2(payload())).toMatchObject({
      capability_key: "submit_family_care_question",
    });
    expect(() =>
      parseHarnessConfirmationPayloadV2({ ...payload(), extra: true }),
    ).toThrow(/invalid shape/);
    expect(() =>
      parseHarnessConfirmationPayloadV2(payload({ capability_version: "v1" })),
    ).toThrow(/capability version/);
    expect(() =>
      parseHarnessConfirmationPayloadV2(payload({ input_integrity_tag: "xyz" })),
    ).toThrow(/integrity tag/);
    expect(() =>
      parseHarnessConfirmationPayloadV2(
        payload({ expected_heads: { acknowledgement: -1 } }),
      ),
    ).toThrow(/heads/);
  });

  it("derives a deterministic keyed integrity tag that drifts with input", () => {
    const tag = computeHarnessInputIntegrityTag(INTEGRITY_KEY, { body: "hello" });
    expect(tag).toBe(computeHarnessInputIntegrityTag(INTEGRITY_KEY, { body: "hello" }));
    expect(tag).not.toBe(computeHarnessInputIntegrityTag(INTEGRITY_KEY, { body: "hello!" }));
    expect(tag).not.toBe(
      computeHarnessInputIntegrityTag(`${INTEGRITY_KEY}-other`, { body: "hello" }),
    );
    expect(() => computeHarnessInputIntegrityTag("short", {})).toThrow(/32 characters/);
  });

  it("issues a five-minute prepare_action confirmation with the v2 payload", async () => {
    const created: unknown[] = [];
    const repository = {
      create: async (input: unknown) => {
        created.push(input);
        const row = input as Record<string, unknown>;
        return {
          ...(row as object),
          id: randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never;
      },
      findByTokenHash: async () => null,
      findLatestActiveByConversationHash: async () => null,
      consume: async () => null,
      revoke: async () => null,
    } satisfies NurtureInteractionContextRepository;
    const service = new NurtureInteractionContextService(repository);
    const issued = await issueHarnessConfirmation(service, {
      workspace_id: "ws-1",
      participant_id: "participant-1",
      surface: "chat",
      payload: payload(),
    });
    expect(issued.purpose).toBe("prepare_action");
    const row = created[0] as Record<string, unknown>;
    expect(row.payload_schema_version).toBe(HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION);
    const ttl =
      new Date(String(row.expires_at)).getTime() -
      (Date.now() - 1_000);
    expect(ttl).toBeLessThanOrEqual(HARNESS_CONFIRMATION_TTL_MS + 1_000);
    expect(ttl).toBeGreaterThan(HARNESS_CONFIRMATION_TTL_MS - 10_000);
  });
});

describe("protected content envelope", () => {
  it("accepts the closed envelope and rejects drift", () => {
    const envelope = {
      algVersion: 1,
      keyRef: "k1",
      ciphertext: "abc_-123",
      integrityTag: "tag123",
    };
    expect(assertProtectedContentEnvelopeV1(envelope)).toMatchObject({ keyRef: "k1" });
    expect(() =>
      assertProtectedContentEnvelopeV1({ ...envelope, extra: 1 }),
    ).toThrow(/invalid shape/);
    expect(() =>
      assertProtectedContentEnvelopeV1({ ...envelope, algVersion: 2 }),
    ).toThrow(/algorithm version/);
    expect(() =>
      assertProtectedContentEnvelopeV1({ ...envelope, ciphertext: "not base64url!" }),
    ).toThrow(/ciphertext/);
    expect(() => assertProtectedContentPlaintext("")).toThrow(/empty or too large/);
    expect(assertProtectedContentPlaintext("hello")).toBe("hello");
  });
});

type SpecInput = { body: string };

const record = (
  workspaceId: string,
  token: string,
  overrides: Partial<NurtureInteractionContextRecord> = {},
): NurtureInteractionContextRecord => ({
  id: randomUUID(),
  workspace_id: workspaceId,
  participant_id: "participant-1",
  purpose: "prepare_action",
  surface: "chat",
  token_hash: hashScenarioToken(workspaceId, token),
  token_hash_version: 1,
  payload_schema_version: HARNESS_CONFIRMATION_PAYLOAD_SCHEMA_VERSION,
  state_payload: payload(),
  status: "active",
  expires_at: new Date(Date.now() + 60_000).toISOString(),
  version: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("withHarnessConfirmation", () => {
  const workspaceId = "ws-1";
  const token = "confirmation-token-0123456789abcdefghijkl";
  const baseSpec: NurtureCommandSpec<SpecInput> = {
    command_key: "test_command",
    command_scope: "test",
    contract_version: 1,
    canonicalize: (input) => input,
    checkPreconditions: async () => ({ status: "ready" }),
    apply: async () => ({ output_refs: [] }),
  };
  const binding = {
    confirmation_ref: token,
    actor_participant_id: "participant-1",
    surface: "chat",
    command_request_id: "command:test-1",
    capability_key: "submit_family_care_question",
    capability_version: "1.0.0",
    integrity_key: INTEGRITY_KEY,
  };
  const context = {
    workspace_id: workspaceId,
    business_actor_ref: "participant-1",
    command_request_id: "command:test-1",
  };

  const transactionWith = (
    row: NurtureInteractionContextRecord | null,
    options: { consumeSucceeds?: boolean } = {},
  ): { transaction: NurtureCommandTransaction; consumed: string[] } => {
    const consumed: string[] = [];
    const transaction = {
      interactionContexts: {
        findByTokenHash: async () => row,
        consume: async (input: { context_id: string }) => {
          if (options.consumeSucceeds === false) return null;
          consumed.push(input.context_id);
          return row ? { ...row, status: "consumed" as const, version: row.version + 1 } : null;
        },
      },
      findCommitted: async () => null,
      createExecution: async () => {
        throw new Error("not used");
      },
      getWorkflowProjectById: async () => null,
      updateWorkflowProjectStrategy: async () => {
        throw new Error("not used");
      },
      appendEvidenceRef: async () => undefined,
    } as unknown as NurtureCommandTransaction;
    return { transaction, consumed };
  };

  it("consumes a current confirmation and delegates to the wrapped spec", async () => {
    const { transaction, consumed } = transactionWith(record(workspaceId, token));
    const spec = withHarnessConfirmation(baseSpec, binding);
    await expect(
      spec.checkPreconditions(transaction, { body: "hello" }, context),
    ).resolves.toEqual({ status: "ready" });
    expect(consumed).toHaveLength(1);
  });

  it("fails closed when the transaction port is absent", async () => {
    const { transaction } = transactionWith(record(workspaceId, token));
    (transaction as { interactionContexts?: unknown }).interactionContexts = undefined;
    const spec = withHarnessConfirmation(baseSpec, binding);
    await expect(
      spec.checkPreconditions(transaction, { body: "hello" }, context),
    ).resolves.toEqual({ status: "invalid", reason_code: "harness_confirmation_unavailable" });
  });

  it.each([
    ["missing row", null, "blocked", "invalid_confirmation"],
    [
      "consumed row",
      { status: "consumed" as const },
      "conflict",
      "confirmation_replayed",
    ],
    [
      "revoked row",
      { status: "revoked" as const },
      "blocked",
      "confirmation_revoked",
    ],
    [
      "expired row",
      { expires_at: new Date(Date.now() - 1_000).toISOString() },
      "conflict",
      "confirmation_expired",
    ],
    [
      "actor mismatch",
      { participant_id: "someone-else" },
      "blocked",
      "invalid_confirmation",
    ],
    [
      "schema mismatch",
      { payload_schema_version: 1 },
      "blocked",
      "invalid_confirmation",
    ],
    [
      "command identity mismatch",
      { state_payload: payload({ command_request_id: "command:other" }) },
      "blocked",
      "invalid_confirmation",
    ],
  ] as const)(
    "refuses on %s",
    async (_label, overrides, status, reason_code) => {
      const row = overrides === null ? null : record(workspaceId, token, overrides);
      const { transaction, consumed } = transactionWith(row);
      const spec = withHarnessConfirmation(baseSpec, binding);
      await expect(
        spec.checkPreconditions(transaction, { body: "hello" }, context),
      ).resolves.toEqual({ status, reason_code });
      expect(consumed).toHaveLength(0);
    },
  );

  it("refuses drifted input before consuming", async () => {
    const { transaction, consumed } = transactionWith(record(workspaceId, token));
    const spec = withHarnessConfirmation(baseSpec, binding);
    await expect(
      spec.checkPreconditions(transaction, { body: "tampered" }, context),
    ).resolves.toEqual({ status: "conflict", reason_code: "input_integrity_mismatch" });
    expect(consumed).toHaveLength(0);
  });

  it("maps a lost consume race to confirmation_replayed", async () => {
    const { transaction } = transactionWith(record(workspaceId, token), {
      consumeSucceeds: false,
    });
    const spec = withHarnessConfirmation(baseSpec, binding);
    await expect(
      spec.checkPreconditions(transaction, { body: "hello" }, context),
    ).resolves.toEqual({ status: "conflict", reason_code: "confirmation_replayed" });
  });
});
