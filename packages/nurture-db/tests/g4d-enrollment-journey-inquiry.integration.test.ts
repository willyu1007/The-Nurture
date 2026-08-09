import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureEnrollmentJourneyQueryService,
  closeInquirySpec,
  confirmIntentConversationSpec,
  recordExternalTouchpointSpec,
  recordOrSkipVisitSpec,
  startEnrollmentInquirySpec,
  type NurtureCommandSpec,
  type NurtureStartEnrollmentInquiryPayload,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaEnrollmentJourneyRepository,
  createNurtureRepositories,
} from "../src/index.js";

const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(createNurtureRepositories(prisma).commands);

afterAll(async () => {
  await prisma.$disconnect();
});

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Enrollment Institution",
      status: "active",
    },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Target Class",
      status: "active",
    },
  });
  const participant = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `enrollment-admin:${randomUUID()}`,
      status: "active",
    },
  });
  const role = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: participant.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
    },
  });
  return { workspaceId, institution, careGroup, participant, role };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const startPayload = (scope: Scope): NurtureStartEnrollmentInquiryPayload => ({
  workspace_id: scope.workspaceId,
  institution_ref: scope.institution.id,
  role_assignment_ref: scope.role.id,
  expected_workflow_head: 0,
  workflow_run_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_run",
    object_id: `run:${randomUUID()}`,
    version: 1,
  },
  contact_owner_snapshot: {
    contract_version: "1.0.0",
    contact_ref: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "prospective_contact",
      object_id: `contact:${randomUUID()}`,
      version: 1,
    },
    safe_label: "Guardian contact",
    verified_at: "2026-08-10T01:00:00.000Z",
  },
  preferred_label: "Momo",
  age_band_key: "toddler",
  expected_entry_start_date: "2026-09-01",
  expected_entry_end_date: "2026-09-30",
  target_class_type_key: "full_day",
  target_age_band_key: "toddler",
  target_care_group_ref: scope.careGroup.id,
  care_schedule_need_keys: ["weekdays"],
  source_channel: "referral",
  safety_label_keys: [],
  initial_contact_at: "2026-08-10T01:00:00.000Z",
  next_touchpoint_at: "2026-08-11T01:00:00.000Z",
});

const execute = <Payload>(input: {
  scope: Scope;
  commandId: string;
  payload: Payload;
  spec: NurtureCommandSpec<Payload>;
}) =>
  runner.execute({
    workspace_id: input.scope.workspaceId,
    invocation_request_id: `invocation:${input.commandId}`,
    command_request_id: input.commandId,
    business_actor_ref: input.scope.participant.id,
    payload: input.payload,
    spec: input.spec,
  });

