import { describe, expect, it, vi } from "vitest";
import type {
  NurtureCareRole,
  NurtureHostInvocationEnvelope,
  NurtureResolverResult,
} from "@the-nurture/scenario";
import {
  TeacherReleaseOwnerComposition,
  type TeacherReleaseOwnerConfirmRequestV3,
  type TeacherReleaseOwnerEngine,
  type TeacherReleaseOwnerPrepareRequestV3,
  type TeacherReleaseOwnerQueryRequestV3,
} from "../src/teacher-release-owner-composition.js";

const identity = {
  workspace_id: "workspace-1",
  my_chat_user_id: "user-1",
  host_request_id: "host-request-1",
} as const;

const targetSnapshotRef = `1.1786269900000.${"a".repeat(64)}`;

const queryOutput = () => ({
  binding: {
    contract: {
      key: "nurture.surface-contract",
      version: "1.20.0",
      digest:
        "sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273",
    },
    capability: { key: "query_teacher_publish_queue", version: "1.0.0" },
    actor: {
      role: "caregiver",
      scopeKind: "care_group",
      scopeRef: "1.opaque-care-group",
    },
    snapshot: { snapshotRef: "1.opaque-snapshot", snapshotVersion: 11 },
    order: "state_rank_asc,occurred_at_desc,id_desc",
    sourceHeads: [],
  },
  careGroupRef: "1.opaque-care-group",
  counts: {
    draft: 0,
    needs_review: 0,
    pending_release: 1,
    released: 0,
    cancelled: 0,
  },
  items: [
    {
      processRef: "1.opaque-process",
      state: "pending_release",
      dataClass: "child_growth_record",
      title: "Today’s class update",
      revision: 4,
      targetSummary: { total: 1, released: 0 },
      occurredAt: "2026-08-09T08:00:00.000Z",
      editHoldActive: false,
      actions: [
        {
          capabilityKey: "release_publish_process",
          capabilityVersion: "1.0.0",
          targetOptionRef: "1.opaque-process",
          availability: "available",
        },
      ],
    },
  ],
  pageInfo: { hasMore: false },
});

const resolvedOwner = (
  participantId: string,
  roleKind: NurtureCareRole = "caregiver",
): NurtureResolverResult => ({
  status: "resolved",
  context: {
    actor: {
      participant_id: participantId,
      my_chat_user_id: identity.my_chat_user_id,
      role_assignment_id: `role-${participantId}`,
      role_kind: roleKind,
      scope_type:
        roleKind === "institution_admin" ? "institution" : "care_group",
      scope_id:
        roleKind === "institution_admin"
          ? "institution-private"
          : "group-private",
    },
    work_scope:
      roleKind === "institution_admin"
        ? { kind: "institution", institution_id: "institution-private" }
        : { kind: "care_group", care_group_id: "group-private" },
    continuity: {},
    policy_seed: { action_key: "query_teacher_publish_queue" },
  },
});

const createEngine = () => ({
  query: vi.fn<TeacherReleaseOwnerEngine["query"]>(async () => ({
    status: "ok",
    output: queryOutput(),
  })),
  prepare: vi.fn<TeacherReleaseOwnerEngine["prepare"]>(async () => ({
    status: "ready_to_confirm",
    preview: {
      effect: "release_publish_process",
      target_count: 2,
      already_committed_count: 0,
      release_revision: 4,
    },
    confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    expires_at: "2026-08-09T10:05:00.000Z",
    command_request_id: "command-1",
  })),
  presentReleaseTargets: vi.fn<
    TeacherReleaseOwnerEngine["presentReleaseTargets"]
  >(async () => ({
    status: "ready",
    presentation: {
      selectionMode: "fixed_process_targets",
      processRef: "1.opaque-process",
      targetSnapshotRef,
      snapshotVersion: "1.opaque-snapshot-version",
      generatedAt: "2026-08-09T10:00:00.000Z",
      expiresAt: "2026-08-09T10:05:00.000Z",
      targets: [
        {
          targetRef: "1.opaque-target",
          availability: "available",
          displayLabel: "小雨家庭",
        },
      ],
    },
  })),
  execute: vi.fn<TeacherReleaseOwnerEngine["execute"]>(async () => ({
    status: "committed",
    execution_disposition: "executed",
    business_outcome: "applied",
    execution_ref: { ref: "attempt-1" },
    output_refs: [],
    committed_result: {
      processState: "released",
      frozenRevision: 4,
      results: [
        {
          targetRef: "1.opaque-target",
          outcome: "committed",
          publicationRef: "1.opaque-publication",
          receiptRef: "1.opaque-receipt",
        },
      ],
      summary: { total: 1, committed: 1, rejected: 0, outcomeUnknown: 0 },
      missedSendAttention: false,
    },
  })),
});

