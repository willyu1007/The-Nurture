import { createHash } from "node:crypto";
import type { CanonicalRef, DomainContextRef } from "@my-chat/workflow-contracts";
import type { NurtureWorkflowProject } from "../../repositories.js";
import type { NurtureFamilyCareCommandTransaction } from "../institution/family-care-transaction.js";

export const NURTURE_COMMAND_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const HASH_HEX_PATTERN = /^[0-9a-f]{64}$/;
const MAX_OUTPUT_REFS = 32;

export type NurtureCommandBusinessOutcome = "applied" | "already_satisfied";
export type NurtureCommandResponseDisposition = "executed" | "replayed";

export type NurtureCommandExecutionRecord = {
  id: string;
  workspace_id: string;
  command_request_id_hash: string;
  origin_invocation_request_id_hash: string;
  parent_command_request_id_hash?: string;
  request_identity_hash_version: 1;
  command_key: string;
  command_scope: string;
  command_contract_version: number;
  payload_hash: string;
  payload_canonicalization_version: 1;
  business_actor_ref: string;
  primary_scope_ref?: DomainContextRef;
  child_care_process_id?: string;
  target_refs: DomainContextRef[];
  business_outcome: NurtureCommandBusinessOutcome;
  output_refs: DomainContextRef[];
  handoff_snapshot_schema_version: 1;
  handoff_request_snapshots_payload: [];
  committed_at: string;
};

export type NurtureCommandExecutionDraft = Omit<NurtureCommandExecutionRecord, "id" | "committed_at">;

export type NurtureCommandTransaction = {
  /** Present when the N1 institution command adapter is wired. */
  familyCare?: NurtureFamilyCareCommandTransaction;
  findCommitted(input: {
    workspace_id: string;
    command_request_id_hash: string;
  }): Promise<NurtureCommandExecutionRecord | null>;
  createExecution(input: NurtureCommandExecutionDraft): Promise<NurtureCommandExecutionRecord>;
  getWorkflowProjectById(input: {
    workspace_id: string;
    project_id: string;
  }): Promise<NurtureWorkflowProject | null>;
  updateWorkflowProjectStrategy(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    goal_payload: unknown;
    constraint_payload: unknown;
  }): Promise<NurtureWorkflowProject>;
  appendEvidenceRef(input: {
    workspace_id: string;
    target_ref: CanonicalRef;
    evidence_ref: CanonicalRef;
    reason_code: string;
  }): Promise<void>;
};

export type NurtureCommandRepository = {
  findCommitted(input: {
    workspace_id: string;
    command_request_id_hash: string;
  }): Promise<NurtureCommandExecutionRecord | null>;
  executeLocked<T>(input: {
    workspace_id: string;
    command_request_id_hash: string;
    operation: (transaction: NurtureCommandTransaction) => Promise<T>;
  }): Promise<{ acquired: true; value: T } | { acquired: false }>;
};

export type NurtureCommandPreconditionDecision =
  | { status: "ready" }
  | { status: "already_satisfied"; output_refs: DomainContextRef[] }
  | { status: "invalid" | "blocked" | "conflict"; reason_code: string };

export type NurtureCommandExecutionContext = {
  workspace_id: string;
  business_actor_ref: string;
  child_care_process_id?: string;
};

export type NurtureCommandSpec<Input> = {
  command_key: string;
  command_scope: string;
  contract_version: number;
  canonicalize(input: Input): unknown;
  checkPreconditions(
    transaction: NurtureCommandTransaction,
    input: Input,
    context: NurtureCommandExecutionContext,
  ): Promise<NurtureCommandPreconditionDecision>;
  apply(
    transaction: NurtureCommandTransaction,
    input: Input,
    context: NurtureCommandExecutionContext,
  ): Promise<{ output_refs: DomainContextRef[] }>;
};

export type NurtureCommandInput<Input> = {
  workspace_id: string;
  invocation_request_id: string;
  command_request_id: string;
  origin_invocation_request_id?: string;
  parent_command_request_id?: string;
  business_actor_ref: string;
  primary_scope_ref?: DomainContextRef;
  child_care_process_id?: string;
  target_refs?: DomainContextRef[];
  expected_versions?: Record<string, number>;
  payload: Input;
  spec: NurtureCommandSpec<Input>;
};

export type NurtureCommandSuccess = {
  status: "ok";
  disposition: NurtureCommandResponseDisposition;
  business_outcome: NurtureCommandBusinessOutcome;
  execution_ref: DomainContextRef;
  output_refs: DomainContextRef[];
  handoff_request_snapshots: [];
};

export type NurtureCommandNotCommitted = {
  status: "not_committed";
  decision:
    | "invalid"
    | "blocked"
    | "conflict"
    | "idempotency_conflict"
    | "command_busy"
    | "technical_error";
  reason_code: string;
};

export type NurtureCommandResult = NurtureCommandSuccess | NurtureCommandNotCommitted;

