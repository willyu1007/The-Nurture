import type {
  FamilyGrowthBindingReadPort,
  FamilyGrowthCanonicalExchangePort,
  FamilyGrowthMediaItemV1,
  FamilyGrowthReleaseEmissionPreparerV1,
  FamilyGrowthReleaseEmissionPrepResultV1,
} from "@the-nurture/scenario/family-growth";
import { resolveFamilyGrowthTargetV1 } from "@the-nurture/scenario/family-growth";
import {
  assertProtectedContentEnvelopeV1,
  type ProtectedContentEnvelopeV1,
  type ProtectedContentWritePort,
} from "@the-nurture/scenario/harness";
import { readMediaComposition } from "./board-read-support.js";
import type { NurturePrismaClient } from "../client.js";

const HEX_DIGEST = /^[a-f0-9]{64}$/;
const DISPLAY_TITLE_MAX = 120;
const SOURCE_LABEL_MAX = 80;

/** UTF-16-unit cap that never leaves a dangling high surrogate at the cut. */
const truncateDisplay = (value: string, max: number): string => {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
};

/** Parseable by the I5 rendition exchange; opaque to everyone else. */
export const familyRenditionRefV1 = (assetId: string, mediaRevision: number): string =>
  `nurture_family_rendition_v1:${assetId}:${mediaRevision}`;

/**
 * T-009 fact preparer (I3c): loads real canonical facts into one prepared
 * per-target emission, entirely BEFORE the release transaction.
 *
 * Fail-closed throughout: an unresolved binding, a missing policy, a media
 * item without its digest or MIME type, or an unreadable display title each
 * deny this one target with a stable reason instead of shipping a
 * placeholder. v1 mappings (02-architecture D-T009-08):
 * - admission: `direct_family_release` under the schedule's frozen policy
 *   identity — the same identity the commit gate revalidates (the release is
 *   grant-backed; per-item guardian confirmation is a consumer policy);
 * - retention: `family_retained`;
 * - rendition ref: deterministic handle over the exact unchanged original
 *   revision (D-T009-02), resolved and authorized later by the I5 exchange;
 * - `occurred_at`: earliest media capture instant, else the revision's
 *   assembly instant.
 */
