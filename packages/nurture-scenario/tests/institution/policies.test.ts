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
  care_group_matches: true,
  child_visible: true,
  thread_state: "active",
  thread_membership_active: true,
  message_state: "sent",
  enrollment_state: "active",
  grant_state: "active",
  grant_directions: ["family_to_org", "org_to_family"],
  grant_data_classes: ["family_care_question"],
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
    [{ grant_data_classes: [] as NurturePolicyFacts["grant_data_classes"] }, "data_class_mismatch"],
    [{ care_group_matches: false }, "care_group_mismatch"],
  ] as const)("fails closed with %s", async (factOverride, reasonCode) => {
    const decision = await evaluate({ ...baseFacts(), ...factOverride });
    expect(decision).toMatchObject({ allowed: false, reason_code: reasonCode });
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
