import type {
  NurtureInstitutionContextRepository,
  NurturePolicyDecision,
  NurturePolicyFactRequest,
  NurturePolicyFacts,
  NurturePolicyReasonCode,
} from "./institution-context.js";

const decideReason = (
  input: NurturePolicyFactRequest,
  facts: NurturePolicyFacts,
): NurturePolicyReasonCode => {
  if (facts.participant_state !== "active") return "participant_missing";
  if (facts.role_state === "revoked") return "role_revoked";
  if (facts.role_state !== "active") return "role_missing";

  switch (input.policy_key) {
    case "nurture.can_view_child_care_process":
      if (
        facts.role_kind !== "guardian" &&
        facts.role_kind !== "caregiver" &&
        facts.role_kind !== "lead_caregiver" &&
        facts.role_kind !== "institution_admin"
      ) {
        return "role_missing";
      }
      if (!facts.scope_reaches_child) return "scope_mismatch";
      return facts.child_visible ? "allowed" : "child_not_visible";
    case "nurture.can_write_family_care_message":
      if (facts.thread_state !== "active" || !facts.thread_membership_active) {
        return "thread_inactive";
      }
      if (facts.message_state === "redacted") return "message_redacted";
      return facts.scope_reaches_child && facts.child_visible ? "allowed" : "child_not_visible";
    case "nurture.can_receive_family_context":
      if (
        facts.role_kind !== "caregiver" &&
        facts.role_kind !== "lead_caregiver" &&
        facts.role_kind !== "institution_admin"
      ) {
        return "role_missing";
      }
      if (facts.enrollment_state !== "active") return "enrollment_inactive";
      if (facts.grant_state === "revoked") return "grant_revoked";
      if (facts.grant_state !== "active") return "grant_missing";
      if (
        input.direction !== "family_to_org" ||
        !facts.grant_directions.includes("family_to_org") ||
        !input.data_class ||
        !facts.grant_data_classes.includes(input.data_class)
      ) {
        return "data_class_mismatch";
      }
      return facts.care_group_matches ? "allowed" : "care_group_mismatch";
    case "nurture.can_share_to_family":
      if (
        facts.role_kind !== "caregiver" &&
        facts.role_kind !== "lead_caregiver" &&
        facts.role_kind !== "institution_admin"
      ) {
        return "role_missing";
      }
      if (facts.grant_state === "revoked") return "grant_revoked";
      if (facts.grant_state !== "active") return "grant_missing";
      if (
        input.direction !== "org_to_family" ||
        !facts.grant_directions.includes("org_to_family") ||
        !input.data_class ||
        !facts.grant_data_classes.includes(input.data_class)
      ) {
        return "data_class_mismatch";
      }
      if (!facts.family_thread_visible) return "family_thread_missing";
      return facts.care_group_matches ? "allowed" : "care_group_mismatch";
    case "nurture.caregiver_scope":
      if (facts.role_kind !== "caregiver" && facts.role_kind !== "lead_caregiver") {
        return "role_missing";
      }
      if (!facts.care_group_matches) return "care_group_mismatch";
      if (
        (input.resolved_context.target?.child_care_process_id ||
          input.resolved_context.work_scope.enrollment_id) &&
        facts.enrollment_state !== "active"
      ) {
        return "enrollment_inactive";
      }
      return "allowed";
    case "nurture.can_confirm_media_attribution":
      if (
        facts.role_kind !== "caregiver" &&
        facts.role_kind !== "lead_caregiver" &&
        facts.role_kind !== "institution_admin"
      ) {
        return "role_missing";
      }
      if (!facts.asset_scope_matches) return "asset_scope_mismatch";
      if (!facts.child_enrolled) return "child_not_enrolled";
      return facts.exposure_policy_present ? "allowed" : "exposure_policy_missing";
  }
};

export class NurtureInstitutionPolicyService {
  constructor(private readonly repository: NurtureInstitutionContextRepository) {}

  async evaluate(input: NurturePolicyFactRequest): Promise<NurturePolicyDecision> {
    let reasonCode: NurturePolicyReasonCode;
    try {
      const facts = await this.repository.loadPolicyFacts(input);
      reasonCode = decideReason(input, facts);
    } catch {
      reasonCode = "policy_unavailable";
    }
    const context = input.resolved_context;
    const changed = new Set<NurturePolicyReasonCode>([
      "role_revoked",
      "grant_revoked",
      "message_redacted",
      "enrollment_inactive",
    ]);
    return {
      allowed: reasonCode === "allowed",
      reason_code: reasonCode,
      resolved_refs: {
        participant_id: context.actor.participant_id,
        role_assignment_id: context.actor.role_assignment_id,
        work_scope: context.work_scope,
        ...(context.target ? { target: context.target } : {}),
      },
      audit_payload: {
        policy_key: input.policy_key,
        reason_code: reasonCode,
        role_kind: context.actor.role_kind,
        scope_type: context.actor.scope_type,
        ...(context.target ? { target_type: context.target.object_type } : {}),
      },
      safe_user_state:
        reasonCode === "allowed" ? "allowed" : changed.has(reasonCode) ? "access_changed" : "unavailable",
    };
  }
}
