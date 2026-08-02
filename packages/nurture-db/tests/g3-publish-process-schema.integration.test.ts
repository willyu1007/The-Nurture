import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";

// DB-level proof of the G3-0 SSOT delta
// (dev-docs/active/nurture-child-care-boards/06-g3-0-fact-contract-schema-freeze.md,
// including the 2026-08-02 media lifecycle identities amendment): the retired
// legacy enums are gone from the live database, the new publish-process
// identities carry exactly the frozen labels, and the invariants the domain
// layer relies on are enforced by constraints rather than by convention.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Asserts the write was refused by a specific unique constraint. Prisma reports
 * `P2002` with the offending columns, so the expectation names those columns
 * rather than matching a message string.
 */
const expectUniqueViolation = async (write: Promise<unknown>, columns: string[]) => {
  const error = await write.then(
    () => null,
    (caught: unknown) => caught as { code?: string; meta?: { target?: unknown } },
  );
  expect(error, "expected the write to be refused").not.toBeNull();
  expect(error?.code).toBe("P2002");
  expect(error?.meta?.target).toEqual(columns);
};

const enumLabels = async (typeName: string): Promise<string[]> => {
  const rows = await prisma.$queryRaw<{ label: string }[]>`
    SELECT e.enumlabel AS label
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = ${typeName}
    ORDER BY e.enumsortorder
  `;
  return rows.map((row) => row.label);
};

