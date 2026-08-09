import type { PrismaClient } from "@prisma/client";
import type {
  NurtureInstitutionSupportSignalPolicyV1,
  NurtureInstitutionSupportSignalRepository,
} from "@the-nurture/scenario/harness";

type SupportSignalSourceReader = Pick<
  NurtureInstitutionSupportSignalRepository,
  "loadAuthorizedSources"
>;

/**
 * Policy SSOT reader plus delegation to exact source owners. This repository
 * never re-implements attendance, communication, WorkItem or Workflow state.
 */
export class PrismaInstitutionSupportSignalRepository
  implements NurtureInstitutionSupportSignalRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly sources: SupportSignalSourceReader,
  ) {}

  loadAuthorizedSources(
    input: Parameters<SupportSignalSourceReader["loadAuthorizedSources"]>[0],
  ) {
    return this.sources.loadAuthorizedSources(input);
  }

  async loadEffectivePolicies(input: {
    workspace_id: string;
    institution_ref: string;
    snapshot_at: string;
  }): Promise<NurtureInstitutionSupportSignalPolicyV1[]> {
    const at = new Date(input.snapshot_at);
    if (Number.isNaN(at.getTime())) throw new RangeError("invalid support-signal snapshot");
    const rows = await this.prisma.nurtureInstitutionSupportSignalPolicy.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
        institution: {
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      },
      include: {
        careGroup: {
          select: {
            workspaceId: true,
            institutionId: true,
            status: true,
            deletedAt: true,
          },
        },
        changedByRoleAssignment: {
          select: { workspaceId: true, role: true, scopeType: true, scopeId: true },
        },
      },
      orderBy: [
        { category: "asc" },
        { careGroupId: "asc" },
        { policyRevision: "desc" },
        { id: "asc" },
      ],
    });
    return rows.flatMap((row): NurtureInstitutionSupportSignalPolicyV1[] => {
      const actor = row.changedByRoleAssignment;
      if (
        actor.workspaceId !== input.workspace_id ||
        actor.role !== "institution_admin" ||
        actor.scopeType !== "institution" ||
        actor.scopeId !== input.institution_ref
      ) {
        throw new Error("support-signal policy has no exact Admin audit actor");
      }
      if (
        row.careGroup &&
        (row.careGroup.workspaceId !== input.workspace_id ||
          row.careGroup.institutionId !== input.institution_ref ||
          row.careGroup.status !== "active" ||
          row.careGroup.deletedAt !== null)
      ) {
        return [];
      }
      return [
        {
          contract_version: row.contractVersion,
          policy_ref: row.policyRef,
          workspace_id: row.workspaceId,
          institution_ref: row.institutionId,
          ...(row.careGroupId ? { care_group_ref: row.careGroupId } : {}),
          category: row.category,
          ...(row.absoluteThreshold !== null
            ? { absolute_threshold: row.absoluteThreshold }
            : {}),
          window_key: row.windowKey,
          checkpoint_ref: row.checkpointRef,
          enabled: row.enabled,
          policy_revision: row.policyRevision,
          effective_from: row.effectiveFrom.toISOString(),
          ...(row.effectiveTo ? { effective_to: row.effectiveTo.toISOString() } : {}),
          changed_by_role_assignment_ref: row.changedByRoleAssignmentId,
          change_reason: row.changeReason,
        },
      ];
    });
  }
}
