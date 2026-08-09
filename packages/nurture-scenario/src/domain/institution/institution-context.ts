import type { ResolutionCandidate } from "../resolution/candidate-kernel.js";

export type NurtureCareRole =
  | "guardian"
  | "caregiver"
  | "lead_caregiver"
  | "institution_admin"
  | "system_operator";

export type NurtureCareScopeType =
  | "child_care_process"
  | "family"
  | "institution"
  | "care_group"
  | "enrollment";

export type NurtureWorkScope = {
  kind: "child_process" | "family" | "care_group" | "institution";
  child_care_process_id?: string;
  family_id?: string;
  care_group_id?: string;
  institution_id?: string;
  enrollment_id?: string;
};

export type NurtureParticipantFact = {
  workspace_id: string;
  participant_id: string;
  my_chat_user_id: string;
  display_name?: string;
};

export type NurtureActorBinding = {
  actor_binding_ref: string;
  participant_id: string;
  role_assignment_id: string;
  role_kind: NurtureCareRole;
  scope_type: NurtureCareScopeType;
  scope_id: string;
  work_scope: NurtureWorkScope;
  safe_scope_label?: string;
};

export type NurtureResolvedContext = {
  actor: {
    participant_id: string;
    /**
     * Optional since G4-A increment 2. No authority path reads it — the 0C
     * chain identifies the actor by participant and assignment, both stored
     * refs — and requiring it forced a caller with neither to synthesize an
     * empty principal. Producers that have it still pass it.
     */
    my_chat_user_id?: string;
    role_assignment_id: string;
    role_kind: NurtureCareRole;
    scope_type: NurtureCareScopeType;
    scope_id: string;
  };
  work_scope: NurtureWorkScope;
  target?: {
    object_type: string;
    object_id: string;
    child_care_process_id?: string;
    lifecycle_state: string;
  };
  continuity: {
    nurture_interaction_context_id?: string;
    pending_intent?: string;
    clarification_state?: string;
  };
  policy_seed: {
    action_key: string;
    data_class?: NurtureGrantDataClass;
    direction?: NurtureGrantDirection;
    decision_reason_code?: string;
  };
};

export type NurtureGrantDirection = "family_to_org" | "org_to_family";
export type NurtureGrantDataClass =
  | "daily_care_log"
  | "care_day_note"
  | "care_constraint_update"
  | "family_care_question"
  | "family_follow_up_request"
  | "direct_care_communication"
  // T-006 G3 delta: the second publish audience data class.
  | "child_growth_record";

export type NurtureResolutionSourceKey =
  | "family_care_item"
  | "teacher_attention_item"
  | "family_care_thread";

export type NurtureInstitutionContextRepository = {
  listActiveParticipants(input: {
    workspace_id?: string;
    my_chat_user_id: string;
    limit: number;
  }): Promise<NurtureParticipantFact[]>;
  listActiveActorBindings(input: {
    workspace_id: string;
    participant_id: string;
    at: string;
    limit: number;
  }): Promise<NurtureActorBinding[]>;
  listResolutionCandidates(input: {
    workspace_id: string;
    participant: NurtureParticipantFact;
    actor_bindings: NurtureActorBinding[];
    source_key: NurtureResolutionSourceKey;
    intent_key: string;
    query_text?: string;
    at: string;
    limit: number;
  }): Promise<ResolutionCandidate[]>;
  revalidateResolutionCandidate(input: {
    workspace_id: string;
    participant_id: string;
    candidate: ResolutionCandidate;
    at: string;
  }): Promise<
    | {
        current: true;
        participant: NurtureParticipantFact;
        actor_binding: NurtureActorBinding;
        candidate: ResolutionCandidate;
      }
    | {
        current: false;
        reason_code:
          | "participant_missing"
          | "role_missing"
          | "role_revoked"
          | "scope_mismatch"
          | "child_not_visible"
          | "grant_missing"
          | "grant_revoked"
          | "enrollment_inactive"
          | "thread_inactive"
          | "message_redacted";
      }
  >;
  loadPolicyFacts(input: NurturePolicyFactRequest): Promise<NurturePolicyFacts>;
  /**
   * G4-A increment 4, for 0C-5 §5. The counted population of a class, with the
   * grant facts each member's own enrolment resolves.
   *
   * The population comes from SCOPE — a current enrolment in that exact class
   * within that institution — never from the protected facts. Its size is not
   * the secret; what is gated is a fact class about each member.
   */
  loadAggregatePopulation(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    at: string;
    limit: number;
  }): Promise<NurtureAggregatePopulation>;
};

