import type {
  BoardSortKeyV1,
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
  aggregateCensus,
  boardHead,
  caregiverRowAuthority,
  censusHead,
  censusOf,
  censusOfTimes,
  highestVersion,
  resolveCaregiverReach,
  sourceHeadPair,
  type BoardCensus,
  type BoardPrisma,
} from "./board-read-support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";

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
 * "Strictly after this position" in the declared class-list order. The three
 * branches are the lexicographic comparison written out, because the order
 * mixes directions and cannot be expressed as a single row comparison.
 *
 * A cursor issued before the rank term existed carries no label; it is then
 * compared on the two terms it does have, which is exactly what it meant.
 */
const strictlyAfter = (before: BoardSortKeyV1) => {
  const sameLabel = before.rank === undefined ? {} : {
    childCareProcess: { child: { displayName: before.rank } },
  };
  const withinLabel = [
    { ...sameLabel, updatedAt: { lt: new Date(before.occurred_at) } },
    {
      ...sameLabel,
      updatedAt: new Date(before.occurred_at),
      childCareProcessId: { gt: before.id },
    },
  ];
  return before.rank === undefined
    ? { OR: withinLabel }
    : {
        OR: [
          { childCareProcess: { child: { displayName: { gt: before.rank } } } },
          ...withinLabel,
        ],
      };
};

/**
 * Owner-side Caregiver board reads (G3-A). The caregiver lane is bound to the
 * exact source CareGroup: a role assignment scoped anywhere else — the
 * institution, a sibling class — reads nothing, and that judgement travels with
 * each row so the presenter never has to re-derive it from a role name.
 */
export class PrismaCaregiverBoardReadPort implements CaregiverBoardReadPort {
  constructor(private readonly prisma: BoardPrisma) {}

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
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
    if (!reach) return UNAUTHORIZED_SCOPE;

    const [logs, attention, roles, enrollments, grants, corrections, redactions, publicationPolicy] =
      await Promise.all([
        aggregateCensus((args) =>
          this.prisma.nurtureDailyCareLog.aggregate({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: reach.care_group_id,
              deletedAt: null,
            },
            ...args,
          }),
        ),
        aggregateCensus((args) =>
          this.prisma.nurtureTeacherAttentionItem.aggregate({
            where: { workspaceId: input.workspace_id, careGroupId: reach.care_group_id },
            ...args,
          }),
        ),
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
        loadCurrentInstitutionPublicationPolicy(this.prisma, {
          workspace_id: input.workspace_id,
          institution_id: reach.institution_id,
          at,
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
        enrollments,
        grants,
      ),
      drift_heads: {
        source_head: boardHead("caregiver.source", [
          censusHead("daily_care", logs),
          censusHead("attention", attention),
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
      authority: caregiverRowAuthority(reach, reach.care_group_id) as CaregiverFactAuthorityV1,
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
      publication_policy_resolved: publicationPolicy !== null,
    };
  }

  async listCaregiverChildToday(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    snapshot_at: string;
    take: number;
    before?: BoardSortKeyV1;
  }): Promise<{
    authorized: boolean;
    rows: RawCaregiverChildToday[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
  }> {
    const at = new Date(input.snapshot_at);
    const reach = await resolveCaregiverReach(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      at,
    );
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
        ...(input.before ? strictlyAfter(input.before) : {}),
      },
      include: { childCareProcess: { include: { child: { select: { displayName: true } } } } },
      // Exactly CAREGIVER_CHILD_TODAY_ORDER: the class list is ordered by child
      // label, and the cursor's leading rank is that same label.
      orderBy: [
        { childCareProcess: { child: { displayName: "asc" } } },
        { updatedAt: "desc" },
        { childCareProcessId: "asc" },
      ],
      take: input.take + 1,
    });

    // "Today" is the snapshot day. The earlier query had no date bound and no
    // limit, so a child enrolled a year returned a year of logs — a module
    // named `child_today` answering with something else entirely. The day is
    // taken in UTC; the institution's local day needs the T-007 timezone, which
    // is recorded as a G3-E input rather than guessed here.
    const dayStart = new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
    );
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const processIds = enrollments.map((enrollment) => enrollment.childCareProcessId);

    // One query per fact kind for the whole page, not two per child.
    const [pageLogs, pageAttention] = await Promise.all([
      processIds.length === 0
        ? []
        : this.prisma.nurtureDailyCareLog.findMany({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: reach.care_group_id,
              childCareProcessId: { in: processIds },
              logDate: { gte: dayStart, lt: dayEnd },
              status: { in: ["recorded", "shared"] },
              deletedAt: null,
            },
            orderBy: [{ logDate: "desc" }, { id: "desc" }],
          }),
      processIds.length === 0
        ? []
        : this.prisma.nurtureTeacherAttentionItem.findMany({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: reach.care_group_id,
              childCareProcessId: { in: processIds },
              status: "active",
            },
            orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
          }),
    ]);
    const logsByChild = new Map<string, typeof pageLogs>();
    for (const log of pageLogs) {
      const bucket = logsByChild.get(log.childCareProcessId) ?? [];
      bucket.push(log);
      logsByChild.set(log.childCareProcessId, bucket);
    }
    const attentionByChild = new Map<string, typeof pageAttention>();
    for (const item of pageAttention) {
      const bucket = attentionByChild.get(item.childCareProcessId) ?? [];
      bucket.push(item);
      attentionByChild.set(item.childCareProcessId, bucket);
    }

    const rows: RawCaregiverChildToday[] = [];
    for (const enrollment of enrollments) {
      const logs = logsByChild.get(enrollment.childCareProcessId) ?? [];
      const attention = attentionByChild.get(enrollment.childCareProcessId) ?? [];

      const authority = caregiverRowAuthority(reach, reach.care_group_id) as CaregiverFactAuthorityV1;
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

    const page = rows.slice(0, input.take);

    return {
      authorized: true,
      rows: page,
      has_more: rows.length > page.length,
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
