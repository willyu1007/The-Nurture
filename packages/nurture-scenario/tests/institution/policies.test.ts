import { describe, expect, it } from "vitest";
import {
  NurtureInstitutionPolicyService,
  NurtureInstitutionResolver,
  NurtureInteractionContextService,
  createInMemoryInstitutionContextRepository,
  createInMemoryInteractionContextRepository,
  resolveCandidates,
  type NurtureActorBinding,
  type NurtureHostInvocationEnvelope,
  type NurturePolicyFacts,
  type NurtureResolvedContext,
  type ResolutionCandidate,
} from "../../src/index.js";

const participant = {
  workspace_id: "workspace-1",
  participant_id: "participant-1",
  my_chat_user_id: "user-1",
  display_name: "Caregiver",
};

const binding = (id: string, careGroupId: string): NurtureActorBinding => ({
  actor_binding_ref: id,
  participant_id: participant.participant_id,
  role_assignment_id: id,
  role_kind: "caregiver",
  scope_type: "care_group",
  scope_id: careGroupId,
  work_scope: { kind: "care_group", care_group_id: careGroupId },
});

const candidate = (
  id: string,
  overrides: Partial<ResolutionCandidate> = {},
): ResolutionCandidate => ({
  candidate_key: id,
  actor_binding_ref: "role-1",
  scope_ref: { kind: "care_group", id: "group-1" },
  target_ref: {
    object_type: "family_care_item",
    object_id: id,
    lifecycle_state: "open",
    child_care_process_id: `child-${id}`,
  },
  intent_key: "continue_nurture_work",
  source_key: "family_care_item",
  state_class: "actionable",
  match_class: "exact_topic_or_date",
  evidence_codes: ["item"],
  occurred_at: "2026-07-13T08:00:00.000Z",
  dedupe_key: id,
  safe_label: `Care item ${id}`,
  ...overrides,
});

const envelope = (
  overrides: Partial<NurtureHostInvocationEnvelope> = {},
): NurtureHostInvocationEnvelope => ({
  host: {
    my_chat_user_id: "user-1",
    workspace_id: "workspace-1",
    scenario_key: "nurture",
    surface: "teacher_board",
    host_request_id: "request-1",
  },
  event: { kind: "surface_open" },
  display_state: { selected_view_key: "class_family_inbox" },
  ...overrides,
});

describe("resolution candidate kernel", () => {
  it("deduplicates an attention projection into its actionable backing path", () => {
    const item = candidate("item-1", { evidence_codes: ["item"] });
    const attention = candidate("attention-1", {
      candidate_key: "attention-1",
      source_key: "teacher_attention_item",
      dedupe_key: "item-1",
      evidence_codes: ["attention"],
    });
    const result = resolveCandidates([[attention], [item]]);
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.candidate.evidence_codes).toEqual(["attention", "item"]);
  });

  it("does not use recency or stable ids to break a semantic tie", () => {
    const result = resolveCandidates([
      [
        candidate("older", { occurred_at: "2026-07-12T08:00:00.000Z" }),
        candidate("newer", { occurred_at: "2026-07-13T08:00:00.000Z" }),
      ],
    ]);
    expect(result).toMatchObject({
      status: "needs_clarification",
      reason_code: "ambiguous_context",
      total_candidate_count: 2,
    });
  });

  it("resolves a unique candidate in the best categorical match class", () => {
    const result = resolveCandidates([
      [
        candidate("exact", { match_class: "exact_entities" }),
        candidate("continuation", { match_class: "explicit_continuation" }),
      ],
    ]);
    expect(result).toMatchObject({ status: "resolved", candidate: { candidate_key: "exact" } });
  });

  it("never auto-resolves weak recent context", () => {
    const result = resolveCandidates([[
      candidate("recent", { match_class: "weak_recent_context" }),
    ]]);
    expect(result).toMatchObject({ status: "needs_clarification", reason_code: "weak_context" });
  });

  it("asks for narrowing instead of truncating an oversized semantic tie", () => {
    const result = resolveCandidates(
      [[candidate("a"), candidate("b"), candidate("c")]],
      { aggregate_candidate_limit: 4, rendered_option_limit: 2 },
    );
    expect(result).toEqual({
      status: "needs_clarification",
      reason_code: "candidate_limit_exceeded",
      candidates: [],
      total_candidate_count: 3,
    });
  });
});

