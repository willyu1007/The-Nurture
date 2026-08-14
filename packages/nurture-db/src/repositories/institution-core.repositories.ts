import {
  Prisma,
  type NurtureCommandExecution as PrismaCommandExecution,
  type NurtureInteractionContext as PrismaInteractionContext,
  type NurtureWorkflowProject as PrismaWorkflowProject,
  type PrismaClient,
} from "@prisma/client";
import {
  NurtureDeterministicRollback,
  normalizeExecutionHandoffState,
} from "@the-nurture/scenario/harness";
import type {
  NurtureCommandExecutionDraft,
  NurtureCommandExecutionRecord,
  NurtureCommandRepository,
  NurtureCommandTransaction,
  NurtureInteractionContextRecord,
  NurtureInteractionContextRepository,
  NurtureInteractionContextTransactionPort,
  NurtureWorkflowProject,
} from "@the-nurture/scenario/harness";
import { PrismaBoardMutationTransaction } from "./board-mutation.transaction.js";
import { PrismaNurtureEnrollmentJourneyPreparedCommandLedger } from "./enrollment-journey-prepared-command.repository.js";
import { PrismaPublishProcessTransaction } from "./publish-process.transaction.js";
import { PrismaMediaAttributionTransaction } from "./media-attribution.transaction.js";
import { PrismaAttendanceTransaction } from "./attendance-closeout.repository.js";
import { PrismaContentRevisionRepository } from "./content-revision.repository.js";
import { PrismaAttributionCorrectionCandidateRepository } from "./attribution-correction-candidate.repository.js";
import { PrismaPublicationSafetyTransaction } from "./publication-safety.transaction.js";
import { PrismaCareCaptureTransaction } from "./care-capture.transaction.js";
import { PrismaPublishQueueAdmissionTransaction } from "./publish-queue-admission.service.js";
import { PrismaTeacherCommunicationTransaction } from "./teacher-communication-owner.repository.js";
import { PrismaFamilyCareCommandTransaction } from "./family-care-command.transaction.js";
import { PrismaEnrollmentJourneyRepository } from "./enrollment-journey.repository.js";
import { PrismaEnrollmentWaitlistRepository } from "./enrollment-waitlist.repository.js";
import { PrismaEnrollmentTrialLifecycleRepository } from "./enrollment-trial-lifecycle.repository.js";
import { PrismaEnrollmentFormalizationRepository } from "./enrollment-formalization.repository.js";
import { PrismaInstitutionKnowledgeRepository } from "./institution-knowledge.repository.js";
import { PrismaInstitutionKnowledgeConflictCandidateRepository } from "./institution-knowledge-conflict-candidate.repository.js";
import { isPrismaSerializationAbort } from "./prisma-error.js";
import { nurtureCommandAdvisoryKey } from "./nurture-command-advisory-key.js";
import { PrismaNurtureWorkflowRunSettlementTransaction } from "./workflow-run-settlement.repository.js";

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;
const jsonOrUndefined = (value: Prisma.JsonValue | null): unknown => (value === null ? undefined : value);

const toProject = (row: PrismaWorkflowProject): NurtureWorkflowProject => ({
  project_id: row.id,
  workspace_id: row.workspaceId,
  workflow_run_id: row.workflowRunId ?? undefined,
  template_key: row.templateKey,
  issue_type: row.issueType,
  status: row.status,
  family_ref_key: row.familyRefKey,
  child_ref_key: row.primaryChildRefKey ?? undefined,
  family_charter_id: row.familyCharterId ?? undefined,
  quantification_snapshot_id: row.quantificationSnapshotId ?? undefined,
  focus_cycle_id: row.focusCycleId ?? undefined,
  goal_payload: jsonOrUndefined(row.goalPayload),
  constraint_payload: jsonOrUndefined(row.constraintPayload),
  baseline_payload: jsonOrUndefined(row.baselinePayload),
  plan_payload: jsonOrUndefined(row.planPayload),
  measurement_plan_payload: jsonOrUndefined(row.measurementPlanPayload),
  capture_prompt_payload: jsonOrUndefined(row.capturePromptPayload),
  review_summary_payload: jsonOrUndefined(row.reviewSummaryPayload),
  learning_output_payload: jsonOrUndefined(row.learningOutputPayload),
  profile_update_proposal_payload: jsonOrUndefined(row.profileUpdateProposalPayload),
  charter_update_proposal_payload: jsonOrUndefined(row.charterUpdateProposalPayload),
  orchestration_state_payload: jsonOrUndefined(row.orchestrationStatePayload),
  next_checkpoint_at: row.nextCheckpointAt?.toISOString(),
  review_due_at: row.reviewDueAt?.toISOString(),
  escalated_at: row.escalatedAt?.toISOString(),
  risk_level: row.riskLevel ?? undefined,
  aggregate_version: row.aggregateVersion,
});

