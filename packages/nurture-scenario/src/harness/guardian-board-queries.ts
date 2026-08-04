import { resolveTargetOptionRef } from "./keyed-refs.js";
import {
  buildPageInfo,
  computeDriftHead,
  guardianFactVisible,
  issueBoardOpaqueRef,
  issueSnapshotRef,
  parseBoardPageSize,
  projectOwnerActions,
  projectSourceHeads,
  resolveBoardCursor,
  scanBoardPage,
  type BoardActionRefV1,
  type BoardCursorIdentityV1,
  type BoardDriftHeadsV1,
  type BoardModuleBindingV1,
  type BoardPageInfoV1,
  type BoardQueryDecision,
  type BoardScopeV1,
  type BoardSortKeyV1,
  type GuardianFactAuthorityV1,
  type OwnerEligibilityGrantV1,
  type RawBoardSourceHead,
} from "./board-projection.js";
import type { InterfaceContractRefV1 } from "../surface-contract/types.js";

/**
 * G3-A Guardian module queries. The Guardian lane reads only Guardian-visible
 * facts, so no cross-role field has to be hidden by a presenter afterwards.
 */
export const QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY = {
  key: "query_guardian_current_focus",
  version: "1.0.0",
} as const;

export const QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY = {
  key: "query_guardian_enrollment_activity",
  version: "1.0.0",
} as const;

export const GUARDIAN_CURRENT_FOCUS_ORDER = "priority_asc,occurred_at_desc,id_asc";
export const GUARDIAN_ENROLLMENT_ACTIVITY_ORDER = "occurred_at_desc,id_desc";

// ---------------------------------------------------------------------------
// Raw owner rows (server-internal; never leave the projection).

export type GuardianBoardScopeFacts = {
  authorized: boolean;
  family_id: string;
  family_label: string;
  snapshot_version: number;
  drift_heads: BoardDriftHeadsV1;
  /**
   * Every Enrollment this guardian currently reaches, across EVERY family —
   * the option-ref candidate set. The board itself stays bound to ONE family
   * (`family_id` above); selecting an option from another family rebinds the
   * whole board rather than mixing families.
   */
  eligible_enrollments: Array<{
    enrollment_id: string;
    family_id: string;
    display_label: string;
  }>;
  /** Owner-issued surface- and module-scope eligibility. Without a grant the
   * presenter has nothing to project, whatever the role says. */
  surface_action_grants: OwnerEligibilityGrantV1[];
  module_action_grants: Record<string, OwnerEligibilityGrantV1[]>;
};

export type RawGuardianCharter = {
  charter_id: string;
  label: string;
  items: Array<{ item_id: string; label: string }>;
  authority: GuardianFactAuthorityV1;
};

export type RawGuardianFocusGoal = {
  goal_id: string;
  cycle_id: string;
  label: string;
  priority: number;
  occurred_at: string;
  source_label: string;
  /**
   * True only when the owner holds an explicit goal-to-ChildCareProcess scope
   * fact. A child hint inside `goalPayload` is never promoted to child scope.
   */
  child_scope_explicit: boolean;
  child_care_process_id?: string;
  child_safe_label?: string;
  authority: GuardianFactAuthorityV1;
  action_grants: OwnerEligibilityGrantV1[];
};

export type RawGuardianActivity = {
  activity_id: string;
  kind: "daily_care" | "child_growth_record" | "media";
  release_id: string;
  source_label: string;
  occurred_at: string;
  summary: string;
  authority: GuardianFactAuthorityV1;
  action_grants: OwnerEligibilityGrantV1[];
};

export type GuardianBoardReadPort = {
  loadGuardianScope(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
    /** Bind to this reachable family instead of the unique/earliest default. */
    bind_family_id?: string;
  }): Promise<GuardianBoardScopeFacts>;
  loadGuardianCurrentFocus(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
    bind_family_id?: string;
  }): Promise<{
    authorized: boolean;
    charter?: RawGuardianCharter;
    goals: RawGuardianFocusGoal[];
    heads: RawBoardSourceHead[];
  }>;
  listGuardianEnrollmentActivity(input: {
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
  }>;
};

export type GuardianBoardDependencies = {
  contract: InterfaceContractRefV1;
  integrity_key: string;
  reads: GuardianBoardReadPort;
  now?: () => Date;
};

