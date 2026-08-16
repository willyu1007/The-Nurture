import { randomUUID } from "node:crypto";
import {
  Prisma,
  type NurtureEnrollmentTrialReservation,
  type NurtureInstitutionWorkflow,
  type PrismaClient,
} from "@prisma/client";
import {
  NURTURE_DEFAULT_WAITLIST_POLICY_REF,
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
  NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION,
  validateEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureAdminWaitlistEntryProjectionV1,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
  type NurtureEnrollmentWaitlistActor,
  type NurtureEnrollmentWaitlistEntityStateV1,
  type NurtureEnrollmentWaitlistMutation,
  type NurtureEnrollmentWaitlistMutationFailure,
  type NurtureEnrollmentWaitlistMutationResult,
  type NurtureEnrollmentWaitlistOverrideDraftV1,
  type NurtureEnrollmentWaitlistQueryRepository,
  type NurtureEnrollmentWaitlistTransaction,
  type NurtureFamilyWaitlistProjectionV1,
} from "@the-nurture/scenario";
import { NurtureInstitutionAuthorityChain } from "@the-nurture/scenario";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import {
  hasPrismaErrorCode,
  isPrismaSerializationAbort,
} from "./prisma-error.js";
import { asJson } from "./prisma-json.js";

type WaitlistPrisma = PrismaClient | Prisma.TransactionClient;

const workflowCarrierArgs = Prisma.validator<Prisma.NurtureInstitutionWorkflowDefaultArgs>()({
  include: { inquiry: true },
});
type WorkflowCarrier = Prisma.NurtureInstitutionWorkflowGetPayload<
  typeof workflowCarrierArgs
>;

const entryCarrierArgs = Prisma.validator<Prisma.NurtureEnrollmentWaitlistEntryDefaultArgs>()({
  include: { currentOffer: true, targetCareGroup: true },
});
type EntryCarrier = Prisma.NurtureEnrollmentWaitlistEntryGetPayload<
  typeof entryCarrierArgs
>;

type CurrentPolicy = {
  id?: string;
  policyRef: string;
  policyRevision: number;
  categoryKeys: readonly string[];
  offerValidityMinMinutes: number;
  offerValidityMaxMinutes: number;
};

type LoadedMutation = {
  workflow: WorkflowCarrier;
  entry?: EntryCarrier;
  offer?: NonNullable<EntryCarrier["currentOffer"]>;
  reservation?: NurtureEnrollmentTrialReservation;
};

type AuthorizationResult =
  | { status: "resolved" }
  | { status: "denied" | "unavailable"; reason_code: string };

const MAX_ADMIN_WAITLIST_ENTRIES = 500;

