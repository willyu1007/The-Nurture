import type { Prisma, PrismaClient } from "@prisma/client";
import {
  NurtureInstitutionAuthorityChain,
  resolveEffectiveSchedule,
  type NurtureContentRevisionFactsResult,
  type NurtureContentRevisionSubjectKind,
  type NurtureContentRevisionTarget,
  type NurtureContentRevisionTransaction,
  type NurtureContentRevisionV1,
  type NurtureContentRevisionValueV1,
  type NurturePlacementRevisionValueV1,
} from "@the-nurture/scenario/harness";
import { PrismaClassSchedulePlacementRepository } from "./class-schedule-placement.repository.js";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";
import { asJson } from "./prisma-json.js";

const MAX_COMPLETE_CHAIN = 1_000;

const subjectRef = (
  kind: "care_capture" | "media_asset_ref" | "activity_placement",
  id: string,
): string => `nurture:${kind}:${id}`;

type ResolvedTarget = {
  subject_ref: string;
  care_group_ref: string;
  institution_ref: string;
  placement?: {
    id: string;
    local_date: Date;
    state: "placed" | "unplaced";
    activity_ref: string | null;
    decided_by: NurturePlacementRevisionValueV1["decided_by"];
    placement_head: number;
  };
};

type RevisionRow = {
  id: string;
  subjectRef: string;
  subjectKind: NurtureContentRevisionSubjectKind;
  previousValue: unknown;
  newValue: unknown;
  decidedByBefore: NurturePlacementRevisionValueV1["decided_by"] | null;
  actorRoleAssignmentId: string;
  reason: string;
  supersedesRef: string | null;
  revisionHead: number;
  contractVersion: string;
  occurredAt: Date;
};

const toDomainRevision = (row: RevisionRow): NurtureContentRevisionV1 => ({
  contract_version: row.contractVersion as NurtureContentRevisionV1["contract_version"],
  revision_ref: row.id,
  subject_ref: row.subjectRef,
  subject_kind: row.subjectKind,
  previous_value: row.previousValue as NurtureContentRevisionValueV1,
  new_value: row.newValue as NurtureContentRevisionValueV1,
  ...(row.decidedByBefore ? { decided_by_before: row.decidedByBefore } : {}),
  actor_ref: row.actorRoleAssignmentId,
  reason: row.reason,
  ...(row.supersedesRef ? { supersedes_ref: row.supersedesRef } : {}),
  revision_head: row.revisionHead,
  occurred_at: row.occurredAt.toISOString(),
});

/**
 * 0D-3's exact owner adapter. The canonical 0C chain decides authority; this
 * class resolves a subject, returns a complete bounded chain and performs the
 * append. It contains no downscope or note rule.
 */
