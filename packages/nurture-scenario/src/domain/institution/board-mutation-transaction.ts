import type { CanonicalRef } from "@my-chat/workflow-contracts";

type DomainContextRef = CanonicalRef;

/**
 * Canonical-owner write ports behind the two G3-A inline board mutations.
 *
 * The board is an operable projection, not a fact owner: an inline adjustment
 * must land through the owner of the fact it changes. Current focus belongs to
 * the FocusCycle/FocusGoal owner and daily care belongs to the DailyCareLog
 * owner, so each mutation re-reads that owner inside the command transaction
 * and never patches a board snapshot, cache or derived projection.
 */
export type NurtureGuardianFocusGoalFacts = {
  participant_active: boolean;
  /** Current family Guardian authority for the exact family the goal belongs to. */
  guardian_authority_current: boolean;
  family_ref_key?: string;
  focus_cycle_id?: string;
  focus_cycle_version: number;
  focus_goal_version: number;
  /**
   * A goal is child-scoped only through an explicit scope fact. G3-A never
   * infers scope from `goalPayload`, so an unscoped goal stays family scope.
   */
  child_scope_explicit: boolean;
  child_care_process_id?: string;
};

export type NurtureCaregiverDailyCareFacts = {
  participant_active: boolean;
  /** `caregiver | lead_caregiver` whose own RoleAssignment scope is the source CareGroup. */
  caregiver_role: string;
  role_scope_type: string;
  role_scope_matches_source: boolean;
  caregiver_role_assignment_id?: string;
  care_group_id?: string;
  enrollment_id?: string;
  enrollment_active: boolean;
  care_group_version: number;
  caregiver_role_version: number;
  enrollment_version: number;
};

export type NurtureBoardMutationTransaction = {
  loadGuardianFocusGoalFacts(input: {
    workspace_id: string;
    participant_id: string;
    focus_goal_id: string;
  }): Promise<NurtureGuardianFocusGoalFacts>;
  applyGuardianFocusGoalUpdate(input: {
    workspace_id: string;
    participant_id: string;
    focus_goal_id: string;
    focus_cycle_id: string;
    label: string;
    priority: number;
    expected_focus_goal_version: number;
  }): Promise<{ focus_goal_ref: DomainContextRef; revision: number }>;
  loadCaregiverDailyCareFacts(input: {
    workspace_id: string;
    participant_id: string;
    child_care_process_id: string;
  }): Promise<NurtureCaregiverDailyCareFacts>;
  applyCaregiverDailyCareRecord(input: {
    workspace_id: string;
    participant_id: string;
    child_care_process_id: string;
    care_group_id: string;
    enrollment_id: string;
    recorded_by_role_assignment_id: string;
    kind: string;
    summary: string;
    expected_enrollment_version: number;
  }): Promise<{ daily_care_log_ref: DomainContextRef; recorded_at: string }>;
};
