import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS,
  nurtureScenarioManifest,
  nurtureScenarioModule,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "../../src/index.js";
import {
  NurtureEnrollmentJourneySurfaceHandler,
  defaultNurtureEnrollmentJourneySurfaceDeps,
  parseNurtureEnrollmentJourneyAdapterRequest,
  type NurtureEnrollmentJourneyCommandExecutor,
  type NurtureEnrollmentJourneyPreparedBindingV1,
  type NurtureEnrollmentJourneySurfaceDeps,
  type NurtureEnrollmentJourneyTrustedContextV1,
} from "../../src/enrollment-journey-surfaces.js";

const now = "2026-08-10T02:00:00.000Z";
const later = "2026-08-11T02:00:00.000Z";
const canonicalRef = (objectType: string, objectId: string) => ({
  schema_version: 1 as const,
  namespace: "my_chat",
  object_type: objectType,
  object_id: objectId,
  version: 1,
});

const workflow = (): NurtureEnrollmentJourneyWorkflowSnapshotV1 => ({
  contract_version: "1.0.0",
  workspace_id: "workspace-01",
  institution_ref: "institution-01",
  workflow_ref: "workflow-01",
  workflow_run_ref: canonicalRef("workflow_run", "run-01"),
  workflow_type: "EnrollmentJourneyWorkflowV1",
  workflow_head: 2,
  lifecycle: "active",
  current_stage: "inquiry",
  waiting_state: "ready",
  pending_transition: "none",
  terminal_outcome: "none",
  completed_milestones: ["inquiry_started"],
  started_at: "2026-08-09T02:00:00.000Z",
  updated_at: now,
});

const journeyQueryRecord = (
  value: NurtureEnrollmentJourneyWorkflowSnapshotV1 = workflow(),
) => ({
  status: "resolved" as const,
  workflow: value,
  projection_context: {
    workspace_id: "workspace-01",
    institution_scope: {
      contract_version: "1.0.0" as const,
      active_role: {
        contract_version: "1.0.0" as const,
        participant_ref: "participant-01",
        role_assignment_ref: "role-admin-01",
        role_kind: "institution_admin" as const,
        scope_type: "institution" as const,
        scope_ref: "institution-01",
        selection_mode: "unique" as const,
      },
      institution_ref: "institution-01",
      institution_state: "active" as const,
    },
  },
});

const guardianAction = {
  contract_version: "1.0.0" as const,
  actor_ref: canonicalRef("guardian_actor", "guardian-01"),
  contact_ref: canonicalRef("prospective_contact", "contact-01"),
  action_ref: canonicalRef("enrollment_action", "action-01"),
  occurred_at: now,
  verified_at: now,
};

