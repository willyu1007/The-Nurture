import { randomUUID } from "node:crypto";
import {
  Prisma,
  type NurtureChildLinkGrant,
  type NurtureEnrollment,
  type NurtureEnrollmentFormalProposal,
  type NurtureEnrollmentTrialReservation,
  type NurtureInstitutionWorkflow,
  type PrismaClient,
} from "@prisma/client";
import {
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
  NurtureInstitutionAuthorityChain,
  validateTrialGrantTermsSnapshotV1,
  type NurtureEnrollmentJourneyMilestone,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
  type NurtureEnrollmentTrialLifecycleFailure,
  type NurtureEnrollmentTrialLifecycleMutation,
  type NurtureEnrollmentTrialLifecycleResult,
  type NurtureEnrollmentTrialLifecycleTransaction,
  type NurtureEnrollmentFormalProposalRecordV1,
} from "@the-nurture/scenario";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import { PrismaEnrollmentPairOwnerRepository } from "./enrollment-pair-owner.repository.js";
import {
  hasPrismaErrorCode,
  isPrismaSerializationAbort,
} from "./prisma-error.js";

type TrialPrisma = PrismaClient | Prisma.TransactionClient;

type Loaded = {
  workflow: NurtureInstitutionWorkflow;
  reservation: NurtureEnrollmentTrialReservation;
  enrollment?: NurtureEnrollment;
  grant?: NurtureChildLinkGrant;
};

const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const toSnapshot = (
  row: NurtureInstitutionWorkflow,
): NurtureEnrollmentJourneyWorkflowSnapshotV1 => ({
  contract_version: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  workspace_id: row.workspaceId,
  institution_ref: row.institutionId,
  workflow_ref: row.id,
  workflow_run_ref:
    row.workflowRunRef as NurtureEnrollmentJourneyWorkflowSnapshotV1["workflow_run_ref"],
  workflow_type: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
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
});

const failure = (
  status: NurtureEnrollmentTrialLifecycleFailure["status"],
  reason_code: string,
): NurtureEnrollmentTrialLifecycleFailure => ({ status, reason_code });
const denied = (reason = "not_authorized") => failure("denied", reason);
const conflict = (reason: string) => failure("conflict", reason);
const unavailable = (reason: string) => failure("unavailable", reason);
const sameValues = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const toFormalProposal = (
  row: NurtureEnrollmentFormalProposal,
): NurtureEnrollmentFormalProposalRecordV1 => {
  if (row.proposalHead !== 1) throw new Error("invalid formal proposal head");
  return {
    proposal_ref: row.id,
    proposal_head: 1,
    workflow_ref: row.workflowId,
    enrollment_ref: row.enrollmentId,
    grant_ref: row.grantId,
    reservation_ref: row.reservationId,
    care_group_ref: row.careGroupId,
    care_group_head: row.careGroupHead,
    proposed_formal_start_at: row.proposedFormalStartAt.toISOString(),
    proposed_grant_purposes: row.proposedGrantPurposes,
    proposed_grant_expires_at: row.proposedGrantExpiresAt.toISOString(),
    safe_family_summary: row.safeFamilySummary,
    issued_by_role_assignment_ref: row.issuedByRoleAssignmentId,
    issue_reason_key: row.issueReasonKey,
    issued_at: row.issuedAt.toISOString(),
    expires_at: row.expiresAt.toISOString(),
  };
};

/**
 * G4-D increment 4 owner. It mutates the existing Enrollment, Grant,
 * reservation and workflow heads in the outer serializable command tx; it
 * does not create a second trial aggregate or expose a host-facing caller.
 */
