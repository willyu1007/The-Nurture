import type { Prisma } from "@prisma/client";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  type NurtureCareCaptureTransaction,
  type NurtureOrganizeCaptureRow,
  type NurtureOrganizeCutFacts,
  type NurtureOrganizeCutApplyInput,
  type NurtureOrganizeCutApplied,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";
import { publishDraftCommandIdentity } from "./publish-process.transaction.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const domainRef = (objectType: string, objectId: string, version: number): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

const readSafetyPolicyIdentity = (
  payload: unknown,
): { policy_ref: string; policy_head: number } | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as { contentSafetyPolicyRef?: unknown; contentSafetyPolicyHead?: unknown };
  if (
    typeof record.contentSafetyPolicyRef !== "string" ||
    !Number.isSafeInteger(record.contentSafetyPolicyHead)
  ) {
    return null;
  }
  return {
    policy_ref: record.contentSafetyPolicyRef,
    policy_head: record.contentSafetyPolicyHead as number,
  };
};

const readMarkers = (payload: unknown): string[] | undefined => {
  // NULL means "never derived" and must stay distinguishable from [].
  if (payload === null || payload === undefined) return undefined;
  return Array.isArray(payload)
    ? payload.filter((entry): entry is string => typeof entry === "string")
    : undefined;
};

/**
 * Canonical-owner writes behind the manual organize cut. The batch transition
 * and — when the route allows one — the process, its first revision, its
 * targets and the safety assessment land in one command transaction: a cut
 * that organized the batch but lost its candidate would strand the captures
 * invisibly.
 */
