import { describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureFamilyCareQueryAccessError,
  NurtureInstitutionWorkQueryService,
  acknowledgeFamilyCareItemSpec,
  cancelFamilyCareRouteSpec,
  createInMemoryInstitutionContextRepository,
  createInMemoryInteractionContextRepository,
  createInMemoryFamilyCareQueryRepository,
  createInMemoryNurtureCommandRepository,
  createNurtureHandlers,
  defaultNurtureDeps,
  familyCareRef,
  familyInputRouteSpec,
  redactFamilyCareMessageSpec,
  replyFamilyCareItemSpec,
  revokeFamilyCareGrantSpec,
  readInstitutionSurface,
  type FamilyCareCancelRouteFacts,
  type FamilyCareCurrentGrant,
  type FamilyCareGrantRevokeFacts,
  type FamilyCareItemActionFacts,
  type FamilyCareRedactionFacts,
  type FamilyInputRouteFacts,
  type NurtureCommandSpec,
  type NurtureFamilyCareCommandTransaction,
  type NurtureResolvedContext,
  type NurtureActorBinding,
  type NurtureFamilyCareQueryRepository,
  type NurtureHandlerDeps,
  type WorkflowStepHandlerInput,
} from "../../src/index.js";

const activeGrant: FamilyCareCurrentGrant = {
  grant_id: "grant-1",
  status: "active" as const,
  directions: ["family_to_org", "org_to_family"],
  data_classes: ["family_care_question"],
  target_scope_type: "care_group",
  target_scope_id: "group-1",
};

const grantRevokeFacts = (
  overrides: Partial<FamilyCareGrantRevokeFacts> = {},
): FamilyCareGrantRevokeFacts => ({
  participant_active: true,
  guardian_role_active: true,
  actor_owns_grant: true,
  role_reaches_grant: true,
  grant_status: "active",
  grant_version: 0,
  child_care_process_id: "process-1",
  output_refs: [familyCareRef("child_link_grant", "grant-1", 0)],
  ...overrides,
});

const routeFacts = (overrides: Partial<FamilyInputRouteFacts> = {}): FamilyInputRouteFacts => ({
  participant_active: true,
  guardian_role_active: true,
  role_reaches_family: true,
  child_process_active: true,
  family_active: true,
  enrollment_active: true,
  thread_active: true,
  thread_membership_active: true,
  grant: { ...activeGrant, directions: [...activeGrant.directions], data_classes: [...activeGrant.data_classes] },
  ...overrides,
});

const itemFacts = (overrides: Partial<FamilyCareItemActionFacts> = {}): FamilyCareItemActionFacts => ({
  participant_active: true,
  caregiver_role_active: true,
  caregiver_scope_matches: true,
  enrollment_active: true,
  thread_active: true,
  thread_membership_active: true,
  grant: { ...activeGrant, directions: [...activeGrant.directions], data_classes: [...activeGrant.data_classes] },
  item_status: "open",
  item_version: 0,
  child_care_process_id: "process-1",
  item_data_class: "family_care_question",
  output_refs: [familyCareRef("family_care_item", "item-1", 0)],
  ...overrides,
});

const redactionFacts = (overrides: Partial<FamilyCareRedactionFacts> = {}): FamilyCareRedactionFacts => ({
  participant_active: true,
  author_role_active: true,
  actor_is_author: true,
  message_status: "sent",
  message_version: 0,
  child_care_process_id: "process-1",
  output_refs: [familyCareRef("family_care_message", "message-1", 0)],
  ...overrides,
});

const cancelFacts = (overrides: Partial<FamilyCareCancelRouteFacts> = {}): FamilyCareCancelRouteFacts => ({
  participant_active: true,
  actor_owns_source: true,
  receipt_status: "pending",
  receipt_version: 0,
  child_care_process_id: "process-1",
  output_refs: [familyCareRef("child_link_receipt", "receipt-1", 0)],
  ...overrides,
});