const binding = (
  activeRole: "institution_admin" | "guardian" = "institution_admin",
): NurtureEnrollmentJourneyPreparedBindingV1 => ({
  surface_key:
    activeRole === "institution_admin"
      ? "institution_workbench"
      : "guardian_family_board",
  active_role: activeRole,
  institution_ref: "institution-01",
  role_assignment_ref:
    activeRole === "institution_admin" ? "role-admin-01" : undefined,
  workflow_run_ref: canonicalRef("workflow_run", "run-01"),
  heads: {
    workflow: 1,
    waitlist_entry: 2,
    trial_offer: 3,
    reservation: 4,
    capacity_revision: 5,
    enrollment: 6,
    grant: 7,
    formal_proposal: 1,
  },
  refs: {
    workflow: "workflow-01",
    target_care_group: "care-group-01",
    waitlist_entry: "entry-01",
    trial_offer: "offer-01",
    reservation: "reservation-01",
    enrollment: "enrollment-01",
    grant: "grant-01",
    formal_proposal: "proposal-01",
    superseded_touchpoint: "touchpoint-01",
  },
  contact_owner_snapshot: {
    contract_version: "1.0.0",
    contact_ref: canonicalRef("prospective_contact", "contact-01"),
    safe_label: "Guardian contact",
    verified_at: now,
  },
  native_source_owner_snapshot: {
    contract_version: "1.0.0",
    source_ref: {
      ...canonicalRef("family_care_message", "message-01"),
      namespace: "nurture",
    },
    occurred_at: now,
    verified_at: now,
  },
  guardian_action_owner_snapshot: guardianAction,
  family_acceptance_owner_snapshot: guardianAction,
  pair_owner_snapshot: {
    contract_version: "1.0.0",
    actor_ref: canonicalRef("actor", "guardian-01"),
    guardian_participant_ref: "guardian-01",
    guardian_role_assignment_ref: "guardian-role-01",
    child_owner_ref:
      "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
    child_owner_version: 1,
    family_owner_ref:
      "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
    family_owner_version: 1,
    child_association_ref: "child-association-01",
    child_association_head: 1,
    family_association_ref: "family-association-01",
    family_association_head: 1,
    child_care_process_ref: "child-process-01",
    verified_at: now,
    expires_at: later,
  },
  grant_terms_snapshot: {
    contract_version: "1.0.0",
    policy_ref: "trial-policy",
    policy_revision: 1,
    directions: ["family_to_org", "org_to_family"],
    data_classes: ["daily_care_log"],
    purposes: ["trial_care"],
    verified_at: now,
    expires_at: later,
  },
  formalization_owner_evidence: {
    contract_version: "1.0.0",
    actor_ref: canonicalRef("actor", "guardian-01"),
    audience: "nurture",
    current_owner_evidence: {
      binding_evidence_version: 1,
      purpose_key: "formalize_enrollment",
      owner_bindings: [
        {
          owner_binding_ref_version: 1,
          binding_slot: "child",
          owner_ref: {
            schema_version: 1,
            namespace: "scenario-owner",
            object_type: "child_binding_owner",
            object_id:
              "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
            version: 1,
          },
        },
        {
          owner_binding_ref_version: 1,
          binding_slot: "family",
          owner_ref: {
            schema_version: 1,
            namespace: "scenario-owner",
            object_type: "family_binding_owner",
            object_id:
              "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
            version: 1,
          },
        },
      ],
      pair_relation_evidence_hash: "1".repeat(64),
      current_owner_evidence_hash: "2".repeat(64),
    },
    request_nonce_hash: "3".repeat(64),
    verified_at: now,
    expires_at: later,
  },
  acceptance_ref: canonicalRef("enrollment_action", "acceptance-01"),
  accepted_at: now,
  protected_birth_year_month: {
    algVersion: 1,
    keyRef: "protected-key",
    ciphertext: "encryptedBirthMonth",
    integrityTag: "birthTag",
  },
  protected_external_summary: {
    algVersion: 1,
    keyRef: "protected-key",
    ciphertext: "encryptedSummary",
    integrityTag: "summaryTag",
  },
});

const trusted = (
  clientSurface: NurtureEnrollmentJourneyTrustedContextV1["client_surface"] =
    "web_run_workbench",
): NurtureEnrollmentJourneyTrustedContextV1 => ({
  workspace_id: "workspace-01",
  actor_participant_ref: "participant-01",
  invocation_request_id: "invocation-01",
  host_correlation_id: "correlation-01",
  host_trace_id: "trace-01",
  command_request_id: "command-01",
  client_surface: clientSurface,
});

