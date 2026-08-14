/**
 * W10 canonical-owner write for the teacher assistant weekly draft. The
 * facts load re-reads current authority, the institution safety-policy
 * identity, the (class, week) draft that may already exist, and the exact
 * target set — all inside the command transaction. The apply creates one
 * publish process with its sealed first revision, its per-family targets
 * and the safety-assessment row in that same transaction; nothing here
 * schedules, releases or sends.
 */

export type NurtureWeeklyDraftTargetRow = {
  child_care_process_id: string;
  enrollment_id: string;
  family_id: string;
  grant_id: string;
};

export type NurtureWeeklyDraftFacts = {
  authorizing_role_assignment_id: string;
  /** Absent when the institution never resolved a content-safety policy. */
  safety_policy?: { policy_ref: string; policy_head: number };
  /**
   * The (class, week) process that already exists, whatever lane stage it
   * has reached — its presence is what makes the draft domain-idempotent.
   */
  existing?: { process_id: string; state: "draft" | "needs_review" };
  /** Enrollment+grant pairs the weekly summary may target (care_day_note / family_weekly_summary). */
  targets: NurtureWeeklyDraftTargetRow[];
};

export type NurtureTeacherAssistantTransaction = {
  loadWeeklyDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    process_key: string;
  }): Promise<NurtureWeeklyDraftFacts | null>;

  applyWeeklyDraftProcess(input: {
    workspace_id: string;
    care_group_id: string;
    process_key: string;
    state: "draft" | "needs_review";
    week_start: string;
    week_end: string;
    safety: {
      route: string;
      policy_ref: string;
      policy_head: number;
      rule_revision: string;
      risk_codes: string[];
    };
    content_digest: string;
    organizer_input_revision: string;
    command_request_id: string;
    title_envelope: unknown;
    body_envelope: unknown;
    authorizing_role_assignment_id: string;
    targets: Array<NurtureWeeklyDraftTargetRow & { target_key: string }>;
  }): Promise<{ process_id: string; process_version: number }>;
};
