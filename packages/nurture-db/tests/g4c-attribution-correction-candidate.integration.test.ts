import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureAttributionCorrectionCandidateQueryService,
  NurtureCommandRunner,
  raiseAttributionCorrectionSpec,
  type NurtureRaiseAttributionCorrectionPayload,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";
import { PrismaAttributionCorrectionCandidateRepository } from "../src/repositories/attribution-correction-candidate.repository.js";

const prisma = createPrismaClient();
const commandRunner = new NurtureCommandRunner(createNurtureRepositories(prisma).commands);
const queryService = new NurtureAttributionCorrectionCandidateQueryService(
  new PrismaAttributionCorrectionCandidateRepository(prisma),
);

afterAll(async () => {
  await prisma.$disconnect();
});

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Attribution Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const otherGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class B", status: "active" },
  });
  const admin = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `admin:${randomUUID()}`, status: "active" },
  });
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${randomUUID()}`, status: "active" },
  });
  const outsider = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `outsider:${randomUUID()}`, status: "active" },
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
  const outsiderRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: outsider.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: otherGroup.id,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
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
    },
  });
  const attribution = await prisma.nurtureChildMediaAttribution.create({
    data: {
      workspaceId,
      mediaAssetRefId: asset.id,
      childCareProcessId: process.id,
      source: "manual",
      state: "confirmed",
      attributionRevision: 1,
      confirmedByRoleAssignmentId: teacherRole.id,
      confirmedAt: new Date("2026-08-09T00:00:00.000Z"),
      exposurePolicyPayload: { audience: "own_family" },
    },
  });
  return {
    workspaceId,
    admin,
    teacher,
    outsider,
    adminRole,
    dualCaregiverRole,
    teacherRole,
    outsiderRole,
    attribution,
  };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const payload = (
  scope: Scope,
  overrides: Partial<NurtureRaiseAttributionCorrectionPayload> = {},
): NurtureRaiseAttributionCorrectionPayload => ({
  workspace_id: scope.workspaceId,
  role_assignment_ref: scope.adminRole.id,
  source_attribution_ref: scope.attribution.id,
  reason: "The child shown appears to be different",
  ...overrides,
});

const execute = (
  scope: Scope,
  input = payload(scope),
  actorRef = scope.admin.id,
  commandId = `attribution-correction-${randomUUID()}`,
) =>
  commandRunner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation-${commandId}`,
    command_request_id: commandId,
    business_actor_ref: actorRef,
    payload: input,
    spec: raiseAttributionCorrectionSpec,
  });

describe("T-007 G4-C attribution correction candidate (production DB lane)", () => {
  it("appends only the report, leaving canonical attribution and exposure unchanged", async () => {
    const scope = await seed();
    await expect(
      new PrismaAttributionCorrectionCandidateRepository(
        prisma,
      ).loadAttributionCorrectionFacts({
        workspace_id: scope.workspaceId,
        participant_ref: scope.admin.id,
        role_assignment_ref: scope.adminRole.id,
        source_attribution_ref: scope.attribution.id,
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      facts: {
        source_attribution_ref: scope.attribution.id,
        actor_role_assignment_ref: scope.adminRole.id,
        actor_role_kind: "institution_admin",
      },
    });
    const before = await prisma.nurtureChildMediaAttribution.findUniqueOrThrow({
      where: { id: scope.attribution.id },
    });
    await expect(execute(scope)).resolves.toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { source_attribution_ref: scope.attribution.id },
    });
    const after = await prisma.nurtureChildMediaAttribution.findUniqueOrThrow({
      where: { id: scope.attribution.id },
    });
    expect(after).toEqual(before);
    await expect(
      prisma.nurtureAttributionCorrectionCandidate.findMany({
        where: { workspaceId: scope.workspaceId },
      }),
    ).resolves.toMatchObject([
      {
        sourceAttributionId: scope.attribution.id,
        raisedByRoleAssignmentId: scope.adminRole.id,
        contractVersion: "1.0.0",
      },
    ]);
  });

  it("replays exactly once and never grows a candidate lifecycle", async () => {
    const scope = await seed();
    const commandId = `attribution-correction-replay-${randomUUID()}`;
    const first = await execute(scope, payload(scope), scope.admin.id, commandId);
    const replay = await execute(scope, payload(scope), scope.admin.id, commandId);
    expect(first).toMatchObject({ status: "ok", disposition: "executed" });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(
      await prisma.nurtureAttributionCorrectionCandidate.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(1);

    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nurture_attribution_correction_candidate'
      ORDER BY ordinal_position
    `;
    expect(columns.map((column) => column.column_name)).toEqual([
      "id",
      "workspace_id",
      "source_attribution_id",
      "raised_by_role_assignment_id",
      "reason",
      "command_request_id_hash",
      "contract_version",
      "occurred_at",
    ]);
  });

  it("keeps dual-role authority separated and exposes reports only to the exact class", async () => {
    const scope = await seed();
    await expect(
      execute(
        scope,
        payload(scope, { role_assignment_ref: scope.dualCaregiverRole.id }),
      ),
    ).resolves.toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    await execute(scope);

    await expect(
      queryService.query({
        workspace_id: scope.workspaceId,
        participant_ref: scope.teacher.id,
        role_assignment_ref: scope.teacherRole.id,
        source_attribution_ref: scope.attribution.id,
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      candidates: [{ raised_by_role_assignment_ref: scope.adminRole.id }],
    });
    await expect(
      queryService.query({
        workspace_id: scope.workspaceId,
        participant_ref: scope.outsider.id,
        role_assignment_ref: scope.outsiderRole.id,
        source_attribution_ref: scope.attribution.id,
      }),
    ).resolves.toMatchObject({ status: "denied", reason_code: "not_authorized" });
  });

  it("rejects mutation and cross-Workspace owner composition at storage time", async () => {
    const scope = await seed();
    await execute(scope);
    const candidate = await prisma.nurtureAttributionCorrectionCandidate.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    await expect(
      prisma.nurtureAttributionCorrectionCandidate.update({
        where: { id: candidate.id },
        data: { reason: "Rewrite" },
      }),
    ).rejects.toThrow(/append-only/);
    await expect(
      prisma.nurtureAttributionCorrectionCandidate.delete({
        where: { id: candidate.id },
      }),
    ).rejects.toThrow(/append-only/);
    await expect(
      prisma.nurtureAttributionCorrectionCandidate.create({
        data: {
          workspaceId: randomUUID(),
          sourceAttributionId: scope.attribution.id,
          raisedByRoleAssignmentId: scope.adminRole.id,
          reason: "Cross workspace",
          commandRequestIdHash: "a".repeat(64),
          contractVersion: "1.0.0",
        },
      }),
    ).rejects.toThrow(/owner scope mismatch/);
  });
});