const seedScope = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver:${workspaceId}`, status: "active" },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: "Family",
      status: "active",
    },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      createdByParticipantId: caregiver.id,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["org_to_family"],
      dataClasses: ["child_growth_record"],
      purposes: ["child_growth_publication"],
      status: "active",
    },
  });
  return {
    workspaceId,
    process,
    family,
    institution,
    group,
    enrollment,
    caregiverRole,
    grant,
  };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

const seedPublishProcess = async (scope: Scope) => {
  const publishProcess = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: scope.workspaceId,
      careGroupId: scope.group.id,
      processKey: `publish:${randomUUID()}`,
      state: "draft",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId: scope.workspaceId,
      publishProcessId: publishProcess.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
    },
  });
  const target = await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId: scope.workspaceId,
      publishProcessId: publishProcess.id,
      targetKey: "target:child-1",
      childCareProcessId: scope.process.id,
      enrollmentId: scope.enrollment.id,
      familyRefKey: `${scope.workspaceId}:family`,
      grantId: scope.grant.id,
    },
  });
  return { publishProcess, revision, target };
};

describe("G3-0 schema delta: live enum identities", () => {
  it("carries exactly the frozen media lifecycle and attribution state labels", async () => {
    expect(await enumLabels("NurtureMediaAssetLifecycle")).toEqual([
      "preparing",
      "ready",
      "unavailable",
      "discarded",
      "redacted",
    ]);
    expect(await enumLabels("NurtureChildAttributionState")).toEqual([
      "candidate",
      "confirmed",
      "rejected",
      "superseded",
    ]);
  });

  it("has retired the legacy status types instead of leaving them beside the new ones", async () => {
    expect(await enumLabels("NurtureMediaAssetStatus")).toEqual([]);
    expect(await enumLabels("NurtureMediaAttributionStatus")).toEqual([]);
  });

  it("extends the two shared enums in place without disturbing the existing labels", async () => {
    const dataClasses = await enumLabels("NurtureGrantDataClass");
    expect(dataClasses).toContain("child_growth_record");
    // The T-005 data classes keep their original identities and order.
    expect(dataClasses.slice(0, 6)).toEqual([
      "daily_care_log",
      "care_day_note",
      "care_constraint_update",
      "family_care_question",
      "family_follow_up_request",
      "direct_care_communication",
    ]);
    expect(await enumLabels("NurtureChildLinkReceiptSourceType")).toContain("publication_release");
  });
});

describe("G3-0 schema delta: focus goal child scope", () => {
  it("keeps a goal without an explicit child scope free of any child row", async () => {
    const scope = await seedScope();
    const cycle = await prisma.nurtureFocusCycle.create({
      data: {
        workspaceId: scope.workspaceId,
        familyRefKey: `${scope.workspaceId}:family`,
        familyRef: { service: "my_chat", object_type: "family" },
        status: "active",
      },
    });
    const goal = await prisma.nurtureFocusGoal.create({
      data: {
        workspaceId: scope.workspaceId,
        focusCycleId: cycle.id,
        familyRefKey: `${scope.workspaceId}:family`,
        goalKey: "sleep_rhythm",
      },
    });
    // A family-scope goal stores zero child scopes; there is nothing a reader
    // could mistake for a child binding.
    expect(
      await prisma.nurtureFocusGoalChildScope.count({ where: { focusGoalId: goal.id } }),
    ).toBe(0);

    await prisma.nurtureFocusGoalChildScope.create({
      data: {
        workspaceId: scope.workspaceId,
        focusGoalId: goal.id,
        childCareProcessId: scope.process.id,
      },
    });
    await expectUniqueViolation(
      prisma.nurtureFocusGoalChildScope.create({
        data: {
          workspaceId: scope.workspaceId,
          focusGoalId: goal.id,
          childCareProcessId: scope.process.id,
        },
      }),
      ["workspace_id", "focus_goal_id", "child_care_process_id"],
    );
  });
});

describe("G3-0 schema delta: capture batch", () => {
  it("replays one trigger identity onto the same batch instead of cutting a second one", async () => {
    const scope = await seedScope();
    const triggerRequestId = randomUUID();
    await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        state: "collecting",
        triggerRequestId,
      },
    });
    await expectUniqueViolation(
      prisma.nurtureCareCaptureBatch.create({
        data: {
          workspaceId: scope.workspaceId,
          careGroupId: scope.group.id,
          state: "collecting",
          triggerRequestId,
        },
      }),
      ["workspace_id", "care_group_id", "trigger_request_id"],
    );
  });

  it("keeps the intake sequence the watermark is expressed in unique inside a batch", async () => {
    const scope = await seedScope();
    const batch = await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        state: "collecting",
      },
    });
    const capture = {
      workspaceId: scope.workspaceId,
      careGroupId: scope.group.id,
      captureBatchId: batch.id,
      capturedByRoleAssignmentId: scope.caregiverRole.id,
      kind: "text" as const,
      occurredAt: new Date("2026-08-02T01:00:00.000Z"),
    };
    await prisma.nurtureCareCapture.create({ data: { ...capture, sourceSequence: 1 } });
    // An in-flight capture is stored but not stable, so the prefix cut can see it.
    const inFlight = await prisma.nurtureCareCapture.create({
      data: { ...capture, sourceSequence: 2 },
    });
    expect(inFlight.stable).toBe(false);
    await expectUniqueViolation(
      prisma.nurtureCareCapture.create({ data: { ...capture, sourceSequence: 1 } }),
      ["workspace_id", "capture_batch_id", "source_sequence"],
    );
  });
});

describe("G3-0 schema delta: publish process and release", () => {
  it("admits exactly one edit hold per publish process", async () => {
    const scope = await seedScope();
    const { publishProcess } = await seedPublishProcess(scope);
    const hold = {
      workspaceId: scope.workspaceId,
      publishProcessId: publishProcess.id,
      holderRoleAssignmentId: scope.caregiverRole.id,
      holderParticipantId: scope.caregiverRole.participantId,
      expiresAt: new Date(Date.now() + 600_000),
    };
    await prisma.nurturePublishEditHold.create({ data: hold });
    await expectUniqueViolation(prisma.nurturePublishEditHold.create({ data: hold }), [
      "publish_process_id",
    ]);
  });

  it("commits one release per target and refuses a second one for the same target", async () => {
    const scope = await seedScope();
    const { publishProcess, revision, target } = await seedPublishProcess(scope);
    const receiptBase = {
      workspaceId: scope.workspaceId,
      grantId: scope.grant.id,
      childCareProcessId: scope.process.id,
      enrollmentId: scope.enrollment.id,
      direction: "org_to_family" as const,
      dataClass: "child_growth_record" as const,
      sourceType: "publication_release" as const,
      sourceId: target.id,
      targetScopeType: "family" as const,
      targetScopeId: scope.family.id,
      status: "delivered" as const,
      deliveredAt: new Date("2026-08-02T03:00:00.000Z"),
    };
    // The T-005 receipt lifecycle CHECK still governs the new source type: a
    // delivered publication receipt has to carry its full routing identity.
    await expect(
      prisma.nurtureChildLinkReceipt.create({
        data: { ...receiptBase, grantId: null, routingAttemptKey: "attempt:unbound" },
      }),
    ).rejects.toThrow(/ck_nurture_receipt_route_lifecycle/);
    const receipt = await prisma.nurtureChildLinkReceipt.create({
      data: { ...receiptBase, routingAttemptKey: "attempt:1" },
    });
    const release = await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: publishProcess.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: scope.caregiverRole.id,
        commandRequestIdHash: "a".repeat(64),
        receiptId: receipt.id,
      },
    });
    expect(release.visibility).toBe("visible");

    // A different command reaching the same target is still refused: the target,
    // not the command, is what may be released once.
    await expectUniqueViolation(
      prisma.nurturePublicationRelease.create({
        data: {
          workspaceId: scope.workspaceId,
          publishProcessId: publishProcess.id,
          publishProcessTargetId: target.id,
          publishProcessRevisionId: revision.id,
          releasedByRoleAssignmentId: scope.caregiverRole.id,
          commandRequestIdHash: "b".repeat(64),
        },
      }),
      ["publish_process_target_id"],
    );
  });

  it("records post-release safety as events over the release rather than as edits to it", async () => {
    const scope = await seedScope();
    const { publishProcess, revision, target } = await seedPublishProcess(scope);
    const release = await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: publishProcess.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: scope.caregiverRole.id,
        commandRequestIdHash: "a".repeat(64),
      },
    });
    for (const kind of ["correction", "target_removal", "redaction"] as const) {
      await prisma.nurturePublicationVisibilityEvent.create({
        data: {
          workspaceId: scope.workspaceId,
          publicationReleaseId: release.id,
          kind,
          reasonKey: `${kind}_reason`,
          actorRoleAssignmentId: scope.caregiverRole.id,
          sourceReleaseRevision: 1,
        },
      });
    }
    const events = await prisma.nurturePublicationVisibilityEvent.findMany({
      where: { publicationReleaseId: release.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(events).toHaveLength(3);
    // The released revision the events point back at is never rewritten.
    const stored = await prisma.nurturePublicationRelease.findUniqueOrThrow({
      where: { id: release.id },
    });
    expect(stored.publishProcessRevisionId).toBe(revision.id);
  });

  it("numbers publish revisions once so a saved draft never overwrites a released one", async () => {
    const scope = await seedScope();
    const { publishProcess } = await seedPublishProcess(scope);
    await expectUniqueViolation(
      prisma.nurturePublishProcessRevision.create({
        data: {
          workspaceId: scope.workspaceId,
          publishProcessId: publishProcess.id,
          revision: 1,
          contentDigest: "sha256:other",
          organizerInputRevision: "organizer:1",
        },
      }),
      ["workspace_id", "publish_process_id", "revision"],
    );
  });

  it("records the restricted route even though it creates no publish process", async () => {
    const scope = await seedScope();
    // `direct_interaction_required` deliberately produces no publication
    // candidate. While `publishProcessId` was required, the one route that most
    // needs an audit trail was the only one that could not have a row.
    const assessment = await prisma.nurtureContentSafetyAssessment.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        organizerInputRevision: "organizer:restricted-1",
        route: "direct_interaction_required",
        policyRef: "syn-content-safety-1",
        policyHead: 2,
        ruleRevision: "rules:1",
        riskCodesPayload: ["health_symptom"],
        sourceHeadsPayload: { source_head: "h-1" },
      },
    });
    expect(assessment.publishProcessId).toBeNull();
    // It stays addressable by the anchor that does not depend on a process.
    const found = await prisma.nurtureContentSafetyAssessment.findFirst({
      where: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        organizerInputRevision: "organizer:restricted-1",
      },
    });
    expect(found?.id).toBe(assessment.id);
  });

  it("stores a content safety assessment with the exact rule and policy head it used", async () => {
    const scope = await seedScope();
    const { publishProcess } = await seedPublishProcess(scope);
    const assessment = await prisma.nurtureContentSafetyAssessment.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: publishProcess.id,
        careGroupId: scope.group.id,
        organizerInputRevision: "organizer:1",
        route: "direct_interaction_required",
        policyRef: "nurture.institution-publication-policy@1.0.0",
        policyHead: 3,
        ruleRevision: "rules:1",
        riskCodesPayload: ["direct_interaction_marker"],
        sourceHeadsPayload: { source_head: "h-1" },
      },
    });
    expect(assessment.route).toBe("direct_interaction_required");
    expect(assessment.providerRevision).toBeNull();
  });
});

describe("G3-0 schema delta: media lifecycle and attribution supersession", () => {
  it("supersedes an attribution by appending a revision that links to the prior fact", async () => {
    const scope = await seedScope();
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: "k-1" },
        lifecycle: "ready",
      },
    });
    expect(asset.mediaRevision).toBe(1);

    const first = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
        source: "face_reference",
        state: "confirmed",
        confirmedByRoleAssignmentId: scope.caregiverRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 1,
      },
    });
    const second = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: scope.caregiverRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 2,
      },
    });
    await prisma.nurtureChildMediaAttribution.update({
      where: { id: first.id },
      data: { state: "superseded", supersededByAttributionId: second.id },
    });

    const history = await prisma.nurtureChildMediaAttribution.findMany({
      where: { mediaAssetRefId: asset.id },
      orderBy: { attributionRevision: "asc" },
    });
    expect(history.map((row) => [row.attributionRevision, row.state])).toEqual([
      [1, "superseded"],
      [2, "confirmed"],
    ]);
    expect(history[0]?.supersededByAttributionId).toBe(second.id);

    // A correction is a new revision, never a second row at the same revision.
    await expectUniqueViolation(
      prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId: scope.workspaceId,
          mediaAssetRefId: asset.id,
          childCareProcessId: scope.process.id,
          source: "manual",
          state: "confirmed",
          confirmedByRoleAssignmentId: scope.caregiverRole.id,
          confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
          exposurePolicyPayload: { audience: "own_family" },
          attributionRevision: 2,
        },
      }),
      ["workspace_id", "media_asset_ref_id", "child_care_process_id", "attribution_revision"],
    );
  });
});
