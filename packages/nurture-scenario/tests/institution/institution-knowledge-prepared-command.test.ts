import type { CanonicalRef, ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import { describe, expect, it } from "vitest";
import type { NurtureParticipantPrincipalBindingV1 } from "../../src/c30/participant-binding.js";
import type { NurtureInstitutionKnowledgeFormalPrepareInputV1 } from "../../src/institution-knowledge-formal-ingress-contract.js";
import {
  NurtureInstitutionKnowledgePreparedCommandCrypto,
  NurtureInstitutionKnowledgePreparedCommandOwner,
  type NurtureInstitutionKnowledgePreparedCommandLedgerV1,
  type NurtureInstitutionKnowledgePreparedCommandRecordV1,
} from "../../src/domain/institution/institution-knowledge-prepared-command.js";

const INTEGRITY_KEY = "institution-knowledge-prepared-integrity-v1";
const ENCRYPTION_KEY = "institution-knowledge-prepared-encryption-v1";
const START = Date.parse("2026-08-11T08:00:00.000Z");

const accountRef = ref("my_chat", "user", "user-1");
const actorRef = ref("my_chat", "actor", "actor-1");
const workspaceRef = ref("my_chat", "workspace", "workspace-1");
const participantRef = ref("nurture", "participant", "participant-1", 7);
const principal: ScenarioHumanPrincipalV1 = {
  principal_version: 1,
  principal_kind: "human_user",
  account_ref: accountRef,
  actor_ref: actorRef,
  workspace_ref: workspaceRef,
  principal_origin: "interactive_session",
};
const binding: NurtureParticipantPrincipalBindingV1 = {
  binding_version: 1,
  binding_revision: 9,
  status: "active",
  participant_ref: participantRef,
  account_ref: accountRef,
  actor_ref: actorRef,
  workspace_ref: workspaceRef,
};
const authority = {
  workspace_id: "workspace-1",
  participant_ref: "participant-1",
  institution_ref: "institution-1",
  role_assignment_ref: "role-1",
  active_role: "institution_admin" as const,
  surface_key: "institution_workbench" as const,
  authority_version: "nurture.ik-authority.v1.b9.p12.r4.i6.t3",
  evaluated_at: "2026-08-11T08:00:00.000Z",
};

describe("Institution Knowledge prepared-command owner", () => {
  it("deduplicates an exact prepare and preserves the frozen response after response loss", async () => {
    const test = harness();
    const first = await test.owner.prepare(prepareInput());
    test.clock.ms += 1_000;
    const replay = await test.owner.prepare(prepareInput({
      authority: { ...authority, evaluated_at: "2026-08-11T08:00:01.000Z" },
    }));

    expect(first).toEqual(replay);
    expect(first.status).toBe("ready_to_confirm");
    expect(test.ledger.size()).toBe(1);
    const stored = test.ledger.only();
    expect(stored.frozen_snapshot_ciphertext).not.toContain("publication body");
    if (first.status === "ready_to_confirm") {
      expect(stored.frozen_snapshot_ciphertext).not.toContain(first.confirmation_ref);
    }
  });

  it("fails closed when one client command id is reused with another frozen payload", async () => {
    const test = harness();
    await expect(test.owner.prepare(prepareInput())).resolves.toMatchObject({
      status: "ready_to_confirm",
    });
    await expect(test.owner.prepare(prepareInput({
      command: revokeCommand(),
    }))).resolves.toEqual({
      status: "not_prepared",
      reason_code: "prepared_client_command_reuse_conflict",
    });
    expect(test.ledger.size()).toBe(1);
  });

  it("never revives an expired prepare under the same client command id", async () => {
    const test = harness({ ttlMs: 1_000 });
    const first = await test.owner.prepare(prepareInput());
    expect(first.status).toBe("ready_to_confirm");
    test.clock.ms += 1_001;
    await expect(test.owner.prepare(prepareInput())).resolves.toEqual({
      status: "not_prepared",
      reason_code: "prepared_command_expired",
    });
    expect(test.ledger.size()).toBe(1);
  });

  it("atomically consumes once and returns the same frozen result on an exact replay", async () => {
    const test = harness();
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
    const execute = executeInput(prepared.command_request_id, prepared.confirmation_ref);

    const [first, replay] = await Promise.all([
      test.owner.consumeConfirmed(execute),
      test.owner.consumeConfirmed(execute),
    ]);
    expect(first).toEqual(replay);
    expect(first).toEqual({
      status: "resolved",
      command_request_id: prepared.command_request_id,
      frozen_request: {
        capabilityKey: "publish_institution_knowledge_revision",
        capabilityVersion: "1.0.0",
        targetOptionRef: "revision-option-01",
        operationInput: {},
        confirmationRef: prepared.confirmation_ref,
      },
      authority,
    });
    expect(test.ledger.only()).toMatchObject({ status: "consumed", aggregate_version: 2 });

    test.clock.ms += 10 * 60_000;
    await expect(test.owner.consumeConfirmed(execute)).resolves.toEqual({
      status: "denied",
      reason_code: "prepared_command_expired",
    });
    expect(test.ledger.only()).toMatchObject({
      status: "expired",
      snapshot_codec_version: 0,
      frozen_snapshot_ciphertext: "",
    });
  });

  it("rejects wrong confirmation reuse without exposing the frozen payload", async () => {
    const test = harness();
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
    await expect(test.owner.consumeConfirmed(executeInput(
      prepared.command_request_id,
      "ikc1.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    ))).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_reuse_conflict",
    });
    expect(test.ledger.only().status).toBe("prepared");
  });

  it("denies an unconsumed expired command and detects stored snapshot corruption", async () => {
    const expired = harness({ ttlMs: 1_000 });
    const prepared = await expired.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
    expired.clock.ms += 1_001;
    await expect(expired.owner.consumeConfirmed(executeInput(
      prepared.command_request_id,
      prepared.confirmation_ref,
    ))).resolves.toEqual({
      status: "denied",
      reason_code: "prepared_command_expired",
    });

    const corrupt = harness();
    const preparedCorrupt = await corrupt.owner.prepare(prepareInput());
    if (preparedCorrupt.status !== "ready_to_confirm") throw new Error("prepare failed");
    corrupt.ledger.mutate((record) => ({ ...record, frozen_snapshot_ciphertext: "tampered.snapshot.value" }));
    await expect(corrupt.owner.consumeConfirmed(executeInput(
      preparedCorrupt.command_request_id,
      preparedCorrupt.confirmation_ref,
    ))).resolves.toEqual({
      status: "unavailable",
      reason_code: "prepared_command_snapshot_drift",
    });

    const extraRoot = harness({ injectSnapshotExtra: true });
    const preparedExtra = await extraRoot.owner.prepare(prepareInput());
    if (preparedExtra.status !== "ready_to_confirm") throw new Error("prepare failed");
    await expect(extraRoot.owner.consumeConfirmed(executeInput(
      preparedExtra.command_request_id,
      preparedExtra.confirmation_ref,
    ))).resolves.toEqual({
      status: "unavailable",
      reason_code: "prepared_command_snapshot_drift",
    });
  });

  it("rejects an impossible persisted status/time pairing before replaying it", async () => {
    const test = harness();
    await expect(test.owner.prepare(prepareInput())).resolves.toMatchObject({
      status: "ready_to_confirm",
    });
    test.ledger.mutate((record) => ({
      ...record,
      status: "consumed",
    }));

    await expect(test.owner.prepare(prepareInput())).resolves.toEqual({
      status: "unavailable",
      reason_code: "prepared_command_ledger_invalid",
    });
  });
});

function harness(options: { ttlMs?: number; injectSnapshotExtra?: boolean } = {}) {
  const ledger = createInMemoryLedger();
  const clock = { ms: START };
  let sequence = 0;
  const crypto = new NurtureInstitutionKnowledgePreparedCommandCrypto(
    INTEGRITY_KEY,
    ENCRYPTION_KEY,
  );
  const protection = options.injectSnapshotExtra
    ? {
        tag: crypto.tag.bind(crypto),
        issueConfirmation: crypto.issueConfirmation.bind(crypto),
        sealSnapshot: crypto.sealSnapshot.bind(crypto),
        openSnapshot(input: Parameters<typeof crypto.openSnapshot>[0]) {
          const value = crypto.openSnapshot(input);
          return value && typeof value === "object" && !Array.isArray(value)
            ? { ...value, compatibility: true }
            : value;
        },
      }
    : crypto;
  const owner = new NurtureInstitutionKnowledgePreparedCommandOwner({
    ledger,
    participantBindings: { readCurrentBindings: async () => [binding] },
    participantAuthority: {
      authorizeCurrent: async () => ({
        authority_version: 1,
        authorized: true,
        authority_revision: 12,
        reason_code: "authorized",
      }),
    },
    protection,
    now: () => new Date(clock.ms),
    createCommandRequestId: () => `command-request-${++sequence}`,
    ...(options.ttlMs === undefined ? {} : { ttlMs: options.ttlMs }),
  });
  return { clock, ledger, owner };
}

function prepareInput(overrides: Partial<Parameters<
  NurtureInstitutionKnowledgePreparedCommandOwner["prepare"]
>[0]> = {}) {
  return {
    principal,
    invocation_request_id: "invocation-1",
    client_surface: "web_run_workbench" as const,
    authority,
    command: prepareCommand(),
    ...overrides,
  };
}

function prepareCommand(): NurtureInstitutionKnowledgeFormalPrepareInputV1 {
  return {
    contractVersion: 1 as const,
    clientCommandId: "client-command-1",
    request: {
      capabilityKey: "publish_institution_knowledge_revision",
      capabilityVersion: "1.0.0" as const,
      targetOptionRef: "revision-option-01",
      operationInput: {},
    },
  };
}

function revokeCommand(): NurtureInstitutionKnowledgeFormalPrepareInputV1 {
  return {
    contractVersion: 1,
    clientCommandId: "client-command-1",
    request: {
      capabilityKey: "revoke_institution_knowledge_revision",
      capabilityVersion: "1.0.0",
      targetOptionRef: "revision-option-01",
      operationInput: { reasonKey: "superseded" },
    },
  };
}

function executeInput(commandRequestId: string, confirmationRef: string) {
  return {
    principal,
    invocation_request_id: "invocation-execute-1",
    client_surface: "web_run_workbench" as const,
    command: {
      contractVersion: 1 as const,
      commandRequestId,
      confirmationRef,
    },
  };
}

function createInMemoryLedger(): NurtureInstitutionKnowledgePreparedCommandLedgerV1 & {
  size(): number;
  only(): NurtureInstitutionKnowledgePreparedCommandRecordV1;
  mutate(change: (
    record: NurtureInstitutionKnowledgePreparedCommandRecordV1,
  ) => NurtureInstitutionKnowledgePreparedCommandRecordV1): void;
} {
  const byDedup = new Map<string, NurtureInstitutionKnowledgePreparedCommandRecordV1>();
  const dedupKey = (record: NurtureInstitutionKnowledgePreparedCommandRecordV1) => [
    record.workspace_id,
    record.participant_ref,
    record.client_surface,
    record.client_command_id_hash,
  ].join("\0");
  return {
    async getOrCreate(candidate) {
      const key = dedupKey(candidate);
      const existing = byDedup.get(key);
      if (existing) return { status: "existing", record: structuredClone(existing) };
      byDedup.set(key, structuredClone(candidate));
      return { status: "created", record: structuredClone(candidate) };
    },
    async consumeExact(input) {
      const entry = [...byDedup.entries()].find(([, record]) =>
        record.workspace_id === input.workspace_id
        && record.command_request_id === input.command_request_id);
      if (!entry) return { status: "not_found" };
      const [key, record] = entry;
      if (
        record.participant_ref !== input.participant_ref
        || record.confirmation_ref_hash !== input.confirmation_ref_hash
      ) return { status: "conflict" };
      if (record.status === "expired" || record.expires_at <= input.consumed_at) {
        byDedup.set(key, {
          ...record,
          status: "expired",
          snapshot_codec_version: 0,
          frozen_snapshot_ciphertext: "",
          aggregate_version: record.aggregate_version + 1,
        });
        return { status: "expired" };
      }
      if (record.status === "consumed") {
        return { status: "replayed", record: structuredClone(record) };
      }
      const consumed = {
        ...record,
        status: "consumed" as const,
        consumed_at: input.consumed_at,
        aggregate_version: record.aggregate_version + 1,
      };
      byDedup.set(key, consumed);
      return { status: "consumed", record: structuredClone(consumed) };
    },
    size: () => byDedup.size,
    only: () => {
      const record = [...byDedup.values()][0];
      if (!record) throw new Error("ledger is empty");
      return structuredClone(record);
    },
    mutate(change) {
      const entry = [...byDedup.entries()][0];
      if (!entry) throw new Error("ledger is empty");
      byDedup.set(entry[0], change(entry[1]));
    },
  };
}

function ref(
  namespace: "my_chat" | "nurture",
  objectType: string,
  objectId: string,
  version?: number,
): CanonicalRef {
  return {
    schema_version: 1,
    namespace,
    object_type: objectType,
    object_id: objectId,
    ...(version === undefined ? {} : { version }),
  };
}
