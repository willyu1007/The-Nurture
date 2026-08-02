import type {
  CaregiverBoardReadPort,
  CaregiverBoardScopeFacts,
  CaregiverFactAuthorityV1,
  RawBoardSourceHead,
  RawCaregiverAttention,
  RawCaregiverChildToday,
  RawCaregiverDailyCare,
} from "@the-nurture/scenario/harness";
import {
  activeRoleWindow,
  boardHead,
  censusHead,
  censusOf,
  censusOfTimes,
  highestVersion,
  sourceHeadPair,
  type BoardCensus,
  type BoardPrisma,
} from "./board-read-support.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

const UNAUTHORIZED_SCOPE: CaregiverBoardScopeFacts = {
  authorized: false,
  care_group_id: "",
  care_group_label: "",
  snapshot_version: 0,
  drift_heads: {
    source_head: "",
    authority_head: "",
    correction_head: "",
    redaction_head: "",
    grant_head: "",
  },
  authority: {
    role: "",
    role_scope_type: "",
    role_scope_matches_source: false,
    role_assignment_current: false,
    fact_visible: false,
    purpose_allowed: false,
  },
  surface_action_grants: [],
  module_action_grants: {},
  publication_policy_resolved: false,
};

type CaregiverReach = {
  care_group_id: string;
  care_group_label: string;
  institution_id: string;
  role_assignment_id: string;
  role: string;
  role_version: number;
  care_group_version: number;
};

/**
 * The owner's attention priorities and the board's are separate vocabularies.
 * Mapping them explicitly keeps a new owner value a compile error rather than
 * something that quietly presents as the least urgent board priority.
 */
const ATTENTION_PRIORITY = {
  normal: "routine",
  attention: "attention",
  time_sensitive: "urgent",
} as const satisfies Record<string, RawCaregiverAttention["priority"]>;

const DAILY_CARE_KINDS = [
  ["mealPayload", "meal"],
  ["napPayload", "nap"],
  ["moodPayload", "mood"],
  ["activityPayload", "activity"],
  ["healthObservationPayload", "health_observation"],
] as const;

/**
 * Owner-side Caregiver board reads (G3-A). The caregiver lane is bound to the
 * exact source CareGroup: a role assignment scoped anywhere else — the
 * institution, a sibling class — reads nothing, and that judgement travels with
 * each row so the presenter never has to re-derive it from a role name.
 */
export class PrismaCaregiverBoardReadPort implements CaregiverBoardReadPort {
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

