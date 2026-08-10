import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureEnrollmentWaitlistQueryService,
  acceptTrialOfferSpec,
  cancelTrialPreparationSpec,
  confirmIntentConversationSpec,
  declineOrExpireTrialOfferSpec,
  issueTrialOfferSpec,
  endTrialSpec,
  extendTrialSpec,
  formalizeEnrollmentSpec,
  formatNurtureBindingOwnerRef,
  markTrialReviewReachedSpec,
  overrideWaitlistCategorySpec,
  prepareTrialRelationshipSpec,
  proposeFormalEnrollmentSpec,
  qualifyCapacityWaitlistSpec,
  recordExternalTouchpointSpec,
  reviewWaitlistInterestSpec,
  startEnrollmentInquirySpec,
  startTrialSpec,
  type NurtureCommandSpec,
  type NurtureEnrollmentFormalizationOwnerEvidenceV1,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureFormalizeEnrollmentPayload,
  type NurtureTrialPairOwnerSnapshotV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaNurtureCommandRepository } from "../src/repositories/institution-core.repositories.js";
import { PrismaEnrollmentWaitlistRepository } from "../src/repositories/enrollment-waitlist.repository.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const iso = (date: Date, milliseconds: number): string =>
  new Date(date.getTime() + milliseconds).toISOString();

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Waitlist Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Exact Trial Class",
      capacity: 1,
      status: "active",
    },
  });
  const admin = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `waitlist-admin:${randomUUID()}`,
      status: "active",
    },
  });
  const role = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
    },
  });
  const occupyingChild = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Occupying child", status: "active" },
  });
  const occupyingProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: occupyingChild.id, status: "active" },
  });
  const occupyingEnrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: occupyingProcess.id,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  let clock = new Date(Date.now() - 60_000);
  const now = () => new Date(clock);
  const runner = new NurtureCommandRunner(
    new PrismaNurtureCommandRepository(prisma, now),
  );
  return {
    workspaceId,
    institution,
    careGroup,
    admin,
    role,
    occupyingEnrollment,
    now,
    setClock(value: Date) {
      clock = new Date(value);
    },
    runner,
  };
};

type World = Awaited<ReturnType<typeof seed>>;

const guardianAction = (
  world: World,
  input: {
    contactRef: string;
    actionRef?: string;
    actionType?: string;
    occurredAt?: string;
  },
): NurtureEnrollmentGuardianActionOwnerSnapshotV1 => ({
  contract_version: "1.0.0",
  actor_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "guardian_actor",
    object_id: `guardian:${world.workspaceId}`,
    version: 1,
  },
  contact_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "prospective_contact",
    object_id: input.contactRef,
    version: 1,
  },
  action_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: input.actionType ?? "enrollment_action",
    object_id: input.actionRef ?? `action:${randomUUID()}`,
    version: 1,
  },
  occurred_at: input.occurredAt ?? iso(world.now(), -1_000),
  verified_at: world.now().toISOString(),
});

const execute = <Payload>(input: {
  world: World;
  actorRef: string;
  commandId?: string;
  payload: Payload;
  spec: NurtureCommandSpec<Payload>;
}) =>
  input.world.runner.execute({
    workspace_id: input.world.workspaceId,
    invocation_request_id: `invocation:${input.commandId ?? randomUUID()}`,
    command_request_id: input.commandId ?? `command:${randomUUID()}`,
    business_actor_ref: input.actorRef,
    payload: input.payload,
    spec: input.spec,
  });

const workflowPayload = (
  world: World,
  workflowRef: string,
  expectedWorkflowHead: number,
) => ({
  workspace_id: world.workspaceId,
  institution_ref: world.institution.id,
  workflow_ref: workflowRef,
  expected_workflow_head: expectedWorkflowHead,
});

const adminWorkflowPayload = (
  world: World,
  workflowRef: string,
  expectedWorkflowHead: number,
) => ({
  ...workflowPayload(world, workflowRef, expectedWorkflowHead),
  role_assignment_ref: world.role.id,
});

const startJourney = async (world: World) => {
  const contactRef = `contact:${randomUUID()}`;
  const workflowRunObjectId = `run:${randomUUID()}`;
  const initialAt = iso(world.now(), -3 * 60 * 60_000);
  await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      role_assignment_ref: world.role.id,
      expected_workflow_head: 0 as const,
      workflow_run_ref: {
        schema_version: 1 as const,
        namespace: "my_chat",
        object_type: "workflow_run",
        object_id: workflowRunObjectId,
        version: 1,
      },
      contact_owner_snapshot: {
        contract_version: "1.0.0" as const,
        contact_ref: {
          schema_version: 1 as const,
          namespace: "my_chat",
          object_type: "prospective_contact",
          object_id: contactRef,
          version: 1,
        },
        safe_label: "Guardian contact",
        verified_at: initialAt,
      },
      preferred_label: "Prospective child",
      age_band_key: "toddler",
      expected_entry_start_date: "2026-09-01",
      expected_entry_end_date: "2026-09-30",
      target_class_type_key: "full_day",
      target_age_band_key: "toddler",
      target_care_group_ref: world.careGroup.id,
      care_schedule_need_keys: ["weekdays"],
      source_channel: "referral",
      safety_label_keys: [],
      initial_contact_at: initialAt,
      next_touchpoint_at: iso(world.now(), 24 * 60 * 60_000),
    },
    spec: startEnrollmentInquirySpec,
  });
  const workflow = await prisma.nurtureInstitutionWorkflow.findFirstOrThrow({
    where: { workspaceId: world.workspaceId, workflowRunObjectId },
  });
  await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      ...adminWorkflowPayload(world, workflow.id, 1),
      source_channel: "phone",
      confirmed_need_keys: ["weekday_care"],
      safety_label_keys: [],
      next_action_key: "confirm_intent",
      responsible_role: "institution_admin" as const,
      occurred_at: iso(world.now(), -2 * 60 * 60_000),
      due_at: iso(world.now(), 60 * 60_000),
      next_touchpoint_at: iso(world.now(), 60 * 60_000),
      external_summary_body_envelope: {
        algVersion: 1 as const,
        keyRef: "waitlist-summary-key",
        ciphertext: "c3VtbWFyeQ",
        integrityTag: "dGFn",
      },
    },
    spec: recordExternalTouchpointSpec,
  });
  await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      ...adminWorkflowPayload(world, workflow.id, 2),
    },
    spec: confirmIntentConversationSpec,
  });
  return { workflowRef: workflow.id, contactRef };
};

const qualify = async (input: {
  world: World;
  journey: Awaited<ReturnType<typeof startJourney>>;
  category?: string;
  actionRef?: string;
  actionType?: string;
  expectedCapacityRevision?: number;
}) =>
  execute({
    world: input.world,
    actorRef: input.world.admin.id,
    payload: {
      ...adminWorkflowPayload(input.world, input.journey.workflowRef, 3),
      target_care_group_ref: input.world.careGroup.id,
      expected_capacity_revision:
        input.expectedCapacityRevision ?? input.world.careGroup.aggregateVersion,
      category_key: input.category ?? "standard",
      category_basis_key: "family_confirmed",
      next_review_at: iso(input.world.now(), 7 * 24 * 60 * 60_000),
      family_acceptance_owner_snapshot: guardianAction(input.world, {
        contactRef: input.journey.contactRef,
        actionRef: input.actionRef,
        actionType: input.actionType,
      }),
    },
    spec: qualifyCapacityWaitlistSpec,
  });

