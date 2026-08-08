import type {
  NurtureActorBinding,
  NurtureCareRole,
  NurtureCareScopeType,
  NurtureGrantDataClass,
  NurtureGrantDirection,
  NurtureInstitutionContextRepository,
  NurturePolicyFacts,
  NurturePolicyReasonCode,
  NurtureResolvedContext,
} from "./institution-context.js";

/**
 * G4-A increment 2 — the 0C context chain, as a chain.
 *
 * 0C froze four context types passed level to level, each consuming the
 * previous one unchanged and adding exactly one level. Increment 1
 * deliberately did not build that: it added one policy key against the
 * existing flat request, because the flaws worth finding first were in the
 * predicate logic rather than the call shape.
 *
 * That has now reversed. The two remaining 0C predicates both live on the call
 * shape: `purposeKey` is a field of the 0C-3 context type with nowhere to live
 * in the flat request, and 0C-1's selection rule needs an assignment reference
 * the caller may legitimately omit. This module builds the chain those
 * predicates need.
 *
 * It also closes the authority-channel split increment 1 left behind. 0C-1 §3
 * requires that a caller MUST NOT synthesize a role, a scope type or a scope
 * id — every one is issued by Nurture from a stored row. Here the binding is
 * the only source: `resolveInstitutionAuthorityChain` never reads an actor
 * field the caller supplied, and the context it emits carries the stored
 * values onward.
 *
 * Frozen by 11-g4-0c-1, 12-g4-0c-2 and 13-g4-0c-3. Levels 0C-5 and 0C-6 are
 * not built here.
 */

/**
 * 0C-3 §3. `NurtureChildLinkGrant.purposes` is `String[]` with no
 * database-level constraint, so purpose limitation cannot lean on the schema:
 * the closed set Institution surfaces honour is fixed at the contract layer,
 * and the guard therefore lives in this predicate. A stored purpose outside
 * the set denies rather than being treated as a wildcard.
 */
export const NURTURE_PURPOSE_KEYS = [
  "care_coordination",
  "family_communication",
  "enrollment_admin",
  "safety_response",
] as const;

export type NurturePurposeKey = (typeof NURTURE_PURPOSE_KEYS)[number];

const isPurposeKey = (value: string): value is NurturePurposeKey =>
  (NURTURE_PURPOSE_KEYS as readonly string[]).includes(value);

/** 0C-1 §3, the envelope every 0C consumer receives. */
export type NurtureActiveRoleContextV1 = {
  contract_version: "1.0.0";
  participant_ref: string;
  role_assignment_ref: string;
  role_kind: NurtureCareRole;
  scope_type: NurtureCareScopeType;
  scope_ref: string;
  /**
   * `unique` when exactly one assignment was eligible, `explicit` when the
   * caller named one among several. There is no third mode: an ambiguous
   * request denies rather than defaulting.
   */
  selection_mode: "explicit" | "unique";
};

/** 0C-2 §3. `institution_state` is a single-member union by construction. */
export type NurtureInstitutionScopeContextV1 = {
  contract_version: "1.0.0";
  active_role: NurtureActiveRoleContextV1;
  institution_ref: string;
  institution_state: "active";
};

/** 0C-3 §3. `purpose_key` is required with `child_process_ref`. */
export type NurtureChildScopeContextV1 = {
  contract_version: "1.0.0";
  institution_scope: NurtureInstitutionScopeContextV1;
  care_group_ref?: string;
  child_process_ref?: string;
  purpose_key?: NurturePurposeKey;
};

export type NurtureAuthorityChainLevel =
  | "active_role"
  | "institution_scope"
  | "child_scope"
  | "grant_scope";

/**
 * The chain's own entry shape. Note what is absent: the target carries no
 * `child_care_process_id`. That field is the caller-supplied channel whose use
 * as a guard was defect 2 of the increment 1 audit; the chain resolves the
 * child from stored rows or not at all.
 */
export type NurtureAuthorityChainRequest = {
  workspace_id: string;
  participant_ref: string;
  /** Optional by design — 0C-1 §4 requires it only when several are eligible. */
  role_assignment_ref?: string;
  at: string;
  target?: {
    object_type: string;
    object_id: string;
    lifecycle_state: string;
  };
  purpose_key?: string;
  /**
   * 0C-5's axes. Supplying either asks for the fourth level; supplying neither
   * stops the chain at 0C-3, which is a scope answer and not a content one.
   */
  direction?: NurtureGrantDirection;
  data_class?: NurtureGrantDataClass;
};

