import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureContentRevisionQueryService,
  addInstitutionNoteSpec,
  adjustActivityPlacementSpec,
  downscopeContentVisibilitySpec,
  type NurtureAddInstitutionNotePayload,
  type NurtureAdjustActivityPlacementPayload,
  type NurtureCommandSpec,
  type NurtureDownscopeContentVisibilityPayload,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";
import { PrismaContentRevisionRepository } from "../src/repositories/content-revision.repository.js";

const prisma = createPrismaClient();
const commandRunner = new NurtureCommandRunner(createNurtureRepositories(prisma).commands);
const queryService = new NurtureContentRevisionQueryService(
  new PrismaContentRevisionRepository(prisma),
);

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);
const day = new Date(`${today}T00:00:00.000Z`);

const envelope = (ciphertext: string) => ({
  algVersion: 1 as const,
  keyRef: "institution-note-key",
  ciphertext,
  integrityTag: "dGFn",
});

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Revision Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  await prisma.nurtureClassScheduleTemplate.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      layer: "class_standing",
      slotsPayload: [
        { slot_ref: "morning", label: "Morning", starts_at_minute: 540, ends_at_minute: 660 },
        {
          slot_ref: "afternoon",
          label: "Afternoon",
          starts_at_minute: 840,
          ends_at_minute: 960,
        },
      ],
    },
  });

  const participant = (label: string) =>
    prisma.nurtureParticipant.create({
      data: { workspaceId, myChatUserId: `${label}:${randomUUID()}`, status: "active" },
    });
  const admin = await participant("admin");
  const teacher = await participant("teacher");
  const adminRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
    },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: careGroup.id,
      status: "active",
    },
  });
  const dualCaregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: careGroup.id,
      status: "active",
    },
  });
  const capture = await prisma.nurtureCareCapture.create({
    data: {
      workspaceId,
      careGroupId: careGroup.id,
      capturedByRoleAssignmentId: teacherRole.id,
      kind: "text",
      sourceSequence: 1,
      stable: true,
      bodyProtectionPayload: envelope("b3JpZ2luYWw"),
      occurredAt: new Date(),
    },
  });
  const asset = await prisma.nurtureMediaAssetRef.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      uploadedByRoleAssignmentId: teacherRole.id,
      sourceKind: "class_album",
      storageRefPayload: { object_ref: `asset:${randomUUID()}` },
      lifecycle: "ready",
      capturedAt: new Date(),
    },
  });
  const placement = await prisma.nurtureActivityPlacement.create({
    data: {
      workspaceId,
      sourceKind: "care_capture",
      sourceId: capture.id,
      careGroupId: careGroup.id,
      localDate: day,
      state: "placed",
      activityRef: "morning",
      decidedBy: "schedule_window",
      placementHead: 1,
    },
  });
  return {
    workspaceId,
    institution,
    careGroup,
    admin,
    teacher,
    adminRole,
    teacherRole,
    dualCaregiverRole,
    capture,
    asset,
    placement,
  };
};

type Scope = Awaited<ReturnType<typeof seed>>;

