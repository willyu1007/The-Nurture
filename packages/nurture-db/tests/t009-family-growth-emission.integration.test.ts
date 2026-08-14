import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  releasePayloadDigestV1,
  lifecyclePayloadDigestV1,
  sha256Hex,
  validateReleaseEventV1,
  validateLifecycleEventV1,
  type FamilyGrowthPreparedReleaseEmissionV1,
  type FamilyGrowthReleaseEventV1,
  type FamilyGrowthLifecycleEventV1,
} from "@the-nurture/scenario/family-growth";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaFamilyGrowthOutboxPort,
  PrismaPublicationReleasePort,
  PrismaPublicationSafetyTransaction,
} from "../src/index.js";

// T-009 I3 (non-wire half): the release commit and the lifecycle finalize
// each land with their family-growth outbox event as one transaction pair,
// while an absent prepared emission keeps the exact qualified G3-D behavior.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const DIGEST = "c".repeat(64);
const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
const BINDING_EXPIRY = new Date("2099-01-01T00:00:00.000Z");

const SCHEDULE = {
  scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
  notAfter: new Date("2099-08-03T11:00:00.000Z"),
  scheduleTimeZone: "Asia/Shanghai",
  schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
  schedulePolicyHead: 3,
  schedulePolicyVersion: 1,
  scheduleResolvedAt: new Date("2026-08-03T02:00:00.000Z"),
};

