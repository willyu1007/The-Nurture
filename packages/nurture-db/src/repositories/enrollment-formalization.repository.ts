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
  validateTrialGrantTermsSnapshotV1,
  type NurtureEnrollmentFormalizationFailure,
  type NurtureEnrollmentFormalizationMutation,
  type NurtureEnrollmentFormalizationResult,
  type NurtureEnrollmentFormalizationTransaction,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "@the-nurture/scenario";
import { PrismaEnrollmentPairOwnerRepository } from "./enrollment-pair-owner.repository.js";
import {
  hasPrismaErrorCode,
  isPrismaSerializationAbort,
} from "./prisma-error.js";

type FormalizationPrisma = PrismaClient | Prisma.TransactionClient;

type Loaded = {
  proposal: NurtureEnrollmentFormalProposal;
  workflow: NurtureInstitutionWorkflow;
  enrollment: NurtureEnrollment;
  grant: NurtureChildLinkGrant;
  reservation: NurtureEnrollmentTrialReservation;
  careGroup: { id: string; aggregate_version: number };
};

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
  status: NurtureEnrollmentFormalizationFailure["status"],
  reason_code: string,
): NurtureEnrollmentFormalizationFailure => ({ status, reason_code });
const denied = (reason = "not_authorized") => failure("denied", reason);
const conflict = (reason: string) => failure("conflict", reason);
const unavailable = (reason: string) => failure("unavailable", reason);
const sameValues = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

/**
 * G4-D increment 5 owner. The input contract is validated at this boundary;
 * the I3 My-Chat adapter will authenticate its evidence before calling it.
 * This repository reasserts every local current fact and commits the existing
 * relationship heads atomically without network I/O.
 */