const empty = {};
const operationInputs: Record<string, unknown> = {
  start_enrollment_inquiry: {
    preferredLabel: "Momo",
    birthYearMonth: "2022-08",
    expectedEntryStartDate: "2026-09-01",
    expectedEntryEndDate: "2026-09-30",
    targetClassTypeKey: "preschool",
    targetAgeBandKey: "age_4",
    targetCareGroupOptionRef: "option-care-group",
    careScheduleNeedKeys: ["weekday"],
    sourceChannel: "wechat",
    safetyLabelKeys: [],
    initialContactAt: now,
    nextTouchpointAt: later,
  },
  record_external_touchpoint: {
    sourceChannel: "phone",
    confirmedNeedKeys: ["weekday"],
    safetyLabelKeys: [],
    nextActionKey: "confirm_intent",
    responsibleRole: "institution_admin",
    dueAt: now,
    nextTouchpointAt: later,
    occurredAt: now,
    summary: "Caller-provided text that must be replaced by a protected envelope.",
    supersededTouchpointOptionRef: "option-touchpoint",
    correctionReason: "Correction",
  },
  confirm_native_touchpoint_note: {
    sourceMessageOptionRef: "option-message",
    sourceChannel: "native_message",
    confirmedNeedKeys: [],
    safetyLabelKeys: [],
    nextActionKey: "confirm_intent",
    responsibleRole: "institution_admin",
    dueAt: now,
    nextTouchpointAt: later,
  },
  confirm_intent_conversation: empty,
  record_or_skip_visit: { disposition: "skipped" },
  close_inquiry: { reasonKey: "family_withdrew" },
  qualify_capacity_waitlist: {
    targetCareGroupOptionRef: "option-care-group",
    categoryKey: "standard",
    categoryBasisKey: "family_confirmed",
    nextReviewAt: later,
  },
  review_waitlist_interest: { interestState: "unanswered", nextReviewAt: later },
  override_waitlist_category: {
    categoryKey: "standard",
    categoryBasisKey: "admin_reviewed",
    reasonKey: "correction",
  },
  issue_trial_offer: {
    expiresAt: later,
    trialStartsAt: "2026-08-12T02:00:00.000Z",
    trialEndsAt: "2026-08-20T02:00:00.000Z",
    reviewAt: "2026-08-19T02:00:00.000Z",
    reasonKey: "seat_available",
  },
  accept_trial_offer: empty,
  decline_or_expire_trial_offer: {
    disposition: "expired",
    nextReviewAt: later,
    reasonKey: "offer_expired",
  },
  withdraw_from_waitlist: { reasonKey: "guardian_withdrew" },
  cancel_trial_preparation: { reasonKey: "guardian_cancelled" },
  prepare_trial_relationship: empty,
  start_trial: empty,
  mark_trial_review_reached: empty,
  extend_trial: {
    trialEndsAt: "2026-08-25T02:00:00.000Z",
    reviewAt: "2026-08-24T02:00:00.000Z",
    reasonKey: "needs_more_time",
  },
  propose_formal_enrollment: {
    proposedFormalStartAt: "2026-08-21T02:00:00.000Z",
    proposedGrantPurposes: ["formal_care"],
    proposedGrantExpiresAt: "2027-08-21T02:00:00.000Z",
    safeFamilySummary: "Formal continuation for Guardian review.",
    proposalExpiresAt: "2026-08-12T02:00:00.000Z",
    reasonKey: "trial_review_complete",
  },
  formalize_enrollment: empty,
  end_trial: { reasonKey: "trial_ended" },
};

const guardianCommands = new Set([
  "accept_trial_offer",
  "withdraw_from_waitlist",
  "formalize_enrollment",
]);

const request = (capabilityKey: string): unknown => ({
  capabilityKey,
  capabilityVersion: "1.0.0",
  targetOptionRef: "option-journey",
  operationInput: operationInputs[capabilityKey],
  confirmationRef: "confirmation-01",
});

const makeDeps = (capture: Array<{
  key: string;
  spec: string;
  confirmationRef: string;
  payload: unknown;
}>): NurtureEnrollmentJourneySurfaceDeps => {
  const commands: NurtureEnrollmentJourneyCommandExecutor = {
    async execute(input) {
      capture.push({
        key: input.capability_key,
        spec: input.spec.command_key,
        confirmationRef: input.confirmation_ref,
        payload: input.payload,
      });
      return { status: "committed", disposition: "executed", workflow: workflow() };
    },
  };
  return {
    bindings: {
      async resolve({ request: resolvedRequest }) {
        const key = resolvedRequest.capabilityKey;
        const guardian = guardianCommands.has(key) ||
          (key === "review_waitlist_interest" &&
            (resolvedRequest.operationInput as { interestState?: string }).interestState === "confirmed") ||
          (key === "decline_or_expire_trial_offer" &&
            (resolvedRequest.operationInput as { disposition?: string }).disposition === "declined") ||
          key === "cancel_trial_preparation";
        return { status: "resolved", binding: binding(guardian ? "guardian" : "institution_admin") };
      },
    },
    commands,
    journeyQueries: defaultNurtureEnrollmentJourneySurfaceDeps.journeyQueries,
    waitlistQueries: defaultNurtureEnrollmentJourneySurfaceDeps.waitlistQueries,
    targetOptions: { issue: ({ kind, target_ref }) => `sealed:${kind}:${target_ref}` },
  };
};