let commandSequence = 0;
const execute = <Payload>(
  scope: Scope,
  spec: NurtureCommandSpec<Payload>,
  payload: Payload,
  actorRef = scope.admin.id,
  commandId = `content-revision-${++commandSequence}-${randomUUID()}`,
) =>
  commandRunner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation-${commandId}`,
    command_request_id: commandId,
    business_actor_ref: actorRef,
    payload,
    spec,
  });

const placementPayload = (
  scope: Scope,
  overrides: Partial<NurtureAdjustActivityPlacementPayload> = {},
): NurtureAdjustActivityPlacementPayload => ({
  workspace_id: scope.workspaceId,
  role_assignment_ref: scope.adminRole.id,
  source_kind: "care_capture",
  source_ref: scope.capture.id,
  activity_ref: "afternoon",
  expected_placement_head: 1,
  expected_revision_head: 0,
  reason: "Move to the afternoon activity",
  ...overrides,
});

const visibilityPayload = (
  scope: Scope,
  overrides: Partial<NurtureDownscopeContentVisibilityPayload> = {},
): NurtureDownscopeContentVisibilityPayload => ({
  workspace_id: scope.workspaceId,
  role_assignment_ref: scope.adminRole.id,
  target_kind: "care_capture",
  target_ref: scope.capture.id,
  expected_revision_head: 0,
  reason: "Restrict until reviewed",
  hide: true,
  ...overrides,
});

const notePayload = (
  scope: Scope,
  overrides: Partial<NurtureAddInstitutionNotePayload> = {},
): NurtureAddInstitutionNotePayload => ({
  workspace_id: scope.workspaceId,
  role_assignment_ref: scope.adminRole.id,
  target_kind: "media_asset_ref",
  target_ref: scope.asset.id,
  expected_revision_head: 0,
  reason: "Add institution context",
  note_body_envelope: envelope("bm90ZS0x"),
  ...overrides,
});

describe("T-007 G4-C append-only content revision (production DB lane)", () => {
  it("advances placement and appends its audit revision in one command", async () => {
    const scope = await seed();
    const original = await prisma.nurtureCareCapture.findUniqueOrThrow({
      where: { id: scope.capture.id },
    });
    await expect(
      execute(scope, adjustActivityPlacementSpec, placementPayload(scope)),
    ).resolves.toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { subject_kind: "placement", revision_head: 1, placement_head: 2 },
    });

    const [placement, revisions, unchanged] = await Promise.all([
      prisma.nurtureActivityPlacement.findUniqueOrThrow({ where: { id: scope.placement.id } }),
      prisma.nurtureContentRevision.findMany({ where: { workspaceId: scope.workspaceId } }),
      prisma.nurtureCareCapture.findUniqueOrThrow({ where: { id: scope.capture.id } }),
    ]);
    expect(placement).toMatchObject({
      state: "placed",
      activityRef: "afternoon",
      decidedBy: "admin",
      placementHead: 2,
    });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({
      subjectKind: "placement",
      revisionHead: 1,
      decidedByBefore: "schedule_window",
      actorRoleAssignmentId: scope.adminRole.id,
      supersedesRef: null,
    });
    expect(revisions[0]!.previousValue).toEqual({
      state: "placed",
      activity_ref: "morning",
      decided_by: "schedule_window",
    });
    expect(revisions[0]!.newValue).toEqual({
      state: "placed",
      activity_ref: "afternoon",
      decided_by: "admin",
    });
    // The teacher original is byte-for-byte the same row outside normal
    // Prisma timestamp serialization; only placement's projection moved.
    expect(unchanged).toEqual(original);
  });

  it("replays the same request to the original revision without a second append", async () => {
    const scope = await seed();
    const commandId = `content-revision-replay-${randomUUID()}`;
    const first = await execute(
      scope,
      adjustActivityPlacementSpec,
      placementPayload(scope),
      scope.admin.id,
      commandId,
    );
    const replay = await execute(
      scope,
      adjustActivityPlacementSpec,
      placementPayload(scope),
      scope.admin.id,
      commandId,
    );
    expect(first).toMatchObject({ status: "ok", disposition: "executed" });
    expect(replay).toMatchObject({
      status: "ok",
      disposition: "replayed",
      committed_result: { revision_head: 1, placement_head: 2 },
    });
    expect(
      await prisma.nurtureContentRevision.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(1);
    await expect(
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { activity_ref: null }),
        scope.admin.id,
        commandId,
      ),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "idempotency_conflict",
    });
  });

  it("admits placement only into the one effective schedule layer", async () => {
    const scope = await seed();
    await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        slotsPayload: [
          {
            slot_ref: "override-only",
            label: "Override Only",
            starts_at_minute: 600,
            ends_at_minute: 720,
          },
        ],
      },
    });

    await expect(
      execute(scope, adjustActivityPlacementSpec, placementPayload(scope)),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    await expect(
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { activity_ref: "override-only" }),
      ),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { revision_head: 1, placement_head: 2 },
    });
  });

  it("appends a corrective placement revision and keeps both immutable", async () => {
    const scope = await seed();
    await execute(scope, adjustActivityPlacementSpec, placementPayload(scope));
    await execute(
      scope,
      adjustActivityPlacementSpec,
      placementPayload(scope, {
        activity_ref: "morning",
        expected_placement_head: 2,
        expected_revision_head: 1,
        reason: "Correct the prior Admin move",
      }),
    );
    const rows = await prisma.nurtureContentRevision.findMany({
      where: { workspaceId: scope.workspaceId },
      orderBy: { revisionHead: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ revisionHead: 2, supersedesRef: rows[0]!.id });
    expect(rows[1]!.previousValue).toEqual(rows[0]!.newValue);

    await expect(
      prisma.nurtureContentRevision.update({
        where: { id: rows[0]!.id },
        data: { reason: "rewrite" },
      }),
    ).rejects.toThrow(/append-only/);
    await expect(
      prisma.nurtureContentRevision.delete({ where: { id: rows[0]!.id } }),
    ).rejects.toThrow(/append-only/);
    expect(
      await prisma.nurtureContentRevision.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(2);
  });

  it("records only monotone visibility restrictions, with no mutable capture column", async () => {
    const scope = await seed();
    await execute(
      scope,
      downscopeContentVisibilitySpec,
      visibilityPayload(scope, { restrict_audiences: ["attributed_guardians"] }),
    );
    await execute(
      scope,
      downscopeContentVisibilitySpec,
      visibilityPayload(scope, {
        hide: undefined,
        suspend_publication: true,
        expected_revision_head: 1,
        reason: "Suspend publication eligibility",
      }),
    );
    const rows = await prisma.nurtureContentRevision.findMany({
      where: { workspaceId: scope.workspaceId, subjectKind: "visibility" },
      orderBy: { revisionHead: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.previousValue).toEqual({
      hidden: false,
      publication_eligible: true,
      restricted_audiences: [],
    });
    expect(rows[1]!.newValue).toEqual({
      hidden: true,
      publication_eligible: false,
      restricted_audiences: ["attributed_guardians"],
    });
    expect(await prisma.nurtureCareCapture.findUniqueOrThrow({ where: { id: scope.capture.id } }))
      .not.toHaveProperty("visibility");
  });

  it("stores institution notes only as closed protected envelopes", async () => {
    const scope = await seed();
    await execute(scope, addInstitutionNoteSpec, notePayload(scope));
    await execute(
      scope,
      addInstitutionNoteSpec,
      notePayload(scope, {
        expected_revision_head: 1,
        note_body_envelope: envelope("bm90ZS0y"),
        reason: "Correct the note",
      }),
    );
    const rows = await prisma.nurtureContentRevision.findMany({
      where: { workspaceId: scope.workspaceId, subjectKind: "institution_note" },
      orderBy: { revisionHead: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.previousValue).toEqual({ body_envelope: null });
    expect(rows[1]!.previousValue).toEqual(rows[0]!.newValue);
    expect(JSON.stringify(rows)).not.toContain("embedding");
  });

  it("denies a selected caregiver role and a slot outside the target class", async () => {
    const scope = await seed();
    const otherCareGroup = await prisma.nurtureCareGroup.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        name: "Other Class",
        status: "active",
      },
    });
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: otherCareGroup.id,
        layer: "class_standing",
        slotsPayload: [
          {
            slot_ref: "other-class-only",
            label: "Other Class Only",
            starts_at_minute: 540,
            ends_at_minute: 660,
          },
        ],
      },
    });
    await expect(
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { role_assignment_ref: scope.dualCaregiverRole.id }),
        scope.admin.id,
      ),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    await expect(
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { activity_ref: "other-class-only" }),
      ),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    expect(
      await prisma.nurtureContentRevision.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(0);
  });

  it("rejects stale heads and resolves concurrent writers as one append", async () => {
    const scope = await seed();
    await expect(
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { expected_revision_head: 1 }),
      ),
    ).resolves.toMatchObject({ status: "not_committed", decision: "conflict" });

    const outcomes = await Promise.all([
      execute(scope, adjustActivityPlacementSpec, placementPayload(scope)),
      execute(
        scope,
        adjustActivityPlacementSpec,
        placementPayload(scope, { activity_ref: null, reason: "Leave unplaced" }),
      ),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "ok")).toHaveLength(1);
    expect(
      await prisma.nurtureContentRevision.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(1);
    expect(
      (await prisma.nurtureActivityPlacement.findUniqueOrThrow({ where: { id: scope.placement.id } }))
        .placementHead,
    ).toBe(2);
  });

  it("enforces lane, non-empty, hash and contiguous-chain constraints at the database", async () => {
    const scope = await seed();
    const base = {
      workspaceId: scope.workspaceId,
      subjectKind: "visibility" as const,
      subjectRef: `nurture:care_capture:${scope.capture.id}`,
      previousValue: {
        hidden: false,
        publication_eligible: true,
        restricted_audiences: [],
      },
      newValue: {
        hidden: true,
        publication_eligible: true,
        restricted_audiences: [],
      },
      actorRoleAssignmentId: scope.adminRole.id,
      revisionHead: 1,
      contractVersion: "1.0.0",
    };

    await expect(
      prisma.nurtureContentRevision.create({
        data: {
          ...base,
          id: randomUUID(),
          subjectRef: `nurture:activity_placement:${scope.placement.id}`,
          reason: "Invalid visibility lane",
          commandRequestIdHash: "a".repeat(64),
        },
      }),
    ).rejects.toThrow(/ck_nurture_content_revision_lane/);
    await expect(
      prisma.nurtureContentRevision.create({
        data: {
          ...base,
          id: randomUUID(),
          reason: "   ",
          commandRequestIdHash: "b".repeat(64),
        },
      }),
    ).rejects.toThrow(/ck_nurture_content_revision_nonempty/);
    await expect(
      prisma.nurtureContentRevision.create({
        data: {
          ...base,
          id: randomUUID(),
          reason: "Invalid hash",
          commandRequestIdHash: "not-a-sha256",
        },
      }),
    ).rejects.toThrow(/ck_nurture_content_revision_nonempty/);

    await execute(scope, downscopeContentVisibilitySpec, visibilityPayload(scope));
    const first = await prisma.nurtureContentRevision.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, subjectKind: "visibility" },
    });
    await expect(
      prisma.nurtureContentRevision.create({
        data: {
          ...base,
          id: randomUUID(),
          previousValue: base.previousValue,
          newValue: {
            hidden: true,
            publication_eligible: false,
            restricted_audiences: [],
          },
          reason: "Skip the prior value",
          supersedesRef: first.id,
          revisionHead: 2,
          commandRequestIdHash: "c".repeat(64),
        },
      }),
    ).rejects.toThrow(/chain is not contiguous/);
    expect(
      await prisma.nurtureContentRevision.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(1);
  });

  it("returns the complete actor-authorized chain and fails closed after role revoke", async () => {
    const scope = await seed();
    await execute(
      scope,
      downscopeContentVisibilitySpec,
      visibilityPayload(scope, { restrict_audiences: ["attributed_guardians"] }),
    );
    const request = {
      workspace_id: scope.workspaceId,
      participant_ref: scope.admin.id,
      role_assignment_ref: scope.adminRole.id,
      subject_kind: "visibility" as const,
      target: { target_kind: "care_capture" as const, target_ref: scope.capture.id },
    };
    await expect(queryService.query(request)).resolves.toMatchObject({
      status: "resolved",
      contract_version: "1.0.0",
      revisions: [{ revision_head: 1, actor_ref: scope.adminRole.id }],
    });

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.adminRole.id },
      data: { status: "revoked" },
    });
    await expect(queryService.query(request)).resolves.toMatchObject({
      status: "denied",
      reason_code: "role_missing",
    });
  });
});