const seedWorld = async () => {
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
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      policyRef: SCHEDULE.schedulePolicyRef,
      policyVersion: SCHEDULE.schedulePolicyVersion,
      policyHead: SCHEDULE.schedulePolicyHead,
      timeZone: SCHEDULE.scheduleTimeZone,
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: true,
      effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const careProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      displayName: "Family A",
      status: "active",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian!.id,
      role: "guardian",
      scopeType: "family",
      scopeId: family.id,
      status: "active",
      aggregateVersion: 1,
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
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
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId,
      careGroupId: group.id,
      processKey: `publish:${randomUUID()}`,
      state: "pending_release",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
      authorizingRoleAssignmentId: teacherRole.id,
      ...SCHEDULE,
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });
  const target = await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      targetKey: "target:child-A",
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      familyRefKey: family.id,
      grantId: grant.id,
    },
  });
  const childAnchor = await prisma.nurtureChildBindingAnchor.create({
    data: { reservationKeyHash: hash(`child:${workspaceId}`), status: "associated" },
  });
  const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
    data: { reservationKeyHash: hash(`family:${workspaceId}`), status: "associated" },
  });
  const childAssociation = await prisma.nurtureChildAnchorAssociation.create({
    data: {
      workspaceId,
      childAnchorId: childAnchor.id,
      childId: child.id,
      status: "active",
      currentKey: "current",
    },
  });
  const familyAssociation = await prisma.nurtureFamilyAnchorAssociation.create({
    data: {
      workspaceId,
      familyAnchorId: familyAnchor.id,
      childAnchorId: childAnchor.id,
      childAssociationId: childAssociation.id,
      currentChildAssociationId: childAssociation.id,
      childId: child.id,
      childCareProcessId: careProcess.id,
      familyId: family.id,
      status: "active",
      currentKey: "current",
    },
  });
  const authorization = (subjectType: "child" | "family", anchorId: string) =>
    prisma.nurtureScenarioBindingAuthorization.create({
      data: {
        workspaceId,
        subjectType,
        ...(subjectType === "child" ? { childAnchorId: anchorId } : { familyAnchorId: anchorId }),
        ownerRef: `nurture_${subjectType}_binding_anchor_v1:${anchorId}`,
        ownerVersion: 1,
        idempotencyKeyHash: hash(`auth:${subjectType}:${workspaceId}`),
        requestFingerprint: hash(`fp:${subjectType}:${workspaceId}`),
        subjectEvidenceHash: hash("subject"),
        userEvidenceHash: hash("user"),
        actorEvidenceHash: hash("actor"),
        purpose: "scenario_binding_write",
        authorizationSourceRef: `nurture-care-role:${guardianRole.id}`,
        authorizationSourceVersion: guardianRole.aggregateVersion,
        status: "active",
        verifiedAt: new Date("2026-08-05T08:00:00.000Z"),
        expiresAt: BINDING_EXPIRY,
      },
    });
  const [childAuthorization, familyAuthorization] = await Promise.all([
    authorization("child", childAnchor.id),
    authorization("family", familyAnchor.id),
  ]);
  const localBindingHeads = {
    canonicalTarget: { child_id: "mc-child-1", family_id: "mc-family-1" },
    workspaceId,
    localFamilyId: family.id,
    childCareProcessId: careProcess.id,
    childAnchor: {
      anchorId: childAnchor.id,
      aggregateVersion: childAnchor.aggregateVersion,
    },
    familyAnchor: {
      anchorId: familyAnchor.id,
      aggregateVersion: familyAnchor.aggregateVersion,
    },
    childAssociation: {
      associationId: childAssociation.id,
      aggregateVersion: childAssociation.aggregateVersion,
    },
    familyAssociation: {
      associationId: familyAssociation.id,
      aggregateVersion: familyAssociation.aggregateVersion,
    },
    childAuthorization: {
      authorizationId: childAuthorization.id,
      aggregateVersion: childAuthorization.aggregateVersion,
      expiresAt: BINDING_EXPIRY.toISOString(),
      ownerRef: childAuthorization.ownerRef,
      ownerVersion: childAuthorization.ownerVersion,
      purpose: childAuthorization.purpose,
      authorizationSourceRef: childAuthorization.authorizationSourceRef,
      authorizationSourceVersion: childAuthorization.authorizationSourceVersion,
      guardianRole: {
        roleAssignmentId: guardianRole.id,
        participantId: guardianRole.participantId,
        aggregateVersion: guardianRole.aggregateVersion,
        status: guardianRole.status,
        role: guardianRole.role,
        startsAt: null,
        endsAt: null,
      },
      participant: {
        participantId: guardian!.id,
        aggregateVersion: guardian!.aggregateVersion,
        status: guardian!.status,
      },
    },
    familyAuthorization: {
      authorizationId: familyAuthorization.id,
      aggregateVersion: familyAuthorization.aggregateVersion,
      expiresAt: BINDING_EXPIRY.toISOString(),
      ownerRef: familyAuthorization.ownerRef,
      ownerVersion: familyAuthorization.ownerVersion,
      purpose: familyAuthorization.purpose,
      authorizationSourceRef: familyAuthorization.authorizationSourceRef,
      authorizationSourceVersion: familyAuthorization.authorizationSourceVersion,
      guardianRole: {
        roleAssignmentId: guardianRole.id,
        participantId: guardianRole.participantId,
        aggregateVersion: guardianRole.aggregateVersion,
        status: guardianRole.status,
        role: guardianRole.role,
        startsAt: null,
        endsAt: null,
      },
      participant: {
        participantId: guardian!.id,
        aggregateVersion: guardian!.aggregateVersion,
        status: guardian!.status,
      },
    },
    canonicalOwnerEvidenceExpiresAt: "2099-01-01T00:00:00.000Z",
  };
  return {
    workspaceId,
    teacher: teacher!,
    teacherRole,
    process,
    revision,
    target,
    localBindingHeads,
  };
};

const preparedEmission = (
  world: Awaited<ReturnType<typeof seedWorld>>,
): FamilyGrowthPreparedReleaseEmissionV1 => ({
  target: { child_id: "mc-child-1", family_id: "mc-family-1" },
  localBindingHeads: world.localBindingHeads,
  admission: { mode: "direct_family_release", policy_ref: "pol-1", policy_version: 1 },
  material: {
    occurredAt: "2026-08-07T03:30:00.000Z",
    displaySnapshot: { title: "户外写生", source_label: "向日葵班" },
    attribution: {
      source_contributor_ref: "contrib-1",
      source_organization_ref: "org-1",
      contributed_at: "2026-08-07T03:30:00.000Z",
    },
    media: [
      {
        source_asset_ref: "asset-1",
        source_media_revision: 1,
        content_digest: "b".repeat(64),
        family_rendition_ref: "rendition-1",
        mime_type: "image/jpeg",
        access_mode: "authorized_short_lived_url",
      },
    ],
  },
  retentionMode: "family_retained",
  contentDigest: DIGEST,
});