export type NurtureAuthorityChainResult =
  | {
      status: "resolved";
      level: "institution_scope" | "child_scope" | "grant_scope";
      active_role: NurtureActiveRoleContextV1;
      institution_scope: NurtureInstitutionScopeContextV1;
      child_scope?: NurtureChildScopeContextV1;
    }
  | {
      status: "denied";
      /** Which level refused. 0G invariant 2: a level denies at itself, never skips. */
      level: NurtureAuthorityChainLevel;
      reason_code: NurturePolicyReasonCode;
    };

const deny = (
  level: NurtureAuthorityChainLevel,
  reason_code: NurturePolicyReasonCode,
): NurtureAuthorityChainResult => ({ status: "denied", level, reason_code });

export type NurtureGrantAsk = {
  direction?: NurtureGrantDirection;
  data_class?: NurtureGrantDataClass;
  purpose_key?: string;
};

/**
 * 0C-5 §4, the three axes evaluated TOGETHER over one grant.
 *
 * The freeze's fixture 5 is the whole point: matching two of three denies. So
 * the question is whether SOME current grant carries all of the asked terms,
 * never whether each term appears somewhere among the grants. Two grants that
 * between them cover direction and data class admit nothing.
 *
 * A term the caller did not ask about is not tested — `can_receive_family_context`
 * and `can_share_to_family` ask two axes, and 0C-5 asks three.
 */
export const grantAdmits = (
  terms: NurturePolicyFacts["grant_terms"],
  ask: NurtureGrantAsk,
): boolean =>
  terms.some(
    (term) =>
      (!ask.direction || term.directions.includes(ask.direction)) &&
      (!ask.data_class || term.data_classes.includes(ask.data_class)) &&
      // 0C-5 §4 step 3: a member of the grant's purposes AND of 0C-3's frozen
      // vocabulary. The stored column is an open String[], so a purpose it
      // carries that the vocabulary does not recognize is filtered out here
      // rather than widening what the grant admits.
      (!ask.purpose_key ||
        term.purposes.filter(isPurposeKey).includes(ask.purpose_key as NurturePurposeKey)),
  );

/**
 * 0C-5's level, over a child scope 0C-3 already resolved.
 *
 * Currency is NOT the lifecycle conjunction here, and 0G finding 3 says so
 * explicitly: `NurtureChildLinkGrant` has `status` and no `deletedAt`, so its
 * currency is `status = active` within the effective window. The repository
 * applies that when it builds `grant_terms`, which is why this function sees
 * only current grants.
 */
export const deriveGrantScope = (
  facts: NurturePolicyFacts,
  ask: NurtureGrantAsk,
): { status: "resolved" } | { status: "denied"; reason_code: NurturePolicyReasonCode } => {
  // 0C-5 §7. `expired`, `replaced` and `deleted` all arrive as "missing": the
  // caller learns no lifecycle detail beyond revoked-or-not.
  if (facts.grant_state === "revoked") return { status: "denied", reason_code: "grant_revoked" };
  if (facts.grant_state !== "active") return { status: "denied", reason_code: "grant_missing" };

  if (grantAdmits(facts.grant_terms, ask)) return { status: "resolved" };

  // Which axis failed. Direction and data class share one code deliberately
  // (0C-5 §7): telling them apart would let an Admin probe a grant's exact
  // terms by elimination. Purpose has its own code because 0G finding 1 made
  // it an authority fact the caller cannot fix, distinct from the vocabulary
  // fault 0C-3 already rejected.
  //
  // The purpose code is only correct when the other two axes DO match some
  // grant — otherwise naming purpose would leak that direction and data class
  // were fine, which is the elimination probe the shared code prevents.
  const withoutPurpose = grantAdmits(facts.grant_terms, {
    ...ask,
    purpose_key: undefined,
  });
  return {
    status: "denied",
    reason_code: withoutPurpose ? "purpose_not_granted" : "data_class_mismatch",
  };
};

/**
 * 0C-1 §4 step 4. Exactly one eligible assignment resolves as `unique`; several
 * require the caller to name one and resolve as `explicit`; several with none
 * named denies. A named assignment that is not among the eligible ones denies
 * `role_missing` and never falls back to another eligible one.
 */