export type NurtureAggregateMember = {
  member_ref: string;
  grant_state: NurturePolicyFacts["grant_state"];
  grant_terms: NurturePolicyFacts["grant_terms"];
};

/**
 * The class's placement AND its population, from one read.
 *
 * `class_state` reuses the vocabulary `target_scope_state` already carries,
 * because it answers the same question about the same row. Without it the
 * caller could not tell an empty class from one in another institution: both
 * yield no members, and 0C-5 §5 says an empty population is `0` — so an
 * unverified class reference would be answered with a number instead of a
 * denial.
 */
export type NurtureAggregatePopulation = {
  class_state: "in_scope" | "out_of_scope" | "class_not_current";
  members: NurtureAggregateMember[];
};

export type NurturePolicyKey =
  | "nurture.can_view_child_care_process"
  | "nurture.can_write_family_care_message"
  | "nurture.can_receive_family_context"
  | "nurture.can_share_to_family"
  | "nurture.caregiver_scope"
  | "nurture.can_confirm_media_attribution"
  // G4-A increment 1: the 0C-1/0C-2/0C-3 authority chain for Institution
  // surfaces. Frozen by 11-g4-0c-1, 12-g4-0c-2 and 13-g4-0c-3.
  | "nurture.institution_admin_scope";

export type NurturePolicyFactRequest = {
  workspace_id: string;
  policy_key: NurturePolicyKey;
  resolved_context: NurtureResolvedContext;
  data_class?: NurtureGrantDataClass;
  direction?: NurtureGrantDirection;
  /**
   * G4-A increment 2, frozen by 0C-3 §4 step 3. Typed as a plain string, not
   * the closed union: an unrecognized purpose must reach the predicate and be
   * denied `purpose_not_honoured`, and a union would make that state
   * unreachable at the type level while callers on the wire can still send it.
   */
  purpose_key?: string;
};

export type NurturePolicyFacts = {
  participant_state: "active" | "missing";
  role_state: "active" | "missing" | "revoked";
  role_kind?: NurtureCareRole;
  scope_reaches_child: boolean;
  /**
   * G4-A increment 1, frozen by 0C-2 and 0C-3.
   *
   * These are deliberately separate from `scope_reaches_child`, which for an
   * institution-scoped binding matches `institutionId` alone and therefore
   * admits any child enrolled anywhere in the institution. 0C-3 requires the
   * exact class, so reusing that fact here would silently widen the predicate.
   */
  institution_scope_current: boolean;
  /**
   * Four states, not a boolean, because a boolean conflated two cases the
   * 0C-2 freeze separates: no target supplied (a legitimate institution-level
   * read) and a target supplied that resolves to no institution (frozen as
   * deny). The first version returned `true` for both and failed open.
   *
   * `class_not_current` is separate again because 0C-3 reserves its own code
   * for it, distinct from the `not_authorized` that a missing or
   * other-institution class must return.
   */
  target_scope_state:
    | "absent"
    | "in_scope"
    | "out_of_scope"
    | "class_not_current";
  /**
   * The refs the repository RESOLVED from stored rows — never what the caller
   * supplied. The predicate must gate on the same channel the fact is computed
   * from; keying the guard off the caller's optional
   * `target.child_care_process_id` let an omitted field skip the check
   * entirely (increment 1 audit, defect 2).
   *
   * These carry the value rather than a boolean because 0C-3's context type
   * needs the refs themselves. A separate `child_target_resolved` boolean
   * alongside them would be the same fact on two channels, which is the shape
   * that keeps failing here.
   */
  resolved_care_group_ref?: string;
  resolved_child_process_ref?: string;
  child_in_named_class: boolean;
  /**
   * G4-A increment 2. The actor's scope AS STORED, echoed from the resolved
   * binding rather than from the caller's `resolved_context.actor`.
   *
   * 0C-1 §3 is explicit that a caller MUST NOT synthesize a role, a scope type
   * or a scope id — every one is issued by Nurture from a stored row. The
   * first predicate read `resolved_context.actor.scope_type`, a caller-supplied
   * value, for the 0C-2 decision. That happened to fail closed only because
   * `institution_scope_current` is computed from the binding and covered it;
   * the safety was incidental, not designed. These fields give the predicate
   * the stored channel directly, so the two can no longer disagree.
   *
   * Absent when no binding resolves, which is itself a denial.
   */
  actor_scope_type?: NurtureCareScopeType;
  actor_scope_ref?: string;
  care_group_matches: boolean;
  child_visible: boolean;
  thread_state: "active" | "inactive" | "missing";
  thread_membership_active: boolean;
  message_state: "sent" | "redacted" | "failed" | "missing";
  enrollment_state: "active" | "inactive" | "missing";
  grant_state: "active" | "revoked" | "missing";
  /**
   * G4-A increment 3, frozen by 0C-5 §4. Every CURRENT grant's terms, not one
   * grant's.
   *
   * The previous shape emitted `grant_directions` and `grant_data_classes`
   * from a single grant picked as `matchingGrant ?? currentGrants[0]`. With
   * two axes that was safe, because the match already required both together
   * and the fallback could only deny. Purpose makes it three axes, and the
   * freeze requires them "evaluated together": matching two of three must
   * deny. A single picked grant cannot express that without the reason code
   * depending on which grant the `[0]` happened to land on.
   *
   * So the repository emits the terms and the predicate asks the existence
   * question. `purposes` stays `string[]` because the column is an open
   * `String[]`: an unrecognized stored purpose must reach the predicate and
   * deny, never widen.
   */
  grant_terms: Array<{
    directions: NurtureGrantDirection[];
    data_classes: NurtureGrantDataClass[];
    purposes: string[];
  }>;
  family_thread_visible: boolean;
  asset_scope_matches: boolean;
  child_enrolled: boolean;
  exposure_policy_present: boolean;
};

