import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureInstitutionClassListService,
  resolveEffectiveSchedule,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaInstitutionClassListRepository } from "../src/repositories/institution-class-list.repository.js";

/**
 * G4-B increment 3 — the Admin class list over real rows.
 *
 * 0C-5 §6 fixture 14 says the order is identical before and after a state
 * change that alters counts and support-signal levels. The unit tests assert
 * that over a stub; this asserts it over rows whose counts actually move.
 */

const prisma = createPrismaClient();
// Resolution is injected rather than reached for: the repository reads layers,
// the domain decides which one is in force.
const service = new NurtureInstitutionClassListService(
  new PrismaInstitutionClassListRepository(prisma, (layers, care_group_ref, local_date) =>
    resolveEffectiveSchedule({ care_group_ref, local_date, layers }),
  ),
);

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);
const day = new Date(`${today}T00:00:00.000Z`);

const ask = {
  direction: "family_to_org" as const,
  data_class: "daily_care_log" as const,
  purpose_key: "care_coordination",
};

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "List Institution", status: "active" },
  });
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${randomUUID()}`, status: "active" },
  });
  return { workspaceId, institution, teacher };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const addClass = (scope: Scope, name: string, ageBandKey: string | null) =>
  prisma.nurtureCareGroup.create({
    data: {
      workspaceId: scope.workspaceId,
      institutionId: scope.institution.id,
      name,
      ...(ageBandKey ? { ageBandKey } : {}),
      status: "active",
    },
  });

const addChild = async (scope: Scope, careGroupId: string, label: string) => {
  const child = await prisma.nurtureChild.create({
    data: { workspaceId: scope.workspaceId, displayName: label, status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId: scope.workspaceId, childId: child.id, status: "active" },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: process.id,
      institutionId: scope.institution.id,
      careGroupId,
      status: "active",
    },
  });
  return { process, enrollment };
};

const grantFor = (
  scope: Scope,
  child: { process: { id: string }; enrollment: { id: string } },
) =>
  prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: scope.workspaceId,
      childCareProcessId: child.process.id,
      enrollmentId: child.enrollment.id,
      grantedByParticipantId: scope.teacher.id,
      grantedToScopeType: "institution",
      grantedToScopeId: scope.institution.id,
      directions: ["family_to_org"],
      dataClasses: ["daily_care_log"],
      purposes: ["care_coordination"],
      status: "active",
    },
  });

const compose = (scope: Scope) =>
  service.compose({
    workspace_id: scope.workspaceId,
    institution_ref: scope.institution.id,
    local_date: today,
    at_minute: 600,
    ask,
  });

describe("T-007 G4-B class list (production DB lane)", () => {
  it("orders by stored age band then name, whatever order the rows come back in", async () => {
    const scope = await seed();
    // Created deliberately out of order.
    await addClass(scope, "Zebra", "toddler");
    await addClass(scope, "Ant", "infant");
    await addClass(scope, "Bee", "toddler");
    const list = await compose(scope);
    expect(list.entries.map((entry) => entry.safe_class_label)).toEqual(["Ant", "Bee", "Zebra"]);
  });

  /**
   * Fixture 14 over real rows: submit an attendance day and add work items,
   * then re-read. The order must be byte-identical.
   */
  it("does not reorder when attendance and counts change", async () => {
    const scope = await seed();
    const quiet = await addClass(scope, "Quiet", "infant");
    const busy = await addClass(scope, "Busy", "toddler");
    const child = await addChild(scope, busy.id, "Child");
    await grantFor(scope, child);

    const before = (await compose(scope)).entries.map((entry) => entry.care_group_ref);

    const teacherRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scope.teacher.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: busy.id,
        status: "active",
      },
    });
    const submission = await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: busy.id,
        localDate: day,
        state: "submitted",
        submissionHead: 1,
        submittedByRoleAssignmentId: teacherRole.id,
        submittedAt: new Date(),
      },
    });
    await prisma.nurtureAttendanceEntry.create({
      data: {
        workspaceId: scope.workspaceId,
        submissionId: submission.id,
        childCareProcessId: child.process.id,
        state: "present",
      },
    });

    const after = await compose(scope);
    expect(after.entries.map((entry) => entry.care_group_ref)).toEqual(before);
    // The busy class's state changed; its position did not.
    const busyEntry = after.entries.find((entry) => entry.care_group_ref === busy.id);
    expect(busyEntry!.attendance).toEqual({ state: "submitted", confirmed_present_count: 1 });
    expect(
      after.entries.find((entry) => entry.care_group_ref === quiet.id)!.attendance,
    ).toEqual({ state: "unsubmitted" });
  });

  it("counts only `present`, not excused absence or not-expected", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    const present = await addChild(scope, klass.id, "Present");
    const excused = await addChild(scope, klass.id, "Excused");
    const notExpected = await addChild(scope, klass.id, "Not Expected");
    for (const child of [present, excused, notExpected]) await grantFor(scope, child);

    const teacherRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scope.teacher.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: klass.id,
        status: "active",
      },
    });
    const submission = await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: klass.id,
        localDate: day,
        state: "submitted",
        submissionHead: 1,
        submittedByRoleAssignmentId: teacherRole.id,
        submittedAt: new Date(),
      },
    });
    await prisma.nurtureAttendanceEntry.createMany({
      data: [
        {
          workspaceId: scope.workspaceId,
          submissionId: submission.id,
          childCareProcessId: present.process.id,
          state: "present",
        },
        {
          workspaceId: scope.workspaceId,
          submissionId: submission.id,
          childCareProcessId: excused.process.id,
          state: "excused_absent",
        },
        {
          workspaceId: scope.workspaceId,
          submissionId: submission.id,
          childCareProcessId: notExpected.process.id,
          state: "not_expected",
        },
      ],
    });

    const list = await compose(scope);
    expect(list.entries[0]!.attendance).toEqual({
      state: "submitted",
      confirmed_present_count: 1,
    });
  });

  /**
   * 0D-1 §4 and 0C-5 §5 over real grants: one member without a covering grant
   * refuses the whole count rather than under-reporting it.
   */
  it("refuses the count when one member's grant does not cover the ask", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    const granted = await addChild(scope, klass.id, "Granted");
    const ungranted = await addChild(scope, klass.id, "Ungranted");
    await grantFor(scope, granted);

    const teacherRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scope.teacher.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: klass.id,
        status: "active",
      },
    });
    const submission = await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: klass.id,
        localDate: day,
        state: "submitted",
        submissionHead: 1,
        submittedByRoleAssignmentId: teacherRole.id,
        submittedAt: new Date(),
      },
    });
    await prisma.nurtureAttendanceEntry.createMany({
      data: [granted, ungranted].map((child) => ({
        workspaceId: scope.workspaceId,
        submissionId: submission.id,
        childCareProcessId: child.process.id,
        state: "present" as const,
      })),
    });

    const list = await compose(scope);
    // A filtered count would say 1. The Admin gets a refusal instead.
    expect(list.entries[0]!.attendance).toMatchObject({ state: "unavailable" });
    expect(list.entries[0]!.attendance).not.toHaveProperty("confirmed_present_count");
  });

  it("returns no count and reads no grant for an unsubmitted class", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    const child = await addChild(scope, klass.id, "Child");
    // Deliberately NO grant: an unsubmitted day must answer without needing one.
    void child;
    const list = await compose(scope);
    expect(list.entries[0]!.attendance).toEqual({ state: "unsubmitted" });
  });

  /**
   * G4-B increment 6 — the card fields that needed 0D-2's tables, over real
   * schedule, placement and capture rows.
   */
  it("carries the schedule, its layer and the activity window", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: klass.id,
        layer: "class_standing",
        slotsPayload: [
          { slot_ref: "morning", label: "Morning", starts_at_minute: 540, ends_at_minute: 660 },
          { slot_ref: "afternoon", label: "Afternoon", starts_at_minute: 840, ends_at_minute: 960 },
        ],
      },
    });
    const card = (await compose(scope)).entries[0]!;
    expect(card.schedule).toMatchObject({
      resolved_from: "class_standing",
      has_temporary_override: false,
      current_activity: { activity_ref: "morning", label: "Morning" },
      next_activity: { activity_ref: "afternoon", label: "Afternoon" },
    });
    expect(card.schedule!.schedule_version).toBeGreaterThan(0);
  });

  it("flags a day override, and shows no schedule when the class has none", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    expect((await compose(scope)).entries[0]!.schedule).toBeNull();

    await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: klass.id,
        localDate: day,
        slotsPayload: [
          { slot_ref: "trip", label: "Trip", starts_at_minute: 540, ends_at_minute: 960 },
        ],
      },
    });
    expect((await compose(scope)).entries[0]!.schedule).toMatchObject({
      resolved_from: "day_override",
      has_temporary_override: true,
      current_activity: { activity_ref: "trip" },
    });
  });

  it("selects a placed photo and carries a text timestamp without its body", async () => {
    const scope = await seed();
    const klass = await addClass(scope, "Class", "infant");
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: klass.id,
        layer: "class_standing",
        slotsPayload: [
          { slot_ref: "morning", label: "Morning", starts_at_minute: 540, ends_at_minute: 660 },
        ],
      },
    });
    const teacherRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: scope.teacher.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: klass.id,
        status: "active",
      },
    });
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: klass.id,
        uploadedByRoleAssignmentId: teacherRole.id,
        sourceKind: "class_album",
        lifecycle: "ready",
        storageRefPayload: { ref: randomUUID() },
      },
    });
    const capture = await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: klass.id,
        capturedByRoleAssignmentId: teacherRole.id,
        kind: "media",
        sourceSequence: 1,
        stable: true,
        mediaAssetRefId: asset.id,
        occurredAt: new Date(`${today}T02:00:00.000Z`),
      },
    });
    await prisma.nurtureActivityPlacement.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceKind: "care_capture",
        sourceId: capture.id,
        careGroupId: klass.id,
        localDate: day,
        state: "placed",
        activityRef: "morning",
        decidedBy: "schedule_window",
      },
    });
    // A text capture, whose body is protected and must not reach the card.
    await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: klass.id,
        capturedByRoleAssignmentId: teacherRole.id,
        kind: "text",
        sourceSequence: 2,
        stable: true,
        bodyProtectionPayload: { sealed: "must-not-appear" },
        occurredAt: new Date(`${today}T03:00:00.000Z`),
      },
    });

    const card = (await compose(scope)).entries[0]!;
    expect(card.latest_photo).toMatchObject({
      media_ref: asset.id,
      selected_by: "current_activity",
    });
    expect(card.latest_text).toEqual({
      source_timestamp_ms: new Date(`${today}T03:00:00.000Z`).getTime(),
    });
    // The protected body appears nowhere in the projection.
    expect(JSON.stringify(card)).not.toContain("must-not-appear");
  });

  it("scopes the list to one institution", async () => {
    const scope = await seed();
    const other = await seed();
    await addClass(scope, "Mine", "infant");
    await addClass(other, "Theirs", "infant");
    const list = await compose(scope);
    expect(list.entries).toHaveLength(1);
    expect(list.entries[0]!.safe_class_label).toBe("Mine");
  });
});