const toExecution = (row: PrismaCommandExecution): NurtureCommandExecutionRecord => {
  const handoffState = normalizeExecutionHandoffState({
    snapshots: row.handoffRequestSnapshotsPayload,
    driver_ref: row.handoffDriverRef,
  });
  return {
    id: row.id,
    workspace_id: row.workspaceId,
    command_request_id_hash: row.commandRequestIdHash,
    origin_invocation_request_id_hash: row.originInvocationRequestIdHash,
    parent_command_request_id_hash: row.parentCommandRequestIdHash ?? undefined,
    request_identity_hash_version: 1,
    command_key: row.commandKey,
    command_scope: row.commandScope,
    command_contract_version: row.commandContractVersion,
    payload_hash: row.payloadHash,
    payload_canonicalization_version: 1,
    business_actor_ref: row.businessActorRef,
    primary_scope_ref: row.primaryScopeRef
      ? (row.primaryScopeRef as NurtureCommandExecutionRecord["primary_scope_ref"])
      : undefined,
    child_care_process_id: row.childCareProcessId ?? undefined,
    target_refs: (row.targetRefs ?? []) as unknown as NurtureCommandExecutionRecord["target_refs"],
    business_outcome: row.businessOutcome,
    output_refs: row.outputRefs as unknown as NurtureCommandExecutionRecord["output_refs"],
    handoff_snapshot_schema_version: 1,
    handoff_request_snapshots_payload: handoffState.snapshots,
    ...(handoffState.driver_ref ? { handoff_driver_ref: handoffState.driver_ref } : {}),
    ...(row.resultSchemaVersion !== null
      ? { result_schema_version: row.resultSchemaVersion }
      : {}),
    ...(row.committedResultPayload !== null
      ? { committed_result_payload: row.committedResultPayload }
      : {}),
    committed_at: row.committedAt.toISOString(),
  };
};

const toInteraction = (row: PrismaInteractionContext): NurtureInteractionContextRecord => ({
  id: row.id,
  workspace_id: row.workspaceId,
  participant_id: row.participantId,
  purpose: row.purpose,
  surface: row.surface,
  token_hash: row.tokenHash,
  token_hash_version: 1,
  host_conversation_ref_hash: row.hostConversationRefHash ?? undefined,
  payload_schema_version: row.payloadSchemaVersion,
  state_payload: row.statePayload,
  status: row.status,
  expires_at: row.expiresAt.toISOString(),
  consumed_at: row.consumedAt?.toISOString(),
  revoked_at: row.revokedAt?.toISOString(),
  version: row.version,
  created_at: row.createdAt.toISOString(),
  updated_at: row.updatedAt.toISOString(),
});

class PrismaNurtureCommandTransaction implements NurtureCommandTransaction {
  /** G4-D private workflow/inquiry writes, in the one command-ledger tx. */
  readonly enrollmentJourney: PrismaEnrollmentJourneyRepository;
  readonly enrollmentWaitlist: PrismaEnrollmentWaitlistRepository;
  readonly enrollmentTrialLifecycle: PrismaEnrollmentTrialLifecycleRepository;
  readonly enrollmentFormalization: PrismaEnrollmentFormalizationRepository;
  /** G4-D I3: the enrollment prepared-command ledger, consumed in this tx. */
  readonly enrollmentPreparedCommands: PrismaNurtureEnrollmentJourneyPreparedCommandLedger;
  /** T-007 I4: Host Run settlement receipt, committed with the command. */
  readonly workflowRunSettlement: PrismaNurtureWorkflowRunSettlementTransaction;
  /** G4-E private Institution Knowledge lifecycle/provenance writes. */
  readonly institutionKnowledge: PrismaInstitutionKnowledgeRepository;
  readonly institutionKnowledgeConflicts: PrismaInstitutionKnowledgeConflictCandidateRepository;
  readonly familyCare: PrismaFamilyCareCommandTransaction;
  readonly interactionContexts: NurtureInteractionContextTransactionPort;
  /**
   * The G3-A inline board mutations write their own fact owners inside this
   * same command transaction, so the board never becomes a second writer.
   */
  readonly boardMutations: PrismaBoardMutationTransaction;

