import { describe, expect, it } from "vitest";
import {
  NurtureInstitutionAuthorityChain,
  createInMemoryInstitutionContextRepository,
  deriveInstitutionScopeChain,
  selectActiveRole,
  type NurtureActiveRoleContextV1,
  type NurtureActorBinding,
  type NurtureAuthorityChainRequest,
  type NurtureInstitutionContextRepository,
  type NurturePolicyFacts,
} from "../../src/index.js";

/**
 * G4-A increment 2 — the 0C chain as a chain.
 *
 * The fixtures 0C-1 §7 requires of any implementation citing it, plus the
 * level-by-level denials 0C-2 and 0C-3 froze. What makes these different from
 * the increment 1 tests is the actor: the chain takes a participant and, when
 * it must, an assignment reference. It never takes a role kind or a scope
 * type, so no test here can hand it an actor identity — that is the point.
 */

const binding = (overrides: Partial<NurtureActorBinding> = {}): NurtureActorBinding => ({
  actor_binding_ref: "assignment-1",
  participant_id: "participant-1",
  role_assignment_id: "assignment-1",
  role_kind: "institution_admin",
  scope_type: "institution",
  scope_id: "institution-1",
  work_scope: { kind: "institution", institution_id: "institution-1" },
  ...overrides,
});

const facts = (overrides: Partial<NurturePolicyFacts> = {}): NurturePolicyFacts => ({
  participant_state: "active",
  role_state: "active",
  role_kind: "institution_admin",
  scope_reaches_child: true,
  institution_scope_current: true,
  target_scope_state: "in_scope",
  resolved_care_group_ref: "group-1",
  resolved_child_process_ref: "process-1",
  child_in_named_class: true,
  actor_scope_type: "institution",
  actor_scope_ref: "institution-1",
  care_group_matches: true,
  child_visible: true,
  thread_state: "active",
  thread_membership_active: true,
  message_state: "sent",
  enrollment_state: "active",
  grant_state: "active",
  grant_directions: ["family_to_org"],
  grant_data_classes: ["daily_care_log"],
  family_thread_visible: true,
  asset_scope_matches: true,
  child_enrolled: true,
  exposure_policy_present: true,
  ...overrides,
});

const activeRole = (
  overrides: Partial<NurtureActiveRoleContextV1> = {},
): NurtureActiveRoleContextV1 => ({
  contract_version: "1.0.0",
  participant_ref: "participant-1",
  role_assignment_ref: "assignment-1",
  role_kind: "institution_admin",
  scope_type: "institution",
  scope_ref: "institution-1",
  selection_mode: "unique",
  ...overrides,
});

const chainOver = (
  bindings: NurtureActorBinding[],
  policyFacts: NurturePolicyFacts = facts(),
  overrides: Partial<NurtureInstitutionContextRepository> = {},
) =>
  new NurtureInstitutionAuthorityChain(
    createInMemoryInstitutionContextRepository({
      listActiveActorBindings: async () => bindings,
      loadPolicyFacts: async () => policyFacts,
      ...overrides,
    }),
  );

const request = (
  overrides: Partial<NurtureAuthorityChainRequest> = {},
): NurtureAuthorityChainRequest => ({
  workspace_id: "workspace-1",
  participant_ref: "participant-1",
  at: "2026-08-09T00:00:00.000Z",
  purpose_key: "care_coordination",
  ...overrides,
});

describe("0C-1 selection (G4-A increment 2)", () => {
  it("resolves a single eligible assignment as unique", () => {
    const selection = selectActiveRole([binding()], { participant_ref: "participant-1" });
    expect(selection).toMatchObject({ status: "selected", selection_mode: "unique" });
  });

  it("denies several eligible assignments with none named, rather than picking one", () => {
    const selection = selectActiveRole(
      [binding(), binding({ role_assignment_id: "assignment-2", scope_id: "institution-2" })],
      { participant_ref: "participant-1" },
    );
    expect(selection).toMatchObject({
      status: "denied",
      reason_code: "role_selection_required",
    });
  });

  it("resolves an explicit valid selection to that exact assignment", () => {
    const selection = selectActiveRole(
      [binding(), binding({ role_assignment_id: "assignment-2", scope_id: "institution-2" })],
      { participant_ref: "participant-1", role_assignment_ref: "assignment-2" },
    );
    expect(selection).toMatchObject({ status: "selected", selection_mode: "explicit" });
    expect(
      selection.status === "selected" ? selection.binding.scope_id : null,
    ).toBe("institution-2");
  });

  it("denies a selection naming another participant's assignment, with no fallback", () => {
    // 0C-1 §6: never fall back to another eligible one. The eligible
    // assignment here would resolve on its own, so a fallback would look like
    // a success.
    const selection = selectActiveRole(
      [binding(), binding({ participant_id: "participant-2", role_assignment_id: "assignment-9" })],
      { participant_ref: "participant-1", role_assignment_ref: "assignment-9" },
    );
    expect(selection).toMatchObject({ status: "denied", reason_code: "role_missing" });
  });

  it("denies with no eligible assignment at all", () => {
    expect(selectActiveRole([], { participant_ref: "participant-1" })).toMatchObject({
      status: "denied",
      reason_code: "role_missing",
    });
  });

  it("emits a context carrying no permissions, capability list or display name", async () => {
    const result = await chainOver([binding()]).resolve(request());
    expect(result.status).toBe("resolved");
    expect(
      Object.keys(result.status === "resolved" ? result.active_role : {}).sort(),
    ).toEqual([
      "contract_version",
      "participant_ref",
      "role_assignment_ref",
      "role_kind",
      "scope_ref",
      "scope_type",
      "selection_mode",
    ]);
  });

  it("carries the stored scope onward, not anything the request could name", async () => {
    // The request type has no role kind and no scope type to supply. This
    // asserts the emitted context echoes the binding row instead.
    const result = await chainOver([
      binding({ scope_id: "institution-from-the-row" }),
    ]).resolve(request());
    expect(result.status === "resolved" ? result.active_role.scope_ref : null).toBe(
      "institution-from-the-row",
    );
    expect(result.status === "resolved" ? result.institution_scope.institution_ref : null).toBe(
      "institution-from-the-row",
    );
  });

  it("re-asserts participant and role currency on the facts, not only at selection", async () => {
    // Selection reads the binding list; these states come from the fact load.
    // A row that expired between the two must deny.
    await expect(
      chainOver([binding()], facts({ role_state: "revoked" })).resolve(request()),
    ).resolves.toMatchObject({ level: "active_role", reason_code: "role_revoked" });
    await expect(
      chainOver([binding()], facts({ participant_state: "missing" })).resolve(request()),
    ).resolves.toMatchObject({ level: "active_role", reason_code: "participant_missing" });
  });

  it("denies unavailable rather than serving from a partial read", async () => {
    const failing = chainOver([binding()], facts(), {
      loadPolicyFacts: async () => {
        throw new Error("owner unavailable");
      },
    });
    await expect(failing.resolve(request())).resolves.toMatchObject({
      status: "denied",
      reason_code: "policy_unavailable",
    });
  });
});