const routePayload = {
  participant_id: "participant-1",
  role_assignment_id: "guardian-role-1",
  child_care_process_id: "process-1",
  family_id: "family-1",
  enrollment_id: "enrollment-1",
  care_group_id: "group-1",
  thread_id: "thread-1",
  data_class: "family_care_question" as const,
  category: "question" as const,
  urgency: "today_attention" as const,
  safe_summary: "Pickup plan needs confirmation",
  protected_content_ref: familyCareRef("protected_message_content", "content-1", 1),
  attachment_refs: [],
  source_surface: "mobile" as const,
  routing_attempt_key: "route-1",
  route_mode: "immediate" as const,
  requires_ack: true,
  requires_reply: true,
};

const makeHarness = (overrides: {
  revoke?: FamilyCareGrantRevokeFacts;
  route?: FamilyInputRouteFacts;
  item?: FamilyCareItemActionFacts;
  redaction?: FamilyCareRedactionFacts;
  cancel?: FamilyCareCancelRouteFacts;
} = {}) => {
  const calls = { revoke: 0, route: 0, acknowledge: 0, reply: 0, redact: 0, cancel: 0 };
  const familyCare: NurtureFamilyCareCommandTransaction = {
    loadFamilyCareGrantRevokeFacts: async () => overrides.revoke ?? grantRevokeFacts(),
    revokeFamilyCareGrant: async () => {
      calls.revoke += 1;
      return {
        grant_ref: familyCareRef("child_link_grant", "grant-1", 1),
        affected_item_refs: [familyCareRef("family_care_item", "item-1", 1)],
        affected_receipt_refs: [familyCareRef("child_link_receipt", "receipt-1", 1)],
      };
    },
    loadFamilyInputRouteFacts: async () => overrides.route ?? routeFacts(),
    applyFamilyInputRoute: async () => {
      calls.route += 1;
      return {
        message_ref: familyCareRef("family_care_message", "message-1", 0),
        receipt_ref: familyCareRef("child_link_receipt", "receipt-1", 0),
        item_ref: familyCareRef("family_care_item", "item-1", 0),
        attention_ref: familyCareRef("teacher_attention_item", "attention-1", 0),
      };
    },
    loadFamilyCareItemActionFacts: async () => overrides.item ?? itemFacts(),
    acknowledgeFamilyCareItem: async () => {
      calls.acknowledge += 1;
      return {
        item_ref: familyCareRef("family_care_item", "item-1", 1),
        item_event_ref: familyCareRef("family_care_item_event", "event-1", 1),
        receipt_ref: familyCareRef("child_link_receipt", "receipt-1", 1),
      };
    },
    replyToFamilyCareItem: async () => {
      calls.reply += 1;
      return {
        item_ref: familyCareRef("family_care_item", "item-1", 1),
        item_event_ref: familyCareRef("family_care_item_event", "event-2", 1),
        message_ref: familyCareRef("family_care_message", "message-2", 0),
        receipt_ref: familyCareRef("child_link_receipt", "receipt-2", 0),
      };
    },
    loadFamilyCareRedactionFacts: async () => overrides.redaction ?? redactionFacts(),
    redactFamilyCareMessage: async () => {
      calls.redact += 1;
      return {
        message_ref: familyCareRef("family_care_message", "message-1", 1),
        affected_item_refs: [familyCareRef("family_care_item", "item-1", 1)],
        affected_receipt_refs: [familyCareRef("child_link_receipt", "receipt-1", 1)],
      };
    },
    loadFamilyCareCancelRouteFacts: async () => overrides.cancel ?? cancelFacts(),
    cancelFamilyCareRoute: async () => {
      calls.cancel += 1;
      return { receipt_ref: familyCareRef("child_link_receipt", "receipt-1", 1) };
    },
  };
  return {
    calls,
    runner: new NurtureCommandRunner(createInMemoryNurtureCommandRepository({ familyCare })),
  };
};

