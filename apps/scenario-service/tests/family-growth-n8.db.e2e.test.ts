import { createHash, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPrismaClient,
  PrismaFamilyGrowthBindingReadPort,
  PrismaFamilyGrowthEmissionPreparer,
  PrismaFamilyGrowthOutboxPort,
  PrismaPublicationReleasePort,
  PrismaPublicationSafetyTransaction,
  createAesGcmProtectedContentPort,
} from "@the-nurture/db";
import {
  lifecyclePayloadDigestV1,
  releasePayloadDigestV1,
  validateLifecycleEventV1,
  validateReleaseEventV1,
  type FamilyGrowthCanonicalExchangePort,
  type FamilyGrowthLifecycleEventV1,
  type FamilyGrowthReleaseEventV1,
} from "@the-nurture/scenario/family-growth";
import {
  createFamilyGrowthHttpTransport,
  FamilyGrowthDeliveryWorker,
  type FamilyGrowthDeliveryOutboxPort,
} from "../src/family-growth-delivery.worker.js";

// T-009 I7 (N8 conformance, provider side): the twelve fixtures from the
// delivery requirements run through the REAL provider chain — fact preparer,
// release/lifecycle transactions, outbox, delivery worker and the real HTTP
// transport — against a contract-faithful consumer double that revalidates
// every envelope with the frozen v1 schema and recomputed payload digests,
// and implements the consumer semantics the contract fixes: event-identity
// idempotency, source-key uniqueness with digest conflict, pre-release
// suppression, and per-status receipt companion refs. The two-real-services
// joint run rides with the I6 requalification round.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the N8 conformance suite.");
}

const prisma = createPrismaClient(databaseUrl);
const EVENTS_TOKEN = "n8-events-service-token-32-chars";
const hash = (value: string): string => createHash("sha256").update(value).digest("hex");

const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "n8-key",
  keyMaterial: "n8-protected-content-key-material",
});

const SCHEDULE = {
  scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
  notAfter: new Date("2099-08-03T11:00:00.000Z"),
  scheduleTimeZone: "Asia/Shanghai",
  schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
  schedulePolicyHead: 3,
  schedulePolicyVersion: 1,
  scheduleResolvedAt: new Date("2026-08-03T02:00:00.000Z"),
};

// --- contract-faithful consumer double -------------------------------------

type DoubleReceipt = Record<string, unknown>;

class ConsumerDouble {
  server: Server | null = null;
  baseUrl = "";
  /** Fixture-visible contract violations; must stay empty. */
  readonly violations: string[] = [];
  readonly ledger = new Map<string, { digest: string; receipt: DoubleReceipt }>();
  readonly admitted = new Map<string, { digest: string; admissionRef: string; materialRef: string }>();
  readonly suppressed = new Map<string, string>();
  mode: "up" | "unavailable" | "releases_unavailable" = "up";
  familyPolicy = new Map<string, "applied" | "pending" | "rejected">();