describe("T-007 G4-D enrollment inquiry carrier (production DB lane)", () => {
  it("commits one inquiry journey and replays without a second transition", async () => {
    const scope = await seed();
    const payload = startPayload(scope);
    const commandId = `enrollment-start:${randomUUID()}`;
    const started = await execute({
      scope,
      commandId,
      payload,
      spec: startEnrollmentInquirySpec,
    });
    expect(started).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { workflow_head: 1, current_stage: "inquiry" },
    });

    const replay = await execute({
      scope,
      commandId,
      payload: {
        ...payload,
        contact_owner_snapshot: {
          ...payload.contact_owner_snapshot,
          safe_label: "Refreshed safe label",
          verified_at: "2026-08-10T02:00:00.000Z",
        },
      },
      spec: startEnrollmentInquirySpec,
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    await expect(
      execute({
        scope,
        commandId: `enrollment-start-duplicate:${randomUUID()}`,
        payload,
        spec: startEnrollmentInquirySpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "workflow_run_already_bound",
    });
    expect(
      await prisma.nurtureInstitutionWorkflowTransition.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(1);

    const workflow = await prisma.nurtureInstitutionWorkflow.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { inquiry: true },
    });
    expect(workflow.inquiry).toMatchObject({
      preferredLabel: "Momo",
      ageBandKey: "toddler",
      targetCareGroupId: scope.careGroup.id,
      contactSafeLabel: "Guardian contact",
    });
    expect(workflow.inquiry?.birthYearMonthProtectionPayload).toBeNull();
  });

  it("advances only through explicit commands and projects no private carrier ref", async () => {
    const scope = await seed();
    const start = await execute({
      scope,
      commandId: `enrollment-start:${randomUUID()}`,
      payload: startPayload(scope),
      spec: startEnrollmentInquirySpec,
    });
    if (start.status !== "ok" || !start.committed_result) {
      throw new Error("enrollment start did not commit");
    }
    const workflow = await prisma.nurtureInstitutionWorkflow.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    const touchpointPayload = {
      workspace_id: scope.workspaceId,
      institution_ref: scope.institution.id,
      role_assignment_ref: scope.role.id,
      workflow_ref: workflow.id,
      expected_workflow_head: 1,
      source_channel: "phone",
      confirmed_need_keys: ["weekday_care"],
      safety_label_keys: [],
      next_action_key: "confirm_intent",
      responsible_role: "institution_admin" as const,
      occurred_at: "2026-08-10T02:00:00.000Z",
      due_at: "2026-08-11T01:00:00.000Z",
      next_touchpoint_at: "2026-08-11T01:00:00.000Z",
      external_summary_body_envelope: {
        algVersion: 1 as const,
        keyRef: "enrollment-key",
        ciphertext: "c3VtbWFyeQ",
        integrityTag: "dGFn",
      },
    };
    await expect(
      execute({
        scope,
        commandId: `enrollment-touchpoint:${randomUUID()}`,
        payload: touchpointPayload,
        spec: recordExternalTouchpointSpec,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    const originalTouchpoint =
      await prisma.nurtureEnrollmentTouchpoint.findFirstOrThrow({
        where: {
          workspaceId: scope.workspaceId,
          workflowId: workflow.id,
          sourceKind: "external_structured_summary",
        },
      });
    await expect(
      execute({
        scope,
        commandId: `enrollment-touchpoint-predated-correction:${randomUUID()}`,
        payload: {
          ...touchpointPayload,
          expected_workflow_head: 2,
          occurred_at: "2026-08-10T01:59:59.999Z",
          supersedes_touchpoint_ref: originalTouchpoint.id,
          correction_reason: "Corrected structured summary",
        },
        spec: recordExternalTouchpointSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "touchpoint_correction_conflict",
    });
    await expect(
      execute({
        scope,
        commandId: `enrollment-intent:${randomUUID()}`,
        payload: {
          workspace_id: scope.workspaceId,
          institution_ref: scope.institution.id,
          role_assignment_ref: scope.role.id,
          workflow_ref: workflow.id,
          expected_workflow_head: 2,
        },
        spec: confirmIntentConversationSpec,
      }),
    ).resolves.toMatchObject({ status: "ok" });
    await execute({
      scope,
      commandId: `enrollment-visit:${randomUUID()}`,
      payload: {
        workspace_id: scope.workspaceId,
        institution_ref: scope.institution.id,
        role_assignment_ref: scope.role.id,
        workflow_ref: workflow.id,
        expected_workflow_head: 3,
        disposition: "skipped" as const,
      },
      spec: recordOrSkipVisitSpec,
    });
    await execute({
      scope,
      commandId: `enrollment-close:${randomUUID()}`,
      payload: {
        workspace_id: scope.workspaceId,
        institution_ref: scope.institution.id,
        role_assignment_ref: scope.role.id,
        workflow_ref: workflow.id,
        expected_workflow_head: 4,
        close_reason_key: "family_declined",
      },
      spec: closeInquirySpec,
    });

    const query = new NurtureEnrollmentJourneyQueryService(
      new PrismaEnrollmentJourneyRepository(prisma),
    );
    const result = await query.read({
      workspace_id: scope.workspaceId,
      institution_ref: scope.institution.id,
      participant_ref: scope.participant.id,
      role_assignment_ref: scope.role.id,
      workflow_ref: workflow.id,
      surface: "institution_admin_web",
    });
    expect(result).toMatchObject({
      status: "resolved",
      projection: {
        state: "closed",
        currentStage: "closed",
        workflowHead: 5,
        capabilityRefs: [],
      },
    });
    expect(JSON.stringify(result)).not.toContain(workflow.id);
    expect(JSON.stringify(result)).not.toContain("Guardian contact");
  });

  it("enforces immutable audit rows and inquiry identity constraints", async () => {
    const scope = await seed();
    const payload = startPayload(scope);
    await execute({
      scope,
      commandId: `enrollment-start:${randomUUID()}`,
      payload,
      spec: startEnrollmentInquirySpec,
    });
    const workflow = await prisma.nurtureInstitutionWorkflow.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { inquiry: true, transitions: true },
    });
    await expect(
      prisma.nurtureInstitutionWorkflowTransition.update({
        where: { id: workflow.transitions[0]!.id },
        data: { reasonKey: "rewritten" },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.nurtureEnrollmentInquiry.update({
        where: { id: workflow.inquiry!.id },
        data: {
          birthYearMonthProtectionPayload: {
            algVersion: 1,
            keyRef: "enrollment-key",
            ciphertext: "eWVhci1tb250aA",
            integrityTag: "dGFn",
          },
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.nurtureInstitutionWorkflow.delete({ where: { id: workflow.id } }),
    ).rejects.toThrow();
    await expect(
      prisma.nurtureInstitutionWorkflow.update({
        where: { id: workflow.id },
        data: { workflowHead: { increment: 1 } },
      }),
    ).rejects.toThrow();

    const secondInstitution = await prisma.nurtureCareInstitution.create({
      data: {
        workspaceId: scope.workspaceId,
        displayName: "Second Enrollment Institution",
        status: "active",
      },
    });
    await expect(
      prisma.nurtureInstitutionWorkflow.create({
        data: {
          workspaceId: scope.workspaceId,
          institutionId: secondInstitution.id,
          workflowRunRef: payload.workflow_run_ref,
          workflowRunObjectId: payload.workflow_run_ref.object_id,
          provisionalSubjectRef: randomUUID(),
          lifecycle: "active",
          currentStage: "inquiry",
          waitingState: "ready",
          pendingTransition: "none",
          terminalOutcome: "none",
          completedMilestones: ["inquiry_started"],
          workflowHead: 1,
        },
      }),
    ).rejects.toThrow();

    const expandedRunObjectId = `run:${randomUUID()}`;
    await expect(
      prisma.nurtureInstitutionWorkflow.create({
        data: {
          workspaceId: scope.workspaceId,
          institutionId: scope.institution.id,
          workflowRunRef: {
            schema_version: 1,
            namespace: "my_chat",
            object_type: "workflow_run",
            object_id: expandedRunObjectId,
            raw_contact: "must-not-persist",
          },
          workflowRunObjectId: expandedRunObjectId,
          provisionalSubjectRef: randomUUID(),
          lifecycle: "active",
          currentStage: "inquiry",
          waitingState: "ready",
          pendingTransition: "none",
          terminalOutcome: "none",
          completedMilestones: ["inquiry_started"],
          workflowHead: 1,
        },
      }),
    ).rejects.toThrow();

    const invalidMilestoneRunObjectId = `run:${randomUUID()}`;
    await expect(
      prisma.nurtureInstitutionWorkflow.create({
        data: {
          workspaceId: scope.workspaceId,
          institutionId: scope.institution.id,
          workflowRunRef: {
            schema_version: 1,
            namespace: "my_chat",
            object_type: "workflow_run",
            object_id: invalidMilestoneRunObjectId,
          },
          workflowRunObjectId: invalidMilestoneRunObjectId,
          provisionalSubjectRef: randomUUID(),
          lifecycle: "active",
          currentStage: "inquiry",
          waitingState: "ready",
          pendingTransition: "none",
          terminalOutcome: "none",
          completedMilestones: [
            "inquiry_started",
            "trial_offer_accepted",
          ],
          workflowHead: 1,
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.nurtureEnrollmentTouchpoint.create({
        data: {
          workspaceId: scope.workspaceId,
          institutionId: scope.institution.id,
          workflowId: workflow.id,
          inquiryId: workflow.inquiry!.id,
          sourceKind: "external_structured_summary",
          sourceChannel: "phone",
          externalSummaryBodyEnvelope: {},
          confirmedNeedKeys: [],
          safetyLabelKeys: [],
          nextActionKey: "confirm_intent",
          responsibleRole: "institution_admin",
          occurredAt: new Date("2026-08-10T02:00:00.000Z"),
          dueAt: new Date("2026-08-11T01:00:00.000Z"),
          nextTouchpointAt: new Date("2026-08-11T01:00:00.000Z"),
          actorRoleAssignmentId: scope.role.id,
        },
      }),
    ).rejects.toThrow();
  });
});