export class PrismaCareCaptureTransaction implements NurtureCareCaptureTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadOrganizeCutFacts(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    command_request_id: string;
  }): Promise<NurtureOrganizeCutFacts | null> {
    const readAt = new Date();
    // Exact-group role lookup, not "the first group this participant reaches":
    // a caregiver of two classes organizes the one they named.
    const role = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        scopeId: input.care_group_id,
        ...activeRoleWindow(readAt),
      },
    });
    if (!role) return null;
    const group = await this.prisma.nurtureCareGroup.findFirst({
      where: {
        id: input.care_group_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      include: { institution: true },
    });
    if (!group || group.institution.status !== "active") return null;

    const publicationPolicy = await loadCurrentInstitutionPublicationPolicy(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: group.institutionId,
      at: readAt,
    });

    const batch = await this.prisma.nurtureCareCaptureBatch.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        state: "collecting",
      },
      include: {
        captures: {
          where: { deletedAt: null },
          orderBy: { sourceSequence: "asc" },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: readAt } }],
      },
      orderBy: { id: "asc" },
    });
    const processIds = [...new Set(enrollments.map((entry) => entry.childCareProcessId))];
    const [families, grants] = await Promise.all([
      this.prisma.nurtureFamily.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: { in: processIds },
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
      }),
      this.prisma.nurtureChildLinkGrant.findMany({
        where: {
          workspaceId: input.workspace_id,
          enrollmentId: { in: enrollments.map((entry) => entry.id) },
          status: "active",
          revokedAt: null,
          deletedAt: null,
          directions: { has: "org_to_family" },
          dataClasses: { has: "daily_care_log" },
          purposes: { has: "family_daily_care_update" },
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: readAt } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: readAt } }] },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ]);
    const familyByProcess = new Map(families.map((family) => [family.childCareProcessId, family]));
    const grantByEnrollment = new Map<string, (typeof grants)[number]>();
    for (const grant of grants) {
      if (!grantByEnrollment.has(grant.enrollmentId)) {
        grantByEnrollment.set(grant.enrollmentId, grant);
      }
    }

    return {
      authority: {
        role: role.role,
        role_scope_type: "care_group",
        role_scope_matches_source: true,
        role_assignment_current: true,
        fact_visible: true,
        purpose_allowed: true,
      } as NurtureOrganizeCutFacts["authority"],
      authorizing_role_assignment_id: role.id,
      care_group_id: input.care_group_id,
      read_at: readAt.toISOString(),
      ...(readSafetyPolicyIdentity(group.institution.policyConfigPayload ?? null)
        ? { safety_policy: readSafetyPolicyIdentity(group.institution.policyConfigPayload ?? null)! }
        : {}),
      ...(publicationPolicy ? { organize_policy: publicationPolicy } : {}),
      ...(batch
        ? {
            batch: {
              batch_id: batch.id,
              batch_version: batch.aggregateVersion,
              state: batch.state,
              captures: batch.captures.map(
                (capture): NurtureOrganizeCaptureRow => ({
                  capture_id: capture.id,
                  kind: capture.kind as NurtureOrganizeCaptureRow["kind"],
                  stable: capture.stable,
                  source_sequence: capture.sourceSequence,
                  occurred_at: capture.occurredAt.toISOString(),
                  ...(capture.bodyProtectionPayload !== null
                    ? { body_envelope: capture.bodyProtectionPayload }
                    : {}),
                  ...(capture.transcriptRevision
                    ? { transcript_revision: capture.transcriptRevision }
                    : {}),
                  ...(readMarkers(capture.safetyMarkersPayload) !== undefined
                    ? { safety_markers: readMarkers(capture.safetyMarkersPayload) }
                    : {}),
                  ...(capture.mediaAssetRefId
                    ? { media_asset_id: capture.mediaAssetRefId }
                    : {}),
                }),
              ),
            },
          }
        : {}),
      targets: enrollments.flatMap((enrollment) => {
        const family = familyByProcess.get(enrollment.childCareProcessId);
        const grant = grantByEnrollment.get(enrollment.id);
        if (!family || !grant) return [];
        return [
          {
            child_care_process_id: enrollment.childCareProcessId,
            enrollment_id: enrollment.id,
            family_id: family.id,
            grant_id: grant.id,
            enrollment_active: true,
            grant_allows: true,
          },
        ];
      }),
    };
  }

  async applyOrganizeCut(input: NurtureOrganizeCutApplyInput): Promise<NurtureOrganizeCutApplied> {
    const cutAt = new Date(input.watermark.cut_at);
    const observedUserActivityAt = new Date(input.trigger_evidence.observed_user_activity_at);
    const careGroupId = await this.batchGroupId(input);
    if (!careGroupId) throw new Error("nurture care capture: batch unavailable");
    // CAS against the exact version the head comparison already accepted —
    // second-line defence against a capture landing inside the window.
    const transitioned = await this.prisma.nurtureCareCaptureBatch.updateMany({
      where: {
        id: input.batch_id,
        workspaceId: input.workspace_id,
        state: "collecting",
        aggregateVersion: input.expected_batch_version,
      },
      data: {
        state: "organized",
        resolvedTrigger: input.trigger_evidence.trigger,
        triggerRequestId: input.command_request_id,
        policyRef: input.trigger_evidence.policy_ref,
        policyHead: input.trigger_evidence.policy_head,
        timeZone: input.trigger_evidence.time_zone,
        quiescenceSeconds: input.trigger_evidence.quiescence_seconds,
        observedUserActivityAt,
        watermarkSourceSequence: input.watermark.source_sequence,
        cutAt,
        aggregateVersion: { increment: 1 },
      },
    });
    if (transitioned.count !== 1) {
      throw new Error("nurture care capture: batch version conflict");
    }

    let processRef: CanonicalRef | undefined;
    let processId: string | undefined;
    if (input.process) {
      const composition = await Promise.all(
        input.process.media_asset_ids.map(async (mediaAssetId) => {
          const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
            where: {
              id: mediaAssetId,
              workspaceId: input.workspace_id,
              careGroupId,
              deletedAt: null,
            },
            select: { mediaRevision: true },
          });
          if (!asset) throw new Error("nurture care capture: media asset unavailable");
          return { media_asset_id: mediaAssetId, media_revision: asset.mediaRevision };
        }),
      );
      const process = await this.prisma.nurturePublishProcess.create({
        data: {
          workspaceId: input.workspace_id,
          careGroupId,
          captureBatchId: input.batch_id,
          processKey: input.process.process_key,
          state: input.process.state,
          dataClass: input.process.data_class as never,
          purposeKey: input.process.purpose_key,
          authorizingRoleAssignmentId: input.process.authorizing_role_assignment_id,
        },
      });
      const revision = await this.prisma.nurturePublishProcessRevision.create({
        data: {
          workspaceId: input.workspace_id,
          publishProcessId: process.id,
          revision: 1,
          contentDigest: input.process.content_digest,
          organizerInputRevision: input.organizer_input_revision,
          commandRequestIdHash: publishDraftCommandIdentity(input.command_request_id),
          titleProtectionPayload: asJson(input.process.title_envelope),
          ...(input.process.body_envelope !== undefined
            ? { bodyProtectionPayload: asJson(input.process.body_envelope) }
            : {}),
          mediaCompositionPayload: asJson({
            media: composition.map((entry) => ({
              mediaAssetId: entry.media_asset_id,
              mediaRevision: entry.media_revision,
            })),
          }),
          sourceRefsPayload: asJson(input.process.source_refs),
        },
      });
      await this.prisma.nurturePublishProcess.update({
        where: { id: process.id },
        data: { currentRevisionId: revision.id },
      });
      for (const target of input.process.targets) {
        await this.prisma.nurturePublishProcessTarget.create({
          data: {
            workspaceId: input.workspace_id,
            publishProcessId: process.id,
            targetKey: target.target_key,
            childCareProcessId: target.child_care_process_id,
            enrollmentId: target.enrollment_id,
            familyRefKey: `${input.workspace_id}:${target.family_id}`,
            grantId: target.grant_id,
          },
        });
      }
      processRef = domainRef("publish_process", process.id, process.aggregateVersion);
      processId = process.id;
    }

    // The route decision is addressable whichever way it went: the assessment
    // anchors on the CareGroup, and only optionally on a process.
    await this.prisma.nurtureContentSafetyAssessment.create({
      data: {
        workspaceId: input.workspace_id,
        ...(processId ? { publishProcessId: processId } : {}),
        careGroupId,
        organizerInputRevision: input.organizer_input_revision,
        route: input.safety.route as never,
        policyRef: input.safety.policy_ref,
        policyHead: input.safety.policy_head,
        ruleRevision: input.safety.rule_revision,
        riskCodesPayload: asJson(input.safety.risk_codes),
        // Body-free audit of exactly which sources the route judged; the
        // constraint requires an object, keyed by evidence kind.
        sourceHeadsPayload: asJson({ capture_ids: input.included_capture_ids }),
      },
    });

    return {
      batch_ref: domainRef(
        "care_capture_batch",
        input.batch_id,
        input.expected_batch_version + 1,
      ),
      ...(processRef ? { process_ref: processRef, process_revision: 1 } : {}),
    };
  }

  private groupIdByBatch = new Map<string, string>();

  private async batchGroupId(input: { workspace_id: string; batch_id: string }): Promise<string | null> {
    const cached = this.groupIdByBatch.get(input.batch_id);
    if (cached) return cached;
    const batch = await this.prisma.nurtureCareCaptureBatch.findFirst({
      where: { id: input.batch_id, workspaceId: input.workspace_id },
      select: { careGroupId: true },
    });
    if (!batch) return null;
    this.groupIdByBatch.set(input.batch_id, batch.careGroupId);
    return batch.careGroupId;
  }
}