const execute = <T>(
  runner: NurtureCommandRunner,
  spec: NurtureCommandSpec<T>,
  payload: T,
  commandRequestId: string,
  businessActorRef =
    payload &&
    typeof payload === "object" &&
    "participant_id" in payload &&
    typeof payload.participant_id === "string"
      ? payload.participant_id
      : "participant-1",
) =>
  runner.execute({
    workspace_id: "workspace-1",
    invocation_request_id: `invocation:${commandRequestId}`,
    command_request_id: commandRequestId,
    business_actor_ref: businessActorRef,
    child_care_process_id: "process-1",
    payload,
    spec,
  });

describe("family input to class inbox command closure", () => {
  it("revokes the grant and returns bounded affected refs with explicit empty activation", async () => {
    const { runner, calls } = makeHarness();
    const payload = {
      participant_id: "participant-1",
      role_assignment_id: "guardian-role-1",
      grant_id: "grant-1",
      expected_version: 0,
      reason_code: "user_revoked",
    };
    const result = await execute(runner, revokeFamilyCareGrantSpec, payload, "revoke-grant-1");
    expect(result).toMatchObject({
      status: "ok",
      business_outcome: "applied",
      handoff_request_snapshots: [],
      output_refs: expect.arrayContaining([
        expect.objectContaining({ object_type: "child_link_grant" }),
        expect.objectContaining({ object_type: "family_care_item" }),
        expect.objectContaining({ object_type: "child_link_receipt" }),
      ]),
    });
    expect(calls.revoke).toBe(1);
  });

  it("converges an already revoked grant only for its authorized owner", async () => {
    const payload = {
      participant_id: "participant-1",
      role_assignment_id: "guardian-role-1",
      grant_id: "grant-1",
      expected_version: 0,
      reason_code: "user_revoked",
    };
    const converged = makeHarness({ revoke: grantRevokeFacts({ grant_status: "revoked" }) });
    await expect(
      execute(converged.runner, revokeFamilyCareGrantSpec, payload, "revoke-converged"),
    ).resolves.toMatchObject({ status: "ok", business_outcome: "already_satisfied" });
    expect(converged.calls.revoke).toBe(0);

    const unauthorized = makeHarness({
      revoke: grantRevokeFacts({ grant_status: "revoked", actor_owns_grant: false }),
    });
    await expect(
      execute(unauthorized.runner, revokeFamilyCareGrantSpec, payload, "revoke-other-owner"),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "role_missing" });
  });

  it("commits refs for message, receipt, item, and attention with explicit empty activation", async () => {
    const { runner, calls } = makeHarness();
    const result = await execute(runner, familyInputRouteSpec, routePayload, "capture-1");
    expect(result).toMatchObject({
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
      handoff_request_snapshots: [],
      output_refs: [
        { object_type: "family_care_message" },
        { object_type: "child_link_receipt" },
        { object_type: "family_care_item" },
        { object_type: "teacher_attention_item" },
      ],
    });
    expect(calls.route).toBe(1);
  });

  it("replays the exact command without a second business effect", async () => {
    const { runner, calls } = makeHarness();
    await execute(runner, familyInputRouteSpec, routePayload, "capture-replay");
    const replay = await execute(runner, familyInputRouteSpec, routePayload, "capture-replay");
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(calls.route).toBe(1);
  });

  it("blocks immediate routing after grant revoke", async () => {
    const { runner, calls } = makeHarness({
      route: routeFacts({ grant: { ...activeGrant, status: "revoked" } }),
    });
    const result = await execute(runner, familyInputRouteSpec, routePayload, "capture-revoked");
    expect(result).toMatchObject({ status: "not_committed", reason_code: "grant_revoked" });
    expect(calls.route).toBe(0);
  });

  it("requires a durable driver ref for a pending workflow route", async () => {
    const { runner } = makeHarness();
    const result = await execute(
      runner,
      familyInputRouteSpec,
      { ...routePayload, route_mode: "pending_workflow" as const },
      "capture-pending-invalid",
    );
    expect(result).toMatchObject({ status: "not_committed", reason_code: "invalid_family_input" });
  });

  it("accepts a refs-only versioned workflow Step driver without treating it as authorization", async () => {
    const { runner } = makeHarness({
      route: routeFacts({ grant: { ...activeGrant, status: "revoked" } }),
    });
    const result = await execute(
      runner,
      familyInputRouteSpec,
      {
        ...routePayload,
        route_mode: "pending_workflow" as const,
        pending_driver_ref: {
          namespace: "my_chat",
          consumer_scenario_key: "nurture",
          object_type: "workflow_step",
          object_id: "step-1",
          version: 3,
          owner_scope: "workspace" as const,
        },
      },
      "capture-pending-valid",
    );
    expect(result).toMatchObject({ status: "ok", handoff_request_snapshots: [] });
  });

  it("rejects claim material or a non-Nurture protected-content reference", async () => {
    const { runner } = makeHarness();
    const unsafeRef = {
      ...routePayload.protected_content_ref,
      namespace: "my_chat",
      claim_token: "must-not-cross-boundary",
    } as typeof routePayload.protected_content_ref;
    const result = await execute(
      runner,
      familyInputRouteSpec,
      { ...routePayload, protected_content_ref: unsafeRef },
      "capture-unsafe-ref",
    );
    expect(result).toMatchObject({ status: "not_committed", reason_code: "invalid_family_input" });
  });

  it("rejects a payload workspace that conflicts with the command envelope", async () => {
    const { runner, calls } = makeHarness();
    const result = await execute(
      runner,
      familyInputRouteSpec,
      { ...routePayload, workspace_id: "other-workspace" } as typeof routePayload,
      "capture-wrong-workspace",
    );
    expect(result).toMatchObject({
      status: "not_committed",
      reason_code: "invalid_command_workspace",
    });
    expect(calls.route).toBe(0);
  });

  it("binds the payload actor and child scope to the command envelope", async () => {
    const actorMismatch = makeHarness();
    await expect(
      execute(
        actorMismatch.runner,
        familyInputRouteSpec,
        { ...routePayload, participant_id: "participant-2" },
        "capture-wrong-actor",
        "participant-1",
      ),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "invalid_command_identity" });
    expect(actorMismatch.calls.route).toBe(0);

    const scopeMismatch = makeHarness();
    await expect(
      execute(
        scopeMismatch.runner,
        familyInputRouteSpec,
        { ...routePayload, child_care_process_id: "process-2" },
        "capture-wrong-scope",
      ),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "invalid_command_scope" });
    expect(scopeMismatch.calls.route).toBe(0);
  });
});