  /**
   * The T-006 publish-process lifecycle writes its own owner row inside this
   * same command transaction, so the publish queue never becomes a second
   * writer of the process state.
   */
  readonly publishProcess: PrismaPublishProcessTransaction;

  /**
   * The G3-C1 attribution decisions append their own owner revisions inside
   * this same command transaction, so the board never becomes a second writer
   * of attribution history.
   */
  readonly mediaAttribution: PrismaMediaAttributionTransaction;

  /**
   * G4-B attendance writes its submission and entries inside this same
   * command transaction. That is what makes the read the decision was made
   * against and the write that follows it atomic — the alternative leaves a
   * window another writer can enter between them.
   */
  readonly attendance: PrismaAttendanceTransaction;

  /** G4-C 0D-3 append-only placement/note/downscope revisions. */
  readonly contentRevisions: PrismaContentRevisionRepository;

  /** G4-C 0D-4 append-only, non-canonical attribution reports. */
  readonly attributionCorrections: PrismaAttributionCorrectionCandidateRepository;

  /**
   * The G3-D post-release safety writes: monotone visibility in apply, the
   * command-naming lineage rows in finalize, one transaction throughout.
   */
  readonly publicationSafety: PrismaPublicationSafetyTransaction;
  /** G3-B1 organize-cut owner writes, same transaction. */
  readonly careCapture: PrismaCareCaptureTransaction;
  /** W7 in-transaction queue admission, same transaction. */
  readonly publishQueueAdmission: PrismaPublishQueueAdmissionTransaction;
  /** W8 teacher-communication owner writes, same transaction. */
  readonly teacherCommunication: PrismaTeacherCommunicationTransaction;

  constructor(
    private readonly transaction: Prisma.TransactionClient,
    now: () => Date,
  ) {
    this.enrollmentJourney = new PrismaEnrollmentJourneyRepository(transaction);
    this.enrollmentWaitlist = new PrismaEnrollmentWaitlistRepository(transaction, now);
    this.enrollmentTrialLifecycle = new PrismaEnrollmentTrialLifecycleRepository(
      transaction,
      now,
    );
    this.enrollmentFormalization = new PrismaEnrollmentFormalizationRepository(
      transaction,
      now,
    );
    this.enrollmentPreparedCommands =
      new PrismaNurtureEnrollmentJourneyPreparedCommandLedger(transaction);
    this.workflowRunSettlement =
      new PrismaNurtureWorkflowRunSettlementTransaction(transaction, now);
    this.institutionKnowledge = new PrismaInstitutionKnowledgeRepository(transaction, now);
    this.institutionKnowledgeConflicts =
      new PrismaInstitutionKnowledgeConflictCandidateRepository(transaction);
    this.familyCare = new PrismaFamilyCareCommandTransaction(transaction, now);
    this.interactionContexts = new PrismaInteractionContextRepository(transaction);
    this.boardMutations = new PrismaBoardMutationTransaction(transaction);
    this.publishProcess = new PrismaPublishProcessTransaction(transaction);
    this.mediaAttribution = new PrismaMediaAttributionTransaction(transaction);
    this.attendance = new PrismaAttendanceTransaction(transaction);
    this.contentRevisions = new PrismaContentRevisionRepository(transaction);
    this.attributionCorrections = new PrismaAttributionCorrectionCandidateRepository(transaction);
    this.publicationSafety = new PrismaPublicationSafetyTransaction(transaction);
    this.careCapture = new PrismaCareCaptureTransaction(transaction);
    this.publishQueueAdmission = new PrismaPublishQueueAdmissionTransaction(transaction);
    this.teacherCommunication = new PrismaTeacherCommunicationTransaction(transaction);
  }

  async findCommitted(input: {
    workspace_id: string;
    command_request_id_hash: string;
  }): Promise<NurtureCommandExecutionRecord | null> {
    const row = await this.transaction.nurtureCommandExecution.findUnique({
      where: {
        workspaceId_commandRequestIdHash: {
          workspaceId: input.workspace_id,
          commandRequestIdHash: input.command_request_id_hash,
        },
      },
    });
    return row ? toExecution(row) : null;
  }