describe("institution resolver", () => {
  const makeResolver = (bindings: NurtureActorBinding[]) => {
    const repository = createInMemoryInstitutionContextRepository({
      listActiveParticipants: async () => [participant],
      listActiveActorBindings: async () => bindings,
      listResolutionCandidates: async () => [],
      revalidateResolutionCandidate: async ({ candidate: selected }) => {
        const actorBinding = bindings.find(
          (entry) => entry.actor_binding_ref === selected.actor_binding_ref,
        );
        return actorBinding
          ? { current: true as const, participant, actor_binding: actorBinding, candidate: selected }
          : { current: false as const, reason_code: "role_missing" as const };
      },
    });
    let optionIndex = 0;
    const interactions = new NurtureInteractionContextService(
      createInMemoryInteractionContextRepository(),
      () => "scenario_token_abcdefghijklmnopqrstuvwxyz0123456789",
      () => new Date("2026-07-13T10:00:00.000Z"),
    );
    return new NurtureInstitutionResolver(repository, interactions, undefined, {
      now: () => new Date("2026-07-13T10:00:00.000Z"),
      generate_option_token: () => `option_token_${String(++optionIndex).padStart(24, "0")}`,
    });
  };

  it("resolves a role-agnostic host surface through current Nurture facts", async () => {
    const result = await makeResolver([binding("role-1", "group-1")]).resolve(envelope());
    expect(result).toMatchObject({
      status: "resolved",
      context: {
        actor: { participant_id: "participant-1", role_assignment_id: "role-1" },
        work_scope: { kind: "care_group", care_group_id: "group-1" },
        policy_seed: { action_key: "open_class_family_inbox", direction: "family_to_org" },
      },
    });
  });

  it("resolves the teacher publish queue only through an exact caregiver CareGroup scope", async () => {
    const result = await makeResolver([binding("role-1", "group-1")]).resolve(
      envelope({ display_state: { selected_view_key: "teacher_publish_queue" } }),
    );
    expect(result).toMatchObject({
      status: "resolved",
      context: {
        actor: {
          participant_id: "participant-1",
          role_kind: "caregiver",
          scope_type: "care_group",
        },
        work_scope: { kind: "care_group", care_group_id: "group-1" },
        policy_seed: { action_key: "query_teacher_publish_queue" },
      },
    });
  });

  it("does not widen the teacher publish queue to an institution-admin binding", async () => {
    const adminBinding: NurtureActorBinding = {
      ...binding("role-admin", "group-1"),
      role_kind: "institution_admin",
      scope_type: "institution",
      scope_id: "institution-1",
      work_scope: { kind: "institution", institution_id: "institution-1" },
    };
    await expect(
      makeResolver([adminBinding]).resolve(
        envelope({ display_state: { selected_view_key: "teacher_publish_queue" } }),
      ),
    ).resolves.toEqual({
      status: "blocked",
      reason_code: "no_reachable_context",
      safe_user_state: "unavailable",
    });
  });

  it("derives an unambiguous workspace from current Nurture participation when host omits it", async () => {
    const input = envelope();
    delete input.host.workspace_id;
    const result = await makeResolver([binding("role-1", "group-1")]).resolve(input);
    expect(result).toMatchObject({
      status: "resolved",
      context: { actor: { participant_id: "participant-1" } },
    });
  });

  it("rejects host-authored Nurture business scope before repository resolution", async () => {
    const result = await makeResolver([binding("role-1", "group-1")]).resolve(
      envelope({ payload: { structured_payload: { careGroupId: "forged-group" } } }),
    );
    expect(result).toEqual({
      status: "blocked",
      reason_code: "invalid_host_envelope",
      safe_user_state: "unavailable",
    });
  });

  it("maps repository failures to a fail-closed resolver state", async () => {
    const resolver = new NurtureInstitutionResolver(
      createInMemoryInstitutionContextRepository({
        listActiveParticipants: async () => {
          throw new Error("database unavailable");
        },
      }),
      new NurtureInteractionContextService(createInMemoryInteractionContextRepository()),
    );
    await expect(resolver.resolve(envelope())).resolves.toEqual({
      status: "blocked",
      reason_code: "resolver_unavailable",
      safe_user_state: "unavailable",
    });
  });

  it("returns opaque structured clarification for equal safe scopes", async () => {
    const result = await makeResolver([
      binding("role-private-1", "group-private-1"),
      binding("role-private-2", "group-private-2"),
    ]).resolve(envelope());
    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification" || result.interaction.kind !== "single_choice") return;
    expect(result.safe_state.reason_code).toBe("ambiguous_context");
    expect(result.interaction.options).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain("role-private");
    expect(JSON.stringify(result)).not.toContain("group-private");
  });

  it("consumes a clarification token once and revalidates the selected path", async () => {
    const resolver = makeResolver([
      binding("role-1", "group-1"),
      binding("role-2", "group-2"),
    ]);
    const first = await resolver.resolve(envelope());
    expect(first.status).toBe("needs_clarification");
    if (first.status !== "needs_clarification" || first.interaction.kind !== "single_choice") return;
    const selected = first.interaction.options[0]!.option_token;
    const continuation = envelope({
      event: { kind: "scenario_token_event" },
      scenario_token: { token: first.scenario_token.token, purpose: "clarify" },
      payload: { structured_payload: { option_token: selected } },
    });
    const resolved = await resolver.resolve(continuation);
    expect(resolved).toMatchObject({
      status: "resolved",
      context: { continuity: { nurture_interaction_context_id: expect.any(String) } },
    });
    await expect(resolver.resolve(continuation)).resolves.toEqual({
      status: "blocked",
      reason_code: "token_replayed",
      safe_user_state: "access_changed",
    });
  });

  it("fails closed when a selected role is revoked after clarification was rendered", async () => {
    const bindings = [binding("role-1", "group-1"), binding("role-2", "group-2")];
    let revoked = false;
    const repository = createInMemoryInstitutionContextRepository({
      listActiveParticipants: async () => [participant],
      listActiveActorBindings: async () => bindings,
      listResolutionCandidates: async () => [],
      revalidateResolutionCandidate: async ({ candidate: selected }) => {
        if (revoked) return { current: false, reason_code: "role_revoked" };
        return {
          current: true,
          participant,
          actor_binding: bindings.find(
            (entry) => entry.actor_binding_ref === selected.actor_binding_ref,
          )!,
          candidate: selected,
        };
      },
    });
    let optionIndex = 0;
    const resolver = new NurtureInstitutionResolver(
      repository,
      new NurtureInteractionContextService(
        createInMemoryInteractionContextRepository(),
        () => "scenario_token_abcdefghijklmnopqrstuvwxyz0123456789",
        () => new Date("2026-07-13T10:00:00.000Z"),
      ),
      undefined,
      {
        now: () => new Date("2026-07-13T10:00:00.000Z"),
        generate_option_token: () => `option_token_${String(++optionIndex).padStart(24, "0")}`,
      },
    );
    const first = await resolver.resolve(envelope());
    expect(first.status).toBe("needs_clarification");
    if (first.status !== "needs_clarification" || first.interaction.kind !== "single_choice") return;
    revoked = true;
    const result = await resolver.resolve(
      envelope({
        event: { kind: "scenario_token_event" },
        scenario_token: { token: first.scenario_token.token, purpose: "clarify" },
        payload: {
          structured_payload: { option_token: first.interaction.options[0]!.option_token },
        },
      }),
    );
    expect(result).toEqual({
      status: "blocked",
      reason_code: "role_revoked",
      safe_user_state: "access_changed",
    });
  });

  it("returns the lifecycle reread by the owner instead of the token snapshot", async () => {
    const actorBinding = binding("role-1", "group-1");
    const currentCandidate = candidate("item-1", {
      actor_binding_ref: actorBinding.actor_binding_ref,
      match_class: "exact_entities",
    });
    const repository = createInMemoryInstitutionContextRepository({
      listActiveParticipants: async () => [participant],
      listActiveActorBindings: async () => [actorBinding],
      listResolutionCandidates: async ({ source_key }) =>
        source_key === "family_care_item" ? [currentCandidate] : [],
      revalidateResolutionCandidate: async ({ candidate: selected }) => ({
        current: true,
        participant,
        actor_binding: actorBinding,
        candidate: {
          ...selected,
          target_ref: { ...selected.target_ref!, lifecycle_state: "acknowledged" },
        },
      }),
    });
    const resolver = new NurtureInstitutionResolver(
      repository,
      new NurtureInteractionContextService(createInMemoryInteractionContextRepository()),
    );
    const result = await resolver.resolve(
      envelope({ display_state: undefined, payload: { text: "item-1" } }),
    );
    expect(result).toMatchObject({
      status: "resolved",
      context: { target: { lifecycle_state: "acknowledged" } },
    });
  });
});

