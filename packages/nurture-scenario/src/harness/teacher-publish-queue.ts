import {
  buildPageInfo,
  caregiverFactVisible,
  computeDriftHead,
  issueBoardOpaqueRef,
  issueBoardSealedRef,
  issueSnapshotRef,
  parseBoardPageSize,
  projectOwnerActions,
  projectSourceHeads,
  resolveBoardCursor,
  scanBoardPage,
  type BoardActionRefV1,
  type BoardCursorIdentityV1,
  type BoardModuleBindingV1,
  type BoardPageInfoV1,
  type BoardQueryDecision,
  type BoardScopeV1,
  type BoardSortKeyV1,
  type CaregiverFactAuthorityV1,
  type OwnerEligibilityGrantV1,
  type RawBoardSourceHead,
} from "./board-projection.js";
import type { CaregiverBoardScopeFacts } from "./caregiver-board-queries.js";
import {
  PUBLISH_PROCESS_STATES,
  PUBLISH_PROCESS_TARGET_KIND,
  issuePublishTargetRef,
  type PublishDataClassV1,
  type PublishProcessStateV1,
} from "./publish-process.js";
import type { InterfaceContractRefV1 } from "../surface-contract/types.js";

/**
 * G3-B1 `query_teacher_publish_queue` — the class-shared view of every
 * publication work unit for one exact CareGroup.
 *
 * Counts here are a display summary derived on read. They never stand in for
 * per-target authority, Receipts or an explicit partial result, and a process
 * that released to only some of its targets keeps both numbers visible.
 */
export const QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY = {
  key: "query_teacher_publish_queue",
  version: "1.0.0",
} as const;

export const TEACHER_PUBLISH_QUEUE_ORDER = "state_rank_asc,occurred_at_desc,id_desc";

/**
 * The queue's state rank, as a fixed-width string so it sorts lexicographically
 * inside a cursor. It follows the five-state lifecycle: work that still needs a
 * teacher comes before work that is already settled.
 */
export const publishStateRank = (state: PublishProcessStateV1): string =>
  String(PUBLISH_PROCESS_STATES.indexOf(state)).padStart(2, "0");

/**
 * Requirements §四 display vocabulary for per-target family-growth delivery
 * (T-009 I6.2). A display-only projection of the provider outbox and receipt
 * store: `delivering` covers rows not yet settled (including not-yet-
 * attempted), `outcome_unknown` stays its own visible state, and the six
 * receipt statuses appear only with a recorded receipt behind them.
 */
export const FAMILY_GROWTH_QUEUE_STATES = [
  "delivering",
  "applied",
  "pending_guardian_confirmation",
  "duplicate",
  "tombstoned",
  "rejected",
  "conflict",
  "outcome_unknown",
] as const;

export type FamilyGrowthQueueStateV1 = (typeof FAMILY_GROWTH_QUEUE_STATES)[number];

/**
 * Requirements §四 lifecycle overlay (T-009 I8): a released target whose
 * provider has COMMITTED a lifecycle event shows it alongside the delivery
 * state ("correction 已追加" / "target removed" / "redacted"). Committed is
 * the display truth — the pair lands atomically with the visibility event;
 * the family-side receipt continues to live in the delivery state.
 * Precedence when several exist: redacted over target_removed over
 * correction_appended.
 */
export const FAMILY_GROWTH_LIFECYCLE_STATES = [
  "correction_appended",
  "target_removed",
  "redacted",
] as const;

export type FamilyGrowthLifecycleStateV1 = (typeof FAMILY_GROWTH_LIFECYCLE_STATES)[number];

export type RawPublishQueueRow = {
  process_key: string;
  state: PublishProcessStateV1;
  data_class: PublishDataClassV1;
  /** Safe title from the exact saved revision; never a local buffer. */
  title: string;
  current_revision: number;
  target_count: number;
  released_target_count: number;
  occurred_at: string;
  /** Present only once an institution schedule has actually been resolved. */
  scheduled_at?: string;
  edit_hold_active: boolean;
  authority: CaregiverFactAuthorityV1;
  action_grants: OwnerEligibilityGrantV1[];
  /** Present only for targets whose release entered family-growth delivery. */
  family_growth?: Array<{
    target_key: string;
    state: FamilyGrowthQueueStateV1;
    lifecycle?: FamilyGrowthLifecycleStateV1;
  }>;
};

export type TeacherPublishQueueReadPort = {
  listTeacherPublishQueue(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    snapshot_at: string;
    take: number;
    before?: BoardSortKeyV1;
  }): Promise<{
    authorized: boolean;
    rows: RawPublishQueueRow[];
    has_more: boolean;
    heads: RawBoardSourceHead[];
    /** Queue-wide census for this CareGroup, not a count of the current page. */
    state_counts: Record<PublishProcessStateV1, number>;
  }>;
};

export type TeacherPublishQueueDependencies = {
  contract: InterfaceContractRefV1;
  integrity_key: string;
  reads: TeacherPublishQueueReadPort;
  now?: () => Date;
};