  async createExecution(input: NurtureCommandExecutionDraft): Promise<NurtureCommandExecutionRecord> {
    const row = await this.transaction.nurtureCommandExecution.create({
      data: {
        workspaceId: input.workspace_id,
        commandRequestIdHash: input.command_request_id_hash,
        originInvocationRequestIdHash: input.origin_invocation_request_id_hash,
        parentCommandRequestIdHash: input.parent_command_request_id_hash,
        requestIdentityHashVersion: 1,
        commandKey: input.command_key,
        commandScope: input.command_scope,
        commandContractVersion: input.command_contract_version,
        payloadHash: input.payload_hash,
        payloadCanonicalizationVersion: 1,
        businessActorRef: input.business_actor_ref,
        ...(input.primary_scope_ref ? { primaryScopeRef: asJson(input.primary_scope_ref) } : {}),
        childCareProcessId: input.child_care_process_id,
        targetRefs: asJson(input.target_refs),
        businessOutcome: input.business_outcome,
        outputRefs: asJson(input.output_refs),
        handoffSnapshotSchemaVersion: 1,
        handoffRequestSnapshotsPayload: asJson(input.handoff_request_snapshots_payload),
        ...(input.handoff_driver_ref
          ? { handoffDriverRef: asJson(input.handoff_driver_ref) }
          : {}),
        ...(input.result_schema_version !== undefined
          ? { resultSchemaVersion: input.result_schema_version }
          : {}),
        ...(input.committed_result_payload !== undefined
          ? { committedResultPayload: asJson(input.committed_result_payload) }
          : {}),
      },
    });
    return toExecution(row);
  }