const baseFacts = (): NurturePolicyFacts => ({
  participant_state: "active",
  role_state: "active",
  role_kind: "caregiver",
  scope_reaches_child: true,
  institution_scope_current: true,
  target_scope_state: "in_scope",
  resolved_care_group_ref: "group-1",
  resolved_child_process_ref: "process-1",
  child_in_named_class: true,
  care_group_matches: true,
  child_visible: true,
  thread_state: "active",
  thread_membership_active: true,
  message_state: "sent",
  enrollment_state: "active",
  grant_state: "active",
  grant_terms: [
    {
      directions: ["family_to_org", "org_to_family"],
      data_classes: ["family_care_question"],
      purposes: ["care_coordination"],
    },
  ],
  family_thread_visible: true,
  asset_scope_matches: true,
  child_enrolled: true,
  exposure_policy_present: true,
});

const resolvedContext: NurtureResolvedContext = {
  actor: {
    participant_id: "participant-1",
    my_chat_user_id: "user-1",
    role_assignment_id: "role-1",
    role_kind: "caregiver",
    scope_type: "care_group",
    scope_id: "group-1",
  },
  work_scope: { kind: "care_group", care_group_id: "group-1", enrollment_id: "enrollment-1" },
  target: {
    object_type: "family_care_item",
    object_id: "item-1",
    child_care_process_id: "process-1",
    lifecycle_state: "open",
  },
  continuity: {},
  policy_seed: { action_key: "open_class_family_inbox" },
};