const canonicalRefEqual = (left: Prisma.JsonValue, right: unknown): boolean => {
  if (!right || typeof right !== "object") return false;
  const candidate = right as {
    schema_version?: unknown;
    namespace?: unknown;
    object_type?: unknown;
    object_id?: unknown;
    version?: unknown;
  };
  if (!left || typeof left !== "object" || Array.isArray(left)) return false;
  const stored = left as Prisma.JsonObject;
  return (
    stored.schema_version === candidate.schema_version &&
    stored.namespace === candidate.namespace &&
    stored.object_type === candidate.object_type &&
    stored.object_id === candidate.object_id &&
    stored.version === candidate.version
  );
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

const conflict = (
  reasonCode: string,
): Extract<NurtureEnrollmentWaitlistMutationFailure, { status: "conflict" }> => ({
  status: "conflict",
  reason_code: reasonCode,
});

const denied = (
  reasonCode = "not_authorized",
): Extract<NurtureEnrollmentWaitlistMutationFailure, { status: "denied" }> => ({
  status: "denied",
  reason_code: reasonCode,
});

const unavailable = (
  reasonCode: string,
): Extract<NurtureEnrollmentWaitlistMutationFailure, { status: "unavailable" }> => ({
  status: "unavailable",
  reason_code: reasonCode,
});

const guardianActionAt = (
  actor: Extract<NurtureEnrollmentWaitlistActor, { kind: "guardian" }>,
): Date => new Date(actor.owner_snapshot.occurred_at);

const entryState = (
  entry: Pick<EntryCarrier, "id" | "entryHead">,
  lifecycle: NurtureEnrollmentWaitlistEntityStateV1["entry_lifecycle"],
  head = entry.entryHead + 1,
): NurtureEnrollmentWaitlistEntityStateV1 => ({
  entry_ref: entry.id,
  entry_head: head,
  entry_lifecycle: lifecycle,
});

const offerState = (
  entry: Pick<EntryCarrier, "id" | "entryHead">,
  entryLifecycle: NurtureEnrollmentWaitlistEntityStateV1["entry_lifecycle"],
  offerRef: string,
  offerHead: number,
  offerLifecycle: NonNullable<
    NurtureEnrollmentWaitlistEntityStateV1["offer_lifecycle"]
  >,
): NurtureEnrollmentWaitlistEntityStateV1 => ({
  ...entryState(entry, entryLifecycle),
  offer_ref: offerRef,
  offer_head: offerHead,
  offer_lifecycle: offerLifecycle,
});

/**
 * Exact-class owner for G4-D's waitlist/preparation slice. The class row is
 * locked before offer/reservation capacity decisions; all writes still live
 * inside the outer serializable Nurture command transaction.
 */
export class PrismaEnrollmentWaitlistRepository
  implements NurtureEnrollmentWaitlistTransaction, NurtureEnrollmentWaitlistQueryRepository
{
  constructor(
    private readonly prisma: WaitlistPrisma,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async resolveAdmin(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
  }): Promise<AuthorizationResult> {
    const authority = await new NurtureInstitutionAuthorityChain(
      new PrismaInstitutionContextRepository(this.prisma),
    ).resolve({
      workspace_id: input.workspace_id,
      participant_ref: input.participant_ref,
      role_assignment_ref: input.role_assignment_ref,
      at: this.now().toISOString(),
    });
    if (authority.status !== "resolved") {
      return authority.reason_code === "policy_unavailable"
        ? unavailable(authority.reason_code)
        : denied();
    }
    return authority.institution_scope.institution_ref === input.institution_ref &&
      authority.active_role.role_kind === "institution_admin" &&
      authority.active_role.role_assignment_ref === input.role_assignment_ref
      ? { status: "resolved" }
      : denied();
  }

  private guardianMatches(input: {
    actor: Extract<NurtureEnrollmentWaitlistActor, { kind: "guardian" }>;
    inquiry: NonNullable<WorkflowCarrier["inquiry"]>;
  }): boolean {
    const snapshot = input.actor.owner_snapshot;
    const now = this.now().toISOString();
    return (
      validateEnrollmentGuardianActionOwnerSnapshotV1(snapshot) &&
      snapshot.actor_ref.object_id === input.actor.participant_ref &&
      snapshot.occurred_at <= now &&
      snapshot.verified_at <= now &&
      canonicalRefEqual(input.inquiry.hostContactRef, snapshot.contact_ref)
    );
  }

  private async actorAuthorized(
    mutation: NurtureEnrollmentWaitlistMutation,
    workflow: WorkflowCarrier,
  ): Promise<AuthorizationResult> {
    if (!workflow.inquiry) return denied();
    return mutation.actor.kind === "institution_admin"
      ? this.resolveAdmin({
          workspace_id: mutation.workspace_id,
          institution_ref: mutation.institution_ref,
          participant_ref: mutation.actor.participant_ref,
          role_assignment_ref: mutation.actor.role_assignment_ref,
        })
      : this.guardianMatches({ actor: mutation.actor, inquiry: workflow.inquiry })
        ? { status: "resolved" }
        : denied("guardian_owner_mismatch");
  }

  private async loadMutation(
    mutation: NurtureEnrollmentWaitlistMutation,
  ): Promise<LoadedMutation | NurtureEnrollmentWaitlistMutationFailure> {
    const workflow = await this.prisma.nurtureInstitutionWorkflow.findFirst({
      where: {
        id: mutation.workflow_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
      },
      ...workflowCarrierArgs,
    });
    if (!workflow?.inquiry) return denied();
    const authorization = await this.actorAuthorized(mutation, workflow);
    if (authorization.status !== "resolved") return authorization;
    if (
      workflow.lifecycle !== "active" ||
      workflow.workflowHead !== mutation.expected_workflow_head
    ) {
      return conflict("workflow_head_conflict");
    }

    if (mutation.kind === "qualify_capacity_waitlist") return { workflow };
    const entry = await this.prisma.nurtureEnrollmentWaitlistEntry.findFirst({
      where: {
        id: mutation.entry_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: mutation.workflow_ref,
      },
      ...entryCarrierArgs,
    });
    if (!entry) return denied();
    if (entry.entryHead !== mutation.expected_entry_head) {
      return conflict("waitlist_entry_head_conflict");
    }
    if (!("offer_ref" in mutation)) return { workflow, entry };
    const offer = entry.currentOffer;
    if (
      !offer ||
      offer.id !== mutation.offer_ref ||
      offer.offerHead !== mutation.expected_offer_head
    ) {
      return conflict("trial_offer_head_conflict");
    }
    if (!("reservation_ref" in mutation)) return { workflow, entry, offer };
    const reservation = await this.prisma.nurtureEnrollmentTrialReservation.findFirst({
      where: {
        id: mutation.reservation_ref,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: mutation.workflow_ref,
        entryId: mutation.entry_ref,
        offerId: mutation.offer_ref,
      },
    });
    if (
      !reservation ||
      reservation.reservationHead !== mutation.expected_reservation_head
    ) {
      return conflict("trial_reservation_head_conflict");
    }
    return { workflow, entry, offer, reservation };
  }

  async prepareMutation(
    mutation: NurtureEnrollmentWaitlistMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentWaitlistMutationFailure> {
    try {
      const loaded = await this.loadMutation(mutation);
      return "workflow" in loaded ? { status: "ready" } : loaded;
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return unavailable("waitlist_owner_unavailable");
    }
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

  private async capacityUse(input: {
    workspace_id: string;
    care_group_ref: string;
  }): Promise<{ occupancy: number; held: number }> {
    const [occupancy, held] = await Promise.all([
      this.prisma.nurtureEnrollment.count({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          status: "active",
          deletedAt: null,
        },
      }),
      this.prisma.nurtureEnrollmentTrialReservation.count({
        where: {
          workspaceId: input.workspace_id,
          targetCareGroupId: input.care_group_ref,
          state: "held",
        },
      }),
    ]);
    return { occupancy, held };
  }

  private async currentPolicy(input: {
    workspace_id: string;
    institution_ref: string;
    at: Date;
  }): Promise<CurrentPolicy> {
    const rows = await this.prisma.nurtureEnrollmentWaitlistPolicy.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        effectiveFrom: { lte: input.at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: input.at } }],
      },
      orderBy: [{ effectiveFrom: "desc" }, { policyRevision: "desc" }],
      take: 1,
    });
    const row = rows[0];
    return row
      ? {
          id: row.id,
          policyRef: row.policyRef,
          policyRevision: row.policyRevision,
          categoryKeys: row.categoryKeys,
          offerValidityMinMinutes: row.offerValidityMinMinutes,
          offerValidityMaxMinutes: row.offerValidityMaxMinutes,
        }
      : {
          policyRef: NURTURE_DEFAULT_WAITLIST_POLICY_REF,
          policyRevision: 0,
          categoryKeys: ["standard"],
          offerValidityMinMinutes: 60,
          offerValidityMaxMinutes: 10_080,
        };
  }

  private async updateWorkflow(input: {
    workflow: WorkflowCarrier;
    data: Prisma.NurtureInstitutionWorkflowUpdateManyMutationInput;
  }): Promise<NurtureInstitutionWorkflow | null> {
    const updated = await this.prisma.nurtureInstitutionWorkflow.updateMany({
      where: {
        id: input.workflow.id,
        workspaceId: input.workflow.workspaceId,
        institutionId: input.workflow.institutionId,
        lifecycle: "active",
        workflowHead: input.workflow.workflowHead,
      },
      data: { ...input.data, workflowHead: { increment: 1 } },
    });
    if (updated.count !== 1) return null;
    return this.prisma.nurtureInstitutionWorkflow.findUnique({
      where: { id: input.workflow.id },
    });
  }

  private committed(input: {
    before: WorkflowCarrier;
    after: NurtureInstitutionWorkflow;
    entities: Extract<NurtureEnrollmentWaitlistMutationResult, { status: "committed" }>["entities"];
    added_milestones?: readonly (
      NurtureEnrollmentJourneyWorkflowSnapshotV1["completed_milestones"][number]
    )[];
    override?: NurtureEnrollmentWaitlistOverrideDraftV1;
  }): NurtureEnrollmentWaitlistMutationResult {
    return {
      status: "committed",
      before: toSnapshot(input.before),
      workflow: toSnapshot(input.after),
      added_milestones: input.added_milestones ?? [],
      entities: input.entities,
      ...(input.override ? { override: input.override } : {}),
    };
  }

  async commitMutation(
    mutation: NurtureEnrollmentWaitlistMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    try {
      const loaded = await this.loadMutation(mutation);
      if (!("workflow" in loaded)) return loaded;
      switch (mutation.kind) {
        case "qualify_capacity_waitlist":
          return this.qualify(mutation, loaded.workflow);
        case "review_waitlist_interest":
          return this.review(mutation, loaded);
        case "override_waitlist_category":
          return this.overrideCategory(mutation, loaded);
        case "issue_trial_offer":
          return this.issueOffer(mutation, loaded);
        case "accept_trial_offer":
          return this.acceptOffer(mutation, loaded);
        case "decline_or_expire_trial_offer":
          return this.closeOffer(mutation, loaded);
        case "withdraw_from_waitlist":
          return this.withdraw(mutation, loaded);
        case "cancel_trial_preparation":
          return this.cancelPreparation(mutation, loaded);
      }
    } catch (error) {
      if (isPrismaSerializationAbort(error)) throw error;
      return hasPrismaErrorCode(error, "P2002")
        ? conflict("waitlist_write_conflict")
        : unavailable("waitlist_write_unavailable");
    }
  }

  private async qualify(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "qualify_capacity_waitlist" }>,
    workflow: WorkflowCarrier,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const now = this.now();
    const inquiry = workflow.inquiry!;
    if (
      !["intent_conversation", "visit_or_consultation"].includes(workflow.currentStage) ||
      !workflow.completedMilestones.includes("intent_confirmed") ||
      workflow.completedMilestones.includes("waitlist_qualified") ||
      inquiry.targetCareGroupId !== mutation.target_care_group_ref ||
      !canonicalRefEqual(inquiry.hostContactRef, mutation.family_acceptance.contact_ref) ||
      !validateEnrollmentGuardianActionOwnerSnapshotV1(mutation.family_acceptance) ||
      mutation.family_acceptance.occurred_at > now.toISOString() ||
      mutation.family_acceptance.verified_at > now.toISOString() ||
      new Date(mutation.next_review_at) <= now
    ) {
      return conflict("waitlist_qualification_predicate_failed");
    }
    const existing = await this.prisma.nurtureEnrollmentWaitlistEntry.count({
      where: {
        workspaceId: mutation.workspace_id,
        workflowId: workflow.id,
        lifecycle: { in: ["active", "offer_open"] },
      },
    });
    if (existing !== 0) return conflict("active_waitlist_entry_exists");

    const group = await this.lockCareGroup({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      care_group_ref: mutation.target_care_group_ref,
    });
    if (
      !group || group.capacity === null || group.capacity < 1 ||
      group.aggregate_version !== mutation.expected_capacity_revision
    ) return conflict("capacity_source_conflict");
    const usage = await this.capacityUse({
      workspace_id: mutation.workspace_id,
      care_group_ref: group.id,
    });
    if (usage.occupancy + usage.held < group.capacity) {
      return conflict("target_class_not_full");
    }

    const policy = await this.currentPolicy({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      at: now,
    });
    const categoryOrder = policy.categoryKeys.indexOf(mutation.category_key);
    if (categoryOrder < 0) return denied("waitlist_category_not_allowed");

    const entry = await this.prisma.nurtureEnrollmentWaitlistEntry.create({
      data: {
        id: randomUUID(),
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: workflow.id,
        inquiryId: inquiry.id,
        targetCareGroupId: group.id,
        policyId: policy.id,
        policyRef: policy.policyRef,
        policyRevision: policy.policyRevision,
        categoryKey: mutation.category_key,
        categoryOrder,
        categoryBasisKey: mutation.category_basis_key,
        expectedEntryStartDate: inquiry.expectedEntryStartDate,
        expectedEntryEndDate: inquiry.expectedEntryEndDate,
        waitlistQualifiedAt: now,
        orderKey: randomUUID(),
        capacitySourceRevision: group.aggregate_version,
        qualifiedOccupancyCount: usage.occupancy + usage.held,
        familyAcceptanceActionRef: asJson(mutation.family_acceptance.action_ref),
        familyAcceptanceActorRef: asJson(mutation.family_acceptance.actor_ref),
        familyContactRef: asJson(mutation.family_acceptance.contact_ref),
        familyAcceptedAt: new Date(mutation.family_acceptance.occurred_at),
        interestState: "confirmed",
        nextReviewAt: new Date(mutation.next_review_at),
        lastConfirmedAt: new Date(mutation.family_acceptance.occurred_at),
        lifecycle: "active",
        entryHead: 1,
      },
    });
    const after = await this.updateWorkflow({
      workflow,
      data: {
        currentStage: "capacity_waitlist",
        waitingState: "ready",
        pendingTransition: "none",
        completedMilestones: { push: "waitlist_qualified" },
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      added_milestones: ["waitlist_qualified"],
      entities: entryState(entry, entry.lifecycle, entry.entryHead),
    });
  }

  private async review(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "review_waitlist_interest" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry } = loaded;
    const now = this.now();
    const guardianOccurredAt =
      mutation.actor.kind === "guardian"
        ? guardianActionAt(mutation.actor)
        : undefined;
    const reviewFloor = entry?.lastReviewedAt && entry.lastReviewedAt > entry.lastConfirmedAt
      ? entry.lastReviewedAt
      : entry?.lastConfirmedAt;
    if (
      !entry || entry.lifecycle !== "active" ||
      workflow.currentStage !== "capacity_waitlist" ||
      new Date(mutation.next_review_at) <= now ||
      (mutation.interest_state === "confirmed" && mutation.actor.kind !== "guardian") ||
      (mutation.interest_state === "unanswered" && mutation.actor.kind !== "institution_admin") ||
      (guardianOccurredAt !== undefined && reviewFloor !== undefined &&
        guardianOccurredAt < reviewFloor)
    ) return conflict("waitlist_review_state_conflict");
    const confirmedAt =
      mutation.actor.kind === "guardian"
        ? guardianOccurredAt!
        : entry.lastConfirmedAt;
    const updated = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "active" },
      data: {
        interestState:
          mutation.interest_state === "confirmed" ? "confirmed" : "waiting_on_guardian",
        nextReviewAt: new Date(mutation.next_review_at),
        lastReviewedAt: now,
        lastConfirmedAt: confirmedAt,
        entryHead: { increment: 1 },
      },
    });
    if (updated.count !== 1) return conflict("waitlist_entry_head_conflict");
    const after = await this.updateWorkflow({
      workflow,
      data: {
        waitingState:
          mutation.interest_state === "confirmed" ? "ready" : "waiting_on_guardian",
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      entities: entryState(entry, "active"),
    });
  }

  private async overrideCategory(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "override_waitlist_category" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry } = loaded;
    const now = this.now();
    if (
      !entry || entry.lifecycle !== "active" ||
      workflow.currentStage !== "capacity_waitlist" ||
      mutation.actor.kind !== "institution_admin"
    ) return conflict("waitlist_override_state_conflict");
    const policy = await this.currentPolicy({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      at: now,
    });
    const categoryOrder = policy.categoryKeys.indexOf(mutation.category_key);
    if (categoryOrder < 0) return denied("waitlist_category_not_allowed");
    if (
      entry.policyRef === policy.policyRef &&
      entry.policyRevision === policy.policyRevision &&
      entry.categoryKey === mutation.category_key &&
      entry.categoryBasisKey === mutation.category_basis_key
    ) return conflict("waitlist_override_no_change");

    const updated = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "active" },
      data: {
        policyId: policy.id,
        policyRef: policy.policyRef,
        policyRevision: policy.policyRevision,
        categoryKey: mutation.category_key,
        categoryOrder,
        categoryBasisKey: mutation.category_basis_key,
        entryHead: { increment: 1 },
      },
    });
    if (updated.count !== 1) return conflict("waitlist_entry_head_conflict");
    const after = await this.updateWorkflow({ workflow, data: {} });
    if (!after) return conflict("workflow_head_conflict");
    const override: NurtureEnrollmentWaitlistOverrideDraftV1 = {
      override_ref: randomUUID(),
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      entry_ref: entry.id,
      entry_head_before: entry.entryHead,
      entry_head_after: entry.entryHead + 1,
      before_policy_ref: entry.policyRef,
      before_policy_revision: entry.policyRevision,
      before_category_key: entry.categoryKey,
      before_category_order: entry.categoryOrder,
      after_policy_ref: policy.policyRef,
      after_policy_revision: policy.policyRevision,
      after_category_key: mutation.category_key,
      after_category_order: categoryOrder,
      after_category_basis_key: mutation.category_basis_key,
      actor_role_assignment_ref: mutation.actor.role_assignment_ref,
      reason_key: mutation.reason_key,
    };
    return this.committed({
      before: workflow,
      after,
      override,
      entities: entryState(entry, "active"),
    });
  }

  private async issueOffer(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "issue_trial_offer" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry } = loaded;
    const now = this.now();
    if (
      !entry || mutation.actor.kind !== "institution_admin" ||
      workflow.currentStage !== "capacity_waitlist" || entry.lifecycle !== "active" ||
      entry.interestState !== "confirmed" || entry.currentOfferId !== null ||
      entry.nextReviewAt <= now
    ) return conflict("trial_offer_state_conflict");
    const group = await this.lockCareGroup({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      care_group_ref: entry.targetCareGroupId,
    });
    if (!group || group.capacity === null || group.capacity < 1) {
      return conflict("capacity_source_conflict");
    }
    const policy = await this.currentPolicy({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      at: now,
    });
    const validityMinutes =
      (new Date(mutation.expires_at).getTime() - now.getTime()) / 60_000;
    if (
      validityMinutes < policy.offerValidityMinMinutes ||
      validityMinutes > policy.offerValidityMaxMinutes
    ) return conflict("trial_offer_validity_out_of_bounds");
    const usage = await this.capacityUse({
      workspace_id: mutation.workspace_id,
      care_group_ref: group.id,
    });
    const openOffers = await this.prisma.nurtureEnrollmentTrialOffer.count({
      where: {
        workspaceId: mutation.workspace_id,
        targetCareGroupId: group.id,
        lifecycle: "open",
      },
    });
    if (usage.occupancy + usage.held + openOffers >= group.capacity) {
      return conflict("trial_offer_capacity_conflict");
    }
    const firstEligible = await this.prisma.nurtureEnrollmentWaitlistEntry.findFirst({
      where: {
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        targetCareGroupId: group.id,
        lifecycle: "active",
        interestState: "confirmed",
        currentOfferId: null,
        nextReviewAt: { gt: now },
      },
      orderBy: [
        { categoryOrder: "asc" },
        { waitlistQualifiedAt: "asc" },
        { orderKey: "asc" },
      ],
      select: { id: true },
    });
    if (firstEligible?.id !== entry.id) return conflict("waitlist_order_conflict");
    const offerRef = randomUUID();
    await this.prisma.nurtureEnrollmentTrialOffer.create({
      data: {
        id: offerRef,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: workflow.id,
        entryId: entry.id,
        targetCareGroupId: group.id,
        issuedByRoleAssignmentId: mutation.actor.role_assignment_ref,
        issuedAt: now,
        expiresAt: new Date(mutation.expires_at),
        trialStartsAt: new Date(mutation.trial_starts_at),
        trialEndsAt: new Date(mutation.trial_ends_at),
        reviewAt: new Date(mutation.review_at),
        lifecycle: "open",
        offerHead: 1,
      },
    });
    const entryUpdate = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "active" },
      data: {
        lifecycle: "offer_open",
        currentOfferId: offerRef,
        entryHead: { increment: 1 },
      },
    });
    if (entryUpdate.count !== 1) return conflict("waitlist_entry_head_conflict");
    const after = await this.updateWorkflow({ workflow, data: {} });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      entities: offerState(entry, "offer_open", offerRef, 1, "open"),
    });
  }

  private async acceptOffer(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "accept_trial_offer" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry, offer } = loaded;
    const now = this.now();
    if (
      !entry || !offer || mutation.actor.kind !== "guardian" ||
      workflow.currentStage !== "capacity_waitlist" ||
      entry.lifecycle !== "offer_open" || offer.lifecycle !== "open" ||
      now >= offer.expiresAt ||
      guardianActionAt(mutation.actor) < offer.issuedAt
    ) return conflict("trial_offer_acceptance_conflict");
    const group = await this.lockCareGroup({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      care_group_ref: entry.targetCareGroupId,
    });
    if (!group || group.capacity === null || group.capacity < 1) {
      return conflict("capacity_source_conflict");
    }
    const usage = await this.capacityUse({
      workspace_id: mutation.workspace_id,
      care_group_ref: group.id,
    });
    if (usage.occupancy + usage.held >= group.capacity) {
      return conflict("trial_reservation_capacity_conflict");
    }
    const reservationRef = randomUUID();
    await this.prisma.nurtureEnrollmentTrialReservation.create({
      data: {
        id: reservationRef,
        workspaceId: mutation.workspace_id,
        institutionId: mutation.institution_ref,
        workflowId: workflow.id,
        entryId: entry.id,
        offerId: offer.id,
        targetCareGroupId: group.id,
        acceptedActionRef: asJson(mutation.actor.owner_snapshot.action_ref),
        acceptedActorRef: asJson(mutation.actor.owner_snapshot.actor_ref),
        heldAt: now,
        trialStartsAt: offer.trialStartsAt,
        trialEndsAt: offer.trialEndsAt,
        reviewAt: offer.reviewAt,
        state: "held",
        reservationHead: 1,
      },
    });
    const offerUpdate = await this.prisma.nurtureEnrollmentTrialOffer.updateMany({
      where: { id: offer.id, offerHead: offer.offerHead, lifecycle: "open" },
      data: {
        lifecycle: "accepted",
        offerHead: { increment: 1 },
        decidedAt: guardianActionAt(mutation.actor),
        decisionReasonKey: "guardian_accepted",
      },
    });
    const entryUpdate = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "offer_open" },
      data: { lifecycle: "accepted", entryHead: { increment: 1 } },
    });
    if (offerUpdate.count !== 1 || entryUpdate.count !== 1) {
      return conflict("trial_offer_acceptance_conflict");
    }
    const after = await this.updateWorkflow({
      workflow,
      data: {
        currentStage: "trial_preparation",
        waitingState: "waiting_on_system",
        pendingTransition: "trial_start_pending",
        completedMilestones: { push: "trial_offer_accepted" },
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      added_milestones: ["trial_offer_accepted"],
      entities: {
        ...offerState(entry, "accepted", offer.id, offer.offerHead + 1, "accepted"),
        reservation_ref: reservationRef,
        reservation_head: 1,
        reservation_state: "held",
      },
    });
  }

  private async closeOffer(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "decline_or_expire_trial_offer" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry, offer } = loaded;
    const now = this.now();
    if (
      !entry || !offer || entry.lifecycle !== "offer_open" ||
      offer.lifecycle !== "open" || workflow.currentStage !== "capacity_waitlist" ||
      new Date(mutation.next_review_at) <= now ||
      (mutation.disposition === "declined" &&
        (mutation.actor.kind !== "guardian" || now >= offer.expiresAt ||
          guardianActionAt(mutation.actor) < offer.issuedAt)) ||
      (mutation.disposition === "expired" &&
        (mutation.actor.kind !== "institution_admin" || now < offer.expiresAt))
    ) return conflict("trial_offer_close_conflict");
    const offerUpdate = await this.prisma.nurtureEnrollmentTrialOffer.updateMany({
      where: { id: offer.id, offerHead: offer.offerHead, lifecycle: "open" },
      data: {
        lifecycle: mutation.disposition,
        offerHead: { increment: 1 },
        decidedAt:
          mutation.actor.kind === "guardian"
            ? guardianActionAt(mutation.actor)
            : now,
        decisionReasonKey: mutation.reason_key,
      },
    });
    const entryUpdate = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "offer_open" },
      data: {
        lifecycle: "active",
        currentOfferId: null,
        interestState: "waiting_on_guardian",
        lastReviewedAt: now,
        nextReviewAt: new Date(mutation.next_review_at),
        entryHead: { increment: 1 },
      },
    });
    if (offerUpdate.count !== 1 || entryUpdate.count !== 1) {
      return conflict("trial_offer_close_conflict");
    }
    const after = await this.updateWorkflow({
      workflow,
      data: { waitingState: "waiting_on_guardian" },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      entities: offerState(
        entry, "active", offer.id, offer.offerHead + 1, mutation.disposition,
      ),
    });
  }

  private async withdraw(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "withdraw_from_waitlist" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry } = loaded;
    const now = this.now();
    if (
      !entry || mutation.actor.kind !== "guardian" ||
      workflow.currentStage !== "capacity_waitlist" ||
      !["active", "offer_open"].includes(entry.lifecycle) ||
      guardianActionAt(mutation.actor) <
        (entry.currentOffer?.issuedAt ?? entry.waitlistQualifiedAt)
    ) return conflict("waitlist_withdrawal_conflict");
    let offerHead: number | undefined;
    if (entry.lifecycle === "offer_open" && entry.currentOffer) {
      const updated = await this.prisma.nurtureEnrollmentTrialOffer.updateMany({
        where: {
          id: entry.currentOffer.id,
          offerHead: entry.currentOffer.offerHead,
          lifecycle: "open",
        },
        data: {
          lifecycle: "withdrawn",
          offerHead: { increment: 1 },
          decidedAt: now,
          decisionReasonKey: mutation.reason_key,
        },
      });
      if (updated.count !== 1) return conflict("trial_offer_head_conflict");
      offerHead = entry.currentOffer.offerHead + 1;
    }
    const entryUpdate = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead },
      data: {
        lifecycle: "withdrawn",
        currentOfferId: null,
        entryHead: { increment: 1 },
      },
    });
    if (entryUpdate.count !== 1) return conflict("waitlist_entry_head_conflict");
    const after = await this.updateWorkflow({
      workflow,
      data: {
        lifecycle: "closed_without_formalization",
        currentStage: "closed",
        waitingState: "ready",
        pendingTransition: "none",
        terminalOutcome: "waitlist_withdrawn",
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      entities: {
        ...entryState(entry, "withdrawn"),
        ...(entry.currentOffer && offerHead
          ? {
              offer_ref: entry.currentOffer.id,
              offer_head: offerHead,
              offer_lifecycle: "withdrawn" as const,
            }
          : {}),
      },
    });
  }

  private async cancelPreparation(
    mutation: Extract<NurtureEnrollmentWaitlistMutation, { kind: "cancel_trial_preparation" }>,
    loaded: LoadedMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult> {
    const { workflow, entry, offer, reservation } = loaded;
    const now = this.now();
    if (
      !entry || !offer || !reservation ||
      workflow.currentStage !== "trial_preparation" ||
      workflow.completedMilestones.includes("trial_started") ||
      entry.lifecycle !== "accepted" || offer.lifecycle !== "accepted" ||
      reservation.state !== "held" ||
      (mutation.actor.kind === "guardian" &&
        guardianActionAt(mutation.actor) < reservation.heldAt)
    ) return conflict("trial_preparation_cancel_conflict");
    const group = await this.lockCareGroup({
      workspace_id: mutation.workspace_id,
      institution_ref: mutation.institution_ref,
      care_group_ref: reservation.targetCareGroupId,
    });
    if (!group) return conflict("capacity_source_conflict");
    const reservationUpdate =
      await this.prisma.nurtureEnrollmentTrialReservation.updateMany({
        where: {
          id: reservation.id,
          reservationHead: reservation.reservationHead,
          state: "held",
        },
        data: {
          state: "released",
          reservationHead: { increment: 1 },
          releasedAt: now,
          releaseReasonKey: mutation.reason_key,
        },
      });
    const offerUpdate = await this.prisma.nurtureEnrollmentTrialOffer.updateMany({
      where: { id: offer.id, offerHead: offer.offerHead, lifecycle: "accepted" },
      data: {
        lifecycle: "withdrawn",
        offerHead: { increment: 1 },
        decidedAt: now,
        decisionReasonKey: mutation.reason_key,
      },
    });
    const entryUpdate = await this.prisma.nurtureEnrollmentWaitlistEntry.updateMany({
      where: { id: entry.id, entryHead: entry.entryHead, lifecycle: "accepted" },
      data: { currentOfferId: null, entryHead: { increment: 1 } },
    });
    if (
      reservationUpdate.count !== 1 || offerUpdate.count !== 1 ||
      entryUpdate.count !== 1
    ) return conflict("trial_preparation_cancel_conflict");
    const after = await this.updateWorkflow({
      workflow,
      data: {
        lifecycle: "closed_without_formalization",
        currentStage: "closed",
        waitingState: "ready",
        pendingTransition: "none",
        terminalOutcome: "preparation_cancelled",
        completedMilestones: { push: "preparation_cancelled" },
      },
    });
    if (!after) return conflict("workflow_head_conflict");
    return this.committed({
      before: workflow,
      after,
      added_milestones: ["preparation_cancelled"],
      entities: {
        ...offerState(entry, "accepted", offer.id, offer.offerHead + 1, "withdrawn"),
        reservation_ref: reservation.id,
        reservation_head: reservation.reservationHead + 1,
        reservation_state: "released",
      },
    });
  }

  async appendOverride(input: {
    override: NurtureEnrollmentWaitlistOverrideDraftV1;
    command_execution_ref: string;
  }): Promise<void> {
    const execution = await this.prisma.nurtureCommandExecution.findFirst({
      where: {
        id: input.command_execution_ref,
        workspaceId: input.override.workspace_id,
        commandKey: "nurture.override_waitlist_category",
        commandScope: "institution_enrollment_journey",
      },
      select: { committedAt: true },
    });
    if (!execution) throw new Error("waitlist override execution is unavailable");
    await this.prisma.nurtureEnrollmentWaitlistOverride.create({
      data: {
        id: input.override.override_ref,
        workspaceId: input.override.workspace_id,
        institutionId: input.override.institution_ref,
        entryId: input.override.entry_ref,
        commandExecutionId: input.command_execution_ref,
        entryHeadBefore: input.override.entry_head_before,
        entryHeadAfter: input.override.entry_head_after,
        beforePolicyRef: input.override.before_policy_ref,
        beforePolicyRevision: input.override.before_policy_revision,
        beforeCategoryKey: input.override.before_category_key,
        beforeCategoryOrder: input.override.before_category_order,
        afterPolicyRef: input.override.after_policy_ref,
        afterPolicyRevision: input.override.after_policy_revision,
        afterCategoryKey: input.override.after_category_key,
        afterCategoryOrder: input.override.after_category_order,
        afterCategoryBasisKey: input.override.after_category_basis_key,
        actorRoleAssignmentId: input.override.actor_role_assignment_ref,
        reasonKey: input.override.reason_key,
        occurredAt: execution.committedAt,
      },
    });
  }

  async readAdminQueue(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    target_care_group_ref: string;
  }) {
    try {
      const authority = await this.resolveAdmin(input);
      if (authority.status !== "resolved") return authority;
      const group = await this.prisma.nurtureCareGroup.findFirst({
        where: {
          id: input.target_care_group_ref,
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          status: "active",
          deletedAt: null,
        },
        select: { id: true, name: true },
      });
      if (!group) return denied();
      const entries = await this.prisma.nurtureEnrollmentWaitlistEntry.findMany({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          targetCareGroupId: group.id,
          lifecycle: { in: ["active", "offer_open"] },
        },
        orderBy: [
          { categoryOrder: "asc" },
          { waitlistQualifiedAt: "asc" },
          { orderKey: "asc" },
        ],
        take: MAX_ADMIN_WAITLIST_ENTRIES + 1,
        select: {
          id: true,
          workflowId: true,
          targetCareGroupId: true,
          lifecycle: true,
          interestState: true,
          categoryKey: true,
          categoryBasisKey: true,
          policyRef: true,
          policyRevision: true,
          waitlistQualifiedAt: true,
          nextReviewAt: true,
          lastConfirmedAt: true,
          currentOfferId: true,
          entryHead: true,
        },
      });
      if (entries.length > MAX_ADMIN_WAITLIST_ENTRIES) {
        return unavailable("waitlist_query_limit_exceeded");
      }
      const orderedEntries: NurtureAdminWaitlistEntryProjectionV1[] = entries.map(
        (entry) => ({
          entryRef: entry.id,
          workflowRef: entry.workflowId,
          targetCareGroupRef: entry.targetCareGroupId,
          targetClassSafeLabel: group.name,
          lifecycle: entry.lifecycle as "active" | "offer_open",
          continuedInterest: entry.interestState,
          categoryKey: entry.categoryKey,
          categoryBasisKey: entry.categoryBasisKey,
          policyRef: entry.policyRef,
          policyRevision: entry.policyRevision,
          waitlistQualifiedAt: entry.waitlistQualifiedAt.toISOString(),
          nextReviewAt: entry.nextReviewAt.toISOString(),
          lastConfirmedAt: entry.lastConfirmedAt.toISOString(),
          ...(entry.currentOfferId ? { currentOfferRef: entry.currentOfferId } : {}),
          entryHead: entry.entryHead,
        }),
      );
      return {
        status: "resolved" as const,
        projection: {
          contractVersion: NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION,
          targetCareGroupRef: group.id,
          targetClassSafeLabel: group.name,
          orderedEntries,
        },
      };
    } catch {
      return unavailable("waitlist_query_unavailable");
    }
  }

  async readFamilyStatus(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
    owner_snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  }) {
    try {
      if (
        !validateEnrollmentGuardianActionOwnerSnapshotV1(input.owner_snapshot) ||
        input.owner_snapshot.occurred_at > this.now().toISOString() ||
        input.owner_snapshot.verified_at > this.now().toISOString()
      ) return denied("guardian_owner_mismatch");
      const workflow = await this.prisma.nurtureInstitutionWorkflow.findFirst({
        where: {
          id: input.workflow_ref,
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
        },
        include: { inquiry: true },
      });
      if (
        !workflow?.inquiry ||
        !canonicalRefEqual(workflow.inquiry.hostContactRef, input.owner_snapshot.contact_ref)
      ) return denied("guardian_owner_mismatch");
      const entry = await this.prisma.nurtureEnrollmentWaitlistEntry.findFirst({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          workflowId: workflow.id,
          lifecycle: { in: ["active", "offer_open", "accepted"] },
        },
        orderBy: { waitlistQualifiedAt: "desc" },
        include: {
          targetCareGroup: { select: { name: true } },
          currentOffer: { select: { reviewAt: true } },
        },
      });
      if (!entry) return denied();
      if (
        (entry.lifecycle === "accepted" &&
          (!entry.currentOffer ||
            workflow.lifecycle !== "active" ||
            workflow.currentStage !== "trial_preparation")) ||
        (entry.lifecycle !== "accepted" &&
          (workflow.lifecycle !== "active" ||
            workflow.currentStage !== "capacity_waitlist"))
      ) return denied();
      const status: NurtureFamilyWaitlistProjectionV1["status"] =
        entry.lifecycle === "accepted"
          ? "trial_preparation"
          : entry.lifecycle === "offer_open"
            ? "offer_open"
            : entry.interestState === "waiting_on_guardian"
              ? "waiting_on_guardian"
              : "waitlisted";
      const nextExpectedContactAt =
        entry.lifecycle === "accepted"
          ? entry.currentOffer?.reviewAt
          : entry.nextReviewAt;
      if (!nextExpectedContactAt) return denied();
      return {
        status: "resolved" as const,
        projection: {
          contractVersion: NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION,
          status,
          targetClassSafeLabel: entry.targetCareGroup.name,
          lastReviewAt: (entry.lastReviewedAt ?? entry.lastConfirmedAt).toISOString(),
          nextExpectedContactAt: nextExpectedContactAt.toISOString(),
        },
      };
    } catch {
      return unavailable("waitlist_query_unavailable");
    }
  }
}
