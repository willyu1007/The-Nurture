import { createHash, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaFamilyGrowthIntakeRepository,
  PrismaFamilyGrowthLifecycleRepository,
} from "@my-chat/db";
import {
  buildFamilyGrowthWireReceipt,
  FamilyGrowthIntakeService,
  tryReadFamilyGrowthLifecycleRoute,
  tryReadFamilyGrowthReleaseReceiptRoute,
  type FamilyGrowthMediaImporter,
  type PreparedFamilyGrowthMedia,
} from "@my-chat/domain/family-growth";
import {
  createPrismaClient as createNurturePrismaClient,
  PrismaFamilyGrowthBindingReadPort,
  PrismaFamilyGrowthRenditionReadPort,
  PrismaFamilyGrowthEmissionPreparer,
  PrismaFamilyGrowthOutboxPort,
  PrismaPublicationReleasePort,
  PrismaPublicationSafetyTransaction,
  createAesGcmProtectedContentPort,
} from "@the-nurture/db";
import {
  decideFamilyGrowthDelivery,
  FAMILY_GROWTH_DELIVERING_LEASE_MS,
  releasePayloadDigestV1,
  type FamilyGrowthCanonicalExchangePort,
  type FamilyGrowthReleaseEventV1,
} from "@the-nurture/scenario/family-growth";

// T-009 I7b: the N8 fixtures with REAL code on both ends of the frozen wire.
// Provider: the real Nurture chain (fact preparer, release/lifecycle
// transactions, outbox, delivery worker, real HTTP transport) against the
// pinned live checkouts. Consumer: My-Chat's real events controller, intake
// service, intake/lifecycle repositories and the real My-Chat database (the
// same linked sources the x5 joint lane pins). The HTTP shims around the
// consumer (controller plumbing) and the media importer are thin test-local
// re-implementations of the apps/api layers — those layers are not linked
// packages — while every semantic piece (envelope validation, intake
// service, both repositories, receipt builder, the real My-Chat database,
// and Nurture's real rendition resolution with per-download
// re-authorization) is the real code.
// Fixtures 10 and 11 are provider-local (no consumer involvement) and stay
// proven by the I7a conformance suite; fixture 2's pending path awaits the
// consumer's guardian-confirmation implementation and is asserted here as
// the fail-closed rejected receipt the current consumer answers.
const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error(
    "X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the joint family-growth suite.",
  );
}

const prisma = createNurturePrismaClient(NURTURE_DATABASE_URL);
// My-Chat's client factory reads DATABASE_URL from the environment (its
// Prisma 7 adapter has no per-call URL override), so the x5 lane's swap
// pattern applies: point the env at My-Chat for construction, then restore.
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
const myChat = createMyChatPrismaClient();
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;

const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
const EVENTS_TOKEN = "joint-events-service-token-32ch!";
const RENDITION_TOKEN = "joint-rendition-service-token-32";
const MEDIA_BYTES = Buffer.from("joint-family-growth-jpeg-bytes", "utf8");
const MEDIA_DIGEST = createHash("sha256").update(MEDIA_BYTES).digest("hex");

const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "joint-key",
  keyMaterial: "joint-protected-content-key-mate",
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

// --- Nurture rendition endpoints (real resolution logic over real HTTP) ----

class NurtureRenditionServer {
  server: Server | null = null;
  baseUrl = "";
  private readonly reads = new PrismaFamilyGrowthRenditionReadPort(prisma);

  async start(): Promise<void> {
    this.server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        void this.answer(request.url ?? "", request.headers.authorization, Buffer.concat(chunks))
          .then(({ status, body, contentType }) => {
            response.statusCode = status;
            response.setHeader("content-type", contentType ?? "application/json");
            response.end(body);
          });
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
    this.baseUrl = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }

  private async answer(
    url: string,
    authorization: string | undefined,
    body: Buffer,
  ): Promise<{ status: number; body: Buffer | string; contentType?: string }> {
    if (authorization !== `Bearer ${RENDITION_TOKEN}`) {
      return { status: 401, body: JSON.stringify({ error: "service_unauthorized" }) };
    }
    if (url === "/internal/family-growth/renditions/resolve") {
      const ref = (JSON.parse(body.toString("utf8")) as { rendition_ref?: string }).rendition_ref;
      const resolved = ref ? await this.reads.resolveRendition(ref) : null;
      if (!resolved) {
        return { status: 404, body: JSON.stringify({ error: "rendition_unavailable" }) };
      }
      return {
        status: 200,
        body: JSON.stringify({
          url: `/internal/family-growth/renditions/bytes/${encodeURIComponent(ref!)}`,
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          content_digest: resolved.contentDigest,
          mime_type: resolved.contentMimeType,
        }),
      };
    }
    if (url.startsWith("/internal/family-growth/renditions/bytes/")) {
      const ref = decodeURIComponent(url.slice("/internal/family-growth/renditions/bytes/".length));
      // Per-download re-authorization, exactly like the production endpoint.
      const resolved = await this.reads.resolveRendition(ref);
      if (!resolved) {
        return { status: 404, body: JSON.stringify({ error: "rendition_unavailable" }) };
      }
      return { status: 200, body: MEDIA_BYTES, contentType: resolved.contentMimeType };
    }
    return { status: 404, body: JSON.stringify({ error: "rendition_unavailable" }) };
  }
}

// --- My-Chat consumer (real controller/service/repositories over HTTP) ----

class MyChatConsumerServer {
  server: Server | null = null;
  baseUrl = "";
  available = true;

