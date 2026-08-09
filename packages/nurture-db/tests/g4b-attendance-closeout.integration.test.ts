import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  reopenDailyAttendanceSpec,
  reviseDailyAttendanceSpec,
  submitDailyAttendanceSpec,
  type NurtureAttendanceCommandPayload,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";

/**
 * G4-B increment 1 — 0D-1's write path over real rows.
 *
 * The I1 branch freeze named the thing worth executing here: 0D-1 closed its
 * open point by giving `submit` the precondition `revise` already had, which
 * is a claim about behaviour under two concurrent writers. No freeze record
 * can demonstrate that; two submissions racing on one (class, date) can.
 */

const prisma = createPrismaClient();
const repositories = createNurtureRepositories(prisma);

/**
 * Every write goes through the command kernel, which is what gives 0D-1 §5's
 * exact-replay guarantee. There is no second path — a service that wrote
 * directly would be a route without idempotency beside one with it.
 */
let commandSeq = 0;
const execute = (
  kind: "submit" | "revise" | "reopen",
  payload: NurtureAttendanceCommandPayload,
  actorRef: string,
  commandRequestId = `attendance-${++commandSeq}-${randomUUID()}`,
) =>
  new NurtureCommandRunner(repositories.commands).execute({
    workspace_id: payload.workspace_id,
    invocation_request_id: `invocation-${commandRequestId}`,
    command_request_id: commandRequestId,
    business_actor_ref: actorRef,
    payload,
    spec:
      kind === "submit"
        ? submitDailyAttendanceSpec
        : kind === "revise"
          ? reviseDailyAttendanceSpec
          : reopenDailyAttendanceSpec,
  });

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

  const role = (participantId: string, kind: "caregiver" | "institution_admin", scopeId: string) =>
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId,
        role: kind,
        scopeType: kind === "caregiver" ? "care_group" : "institution",
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

  return { workspaceId, institution, careGroup, teacherA, roleA, roleB, adminRole, process };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const entries = (scope: Scope, state: "present" | "absent" = "present") => [
  { child_process_ref: scope.process.id, state },
];

const payloadFor = (
  scope: Scope,
  overrides: Partial<NurtureAttendanceCommandPayload> = {},
): NurtureAttendanceCommandPayload => ({
  workspace_id: scope.workspaceId,
  care_group_ref: scope.careGroup.id,
  local_date: today,
  role_assignment_ref: scope.roleA.id,
  expected_head: 0,
  entries: entries(scope),
  ...overrides,
});

const submissionOf = (scope: Scope) =>
  prisma.nurtureDailyAttendanceSubmission.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId },
    include: { entries: true },
  });

