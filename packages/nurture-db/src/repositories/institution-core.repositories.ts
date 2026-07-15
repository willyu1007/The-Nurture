import { createHash } from "node:crypto";
import {
  Prisma,
  type NurtureCommandExecution as PrismaCommandExecution,
  type NurtureInteractionContext as PrismaInteractionContext,
  type NurtureWorkflowProject as PrismaWorkflowProject,
  type PrismaClient,
} from "@prisma/client";
import { normalizeExecutionHandoffState } from "@the-nurture/scenario";
import type {
  NurtureCommandExecutionDraft,
  NurtureCommandExecutionRecord,
  NurtureCommandRepository,
  NurtureCommandTransaction,
  NurtureInteractionContextRecord,
  NurtureInteractionContextRepository,
  NurtureWorkflowProject,
} from "@the-nurture/scenario";
import { PrismaFamilyCareCommandTransaction } from "./family-care-command.transaction.js";

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
  readonly familyCare: PrismaFamilyCareCommandTransaction;

  constructor(private readonly transaction: Prisma.TransactionClient) {
    this.familyCare = new PrismaFamilyCareCommandTransaction(transaction);
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

const advisoryKey = (workspaceId: string, commandHash: string): bigint => {
  const digest = createHash("sha256")
    .update(`nurture.command-lock.v1\0${workspaceId}\0${commandHash}`, "utf8")
    .digest();
  return BigInt.asIntN(64, digest.readBigUInt64BE(0));
};

export class PrismaNurtureCommandRepository implements NurtureCommandRepository {
  constructor(private readonly prisma: PrismaClient) {}

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

  executeLocked<T>(input: {
    workspace_id: string;
    command_request_id_hash: string;
    operation: (transaction: NurtureCommandTransaction) => Promise<T>;
  }): Promise<{ acquired: true; value: T } | { acquired: false }> {
    return this.prisma.$transaction(
      async (transaction) => {
        const rows = await transaction.$queryRaw<Array<{ acquired: boolean }>>(
          Prisma.sql`SELECT pg_try_advisory_xact_lock(${advisoryKey(
            input.workspace_id,
            input.command_request_id_hash,
          )}) AS acquired`,
        );
        if (rows[0]?.acquired !== true) return { acquired: false };
        const value = await input.operation(new PrismaNurtureCommandTransaction(transaction));
        return { acquired: true, value };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export class PrismaInteractionContextRepository implements NurtureInteractionContextRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
