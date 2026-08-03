import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurtureAttributionAppendedRow,
  NurtureAttributionAppendInput,
  NurtureMediaAttributionTransaction,
  NurtureMediaAttributionWriteFacts,
  NurtureMediaDiscardFacts,
} from "@the-nurture/scenario/harness";
import {
  caregiverRowAuthority,
  readMediaComposition,
  resolveCaregiverReach,
  type BoardPrisma,
  type CaregiverReachV1,
} from "./board-read-support.js";
import { currentAttributionRowsPerChild } from "./media-safety.read.js";

type DomainContextRef = CanonicalRef;

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

/**
 * Canonical-owner writes behind the G3-C1 child-media attribution decisions.
 *
 * Every decision APPENDS a new revision per (asset, child): confirmed history
 * is never overwritten, and `uq_nurture_media_attribution_revision` is the
 * compare-and-set — a concurrent decision on the same child collides on the
 * revision it also tried to append. A supersession additionally links the
 * from-child's superseded revision to the confirmed row it was corrected in
 * favour of.
 */
export class PrismaMediaAttributionTransaction implements NurtureMediaAttributionTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadMediaAttributionWriteFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<NurtureMediaAttributionWriteFacts | null> {
    const readAt = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      readAt,
    );
    if (!reach) return null;
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id, deletedAt: null },
      include: {
        attributions: {
          where: { deletedAt: null },
          orderBy: [{ attributionRevision: "asc" }, { id: "asc" }],
        },
      },
    });
    if (!asset) return null;

    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: reach.care_group_id,
        status: "active",
        deletedAt: null,
      },
      select: { childCareProcessId: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return {
      authority: caregiverRowAuthority(reach, asset.careGroupId),
      media_asset_ref: domainRef("media_asset", asset.id, asset.mediaRevision),
      media_lifecycle: asset.lifecycle,
      media_revision: asset.mediaRevision,
      eligible_child_ids: enrollments.map((enrollment) => enrollment.childCareProcessId),
      attributions: currentAttributionRowsPerChild(asset.attributions),
    };
  }

  async applyChildAttributionAppends(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
    appends: NurtureAttributionAppendInput[];
    link_supersession: boolean;
  }): Promise<{
    media_asset_ref: DomainContextRef;
    rows: NurtureAttributionAppendedRow[];
  }> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) throw new Error("nurture attribution: target unavailable");
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!asset) throw new Error("nurture attribution: target unavailable");

    // One instant for the whole decision: every appended row is created at it,
    // and for a confirmation it is also the confirmation instant — so the
    // stored decision instant every later read reports IS this one.
    const decidedAt = new Date();
    const rows: NurtureAttributionAppendedRow[] = [];
    const created: string[] = [];
    for (const append of input.appends) {
      // The append target is the exact next revision. The unique would also
      // refuse a duplicate, but an expected head ABOVE the current revision
      // would insert past a gap the unique cannot see — so the current maximum
      // is re-read and compared, and only expected+1 is ever written.
      const current = await this.prisma.nurtureChildMediaAttribution.findFirst({
        where: {
          workspaceId: input.workspace_id,
          mediaAssetRefId: asset.id,
          childCareProcessId: append.child_care_process_id,
          deletedAt: null,
        },
        orderBy: { attributionRevision: "desc" },
      });
      if ((current?.attributionRevision ?? 0) !== append.expected_revision) {
        throw new Error("nurture attribution: revision conflict");
      }
      const row = await this.prisma.nurtureChildMediaAttribution.create({
        data: {
          workspaceId: input.workspace_id,
          mediaAssetRefId: asset.id,
          childCareProcessId: append.child_care_process_id,
          // A confirmed append is always a manual decision; a rejected or
          // superseded one inherits the row's own stored source.
          source: append.state === "confirmed" ? "manual" : (current?.source ?? "manual"),
          state: append.state,
          attributionRevision: append.expected_revision + 1,
          createdAt: decidedAt,
          ...(append.state === "confirmed"
            ? {
                confirmedByRoleAssignmentId: reach.role_assignment_id,
                confirmedAt: decidedAt,
                // The C1 product meaning of confirming a child in class media:
                // visible to that child's own family, nothing wider.
                exposurePolicyPayload: { audience: "own_family" },
              }
            : {}),
        },
      });
      created.push(row.id);
      rows.push({
        attribution_ref: domainRef("child_media_attribution", row.id, row.attributionRevision),
        child_care_process_id: row.childCareProcessId,
        revision: row.attributionRevision,
        state: row.state,
        source: MEDIA_ATTRIBUTION_SOURCE_TO_DOMAIN[row.source],
        decided_at: decidedAt.toISOString(),
      });
    }

    if (input.link_supersession) {
      const [supersededId, confirmedId] = created;
      if (!supersededId || !confirmedId) {
        throw new Error("nurture attribution: supersession link requires both rows");
      }
      await this.prisma.nurtureChildMediaAttribution.update({
        where: { id: supersededId },
        data: { supersededByAttributionId: confirmedId },
      });
    }

    return {
      media_asset_ref: domainRef("media_asset", asset.id, asset.mediaRevision),
      rows,
    };
  }

  async loadMediaDiscardFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<NurtureMediaDiscardFacts | null> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) return null;
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!asset) return null;
    const counts = await this.mediaReferenceCounts(input.workspace_id, reach, asset.id);
    return {
      authority: caregiverRowAuthority(reach, asset.careGroupId),
      media_asset_ref: domainRef("media_asset", asset.id, asset.mediaRevision),
      media_lifecycle: asset.lifecycle,
      media_revision: asset.mediaRevision,
      committed_release_count: counts.committed_release_count,
      referencing_draft_count: counts.referencing_draft_count,
    };
  }

  async applyMediaAssetDiscard(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
    expected_media_revision: number;
  }): Promise<{ media_asset_ref: DomainContextRef; affected_draft_count: number }> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) throw new Error("nurture media discard: target unavailable");

    // The blast radius is measured inside this same transaction: the number
    // the commit records is the number that was true when the discard landed.
    const counts = await this.mediaReferenceCounts(
      input.workspace_id,
      reach,
      input.media_asset_id,
    );
    if (counts.committed_release_count > 0) {
      // Belt over the rule's own check: a release that committed between the
      // owner read and this write closes the window even mid-transaction.
      throw new Error("nurture media discard: already released");
    }

    const discarded = await this.prisma.nurtureMediaAssetRef.updateMany({
      where: {
        id: input.media_asset_id,
        workspaceId: input.workspace_id,
        deletedAt: null,
        mediaRevision: input.expected_media_revision,
        // Terminal states never leave; the same set the domain calls terminal.
        lifecycle: { in: ["preparing", "ready", "unavailable"] },
      },
      data: { lifecycle: "discarded", aggregateVersion: { increment: 1 } },
    });
    if (discarded.count !== 1) {
      throw new Error("nurture media discard: revision conflict");
    }
    const asset = await this.prisma.nurtureMediaAssetRef.findFirstOrThrow({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id },
    });
    return {
      media_asset_ref: domainRef("media_asset", asset.id, asset.mediaRevision),
      affected_draft_count: counts.referencing_draft_count,
    };
  }

  /**
   * The same two counts the read port derives, scoped the same way: releases
   * whose own frozen composition carries the asset close the discard window,
   * and unreleased class drafts still citing it are the blast radius.
   */
  private async mediaReferenceCounts(
    workspaceId: string,
    reach: CaregiverReachV1,
    mediaAssetId: string,
  ): Promise<{ committed_release_count: number; referencing_draft_count: number }> {
    const releases = await this.prisma.nurturePublicationRelease.findMany({
      where: {
        workspaceId,
        publishProcess: { is: { careGroupId: reach.care_group_id } },
      },
      select: { revision: { select: { mediaCompositionPayload: true } } },
    });
    const committed = releases.filter((release) =>
      readMediaComposition(release.revision.mediaCompositionPayload).some(
        (entry) => entry.media_asset_id === mediaAssetId,
      ),
    ).length;

    const referencingRevisions = await this.prisma.nurturePublishProcessRevision.findMany({
      where: {
        workspaceId,
        currentOf: {
          is: {
            state: { in: ["draft", "needs_review", "pending_release"] },
            careGroupId: reach.care_group_id,
          },
        },
      },
      select: { mediaCompositionPayload: true, publishProcessId: true },
    });
    const referencing = new Set(
      referencingRevisions
        .filter((revision) =>
          readMediaComposition(revision.mediaCompositionPayload).some(
            (entry) => entry.media_asset_id === mediaAssetId,
          ),
        )
        .map((revision) => revision.publishProcessId),
    );
    return { committed_release_count: committed, referencing_draft_count: referencing.size };
  }
}

/** Prisma source enum → the domain's display vocabulary. */
const MEDIA_ATTRIBUTION_SOURCE_TO_DOMAIN: Record<string, string> = {
  manual: "manual",
  face_reference: "automatic_face_match",
  history_match: "organizer_candidate",
  system: "organizer_candidate",
};