/**
 * A scope already resolved by the caller, at a stated instant.
 *
 * A board envelope is one derived result at one snapshot, but each module used
 * to resolve the scope again on its own clock — so an envelope was assembled
 * from three reads at three instants, and a Grant revoked between the first and
 * the last left the envelope and its modules disagreeing about the same scope.
 * The envelope resolves once and passes the result down; a module called on its
 * own still resolves for itself.
 */
export type ResolvedGuardianScopeV1 = {
  facts: GuardianBoardScopeFacts;
  snapshot_at: string;
};

// ---------------------------------------------------------------------------
// Public typed results.

export type GuardianFocusCardV1 = {
  focusRef: string;
  cycleRef: string;
  label: string;
  priority: number;
  scopeSource: "family_scope" | "explicit_child_scope";
  childRef?: string;
  childSafeLabel?: string;
  provenance: { sourceLabel: string; occurredAt: string };
  actions: BoardActionRefV1[];
};

export type GuardianCurrentFocusOutputV1 = {
  binding: BoardModuleBindingV1;
  familyDirection?: {
    charterRef: string;
    label: string;
    items: Array<{ itemRef: string; label: string }>;
  };
  familyFocus: GuardianFocusCardV1[];
  childFocus: GuardianFocusCardV1[];
  pageInfo: BoardPageInfoV1;
};

export type GuardianEnrollmentActivityItemV1 = {
  activityRef: string;
  kind: "daily_care" | "child_growth_record" | "media";
  releaseRef: string;
  sourceLabel: string;
  occurredAt: string;
  summary: string;
  actions: BoardActionRefV1[];
};

export type GuardianEnrollmentActivityOutputV1 = {
  binding: BoardModuleBindingV1;
  enrollmentRef: string;
  items: GuardianEnrollmentActivityItemV1[];
  pageInfo: BoardPageInfoV1;
};

// ---------------------------------------------------------------------------

const guardianScopeRef = (
  deps: GuardianBoardDependencies,
  scope: BoardScopeV1,
  facts: GuardianBoardScopeFacts,
): string => issueBoardOpaqueRef(deps.integrity_key, scope, "family", facts.family_id);

