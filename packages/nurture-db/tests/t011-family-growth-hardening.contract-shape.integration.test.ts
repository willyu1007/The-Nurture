import { describe, expect, it } from "vitest";
import { assembleReleaseEventV1 } from "@the-nurture/scenario/family-growth";
import type { NurturePrismaClient } from "../src/client.js";
import { PrismaFamilyGrowthBindingReadPort } from "../src/repositories/family-growth-binding.read.js";
import {
  familyGrowthPreparedBindingHeadsAreCurrent,
  familyGrowthPreparedHeadsMatchReleaseTarget,
} from "../src/repositories/publication-release.transaction.js";
import {
  PrismaFamilyGrowthOutboxPort,
  type FamilyGrowthReceiptRecordInputV1,
} from "../src/repositories/family-growth-outbox.transaction.js";

// This suite intentionally proves mocked repository/ORM contract shape only.
// Real PostgreSQL locking and rollback coverage is deferred to the T-011 N3
// disposable-target qualification run; no real-database claim is made here.

type ReceiptRow = Readonly<{
  workspaceId: string;
  outboxEventId: string;
  receiptId: string;
  status: string;
  admissionRef: string | null;
  materialRef: string | null;
  suppressionRef: string | null;
  reasonCode: string | null;
  processedAt: Date;
  receiptPayload: Readonly<Record<string, unknown>>;
}>;

type OutboxState = {
  id: string;
  workspaceId: string;
  kind: "released";
  payloadDigest: string;
  envelopePayload: Readonly<Record<string, unknown>>;
  deliveryState: string;
  attemptCount: number;
  deliveredAt: Date | null;
  nextAttemptAt: Date | null;
};

