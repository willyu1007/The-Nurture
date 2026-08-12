import { createHash } from "node:crypto";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  canonicalJsonV1,
  hashCommandRequestId,
  NurtureDeterministicRollback,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;

export const NURTURE_WORKFLOW_RUN_SETTLEMENT_COMMAND_KEY =
  "nurture.start_enrollment_inquiry" as const;

export type NurtureWorkflowRunSettlementState =
  | "prepared"
  | "committed"
  | "confirmed_no_effect";

/**
 * Exact Host evidence admitted by the private signed invocation. It contains
 * only Host-owned opaque identity and hashes; Scenario business facts are not
 * part of the cross-database settlement protocol.
 */
export type NurtureWorkflowRunReservationEvidenceV1 = Readonly<{
  evidence_version: 1;
  logical_operation_id: string;
  reservation_ref: CanonicalRef;
  run_ref: CanonicalRef;
  binding_fingerprint_sha256: string;
  reservation_evidence_sha256: string;
}>;

export type NurtureWorkflowRunSettlementBindingV1 = Readonly<{
  workspace_id: string;
  logical_operation_id_hash: string;
  reservation_ref_hash: string;
  reservation_evidence_sha256: string;
  run_object_id: string;
  binding_fingerprint_sha256: string;
  command_request_id_hash: string;
  command_key: typeof NURTURE_WORKFLOW_RUN_SETTLEMENT_COMMAND_KEY;
}>;

export type NurtureWorkflowRunSettlementRecordV1 =
  NurtureWorkflowRunSettlementBindingV1 & Readonly<{
    settlement_id: string;
    state: NurtureWorkflowRunSettlementState;
    command_execution_id?: string;
    settlement_receipt_ref?: string;
    settlement_evidence_sha256?: string;
    aggregate_version: number;
    prepared_at: string;
    committed_at?: string;
    confirmed_no_effect_at?: string;
  }>;

export type NurtureWorkflowRunSettlementRepositoryV1 = {
  register(input: NurtureWorkflowRunSettlementBindingV1): Promise<
    | {
        disposition: "created" | "replayed";
        record: NurtureWorkflowRunSettlementRecordV1;
      }
    | { disposition: "conflict" | "busy" }
  >;
  read(input: NurtureWorkflowRunSettlementBindingV1): Promise<
    NurtureWorkflowRunSettlementRecordV1 | null
  >;
  confirmNoEffect(input: NurtureWorkflowRunSettlementBindingV1): Promise<
    | {
        disposition: "settled" | "replayed";
        record: NurtureWorkflowRunSettlementRecordV1;
      }
    | { disposition: "conflict" | "busy" | "not_found" }
  >;
};

/**
 * This port is implemented over the command transaction itself. Calling it
 * after `NurtureCommandExecution` creation makes the business effect,
 * execution receipt and settlement receipt one atomic PostgreSQL commit.
 */
export type NurtureWorkflowRunSettlementTransactionV1 = {
  markCommitted(input: NurtureWorkflowRunSettlementBindingV1 & {
    command_execution_id: string;
  }): Promise<NurtureWorkflowRunSettlementRecordV1>;
};

type SettlementOwnerInput = Readonly<{
  workspace_id: string;
  command_request_id: string;
  host_reservation: NurtureWorkflowRunReservationEvidenceV1;
}>;

export function createNurtureWorkflowRunSettlementOwner(input: {
  repository: NurtureWorkflowRunSettlementRepositoryV1;
}) {
  return Object.freeze({
    async register(request: SettlementOwnerInput) {
      const binding = bindingFrom(request);
      if (!binding) return denied("workflow_run_settlement_request_invalid");
      try {
        const result = await input.repository.register(binding);
        if (!("record" in result)) {
          return result.disposition === "conflict"
            ? denied("workflow_run_settlement_binding_conflict")
            : unavailable();
        }
        if (!validRecord(result.record, binding)) return unavailable();
        return result.record.state === "prepared"
          ? {
              status: "prepared" as const,
              disposition: result.disposition,
              settlement_ref: settlementRef(result.record),
              run_ref: runRef(result.record),
              outcome: "unknown" as const,
            }
          : { ...statusResult(result.record), disposition: result.disposition };
      } catch {
        return unavailable();
      }
    },

    async readStatus(request: SettlementOwnerInput) {
      const binding = bindingFrom(request);
      if (!binding) return denied("workflow_run_settlement_request_invalid");
      try {
        const record = await input.repository.read(binding);
        if (!record || !validRecord(record, binding)) return unavailable();
        return statusResult(record);
      } catch {
        return unavailable();
      }
    },

    async confirmNoEffect(request: SettlementOwnerInput) {
      const binding = bindingFrom(request);
      if (!binding) return denied("workflow_run_settlement_request_invalid");
      try {
        const result = await input.repository.confirmNoEffect(binding);
        if (!("record" in result)) {
          return result.disposition === "conflict"
            ? denied("workflow_run_settlement_binding_conflict")
            : unavailable();
        }
        if (!validRecord(result.record, binding)) return unavailable();
        return statusResult(result.record);
      } catch {
        return unavailable();
      }
    },
  });
}