describe("teacher item action closure", () => {
  const acknowledgePayload = {
    participant_id: "teacher-1",
    role_assignment_id: "caregiver-role-1",
    item_id: "item-1",
    expected_version: 0,
    required_direction: "family_to_org" as const,
  };

  it("acknowledges through a versioned event-producing command", async () => {
    const { runner, calls } = makeHarness();
    const result = await execute(
      runner,
      acknowledgeFamilyCareItemSpec,
      acknowledgePayload,
      "ack-1",
    );
    expect(result).toMatchObject({
      status: "ok",
      output_refs: expect.arrayContaining([
        expect.objectContaining({ object_type: "family_care_item" }),
      ]),
    });
    expect(calls.acknowledge).toBe(1);
  });

  it("treats an already acknowledged item as convergent without another event", async () => {
    const { runner, calls } = makeHarness({ item: itemFacts({ item_status: "acknowledged" }) });
    const result = await execute(
      runner,
      acknowledgeFamilyCareItemSpec,
      acknowledgePayload,
      "ack-converged",
    );
    expect(result).toMatchObject({ status: "ok", business_outcome: "already_satisfied" });
    expect(calls.acknowledge).toBe(0);
  });

  it("rechecks a revoked grant before converging an already acknowledged item", async () => {
    const { runner, calls } = makeHarness({
      item: itemFacts({
        item_status: "acknowledged",
        grant: { ...activeGrant, status: "revoked" },
      }),
    });
    const result = await execute(
      runner,
      acknowledgeFamilyCareItemSpec,
      acknowledgePayload,
      "ack-converged-revoked",
    );
    expect(result).toMatchObject({ status: "not_committed", reason_code: "grant_revoked" });
    expect(calls.acknowledge).toBe(0);
  });

  it("rejects stale item versions and revoked grants", async () => {
    const stale = makeHarness({ item: itemFacts({ item_version: 2 }) });
    await expect(
      execute(stale.runner, acknowledgeFamilyCareItemSpec, acknowledgePayload, "ack-stale"),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "item_version_conflict" });
    const revoked = makeHarness({
      item: itemFacts({ grant: { ...activeGrant, status: "revoked" } }),
    });
    await expect(
      execute(revoked.runner, acknowledgeFamilyCareItemSpec, acknowledgePayload, "ack-revoked"),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "grant_revoked" });
  });

  it("writes caregiver-confirmed reply refs only when org-to-family grant is current", async () => {
    const { runner, calls } = makeHarness();
    const result = await execute(
      runner,
      replyFamilyCareItemSpec,
      {
        ...acknowledgePayload,
        required_direction: "org_to_family",
        protected_content_ref: familyCareRef("protected_message_content", "content-2", 1),
        safe_summary: "Pickup plan confirmed",
        routing_attempt_key: "reply-route-1",
      },
      "reply-1",
    );
    expect(result).toMatchObject({
      status: "ok",
      output_refs: expect.arrayContaining([
        expect.objectContaining({ object_type: "family_care_message" }),
        expect.objectContaining({ object_type: "child_link_receipt" }),
      ]),
    });
    expect(calls.reply).toBe(1);
  });

  it("requires current caregiver membership before acknowledging or replying", async () => {
    const acknowledgeHarness = makeHarness({
      item: itemFacts({ thread_membership_active: false }),
    });
    await expect(
      execute(
        acknowledgeHarness.runner,
        acknowledgeFamilyCareItemSpec,
        acknowledgePayload,
        "ack-no-thread-membership",
      ),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "thread_inactive" });
    expect(acknowledgeHarness.calls.acknowledge).toBe(0);

    const replyHarness = makeHarness({
      item: itemFacts({ thread_membership_active: false }),
    });
    const result = await execute(
      replyHarness.runner,
      replyFamilyCareItemSpec,
      {
        ...acknowledgePayload,
        required_direction: "org_to_family",
        protected_content_ref: familyCareRef("protected_message_content", "content-3", 1),
        safe_summary: "Pickup plan confirmed",
        routing_attempt_key: "reply-route-without-membership",
      },
      "reply-no-thread-membership",
    );
    expect(result).toMatchObject({ status: "not_committed", reason_code: "thread_inactive" });
    expect(replyHarness.calls.reply).toBe(0);
  });
});