export class PrismaFamilyGrowthEmissionPreparer
  implements FamilyGrowthReleaseEmissionPreparerV1
{
  constructor(
    private readonly prisma: NurturePrismaClient,
    private readonly deps: {
      binding: FamilyGrowthBindingReadPort;
      canonicalExchange: FamilyGrowthCanonicalExchangePort;
      protectedContent: ProtectedContentWritePort;
      now?: () => Date;
    },
  ) {}

  async prepare(input: {
    workspace_id: string;
    process_key: string;
    target_key: string;
    child_care_process_id: string;
    revision: number;
  }): Promise<FamilyGrowthReleaseEmissionPrepResultV1> {
    const at = this.deps.now?.() ?? new Date();

    const process = await this.prisma.nurturePublishProcess.findFirst({
      where: { workspaceId: input.workspace_id, processKey: input.process_key },
      include: {
        careGroup: { select: { name: true, institutionId: true } },
        targets: { where: { targetKey: input.target_key } },
        revisions: { where: { revision: input.revision } },
      },
    });
    const target = process?.targets[0];
    const revision = process?.revisions[0];
    if (!process || !target || !revision) {
      return { status: "denied", reason: "release_facts_unavailable" };
    }
    if (target.childCareProcessId !== input.child_care_process_id) {
      return { status: "denied", reason: "release_facts_unavailable" };
    }
    if (!HEX_DIGEST.test(revision.contentDigest)) {
      // A pre-hex legacy revision digest cannot enter the envelope.
      return { status: "denied", reason: "release_facts_unavailable" };
    }

    // The capture path writes `familyRefKey` as `<workspaceId>:<familyId>`
    // (care-capture.transaction.ts); older seeds carry the bare id. Strip the
    // workspace prefix so the resolver compares local family ids, not keys.
    const workspacePrefix = `${input.workspace_id}:`;
    const localFamilyId = target.familyRefKey.startsWith(workspacePrefix)
      ? target.familyRefKey.slice(workspacePrefix.length)
      : target.familyRefKey;

    const resolution = await resolveFamilyGrowthTargetV1(
      { binding: this.deps.binding, canonicalExchange: this.deps.canonicalExchange },
      {
        workspaceId: input.workspace_id,
        childCareProcessId: target.childCareProcessId,
        localFamilyId,
      },
      at,
    );
    if (resolution.status === "denied") {
      return { status: "denied", reason: resolution.reason };
    }

    // The admission policy identity is the SCHEDULE's frozen policy — the
    // exact identity the commit transaction revalidates the current policy
    // against. Reading the current policy row here instead would open a
    // prepare-to-commit drift window the commit gate cannot see.
    if (process.schedulePolicyRef === null || process.schedulePolicyVersion === null) {
      return { status: "denied", reason: "publication_policy_unavailable" };
    }

    const composition = readMediaComposition(revision.mediaCompositionPayload);
    const media: FamilyGrowthMediaItemV1[] = [];
    let earliestCapture: Date | null = null;
    if (composition.length > 0) {
      const assets = await this.prisma.nurtureMediaAssetRef.findMany({
        where: {
          workspaceId: input.workspace_id,
          id: { in: composition.map((entry) => entry.media_asset_id) },
        },
      });
      const byId = new Map(assets.map((asset) => [asset.id, asset]));
      for (const entry of composition) {
        const asset = byId.get(entry.media_asset_id);
        if (
          !asset ||
          asset.lifecycle !== "ready" ||
          // The exact composed revision must still be the current original.
          asset.mediaRevision !== entry.media_revision ||
          !asset.contentDigest ||
          !HEX_DIGEST.test(asset.contentDigest) ||
          !asset.contentMimeType
        ) {
          return { status: "denied", reason: "media_facts_unavailable" };
        }
        media.push({
          source_asset_ref: asset.id,
          source_media_revision: asset.mediaRevision,
          content_digest: asset.contentDigest,
          family_rendition_ref: familyRenditionRefV1(asset.id, asset.mediaRevision),
          mime_type: asset.contentMimeType,
          access_mode: "authorized_short_lived_url",
        });
        if (asset.capturedAt && (!earliestCapture || asset.capturedAt < earliestCapture)) {
          earliestCapture = asset.capturedAt;
        }
      }
    }
    if (media.length === 0) {
      // The v1 contract is photo material; a media-free revision has nothing
      // to release into family growth.
      return { status: "denied", reason: "media_facts_unavailable" };
    }

    const title = this.displayTitle(revision.titleProtectionPayload);
    if (!title) {
      return { status: "denied", reason: "display_content_unavailable" };
    }

    return {
      status: "prepared",
      emission: {
        target: resolution.target,
        admission: {
          mode: "direct_family_release",
          policy_ref: process.schedulePolicyRef,
          policy_version: process.schedulePolicyVersion,
        },
        material: {
          occurredAt: (earliestCapture ?? revision.createdAt).toISOString(),
          displaySnapshot: {
            title,
            source_label: truncateDisplay(process.careGroup.name, SOURCE_LABEL_MAX),
          },
          attribution: {
            // The authorizing assignment is the contributor identity the
            // process itself records; the releasing assignment lands on the
            // release row inside the commit.
            source_contributor_ref:
              process.authorizingRoleAssignmentId ?? process.careGroupId,
            source_organization_ref: process.careGroup.institutionId,
            contributed_at: revision.createdAt.toISOString(),
          },
          media,
        },
        retentionMode: "family_retained",
        contentDigest: revision.contentDigest,
      },
    };
  }

  /** Same posture as the queue's `safeTitle`: no key material, no title. */
  private displayTitle(payload: unknown): string | null {
    if (payload === null || typeof payload !== "object") return null;
    try {
      assertProtectedContentEnvelopeV1(payload);
      const title = this.deps.protectedContent
        .unseal(payload as ProtectedContentEnvelopeV1)
        .trim();
      return title.length > 0 ? truncateDisplay(title, DISPLAY_TITLE_MAX) : null;
    } catch {
      return null;
    }
  }
}