export type NurtureWorkflowRunSettlementOwnerV1 = ReturnType<
  typeof createNurtureWorkflowRunSettlementOwner
>;

export function workflowRunSettlementBinding(
  input: SettlementOwnerInput,
): NurtureWorkflowRunSettlementBindingV1 | null {
  return bindingFrom(input);
}

/**
 * Adds the settlement commit to the command's existing finalizer without
 * changing the command payload or its canonical hash. Both finalizers run
 * after CommandExecution creation and inside the same owning transaction.
 */
export function withNurtureWorkflowRunSettlementFinalizer<Input>(
  source: NurtureCommandSpec<Input>,
  binding: NurtureWorkflowRunSettlementBindingV1,
): NurtureCommandSpec<Input> {
  return {
    ...source,
    afterExecutionCreated: async (transaction, payload, context, applied) => {
      await source.afterExecutionCreated?.(
        transaction,
        payload,
        context,
        applied,
      );
      const settlement = transaction.workflowRunSettlement;
      if (!settlement) {
        throw new NurtureDeterministicRollback(
          "workflow_run_settlement_transaction_unavailable",
          "technical_error",
        );
      }
      await settlement.markCommitted({
        ...binding,
        command_execution_id: applied.execution.id,
      });
    },
  };
}

function bindingFrom(
  input: SettlementOwnerInput,
): NurtureWorkflowRunSettlementBindingV1 | null {
  const hostReservation = parseNurtureWorkflowRunReservationEvidenceV1(
    input.host_reservation,
  );
  if (
    !OPAQUE_ID.test(input.workspace_id) ||
    !OPAQUE_ID.test(input.command_request_id) ||
    !hostReservation
  ) return null;
  return Object.freeze({
    workspace_id: input.workspace_id,
    logical_operation_id_hash: sha256(
      `nurture.workflow-run-logical-operation.v1\0${input.workspace_id}\0${hostReservation.logical_operation_id}`,
    ),
    reservation_ref_hash: sha256(
      `nurture.workflow-run-reservation-ref.v1\0${canonicalJsonV1(hostReservation.reservation_ref)}`,
    ),
    reservation_evidence_sha256:
      hostReservation.reservation_evidence_sha256,
    run_object_id: hostReservation.run_ref.object_id,
    binding_fingerprint_sha256:
      hostReservation.binding_fingerprint_sha256,
    command_request_id_hash: hashCommandRequestId(
      input.workspace_id,
      input.command_request_id,
    ),
    command_key: NURTURE_WORKFLOW_RUN_SETTLEMENT_COMMAND_KEY,
  });
}

function statusResult(record: NurtureWorkflowRunSettlementRecordV1) {
  if (record.state === "prepared") {
    return {
      status: "prepared" as const,
      settlement_ref: settlementRef(record),
      run_ref: runRef(record),
      outcome: "unknown" as const,
    };
  }
  return {
    status: record.state,
    settlement_ref: settlementRef(record),
    run_ref: runRef(record),
    outcome: record.state,
    proof: {
      proof_version: 1 as const,
      outcome: record.state === "committed" ? "committed" as const : "confirmed_no_effect" as const,
      writer_fence_receipt_ref: record.settlement_receipt_ref as string,
      receipt_sha256: record.settlement_evidence_sha256 as string,
    },
  };
}

