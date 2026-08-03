import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  CAREGIVER_CHILD_TODAY_ORDER,
  GUARDIAN_ENROLLMENT_ACTIVITY_ORDER,
  TEACHER_PUBLISH_QUEUE_ORDER,
  derivePublishEligibility,
  publishStateRank,
} from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaCaregiverBoardReadPort,
  PrismaGuardianBoardReadPort,
  PrismaMediaSafetyReadPort,
  PrismaPublicationReleasePort,
  PrismaPublishLaneReadPort,
} from "../src/index.js";

// The two checks that cross the owner/domain boundary.
//
// Every other suite is closed on one side: the domain suites feed hand-written
// facts to the rules, and the owner suites assert the repository against
// hand-written expectations. Neither can catch an owner that answers in a
// different order from the one its binding advertises, or an owner fact that is
// individually plausible but makes the domain rule reach a wrong verdict.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const SNAPSHOT_AT = "2026-08-02T06:00:00.000Z";

// ---------------------------------------------------------------------------
// Check 1: emitted row order vs. the advertised semantic order.

type OrderTerm = { field: string; direction: "asc" | "desc" };

/**
 * The comparator is derived from the order string the binding publishes, not
 * written out by hand. A test that hardcoded the comparison would keep passing
 * if the constant changed, which is exactly the drift this check exists to
 * catch.
 */
const parseOrder = (order: string): OrderTerm[] =>
  order.split(",").map((term) => {
    const direction = term.endsWith("_desc") ? "desc" : "asc";
    return { field: term.replace(/_(asc|desc)$/, ""), direction };
  });

const compareBy = <Row>(
  terms: OrderTerm[],
  read: (row: Row, field: string) => string,
): ((left: Row, right: Row) => number) =>
  (left, right) => {
    for (const term of terms) {
      const a = read(left, term.field);
      const b = read(right, term.field);
      if (a === b) continue;
      return term.direction === "asc" ? (a < b ? -1 : 1) : a < b ? 1 : -1;
    }
    return 0;
  };

const assertOrdered = <Row>(
  rows: Row[],
  order: string,
  read: (row: Row, field: string) => string,
) => {
  const compare = compareBy(parseOrder(order), read);
  for (let index = 1; index < rows.length; index += 1) {
    expect(
      compare(rows[index - 1]!, rows[index]!),
      `rows out of "${order}" at position ${index}`,
    ).toBeLessThan(0);
  }
};

// ---------------------------------------------------------------------------

const seedInstitution = async () => {
  const workspaceId = randomUUID();
  const [teacher, guardian] = await Promise.all(
    ["teacher", "guardian"].map((tag) =>
      prisma.nurtureParticipant.create({
        data: { workspaceId, myChatUserId: `${tag}:${workspaceId}`, status: "active" },
      }),
    ),
  );
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher!.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  return { workspaceId, teacher: teacher!, guardian: guardian!, institution, group, teacherRole };
};

type Institution = Awaited<ReturnType<typeof seedInstitution>>;

const seedChild = async (world: Institution, label: string) => {
  const child = await prisma.nurtureChild.create({
    data: { workspaceId: world.workspaceId, displayName: label, status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId: world.workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId: world.workspaceId,
      childCareProcessId: process.id,
      displayName: `Family ${label}`,
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId: world.workspaceId,
      childCareProcessId: process.id,
      institutionId: world.institution.id,
      careGroupId: world.group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: world.workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: world.guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: world.group.id,
      directions: ["org_to_family"],
      dataClasses: ["child_growth_record"],
      purposes: ["child_growth_publication"],
      status: "active",
    },
  });
  return { label, child, process, family, enrollment, grant };
};

