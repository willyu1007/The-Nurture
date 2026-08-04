import type {
  AttributionSourceV1,
  CaregiverFactAuthorityV1,
  ChildAttributionFactV1,
  ChildAttributionStateV1,
  ContentSafetySourceReadPort,
  ContentSafetySourceSignalV1,
  MediaAttributionFactsV1,
  MediaAttributionReadPort,
  MediaLifecycleFactsV1,
  MediaLifecycleReadPort,
} from "@the-nurture/scenario/harness";
import {
  caregiverRowAuthority,
  readMediaComposition,
  resolveCaregiverReach,
  type BoardPrisma,
} from "./board-read-support.js";

/**
 * The owner's capture kinds and the safety policy's fact kinds are separate
 * vocabularies. The mapping is explicit and total, so a photo can never enter
 * the assessment as teacher text.
 */
const CAPTURE_FACT_KIND = {
  text: "teacher_text",
  voice_transcript: "voice_transcript",
  media: "media_photo",
} as const satisfies Record<string, ContentSafetySourceSignalV1["fact_kind"]>;

/**
 * The owner's attribution sources and the board's are separate vocabularies.
 * The mapping is explicit and total, so a new owner value is a compile error
 * rather than something that quietly presents as a manual teacher decision.
 */
/**
 * The latest revision per child, from rows ordered by `attributionRevision`
 * ascending. `reduce` over the ordered rows rather than a sort: the ordering is
 * the port's own contract with the query, and re-deriving it here would be a
 * second place for it to disagree.
 */
export const currentAttributionRowsPerChild = (
  rows: ReadonlyArray<{
    id: string;
    childCareProcessId: string;
    state: ChildAttributionStateV1;
    attributionRevision: number;
    source: keyof typeof ATTRIBUTION_SOURCE;
    confirmedAt: Date | null;
    createdAt: Date;
  }>,
): ChildAttributionFactV1[] => {
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const held = latest.get(row.childCareProcessId);
    if (!held || row.attributionRevision >= held.attributionRevision) {
      latest.set(row.childCareProcessId, row);
    }
  }
  return [...latest.values()].map((row) => ({
    attribution_id: row.id,
    child_care_process_id: row.childCareProcessId,
    status: row.state,
    revision: row.attributionRevision,
    source: ATTRIBUTION_SOURCE[row.source],
    ...(attributionDecidedAt(row) ? { decided_at: attributionDecidedAt(row) } : {}),
  }));
};

/**
 * The stored decision instant. Rows are append-only, so for a rejected or
 * superseded fact the append IS the decision and `created_at` records it; a
 * confirmation carries its own explicit instant. A candidate has not been
 * decided, so a candidate has none — and an idempotent repeat that cannot cite
 * a stored instant refuses rather than inventing one.
 */
const attributionDecidedAt = (row: {
  state: ChildAttributionStateV1;
  confirmedAt: Date | null;
  createdAt: Date;
}): string | undefined => {
  if (row.state === "candidate") return undefined;
  if (row.state === "confirmed") return row.confirmedAt?.toISOString();
  return row.createdAt.toISOString();
};

const ATTRIBUTION_SOURCE = {
  manual: "manual",
  face_reference: "automatic_face_match",
  history_match: "organizer_candidate",
  system: "organizer_candidate",
} as const satisfies Record<string, AttributionSourceV1>;

/**
 * Markers are recorded, not inferred. A `null` payload means the owner never
 * derived markers for that source, which is a different fact from "derived,
 * none found" — so it must never read as an empty marker list.
 */
const readMarkers = (payload: unknown): string[] | null =>
  Array.isArray(payload) && payload.every((entry) => typeof entry === "string")
    ? (payload as string[])
    : null;

/**
 * Owner-side reads for the media and content-safety lane (G3-C1).
 *
 * Attribution and media lifecycle both bind to the exact immutable original
 * media revision, and every decision is scoped to the actor's own CareGroup:
 * an asset belonging to a sibling class is simply not readable here.
 */
