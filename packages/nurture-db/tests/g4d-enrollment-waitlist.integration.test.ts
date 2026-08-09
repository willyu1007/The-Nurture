import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureEnrollmentWaitlistQueryService,
  acceptTrialOfferSpec,
  cancelTrialPreparationSpec,
  confirmIntentConversationSpec,
  declineOrExpireTrialOfferSpec,
  issueTrialOfferSpec,
  overrideWaitlistCategorySpec,
  qualifyCapacityWaitlistSpec,
  recordExternalTouchpointSpec,
  reviewWaitlistInterestSpec,
  startEnrollmentInquirySpec,
  type NurtureCommandSpec,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
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

describe("T-007 G4-D waitlist and trial preparation (production DB lane)", () => {
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
