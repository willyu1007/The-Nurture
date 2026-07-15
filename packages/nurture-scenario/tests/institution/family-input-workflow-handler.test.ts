import { describe, expect, it } from "vitest";
import type { WorkflowStepHandlerInput } from "@my-chat/workflow-contracts";
import {
  createScenarioCommandDriverContext,
  createWorkflowHandoffDraftsFromScenarioSnapshots,
} from "@my-chat/workflow-runtime";
import {
  createInMemoryNurtureCommandRepository,
  createNurtureHandlers,
  defaultNurtureDeps,
  familyCareRef,
  hashCommandRequestId,
  makeCaptureFamilyInput,
  nurtureScenarioManifest,
  type FamilyCareCurrentGrant,
  type FamilyInputRouteFacts,
  type NurtureFamilyCareCommandTransaction,
  type NurtureHandlerDeps,
} from "../../src/index.js";

const activeGrant: FamilyCareCurrentGrant = {
  grant_id: "grant-1",
  status: "active",
  directions: ["family_to_org"],
  data_classes: ["family_care_question"],
  target_scope_type: "care_group",
  target_scope_id: "group-1",
};

const routeFacts = (): FamilyInputRouteFacts => ({
  participant_active: true,
  guardian_role_active: true,
  role_reaches_family: true,
  child_process_active: true,
  family_active: true,
  enrollment_active: true,
  thread_active: true,
  thread_membership_active: true,
  grant: activeGrant,
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
  source_surface: "workflow" as const,
  routing_attempt_key: "route-1",
  route_mode: "immediate" as const,
  requires_ack: true,
  requires_reply: true,
};

const command = {
  invocation_request_id: "family-input-invocation-1",
  command_request_id: "family-input-command-1",
  handoff_request_id: "family-input-attention-1",
  payload: routePayload,
};

const handlerInput = (
  overrides: Partial<WorkflowStepHandlerInput> = {},
): WorkflowStepHandlerInput => ({
  run_id: "run-1",
  step_id: "step-1",
  step_key: "capture_family_input",
  claim_token: "claim-token-1",
  expected_step_version: 2,
  scenario_key: "nurture",
  capability_key: "class_family_inbox",
  entrypoint_key: "capture_family_input",
  workflow_version_id: "nurture-class-family-inbox-v2",
  contract_hash: "a".repeat(64),
  meta: {
    workspace_id: "workspace-1",
    actor_id: "my-chat-user-1",
    idempotency_key: "run-1:step-1",
    correlation_id: "correlation-1",
    client_surface: "worker_runtime",
  },
  ...overrides,
});

const bridge = {
  createDriverContext: createScenarioCommandDriverContext,
  createHandoffDrafts: createWorkflowHandoffDraftsFromScenarioSnapshots,
};

const makeHarness = () => {
  let routeEffects = 0;
  let sourceReads = 0;
  const familyCare: NurtureFamilyCareCommandTransaction = {
    loadFamilyInputRouteFacts: async () => routeFacts(),
    applyFamilyInputRoute: async () => {
      routeEffects += 1;
      return {
        message_ref: familyCareRef("family_care_message", "message-1", 1),
        receipt_ref: familyCareRef("child_link_receipt", "receipt-1", 1),
        item_ref: familyCareRef("family_care_item", "item-1", 1),
        attention_ref: familyCareRef("teacher_attention_item", "attention-1", 1),
      };
    },
    loadFamilyCareGrantRevokeFacts: async () => {
      throw new Error("unused grant revoke path");
    },
    revokeFamilyCareGrant: async () => {
      throw new Error("unused grant revoke path");
    },
    loadFamilyCareItemActionFacts: async () => {
      throw new Error("unused item path");
    },
    acknowledgeFamilyCareItem: async () => {
      throw new Error("unused item path");
    },
    replyToFamilyCareItem: async () => {
      throw new Error("unused reply path");
    },
    loadFamilyCareRedactionFacts: async () => {
      throw new Error("unused redaction path");
    },
    redactFamilyCareMessage: async () => {
      throw new Error("unused redaction path");
    },
    loadFamilyCareCancelRouteFacts: async () => {
      throw new Error("unused cancel path");
    },
    cancelFamilyCareRoute: async () => {
      throw new Error("unused cancel path");
    },
  };
  const repository = createInMemoryNurtureCommandRepository({ familyCare });
  const deps: NurtureHandlerDeps = {
    ...defaultNurtureDeps,
    repositories: { ...defaultNurtureDeps.repositories, commands: repository },
    scenarioCommandBridge: bridge,
    familyInputWorkflow: {
      resolveCommand: async () => {
        sourceReads += 1;
        return command;
      },
    },
  };
  return {
    deps,
    repository,
    get routeEffects() {
      return routeEffects;
    },
    get sourceReads() {
      return sourceReads;
    },
  };
};

describe("claimed-Step family input workflow handler", () => {
  it("replays through the same Step and rejects replay ownership transfer", async () => {
    const harness = makeHarness();
    const handler = makeCaptureFamilyInput(harness.deps);

    const first = await handler(handlerInput());
    expect(first).toMatchObject({
      status: "completed",
      output_refs: [
        {
          kind: "domain_context_ref",
          id: expect.stringMatching(/^nurture:command_execution:/),
          version: 1,
        },
      ],
      handoff_drafts: [
        {
          draft_key: "family-input-attention-1",
          handoff_key: "user_attention",
          requested_purpose: "user_attention",
          source_context_refs: [
            { object_type: "family_care_message", object_id: "message-1" },
            { object_type: "child_link_receipt", object_id: "receipt-1" },
            { object_type: "family_care_item", object_id: "item-1" },
          ],
        },
      ],
    });
    expect(JSON.stringify(first.output_refs)).not.toContain("message-1");
    expect(JSON.stringify(first.output_refs)).not.toContain("receipt-1");
    expect(JSON.stringify(first.output_refs)).not.toContain("item-1");
    expect(first.event_drafts).toBeUndefined();

    const reclaimed = await handler(
      handlerInput({ claim_token: "claim-token-2", expected_step_version: 8 }),
    );
    expect(reclaimed).toEqual(first);
    expect(harness.routeEffects).toBe(1);

    const wrongStep = await handler(
      handlerInput({
        step_id: "step-2",
        claim_token: "claim-token-other",
        meta: { ...handlerInput().meta, idempotency_key: "run-1:step-2" },
      }),
    );
    expect(wrongStep).toEqual({
      status: "manual_review_required",
      output_refs: [],
      handoff_drafts: [],
      reason_code: "invalid_durable_handoff_driver",
    });
    expect(harness.routeEffects).toBe(1);

    const stored = await harness.repository.findCommitted({
      workspace_id: "workspace-1",
      command_request_id_hash: hashCommandRequestId(
        "workspace-1",
        command.command_request_id,
      ),
    });
    expect(JSON.stringify(stored)).not.toContain("claim-token");
    expect(stored?.handoff_driver_ref).toMatchObject({ object_id: "step-1" });
  });

  it("fails closed before command resolution when the host bridge is absent", async () => {
    const harness = makeHarness();
    const handler = makeCaptureFamilyInput({
      ...harness.deps,
      scenarioCommandBridge: undefined,
    });

    await expect(handler(handlerInput())).resolves.toEqual({
      status: "manual_review_required",
      output_refs: [],
      handoff_drafts: [],
      reason_code: "workflow_handoff_bridge_unavailable",
    });
    expect(harness.sourceReads).toBe(0);
    expect(harness.routeEffects).toBe(0);
  });

  it("rejects malformed claimed-Step evidence before resolving business input", async () => {
    const harness = makeHarness();
    const handler = makeCaptureFamilyInput(harness.deps);

    await expect(handler(handlerInput({ claim_token: undefined }))).resolves.toEqual({
      status: "manual_review_required",
      output_refs: [],
      handoff_drafts: [],
      reason_code: "invalid_durable_handoff_driver",
    });
    expect(harness.sourceReads).toBe(0);
    expect(harness.routeEffects).toBe(0);
  });

  it("keeps the registered handler unreachable while manifest activation is absent", () => {
    const harness = makeHarness();
    const handlers = createNurtureHandlers(harness.deps);
    const declaredHandlerKeys = nurtureScenarioManifest.capabilities.flatMap((capability) =>
      capability.entrypoints.flatMap((entrypoint) =>
        entrypoint.steps.map((step) => step.handler_key),
      ),
    );

    expect(handlers["nurture.capture_family_input"]).toBeTypeOf("function");
    expect(declaredHandlerKeys).not.toContain("nurture.capture_family_input");
    expect(nurtureScenarioManifest.handoffs).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ handoff_key: "user_attention" })]),
    );
  });
});
