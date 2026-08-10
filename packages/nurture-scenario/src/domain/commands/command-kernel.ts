import { createHash } from "node:crypto";
import type {
  CanonicalRef,
  ScenarioHandoffRequestSnapshot,
} from "@my-chat/workflow-contracts";
import type { NurtureWorkflowProject } from "../../repositories.js";
import type { NurtureBoardMutationTransaction } from "../institution/board-mutation-transaction.js";
import type { NurturePublishProcessTransaction } from "../institution/publish-process-transaction.js";
import type { NurtureMediaAttributionTransaction } from "../institution/media-attribution-transaction.js";
import type { NurturePublicationSafetyTransaction } from "../institution/publication-safety-transaction.js";
import type { NurtureFamilyCareCommandTransaction } from "../institution/family-care-transaction.js";
import type { NurtureCareCaptureTransaction } from "../institution/care-capture-transaction.js";
import type { NurtureAttendanceCommandTransaction } from "../institution/attendance-closeout.js";
import type { NurtureContentRevisionTransaction } from "../institution/content-revision.js";
import type { NurtureAttributionCorrectionCandidateTransaction } from "../institution/attribution-correction-candidate.js";
import type { NurtureEnrollmentJourneyTransaction } from "../institution/enrollment-journey-command.js";
import type { NurtureEnrollmentWaitlistTransaction } from "../institution/enrollment-waitlist.js";
import type { NurtureEnrollmentTrialLifecycleTransaction } from "../institution/enrollment-trial-lifecycle.js";
import type { NurtureEnrollmentFormalizationTransaction } from "../institution/enrollment-formalization.js";
import type { NurtureInstitutionKnowledgeTransaction } from "../institution/institution-knowledge-commands.js";
import type { NurtureInteractionContextTransactionPort } from "../interactions/interaction-context.js";
import {
  buildNurtureHandoffRequestSnapshots,
  normalizeExecutionHandoffState,
  prepareNurtureHandoffActivation,
  sameHandoffActivationSnapshot,
  sameHandoffDriverRef,
  type NurtureCommandHandoffActivation,
  type NurtureCommandHandoffPolicy,
  type PreparedNurtureHandoffActivation,
} from "./handoff-replay.js";

type DomainContextRef = CanonicalRef;

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
  handoff_request_snapshots_payload: ScenarioHandoffRequestSnapshot[];
  handoff_driver_ref?: DomainContextRef;
  /** Frozen immutable committed result (10-g2-schema-freeze.md D7). */
  result_schema_version?: number;
  committed_result_payload?: unknown;
  committed_at: string;
};

export type NurtureCommandExecutionDraft = Omit<NurtureCommandExecutionRecord, "id" | "committed_at">;

export type NurtureCommandTransaction = {
  /** Present when the N1 institution command adapter is wired. */
  familyCare?: NurtureFamilyCareCommandTransaction;
  /** Present when the G3-A canonical board-mutation owner adapter is wired. */
  boardMutations?: NurtureBoardMutationTransaction;
  /** Present when the T-006 publish-process owner write adapter is wired. */
  publishProcess?: NurturePublishProcessTransaction;
  /** Present when the G3-C1 child-media attribution owner write adapter is wired. */
  mediaAttribution?: NurtureMediaAttributionTransaction;
  /** Present when the G3-D post-release safety owner write adapter is wired. */
  publicationSafety?: NurturePublicationSafetyTransaction;
  /** Present when the G3-B1 organize-cut owner write adapter is wired. */
  careCapture?: NurtureCareCaptureTransaction;
  /** Present when the G4-B attendance closeout owner write adapter is wired. */
  attendance?: NurtureAttendanceCommandTransaction;
  /** Present when the G4-C append-only content revision owner is wired. */
  contentRevisions?: NurtureContentRevisionTransaction;
  /** Present when the G4-C 0D-4 non-canonical correction owner is wired. */
  attributionCorrections?: NurtureAttributionCorrectionCandidateTransaction;
  /** Present when the G4-D Enrollment Journey private owner is wired. */
  enrollmentJourney?: NurtureEnrollmentJourneyTransaction;
  /** Present when the G4-D exact-class waitlist/preparation owner is wired. */
  enrollmentWaitlist?: NurtureEnrollmentWaitlistTransaction;
  /** Present when the G4-D trial Enrollment/Grant lifecycle owner is wired. */
  enrollmentTrialLifecycle?: NurtureEnrollmentTrialLifecycleTransaction;
  /** Present when the G4-D formal proposal completion owner is wired. */
  enrollmentFormalization?: NurtureEnrollmentFormalizationTransaction;
  /** Present when the G4-E Institution Knowledge lifecycle owner is wired. */
  institutionKnowledge?: NurtureInstitutionKnowledgeTransaction;
  /** Present when the G2 Harness confirmation consumer is wired. */
  interactionContexts?: NurtureInteractionContextTransactionPort;
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
  /**
   * Maps infrastructure errors that prove the transaction rolled back (for
   * example a PostgreSQL serialization abort) without leaking driver-specific
   * codes into the scenario command kernel.
   */
  classifyRollback?(error: unknown): {
    decision: NurtureDeterministicRollbackDecision;
    reason_code: string;
  } | null;
};