describe("owner rows arrive in the order their binding advertises", () => {
  it("caregiver child today follows CAREGIVER_CHILD_TODAY_ORDER and pages without gaps", async () => {
    const world = await seedInstitution();
    // Deliberately seeded out of label order, so a repository that returned
    // insertion order would be caught.
    for (const label of ["Delta", "Alpha", "Charlie", "Bravo"]) {
      await seedChild(world, label);
    }
    const reads = new PrismaCaregiverBoardReadPort(prisma);
    const first = await reads.listCaregiverChildToday({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 2,
    });
    expect(first.rows).toHaveLength(2);
    expect(first.has_more).toBe(true);
    assertOrdered(first.rows, CAREGIVER_CHILD_TODAY_ORDER, (row, field) =>
      field === "child_label"
        ? row.child_safe_label
        : field === "occurred_at"
          ? row.occurred_at
          : row.child_care_process_id,
    );

    const tail = first.rows[first.rows.length - 1]!;
    const second = await reads.listCaregiverChildToday({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 2,
      before: {
        rank: tail.child_safe_label,
        occurred_at: tail.occurred_at,
        id: tail.child_care_process_id,
      },
    });
    const all = [...first.rows, ...second.rows];
    expect(all.map((row) => row.child_safe_label)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
    ]);
    // Continuation neither repeats nor skips.
    expect(new Set(all.map((row) => row.child_care_process_id)).size).toBe(4);
  });

  it("publish queue follows TEACHER_PUBLISH_QUEUE_ORDER across states", async () => {
    const world = await seedInstitution();
    for (const state of ["released", "draft", "cancelled", "needs_review"] as const) {
      const process = await prisma.nurturePublishProcess.create({
        data: {
          workspaceId: world.workspaceId,
          careGroupId: world.group.id,
          processKey: `publish:${state}:${randomUUID()}`,
          state: state === "released" ? "pending_release" : state,
          dataClass: "child_growth_record",
          purposeKey: "child_growth_publication",
          ...(state === "cancelled" ? { cancelledAt: new Date(SNAPSHOT_AT) } : {}),
        },
      });
      const revision = await prisma.nurturePublishProcessRevision.create({
        data: {
          workspaceId: world.workspaceId,
          publishProcessId: process.id,
          revision: 1,
          contentDigest: "sha256:content",
          organizerInputRevision: "organizer:1",
        },
      });
      if (state === "released") {
        await prisma.nurturePublishProcess.update({
          where: { id: process.id },
          data: { state, frozenRevisionId: revision.id },
        });
      }
    }
    const reads = new PrismaPublishLaneReadPort(prisma);
    const page = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.rows).toHaveLength(4);
    assertOrdered(page.rows, TEACHER_PUBLISH_QUEUE_ORDER, (row, field) =>
      field === "state_rank"
        ? publishStateRank(row.state)
        : field === "occurred_at"
          ? row.occurred_at
          : row.process_key,
    );
    // Work that still needs a teacher comes before work already settled.
    expect(page.rows.map((row) => row.state)).toEqual([
      "draft",
      "needs_review",
      "released",
      "cancelled",
    ]);
  });

  it("delivers every guardian activity row across pages, not just the first two", async () => {
    const world = await seedInstitution();
    const child = await seedChild(world, "Alpha");
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: world.workspaceId,
        participantId: world.guardian.id,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: child.process.id,
        status: "active",
      },
    });
    const total = 25;
    for (let index = 0; index < total; index += 1) {
      await prisma.nurtureDailyCareLog.create({
        data: {
          workspaceId: world.workspaceId,
          childCareProcessId: child.process.id,
          enrollmentId: child.enrollment.id,
          careGroupId: world.group.id,
          recordedByRoleAssignmentId: world.teacherRole.id,
          logDate: new Date("2026-08-02T00:00:00.000Z"),
          summary: `log ${index}`,
          status: "shared",
          grantId: child.grant.id,
          mealPayload: { kind: "meal" },
        },
      });
    }

    const reads = new PrismaGuardianBoardReadPort(prisma);
    const seen: string[] = [];
    let before: { occurred_at: string; id: string } | undefined;
    // Page to closure. The list is only complete when the owner says so, so a
    // premature `has_more: false` is indistinguishable from the real end — which
    // is exactly why it has to be tested against a known total.
    for (let page = 0; page < 10; page += 1) {
      const result = await reads.listGuardianEnrollmentActivity({
        workspace_id: world.workspaceId,
        participant_id: world.guardian.id,
        enrollment_id: child.enrollment.id,
        snapshot_at: SNAPSHOT_AT,
        take: 10,
        ...(before ? { before } : {}),
      });
      seen.push(...result.rows.map((row) => row.activity_id));
      const tail = result.rows[result.rows.length - 1];
      if (!result.has_more || !tail) break;
      before = { occurred_at: tail.occurred_at, id: tail.activity_id };
    }

    expect(new Set(seen).size, "a row was delivered twice").toBe(seen.length);
    expect(seen).toHaveLength(total);
  });

  it("guardian enrollment activity follows GUARDIAN_ENROLLMENT_ACTIVITY_ORDER", async () => {
    const world = await seedInstitution();
    const child = await seedChild(world, "Alpha");
    const guardianRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: world.workspaceId,
        participantId: world.guardian.id,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: child.process.id,
        status: "active",
      },
    });
    expect(guardianRole.id).toBeTruthy();
    for (const day of [3, 1, 2]) {
      await prisma.nurtureDailyCareLog.create({
        data: {
          workspaceId: world.workspaceId,
          childCareProcessId: child.process.id,
          enrollmentId: child.enrollment.id,
          careGroupId: world.group.id,
          recordedByRoleAssignmentId: world.teacherRole.id,
          logDate: new Date(`2026-08-0${day}T00:00:00.000Z`),
          summary: `day ${day}`,
          status: "shared",
          grantId: child.grant.id,
          mealPayload: { kind: "meal" },
        },
      });
    }
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const page = await reads.listGuardianEnrollmentActivity({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      enrollment_id: child.enrollment.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.rows.length).toBeGreaterThan(1);
    assertOrdered(page.rows, GUARDIAN_ENROLLMENT_ACTIVITY_ORDER, (row, field) =>
      field === "occurred_at" ? row.occurred_at : row.activity_id,
    );
  });
});

