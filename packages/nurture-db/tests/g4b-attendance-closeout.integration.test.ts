import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { NurtureAttendanceCloseoutService } from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaAttendanceRepository } from "../src/repositories/attendance-closeout.repository.js";

/**
 * G4-B increment 1 — 0D-1's write path over real rows.
 *
 * The I1 branch freeze named the thing worth executing here: 0D-1 closed its
 * open point by giving `submit` the precondition `revise` already had, which
 * is a claim about behaviour under two concurrent writers. No freeze record
 * can demonstrate that; two submissions racing on one (class, date) can.
 */

const prisma = createPrismaClient();
const service = new NurtureAttendanceCloseoutService(new PrismaAttendanceRepository(prisma));

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Attendance Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const makeParticipant = (label: string) =>
    prisma.nurtureParticipant.create({
      data: { workspaceId, myChatUserId: `${label}:${randomUUID()}`, status: "active" },
    });
  const teacherA = await makeParticipant("teacher-a");
  const teacherB = await makeParticipant("teacher-b");
  const admin = await makeParticipant("admin");

  const role = (participantId: string, role: "caregiver" | "institution_admin", scopeId: string) =>
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId,
        role,
        scopeType: role === "caregiver" ? "care_group" : "institution",
        scopeId,
        status: "active",
      },
    });
  const roleA = await role(teacherA.id, "caregiver", careGroup.id);
  const roleB = await role(teacherB.id, "caregiver", careGroup.id);
  const adminRole = await role(admin.id, "institution_admin", institution.id);

  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      status: "active",
    },
  });

  return { workspaceId, institution, careGroup, roleA, roleB, adminRole, process };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const entries = (scope: Scope, state: "present" | "absent" = "present") => [
  { child_process_ref: scope.process.id, state },
];

const request = (scope: Scope, overrides: Record<string, unknown> = {}) => ({
  workspace_id: scope.workspaceId,
  care_group_ref: scope.careGroup.id,
  local_date: today,
  role_assignment_ref: scope.roleA.id,
  expected_head: 0,
  command: { kind: "submit" as const, entries: entries(scope) },
  ...overrides,
});