const issueOffer = async (input: {
  world: World;
  workflowRef: string;
  workflowHead: number;
  entryRef: string;
  entryHead: number;
  commandId?: string;
}) =>
  execute({
    world: input.world,
    actorRef: input.world.admin.id,
    commandId: input.commandId,
    payload: {
      ...adminWorkflowPayload(input.world, input.workflowRef, input.workflowHead),
      entry_ref: input.entryRef,
      expected_entry_head: input.entryHead,
      expires_at: iso(input.world.now(), 2 * 60 * 60_000),
      trial_starts_at: iso(input.world.now(), 3 * 60 * 60_000),
      trial_ends_at: iso(input.world.now(), 3 * 24 * 60 * 60_000),
      review_at: iso(input.world.now(), 2 * 24 * 60 * 60_000),
      reason_key: "admin_issued_trial_offer",
    },
    spec: issueTrialOfferSpec,
  });

const digest = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const acceptPreparation = async (world: World) => {
  const journey = await startJourney(world);
  await qualify({ world, journey });
  const entry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
    where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
  });
  await prisma.nurtureEnrollment.update({
    where: { id: world.occupyingEnrollment.id },
    data: { status: "ended", leftAt: world.now() },
  });
  await issueOffer({
    world,
    workflowRef: journey.workflowRef,
    workflowHead: 4,
    entryRef: entry.id,
    entryHead: 1,
  });
  const offer = await prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
    where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
  });
  world.setClock(new Date(world.now().getTime() + 60_000));
  const acceptance = guardianAction(world, { contactRef: journey.contactRef });
  await execute({
    world,
    actorRef: acceptance.actor_ref.object_id,
    payload: {
      ...workflowPayload(world, journey.workflowRef, 5),
      entry_ref: entry.id,
      expected_entry_head: 2,
      offer_ref: offer.id,
      expected_offer_head: 1,
      guardian_action_owner_snapshot: acceptance,
    },
    spec: acceptTrialOfferSpec,
  });
  const reservation =
    await prisma.nurtureEnrollmentTrialReservation.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
    });
  return { journey, entry, offer, reservation };
};

const seedCurrentPair = async (
  world: World,
): Promise<{
  snapshot: NurtureTrialPairOwnerSnapshotV1;
  grantTerms: {
    contract_version: "1.0.0";
    policy_ref: string;
    policy_revision: number;
    directions: readonly ["family_to_org", "org_to_family"];
    data_classes: readonly ["daily_care_log", "care_day_note"];
    purposes: readonly ["trial_care"];
    verified_at: string;
    expires_at: string;
  };
}> => {
  const actorObjectId = `guardian-actor:${randomUUID()}`;
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: world.workspaceId,
      myChatUserId: `trial-guardian:${randomUUID()}`,
      status: "active",
    },
  });
  await prisma.nurtureParticipantPrincipalBinding.create({
    data: {
      workspaceId: world.workspaceId,
      participantId: guardian.id,
      accountObjectId: `guardian-account:${randomUUID()}`,
      actorObjectId,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: {
      workspaceId: world.workspaceId,
      displayName: "Trial child",
      status: "active",
    },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId: world.workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId: world.workspaceId,
      childCareProcessId: process.id,
      displayName: "Trial family",
      status: "active",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId: world.workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const childAnchor = await prisma.nurtureChildBindingAnchor.create({
    data: {
      reservationKeyHash: digest(`trial-child-anchor:${world.workspaceId}`),
      status: "associated",
    },
  });
  const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
    data: {
      reservationKeyHash: digest(`trial-family-anchor:${world.workspaceId}`),
      status: "associated",
    },
  });
  const childAssociation = await prisma.nurtureChildAnchorAssociation.create({
    data: {
      workspaceId: world.workspaceId,
      childAnchorId: childAnchor.id,
      childId: child.id,
    },
  });
  const familyAssociation = await prisma.nurtureFamilyAnchorAssociation.create({
    data: {
      workspaceId: world.workspaceId,
      familyAnchorId: familyAnchor.id,
      childAnchorId: childAnchor.id,
      childAssociationId: childAssociation.id,
      currentChildAssociationId: childAssociation.id,
      childId: child.id,
      childCareProcessId: process.id,
      familyId: family.id,
    },
  });
  const childOwnerRef = formatNurtureBindingOwnerRef("child", childAnchor.id);
  const familyOwnerRef = formatNurtureBindingOwnerRef("family", familyAnchor.id);
  const ownerExpiresAt = iso(world.now(), 10 * 24 * 60 * 60_000);
  for (const [subjectType, anchorId, ownerRef] of [
    ["child", childAnchor.id, childOwnerRef],
    ["family", familyAnchor.id, familyOwnerRef],
  ] as const) {
    await prisma.nurtureScenarioBindingAuthorization.create({
      data: {
        workspaceId: world.workspaceId,
        subjectType,
        ...(subjectType === "child"
          ? { childAnchorId: anchorId }
          : { familyAnchorId: anchorId }),
        ownerRef,
        ownerVersion: 1,
        idempotencyKeyHash: digest(`trial-auth:${subjectType}:${world.workspaceId}`),
        requestFingerprint: digest(`trial-fingerprint:${subjectType}:${world.workspaceId}`),
        subjectEvidenceHash: digest(`trial-subject:${subjectType}:${world.workspaceId}`),
        userEvidenceHash: digest(`trial-user:${subjectType}:${world.workspaceId}`),
        actorEvidenceHash: digest(`trial-actor:${subjectType}:${world.workspaceId}`),
        purpose: "scenario_binding_write",
        authorizationSourceRef: "my_chat_child_identity",
        authorizationSourceVersion: 1,
        status: "active",
        verifiedAt: world.now(),
        expiresAt: new Date(ownerExpiresAt),
      },
    });
  }
  return {
    snapshot: {
      contract_version: "1.0.0",
      actor_ref: {
        schema_version: 1,
        namespace: "my_chat",
        object_type: "actor",
        object_id: actorObjectId,
        version: 1,
      },
      guardian_participant_ref: guardian.id,
      guardian_role_assignment_ref: guardianRole.id,
      child_owner_ref: childOwnerRef,
      child_owner_version: 1,
      family_owner_ref: familyOwnerRef,
      family_owner_version: 1,
      child_association_ref: childAssociation.id,
      child_association_head: 1,
      family_association_ref: familyAssociation.id,
      family_association_head: 1,
      child_care_process_ref: process.id,
      verified_at: world.now().toISOString(),
      expires_at: ownerExpiresAt,
    },
    grantTerms: {
      contract_version: "1.0.0",
      policy_ref: "trial-care-policy",
      policy_revision: 1,
      directions: ["family_to_org", "org_to_family"],
      data_classes: ["daily_care_log", "care_day_note"],
      purposes: ["trial_care"],
      verified_at: world.now().toISOString(),
      expires_at: iso(world.now(), 10 * 24 * 60 * 60_000),
    },
  };
};

