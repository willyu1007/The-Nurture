import type {
  GuardianFactAuthorityV1,
  BoardSortKeyV1,
  GuardianBoardReadPort,
  GuardianBoardScopeFacts,
  ProtectedContentEnvelopeV1,
  ProtectedContentWritePort,
  RawBoardSourceHead,
  RawGuardianActivity,
} from "@the-nurture/scenario/harness";
import { assertProtectedContentEnvelopeV1 } from "@the-nurture/scenario/harness";
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

/**
 * "Strictly after this position" in `occurred_at desc, id desc`, pushed into the
 * query.
 *
 * The earlier version selected `<= before` and then dropped the cursor row in
 * memory. That silently spent the `take + 1` lookahead on a row it was about to
 * discard, so from the second page onwards a full page reported `has_more:
 * false` — the caller was told the list was complete while most of it was
 * unreachable. Filtering in SQL keeps the lookahead meaning what it says.
 */
const strictlyAfter = (before: BoardSortKeyV1, timeField: "committedAt" | "updatedAt") => {
  const at = new Date(before.occurred_at);
  return {
    OR: [
      { [timeField]: { lt: at } },
      { [timeField]: at, id: { lt: before.id } },
    ],
  };
};

/**
 * The last rank in the frozen `priority` vocabulary (1..99). A goal the owner
 * never ranked sorts last, and says so, rather than being silently coalesced
 * into a rank the family never chose.
 */
const PUBLISHABLE_DATA_CLASSES = ["daily_care_log", "child_growth_record"] as const;

const GUARDIAN_ACTIVITY_KIND: Record<
  (typeof PUBLISHABLE_DATA_CLASSES)[number],
  RawGuardianActivity["kind"]
> = {
  daily_care_log: "daily_care",
  child_growth_record: "child_growth_record",
};

/**
 * The authority that made one row visible, measured against that row's own
 * Grant, Enrollment and child association.
 *
 * The earlier version built a single object per request with four fields
 * hardcoded `true` and the fifth answering "does this family hold any active
 * grant at all". Under it, revoking one Grant withdrew nothing while any other
 * grant survived — consent withdrawal had no effect until the last one went.
 */
const factAuthority = (
  reach: GuardianReach,
  row: {
    child_care_process_id: string;
    grant: { status: string; deletedAt: Date | null; dataClasses: string[]; purposes: string[] } | null;
    enrollment_active: boolean;
    data_class: string;
    purpose_key: string | null;
  },
): GuardianFactAuthorityV1 => {
  const grantLive = Boolean(row.grant && row.grant.status === "active" && row.grant.deletedAt === null);
  return {
    guardian_authority_current: true,
    child_association_exact: row.child_care_process_id === reach.child_care_process_id,
    enrollment_visible: row.enrollment_active,
    grant_visible: grantLive,
    // A fact reaches the family under the exact class and purpose its Grant
    // admitted; a Grant narrowed after delivery stops covering it.
    purpose_allowed:
      grantLive &&
      row.grant!.dataClasses.includes(row.data_class) &&
      (row.purpose_key === null || row.grant!.purposes.includes(row.purpose_key)),
  };
};

const UNAUTHORIZED_SCOPE: GuardianBoardScopeFacts = {
  authorized: false,
  family_id: "",
  family_label: "",
  snapshot_version: 0,
  drift_heads: {
    source_head: "",
    authority_head: "",
    correction_head: "",
    redaction_head: "",
    grant_head: "",
  },
  eligible_enrollments: [],
  surface_action_grants: [],
  module_action_grants: {},
};

type GuardianReach = {
  participant_active: boolean;
  family_id: string;
  family_label: string;
  family_ref_key: string;
  child_care_process_id: string;
  role_version: number;
  family_version: number;
};

/**
 * Owner-side Guardian board reads (G3-A). Every row carries the authority that
 * made it visible, so the presenter filters on facts rather than on role names,
 * and nothing here writes or caches a board snapshot.
 */
export class PrismaGuardianBoardReadPort implements GuardianBoardReadPort {
  constructor(
    private readonly prisma: BoardPrisma,
    private readonly protectedContent?: ProtectedContentWritePort,
  ) {}

