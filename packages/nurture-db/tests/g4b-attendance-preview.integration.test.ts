import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureAttendancePreviewService,
  deterministicAttendanceInference,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaAttendancePreviewRepository } from "../src/repositories/attendance-preview.repository.js";

/**
 * G4-B increment 2 — the evidence read over real rows.
 *
 * The unit tests hand evidence straight to the service. What they cannot show
 * is that the repository reads it from the three owners 0D-1 names, counts a
 * child with no evidence as a member rather than dropping them, and anchors
 * the watermark to a batch T-006 already cut.
 */

const prisma = createPrismaClient();
const service = new NurtureAttendancePreviewService(
  new PrismaAttendancePreviewRepository(prisma),
  deterministicAttendanceInference,
);

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);
const day = new Date(`${today}T00:00:00.000Z`);

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Preview Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class", status: "active" },
  });
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${randomUUID()}`, status: "active" },
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
  return { workspaceId, institution, careGroup, teacherRole };
};

type Scope = Awaited<ReturnType<typeof seed>>;

const addChild = async (scope: Scope, label: string) => {
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
      careGroupId: scope.careGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  return { process, enrollment };
};

const compose = (scope: Scope) =>
  service.compose({
    workspace_id: scope.workspaceId,
    care_group_ref: scope.careGroup.id,
    local_date: today,
    current: { kind: "unsubmitted" },
  });

describe("T-007 G4-B attendance preview (production DB lane)", () => {
  it("lists every enrolled member, including one with no evidence at all", async () => {
    const scope = await seed();
    const withEvidence = await addChild(scope, "Has Evidence");
    const without = await addChild(scope, "No Evidence");
    await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: withEvidence.process.id,
        enrollmentId: withEvidence.enrollment.id,
        careGroupId: scope.careGroup.id,
        recordedByRoleAssignmentId: scope.teacherRole.id,
        logDate: day,
        status: "recorded",
      },
    });

    const preview = await compose(scope);
    expect(preview.members).toHaveLength(2);
    const byRef = new Map(preview.members.map((m) => [m.child_process_ref, m]));
    expect(byRef.get(withEvidence.process.id)).toMatchObject({
      inference: { state: "likely_present" },
      suggested_entry_state: "present",
    });
    // The class does not shrink to those who happen to have records.
    expect(byRef.get(without.process.id)).toMatchObject({
      inference: { state: "insufficient_evidence" },
      suggested_entry_state: null,
    });
  });

  /**
   * 0D-4: only a CONFIRMED attribution is evidence. Building presence on a
   * candidate would let one non-canonical guess feed another.
   */
  it("counts a confirmed attribution and ignores a candidate", async () => {
    const scope = await seed();
    const confirmed = await addChild(scope, "Confirmed");
    const candidate = await addChild(scope, "Candidate Only");
    const asset = () =>
      prisma.nurtureMediaAssetRef.create({
        data: {
          workspaceId: scope.workspaceId,
          careGroupId: scope.careGroup.id,
          institutionId: scope.institution.id,
          uploadedByRoleAssignmentId: scope.teacherRole.id,
          sourceKind: "class_album",
          lifecycle: "ready",
          storageRefPayload: { ref: `asset:${randomUUID()}` },
        },
      });
    const assetA = await asset();
    const assetB = await asset();
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: assetA.id,
        childCareProcessId: confirmed.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: scope.teacherRole.id,
        confirmedAt: new Date(),
        // ck_nurture_media_attribution_confirmation: a confirmed attribution
        // must carry its exposure policy, so no confirmation exists without
        // the decision about who may see it.
        exposurePolicyPayload: { audience: "class" },
      },
    });
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: assetB.id,
        childCareProcessId: candidate.process.id,
        source: "face_reference",
        state: "candidate",
      },
    });

    // A superseded attribution keeps its confirmedAt — it WAS confirmed once,
    // and 0D-4 supersedes rather than overwrites. So the state filter is what
    // excludes it, not the date window, and without the state filter a
    // withdrawn attribution would still count as presence.
    const superseded = await addChild(scope, "Superseded");
    const assetC = await asset();
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: assetC.id,
        childCareProcessId: superseded.process.id,
        source: "manual",
        state: "superseded",
        confirmedByRoleAssignmentId: scope.teacherRole.id,
        confirmedAt: new Date(),
      },
    });

    const byRef = new Map((await compose(scope)).members.map((m) => [m.child_process_ref, m]));
    expect(byRef.get(confirmed.process.id)!.evidence.sources).toContain(
      "confirmed_media_attribution",
    );
    expect(byRef.get(superseded.process.id)!.evidence.sources).toEqual([]);
    expect(byRef.get(superseded.process.id)!.inference.state).toBe("insufficient_evidence");
    expect(byRef.get(confirmed.process.id)!.inference.state).toBe("likely_present");
    expect(byRef.get(candidate.process.id)!.evidence.sources).toEqual([]);
    expect(byRef.get(candidate.process.id)!.inference.state).toBe("insufficient_evidence");
  });

  /**
   * 0D-1 §5: the stable prefix is the one T-006 already defines. A capture in
   * a batch still collecting is not part of what was cut, so it cannot anchor
   * a watermark.
   */
  it("anchors the watermark to an already-cut batch and ignores a collecting one", async () => {
    const scope = await seed();
    await addChild(scope, "Child");
    await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        state: "collecting",
        watermarkSourceSequence: 99,
      },
    });
    // Collecting only: nothing has been cut, so there is no prefix to record.
    expect((await compose(scope)).watermark).toBeUndefined();

    await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        state: "cut",
        watermarkSourceSequence: 7,
        cutAt: new Date(),
      },
    });
    expect((await compose(scope)).watermark).toEqual({
      source_kind: "care_capture_batch",
      source_sequence: 7,
    });

    // A batch cut and then cancelled keeps its cutAt, so the state filter is
    // what excludes it rather than the date window. Its higher sequence would
    // otherwise win and anchor the watermark to work that was withdrawn.
    await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        state: "cancelled",
        watermarkSourceSequence: 42,
        cutAt: new Date(),
      },
    });
    expect((await compose(scope)).watermark).toEqual({
      source_kind: "care_capture_batch",
      source_sequence: 7,
    });
  });

  it("records an inference-run audit and writes no attendance fact", async () => {
    const scope = await seed();
    await addChild(scope, "Child");
    await compose(scope);

    const runs = await prisma.nurtureAttendanceInferenceRun.findMany({
      where: { workspaceId: scope.workspaceId },
    });
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      careGroupId: scope.careGroup.id,
      policyVersion: "nurture.attendance-inference.deterministic@1.0.0",
    });
    // The invariant, as a query rather than a comment: composing a preview
    // creates no submission and no entry.
    expect(
      await prisma.nurtureDailyAttendanceSubmission.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(0);
    expect(
      await prisma.nurtureAttendanceEntry.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(0);
  });

  it("does not count another class's evidence or another day's", async () => {
    const scope = await seed();
    const child = await addChild(scope, "Child");
    const otherGroup = await prisma.nurtureCareGroup.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        name: "Other",
        status: "active",
      },
    });
    // Same child, another class: not this class's evidence.
    await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: child.process.id,
        enrollmentId: child.enrollment.id,
        careGroupId: otherGroup.id,
        recordedByRoleAssignmentId: scope.teacherRole.id,
        logDate: day,
        status: "recorded",
      },
    });
    // This class, yesterday: not this day's evidence.
    await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: child.process.id,
        enrollmentId: child.enrollment.id,
        careGroupId: scope.careGroup.id,
        recordedByRoleAssignmentId: scope.teacherRole.id,
        logDate: new Date(day.getTime() - 86_400_000),
        status: "recorded",
      },
    });

    const preview = await compose(scope);
    expect(preview.members[0]!.evidence.observation_count).toBe(0);
    expect(preview.members[0]!.inference.state).toBe("insufficient_evidence");
  });
});