const reachFormalProposal = async (
  world: World,
  timing: {
    formalStartOffsetMs?: number;
    proposalExpiryOffsetMs?: number;
  } = {},
) => {
  const preparation = await acceptPreparation(world);
  const pair = await seedCurrentPair(world);
  await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      ...adminWorkflowPayload(world, preparation.journey.workflowRef, 6),
      reservation_ref: preparation.reservation.id,
      expected_reservation_head: 1,
      expected_capacity_revision: world.careGroup.aggregateVersion,
      pair_owner_snapshot: pair.snapshot,
      grant_terms_snapshot: pair.grantTerms,
    },
    spec: prepareTrialRelationshipSpec,
  });
  const enrollment = await prisma.nurtureEnrollment.findFirstOrThrow({
    where: {
      workspaceId: world.workspaceId,
      childCareProcessId: pair.snapshot.child_care_process_ref,
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.findFirstOrThrow({
    where: { workspaceId: world.workspaceId, enrollmentId: enrollment.id },
  });
  world.setClock(preparation.offer.trialStartsAt);
  await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      ...adminWorkflowPayload(world, preparation.journey.workflowRef, 7),
      enrollment_ref: enrollment.id,
      expected_enrollment_head: 0,
      grant_ref: grant.id,
      expected_grant_head: 0,
      reservation_ref: preparation.reservation.id,
      expected_reservation_head: 1,
      expected_capacity_revision: world.careGroup.aggregateVersion,
      pair_owner_snapshot: pair.snapshot,
    },
    spec: startTrialSpec,
  });
  world.setClock(new Date(preparation.reservation.reviewAt.getTime() + 1_000));
  const entities = {
    ...adminWorkflowPayload(world, preparation.journey.workflowRef, 8),
    enrollment_ref: enrollment.id,
    expected_enrollment_head: 1,
    grant_ref: grant.id,
    expected_grant_head: 1,
    reservation_ref: preparation.reservation.id,
    expected_reservation_head: 2,
  };
  await execute({
    world,
    actorRef: world.admin.id,
    payload: entities,
    spec: markTrialReviewReachedSpec,
  });
  const proposed = await execute({
    world,
    actorRef: world.admin.id,
    payload: {
      ...entities,
      expected_workflow_head: 9,
      expected_capacity_revision: world.careGroup.aggregateVersion,
      proposed_formal_start_at: iso(world.now(), timing.formalStartOffsetMs ?? 0),
      proposed_grant_purposes: ["trial_care"],
      proposed_grant_expires_at: iso(world.now(), 5 * 24 * 60 * 60_000),
      safe_family_summary: "Guardian reviewed the formal care continuation.",
      proposal_expires_at: iso(
        world.now(),
        timing.proposalExpiryOffsetMs ?? 12 * 60 * 60_000,
      ),
      reason_key: "admin_proposed_formal_continuation",
    },
    spec: proposeFormalEnrollmentSpec,
  });
  expect(proposed).toMatchObject({ status: "ok", disposition: "executed" });
  const proposal = await prisma.nurtureEnrollmentFormalProposal.findFirstOrThrow({
    where: { workspaceId: world.workspaceId, workflowId: preparation.journey.workflowRef },
  });
  return { preparation, pair, enrollment, grant, proposal };
};

type FormalProposalState = Awaited<ReturnType<typeof reachFormalProposal>>;

const formalizationOwnerEvidence = (
  world: World,
  state: FormalProposalState,
): NurtureEnrollmentFormalizationOwnerEvidenceV1 => ({
  contract_version: "1.0.0",
  actor_ref: state.pair.snapshot.actor_ref,
  audience: "nurture",
  current_owner_evidence: {
    binding_evidence_version: 1,
    purpose_key: "formalize_enrollment",
    owner_bindings: [
      {
        owner_binding_ref_version: 1,
        binding_slot: "child",
        owner_ref: {
          schema_version: 1,
          namespace: "scenario-owner",
          object_type: "child_binding_owner",
          object_id: state.pair.snapshot.child_owner_ref,
          version: state.pair.snapshot.child_owner_version,
        },
      },
      {
        owner_binding_ref_version: 1,
        binding_slot: "family",
        owner_ref: {
          schema_version: 1,
          namespace: "scenario-owner",
          object_type: "family_binding_owner",
          object_id: state.pair.snapshot.family_owner_ref,
          version: state.pair.snapshot.family_owner_version,
        },
      },
    ],
    pair_relation_evidence_hash: digest(`pair:${world.workspaceId}`),
    current_owner_evidence_hash: digest(`current:${world.workspaceId}`),
  },
  request_nonce_hash: digest(`nonce:${world.workspaceId}`),
  verified_at: world.now().toISOString(),
  expires_at: iso(world.now(), 60_000),
});

const formalizationPayload = (
  world: World,
  state: FormalProposalState,
  acceptedAt = world.now().toISOString(),
): NurtureFormalizeEnrollmentPayload => ({
  workflow_ref: state.preparation.journey.workflowRef,
  proposal_ref: state.proposal.id,
  acceptance_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "enrollment_action",
    object_id: `formal-acceptance:${randomUUID()}`,
    version: 1,
  },
  accepted_at: acceptedAt,
  expected_workflow_head: 10,
  expected_proposal_head: 1,
  expected_enrollment_head: 1,
  expected_grant_head: 1,
  expected_reservation_head: 2,
  owner_evidence: formalizationOwnerEvidence(world, state),
});

