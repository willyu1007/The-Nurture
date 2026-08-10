import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  PrismaBoardMutationTransaction,
  PrismaCaregiverBoardReadPort,
  PrismaCaregiverDailyCareEligibilityReadPort,
  PrismaGuardianBoardReadPort,
} from "../src/index.js";

// Owner-side proof for the G3-A board ports (G3-E prerequisite B2). The domain
// suites already pin the projection; what can only be proven here is that the
// owner answers "who may see this" from current facts, that a scope-level drift
// head actually moves when the scope changes, and that an inline board mutation
// lands on the fact owner rather than on any board-shaped row.
const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g3a-family-activity",
  keyMaterial: "g3a-family-activity-key-32-chars!",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const SNAPSHOT_AT = "2026-08-02T04:00:00.000Z";

const seedWorld = async () => {
  const workspaceId = randomUUID();
  const [guardian, caregiver, outsider] = await Promise.all(
    ["guardian", "caregiver", "outsider"].map((tag) =>
      prisma.nurtureParticipant.create({
        data: { workspaceId, myChatUserId: `${tag}:${workspaceId}`, status: "active" },
      }),
    ),
  );
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: "Family A",
      status: "active",
    },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
    },
  });
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      policyRef: "nurture.institution-publication-policy@1.0.0",
      policyVersion: 1,
      policyHead: 1,
      timeZone: "Asia/Shanghai",
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const otherGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class B", status: "active" },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian!.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiver!.id,
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
      grantedByParticipantId: guardian!.id,
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
    guardian: guardian!,
    caregiver: caregiver!,
    outsider: outsider!,
    child,
    process,
    family,
    institution,
    group,
    otherGroup,
    enrollment,
    guardianRole,
    caregiverRole,
    grant,
    familyRefKey: `${workspaceId}:${process.id}`,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