export const queryGuardianCurrentFocus = async (
  deps: GuardianBoardDependencies,
  request: BoardScopeV1 & {
    resolved_scope?: ResolvedGuardianScopeV1;
    /** Optional standalone family selection, as an owner-issued enrollment option. */
    enrollment_target_ref?: string;
  },
): Promise<BoardQueryDecision<GuardianCurrentFocusOutputV1>> => {
  const now = (deps.now ?? (() => new Date()))();
  const snapshotAt = request.resolved_scope?.snapshot_at ?? now.toISOString();
  let scopeFacts =
    request.resolved_scope?.facts ??
    (await deps.reads.loadGuardianScope({
      workspace_id: request.workspace_id,
      participant_id: request.participant_id,
      snapshot_at: snapshotAt,
    }));
  if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };
  if (!request.resolved_scope && request.enrollment_target_ref) {
    // Standalone family selection mirrors the envelope: the owner-issued
    // enrollment option rebinds the module to that enrollment's family.
    const selected = resolveTargetOptionRef(
      deps.integrity_key,
      { workspace_id: request.workspace_id, participant_id: request.participant_id },
      request.enrollment_target_ref,
      scopeFacts.eligible_enrollments.map((entry) => entry.enrollment_id),
    );
    if (!selected) return { status: "denied", reason_code: "target_unavailable" };
    const selectedFamily = scopeFacts.eligible_enrollments.find(
      (entry) => entry.enrollment_id === selected,
    )?.family_id;
    if (selectedFamily && selectedFamily !== scopeFacts.family_id) {
      scopeFacts = await deps.reads.loadGuardianScope({
        workspace_id: request.workspace_id,
        participant_id: request.participant_id,
        snapshot_at: snapshotAt,
        bind_family_id: selectedFamily,
      });
      if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };
    }
  }

  const result = await deps.reads.loadGuardianCurrentFocus({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    snapshot_at: snapshotAt,
    // The module follows the board's bound family, never its own default.
    bind_family_id: scopeFacts.family_id,
  });
  if (!result.authorized) return { status: "denied", reason_code: "not_authorized" };

  const scopeRef = guardianScopeRef(deps, request, scopeFacts);
  const binding: BoardModuleBindingV1 = {
    contract: deps.contract,
    capability: { ...QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY },
    actor: { role: "guardian", scopeKind: "family", scopeRef },
    snapshot: {
      snapshotRef: issueSnapshotRef(deps.integrity_key, request, {
        contractDigest: deps.contract.digest,
        capabilityKey: QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY.key,
        capabilityVersion: QUERY_GUARDIAN_CURRENT_FOCUS_CAPABILITY.version,
        scopeRef,
        snapshotAt,
      }),
      snapshotVersion: scopeFacts.snapshot_version,
    },
    order: GUARDIAN_CURRENT_FOCUS_ORDER,
    sourceHeads: projectSourceHeads(deps.integrity_key, request, result.heads),
  };

  const familyFocus: GuardianFocusCardV1[] = [];
  const childFocus: GuardianFocusCardV1[] = [];
  for (const goal of result.goals) {
    if (!guardianFactVisible(goal.authority)) continue;
    const card: GuardianFocusCardV1 = {
      focusRef: issueBoardOpaqueRef(deps.integrity_key, request, "focus_goal", goal.goal_id),
      cycleRef: issueBoardOpaqueRef(deps.integrity_key, request, "focus_cycle", goal.cycle_id),
      label: goal.label,
      priority: goal.priority,
      scopeSource: "family_scope",
      provenance: { sourceLabel: goal.source_label, occurredAt: goal.occurred_at },
      actions: projectOwnerActions(deps.integrity_key, request, goal.action_grants),
    };
    // A goal becomes a child focus card only through an explicit child-scope
    // fact. A legacy unscoped row stays family focus even when its payload
    // mentions a child, so family direction and child focus stay distinct.
    if (goal.child_scope_explicit && goal.child_care_process_id && goal.child_safe_label) {
      childFocus.push({
        ...card,
        scopeSource: "explicit_child_scope",
        childRef: issueBoardOpaqueRef(
          deps.integrity_key,
          request,
          "child_care_process",
          goal.child_care_process_id,
        ),
        childSafeLabel: goal.child_safe_label,
      });
      continue;
    }
    familyFocus.push(card);
  }

  const charter =
    result.charter && guardianFactVisible(result.charter.authority)
      ? result.charter
      : undefined;

  return {
    status: "ok",
    output: {
      binding,
      ...(charter
        ? {
            familyDirection: {
              charterRef: issueBoardOpaqueRef(
                deps.integrity_key,
                request,
                "family_charter",
                charter.charter_id,
              ),
              label: charter.label,
              items: charter.items.map((item) => ({
                itemRef: issueBoardOpaqueRef(
                  deps.integrity_key,
                  request,
                  "family_charter_item",
                  item.item_id,
                ),
                label: item.label,
              })),
            },
          }
        : {}),
      familyFocus,
      childFocus,
      pageInfo: { hasMore: false },
    },
  };
};