describe("T-007 G4-D waitlist and trial preparation (production DB lane)", () => {
  it("formalizes only the current Guardian acceptance and exact proposal heads", async () => {
    const world = await seed();
    const state = await reachFormalProposal(world);
    const payload = formalizationPayload(world, state);
    const ownerEvidence = payload.owner_evidence;
    const acceptanceRef = payload.acceptance_ref;

    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        payload: {
          ...payload,
          owner_evidence: {
            ...ownerEvidence,
            verified_at: iso(world.now(), -120_000),
            expires_at: iso(world.now(), -60_000),
          },
        },
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "formalization_owner_not_current",
    });
    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        payload: {
          ...payload,
          owner_evidence: {
            ...ownerEvidence,
            current_owner_evidence: {
              ...ownerEvidence.current_owner_evidence,
              owner_bindings: [
                {
                  ...ownerEvidence.current_owner_evidence.owner_bindings[0],
                  owner_ref: {
                    ...ownerEvidence.current_owner_evidence.owner_bindings[0].owner_ref,
                    version: 2,
                  },
                },
                ownerEvidence.current_owner_evidence.owner_bindings[1],
              ],
            },
          },
        },
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "formalization_owner_not_current",
    });
    expect(
      await prisma.nurtureEnrollment.findUniqueOrThrow({
        where: { id: state.enrollment.id },
      }),
    ).toMatchObject({ participationPhase: "trial", aggregateVersion: 1 });

    const commandId = `formalize:${randomUUID()}`;
    const formalized = await execute({
      world,
      actorRef: state.pair.snapshot.actor_ref.object_id,
      commandId,
      payload,
      spec: formalizeEnrollmentSpec,
    });
    expect(formalized).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        workflow_head: 11,
        lifecycle: "completed",
        terminal_outcome: "formalized",
        proposal_ref: state.proposal.id,
        enrollment_head: 2,
        participation_phase: "formal",
        grant_head: 2,
        reservation_head: 2,
      },
    });
    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        commandId,
        payload: {
          ...payload,
          owner_evidence: {
            ...ownerEvidence,
            current_owner_evidence: {
              ...ownerEvidence.current_owner_evidence,
              current_owner_evidence_hash: digest(`retry-current:${world.workspaceId}`),
            },
            request_nonce_hash: digest(`retry-nonce:${world.workspaceId}`),
            verified_at: iso(world.now(), 1_000),
            expires_at: iso(world.now(), 61_000),
          },
        },
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({ status: "ok", disposition: "replayed" });
    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        commandId,
        payload: { ...payload, accepted_at: iso(world.now(), -1_000) },
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({ status: "not_committed", decision: "idempotency_conflict" });

    const [workflow, enrollment, grant, reservation, transition] = await Promise.all([
      prisma.nurtureInstitutionWorkflow.findUniqueOrThrow({
        where: { id: state.preparation.journey.workflowRef },
      }),
      prisma.nurtureEnrollment.findUniqueOrThrow({ where: { id: state.enrollment.id } }),
      prisma.nurtureChildLinkGrant.findUniqueOrThrow({ where: { id: state.grant.id } }),
      prisma.nurtureEnrollmentTrialReservation.findUniqueOrThrow({
        where: { id: state.preparation.reservation.id },
      }),
      prisma.nurtureInstitutionWorkflowTransition.findFirstOrThrow({
        where: {
          workflowId: state.preparation.journey.workflowRef,
          commandKey: "formalize_enrollment",
        },
      }),
    ]);
    expect(workflow).toMatchObject({
      lifecycle: "completed",
      currentStage: "completed",
      waitingState: "ready",
      terminalOutcome: "formalized",
      workflowHead: 11,
      dueAt: null,
    });
    expect(workflow.completedMilestones).toEqual(expect.arrayContaining([
      "guardian_formal_acceptance_recorded",
      "formal_enrollment_committed",
      "journey_completed",
    ]));
    expect(enrollment).toMatchObject({ status: "active", participationPhase: "formal" });
    expect(grant).toMatchObject({
      status: "active",
      purposes: state.proposal.proposedGrantPurposes,
      expiresAt: state.proposal.proposedGrantExpiresAt,
    });
    expect(reservation).toMatchObject({
      state: "converted_to_occupancy",
      reservationHead: 2,
    });
    expect(transition).toMatchObject({
      formalProposalId: state.proposal.id,
      ownerEvidenceHash: ownerEvidence.current_owner_evidence.current_owner_evidence_hash,
      actorRef: ownerEvidence.actor_ref,
      ownerActionRef: acceptanceRef,
    });
    expect(JSON.stringify(transition.ownerEvidenceMetadata)).not.toContain(
      "current_owner_evidence",
    );
    await expect(
      prisma.nurtureEnrollmentFormalProposal.update({
        where: { id: state.proposal.id },
        data: { safeFamilySummary: "Changed" },
      }),
    ).rejects.toThrow();
  });

  it("waits for a future formal start and preserves a timely acceptance after proposal expiry", async () => {
    const world = await seed();
    const state = await reachFormalProposal(world, {
      formalStartOffsetMs: 60 * 60_000,
      proposalExpiryOffsetMs: 2 * 60 * 60_000,
    });
    const acceptedAt = world.now().toISOString();
    const payload = formalizationPayload(world, state, acceptedAt);
    const commandId = `formalize-future:${randomUUID()}`;

    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        commandId,
        payload,
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "formalization_predicate_failed",
    });
    expect(
      await prisma.nurtureEnrollment.findUniqueOrThrow({ where: { id: state.enrollment.id } }),
    ).toMatchObject({ participationPhase: "trial", aggregateVersion: 1 });

    world.setClock(new Date(state.proposal.expiresAt.getTime() + 1_000));
    const committed = await execute({
      world,
      actorRef: state.pair.snapshot.actor_ref.object_id,
      commandId,
      payload: {
        ...payload,
        owner_evidence: formalizationOwnerEvidence(world, state),
      },
      spec: formalizeEnrollmentSpec,
    });
    expect(committed).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { participation_phase: "formal" },
    });
  });

  it("serializes competing formalization commands to one acceptance commit", async () => {
    const world = await seed();
    const state = await reachFormalProposal(world);
    const payload = formalizationPayload(world, state);
    const commandIds = [
      `formalize-concurrent-a:${randomUUID()}`,
      `formalize-concurrent-b:${randomUUID()}`,
    ] as const;
    const results = await Promise.all(
      commandIds.map((commandId) =>
        execute({
          world,
          actorRef: state.pair.snapshot.actor_ref.object_id,
          commandId,
          payload,
          spec: formalizeEnrollmentSpec,
        })
      ),
    );
    expect(results.filter((result) => result.status === "ok")).toHaveLength(1);
    const loserIndex = results.findIndex((result) => result.status !== "ok");
    expect(loserIndex).toBeGreaterThanOrEqual(0);
    expect(results[loserIndex]).toMatchObject({
      status: "not_committed",
      decision: "conflict",
    });
    if (results[loserIndex]?.status === "not_committed") {
      expect([
        "command_write_conflict",
        "formalization_entity_head_conflict",
      ]).toContain(results[loserIndex].reason_code);
    }

    await expect(
      execute({
        world,
        actorRef: state.pair.snapshot.actor_ref.object_id,
        commandId: commandIds[loserIndex]!,
        payload,
        spec: formalizeEnrollmentSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "formalization_entity_head_conflict",
    });
    const [executionCount, transitionCount] = await Promise.all([
      prisma.nurtureCommandExecution.count({
        where: {
          workspaceId: world.workspaceId,
          commandKey: "nurture.formalize_enrollment",
        },
      }),
      prisma.nurtureInstitutionWorkflowTransition.count({
        where: {
          workspaceId: world.workspaceId,
          workflowId: state.preparation.journey.workflowRef,
          commandKey: "formalize_enrollment",
        },
      }),
    ]);
    expect({ executionCount, transitionCount }).toEqual({
      executionCount: 1,
      transitionCount: 1,
    });
  });

  it("runs the explicit trial lifecycle without a timer, second child owner, or waitlist restore", async () => {
    const world = await seed();
    const preparation = await acceptPreparation(world);
    const pair = await seedCurrentPair(world);
    const prepareCommandId = `prepare-trial:${randomUUID()}`;
    const preparePayload = {
      ...adminWorkflowPayload(world, preparation.journey.workflowRef, 6),
      reservation_ref: preparation.reservation.id,
      expected_reservation_head: 1,
      expected_capacity_revision: world.careGroup.aggregateVersion,
      pair_owner_snapshot: pair.snapshot,
      grant_terms_snapshot: pair.grantTerms,
    };

    await prisma.nurtureChildCareProcess.update({
      where: { id: pair.snapshot.child_care_process_ref },
      data: { status: "paused" },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: preparePayload,
        spec: prepareTrialRelationshipSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_relationship_preparation_predicate_failed",
    });
    await prisma.nurtureChildCareProcess.update({
      where: { id: pair.snapshot.child_care_process_ref },
      data: { status: "active" },
    });

    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...preparePayload,
          pair_owner_snapshot: {
            ...pair.snapshot,
            child_association_head: 2,
          },
        },
        spec: prepareTrialRelationshipSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_relationship_preparation_predicate_failed",
    });
    expect(
      await prisma.nurtureChildLinkGrant.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);

    const prepared = await execute({
      world,
      actorRef: world.admin.id,
      commandId: prepareCommandId,
      payload: preparePayload,
      spec: prepareTrialRelationshipSpec,
    });
    expect(prepared).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        workflow_head: 7,
        enrollment_status: "pending",
        grant_status: "pending",
        reservation_state: "held",
      },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        commandId: prepareCommandId,
        payload: preparePayload,
        spec: prepareTrialRelationshipSpec,
      }),
    ).resolves.toMatchObject({ status: "ok", disposition: "replayed" });

    const enrollment = await prisma.nurtureEnrollment.findFirstOrThrow({
      where: {
        workspaceId: world.workspaceId,
        childCareProcessId: pair.snapshot.child_care_process_ref,
      },
    });
    const grant = await prisma.nurtureChildLinkGrant.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, enrollmentId: enrollment.id },
    });
    const startPayload = {
      ...adminWorkflowPayload(world, preparation.journey.workflowRef, 7),
      enrollment_ref: enrollment.id,
      expected_enrollment_head: 0,
      grant_ref: grant.id,
      expected_grant_head: 0,
      reservation_ref: preparation.reservation.id,
      expected_reservation_head: 1,
      expected_capacity_revision: world.careGroup.aggregateVersion,
      pair_owner_snapshot: pair.snapshot,
    };
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: startPayload,
        spec: startTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_start_predicate_failed",
    });
    world.setClock(preparation.offer.trialStartsAt);
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: pair.snapshot.guardian_role_assignment_ref },
      data: { endsAt: world.now() },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: startPayload,
        spec: startTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_start_predicate_failed",
    });
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: pair.snapshot.guardian_role_assignment_ref },
      data: { endsAt: null },
    });
    await prisma.nurtureChildLinkGrant.update({
      where: { id: grant.id },
      data: { grantedByParticipantId: world.admin.id },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: startPayload,
        spec: startTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_start_predicate_failed",
    });
    await prisma.nurtureChildLinkGrant.update({
      where: { id: grant.id },
      data: { grantedByParticipantId: pair.snapshot.guardian_participant_ref },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: startPayload,
        spec: startTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 8,
        enrollment_status: "active",
        participation_phase: "trial",
        grant_status: "active",
        reservation_state: "converted_to_occupancy",
      },
    });
    expect(
      await prisma.nurtureEnrollment.count({
        where: {
          workspaceId: world.workspaceId,
          careGroupId: world.careGroup.id,
          status: "active",
        },
      }),
    ).toBe(1);
    expect(
      await prisma.nurtureEnrollment.count({
        where: {
          workspaceId: world.workspaceId,
          careGroupId: world.careGroup.id,
          status: "active",
          participationPhase: "formal",
        },
      }),
    ).toBe(0);

    world.setClock(new Date(preparation.reservation.reviewAt.getTime() + 1_000));
    expect(
      await prisma.nurtureInstitutionWorkflow.findUniqueOrThrow({
        where: { id: preparation.journey.workflowRef },
      }),
    ).toMatchObject({ currentStage: "trial_in_progress", workflowHead: 8 });
    const entityPayload = {
      ...adminWorkflowPayload(world, preparation.journey.workflowRef, 8),
      enrollment_ref: enrollment.id,
      expected_enrollment_head: 1,
      grant_ref: grant.id,
      expected_grant_head: 1,
      reservation_ref: preparation.reservation.id,
      expected_reservation_head: 2,
    };
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: entityPayload,
        spec: markTrialReviewReachedSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { workflow_head: 9, current_stage: "trial_review" },
    });

    const extendedReviewAt = iso(world.now(), 24 * 60 * 60_000);
    const extendedEndsAt = iso(world.now(), 3 * 24 * 60 * 60_000);
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...entityPayload,
          expected_workflow_head: 9,
          trial_ends_at: extendedEndsAt,
          review_at: extendedReviewAt,
          reason_key: "guardian_requested_more_trial_time",
        },
        spec: extendTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 10,
        current_stage: "trial_in_progress",
        grant_head: 2,
        reservation_head: 3,
      },
    });

    const unauditedReviewAt = new Date(new Date(extendedReviewAt).getTime() + 60 * 60_000);
    const unauditedEndsAt = new Date(new Date(extendedEndsAt).getTime() + 60 * 60_000);
    await expect(
      prisma.$transaction(async (transaction) => {
        await transaction.nurtureEnrollmentTrialReservation.update({
          where: { id: preparation.reservation.id },
          data: {
            reviewAt: unauditedReviewAt,
            trialEndsAt: unauditedEndsAt,
            reservationHead: { increment: 1 },
          },
        });
        await transaction.nurtureChildLinkGrant.update({
          where: { id: grant.id },
          data: {
            expiresAt: unauditedEndsAt,
            aggregateVersion: { increment: 1 },
          },
        });
        await transaction.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
      }),
    ).rejects.toThrow();

    world.setClock(new Date(extendedReviewAt));
    const extendedEntities = {
      ...entityPayload,
      expected_workflow_head: 10,
      expected_grant_head: 2,
      expected_reservation_head: 3,
    };
    await execute({
      world,
      actorRef: world.admin.id,
      payload: extendedEntities,
      spec: markTrialReviewReachedSpec,
    });
    const proposed = await execute({
      world,
      actorRef: world.admin.id,
      payload: {
        ...extendedEntities,
        expected_workflow_head: 11,
        expected_capacity_revision: world.careGroup.aggregateVersion,
        proposed_formal_start_at: world.now().toISOString(),
        proposed_grant_purposes: ["trial_care"],
        proposed_grant_expires_at: iso(world.now(), 5 * 24 * 60 * 60_000),
        safe_family_summary: "Guardian reviewed the formal care continuation.",
        proposal_expires_at: iso(world.now(), 2 * 24 * 60 * 60_000),
        reason_key: "admin_proposed_formal_continuation",
      },
      spec: proposeFormalEnrollmentSpec,
    });
    expect(proposed).toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 12,
        current_stage: "formal_enrollment_confirmation",
      },
    });

    const endCommandId = `end-trial:${randomUUID()}`;
    const endPayload = {
      ...extendedEntities,
      expected_workflow_head: 12,
      reason_key: "trial_not_continued",
    };
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        commandId: endCommandId,
        payload: endPayload,
        spec: endTrialSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        workflow_head: 13,
        current_stage: "closed",
        enrollment_status: "ended",
        grant_status: "revoked",
        reservation_state: "released",
      },
    });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        commandId: endCommandId,
        payload: endPayload,
        spec: endTrialSpec,
      }),
    ).resolves.toMatchObject({ status: "ok", disposition: "replayed" });
    expect(
      await prisma.nurtureEnrollmentWaitlistEntry.findUniqueOrThrow({
        where: { id: preparation.entry.id },
      }),
    ).toMatchObject({ lifecycle: "accepted" });
    expect(
      await prisma.nurtureEnrollmentTrialOffer.findUniqueOrThrow({
        where: { id: preparation.offer.id },
      }),
    ).toMatchObject({ lifecycle: "accepted" });
    expect(
      await prisma.nurtureEnrollmentTrialOffer.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
  });
  it("uses the full canonical action identity for idempotency", async () => {
    const world = await seed();
    const actionRef = `shared-action:${randomUUID()}`;
    const first = await startJourney(world);
    await expect(
      qualify({
        world,
        journey: first,
        actionRef,
        actionType: "waitlist_acceptance",
      }),
    ).resolves.toMatchObject({ status: "ok" });

    world.setClock(new Date(world.now().getTime() + 1_000));
    const second = await startJourney(world);
    await expect(
      qualify({
        world,
        journey: second,
        actionRef,
        actionType: "guardian_confirmation",
      }),
    ).resolves.toMatchObject({ status: "ok" });
    expect(
      await prisma.nurtureEnrollmentWaitlistEntry.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(2);
  });

  it("defaults to standard FIFO and keeps the family projection rank-free", async () => {
    const world = await seed();
    const journey = await startJourney(world);
    await expect(
      qualify({ world, journey, category: "priority" }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "waitlist_category_not_allowed",
    });
    await expect(qualify({ world, journey })).resolves.toMatchObject({
      status: "ok",
      committed_result: {
        current_stage: "capacity_waitlist",
        entry_lifecycle: "active",
      },
    });
    const entry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
    });
    expect(entry).toMatchObject({
      policyRef: "nurture.default-standard-fifo",
      policyRevision: 0,
      categoryKey: "standard",
      categoryOrder: 0,
      lifecycle: "active",
    });
    expect(entry.waitlistQualifiedAt.toISOString()).toBe(world.now().toISOString());

    const queries = new NurtureEnrollmentWaitlistQueryService(
      new PrismaEnrollmentWaitlistRepository(prisma, world.now),
    );
    const adminQueue = await queries.readAdminQueue({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      participant_ref: world.admin.id,
      role_assignment_ref: world.role.id,
      target_care_group_ref: world.careGroup.id,
    });
    expect(adminQueue).toMatchObject({
      status: "resolved",
      projection: { orderedEntries: [{ entryRef: entry.id, categoryKey: "standard" }] },
    });
    const owner = guardianAction(world, { contactRef: journey.contactRef });
    const family = await queries.readFamilyStatus({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      workflow_ref: journey.workflowRef,
      owner_snapshot: owner,
    });
    expect(family).toMatchObject({
      status: "resolved",
      projection: { status: "waitlisted", targetClassSafeLabel: "Exact Trial Class" },
    });
    const familyJson = JSON.stringify(family);
    expect(familyJson).not.toContain("category");
    expect(familyJson).not.toContain("rank");
    expect(familyJson).not.toContain("orderedEntries");

    const qualifiedAt = entry.waitlistQualifiedAt.toISOString();
    const orderKey = entry.orderKey;
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...adminWorkflowPayload(world, journey.workflowRef, 4),
          entry_ref: entry.id,
          expected_entry_head: 1,
          interest_state: "unanswered" as const,
          next_review_at: iso(world.now(), 8 * 24 * 60 * 60_000),
        },
        spec: reviewWaitlistInterestSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { waiting_state: "waiting_on_guardian" },
    });
    const afterUnanswered =
      await prisma.nurtureEnrollmentWaitlistEntry.findUniqueOrThrow({
        where: { id: entry.id },
      });
    expect(afterUnanswered).toMatchObject({
      lifecycle: "active",
      interestState: "waiting_on_guardian",
      categoryKey: "standard",
      orderKey,
    });
    expect(afterUnanswered.waitlistQualifiedAt.toISOString()).toBe(qualifiedAt);
    const staleReview = guardianAction(world, {
      contactRef: journey.contactRef,
      occurredAt: iso(afterUnanswered.lastReviewedAt!, -1_000),
    });
    await expect(
      execute({
        world,
        actorRef: staleReview.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, journey.workflowRef, 5),
          entry_ref: entry.id,
          expected_entry_head: 2,
          interest_state: "confirmed" as const,
          next_review_at: iso(world.now(), 9 * 24 * 60 * 60_000),
          guardian_action_owner_snapshot: staleReview,
        },
        spec: reviewWaitlistInterestSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "waitlist_review_state_conflict",
    });
  });

  it("accepts exactly once under the class lock and cancels preparation locally", async () => {
    const world = await seed();
    const journey = await startJourney(world);
    await qualify({ world, journey });
    const entry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
    });
    await prisma.nurtureEnrollment.update({
      where: { id: world.occupyingEnrollment.id },
      data: { status: "ended", leftAt: world.now() },
    });
    const offerCommandId = `offer:${randomUUID()}`;
    const offerInput = {
      world,
      workflowRef: journey.workflowRef,
      workflowHead: 4,
      entryRef: entry.id,
      entryHead: 1,
      commandId: offerCommandId,
    };
    const issued = await issueOffer(offerInput);
    expect(issued).toMatchObject({ status: "ok", disposition: "executed" });
    await expect(issueOffer(offerInput)).resolves.toMatchObject({
      status: "ok",
      disposition: "replayed",
    });
    const offer = await prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
    });
    world.setClock(new Date(world.now().getTime() + 60_000));
    const acceptance = guardianAction(world, { contactRef: journey.contactRef });
    const acceptCommandId = `accept:${randomUUID()}`;
    const acceptPayload = {
      ...workflowPayload(world, journey.workflowRef, 5),
      entry_ref: entry.id,
      expected_entry_head: 2,
      offer_ref: offer.id,
      expected_offer_head: 1,
      guardian_action_owner_snapshot: acceptance,
    };
    await expect(
      execute({
        world,
        actorRef: acceptance.actor_ref.object_id,
        commandId: acceptCommandId,
        payload: acceptPayload,
        spec: acceptTrialOfferSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        current_stage: "trial_preparation",
        reservation_state: "held",
      },
    });
    await expect(
      execute({
        world,
        actorRef: acceptance.actor_ref.object_id,
        commandId: acceptCommandId,
        payload: acceptPayload,
        spec: acceptTrialOfferSpec,
      }),
    ).resolves.toMatchObject({ status: "ok", disposition: "replayed" });
    const reservation =
      await prisma.nurtureEnrollmentTrialReservation.findFirstOrThrow({
        where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
      });
    expect(
      await prisma.nurtureEnrollmentTrialReservation.count({
        where: { workspaceId: world.workspaceId, workflowId: journey.workflowRef },
      }),
    ).toBe(1);
    await expect(
      prisma.nurtureCareGroup.update({
        where: { id: world.careGroup.id },
        data: { capacity: 0 },
      }),
    ).rejects.toThrow();
    const family = await new NurtureEnrollmentWaitlistQueryService(
      new PrismaEnrollmentWaitlistRepository(prisma, world.now),
    ).readFamilyStatus({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      workflow_ref: journey.workflowRef,
      owner_snapshot: guardianAction(world, { contactRef: journey.contactRef }),
    });
    expect(family).toMatchObject({
      status: "resolved",
      projection: {
        status: "trial_preparation",
        nextExpectedContactAt: offer.reviewAt.toISOString(),
      },
    });

    const staleCancellation = guardianAction(world, {
      contactRef: journey.contactRef,
      occurredAt: iso(reservation.heldAt, -1_000),
    });
    await expect(
      execute({
        world,
        actorRef: staleCancellation.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, journey.workflowRef, 6),
          entry_ref: entry.id,
          expected_entry_head: 3,
          offer_ref: offer.id,
          expected_offer_head: 2,
          reservation_ref: reservation.id,
          expected_reservation_head: 1,
          reason_key: "guardian_cancelled_preparation",
          guardian_action_owner_snapshot: staleCancellation,
        },
        spec: cancelTrialPreparationSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_preparation_cancel_conflict",
    });

    const blockedChild = await prisma.nurtureChild.create({
      data: { workspaceId: world.workspaceId, displayName: "Blocked child", status: "active" },
    });
    const blockedProcess = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: world.workspaceId, childId: blockedChild.id, status: "active" },
    });
    await expect(
      prisma.nurtureEnrollment.create({
        data: {
          workspaceId: world.workspaceId,
          childCareProcessId: blockedProcess.id,
          institutionId: world.institution.id,
          careGroupId: world.careGroup.id,
          status: "active",
          participationPhase: "formal",
        },
      }),
    ).rejects.toThrow();

    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...adminWorkflowPayload(world, journey.workflowRef, 6),
          entry_ref: entry.id,
          expected_entry_head: 3,
          offer_ref: offer.id,
          expected_offer_head: 2,
          reservation_ref: reservation.id,
          expected_reservation_head: 1,
          reason_key: "guardian_cancelled_preparation",
        },
        spec: cancelTrialPreparationSpec,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: {
        current_stage: "closed",
        reservation_state: "released",
      },
    });
    expect(
      await prisma.nurtureEnrollment.count({ where: { workspaceId: world.workspaceId } }),
    ).toBe(1);
    expect(
      await prisma.nurtureChildLinkGrant.count({ where: { workspaceId: world.workspaceId } }),
    ).toBe(0);
    expect(
      await prisma.nurtureEnrollmentTrialReservation.findUniqueOrThrow({
        where: { id: reservation.id },
      }),
    ).toMatchObject({ state: "released", reservationHead: 2 });
  });

  it("orders by configured category, audits overrides, and requires explicit offer expiry", async () => {
    const world = await seed();
    await prisma.nurtureEnrollmentWaitlistPolicy.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        contractVersion: "1.0.0",
        policyRef: "waitlist-policy",
        policyRevision: 1,
        categoryKeys: ["priority", "standard"],
        reviewReminderMinutes: 60,
        reviewDeadlineMinutes: 1_440,
        offerValidityMinMinutes: 60,
        offerValidityMaxMinutes: 10_080,
        effectiveFrom: new Date(world.now().getTime() - 24 * 60 * 60_000),
        changedByRoleAssignmentId: world.role.id,
        changeReason: "Initial transparent category order",
      },
    });
    const first = await startJourney(world);
    await qualify({ world, journey: first, category: "standard" });
    world.setClock(new Date(world.now().getTime() + 1_000));
    const second = await startJourney(world);
    await qualify({ world, journey: second, category: "priority" });
    const firstEntry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: first.workflowRef },
    });
    const secondEntry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: second.workflowRef },
    });
    const queries = new NurtureEnrollmentWaitlistQueryService(
      new PrismaEnrollmentWaitlistRepository(prisma, world.now),
    );
    const before = await queries.readAdminQueue({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      participant_ref: world.admin.id,
      role_assignment_ref: world.role.id,
      target_care_group_ref: world.careGroup.id,
    });
    expect(before.status === "resolved" && before.projection.orderedEntries.map((row) => row.entryRef))
      .toEqual([secondEntry.id, firstEntry.id]);

    const revisionTwoAt = new Date(world.now().getTime() + 60_000);
    await prisma.nurtureEnrollmentWaitlistPolicy.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        contractVersion: "1.0.0",
        policyRef: "waitlist-policy",
        policyRevision: 2,
        categoryKeys: ["standard", "priority"],
        reviewReminderMinutes: 60,
        reviewDeadlineMinutes: 1_440,
        offerValidityMinMinutes: 60,
        offerValidityMaxMinutes: 10_080,
        effectiveFrom: revisionTwoAt,
        changedByRoleAssignmentId: world.role.id,
        changeReason: "Scheduled transparent category order revision",
      },
    });
    world.setClock(new Date(revisionTwoAt.getTime() + 1_000));
    const pinned = await queries.readAdminQueue({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      participant_ref: world.admin.id,
      role_assignment_ref: world.role.id,
      target_care_group_ref: world.careGroup.id,
    });
    expect(pinned.status === "resolved" && pinned.projection.orderedEntries.map((row) => row.entryRef))
      .toEqual([secondEntry.id, firstEntry.id]);

    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...adminWorkflowPayload(world, first.workflowRef, 4),
          entry_ref: firstEntry.id,
          expected_entry_head: 1,
          category_key: "standard",
          category_basis_key: "documented_override",
          reason_key: "admin_documented_exception",
        },
        spec: overrideWaitlistCategorySpec,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    const override = await prisma.nurtureEnrollmentWaitlistOverride.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, entryId: firstEntry.id },
    });
    expect(override).toMatchObject({
      beforeCategoryKey: "standard",
      beforePolicyRevision: 1,
      afterCategoryKey: "standard",
      afterPolicyRevision: 2,
      entryHeadBefore: 1,
      entryHeadAfter: 2,
    });
    await expect(
      prisma.nurtureEnrollmentWaitlistOverride.update({
        where: { id: override.id },
        data: { reasonKey: "rewritten" },
      }),
    ).rejects.toThrow();
    const after = await queries.readAdminQueue({
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      participant_ref: world.admin.id,
      role_assignment_ref: world.role.id,
      target_care_group_ref: world.careGroup.id,
    });
    expect(after.status === "resolved" && after.projection.orderedEntries.map((row) => row.entryRef))
      .toEqual([firstEntry.id, secondEntry.id]);

    await prisma.nurtureEnrollment.update({
      where: { id: world.occupyingEnrollment.id },
      data: { status: "ended", leftAt: world.now() },
    });
    await expect(
      issueOffer({
        world,
        workflowRef: second.workflowRef,
        workflowHead: 4,
        entryRef: secondEntry.id,
        entryHead: 1,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "waitlist_order_conflict",
    });
    await expect(
      issueOffer({
        world,
        workflowRef: first.workflowRef,
        workflowHead: 5,
        entryRef: firstEntry.id,
        entryHead: 2,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    const firstOffer = await prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, entryId: firstEntry.id, lifecycle: "open" },
    });
    const staleDecline = guardianAction(world, {
      contactRef: first.contactRef,
      occurredAt: iso(firstOffer.issuedAt, -1_000),
    });
    await expect(
      execute({
        world,
        actorRef: staleDecline.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, first.workflowRef, 6),
          entry_ref: firstEntry.id,
          expected_entry_head: 3,
          offer_ref: firstOffer.id,
          expected_offer_head: 1,
          disposition: "declined" as const,
          next_review_at: iso(world.now(), 24 * 60 * 60_000),
          reason_key: "guardian_declined_dates",
          guardian_action_owner_snapshot: staleDecline,
        },
        spec: declineOrExpireTrialOfferSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "trial_offer_close_conflict",
    });
    world.setClock(new Date(world.now().getTime() + 1_000));
    const decline = guardianAction(world, { contactRef: first.contactRef });
    await expect(
      execute({
        world,
        actorRef: decline.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, first.workflowRef, 6),
          entry_ref: firstEntry.id,
          expected_entry_head: 3,
          offer_ref: firstOffer.id,
          expected_offer_head: 1,
          disposition: "declined" as const,
          next_review_at: iso(world.now(), 24 * 60 * 60_000),
          reason_key: "guardian_declined_dates",
          guardian_action_owner_snapshot: decline,
        },
        spec: declineOrExpireTrialOfferSpec,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    expect(
      await prisma.nurtureEnrollmentTrialOffer.findUniqueOrThrow({
        where: { id: firstOffer.id },
      }),
    ).toMatchObject({ decidedAt: new Date(decline.occurred_at) });
    expect(
      await prisma.nurtureEnrollmentTrialOffer.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
    expect(
      await prisma.nurtureEnrollmentWaitlistEntry.findUniqueOrThrow({
        where: { id: secondEntry.id },
      }),
    ).toMatchObject({ lifecycle: "active", currentOfferId: null });

    world.setClock(new Date(world.now().getTime() + 60_000));
    const reconfirm = guardianAction(world, { contactRef: first.contactRef });
    await execute({
      world,
      actorRef: reconfirm.actor_ref.object_id,
      payload: {
        ...workflowPayload(world, first.workflowRef, 7),
        entry_ref: firstEntry.id,
        expected_entry_head: 4,
        interest_state: "confirmed" as const,
        next_review_at: iso(world.now(), 7 * 24 * 60 * 60_000),
        guardian_action_owner_snapshot: reconfirm,
      },
      spec: reviewWaitlistInterestSpec,
    });
    await issueOffer({
      world,
      workflowRef: first.workflowRef,
      workflowHead: 8,
      entryRef: firstEntry.id,
      entryHead: 5,
    });
    const expiring = await prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
      where: {
        workspaceId: world.workspaceId,
        entryId: firstEntry.id,
        lifecycle: "open",
      },
    });
    world.setClock(new Date(expiring.expiresAt.getTime() + 1_000));
    expect(
      await prisma.nurtureEnrollmentTrialOffer.findUniqueOrThrow({
        where: { id: expiring.id },
      }),
    ).toMatchObject({ lifecycle: "open", offerHead: 1 });
    await expect(
      execute({
        world,
        actorRef: world.admin.id,
        payload: {
          ...adminWorkflowPayload(world, first.workflowRef, 9),
          entry_ref: firstEntry.id,
          expected_entry_head: 6,
          offer_ref: expiring.id,
          expected_offer_head: 1,
          disposition: "expired" as const,
          next_review_at: iso(world.now(), 24 * 60 * 60_000),
          reason_key: "offer_window_elapsed",
        },
        spec: declineOrExpireTrialOfferSpec,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    expect(
      await prisma.nurtureEnrollmentTrialOffer.findUniqueOrThrow({
        where: { id: expiring.id },
      }),
    ).toMatchObject({ lifecycle: "expired", offerHead: 2 });
  });

  it("serializes different offer acceptances on the exact class and never overbooks", async () => {
    const world = await seed();
    await prisma.nurtureCareGroup.update({
      where: { id: world.careGroup.id },
      data: { capacity: 2, aggregateVersion: { increment: 1 } },
    });
    const secondChild = await prisma.nurtureChild.create({
      data: { workspaceId: world.workspaceId, displayName: "Second occupant", status: "active" },
    });
    const secondProcess = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: world.workspaceId, childId: secondChild.id, status: "active" },
    });
    const secondEnrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: secondProcess.id,
        institutionId: world.institution.id,
        careGroupId: world.careGroup.id,
        status: "active",
        participationPhase: "formal",
      },
    });
    const first = await startJourney(world);
    await qualify({ world, journey: first, expectedCapacityRevision: 1 });
    world.setClock(new Date(world.now().getTime() + 1_000));
    const second = await startJourney(world);
    await qualify({ world, journey: second, expectedCapacityRevision: 1 });
    const firstEntry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: first.workflowRef },
    });
    const secondEntry = await prisma.nurtureEnrollmentWaitlistEntry.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, workflowId: second.workflowRef },
    });
    await prisma.nurtureEnrollment.update({
      where: { id: world.occupyingEnrollment.id },
      data: { status: "ended", leftAt: world.now() },
    });
    await prisma.nurtureEnrollment.update({
      where: { id: secondEnrollment.id },
      data: { status: "ended", leftAt: world.now() },
    });
    await issueOffer({
      world,
      workflowRef: first.workflowRef,
      workflowHead: 4,
      entryRef: firstEntry.id,
      entryHead: 1,
    });
    await issueOffer({
      world,
      workflowRef: second.workflowRef,
      workflowHead: 4,
      entryRef: secondEntry.id,
      entryHead: 1,
    });
    const [firstOffer, secondOffer] = await Promise.all([
      prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
        where: { workspaceId: world.workspaceId, entryId: firstEntry.id },
      }),
      prisma.nurtureEnrollmentTrialOffer.findFirstOrThrow({
        where: { workspaceId: world.workspaceId, entryId: secondEntry.id },
      }),
    ]);
    await prisma.nurtureCareGroup.update({
      where: { id: world.careGroup.id },
      data: { capacity: 1, aggregateVersion: { increment: 1 } },
    });
    world.setClock(new Date(world.now().getTime() + 60_000));
    const firstAcceptance = guardianAction(world, { contactRef: first.contactRef });
    const secondAcceptance = guardianAction(world, { contactRef: second.contactRef });
    const results = await Promise.all([
      execute({
        world,
        actorRef: firstAcceptance.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, first.workflowRef, 5),
          entry_ref: firstEntry.id,
          expected_entry_head: 2,
          offer_ref: firstOffer.id,
          expected_offer_head: 1,
          guardian_action_owner_snapshot: firstAcceptance,
        },
        spec: acceptTrialOfferSpec,
      }),
      execute({
        world,
        actorRef: secondAcceptance.actor_ref.object_id,
        payload: {
          ...workflowPayload(world, second.workflowRef, 5),
          entry_ref: secondEntry.id,
          expected_entry_head: 2,
          offer_ref: secondOffer.id,
          expected_offer_head: 1,
          guardian_action_owner_snapshot: secondAcceptance,
        },
        spec: acceptTrialOfferSpec,
      }),
    ]);
    expect(results.filter((result) => result.status === "ok")).toHaveLength(1);
    expect(
      results.filter(
        (result) =>
          result.status === "not_committed" &&
          result.decision === "conflict" &&
          [
            "trial_reservation_capacity_conflict",
            "command_write_conflict",
          ].includes(result.reason_code),
      ),
    ).toHaveLength(1);
    expect(
      await prisma.nurtureEnrollmentTrialReservation.count({
        where: {
          workspaceId: world.workspaceId,
          targetCareGroupId: world.careGroup.id,
          state: "held",
        },
      }),
    ).toBe(1);
  });
});