describe("institution structured policy", () => {
  const evaluate = async (facts: NurturePolicyFacts, overrides: Record<string, unknown> = {}) => {
    const repository = createInMemoryInstitutionContextRepository({
      loadPolicyFacts: async () => facts,
    });
    return new NurtureInstitutionPolicyService(repository).evaluate({
      workspace_id: "workspace-1",
      policy_key: "nurture.can_receive_family_context",
      resolved_context: resolvedContext,
      direction: "family_to_org",
      data_class: "family_care_question",
      ...overrides,
    } as Parameters<NurtureInstitutionPolicyService["evaluate"]>[0]);
  };

  it("returns refs-only structured allow evidence", async () => {
    const decision = await evaluate(baseFacts());
    expect(decision).toMatchObject({
      allowed: true,
      reason_code: "allowed",
      audit_payload: { policy_key: "nurture.can_receive_family_context" },
      safe_user_state: "allowed",
    });
    expect(JSON.stringify(decision)).not.toContain("family message body");
  });

  it("maps policy fact read failures to a structured deny", async () => {
    const service = new NurtureInstitutionPolicyService(
      createInMemoryInstitutionContextRepository({
        loadPolicyFacts: async () => {
          throw new Error("database unavailable");
        },
      }),
    );
    await expect(
      service.evaluate({
        workspace_id: "workspace-1",
        policy_key: "nurture.can_view_child_care_process",
        resolved_context: resolvedContext,
      }),
    ).resolves.toMatchObject({
      allowed: false,
      reason_code: "policy_unavailable",
      safe_user_state: "unavailable",
    });
  });

  it.each([
    [{ participant_state: "missing" }, "participant_missing"],
    [{ role_state: "revoked" }, "role_revoked"],
    [{ enrollment_state: "inactive" }, "enrollment_inactive"],
    [{ grant_state: "revoked" }, "grant_revoked"],
    [{ grant_terms: [] as NurturePolicyFacts["grant_terms"] }, "data_class_mismatch"],
    /**
     * G4-A increment 3. Two grants that between them carry the direction and
     * the data class admit nothing — 0C-5 §4 requires both on ONE grant, and
     * the previous single-grant fact shape could not express the difference.
     */
    [
      {
        grant_terms: [
          {
            directions: ["family_to_org"],
            data_classes: ["care_day_note"],
            purposes: ["care_coordination"],
          },
          {
            directions: ["org_to_family"],
            data_classes: ["family_care_question"],
            purposes: ["care_coordination"],
          },
        ] as NurturePolicyFacts["grant_terms"],
      },
      "data_class_mismatch",
    ],
    [{ care_group_matches: false }, "care_group_mismatch"],
  ] as const)("fails closed with %s", async (factOverride, reasonCode) => {
    const decision = await evaluate({ ...baseFacts(), ...factOverride });
    expect(decision).toMatchObject({ allowed: false, reason_code: reasonCode });
  });

  /**
   * 0D-4 fixture 3. Attribution decides which family sees a photo, so only the
   * current exact CareGroup caregiver may confirm one. `institution_admin` was
   * admitted here while all three T-006 capabilities declare
   * `supportedRoles: [caregiver, lead_caregiver]` — the contract denied what
   * this predicate allowed, and nothing but the capability filter's position
   * kept that from mattering.
   */
  it("denies an institution_admin confirming a child media attribution", async () => {
    const decision = await evaluate(
      { ...baseFacts(), role_kind: "institution_admin" },
      { policy_key: "nurture.can_confirm_media_attribution" },
    );
    expect(decision).toMatchObject({ allowed: false, reason_code: "role_missing" });
    // The two roles the contract does support still pass.
    for (const role_kind of ["caregiver", "lead_caregiver"] as const) {
      expect(
        await evaluate(
          { ...baseFacts(), role_kind },
          { policy_key: "nurture.can_confirm_media_attribution" },
        ),
        role_kind,
      ).toMatchObject({ allowed: true });
    }
  });

  it("rechecks redaction before allowing a family-care message write", async () => {
    const decision = await evaluate(
      { ...baseFacts(), message_state: "redacted" },
      { policy_key: "nurture.can_write_family_care_message" },
    );
    expect(decision).toMatchObject({
      allowed: false,
      reason_code: "message_redacted",
      safe_user_state: "access_changed",
    });
  });

  it("reports grant revoke before a stale family-thread locator", async () => {
    const decision = await evaluate(
      { ...baseFacts(), grant_state: "revoked", family_thread_visible: false },
      { policy_key: "nurture.can_share_to_family", direction: "org_to_family" },
    );
    expect(decision).toMatchObject({ allowed: false, reason_code: "grant_revoked" });
  });

  it("allows a caregiver's active care-group collection scope without inventing an enrollment", async () => {
    const decision = await evaluate(
      { ...baseFacts(), enrollment_state: "missing" },
      {
        policy_key: "nurture.caregiver_scope",
        resolved_context: {
          ...resolvedContext,
          work_scope: { kind: "care_group", care_group_id: "group-1" },
          target: undefined,
        },
        direction: undefined,
        data_class: undefined,
      },
    );
    expect(decision).toMatchObject({ allowed: true, reason_code: "allowed" });
  });
});