  /** Family-visible copy must come from protected owner content, never an internal key. */
  private safePublicationSummary(payload: unknown): string {
    if (!this.protectedContent || payload === null || typeof payload !== "object") return "";
    try {
      assertProtectedContentEnvelopeV1(payload);
      return this.protectedContent.unseal(payload as ProtectedContentEnvelopeV1);
    } catch {
      return "";
    }
  }

  /**
   * The Guardian board is scoped to one family. A guardian who reaches several
   * child-care processes therefore reaches several families; the board binds to
   * the earliest-created one and never mixes enrollments across families,
   * because a mixed board would present one family's label over another
   * family's activity.
   */
  /** Every family this guardian currently reaches, earliest-created first. */
  private async resolveReachableFamilies(
    workspaceId: string,
    participantId: string,
    at: Date,
  ): Promise<GuardianReach[]> {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: { id: participantId, workspaceId, status: "active", deletedAt: null },
    });
    if (!participant) return [];

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: { workspaceId, participantId, role: "guardian", ...activeRoleWindow(at) },
      orderBy: { createdAt: "asc" },
    });
    if (roles.length === 0) return [];

    const processIds = new Set<string>();
    const familyIds = new Set<string>();
    for (const role of roles) {
      if (role.scopeType === "child_care_process") processIds.add(role.scopeId);
      else if (role.scopeType === "family") familyIds.add(role.scopeId);
    }
    const families = await this.prisma.nurtureFamily.findMany({
      where: {
        workspaceId,
        status: "active",
        deletedAt: null,
        OR: [
          ...(processIds.size > 0 ? [{ childCareProcessId: { in: [...processIds] } }] : []),
          ...(familyIds.size > 0 ? [{ id: { in: [...familyIds] } }] : []),
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const reaches: GuardianReach[] = [];
    for (const family of families) {
      const reachingRole = roles.find(
        (role) =>
          (role.scopeType === "child_care_process" &&
            role.scopeId === family.childCareProcessId) ||
          (role.scopeType === "family" && role.scopeId === family.id),
      );
      if (!reachingRole) continue;
      reaches.push({
        participant_active: true,
        family_id: family.id,
        family_label: family.displayName ?? "",
        family_ref_key: `${workspaceId}:${family.childCareProcessId}`,
        child_care_process_id: family.childCareProcessId,
        role_version: reachingRole.aggregateVersion,
        family_version: family.aggregateVersion,
      });
    }
    return reaches;
  }

  /**
   * The board binds to one family: the requested one (when reachable), the
   * unique one, or the earliest — never a mix. A multi-child guardian selects
   * through the owner-issued enrollment option, which rebinds the board.
   */
  private async resolveReach(
    workspaceId: string,
    participantId: string,
    at: Date,
    bindFamilyId?: string,
  ): Promise<GuardianReach | null> {
    const reaches = await this.resolveReachableFamilies(workspaceId, participantId, at);
    if (bindFamilyId) {
      return reaches.find((reach) => reach.family_id === bindFamilyId) ?? null;
    }
    return reaches[0] ?? null;
  }

  /** The Grant census drives both the Grant drift head and every visibility head. */
  private async grantCensus(workspaceId: string, processId: string): Promise<BoardCensus> {
    const grants = await this.prisma.nurtureChildLinkGrant.findMany({
      where: { workspaceId, childCareProcessId: processId, status: "active", deletedAt: null },
      select: { updatedAt: true },
    });
    return censusOf(grants);
  }

  async loadGuardianScope(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
    bind_family_id?: string;
  }): Promise<GuardianBoardScopeFacts> {
    const at = new Date(input.snapshot_at);
    const reaches = await this.resolveReachableFamilies(
      input.workspace_id,
      input.participant_id,
      at,
    );
    const reach = input.bind_family_id
      ? reaches.find((entry) => entry.family_id === input.bind_family_id)
      : reaches[0];
    if (!reach) return UNAUTHORIZED_SCOPE;
    // The option candidate set spans every reachable family; the board's own
    // binding stays the one family above.
    const allEligibleEnrollments = (
      await this.prisma.nurtureEnrollment.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: { in: reaches.map((entry) => entry.child_care_process_id) },
          status: "active",
          deletedAt: null,
          institution: { status: "active", deletedAt: null },
          careGroup: { status: "active", deletedAt: null },
        },
        include: { careGroup: { select: { name: true } } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    ).map((enrollment) => ({
      enrollment_id: enrollment.id,
      family_id:
        reaches.find((entry) => entry.child_care_process_id === enrollment.childCareProcessId)
          ?.family_id ?? reach.family_id,
      display_label: enrollment.careGroup.name,
    }));

    const [enrollments, roles, grants, corrections, redactions, focusCycles, charters] =
      await Promise.all([
        this.prisma.nurtureEnrollment.findMany({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: reach.child_care_process_id,
            status: "active",
            deletedAt: null,
            institution: { status: "active", deletedAt: null },
            careGroup: { status: "active", deletedAt: null },
          },
          include: { careGroup: { select: { name: true } } },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        this.prisma.nurtureCareRoleAssignment.findMany({
          where: {
            workspaceId: input.workspace_id,
            participantId: input.participant_id,
            ...activeRoleWindow(at),
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureChildLinkGrant.findMany({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: reach.child_care_process_id,
            status: "active",
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        // Corrections are append-only, so the census reads their creation time.
        this.prisma.nurtureFamilyCareMessageCorrection.findMany({
          where: {
            workspaceId: input.workspace_id,
            message: { childCareProcessId: reach.child_care_process_id },
          },
          select: { createdAt: true },
        }),
        this.prisma.nurturePublicationVisibilityEvent.findMany({
          where: {
            workspaceId: input.workspace_id,
            publicationRelease: {
              target: { childCareProcessId: reach.child_care_process_id },
            },
          },
          select: { occurredAt: true },
        }),
        this.prisma.nurtureFocusCycle.findMany({
          where: {
            workspaceId: input.workspace_id,
            familyRefKey: reach.family_ref_key,
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
        this.prisma.nurtureFamilyCharter.findMany({
          where: {
            workspaceId: input.workspace_id,
            familyRefKey: reach.family_ref_key,
            deletedAt: null,
          },
          select: { updatedAt: true, aggregateVersion: true },
        }),
      ]);

    const grantCensus = censusOf(grants);
    return {
      authorized: true,
      family_id: reach.family_id,
      family_label: reach.family_label,
      snapshot_version: highestVersion(
        [{ aggregateVersion: reach.family_version }, { aggregateVersion: reach.role_version }],
        enrollments,
        grants,
        focusCycles,
        charters,
      ),
      drift_heads: {
        source_head: boardHead("guardian.source", [
          censusHead("focus", censusOf(focusCycles)),
          censusHead("charter", censusOf(charters)),
        ]),
        authority_head: boardHead("guardian.authority", [
          censusHead("role", censusOf(roles)),
          censusHead("enrollment", censusOf(enrollments)),
        ]),
        correction_head: censusHead(
          "guardian.correction",
          censusOfTimes(corrections.map((row) => row.createdAt)),
        ),
        // A redaction removes an already-delivered fact, so an open page must
        // not survive one even though nothing it listed was edited.
        redaction_head: censusHead(
          "guardian.redaction",
          censusOfTimes(redactions.map((row) => row.occurredAt)),
        ),
        grant_head: censusHead("guardian.grant", grantCensus),
      },
      eligible_enrollments: allEligibleEnrollments,
      // Owner-issued eligibility. (The guardian current-focus write was ceded
      // to My-Chat cultivation in surface contract 1.16.0 — D-T009-01.)
      surface_action_grants: [],
      module_action_grants: {},
    };
  }

  async listGuardianEnrollmentActivity(input: {
    workspace_id: string;
    participant_id: string;
    enrollment_id: string;
    snapshot_at: string;
    bind_family_id?: string;
    take: number;
    before?: BoardSortKeyV1;
  }): Promise<{
    authorized: boolean;
    rows: RawGuardianActivity[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
  }> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(
      input.workspace_id,
      input.participant_id,
      at,
      input.bind_family_id,
    );
    if (!reach) return { authorized: false, rows: [], has_more: false, heads: [] };

    // The Enrollment must still belong to the reached family at read time; a
    // selection made one page earlier is never trusted on its own.
    const enrollment = await this.prisma.nurtureEnrollment.findFirst({
      where: {
        id: input.enrollment_id,
        workspaceId: input.workspace_id,
        childCareProcessId: reach.child_care_process_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!enrollment) return { authorized: false, rows: [], has_more: false, heads: [] };

    const grantCensus = await this.grantCensus(input.workspace_id, reach.child_care_process_id);

    const [releases, logs] = await Promise.all([
      // A publication is visible only through its own committed, still-visible
      // release for this exact target.
      this.prisma.nurturePublicationRelease.findMany({
        where: {
          workspaceId: input.workspace_id,
          visibility: "visible",
          target: { enrollmentId: enrollment.id },
          publishProcess: { dataClass: { in: [...PUBLISHABLE_DATA_CLASSES] } },
          ...(input.before ? strictlyAfter(input.before, "committedAt") : {}),
        },
        include: {
          publishProcess: {
            select: {
              dataClass: true,
              purposeKey: true,
            },
          },
          revision: { select: { titleProtectionPayload: true } },
          target: { include: { grant: true, enrollment: true } },
        },
        orderBy: [{ committedAt: "desc" }, { id: "desc" }],
        take: input.take + 1,
      }),
      this.prisma.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          enrollmentId: enrollment.id,
          status: "shared",
          deletedAt: null,
          grantId: { not: null },
          ...(input.before ? strictlyAfter(input.before, "updatedAt") : {}),
        },
        include: { grant: true, enrollment: true },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: input.take + 1,
      }),
    ]);

    const merged: RawGuardianActivity[] = [
      ...releases.map((release) => ({
        activity_id: release.id,
        kind: GUARDIAN_ACTIVITY_KIND[
          release.publishProcess.dataClass as (typeof PUBLISHABLE_DATA_CLASSES)[number]
        ],
        release_id: release.id,
        source_label: "publication_release",
        occurred_at: release.committedAt.toISOString(),
        summary: this.safePublicationSummary(
          release.revision.titleProtectionPayload,
        ),
        // Measured against this row's own Grant. A scope-level "does the family
        // hold any grant" would keep a revoked Grant's facts on the board for as
        // long as one unrelated grant survived.
        authority: factAuthority(reach, {
          child_care_process_id: release.target.childCareProcessId,
          grant: release.target.grant,
          enrollment_active:
            release.target.enrollment.status === "active" &&
            release.target.enrollment.deletedAt === null,
          data_class: release.publishProcess.dataClass,
          purpose_key: release.publishProcess.purposeKey,
        }),
        action_grants: [],
      })),
      ...logs.map((log) => ({
        activity_id: log.id,
        kind: "daily_care" as const,
        // Daily care reaches the family through its routing Receipt rather than
        // a publication; that Receipt is the release event for this card.
        release_id: log.id,
        source_label: "daily_care_log",
        occurred_at: log.updatedAt.toISOString(),
        summary: log.summary ?? "",
        authority: factAuthority(reach, {
          child_care_process_id: log.childCareProcessId,
          grant: log.grant,
          enrollment_active:
            log.enrollment.status === "active" && log.enrollment.deletedAt === null,
          data_class: "daily_care_log",
          purpose_key: null,
        }),
        action_grants: [],
      })),
    ].sort((left, right) =>
      left.occurred_at === right.occurred_at
        ? right.activity_id.localeCompare(left.activity_id)
        : right.occurred_at.localeCompare(left.occurred_at),
    );

    const page = merged.slice(0, input.take);

    const heads: RawBoardSourceHead[] = [
      {
        source_kind: "enrollment",
        source_id: enrollment.id,
        fact_version: enrollment.aggregateVersion,
        ...sourceHeadPair(
          "enrollment",
          [enrollment.status, enrollment.updatedAt.toISOString()],
          grantCensus,
        ),
      },
    ];

    return {
      authorized: true,
      rows: page,
      has_more: merged.length > page.length,
      heads,
    };
  }
}