describe("G4-D I2-B Enrollment Journey public adapters", () => {
  it("rejects caller-supplied trusted fields and malformed confirmation shells before owner resolution", async () => {
    expect(parseNurtureEnrollmentJourneyAdapterRequest({
      ...request("confirm_intent_conversation") as Record<string, unknown>,
      workspace_id: "forged",
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyAdapterRequest({
      capabilityKey: "query_institution_enrollment_journey",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-journey",
      operationInput: {},
      confirmationRef: "forbidden-on-query",
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyAdapterRequest({
      capabilityKey: "start_enrollment_inquiry",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-contact",
      operationInput: operationInputs.start_enrollment_inquiry,
    })).toBeNull();

    let bindingCalls = 0;
    const handler = new NurtureEnrollmentJourneySurfaceHandler({
      ...defaultNurtureEnrollmentJourneySurfaceDeps,
      bindings: {
        resolve: async () => {
          bindingCalls += 1;
          return { status: "unavailable", reason_code: "unexpected" };
        },
      },
    });
    await expect(handler.handle({ ...request("start_enrollment_inquiry") as Record<string, unknown>, role_assignment_ref: "forged" }, trusted())).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_enrollment_journey_request",
    });
    await expect(handler.handle(
      request("start_enrollment_inquiry"),
      { ...trusted(), command_request_id: "" },
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "invalid_trusted_enrollment_journey_context",
    });
    await expect(handler.handle(
      request("start_enrollment_inquiry"),
      { ...trusted(), actor_participant_ref: "   " },
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "invalid_trusted_enrollment_journey_context",
    });
    expect(bindingCalls).toBe(0);
  });

  it("maps all 21 descriptors to their exact I1 specs with trusted scope and heads", async () => {
    const capture: Array<{ key: string; spec: string; confirmationRef: string; payload: unknown }> = [];
    const handler = new NurtureEnrollmentJourneySurfaceHandler(makeDeps(capture));
    for (const key of NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS) {
      const guardian = guardianCommands.has(key) || key === "cancel_trial_preparation";
      const response = await handler.handle(
        request(key),
        trusted(guardian ? "mobile_dashboard" : "web_run_workbench"),
      );
      expect(response, key).toMatchObject({
        status: "ok",
        disposition: "executed",
        result: { effect: key, workflowRunRef: "run-01", workflowHead: 2 },
      });
      expect(JSON.stringify(response), key).not.toContain("workflow-01");
    }
    expect(capture.map(({ key }) => key)).toEqual(NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS);
    for (const item of capture) {
      expect(item.spec, item.key).toBe(`nurture.${item.key}`);
      expect(item.confirmationRef, item.key).toBe("confirmation-01");
      expect(item.payload, item.key).not.toHaveProperty("workspace_id", "forged");
      expect(JSON.stringify(item.payload), item.key).not.toMatch(/birthYearMonth|summary":"Caller-provided/);
    }
  });

  it("uses protected carriers, owner snapshots and confirmation heads instead of public substitutes", async () => {
    const capture: Array<{ key: string; spec: string; confirmationRef: string; payload: unknown }> = [];
    const handler = new NurtureEnrollmentJourneySurfaceHandler(makeDeps(capture));
    for (const key of [
      "start_enrollment_inquiry",
      "record_external_touchpoint",
      "qualify_capacity_waitlist",
      "formalize_enrollment",
    ]) {
      const guardian = key === "formalize_enrollment";
      await handler.handle(request(key), trusted(guardian ? "mobile_dashboard" : "web_run_workbench"));
    }
    expect(capture[0]?.payload).toMatchObject({
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      role_assignment_ref: "role-admin-01",
      expected_workflow_head: 0,
      protected_birth_year_month: { ciphertext: "encryptedBirthMonth" },
      contact_owner_snapshot: { safe_label: "Guardian contact" },
    });
    expect(capture[1]?.payload).toMatchObject({
      workflow_ref: "workflow-01",
      expected_workflow_head: 1,
      external_summary_body_envelope: { ciphertext: "encryptedSummary" },
      supersedes_touchpoint_ref: "touchpoint-01",
    });
    expect(capture[2]?.payload).toMatchObject({
      target_care_group_ref: "care-group-01",
      expected_capacity_revision: 5,
      family_acceptance_owner_snapshot: { action_ref: { object_id: "action-01" } },
    });
    expect(capture[3]?.payload).toMatchObject({
      workflow_ref: "workflow-01",
      proposal_ref: "proposal-01",
      expected_workflow_head: 1,
      expected_proposal_head: 1,
      expected_enrollment_head: 6,
      expected_grant_head: 7,
      expected_reservation_head: 4,
      owner_evidence: { audience: "nurture" },
    });
  });

  it("enforces exact role/surface combinations before invoking an I1 command", async () => {
    const capture: Array<{ key: string; spec: string; confirmationRef: string; payload: unknown }> = [];
    const deps = makeDeps(capture);
    deps.bindings = {
      resolve: async () => ({ status: "resolved", binding: binding("institution_admin") }),
    };
    const handler = new NurtureEnrollmentJourneySurfaceHandler(deps);
    await expect(handler.handle(request("accept_trial_offer"), trusted("web_run_workbench"))).resolves.toEqual({
      status: "denied",
      reason_code: "enrollment_journey_surface_not_authorized",
    });
    expect(capture).toEqual([]);
  });

  it.each([
    ["review_waitlist_interest", { interestState: "confirmed", nextReviewAt: later }, "guardian", "mobile_dashboard"],
    ["review_waitlist_interest", { interestState: "unanswered", nextReviewAt: later }, "institution_admin", "web_run_workbench"],
    ["decline_or_expire_trial_offer", { disposition: "declined", nextReviewAt: later, reasonKey: "declined" }, "guardian", "mobile_dashboard"],
    ["decline_or_expire_trial_offer", { disposition: "expired", nextReviewAt: later, reasonKey: "expired" }, "institution_admin", "web_run_workbench"],
    ["cancel_trial_preparation", { reasonKey: "cancelled" }, "guardian", "mobile_dashboard"],
    ["cancel_trial_preparation", { reasonKey: "cancelled" }, "institution_admin", "web_run_workbench"],
  ] as const)(
    "admits the exact mixed-role branch for %s as %s",
    async (capabilityKey, operationInput, activeRole, clientSurface) => {
      const capture: Array<{
        key: string;
        spec: string;
        confirmationRef: string;
        payload: unknown;
      }> = [];
      const deps = makeDeps(capture);
      deps.bindings = {
        resolve: async () => ({ status: "resolved", binding: binding(activeRole) }),
      };
      const handler = new NurtureEnrollmentJourneySurfaceHandler(deps);
      await expect(handler.handle(
        { ...request(capabilityKey) as Record<string, unknown>, operationInput },
        trusted(clientSurface),
      )).resolves.toMatchObject({ status: "ok", result: { effect: capabilityKey } });
      expect(capture).toHaveLength(1);
    },
  );

  it("rejects a committed result whose canonical Workflow Run identity drifts", async () => {
    const deps = makeDeps([]);
    deps.commands = {
      execute: async () => ({
        status: "committed",
        disposition: "executed",
        workflow: {
          ...workflow(),
          workflow_run_ref: canonicalRef("different_workflow_run_type", "run-01"),
        },
      }),
    };
    const handler = new NurtureEnrollmentJourneySurfaceHandler(deps);
    await expect(handler.handle(
      request("confirm_intent_conversation"),
      trusted(),
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "committed_result_scope_drift",
    });
  });

  it("rejects a query projection whose canonical Workflow Run identity drifts", async () => {
    const deps = makeDeps([]);
    deps.journeyQueries = {
      readWorkflow: async () => journeyQueryRecord(),
    };
    deps.bindings = {
      resolve: async () => ({
        status: "resolved",
        binding: {
          ...binding("institution_admin"),
          workflow_run_ref: canonicalRef("different_workflow_run_type", "run-01"),
        },
      }),
    };
    const handler = new NurtureEnrollmentJourneySurfaceHandler(deps);
    await expect(handler.handle({
      capabilityKey: "query_institution_enrollment_journey",
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-query",
      operationInput: {},
    }, trusted())).resolves.toEqual({
      status: "unavailable",
      reason_code: "query_target_drift",
    });
  });

  it("presents the three role-safe queries without private refs or Guardian ordering", async () => {
    const deps = makeDeps([]);
    const issuedTargets: Array<Record<string, unknown>> = [];
    deps.targetOptions = {
      issue: (input) => {
        issuedTargets.push({ ...input });
        return `sealed:${input.kind}:${input.target_ref}`;
      },
    };
    deps.journeyQueries = {
      readWorkflow: async () => journeyQueryRecord(),
    };
    deps.waitlistQueries = {
      readAdminQueue: async () => ({
        status: "resolved",
        projection: {
          contractVersion: "1.0.0",
          targetCareGroupRef: "care-group-01",
          targetClassSafeLabel: "Rainbow class",
          orderedEntries: [{
            entryRef: "entry-private",
            workflowRef: "workflow-private",
            targetCareGroupRef: "care-group-01",
            targetClassSafeLabel: "Rainbow class",
            lifecycle: "offer_open",
            continuedInterest: "confirmed",
            categoryKey: "standard",
            categoryBasisKey: "family_confirmed",
            policyRef: "policy-01",
            policyRevision: 1,
            waitlistQualifiedAt: now,
            nextReviewAt: later,
            lastConfirmedAt: now,
            currentOfferRef: "offer-private",
            entryHead: 3,
          }],
        },
      }),
      readFamilyStatus: async () => ({
        status: "resolved",
        projection: {
          contractVersion: "1.0.0",
          status: "offer_open",
          targetClassSafeLabel: "Rainbow class",
          lastReviewAt: now,
          nextExpectedContactAt: later,
        },
      }),
    };
    deps.bindings = {
      async resolve({ request: resolvedRequest }) {
        return {
          status: "resolved",
          binding: binding(
            resolvedRequest.capabilityKey === "query_guardian_enrollment_waitlist"
              ? "guardian"
              : "institution_admin",
          ),
        };
      },
    };
    const handler = new NurtureEnrollmentJourneySurfaceHandler(deps);
    const query = (capabilityKey: string): unknown => ({
      capabilityKey,
      capabilityVersion: "1.0.0",
      targetOptionRef: "option-query",
      operationInput: {},
    });
    const journey = await handler.handle(query("query_institution_enrollment_journey"), trusted());
    expect(journey).toMatchObject({ status: "ok", result: { workflow: { workflowRunRef: "run-01" } } });
    expect(JSON.stringify(journey)).not.toMatch(/workflow-01|capabilityRefs/);

    const admin = await handler.handle(query("query_institution_capacity_waitlist"), trusted());
    expect(admin).toMatchObject({
      status: "ok",
      result: {
        waitlist: {
          targetCareGroupRef: "sealed:care_group:care-group-01",
          orderedEntries: [{
            journeyTargetOptionRef: "sealed:journey:workflow-private",
            hasOpenOffer: true,
          }],
        },
      },
    });
    expect(JSON.stringify(admin)).not.toMatch(/entry-private|offer-private|entryHead|currentOfferRef/);
    expect(issuedTargets).toContainEqual({
      workspace_id: "workspace-01",
      actor_participant_ref: "participant-01",
      kind: "journey",
      target_ref: "workflow-private",
      waitlist_entry_ref: "entry-private",
      waitlist_entry_head: 3,
    });

    const guardian = await handler.handle(
      query("query_guardian_enrollment_waitlist"),
      trusted("mobile_dashboard"),
    );
    expect(guardian).toMatchObject({
      status: "ok",
      result: { waitlist: { status: "offer_open", targetClassSafeLabel: "Rainbow class" } },
    });
    expect(JSON.stringify(guardian)).not.toMatch(/rank|category|policy|entry|count/i);
  });

  it("registers only the formal trusted track with a disabled surface mapping", () => {
    expect(Object.isFrozen(defaultNurtureEnrollmentJourneySurfaceDeps)).toBe(true);
    expect(Object.isFrozen(defaultNurtureEnrollmentJourneySurfaceDeps.bindings)).toBe(true);
    const mapping = nurtureScenarioManifest.surface_mapping;
    expect(mapping.web_run_workbench?.enrollment_journey).toEqual({
      workflow_type: "EnrollmentJourneyWorkflowV1",
      contract_version: "1.0.0",
      ingress_category: "host_transition",
      query_endpoint_key: "nurture.enrollment_journey.query",
      prepare_endpoint_key: "nurture.enrollment_journey.command.prepare",
      execute_endpoint_key: "nurture.enrollment_journey.command.execute",
      enablement_policy: "disabled",
    });
    expect(mapping.chat_workflow_control?.enrollment_journey).toBeUndefined();
    expect(mapping.mobile_dashboard?.enrollment_journey).toBeUndefined();
    const internalKeys = Object.keys(nurtureScenarioModule.internal_api_handlers ?? {})
      .filter((key) => key.includes("enrollment_journey"));
    expect(internalKeys).toEqual([]);
    const trusted = nurtureScenarioModule.trusted_invocation_handlers ?? {};
    expect(typeof trusted["nurture.enrollment_journey.query.formal.v1"])
      .toBe("function");
    expect(typeof trusted["nurture.enrollment_journey.command.prepare.formal.v2"])
      .toBe("function");
    expect(typeof trusted["nurture.enrollment_journey.command.execute.formal.v3"])
      .toBe("function");
  });
});
