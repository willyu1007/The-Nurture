import { randomUUID } from "node:crypto";
import {
  Prisma,
  type NurtureInstitutionWorkflow,
  type PrismaClient,
} from "@prisma/client";
import {
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
  NurtureInstitutionAuthorityChain,
  projectNurtureEnrollmentJourneyWorkflowV1,
  validateNurtureEnrollmentJourneyWorkflowSnapshotV1,
  type NurtureAuthorityChainResult,
  type NurtureEnrollmentJourneyCommandFactsResult,
  type NurtureEnrollmentJourneyMutation,
  type NurtureEnrollmentJourneyMutationResult,
  type NurtureEnrollmentJourneyReadResult,
  type NurtureEnrollmentJourneyRepository,
  type NurtureEnrollmentJourneyTransaction,
  type NurtureEnrollmentJourneyTransitionDraftV1,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "@the-nurture/scenario";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import { hasPrismaErrorCode } from "./prisma-error.js";

type EnrollmentJourneyPrisma = PrismaClient | Prisma.TransactionClient;
type ResolvedAuthority = Extract<
  NurtureAuthorityChainResult,
  { status: "resolved" }
>;

type WorkflowCarrier = NurtureInstitutionWorkflow & {
  inquiry: { id: string; lastTouchpointAt: Date } | null;
  _count: { touchpoints: number };
};

const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const denied = (): NurtureEnrollmentJourneyMutationResult => ({
  status: "denied",
  reason_code: "not_authorized",
});

const conflict = (
  reasonCode: Extract<
    NurtureEnrollmentJourneyMutationResult,
    { status: "conflict" }
  >["reason_code"] = "workflow_head_conflict",
): NurtureEnrollmentJourneyMutationResult => ({
  status: "conflict",
  reason_code: reasonCode,
});

const duplicateConflict = (
  mutation: NurtureEnrollmentJourneyMutation,
): NurtureEnrollmentJourneyMutationResult => ({
  status: "conflict",
  reason_code:
    mutation.kind === "start_inquiry"
      ? "workflow_run_already_bound"
      : mutation.kind === "confirm_native_touchpoint_note"
        ? "native_source_already_confirmed"
        : mutation.kind === "record_external_touchpoint" &&
            mutation.touchpoint.supersedes_touchpoint_ref
          ? "touchpoint_already_corrected"
          : "enrollment_journey_write_conflict",
});

const snapshotFromRow = (
  row: NurtureInstitutionWorkflow,
): NurtureEnrollmentJourneyWorkflowSnapshotV1 | null => {
  const snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1 = {
    contract_version: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
    workspace_id: row.workspaceId,
    institution_ref: row.institutionId,
    workflow_ref: row.id,
    workflow_run_ref:
      row.workflowRunRef as NurtureEnrollmentJourneyWorkflowSnapshotV1["workflow_run_ref"],
    workflow_type: row.workflowType,
    workflow_head: row.workflowHead,
    lifecycle: row.lifecycle,
    current_stage: row.currentStage,
    waiting_state: row.waitingState,
    pending_transition: row.pendingTransition,
    terminal_outcome: row.terminalOutcome,
    completed_milestones: row.completedMilestones,
    ...(row.dueAt ? { due_at: row.dueAt.toISOString() } : {}),
    started_at: row.startedAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
  return validateNurtureEnrollmentJourneyWorkflowSnapshotV1(snapshot)
    ? snapshot
    : null;
};

const toSnapshot = (
  row: NurtureInstitutionWorkflow,
  authority: ResolvedAuthority,
): NurtureEnrollmentJourneyWorkflowSnapshotV1 | null => {
  const snapshot = snapshotFromRow(row);
  if (!snapshot) return null;
  const validation = projectNurtureEnrollmentJourneyWorkflowV1({
    surface: "institution_admin_web",
    context: {
      workspace_id: row.workspaceId,
      institution_scope: authority.institution_scope,
    },
    snapshot,
  });
  return validation.status === "ok" ? snapshot : null;
};

/**
 * Prisma adapter for G4-D's private workflow/inquiry carrier. It implements
 * both the command transaction port and the body-free read port, but does not
 * register a Host workflow capability and does not create an outbox.
 */
export class PrismaEnrollmentJourneyRepository
  implements
    NurtureEnrollmentJourneyTransaction,
    NurtureEnrollmentJourneyRepository
{
  constructor(private readonly prisma: EnrollmentJourneyPrisma) {}

  private async authority(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref?: string;
  }): Promise<
    | { status: "resolved"; authority: ResolvedAuthority }
    | { status: "denied"; reason_code: "not_authorized" }
    | { status: "unavailable"; reason_code: string }
  > {
    const authority = await new NurtureInstitutionAuthorityChain(
      new PrismaInstitutionContextRepository(this.prisma),
    ).resolve({
      workspace_id: input.workspace_id,
      participant_ref: input.participant_ref,
      ...(input.role_assignment_ref
        ? { role_assignment_ref: input.role_assignment_ref }
        : {}),
      at: new Date().toISOString(),
    });
    if (authority.status === "denied") {
      return authority.reason_code === "policy_unavailable"
        ? { status: "unavailable", reason_code: authority.reason_code }
        : { status: "denied", reason_code: "not_authorized" };
    }
    if (
      authority.institution_scope.institution_ref !== input.institution_ref
    ) {
      return { status: "denied", reason_code: "not_authorized" };
    }
    return { status: "resolved", authority };
  }

  private loadCarrier(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
  }): Promise<WorkflowCarrier | null> {
    return this.prisma.nurtureInstitutionWorkflow.findFirst({
      where: {
        id: input.workflow_ref,
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
      },
      include: {
        inquiry: { select: { id: true, lastTouchpointAt: true } },
        _count: { select: { touchpoints: true } },
      },
    });
  }

  async loadCommandFacts(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    workflow_ref?: string;
  }): Promise<NurtureEnrollmentJourneyCommandFactsResult> {
    try {
      const authority = await this.authority(input);
      if (authority.status !== "resolved") return authority;
      if (!input.workflow_ref) {
        return {
          status: "resolved",
          facts: {
            actor_role_assignment_ref:
              authority.authority.active_role.role_assignment_ref,
            confirmed_touchpoint_count: 0,
          },
        };
      }
      const carrier = await this.loadCarrier({
        ...input,
        workflow_ref: input.workflow_ref,
      });
      if (!carrier?.inquiry) {
        return { status: "denied", reason_code: "not_authorized" };
      }
      const workflow = toSnapshot(carrier, authority.authority);
      if (!workflow) {
        return {
          status: "unavailable",
          reason_code: "invalid_enrollment_journey_carrier",
        };
      }
      return {
        status: "resolved",
        facts: {
          actor_role_assignment_ref:
            authority.authority.active_role.role_assignment_ref,
          workflow,
          confirmed_touchpoint_count: carrier._count.touchpoints,
        },
      };
    } catch {
      return {
        status: "unavailable",
        reason_code: "enrollment_journey_owner_unavailable",
      };
    }
  }

  async readWorkflow(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref?: string;
    workflow_ref: string;
  }): Promise<NurtureEnrollmentJourneyReadResult> {
    try {
      const authority = await this.authority(input);
      if (authority.status !== "resolved") return authority;
      const carrier = await this.loadCarrier(input);
      if (!carrier?.inquiry) {
        return { status: "denied", reason_code: "not_authorized" };
      }
      const workflow = toSnapshot(carrier, authority.authority);
      return workflow
        ? {
            status: "resolved",
            workflow,
            projection_context: {
              workspace_id: input.workspace_id,
              institution_scope: authority.authority.institution_scope,
            },
          }
        : {
            status: "unavailable",
            reason_code: "invalid_enrollment_journey_carrier",
          };
    } catch {
      return {
        status: "unavailable",
        reason_code: "enrollment_journey_owner_unavailable",
      };
    }
  }

  /**
   * Exact post-commit carrier read for a command whose authority and effect
   * were already checked by the formal owner path. This validates shape and
   * lifecycle only; callers must not use it as an authorization decision.
   */
  async readWorkflowAfterAuthorizedCommand(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
  }): Promise<NurtureEnrollmentJourneyWorkflowSnapshotV1 | null> {
    try {
      const carrier = await this.loadCarrier(input);
      return carrier?.inquiry ? snapshotFromRow(carrier) : null;
    } catch {
      return null;
    }
  }

  async commitMutation(
    mutation: NurtureEnrollmentJourneyMutation,
  ): Promise<NurtureEnrollmentJourneyMutationResult> {
    try {
      const authority = await this.authority(mutation);
      if (authority.status !== "resolved") return authority;
      if (
        authority.authority.active_role.role_assignment_ref !==
        mutation.role_assignment_ref
      ) {
        return denied();
      }
      return mutation.kind === "start_inquiry"
        ? await this.startInquiry(mutation, authority.authority)
        : await this.advanceExisting(mutation, authority.authority);
    } catch (error) {
      if (hasPrismaErrorCode(error, "P2002")) {
        return duplicateConflict(mutation);
      }
      return {
        status: "unavailable",
        reason_code: "enrollment_journey_write_unavailable",
      };
    }
  }

  private async startInquiry(
    mutation: Extract<NurtureEnrollmentJourneyMutation, { kind: "start_inquiry" }>,
    authority: ResolvedAuthority,
  ): Promise<NurtureEnrollmentJourneyMutationResult> {
    if (mutation.expected_workflow_head !== 0) return conflict();
    if (mutation.inquiry.target_care_group_ref) {
      const target = await this.prisma.nurtureCareGroup.findFirst({
        where: {
          id: mutation.inquiry.target_care_group_ref,
          workspaceId: mutation.workspace_id,
          institutionId: mutation.institution_ref,
          status: "active",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!target) return denied();
    }

    const workflowRef = randomUUID();
    const inquiryRef = randomUUID();
    const row = await this.prisma.nurtureInstitutionWorkflow.create({
      data: {
        id: workflowRef,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowRunRef: asJson(mutation.workflow_run_ref),
        workflowRunObjectId: mutation.workflow_run_ref.object_id,
        workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
        provisionalSubjectRef: randomUUID(),
        lifecycle: "active",
        currentStage: "inquiry",
        waitingState: "ready",
        pendingTransition: "none",
        terminalOutcome: "none",
        completedMilestones: ["inquiry_started"],
        workflowHead: 1,
        inquiry: {
          create: {
            id: inquiryRef,
            workspaceId: mutation.workspace_id,
            institutionId: mutation.institution_ref,
            preferredLabel: mutation.inquiry.preferred_label,
            ...(mutation.inquiry.protected_birth_year_month
              ? {
                  birthYearMonthProtectionPayload: asJson(
                    mutation.inquiry.protected_birth_year_month,
                  ),
                }
              : {}),
            ageBandKey: mutation.inquiry.age_band_key,
            expectedEntryStartDate: new Date(
              `${mutation.inquiry.expected_entry_start_date}T00:00:00.000Z`,
            ),
            expectedEntryEndDate: new Date(
              `${mutation.inquiry.expected_entry_end_date}T00:00:00.000Z`,
            ),
            targetClassTypeKey: mutation.inquiry.target_class_type_key,
            targetAgeBandKey: mutation.inquiry.target_age_band_key,
            targetCareGroupId: mutation.inquiry.target_care_group_ref,
            careScheduleNeedKeys: [...mutation.inquiry.care_schedule_need_keys],
            sourceChannel: mutation.inquiry.source_channel,
            hostContactRef: asJson(mutation.inquiry.host_contact_ref),
            contactSafeLabel: mutation.inquiry.contact_safe_label,
            safetyLabelKeys: [...mutation.inquiry.safety_label_keys],
            lastTouchpointAt: new Date(mutation.inquiry.last_touchpoint_at),
            nextTouchpointAt: new Date(mutation.inquiry.next_touchpoint_at),
            visitDisposition: "not_decided",
          },
        },
      },
    });
    const workflow = toSnapshot(row, authority);
    return workflow
      ? {
          status: "committed",
          workflow,
          added_milestones: ["inquiry_started"],
        }
      : {
          status: "unavailable",
          reason_code: "invalid_enrollment_journey_carrier",
        };
  }

  private async advanceExisting(
    mutation: Exclude<NurtureEnrollmentJourneyMutation, { kind: "start_inquiry" }>,
    authority: ResolvedAuthority,
  ): Promise<NurtureEnrollmentJourneyMutationResult> {
    const carrier = await this.loadCarrier({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      workflow_ref: mutation.workflow_ref,
    });
    if (
      !carrier?.inquiry ||
      carrier.lifecycle !== "active" ||
      carrier.workflowHead !== mutation.expected_workflow_head
    ) {
      return conflict();
    }
    const before = toSnapshot(carrier, authority);
    if (!before) {
      return {
        status: "unavailable",
        reason_code: "invalid_enrollment_journey_carrier",
      };
    }

    let addedMilestones: NurtureEnrollmentJourneyWorkflowSnapshotV1["completed_milestones"] = [];
    let workflowUpdate: Prisma.NurtureInstitutionWorkflowUpdateManyMutationInput;
    let visitDisposition: "recorded" | "skipped" | undefined;

    if (
      mutation.kind === "record_external_touchpoint" ||
      mutation.kind === "confirm_native_touchpoint_note"
    ) {
      const occurredAt = new Date(mutation.touchpoint.occurred_at);
      const nextTouchpointAt = new Date(mutation.touchpoint.next_touchpoint_at);
      const lastTouchpointAt =
        occurredAt > carrier.inquiry.lastTouchpointAt
          ? occurredAt
          : carrier.inquiry.lastTouchpointAt;
      if (nextTouchpointAt < lastTouchpointAt) {
        return conflict("touchpoint_time_conflict");
      }

      if (
        mutation.kind === "record_external_touchpoint" &&
        mutation.touchpoint.supersedes_touchpoint_ref
      ) {
        const source = await this.prisma.nurtureEnrollmentTouchpoint.findFirst({
          where: {
            id: mutation.touchpoint.supersedes_touchpoint_ref,
            workspaceId: mutation.workspace_id,
            institutionId: mutation.institution_ref,
            workflowId: carrier.id,
            inquiryId: carrier.inquiry.id,
            sourceKind: "external_structured_summary",
            occurredAt: { lte: occurredAt },
            correction: null,
          },
          select: { id: true },
        });
        if (!source) return conflict("touchpoint_correction_conflict");
      }

      const touchpointRef = randomUUID();
      await this.prisma.nurtureEnrollmentTouchpoint.create({
        data: {
          id: touchpointRef,
          workspaceId: mutation.workspace_id,
          institutionId: mutation.institution_ref,
          workflowId: carrier.id,
          inquiryId: carrier.inquiry.id,
          sourceKind:
            mutation.kind === "record_external_touchpoint"
              ? "external_structured_summary"
              : "native_business_communication",
          sourceChannel: mutation.touchpoint.source_channel,
          ...(mutation.kind === "record_external_touchpoint"
            ? {
                externalSummaryBodyEnvelope: asJson(
                  mutation.touchpoint.external_summary_body_envelope,
                ),
                supersedesTouchpointId:
                  mutation.touchpoint.supersedes_touchpoint_ref,
                correctionReason: mutation.touchpoint.correction_reason,
              }
            : {
                nativeSourceRef: asJson(mutation.touchpoint.native_source_ref),
              }),
          confirmedNeedKeys: [...mutation.touchpoint.confirmed_need_keys],
          safetyLabelKeys: [...mutation.touchpoint.safety_label_keys],
          nextActionKey: mutation.touchpoint.next_action_key,
          responsibleRole: mutation.touchpoint.responsible_role,
          occurredAt,
          dueAt: new Date(mutation.touchpoint.due_at),
          nextTouchpointAt,
          actorRoleAssignmentId: mutation.role_assignment_ref,
        },
      });
      await this.prisma.nurtureEnrollmentInquiry.update({
        where: { id: carrier.inquiry.id },
        data: { lastTouchpointAt, nextTouchpointAt },
      });
      workflowUpdate = { workflowHead: { increment: 1 } };
    } else if (mutation.kind === "confirm_intent") {
      if (carrier.currentStage !== "inquiry" || carrier._count.touchpoints < 1) {
        return conflict("workflow_state_conflict");
      }
      addedMilestones = ["intent_confirmed"];
      workflowUpdate = {
        workflowHead: { increment: 1 },
        currentStage: "intent_conversation",
        completedMilestones: { push: "intent_confirmed" },
      };
    } else if (
      mutation.kind === "record_visit" ||
      mutation.kind === "skip_visit"
    ) {
      if (carrier.currentStage !== "intent_conversation") {
        return conflict("workflow_state_conflict");
      }
      visitDisposition =
        mutation.kind === "record_visit" ? "recorded" : "skipped";
      addedMilestones =
        mutation.kind === "record_visit" ? ["visit_recorded"] : [];
      workflowUpdate = {
        workflowHead: { increment: 1 },
        currentStage: "visit_or_consultation",
        ...(mutation.kind === "record_visit"
          ? { completedMilestones: { push: "visit_recorded" } }
          : {}),
      };
    } else {
      if (
        !["inquiry", "intent_conversation", "visit_or_consultation"].includes(
          carrier.currentStage,
        )
      ) {
        return conflict("workflow_state_conflict");
      }
      workflowUpdate = {
        workflowHead: { increment: 1 },
        lifecycle: "closed_without_formalization",
        currentStage: "closed",
        waitingState: "ready",
        pendingTransition: "none",
        terminalOutcome: "inquiry_closed",
      };
    }

    const update = await this.prisma.nurtureInstitutionWorkflow.updateMany({
      where: {
        id: carrier.id,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        lifecycle: "active",
        workflowHead: mutation.expected_workflow_head,
      },
      data: workflowUpdate,
    });
    if (update.count !== 1) return conflict();
    if (visitDisposition) {
      await this.prisma.nurtureEnrollmentInquiry.update({
        where: { id: carrier.inquiry.id },
        data: { visitDisposition },
      });
    }
    const updated = await this.prisma.nurtureInstitutionWorkflow.findUnique({
      where: { id: carrier.id },
    });
    const workflow = updated ? toSnapshot(updated, authority) : null;
    return workflow
      ? {
          status: "committed",
          before,
          workflow,
          added_milestones: addedMilestones,
        }
      : {
          status: "unavailable",
          reason_code: "invalid_enrollment_journey_carrier",
        };
  }

  async appendTransition(input: {
    transition: NurtureEnrollmentJourneyTransitionDraftV1;
    command_execution_ref: string;
  }): Promise<void> {
    const execution = await this.prisma.nurtureCommandExecution.findFirst({
      where: {
        id: input.command_execution_ref,
        workspaceId: input.transition.workspace_id,
        commandKey: `nurture.${input.transition.command_key}`,
        commandScope: "institution_enrollment_journey",
      },
      select: { committedAt: true },
    });
    if (!execution) throw new Error("enrollment journey execution is unavailable");
    await this.prisma.nurtureInstitutionWorkflowTransition.create({
      data: {
        id: input.transition.transition_ref,
        workspaceId: input.transition.workspace_id,
        institutionId: input.transition.institution_ref,
        workflowId: input.transition.workflow_ref,
        commandExecutionId: input.command_execution_ref,
        workflowHeadBefore: input.transition.workflow_head_before,
        workflowHeadAfter: input.transition.workflow_head_after,
        stageBefore: input.transition.stage_before,
        stageAfter: input.transition.stage_after,
        waitingStateBefore: input.transition.waiting_state_before,
        waitingStateAfter: input.transition.waiting_state_after,
        pendingTransitionBefore: input.transition.pending_transition_before,
        pendingTransitionAfter: input.transition.pending_transition_after,
        lifecycleBefore: input.transition.lifecycle_before,
        lifecycleAfter: input.transition.lifecycle_after,
        terminalOutcomeBefore: input.transition.terminal_outcome_before,
        terminalOutcomeAfter: input.transition.terminal_outcome_after,
        addedMilestones: [...input.transition.added_milestones],
        commandKey: input.transition.command_key,
        ...(input.transition.actor_role_assignment_ref
          ? {
              actorRoleAssignmentId:
                input.transition.actor_role_assignment_ref,
            }
          : {}),
        ...(input.transition.actor_ref
          ? { actorRef: asJson(input.transition.actor_ref) }
          : {}),
        ...(input.transition.owner_action_ref
          ? { ownerActionRef: asJson(input.transition.owner_action_ref) }
          : {}),
        ...(input.transition.formal_proposal_ref
          ? { formalProposalId: input.transition.formal_proposal_ref }
          : {}),
        ...(input.transition.owner_evidence_hash
          ? { ownerEvidenceHash: input.transition.owner_evidence_hash }
          : {}),
        ...(input.transition.owner_evidence_metadata
          ? { ownerEvidenceMetadata: asJson(input.transition.owner_evidence_metadata) }
          : {}),
        reasonKey: input.transition.reason_key,
        occurredAt: execution.committedAt,
      },
    });
  }
}
