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
    case "nurture.institution_admin_scope":
      // 0C-1 level: exactly one active institution_admin assignment. The role
      // union admits five values; only this one reaches an Institution surface,
      // and system_operator is never selectable (0C-1 §4).
      if (facts.role_kind !== "institution_admin") return "not_authorized";
      // 0C-2 level: the assignment must be AT institution scope. An admin
      // assignment at care_group or enrollment scope is not widened to that
      // scope's institution — it denies. This reads the actor's own resolved
      // binding, which the repository derives from the stored assignment row.
      if (input.resolved_context.actor.scope_type !== "institution") {
        return "not_authorized";
      }
      // 0C-2 currency, using the conjunction from the lifecycle decision
      // (0G finding 3): status = active AND deletedAt IS NULL.
      if (!facts.institution_scope_current) return "not_authorized";
      // 0C-2 target placement. Each state is handled explicitly so that a new
      // state cannot fall through to allow: "absent" is an institution-level
      // read with nothing to place, "out_of_scope" covers both another
      // institution and a target that resolves to none — 0C-2 gives them one
      // code so an Admin cannot tell them apart — and "class_not_current"
      // carries 0C-3's own code.
      switch (facts.target_scope_state) {
        case "out_of_scope":
          return "not_authorized";
        case "class_not_current":
          return "class_not_current";
        case "absent":
        case "in_scope":
          break;
      }
      // 0C-3 level: a child-level target must sit in the NAMED class. The
      // guard reads `child_target_resolved` — the same resolved channel the
      // fact is computed from — because keying it off the caller-supplied
      // `target.child_care_process_id` let an omitted field skip the check
      // while the repository had already computed a denial.
      if (facts.child_target_resolved) {
        return facts.child_in_named_class ? "allowed" : "scope_mismatch";
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