export type NurtureCommandPreconditionDecision =
  | { status: "ready" }
  | {
      status: "already_satisfied";
      output_refs: DomainContextRef[];
      result_schema_version?: number;
      committed_result?: unknown;
    }
  | { status: "invalid" | "blocked" | "conflict"; reason_code: string };

export type NurtureCommandExecutionContext = {
  workspace_id: string;
  business_actor_ref: string;
  child_care_process_id?: string;
  /**
   * The stable business command identity this execution runs under. Owner
   * writes that carry their own row-level idempotency key need it, and the
   * runner already holds it — deriving it a second time from the payload would
   * be a second source of the same identity.
   */
  command_request_id: string;
};

export type NurtureCommandApplyResult = {
  output_refs: DomainContextRef[];
  /**
   * Body-free typed result persisted with the execution so an exact replay
   * returns the original business outcome rather than recomputing it.
   */
  result_schema_version?: number;
  committed_result?: unknown;
  /**
   * Transaction-local data for a narrow post-execution finalizer. It is never
   * persisted in CommandExecution and must not contain protected content.
   */
  finalization_payload?: unknown;
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
  ): Promise<NurtureCommandApplyResult>;
  /**
   * Runs after CommandExecution exists but before the owning transaction can
   * commit. This supports facts whose FK must point at the immutable execution
   * (for example a completed redaction cascade audit) without weakening the
   * all-or-nothing command transaction.
   */
  afterExecutionCreated?(
    transaction: NurtureCommandTransaction,
    input: Input,
    context: NurtureCommandExecutionContext,
    applied: NurtureCommandApplyResult & {
      business_outcome: NurtureCommandBusinessOutcome;
      execution: NurtureCommandExecutionRecord;
    },
  ): Promise<void>;
  handoff?: NurtureCommandHandoffPolicy<Input>;
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
  handoff_activation?: NurtureCommandHandoffActivation;
  payload: Input;
  spec: NurtureCommandSpec<Input>;
};