function settlementRef(record: NurtureWorkflowRunSettlementRecordV1): CanonicalRef {
  return {
    schema_version: 1,
    namespace: "nurture",
    object_type: "workflow_run_settlement",
    object_id: record.settlement_id,
    version: record.aggregate_version,
  };
}

function runRef(record: NurtureWorkflowRunSettlementRecordV1): CanonicalRef {
  return {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_run",
    object_id: record.run_object_id,
  };
}

export function parseNurtureWorkflowRunReservationEvidenceV1(
  value: unknown,
): NurtureWorkflowRunReservationEvidenceV1 | null {
  if (!isRecord(value) || !exactKeys(value, [
    "binding_fingerprint_sha256",
    "evidence_version",
    "logical_operation_id",
    "reservation_evidence_sha256",
    "reservation_ref",
    "run_ref",
  ]) || value.evidence_version !== 1 ||
    typeof value.logical_operation_id !== "string" ||
    typeof value.binding_fingerprint_sha256 !== "string" ||
    typeof value.reservation_evidence_sha256 !== "string" ||
    !OPAQUE_ID.test(value.logical_operation_id) ||
    !SHA256.test(value.binding_fingerprint_sha256) ||
    !SHA256.test(value.reservation_evidence_sha256) ||
    !exactRef(value.reservation_ref, "workflow_run_reservation", true) ||
    !exactRef(value.run_ref, "workflow_run", false)) return null;
  return Object.freeze({
    evidence_version: 1,
    logical_operation_id: value.logical_operation_id,
    reservation_ref: Object.freeze({ ...value.reservation_ref }),
    run_ref: Object.freeze({ ...value.run_ref }),
    binding_fingerprint_sha256: value.binding_fingerprint_sha256,
    reservation_evidence_sha256: value.reservation_evidence_sha256,
  });
}

function validRecord(
  record: NurtureWorkflowRunSettlementRecordV1,
  binding: NurtureWorkflowRunSettlementBindingV1,
): boolean {
  const bindingMatches = (Object.keys(binding) as Array<keyof typeof binding>)
    .every((key) => record[key] === binding[key]);
  const prepared = record.state === "prepared" &&
    record.command_execution_id === undefined &&
    record.settlement_receipt_ref === undefined &&
    record.settlement_evidence_sha256 === undefined &&
    record.committed_at === undefined &&
    record.confirmed_no_effect_at === undefined;
  const committed = record.state === "committed" &&
    OPAQUE_ID.test(record.command_execution_id ?? "") &&
    OPAQUE_ID.test(record.settlement_receipt_ref ?? "") &&
    SHA256.test(record.settlement_evidence_sha256 ?? "") &&
    canonicalInstant(record.committed_at) &&
    record.confirmed_no_effect_at === undefined;
  const noEffect = record.state === "confirmed_no_effect" &&
    record.command_execution_id === undefined &&
    OPAQUE_ID.test(record.settlement_receipt_ref ?? "") &&
    SHA256.test(record.settlement_evidence_sha256 ?? "") &&
    record.committed_at === undefined &&
    canonicalInstant(record.confirmed_no_effect_at);
  return bindingMatches && OPAQUE_ID.test(record.settlement_id) &&
    Number.isSafeInteger(record.aggregate_version) && record.aggregate_version >= 1 &&
    canonicalInstant(record.prepared_at) && (prepared || committed || noEffect);
}

function exactRef(
  value: unknown,
  objectType: string,
  versioned: boolean,
): value is CanonicalRef {
  if (!isRecord(value)) return false;
  const keys = versioned
    ? ["namespace", "object_id", "object_type", "schema_version", "version"]
    : ["namespace", "object_id", "object_type", "schema_version"];
  return exactKeys(value, keys) && value.schema_version === 1 &&
    value.namespace === "my_chat" && value.object_type === objectType &&
    typeof value.object_id === "string" && OPAQUE_ID.test(value.object_id) &&
    (!versioned || (Number.isSafeInteger(value.version) && (value.version as number) >= 1));
}

function canonicalInstant(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

const denied = (reason_code: string) => ({ status: "denied" as const, reason_code });
const unavailable = () => ({
  status: "unavailable" as const,
  reason_code: "workflow_run_settlement_owner_unavailable",
});