const port = () => new PrismaPublicationReleasePort(prisma);

const commit = (
  world: Awaited<ReturnType<typeof seedWorld>>,
  options: {
    commandRequestId?: string;
    familyGrowth?: FamilyGrowthPreparedReleaseEmissionV1;
  } = {},
) =>
  port().commitTargetRelease({
    workspace_id: world.workspaceId,
    participant_id: world.teacher.id,
    process_key: world.process.processKey,
    target_key: world.target.targetKey,
    revision: 1,
    command_request_id: options.commandRequestId ?? `cmd:${randomUUID()}`,
    trigger: "immediate",
    ...(options.familyGrowth ? { family_growth: options.familyGrowth } : {}),
  });

describe("T-009 I3: release commit emits the family-growth outbox event", () => {
  it("lands release, receipt and outbox event as one transaction", async () => {
    const world = await seedWorld();
    const result = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(result.status).toBe("committed");
    if (result.status !== "committed") return;

    const outbox = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId },
    });
    expect(outbox).toHaveLength(1);
    const row = outbox[0]!;
    expect(row.kind).toBe("released");
    expect(row.publicationReleaseId).toBe(result.publication_ref);
    expect(row.deliveryState).toBe("pending");

    // The stored envelope is schema-valid and binds the exact committed rows.
    const envelope = row.envelopePayload as FamilyGrowthReleaseEventV1;
    expect(validateReleaseEventV1(envelope)).toEqual([]);
    expect(envelope.event_id).toBe(row.id);
    expect(envelope.source.publication_release_ref).toBe(result.publication_ref);
    expect(envelope.source.receipt_ref).toBe(result.receipt_ref);
    expect(envelope.source.publish_process_ref).toBe(world.process.id);
    expect(envelope.source.publish_revision_ref).toBe(world.revision.id);
    expect(envelope.source.source_target_ref).toBe(world.target.id);
    expect(envelope.target).toEqual({ child_id: "mc-child-1", family_id: "mc-family-1" });
    const { source, target, admission, material, retention } = envelope;
    expect(row.payloadDigest).toBe(
      releasePayloadDigestV1({ source, target, admission, material, retention }),
    );

    const release = await prisma.nurturePublicationRelease.findUniqueOrThrow({
      where: { id: result.publication_ref },
    });
    expect(release.committedAt.toISOString()).toBe(envelope.source.committed_at);
  });

  it("an exact replay returns the original refs and appends no second event", async () => {
    const world = await seedWorld();
    const commandRequestId = `cmd:${randomUUID()}`;
    const first = await commit(world, {
      commandRequestId,
      familyGrowth: preparedEmission(world),
    });
    const replay = await commit(world, {
      commandRequestId,
      familyGrowth: preparedEmission(world),
    });
    expect(first).toEqual(replay);
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
  });

  it("rejects an invalid prepared emission write-free, freeze included", async () => {
    const world = await seedWorld();
    const invalid = preparedEmission(world);
    invalid.contentDigest = "not-a-digest";
    const result = await commit(world, { familyGrowth: invalid });
    expect(result).toEqual({
      status: "rejected",
      reason_code: "family_growth_emission_invalid",
    });
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
    expect(
      await prisma.nurtureChildLinkReceipt.count({ where: { workspaceId: world.workspaceId } }),
    ).toBe(0);
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
    // The freeze CAS rolled back with everything else.
    const process = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: world.process.id },
    });
    expect(process.state).toBe("pending_release");
    expect(process.frozenRevisionId).toBeNull();
  });

  it("without a prepared emission the commit stays the qualified G3-D path", async () => {
    const world = await seedWorld();
    const result = await commit(world);
    expect(result.status).toBe("committed");
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
  });
});