export type NurturePolicyReasonCode =
  | "allowed"
  | "policy_unavailable"
  | "participant_missing"
  | "role_missing"
  | "role_revoked"
  | "scope_mismatch"
  | "care_group_mismatch"
  | "child_not_visible"
  | "thread_inactive"
  | "family_thread_missing"
  | "grant_missing"
  | "grant_revoked"
  | "data_class_mismatch"
  | "enrollment_inactive"
  | "message_redacted"
  | "asset_scope_mismatch"
  // 0C-2 freezes every non-current or out-of-scope institution to one code, so
  // an Admin cannot probe which institution ids exist or what state one is in.
  | "not_authorized"
  // 0C-3 reserves a distinct code for a class inside the admin's own
  // institution that is not current, separate from missing/other-institution.
  | "class_not_current"
  // G4-A increment 2, from the 0C-1 and 0C-3 default-safe tables.
  // 0C-1 §6: several eligible assignments and none named. The chain never
  // picks, merges or defaults to one.
  | "role_selection_required"
  // 0C-3 §6: both are contract faults the caller can fix, which is why they
  // live at level 3. `purpose_not_granted` is an authority fact the caller
  // cannot fix and belongs to 0C-5 — see 0G finding 1.
  | "purpose_required"
  | "purpose_not_honoured"
  // G4-A increment 3, from 0C-5 §7. Separate from `purpose_not_honoured`
  // because 0G finding 1 split them: the vocabulary is a contract fault the
  // caller can fix, whereas a purpose the grant never carried is an authority
  // fact they cannot.
  | "purpose_not_granted"
  | "child_not_enrolled"
  | "exposure_policy_missing";

export type NurturePolicyDecision = {
  allowed: boolean;
  reason_code: NurturePolicyReasonCode;
  resolved_refs: {
    participant_id: string;
    role_assignment_id: string;
    work_scope: NurtureWorkScope;
    target?: NurtureResolvedContext["target"];
  };
  audit_payload: {
    policy_key: NurturePolicyKey;
    reason_code: NurturePolicyReasonCode;
    role_kind: NurtureCareRole;
    scope_type: NurtureCareScopeType;
    target_type?: string;
  };
  safe_user_state: "allowed" | "unavailable" | "access_changed";
};