export class PrismaContentRevisionRepository implements NurtureContentRevisionTransaction {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  private async resolveTarget(
    workspaceId: string,
    subjectKind: NurtureContentRevisionSubjectKind,
    target: NurtureContentRevisionTarget,
  ): Promise<ResolvedTarget | null> {
    if (subjectKind === "placement") {
      if (target.target_kind !== "activity_placement") return null;
      const placement = await this.prisma.nurtureActivityPlacement.findFirst({
        where: {
          workspaceId,
          sourceKind: target.source_kind,
          sourceId: target.source_ref,
        },
        include: { careGroup: { select: { institutionId: true } } },
      });
      if (!placement) return null;
      return {
        subject_ref: subjectRef("activity_placement", placement.id),
        care_group_ref: placement.careGroupId,
        institution_ref: placement.careGroup.institutionId,
        placement: {
          id: placement.id,
          local_date: placement.localDate,
          state: placement.state,
          activity_ref: placement.activityRef,
          decided_by: placement.decidedBy,
          placement_head: placement.placementHead,
        },
      };
    }

    if (target.target_kind === "activity_placement") return null;
    if (target.target_kind === "care_capture") {
      const capture = await this.prisma.nurtureCareCapture.findFirst({
        where: { id: target.target_ref, workspaceId, deletedAt: null },
        include: { careGroup: { select: { institutionId: true } } },
      });
      return capture
        ? {
            subject_ref: subjectRef("care_capture", capture.id),
            care_group_ref: capture.careGroupId,
            institution_ref: capture.careGroup.institutionId,
          }
        : null;
    }
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: { id: target.target_ref, workspaceId, deletedAt: null },
      include: { careGroup: { select: { institutionId: true } } },
    });
    if (!asset?.careGroupId || !asset.careGroup) return null;
    return {
      subject_ref: subjectRef("media_asset_ref", asset.id),
      care_group_ref: asset.careGroupId,
      institution_ref: asset.careGroup.institutionId,
    };
  }

  private async availableActivityRefs(
    workspaceId: string,
    target: ResolvedTarget,
  ): Promise<string[]> {
    if (!target.placement) return [];
    const localDate = target.placement.local_date.toISOString().slice(0, 10);
    const layers = await new PrismaClassSchedulePlacementRepository(
      this.prisma,
    ).loadScheduleLayers({
      workspace_id: workspaceId,
      institution_ref: target.institution_ref,
      care_group_ref: target.care_group_ref,
      local_date: localDate,
    });
    const schedule = resolveEffectiveSchedule({
      care_group_ref: target.care_group_ref,
      local_date: localDate,
      layers,
    });
    return schedule ? [...new Set(schedule.slots.map((slot) => slot.slot_ref))].sort() : [];
  }

  async loadContentRevisionFacts(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    subject_kind: NurtureContentRevisionSubjectKind;
    target: NurtureContentRevisionTarget;
  }): Promise<NurtureContentRevisionFactsResult> {
    try {
      const target = await this.resolveTarget(
        input.workspace_id,
        input.subject_kind,
        input.target,
      );
      if (!target) return { status: "denied", reason_code: "not_authorized" };

      // Reuse the exact 0C-1 -> 0C-2 -> 0C-3 chain. The repository supplies
      // only the class locator; role, scope and Institution all come from the
      // stored assignment selected by that chain.
      const authority = await new NurtureInstitutionAuthorityChain(
        new PrismaInstitutionContextRepository(this.prisma),
      ).resolve({
        workspace_id: input.workspace_id,
        participant_ref: input.participant_ref,
        role_assignment_ref: input.role_assignment_ref,
        at: new Date().toISOString(),
        target: {
          object_type: "care_group",
          object_id: target.care_group_ref,
          lifecycle_state: "active",
        },
      });
      if (authority.status === "denied") {
        return authority.reason_code === "policy_unavailable"
          ? { status: "unavailable", reason_code: authority.reason_code }
          : { status: "denied", reason_code: authority.reason_code };
      }

      const rows = await this.prisma.nurtureContentRevision.findMany({
        where: {
          workspaceId: input.workspace_id,
          subjectKind: input.subject_kind,
          subjectRef: target.subject_ref,
        },
        orderBy: [{ revisionHead: "asc" }, { id: "asc" }],
        take: MAX_COMPLETE_CHAIN + 1,
      });
      if (rows.length > MAX_COMPLETE_CHAIN) {
        return { status: "unavailable", reason_code: "revision_chain_limit_exceeded" };
      }
      return {
        status: "resolved",
        facts: {
          subject_ref: target.subject_ref,
          subject_kind: input.subject_kind,
          actor_role_assignment_ref: authority.active_role.role_assignment_ref,
          revisions: rows.map(toDomainRevision),
          ...(target.placement
            ? {
                current_placement: {
                  state: target.placement.state,
                  activity_ref: target.placement.activity_ref,
                  decided_by: target.placement.decided_by,
                  placement_head: target.placement.placement_head,
                },
                available_activity_refs: await this.availableActivityRefs(
                  input.workspace_id,
                  target,
                ),
              }
            : {}),
        },
      };
    } catch {
      return { status: "unavailable", reason_code: "content_revision_owner_unavailable" };
    }
  }

  async appendContentRevision(
    input: Parameters<NurtureContentRevisionTransaction["appendContentRevision"]>[0],
  ): ReturnType<NurtureContentRevisionTransaction["appendContentRevision"]> {
    const target = await this.resolveTarget(input.workspace_id, input.subject_kind, input.target);
    if (!target || target.subject_ref !== input.subject_ref) return { committed: false };

    let placementHead: number | undefined;
    if (input.subject_kind === "placement") {
      const next = input.new_value as NurturePlacementRevisionValueV1;
      if (!target.placement || input.expected_placement_head === undefined) {
        return { committed: false };
      }
      const updated = await this.prisma.nurtureActivityPlacement.updateMany({
        where: {
          id: target.placement.id,
          workspaceId: input.workspace_id,
          careGroupId: target.care_group_ref,
          placementHead: input.expected_placement_head,
        },
        data: {
          state: next.state,
          activityRef: next.activity_ref,
          decidedBy: "admin",
          placementHead: { increment: 1 },
          aggregateVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) return { committed: false };
      placementHead = input.expected_placement_head + 1;
    }

    const row = await this.prisma.nurtureContentRevision.create({
      data: {
        workspaceId: input.workspace_id,
        subjectRef: input.subject_ref,
        subjectKind: input.subject_kind,
        previousValue: asJson(input.previous_value),
        newValue: asJson(input.new_value),
        decidedByBefore: input.decided_by_before,
        actorRoleAssignmentId: input.actor_role_assignment_ref,
        reason: input.reason,
        supersedesRef: input.supersedes_ref,
        revisionHead: input.revision_head,
        commandRequestIdHash: input.command_request_id_hash,
        contractVersion: "1.0.0",
      },
    });
    return {
      committed: true,
      revision: toDomainRevision(row),
      ...(placementHead !== undefined ? { placement_head: placementHead } : {}),
    };
  }
}
