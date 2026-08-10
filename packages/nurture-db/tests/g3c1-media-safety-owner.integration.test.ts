import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createContentSafetyRoutePort } from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import { PrismaMediaAttributionTransaction, PrismaMediaSafetyReadPort } from "../src/index.js";

// Owner-side proof for the media and content-safety ports (G3-E prerequisite
// B2-3). What has to hold here is that a source the owner could not assess
// fails the whole derivation closed, that attribution binds to the exact
// immutable media revision, and that a global discard can see every draft that
// would lose content.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const SAFETY_POLICY = {
  contentSafetyPolicyRef: "syn-content-safety-1",
  contentSafetyPolicyHead: 2,
};

const seedWorld = async (policyConfig: unknown = SAFETY_POLICY) => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${workspaceId}`, status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      policyConfigPayload: policyConfig as never,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const otherGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class B", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
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
  // A child of the sibling class: visible in the building, never an
  // attribution target for this teacher.
  const otherChild = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child B", status: "active" },
  });
  const otherProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: otherChild.id, status: "active" },
  });
  await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: otherProcess.id,
      institutionId: institution.id,
      careGroupId: otherGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  return {
    workspaceId,
    teacher,
    teacherRole,
    institution,
    group,
    otherGroup,
    process,
    otherProcess,
    enrollment,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const seedCapture = async (world: World, markers: string[] | null) => {
  const batch = await prisma.nurtureCareCaptureBatch.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      state: "collecting",
    },
  });
  return prisma.nurtureCareCapture.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      captureBatchId: batch.id,
      capturedByRoleAssignmentId: world.teacherRole.id,
      kind: "text",
      sourceSequence: 1,
      stable: true,
      occurredAt: new Date("2026-08-02T02:00:00.000Z"),
      ...(markers === null ? {} : { safetyMarkersPayload: markers }),
    },
  });
};

const seedAsset = async (
  world: World,
  overrides: { markers?: string[] | null; careGroupId?: string } = {},
) =>
  prisma.nurtureMediaAssetRef.create({
    data: {
      workspaceId: world.workspaceId,
      institutionId: world.institution.id,
      careGroupId: overrides.careGroupId ?? world.group.id,
      sourceKind: "class_album",
      storageRefPayload: { bucket: "media", key: randomUUID() },
      lifecycle: "ready",
      ...(overrides.markers === undefined || overrides.markers === null
        ? {}
        : { safetyMarkersPayload: overrides.markers }),
    },
  });

describe("G3-C1 owner reads: content safety signals", () => {
  it("returns the recorded markers with the institution's exact policy head", async () => {
    const world = await seedWorld();
    const capture = await seedCapture(world, ["health_symptom"]);
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const signals = await reads.loadSafetySignals({
      workspace_id: world.workspaceId,
      care_group_id: world.group.id,
      organizer_input_revision: "organizer:1",
      source_ids: [capture.id],
    });
    expect(signals?.policy_ref).toBe("syn-content-safety-1");
    expect(signals?.policy_head).toBe(2);
    expect(signals?.sources).toEqual([
      { source_id: capture.id, fact_kind: "teacher_text", markers: ["health_symptom"] },
    ]);
    // No classifier participates on the deterministic path.
    expect(signals?.classifier).toBeNull();
  });

  it("routes a derived-but-empty marker list as ordinary and an underived one as no route", async () => {
    const world = await seedWorld();
    const assessed = await seedCapture(world, []);
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const port = createContentSafetyRoutePort(reads);

    const ordinary = await port.deriveRoute({
      workspace_id: world.workspaceId,
      care_group_id: world.group.id,
      organizer_input_revision: "organizer:1",
      source_ids: [assessed.id],
    });
    expect(ordinary?.route).toBe("ordinary");

    // "Never derived" is a different fact from "derived, none found": the whole
    // derivation fails closed rather than routing content nobody assessed.
    const unassessed = await seedCapture(world, null);
    expect(
      await port.deriveRoute({
        workspace_id: world.workspaceId,
        care_group_id: world.group.id,
        organizer_input_revision: "organizer:1",
        source_ids: [assessed.id, unassessed.id],
      }),
    ).toBeNull();
  });

  it("refuses when any requested source is not one this CareGroup owns", async () => {
    const world = await seedWorld();
    const capture = await seedCapture(world, []);
    const foreign = await seedAsset(world, { markers: [], careGroupId: world.otherGroup.id });
    const reads = new PrismaMediaSafetyReadPort(prisma);
    expect(
      await reads.loadSafetySignals({
        workspace_id: world.workspaceId,
        care_group_id: world.group.id,
        organizer_input_revision: "organizer:1",
        source_ids: [capture.id, foreign.id],
      }),
    ).toBeNull();
    expect(
      await reads.loadSafetySignals({
        workspace_id: world.workspaceId,
        care_group_id: world.group.id,
        organizer_input_revision: "organizer:1",
        source_ids: [capture.id, randomUUID()],
      }),
    ).toBeNull();
  });

  it("treats an absent safety policy as no route rather than a default bar", async () => {
    const world = await seedWorld({});
    const capture = await seedCapture(world, ["health_symptom"]);
    const reads = new PrismaMediaSafetyReadPort(prisma);
    expect(
      await reads.loadSafetySignals({
        workspace_id: world.workspaceId,
        care_group_id: world.group.id,
        organizer_input_revision: "organizer:1",
        source_ids: [capture.id],
      }),
    ).toBeNull();
  });

  it("keeps a media capture a media fact rather than teacher text", async () => {
    const world = await seedWorld();
    const batch = await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        state: "collecting",
      },
    });
    const media = await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        captureBatchId: batch.id,
        capturedByRoleAssignmentId: world.teacherRole.id,
        kind: "media",
        sourceSequence: 1,
        stable: true,
        occurredAt: new Date("2026-08-02T02:00:00.000Z"),
        safetyMarkersPayload: [],
      },
    });
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const signals = await reads.loadSafetySignals({
      workspace_id: world.workspaceId,
      care_group_id: world.group.id,
      organizer_input_revision: "organizer:1",
      source_ids: [media.id],
    });
    // The safety policy routes on fact kind; a photo entering as teacher text
    // would be assessed as the wrong thing.
    expect(signals?.sources[0]?.fact_kind).toBe("media_photo");
  });

  it("carries an unrecognised marker through to the review tier", async () => {
    const world = await seedWorld();
    const capture = await seedCapture(world, ["rule_key_from_a_newer_policy"]);
    const port = createContentSafetyRoutePort(new PrismaMediaSafetyReadPort(prisma));
    const assessment = await port.deriveRoute({
      workspace_id: world.workspaceId,
      care_group_id: world.group.id,
      organizer_input_revision: "organizer:1",
      source_ids: [capture.id],
    });
    expect(assessment?.route).toBe("review_required");
    expect(assessment?.riskCodes).toEqual(["unrecognised_marker"]);
  });
});

describe("G3-C1 owner reads: media attribution", () => {
  it("offers only children of the exact CareGroup and binds the original revision", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaAttributionFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });
    expect(facts?.authority.role_scope_matches_source).toBe(true);
    expect(facts?.media_lifecycle).toBe("ready");
    expect(facts?.media_revision).toBe(1);
    expect(facts?.eligible_child_ids).toEqual([world.process.id]);
    expect(facts?.eligible_child_ids).not.toContain(world.otherProcess.id);
  });

  it("maps the owner's attribution source vocabulary rather than passing it through", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: world.process.id,
        source: "face_reference",
        state: "candidate",
        attributionRevision: 1,
      },
    });
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaAttributionFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });
    // The owner's `face_reference` is the board's `automatic_face_match`; it
    // must never surface as a manual teacher decision.
    expect(facts?.attributions).toEqual([
      {
        attribution_id: expect.any(String),
        child_care_process_id: world.process.id,
        status: "candidate",
        revision: 1,
        source: "automatic_face_match",
      },
    ]);
  });

  it("reports the whole revision history in order, superseded rows included", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const first = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: world.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: world.teacherRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
        attributionRevision: 1,
      },
    });
    const second = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: world.process.id,
        source: "manual",
        state: "confirmed",
        confirmedByRoleAssignmentId: world.teacherRole.id,
        confirmedAt: new Date("2026-08-02T03:00:00.000Z"),
        exposurePolicyPayload: { audience: "own_family" },
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
    // One current fact per child, not the history. Every attribution rule looks
    // this up with a `find` by child, so returning both revisions handed them
    // the superseded one — the oldest — for every decision.
    expect(facts?.attributions.map((entry) => [entry.revision, entry.status])).toEqual([
      [2, "confirmed"],
    ]);
    expect(facts?.attributions).toHaveLength(1);
  });

  it("refuses an asset belonging to a sibling class", async () => {
    const world = await seedWorld();
    const foreign = await seedAsset(world, { careGroupId: world.otherGroup.id });
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaAttributionFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: foreign.id,
    });
    // The authority question is asked of the asset's OWN class, where this
    // teacher holds nothing: the facts are absent, not merely flagged.
    expect(facts).toBeNull();
    expect(
      await reads.listAttributableMediaIds({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
      }),
    ).not.toContain(foreign.id);
  });
});

describe("G3-C1 owner reads: media lifecycle", () => {
  const seedDraftCiting = async (world: World, assetId: string, state: "draft" | "released") => {
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        processKey: `publish:${randomUUID()}`,
        state: state === "released" ? "pending_release" : state,
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        mediaCompositionPayload: { media: [{ mediaAssetId: assetId, mediaRevision: 1 }] },
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: {
        currentRevisionId: revision.id,
        ...(state === "released" ? { state, frozenRevisionId: revision.id } : {}),
      },
    });
    return { process, revision };
  };

  it("counts every unreleased draft that still cites the asset", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const first = await seedDraftCiting(world, asset.id, "draft");
    await seedDraftCiting(world, asset.id, "draft");
    // A released card is no longer a draft that would lose content.
    await seedDraftCiting(world, asset.id, "released");

    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaLifecycleFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      process_key: first.process.processKey,
    });
    expect(facts?.referencing_draft_count).toBe(2);
    expect(facts?.composition_media_ids).toEqual([asset.id]);
    expect(facts?.process_state).toBe("draft");
    expect(facts?.media_revision).toBe(1);
  });

  it("reports the committed releases that close the global discard window", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const { process, revision } = await seedDraftCiting(world, asset.id, "released");
    const grant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        grantedByParticipantId: world.teacher.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: world.group.id,
        directions: ["org_to_family"],
        dataClasses: ["child_growth_record"],
        purposes: ["child_growth_publication"],
        status: "active",
      },
    });
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        targetKey: "target:child-a",
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        familyRefKey: `${world.workspaceId}:${world.process.id}`,
        grantId: grant.id,
      },
    });
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: world.teacherRole.id,
        commandRequestIdHash: randomUUID().replace(/-/g, "").repeat(2),
      },
    });

    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaLifecycleFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      process_key: process.processKey,
    });
    expect(facts?.committed_release_count).toBe(1);
    expect(facts?.process_state).toBe("released");
  });

  it("counts only releases that actually carry this asset toward the global discard window", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const unrelated = await seedAsset(world);
    // A published card that never contained this asset must not freeze it.
    const other = await seedDraftCiting(world, unrelated.id, "released");
    const grant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        grantedByParticipantId: world.teacher.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: world.group.id,
        directions: ["org_to_family"],
        dataClasses: ["child_growth_record"],
        purposes: ["child_growth_publication"],
        status: "active",
      },
    });
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: other.process.id,
        targetKey: "target:child-a",
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        familyRefKey: `${world.workspaceId}:${world.process.id}`,
        grantId: grant.id,
      },
    });
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: other.process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: other.revision.id,
        releasedByRoleAssignmentId: world.teacherRole.id,
        commandRequestIdHash: randomUUID().replace(/-/g, "").repeat(2),
      },
    });

    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaLifecycleFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });
    expect(facts?.committed_release_count).toBe(0);

    const frozen = await reads.loadMediaLifecycleFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: unrelated.id,
    });
    expect(frozen?.committed_release_count).toBe(1);
  });

  it("refuses an unknown process key instead of answering about the asset alone", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const reads = new PrismaMediaSafetyReadPort(prisma);
    expect(
      await reads.loadMediaLifecycleFacts({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        media_asset_id: asset.id,
        process_key: "publish:does-not-exist",
      }),
    ).toBeNull();
  });

  it("treats a malformed composition payload as no cited media", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const { process, revision } = await seedDraftCiting(world, asset.id, "draft");
    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: { mediaCompositionPayload: { unexpected: "shape" } },
    });
    const reads = new PrismaMediaSafetyReadPort(prisma);
    const facts = await reads.loadMediaLifecycleFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      process_key: process.processKey,
    });
    expect(facts?.composition_media_ids).toEqual([]);
    expect(facts?.referencing_draft_count).toBe(0);
  });
});

describe("T-006 owner write: child-media attribution decisions", () => {
  const owner = () => new PrismaMediaAttributionTransaction(prisma);

  const seedCandidate = async (world: World, assetId: string, childProcessId: string) =>
    prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: assetId,
        childCareProcessId: childProcessId,
        source: "system",
        state: "candidate",
        attributionRevision: 1,
      },
    });

  it("confirms by appending a manual revision that satisfies the confirmation CHECK", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    await seedCandidate(world, asset.id, world.process.id);

    const applied = await owner().applyChildAttributionAppends({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      appends: [
        { child_care_process_id: world.process.id, expected_revision: 1, state: "confirmed" },
      ],
      link_supersession: false,
    });
    expect(applied.rows).toHaveLength(1);
    expect(applied.rows[0]).toMatchObject({ revision: 2, state: "confirmed", source: "manual" });

    const rows = await prisma.nurtureChildMediaAttribution.findMany({
      where: { workspaceId: world.workspaceId, mediaAssetRefId: asset.id },
      orderBy: { attributionRevision: "asc" },
    });
    // Append-only: the candidate survives as history under the confirmation.
    expect(rows.map((row) => [row.attributionRevision, row.state])).toEqual([
      [1, "candidate"],
      [2, "confirmed"],
    ]);
    // The CHECK's whole clause is present, and the decision instant IS the
    // stored confirmation instant.
    expect(rows[1]?.confirmedByRoleAssignmentId).toBe(world.teacherRole.id);
    expect(rows[1]?.confirmedAt?.toISOString()).toBe(applied.rows[0]?.decided_at);
    expect(rows[1]?.exposurePolicyPayload).toEqual({ audience: "own_family" });

    // And the write facts now answer the repeat from that same stored instant.
    const facts = await owner().loadMediaAttributionWriteFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });
    expect(facts?.attributions).toEqual([
      expect.objectContaining({
        status: "confirmed",
        revision: 2,
        decided_at: applied.rows[0]?.decided_at,
      }),
    ]);
  });

  it("rejects by appending and inherits the row's own stored source", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    await seedCandidate(world, asset.id, world.process.id);

    const applied = await owner().applyChildAttributionAppends({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      appends: [
        { child_care_process_id: world.process.id, expected_revision: 1, state: "rejected" },
      ],
      link_supersession: false,
    });
    // The prisma-level source is copied from the row (system), and reported in
    // the domain vocabulary (organizer_candidate) — never round-tripped
    // through the lossy display mapping.
    expect(applied.rows[0]).toMatchObject({
      revision: 2,
      state: "rejected",
      source: "organizer_candidate",
    });
    const stored = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, mediaAssetRefId: asset.id, attributionRevision: 2 },
    });
    expect(stored.source).toBe("system");
    expect(stored.confirmedAt).toBeNull();
  });

  it("supersedes atomically: from-child superseded, to-child confirmed, and linked", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    // Both children must be in the SAME class for one teacher to correct
    // between them; enroll the second child in the teacher's group too.
    const childB = await prisma.nurtureChild.create({
      data: { workspaceId: world.workspaceId, displayName: "Child C", status: "active" },
    });
    const processB = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: world.workspaceId, childId: childB.id, status: "active" },
    });
    await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: processB.id,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        status: "active",
        participationPhase: "formal",
      },
    });
    // Child A is confirmed at revision 2 (via a candidate), child B has nothing.
    await seedCandidate(world, asset.id, world.process.id);
    await owner().applyChildAttributionAppends({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      appends: [
        { child_care_process_id: world.process.id, expected_revision: 1, state: "confirmed" },
      ],
      link_supersession: false,
    });

    const applied = await owner().applyChildAttributionAppends({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      appends: [
        { child_care_process_id: world.process.id, expected_revision: 2, state: "superseded" },
        { child_care_process_id: processB.id, expected_revision: 0, state: "confirmed" },
      ],
      link_supersession: true,
    });
    expect(applied.rows.map((row) => [row.state, row.revision])).toEqual([
      ["superseded", 3],
      ["confirmed", 1],
    ]);
    // One instant for the whole correction.
    expect(applied.rows[0]?.decided_at).toBe(applied.rows[1]?.decided_at);

    const supersededRow = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: world.process.id,
        attributionRevision: 3,
      },
    });
    const confirmedRow = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: {
        workspaceId: world.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: processB.id,
      },
    });
    // The superseded revision names the confirmed row it was corrected in
    // favour of; the confirmed history underneath is untouched.
    expect(supersededRow.supersededByAttributionId).toBe(confirmedRow.id);
    expect(
      (
        await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
          where: {
            workspaceId: world.workspaceId,
            mediaAssetRefId: asset.id,
            childCareProcessId: world.process.id,
            attributionRevision: 2,
          },
        })
      ).state,
    ).toBe("confirmed");
  });

  it("refuses a stale head, a gapped head, and the reserved revision 0 on a real row", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    await seedCandidate(world, asset.id, world.process.id);

    for (const expected of [0, 2]) {
      await expect(
        owner().applyChildAttributionAppends({
          workspace_id: world.workspaceId,
          participant_id: world.teacher.id,
          media_asset_id: asset.id,
          appends: [
            {
              child_care_process_id: world.process.id,
              expected_revision: expected,
              state: "confirmed",
            },
          ],
          link_supersession: false,
        }),
      ).rejects.toThrow(/revision conflict/);
    }
    expect(
      await prisma.nurtureChildMediaAttribution.count({
        where: { workspaceId: world.workspaceId, mediaAssetRefId: asset.id },
      }),
    ).toBe(1);

    // The floor keeps absence unrepresentable by a real row.
    await expect(
      prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId: world.workspaceId,
          mediaAssetRefId: asset.id,
          childCareProcessId: world.otherProcess.id,
          source: "manual",
          state: "candidate",
          attributionRevision: 0,
        },
      }),
    ).rejects.toThrow(/ck_nurture_media_attribution_revision_floor/);
  });
});

describe("T-006 owner write: media discard", () => {
  it("discards under the media-revision head and records the blast radius it measured", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    // One unreleased class draft cites the asset.
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
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

    const owner = new PrismaMediaAttributionTransaction(prisma);
    const facts = await owner.loadMediaDiscardFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
    });
    expect(facts).toMatchObject({
      media_lifecycle: "ready",
      committed_release_count: 0,
      referencing_draft_count: 1,
    });

    const applied = await owner.applyMediaAssetDiscard({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      media_asset_id: asset.id,
      expected_media_revision: facts!.media_revision,
    });
    expect(applied.affected_draft_count).toBe(1);
    const stored = await prisma.nurtureMediaAssetRef.findUniqueOrThrow({
      where: { id: asset.id },
    });
    expect(stored.lifecycle).toBe("discarded");
    expect(stored.aggregateVersion).toBe(asset.aggregateVersion + 1);

    // Terminal is terminal: a second discard finds no discardable row.
    await expect(
      owner.applyMediaAssetDiscard({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        media_asset_id: asset.id,
        expected_media_revision: facts!.media_revision,
      }),
    ).rejects.toThrow(/revision conflict/);
  });

  it("refuses a discard whose frozen media revision the asset has moved past", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    // The original was replaced: the asset now carries revision 2, while the
    // teacher's confirmation was frozen against revision 1.
    await prisma.nurtureMediaAssetRef.update({
      where: { id: asset.id },
      data: { mediaRevision: 2 },
    });
    const owner = new PrismaMediaAttributionTransaction(prisma);
    await expect(
      owner.applyMediaAssetDiscard({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        media_asset_id: asset.id,
        expected_media_revision: 1,
      }),
    ).rejects.toThrow(/revision conflict/);
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("ready");
  });

  it("refuses the discard once any release's frozen composition carries the asset", async () => {
    const world = await seedWorld();
    const asset = await seedAsset(world);
    const process = await prisma.nurturePublishProcess.create({
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
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        mediaCompositionPayload: { media: [{ mediaAssetId: asset.id, mediaRevision: 1 }] },
      },
    });
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        targetKey: `target:${randomUUID()}`,
        childCareProcessId: world.process.id,
        enrollmentId: world.enrollment.id,
        familyRefKey: `${world.workspaceId}:${world.process.id}`,
        grantId: (
          await prisma.nurtureChildLinkGrant.create({
            data: {
              workspaceId: world.workspaceId,
              childCareProcessId: world.process.id,
              enrollmentId: world.enrollment.id,
              grantedByParticipantId: world.teacher.id,
              grantedToScopeType: "care_group",
              grantedToScopeId: world.group.id,
              directions: ["org_to_family"],
              dataClasses: ["child_growth_record"],
              purposes: ["child_growth_publication"],
              status: "active",
            },
          })
        ).id,
      },
    });
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: world.teacherRole.id,
        commandRequestIdHash: "c".repeat(64),
      },
    });

    const owner = new PrismaMediaAttributionTransaction(prisma);
    await expect(
      owner.applyMediaAssetDiscard({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        media_asset_id: asset.id,
        expected_media_revision: 1,
      }),
    ).rejects.toThrow(/already released/);
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("ready");
  });
});
