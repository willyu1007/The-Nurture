import type {
  NurtureInstitutionContextRepository,
  NurturePolicyDecision,
  NurturePolicyFactRequest,
  NurturePolicyFacts,
  NurturePolicyReasonCode,
} from "./institution-context.js";
import { deriveInstitutionScopeChain, grantAdmits } from "./institution-authority-chain.js";

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
      // G4-A increment 3: direction and data class must hold on ONE grant.
      // The previous form read them off a single picked grant's two arrays,
      // which agreed with this whenever a grant matched both; where it could
      // differ is two grants that between them cover the axes, and 0C-5 §4
      // freezes that as a denial.
      if (
        input.direction !== "family_to_org" ||
        !input.data_class ||
        !grantAdmits(facts.grant_terms, {
          direction: "family_to_org",
          data_class: input.data_class,
        })
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
        !input.data_class ||
        !grantAdmits(facts.grant_terms, {
          direction: "org_to_family",
          data_class: input.data_class,
        })
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
    case "nurture.institution_admin_scope": {
      // G4-A increment 2. Levels 0C-2 and 0C-3 now live in the chain module,
      // so this key and `NurtureInstitutionAuthorityChain` share one
      // implementation instead of growing a second copy that drifts apart.
      //
      // The actor context is built from the stored channel the repository
      // echoed back — `actor_scope_type` / `actor_scope_ref` — not from
      // `input.resolved_context.actor`, which the caller supplies. 0C-1 §3:
      // a caller MUST NOT synthesize a role, a scope type or a scope id.
      // Absent facts mean no binding resolved, which is itself a denial.
      if (!facts.role_kind || !facts.actor_scope_type || !facts.actor_scope_ref) {
        return "not_authorized";
      }
      const result = deriveInstitutionScopeChain(
        {
          contract_version: "1.0.0",
          participant_ref: input.resolved_context.actor.participant_id,
          role_assignment_ref: input.resolved_context.actor.role_assignment_id,
          role_kind: facts.role_kind,
          scope_type: facts.actor_scope_type,
          scope_ref: facts.actor_scope_ref,
          // This entry point takes a named assignment on every call, so
          // selection never ran. `explicit` states that plainly rather than
          // claiming a uniqueness nothing checked.
          selection_mode: "explicit",
        },
        facts,
        {
          ...(input.purpose_key ? { purpose_key: input.purpose_key } : {}),
          ...(input.direction ? { direction: input.direction } : {}),
          ...(input.data_class ? { data_class: input.data_class } : {}),
        },
      );
      return result.status === "resolved" ? "allowed" : result.reason_code;
    }
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