export type NurtureCommandSuccess = {
  status: "ok";
  disposition: NurtureCommandResponseDisposition;
  business_outcome: NurtureCommandBusinessOutcome;
  execution_ref: DomainContextRef;
  output_refs: DomainContextRef[];
  handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
  /** Replay-stable typed result; absent for capabilities that publish none. */
  committed_result?: unknown;
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

/**
 * A transaction that failed indeterminately (for example a lost connection
 * after PostgreSQL committed) must not be reported as definitely
 * not-committed: the caller has to reconcile with the same command identity
 * rather than substitute a new one (01-plan / 02-architecture).
 */
export type NurtureCommandOutcomeUnknown = {
  status: "outcome_unknown";
  reason_code: string;
};

export type NurtureCommandResult =
  | NurtureCommandSuccess
  | NurtureCommandNotCommitted
  | NurtureCommandOutcomeUnknown;

/**
 * Retry only with the same command identity. Business conflicts remain
 * terminal; the repository's explicit write-conflict classification denotes
 * a transaction that certainly rolled back and is safe to retry.
 */
export const isNurtureCommandRetryable = (
  result: NurtureCommandResult,
): boolean =>
  result.status === "outcome_unknown" ||
  (result.status === "not_committed" &&
    (result.decision === "command_busy" ||
      result.decision === "technical_error" ||
      (result.decision === "conflict" &&
        result.reason_code === "command_write_conflict")));

export type NurtureDeterministicRollbackDecision = Extract<
  NurtureCommandNotCommitted["decision"],
  "invalid" | "blocked" | "conflict" | "technical_error"
>;

/**
 * A failure that is known to have rolled back: a guard inside the operation,
 * or a write conflict the driver reports as a rollback. It is thrown so the
 * transaction still aborts, and the runner maps it to a definite
 * not-committed instead of the honest-but-useless outcome_unknown.
 */
export class NurtureDeterministicRollback extends Error {
  constructor(
    readonly reason_code: string,
    readonly decision: NurtureDeterministicRollbackDecision = "technical_error",
  ) {
    super(`nurture deterministic rollback: ${reason_code}`);
    this.name = "NurtureDeterministicRollback";
  }
}

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
  schema_version: 1,
  namespace: "nurture",
  object_type: "command_execution",
  object_id: record.id,
  version: 1,
});

const isBodylessRef = (ref: DomainContextRef): boolean =>
  ref.schema_version === 1 &&
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
  activation?: PreparedNurtureHandoffActivation<unknown>;
}): NurtureCommandSuccess | NurtureCommandNotCommitted => {
  let handoffState: ReturnType<typeof normalizeExecutionHandoffState>;
  try {
    handoffState = normalizeExecutionHandoffState({
      snapshots: input.existing.handoff_request_snapshots_payload,
      driver_ref: input.existing.handoff_driver_ref,
    });
  } catch {
    return {
      status: "not_committed",
      decision: "technical_error",
      reason_code: "invalid_stored_handoff_replay_seed",
    };
  }
  if (handoffState.snapshots.length > 0) {
    if (!input.activation) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "missing_durable_handoff_driver",
      };
    }
    if (!sameHandoffDriverRef(handoffState.driver_ref, input.activation.driver_ref)) {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: "invalid_durable_handoff_driver",
      };
    }
  }
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
  if (
    input.activation &&
    handoffState.snapshots.length > 0 &&
    !sameHandoffActivationSnapshot(handoffState.snapshots, input.activation)
  ) {
    return {
      status: "not_committed",
      decision: "technical_error",
      reason_code: "invalid_stored_handoff_replay_seed",
    };
  }
  return {
    status: "ok",
    disposition: "replayed",
    business_outcome: input.existing.business_outcome,
    execution_ref: executionRef(input.existing),
    output_refs: input.existing.output_refs,
    handoff_request_snapshots: handoffState.snapshots,
    ...(input.existing.committed_result_payload !== undefined
      ? { committed_result: input.existing.committed_result_payload }
      : {}),
  };
};

export class NurtureCommandRunner {
  constructor(private readonly repository: NurtureCommandRepository) {}

  private deterministicRollback(
    error: unknown,
    fallbackReasonCode: string,
  ): NurtureDeterministicRollback {
    if (error instanceof NurtureDeterministicRollback) return error;
    const classified = this.repository.classifyRollback?.(error);
    return classified
      ? new NurtureDeterministicRollback(classified.reason_code, classified.decision)
      : new NurtureDeterministicRollback(fallbackReasonCode);
  }

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