  async getWorkflowProjectById(input: {
    workspace_id: string;
    project_id: string;
  }): Promise<NurtureWorkflowProject | null> {
    const row = await this.transaction.nurtureWorkflowProject.findFirst({
      where: { id: input.project_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    return row ? toProject(row) : null;
  }

  async updateWorkflowProjectStrategy(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    goal_payload: unknown;
    constraint_payload: unknown;
  }): Promise<NurtureWorkflowProject> {
    const result = await this.transaction.nurtureWorkflowProject.updateMany({
      where: {
        id: input.project_id,
        workspaceId: input.workspace_id,
        aggregateVersion: input.expected_version,
        deletedAt: null,
      },
      data: {
        goalPayload: asJson(input.goal_payload),
        constraintPayload: asJson(input.constraint_payload),
        aggregateVersion: { increment: 1 },
      },
    });
    if (result.count === 0) throw new Error("family strategy version conflict");
    const row = await this.transaction.nurtureWorkflowProject.findFirstOrThrow({
      where: { id: input.project_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    return toProject(row);
  }

  async appendEvidenceRef(input: {
    workspace_id: string;
    target_ref: Parameters<NurtureCommandTransaction["appendEvidenceRef"]>[0]["target_ref"];
    evidence_ref: Parameters<NurtureCommandTransaction["appendEvidenceRef"]>[0]["evidence_ref"];
    reason_code: string;
  }): Promise<void> {
    await this.transaction.nurtureEvidenceRef.create({
      data: {
        workspaceId: input.workspace_id,
        targetRef: asJson(input.target_ref),
        evidenceRef: asJson(input.evidence_ref),
        reasonCode: input.reason_code,
      },
    });
  }
}

export class PrismaNurtureCommandRepository implements NurtureCommandRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async findCommitted(input: {
    workspace_id: string;
    command_request_id_hash: string;
  }): Promise<NurtureCommandExecutionRecord | null> {
    const row = await this.prisma.nurtureCommandExecution.findUnique({
      where: {
        workspaceId_commandRequestIdHash: {
          workspaceId: input.workspace_id,
          commandRequestIdHash: input.command_request_id_hash,
        },
      },
    });
    return row ? toExecution(row) : null;
  }

  async executeLocked<T>(input: {
    workspace_id: string;
    command_request_id_hash: string;
    operation: (transaction: NurtureCommandTransaction) => Promise<T>;
  }): Promise<{ acquired: true; value: T } | { acquired: false }> {
    try {
      return await this.runLocked(input);
    } catch (error) {
      // P2034 / 40001: the driver aborted the transaction, so no effect
      // landed. Report it as a certain rollback rather than an unknown one.
      const classified = this.classifyRollback(error);
      if (classified) {
        throw new NurtureDeterministicRollback(
          classified.reason_code,
          classified.decision,
        );
      }
      throw error;
    }
  }

  classifyRollback(error: unknown): {
    decision: "conflict";
    reason_code: "command_write_conflict";
  } | null {
    return isPrismaSerializationAbort(error)
      ? { decision: "conflict", reason_code: "command_write_conflict" }
      : null;
  }

  private runLocked<T>(input: {
    workspace_id: string;
    command_request_id_hash: string;
    operation: (transaction: NurtureCommandTransaction) => Promise<T>;
  }): Promise<{ acquired: true; value: T } | { acquired: false }> {
    return this.prisma.$transaction(
      async (transaction) => {
        const rows = await transaction.$queryRaw<Array<{ acquired: boolean }>>(
          Prisma.sql`SELECT pg_try_advisory_xact_lock(${nurtureCommandAdvisoryKey(
            input.workspace_id,
            input.command_request_id_hash,
          )}) AS acquired`,
        );
        if (rows[0]?.acquired !== true) return { acquired: false };
        const value = await input.operation(
          new PrismaNurtureCommandTransaction(transaction, this.now),
        );
        return { acquired: true, value };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export class PrismaInteractionContextRepository implements NurtureInteractionContextRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(
    input: Omit<NurtureInteractionContextRecord, "id" | "created_at" | "updated_at">,
  ): Promise<NurtureInteractionContextRecord> {
    const row = await this.prisma.nurtureInteractionContext.create({
      data: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        purpose: input.purpose,
        surface: input.surface,
        tokenHash: input.token_hash,
        tokenHashVersion: 1,
        hostConversationRefHash: input.host_conversation_ref_hash,
        payloadSchemaVersion: input.payload_schema_version,
        statePayload: asJson(input.state_payload),
        status: input.status,
        expiresAt: new Date(input.expires_at),
        version: input.version,
      },
    });
    return toInteraction(row);
  }

  async findByTokenHash(input: {
    workspace_id: string;
    token_hash: string;
  }): Promise<NurtureInteractionContextRecord | null> {
    const row = await this.prisma.nurtureInteractionContext.findUnique({
      where: {
        workspaceId_tokenHash: {
          workspaceId: input.workspace_id,
          tokenHash: input.token_hash,
        },
      },
    });
    return row ? toInteraction(row) : null;
  }

  async findLatestActiveByConversationHash(input: {
    workspace_id: string;
    participant_id: string;
    purpose: NurtureInteractionContextRecord["purpose"];
    surface: string;
    host_conversation_ref_hash: string;
    at: string;
  }): Promise<NurtureInteractionContextRecord | null> {
    const row = await this.prisma.nurtureInteractionContext.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        purpose: input.purpose,
        surface: input.surface,
        hostConversationRefHash: input.host_conversation_ref_hash,
        status: "active",
        expiresAt: { gt: new Date(input.at) },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return row ? toInteraction(row) : null;
  }

  async consume(input: {
    workspace_id: string;
    context_id: string;
    expected_version: number;
    consumed_at: string;
  }): Promise<NurtureInteractionContextRecord | null> {
    const consumedAt = new Date(input.consumed_at);
    const result = await this.prisma.nurtureInteractionContext.updateMany({
      where: {
        id: input.context_id,
        workspaceId: input.workspace_id,
        status: "active",
        version: input.expected_version,
        expiresAt: { gt: consumedAt },
      },
      data: { status: "consumed", consumedAt, version: { increment: 1 } },
    });
    if (result.count === 0) return null;
    const row = await this.prisma.nurtureInteractionContext.findUniqueOrThrow({
      where: { id: input.context_id },
    });
    return toInteraction(row);
  }

  async revoke(input: {
    workspace_id: string;
    context_id: string;
    expected_version: number;
    revoked_at: string;
  }): Promise<NurtureInteractionContextRecord | null> {
    const revokedAt = new Date(input.revoked_at);
    const result = await this.prisma.nurtureInteractionContext.updateMany({
      where: {
        id: input.context_id,
        workspaceId: input.workspace_id,
        status: "active",
        version: input.expected_version,
      },
      data: { status: "revoked", revokedAt, version: { increment: 1 } },
    });
    if (result.count === 0) return null;
    const row = await this.prisma.nurtureInteractionContext.findUniqueOrThrow({
      where: { id: input.context_id },
    });
    return toInteraction(row);
  }
}