describe("T-009 I6.2: the teacher queue projects family-growth states", () => {
  it("shows the receipt-backed state per target and stays silent without evidence", async () => {
    const world = await seedWorld();
    const committed = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;

    const { PrismaPublishLaneReadPort } = await import(
      "../src/repositories/publish-lane.read.js"
    );
    const lane = new PrismaPublishLaneReadPort(prisma);
    const list = () =>
      lane.listTeacherPublishQueue({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.process.careGroupId,
        snapshot_at: new Date().toISOString(),
        take: 10,
      });

    // Outbox pending, no receipt: the queue reports "delivering".
    let page = await list();
    expect(page.authorized).toBe(true);
    let row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth).toEqual([
      { target_key: world.target.targetKey, state: "delivering" },
    ]);
    const headsBefore = structuredClone(page.heads);

    // A recorded receipt flips the display to its exact status — and moves
    // the queue source head, so a cursor from before the receipt cannot
    // stitch pages across the change without a refresh signal.
    const [outboxRow] = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId, kind: "released" },
    });
    const outbox = new PrismaFamilyGrowthOutboxPort(prisma);
    const [claimed] = await outbox.claimDue({
      now: new Date("2026-08-08T09:59:00.000Z"),
      limit: 1,
      workspaceId: world.workspaceId,
    });
    expect(claimed?.eventId).toBe(outboxRow!.id);
    const envelope = outboxRow!.envelopePayload as {
      event_id: string;
      source: { scenario_key: string; publication_release_ref: string };
      target: { family_id: string };
    };
    const receiptPayload = {
      contract_key: "family_growth_material_admission_receipt",
      contract_version: "1.0.0",
      receipt_id: "rcpt-queue-1",
      release_event_id: envelope.event_id,
      source_scenario_key: envelope.source.scenario_key,
      source_release_ref: envelope.source.publication_release_ref,
      family_id: envelope.target.family_id,
      status: "pending_guardian_confirmation",
      processed_at: "2026-08-08T10:00:00.000Z",
      consumer_contract_version: "1.0.0",
      admission_ref: "adm-1",
    };
    await outbox.recordReceipt({
      workspaceId: world.workspaceId,
      outboxEventId: outboxRow!.id,
      attemptCount: claimed!.attemptCount,
      releaseEventId: receiptPayload.release_event_id,
      sourceScenarioKey: receiptPayload.source_scenario_key,
      sourceReleaseRef: receiptPayload.source_release_ref,
      familyId: receiptPayload.family_id,
      receiptId: "rcpt-queue-1",
      status: "pending_guardian_confirmation",
      admissionRef: "adm-1",
      processedAt: new Date("2026-08-08T10:00:00.000Z"),
      receiptPayload,
    });
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth).toEqual([
      { target_key: world.target.targetKey, state: "pending_guardian_confirmation" },
    ]);
    expect(page.heads).not.toEqual(headsBefore);

    // A later receipt for the same event (the guardian confirmed) wins the
    // display deterministically, even at an identical createdAt millisecond
    // (id is the tiebreaker), and moves the head again.
    const headsMid = structuredClone(page.heads);
    await prisma.nurtureFamilyGrowthAdmissionReceipt.create({
      data: {
        workspaceId: world.workspaceId,
        outboxEventId: outboxRow!.id,
        receiptId: "rcpt-queue-2",
        status: "applied",
        admissionRef: "adm-1",
        materialRef: "mat-1",
        processedAt: new Date("2026-08-08T10:05:00.000Z"),
        receiptPayload: {},
      },
    });
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth).toEqual([
      { target_key: world.target.targetKey, state: "applied" },
    ]);
    expect(page.heads).not.toEqual(headsMid);
  });

  it("I8: overlays committed lifecycle events with precedence, moving the head each time", async () => {
    const world = await seedWorld();
    const committed = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;
    // One visibility event per (release, command, kind) is a domain unique —
    // every append below is its own teacher command.
    const newExecutionId = async () => {
      const execution = await prisma.nurtureCommandExecution.create({
        data: {
          workspaceId: world.workspaceId,
          commandRequestIdHash: sha256Hex(randomUUID()),
          originInvocationRequestIdHash: sha256Hex(randomUUID()),
          commandKey: "correct_publication",
          commandScope: "board_publication",
          commandContractVersion: 1,
          payloadHash: sha256Hex("payload"),
          businessActorRef: world.teacher.id,
          targetRefs: [],
          businessOutcome: "applied",
          outputRefs: [],
          handoffRequestSnapshotsPayload: [],
          committedAt: new Date(),
        },
      });
      return execution.id;
    };

    const { PrismaPublishLaneReadPort } = await import(
      "../src/repositories/publish-lane.read.js"
    );
    const lane = new PrismaPublishLaneReadPort(prisma);
    const list = () =>
      lane.listTeacherPublishQueue({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.process.careGroupId,
        snapshot_at: new Date().toISOString(),
        take: 10,
      });
    const append = async (
      kind: "correction" | "target_removal" | "redaction",
      publicationRef: string = committed.publication_ref,
    ) =>
      new PrismaPublicationSafetyTransaction(prisma).appendPublicationVisibilityEvents({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        command_execution_id: await newExecutionId(),
        actor_role_assignment_id: world.teacherRole.id,
        events: [
          {
            event_id: randomUUID(),
            publication_id: publicationRef,
            kind,
            reason_key: "content_error",
            source_release_revision: 1,
            occurred_at: new Date().toISOString(),
            ...(kind === "correction"
              ? { correction_display_safe_text: "活动时间更正" }
              : {}),
          },
        ],
      });

    // A SECOND target on the same process, committed with its own emission:
    // the overlay must discriminate per target, not per process.
    const targetB = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: world.process.id,
        targetKey: "target:child-B",
        childCareProcessId: world.target.childCareProcessId,
        enrollmentId: world.target.enrollmentId,
        familyRefKey: world.target.familyRefKey,
        grantId: world.target.grantId,
      },
    });
    const committedB = await port().commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: world.process.processKey,
      target_key: targetB.targetKey,
      revision: 1,
      command_request_id: `cmd:${randomUUID()}`,
      trigger: "immediate",
      // Both local targets deliberately point at the same family binding.
      // Their prepared canonical target must therefore remain identical; the
      // queue still has to discriminate the two release rows by target key.
      family_growth: preparedEmission(world),
    });
    expect(committedB.status).toBe("committed");

    // No lifecycle yet: the entries carry no overlay.
    let page = await list();
    let row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth?.map((entry) => entry.lifecycle)).toEqual([
      undefined,
      undefined,
    ]);
    const headsBefore = structuredClone(page.heads);

    // A committed correction on target A appears as A's overlay — and ONLY
    // A's (target B on the same process stays clean) — and moves the head.
    await append("correction");
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth).toEqual([
      {
        target_key: world.target.targetKey,
        state: "delivering",
        lifecycle: "correction_appended",
      },
      { target_key: targetB.targetKey, state: "delivering" },
    ]);
    expect(page.heads).not.toEqual(headsBefore);

    // A later redaction on A outranks the correction and moves the head
    // again; B still carries no overlay.
    const headsMid = structuredClone(page.heads);
    await append("redaction");
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth?.map((entry) => entry.lifecycle)).toEqual([
      "redacted",
      undefined,
    ]);
    expect(page.heads).not.toEqual(headsMid);

    // Precedence, not last-wins: a SECOND correction after the redaction
    // leaves the display redacted — and still moves the head (the census is
    // a count, not an existence bit).
    const headsAfterRedaction = structuredClone(page.heads);
    await append("correction");
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth?.[0]?.lifecycle).toBe("redacted");
    expect(page.heads).not.toEqual(headsAfterRedaction);

    // target_removal maps too, and lands on B alone.
    if (committedB.status !== "committed") return;
    const headsBeforeRemoval = structuredClone(page.heads);
    await append("target_removal", committedB.publication_ref);
    page = await list();
    row = page.rows.find((entry) => entry.process_key === world.process.processKey);
    expect(row?.family_growth?.map((entry) => entry.lifecycle)).toEqual([
      "redacted",
      "target_removed",
    ]);
    expect(page.heads).not.toEqual(headsBeforeRemoval);
  });
});

