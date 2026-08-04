import { readFileSync } from "node:fs";
import type {
  BoardDriftHeadsV1,
  CaregiverFactAuthorityV1,
  GuardianFactAuthorityV1,
  RawBoardSourceHead,
} from "../../src/harness/board-projection.js";
import type {
  CaregiverBoardReadPort,
  CaregiverBoardScopeFacts,
  RawCaregiverChildToday,
} from "../../src/harness/caregiver-board-queries.js";
import type {
  RawPublishQueueRow,
  TeacherPublishQueueReadPort,
} from "../../src/harness/teacher-publish-queue.js";
import type { PublishProcessStateV1 } from "../../src/harness/publish-process.js";
import type {
  GuardianBoardReadPort,
  GuardianBoardScopeFacts,
  RawGuardianCharter,
  RawGuardianFocusGoal,
  RawGuardianActivity,
} from "../../src/harness/guardian-board-queries.js";
import type {
  FamilyCareQueryDependencies,
  RawWorkItemRow,
} from "../../src/harness/family-care-queries.js";
import type { InterfaceContractRefV1 } from "../../src/surface-contract/types.js";

/**
 * Synthetic G3-A board fixtures. They describe owner read results only: the
 * tests exercise the projection, never a database.
 */
export const BOARD_INTEGRITY_KEY = "nurture-board-test-integrity-key-0123456789";

