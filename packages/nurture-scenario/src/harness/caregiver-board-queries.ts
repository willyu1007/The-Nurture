import {
  buildPageInfo,
  caregiverFactVisible,
  computeDriftHead,
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
  type CaregiverFactAuthorityV1,
  type OwnerEligibilityGrantV1,
  type RawBoardSourceHead,
} from "./board-projection.js";
import type { InterfaceContractRefV1 } from "../surface-contract/types.js";

/**
 * G3-A Caregiver module query. The CareGroup scope comes from the actor's own
 * current RoleAssignment, never from typed input, so no raw CareGroup, child,
 * Enrollment or Grant identifier can route a class read.
 */
export const QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY = {
  key: "query_caregiver_child_today",
  version: "1.0.0",
} as const;

export const CAREGIVER_CHILD_TODAY_ORDER = "child_label_asc,occurred_at_desc,id_asc";

// ---------------------------------------------------------------------------
// Raw owner rows (server-internal; never leave the projection).

export type CaregiverBoardScopeFacts = {
  authorized: boolean;
  care_group_id: string;
  care_group_label: string;
  snapshot_version: number;
  drift_heads: BoardDriftHeadsV1;
  /** The actor's own RoleAssignment measured against the exact source CareGroup. */
  authority: CaregiverFactAuthorityV1;
  /** Owner-issued surface- and module-scope eligibility. Without a grant the
   * presenter has nothing to project, whatever the role says. */
  surface_action_grants: OwnerEligibilityGrantV1[];
  module_action_grants: Record<string, OwnerEligibilityGrantV1[]>;
  /**
   * True once the T-007 institution publication policy has actually resolved a
   * send window for this CareGroup. Without it the publish queue can list work
   * but nothing can be scheduled, so the board stays limited.
   */
  publication_policy_resolved: boolean;
};

export type RawCaregiverDailyCare = {
  log_id: string;
  kind: "meal" | "nap" | "mood" | "activity" | "health_observation";
  summary: string;
  occurred_at: string;
  authority: CaregiverFactAuthorityV1;
  action_grants: OwnerEligibilityGrantV1[];
};

export type RawCaregiverAttention = {
  attention_item_id: string;
  priority: "routine" | "attention" | "urgent";
  summary: string;
  effective_date?: string;
  source_kind: string;
  authority: CaregiverFactAuthorityV1;
  /**
   * Attention actions route to the capability of the fact that raised them.
   * There is no board-level "resolve everything" write.
   */
  action_grants: OwnerEligibilityGrantV1[];
};

export type RawCaregiverChildToday = {
  child_care_process_id: string;
  child_safe_label: string;
  occurred_at: string;
  daily_care: RawCaregiverDailyCare[];
  attention: RawCaregiverAttention[];
  authority: CaregiverFactAuthorityV1;
  action_grants: OwnerEligibilityGrantV1[];
};