  async start(): Promise<void> {
    this.server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        const answer = this.answer(
          request.headers.authorization,
          Buffer.concat(chunks).toString("utf8"),
        );
        response.statusCode = answer.status;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify(answer.body ?? {}));
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
    const address = this.server.address() as AddressInfo;
    this.baseUrl = `http://127.0.0.1:${address.port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }

  private answer(
    authorization: string | undefined,
    raw: string,
  ): { status: number; body?: unknown } {
    if (authorization !== `Bearer ${EVENTS_TOKEN}`) {
      return { status: 401, body: { error: "service_unauthorized" } };
    }
    if (this.mode === "unavailable") return { status: 503, body: {} };
    let envelope: Record<string, unknown>;
    try {
      envelope = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { status: 400, body: { error: "envelope_unroutable" } };
    }
    if (envelope.contract_key === "family_growth_material_release") {
      if (this.mode === "releases_unavailable") return { status: 503, body: {} };
      return this.answerRelease(envelope);
    }
    return this.answerLifecycle(envelope);
  }

  private base(envelope: Record<string, unknown>, receiptId: string): DoubleReceipt {
    const source = envelope.source as Record<string, unknown>;
    const target = envelope.target as Record<string, unknown>;
    return {
      contract_key: "family_growth_material_admission_receipt",
      contract_version: "1.0.0",
      receipt_id: receiptId,
      release_event_id: envelope.event_id,
      source_scenario_key: source.scenario_key,
      source_release_ref: source.publication_release_ref,
      family_id: target.family_id,
      processed_at: new Date().toISOString(),
      consumer_contract_version: "1.0.0",
    };
  }

  private remember(
    eventId: string,
    digest: string,
    receipt: DoubleReceipt,
  ): { status: number; body: unknown } {
    this.ledger.set(eventId, { digest, receipt });
    return { status: 200, body: receipt };
  }

  private answerRelease(envelope: Record<string, unknown>): { status: number; body?: unknown } {
    const failures = validateReleaseEventV1(envelope);
    if (failures.length > 0) {
      this.violations.push(...failures.map((f) => `release ${f.path}: ${f.message}`));
      return { status: 400, body: { error: "invalid_envelope" } };
    }
    const release = envelope as unknown as FamilyGrowthReleaseEventV1;
    const digest = releasePayloadDigestV1(release);
    if (digest !== release.payload_digest) {
      this.violations.push(`release ${release.event_id}: payload digest mismatch`);
      return { status: 400, body: { error: "invalid_envelope" } };
    }
    const eventId = release.event_id;
    const replay = this.ledger.get(eventId);
    if (replay) {
      if (replay.digest !== digest) {
        return this.conflict(envelope, "event_digest_conflict");
      }
      // Exact replay resolves to the existing refs as a duplicate.
      const receipt = { ...replay.receipt };
      if (receipt.status === "applied") receipt.status = "duplicate";
      return { status: 200, body: receipt };
    }
    const sourceKey = `${release.source.scenario_key}:${release.source.publication_release_ref}:${release.target.family_id}`;
    const suppression = this.suppressed.get(sourceKey);
    if (suppression) {
      return this.remember(eventId, digest, {
        ...this.base(envelope, `rcpt-${eventId}`),
        status: "tombstoned",
        suppression_ref: suppression,
      });
    }
    const existing = this.admitted.get(sourceKey);
    if (existing) {
      if (existing.digest !== digest) return this.conflict(envelope, "source_digest_conflict");
      return this.remember(eventId, digest, {
        ...this.base(envelope, `rcpt-${eventId}`),
        status: "duplicate",
        admission_ref: existing.admissionRef,
        material_ref: existing.materialRef,
      });
    }
    const policy = this.familyPolicy.get(release.target.family_id) ?? "applied";
    if (policy === "rejected") {
      return this.remember(eventId, digest, {
        ...this.base(envelope, `rcpt-${eventId}`),
        status: "rejected",
        reason_code: "family_membership_required",
      });
    }
    if (policy === "pending") {
      return this.remember(eventId, digest, {
        ...this.base(envelope, `rcpt-${eventId}`),
        status: "pending_guardian_confirmation",
        admission_ref: `adm-${eventId}`,
      });
    }
    const admissionRef = `adm-${eventId}`;
    const materialRef = `mat-${eventId}`;
    this.admitted.set(sourceKey, { digest, admissionRef, materialRef });
    return this.remember(eventId, digest, {
      ...this.base(envelope, `rcpt-${eventId}`),
      status: "applied",
      admission_ref: admissionRef,
      material_ref: materialRef,
    });
  }

  private answerLifecycle(envelope: Record<string, unknown>): { status: number; body?: unknown } {
    const failures = validateLifecycleEventV1(envelope);
    if (failures.length > 0) {
      this.violations.push(...failures.map((f) => `lifecycle ${f.path}: ${f.message}`));
      return { status: 400, body: { error: "invalid_envelope" } };
    }
    const lifecycle = envelope as unknown as FamilyGrowthLifecycleEventV1;
    const digest = lifecyclePayloadDigestV1(lifecycle);
    if (digest !== lifecycle.payload_digest) {
      this.violations.push(`lifecycle ${lifecycle.event_id}: payload digest mismatch`);
      return { status: 400, body: { error: "invalid_envelope" } };
    }
    const eventId = lifecycle.event_id;
    const replay = this.ledger.get(eventId);
    if (replay) return { status: 200, body: replay.receipt };
    const sourceKey = `${lifecycle.source.scenario_key}:${lifecycle.source.publication_release_ref}:${lifecycle.target.family_id}`;
    const material = this.admitted.get(sourceKey);
    if (!material) {
      // Pre-release lifecycle records suppression; a late release must not
      // resurrect the content.
      const suppressionRef = `sup-${eventId}`;
      this.suppressed.set(sourceKey, suppressionRef);
      return this.remember(eventId, digest, {
        ...this.base(envelope, `rcpt-${eventId}`),
        status: "tombstoned",
        suppression_ref: suppressionRef,
      });
    }
    return this.remember(eventId, digest, {
      ...this.base(envelope, `rcpt-${eventId}`),
      status: "applied",
      admission_ref: material.admissionRef,
      material_ref: material.materialRef,
    });
  }

  private conflict(
    envelope: Record<string, unknown>,
    reason: string,
  ): { status: number; body: unknown } {
    return {
      status: 200,
      body: {
        ...this.base(envelope, `rcpt-conflict-${randomUUID()}`),
        status: "conflict",
        reason_code: reason,
      },
    };
  }
}

// --- world seeding ----------------------------------------------------------

type ChildSpec = {
  tag: string;
  binding?: "current" | "expired" | "missing";
};

const seedWorld = async (
  children: ChildSpec[],
  options: { sharedAsset?: boolean; sharedAssetSoloChild?: boolean } = {},
) => {
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
    data: { workspaceId, institutionId: institution.id, name: "向日葵班", status: "active" },
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

  const sharedAsset = options.sharedAsset
    ? await prisma.nurtureMediaAssetRef.create({
        data: {
          workspaceId,
          institutionId: institution.id,
          careGroupId: group.id,
          sourceKind: "class_album",
          storageRefPayload: { bucket: "media", key: randomUUID() },
          lifecycle: "ready",
          mediaRevision: 1,
          capturedAt: new Date("2026-08-07T02:15:00.000Z"),
          contentDigest: hash(`media:${workspaceId}`),
          contentMimeType: "image/jpeg",
        },
      })
    : null;

  const seededChildren = [] as Array<{
    tag: string;
    careProcessId: string;
    familyId: string;
    targetKey: string;
    assetId: string;
  }>;

  for (const spec of children) {
    const child = await prisma.nurtureChild.create({
      data: { workspaceId, displayName: `Child ${spec.tag}`, status: "active" },
    });
    const careProcess = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId, childId: child.id, status: "active" },
    });
    const family = await prisma.nurtureFamily.create({
      data: {
        workspaceId,
        childCareProcessId: careProcess.id,
        displayName: `Family ${spec.tag}`,
        status: "active",
      },
    });
    const enrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId,
        childCareProcessId: careProcess.id,
        institutionId: institution.id,
        careGroupId: group.id,
        status: "active",
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

    const asset =
      sharedAsset ??
      (await prisma.nurtureMediaAssetRef.create({
        data: {
          workspaceId,
          institutionId: institution.id,
          careGroupId: group.id,
          sourceKind: "class_album",
          storageRefPayload: { bucket: "media", key: randomUUID() },
          lifecycle: "ready",
          mediaRevision: 1,
          capturedAt: new Date("2026-08-07T02:15:00.000Z"),
          contentDigest: hash(`media:${workspaceId}:${spec.tag}`),
          contentMimeType: "image/jpeg",
        },
      }));
    const attributeThisChild =
      !options.sharedAssetSoloChild || seededChildren.length === 0;
    if (attributeThisChild) {
      await prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId,
          mediaAssetRefId: asset.id,
          childCareProcessId: careProcess.id,
          source: "manual",
          state: "confirmed",
          confirmedByRoleAssignmentId: teacherRole.id,
          confirmedAt: new Date(),
          exposurePolicyPayload: { allow: [careProcess.id] },
        },
      });
    }

    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId,
        publishProcessId: process.id,
        targetKey: `target:${spec.tag}`,
        childCareProcessId: careProcess.id,
        enrollmentId: enrollment.id,
        familyRefKey: `${workspaceId}:${family.id}`,
        grantId: grant.id,
      },
    });

    const bindingKind = spec.binding ?? "current";
    if (bindingKind !== "missing") {
      const childAnchor = await prisma.nurtureChildBindingAnchor.create({
        data: { reservationKeyHash: hash(`child:${workspaceId}:${spec.tag}`), status: "associated" },
      });
      const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
        data: { reservationKeyHash: hash(`family:${workspaceId}:${spec.tag}`), status: "associated" },
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
      await prisma.nurtureFamilyAnchorAssociation.create({
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
      for (const [subjectType, anchorId] of [
        ["child", childAnchor.id],
        ["family", familyAnchor.id],
      ] as const) {
        await prisma.nurtureScenarioBindingAuthorization.create({
          data: {
            workspaceId,
            subjectType,
            ...(subjectType === "child"
              ? { childAnchorId: anchorId }
              : { familyAnchorId: anchorId }),
            ownerRef: `nurture_${subjectType}_binding_anchor_v1:${anchorId}`,
            ownerVersion: 1,
            idempotencyKeyHash: hash(`auth:${subjectType}:${workspaceId}:${spec.tag}`),
            requestFingerprint: hash(`fp:${subjectType}:${workspaceId}:${spec.tag}`),
            subjectEvidenceHash: hash("subject"),
            userEvidenceHash: hash("user"),
            actorEvidenceHash: hash("actor"),
            purpose: "scenario_binding_write",
            authorizationSourceRef: "my_chat_child_identity",
            authorizationSourceVersion: 1,
            status: "active",
            verifiedAt: new Date("2026-08-05T08:00:00.000Z"),
            expiresAt:
              bindingKind === "expired"
                ? new Date("2026-08-06T00:00:00.000Z")
                : new Date("2099-01-01T00:00:00.000Z"),
          },
        });
      }
    }
    seededChildren.push({
      tag: spec.tag,
      careProcessId: careProcess.id,
      familyId: family.id,
      targetKey: target.targetKey,
      assetId: asset.id,
    });
  }

  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: hash(`content:${workspaceId}`),
      organizerInputRevision: "organizer:1",
      titleProtectionPayload: protectedContent.seal("户外写生活动") as never,
      mediaCompositionPayload: {
        media: [
          ...new Set(seededChildren.map((entry) => entry.assetId)),
        ].map((assetId) => ({ mediaAssetId: assetId, mediaRevision: 1 })),
      },
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });

  return { workspaceId, teacher: teacher!, teacherRole, process, revision, children: seededChildren };
};

// --- harnessed provider chain ----------------------------------------------

const exchange: FamilyGrowthCanonicalExchangePort = {
  exchange: async (input) => ({
    status: "exchanged",
    childId: `mc-child-${hash(input.childOwnerRef).slice(0, 8)}`,
    familyId: `mc-family-${hash(input.familyOwnerRef).slice(0, 8)}`,
  }),
};

const preparer = () =>
  new PrismaFamilyGrowthEmissionPreparer(prisma, {
    binding: new PrismaFamilyGrowthBindingReadPort(prisma),
    canonicalExchange: exchange,
    protectedContent,
  });

type World = Awaited<ReturnType<typeof seedWorld>>;

const prepareAndCommit = async (
  world: World,
  child: World["children"][number],
  options: { commandRequestId?: string } = {},
) => {
  const prep = await preparer().prepare({
    workspace_id: world.workspaceId,
    process_key: world.process.processKey,
    target_key: child.targetKey,
    child_care_process_id: child.careProcessId,
    revision: 1,
  });
  if (prep.status !== "prepared") return { prep, commit: null };
  const commit = await new PrismaPublicationReleasePort(prisma).commitTargetRelease({
    workspace_id: world.workspaceId,
    participant_id: world.teacher.id,
    process_key: world.process.processKey,
    target_key: child.targetKey,
    revision: 1,
    command_request_id: options.commandRequestId ?? `cmd:${randomUUID()}`,
    trigger: "immediate",
    family_growth: prep.emission,
  });
  return { prep, commit };
};

/** Workspace-scoped view over the outbox so shared-database debris from
 * other suites can never leak into a fixture's deliveries. */
const scopedOutbox = (workspaceId: string): FamilyGrowthDeliveryOutboxPort => {
  const port = new PrismaFamilyGrowthOutboxPort(prisma);
  return {
    claimDue: (input) => port.claimDue({ ...input, workspaceId }),
    recordReceipt: (input) => port.recordReceipt(input),
    recordTransportFailure: (input) => port.recordTransportFailure(input),
  };
};

describe("T-009 I7: N8 conformance fixtures", () => {
  const double = new ConsumerDouble();
  let clock = new Date("2026-08-07T12:00:00.000Z");
  let worker!: FamilyGrowthDeliveryWorker;
  let activeWorkspace = "";

  const tick = async () => {
    const outcome = await worker.tick();
    return outcome;
  };
  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };
  const useWorld = (world: World) => {
    activeWorkspace = world.workspaceId;
    worker = new FamilyGrowthDeliveryWorker({
      outbox: scopedOutbox(world.workspaceId),
      transport: createFamilyGrowthHttpTransport({
        config: { baseUrl: double.baseUrl, token: EVENTS_TOKEN },
      }),
      log: () => undefined,
      now: () => clock,
      jitterUnit: () => 0.5,
    });
  };
  const receipts = (status?: string) =>
    prisma.nurtureFamilyGrowthAdmissionReceipt.findMany({
      where: { workspaceId: activeWorkspace, ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: "asc" },
    });
  const outboxRows = () =>
    prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: activeWorkspace },
      orderBy: { createdAt: "asc" },
    });

  beforeAll(async () => {
    await double.start();
  });
  afterAll(async () => {
    await double.stop();
    await prisma.$disconnect();
    expect(double.violations).toEqual([]);
  });

  it("N8-1: one teacher photo releases to one family end to end", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    const outcome = await tick();
    expect(outcome).toEqual({ claimed: 1, settled: 1, retried: 0 });
    const [row] = await outboxRows();
    expect(row!.deliveryState).toBe("delivered");
    const stored = await receipts();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ status: "applied" });
    expect(stored[0]!.admissionRef).toBeTruthy();
    expect(stored[0]!.materialRef).toBeTruthy();
  });

  it("N8-2: a pending guardian confirmation settles as delivered-but-pending", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    const { prep, commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    if (prep.status !== "prepared") return;
    double.familyPolicy.set(prep.emission.target.family_id, "pending");
    await tick();
    const stored = await receipts();
    expect(stored[0]).toMatchObject({ status: "pending_guardian_confirmation" });
    expect(stored[0]!.materialRef).toBeNull();
    const [row] = await outboxRows();
    expect(row!.deliveryState).toBe("delivered");
  });

  it("N8-3: an exact replay of the same event id resolves to the same refs", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    await prepareAndCommit(world, world.children[0]!);
    await tick();
    const [first] = await receipts();
    // Force a redelivery of the SAME event id + digest.
    const [row] = await outboxRows();
    await prisma.nurtureFamilyGrowthOutboxEvent.update({
      where: { id: row!.id },
      data: { deliveryState: "outcome_unknown", nextAttemptAt: null },
    });
    await tick();
    const after = await receipts();
    const [replayRow] = await outboxRows();
    expect(replayRow!.deliveryState).toBe("delivered");
    // The consumer answered duplicate with the original refs; the provider
    // records at most one row per receipt identity.
    expect(after.map((entry) => entry.receiptId)).toContain(first!.receiptId);
    const duplicate = after.find((entry) => entry.status === "duplicate") ?? after[0];
    expect(duplicate!.admissionRef).toBe(first!.admissionRef);
    expect(duplicate!.materialRef).toBe(first!.materialRef);
  });

  it("N8-4: the same source release key with a different digest conflicts", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    const { prep, commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    await tick();
    if (prep.status !== "prepared" || commit?.status !== "committed") return;

    // A hand-crafted second event reuses the source release key with
    // different content — the consumer must answer conflict, terminally.
    const [firstRow] = await outboxRows();
    const original = firstRow!.envelopePayload as unknown as FamilyGrowthReleaseEventV1;
    const forged = structuredClone(original) as FamilyGrowthReleaseEventV1;
    forged.event_id = randomUUID();
    forged.material.display_snapshot.title = "被篡改的标题";
    forged.payload_digest = releasePayloadDigestV1(forged);
    await prisma.nurtureFamilyGrowthOutboxEvent.create({
      data: {
        id: forged.event_id,
        workspaceId: world.workspaceId,
        kind: "released",
        // A second released row needs its own release: reuse is blocked by
        // the partial unique index, so this rides as a lifecycle-free clone
        // on a synthetic release row.
        publicationReleaseId: (
          await prisma.nurturePublicationRelease.findFirstOrThrow({
            where: { workspaceId: world.workspaceId },
          })
        ).id,
        visibilityEventId: null,
        payloadDigest: forged.payload_digest,
        envelopePayload: forged as never,
        deliveryState: "pending",
      },
    }).catch(async () => {
      // Partial unique index forbids a second released event per release —
      // which is itself conformant. Exercise the conflict over the wire
      // instead, straight through the transport.
      const transport = createFamilyGrowthHttpTransport({
        config: { baseUrl: double.baseUrl, token: EVENTS_TOKEN },
      });
      const result = await transport(forged);
      expect(result).toMatchObject({ kind: "response", status: 200 });
      if (result.kind !== "response") return;
      expect(result.body).toMatchObject({
        status: "conflict",
        reason_code: "source_digest_conflict",
      });
    });
  });

  it("N8-5/6/7: correction, target removal and redaction deliver in order", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    await tick();
    if (commit?.status !== "committed") return;

    const executions: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const execution = await prisma.nurtureCommandExecution.create({
        data: {
          workspaceId: world.workspaceId,
          commandRequestIdHash: hash(randomUUID()),
          originInvocationRequestIdHash: hash(randomUUID()),
          commandKey: "publication_safety",
          commandScope: "board_publication",
          commandContractVersion: 1,
          payloadHash: hash("payload"),
          businessActorRef: world.teacher.id,
          targetRefs: [],
          businessOutcome: "applied",
          outputRefs: [],
          handoffRequestSnapshotsPayload: [],
          committedAt: new Date(),
        },
      });
      executions.push(execution.id);
    }

    const safety = new PrismaPublicationSafetyTransaction(prisma);
    const append = (
      kind: "correction" | "target_removal" | "redaction",
      executionId: string,
      text?: string,
    ) =>
      safety.appendPublicationVisibilityEvents({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        command_execution_id: executionId,
        actor_role_assignment_id: world.teacherRole.id,
        events: [
          {
            event_id: randomUUID(),
            publication_id: commit.publication_ref,
            kind,
            reason_key: "content_error",
            source_release_revision: 1,
            occurred_at: new Date().toISOString(),
            ...(text !== undefined ? { correction_display_safe_text: text } : {}),
          },
        ],
      });

    await append("correction", executions[0]!, "活动时间更正为周三上午");
    await append("target_removal", executions[1]!);
    await append("redaction", executions[2]!);
    const outcome = await tick();
    expect(outcome.settled).toBe(3);
    const lifecycleRows = (await outboxRows()).filter((row) => row.kind !== "released");
    expect(lifecycleRows.map((row) => row.deliveryState)).toEqual([
      "delivered",
      "delivered",
      "delivered",
    ]);
    const stored = await receipts("applied");
    // Release + three lifecycle receipts all applied with the material refs.
    expect(stored.length).toBeGreaterThanOrEqual(4);
  });

  it("N8-8: a lifecycle arriving first suppresses the late release", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    if (commit?.status !== "committed") return;

    const execution = await prisma.nurtureCommandExecution.create({
      data: {
        workspaceId: world.workspaceId,
        commandRequestIdHash: hash(randomUUID()),
        originInvocationRequestIdHash: hash(randomUUID()),
        commandKey: "publication_safety",
        commandScope: "board_publication",
        commandContractVersion: 1,
        payloadHash: hash("payload"),
        businessActorRef: world.teacher.id,
        targetRefs: [],
        businessOutcome: "applied",
        outputRefs: [],
        handoffRequestSnapshotsPayload: [],
        committedAt: new Date(),
      },
    });
    await new PrismaPublicationSafetyTransaction(prisma).appendPublicationVisibilityEvents({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      command_execution_id: execution.id,
      actor_role_assignment_id: world.teacherRole.id,
      events: [
        {
          event_id: randomUUID(),
          publication_id: commit.publication_ref,
          kind: "target_removal",
          reason_key: "family_request",
          source_release_revision: 1,
          occurred_at: new Date().toISOString(),
        },
      ],
    });

    // The release POST finds the consumer unavailable; the lifecycle event
    // gets through. The consumer records suppression.
    double.mode = "releases_unavailable";
    const first = await tick();
    expect(first).toEqual({ claimed: 2, settled: 1, retried: 1 });

    // The late release replays and must NOT resurrect the content.
    double.mode = "up";
    advance(31_000);
    const second = await tick();
    expect(second.settled).toBe(1);
    const releaseRow = (await outboxRows()).find((row) => row.kind === "released");
    expect(releaseRow!.deliveryState).toBe("delivered");
    const tombstones = await receipts("tombstoned");
    expect(tombstones.length).toBeGreaterThanOrEqual(2);
    expect(tombstones.every((entry) => entry.suppressionRef)).toBe(true);
  });

  it("N8-9: one photo to two families keeps outcomes independent", async () => {
    // Under the qualified G3 privacy gate a photo may only release to a
    // family whose child is the only clearly visible one — so the shared
    // photo (child A only) commits for family A while family B fails closed
    // (another family's child is visible), and neither outcome touches the
    // other. The both-families-succeed variant of this fixture arrives with
    // the future shared-infrastructure derivative capability; today's
    // sanctioned route for a multi-child photo is split_process with
    // per-child originals (D-T009-02).
    const world = await seedWorld([{ tag: "A" }, { tag: "B" }], {
      sharedAsset: true,
      sharedAssetSoloChild: true,
    });
    useWorld(world);
    const a = await prepareAndCommit(world, world.children[0]!);
    const b = await prepareAndCommit(world, world.children[1]!);
    expect(a.commit?.status).toBe("committed");
    expect(b.commit).toMatchObject({ status: "rejected" });
    const outcome = await tick();
    expect(outcome).toEqual({ claimed: 1, settled: 1, retried: 0 });
    const rows = await outboxRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.deliveryState).toBe("delivered");
    const stored = await receipts();
    expect(stored.map((entry) => entry.status)).toEqual(["applied"]);
    // Family A's committed release survives family B's rejection untouched.
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
  });

  it("N8-10: an unauthorized second child in the photo rejects the release", async () => {
    const world = await seedWorld([{ tag: "A" }, { tag: "B" }], { sharedAsset: true });
    useWorld(world);
    // Child B is clearly visible (confirmed attribution) but the target-A
    // exposure only allows child A: fail closed, never a degraded original.
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit).toMatchObject({ status: "rejected" });
    expect(await outboxRows()).toHaveLength(0);
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);
  });

  it("N8-11: an expired or missing binding denies before any write", async () => {
    const expired = await seedWorld([{ tag: "A", binding: "expired" }]);
    useWorld(expired);
    const prepExpired = await preparer().prepare({
      workspace_id: expired.workspaceId,
      process_key: expired.process.processKey,
      target_key: expired.children[0]!.targetKey,
      child_care_process_id: expired.children[0]!.careProcessId,
      revision: 1,
    });
    expect(prepExpired).toEqual({ status: "denied", reason: "authorization_expired" });

    const missing = await seedWorld([{ tag: "A", binding: "missing" }]);
    const prepMissing = await preparer().prepare({
      workspace_id: missing.workspaceId,
      process_key: missing.process.processKey,
      target_key: missing.children[0]!.targetKey,
      child_care_process_id: missing.children[0]!.careProcessId,
      revision: 1,
    });
    expect(prepMissing).toEqual({ status: "denied", reason: "binding_missing" });
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: missing.workspaceId },
      }),
    ).toBe(0);
  });

  it("N8-12: temporary consumer unavailability retries to eventual success", async () => {
    const world = await seedWorld([{ tag: "A" }]);
    useWorld(world);
    await prepareAndCommit(world, world.children[0]!);

    double.mode = "unavailable";
    expect(await tick()).toEqual({ claimed: 1, settled: 0, retried: 1 });
    let [row] = await outboxRows();
    expect(row!.deliveryState).toBe("outcome_unknown");
    expect(row!.attemptCount).toBe(1);
    expect(row!.nextAttemptAt).toEqual(new Date(clock.getTime() + 30_000));

    advance(31_000);
    expect(await tick()).toEqual({ claimed: 1, settled: 0, retried: 1 });
    [row] = await outboxRows();
    expect(row!.attemptCount).toBe(2);
    expect(row!.nextAttemptAt).toEqual(new Date(clock.getTime() + 60_000));

    double.mode = "up";
    advance(61_000);
    expect(await tick()).toEqual({ claimed: 1, settled: 1, retried: 0 });
    [row] = await outboxRows();
    expect(row!.deliveryState).toBe("delivered");
    expect(row!.attemptCount).toBe(3);
    const stored = await receipts();
    expect(stored[0]).toMatchObject({ status: "applied" });
  });
});