describe("T-007 G4-B attendance closeout (production DB lane)", () => {
  it("leaves a day with no submission unsubmitted, and no elapsed time settles it", async () => {
    const scope = await seed();
    const count = await prisma.nurtureDailyAttendanceSubmission.count({
      where: { workspaceId: scope.workspaceId },
    });
    expect(count).toBe(0);
    // The absence of a row IS the state. Nothing produces one but a teacher.
    await expect(
      service.execute(request(scope, { command: { kind: "reopen" }, role_assignment_ref: scope.adminRole.id })),
    ).resolves.toMatchObject({ status: "denied", reason_code: "not_authorized" });
  });

  it("commits a submission and its entries at head 1", async () => {
    const scope = await seed();
    await expect(service.execute(request(scope))).resolves.toEqual({
      status: "committed",
      submission_head: 1,
      state: "submitted",
    });
    const row = await prisma.nurtureDailyAttendanceSubmission.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    expect(row).toMatchObject({
      state: "submitted",
      submissionHead: 1,
      submittedByRoleAssignmentId: scope.roleA.id,
    });
    expect(row.entries).toHaveLength(1);
    expect(row.entries[0]).toMatchObject({ childCareProcessId: scope.process.id, state: "present" });
  });

  /**
   * The evidence the I1 freeze asked for. Both teachers hold a valid
   * assignment and both believe the day is unsubmitted, because both composed
   * their preview before either wrote.
   */
  it("resolves two concurrent submits as one winner and one conflict", async () => {
    const scope = await seed();
    const [first, second] = await Promise.all([
      service.execute(request(scope, { role_assignment_ref: scope.roleA.id })),
      service.execute(
        request(scope, {
          role_assignment_ref: scope.roleB.id,
          command: { kind: "submit" as const, entries: entries(scope, "absent") },
        }),
      ),
    ]);
    const outcomes = [first, second];
    expect(outcomes.filter((o) => o.status === "committed")).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === "denied")).toHaveLength(1);
    expect(outcomes.find((o) => o.status === "denied")).toMatchObject({
      layer: "concurrency",
      reason_code: "conflict",
    });

    // Exactly one row, and the loser's entries were never written.
    const rows = await prisma.nurtureDailyAttendanceSubmission.findMany({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.entries).toHaveLength(1);
    expect(rows[0]!.submissionHead).toBe(1);
  });

  it("lets the losing teacher revise with a correct head, and records both in order", async () => {
    const scope = await seed();
    await service.execute(request(scope, { role_assignment_ref: scope.roleA.id }));
    // The second teacher reloads, sees head 1, and revises knowingly.
    await expect(
      service.execute(
        request(scope, {
          role_assignment_ref: scope.roleB.id,
          expected_head: 1,
          command: { kind: "revise" as const, entries: entries(scope, "absent") },
        }),
      ),
    ).resolves.toMatchObject({ status: "committed", submission_head: 2 });
    const row = await prisma.nurtureDailyAttendanceSubmission.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    expect(row.submissionHead).toBe(2);
    expect(row.entries[0]).toMatchObject({ state: "absent" });
    // The original submitter is retained: the audit shows who confirmed first.
    expect(row.submittedByRoleAssignmentId).toBe(scope.roleA.id);
  });

  /**
   * The submit race is decided by the unique index; a revise race is not,
   * because the row already exists. What decides it is `apply` writing
   * conditionally on the head it read — the window between the decision and
   * the write, which the decision function alone cannot close.
   */
  it("resolves two concurrent revisions as one winner and one conflict", async () => {
    const scope = await seed();
    await service.execute(request(scope));
    // Both teachers read head 1 and revise from it.
    const revision = (roleRef: string, state: "present" | "absent") =>
      service.execute(
        request(scope, {
          role_assignment_ref: roleRef,
          expected_head: 1,
          command: { kind: "revise" as const, entries: entries(scope, state) },
        }),
      );
    const outcomes = await Promise.all([
      revision(scope.roleA.id, "absent"),
      revision(scope.roleB.id, "present"),
    ]);
    expect(outcomes.filter((o) => o.status === "committed")).toHaveLength(1);
    expect(outcomes.find((o) => o.status === "denied")).toMatchObject({
      layer: "concurrency",
      reason_code: "conflict",
    });
    const row = await prisma.nurtureDailyAttendanceSubmission.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    // One increment, not two, and one entry set — never a merge of both.
    expect(row.submissionHead).toBe(2);
    expect(row.entries).toHaveLength(1);
  });

  it("denies an Admin submit and revision, and admits their reopen", async () => {
    const scope = await seed();
    await expect(
      service.execute(request(scope, { role_assignment_ref: scope.adminRole.id })),
    ).resolves.toMatchObject({ layer: "authority", reason_code: "not_authorized" });

    await service.execute(request(scope));
    await expect(
      service.execute(
        request(scope, {
          role_assignment_ref: scope.adminRole.id,
          expected_head: 1,
          command: { kind: "revise" as const, entries: entries(scope, "absent") },
        }),
      ),
    ).resolves.toMatchObject({ reason_code: "not_authorized" });

    await expect(
      service.execute(
        request(scope, {
          role_assignment_ref: scope.adminRole.id,
          expected_head: 1,
          command: { kind: "reopen" as const },
        }),
      ),
    ).resolves.toMatchObject({ status: "committed", submission_head: 2, state: "reopened" });

    const row = await prisma.nurtureDailyAttendanceSubmission.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    // Reopen changed no entry.
    expect(row.entries[0]).toMatchObject({ state: "present" });
    expect(row.reopenedByRoleAssignmentId).toBe(scope.adminRole.id);
  });

  it("refuses a client holding the pre-reopen head", async () => {
    const scope = await seed();
    await service.execute(request(scope));
    await service.execute(
      request(scope, {
        role_assignment_ref: scope.adminRole.id,
        expected_head: 1,
        command: { kind: "reopen" as const },
      }),
    );
    // The teacher still holds 1; the reopen moved it to 2.
    await expect(
      service.execute(
        request(scope, {
          expected_head: 1,
          command: { kind: "revise" as const, entries: entries(scope, "absent") },
        }),
      ),
    ).resolves.toMatchObject({ layer: "concurrency", reason_code: "conflict" });
  });

  /**
   * 0D-1 §4: the assignment is tested against the day being closed out, not
   * against now. A teacher whose assignment started today cannot close out
   * yesterday.
   */
  it("tests the assignment against the day being closed, not against now", async () => {
    const scope = await seed();
    const yesterday = new Date(Date.parse(`${today}T00:00:00.000Z`) - 86_400_000)
      .toISOString()
      .slice(0, 10);
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.roleA.id },
      data: { startsAt: new Date(`${today}T00:00:00.000Z`) },
    });
    await expect(
      service.execute(request(scope, { local_date: yesterday })),
    ).resolves.toMatchObject({ layer: "authority", reason_code: "not_authorized" });
    // The same teacher closing out today is fine.
    await expect(service.execute(request(scope))).resolves.toMatchObject({
      status: "committed",
    });
  });

  it("denies a caregiver of another class with the same code as no assignment", async () => {
    const scope = await seed();
    const other = await seed();
    await expect(
      service.execute(request(scope, { role_assignment_ref: other.roleA.id })),
    ).resolves.toMatchObject({ layer: "authority", reason_code: "not_authorized" });
    await expect(
      service.execute(request(scope, { role_assignment_ref: randomUUID() })),
    ).resolves.toMatchObject({ layer: "authority", reason_code: "not_authorized" });
  });
});