export class PrismaEnrollmentTrialLifecycleRepository
  implements NurtureEnrollmentTrialLifecycleTransaction
{
  private readonly pairOwner: PrismaEnrollmentPairOwnerRepository;

  constructor(
    private readonly prisma: TrialPrisma,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.pairOwner = new PrismaEnrollmentPairOwnerRepository(prisma, now);
  }

  private async resolveAdmin(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<{ status: "resolved" } | NurtureEnrollmentTrialLifecycleFailure> {
    const authority = await new NurtureInstitutionAuthorityChain(
      new PrismaInstitutionContextRepository(this.prisma),
    ).resolve({
      workspace_id: mutation.workspace_id,
      participant_ref: mutation.participant_ref,
      role_assignment_ref: mutation.role_assignment_ref,
      at: this.now().toISOString(),
    });
    if (authority.status !== "resolved") {
      return authority.reason_code === "policy_unavailable"
        ? unavailable(authority.reason_code)
        : denied();
    }
    return authority.institution_scope.institution_ref === mutation.institution_ref &&
      authority.active_role.role_kind === "institution_admin" &&
      authority.active_role.role_assignment_ref === mutation.role_assignment_ref
      ? { status: "resolved" }
      : denied();
  }

  private async lockCareGroup(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
  }): Promise<{ id: string; capacity: number | null; aggregate_version: number } | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; capacity: number | null; aggregate_version: number }>
    >(Prisma.sql`
      SELECT "id", "capacity", "aggregate_version"
      FROM "nurture_care_group"
      WHERE "id" = ${input.care_group_ref}
        AND "workspace_id" = ${input.workspace_id}
        AND "institution_id" = ${input.institution_ref}
        AND "status" = 'active'
        AND "deleted_at" IS NULL
      FOR UPDATE
    `);
    return rows[0] ?? null;
  }

  private async load(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<Loaded | NurtureEnrollmentTrialLifecycleFailure> {
    const authorization = await this.resolveAdmin(mutation);
    if (authorization.status !== "resolved") return authorization;

    const workflow = await this.prisma.nurtureInstitutionWorkflow.findFirst({
      where: {
        id: mutation.workflow_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
        lifecycle: "active",
      },
    });
    if (!workflow) return denied();
    if (workflow.workflowHead !== mutation.expected_workflow_head) {
      return conflict("workflow_head_conflict");
    }
    const reservation = await this.prisma.nurtureEnrollmentTrialReservation.findFirst({
      where: {
        id: mutation.reservation_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: workflow.id,
      },
    });
    if (!reservation) return denied();
    if (reservation.reservationHead !== mutation.expected_reservation_head) {
      return conflict("trial_reservation_head_conflict");
    }
    if (mutation.kind === "prepare_trial_relationship") {
      return { workflow, reservation };
    }

    const [enrollment, grant] = await Promise.all([
      this.prisma.nurtureEnrollment.findFirst({
        where: {
          id: mutation.enrollment_ref,
          workspaceId: mutation.workspace_id,
          institutionId: mutation.institution_ref,
          deletedAt: null,
        },
      }),
      this.prisma.nurtureChildLinkGrant.findFirst({
        where: {
          id: mutation.grant_ref,
          workspaceId: mutation.workspace_id,
          deletedAt: null,
        },
      }),
    ]);
    if (!enrollment || !grant || grant.enrollmentId !== enrollment.id) return denied();
    if (
      enrollment.aggregateVersion !== mutation.expected_enrollment_head ||
      grant.aggregateVersion !== mutation.expected_grant_head
    ) return conflict("trial_entity_head_conflict");
    if (
      enrollment.childCareProcessId !== workflow.childCareProcessId ||
      enrollment.careGroupId !== reservation.targetCareGroupId ||
      grant.childCareProcessId !== enrollment.childCareProcessId ||
      grant.grantedToScopeType !== "institution" ||
      grant.grantedToScopeId !== mutation.institution_ref
    ) return denied();
    return { workflow, reservation, enrollment, grant };
  }

  private grantMatchesStoredTerms(
    grant: NurtureChildLinkGrant,
    reservation: NurtureEnrollmentTrialReservation,
  ): boolean {
    const terms = grant.policySnapshotPayload;
    return validateTrialGrantTermsSnapshotV1(terms) &&
      sameValues(grant.directions, terms.directions) &&
      sameValues(grant.dataClasses, terms.data_classes) &&
      sameValues(grant.purposes, terms.purposes) &&
      grant.expiresAt?.getTime() === reservation.trialEndsAt.getTime() &&
      new Date(terms.expires_at) >= reservation.trialEndsAt;
  }

  async prepareMutation(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentTrialLifecycleFailure> {
    try {
      const loaded = await this.load(mutation);
      if (!("workflow" in loaded)) return loaded;
      const valid = await this.validForMutation(mutation, loaded);
      return valid ?? { status: "ready" };
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return unavailable("trial_lifecycle_owner_unavailable");
    }
  }

  private async validForMutation(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleFailure | null> {
    const { workflow, reservation, enrollment, grant } = loaded;
    const now = this.now();
    if (mutation.kind === "prepare_trial_relationship") {
      if (
        workflow.currentStage !== "trial_preparation" ||
        workflow.waitingState !== "waiting_on_system" ||
        workflow.pendingTransition !== "trial_start_pending" ||
        workflow.childCareProcessId !== null ||
        reservation.state !== "held" ||
        reservation.trialEndsAt <= now ||
        !validateTrialGrantTermsSnapshotV1(mutation.grant_terms_snapshot) ||
        new Date(mutation.grant_terms_snapshot.verified_at) > now ||
        new Date(mutation.grant_terms_snapshot.expires_at) <= now ||
        new Date(mutation.grant_terms_snapshot.expires_at) < reservation.trialEndsAt ||
        !(await this.pairOwner.isTrialGrantTermsCurrent({
          workspace_id: mutation.workspace_id,
          institution_ref: mutation.institution_ref,
          snapshot: mutation.grant_terms_snapshot,
          required_until: reservation.trialEndsAt,
        })) ||
        !(await this.pairOwner.isTrialSnapshotCurrent(
          mutation.workspace_id,
          mutation.pair_owner_snapshot,
        ))
      ) return conflict("trial_relationship_preparation_predicate_failed");
      const group = await this.lockCareGroup({
        workspace_id: mutation.workspace_id,
        institution_ref: mutation.institution_ref,
        care_group_ref: reservation.targetCareGroupId,
      });
      if (!group || group.aggregate_version !== mutation.expected_capacity_revision) {
        return conflict("capacity_source_conflict");
      }
      const current = await this.prisma.nurtureEnrollment.count({
        where: {
          workspaceId: mutation.workspace_id,
          childCareProcessId: mutation.pair_owner_snapshot.child_care_process_ref,
          institutionId: mutation.institution_ref,
          status: { in: ["pending", "active", "paused"] },
          deletedAt: null,
        },
      });
      return current === 0 ? null : conflict("current_enrollment_exists");
    }

    if (!enrollment || !grant) return denied();
    if (mutation.kind === "start_trial") {
      const storedTerms = grant.policySnapshotPayload;
      if (
        workflow.currentStage !== "trial_preparation" ||
        workflow.waitingState !== "waiting_on_system" ||
        workflow.pendingTransition !== "trial_start_pending" ||
        enrollment.status !== "pending" ||
        enrollment.participationPhase !== null ||
        grant.status !== "pending" ||
        reservation.state !== "held" ||
        now < reservation.trialStartsAt ||
        now >= reservation.trialEndsAt ||
        grant.grantedByParticipantId !==
          mutation.pair_owner_snapshot.guardian_participant_ref ||
        !this.grantMatchesStoredTerms(grant, reservation) ||
        !validateTrialGrantTermsSnapshotV1(storedTerms) ||
        !(await this.pairOwner.isTrialGrantTermsCurrent({
          workspace_id: mutation.workspace_id,
          institution_ref: mutation.institution_ref,
          snapshot: storedTerms,
          required_until: reservation.trialEndsAt,
        })) ||
        mutation.pair_owner_snapshot.child_care_process_ref !== enrollment.childCareProcessId ||
        !(await this.pairOwner.isTrialSnapshotCurrent(
          mutation.workspace_id,
          mutation.pair_owner_snapshot,
        ))
      ) return conflict("trial_start_predicate_failed");
      const group = await this.lockCareGroup({
        workspace_id: mutation.workspace_id,
        institution_ref: mutation.institution_ref,
        care_group_ref: reservation.targetCareGroupId,
      });
      return group?.aggregate_version === mutation.expected_capacity_revision
        ? null
        : conflict("capacity_source_conflict");
    }

    if (
      enrollment.status !== "active" ||
      enrollment.participationPhase !== "trial" ||
      grant.status !== "active" ||
      reservation.state !== "converted_to_occupancy" ||
      !this.grantMatchesStoredTerms(grant, reservation)
    ) return conflict("active_trial_predicate_failed");

    switch (mutation.kind) {
      case "mark_trial_review_reached":
        return workflow.currentStage === "trial_in_progress" &&
          now >= reservation.reviewAt
          ? null
          : conflict("trial_review_predicate_failed");
      case "extend_trial": {
        const trialEndsAt = new Date(mutation.trial_ends_at);
        const reviewAt = new Date(mutation.review_at);
        const terms = grant.policySnapshotPayload;
        return workflow.currentStage === "trial_review" &&
          !workflow.completedMilestones.includes("trial_extended") &&
          validateTrialGrantTermsSnapshotV1(terms) &&
          trialEndsAt > reservation.trialEndsAt &&
          trialEndsAt <= new Date(terms.expires_at) &&
          reviewAt > now &&
          reviewAt < trialEndsAt
          ? null
          : conflict("trial_extension_predicate_failed");
      }
      case "propose_formal_enrollment":
        if (workflow.currentStage !== "trial_review") {
          return conflict("formal_proposal_predicate_failed");
        }
        {
          const terms = grant.policySnapshotPayload;
          const proposedStart = new Date(mutation.proposal.proposed_formal_start_at);
          const proposedGrantExpiry = new Date(mutation.proposal.proposed_grant_expires_at);
          const proposalExpiry = new Date(mutation.proposal.proposal_expires_at);
          if (
            !validateTrialGrantTermsSnapshotV1(terms) ||
            proposedStart < now ||
            proposedStart >= proposalExpiry ||
            proposalExpiry > reservation.trialEndsAt ||
            proposedGrantExpiry <= proposedStart ||
            proposedGrantExpiry > new Date(terms.expires_at) ||
            !mutation.proposal.proposed_grant_purposes.every((purpose) =>
              terms.purposes.includes(purpose)
            )
          ) return conflict("formal_proposal_predicate_failed");
          const group = await this.lockCareGroup({
            workspace_id: mutation.workspace_id,
            institution_ref: mutation.institution_ref,
            care_group_ref: reservation.targetCareGroupId,
          });
          if (group?.aggregate_version !== mutation.proposal.expected_capacity_revision) {
            return conflict("capacity_source_conflict");
          }
          const proposalCount = await this.prisma.nurtureEnrollmentFormalProposal.count({
            where: {
              workspaceId: mutation.workspace_id,
              workflowId: workflow.id,
            },
          });
          return proposalCount === 0
            ? null
            : conflict("formal_proposal_head_conflict");
        }
      case "end_trial":
        return [
          "trial_in_progress",
          "trial_review",
          "formal_enrollment_confirmation",
        ].includes(workflow.currentStage)
          ? null
          : conflict("trial_end_predicate_failed");
    }
  }

  async commitMutation(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    try {
      const loaded = await this.load(mutation);
      if (!("workflow" in loaded)) return loaded;
      const invalid = await this.validForMutation(mutation, loaded);
      if (invalid) return invalid;
      switch (mutation.kind) {
        case "prepare_trial_relationship":
          return this.prepareRelationship(mutation, loaded);
        case "start_trial":
          return this.startTrial(mutation, loaded);
        case "mark_trial_review_reached":
          return this.reviewReached(loaded);
        case "extend_trial":
          return this.extendTrial(mutation, loaded);
        case "propose_formal_enrollment":
          return this.proposeFormal(mutation, loaded);
        case "end_trial":
          return this.endTrial(mutation, loaded);
      }
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return hasPrismaErrorCode(error, "P2002", "23514")
        ? conflict("trial_lifecycle_write_conflict")
        : unavailable("trial_lifecycle_write_unavailable");
    }
  }

  private async updateWorkflow(input: {
    workflow: NurtureInstitutionWorkflow;
    data: Prisma.NurtureInstitutionWorkflowUpdateManyMutationInput;
  }): Promise<NurtureInstitutionWorkflow | null> {
    const updated = await this.prisma.nurtureInstitutionWorkflow.updateMany({
      where: {
        id: input.workflow.id,
        workspaceId: input.workflow.workspaceId,
        institutionId: input.workflow.institutionId,
        workflowHead: input.workflow.workflowHead,
        lifecycle: "active",
      },
      data: { ...input.data, workflowHead: { increment: 1 } },
    });
    return updated.count === 1
      ? this.prisma.nurtureInstitutionWorkflow.findUnique({
          where: { id: input.workflow.id },
        })
      : null;
  }

  private committed(input: {
    before: NurtureInstitutionWorkflow;
    after: NurtureInstitutionWorkflow;
    enrollment: NurtureEnrollment;
    grant: NurtureChildLinkGrant;
    reservation: NurtureEnrollmentTrialReservation;
    formalProposal?: NurtureEnrollmentFormalProposal;
    added?: readonly NurtureEnrollmentJourneyMilestone[];
  }): NurtureEnrollmentTrialLifecycleResult {
    return {
      status: "committed",
      before: toSnapshot(input.before),
      workflow: toSnapshot(input.after),
      added_milestones: input.added ?? [],
      enrollment_ref: input.enrollment.id,
      enrollment_head: input.enrollment.aggregateVersion,
      enrollment_status: input.enrollment.status as "pending" | "active" | "ended",
      ...(input.enrollment.participationPhase === "trial"
        ? { participation_phase: "trial" as const }
        : {}),
      grant_ref: input.grant.id,
      grant_head: input.grant.aggregateVersion,
      grant_status: input.grant.status as "pending" | "active" | "revoked",
      reservation_ref: input.reservation.id,
      reservation_head: input.reservation.reservationHead,
      reservation_state: input.reservation.state,
      ...(input.formalProposal
        ? { formal_proposal: toFormalProposal(input.formalProposal) }
        : {}),
    };
  }

  private async prepareRelationship(
    mutation: Extract<NurtureEnrollmentTrialLifecycleMutation, { kind: "prepare_trial_relationship" }>,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const enrollmentId = randomUUID();
    const grantId = randomUUID();
    const childCareProcessId = mutation.pair_owner_snapshot.child_care_process_ref;
    const enrollment = await this.prisma.nurtureEnrollment.create({
      data: {
        id: enrollmentId,
        workspaceId: mutation.workspace_id,
        childCareProcessId,
        institutionId: mutation.institution_ref,
        careGroupId: loaded.reservation.targetCareGroupId,
        status: "pending",
      },
    });
    const grant = await this.prisma.nurtureChildLinkGrant.create({
      data: {
        id: grantId,
        workspaceId: mutation.workspace_id,
        childCareProcessId,
        enrollmentId,
        grantedByParticipantId: mutation.pair_owner_snapshot.guardian_participant_ref,
        grantedToScopeType: "institution",
        grantedToScopeId: mutation.institution_ref,
        directions: [...mutation.grant_terms_snapshot.directions],
        dataClasses: [...mutation.grant_terms_snapshot.data_classes],
        purposes: [...mutation.grant_terms_snapshot.purposes],
        status: "pending",
        expiresAt: loaded.reservation.trialEndsAt,
        policySnapshotPayload: asJson(mutation.grant_terms_snapshot),
      },
    });
    const updated = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "nurture_institution_workflow"
      SET "child_care_process_id" = ${childCareProcessId},
          "workflow_head" = "workflow_head" + 1,
          "updated_at" = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      WHERE "id" = ${loaded.workflow.id}
        AND "workspace_id" = ${loaded.workflow.workspaceId}
        AND "institution_id" = ${loaded.workflow.institutionId}
        AND "lifecycle" = 'active'
        AND "workflow_head" = ${loaded.workflow.workflowHead}
        AND "child_care_process_id" IS NULL
    `);
    const after = updated === 1
      ? await this.prisma.nurtureInstitutionWorkflow.findUnique({
          where: { id: loaded.workflow.id },
        })
      : null;
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: loaded.workflow,
      after,
      enrollment,
      grant,
      reservation: loaded.reservation,
    });
  }

  private async startTrial(
    _mutation: Extract<NurtureEnrollmentTrialLifecycleMutation, { kind: "start_trial" }>,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const now = this.now();
    const reservationUpdate = await this.prisma.nurtureEnrollmentTrialReservation.updateMany({
      where: {
        id: loaded.reservation.id,
        reservationHead: loaded.reservation.reservationHead,
        state: "held",
      },
      data: {
        state: "converted_to_occupancy",
        reservationHead: { increment: 1 },
        convertedAt: now,
      },
    });
    const enrollmentUpdate = await this.prisma.nurtureEnrollment.updateMany({
      where: {
        id: loaded.enrollment!.id,
        aggregateVersion: loaded.enrollment!.aggregateVersion,
        status: "pending",
        participationPhase: null,
      },
      data: {
        status: "active",
        participationPhase: "trial",
        joinedAt: now,
        aggregateVersion: { increment: 1 },
      },
    });
    const grantUpdate = await this.prisma.nurtureChildLinkGrant.updateMany({
      where: {
        id: loaded.grant!.id,
        aggregateVersion: loaded.grant!.aggregateVersion,
        status: "pending",
      },
      data: {
        status: "active",
        effectiveFrom: now,
        aggregateVersion: { increment: 1 },
      },
    });
    if (
      reservationUpdate.count !== 1 ||
      enrollmentUpdate.count !== 1 ||
      grantUpdate.count !== 1
    ) return conflict("trial_start_write_conflict");
    await this.prisma.nurtureParentContextEnrollmentSelection.createMany({
      data: [{
        workspaceId: loaded.workflow.workspaceId,
        childCareProcessId: loaded.enrollment!.childCareProcessId,
        enrollmentId: loaded.enrollment!.id,
        selectedAt: now,
      }],
      skipDuplicates: true,
    });
    const after = await this.updateWorkflow({
      workflow: loaded.workflow,
      data: {
        currentStage: "trial_in_progress",
        waitingState: "ready",
        pendingTransition: "none",
        dueAt: loaded.reservation.reviewAt,
        completedMilestones: { push: "trial_started" },
      },
    });
    return after
      ? this.reloadCommitted(loaded.workflow, after, loaded, ["trial_started"])
      : conflict("workflow_head_conflict");
  }

  private async reviewReached(
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const addMilestone = !loaded.workflow.completedMilestones.includes(
      "trial_review_reached",
    );
    const after = await this.updateWorkflow({
      workflow: loaded.workflow,
      data: {
        currentStage: "trial_review",
        dueAt: loaded.reservation.trialEndsAt,
        ...(addMilestone
          ? { completedMilestones: { push: "trial_review_reached" as const } }
          : {}),
      },
    });
    return after
      ? this.reloadCommitted(
          loaded.workflow,
          after,
          loaded,
          addMilestone ? ["trial_review_reached"] : [],
        )
      : conflict("workflow_head_conflict");
  }

  private async extendTrial(
    mutation: Extract<NurtureEnrollmentTrialLifecycleMutation, { kind: "extend_trial" }>,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const trialEndsAt = new Date(mutation.trial_ends_at);
    const reviewAt = new Date(mutation.review_at);
    const reservationUpdate = await this.prisma.nurtureEnrollmentTrialReservation.updateMany({
      where: {
        id: loaded.reservation.id,
        reservationHead: loaded.reservation.reservationHead,
        state: "converted_to_occupancy",
      },
      data: {
        trialEndsAt,
        reviewAt,
        reservationHead: { increment: 1 },
      },
    });
    const grantUpdate = await this.prisma.nurtureChildLinkGrant.updateMany({
      where: {
        id: loaded.grant!.id,
        aggregateVersion: loaded.grant!.aggregateVersion,
        status: "active",
      },
      data: { expiresAt: trialEndsAt, aggregateVersion: { increment: 1 } },
    });
    if (reservationUpdate.count !== 1 || grantUpdate.count !== 1) {
      return conflict("trial_extension_write_conflict");
    }
    const after = await this.updateWorkflow({
      workflow: loaded.workflow,
      data: {
        currentStage: "trial_in_progress",
        dueAt: reviewAt,
        completedMilestones: { push: "trial_extended" },
      },
    });
    return after
      ? this.reloadCommitted(
          loaded.workflow,
          after,
          loaded,
          ["trial_extended"],
        )
      : conflict("workflow_head_conflict");
  }

  private async proposeFormal(
    mutation: Extract<NurtureEnrollmentTrialLifecycleMutation, { kind: "propose_formal_enrollment" }>,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const after = await this.updateWorkflow({
      workflow: loaded.workflow,
      data: {
        currentStage: "formal_enrollment_confirmation",
        waitingState: "waiting_on_guardian",
        dueAt: loaded.reservation.trialEndsAt,
        completedMilestones: { push: "formal_proposed" },
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    const issuedAt = this.now();
    const formalProposal = await this.prisma.nurtureEnrollmentFormalProposal.create({
      data: {
        id: randomUUID(),
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: loaded.workflow.id,
        enrollmentId: loaded.enrollment!.id,
        grantId: loaded.grant!.id,
        reservationId: loaded.reservation.id,
        careGroupId: loaded.reservation.targetCareGroupId,
        careGroupHead: mutation.proposal.expected_capacity_revision,
        proposalHead: 1,
        proposedFormalStartAt: new Date(mutation.proposal.proposed_formal_start_at),
        proposedGrantPurposes: [...mutation.proposal.proposed_grant_purposes],
        proposedGrantExpiresAt: new Date(mutation.proposal.proposed_grant_expires_at),
        safeFamilySummary: mutation.proposal.safe_family_summary,
        issuedByRoleAssignmentId: mutation.role_assignment_ref,
        issueReasonKey: mutation.proposal.reason_key,
        issuedAt,
        expiresAt: new Date(mutation.proposal.proposal_expires_at),
        createdAt: issuedAt,
      },
    });
    return this.reloadCommitted(
      loaded.workflow,
      after,
      loaded,
      ["formal_proposed"],
      formalProposal,
    );
  }

  private async endTrial(
    mutation: Extract<NurtureEnrollmentTrialLifecycleMutation, { kind: "end_trial" }>,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const now = this.now();
    const group = await this.lockCareGroup({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      care_group_ref: loaded.reservation.targetCareGroupId,
    });
    if (!group) return conflict("capacity_source_conflict");
    const enrollmentUpdate = await this.prisma.nurtureEnrollment.updateMany({
      where: {
        id: loaded.enrollment!.id,
        aggregateVersion: loaded.enrollment!.aggregateVersion,
        status: "active",
        participationPhase: "trial",
      },
      data: {
        status: "ended",
        leftAt: now,
        aggregateVersion: { increment: 1 },
      },
    });
    const grantUpdate = await this.prisma.nurtureChildLinkGrant.updateMany({
      where: {
        id: loaded.grant!.id,
        aggregateVersion: loaded.grant!.aggregateVersion,
        status: "active",
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokedByParticipantId: mutation.participant_ref,
        revokeReason: mutation.reason_key,
        aggregateVersion: { increment: 1 },
      },
    });
    const reservationUpdate = await this.prisma.nurtureEnrollmentTrialReservation.updateMany({
      where: {
        id: loaded.reservation.id,
        reservationHead: loaded.reservation.reservationHead,
        state: "converted_to_occupancy",
      },
      data: {
        state: "released",
        releasedAt: now,
        releaseReasonKey: mutation.reason_key,
        reservationHead: { increment: 1 },
      },
    });
    if (
      enrollmentUpdate.count !== 1 ||
      grantUpdate.count !== 1 ||
      reservationUpdate.count !== 1
    ) return conflict("trial_end_write_conflict");
    await this.prisma.nurtureParentContextEnrollmentSelection.deleteMany({
      where: {
        workspaceId: mutation.workspace_id,
        childCareProcessId: loaded.enrollment!.childCareProcessId,
        enrollmentId: loaded.enrollment!.id,
      },
    });
    const after = await this.updateWorkflow({
      workflow: loaded.workflow,
      data: {
        lifecycle: "closed_without_formalization",
        currentStage: "closed",
        waitingState: "ready",
        pendingTransition: "none",
        terminalOutcome: "trial_ended",
        dueAt: null,
        completedMilestones: { push: "trial_ended" },
      },
    });
    return after
      ? this.reloadCommitted(loaded.workflow, after, loaded, ["trial_ended"])
      : conflict("workflow_head_conflict");
  }

  private async reloadCommitted(
    before: NurtureInstitutionWorkflow,
    after: NurtureInstitutionWorkflow,
    loaded: Loaded,
    added: readonly NurtureEnrollmentJourneyMilestone[],
    formalProposal?: NurtureEnrollmentFormalProposal,
  ): Promise<NurtureEnrollmentTrialLifecycleResult> {
    const [enrollment, grant, reservation] = await Promise.all([
      this.prisma.nurtureEnrollment.findUnique({ where: { id: loaded.enrollment!.id } }),
      this.prisma.nurtureChildLinkGrant.findUnique({ where: { id: loaded.grant!.id } }),
      this.prisma.nurtureEnrollmentTrialReservation.findUnique({
        where: { id: loaded.reservation.id },
      }),
    ]);
    return enrollment && grant && reservation
      ? this.committed({
          before,
          after,
          enrollment,
          grant,
          reservation,
          added,
          ...(formalProposal ? { formalProposal } : {}),
        })
      : unavailable("trial_lifecycle_reload_unavailable");
  }
}
