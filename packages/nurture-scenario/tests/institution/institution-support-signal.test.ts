import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionHomeSupportSignalService,
  NurtureInstitutionSupportSignalService,
  composeInstitutionSupportSignals,
  decideInstitutionSupportSignalPolicyRevision,
  institutionSupportSignalDedupeIdentity,
  type NurtureInstitutionSupportSignalAggregateMember,
  type NurtureInstitutionSupportSignalPolicyV1,
  type NurtureInstitutionSupportSignalSourceV1,
  type NurtureInstitutionSupportSignalV1,
} from "../../src/index.js";

const at = "2026-08-09T12:00:00.000Z";

const policy = (
  category: NurtureInstitutionSupportSignalPolicyV1["category"],
  overrides: Partial<NurtureInstitutionSupportSignalPolicyV1> = {},
): NurtureInstitutionSupportSignalPolicyV1 => ({
  contract_version: "1.0.0",
  policy_ref: `policy:${category}`,
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  category,
  window_key: "local-day:2026-08-09",
  checkpoint_ref: `checkpoint:${category}`,
  enabled: true,
  policy_revision: 3,
  effective_from: "2026-08-01T00:00:00.000Z",
  changed_by_role_assignment_ref: "admin-role-1",
  change_reason: "Configure daily operations",
  ...overrides,
});

const source = (
  category: NurtureInstitutionSupportSignalSourceV1["category"],
  overrides: Partial<NurtureInstitutionSupportSignalSourceV1> = {},
): NurtureInstitutionSupportSignalSourceV1 => ({
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  source_type: category,
  source_ref: `source:${category}`,
  category,
  scope_ref: "class-a",
  scope_kind: "care_group",
  subject_order: { age_band_key: "01", name: "Class A" },
  checkpoint_ref: `checkpoint:${category}`,
  occurred_at: "2026-08-09T08:00:00.000Z",
  condition: "open",
  readable: true,
  ...overrides,
});

const compose = (input: {
  policies?: NurtureInstitutionSupportSignalPolicyV1[];
  sources?: NurtureInstitutionSupportSignalSourceV1[];
  source_status?: "available" | "unavailable";
}) =>
  composeInstitutionSupportSignals({
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    snapshot_at: at,
    policies: input.policies ?? [],
    sources: input.sources ?? [],
    source_status: input.source_status ?? "available",
  });

const readableMember = (memberRef: string, currentCount: number) => ({
  member_ref: memberRef,
  grant_state: "active" as const,
  grant_terms: [
    {
      directions: ["family_to_org" as const],
      data_classes: ["daily_care_log" as const],
      purposes: ["care_coordination"],
    },
  ],
  current_count: currentCount,
});

const aggregate = (members: NurtureInstitutionSupportSignalAggregateMember[]) => ({
  members,
  ask: {
    direction: "family_to_org" as const,
    data_class: "daily_care_log" as const,
    purpose_key: "care_coordination",
  },
});

