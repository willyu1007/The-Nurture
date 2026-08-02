import type {
  GuardianBoardReadPort,
  GuardianBoardScopeFacts,
  RawBoardSourceHead,
  RawGuardianActivity,
  RawGuardianCharter,
  RawGuardianFocusGoal,
} from "@the-nurture/scenario/harness";
import {
  activeRoleWindow,
  boardHead,
  censusHead,
  censusOf,
  censusOfTimes,
  highestVersion,
  nonEmpty,
  sourceHeadPair,
  type BoardCensus,
  type BoardPrisma,
} from "./board-read-support.js";

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
  constructor(private readonly prisma: BoardPrisma) {}

  /**
   * The Guardian board is scoped to one family. A guardian who reaches several
   * child-care processes therefore reaches several families; the board binds to
   * the earliest-created one and never mixes enrollments across families,
   * because a mixed board would present one family's label over another
   * family's activity.
   */
  private async resolveReach(
    workspaceId: string,
    participantId: string,
    at: Date,
  ): Promise<GuardianReach | null> {
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: { id: participantId, workspaceId, status: "active", deletedAt: null },
    });
    if (!participant) return null;

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: { workspaceId, participantId, role: "guardian", ...activeRoleWindow(at) },
      orderBy: { createdAt: "asc" },
    });
    if (roles.length === 0) return null;

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
    const family = families[0];
    if (!family) return null;

    const reachingRole = roles.find(
      (role) =>
        (role.scopeType === "child_care_process" && role.scopeId === family.childCareProcessId) ||
        (role.scopeType === "family" && role.scopeId === family.id),
    );
    if (!reachingRole) return null;

    return {
      participant_active: true,
      family_id: family.id,
      family_label: family.displayName ?? "",
      family_ref_key: `${workspaceId}:${family.childCareProcessId}`,
      child_care_process_id: family.childCareProcessId,
      role_version: reachingRole.aggregateVersion,
      family_version: family.aggregateVersion,
    };
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
  }): Promise<GuardianBoardScopeFacts> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach) return UNAUTHORIZED_SCOPE;

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
      eligible_enrollments: enrollments.map((enrollment) => ({
        enrollment_id: enrollment.id,
        display_label: enrollment.careGroup.name,
      })),
      // Owner-issued eligibility. The Guardian may adjust current focus because
      // the focus owner accepts the write, not because the role reads "guardian".
      surface_action_grants: [],
      module_action_grants: {
        guardian_current_focus: [
          {
            capability_key: "update_guardian_current_focus",
            capability_version: "1.0.0",
            availability: "available",
          },
        ],
      },
    };
  }

  async loadGuardianCurrentFocus(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
  }): Promise<{
    authorized: boolean;
    charter?: RawGuardianCharter;
    goals: RawGuardianFocusGoal[];
    heads: RawBoardSourceHead[];
  }> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
    if (!reach) return { authorized: false, goals: [], heads: [] };

    const grantCensus = await this.grantCensus(input.workspace_id, reach.child_care_process_id);
    const authority = {
      guardian_authority_current: true,
      child_association_exact: true,
      enrollment_visible: true,
      grant_visible: grantCensus.count > 0,
      purpose_allowed: true,
    };

    const charterRow = await this.prisma.nurtureFamilyCharter.findFirst({
      where: {
        workspaceId: input.workspace_id,
        familyRefKey: reach.family_ref_key,
        status: "active",
        deletedAt: null,
      },
      include: { items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const cycles = await this.prisma.nurtureFocusCycle.findMany({
      where: {
        workspaceId: input.workspace_id,
        familyRefKey: reach.family_ref_key,
        status: "active",
        deletedAt: null,
      },
      include: {
        goals: {
          include: {
            childScopes: {
              where: { deletedAt: null },
              include: {
                childCareProcess: { include: { child: { select: { displayName: true } } } },
              },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }, { id: "asc" }],
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const goals: RawGuardianFocusGoal[] = [];
    for (const cycle of cycles) {
      for (const goal of cycle.goals) {
        // Child scope comes from the explicit scope fact only. A child hint
        // inside `goalPayload` never becomes a child focus card.
        const scope = goal.childScopes[0];
        goals.push({
          goal_id: goal.id,
          cycle_id: cycle.id,
          label: goal.goalKey ?? "",
          priority: goal.priority ?? 99,
          occurred_at: goal.updatedAt.toISOString(),
          source_label: "family_focus_cycle",
          child_scope_explicit: Boolean(scope),
          ...(scope
            ? {
                child_care_process_id: scope.childCareProcessId,
                child_safe_label: scope.childCareProcess.child.displayName ?? "",
              }
            : {}),
          authority,
          action_grants: [
            {
              capability_key: "update_guardian_current_focus",
              capability_version: "1.0.0",
              availability: "available" as const,
              target_option_id: goal.id,
              target_kind: "focus_goal",
            },
          ],
        });
      }
    }

    const heads: RawBoardSourceHead[] = [
      ...cycles.map((cycle) => ({
        source_kind: "focus_cycle" as const,
        source_id: cycle.id,
        fact_version: cycle.aggregateVersion,
        ...sourceHeadPair(
          "focus_cycle",
          [cycle.status, cycle.deletedAt?.toISOString() ?? null, cycle.updatedAt.toISOString()],
          grantCensus,
        ),
      })),
      ...(charterRow
        ? [
            {
              source_kind: "family_charter" as const,
              source_id: charterRow.id,
              fact_version: charterRow.aggregateVersion,
              ...sourceHeadPair(
                "family_charter",
                [
                  charterRow.status,
                  charterRow.deletedAt?.toISOString() ?? null,
                  charterRow.updatedAt.toISOString(),
                ],
                grantCensus,
              ),
            },
          ]
        : []),
    ];

    return {
      authorized: true,
      ...(charterRow
        ? {
            charter: {
              charter_id: charterRow.id,
              label: charterRow.status ?? "family_charter",
              items: charterRow.items.map((item) => ({
                item_id: item.id,
                label: item.itemKey ?? "",
              })),
              authority,
            },
          }
        : {}),
      goals,
      heads,
    };
  }

  async listGuardianEnrollmentActivity(input: {
    workspace_id: string;
    participant_id: string;
    enrollment_id: string;
    snapshot_at: string;
    take: number;
    before?: { occurred_at: string; id: string };
  }): Promise<{
    authorized: boolean;
    rows: RawGuardianActivity[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
  }> {
    const at = new Date(input.snapshot_at);
    const reach = await this.resolveReach(input.workspace_id, input.participant_id, at);
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
    const authority = {
      guardian_authority_current: true,
      child_association_exact: true,
      enrollment_visible: true,
      grant_visible: grantCensus.count > 0,
      purpose_allowed: true,
    };

    const before = input.before ? new Date(input.before.occurred_at) : undefined;
    const [releases, logs] = await Promise.all([
      // A publication is visible only through its own committed, still-visible
      // release for this exact target.
      this.prisma.nurturePublicationRelease.findMany({
        where: {
          workspaceId: input.workspace_id,
          visibility: "visible",
          target: { enrollmentId: enrollment.id },
          ...(before ? { committedAt: { lte: before } } : {}),
        },
        include: { publishProcess: { select: { dataClass: true, processKey: true } } },
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
          ...(before ? { updatedAt: { lte: before } } : {}),
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: input.take + 1,
      }),
    ]);

    const merged: RawGuardianActivity[] = [
      ...releases.map((release) => ({
        activity_id: release.id,
        kind:
          release.publishProcess.dataClass === "child_growth_record"
            ? ("child_growth_record" as const)
            : ("media" as const),
        release_id: release.id,
        source_label: "publication_release",
        occurred_at: release.committedAt.toISOString(),
        summary: release.publishProcess.processKey,
        authority,
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
        authority,
        action_grants: [],
      })),
    ].sort((left, right) =>
      left.occurred_at === right.occurred_at
        ? right.activity_id.localeCompare(left.activity_id)
        : right.occurred_at.localeCompare(left.occurred_at),
    );

    const afterCursor = input.before
      ? merged.filter(
          (row) =>
            row.occurred_at < input.before!.occurred_at ||
            (row.occurred_at === input.before!.occurred_at && row.activity_id < input.before!.id),
        )
      : merged;
    const page = afterCursor.slice(0, input.take);

    const enrollmentIds = nonEmpty([enrollment.id]) ?? [];
    const heads: RawBoardSourceHead[] = enrollmentIds.map((id) => ({
      source_kind: "enrollment" as const,
      source_id: id,
      fact_version: enrollment.aggregateVersion,
      ...sourceHeadPair(
        "enrollment",
        [enrollment.status, enrollment.updatedAt.toISOString()],
        grantCensus,
      ),
    }));

    return {
      authorized: true,
      rows: page,
      has_more: afterCursor.length > page.length,
      heads,
    };
  }
}
