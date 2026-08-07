import { Prisma } from "@prisma/client";
import type { NurturePrismaClient } from "../client.js";

/**
 * T-009 I5: authorization-bearing resolution behind the rendition exchange
 * (`family_growth_transport@1.0.0` §4/§5).
 *
 * A ref resolves ONLY while all of these hold, re-verified on every call:
 * the ref appears in a committed `released` outbox envelope, that release is
 * still `visible` (removal/redaction deny from that moment — independent
 * revocation), and the asset still carries the exact pinned revision with
 * its digest and MIME facts. Every failure collapses to `null` — the
 * endpoint answers 404 `rendition_unavailable` without distinguishing
 * unknown from revoked (§5 non-leakage).
 */

const RENDITION_REF_PATTERN =
  /^nurture_family_rendition_v1:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([1-9][0-9]{0,8})$/;

export type ParsedFamilyRenditionRefV1 = { assetId: string; mediaRevision: number };

/** Malformed input is the endpoint's 400; unknown-but-well-formed is its 404. */
export const parseFamilyRenditionRefV1 = (ref: string): ParsedFamilyRenditionRefV1 | null => {
  const match = RENDITION_REF_PATTERN.exec(ref);
  if (!match) return null;
  return { assetId: match[1]!, mediaRevision: Number(match[2]!) };
};

export type ResolvedFamilyRenditionV1 = {
  assetId: string;
  mediaRevision: number;
  workspaceId: string;
  contentDigest: string;
  contentMimeType: string;
  storageRefPayload: unknown;
};

export class PrismaFamilyGrowthRenditionReadPort {
  constructor(private readonly prisma: NurturePrismaClient) {}

  async resolveRendition(ref: string): Promise<ResolvedFamilyRenditionV1 | null> {
    const parsed = parseFamilyRenditionRefV1(ref);
    if (!parsed) return null;

    // The ref must have actually left through a released envelope — the
    // outbox row is the delivery fact the exchange authorizes against.
    const containment = JSON.stringify({
      material: { media: [{ family_rendition_ref: ref }] },
    });
    const rows = await this.prisma.$queryRaw<
      Array<{ workspace_id: string; publication_release_id: string }>
    >(Prisma.sql`
      SELECT "workspace_id", "publication_release_id"
      FROM "nurture_family_growth_outbox_event"
      WHERE "kind" = 'released'
        AND "envelope_payload" @> ${containment}::jsonb
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) return null;

    const release = await this.prisma.nurturePublicationRelease.findFirst({
      where: { id: row.publication_release_id, workspaceId: row.workspace_id },
      select: { visibility: true },
    });
    if (!release || release.visibility !== "visible") return null;

    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: parsed.assetId, workspaceId: row.workspace_id },
    });
    if (
      !asset ||
      asset.lifecycle !== "ready" ||
      asset.mediaRevision !== parsed.mediaRevision ||
      !asset.contentDigest ||
      !asset.contentMimeType
    ) {
      return null;
    }

    return {
      assetId: asset.id,
      mediaRevision: asset.mediaRevision,
      workspaceId: asset.workspaceId,
      contentDigest: asset.contentDigest,
      contentMimeType: asset.contentMimeType,
      storageRefPayload: asset.storageRefPayload,
    };
  }
}
