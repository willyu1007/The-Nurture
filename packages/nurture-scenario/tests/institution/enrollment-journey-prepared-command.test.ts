import type { CanonicalRef, ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import { describe, expect, it } from "vitest";
import type { NurtureParticipantPrincipalBindingV1 } from "../../src/c30/participant-binding.js";
import type { NurtureEnrollmentJourneyPreparedCommandDraftV1 } from "../../src/enrollment-journey-formal-ingress-contract.js";
import {
  NurtureEnrollmentJourneyPreparedCommandCrypto,
  NurtureEnrollmentJourneyPreparedCommandOwner,
  type NurtureEnrollmentJourneyPreparedCommandLedgerV1,
  type NurtureEnrollmentJourneyPreparedCommandRecordV1,
} from "../../src/domain/institution/enrollment-journey-prepared-command.js";

const INTEGRITY_KEY = "enrollment-journey-prepared-integrity-v1";
const ENCRYPTION_KEY = "enrollment-journey-prepared-encryption-v1";
const START = Date.parse("2026-08-12T08:00:00.000Z");

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
  authority_version: "nurture.ej-authority.v1.b9.p12.r4.i6.t3",
  evaluated_at: "2026-08-12T08:00:00.000Z",
};

describe("Enrollment Journey prepared-command owner", () => {
  it("deduplicates an exact prepare and preserves the frozen response", async () => {
    const test = harness();
    const first = await test.owner.prepare(prepareInput());
    test.clock.ms += 1_000;
    const replay = await test.owner.prepare(prepareInput({
      authority: { ...authority, evaluated_at: "2026-08-12T08:00:01.000Z" },
    }));

    expect(first).toEqual(replay);
    expect(first.status).toBe("ready_to_confirm");
    expect(test.ledger.size()).toBe(1);
    if (first.status === "ready_to_confirm") {
      expect(first.confirmation_ref.startsWith("ejc1.")).toBe(true);
      expect(test.ledger.only().frozen_snapshot_ciphertext)
        .not.toContain(first.confirmation_ref);
    }
  });

  it("fails closed when one client command id is reused with another payload", async () => {
    const test = harness();
    await expect(test.owner.prepare(prepareInput())).resolves.toMatchObject({
      status: "ready_to_confirm",
    });
    await expect(test.owner.prepare(prepareInput({
      command: intentCommand("confirm_intent_conversation", {}),
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

  it("rejects the three direct_commit capabilities at prepare", async () => {
    const test = harness();
    await expect(test.owner.prepare(prepareInput({
      command: intentCommand("record_or_skip_visit", { disposition: "recorded" }),
    }))).resolves.toEqual({
      status: "not_prepared",
      reason_code: "prepared_command_intent_invalid",
    });
    expect(test.ledger.size()).toBe(0);
  });

  it("verifies without consuming, and still resolves after the executor consumed", async () => {
    const test = harness();
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

    const verified = await test.owner.verifyConfirmed(verifyInput(prepared));
    expect(verified.status).toBe("resolved");
    if (verified.status !== "resolved") throw new Error("verify failed");
    expect(verified.command_request_id).toBe(prepared.command_request_id);
    expect(verified.frozen_request.capabilityKey).toBe("close_inquiry");
    expect(verified.frozen_request.confirmationRef).toBe(prepared.confirmation_ref);
    expect(verified.authority).toEqual(authority);
    // Read-only: the ledger row is still prepared.
    expect(test.ledger.only().status).toBe("prepared");

    // The executor's in-transaction consume flips the row; verify stays
    // resolvable so the kernel's exact replay remains reachable.
    const consumed = await test.ledger.consumeExact({
      workspace_id: authority.workspace_id,
      participant_ref: authority.participant_ref,
      command_request_id: prepared.command_request_id,
      confirmation_ref_hash: test.confirmationHash(prepared.confirmation_ref),
      consumed_at: new Date(test.clock.ms + 1).toISOString(),
    });
    expect(consumed.status).toBe("consumed");
    await expect(test.owner.verifyConfirmed(verifyInput(prepared))).resolves.toMatchObject({
      status: "resolved",
      command_request_id: prepared.command_request_id,
    });
  });

  it("rejects a foreign confirmation and an expired command at verify", async () => {
    const test = harness({ ttlMs: 1_000 });
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

    await expect(test.owner.verifyConfirmed(verifyInput({
      command_request_id: prepared.command_request_id,
      confirmation_ref: `ejc1.${"a".repeat(43)}`,
    }))).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_reuse_conflict",
    });

    test.clock.ms += 1_001;
    await expect(test.owner.verifyConfirmed(verifyInput(prepared))).resolves.toEqual({
      status: "denied",
      reason_code: "prepared_command_expired",
    });
  });

  it("verifies the exact inquiry confirmation historically after expiry", async () => {
    const test = harness({ ttlMs: 1_000 });
    const prepared = await test.owner.prepare(prepareInput({
      command: intentCommand("start_enrollment_inquiry", inquiryInput()),
    }));
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

    await expect(test.owner.verifyHistoricalConfirmation({
      workspace_id: authority.workspace_id,
      command: {
        commandRequestId: prepared.command_request_id,
        confirmationRef: `ejc1.${"b".repeat(43)}`,
      },
    })).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_reuse_conflict",
    });

    test.clock.ms += 1_001;
    await test.ledger.consumeExact({
      workspace_id: authority.workspace_id,
      participant_ref: authority.participant_ref,
      command_request_id: prepared.command_request_id,
      confirmation_ref_hash: test.confirmationHash(prepared.confirmation_ref),
      consumed_at: new Date(test.clock.ms).toISOString(),
    });
    await expect(test.owner.verifyHistoricalConfirmation({
      workspace_id: authority.workspace_id,
      command: {
        commandRequestId: prepared.command_request_id,
        confirmationRef: prepared.confirmation_ref,
      },
    })).resolves.toEqual({
      status: "resolved",
      command_request_id: prepared.command_request_id,
      effect: "start_enrollment_inquiry",
    });
  });

  it("does not admit a non-inquiry prepared command to Run settlement", async () => {
    const test = harness();
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");

    await expect(test.owner.verifyHistoricalConfirmation({
      workspace_id: authority.workspace_id,
      command: {
        commandRequestId: prepared.command_request_id,
        confirmationRef: prepared.confirmation_ref,
      },
    })).resolves.toEqual({
      status: "denied",
      reason_code: "workflow_run_settlement_command_not_supported",
    });
  });

  it("fails closed when the stored snapshot no longer matches the row", async () => {
    const test = harness();
    const prepared = await test.owner.prepare(prepareInput());
    if (prepared.status !== "ready_to_confirm") throw new Error("prepare failed");
    test.ledger.mutate((record) => ({
      ...record,
      frozen_snapshot_ciphertext: `${record.frozen_snapshot_ciphertext.slice(0, -2)}xy`,
    }));
    await expect(test.owner.verifyConfirmed(verifyInput(prepared))).resolves.toEqual({
      status: "unavailable",
      reason_code: "prepared_command_snapshot_drift",
    });
  });

  it("derives a deterministic direct context and rejects ledgered intents", async () => {
    const test = harness();
    const request = {
      clientCommandId: "client-direct-1",
      request: {
        capabilityKey: "record_or_skip_visit" as const,
        capabilityVersion: "1.0.0" as const,
        targetOptionRef: "option-journey-1",
        operationInput: { disposition: "recorded" as const },
      },
    };
    const first = await test.owner.deriveDirectContext(directInput(request));
    const second = await test.owner.deriveDirectContext(directInput(request));
    expect(first.status).toBe("resolved");
    expect(first).toEqual(second);
    if (first.status === "resolved") {
      expect(first.confirmation_ref).toBe(`ejd1.${first.command_request_id}`);
      expect(/^[0-9a-f]{64}$/u.test(first.command_request_id)).toBe(true);
    }

    await expect(test.owner.deriveDirectContext(directInput({
      clientCommandId: "client-direct-2",
      request: {
        capabilityKey: "close_inquiry",
        capabilityVersion: "1.0.0",
        targetOptionRef: "option-journey-1",
        operationInput: { reasonKey: "family_declined" },
      },
    } as never))).resolves.toEqual({
      status: "denied",
      reason_code: "direct_command_intent_invalid",
    });
    expect(test.ledger.size()).toBe(0);
  });
});

function harness(options: { ttlMs?: number } = {}) {
  const ledger = createInMemoryLedger();
  const clock = { ms: START };
  let sequence = 0;
  const crypto = new NurtureEnrollmentJourneyPreparedCommandCrypto(
    INTEGRITY_KEY,
    ENCRYPTION_KEY,
  );
  const owner = new NurtureEnrollmentJourneyPreparedCommandOwner({
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
    protection: crypto,
    now: () => new Date(clock.ms),
    createCommandRequestId: () => `command-request-${++sequence}`,
    ...(options.ttlMs === undefined ? {} : { ttlMs: options.ttlMs }),
  });
  return {
    clock,
    ledger,
    owner,
    confirmationHash: (confirmationRef: string) =>
      crypto.tag({ purpose: "confirmation-ref", values: [confirmationRef] }),
  };
}

function prepareInput(overrides: Partial<Parameters<
  NurtureEnrollmentJourneyPreparedCommandOwner["prepare"]
>[0]> = {}) {
  return {
    principal,
    invocation_request_id: "invocation-1",
    client_surface: "web_run_workbench" as const,
    authority,
    command: intentCommand("close_inquiry", { reasonKey: "family_declined" }),
    ...overrides,
  };
}

function intentCommand(
  capabilityKey: string,
  operationInput: Record<string, unknown>,
): NurtureEnrollmentJourneyPreparedCommandDraftV1 {
  return {
    contractVersion: 1 as const,
    clientCommandId: "client-command-1",
    request: {
      capabilityKey,
      capabilityVersion: "1.0.0" as const,
      targetOptionRef: "option-journey-1",
      operationInput,
    },
  } as NurtureEnrollmentJourneyPreparedCommandDraftV1;
}

function verifyInput(prepared: { command_request_id: string; confirmation_ref: string }) {
  return {
    principal,
    invocation_request_id: "invocation-2",
    client_surface: "web_run_workbench" as const,
    command: {
      commandRequestId: prepared.command_request_id,
      confirmationRef: prepared.confirmation_ref,
    },
  };
}

function directInput(command: Parameters<
  NurtureEnrollmentJourneyPreparedCommandOwner["deriveDirectContext"]
>[0]["command"]) {
  return {
    principal,
    invocation_request_id: "invocation-3",
    client_surface: "web_run_workbench" as const,
    command,
  };
}

function createInMemoryLedger(): NurtureEnrollmentJourneyPreparedCommandLedgerV1 & {
  size(): number;
  only(): NurtureEnrollmentJourneyPreparedCommandRecordV1;
  mutate(change: (
    record: NurtureEnrollmentJourneyPreparedCommandRecordV1,
  ) => NurtureEnrollmentJourneyPreparedCommandRecordV1): void;
} {
  const byDedup = new Map<string, NurtureEnrollmentJourneyPreparedCommandRecordV1>();
  const dedupKey = (record: NurtureEnrollmentJourneyPreparedCommandRecordV1) => [
    record.workspace_id,
    record.participant_ref,
    record.client_surface,
    record.client_command_id_hash,
  ].join("\0");
  const findByCommandRequestId = (workspaceId: string, commandRequestId: string) =>
    [...byDedup.entries()].find(([, record]) =>
      record.workspace_id === workspaceId
      && record.command_request_id === commandRequestId);
  return {
    async getOrCreate(candidate) {
      const key = dedupKey(candidate);
      const existing = byDedup.get(key);
      if (existing) return { status: "existing", record: structuredClone(existing) };
      byDedup.set(key, structuredClone(candidate));
      return { status: "created", record: structuredClone(candidate) };
    },
    async readExact(input) {
      const entry = findByCommandRequestId(input.workspace_id, input.command_request_id);
      if (!entry || entry[1].participant_ref !== input.participant_ref) {
        return { status: "not_found" };
      }
      return { status: "found", record: structuredClone(entry[1]) };
    },
    async readHistoricalExact(input) {
      const entry = findByCommandRequestId(input.workspace_id, input.command_request_id);
      return entry
        ? { status: "found", record: structuredClone(entry[1]) }
        : { status: "not_found" };
    },
    async consumeExact(input) {
      const entry = findByCommandRequestId(input.workspace_id, input.command_request_id);
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
      const records = [...byDedup.values()];
      if (records.length !== 1) throw new Error("expected exactly one record");
      return structuredClone(records[0] as NurtureEnrollmentJourneyPreparedCommandRecordV1);
    },
    mutate: (change) => {
      const entry = [...byDedup.entries()][0];
      if (!entry) throw new Error("expected one record to mutate");
      byDedup.set(entry[0], change(structuredClone(entry[1])));
    },
  };
}

function inquiryInput() {
  return {
    preferredLabel: "Prospective family",
    birthYearMonth: "2024-03",
    ageBandKey: undefined,
    expectedEntryStartDate: "2026-09-01",
    expectedEntryEndDate: "2026-10-01",
    targetClassTypeKey: "toddler",
    targetAgeBandKey: "age_2_3",
    targetCareGroupOptionRef: undefined,
    careScheduleNeedKeys: ["full_day"],
    sourceChannel: "walk_in",
    safetyLabelKeys: [],
    initialContactAt: "2026-08-12T00:00:00.000Z",
    nextTouchpointAt: "2026-08-13T00:00:00.000Z",
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