describe("redaction and pre-delivery cancel", () => {
  it("redacts the source and returns affected projection/receipt refs", async () => {
    const { runner, calls } = makeHarness();
    const result = await execute(
      runner,
      redactFamilyCareMessageSpec,
      {
        participant_id: "participant-1",
        role_assignment_id: "guardian-role-1",
        message_id: "message-1",
        expected_version: 0,
        reason_code: "user_redacted",
      },
      "redact-1",
    );
    expect(result).toMatchObject({ status: "ok", handoff_request_snapshots: [] });
    expect(calls.redact).toBe(1);
  });

  it("cancels only a pending, version-matched route", async () => {
    const payload = {
      participant_id: "participant-1",
      role_assignment_id: "guardian-role-1",
      receipt_id: "receipt-1",
      expected_version: 0,
    };
    const pending = makeHarness();
    await expect(
      execute(pending.runner, cancelFamilyCareRouteSpec, payload, "cancel-1"),
    ).resolves.toMatchObject({ status: "ok" });
    expect(pending.calls.cancel).toBe(1);
    const delivered = makeHarness({ cancel: cancelFacts({ receipt_status: "delivered" }) });
    await expect(
      execute(delivered.runner, cancelFamilyCareRouteSpec, payload, "cancel-visible"),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "route_already_visible" });
  });

  it("does not expose convergent cancellation to a different actor", async () => {
    const payload = {
      participant_id: "participant-1",
      role_assignment_id: "guardian-role-1",
      receipt_id: "receipt-1",
      expected_version: 0,
    };
    const { runner } = makeHarness({
      cancel: cancelFacts({
        actor_owns_source: false,
        receipt_status: "blocked",
        receipt_reason_code: "user_cancelled_before_delivery",
      }),
    });
    await expect(
      execute(runner, cancelFamilyCareRouteSpec, payload, "cancel-other-actor"),
    ).resolves.toMatchObject({ status: "not_committed", reason_code: "role_missing" });
  });
});

