import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ATTRIBUTION_CORRECTION_CONTRACT,
  NurtureInstitutionAuthorityChain,
  type NurtureAttributionCorrectionCandidateTransaction,
  type NurtureAttributionCorrectionCandidateReadResult,
  type NurtureAttributionCorrectionCandidateV1,
  type NurtureAttributionCorrectionFactsResult,
  type NurtureCareRole,
} from "@the-nurture/scenario";
import { activeRoleWindow } from "./board-read-support.js";
import { PrismaInstitutionContextRepository } from "./institution-context.repository.js";

const MAX_CANDIDATES_PER_SOURCE = 1_000;

type CorrectionPrisma = PrismaClient | Prisma.TransactionClient;

type ResolvedSource = {
  source_attribution_ref: string;
  care_group_ref: string;
};

type ResolvedActor = {
  role_assignment_ref: string;
  role_kind: NurtureCareRole;
};

type ActorResolution =
  | { status: "resolved"; actor: ResolvedActor }
  | { status: "denied"; reason_code: "not_authorized" }
  | { status: "unavailable"; reason_code: "policy_unavailable" };

type CandidateRow = {
  id: string;
  sourceAttributionId: string;
  raisedByRoleAssignmentId: string;
  reason: string;
  contractVersion: string;
  occurredAt: Date;
};

const toDomainCandidate = (
  row: CandidateRow,
): NurtureAttributionCorrectionCandidateV1 | null =>
  row.contractVersion === ATTRIBUTION_CORRECTION_CONTRACT.version
    ? {
        contract_version: ATTRIBUTION_CORRECTION_CONTRACT.version,
        candidate_ref: row.id,
        source_attribution_ref: row.sourceAttributionId,
        raised_by_role_assignment_ref: row.raisedByRoleAssignmentId,
        reason: row.reason,
        occurred_at: row.occurredAt.toISOString(),
      }
    : null;

/**
 * Exact-owner adapter for 0D-4. The source attribution chooses the class;
 * authority is resolved against that class and an explicitly selected role.
 * This repository writes only the non-canonical report row.
 */