export type TeacherPublishQueueItemV1 = {
  processRef: string;
  state: PublishProcessStateV1;
  dataClass: PublishDataClassV1;
  title: string;
  revision: number;
  /** Derived display summary only; per-target results stay per target. */
  targetSummary: { total: number; released: number };
  occurredAt: string;
  scheduledAt?: string;
  editHoldActive: boolean;
  actions: BoardActionRefV1[];
  /** Per-target family-growth delivery states, owner-issued refs only. */
  familyGrowth?: Array<{
    targetRef: string;
    state: FamilyGrowthQueueStateV1;
    lifecycle?: FamilyGrowthLifecycleStateV1;
  }>;
};

export type TeacherPublishQueueOutputV1 = {
  binding: BoardModuleBindingV1;
  careGroupRef: string;
  /** Queue-wide state census; it never describes only the returned page. */
  counts: Record<PublishProcessStateV1, number>;
  items: TeacherPublishQueueItemV1[];
  pageInfo: BoardPageInfoV1;
};

const emptyCounts = (): Record<PublishProcessStateV1, number> =>
  Object.fromEntries(PUBLISH_PROCESS_STATES.map((state) => [state, 0])) as Record<
    PublishProcessStateV1,
    number
  >;

export const queryTeacherPublishQueue = async (
  deps: TeacherPublishQueueDependencies,
  scopeFacts: CaregiverBoardScopeFacts,
  request: BoardScopeV1 & { page_size?: unknown; cursor?: string },
): Promise<BoardQueryDecision<TeacherPublishQueueOutputV1>> => {
  const pageSize = parseBoardPageSize(request.page_size);
  if (pageSize === null) return { status: "denied", reason_code: "invalid_query_input" };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
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
    capability_key: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.key,
    capability_version: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.version,
    query_key: "teacher_publish_queue",
    scope_ref: careGroupRef,
    order: TEACHER_PUBLISH_QUEUE_ORDER,
    page_size: pageSize,
  };
  const driftHead = computeDriftHead(scopeFacts.drift_heads);

  const now = (deps.now ?? (() => new Date()))();
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
    capabilityKey: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.key,
    capabilityVersion: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.version,
    scopeRef: careGroupRef,
    snapshotAt,
  });

  let authorized = true;
  const collectedHeads: RawBoardSourceHead[] = [];
  let counts = emptyCounts();
  const page = await scanBoardPage<RawPublishQueueRow, TeacherPublishQueueItemV1>({
    pageSize,
    ...(before ? { before } : {}),
    read: async ({ take, before: cursorKey }) => {
      const result = await deps.reads.listTeacherPublishQueue({
        workspace_id: scope.workspace_id,
        participant_id: scope.participant_id,
        care_group_id: scopeFacts.care_group_id,
        snapshot_at: snapshotAt,
        take,
        ...(cursorKey ? { before: cursorKey } : {}),
      });
      if (!result.authorized) authorized = false;
      collectedHeads.push(...result.heads);
      if (result.authorized) counts = { ...emptyCounts(), ...result.state_counts };
      return {
        rows: result.authorized ? result.rows : [],
        has_more: result.authorized ? result.has_more : false,
      };
    },
    sortKey: (row) => ({
      // The declared order leads with the state rank, so the cursor does too.
      rank: publishStateRank(row.state),
      occurred_at: row.occurred_at,
      id: row.process_key,
    }),
    project: (row) => {
      if (!caregiverFactVisible(row.authority)) return null;
      return {
        processRef: issueBoardSealedRef(
          deps.integrity_key,
          scope,
          PUBLISH_PROCESS_TARGET_KIND,
          row.process_key,
        ),
        state: row.state,
        dataClass: row.data_class,
        title: row.title,
        revision: row.current_revision,
        // Both numbers travel together so a partial release can never be
        // presented as a plain "published".
        targetSummary: { total: row.target_count, released: row.released_target_count },
        occurredAt: row.occurred_at,
        ...(row.scheduled_at ? { scheduledAt: row.scheduled_at } : {}),
        editHoldActive: row.edit_hold_active,
        actions: projectOwnerActions(deps.integrity_key, scope, row.action_grants),
        ...(row.family_growth && row.family_growth.length > 0
          ? {
              familyGrowth: row.family_growth.map((entry) => ({
                targetRef: issuePublishTargetRef(deps.integrity_key, scope, entry.target_key),
                state: entry.state,
                ...(entry.lifecycle ? { lifecycle: entry.lifecycle } : {}),
              })),
            }
          : {}),
      };
    },
  });
  if (!authorized) return { status: "denied", reason_code: "not_authorized" };

  return {
    status: "ok",
    output: {
      binding: {
        contract: deps.contract,
        capability: { ...QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY },
        actor: { role: "caregiver", scopeKind: "care_group", scopeRef: careGroupRef },
        snapshot: { snapshotRef, snapshotVersion: scopeFacts.snapshot_version },
        order: TEACHER_PUBLISH_QUEUE_ORDER,
        sourceHeads: projectSourceHeads(deps.integrity_key, scope, collectedHeads),
      },
      careGroupRef,
      counts,
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