const sha256 = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

export const hashCommandRequestId = (workspaceId: string, requestId: string): string =>
  sha256(`nurture.command-request.v1\0${workspaceId}\0${requestId}`);

export const hashInvocationRequestId = (workspaceId: string, requestId: string): string =>
  sha256(`nurture.invocation-request.v1\0${workspaceId}\0${requestId}`);

const canonicalValue = (value: unknown, path: string): unknown => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`non-finite number at ${path}`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((entry, index) => canonicalValue(entry, `${path}[${index}]`));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (record[key] !== undefined) output[key] = canonicalValue(record[key], `${path}.${key}`);
    }
    return output;
  }
  throw new Error(`unsupported canonical value at ${path}`);
};

export const canonicalJsonV1 = (value: unknown): string => JSON.stringify(canonicalValue(value, "$"));

export const hashCommandPayload = (value: unknown): string =>
  sha256(`nurture.command-payload.v1\0${canonicalJsonV1(value)}`);

const executionRef = (record: NurtureCommandExecutionRecord): DomainContextRef => ({
  namespace: "nurture",
  consumer_scenario_key: "nurture",
  object_type: "command_execution",
  object_id: record.id,
  version: 1,
  owner_scope: "workspace",
});

const isBodylessRef = (ref: DomainContextRef): boolean =>
  typeof ref.namespace === "string" &&
  ref.namespace.length > 0 &&
  typeof ref.object_type === "string" &&
  ref.object_type.length > 0 &&
  typeof ref.object_id === "string" &&
  ref.object_id.length > 0;

const validateRefs = (refs: DomainContextRef[], label: string): void => {
  if (refs.length > MAX_OUTPUT_REFS) throw new Error(`${label} exceeds ${MAX_OUTPUT_REFS}`);
  if (!refs.every(isBodylessRef)) throw new Error(`${label} contains an invalid ref`);
};

const compareReplay = (input: {
  existing: NurtureCommandExecutionRecord;
  command_key: string;
  command_scope: string;
  command_contract_version: number;
  payload_hash: string;
}): NurtureCommandSuccess | NurtureCommandNotCommitted => {
  const exact =
    input.existing.command_key === input.command_key &&
    input.existing.command_scope === input.command_scope &&
    input.existing.command_contract_version === input.command_contract_version &&
    input.existing.payload_hash === input.payload_hash;
  if (!exact) {
    return {
      status: "not_committed",
      decision: "idempotency_conflict",
      reason_code: "command_request_payload_mismatch",
    };
  }
  return {
    status: "ok",
    disposition: "replayed",
    business_outcome: input.existing.business_outcome,
    execution_ref: executionRef(input.existing),
    output_refs: input.existing.output_refs,
    handoff_request_snapshots: [],
  };
};

export class NurtureCommandRunner {
  constructor(private readonly repository: NurtureCommandRepository) {}