const caregiverContext: NurtureResolvedContext = {
  actor: {
    participant_id: "teacher-1",
    my_chat_user_id: "user-teacher",
    role_assignment_id: "caregiver-role-1",
    role_kind: "caregiver",
    scope_type: "care_group",
    scope_id: "group-1",
  },
  work_scope: { kind: "care_group", care_group_id: "group-1" },
  continuity: {},
  policy_seed: { action_key: "open_class_family_inbox", direction: "family_to_org" },
};

describe("class-of-10 safe collection queries", () => {
  it("aggregates ten child-private workflows without returning message bodies", async () => {
    const repository = createInMemoryFamilyCareQueryRepository({
      listClassFamilyInbox: async () =>
        Array.from({ length: 10 }, (_, index) => ({
          item_id: `item-${index}`,
          child_care_process_id: `process-${index}`,
          child_display_name: `Child ${index + 1}`,
          category: "question",
          urgency: "normal",
          status: "open",
          safe_summary: `Safe item ${index + 1}`,
          requires_ack: true,
          requires_reply: false,
          version: 0,
          updated_at: "2026-07-13T10:00:00.000Z",
        })),
    });
    const result = await new NurtureInstitutionWorkQueryService(repository).openClassFamilyInbox({
      workspace_id: "workspace-1",
      context: caregiverContext,
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.items).toHaveLength(10);
    expect(new Set(result.items.map((item) => item.child_care_process_id))).toHaveProperty("size", 10);
    expect(JSON.stringify(result)).not.toContain("private message body");
    expect(JSON.stringify(result)).not.toContain("thread_id");
  });

  it("requires a resolved caregiver care-group scope", async () => {
    const service = new NurtureInstitutionWorkQueryService(
      createInMemoryFamilyCareQueryRepository(),
    );
    const result = await service.openClassFamilyInbox({
      workspace_id: "workspace-1",
      context: {
        ...caregiverContext,
        actor: { ...caregiverContext.actor, role_kind: "guardian" },
      },
    });
    expect(result).toEqual({ status: "blocked", reason_code: "care_group_mismatch" });
  });

  it("opens the current attention board and rejects impossible dates", async () => {
    const repository = createInMemoryFamilyCareQueryRepository({
      listTeacherAttentionBoard: async () => [
        {
          attention_item_id: "attention-1",
          child_care_process_id: "process-1",
          child_display_name: "Child 1",
          source_type: "family_care_item",
          source_id: "item-1",
          safe_title: "Pickup confirmation",
          priority: "attention",
          effective_date: "2026-07-13",
          aggregate_version: 0,
        },
      ],
    });
    const service = new NurtureInstitutionWorkQueryService(repository);
    await expect(
      service.openTeacherAttentionBoard({
        workspace_id: "workspace-1",
        context: caregiverContext,
        on_date: "2026-07-13",
      }),
    ).resolves.toMatchObject({ status: "ok", items: [{ attention_item_id: "attention-1" }] });
    await expect(
      service.openTeacherAttentionBoard({
        workspace_id: "workspace-1",
        context: caregiverContext,
        on_date: "2026-02-31",
      }),
    ).resolves.toEqual({ status: "blocked", reason_code: "query_unavailable" });
  });

  it("distinguishes a stale authorization fence from a repository outage", async () => {
    const denied = new NurtureInstitutionWorkQueryService(
      createInMemoryFamilyCareQueryRepository({
        listClassFamilyInbox: async () => {
          throw new NurtureFamilyCareQueryAccessError();
        },
      }),
    );
    await expect(
      denied.openClassFamilyInbox({ workspace_id: "workspace-1", context: caregiverContext }),
    ).resolves.toEqual({ status: "blocked", reason_code: "role_missing" });

    const unavailable = new NurtureInstitutionWorkQueryService(
      createInMemoryFamilyCareQueryRepository({
        listClassFamilyInbox: async () => {
          throw new Error("database unavailable");
        },
      }),
    );
    await expect(
      unavailable.openClassFamilyInbox({ workspace_id: "workspace-1", context: caregiverContext }),
    ).resolves.toEqual({ status: "blocked", reason_code: "query_unavailable" });
  });
});

const surfaceParticipant = {
  workspace_id: "workspace-1",
  participant_id: "teacher-1",
  my_chat_user_id: "user-teacher",
  display_name: "Caregiver",
};

const surfaceBinding = (
  id = "caregiver-role-1",
  groupId = "group-1",
  safeLabel = "Current care group",
): NurtureActorBinding => ({
  actor_binding_ref: id,
  participant_id: surfaceParticipant.participant_id,
  role_assignment_id: id,
  role_kind: "caregiver",
  scope_type: "care_group",
  scope_id: groupId,
  work_scope: { kind: "care_group", care_group_id: groupId },
  safe_scope_label: safeLabel,
});

const surfaceDeps = (
  query: NurtureFamilyCareQueryRepository,
  bindings: NurtureActorBinding[] = [surfaceBinding()],
): NurtureHandlerDeps => ({
  ...defaultNurtureDeps,
  repositories: {
    ...defaultNurtureDeps.repositories,
    interactions: createInMemoryInteractionContextRepository(),
    institution: createInMemoryInstitutionContextRepository({
      listActiveParticipants: async () => [surfaceParticipant],
      listActiveActorBindings: async () => bindings,
      listResolutionCandidates: async () => [],
      revalidateResolutionCandidate: async ({ candidate }) => {
        const actorBinding = bindings.find(
          (binding) => binding.actor_binding_ref === candidate.actor_binding_ref,
        );
        return actorBinding
          ? {
              current: true as const,
              participant: surfaceParticipant,
              actor_binding: actorBinding,
              candidate,
            }
          : { current: false as const, reason_code: "role_missing" as const };
      },
    }),
    familyCareQuery: query,
  },
});

const institutionStepInput: WorkflowStepHandlerInput = {
  run_id: "run-inbox-1",
  step_id: "step-inbox-1",
  step_key: "open_class_family_inbox",
  scenario_key: "nurture",
  capability_key: "class_family_inbox",
  entrypoint_key: "open_class_family_inbox",
  workflow_version_id: "nurture-class-family-inbox-v1",
  contract_hash: "contract-hash",
  meta: {
    workspace_id: "workspace-1",
    actor_id: "user-teacher",
    idempotency_key: "open-inbox-1",
    correlation_id: "correlation-1",
    client_surface: "mobile_dashboard",
  },
};

describe("institution scenario surfaces", () => {
  const inboxRepository = () =>
    createInMemoryFamilyCareQueryRepository({
      listClassFamilyInbox: async () => [
        {
          item_id: "item-private-1",
          child_care_process_id: "process-private-1",
          child_display_name: "Child 1",
          category: "question",
          urgency: "today_attention",
          status: "open",
          safe_summary: "Pickup plan needs confirmation",
          requires_ack: true,
          requires_reply: true,
          version: 3,
          updated_at: "2026-07-14T08:00:00.000Z",
        },
      ],
    });

  it("resolves current Nurture scope and returns display-safe opaque items", async () => {
    const result = await readInstitutionSurface(surfaceDeps(inboxRepository()), {
      view_key: "class_family_inbox",
      workspace_id: "workspace-1",
      my_chat_user_id: "user-teacher",
      host_request_id: "read-1",
      surface: "mobile_dashboard",
    });
    expect(result).toMatchObject({
      status: "ready",
      items: [
        {
          opaque_ref: "nurture:item:item-private-1",
          safe_summary: "Pickup plan needs confirmation",
          requires_attention: true,
          aggregate_version: 3,
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("process-private-1");
    expect(JSON.stringify(result)).not.toContain("thread_id");
    expect(JSON.stringify(result)).not.toContain("grant_id");
  });

  it("returns structured clarification rather than accepting a host-selected care group", async () => {
    const result = await readInstitutionSurface(
      surfaceDeps(inboxRepository(), [
        surfaceBinding("role-1", "group-1", "Blue room"),
        surfaceBinding("role-2", "group-2", "Green room"),
      ]),
      {
        view_key: "class_family_inbox",
        workspace_id: "workspace-1",
        my_chat_user_id: "user-teacher",
        host_request_id: "read-ambiguous",
        surface: "mobile_dashboard",
      },
    );
    expect(result).toMatchObject({
      status: "needs_clarification",
      interaction: { kind: "single_choice" },
    });
    expect(JSON.stringify(result)).not.toContain("group-1");
    expect(JSON.stringify(result)).not.toContain("group-2");
  });

  it("fails closed when the owner query rejects current access", async () => {
    const result = await readInstitutionSurface(
      surfaceDeps(
        createInMemoryFamilyCareQueryRepository({
          listClassFamilyInbox: async () => {
            throw new NurtureFamilyCareQueryAccessError();
          },
        }),
      ),
      {
        view_key: "class_family_inbox",
        workspace_id: "workspace-1",
        my_chat_user_id: "user-teacher",
        host_request_id: "read-revoked",
        surface: "mobile_dashboard",
      },
    );
    expect(result).toEqual({
      status: "unavailable",
      view_key: "class_family_inbox",
      safe_title: "Class family inbox",
      safe_summary: "This care-group view is not currently available.",
      safe_reason_code: "access_changed",
    });
  });

  it("keeps workflow completion explicit-empty while the direct surface owner-read is available", async () => {
    const handler = createNurtureHandlers(surfaceDeps(inboxRepository()))[
      "nurture.open_class_family_inbox"
    ];
    expect(handler).toBeDefined();
    const result = await handler!(institutionStepInput);
    expect(result).toMatchObject({
      status: "completed",
      handoff_drafts: [],
      artifact_drafts: [
        {
          artifact_type: "family_care_inbox_summary",
          safe_summary: "1 current family-care item(s).",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("Pickup plan needs confirmation");

    const ambiguousHandler = createNurtureHandlers(
      surfaceDeps(inboxRepository(), [
        surfaceBinding("role-1", "group-1", "Blue room"),
        surfaceBinding("role-2", "group-2", "Green room"),
      ]),
    )["nurture.open_class_family_inbox"];
    await expect(ambiguousHandler!(institutionStepInput)).resolves.toMatchObject({
      status: "manual_review_required",
      reason_code: "unavailable",
    });
  });
});