describe("InstitutionSupportSignalProjectionV1", () => {
  it("denies at Institution authority before loading policy or sources", async () => {
    const loadEffectivePolicies = vi.fn(async () => []);
    const loadAuthorizedSources = vi.fn(async () => ({
      status: "available" as const,
      sources: [],
    }));
    const service = new NurtureInstitutionSupportSignalService(
      { loadEffectivePolicies, loadAuthorizedSources },
      {
        resolve: async () => ({
          status: "denied" as const,
          level: "institution_scope" as const,
          reason_code: "not_authorized" as const,
        }),
      },
    );
    await expect(
      service.compose({
        workspace_id: "workspace-1",
        participant_ref: "admin-1",
        institution_ref: "institution-1",
        snapshot_at: at,
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    expect(loadEffectivePolicies).not.toHaveBeenCalled();
    expect(loadAuthorizedSources).not.toHaveBeenCalled();
  });

  it("passes policies to exact owners instead of interpreting checkpoint refs itself", async () => {
    const configured = policy("business_response_overdue");
    const loadAuthorizedSources = vi.fn(async () => ({
      status: "available" as const,
      sources: [
        source("business_response_overdue", {
          deadline_at: "2026-08-09T11:00:00.000Z",
        }),
      ],
    }));
    const service = new NurtureInstitutionSupportSignalService(
      {
        loadEffectivePolicies: async () => [configured],
        loadAuthorizedSources,
      },
      {
        resolve: async () => ({
          status: "resolved" as const,
          level: "institution_scope" as const,
          active_role: {
            contract_version: "1.0.0" as const,
            participant_ref: "admin-1",
            role_assignment_ref: "admin-role-1",
            role_kind: "institution_admin" as const,
            scope_type: "institution" as const,
            scope_ref: "institution-1",
            selection_mode: "unique" as const,
          },
          institution_scope: {
            contract_version: "1.0.0" as const,
            active_role: {
              contract_version: "1.0.0" as const,
              participant_ref: "admin-1",
              role_assignment_ref: "admin-role-1",
              role_kind: "institution_admin" as const,
              scope_type: "institution" as const,
              scope_ref: "institution-1",
              selection_mode: "unique" as const,
            },
            institution_ref: "institution-1",
            institution_state: "active" as const,
          },
        }),
      },
    );
    await expect(
      service.compose({
        workspace_id: "workspace-1",
        participant_ref: "admin-1",
        institution_ref: "institution-1",
        snapshot_at: at,
      }),
    ).resolves.toMatchObject({ status: "ok", output: { signals: [{ sourceRef: expect.any(String) }] } });
    expect(loadAuthorizedSources).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      participant_ref: "admin-1",
      role_assignment_ref: "admin-role-1",
      institution_ref: "institution-1",
      snapshot_at: at,
      policies: [configured],
    });
  });

  it("recomputes source lifecycle and never emits a closure record", () => {
    const configured = policy("authority_or_source_blocked");
    const blocked = source("authority_or_source_blocked", { condition: "blocked" });
    const first = compose({ policies: [configured], sources: [blocked] });
    expect(first.status === "ok" && first.output.signals).toHaveLength(1);

    const next = compose({
      policies: [configured],
      sources: [{ ...blocked, condition: "resolved" }],
    });
    expect(next).toMatchObject({ status: "ok", output: { signals: [] } });
    expect(JSON.stringify(next)).not.toMatch(/closed|resolvedAt|dismiss|acknowledge|escalate/);
  });

  it("keeps an unconfigured or disabled load category absent", () => {
    const load = source("configured_load_threshold", {
      aggregate: aggregate([readableMember("child-1", 9)]),
    });
    expect(compose({ sources: [load] })).toMatchObject({
      status: "ok",
      output: { signals: [] },
    });
    expect(
      compose({
        policies: [
          policy("configured_load_threshold", {
            enabled: false,
            absolute_threshold: 3,
          }),
        ],
        sources: [load],
      }),
    ).toMatchObject({ status: "ok", output: { signals: [] } });
  });

  it("uses only the source's explicit overdue deadline", () => {
    const configured = policy("business_response_overdue");
    const withoutDeadline = source("business_response_overdue");
    expect(compose({ policies: [configured], sources: [withoutDeadline] })).toMatchObject({
      status: "ok",
      output: { signals: [] },
    });
    const overdue = source("business_response_overdue", {
      deadline_at: "2026-08-09T11:00:00.000Z",
    });
    const decision = compose({ policies: [configured], sources: [overdue] });
    expect(decision.status === "ok" && decision.output.signals[0]).toMatchObject({
      category: "business_response_overdue",
      tier: "action_required",
      deadlineAt: "2026-08-09T11:00:00.000Z",
    });
  });

  it("refuses a threshold when any population member is unreadable", () => {
    const members = [
      readableMember("child-1", 2),
      { ...readableMember("child-2", 2), grant_state: "revoked" as const, grant_terms: [] },
    ];
    const decision = compose({
      policies: [policy("review_backlog_threshold", { absolute_threshold: 3 })],
      sources: [source("review_backlog_threshold", { aggregate: aggregate(members) })],
    });
    expect(decision).toEqual({ status: "unavailable", reason_code: "grant_missing" });
    expect(decision).not.toHaveProperty("output");
  });

  it("omits unreadable sources and reports an owner outage without cached signals", () => {
    const configured = policy("authority_or_source_blocked");
    const blocked = source("authority_or_source_blocked", {
      condition: "blocked",
      readable: false,
    });
    expect(compose({ policies: [configured], sources: [blocked] })).toMatchObject({
      status: "ok",
      output: { signals: [] },
    });
    expect(
      compose({ policies: [configured], sources: [], source_status: "unavailable" }),
    ).toEqual({ status: "unavailable", reason_code: "source_unavailable" });
  });

  it("keeps AI attention suggested and provider failure independent", () => {
    const deterministicPolicy = policy("attendance_submission_overdue");
    const deterministic = source("attendance_submission_overdue", {
      deadline_at: "2026-08-09T10:00:00.000Z",
    });
    const withoutProvider = compose({
      policies: [deterministicPolicy],
      sources: [deterministic],
    });
    const withProvider = compose({
      policies: [deterministicPolicy, policy("ai_attention_candidate")],
      sources: [deterministic, source("ai_attention_candidate")],
    });
    expect(withoutProvider.status === "ok" && withoutProvider.output.signals).toHaveLength(1);
    expect(withProvider.status === "ok" && withProvider.output.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "ai_attention_candidate",
          tier: "attention_suggested",
        }),
        expect.objectContaining({ category: "attendance_submission_overdue" }),
      ]),
    );
  });

  it("emits only the frozen actor-safe fields and never signals absent activity", () => {
    const decision = compose({
      policies: [policy("work_item_or_workflow_blocked")],
      sources: [source("work_item_or_workflow_blocked", { condition: "blocked" })],
    });
    expect(decision.status).toBe("ok");
    if (decision.status !== "ok") return;
    expect(Object.keys(decision.output.signals[0]!).sort()).toEqual([
      "category",
      "contractVersion",
      "occurredAt",
      "policyRevision",
      "safeReason",
      "scopeRef",
      "sourceRef",
      "tier",
    ]);
    expect(JSON.stringify(decision)).not.toMatch(
      /score|band|rank|percentile|comparison|deviation|teacher.*rate|freshness/i,
    );
    expect(compose({ policies: [], sources: [] })).toMatchObject({
      status: "ok",
      output: { signals: [] },
    });
  });

  it("carries the producing revision and derives a stable, window-bound identity", () => {
    const identity = institutionSupportSignalDedupeIdentity({
      source_type: "attendance_closeout",
      source_ref: "source-1",
      policy_revision: 3,
      window_key: "local-day:2026-08-09",
    });
    expect(
      institutionSupportSignalDedupeIdentity({
        source_type: "attendance_closeout",
        source_ref: "source-1",
        policy_revision: 3,
        window_key: "local-day:2026-08-09",
      }),
    ).toBe(identity);
    expect(
      institutionSupportSignalDedupeIdentity({
        source_type: "attendance_closeout",
        source_ref: "source-1",
        policy_revision: 4,
        window_key: "local-day:2026-08-09",
      }),
    ).not.toBe(identity);

    const configured = policy("attendance_submission_overdue", { policy_revision: 4 });
    const decision = compose({
      policies: [configured],
      sources: [
        source("attendance_submission_overdue", {
          deadline_at: "2026-08-09T10:00:00.000Z",
        }),
      ],
    });
    expect(decision.status === "ok" && decision.output.signals[0]?.policyRevision).toBe(4);
  });

  it("orders by explicit deadline then fixed subject order, never tier or count", () => {
    const policies = [
      policy("attendance_submission_overdue"),
      policy("business_response_overdue"),
      policy("review_backlog_threshold", { absolute_threshold: 1 }),
      policy("configured_load_threshold", { absolute_threshold: 1 }),
    ];
    const classA = { age_band_key: "01", name: "Class A" };
    const classB = { age_band_key: "02", name: "Class B" };
    const sources = [
      source("configured_load_threshold", {
        source_ref: "no-deadline-b",
        scope_ref: "class-b",
        subject_order: classB,
        aggregate: aggregate([readableMember("b", 99)]),
      }),
      source("review_backlog_threshold", {
        source_ref: "no-deadline-a",
        subject_order: classA,
        aggregate: aggregate([readableMember("a", 1)]),
      }),
      source("business_response_overdue", {
        source_ref: "deadline-b",
        scope_ref: "class-b",
        subject_order: classB,
        deadline_at: "2026-08-09T10:00:00.000Z",
      }),
      source("attendance_submission_overdue", {
        source_ref: "deadline-a",
        subject_order: classA,
        deadline_at: "2026-08-09T10:00:00.000Z",
      }),
    ];
    const first = compose({ policies, sources });
    expect(first.status).toBe("ok");
    if (first.status !== "ok") return;
    expect(first.output.signals.map((signal) => signal.sourceRef)).toEqual([
      "deadline-a",
      "deadline-b",
      "no-deadline-a",
      "no-deadline-b",
    ]);

    const changed = compose({
      policies,
      sources: sources.map((entry) =>
        entry.source_ref === "no-deadline-a"
          ? {
              ...entry,
              aggregate: aggregate([readableMember("a", 500)]),
            }
          : entry,
      ),
    });
    expect(changed.status === "ok" && changed.output.signals.map((row) => row.sourceRef)).toEqual(
      first.output.signals.map((row) => row.sourceRef),
    );
  });

  it("fails closed on policy contract drift and enforces expected revision", () => {
    expect(
      compose({
        policies: [policy("authority_or_source_blocked", { contract_version: "2.0.0" })],
        sources: [source("authority_or_source_blocked", { condition: "blocked" })],
      }),
    ).toEqual({ status: "denied", reason_code: "contract_mismatch" });
    expect(
      decideInstitutionSupportSignalPolicyRevision({
        current_revision: 3,
        expected_policy_revision: 2,
        contract_version: "1.0.0",
      }),
    ).toEqual({ status: "conflict", reason_code: "conflict" });
    expect(
      decideInstitutionSupportSignalPolicyRevision({
        current_revision: 3,
        expected_policy_revision: 3,
        contract_version: "1.0.0",
      }),
    ).toEqual({ status: "allowed", next_revision: 4 });
  });

  it("feeds the Institution home in composer order, caps at three and exposes overflow", async () => {
    const signals = ["a", "b", "c", "d"].map(
      (sourceRef, index): NurtureInstitutionSupportSignalV1 => ({
        category: "authority_or_source_blocked",
        tier: "action_required",
        scopeRef: `class-${sourceRef}`,
        sourceRef,
        safeReason: "Current authority or source state blocks this work.",
        occurredAt: `2026-08-09T0${index + 1}:00:00.000Z`,
        policyRevision: 1,
        contractVersion: "1.0.0",
      }),
    );
    const home = new NurtureInstitutionHomeSupportSignalService({
      compose: async (request) => ({
        status: "ok",
        output: {
          contract_version: "1.0.0",
          institution_ref: request.institution_ref,
          snapshot_at: request.snapshot_at,
          signals,
          projection_version: 1,
        },
      }),
    });
    const decision = await home.compose({
      workspace_id: "workspace-1",
      participant_ref: "admin-1",
      institution_ref: "institution-1",
      snapshot_at: at,
    });
    expect(decision).toMatchObject({
      status: "ok",
      output: {
        support_signals: [{ sourceRef: "a" }, { sourceRef: "b" }, { sourceRef: "c" }],
        support_signals_has_more: true,
      },
    });
  });
});