describe("G3-A owner reads: guardian lane", () => {
  it("binds the family scope while offering every reachable family's enrollments", async () => {
    const world = await seedWorld();
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const scope = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(scope.authorized).toBe(true);
    expect(scope.family_id).toBe(world.family.id);
    // Each option names its own family: selecting one from another family
    // rebinds the whole board rather than mixing families.
    expect(scope.eligible_enrollments).toEqual([
      {
        enrollment_id: world.enrollment.id,
        family_id: world.family.id,
        display_label: "Class A",
      },
    ]);
  });

  it("rebinds to a second child's family on request and never mixes them", async () => {
    const world = await seedWorld();
    // A second child of the same guardian: its own process, family, enrollment.
    const secondChild = await prisma.nurtureChild.create({
      data: { workspaceId: world.workspaceId, displayName: "Second Child", status: "active" },
    });
    const secondProcess = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: world.workspaceId, childId: secondChild.id, status: "active" },
    });
    const secondFamily = await prisma.nurtureFamily.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: secondProcess.id,
        displayName: "Second Family",
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: world.workspaceId,
        participantId: world.guardian.id,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: secondProcess.id,
        status: "active",
      },
    });
    const secondEnrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: secondProcess.id,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        status: "active",
        participationPhase: "formal",
      },
    });

    const reads = new PrismaGuardianBoardReadPort(prisma);
    const unbound = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    // Default binding stays the earliest family; BOTH families' enrollments
    // are offered as owner-issued options.
    expect(unbound.family_id).toBe(world.family.id);
    expect(unbound.eligible_enrollments.map((entry) => entry.enrollment_id).sort()).toEqual(
      [world.enrollment.id, secondEnrollment.id].sort(),
    );

    const rebound = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
      bind_family_id: secondFamily.id,
    });
    expect(rebound.family_id).toBe(secondFamily.id);
    expect(rebound.family_label).toBe("Second Family");

    // A family outside the guardian's reach never binds.
    const foreign = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
      bind_family_id: randomUUID(),
    });
    expect(foreign.authorized).toBe(false);
  });

  it("refuses a participant with no current guardian authority", async () => {
    const world = await seedWorld();
    const reads = new PrismaGuardianBoardReadPort(prisma);
    for (const participantId of [world.outsider.id, world.caregiver.id]) {
      const scope = await reads.loadGuardianScope({
        workspace_id: world.workspaceId,
        participant_id: participantId,
        snapshot_at: SNAPSHOT_AT,
      });
      expect(scope.authorized).toBe(false);
      expect(scope.eligible_enrollments).toEqual([]);
      expect(scope.family_id).toBe("");
    }
  });

  it("treats a role outside its own validity window as no authority", async () => {
    const world = await seedWorld();
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.guardianRole.id },
      // Status stays "active"; only the window has closed.
      data: { endsAt: new Date("2026-08-01T00:00:00.000Z") },
    });
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const scope = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(scope.authorized).toBe(false);
  });

  it("moves the grant drift head when a Grant is revoked and nothing else changes", async () => {
    const world = await seedWorld();
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const before = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    await prisma.nurtureChildLinkGrant.update({
      where: { id: world.grant.id },
      // The T-005 grant CHECK requires a revocation to name when and by whom.
      data: {
        status: "revoked",
        revokedAt: new Date("2026-08-02T03:00:00.000Z"),
        revokedByParticipantId: world.guardian.id,
      },
    });
    const after = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(after.drift_heads.grant_head).not.toBe(before.drift_heads.grant_head);
    // Nothing else about the scope moved, so an open page is invalidated by the
    // Grant alone rather than by an unrelated source change.
    expect(after.drift_heads.source_head).toBe(before.drift_heads.source_head);
  });

  it("moves the redaction head when a released fact is withdrawn", async () => {
    const world = await seedWorld();
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const before = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    const { release } = await seedRelease(world);
    await prisma.nurturePublicationVisibilityEvent.create({
      data: {
        workspaceId: world.workspaceId,
        publicationReleaseId: release.id,
        kind: "redaction",
        reasonKey: "redaction_reason",
        actorRoleAssignmentId: world.caregiverRole.id,
        sourceReleaseRevision: 1,
      },
    });
    const after = await reads.loadGuardianScope({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(after.drift_heads.redaction_head).not.toBe(before.drift_heads.redaction_head);
  });

  it("lists a released publication and drops it once the release is no longer visible", async () => {
    const world = await seedWorld();
    const { release, publishProcess } = await seedRelease(world);
    const reads = new PrismaGuardianBoardReadPort(prisma, protectedContent);
    const listed = await reads.listGuardianEnrollmentActivity({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      enrollment_id: world.enrollment.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(listed.authorized).toBe(true);
    // Mapped, not defaulted: the earlier fallback sent every non-growth class to
    // `media`, so a released daily-care publication showed up as a photo.
    expect(listed.rows.map((row) => row.kind)).toEqual(["child_growth_record"]);
    expect(listed.rows[0]?.summary).toBe("Spring outing");
    expect(listed.rows[0]?.summary).not.toContain(publishProcess.processKey);

    await prisma.nurturePublicationRelease.update({
      where: { id: release.id },
      data: { visibility: "removed" },
    });
    const afterRemoval = await reads.listGuardianEnrollmentActivity({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      enrollment_id: world.enrollment.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(afterRemoval.rows).toEqual([]);
  });

  it("withdraws a revoked Grant's own facts while another Grant is still live", async () => {
    const world = await seedWorld();
    // A second, unrelated live Grant on the same child-care process. The board
    // must not read "the family still holds a grant" as "this fact is still
    // visible" — that would make consent withdrawal a no-op until the last one.
    const secondGrant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        grantedByParticipantId: world.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: world.group.id,
        directions: ["org_to_family"],
        dataClasses: ["daily_care_log"],
        purposes: ["family_care_workflow"],
        status: "active",
      },
    });
    expect(secondGrant.id).toBeTruthy();

    const log = await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        careGroupId: world.group.id,
        recordedByRoleAssignmentId: world.caregiverRole.id,
        logDate: new Date("2026-08-02T00:00:00.000Z"),
        summary: "lunch",
        status: "shared",
        grantId: world.grant.id,
        mealPayload: { kind: "meal" },
      },
    });

    const reads = new PrismaGuardianBoardReadPort(prisma);
    const read = () =>
      reads.listGuardianEnrollmentActivity({
        workspace_id: world.workspaceId,
        participant_id: world.guardian.id,
        enrollment_id: world.enrollment.id,
        snapshot_at: SNAPSHOT_AT,
        take: 10,
      });

    const before = await read();
    const visible = before.rows.find((row) => row.activity_id === log.id);
    expect(visible?.authority.grant_visible).toBe(true);

    await prisma.nurtureChildLinkGrant.update({
      where: { id: world.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date("2026-08-02T03:00:00.000Z"),
        revokedByParticipantId: world.guardian.id,
      },
    });

    const after = await read();
    const withdrawn = after.rows.find((row) => row.activity_id === log.id);
    // The row is still returned, carrying the authority that now refuses it —
    // the presenter filters on the fact, not on a scope-level boolean.
    expect(withdrawn?.authority.grant_visible).toBe(false);
    expect(withdrawn?.authority.purpose_allowed).toBe(false);
  });

  it("refuses a fact whose Grant no longer admits its data class", async () => {
    const world = await seedWorld();
    await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        careGroupId: world.group.id,
        recordedByRoleAssignmentId: world.caregiverRole.id,
        logDate: new Date("2026-08-02T00:00:00.000Z"),
        summary: "lunch",
        status: "shared",
        grantId: world.grant.id,
        mealPayload: { kind: "meal" },
      },
    });
    // The seeded Grant admits `child_growth_record`, never `daily_care_log`.
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const page = await reads.listGuardianEnrollmentActivity({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      enrollment_id: world.enrollment.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.rows[0]?.authority.grant_visible).toBe(true);
    expect(page.rows[0]?.authority.purpose_allowed).toBe(false);
  });

  it("refuses an Enrollment that does not belong to the reached family", async () => {
    const world = await seedWorld();
    const other = await seedWorld();
    const reads = new PrismaGuardianBoardReadPort(prisma);
    const result = await reads.listGuardianEnrollmentActivity({
      workspace_id: world.workspaceId,
      participant_id: world.guardian.id,
      enrollment_id: other.enrollment.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(result).toEqual({ authorized: false, rows: [], has_more: false, heads: [] });
  });
});