export const selectActiveRole = (
  bindings: NurtureActorBinding[],
  request: Pick<NurtureAuthorityChainRequest, "participant_ref" | "role_assignment_ref">,
):
  | { status: "selected"; binding: NurtureActorBinding; selection_mode: "explicit" | "unique" }
  | { status: "denied"; reason_code: NurturePolicyReasonCode } => {
  const eligible = bindings.filter((binding) => binding.participant_id === request.participant_ref);
  if (eligible.length === 0) return { status: "denied", reason_code: "role_missing" };
  if (request.role_assignment_ref) {
    const named = eligible.find(
      (binding) => binding.role_assignment_id === request.role_assignment_ref,
    );
    // Naming another participant's assignment, or one that is not eligible,
    // denies identically to no assignment at all.
    if (!named) return { status: "denied", reason_code: "role_missing" };
    return {
      status: "selected",
      binding: named,
      selection_mode: eligible.length === 1 ? "unique" : "explicit",
    };
  }
  if (eligible.length > 1) return { status: "denied", reason_code: "role_selection_required" };
  return { status: "selected", binding: eligible[0]!, selection_mode: "unique" };
};

/**
 * Levels 0C-2 and 0C-3, over facts the repository computed. Pure so the whole
 * state space is reachable from unit tests, and so the policy service can
 * share one implementation rather than growing a second copy that drifts.
 *
 * `active_role` must have been built from a stored binding by the caller of
 * this function — it is never derived from anything the request supplied.
 */
export const deriveInstitutionScopeChain = (
  active_role: NurtureActiveRoleContextV1,
  facts: NurturePolicyFacts,
  request: Pick<NurtureAuthorityChainRequest, "purpose_key" | "direction" | "data_class">,
): NurtureAuthorityChainResult => {
  // 0C-1 level, re-asserted on the facts: the participant and the assignment
  // must still be current at evaluation time, not merely at selection time.
  if (facts.participant_state !== "active") return deny("active_role", "participant_missing");
  if (facts.role_state === "revoked") return deny("active_role", "role_revoked");
  if (facts.role_state !== "active") return deny("active_role", "role_missing");

  // 0C-2 step 1. Both halves read the stored channel: `role_kind` and
  // `scope_type` come from the binding, never from a caller-supplied actor.
  // An institution_admin assignment at a non-institution scope type denies
  // rather than being reinterpreted as covering that scope's institution.
  if (active_role.role_kind !== "institution_admin") {
    return deny("institution_scope", "not_authorized");
  }
  if (active_role.scope_type !== "institution") {
    return deny("institution_scope", "not_authorized");
  }
  // 0C-2 step 2, the currency conjunction from the lifecycle decision.
  if (!facts.institution_scope_current) return deny("institution_scope", "not_authorized");

  const institution_scope: NurtureInstitutionScopeContextV1 = {
    contract_version: "1.0.0",
    active_role,
    institution_ref: active_role.scope_ref,
    institution_state: "active",
  };

  // 0C-2 step 3. Every state is handled explicitly so a state added later
  // cannot fall through to a resolve.
  switch (facts.target_scope_state) {
    case "out_of_scope":
      return deny("institution_scope", "not_authorized");
    case "class_not_current":
      // 0C-3's own code: a class inside the admin's institution that is not
      // current, distinct from the `not_authorized` a missing or
      // other-institution class returns.
      return deny("child_scope", "class_not_current");
    case "absent":
    case "in_scope":
      break;
  }

  // No child-level target resolved: the chain stops at the institution level.
  // 0C-3 is not skipped, it simply has nothing to place — and a purpose is not
  // required for a read that reaches no child.
  const child_process_ref = facts.resolved_child_process_ref;
  if (!child_process_ref) {
    return { status: "resolved", level: "institution_scope", active_role, institution_scope };
  }

  // 0C-3 step 2. Deliberately NOT `scope_reaches_child`: that fact matches
  // `institutionId` alone for an institution-scoped binding, so it admits any
  // child enrolled anywhere in the institution and is looser than this level.
  if (!facts.child_in_named_class) return deny("child_scope", "scope_mismatch");

  // 0C-3 step 3, and only this half of purpose. Whether the child's grant
  // permits the purpose is 0C-5's question (0G finding 1) and is not asked
  // here — a predicate that tested the grant here would duplicate 0C-5 and
  // drift from it.
  if (!request.purpose_key) return deny("child_scope", "purpose_required");
  const purpose_key = request.purpose_key;
  if (!isPurposeKey(purpose_key)) return deny("child_scope", "purpose_not_honoured");

  // 0C-3 step 4.
  if (!facts.child_visible) return deny("child_scope", "child_not_visible");

  const child_scope: NurtureChildScopeContextV1 = {
    contract_version: "1.0.0",
    institution_scope,
    // Both refs are echoed from the repository's resolution, so the context
    // a consumer receives names exactly the rows the predicate tested.
    ...(facts.resolved_care_group_ref ? { care_group_ref: facts.resolved_care_group_ref } : {}),
    child_process_ref,
    purpose_key,
  };

  // 0C-5's level. Asked only when the caller names content axes: a request
  // with neither is a scope question, and answering it with a grant verdict
  // would deny reads 0C-3 already settled.
  if (!request.direction && !request.data_class) {
    return { status: "resolved", level: "child_scope", active_role, institution_scope, child_scope };
  }
  const grant = deriveGrantScope(facts, {
    ...(request.direction ? { direction: request.direction } : {}),
    ...(request.data_class ? { data_class: request.data_class } : {}),
    purpose_key,
  });
  if (grant.status === "denied") return deny("grant_scope", grant.reason_code);
  return { status: "resolved", level: "grant_scope", active_role, institution_scope, child_scope };
};