// ---------------------------------------------------------------------------
// Check 2: owner facts through the domain rule that consumes them.

describe("owner release facts reach the right eligibility verdict", () => {
  const seedReleasable = async (world: Institution, children: Awaited<ReturnType<typeof seedChild>>[]) => {
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "pending_release",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
        scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
        notAfter: new Date("2026-08-03T11:00:00.000Z"),
        scheduleTimeZone: "Asia/Shanghai",
        schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
        schedulePolicyHead: 3,
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        mediaCompositionPayload: { media: [{ mediaAssetId: asset.id, mediaRevision: 1 }] },
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
    for (const entry of children) {
      await prisma.nurturePublishProcessTarget.create({
        data: {
          workspaceId: world.workspaceId,
          publishProcessId: process.id,
          targetKey: `target:${entry.label}`,
          childCareProcessId: entry.process.id,
          enrollmentId: entry.enrollment.id,
          familyRefKey: entry.family.id,
          grantId: entry.grant.id,
        },
      });
    }
    return { asset, process, revision };
  };

  const verdictFor = async (world: Institution, processKey: string) => {
    const port = new PrismaPublicationReleasePort(prisma);
    const facts = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: processKey,
    });
    expect(facts).not.toBeNull();
    return derivePublishEligibility(
      "boundary-key",
      { workspace_id: world.workspaceId, participant_id: world.teacher.id },
      {
        process_state: facts!.process_state,
        media: facts!.media,
        targets: facts!.targets.map((target) => ({
          target_key: target.target_key,
          child_care_process_id: target.child_care_process_id,
          enrollment_active: target.enrollment_active,
          grant_allows: target.grant_allows,
          data_class_allowed: target.data_class_allowed,
          purpose_allowed: target.purpose_allowed,
          exposure_allows_child_ids: target.exposure_allows_child_ids,
        })),
      },
    );
  };

  it("publishes a confirmed single-child photo", async () => {
    const world = await seedInstitution();
    const alpha = await seedChild(world, "Alpha");
    const { asset, process } = await seedReleasable(world, [alpha]);
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: alpha.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: world.teacherRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 1,
      },
    });
    const verdict = await verdictFor(world, process.processKey);
    expect(verdict.blockingReasons).toEqual([]);
    expect(verdict.eligible).toBe(true);
  });

  it("does not let a rejected attribution block the media", async () => {
    const world = await seedInstitution();
    const alpha = await seedChild(world, "Alpha");
    const bravo = await seedChild(world, "Bravo");
    const { asset, process } = await seedReleasable(world, [alpha]);
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: alpha.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: world.teacherRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 1,
      },
    });
    // The teacher looked at a candidate and said "that is not Bravo". That
    // correction must not turn into an unidentified face that blocks the photo
    // forever.
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: bravo.process.id,
        source: "face_reference",
        state: "rejected",
        attributionRevision: 1,
      },
    });
    const verdict = await verdictFor(world, process.processKey);
    expect(verdict.blockingReasons).not.toContain("unknown_visible_child");
    expect(verdict.eligible).toBe(true);
  });

  it("blocks a group photo whose other confirmed child is not this audience's", async () => {
    const world = await seedInstitution();
    const alpha = await seedChild(world, "Alpha");
    const bravo = await seedChild(world, "Bravo");
    const { asset, process } = await seedReleasable(world, [alpha]);
    for (const entry of [alpha, bravo]) {
      await prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId: world.workspaceId,
          mediaAssetRefId: asset.id,
          childCareProcessId: entry.process.id,
          source: "manual",
          state: "confirmed",
          confirmedByRoleAssignmentId: world.teacherRole.id,
          confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
          exposurePolicyPayload: { audience: "own_family" },
          attributionRevision: 1,
        },
      });
    }
    const verdict = await verdictFor(world, process.processKey);
    expect(verdict.blockingReasons).toContain("exposure_not_allowed");
    expect(verdict.eligible).toBe(false);
  });

  it("blocks an unconfirmed candidate and a media revision that moved", async () => {
    const world = await seedInstitution();
    const alpha = await seedChild(world, "Alpha");
    const { asset, process } = await seedReleasable(world, [alpha]);
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: alpha.process.id,
        source: "face_reference",
        state: "candidate",
        attributionRevision: 1,
      },
    });
    const candidate = await verdictFor(world, process.processKey);
    expect(candidate.blockingReasons).toContain("unconfirmed_visible_child");

    await prisma.nurtureMediaAssetRef.update({
      where: { id: asset.id },
      data: { mediaRevision: 2 },
    });
    const drifted = await verdictFor(world, process.processKey);
    expect(drifted.blockingReasons).toContain("media_revision_drift");
  });

  it("blocks only the target whose Grant was revoked", async () => {
    const world = await seedInstitution();
    const alpha = await seedChild(world, "Alpha");
    const bravo = await seedChild(world, "Bravo");
    const { asset, process } = await seedReleasable(world, [alpha, bravo]);
    for (const entry of [alpha, bravo]) {
      await prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId: world.workspaceId,
          mediaAssetRefId: asset.id,
          childCareProcessId: entry.process.id,
          source: "manual",
          state: "confirmed",
          confirmedByRoleAssignmentId: world.teacherRole.id,
          confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
          exposurePolicyPayload: { audience: "own_family" },
          attributionRevision: 1,
        },
      });
    }
    await prisma.nurtureChildLinkGrant.update({
      where: { id: alpha.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date("2026-08-02T05:00:00.000Z"),
        revokedByParticipantId: world.guardian.id,
      },
    });
    const verdict = await verdictFor(world, process.processKey);
    const alphaTarget = verdict.targets.find((target) =>
      target.blockingReasons.includes("grant_not_allowed"),
    );
    expect(alphaTarget).toBeDefined();
    // Both targets see the group photo, so neither is publishable here; what
    // this proves is that the revoked Grant is attributed to its own target.
    expect(verdict.targets).toHaveLength(2);
    expect(
      verdict.targets.filter((target) => target.blockingReasons.includes("grant_not_allowed")),
    ).toHaveLength(1);
  });
});

describe("owner attribution rows reach the rule as the current fact", () => {
  it("hands the rule the latest revision, not the one it superseded", async () => {
    const world = await seedInstitution();
    const child = await seedChild(world, "Alpha");
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    const confirmedAt = new Date("2026-08-03T03:00:00.000Z");
    const first = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: child.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: world.teacherRole.id,
        confirmedAt,
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 1,
      },
    });
    const second = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: child.process.id,
        source: "manual",
        state: "rejected",
        attributionRevision: 2,
      },
    });
    await prisma.nurtureChildMediaAttribution.update({
      where: { id: first.id },
      data: { state: "superseded", supersededByAttributionId: second.id },
    });

    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaAttributionFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });

    // The rules all locate a child's attribution with exactly this `find`. Fed
    // the real owner output, it must land on the revision that is current — the
    // superseded one still describes the child, so a port that returned both
    // would answer every rule with a fact that has already been replaced.
    const located = facts?.attributions.find(
      (entry) => entry.child_care_process_id === child.process.id,
    );
    expect(located).toMatchObject({ revision: 2, status: "rejected", attribution_id: second.id });
  });
});