const seedRelease = async (world: World) => {
  const publishProcess = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      processKey: `publish:${randomUUID()}`,
      state: "pending_release",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: publishProcess.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
      titleProtectionPayload: protectedContent.seal("Spring outing"),
    },
  });
  const target = await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: publishProcess.id,
      targetKey: "target:child-a",
      childCareProcessId: world.process.id,
      enrollmentId: world.enrollment.id,
      familyRefKey: world.familyRefKey,
      grantId: world.grant.id,
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: publishProcess.id },
    data: {
      state: "released",
      currentRevisionId: revision.id,
      frozenRevisionId: revision.id,
    },
  });
  const release = await prisma.nurturePublicationRelease.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: publishProcess.id,
      publishProcessTargetId: target.id,
      publishProcessRevisionId: revision.id,
      releasedByRoleAssignmentId: world.caregiverRole.id,
      commandRequestIdHash: randomUUID().replace(/-/g, "").repeat(2),
    },
  });
  return { release, publishProcess };
};

describe("G3-A owner reads: caregiver lane", () => {
  it("binds the exact CareGroup and reports whether a publication policy resolved", async () => {
    const world = await seedWorld();
    const reads = new PrismaCaregiverBoardReadPort(prisma);
    const scope = await reads.loadCaregiverScope({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(scope.authorized).toBe(true);
    expect(scope.care_group_id).toBe(world.group.id);
    expect(scope.authority.role_scope_matches_source).toBe(true);
    expect(scope.publication_policy_resolved).toBe(true);
  });

  it("treats an absent institution policy as unresolved rather than as a default window", async () => {
    const world = await seedWorld();
    await prisma.nurtureInstitutionPublicationPolicy.deleteMany({
      where: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
      },
    });
    const reads = new PrismaCaregiverBoardReadPort(prisma);
    const scope = await reads.loadCaregiverScope({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(scope.publication_policy_resolved).toBe(false);
  });

  it("returns the snapshot day only, not the child's whole history", async () => {
    const world = await seedWorld();
    for (const day of ["2026-07-30", "2026-08-01", "2026-08-02"]) {
      await prisma.nurtureDailyCareLog.create({
        data: {
          workspaceId: world.workspaceId,
          childCareProcessId: world.process.id,
          enrollmentId: world.enrollment.id,
          careGroupId: world.group.id,
          recordedByRoleAssignmentId: world.caregiverRole.id,
          logDate: new Date(`${day}T00:00:00.000Z`),
          summary: `log ${day}`,
          status: "recorded",
          mealPayload: { kind: "meal", day },
        },
      });
    }
    const reads = new PrismaCaregiverBoardReadPort(prisma);
    const page = await reads.listCaregiverChildToday({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    // A module named `child_today` that returned three days was answering a
    // different question from the one it is named for.
    const entries = page.rows[0]?.daily_care ?? [];
    expect(entries).toHaveLength(1);
    expect(entries[0]?.occurred_at).toBe("2026-08-02T00:00:00.000Z");
  });

  it("refuses an institution-scoped assignment and a sibling class", async () => {
    const world = await seedWorld();
    const reads = new PrismaCaregiverBoardReadPort(prisma);

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.caregiverRole.id },
      data: { scopeType: "institution", scopeId: world.institution.id },
    });
    const widened = await reads.loadCaregiverScope({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(widened.authorized).toBe(false);

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.caregiverRole.id },
      data: { scopeType: "care_group", scopeId: world.otherGroup.id },
    });
    const sibling = await reads.listCaregiverChildToday({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(sibling).toEqual({ authorized: false, rows: [], has_more: false, heads: [] });
  });

  it("projects one card per recorded care kind and maps owner priority explicitly", async () => {
    const world = await seedWorld();
    await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        careGroupId: world.group.id,
        recordedByRoleAssignmentId: world.caregiverRole.id,
        logDate: new Date("2026-08-02T00:00:00.000Z"),
        summary: "lunch and nap",
        status: "recorded",
        mealPayload: { kind: "meal" },
        napPayload: { kind: "nap" },
      },
    });
    await prisma.nurtureTeacherAttentionItem.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        childCareProcessId: world.process.id,
        sourceType: "family_care_item",
        title: "medication note",
        priority: "time_sensitive",
        status: "active",
      },
    });
    const reads = new PrismaCaregiverBoardReadPort(prisma);
    const page = await reads.listCaregiverChildToday({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.authorized).toBe(true);
    const card = page.rows[0];
    expect(card?.daily_care.map((entry) => entry.kind).sort()).toEqual(["meal", "nap"]);
    // The owner's `time_sensitive` is the board's `urgent`; the vocabularies are
    // mapped, never passed through.
    expect(card?.attention.map((entry) => entry.priority)).toEqual(["urgent"]);
    // An attention card carries no board-level "resolve" write.
    expect(card?.attention[0]?.action_grants).toEqual([]);
  });
});