  async execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult> {
    for (const [label, requestId] of [
      ["invocationRequestId", input.invocation_request_id],
      ["commandRequestId", input.command_request_id],
      ["originInvocationRequestId", input.origin_invocation_request_id ?? input.invocation_request_id],
      ...(input.parent_command_request_id
        ? ([["parentCommandRequestId", input.parent_command_request_id]] as const)
        : []),
    ] as const) {
      if (!NURTURE_COMMAND_ID_PATTERN.test(requestId)) {
        return { status: "not_committed", decision: "invalid", reason_code: `invalid_${label}` };
      }
    }
    if (!input.workspace_id || !input.business_actor_ref || input.spec.contract_version < 1) {
      return { status: "not_committed", decision: "invalid", reason_code: "invalid_command_envelope" };
    }
    if (
      input.payload &&
      typeof input.payload === "object" &&
      "workspace_id" in input.payload &&
      (input.payload as { workspace_id?: unknown }).workspace_id !== input.workspace_id
    ) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "invalid_command_workspace",
      };
    }
    if (
      input.payload &&
      typeof input.payload === "object" &&
      "child_care_process_id" in input.payload &&
      input.child_care_process_id !== undefined &&
      (input.payload as { child_care_process_id?: unknown }).child_care_process_id !==
        input.child_care_process_id
    ) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "invalid_command_scope",
      };
    }

    const commandRequestIdHash = hashCommandRequestId(input.workspace_id, input.command_request_id);
    const originInvocationRequestIdHash = hashInvocationRequestId(
      input.workspace_id,
      input.origin_invocation_request_id ?? input.invocation_request_id,
    );
    const parentCommandRequestIdHash = input.parent_command_request_id
      ? hashCommandRequestId(input.workspace_id, input.parent_command_request_id)
      : undefined;
    const targetRefs = input.target_refs ?? [];
    try {
      validateRefs(targetRefs, "target_refs");
    } catch {
      return { status: "not_committed", decision: "invalid", reason_code: "invalid_target_refs" };
    }

    let payloadHash: string;
    try {
      payloadHash = hashCommandPayload({
        command_key: input.spec.command_key,
        command_scope: input.spec.command_scope,
        command_contract_version: input.spec.contract_version,
        business_actor_ref: input.business_actor_ref,
        primary_scope_ref: input.primary_scope_ref ?? null,
        child_care_process_id: input.child_care_process_id ?? null,
        target_refs: targetRefs,
        expected_versions: input.expected_versions ?? {},
        payload: input.spec.canonicalize(input.payload),
      });
    } catch {
      return { status: "not_committed", decision: "invalid", reason_code: "invalid_command_payload" };
    }

    const replayInput = {
      command_key: input.spec.command_key,
      command_scope: input.spec.command_scope,
      command_contract_version: input.spec.contract_version,
      payload_hash: payloadHash,
    };
    let existing: NurtureCommandExecutionRecord | null;
    try {
      existing = await this.repository.findCommitted({
        workspace_id: input.workspace_id,
        command_request_id_hash: commandRequestIdHash,
      });
    } catch {
      return {
        status: "not_committed",
        decision: "technical_error",
        reason_code: "command_lookup_failed",
      };
    }
    if (existing) return compareReplay({ existing, ...replayInput });

    let locked: { acquired: true; value: NurtureCommandResult } | { acquired: false };
    try {
      locked = await this.repository.executeLocked({
        workspace_id: input.workspace_id,
        command_request_id_hash: commandRequestIdHash,
        operation: async (transaction) => {
        const winner = await transaction.findCommitted({
          workspace_id: input.workspace_id,
          command_request_id_hash: commandRequestIdHash,
        });
        if (winner) return compareReplay({ existing: winner, ...replayInput });

        const executionContext: NurtureCommandExecutionContext = {
          workspace_id: input.workspace_id,
          business_actor_ref: input.business_actor_ref,
          ...(input.child_care_process_id
            ? { child_care_process_id: input.child_care_process_id }
            : {}),
        };
        const decision = await input.spec.checkPreconditions(
          transaction,
          input.payload,
          executionContext,
        );
        if (decision.status === "invalid" || decision.status === "blocked" || decision.status === "conflict") {
          return {
            status: "not_committed" as const,
            decision: decision.status,
            reason_code: decision.reason_code,
          };
        }

        const applied =
          decision.status === "already_satisfied"
            ? { business_outcome: "already_satisfied" as const, output_refs: decision.output_refs }
            : {
                business_outcome: "applied" as const,
                ...(await input.spec.apply(transaction, input.payload, executionContext)),
              };
        validateRefs(applied.output_refs, "output_refs");
        const record = await transaction.createExecution({
          workspace_id: input.workspace_id,
          command_request_id_hash: commandRequestIdHash,
          origin_invocation_request_id_hash: originInvocationRequestIdHash,
          ...(parentCommandRequestIdHash
            ? { parent_command_request_id_hash: parentCommandRequestIdHash }
            : {}),
          request_identity_hash_version: 1,
          command_key: input.spec.command_key,
          command_scope: input.spec.command_scope,
          command_contract_version: input.spec.contract_version,
          payload_hash: payloadHash,
          payload_canonicalization_version: 1,
          business_actor_ref: input.business_actor_ref,
          ...(input.primary_scope_ref ? { primary_scope_ref: input.primary_scope_ref } : {}),
          ...(input.child_care_process_id
            ? { child_care_process_id: input.child_care_process_id }
            : {}),
          target_refs: targetRefs,
          business_outcome: applied.business_outcome,
          output_refs: applied.output_refs,
          handoff_snapshot_schema_version: 1,
          handoff_request_snapshots_payload: [],
        });
        return {
          status: "ok" as const,
          disposition: "executed" as const,
          business_outcome: record.business_outcome,
          execution_ref: executionRef(record),
          output_refs: record.output_refs,
          handoff_request_snapshots: [] as [],
        };
        },
      });
    } catch {
      return {
        status: "not_committed",
        decision: "technical_error",
        reason_code: "command_execution_failed",
      };
    }
    if (!locked.acquired) {
      return { status: "not_committed", decision: "command_busy", reason_code: "command_busy" };
    }
    return locked.value;
  }
}

export const assertCommandExecutionRecord = (record: NurtureCommandExecutionRecord): void => {
  for (const hash of [
    record.command_request_id_hash,
    record.origin_invocation_request_id_hash,
    record.parent_command_request_id_hash,
    record.payload_hash,
  ]) {
    if (hash !== undefined && !HASH_HEX_PATTERN.test(hash)) throw new Error("invalid execution hash");
  }
  if (record.handoff_request_snapshots_payload.length !== 0) {
    throw new Error("N1 command execution must persist explicit empty snapshots");
  }
  validateRefs(record.output_refs, "output_refs");
};