export class PrismaAttributionCorrectionCandidateRepository
  implements NurtureAttributionCorrectionCandidateTransaction
{
  constructor(private readonly prisma: CorrectionPrisma) {}

  private async resolveSource(
    workspaceId: string,
    sourceAttributionRef: string,
  ): Promise<ResolvedSource | null> {
    const attribution = await this.prisma.nurtureChildMediaAttribution.findFirst({
      where: {
        id: sourceAttributionRef,
        workspaceId,
        deletedAt: null,
        mediaAssetRef: { deletedAt: null },
      },
      select: { id: true, mediaAssetRefId: true },
    });
    if (!attribution) return null;
    const asset = await this.prisma.nurtureMediaAssetRef.findFirst({
      where: {
        id: attribution.mediaAssetRefId,
        workspaceId,
        deletedAt: null,
        careGroupId: { not: null },
      },
      select: { careGroupId: true },
    });
    if (!asset?.careGroupId) return null;
    const careGroup = await this.prisma.nurtureCareGroup.findFirst({
      where: {
        id: asset.careGroupId,
        workspaceId,
        status: "active",
        deletedAt: null,
        institution: { workspaceId, status: "active", deletedAt: null },
      },
      select: { id: true },
    });
    if (!careGroup) return null;
    return {
      source_attribution_ref: attribution.id,
      care_group_ref: careGroup.id,
    };
  }

  private async resolveActor(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source: ResolvedSource;
  }): Promise<ActorResolution> {
    const at = new Date();
    const selected = await this.prisma.nurtureCareRoleAssignment.findFirst({
      where: {
        id: input.role_assignment_ref,
        workspaceId: input.workspace_id,
        participantId: input.participant_ref,
        participant: {
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
        ...activeRoleWindow(at),
      },
      select: { id: true, role: true, scopeType: true, scopeId: true },
    });
    if (!selected) return { status: "denied", reason_code: "not_authorized" };

    if (selected.role === "institution_admin") {
      const authority = await new NurtureInstitutionAuthorityChain(
        new PrismaInstitutionContextRepository(this.prisma),
      ).resolve({
        workspace_id: input.workspace_id,
        participant_ref: input.participant_ref,
        role_assignment_ref: selected.id,
        at: at.toISOString(),
        target: {
          object_type: "care_group",
          object_id: input.source.care_group_ref,
          lifecycle_state: "active",
        },
      });
      if (authority.status === "denied") {
        return authority.reason_code === "policy_unavailable"
          ? { status: "unavailable", reason_code: "policy_unavailable" }
          : { status: "denied", reason_code: "not_authorized" };
      }
      return {
        status: "resolved",
        actor: {
          role_assignment_ref: authority.active_role.role_assignment_ref,
          role_kind: authority.active_role.role_kind,
        },
      };
    }

    if (
      (selected.role === "caregiver" || selected.role === "lead_caregiver") &&
      selected.scopeType === "care_group" &&
      selected.scopeId === input.source.care_group_ref
    ) {
      return {
        status: "resolved",
        actor: { role_assignment_ref: selected.id, role_kind: selected.role },
      };
    }
    return { status: "denied", reason_code: "not_authorized" };
  }

  async loadAttributionCorrectionFacts(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source_attribution_ref: string;
  }): Promise<NurtureAttributionCorrectionFactsResult> {
    try {
      const source = await this.resolveSource(
        input.workspace_id,
        input.source_attribution_ref,
      );
      if (!source) return { status: "denied", reason_code: "not_authorized" };
      const actor = await this.resolveActor({ ...input, source });
      if (actor.status !== "resolved") return actor;

      return {
        status: "resolved",
        facts: {
          source_attribution_ref: source.source_attribution_ref,
          actor_role_assignment_ref: actor.actor.role_assignment_ref,
          actor_role_kind: actor.actor.role_kind,
        },
      };
    } catch {
      return { status: "unavailable", reason_code: "attribution_correction_owner_unavailable" };
    }
  }

  async listAttributionCorrectionCandidates(input: {
    workspace_id: string;
    participant_ref: string;
    role_assignment_ref: string;
    source_attribution_ref: string;
  }): Promise<NurtureAttributionCorrectionCandidateReadResult> {
    const authority = await this.loadAttributionCorrectionFacts(input);
    if (authority.status !== "resolved") return authority;
    try {
      const rows = await this.prisma.nurtureAttributionCorrectionCandidate.findMany({
        where: {
          workspaceId: input.workspace_id,
          sourceAttributionId: authority.facts.source_attribution_ref,
        },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
        take: MAX_CANDIDATES_PER_SOURCE + 1,
      });
      if (rows.length > MAX_CANDIDATES_PER_SOURCE) {
        return { status: "unavailable", reason_code: "candidate_read_limit_exceeded" };
      }
      const candidates = rows.map(toDomainCandidate);
      if (candidates.some((candidate) => candidate === null)) {
        return { status: "unavailable", reason_code: "candidate_contract_mismatch" };
      }
      return {
        status: "resolved",
        source_attribution_ref: authority.facts.source_attribution_ref,
        candidates: candidates as NurtureAttributionCorrectionCandidateV1[],
      };
    } catch {
      return { status: "unavailable", reason_code: "attribution_correction_owner_unavailable" };
    }
  }

  async appendAttributionCorrectionCandidate(
    input: Parameters<
      NurtureAttributionCorrectionCandidateTransaction["appendAttributionCorrectionCandidate"]
    >[0],
  ): ReturnType<
    NurtureAttributionCorrectionCandidateTransaction["appendAttributionCorrectionCandidate"]
  > {
    const source = await this.resolveSource(input.workspace_id, input.source_attribution_ref);
    if (!source) return null;
    const actor = await this.resolveActor({ ...input, source });
    if (actor.status !== "resolved" || actor.actor.role_kind !== "institution_admin") {
      return null;
    }
    const row = await this.prisma.nurtureAttributionCorrectionCandidate.create({
      data: {
        workspaceId: input.workspace_id,
        sourceAttributionId: source.source_attribution_ref,
        raisedByRoleAssignmentId: actor.actor.role_assignment_ref,
        reason: input.reason,
        commandRequestIdHash: input.command_request_id_hash,
        contractVersion: ATTRIBUTION_CORRECTION_CONTRACT.version,
      },
    });
    return toDomainCandidate(row);
  }
}
