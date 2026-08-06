import type {
  InstitutionPublicationPolicyReadPort,
  InstitutionPublicationPolicyV1,
} from "@the-nurture/scenario/harness";
import { validateInstitutionPublicationPolicy } from "@the-nurture/scenario/harness";
import type { BoardPrisma } from "./board-read-support.js";

type PublicationPolicyRow = {
  institutionId: string;
  policyRef: string;
  policyVersion: number;
  policyHead: number;
  timeZone: string;
  defaultReleaseLocalTime: string;
  retryCutoffLocalTime: string;
  organizeIdleSeconds: number;
  organizeFallbackLeadSeconds: number;
  automaticQuiescenceSeconds: number;
  captureActivityLeaseSeconds: number;
  automaticOrganizeEnabled: boolean;
  effectiveFrom: Date;
  supersededAt: Date | null;
};

const toPolicy = (row: PublicationPolicyRow): InstitutionPublicationPolicyV1 => ({
  policy_ref: row.policyRef,
  policy_head: row.policyHead,
  institution_ref: row.institutionId,
  policy_version: row.policyVersion,
  time_zone: row.timeZone,
  default_release_local_time: row.defaultReleaseLocalTime,
  retry_cutoff_local_time: row.retryCutoffLocalTime,
  organize_idle_seconds: row.organizeIdleSeconds,
  organize_fallback_lead_seconds: row.organizeFallbackLeadSeconds,
  automatic_quiescence_seconds: row.automaticQuiescenceSeconds,
  capture_activity_lease_seconds: row.captureActivityLeaseSeconds,
  automatic_organize_enabled: row.automaticOrganizeEnabled,
  effective_from: row.effectiveFrom.toISOString(),
  ...(row.supersededAt ? { effective_to: row.supersededAt.toISOString() } : {}),
});

/**
 * Reads the one effective policy for an exact Institution. Two matching rows
 * are ambiguous and therefore unavailable; a malformed row also fails closed.
 */
export const loadCurrentInstitutionPublicationPolicy = async (
  prisma: BoardPrisma,
  input: { workspace_id: string; institution_id: string; at: Date },
): Promise<InstitutionPublicationPolicyV1 | null> => {
  const [rows, historyHeads] = await Promise.all([
    prisma.nurtureInstitutionPublicationPolicy.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_id,
        effectiveFrom: { lte: input.at },
        OR: [{ supersededAt: null }, { supersededAt: { gt: input.at } }],
        institution: {
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      },
      orderBy: [{ effectiveFrom: "desc" }, { policyVersion: "desc" }],
      take: 2,
    }),
    prisma.nurtureInstitutionPublicationPolicy.aggregate({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_id,
        effectiveFrom: { lte: input.at },
      },
      _max: { policyVersion: true, policyHead: true },
    }),
  ]);
  if (rows.length !== 1) return null;
  if (
    rows[0]!.policyVersion !== historyHeads._max.policyVersion ||
    rows[0]!.policyHead !== historyHeads._max.policyHead
  ) {
    // A newly effective row may never move either owner head backwards. The
    // absent policy writer cannot be assumed to have enforced this for us.
    return null;
  }
  const policy = toPolicy(rows[0]!);
  return validateInstitutionPublicationPolicy(policy, input.at).status === "ok"
    ? policy
    : null;
};

export class PrismaInstitutionPublicationPolicyReadPort
  implements InstitutionPublicationPolicyReadPort
{
  constructor(private readonly prisma: BoardPrisma) {}

  async loadCurrentInstitutionPublicationPolicy(input: {
    workspace_id: string;
    institution_id: string;
    at: string;
  }): Promise<InstitutionPublicationPolicyV1 | null> {
    const at = new Date(input.at);
    if (Number.isNaN(at.getTime())) return null;
    return loadCurrentInstitutionPublicationPolicy(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: input.institution_id,
      at,
    });
  }
}