/**
 * G4-A increment 1 — the 0C authority chain, executed.
 *
 * 0C froze six records and no predicate. These are the first tests that run
 * one, and they exist to catch the specific ways an implementation could
 * satisfy the letter of the freeze while widening it.
 */
describe("nurture.institution_admin_scope (G4-A increment 1)", () => {
  const adminContext = (
    overrides: Partial<NurtureResolvedContext["actor"]> = {},
    // `null` rather than `undefined`: passing undefined would trigger the
    // default parameter and silently restore the target.
    target: NurtureResolvedContext["target"] | null = resolvedContext.target,
  ): NurtureResolvedContext => {
    // Spreading resolvedContext carries its target, so omitting one has to be
    // an explicit delete rather than a conditional spread.
    const { target: _ignored, ...rest } = resolvedContext;
    return {
      ...rest,
      actor: {
        ...resolvedContext.actor,
        role_kind: "institution_admin",
        scope_type: "institution",
        scope_id: "institution-1",
        ...overrides,
      },
      ...(target ? { target } : {}),
    };
  };

  const decide = async (
    facts: Partial<NurturePolicyFacts>,
    context: NurtureResolvedContext = adminContext(),
  ) => {
    const repository = createInMemoryInstitutionContextRepository({
      loadPolicyFacts: async () => ({
        ...baseFacts(),
        role_kind: "institution_admin",
        // G4-A increment 2: the actor's scope now arrives on the STORED
        // channel. These are what the repository echoes from the assignment
        // row, and the predicate reads them instead of the caller's copy.
        actor_scope_type: "institution",
        actor_scope_ref: "institution-1",
        ...facts,
      }),
    });
    const decision = await new NurtureInstitutionPolicyService(repository).evaluate({
      workspace_id: "workspace-1",
      policy_key: "nurture.institution_admin_scope",
      resolved_context: context,
      purpose_key: "care_coordination",
    } as Parameters<NurtureInstitutionPolicyService["evaluate"]>[0]);
    return decision;
  };

  it("allows a current admin whose target sits in the named class", async () => {
    expect(await decide({})).toMatchObject({ reason_code: "allowed" });
  });

  it("denies when no binding resolved, so no stored scope was issued at all", async () => {
    const decision = await decide({
      actor_scope_type: undefined,
      actor_scope_ref: undefined,
    });
    expect(decision).toMatchObject({ reason_code: "not_authorized" });
  });

  it("denies every non-admin role with one indistinguishable code", async () => {
    for (const role of ["guardian", "caregiver", "lead_caregiver", "system_operator"] as const) {
      expect(await decide({ role_kind: role }), role).toMatchObject({
        reason_code: "not_authorized",
      });
    }
  });

  it("denies an admin assignment held at a non-institution scope", async () => {
    // 0C-2: an institution_admin at care_group scope is not widened to that
    // group's institution. Since increment 2 the scope under test is the
    // STORED one — the caller's copy no longer reaches this decision.
    const decision = await decide({ actor_scope_type: "care_group" });
    expect(decision).toMatchObject({ reason_code: "not_authorized" });
  });

  /**
   * G4-A increment 2, and the point of the stored channel.
   *
   * 0C-1 §3 is explicit that a caller MUST NOT synthesize a scope type, yet
   * the increment 1 predicate read `resolved_context.actor.scope_type` for the
   * 0C-2 decision. It happened to fail closed only because
   * `institution_scope_current` is computed from the binding and covered it —
   * incidental safety, not designed. This proves the caller's channel is now
   * disconnected: they claim a scope the stored row contradicts, in the
   * direction that would have denied, and the stored row still decides.
   */
  it("ignores the caller's claimed scope entirely, in both directions", async () => {
    const claimsLess = await decide({}, adminContext({ scope_type: "care_group" }));
    expect(claimsLess).toMatchObject({ reason_code: "allowed" });
    const claimsMore = await decide(
      { actor_scope_type: "care_group" },
      adminContext({ scope_type: "institution" }),
    );
    expect(claimsMore).toMatchObject({ reason_code: "not_authorized" });
  });

  it("denies a non-current institution indistinguishably from a missing one", async () => {
    // 0C-2 collapses paused, archived, deleted, soft-deleted and absent into
    // one code so an Admin cannot probe which ids exist or what state one is
    // in. The repository applies the status/deletedAt conjunction; the
    // predicate sees one boolean.
    expect(await decide({ institution_scope_current: false })).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  it("denies a target outside the scoped institution", async () => {
    expect(await decide({ target_scope_state: "out_of_scope" })).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  /**
   * Regression for the first version's fail-open. `target_scope_state` was a
   * boolean whose fallback returned true whenever no institution edge
   * resolved, so a target that placed nowhere was ALLOWED — the inverse of
   * 0C-2's frozen row. An audit reproduced it at runtime.
   */
  it("denies a supplied target that resolves to no institution", async () => {
    expect(await decide({ target_scope_state: "out_of_scope" })).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  it("denies a class in the admin's own institution that is not current, with its own code", async () => {
    // 0C-3 reserves class_not_current, distinct from the not_authorized that
    // a missing or other-institution class returns.
    expect(await decide({ target_scope_state: "class_not_current" })).toMatchObject({
      reason_code: "class_not_current",
    });
  });

  /**
   * The case 0C-3 was written to prevent, and the reason this increment exists.
   *
   * `scope_reaches_child` matches institutionId alone for an institution-scoped
   * binding, so it is TRUE for a child enrolled in a different class of the
   * same institution. An implementation that reused it would admit this read.
   */
  it("denies a child in another class of the same institution, which the looser fact admits", async () => {
    const decision = await decide({
      scope_reaches_child: true, // the looser existing fact says yes
      child_in_named_class: false, // 0C-3's exact-class fact says no
    });
    expect(decision).toMatchObject({ reason_code: "scope_mismatch" });
  });

  it("allows a class-level read with no child target", async () => {
    const decision = await decide(
      { resolved_child_process_ref: undefined, child_in_named_class: false },
      adminContext({}, null),
    );
    expect(decision).toMatchObject({ reason_code: "allowed" });
  });

  /**
   * Regression for the guard/signal channel mismatch. The first version gated
   * the class check on the caller-supplied `target.child_care_process_id`,
   * while the fact was computed from a childCareProcessId the repository
   * resolves from stored rows. Omitting the optional field skipped the check
   * even though the repository had already computed a denial.
   */
  it("denies a resolved child read even when the caller omitted the child field", async () => {
    const decision = await decide(
      { resolved_child_process_ref: "process-1", child_in_named_class: false },
      adminContext({}, null), // caller supplies no target at all
    );
    expect(decision).toMatchObject({ reason_code: "scope_mismatch" });
  });
});