describe("0C-2 and 0C-3 levels (G4-A increment 2)", () => {
  // `null` rather than `undefined` for "no purpose declared": passing
  // undefined triggers the default parameter and silently restores it. The
  // same trap cost this suite a green test for a denial that never ran.
  const derive = (
    overrides: Partial<NurturePolicyFacts> = {},
    purpose_key: string | null = "care_coordination",
    role: Partial<NurtureActiveRoleContextV1> = {},
  ) =>
    deriveInstitutionScopeChain(activeRole(role), facts(overrides), {
      ...(purpose_key === null ? {} : { purpose_key }),
    });

  it("denies every non-admin role at the institution level with one code", () => {
    for (const role_kind of ["guardian", "caregiver", "lead_caregiver", "system_operator"] as const) {
      expect(derive({}, "care_coordination", { role_kind }), role_kind).toMatchObject({
        level: "institution_scope",
        reason_code: "not_authorized",
      });
    }
  });

  it("denies an admin assignment at a non-institution scope type", () => {
    expect(derive({}, "care_coordination", { scope_type: "care_group" })).toMatchObject({
      level: "institution_scope",
      reason_code: "not_authorized",
    });
  });

  it("denies a non-current institution and an out-of-scope target identically", () => {
    expect(derive({ institution_scope_current: false })).toMatchObject({
      reason_code: "not_authorized",
    });
    expect(derive({ target_scope_state: "out_of_scope" })).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  it("denies a non-current class at the child level with 0C-3's own code", () => {
    expect(derive({ target_scope_state: "class_not_current" })).toMatchObject({
      level: "child_scope",
      reason_code: "class_not_current",
    });
  });

  it("resolves at the institution level when no child was resolved", () => {
    // And a purpose is not required for a read that reaches no child.
    expect(
      derive({ resolved_child_process_ref: undefined, child_in_named_class: false }, null),
    ).toMatchObject({ status: "resolved", level: "institution_scope" });
  });

  it("denies a child outside the named class, which the looser fact admits", () => {
    // scope_reaches_child stays true throughout: it matches institutionId
    // alone and would allow this.
    expect(derive({ child_in_named_class: false, scope_reaches_child: true })).toMatchObject({
      level: "child_scope",
      reason_code: "scope_mismatch",
    });
  });

  it("requires a declared purpose for a child-level read and never defaults one", () => {
    expect(derive({}, null)).toMatchObject({
      level: "child_scope",
      reason_code: "purpose_required",
    });
  });

  it("denies a purpose outside the frozen vocabulary rather than treating it as a wildcard", () => {
    expect(derive({}, "analytics")).toMatchObject({
      level: "child_scope",
      reason_code: "purpose_not_honoured",
    });
    // A purpose the schema's open String[] would happily store.
    expect(derive({}, "care-coordination")).toMatchObject({
      reason_code: "purpose_not_honoured",
    });
  });

  it("checks the grant nowhere — that is 0C-5's question", () => {
    // 0G finding 1 split the two. A revoked, missing or mismatched grant must
    // not change this level's answer, or the two levels will drift.
    for (const grant_state of ["revoked", "missing"] as const) {
      expect(derive({ grant_state }), grant_state).toMatchObject({ status: "resolved" });
    }
    expect(derive({ grant_data_classes: [], grant_directions: [] })).toMatchObject({
      status: "resolved",
    });
  });

  it("denies a redacted or suppressed fact", () => {
    expect(derive({ child_visible: false })).toMatchObject({
      level: "child_scope",
      reason_code: "child_not_visible",
    });
  });

  it("emits a child scope carrying the refs the predicate actually tested", () => {
    const result = derive();
    expect(result).toMatchObject({
      status: "resolved",
      level: "child_scope",
      child_scope: {
        contract_version: "1.0.0",
        care_group_ref: "group-1",
        child_process_ref: "process-1",
        purpose_key: "care_coordination",
      },
    });
  });
});