describe("Q6 teacher release owner composition", () => {
  it("projects strict public results for all four operations", async () => {
    const fixtureEngine = createEngine();
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-current") },
      fixtureEngine,
    );

    await expect(composition.query(identity)).resolves.toMatchObject({
      status: "ready",
      result: { status: "ok", output: { counts: { pending_release: 1 } } },
    });
    await expect(
      composition.targets({
        ...identity,
        process_ref: "1.opaque-process",
        action_option_ref: "1.opaque-process",
      }),
    ).resolves.toMatchObject({
      status: "ready",
      result: {
        status: "ok",
        detail: { selectionMode: "fixed_process_targets" },
      },
    });
    await expect(
      composition.prepare({
        ...identity,
        process_ref: "1.opaque-process",
        action_option_ref: "1.opaque-process",
        target_snapshot_ref: targetSnapshotRef,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      result: { status: "ready_to_confirm" },
    });
    const confirmed = await composition.confirm({
      ...identity,
      invocation_request_id: "invocation-1",
      command_request_id: "command-1",
      confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });
    expect(confirmed).toMatchObject({
      status: "ready",
      result: {
        status: "committed",
        committed_result: { processState: "released" },
      },
    });
    expect(confirmed).not.toHaveProperty("result.execution_ref");
    expect(confirmed).not.toHaveProperty("result.output_refs");
  });

  it("reruns owner resolution for every operation and uses only the current participant", async () => {
    const envelopes: NurtureHostInvocationEnvelope[] = [];
    const participants = [
      "participant-query",
      "participant-targets",
      "participant-prepare",
      "participant-confirm",
    ];
    const resolver = {
      resolve: vi.fn(async (envelope: NurtureHostInvocationEnvelope) => {
        envelopes.push(envelope);
        const participantId = participants.shift();
        if (!participantId) throw new Error("unexpected resolver call");
        return resolvedOwner(participantId);
      }),
    };
    const engine = createEngine();
    const composition = new TeacherReleaseOwnerComposition(resolver, engine);

    const forgedQuery = {
      ...identity,
      actor_participant_id: "participant-forged",
      care_group_id: "group-forged",
      page_size: 20,
    } as unknown as TeacherReleaseOwnerQueryRequestV3;
    const query = await composition.query(forgedQuery);
    const targets = await composition.targets({
      ...identity,
      host_request_id: "host-request-targets",
      process_ref: "1.opaque-process",
      action_option_ref: "1.opaque-process",
    });
    const prepare = await composition.prepare({
      ...identity,
      host_request_id: "host-request-2",
      process_ref: "sealed-process-1",
      action_option_ref: "sealed-process-1",
      target_snapshot_ref: targetSnapshotRef,
    });
    const confirm = await composition.confirm({
      ...identity,
      host_request_id: "host-request-3",
      invocation_request_id: "invocation-1",
      command_request_id: "command-1",
      confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });

    expect([query.status, targets.status, prepare.status, confirm.status]).toEqual([
      "ready",
      "ready",
      "ready",
      "ready",
    ]);
    expect(resolver.resolve).toHaveBeenCalledTimes(4);
    expect(engine.query).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_participant_id: "participant-query",
        capability_key: "query_teacher_publish_queue",
        capability_version: "1.0.0",
      }),
    );
    expect(engine.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_participant_id: "participant-prepare",
        capability_key: "release_publish_process",
        capability_version: "1.0.0",
      }),
    );
    expect(engine.presentReleaseTargets).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      actor_participant_id: "participant-targets",
      process_ref: "1.opaque-process",
    });
    expect(engine.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_participant_id: "participant-confirm",
        capability_key: "release_publish_process",
        capability_version: "1.0.0",
      }),
    );
    expect(envelopes).toHaveLength(4);
    for (const envelope of envelopes) {
      expect(envelope).toMatchObject({
        host: {
          workspace_id: "workspace-1",
          my_chat_user_id: "user-1",
          scenario_key: "nurture",
          surface: "board",
        },
        display_state: { selected_view_key: "teacher_publish_queue" },
      });
      expect(JSON.stringify(envelope)).not.toContain("participant-forged");
      expect(JSON.stringify(envelope)).not.toContain("group-forged");
    }
  });

  it("returns an opaque clarification without invoking a qualified operation", async () => {
    const engine = createEngine();
    const composition = new TeacherReleaseOwnerComposition(
      {
        resolve: async () => ({
          status: "needs_clarification",
          scenario_token: {
            token: "scenario_token_abcdefghijklmnopqrstuvwxyz0123456789",
            purpose: "clarify",
            expires_at: "2026-08-09T10:05:00.000Z",
          },
          interaction: {
            kind: "single_choice",
            title: "Choose the care context",
            options: [
              {
                option_token: "opaque-option-token",
                label: "Current care group",
              },
            ],
          },
          safe_state: { reason_code: "ambiguous_context", can_skip: false },
        }),
      },
      engine,
    );

    const result = await composition.query(identity);

    expect(result).toMatchObject({
      status: "needs_clarification",
      safe_reason_code: "ambiguous_context",
      interaction: { kind: "single_choice" },
    });
    expect(JSON.stringify(result)).not.toContain("participant");
    expect(JSON.stringify(result)).not.toContain("group-private");
    expect(engine.query).not.toHaveBeenCalled();
  });

  it("fails closed when the generic resolver returns a non-contract interaction", async () => {
    const engine = createEngine();
    const composition = new TeacherReleaseOwnerComposition(
      {
        resolve: async () => ({
          status: "needs_clarification",
          scenario_token: {
            token: "scenario_token_abcdefghijklmnopqrstuvwxyz0123456789",
            purpose: "clarify",
            expires_at: "2026-08-09T10:05:00.000Z",
          },
          interaction: {
            kind: "text_input",
            title: "Narrow the care context",
            description: "Add context to continue.",
            fields: [
              {
                field_key: "context_detail",
                label: "Context",
                type: "text",
                required: true,
              },
            ],
          },
          safe_state: { reason_code: "weak_context", can_skip: false },
        }),
      },
      engine,
    );

    await expect(composition.query(identity)).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
    expect(engine.query).not.toHaveBeenCalled();
  });

  it("fails closed after revoke or incompatible owner scope", async () => {
    const engine = createEngine();
    const revoked = new TeacherReleaseOwnerComposition(
      {
        resolve: async () => ({
          status: "blocked",
          reason_code: "role_revoked",
          safe_user_state: "access_changed",
        }),
      },
      engine,
    );
    const incompatible = new TeacherReleaseOwnerComposition(
      {
        resolve: async () =>
          resolvedOwner("participant-admin", "institution_admin"),
      },
      engine,
    );

    await expect(
      revoked.prepare({
        ...identity,
        process_ref: "sealed-process-1",
        action_option_ref: "sealed-process-1",
        target_snapshot_ref: targetSnapshotRef,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "access_changed",
    });
    await expect(
      incompatible.confirm({
        ...identity,
        invocation_request_id: "invocation-1",
        command_request_id: "command-1",
        confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "access_changed",
    });
    expect(engine.prepare).not.toHaveBeenCalled();
    expect(engine.execute).not.toHaveBeenCalled();
  });

  it("re-resolves owner authority before rejecting mismatched process and action refs", async () => {
    const engine = createEngine();
    const resolver = {
      resolve: vi.fn(async () => resolvedOwner("participant-1")),
    };
    const composition = new TeacherReleaseOwnerComposition(resolver, engine);
    const request: TeacherReleaseOwnerPrepareRequestV3 = {
      ...identity,
      process_ref: "sealed-process-1",
      action_option_ref: "sealed-process-2",
      target_snapshot_ref: targetSnapshotRef,
    };

    await expect(composition.prepare(request)).resolves.toEqual({
      status: "ready",
      result: { status: "needs_input", fields: ["target"] },
    });
    expect(resolver.resolve).toHaveBeenCalledOnce();
    expect(engine.prepare).not.toHaveBeenCalled();
  });

  it("maps owner and policy denials to safe states instead of leaking internal reason codes", async () => {
    const engine = createEngine();
    engine.query.mockResolvedValueOnce({
      status: "denied",
      reason_code: "not_authorized",
    });
    engine.prepare.mockResolvedValueOnce({
      status: "denied",
      reason_code: "publication_policy_drift",
    });
    engine.execute.mockResolvedValueOnce({
      status: "not_committed",
      decision: "blocked",
      reason_code: "publication_policy_drift",
      recovery: "none",
    });
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-1") },
      engine,
    );

    await expect(composition.query(identity)).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "access_changed",
    });
    await expect(
      composition.prepare({
        ...identity,
        process_ref: "sealed-process-1",
        action_option_ref: "sealed-process-1",
        target_snapshot_ref: targetSnapshotRef,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
    await expect(
      composition.confirm({
        ...identity,
        invocation_request_id: "invocation-1",
        command_request_id: "command-1",
        confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
  });

  it("keeps stale/replay recovery explicit and normalizes outcome-unknown detail", async () => {
    const engine = createEngine();
    engine.execute
      .mockResolvedValueOnce({
        status: "not_committed",
        decision: "conflict",
        reason_code: "stale_confirmation",
        recovery: "reprepare",
      })
      .mockResolvedValueOnce({
        status: "not_committed",
        decision: "conflict",
        reason_code: "confirmation_replayed",
        recovery: "refresh",
      })
      .mockResolvedValueOnce({
        status: "outcome_unknown",
        reason_code: "database_timeout_after_commit",
        recovery: "reconcile_same_command",
      });
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-1") },
      engine,
    );
    const confirm = (
      hostRequestId: string,
    ): TeacherReleaseOwnerConfirmRequestV3 => ({
      ...identity,
      host_request_id: hostRequestId,
      invocation_request_id: `invocation-${hostRequestId}`,
      command_request_id: "command-1",
      confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });

    await expect(composition.confirm(confirm("stale"))).resolves.toMatchObject({
      status: "ready",
      result: { status: "not_committed", reason_code: "stale_confirmation" },
    });
    await expect(composition.confirm(confirm("replay"))).resolves.toMatchObject(
      {
        status: "ready",
        result: {
          status: "not_committed",
          reason_code: "confirmation_replayed",
        },
      },
    );
    await expect(composition.confirm(confirm("unknown"))).resolves.toEqual({
      status: "ready",
      result: {
        status: "outcome_unknown",
        reason_code: "release_outcome_unknown",
        recovery: "reconcile_same_command",
      },
    });
  });

  it("removes target policy detail and rejects raw owner identifiers in engine results", async () => {
    const engine = createEngine();
    engine.execute.mockResolvedValueOnce({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
      execution_ref: { ref: "attempt-1" },
      output_refs: [],
      committed_result: {
        processState: "released",
        frozenRevision: 4,
        results: [
          {
            targetRef: "1.opaque-committed-target",
            outcome: "committed",
            publicationRef: "1.opaque-publication",
            receiptRef: "1.opaque-receipt",
          },
          {
            targetRef: "1.opaque-target",
            outcome: "rejected",
            reasonCode: "not_publishable",
            blockingReasons: ["grant_not_allowed", "purpose_not_allowed"],
          },
        ],
        summary: { total: 2, committed: 1, rejected: 1, outcomeUnknown: 0 },
        missedSendAttention: false,
      },
    });
    engine.query.mockResolvedValueOnce({
      status: "ok",
      output: { participant_id: "participant-private" },
    });
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-1") },
      engine,
    );

    const confirmResult = await composition.confirm({
      ...identity,
      invocation_request_id: "invocation-1",
      command_request_id: "command-1",
      confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    });
    expect(confirmResult).toMatchObject({
      status: "ready",
      result: {
        status: "committed",
        committed_result: {
          results: [
            {
              targetRef: "1.opaque-committed-target",
              outcome: "committed",
              publicationRef: "1.opaque-publication",
              receiptRef: "1.opaque-receipt",
            },
            {
              targetRef: "1.opaque-target",
              outcome: "rejected",
              reasonCode: "target_not_released",
            },
          ],
        },
      },
    });
    expect(JSON.stringify(confirmResult)).not.toContain("grant_not_allowed");
    expect(JSON.stringify(confirmResult)).not.toContain("purpose_not_allowed");
    await expect(composition.query(identity)).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
  });

  it("accepts the owner title limit and rejects wire values outside the exact schema", async () => {
    const engine = createEngine();
    const titleAtLimit = queryOutput();
    titleAtLimit.items[0]!.title = "a".repeat(200);
    const titleOverLimit = queryOutput();
    titleOverLimit.items[0]!.title = "a".repeat(201);
    engine.query
      .mockResolvedValueOnce({ status: "ok", output: titleAtLimit })
      .mockResolvedValueOnce({ status: "ok", output: titleOverLimit });
    engine.execute.mockResolvedValueOnce({
      status: "not_committed",
      decision: "private_policy_decision",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-1") },
      engine,
    );

    await expect(composition.query(identity)).resolves.toMatchObject({
      status: "ready",
    });
    await expect(composition.query(identity)).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
    await expect(
      composition.confirm({
        ...identity,
        invocation_request_id: "invocation-1",
        command_request_id: "command-1",
        confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
  });

  it("rejects non-canonical instants, input fields, and recovery combinations", async () => {
    const engine = createEngine();
    const invalidQuery = queryOutput();
    invalidQuery.items[0]!.occurredAt = "2026-08-09 08:00:00Z";
    engine.query.mockResolvedValueOnce({ status: "ok", output: invalidQuery });
    engine.prepare.mockResolvedValueOnce({
      status: "needs_input",
      fields: ["foreign_field"],
    });
    engine.execute.mockResolvedValueOnce({
      status: "not_committed",
      decision: "conflict",
      reason_code: "stale_confirmation",
      recovery: "refresh",
    });
    const composition = new TeacherReleaseOwnerComposition(
      { resolve: async () => resolvedOwner("participant-1") },
      engine,
    );

    await expect(composition.query(identity)).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
    await expect(
      composition.prepare({
        ...identity,
        process_ref: "1.opaque-process",
        action_option_ref: "1.opaque-process",
        target_snapshot_ref: targetSnapshotRef,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
    await expect(
      composition.confirm({
        ...identity,
        invocation_request_id: "invocation-1",
        command_request_id: "command-1",
        confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
      }),
    ).resolves.toEqual({
      status: "unavailable",
      safe_reason_code: "unavailable",
    });
  });

  it("keeps host identity inputs free of owner role and scope claims at compile time", () => {
    const query: TeacherReleaseOwnerQueryRequestV3 = identity;
    const prepare: TeacherReleaseOwnerPrepareRequestV3 = {
      ...identity,
      process_ref: "sealed-process-1",
      action_option_ref: "sealed-process-1",
      target_snapshot_ref: targetSnapshotRef,
    };
    const confirm: TeacherReleaseOwnerConfirmRequestV3 = {
      ...identity,
      invocation_request_id: "invocation-1",
      command_request_id: "command-1",
      confirmation_ref: "confirmation_abcdefghijklmnopqrstuvwxyz0123456789",
    };

    expect(Object.keys(query).sort()).toEqual([
      "host_request_id",
      "my_chat_user_id",
      "workspace_id",
    ]);
    expect(Object.keys(prepare)).not.toContain("actor_participant_id");
    expect(Object.keys(confirm)).not.toContain("care_group_id");
  });
});