describe("G3-A owner writes: inline board mutations", () => {
  it("records daily care on the owner table only for the exact CareGroup", async () => {
    const world = await seedWorld();
    const eligibility = new PrismaCaregiverDailyCareEligibilityReadPort(prisma);
    const targets = await eligibility.resolveCaregiverDailyCareEligibility({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
    });
    expect(targets.children.map((entry) => entry.child_care_process_id)).toEqual([
      world.process.id,
    ]);

    const transaction = new PrismaBoardMutationTransaction(prisma);
    const facts = await transaction.loadCaregiverDailyCareFacts({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      child_care_process_id: world.process.id,
    });
    expect(facts.role_scope_matches_source).toBe(true);
    expect(facts.caregiver_role_assignment_id).toBe(world.caregiverRole.id);

    const applied = await transaction.applyCaregiverDailyCareRecord({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      child_care_process_id: world.process.id,
      care_group_id: facts.care_group_id!,
      enrollment_id: facts.enrollment_id!,
      recorded_by_role_assignment_id: facts.caregiver_role_assignment_id!,
      kind: "meal",
      summary: "ate well",
      expected_enrollment_version: facts.enrollment_version,
    });
    expect(applied.daily_care_log_ref.object_type).toBe("daily_care_log");
    const logs = await prisma.nurtureDailyCareLog.findMany({
      where: { workspaceId: world.workspaceId, childCareProcessId: world.process.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.mealPayload).toEqual({ kind: "meal", summary: "ate well" });
    expect(logs[0]?.napPayload).toBeNull();
  });

  it("refuses an unknown care kind instead of writing an empty log", async () => {
    const world = await seedWorld();
    const transaction = new PrismaBoardMutationTransaction(prisma);
    const facts = await transaction.loadCaregiverDailyCareFacts({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      child_care_process_id: world.process.id,
    });
    await expect(
      transaction.applyCaregiverDailyCareRecord({
        workspace_id: world.workspaceId,
        participant_id: world.caregiver.id,
        child_care_process_id: world.process.id,
        care_group_id: facts.care_group_id!,
        enrollment_id: facts.enrollment_id!,
        recorded_by_role_assignment_id: facts.caregiver_role_assignment_id!,
        kind: "sleep_quality",
        summary: "unmapped",
        expected_enrollment_version: facts.enrollment_version,
      }),
    ).rejects.toThrow(/unknown daily care kind/);
    expect(
      await prisma.nurtureDailyCareLog.count({ where: { workspaceId: world.workspaceId } }),
    ).toBe(0);
  });

  it("refuses an institution-scoped caregiver reaching a class it does not hold", async () => {
    const world = await seedWorld();
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.caregiverRole.id },
      data: { scopeType: "institution", scopeId: world.institution.id },
    });
    const transaction = new PrismaBoardMutationTransaction(prisma);
    const facts = await transaction.loadCaregiverDailyCareFacts({
      workspace_id: world.workspaceId,
      participant_id: world.caregiver.id,
      child_care_process_id: world.process.id,
    });
    expect(facts.role_scope_matches_source).toBe(false);
    expect(facts.caregiver_role_assignment_id).toBeUndefined();
  });
});