export type CaregiverBoardReadPort = {
  loadCaregiverScope(input: {
    workspace_id: string;
    participant_id: string;
    snapshot_at: string;
  }): Promise<CaregiverBoardScopeFacts>;
  listCaregiverChildToday(input: {
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
  }>;
};

export type CaregiverBoardDependencies = {
  contract: InterfaceContractRefV1;
  integrity_key: string;
  reads: CaregiverBoardReadPort;
  now?: () => Date;
};

/** A scope already resolved by the caller — see `ResolvedGuardianScopeV1`. */
export type ResolvedCaregiverScopeV1 = {
  facts: CaregiverBoardScopeFacts;
  snapshot_at: string;
};

// ---------------------------------------------------------------------------
// Public typed results.

export type CaregiverDailyCareEntryV1 = {
  logRef: string;
  kind: "meal" | "nap" | "mood" | "activity" | "health_observation";
  summary: string;
  occurredAt: string;
  actions: BoardActionRefV1[];
};

export type CaregiverAttentionEntryV1 = {
  attentionRef: string;
  priority: "routine" | "attention" | "urgent";
  summary: string;
  effectiveDate?: string;
  sourceKind: string;
  actions: BoardActionRefV1[];
};

export type CaregiverChildTodayCardV1 = {
  childRef: string;
  childSafeLabel: string;
  lastActivityAt: string;
  dailyCare: CaregiverDailyCareEntryV1[];
  attention: CaregiverAttentionEntryV1[];
  actions: BoardActionRefV1[];
};

export type CaregiverChildTodayOutputV1 = {
  binding: BoardModuleBindingV1;
  careGroupRef: string;
  children: CaregiverChildTodayCardV1[];
  pageInfo: BoardPageInfoV1;
};

// ---------------------------------------------------------------------------

export const queryCaregiverChildToday = async (
  deps: CaregiverBoardDependencies,
  request: BoardScopeV1 & {
    page_size?: unknown;
    cursor?: string;
    resolved_scope?: ResolvedCaregiverScopeV1;
  },
): Promise<BoardQueryDecision<CaregiverChildTodayOutputV1>> => {
  const pageSize = parseBoardPageSize(request.page_size);
  if (pageSize === null) return { status: "denied", reason_code: "invalid_query_input" };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const now = (deps.now ?? (() => new Date()))();
  const scopeFacts =
    request.resolved_scope?.facts ??
    (await deps.reads.loadCaregiverScope({ ...scope, snapshot_at: now.toISOString() }));
  // An Institution-scoped Lead designation, an Admin role, Institution
  // membership or a same-Institution role in another CareGroup all fail here.
  if (!scopeFacts.authorized || !caregiverFactVisible(scopeFacts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }

  const careGroupRef = issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "care_group",
    scopeFacts.care_group_id,
  );
  const identity: BoardCursorIdentityV1 = {
    contract_digest: deps.contract.digest,
    capability_key: QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY.key,
    capability_version: QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY.version,
    query_key: "caregiver_child_today",
    scope_ref: careGroupRef,
    order: CAREGIVER_CHILD_TODAY_ORDER,
    page_size: pageSize,
  };
  const driftHead = computeDriftHead(scopeFacts.drift_heads);

  let snapshotAt = now.toISOString();
  let before: BoardSortKeyV1 | undefined;
  if (request.cursor !== undefined) {
    const resumed = resolveBoardCursor(
      deps.integrity_key,
      scope,
      identity,
      request.cursor,
      deps.now,
    );
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
    capabilityKey: QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY.key,
    capabilityVersion: QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY.version,
    scopeRef: careGroupRef,
    snapshotAt,
  });

  let authorized = true;
  const collectedHeads: RawBoardSourceHead[] = [];
  const page = await scanBoardPage<RawCaregiverChildToday, CaregiverChildTodayCardV1>({
    pageSize,
    ...(before ? { before } : {}),
    read: async ({ take, before: cursorKey }) => {
      const result = await deps.reads.listCaregiverChildToday({
        workspace_id: scope.workspace_id,
        participant_id: scope.participant_id,
        care_group_id: scopeFacts.care_group_id,
        snapshot_at: snapshotAt,
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
    sortKey: (row) => ({
      // The declared order leads with the child label, so the cursor does too.
      rank: row.child_safe_label,
      occurred_at: row.occurred_at,
      id: row.child_care_process_id,
    }),
    project: (row) => {
      if (!caregiverFactVisible(row.authority)) return null;
      return {
        childRef: issueBoardOpaqueRef(
          deps.integrity_key,
          scope,
          "child_care_process",
          row.child_care_process_id,
        ),
        childSafeLabel: row.child_safe_label,
        lastActivityAt: row.occurred_at,
        dailyCare: row.daily_care
          .filter((entry) => caregiverFactVisible(entry.authority))
          .map((entry) => ({
            logRef: issueBoardOpaqueRef(
              deps.integrity_key,
              scope,
              "daily_care_log",
              entry.log_id,
            ),
            kind: entry.kind,
            summary: entry.summary,
            occurredAt: entry.occurred_at,
            actions: projectOwnerActions(deps.integrity_key, scope, entry.action_grants),
          })),
        attention: row.attention
          .filter((entry) => caregiverFactVisible(entry.authority))
          .map((entry) => ({
            attentionRef: issueBoardOpaqueRef(
              deps.integrity_key,
              scope,
              "teacher_attention_item",
              entry.attention_item_id,
            ),
            priority: entry.priority,
            summary: entry.summary,
            ...(entry.effective_date ? { effectiveDate: entry.effective_date } : {}),
            sourceKind: entry.source_kind,
            actions: projectOwnerActions(deps.integrity_key, scope, entry.action_grants),
          })),
        actions: projectOwnerActions(deps.integrity_key, scope, row.action_grants),
      };
    },
  });
  if (!authorized) return { status: "denied", reason_code: "not_authorized" };

  return {
    status: "ok",
    output: {
      binding: {
        contract: deps.contract,
        capability: { ...QUERY_CAREGIVER_CHILD_TODAY_CAPABILITY },
        actor: { role: "caregiver", scopeKind: "care_group", scopeRef: careGroupRef },
        snapshot: { snapshotRef, snapshotVersion: scopeFacts.snapshot_version },
        order: CAREGIVER_CHILD_TODAY_ORDER,
        sourceHeads: projectSourceHeads(deps.integrity_key, scope, collectedHeads),
      },
      careGroupRef,
      children: page.items,
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
