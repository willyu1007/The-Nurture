import type {
  ScenarioHumanPrincipalV1,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1,
  parseNurtureEnrollmentJourneyFormalExecuteInputV1,
  parseNurtureEnrollmentJourneyFormalPrepareInputV1,
  parseNurtureEnrollmentJourneyFormalQueryInputV1,
} from "../../src/enrollment-journey-formal-ingress-contract.js";
import {
  createNurtureEnrollmentJourneyFormalInvocationHandlers,
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS,
} from "../../src/enrollment-journey-formal-ingress.js";
import { defaultNurtureEnrollmentJourneySurfaceDeps } from "../../src/enrollment-journey-surfaces.js";

const principal: ScenarioHumanPrincipalV1 = {
  principal_version: 1,
  principal_kind: "human_user",
  account_ref: canonical("my_chat", "user", "user-1"),
  actor_ref: canonical("my_chat", "actor", "actor-1"),
  workspace_ref: canonical("my_chat", "workspace", "workspace-1"),
  principal_origin: "interactive_session",
};

describe("Enrollment Journey formal ingress", () => {
  it("admits only the two admin queries on the query lane", () => {
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV1({
      contractVersion: 1,
      request: queryRequest("query_institution_enrollment_journey"),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV1({
      contractVersion: 1,
      request: queryRequest("query_guardian_enrollment_waitlist"),
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV1({
      contractVersion: 1,
      request: {
        capabilityKey: "close_inquiry",
        capabilityVersion: "1.0.0",
        targetOptionRef: "option-1",
        operationInput: { reasonKey: "family_declined" },
        confirmationRef: "confirmation-0000001",
      },
    })).toBeNull();
  });

  it("admits only ledgered intents on the prepare lane", () => {
    expect(parseNurtureEnrollmentJourneyFormalPrepareInputV1({
      contractVersion: 1,
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalPrepareInputV1({
      contractVersion: 1,
      clientCommandId: "client-1",
      request: intent("record_or_skip_visit", { disposition: "recorded" }),
    })).toBeNull();
  });

  it("parses the execute union: ledgered confirmation or direct intent", () => {
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV1({
      contractVersion: 1,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV1({
      contractVersion: 1,
      clientCommandId: "client-1",
      request: intent("record_or_skip_visit", { disposition: "recorded" }),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV1({
      contractVersion: 1,
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV1({
      contractVersion: 1,
      commandRequestId: "command-request-1",
    })).toBeNull();
  });

  it("fails closed on declaration drift before touching any owner", async () => {
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
    });
    const drifted = verifiedInvocation("query");
    drifted.declaration.operation_key = "query_institution_knowledge";
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.query]?.(drifted),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "enrollment_journey_formal_declaration_drift",
    });
  });

  it("stays unavailable while no owner set is bound", async () => {
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
    });
    const query = verifiedInvocation("query");
    query.invocation.operation.input = {
      contractVersion: 1,
      request: queryRequest("query_institution_enrollment_journey"),
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.query]?.(query),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "enrollment_journey_formal_ingress_unavailable",
    });

    const prepare = verifiedInvocation("prepare");
    prepare.invocation.operation.input = {
      contractVersion: 1,
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare]?.(prepare),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "enrollment_journey_formal_ingress_unavailable",
    });
  });

  it("carries verified Host invocation metadata into trusted binding context", async () => {
    const trustedContexts: unknown[] = [];
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureEnrollmentJourneySurfaceDeps,
        bindings: {
          resolve: async ({ trusted }) => {
            trustedContexts.push(trusted);
            return { status: "denied", reason_code: "test_stop_after_binding" };
          },
        },
      },
      authorityResolver: {
        resolveCurrent: async () => ({
          status: "resolved",
          authority: {
            workspace_id: "workspace-1",
            participant_ref: "nurture-local-participant-1",
            institution_ref: "institution-1",
            role_assignment_ref: "role-1",
            active_role: "institution_admin",
            surface_key: "institution_workbench",
            authority_version: "1",
            evaluated_at: "2026-08-12T00:00:00.000Z",
          },
        }),
      },
    });
    const query = verifiedInvocation("query");
    query.invocation.operation.input = {
      contractVersion: 1,
      request: queryRequest("query_institution_enrollment_journey"),
    };

    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.query]?.(query),
    ).resolves.toEqual({ status: "denied", reason_code: "test_stop_after_binding" });
    expect(trustedContexts).toEqual([{
      workspace_id: "workspace-1",
      actor_participant_ref: "nurture-local-participant-1",
      invocation_request_id: "host-invocation-request-1",
      host_correlation_id: "host-correlation-1",
      host_trace_id: "host-trace-1",
      command_request_id: "host-invocation-request-1",
      client_surface: "web_run_workbench",
    }]);
  });
});

function queryRequest(capabilityKey: string) {
  return {
    capabilityKey,
    capabilityVersion: "1.0.0",
    targetOptionRef: "option-1",
    operationInput: {},
  };
}

function intent(capabilityKey: string, operationInput: Record<string, unknown>) {
  return {
    capabilityKey,
    capabilityVersion: "1.0.0",
    targetOptionRef: "option-1",
    operationInput,
  };
}

function verifiedInvocation(
  lane: "query" | "prepare" | "execute",
): WorkflowVerifiedScenarioInvocationV1 {
  const contract = NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1[lane];
  return {
    declaration: {
      scenario_key: "nurture",
      method: contract.method,
      endpoint_key: contract.endpoint_key,
      operation_key: contract.operation_key,
      input_schema_version: contract.input_schema_version,
      ingress_category: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.ingress_category,
      ingress_key: contract.ingress_key,
      principal_origins: [NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.principal_origin],
    },
    invocation: {
      route: {
        scenario_key: "nurture",
        method: contract.method,
        endpoint_key: contract.endpoint_key,
        ingress: {
          ingress_category: NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1.ingress_category,
          ingress_key: contract.ingress_key,
        },
      },
      operation: {
        operation_key: contract.operation_key,
        input_schema_version: contract.input_schema_version,
        input: {},
      },
      principal,
      request: {
        request_id: "host-invocation-request-1",
        correlation_id: "host-correlation-1",
        trace_id: "host-trace-1",
      },
    },
  } as unknown as WorkflowVerifiedScenarioInvocationV1;
}

function canonical(namespace: "my_chat", objectType: string, objectId: string) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
  };
}