export const queryGuardianEnrollmentActivity = async (
  deps: GuardianBoardDependencies,
  request: BoardScopeV1 & {
    enrollment_target_ref: string;
    page_size?: unknown;
    cursor?: string;
    resolved_scope?: ResolvedGuardianScopeV1;
  },
): Promise<BoardQueryDecision<GuardianEnrollmentActivityOutputV1>> => {
  const pageSize = parseBoardPageSize(request.page_size);
  if (pageSize === null) return { status: "denied", reason_code: "invalid_query_input" };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const now = (deps.now ?? (() => new Date()))();
  const snapshotAtInitial = request.resolved_scope?.snapshot_at ?? now.toISOString();
  let scopeFacts =
    request.resolved_scope?.facts ??
    (await deps.reads.loadGuardianScope({ ...scope, snapshot_at: snapshotAtInitial }));
  if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };

  // Only an owner-issued, actor-bound option ref selects an Enrollment. A raw
  // Enrollment identifier never resolves, so it cannot route a Guardian read.
  const enrollmentId = resolveTargetOptionRef(
    deps.integrity_key,
    scope,
    request.enrollment_target_ref,
    scopeFacts.eligible_enrollments.map((entry) => entry.enrollment_id),
  );
  if (!enrollmentId) return { status: "denied", reason_code: "target_unavailable" };
  const selectedFamilyId = scopeFacts.eligible_enrollments.find(
    (entry) => entry.enrollment_id === enrollmentId,
  )?.family_id;
  if (selectedFamilyId && selectedFamilyId !== scopeFacts.family_id) {
    // The selected enrollment belongs to another reachable family: EVERYTHING
    // below — drift heads, snapshot version, the actor scopeRef, the cursor
    // identity — must come from THAT family's scope, or a family-B page set
    // would be invalidated by family-A's redactions and labeled family A.
    scopeFacts = await deps.reads.loadGuardianScope({
      ...scope,
      snapshot_at: snapshotAtInitial,
      bind_family_id: selectedFamilyId,
    });
    if (!scopeFacts.authorized) return { status: "denied", reason_code: "not_authorized" };
  }

  const scopeRef = guardianScopeRef(deps, scope, scopeFacts);
  const enrollmentRef = issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "enrollment",
    enrollmentId,
  );
  const identity: BoardCursorIdentityV1 = {
    contract_digest: deps.contract.digest,
    capability_key: QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY.key,
    capability_version: QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY.version,
    query_key: "guardian_enrollment_activity",
    scope_ref: enrollmentRef,
    order: GUARDIAN_ENROLLMENT_ACTIVITY_ORDER,
    page_size: pageSize,
  };
  const driftHead = computeDriftHead(scopeFacts.drift_heads);

  // The envelope's instant when it supplied the scope, so every module of one
  // envelope stamps the same snapshot. A resumed page then overrides it with
  // the instant its own page set was opened at.
  let snapshotAt = request.resolved_scope?.snapshot_at ?? now.toISOString();
  let before: BoardSortKeyV1 | undefined;
  if (request.cursor !== undefined) {
    const resumed = resolveBoardCursor(
      deps.integrity_key,
      scope,
      identity,
      request.cursor,
      deps.now,
    );
    // Source, authority, correction, redaction or Grant drift closes the page
    // set: the client refreshes instead of stitching two versions together.
    if (
      !resumed ||
      resumed.drift_head !== driftHead ||
      resumed.snapshot_version !== scopeFacts.snapshot_version
    ) {
      return { status: "refresh_required" };
    }
    snapshotAt = resumed.snapshot_at;
    before = resumed.sort_key;
  }

  const snapshotRef = issueSnapshotRef(deps.integrity_key, scope, {
    contractDigest: deps.contract.digest,
    capabilityKey: QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY.key,
    capabilityVersion: QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY.version,
    scopeRef: enrollmentRef,
    snapshotAt,
  });

  let authorized = true;
  const collectedHeads: RawBoardSourceHead[] = [];
  const page = await scanBoardPage<RawGuardianActivity, GuardianEnrollmentActivityItemV1>({
    pageSize,
    ...(before ? { before } : {}),
    read: async ({ take, before: cursorKey }) => {
      const result = await deps.reads.listGuardianEnrollmentActivity({
        workspace_id: scope.workspace_id,
        participant_id: scope.participant_id,
        enrollment_id: enrollmentId,
        snapshot_at: snapshotAt,
        ...(selectedFamilyId ? { bind_family_id: selectedFamilyId } : {}),
        take,
        ...(cursorKey ? { before: cursorKey } : {}),
      });
      if (!result.authorized) authorized = false;
      collectedHeads.push(...result.heads);
      return {
        rows: result.authorized ? result.rows : [],
        has_more: result.authorized ? result.has_more : false,
      };
    },
    sortKey: (row) => ({ occurred_at: row.occurred_at, id: row.activity_id }),
    project: (row) =>
      guardianFactVisible(row.authority)
        ? {
            activityRef: issueBoardOpaqueRef(
              deps.integrity_key,
              scope,
              "enrollment_activity",
              row.activity_id,
            ),
            kind: row.kind,
            releaseRef: issueBoardOpaqueRef(
              deps.integrity_key,
              scope,
              "publication_release",
              row.release_id,
            ),
            sourceLabel: row.source_label,
            occurredAt: row.occurred_at,
            summary: row.summary,
            actions: projectOwnerActions(deps.integrity_key, scope, row.action_grants),
          }
        : null,
  });
  if (!authorized) return { status: "denied", reason_code: "not_authorized" };

  return {
    status: "ok",
    output: {
      binding: {
        contract: deps.contract,
        capability: { ...QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY },
        actor: { role: "guardian", scopeKind: "family", scopeRef },
        snapshot: { snapshotRef, snapshotVersion: scopeFacts.snapshot_version },
        order: GUARDIAN_ENROLLMENT_ACTIVITY_ORDER,
        sourceHeads: projectSourceHeads(deps.integrity_key, scope, collectedHeads),
      },
      enrollmentRef,
      items: page.items,
      pageInfo: buildPageInfo(
        deps.integrity_key,
        scope,
        identity,
        {
          snapshot_version: scopeFacts.snapshot_version,
          snapshot_at: snapshotAt,
          drift_head: driftHead,
        },
        page,
        deps.now,
      ),
    },
  };
};