export class PrismaEnrollmentFormalizationRepository
  implements NurtureEnrollmentFormalizationTransaction
{
  constructor(
    private readonly prisma: FormalizationPrisma,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async prepareMutation(
    mutation: NurtureEnrollmentFormalizationMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentFormalizationFailure> {
    try {
      const loaded = await this.load(mutation, false);
      if (!("proposal" in loaded)) return loaded;
      const invalid = await this.validateCurrent(mutation, loaded);
      return invalid ?? { status: "ready" };
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return unavailable("formalization_owner_unavailable");
    }
  }

  async commitMutation(
    mutation: NurtureEnrollmentFormalizationMutation,
  ): Promise<NurtureEnrollmentFormalizationResult> {
    try {
      const loaded = await this.load(mutation, true);
      if (!("proposal" in loaded)) return loaded;
      const invalid = await this.validateCurrent(mutation, loaded);
      if (invalid) return invalid;

      const enrollmentWrite = await this.prisma.nurtureEnrollment.updateMany({
        where: {
          id: loaded.enrollment.id,
          workspaceId: mutation.workspace_id,
          aggregateVersion: mutation.expected_enrollment_head,
          status: "active",
          participationPhase: "trial",
          deletedAt: null,
        },
        data: {
          participationPhase: "formal",
          aggregateVersion: { increment: 1 },
        },
      });
      const grantWrite = await this.prisma.nurtureChildLinkGrant.updateMany({
        where: {
          id: loaded.grant.id,
          workspaceId: mutation.workspace_id,
          aggregateVersion: mutation.expected_grant_head,
          status: "active",
          deletedAt: null,
        },
        data: {
          purposes: [...loaded.proposal.proposedGrantPurposes],
          expiresAt: loaded.proposal.proposedGrantExpiresAt,
          aggregateVersion: { increment: 1 },
        },
      });
      if (enrollmentWrite.count !== 1 || grantWrite.count !== 1) {
        return conflict("formalization_entity_write_conflict");
      }
      const selectedAt = this.now();
      await this.prisma.nurtureParentContextEnrollmentSelection.upsert({
        where: {
          workspaceId_childCareProcessId: {
            workspaceId: mutation.workspace_id,
            childCareProcessId: loaded.enrollment.childCareProcessId,
          },
        },
        create: {
          workspaceId: mutation.workspace_id,
          childCareProcessId: loaded.enrollment.childCareProcessId,
          enrollmentId: loaded.enrollment.id,
          selectedAt,
        },
        update: {
          enrollmentId: loaded.enrollment.id,
          selectedAt,
          aggregateVersion: { increment: 1 },
        },
      });

      const addedMilestones = [
        "guardian_formal_acceptance_recorded",
        "formal_enrollment_committed",
        "journey_completed",
      ] as const;
      const workflowWrite = await this.prisma.nurtureInstitutionWorkflow.updateMany({
        where: {
          id: loaded.workflow.id,
          workspaceId: mutation.workspace_id,
          workflowHead: mutation.expected_workflow_head,
          lifecycle: "active",
          currentStage: "formal_enrollment_confirmation",
        },
        data: {
          lifecycle: "completed",
          currentStage: "completed",
          waitingState: "ready",
          pendingTransition: "none",
          terminalOutcome: "formalized",
          dueAt: null,
          completedMilestones: [
            ...loaded.workflow.completedMilestones,
            ...addedMilestones,
          ],
          workflowHead: { increment: 1 },
        },
      });
      if (workflowWrite.count !== 1) return conflict("workflow_head_conflict");

      const [workflow, enrollment, grant] = await Promise.all([
        this.prisma.nurtureInstitutionWorkflow.findUnique({
          where: { id: loaded.workflow.id },
        }),
        this.prisma.nurtureEnrollment.findUnique({
          where: { id: loaded.enrollment.id },
        }),
        this.prisma.nurtureChildLinkGrant.findUnique({
          where: { id: loaded.grant.id },
        }),
      ]);
      if (!workflow || !enrollment || !grant || !grant.expiresAt) {
        return unavailable("formalization_reload_unavailable");
      }
      return {
        status: "committed",
        before: toSnapshot(loaded.workflow),
        workflow: toSnapshot(workflow),
        added_milestones: addedMilestones,
        proposal_ref: loaded.proposal.id,
        proposal_head: 1,
        enrollment_ref: enrollment.id,
        enrollment_head: enrollment.aggregateVersion,
        grant_ref: grant.id,
        grant_head: grant.aggregateVersion,
        grant_purposes: grant.purposes,
        grant_expires_at: grant.expiresAt.toISOString(),
        reservation_ref: loaded.reservation.id,
        reservation_head: loaded.reservation.reservationHead,
        care_group_ref: loaded.careGroup.id,
        actor_ref: mutation.owner_evidence.actor_ref,
        acceptance_ref: mutation.acceptance_ref,
        owner_evidence_hash:
          mutation.owner_evidence.current_owner_evidence.current_owner_evidence_hash,
      };
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return hasPrismaErrorCode(error, "P2002", "23514")
        ? conflict("formalization_write_conflict")
        : unavailable("formalization_write_unavailable");
    }
  }

  private async load(
    mutation: NurtureEnrollmentFormalizationMutation,
    lock: boolean,
  ): Promise<Loaded | NurtureEnrollmentFormalizationFailure> {
    const proposal = await this.prisma.nurtureEnrollmentFormalProposal.findFirst({
      where: {
        id: mutation.proposal_ref,
        workspaceId: mutation.workspace_id,
        workflowId: mutation.workflow_ref,
      },
    });
    if (!proposal) return denied();
    if (proposal.proposalHead !== mutation.expected_proposal_head) {
      return conflict("formal_proposal_head_conflict");
    }
    if (lock) await this.lockExact(proposal);

    const [workflow, enrollment, grant, reservation, careGroup] =
      await Promise.all([
        this.prisma.nurtureInstitutionWorkflow.findFirst({
          where: {
            id: proposal.workflowId,
            workspaceId: mutation.workspace_id,
            institutionId: proposal.institutionId,
            workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
          },
        }),
        this.prisma.nurtureEnrollment.findFirst({
          where: {
            id: proposal.enrollmentId,
            workspaceId: mutation.workspace_id,
            institutionId: proposal.institutionId,
            deletedAt: null,
          },
        }),
        this.prisma.nurtureChildLinkGrant.findFirst({
          where: {
            id: proposal.grantId,
            workspaceId: mutation.workspace_id,
            deletedAt: null,
          },
        }),
        this.prisma.nurtureEnrollmentTrialReservation.findFirst({
          where: {
            id: proposal.reservationId,
            workspaceId: mutation.workspace_id,
            institutionId: proposal.institutionId,
            workflowId: proposal.workflowId,
          },
        }),
        this.prisma.nurtureCareGroup.findFirst({
          where: {
            id: proposal.careGroupId,
            workspaceId: mutation.workspace_id,
            institutionId: proposal.institutionId,
            status: "active",
            deletedAt: null,
          },
          select: { id: true, aggregateVersion: true },
        }),
      ]);
    if (!workflow || !enrollment || !grant || !reservation || !careGroup) return denied();
    if (
      workflow.workflowHead !== mutation.expected_workflow_head ||
      enrollment.aggregateVersion !== mutation.expected_enrollment_head ||
      grant.aggregateVersion !== mutation.expected_grant_head ||
      reservation.reservationHead !== mutation.expected_reservation_head
    ) return conflict("formalization_entity_head_conflict");
    return {
      proposal,
      workflow,
      enrollment,
      grant,
      reservation,
      careGroup: { id: careGroup.id, aggregate_version: careGroup.aggregateVersion },
    };
  }

  private async lockExact(proposal: NurtureEnrollmentFormalProposal): Promise<void> {
    await this.prisma.$queryRaw(Prisma.sql`
      SELECT proposal."id"
      FROM "nurture_enrollment_formal_proposal" proposal
      JOIN "nurture_institution_workflow" workflow
        ON workflow."id" = proposal."workflow_id"
      JOIN "nurture_enrollment" enrollment
        ON enrollment."id" = proposal."enrollment_id"
      JOIN "nurture_child_link_grant" grant_row
        ON grant_row."id" = proposal."grant_id"
      JOIN "nurture_enrollment_trial_reservation" reservation
        ON reservation."id" = proposal."reservation_id"
      JOIN "nurture_care_group" care_group
        ON care_group."id" = proposal."care_group_id"
      WHERE proposal."id" = ${proposal.id}
      FOR UPDATE OF proposal, workflow, enrollment, grant_row, reservation, care_group
    `);
  }

  private async validateCurrent(
    mutation: NurtureEnrollmentFormalizationMutation,
    loaded: Loaded,
  ): Promise<NurtureEnrollmentFormalizationFailure | null> {
    const { proposal, workflow, enrollment, grant, reservation, careGroup } = loaded;
    const now = this.now();
    const acceptedAt = new Date(mutation.accepted_at);
    const terms = grant.policySnapshotPayload;
    if (
      workflow.lifecycle !== "active" ||
      workflow.currentStage !== "formal_enrollment_confirmation" ||
      workflow.waitingState !== "waiting_on_guardian" ||
      workflow.pendingTransition !== "none" ||
      workflow.childCareProcessId === null ||
      enrollment.childCareProcessId !== workflow.childCareProcessId ||
      enrollment.careGroupId !== proposal.careGroupId ||
      enrollment.status !== "active" ||
      enrollment.participationPhase !== "trial" ||
      grant.enrollmentId !== enrollment.id ||
      grant.childCareProcessId !== enrollment.childCareProcessId ||
      grant.grantedToScopeType !== "institution" ||
      grant.grantedToScopeId !== proposal.institutionId ||
      grant.status !== "active" ||
      reservation.targetCareGroupId !== proposal.careGroupId ||
      reservation.state !== "converted_to_occupancy" ||
      careGroup.aggregate_version !== proposal.careGroupHead ||
      !validateTrialGrantTermsSnapshotV1(terms) ||
      !sameValues(grant.directions, terms.directions) ||
      !sameValues(grant.dataClasses, terms.data_classes) ||
      !sameValues(grant.purposes, terms.purposes) ||
      grant.expiresAt?.getTime() !== reservation.trialEndsAt.getTime() ||
      !proposal.proposedGrantPurposes.every((purpose) => terms.purposes.includes(purpose)) ||
      proposal.proposedGrantExpiresAt > new Date(terms.expires_at) ||
      proposal.proposedGrantExpiresAt <= proposal.proposedFormalStartAt ||
      proposal.proposedFormalStartAt < reservation.trialStartsAt ||
      proposal.proposedFormalStartAt > now ||
      proposal.issuedAt > acceptedAt ||
      acceptedAt >= proposal.expiresAt ||
      acceptedAt > now
    ) return conflict("formalization_predicate_failed");

    if (new Date(mutation.owner_evidence.verified_at) < acceptedAt) {
      return denied("formalization_owner_not_current");
    }

    const guardian = await new PrismaEnrollmentPairOwnerRepository(
      this.prisma,
      this.now,
    ).resolveFormalizationGuardian({
      workspace_id: mutation.workspace_id,
      child_care_process_ref: workflow.childCareProcessId,
      actor_object_id: mutation.actor_object_id,
      evidence: mutation.owner_evidence,
    });
    return guardian ? null : denied("formalization_owner_not_current");
  }
}
