import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureClassScheduleService,
  NurtureCommandRunner,
  adjustActivityPlacementSpec,
  type NurtureAdjustActivityPlacementPayload,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";
import { PrismaClassSchedulePlacementRepository } from "../src/repositories/class-schedule-placement.repository.js";

/**
 * G4-B increment 4 — 0D-2 over real rows.
 *
 * The unit tests drive the rules over hand-built layers. What they cannot show
 * is that a soft-deleted layer stops winning while still advancing the
 * version, that an Admin decision survives a real second intake pass, and that
 * a cross-class move is impossible rather than merely denied.
 */

const prisma = createPrismaClient();
// The repository is IO; the service owns resolution and the automatic pass.
const repo = new PrismaClassSchedulePlacementRepository(prisma);
const service = new NurtureClassScheduleService(repo);
const commandRunner = new NurtureCommandRunner(createNurtureRepositories(prisma).commands);

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);
const day = new Date(`${today}T00:00:00.000Z`);

const slots = (...refs: Array<[string, number, number]>) =>
  refs.map(([slot_ref, starts_at_minute, ends_at_minute]) => ({
    slot_ref,
    label: slot_ref,
    starts_at_minute,
    ends_at_minute,
  }));

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Schedule Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class", status: "active" },
  });
  const admin = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `admin:${randomUUID()}`, status: "active" },
  });
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
  return { workspaceId, institution, careGroup, admin, adminRole };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const scopeOf = (scope: Scope) => ({
  workspace_id: scope.workspaceId,
  institution_ref: scope.institution.id,
  care_group_ref: scope.careGroup.id,
  local_date: today,
});

const source = (id: string, occurred_at_minute: number, bound?: string) => ({
  source_kind: "care_capture",
  source_id: id,
  occurred_at_minute,
  ...(bound ? { bound_activity_ref: bound } : {}),
});