    const activationDecision = prepareNurtureHandoffActivation({
      activation: input.handoff_activation,
      policy: input.spec.handoff,
      command_input: input.payload,
    });
    if (activationDecision.status === "invalid") {
      return {
        status: "not_committed",
        decision: "invalid",
        reason_code: activationDecision.reason_code,
      };
    }
    const activation =
      activationDecision.status === "ready" ? activationDecision.activation : undefined;
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
        handoff_activation: activation
          ? {
              request_id: activation.request_id,
              handoff_key: activation.policy.handoff_key,
              requested_purpose: activation.policy.requested_purpose,
              expires_at: activation.expires_at ?? null,
            }
          : null,
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
      ...(activation ? { activation: activation as PreparedNurtureHandoffActivation<unknown> } : {}),
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
            command_request_id: input.command_request_id,
            ...(input.child_care_process_id
              ? { child_care_process_id: input.child_care_process_id }
              : {}),
          };
          const decision = await input.spec.checkPreconditions(
            transaction,
            input.payload,
            executionContext,
          );
          if (
            decision.status === "invalid" ||
            decision.status === "blocked" ||
            decision.status === "conflict"
          ) {
            return {
              status: "not_committed" as const,
              decision: decision.status,
              reason_code: decision.reason_code,
            };
          }

          let applied;
          try {
            applied =
            decision.status === "already_satisfied"
              ? {
                  business_outcome: "already_satisfied" as const,
                  output_refs: decision.output_refs,
                  result_schema_version: decision.result_schema_version,
                  committed_result: decision.committed_result,
                }
              : {
                  business_outcome: "applied" as const,
                  ...(await input.spec.apply(transaction, input.payload, executionContext)),
                };
            // Inside the try on purpose: a spec emitting out-of-contract refs
            // is a deterministic defect and the transaction definitely rolls
            // back — reported as certain, never as outcome_unknown.
            validateRefs(applied.output_refs, "output_refs");
          } catch (error) {
            // The operation body threw, so this transaction definitely rolls
            // back; rethrow tagged so the outcome is reported as certain.
            throw this.deterministicRollback(error, "command_execution_failed");
          }
          const handoffRequestSnapshots = activation
            ? buildNurtureHandoffRequestSnapshots({
                activation,
                command_input: input.payload,
                output_refs: applied.output_refs,
              })
            : [];
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
            handoff_request_snapshots_payload: handoffRequestSnapshots,
            ...(activation ? { handoff_driver_ref: activation.driver_ref } : {}),
            ...(applied.result_schema_version !== undefined
              ? { result_schema_version: applied.result_schema_version }
              : {}),
            ...(applied.committed_result !== undefined
              ? { committed_result_payload: applied.committed_result }
              : {}),
          });
          if (input.spec.afterExecutionCreated) {
            try {
              await input.spec.afterExecutionCreated(
                transaction,
                input.payload,
                executionContext,
                { ...applied, execution: record },
              );
            } catch (error) {
              // The finalizer is part of the same database transaction as the
              // business writes and CommandExecution. A throw here therefore
              // proves rollback just as surely as a throw from apply().
              throw this.deterministicRollback(error, "command_execution_failed");
            }
          }
          return {
            status: "ok" as const,
            disposition: "executed" as const,
            business_outcome: record.business_outcome,
            execution_ref: executionRef(record),
            output_refs: record.output_refs,
            handoff_request_snapshots: record.handoff_request_snapshots_payload,
            ...(record.committed_result_payload !== undefined
              ? { committed_result: record.committed_result_payload }
              : {}),
          };
        },
      });
    } catch (error) {
      if (error instanceof NurtureDeterministicRollback) {
        return {
          status: "not_committed",
          decision: error.decision,
          reason_code: error.reason_code,
        };
      }
      // The transaction wrapper itself failed, so whether the COMMIT reached
      // the database is not observable from here. Reconcile by the same
      // command identity rather than substituting a new one.
      return { status: "outcome_unknown", reason_code: "command_execution_failed" };
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
  normalizeExecutionHandoffState({
    snapshots: record.handoff_request_snapshots_payload,
    driver_ref: record.handoff_driver_ref,
  });
  validateRefs(record.output_refs, "output_refs");
};