export class PrismaMediaSafetyReadPort
  implements ContentSafetySourceReadPort, MediaAttributionReadPort, MediaLifecycleReadPort
{
  constructor(private readonly prisma: BoardPrisma) {}

  // -------------------------------------------------------------------------
  // Content safety signals.

  async loadSafetySignals(input: {
    workspace_id: string;
    care_group_id: string;
    organizer_input_revision: string;
    source_ids: string[];
  }): Promise<{
    policy_ref: string;
    policy_head: number;
    sources: ContentSafetySourceSignalV1[];
    classifier: null;
    institution?: never;
  } | null> {
    if (input.source_ids.length === 0) return null;

    const [captures, assets, group] = await Promise.all([
      this.prisma.nurtureCareCapture.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          id: { in: input.source_ids },
          deletedAt: null,
        },
      }),
      this.prisma.nurtureMediaAssetRef.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          id: { in: input.source_ids },
          deletedAt: null,
        },
      }),
      this.prisma.nurtureCareGroup.findFirst({
        where: { id: input.care_group_id, workspaceId: input.workspace_id },
        include: { institution: { select: { policyConfigPayload: true } } },
      }),
    ]);

    const signals = new Map<string, ContentSafetySourceSignalV1>();
    for (const capture of captures) {
      const markers = readMarkers(capture.safetyMarkersPayload);
      // An unread source fails the whole derivation closed. Routing the other
      // sources alone would publish a verdict over content nobody assessed.
      if (markers === null) return null;
      signals.set(capture.id, {
        source_id: capture.id,
        fact_kind: CAPTURE_FACT_KIND[capture.kind],
        markers,
      });
    }
    for (const asset of assets) {
      const markers = readMarkers(asset.safetyMarkersPayload);
      if (markers === null) return null;
      signals.set(asset.id, {
        source_id: asset.id,
        fact_kind: "media_photo",
        markers,
      });
    }

    // Every requested source must be one this CareGroup actually owns. A source
    // the owner could not read is never silently dropped from the assessment.
    if (input.source_ids.some((id) => !signals.has(id))) return null;

    const policy = readSafetyPolicy(group?.institution.policyConfigPayload ?? null);
    if (!policy) return null;

    return {
      policy_ref: policy.policy_ref,
      policy_head: policy.policy_head,
      sources: input.source_ids.map((id) => signals.get(id)!),
      // No classifier participates on the deterministic path. `null` is "no
      // opinion expected", which is not the same as an opinion that failed.
      classifier: null,
    };
  }

  // -------------------------------------------------------------------------
  // Media attribution.

  async listAttributableMediaIds(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      new Date(),
    );
    if (!reach) return [];
    const assets = await this.prisma.nurtureMediaAssetRef.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: reach.care_group_id,
        deletedAt: null,
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return assets.map((asset) => asset.id);
  }

  async loadMediaAttributionFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<MediaAttributionFactsV1 | null> {
    const at = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
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
      authority: caregiverRowAuthority(reach, asset.careGroupId) as CaregiverFactAuthorityV1,
      media_lifecycle: asset.lifecycle,
      // The decision binds to the exact immutable original, never to "whatever
      // the asset looks like now".
      media_revision: asset.mediaRevision,
      // Only children of this exact CareGroup; a child of a sibling class is
      // not an attribution target however visible they are in the photo.
      eligible_child_ids: enrollments.map((enrollment) => enrollment.childCareProcessId),
      // One current fact per child. The table is append-only per revision, so
      // returning every revision let the domain's `find` pick the OLDEST one —
      // the moment a supersession exists, every rule would answer on a revision
      // that has already been replaced. The ordering is known here, so the
      // reduction belongs here rather than in each rule.
      attributions: currentAttributionRowsPerChild(asset.attributions),
    };
  }

  // -------------------------------------------------------------------------
  // Media lifecycle.

  async listMediaLifecycleAssetIds(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]> {
    return this.listAttributableMediaIds(input);
  }

  async loadMediaLifecycleFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
    process_key?: string;
  }): Promise<MediaLifecycleFactsV1 | null> {
    const at = new Date();
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach) return null;
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!asset) return null;

    const process = input.process_key
      ? await this.prisma.nurturePublishProcess.findFirst({
          where: { workspaceId: input.workspace_id, processKey: input.process_key },
          include: { currentRevision: true, editHold: { include: { holder: true } } },
        })
      : null;
    if (input.process_key && !process) return null;

    const composition = process
      ? readMediaComposition(process.currentRevision?.mediaCompositionPayload ?? null).map(
          (entry) => entry.media_asset_id,
        )
      : [];

    // Every unreleased draft that still cites this asset. "Discard globally" is
    // refused while another card would lose its content silently.
    const referencingRevisions = await this.prisma.nurturePublishProcessRevision.findMany({
      where: {
        workspaceId: input.workspace_id,
        currentOf: {
          is: {
            state: { in: ["draft", "needs_review", "pending_release"] },
            // Same scope as the committed-release count below. Counting the
            // whole workspace showed the teacher a number about other classes
            // while a different number decided whether they were blocked.
            careGroupId: reach.care_group_id,
          },
        },
      },
      select: { id: true, mediaCompositionPayload: true, publishProcessId: true },
    });
    const referencingProcessIds = new Set(
      referencingRevisions
        .filter((revision) =>
          readMediaComposition(revision.mediaCompositionPayload).some(
            (entry) => entry.media_asset_id === asset.id,
          ),
        )
        .map((revision) => revision.publishProcessId),
    );

    let committed: number;
    if (process) {
      committed = await this.prisma.nurturePublicationRelease.count({
        where: { workspaceId: input.workspace_id, publishProcessId: process.id },
      });
    } else {
        // Global discard: only a release whose own frozen composition contains
      // this asset closes the window. Counting every release the class ever
      // made would make one publication freeze the whole media library.
      //
      // `referencing_draft_count` is reported, not enforced: the rule allows
      // the discard and the referencing drafts re-read the asset as
      // unavailable. An earlier comment here claimed it was a refusal.
      const releases = await this.prisma.nurturePublicationRelease.findMany({
        where: {
          workspaceId: input.workspace_id,
          publishProcess: { is: { careGroupId: reach.care_group_id } },
        },
        select: { revision: { select: { mediaCompositionPayload: true } } },
      });
      committed = releases.filter((release) =>
        readMediaComposition(release.revision.mediaCompositionPayload).some(
          (entry) => entry.media_asset_id === asset.id,
        ),
      ).length;
    }

    return {
      authority: caregiverRowAuthority(reach, asset.careGroupId) as CaregiverFactAuthorityV1,
      // The global path has no process, so there is no process state to report.
      // Answering "draft" invented one; `cancelled` is the one value that can
      // never gate this decision, so it reads as "not a process question".
      process_state: process?.state ?? "cancelled",
      read_at: at.toISOString(),
      ...(process?.editHold
        ? {
            current_hold: {
              holder_participant_id: process.editHold.holderParticipantId,
              holder_label: process.editHold.holder.displayLabel ?? "",
              expires_at: process.editHold.expiresAt.toISOString(),
              hold_version: process.editHold.aggregateVersion,
            },
          }
        : {}),
      // The revision a detach would append after. Zero on the global path,
      // where there is no draft to detach from.
      draft_revision: process?.currentRevision?.revision ?? 0,
      composition_media_ids: composition,
      media_revision: asset.mediaRevision,
      media_lifecycle: asset.lifecycle,
      committed_release_count: committed,
      referencing_draft_count: referencingProcessIds.size,
    };
  }
}

/**
 * The safety policy identity is an explicit institution fact. Without it there
 * is no policy to route against, so the port returns `null` rather than
 * assuming a default bar.
 */
const readSafetyPolicy = (
  payload: unknown,
): { policy_ref: string; policy_head: number } | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as { contentSafetyPolicyRef?: unknown; contentSafetyPolicyHead?: unknown };
  if (
    typeof record.contentSafetyPolicyRef !== "string" ||
    !Number.isSafeInteger(record.contentSafetyPolicyHead) ||
    (record.contentSafetyPolicyHead as number) < 1
  ) {
    return null;
  }
  return {
    policy_ref: record.contentSafetyPolicyRef,
    policy_head: record.contentSafetyPolicyHead as number,
  };
};