let adjustmentSequence = 0;
const adjust = (
  scope: Scope,
  overrides: Partial<NurtureAdjustActivityPlacementPayload> = {},
) => {
  const payload: NurtureAdjustActivityPlacementPayload = {
    workspace_id: scope.workspaceId,
    role_assignment_ref: scope.adminRole.id,
    source_kind: "care_capture",
    source_ref: "s",
    activity_ref: "afternoon",
    expected_placement_head: 1,
    expected_revision_head: 0,
    reason: "Correct the class activity",
    ...overrides,
  };
  const commandId = `placement-adjust-${++adjustmentSequence}-${randomUUID()}`;
  return commandRunner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation-${commandId}`,
    command_request_id: commandId,
    business_actor_ref: scope.admin.id,
    payload,
    spec: adjustActivityPlacementSpec,
  });
};

describe("T-007 G4-B schedule resolution (production DB lane)", () => {
  it("resolves the three layers in precedence order, with no merging", async () => {
    const scope = await seed();
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        layer: "institution_default",
        slotsPayload: slots(["default", 600, 720]),
      },
    });
    expect(await service.effectiveSchedule(scopeOf(scope))).toMatchObject({
      resolved_from: "institution_default",
    });

    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        layer: "class_standing",
        slotsPayload: slots(["standing", 540, 660], ["standing-pm", 840, 960]),
      },
    });
    expect(await service.effectiveSchedule(scopeOf(scope))).toMatchObject({
      resolved_from: "class_standing",
    });

    await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        slotsPayload: slots(["today-only", 540, 600]),
      },
    });
    const resolved = await service.effectiveSchedule(scopeOf(scope));
    expect(resolved).toMatchObject({ resolved_from: "day_override" });
    // Entirely — the standing layer's afternoon does not survive.
    expect(resolved!.slots.map((entry: { slot_ref: string }) => entry.slot_ref)).toEqual(["today-only"]);
  });

  /**
   * The version must move FORWARD when a layer is removed, not back to the
   * older surviving layer's timestamp. Soft deletion is what makes that hold.
   */
  it("advances the version when a layer is soft-deleted and a lower one takes over", async () => {
    const scope = await seed();
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        layer: "class_standing",
        slotsPayload: slots(["standing", 540, 660]),
      },
    });
    const override = await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        slotsPayload: slots(["today-only", 540, 600]),
      },
    });
    const before = await service.effectiveSchedule(scopeOf(scope));
    expect(before).toMatchObject({ resolved_from: "day_override" });

    await prisma.nurtureClassScheduleDayOverride.update({
      where: { id: override.id },
      data: { deletedAt: new Date() },
    });
    const after = await service.effectiveSchedule(scopeOf(scope));
    expect(after).toMatchObject({ resolved_from: "class_standing" });
    expect(after!.schedule_version).toBeGreaterThan(before!.schedule_version);
  });

  it("resolves nothing when the class has no layer at any level", async () => {
    const scope = await seed();
    expect(await service.effectiveSchedule(scopeOf(scope))).toBeNull();
  });
});

describe("T-007 G4-B activity placement (production DB lane)", () => {
  const withSchedule = async () => {
    const scope = await seed();
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        layer: "class_standing",
        slotsPayload: slots(["morning", 540, 660], ["afternoon", 840, 960]),
      },
    });
    return scope;
  };

  it("places into the window and leaves an out-of-window source unplaced", async () => {
    const scope = await withSchedule();
    const result = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("in-window", 600), source("out-of-window", 1200)],
    });
    expect(result).toEqual({ applied: 2, skipped: 0 });
    const rows = await prisma.nurtureActivityPlacement.findMany({
      where: { workspaceId: scope.workspaceId },
      orderBy: { sourceId: "asc" },
    });
    expect(rows.map((row) => [row.sourceId, row.state, row.activityRef])).toEqual([
      ["in-window", "placed", "morning"],
      ["out-of-window", "unplaced", null],
    ]);
  });

  it("keeps an unplaced source in its own class, never moving it elsewhere", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("stray", 1200)] });
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(row.careGroupId).toBe(scope.careGroup.id);
    expect(row.state).toBe("unplaced");
  });

  it("is a no-op on a second identical pass", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    const second = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("s", 600)],
    });
    expect(second).toEqual({ applied: 0, skipped: 1 });
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    // The head did not move, so no revision was manufactured.
    expect(row.placementHead).toBe(1);
  });

  /**
   * The frozen concurrency rule, over a real second pass. Without it the next
   * intake silently reverts the Admin's correction.
   */
  it("never lets a later automatic pass overwrite an Admin adjustment", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    const adjusted = await adjust(scope);
    expect(adjusted).toMatchObject({
      status: "ok",
      committed_result: { placement_head: 2, revision_head: 1 },
    });

    const rerun = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("s", 600)],
    });
    expect(rerun).toEqual({ applied: 0, skipped: 1 });

    // Simulate a pass that read the old automatic row before the Admin write
    // committed. The repository must repeat the guard at write time.
    await expect(
      repo.writePlacement({
        workspace_id: scope.workspaceId,
        source_kind: "care_capture",
        source_id: "s",
        care_group_ref: scope.careGroup.id,
        local_date: today,
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      }),
    ).resolves.toBe(false);
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(row).toMatchObject({ activityRef: "afternoon", decidedBy: "admin", placementHead: 2 });
  });

  /**
   * The case eligibility's admin test actually decides. An Admin who unplaces
   * a source — a photo they believe is misfiled, pending a teacher's word —
   * must not have the next intake put it straight back.
   */
  it("never re-places a source the Admin deliberately unplaced", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    await adjust(scope, {
      // Unplaced on purpose.
      activity_ref: null,
    });
    const stored = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(stored).toMatchObject({ state: "unplaced", decidedBy: "admin", activityRef: null });

    // The source still falls inside the morning window, so an unprotected pass
    // would place it again.
    const rerun = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("s", 600)],
    });
    expect(rerun).toEqual({ applied: 0, skipped: 1 });
    const after = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(after).toMatchObject({ state: "unplaced", decidedBy: "admin", placementHead: 2 });
  });

  it("does not re-place an already-placed source when the schedule changes", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    // A day override that would place the same source differently.
    await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        slotsPayload: slots(["all-day", 0, 1440]),
      },
    });
    const rerun = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("s", 600)],
    });
    expect(rerun).toEqual({ applied: 0, skipped: 1 });
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    // Still in the slot that was in force when it arrived.
    expect(row.activityRef).toBe("morning");
  });

  it("absorbs an unplaced backlog when a schedule finally covers it", async () => {
    const scope = await seed();
    // No schedule at all: everything is unplaced.
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    expect(
      (await prisma.nurtureActivityPlacement.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId },
      })).state,
    ).toBe("unplaced");

    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        layer: "class_standing",
        slotsPayload: slots(["morning", 540, 660]),
      },
    });
    const rerun = await service.runAutomaticPass({
      ...scopeOf(scope),
      sources: [source("s", 600)],
    });
    expect(rerun).toEqual({ applied: 1, skipped: 0 });
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(row).toMatchObject({ state: "placed", activityRef: "morning", placementHead: 2 });
  });

  it("refuses an adjustment whose expected head has moved", async () => {
    const scope = await withSchedule();
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    await adjust(scope);
    await expect(
      adjust(scope, {
        activity_ref: "morning",
        expected_placement_head: 1,
        expected_revision_head: 1,
      }),
    ).resolves.toMatchObject({ status: "not_committed", decision: "conflict" });
  });

  /**
   * A cross-class move is impossible rather than denied by a check: the write
   * is scoped to the class, so naming another one matches no row.
   */
  it("cannot move a source into another class", async () => {
    const scope = await withSchedule();
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
        slotsPayload: slots(["other-only", 540, 660]),
      },
    });
    await service.runAutomaticPass({ ...scopeOf(scope), sources: [source("s", 600)] });
    await expect(
      adjust(scope, { activity_ref: "other-only" }),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    const row = await prisma.nurtureActivityPlacement.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(row.careGroupId).toBe(scope.careGroup.id);
  });
});
