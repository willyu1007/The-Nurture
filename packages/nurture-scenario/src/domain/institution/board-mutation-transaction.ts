import type { CanonicalRef } from "@my-chat/workflow-contracts";

type DomainContextRef = CanonicalRef;

/**
 * Canonical-owner write ports behind the two G3-A inline board mutations.
 *
 * The board is an operable projection, not a fact owner: an inline adjustment
 * must land through the owner of the fact it changes. Daily care belongs to
 * the DailyCareLog owner, so the mutation re-reads that owner inside the
 * command transaction and never patches a board snapshot, cache or derived
 * projection. (The guardian current-focus mutation was ceded to My-Chat
 * cultivation in surface contract 1.16.0 — D-T009-01.)
 */
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
