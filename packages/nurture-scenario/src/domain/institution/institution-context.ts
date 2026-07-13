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
    my_chat_user_id: string;
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
  | "family_follow_up_request";

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
};

export type NurturePolicyKey =
  | "nurture.can_view_child_care_process"
  | "nurture.can_write_family_care_message"
  | "nurture.can_receive_family_context"
  | "nurture.can_share_to_family"
  | "nurture.caregiver_scope"
  | "nurture.can_confirm_media_attribution";

export type NurturePolicyFactRequest = {
  workspace_id: string;
  policy_key: NurturePolicyKey;
  resolved_context: NurtureResolvedContext;
  data_class?: NurtureGrantDataClass;
  direction?: NurtureGrantDirection;
};

export type NurturePolicyFacts = {
  participant_state: "active" | "missing";
  role_state: "active" | "missing" | "revoked";
  role_kind?: NurtureCareRole;
  scope_reaches_child: boolean;
  care_group_matches: boolean;
  child_visible: boolean;
  thread_state: "active" | "inactive" | "missing";
  thread_membership_active: boolean;
  message_state: "sent" | "redacted" | "failed" | "missing";
  enrollment_state: "active" | "inactive" | "missing";
  grant_state: "active" | "revoked" | "missing";
  grant_directions: NurtureGrantDirection[];
  grant_data_classes: NurtureGrantDataClass[];
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