const artifactPin = JSON.parse(
  readFileSync(
    new URL(
      "../../contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { interfaceContract: InterfaceContractRefV1 };

/** The exact admitted contract; never a literal copy that could drift. */
export const BOARD_CONTRACT: InterfaceContractRefV1 = artifactPin.interfaceContract;

export const surfaceRegistrySource = (): {
  surfaces: Array<{
    surfaceKey: string;
    surfaceVersion: string;
    orderedContentKinds: string[];
    presenterBinding: string;
  }>;
} =>
  JSON.parse(
    readFileSync(
      new URL(
        "../../contracts/surfaces/v1/source/surfaces/surface-registry.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

export const guardianAuthority = (
  overrides: Partial<GuardianFactAuthorityV1> = {},
): GuardianFactAuthorityV1 => ({
  guardian_authority_current: true,
  child_association_exact: true,
  enrollment_visible: true,
  grant_visible: true,
  purpose_allowed: true,
  ...overrides,
});

export const caregiverAuthority = (
  overrides: Partial<CaregiverFactAuthorityV1> = {},
): CaregiverFactAuthorityV1 => ({
  role: "caregiver",
  role_scope_type: "care_group",
  role_scope_matches_source: true,
  role_assignment_current: true,
  fact_visible: true,
  purpose_allowed: true,
  ...overrides,
});

export const driftHeads = (
  overrides: Partial<BoardDriftHeadsV1> = {},
): BoardDriftHeadsV1 => ({
  source_head: "source-1",
  authority_head: "authority-1",
  correction_head: "correction-1",
  redaction_head: "redaction-1",
  grant_head: "grant-1",
  ...overrides,
});

export const sourceHead = (
  overrides: Partial<RawBoardSourceHead> = {},
): RawBoardSourceHead => ({
  source_kind: "focus_goal",
  source_id: "goal-1",
  fact_version: 1,
  lifecycle_head: "active",
  visibility_head: "visible",
  ...overrides,
});

export const focusGoal = (
  overrides: Partial<RawGuardianFocusGoal> = {},
): RawGuardianFocusGoal => ({
  goal_id: "goal-1",
  cycle_id: "cycle-1",
  label: "Syn Focus Goal",
  priority: 1,
  occurred_at: "2026-08-01T09:00:00.000Z",
  source_label: "Syn Family Focus",
  child_scope_explicit: false,
  authority: guardianAuthority(),
  action_grants: [],
  ...overrides,
});

export const guardianActivity = (
  overrides: Partial<RawGuardianActivity> = {},
): RawGuardianActivity => ({
  activity_id: "activity-1",
  kind: "daily_care",
  release_id: "release-1",
  source_label: "Syn Class A",
  occurred_at: "2026-08-01T09:00:00.000Z",
  summary: "Syn Released Daily Care",
  authority: guardianAuthority(),
  action_grants: [],
  ...overrides,
});

export const childToday = (
  overrides: Partial<RawCaregiverChildToday> = {},
): RawCaregiverChildToday => ({
  child_care_process_id: "child-1",
  child_safe_label: "Syn Child A",
  occurred_at: "2026-08-01T09:00:00.000Z",
  daily_care: [],
  attention: [],
  authority: caregiverAuthority(),
  action_grants: [],
  ...overrides,
});

export type GuardianPortConfig = {
  scope?: Partial<GuardianBoardScopeFacts>;
  /** Full scope facts served for an explicit `bind_family_id` request. */
  families?: Record<string, GuardianBoardScopeFacts>;
  charter?: RawGuardianCharter;
  goals?: RawGuardianFocusGoal[];
  focusHeads?: RawBoardSourceHead[];
  activityPages?: Array<{
    authorized?: boolean;
    rows: RawGuardianActivity[];
    has_more: boolean;
    heads?: RawBoardSourceHead[];
  }>;
  focusAuthorized?: boolean;
};

export const createGuardianReadPort = (
  config: GuardianPortConfig = {},
): GuardianBoardReadPort & {
  activityRequests: unknown[];
  scopeReads: string[];
  /** Every `snapshot_at` the owner was asked for, across all three methods. */
  snapshotInstants: string[];
} => {
  const activityRequests: unknown[] = [];
  const scopeReads: string[] = [];
  const snapshotInstants: string[] = [];
  const pages = config.activityPages ?? [{ rows: [], has_more: false }];
  return {
    activityRequests,
    scopeReads,
    snapshotInstants,
    async loadGuardianScope(input) {
      scopeReads.push(input.snapshot_at);
      snapshotInstants.push(input.snapshot_at);
      // The owner posture: an explicit bind wins; an unreachable bind refuses.
      if (input.bind_family_id) {
        const bound = (config.families ?? {})[input.bind_family_id];
        if (!bound) {
          return {
            authorized: false,
            family_id: "",
            family_label: "",
            snapshot_version: 0,
            drift_heads: driftHeads(),
            eligible_enrollments: [],
            surface_action_grants: [],
            module_action_grants: {},
          };
        }
        return bound;
      }
      return {
        authorized: true,
        family_id: "family-1",
        family_label: "Syn Family",
        snapshot_version: 7,
        drift_heads: driftHeads(),
        eligible_enrollments: [
          { enrollment_id: "enrollment-1", family_id: "family-1", display_label: "Syn Class A" },
        ],
        surface_action_grants: [],
        module_action_grants: {},
        ...config.scope,
      };
    },
    async loadGuardianCurrentFocus(input) {
      snapshotInstants.push(input.snapshot_at);
      return {
        authorized: config.focusAuthorized ?? true,
        ...(config.charter ? { charter: config.charter } : {}),
        goals: config.goals ?? [],
        heads: config.focusHeads ?? [sourceHead()],
      };
    },
    async listGuardianEnrollmentActivity(input) {
      activityRequests.push(input);
      snapshotInstants.push(input.snapshot_at);
      const page = pages[Math.min(activityRequests.length - 1, pages.length - 1)];
      return {
        authorized: page?.authorized ?? true,
        rows: page?.rows ?? [],
        has_more: page?.has_more ?? false,
        heads: page?.heads ?? [
          sourceHead({ source_kind: "publication_release", source_id: "release-1" }),
        ],
      };
    },
  };
};

export type CaregiverPortConfig = {
  scope?: Partial<CaregiverBoardScopeFacts>;
  pages?: Array<{
    authorized?: boolean;
    rows: RawCaregiverChildToday[];
    has_more: boolean;
    heads?: RawBoardSourceHead[];
  }>;
};

export const createCaregiverReadPort = (
  config: CaregiverPortConfig = {},
): CaregiverBoardReadPort & { requests: unknown[] } => {
  const requests: unknown[] = [];
  const pages = config.pages ?? [{ rows: [], has_more: false }];
  return {
    requests,
    async loadCaregiverScope() {
      return {
        authorized: true,
        care_group_id: "care-group-1",
        care_group_label: "Syn Class A",
        snapshot_version: 11,
        drift_heads: driftHeads(),
        authority: caregiverAuthority(),
        surface_action_grants: [],
        module_action_grants: {},
        publication_policy_resolved: false,
        ...config.scope,
      };
    },
    async listCaregiverChildToday(input) {
      requests.push(input);
      const page = pages[Math.min(requests.length - 1, pages.length - 1)];
      return {
        authorized: page?.authorized ?? true,
        rows: page?.rows ?? [],
        has_more: page?.has_more ?? false,
        heads: page?.heads ?? [
          sourceHead({ source_kind: "daily_care_log", source_id: "log-1" }),
        ],
      };
    },
  };
};

export const workItem = (overrides: Partial<RawWorkItemRow> = {}): RawWorkItemRow => ({
  item_id: "item-1",
  child_safe_label: "Syn Child A",
  source_safe_summary: "Syn Family Question",
  acknowledgement_state: "pending",
  response_state: "awaiting_reply",
  lifecycle_state: "active",
  attention_state: "active",
  created_at: "2026-08-01T08:00:00.000Z",
  last_activity_at: "2026-08-01T08:30:00.000Z",
  ...overrides,
});

export const createFamilyCareWorkDeps = (
  rows: RawWorkItemRow[] = [],
  authorized = true,
): FamilyCareQueryDependencies => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  protected_content: { unseal: () => "Syn Body" },
  reads: {
    async listGuardianTimeline() {
      return { authorized: false, rows: [], has_more: false };
    },
    async listCaregiverWork() {
      return {
        authorized,
        rows,
        has_more: false,
        care_group_id: "care-group-1",
      };
    },
    async loadItemDetail() {
      return { authorized: false };
    },
  },
});

export const publishQueueRow = (
  overrides: Partial<RawPublishQueueRow> = {},
): RawPublishQueueRow => ({
  process_key: "care-group-1~trigger-1",
  state: "draft",
  data_class: "daily_care_log",
  title: "Syn Outdoor Draft",
  current_revision: 1,
  target_count: 2,
  released_target_count: 0,
  occurred_at: "2026-08-01T09:00:00.000Z",
  edit_hold_active: false,
  authority: caregiverAuthority(),
  action_grants: [],
  ...overrides,
});

export const createPublishQueueReadPort = (
  pages: Array<{
    authorized?: boolean;
    rows: RawPublishQueueRow[];
    has_more: boolean;
    heads?: RawBoardSourceHead[];
  }> = [{ rows: [], has_more: false }],
  /** Queue-wide census the owner reports independently of the page. */
  stateCounts: Partial<Record<PublishProcessStateV1, number>> = {},
): TeacherPublishQueueReadPort & { requests: unknown[] } => {
  const requests: unknown[] = [];
  return {
    requests,
    async listTeacherPublishQueue(input) {
      requests.push(input);
      const page = pages[Math.min(requests.length - 1, pages.length - 1)];
      return {
        authorized: page?.authorized ?? true,
        rows: page?.rows ?? [],
        has_more: page?.has_more ?? false,
        heads: page?.heads ?? [
          sourceHead({ source_kind: "daily_care_log", source_id: "publish-1" }),
        ],
        state_counts: {
          draft: 0,
          needs_review: 0,
          pending_release: 0,
          released: 0,
          cancelled: 0,
          ...stateCounts,
        },
      };
    },
  };
};
