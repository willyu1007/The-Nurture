import type {
  AttributionSourceV1,
  CaregiverFactAuthorityV1,
  ContentSafetySourceReadPort,
  ContentSafetySourceSignalV1,
  MediaAttributionFactsV1,
  MediaAttributionReadPort,
  MediaLifecycleFactsV1,
  MediaLifecycleReadPort,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

/**
 * The owner's attribution sources and the board's are separate vocabularies.
 * The mapping is explicit and total, so a new owner value is a compile error
 * rather than something that quietly presents as a manual teacher decision.
 */
const ATTRIBUTION_SOURCE = {
  manual: "manual",
  face_reference: "automatic_face_match",
  history_match: "organizer_candidate",
  system: "organizer_candidate",
} as const satisfies Record<string, AttributionSourceV1>;

type CaregiverReach = { care_group_id: string; role: string };

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

  private async resolveReach(
    workspaceId: string,
    participantId: string,
    at: Date,
  ): Promise<CaregiverReach | null> {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: { id: participantId, workspaceId, status: "active", deletedAt: null },
    });
    if (!participant) return null;
    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId,
        participantId,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        ...activeRoleWindow(at),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    for (const role of roles) {
      const group = await this.prisma.nurtureCareGroup.findFirst({
        where: { id: role.scopeId, workspaceId, status: "active", deletedAt: null },
      });
      if (group) return { care_group_id: group.id, role: role.role };
    }
    return null;
  }

  private authority(reach: CaregiverReach, sourceCareGroupId: string | null): CaregiverFactAuthorityV1 {
    return {
      role: reach.role,
      role_scope_type: "care_group",
      role_scope_matches_source: sourceCareGroupId === reach.care_group_id,
      role_assignment_current: true,
      fact_visible: true,
      purpose_allowed: true,
    };
  }

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
        fact_kind: capture.kind === "voice_transcript" ? "voice_transcript" : "teacher_text",
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
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, new Date());
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
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
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
      authority: this.authority(reach, asset.careGroupId),
      media_lifecycle: asset.lifecycle,
      // The decision binds to the exact immutable original, never to "whatever
      // the asset looks like now".
      media_revision: asset.mediaRevision,
      // Only children of this exact CareGroup; a child of a sibling class is
      // not an attribution target however visible they are in the photo.
      eligible_child_ids: enrollments.map((enrollment) => enrollment.childCareProcessId),
      attributions: asset.attributions.map((attribution) => ({
        attribution_id: attribution.id,
        child_care_process_id: attribution.childCareProcessId,
        status: attribution.state,
        revision: attribution.attributionRevision,
        source: ATTRIBUTION_SOURCE[attribution.source],
      })),
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
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach) return null;
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: input.media_asset_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!asset) return null;

    const process = input.process_key
      ? await this.prisma.nurturePublishProcess.findFirst({
          where: { workspaceId: input.workspace_id, processKey: input.process_key },
          include: { currentRevision: true },
        })
      : null;
    if (input.process_key && !process) return null;

    const composition = process
      ? readCompositionMediaIds(process.currentRevision?.mediaCompositionPayload ?? null)
      : [];

    // Every unreleased draft that still cites this asset. "Discard globally" is
    // refused while another card would lose its content silently.
    const referencingRevisions = await this.prisma.nurturePublishProcessRevision.findMany({
      where: {
        workspaceId: input.workspace_id,
        currentOf: { is: { state: { in: ["draft", "needs_review", "pending_release"] } } },
      },
      select: { id: true, mediaCompositionPayload: true, publishProcessId: true },
    });
    const referencingProcessIds = new Set(
      referencingRevisions
        .filter((revision) =>
          readCompositionMediaIds(revision.mediaCompositionPayload).includes(asset.id),
        )
        .map((revision) => revision.publishProcessId),
    );

    const committed = process
      ? await this.prisma.nurturePublicationRelease.count({
          where: { workspaceId: input.workspace_id, publishProcessId: process.id },
        })
      : await this.prisma.nurturePublicationRelease.count({
          where: {
            workspaceId: input.workspace_id,
            revision: {
              is: { publishProcess: { is: { careGroupId: reach.care_group_id } } },
            },
            publishProcess: { is: { careGroupId: reach.care_group_id } },
          },
        });

    return {
      authority: this.authority(reach, asset.careGroupId),
      process_state: process?.state ?? "draft",
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

/** A malformed composition contributes no media ids rather than a partial set. */
const readCompositionMediaIds = (payload: unknown): string[] => {
  if (typeof payload !== "object" || payload === null) return [];
  const media = (payload as { mediaAssetIds?: unknown }).mediaAssetIds;
  return Array.isArray(media) && media.every((entry) => typeof entry === "string")
    ? (media as string[])
    : [];
};