describe("T-009 I3: lifecycle finalize emits paired outbox events", () => {
  const appendEvents = (
    world: Awaited<ReturnType<typeof seedWorld>>,
    publicationId: string,
    executionId: string,
    events: Array<{
      kind: "correction" | "target_removal" | "redaction";
      correction_display_safe_text?: string;
    }>,
  ) =>
    new PrismaPublicationSafetyTransaction(prisma).appendPublicationVisibilityEvents({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      command_execution_id: executionId,
      actor_role_assignment_id: world.teacherRole.id,
      events: events.map((event) => ({
        event_id: randomUUID(),
        publication_id: publicationId,
        kind: event.kind,
        reason_key: "content_error",
        source_release_revision: 1,
        occurred_at: new Date().toISOString(),
        ...(event.correction_display_safe_text !== undefined
          ? { correction_display_safe_text: event.correction_display_safe_text }
          : {}),
      })),
    });

  const seedExecution = async (world: Awaited<ReturnType<typeof seedWorld>>) => {
    const execution = await prisma.nurtureCommandExecution.create({
      data: {
        workspaceId: world.workspaceId,
        commandRequestIdHash: sha256Hex(randomUUID()),
        originInvocationRequestIdHash: sha256Hex(randomUUID()),
        commandKey: "correct_publication",
        commandScope: "board_publication",
        commandContractVersion: 1,
        payloadHash: sha256Hex("payload"),
        businessActorRef: world.teacher.id,
        targetRefs: [],
        businessOutcome: "applied",
        outputRefs: [],
        handoffRequestSnapshotsPayload: [],
        committedAt: new Date(),
      },
    });
    return execution.id;
  };

  it("emits the lifecycle envelope for a delivered release, target copied from storage", async () => {
    const world = await seedWorld();
    const committed = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;
    const executionId = await seedExecution(world);

    await appendEvents(world, committed.publication_ref, executionId, [
      { kind: "correction", correction_display_safe_text: "活动时间更正为周三上午" },
    ]);

    const rows = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId, kind: "correction" },
    });
    expect(rows).toHaveLength(1);
    const envelope = rows[0]!.envelopePayload as FamilyGrowthLifecycleEventV1;
    expect(validateLifecycleEventV1(envelope)).toEqual([]);
    expect(envelope.target).toEqual({ child_id: "mc-child-1", family_id: "mc-family-1" });
    expect(envelope.source.publication_release_ref).toBe(committed.publication_ref);
    expect(envelope.correction?.display_safe_text).toBe("活动时间更正为周三上午");
    expect(envelope.correction?.content_digest).toBe(sha256Hex("活动时间更正为周三上午"));
    expect(rows[0]!.visibilityEventId).toBe(envelope.source.event_ref);
    expect(rows[0]!.payloadDigest).toBe(
      lifecyclePayloadDigestV1({
        source: envelope.source,
        target: envelope.target,
        correction: envelope.correction,
      }),
    );
  });

  it("skips emission for a release that never delivered to family growth", async () => {
    const world = await seedWorld();
    const committed = await commit(world);
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;
    const executionId = await seedExecution(world);

    await appendEvents(world, committed.publication_ref, executionId, [
      { kind: "target_removal" },
    ]);

    expect(
      await prisma.nurturePublicationVisibilityEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
  });

  it("a correction without display-safe text on a delivered release fails the pair closed", async () => {
    const world = await seedWorld();
    const committed = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;
    const executionId = await seedExecution(world);

    await expect(
      appendEvents(world, committed.publication_ref, executionId, [{ kind: "correction" }]),
    ).rejects.toThrow();
    // The lineage row rolled back with the failed envelope: no half pair.
    expect(
      await prisma.nurturePublicationVisibilityEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId, kind: { not: "released" } },
      }),
    ).toBe(0);
  });

  it("redaction emits without a correction body", async () => {
    const world = await seedWorld();
    const committed = await commit(world, { familyGrowth: preparedEmission(world) });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;
    const executionId = await seedExecution(world);

    await appendEvents(world, committed.publication_ref, executionId, [{ kind: "redaction" }]);
    const rows = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId, kind: "redaction" },
    });
    expect(rows).toHaveLength(1);
    const envelope = rows[0]!.envelopePayload as FamilyGrowthLifecycleEventV1;
    expect(validateLifecycleEventV1(envelope)).toEqual([]);
    expect(envelope.correction).toBeUndefined();
  });
});