/**
 * Builds the 0C-1 context from a stored binding. Every field is echoed from
 * the row; nothing is synthesized and nothing is read from the request beyond
 * the selection mode the caller's naming produced.
 */
export const activeRoleContextFrom = (
  binding: NurtureActorBinding,
  selection_mode: "explicit" | "unique",
): NurtureActiveRoleContextV1 => ({
  contract_version: "1.0.0",
  participant_ref: binding.participant_id,
  role_assignment_ref: binding.role_assignment_id,
  role_kind: binding.role_kind,
  scope_type: binding.scope_type,
  scope_ref: binding.scope_id,
  selection_mode,
});

/**
 * The chain as a service: 0C-1 selection over stored bindings, then the facts
 * for the selected binding, then levels 0C-2 and 0C-3.
 *
 * Note what this does NOT do: it never accepts an actor identity from the
 * request. The caller says which participant and, when it must, which
 * assignment — everything else is read.
 */
export class NurtureInstitutionAuthorityChain {
  constructor(
    private readonly repository: NurtureInstitutionContextRepository,
    private readonly options: { binding_limit?: number } = {},
  ) {}

  async resolve(request: NurtureAuthorityChainRequest): Promise<NurtureAuthorityChainResult> {
    try {
      const bindings = await this.repository.listActiveActorBindings({
        workspace_id: request.workspace_id,
        participant_id: request.participant_ref,
        at: request.at,
        // One above the ambiguity threshold is not enough: naming an
        // assignment must be able to find it, so the window has to hold every
        // eligible row a caller could legitimately name.
        limit: this.options.binding_limit ?? 20,
      });
      const selection = selectActiveRole(bindings, request);
      if (selection.status === "denied") {
        return deny("active_role", selection.reason_code);
      }
      const active_role = activeRoleContextFrom(selection.binding, selection.selection_mode);
      const facts = await this.repository.loadPolicyFacts({
        workspace_id: request.workspace_id,
        policy_key: "nurture.institution_admin_scope",
        resolved_context: this.toFactRequestContext(active_role, request),
        ...(request.direction ? { direction: request.direction } : {}),
        ...(request.data_class ? { data_class: request.data_class } : {}),
        ...(request.purpose_key ? { purpose_key: request.purpose_key } : {}),
      });
      return deriveInstitutionScopeChain(active_role, facts, request);
    } catch {
      return deny("active_role", "policy_unavailable");
    }
  }

  /**
   * The bridge to the existing fact loader. The actor block is filled from the
   * resolved binding rather than from the request, so the value the repository
   * echoes back is the one it issued.
   */
  private toFactRequestContext(
    active_role: NurtureActiveRoleContextV1,
    request: NurtureAuthorityChainRequest,
  ): NurtureResolvedContext {
    return {
      actor: {
        participant_id: active_role.participant_ref,
        role_assignment_id: active_role.role_assignment_ref,
        role_kind: active_role.role_kind,
        scope_type: active_role.scope_type,
        scope_id: active_role.scope_ref,
      },
      work_scope: { kind: "institution", institution_id: active_role.scope_ref },
      ...(request.target ? { target: request.target } : {}),
      continuity: {},
      policy_seed: { action_key: "nurture.institution_admin_scope" },
    };
  }
}