const releaseEnvelope = () =>
  assembleReleaseEventV1({
    eventId: "evt-1",
    occurredAt: "2026-08-13T01:59:00.000Z",
    source: {
      publication_release_ref: "release-1",
      publish_process_ref: "process-1",
      publish_revision_ref: "revision-1",
      publish_revision: 1,
      content_digest: "a".repeat(64),
      receipt_ref: "source-receipt-1",
      source_target_ref: "target-1",
      committed_at: "2026-08-13T01:58:00.000Z",
    },
    target: { child_id: "child-1", family_id: "family-1" },
    admission: { mode: "direct_family_release", policy_ref: "policy-1", policy_version: 1 },
    material: {
      occurredAt: "2026-08-13T01:00:00.000Z",
      displaySnapshot: { title: "Growth", source_label: "Class A" },
      attribution: {
        source_contributor_ref: "contributor-1",
        source_organization_ref: "organization-1",
        contributed_at: "2026-08-13T01:00:00.000Z",
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
  });

const receiptInput = (
  overrides: Partial<FamilyGrowthReceiptRecordInputV1> = {},
): FamilyGrowthReceiptRecordInputV1 => {
  const base = {
    workspaceId: "ws-1",
    outboxEventId: "evt-1",
    attemptCount: 1,
    releaseEventId: "evt-1",
    sourceScenarioKey: "nurture",
    sourceReleaseRef: "release-1",
    familyId: "family-1",
    receiptId: "receipt-1",
    status: "applied" as const,
    admissionRef: "admission-1",
    materialRef: "material-1",
    processedAt: new Date("2026-08-13T02:00:00.000Z"),
  };
  const merged = { ...base, ...overrides };
  return {
    ...merged,
    receiptPayload: overrides.receiptPayload ?? {
      contract_key: "family_growth_material_admission_receipt",
      contract_version: "1.0.0",
      receipt_id: merged.receiptId,
      release_event_id: merged.releaseEventId,
      source_scenario_key: merged.sourceScenarioKey,
      source_release_ref: merged.sourceReleaseRef,
      family_id: merged.familyId,
      status: merged.status,
      processed_at: merged.processedAt.toISOString(),
      consumer_contract_version: "1.0.0",
      ...(merged.admissionRef ? { admission_ref: merged.admissionRef } : {}),
      ...(merged.materialRef ? { material_ref: merged.materialRef } : {}),
      ...(merged.suppressionRef ? { suppression_ref: merged.suppressionRef } : {}),
      ...(merged.reasonCode ? { reason_code: merged.reasonCode } : {}),
    },
  };
};

const storedReceipt = (input: FamilyGrowthReceiptRecordInputV1): ReceiptRow => ({
  workspaceId: input.workspaceId,
  outboxEventId: input.outboxEventId,
  receiptId: input.receiptId,
  status: input.status,
  admissionRef: input.admissionRef ?? null,
  materialRef: input.materialRef ?? null,
  suppressionRef: input.suppressionRef ?? null,
  reasonCode: input.reasonCode ?? null,
  processedAt: input.processedAt,
  receiptPayload: input.receiptPayload as Readonly<Record<string, unknown>>,
});

const outboxHarness = (input?: {
  attemptCount?: number;
  deliveryState?: string;
  receipts?: ReceiptRow[];
  hideFirstReceiptRead?: boolean;
}) => {
  const envelope = releaseEnvelope();
  let outbox: OutboxState = {
    id: envelope.event_id,
    workspaceId: "ws-1",
    kind: "released",
    payloadDigest: envelope.payload_digest,
    envelopePayload: envelope,
    deliveryState: input?.deliveryState ?? "delivering",
    attemptCount: input?.attemptCount ?? 1,
    deliveredAt: null,
    nextAttemptAt: null,
  };
  let receipts = [...(input?.receipts ?? [])];
  let receiptReads = 0;
  const settlementWhere: Array<Readonly<Record<string, unknown>>> = [];

  const receiptFor = (where: Readonly<Record<string, unknown>>): ReceiptRow | null => {
    receiptReads += 1;
    if (input?.hideFirstReceiptRead && receiptReads === 1) return null;
    const identity = where.workspaceId_outboxEventId_receiptId as
      | Readonly<{ workspaceId: string; outboxEventId: string; receiptId: string }>
      | undefined;
    return receipts.find(
      (row) =>
        row.workspaceId === identity?.workspaceId
        && row.outboxEventId === identity.outboxEventId
        && row.receiptId === identity.receiptId,
    ) ?? null;
  };

  const updateMany = async (args: {
    where: Readonly<Record<string, unknown>>;
    data: Readonly<Record<string, unknown>>;
  }) => {
    settlementWhere.push(args.where);
    if (
      args.where.id !== outbox.id
      || args.where.workspaceId !== outbox.workspaceId
      || args.where.deliveryState !== outbox.deliveryState
      || args.where.attemptCount !== outbox.attemptCount
    ) {
      return { count: 0 };
    }
    outbox = {
      ...outbox,
      deliveryState: String(args.data.deliveryState),
      deliveredAt: args.data.deliveredAt instanceof Date ? args.data.deliveredAt : outbox.deliveredAt,
      nextAttemptAt:
        args.data.nextAttemptAt instanceof Date || args.data.nextAttemptAt === null
          ? args.data.nextAttemptAt
          : outbox.nextAttemptAt,
    };
    return { count: 1 };
  };

  const tx = {
    nurtureFamilyGrowthAdmissionReceipt: {
      findUnique: async (args: { where: Readonly<Record<string, unknown>> }) =>
        receiptFor(args.where),
      createMany: async (args: { data: ReceiptRow[] }) => {
        const candidate = args.data[0]!;
        if (
          receipts.some(
            (row) =>
              row.workspaceId === candidate.workspaceId
              && row.outboxEventId === candidate.outboxEventId
              && row.receiptId === candidate.receiptId,
          )
        ) {
          return { count: 0 };
        }
        receipts.push({
          ...candidate,
          admissionRef: candidate.admissionRef ?? null,
          materialRef: candidate.materialRef ?? null,
          suppressionRef: candidate.suppressionRef ?? null,
          reasonCode: candidate.reasonCode ?? null,
        });
        return { count: 1 };
      },
    },
    nurtureFamilyGrowthOutboxEvent: {
      updateMany,
      findUnique: async (args: { where: { id: string } }) =>
        args.where.id === outbox.id ? structuredClone(outbox) : null,
    },
  };
  const prisma = {
    nurtureFamilyGrowthOutboxEvent: { updateMany },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>): Promise<T> => {
      const outboxBefore = structuredClone(outbox);
      const receiptsBefore = structuredClone(receipts);
      try {
        return await callback(tx);
      } catch (error) {
        outbox = outboxBefore;
        receipts = receiptsBefore;
        throw error;
      }
    },
  } as unknown as NurturePrismaClient;

  return {
    port: new PrismaFamilyGrowthOutboxPort(prisma),
    outbox: () => structuredClone(outbox),
    receipts: () => structuredClone(receipts),
    settlementWhere,
  };
};

describe("T-011 N2/N6 family-growth settlement hardening", () => {
  it("makes a stale-success completion a no-op after lease reclaim", async () => {
    const harness = outboxHarness({ attemptCount: 2 });
    expect(await harness.port.recordReceipt(receiptInput({ attemptCount: 1 }))).toBe("stale");
    expect(harness.outbox()).toMatchObject({ deliveryState: "delivering", attemptCount: 2 });
    expect(harness.receipts()).toEqual([]);
    expect(harness.settlementWhere[0]).toMatchObject({
      id: "evt-1",
      workspaceId: "ws-1",
      deliveryState: "delivering",
      attemptCount: 1,
    });
  });

  it("makes a stale-failure completion a no-op after lease reclaim", async () => {
    const harness = outboxHarness({ attemptCount: 2 });
    const nextAttemptAt = new Date("2026-08-13T02:01:00.000Z");
    expect(
      await harness.port.recordTransportFailure({
        workspaceId: "ws-1",
        outboxEventId: "evt-1",
        attemptCount: 1,
        nextAttemptAt,
      }),
    ).toBe("stale");
    expect(harness.outbox()).toMatchObject({
      deliveryState: "delivering",
      attemptCount: 2,
      nextAttemptAt: null,
    });
    expect(harness.settlementWhere[0]).toMatchObject({
      id: "evt-1",
      workspaceId: "ws-1",
      deliveryState: "delivering",
      attemptCount: 1,
    });
  });

  it("does not label a same-attempt terminal state without matching evidence as stale", async () => {
    const harness = outboxHarness({ deliveryState: "delivered" });
    expect(await harness.port.recordReceipt(receiptInput())).toBe("not_settled");
    expect(harness.outbox()).toMatchObject({ deliveryState: "delivered", attemptCount: 1 });
    expect(harness.receipts()).toEqual([]);
  });

  it("returns an idempotent replay when the same raw receipt reaches a terminal row", async () => {
    const input = receiptInput({
      receiptPayload: {
        consumer_extension: { trace: "raw-1" },
        ...(receiptInput().receiptPayload as Record<string, unknown>),
      },
    });
    const harness = outboxHarness();
    const first = await harness.port.recordReceipt(input);
    const reorderedPayload = Object.fromEntries(
      Object.entries(input.receiptPayload as Record<string, unknown>).reverse(),
    );
    const second = await harness.port.recordReceipt(
      receiptInput({ receiptPayload: reorderedPayload }),
    );
    expect(first).toBe("settled");
    expect(second).toBe("replayed");
    expect(harness.outbox()).toMatchObject({ deliveryState: "delivered", attemptCount: 1 });
    expect(harness.receipts()).toHaveLength(1);
  });

  it("rolls back settlement when a duplicate receipt identity has different content", async () => {
    const original = receiptInput();
    for (const changed of [
      receiptInput({ status: "duplicate" as const }),
      receiptInput({ materialRef: "material-other" }),
      receiptInput({ processedAt: new Date("2026-08-13T02:00:01.000Z") }),
    ]) {
      const harness = outboxHarness({
        receipts: [storedReceipt(original)],
        hideFirstReceiptRead: true,
      });
      expect(await harness.port.recordReceipt(changed)).toBe("receipt_conflict");
      expect(harness.outbox()).toMatchObject({ deliveryState: "delivering", deliveredAt: null });
      expect(harness.receipts()).toEqual([storedReceipt(original)]);
    }
  });

  it("treats unknown raw receipt field changes as a conflict", async () => {
    const basePayload = receiptInput().receiptPayload as Record<string, unknown>;
    const first = receiptInput({
      receiptPayload: { ...basePayload, consumer_extension: { trace: "raw-1" } },
    });
    const changed = receiptInput({
      receiptPayload: { ...basePayload, consumer_extension: { trace: "raw-2" } },
    });
    const harness = outboxHarness();
    expect(await harness.port.recordReceipt(first)).toBe("settled");
    expect(await harness.port.recordReceipt(changed)).toBe("receipt_conflict");
    expect(harness.receipts()).toEqual([storedReceipt(first)]);
    expect(harness.outbox().deliveryState).toBe("delivered");
  });

  it("refuses receipt coordinates that do not match the stored envelope", async () => {
    for (const mismatched of [
      receiptInput({ releaseEventId: "evt-other" }),
      receiptInput({ sourceScenarioKey: "education" }),
      receiptInput({ sourceReleaseRef: "release-other" }),
      receiptInput({ familyId: "family-other" }),
    ]) {
      const harness = outboxHarness();
      expect(await harness.port.recordReceipt(mismatched)).toBe("receipt_coordinate_mismatch");
      expect(harness.outbox()).toMatchObject({ deliveryState: "delivering", deliveredAt: null });
      expect(harness.receipts()).toEqual([]);
      expect(harness.settlementWhere).toEqual([]);
    }
  });
});

describe("T-011 family-growth claim-race contract shape", () => {
  it("rechecks outcome_unknown due time in the claim update predicate", async () => {
    const now = new Date("2026-08-13T02:00:00.000Z");
    const updates: Array<Readonly<Record<string, unknown>>> = [];
    const prisma = {
      nurtureFamilyGrowthOutboxEvent: {
        findMany: async () => [{ id: "evt-1", deliveryState: "outcome_unknown" }],
        updateMany: async (args: { where: Readonly<Record<string, unknown>> }) => {
          updates.push(args.where);
          return { count: 0 };
        },
        findUniqueOrThrow: async () => {
          throw new Error("a lost claim must not be loaded");
        },
      },
    } as unknown as NurturePrismaClient;

    const claimed = await new PrismaFamilyGrowthOutboxPort(prisma).claimDue({ now, limit: 1 });
    expect(claimed).toEqual([]);
    expect(updates).toEqual([
      {
        id: "evt-1",
        deliveryState: "outcome_unknown",
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
    ]);
  });
});

describe("T-011 N8 family-growth current binding read", () => {
  it("ignores a more recently touched historical association and follows the current exact child id", async () => {
    const childAnchorId = "11111111-1111-4111-8111-111111111111";
    const familyAnchorId = "22222222-2222-4222-8222-222222222222";
    const childAssociationId = "33333333-3333-4333-8333-333333333333";
    const current = {
      id: "family-association-current",
      workspaceId: "ws-1",
      familyId: "family-current",
      childCareProcessId: "process-1",
      childAssociationId,
      childAnchorId,
      familyAnchorId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 4,
      childAnchor: { id: childAnchorId, status: "associated", aggregateVersion: 1 },
      familyAnchor: { id: familyAnchorId, status: "associated", aggregateVersion: 2 },
    };
    const touchedHistorical = {
      ...current,
      id: "family-association-historical",
      familyId: "family-historical",
      childAssociationId: "child-association-historical",
      status: "revoked",
      currentKey: null,
    };
    const familyReads: Array<Readonly<Record<string, unknown>>> = [];
    const childReads: Array<Readonly<Record<string, unknown>>> = [];
    const prisma = {
      nurtureFamilyAnchorAssociation: {
        findMany: async (args: { where: Readonly<Record<string, unknown>> }) => {
          familyReads.push(args.where);
          return args.where.currentKey === "current"
            ? [current]
            : [touchedHistorical, current];
        },
      },
      nurtureChildAnchorAssociation: {
        findMany: async (args: { where: Readonly<Record<string, unknown>> }) => {
          childReads.push(args.where);
          return args.where.id === childAssociationId
            && args.where.currentKey === "current"
            ? [{
                id: childAssociationId,
                aggregateVersion: 3,
                status: "active",
                currentKey: "current",
              }]
            : [{
                id: "child-association-historical",
                aggregateVersion: 8,
                status: "revoked",
                currentKey: null,
              }];
        },
      },
      nurtureScenarioBindingAuthorization: {
        findFirst: async (args: { where: { subjectType: "child" | "family" } }) => ({
          id: "authorization-1",
          aggregateVersion: 5,
          status: "active",
          expiresAt: new Date("2026-08-14T00:00:00.000Z"),
          ownerRef: args.where.subjectType === "child"
            ? `nurture_child_binding_anchor_v1:${childAnchorId}`
            : `nurture_family_binding_anchor_v1:${familyAnchorId}`,
          ownerVersion: args.where.subjectType === "child" ? 1 : 2,
          purpose: "scenario_binding_write",
          authorizationSourceRef: "nurture-care-role:guardian-role-1",
          authorizationSourceVersion: 6,
        }),
      },
      nurtureCareRoleAssignment: {
        findFirst: async () => ({
          id: "guardian-role-1",
          participantId: "guardian-1",
          aggregateVersion: 6,
          status: "active",
          role: "guardian",
          startsAt: null,
          endsAt: null,
          deletedAt: null,
          participant: {
            id: "guardian-1",
            aggregateVersion: 7,
            status: "active",
            deletedAt: null,
          },
        }),
      },
    } as unknown as NurturePrismaClient;

    const result = await new PrismaFamilyGrowthBindingReadPort(prisma).loadCurrentBinding({
      workspaceId: "ws-1",
      childCareProcessId: "process-1",
    });
    expect(result?.localFamilyId).toBe("family-current");
    expect(result?.childAssociation).toEqual({
      associationId: childAssociationId,
      aggregateVersion: 3,
      status: "active",
      currentKey: "current",
    });
    expect(familyReads[0]).toMatchObject({ currentKey: "current" });
    expect(childReads[0]).toMatchObject({
      id: childAssociationId,
      currentKey: "current",
    });
  });
});

describe("T-011 N1 prepared binding-head commit guard", () => {
  const heads = () => ({
    canonicalTarget: { child_id: "mc-child-1", family_id: "mc-family-1" },
    workspaceId: "ws-1",
    localFamilyId: "family-1",
    childCareProcessId: "process-1",
    childAnchor: { anchorId: "child-anchor-1", aggregateVersion: 1 },
    familyAnchor: { anchorId: "family-anchor-1", aggregateVersion: 2 },
    childAssociation: { associationId: "child-association-1", aggregateVersion: 3 },
    familyAssociation: { associationId: "family-association-1", aggregateVersion: 4 },
    childAuthorization: {
      authorizationId: "child-authorization-1",
      aggregateVersion: 5,
      expiresAt: "2099-01-01T00:00:00.000Z",
      ownerRef: "nurture_child_binding_anchor_v1:child-anchor-1",
      ownerVersion: 1,
      purpose: "scenario_binding_write",
      authorizationSourceRef: "nurture-care-role:guardian-role-1",
      authorizationSourceVersion: 7,
      guardianRole: {
        roleAssignmentId: "guardian-role-1",
        participantId: "guardian-1",
        aggregateVersion: 7,
        status: "active",
        role: "guardian",
        startsAt: null,
        endsAt: null,
      },
      participant: {
        participantId: "guardian-1",
        aggregateVersion: 8,
        status: "active",
      },
    },
    familyAuthorization: {
      authorizationId: "family-authorization-1",
      aggregateVersion: 6,
      expiresAt: "2099-01-01T00:00:00.000Z",
      ownerRef: "nurture_family_binding_anchor_v1:family-anchor-1",
      ownerVersion: 2,
      purpose: "scenario_binding_write",
      authorizationSourceRef: "nurture-care-role:guardian-role-1",
      authorizationSourceVersion: 7,
      guardianRole: {
        roleAssignmentId: "guardian-role-1",
        participantId: "guardian-1",
        aggregateVersion: 7,
        status: "active",
        role: "guardian",
        startsAt: null,
        endsAt: null,
      },
      participant: {
        participantId: "guardian-1",
        aggregateVersion: 8,
        status: "active",
      },
    },
    canonicalOwnerEvidenceExpiresAt: "2099-01-01T00:00:00.000Z",
  });

  it("uses one locking statement and accepts exactly one unchanged head tuple", async () => {
    let reads = 0;
    let sql = "";
    const transaction = {
      $queryRaw: async (statement: { strings: readonly string[] }) => {
        reads += 1;
        sql = statement.strings.join("?").replace(/\s+/gu, " ");
        return [{ matched: 1 }];
      },
    };
    expect(
      await familyGrowthPreparedBindingHeadsAreCurrent(
        transaction,
        heads(),
        new Date("2026-08-13T08:00:00.000Z"),
      ),
    ).toBe(true);
    expect(reads).toBe(1);
    expect(sql).toContain("FOR SHARE OF authorization");
    expect(sql).toContain(
      "FOR SHARE OF family_association, child_association, child_anchor, family_anchor, child_role, child_participant, family_role, family_participant",
    );
    expect(sql).toContain('child_authorization."authorization_source_ref"');
    expect(sql).toContain('child_participant."aggregate_version"');
  });

  it("fails closed when revocation changes the prepared authorization head", async () => {
    const transaction = { $queryRaw: async () => [] };
    expect(
      await familyGrowthPreparedBindingHeadsAreCurrent(
        transaction,
        heads(),
        new Date("2026-08-13T08:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("fails closed when rebind changes the prepared association head", async () => {
    const transaction = { $queryRaw: async () => [] };
    expect(
      await familyGrowthPreparedBindingHeadsAreCurrent(
        transaction,
        heads(),
        new Date("2026-08-13T08:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("rejects valid heads cross-paired with another workspace/process/family target", () => {
    const family_growth = {
      target: { child_id: "mc-child-1", family_id: "mc-family-1" },
      localBindingHeads: heads(),
    };
    expect(
      familyGrowthPreparedHeadsMatchReleaseTarget(
        { workspace_id: "ws-1", family_growth },
        { workspaceId: "ws-1", childCareProcessId: "process-1", familyRefKey: "ws-1:family-1" },
      ),
    ).toBe(true);
    expect(
      familyGrowthPreparedHeadsMatchReleaseTarget(
        { workspace_id: "ws-1", family_growth },
        { workspaceId: "ws-1", childCareProcessId: "process-other", familyRefKey: "ws-1:family-1" },
      ),
    ).toBe(false);
    expect(
      familyGrowthPreparedHeadsMatchReleaseTarget(
        { workspace_id: "ws-1", family_growth },
        { workspaceId: "ws-1", childCareProcessId: "process-1", familyRefKey: "ws-1:family-other" },
      ),
    ).toBe(false);
    expect(
      familyGrowthPreparedHeadsMatchReleaseTarget(
        {
          workspace_id: "ws-1",
          family_growth: {
            ...family_growth,
            target: { child_id: "mc-child-other", family_id: "mc-family-other" },
          },
        },
        { workspaceId: "ws-1", childCareProcessId: "process-1", familyRefKey: "ws-1:family-1" },
      ),
    ).toBe(false);
  });

  it("rejects expired owner evidence without issuing a database read", async () => {
    let reads = 0;
    const transaction = {
      $queryRaw: async () => {
        reads += 1;
        return [{ matched: 1 }];
      },
    };
    const expired = {
      ...heads(),
      canonicalOwnerEvidenceExpiresAt: "2026-08-13T08:00:00.000Z",
    };
    expect(
      await familyGrowthPreparedBindingHeadsAreCurrent(
        transaction,
        expired,
        new Date("2026-08-13T08:00:00.000Z"),
      ),
    ).toBe(false);
    expect(reads).toBe(0);
  });
});