  async start(nurtureBaseUrl: string): Promise<void> {
    // Thin importer shim per addendum §4 over Nurture's REAL rendition
    // endpoints: resolve, download within the lease, report the ACTUAL
    // digest of the bytes and stage under a private lease. The intake
    // validation owns every comparison.
    const importer: FamilyGrowthMediaImporter = {
      importReleasedMedia: async (input) => {
        const cleanupRef = `joint-staging:${randomUUID()}`;
        const items: PreparedFamilyGrowthMedia[] = [];
        for (const item of input.items) {
          const resolveResponse = await fetch(
            `${nurtureBaseUrl}/internal/family-growth/renditions/resolve`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${RENDITION_TOKEN}`,
              },
              body: JSON.stringify({ rendition_ref: item.family_rendition_ref }),
            },
          );
          if (!resolveResponse.ok) {
            throw new Error(`joint rendition resolve failed (${resolveResponse.status})`);
          }
          const resolved = (await resolveResponse.json()) as {
            url: string;
            mime_type: string;
          };
          const download = await fetch(`${nurtureBaseUrl}${resolved.url}`, {
            headers: { authorization: `Bearer ${RENDITION_TOKEN}` },
          });
          if (!download.ok) {
            throw new Error(`joint rendition download failed (${download.status})`);
          }
          const bytes = new Uint8Array(await download.arrayBuffer());
          items.push({
            familyRenditionRef: item.family_rendition_ref,
            storageProvider: "joint-staging",
            storageKey: `${cleanupRef}/${items.length}`,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            mimeType: resolved.mime_type,
            byteSize: BigInt(bytes.byteLength),
            importedAt: new Date(),
          });
        }
        return { cleanupRef, items };
      },
      discardReleasedMedia: async () => ({ status: "discarded" as const }),
    };
    const service = new FamilyGrowthIntakeService(
      new PrismaFamilyGrowthIntakeRepository(myChat),
      importer,
      new PrismaFamilyGrowthLifecycleRepository(myChat),
    );

    this.server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        void (async () => {
          if (!this.available) {
            response.statusCode = 503;
            response.end("{}");
            return;
          }
          if (request.headers.authorization !== `Bearer ${EVENTS_TOKEN}`) {
            response.statusCode = 401;
            response.end(JSON.stringify({ error: "service_unauthorized" }));
            return;
          }
          try {
            const envelope = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
            // The controller's routing rule, verbatim: no route, no receipt.
            const route =
              tryReadFamilyGrowthReleaseReceiptRoute(envelope) ??
              tryReadFamilyGrowthLifecycleRoute(envelope);
            if (!route) {
              response.statusCode = 400;
              response.end(JSON.stringify({ error: "envelope_unroutable" }));
              return;
            }
            const consumed = await service.consume(envelope, {
              correlationId: route.eventId,
            });
            response.statusCode = 200;
            response.setHeader("content-type", "application/json");
            response.end(
              JSON.stringify(buildFamilyGrowthWireReceipt(route, consumed, new Date())),
            );
          } catch {
            response.statusCode = 500;
            response.end(JSON.stringify({ error: "consumer_error" }));
          }
        })();
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(0, "127.0.0.1", resolve));
    this.baseUrl = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}

// --- seeding ---------------------------------------------------------------

const seedMyChatAnchors = async (options: { membership?: boolean } = {}) => {
  // Intake requires the source scenario registered as pilot/active in My-Chat.
  await myChat.scenario.upsert({
    where: { scenarioKey: "nurture" },
    update: { status: "pilot" },
    create: { scenarioKey: "nurture", displayName: "Nurture", status: "pilot" },
  });
  const actor = await myChat.actor.create({
    data: { actorType: "system_agent", displayName: "Joint Fixture Actor" },
  });
  const family = await myChat.family.create({
    data: { displayName: "Joint Family", createdByActorId: actor.id },
  });
  const child = await myChat.child.create({
    data: { displayName: "Joint Child", createdByActorId: actor.id },
  });
  if (options.membership !== false) {
    await myChat.familyChildMembership.create({
      data: { familyId: family.id, childId: child.id, createdByActorId: actor.id },
    });
  }
  return { family, child };
};

type ChildSpec = { tag: string; myChat: { familyId: string; childId: string } };

const seedNurtureWorld = async (children: ChildSpec[]) => {
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

  const seeded = [] as Array<{
    tag: string;
    careProcessId: string;
    familyId: string;
    targetKey: string;
    assetId: string;
    canonical: { familyId: string; childId: string };
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
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId,
        institutionId: institution.id,
        careGroupId: group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
        mediaRevision: 1,
        capturedAt: new Date("2026-08-07T02:15:00.000Z"),
        contentDigest: MEDIA_DIGEST,
        contentMimeType: "image/jpeg",
      },
    });
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
          ...(subjectType === "child" ? { childAnchorId: anchorId } : { familyAnchorId: anchorId }),
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
          expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        },
      });
    }
    seeded.push({
      tag: spec.tag,
      careProcessId: careProcess.id,
      familyId: family.id,
      targetKey: target.targetKey,
      assetId: asset.id,
      canonical: spec.myChat,
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
        media: seeded.map((entry) => ({ mediaAssetId: entry.assetId, mediaRevision: 1 })),
      },
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });
  return { workspaceId, teacher: teacher!, teacherRole, process, revision, children: seeded };
};

// --- provider chain --------------------------------------------------------

type World = Awaited<ReturnType<typeof seedNurtureWorld>>;

const exchangeFor = (world: World): FamilyGrowthCanonicalExchangePort => ({
  exchange: async (input) => {
    // Resolve which seeded child these anchor refs belong to, then answer
    // with that child's canonical My-Chat pair.
    const anchorId = input.childOwnerRef.split(":")[1] ?? "";
    const association = await prisma.nurtureChildAnchorAssociation.findFirst({
      where: { workspaceId: world.workspaceId, childAnchorId: anchorId },
      select: { childId: true },
    });
    if (!association) return { status: "unavailable" };
    for (const child of world.children) {
      const careProcess = await prisma.nurtureChildCareProcess.findFirst({
        where: { workspaceId: world.workspaceId, id: child.careProcessId },
        select: { childId: true },
      });
      if (careProcess?.childId === association.childId) {
        return {
          status: "exchanged",
          childId: child.canonical.childId,
          familyId: child.canonical.familyId,
        };
      }
    }
    return { status: "unavailable" };
  },
});

const prepareAndCommit = async (
  world: World,
  child: World["children"][number],
  options: { commandRequestId?: string } = {},
) => {
  const preparer = new PrismaFamilyGrowthEmissionPreparer(prisma, {
    binding: new PrismaFamilyGrowthBindingReadPort(prisma),
    canonicalExchange: exchangeFor(world),
    protectedContent,
  });
  const prep = await preparer.prepare({
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

describe("T-009 I7b: joint N8 against the real My-Chat consumer", () => {
  const rendition = new NurtureRenditionServer();
  const consumer = new MyChatConsumerServer();
  let clock = new Date("2026-08-08T09:00:00.000Z");
  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  // Inline delivery loop: the same claim → real-HTTP POST → decide → record
  // sequence the production worker runs (the worker itself is proven by the
  // I7a suite); the frozen settlement engine is the real one.
  const tick = async (world: World) => {
    const port = new PrismaFamilyGrowthOutboxPort(prisma);
    const rows = await port.claimDue({
      now: clock,
      limit: 20,
      workspaceId: world.workspaceId,
      staleClaimBefore: new Date(clock.getTime() - FAMILY_GROWTH_DELIVERING_LEASE_MS),
    });
    let settled = 0;
    let retried = 0;
    for (const row of rows) {
      let result: Parameters<typeof decideFamilyGrowthDelivery>[0]["result"];
      try {
        const response = await fetch(`${consumer.baseUrl}/`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${EVENTS_TOKEN}`,
          },
          body: JSON.stringify(row.envelope),
        });
        result = { kind: "response", status: response.status, body: await response.json() };
      } catch {
        result = { kind: "transport_error" };
      }
      const decision = decideFamilyGrowthDelivery({
        eventId: row.eventId,
        attemptCount: row.attemptCount,
        now: clock,
        jitterUnit: 0.5,
        result,
      });
      if (decision.kind === "settle") {
        settled += 1;
        await port.recordReceipt({
          workspaceId: row.workspaceId,
          outboxEventId: row.eventId,
          receiptId: decision.receipt.receipt_id,
          status: decision.receipt.status,
          ...(decision.consequence.refs.admissionRef !== undefined
            ? { admissionRef: decision.consequence.refs.admissionRef }
            : {}),
          ...(decision.consequence.refs.materialRef !== undefined
            ? { materialRef: decision.consequence.refs.materialRef }
            : {}),
          ...(decision.consequence.refs.suppressionRef !== undefined
            ? { suppressionRef: decision.consequence.refs.suppressionRef }
            : {}),
          ...(decision.consequence.refs.reasonCode !== undefined
            ? { reasonCode: decision.consequence.refs.reasonCode }
            : {}),
          processedAt: new Date(decision.receipt.processed_at),
          receiptPayload: decision.receipt,
        });
      } else {
        retried += 1;
        await port.recordTransportFailure({
          outboxEventId: row.eventId,
          nextAttemptAt: decision.nextAttemptAt,
        });
      }
    }
    return { claimed: rows.length, settled, retried };
  };
  const receipts = (workspaceId: string) =>
    prisma.nurtureFamilyGrowthAdmissionReceipt.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

  beforeAll(async () => {
    await rendition.start();
    await consumer.start(rendition.baseUrl);
  });
  afterAll(async () => {
    await consumer.stop();
    await rendition.stop();
    await prisma.$disconnect();
    await myChat.$disconnect();
  });

  it("J1+J3: a real release admits with imported media, and a replay answers duplicate", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");

    expect(await tick(world)).toEqual({ claimed: 1, settled: 1, retried: 0 });
    const [receipt] = await receipts(world.workspaceId);
    expect(receipt).toMatchObject({ status: "applied" });
    expect(receipt!.admissionRef).toBeTruthy();
    expect(receipt!.materialRef).toBeTruthy();

    // The canonical material exists in My-Chat with the verified blob.
    const material = await myChat.growthMaterial.findUniqueOrThrow({
      where: { id: receipt!.materialRef! },
      include: { media: { include: { familyMediaAsset: { include: { blob: true } } } } },
    });
    expect(material.familyId).toBe(anchors.family.id);
    expect(material.childId).toBe(anchors.child.id);
    expect(material.media[0]?.familyMediaAsset.blob.sha256).toBe(MEDIA_DIGEST);

    // J3: exact replay of the same event id + digest answers duplicate with
    // the original refs. On the wire the duplicate receipt reuses the
    // original receipt identity (consumer receipts are deterministic per
    // ingress event), so the provider's append-only store keeps exactly the
    // original applied row — replay is a store no-op that still settles.
    const wireReplay = await fetch(`${consumer.baseUrl}/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${EVENTS_TOKEN}`,
      },
      body: JSON.stringify(
        (await prisma.nurtureFamilyGrowthOutboxEvent.findFirstOrThrow({
          where: { workspaceId: world.workspaceId },
        })).envelopePayload,
      ),
    });
    expect(wireReplay.status).toBe(200);
    expect(await wireReplay.json()).toMatchObject({
      status: "duplicate",
      receipt_id: receipt!.receiptId,
      admission_ref: receipt!.admissionRef,
      material_ref: receipt!.materialRef,
    });

    // The worker path settles an outcome_unknown row via the same duplicate
    // receipt (replay-only resolution per the transport freeze).
    const [row] = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId },
    });
    await prisma.nurtureFamilyGrowthOutboxEvent.update({
      where: { id: row!.id },
      data: { deliveryState: "outcome_unknown", nextAttemptAt: null },
    });
    expect(await tick(world)).toEqual({ claimed: 1, settled: 1, retried: 0 });
    const after = await receipts(world.workspaceId);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ status: "applied" });
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.findFirstOrThrow({
        where: { id: row!.id },
        select: { deliveryState: true },
      }),
    ).toMatchObject({ deliveryState: "delivered" });
    // And My-Chat wrote nothing new for the replay.
    expect(
      await myChat.growthMaterial.count({ where: { familyId: anchors.family.id } }),
    ).toBe(1);
  });

  it("J2: a guardian-confirmation envelope fails closed until the consumer implements it", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    const [row] = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId },
    });
    const envelope = structuredClone(row!.envelopePayload) as FamilyGrowthReleaseEventV1;
    envelope.event_id = randomUUID();
    envelope.admission = { ...envelope.admission, mode: "guardian_confirmation" };
    envelope.payload_digest = releasePayloadDigestV1(envelope);
    const response = await fetch(`${consumer.baseUrl}/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${EVENTS_TOKEN}`,
      },
      body: JSON.stringify(envelope),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "rejected",
      reason_code: "contract_invalid",
    });
  });

  it("J4: the same source release key with different content conflicts", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    await tick(world);

    const [row] = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId },
    });
    const forged = structuredClone(row!.envelopePayload) as FamilyGrowthReleaseEventV1;
    forged.event_id = randomUUID();
    forged.material.display_snapshot.title = "被篡改的标题";
    forged.payload_digest = releasePayloadDigestV1(forged);
    const response = await fetch(`${consumer.baseUrl}/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${EVENTS_TOKEN}`,
      },
      body: JSON.stringify(forged),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "conflict" });
  });

  it("J5/6/7: correction, removal and redaction apply against the admitted material", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
    const { commit } = await prepareAndCommit(world, world.children[0]!);
    expect(commit?.status).toBe("committed");
    if (commit?.status !== "committed") return;
    await tick(world);

    const safety = new PrismaPublicationSafetyTransaction(prisma);
    for (const [kind, text] of [
      ["correction", "活动时间更正为周三上午"],
      ["target_removal", undefined],
      ["redaction", undefined],
    ] as const) {
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
      await safety.appendPublicationVisibilityEvents({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        command_execution_id: execution.id,
        actor_role_assignment_id: world.teacherRole.id,
        events: [
          {
            event_id: randomUUID(),
            publication_id: commit.publication_ref,
            kind,
            reason_key: kind === "target_removal" ? "family_request" : "content_error",
            source_release_revision: 1,
            occurred_at: new Date().toISOString(),
            ...(text !== undefined ? { correction_display_safe_text: text } : {}),
          },
        ],
      });
    }
    const outcome = await tick(world);
    expect(outcome.settled).toBe(3);
    const stored = await receipts(world.workspaceId);
    // Release applied + three lifecycle receipts, all delivered.
    expect(stored.filter((entry) => entry.status === "applied")).toHaveLength(4);
    const material = await myChat.growthMaterial.findFirst({
      where: { familyId: anchors.family.id },
    });
    expect(material?.lifecycleStatus).toBe("redacted");
  });

  it("J8: a lifecycle arriving first suppresses the late release in the real ledger", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
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

    // Deliver the LIFECYCLE first by hand over the real wire, then let the
    // worker deliver the release: the real ledger's suppression must answer
    // tombstoned and never resurrect the content.
    const rows = await prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: { workspaceId: world.workspaceId },
      orderBy: { createdAt: "asc" },
    });
    const lifecycleRow = rows.find((row) => row.kind === "target_removal");
    const lifecycleResponse = await fetch(`${consumer.baseUrl}/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${EVENTS_TOKEN}`,
      },
      body: JSON.stringify(lifecycleRow!.envelopePayload),
    });
    expect(lifecycleResponse.status).toBe(200);
    expect(await lifecycleResponse.json()).toMatchObject({ status: "tombstoned" });

    const outcome = await tick(world);
    expect(outcome.claimed).toBe(2);
    const stored = await receipts(world.workspaceId);
    const releaseReceipt = stored.find(
      (entry) => entry.outboxEventId === rows.find((row) => row.kind === "released")!.id,
    );
    expect(releaseReceipt).toMatchObject({ status: "tombstoned" });
    expect(releaseReceipt!.suppressionRef).toBeTruthy();
    expect(
      await myChat.growthMaterial.count({ where: { familyId: anchors.family.id } }),
    ).toBe(0);
  });

  it("J9: two families stay independent — no membership means rejected, the other applies", async () => {
    const anchorsA = await seedMyChatAnchors();
    const anchorsB = await seedMyChatAnchors({ membership: false });
    // One process per family (the sanctioned split_process route under the
    // privacy gate): each release commits independently, and the consumer
    // decides each family on its own facts — A has a current membership and
    // applies; B has none and rejects. Neither outcome touches the other.
    const worldA = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchorsA.family.id, childId: anchorsA.child.id } },
    ]);
    const worldB = await seedNurtureWorld([
      { tag: "B", myChat: { familyId: anchorsB.family.id, childId: anchorsB.child.id } },
    ]);
    const a = await prepareAndCommit(worldA, worldA.children[0]!);
    const b = await prepareAndCommit(worldB, worldB.children[0]!);
    expect(a.commit?.status).toBe("committed");
    expect(b.commit?.status).toBe("committed");
    expect((await tick(worldA)).settled).toBe(1);
    expect((await tick(worldB)).settled).toBe(1);
    expect((await receipts(worldA.workspaceId))[0]).toMatchObject({ status: "applied" });
    expect((await receipts(worldB.workspaceId))[0]).toMatchObject({
      status: "rejected",
      reasonCode: "family_membership_required",
    });
  });

  it("J12: consumer downtime keeps the event retriable until it succeeds", async () => {
    const anchors = await seedMyChatAnchors();
    const world = await seedNurtureWorld([
      { tag: "A", myChat: { familyId: anchors.family.id, childId: anchors.child.id } },
    ]);
    await prepareAndCommit(world, world.children[0]!);

    consumer.available = false;
    expect(await tick(world)).toEqual({ claimed: 1, settled: 0, retried: 1 });
    advance(31_000);
    expect(await tick(world)).toEqual({ claimed: 1, settled: 0, retried: 1 });

    consumer.available = true;
    advance(61_000);
    expect(await tick(world)).toEqual({ claimed: 1, settled: 1, retried: 0 });
    expect((await receipts(world.workspaceId))[0]).toMatchObject({ status: "applied" });
  });
});