    // Only a CareGroup-scoped caregiver role reaches a board. An
    // institution-scoped assignment is deliberately not widened here.
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
      if (!group) continue;
      return {
        care_group_id: group.id,
        care_group_label: group.name,
        institution_id: group.institutionId,
        role_assignment_id: role.id,
        role: role.role,
        role_version: role.aggregateVersion,
        care_group_version: group.aggregateVersion,
      };
    }
    return null;
  }

  private authorityFor(reach: CaregiverReach, sourceCareGroupId: string): CaregiverFactAuthorityV1 {
    return {
      role: reach.role,
      role_scope_type: "care_group",
      role_scope_matches_source: sourceCareGroupId === reach.care_group_id,
      role_assignment_current: true,
      fact_visible: true,
      purpose_allowed: true,
    };
  }

  private async grantCensus(workspaceId: string, careGroupId: string): Promise<BoardCensus> {
    const grants = await this.prisma.nurtureChildLinkGrant.findMany({
      where: {
        workspaceId,
        grantedToScopeType: "care_group",
        grantedToScopeId: careGroupId,
        status: "active",
        deletedAt: null,
      },
      select: { updatedAt: true },
    });
    return censusOf(grants);
  }

  async loadCaregiverScope(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
  }): Promise<CaregiverBoardScopeFacts> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach) return UNAUTHORIZED_SCOPE;

    const [logs, attention, roles, enrollments, grants, corrections, redactions, institution] =
      await Promise.all([
        this.prisma.nurtureDailyCareLog.findMany({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: reach.care_group_id,
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureTeacherAttentionItem.findMany({
          where: { workspaceId: input.workspace_id, careGroupId: reach.care_group_id },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureCareRoleAssignment.findMany({
          where: {
            workspaceId: input.workspace_id,
            participantId: input.participant_id,
            ...activeRoleWindow(at),
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureEnrollment.findMany({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: reach.care_group_id,
            status: "active",
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureChildLinkGrant.findMany({
          where: {
            workspaceId: input.workspace_id,
            grantedToScopeType: "care_group",
            grantedToScopeId: reach.care_group_id,
            status: "active",
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureFamilyCareMessageCorrection.findMany({
          where: {
            workspaceId: input.workspace_id,
            message: { careGroupId: reach.care_group_id },
          },
          select: { createdAt: true },
        }),
        this.prisma.nurturePublicationVisibilityEvent.findMany({
          where: {
            workspaceId: input.workspace_id,
            publicationRelease: { publishProcess: { careGroupId: reach.care_group_id } },
          },
          select: { occurredAt: true },
        }),
        this.prisma.nurtureCareInstitution.findFirst({
          where: { id: reach.institution_id, workspaceId: input.workspace_id },
          select: { policyConfigPayload: true },
        }),
      ]);

    return {
      authorized: true,
      care_group_id: reach.care_group_id,
      care_group_label: reach.care_group_label,
      snapshot_version: highestVersion(
        [
          { aggregateVersion: reach.care_group_version },
          { aggregateVersion: reach.role_version },
        ],
        logs,
        attention,
        enrollments,
        grants,
      ),
      drift_heads: {
        source_head: boardHead("caregiver.source", [
          censusHead("daily_care", censusOf(logs)),
          censusHead("attention", censusOf(attention)),
        ]),
        authority_head: boardHead("caregiver.authority", [
          censusHead("role", censusOf(roles)),
          censusHead("enrollment", censusOf(enrollments)),
        ]),
        correction_head: censusHead(
          "caregiver.correction",
          censusOfTimes(corrections.map((row) => row.createdAt)),
        ),
        redaction_head: censusHead(
          "caregiver.redaction",
          censusOfTimes(redactions.map((row) => row.occurredAt)),
        ),
        grant_head: censusHead("caregiver.grant", censusOf(grants)),
      },
      authority: this.authorityFor(reach, reach.care_group_id),
      surface_action_grants: [],
      module_action_grants: {
        caregiver_child_today: [
          {
            capability_key: "record_caregiver_daily_care",
            capability_version: "1.0.0",
            availability: "available",
          },
        ],
      },
      // The publish queue may list work without a policy, but nothing can be
      // scheduled until the institution has actually resolved a send window.
      publication_policy_resolved: isPublicationPolicyResolved(
        institution?.policyConfigPayload ?? null,
      ),
    };
  }

  async listCaregiverChildToday(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    snapshot_at: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{
    authorized: boolean;
    rows: RawCaregiverChildToday[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
  }> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach || reach.care_group_id !== input.care_group_id) {
      return { authorized: false, rows: [], has_more: false, heads: [] };
    }

    const grantCensus = await this.grantCensus(input.workspace_id, reach.care_group_id);
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: reach.care_group_id,
        status: "active",
        deletedAt: null,
      },
      include: { childCareProcess: { include: { child: { select: { displayName: true } } } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const rows: RawCaregiverChildToday[] = [];
    for (const enrollment of enrollments) {
      const [logs, attention] = await Promise.all([
        this.prisma.nurtureDailyCareLog.findMany({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: reach.care_group_id,
            childCareProcessId: enrollment.childCareProcessId,
            status: { in: ["recorded", "shared"] },
            deletedAt: null,
          },
          orderBy: [{ logDate: "desc" }, { id: "desc" }],
        }),
        this.prisma.nurtureTeacherAttentionItem.findMany({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: reach.care_group_id,
            childCareProcessId: enrollment.childCareProcessId,
            status: "active",
          },
          orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
        }),
      ]);

      const authority = this.authorityFor(reach, reach.care_group_id);
      const dailyCare: RawCaregiverDailyCare[] = logs.flatMap((log) =>
        DAILY_CARE_KINDS.filter(([field]) => log[field] !== null).map(([, kind]) => ({
          log_id: log.id,
          kind,
          summary: log.summary ?? "",
          occurred_at: log.logDate.toISOString(),
          authority,
          action_grants: [],
        })),
      );
      const attentionCards: RawCaregiverAttention[] = attention.map((item) => ({
        attention_item_id: item.id,
        priority: ATTENTION_PRIORITY[item.priority],
        summary: item.summary ?? item.title,
        ...(item.effectiveDate ? { effective_date: item.effectiveDate.toISOString() } : {}),
        source_kind: item.sourceType,
        authority,
        // An attention card routes to the capability of the fact that raised
        // it; the board never offers a blanket "resolve everything" write.
        action_grants: [],
      }));

      rows.push({
        child_care_process_id: enrollment.childCareProcessId,
        child_safe_label: enrollment.childCareProcess.child.displayName ?? "",
        occurred_at: enrollment.updatedAt.toISOString(),
        daily_care: dailyCare,
        attention: attentionCards,
        authority,
        action_grants: [
          {
            capability_key: "record_caregiver_daily_care",
            capability_version: "1.0.0",
            availability: "available" as const,
            target_option_id: enrollment.childCareProcessId,
            target_kind: "child_care_process",
          },
        ],
      });
    }

    const afterCursor = input.before
      ? rows.filter(
          (row) =>
            row.occurred_at < input.before!.occurred_at ||
            (row.occurred_at === input.before!.occurred_at &&
              row.child_care_process_id < input.before!.id),
        )
      : rows;
    const page = afterCursor.slice(0, input.take);

    return {
      authorized: true,
      rows: page,
      has_more: afterCursor.length > page.length,
      heads: [
        {
          source_kind: "care_group_role",
          source_id: reach.role_assignment_id,
          fact_version: reach.role_version,
          ...sourceHeadPair(
            "care_group_role",
            [reach.role, reach.care_group_id, reach.role_version],
            grantCensus,
          ),
        },
      ],
    };
  }
}

/**
 * A resolved publication policy is an explicit institution fact. An absent or
 * malformed payload is "not resolved" — never a default window.
 */
const isPublicationPolicyResolved = (payload: unknown): boolean =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as { publicationPolicyRef?: unknown }).publicationPolicyRef ===
    "nurture.institution-publication-policy@1.0.0";