describe("T-007 G4-B attendance closeout (production DB lane)", () => {
  it("leaves a day with no submission unsubmitted, and nothing but a teacher creates one", async () => {
    const scope = await seed();
    expect(
      await prisma.nurtureDailyAttendanceSubmission.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(0);
    // The absence of a row IS the state, and an Admin cannot reopen into it.
    await expect(
      execute("reopen", payloadFor(scope, { role_assignment_ref: scope.adminRole.id }), "admin"),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
  });

  it("commits a submission and its entries at head 1", async () => {
    const scope = await seed();
    await expect(execute("submit", payloadFor(scope), "teacher-a")).resolves.toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { submission_head: 1, state: "submitted" },
    });
    const row = await submissionOf(scope);
    expect(row).toMatchObject({
      state: "submitted",
      submissionHead: 1,
      submittedByRoleAssignmentId: scope.roleA.id,
    });
    expect(row.entries).toHaveLength(1);
    expect(row.entries[0]).toMatchObject({ childCareProcessId: scope.process.id, state: "present" });
  });

  /**
   * 0D-1 §5 and its fixture 9. A replayed request id returns the FIRST result
   * — not a conflict, which is what the unique index alone would produce, and
   * not a second submission.
   */
  it("replays a submit request id to the original result, writing nothing further", async () => {
    const scope = await seed();
    const requestId = `attendance-replay-${randomUUID()}`;
    const first = await execute("submit", payloadFor(scope), "teacher-a", requestId);
    const replay = await execute("submit", payloadFor(scope), "teacher-a", requestId);

    expect(first).toMatchObject({ status: "ok", disposition: "executed" });
    expect(replay).toMatchObject({
      status: "ok",
      // `disposition` says THIS call was a replay; `business_outcome` reports
      // what the ORIGINAL execution did, which was a real write. The kernel
      // keeps them separate, and `already_satisfied` means something else —
      // a precondition that found the work already done.
      disposition: "replayed",
      business_outcome: "applied",
      committed_result: { submission_head: 1, state: "submitted" },
    });
    // The replay returns the original execution, not a new one.
    expect(replay.status === "ok" && first.status === "ok" && replay.execution_ref).toEqual(
      first.status === "ok" ? first.execution_ref : null,
    );
    expect(
      await prisma.nurtureDailyAttendanceSubmission.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(1);
    const row = await submissionOf(scope);
    expect(row.submissionHead).toBe(1);
    expect(row.entries).toHaveLength(1);
  });

  /**
   * The other half of exact-replay: the same request id carrying a DIFFERENT
   * command is not a replay, it is a mistake. Every field the caller can vary
   * must be in the command identity, or a client that retried with an edited
   * payload would silently receive the first command's result as if it were
   * the second's.
   */
  it("refuses a replayed request id whose payload changed", async () => {
    const scope = await seed();
    const requestId = `attendance-mismatch-${randomUUID()}`;
    await execute("submit", payloadFor(scope), "teacher-a", requestId);

    for (const changed of [
      payloadFor(scope, { entries: entries(scope, "absent") }),
      payloadFor(scope, { expected_head: 1 }),
      payloadFor(scope, { local_date: "2026-01-01" }),
      payloadFor(scope, { role_assignment_ref: scope.roleB.id }),
    ]) {
      await expect(
        execute("submit", changed, "teacher-a", requestId),
        JSON.stringify({ expected_head: changed.expected_head, date: changed.local_date }),
      ).resolves.toMatchObject({
        status: "not_committed",
        decision: "idempotency_conflict",
      });
    }
    expect(
      await prisma.nurtureDailyAttendanceSubmission.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(1);
  });

  it("replays revise and reopen to their original results too", async () => {
    const scope = await seed();
    await execute("submit", payloadFor(scope), "teacher-a");
    const reviseId = `attendance-revise-${randomUUID()}`;
    const revisePayload = payloadFor(scope, {
      expected_head: 1,
      entries: entries(scope, "absent"),
    });
    const revised = await execute("revise", revisePayload, "teacher-a", reviseId);
    const revisedAgain = await execute("revise", revisePayload, "teacher-a", reviseId);
    expect(revised).toMatchObject({ committed_result: { submission_head: 2 } });
    expect(revisedAgain).toMatchObject({
      disposition: "replayed",
      committed_result: { submission_head: 2 },
    });
    // Head moved once, not twice.
    expect((await submissionOf(scope)).submissionHead).toBe(2);

    const reopenId = `attendance-reopen-${randomUUID()}`;
    const reopenPayload = payloadFor(scope, {
      role_assignment_ref: scope.adminRole.id,
      expected_head: 2,
    });
    await execute("reopen", reopenPayload, "admin", reopenId);
    await expect(execute("reopen", reopenPayload, "admin", reopenId)).resolves.toMatchObject({
      disposition: "replayed",
      committed_result: { submission_head: 3, state: "reopened" },
    });
    expect((await submissionOf(scope)).submissionHead).toBe(3);
  });

  /**
   * The evidence the I1 freeze asked for. Both teachers hold a valid
   * assignment and both believe the day is unsubmitted, because both composed
   * their preview before either wrote. Distinct request ids, so this is a real
   * race rather than a replay.
   */
  it("resolves two concurrent submits as one winner and one refusal", async () => {
    const scope = await seed();
    const outcomes = await Promise.all([
      execute("submit", payloadFor(scope, { role_assignment_ref: scope.roleA.id }), "teacher-a"),
      execute(
        "submit",
        payloadFor(scope, {
          role_assignment_ref: scope.roleB.id,
          entries: entries(scope, "absent"),
        }),
        "teacher-b",
      ),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "ok")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status !== "ok")).toHaveLength(1);

    // Exactly one row, and the loser's entries were never written.
    const rows = await prisma.nurtureDailyAttendanceSubmission.findMany({
      where: { workspaceId: scope.workspaceId },
      include: { entries: true },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.entries).toHaveLength(1);
    expect(rows[0]!.submissionHead).toBe(1);
  });

  /**
   * The submit race is decided by the unique index; a revise race is not,
   * because the row already exists. What decides it is the conditional write
   * on the head that was read — the window between decision and write.
   */
  it("resolves two concurrent revisions as one winner and one refusal", async () => {
    const scope = await seed();
    await execute("submit", payloadFor(scope), "teacher-a");
    const outcomes = await Promise.all([
      execute(
        "revise",
        payloadFor(scope, { expected_head: 1, entries: entries(scope, "absent") }),
        "teacher-a",
      ),
      execute(
        "revise",
        payloadFor(scope, {
          role_assignment_ref: scope.roleB.id,
          expected_head: 1,
          entries: entries(scope, "present"),
        }),
        "teacher-b",
      ),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "ok")).toHaveLength(1);
    const row = await submissionOf(scope);
    // One increment, not two, and one entry set — never a merge of both.
    expect(row.submissionHead).toBe(2);
    expect(row.entries).toHaveLength(1);
  });

  it("lets the losing teacher revise with a correct head, keeping the original submitter", async () => {
    const scope = await seed();
    await execute("submit", payloadFor(scope, { role_assignment_ref: scope.roleA.id }), "teacher-a");
    await expect(
      execute(
        "revise",
        payloadFor(scope, {
          role_assignment_ref: scope.roleB.id,
          expected_head: 1,
          entries: entries(scope, "absent"),
        }),
        "teacher-b",
      ),
    ).resolves.toMatchObject({ status: "ok", committed_result: { submission_head: 2 } });
    const row = await submissionOf(scope);
    expect(row.submissionHead).toBe(2);
    expect(row.entries[0]).toMatchObject({ state: "absent" });
    // The audit shows who confirmed first.
    expect(row.submittedByRoleAssignmentId).toBe(scope.roleA.id);
  });

  it("denies an Admin submit and revision, and admits their reopen", async () => {
    const scope = await seed();
    await expect(
      execute("submit", payloadFor(scope, { role_assignment_ref: scope.adminRole.id }), "admin"),
    ).resolves.toMatchObject({ decision: "blocked", reason_code: "not_authorized" });

    await execute("submit", payloadFor(scope), "teacher-a");
    await expect(
      execute(
        "revise",
        payloadFor(scope, {
          role_assignment_ref: scope.adminRole.id,
          expected_head: 1,
          entries: entries(scope, "absent"),
        }),
        "admin",
      ),
    ).resolves.toMatchObject({ decision: "blocked", reason_code: "not_authorized" });

    await expect(
      execute(
        "reopen",
        payloadFor(scope, { role_assignment_ref: scope.adminRole.id, expected_head: 1 }),
        "admin",
      ),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { submission_head: 2, state: "reopened" },
    });

    const row = await submissionOf(scope);
    // Reopen changed no entry.
    expect(row.entries[0]).toMatchObject({ state: "present" });
    expect(row.reopenedByRoleAssignmentId).toBe(scope.adminRole.id);
  });

  it("refuses a client holding the pre-reopen head", async () => {
    const scope = await seed();
    await execute("submit", payloadFor(scope), "teacher-a");
    await execute(
      "reopen",
      payloadFor(scope, { role_assignment_ref: scope.adminRole.id, expected_head: 1 }),
      "admin",
    );
    // The teacher still holds 1; the reopen moved it to 2.
    await expect(
      execute(
        "revise",
        payloadFor(scope, { expected_head: 1, entries: entries(scope, "absent") }),
        "teacher-a",
      ),
    ).resolves.toMatchObject({ decision: "conflict", reason_code: "conflict" });
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
      execute("submit", payloadFor(scope, { local_date: yesterday }), "teacher-a"),
    ).resolves.toMatchObject({ decision: "blocked", reason_code: "not_authorized" });
    // The same teacher closing out today is fine.
    await expect(execute("submit", payloadFor(scope), "teacher-a")).resolves.toMatchObject({
      status: "ok",
    });
  });

  it("denies a caregiver of another class with the same code as no assignment", async () => {
    const scope = await seed();
    const other = await seed();
    await expect(
      execute("submit", payloadFor(scope, { role_assignment_ref: other.roleA.id }), "teacher-a"),
    ).resolves.toMatchObject({ decision: "blocked", reason_code: "not_authorized" });
    await expect(
      execute("submit", payloadFor(scope, { role_assignment_ref: randomUUID() }), "teacher-a"),
    ).resolves.toMatchObject({ decision: "blocked", reason_code: "not_authorized" });
  });

  /**
   * Entry order must not change the command identity: the same per-child
   * states are the same command however the client listed them, so a client
   * that retries with a reordered list gets the replay rather than a second
   * write.
   */
  it("treats a reordered entry list as the same command", async () => {
    const scope = await seed();
    const second = await prisma.nurtureChildCareProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        childId: (
          await prisma.nurtureChild.create({
            data: { workspaceId: scope.workspaceId, displayName: "Child 2", status: "active" },
          })
        ).id,
        status: "active",
      },
    });
    await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: second.id,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        status: "active",
      },
    });
    const both = [
      { child_process_ref: scope.process.id, state: "present" as const },
      { child_process_ref: second.id, state: "absent" as const },
    ];
    const requestId = `attendance-order-${randomUUID()}`;
    await execute("submit", payloadFor(scope, { entries: both }), "teacher-a", requestId);
    await expect(
      execute("submit", payloadFor(scope, { entries: [...both].reverse() }), "teacher-a", requestId),
    ).resolves.toMatchObject({ disposition: "replayed" });
    expect(
      await prisma.nurtureAttendanceEntry.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(2);
  });
});
