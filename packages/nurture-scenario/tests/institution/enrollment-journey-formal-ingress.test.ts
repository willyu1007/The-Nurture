import type {
  ScenarioHumanPrincipalV1,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1,
  parseNurtureEnrollmentJourneyFormalExecuteInputV2,
  parseNurtureEnrollmentJourneyFormalPrepareInputV1,
  parseNurtureEnrollmentJourneyFormalQueryInputV1,
  parseNurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1,
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
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 2,
      clientCommandId: "client-1",
      request: intent("record_or_skip_visit", { disposition: "recorded" }),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 2,
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 2,
      commandRequestId: "command-request-1",
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: {
        ...hostReservation(),
        actor_id: "forbidden-host-field",
      },
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV2({
      contractVersion: 1,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    })).toBeNull();
  });

  it("parses only exact historical settlement status input", () => {
    const input = {
      contractVersion: 1,
      commandRequestId: "command-request-1",
      hostWorkflowRunReservation: hostReservation(),
    };
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1(input),
    ).toEqual(input);
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1({
        ...input,
        authorityVersion: "forbidden-current-authority",
      }),
    ).toBeNull();
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1({
        ...input,
        hostWorkflowRunReservation: {
          ...hostReservation(),
          reservation_evidence_sha256: "invalid",
        },
      }),
    ).toBeNull();
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

  it("reads historical settlement without prepared TTL or current authority", async () => {
    const authorityCalls: unknown[] = [];
    const ownerCalls: unknown[] = [];
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      authorityResolver: {
        resolveCurrent: async (input: unknown) => {
          authorityCalls.push(input);
          return { status: "unavailable", reason_code: "revoked" };
        },
      },
      workflowRunSettlementOwner: {
        register: async () => ({ status: "unavailable", reason_code: "not_used" }),
        readStatus: async (input: unknown) => {
          ownerCalls.push(input);
          return {
            status: "committed",
            settlement_ref: {
              schema_version: 1,
              namespace: "nurture",
              object_type: "workflow_run_settlement",
              object_id: "settlement-1",
              version: 2,
            },
            run_ref: hostReservation().run_ref,
            outcome: "committed",
            proof: {
              proof_version: 1,
              outcome: "committed",
              writer_fence_receipt_ref: "receipt-1",
              receipt_sha256: "c".repeat(64),
            },
          };
        },
        confirmNoEffect: async () => ({ status: "unavailable", reason_code: "not_used" }),
      } as never,
    });
    const status = verifiedInvocation("settlementStatus");
    status.invocation.operation.input = {
      contractVersion: 1,
      commandRequestId: "command-request-1",
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementStatus]?.(
        status,
      ),
    ).resolves.toMatchObject({
      status: "committed",
      outcome: "committed",
      run_ref: hostReservation().run_ref,
    });
    expect(authorityCalls).toEqual([]);
    expect(ownerCalls).toEqual([{
      workspace_id: "workspace-1",
      command_request_id: "command-request-1",
      host_reservation: hostReservation(),
    }]);
  });

  it.each([
    {
      name: "confirms the writer-fenced no-effect terminal",
      terminal: {
        status: "confirmed_no_effect",
        outcome: "confirmed_no_effect",
        proof: {
          proof_version: 1,
          outcome: "confirmed_no_effect",
          writer_fence_receipt_ref: "receipt-no-effect-1",
          receipt_sha256: "d".repeat(64),
        },
      },
    },
    {
      name: "returns committed when the command writer won the fence",
      terminal: {
        status: "committed",
        outcome: "committed",
        proof: {
          proof_version: 1,
          outcome: "committed",
          writer_fence_receipt_ref: "receipt-committed-1",
          receipt_sha256: "e".repeat(64),
        },
      },
    },
  ])("$name without current-authority resolution", async ({ terminal }) => {
    const callOrder: string[] = [];
    const ownerInput = {
      workspace_id: "workspace-1",
      command_request_id: "command-request-1",
      host_reservation: hostReservation(),
    };
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      authorityResolver: {
        resolveCurrent: async () => {
          callOrder.push("authority");
          return { status: "unavailable", reason_code: "not_used" };
        },
      },
      workflowRunSettlementOwner: {
        register: async (input: unknown) => {
          expect(input).toEqual(ownerInput);
          callOrder.push("register");
          return {
            status: "prepared",
            disposition: "created",
            settlement_ref: canonical(
              "nurture",
              "workflow_run_settlement",
              "settlement-1",
            ),
            run_ref: hostReservation().run_ref,
            outcome: "unknown",
          };
        },
        readStatus: async () => ({ status: "unavailable", reason_code: "not_used" }),
        confirmNoEffect: async (input: unknown) => {
          expect(input).toEqual(ownerInput);
          callOrder.push("confirm_no_effect");
          return {
            ...terminal,
            settlement_ref: canonical(
              "nurture",
              "workflow_run_settlement",
              "settlement-1",
            ),
            run_ref: hostReservation().run_ref,
          };
        },
      } as never,
    });
    const invocation = verifiedInvocation("settlementConfirmNoEffect");
    invocation.invocation.operation.input = {
      contractVersion: 1,
      commandRequestId: "command-request-1",
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(
      handlers[
        NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementConfirmNoEffect
      ]?.(invocation),
    ).resolves.toMatchObject(terminal);
    expect(callOrder).toEqual(["register", "confirm_no_effect"]);
  });

  it("does not cross the writer fence when settlement registration fails", async () => {
    let confirmCalls = 0;
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      workflowRunSettlementOwner: {
        register: async () => ({
          status: "unavailable",
          reason_code: "workflow_run_settlement_unavailable",
        }),
        readStatus: async () => ({ status: "unavailable", reason_code: "not_used" }),
        confirmNoEffect: async () => {
          confirmCalls += 1;
          return { status: "unavailable", reason_code: "not_used" };
        },
      } as never,
    });
    const invocation = verifiedInvocation("settlementConfirmNoEffect");
    invocation.invocation.operation.input = {
      contractVersion: 1,
      commandRequestId: "command-request-1",
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(
      handlers[
        NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementConfirmNoEffect
      ]?.(invocation),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "workflow_run_settlement_unavailable",
    });
    expect(confirmCalls).toBe(0);
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

  it("carries only signed v2 Host reservation evidence into inquiry execution", async () => {
    const trustedContexts: unknown[] = [];
    const authority = {
      workspace_id: "workspace-1",
      participant_ref: "nurture-local-participant-1",
      institution_ref: "institution-1",
      role_assignment_ref: "role-1",
      active_role: "institution_admin" as const,
      surface_key: "institution_workbench" as const,
      authority_version: "1",
      evaluated_at: "2026-08-12T00:00:00.000Z",
    };
    const frozenRequest = {
      ...intent("start_enrollment_inquiry", {
        preferredLabel: "Prospective family",
        birthYearMonth: "2024-03",
        ageBandKey: undefined,
        expectedEntryStartDate: "2026-09-01",
        expectedEntryEndDate: "2026-10-01",
        targetClassTypeKey: "toddler",
        targetAgeBandKey: "age_2_3",
        targetCareGroupOptionRef: undefined,
        careScheduleNeedKeys: ["full_day"],
        sourceChannel: "walk_in",
        safetyLabelKeys: [],
        initialContactAt: "2026-08-12T00:00:00.000Z",
        nextTouchpointAt: "2026-08-13T00:00:00.000Z",
      }),
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    } as never;
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureEnrollmentJourneySurfaceDeps,
        bindings: {
          resolve: async ({ trusted }) => {
            trustedContexts.push(trusted);
            return {
              status: "resolved",
              binding: {
                surface_key: "institution_workbench",
                active_role: "institution_admin",
                institution_ref: "institution-1",
                role_assignment_ref: "role-1",
                workflow_run_ref: hostReservation().run_ref,
                heads: {},
                refs: {},
                contact_owner_snapshot: {
                  contract_version: "1.0.0",
                  contact_ref: canonical("my_chat", "prospective_contact", "contact-1"),
                  safe_label: "Prospective family",
                  verified_at: "2026-08-12T00:00:00.000Z",
                },
                protected_birth_year_month: {
                  algVersion: 1,
                  keyRef: "protected-key",
                  ciphertext: "ciphertext",
                  integrityTag: "integrity-tag",
                },
              },
            } as const;
          },
        },
        commands: {
          execute: async () => ({
            status: "committed",
            disposition: "executed",
            workflow: {
              contract_version: "1.0.0",
              workspace_id: "workspace-1",
              institution_ref: "institution-1",
              workflow_ref: "workflow-1",
              workflow_run_ref: hostReservation().run_ref,
              workflow_type: "EnrollmentJourneyWorkflowV1",
              workflow_head: 1,
              lifecycle: "active",
              current_stage: "inquiry",
              waiting_state: "ready",
              pending_transition: "none",
              terminal_outcome: "none",
              completed_milestones: ["inquiry_started"],
              started_at: "2026-08-12T00:00:00.000Z",
              updated_at: "2026-08-12T00:00:00.000Z",
            },
          }),
        },
      },
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority }),
      },
      preparedCommandOwner: {
        prepare: async () => ({
          status: "unavailable",
          reason_code: "not_used",
        }),
        verifyConfirmed: async () => ({
          status: "resolved",
          command_request_id: "command-request-1",
          frozen_request: frozenRequest,
          authority,
        }),
        deriveDirectContext: async () => ({
          status: "unavailable",
          reason_code: "not_used",
        }),
      },
      workflowRunSettlementOwner: {
        register: async () => ({ status: "unavailable", reason_code: "not_used" }),
        readStatus: async () => ({
          status: "committed",
          settlement_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "workflow_run_settlement",
            object_id: "settlement-1",
            version: 2,
          },
          run_ref: hostReservation().run_ref,
          outcome: "committed",
          proof: {
            proof_version: 1,
            outcome: "committed",
            writer_fence_receipt_ref: "receipt-1",
            receipt_sha256: "c".repeat(64),
          },
        }),
        confirmNoEffect: async () => ({ status: "unavailable", reason_code: "not_used" }),
      } as never,
    });
    const execute = verifiedInvocation("execute");
    execute.invocation.operation.input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(execute),
    ).resolves.toMatchObject({
      status: "ok",
      workflow_run_settlement: {
        status: "committed",
        run_ref: hostReservation().run_ref,
        proof: {
          outcome: "committed",
          writer_fence_receipt_ref: "receipt-1",
        },
      },
    });
    expect(trustedContexts).toEqual([expect.objectContaining({
      command_request_id: "command-request-1",
      host_workflow_run_reservation: hostReservation(),
    })]);
  });

  it("requires reservation evidence for inquiry and forbids it on other commands", async () => {
    const handlerFor = (frozenRequest: unknown) =>
      createNurtureEnrollmentJourneyFormalInvocationHandlers({
        surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
        authorityResolver: {
          resolveCurrent: async () => ({
            status: "unavailable",
            reason_code: "must_not_reach_authority",
          }),
        },
        preparedCommandOwner: {
          prepare: async () => ({ status: "unavailable", reason_code: "not_used" }),
          verifyConfirmed: async () => ({
            status: "resolved",
            command_request_id: "command-request-1",
            frozen_request: frozenRequest,
            authority: {
              workspace_id: "workspace-1",
              participant_ref: "participant-1",
              institution_ref: "institution-1",
              role_assignment_ref: "role-1",
              active_role: "institution_admin",
              surface_key: "institution_workbench",
              authority_version: "1",
              evaluated_at: "2026-08-12T00:00:00.000Z",
            },
          } as never),
          deriveDirectContext: async () => ({ status: "unavailable", reason_code: "not_used" }),
        },
        workflowRunSettlementOwner: {} as never,
      });
    const withoutEvidence = verifiedInvocation("execute");
    withoutEvidence.invocation.operation.input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    };
    await expect(handlerFor({
      ...intent("start_enrollment_inquiry", {}),
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    })[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(withoutEvidence))
      .resolves.toEqual({
        status: "invalid",
        reason_code: "invalid_enrollment_journey_formal_input",
      });

    const forbiddenEvidence = verifiedInvocation("execute");
    forbiddenEvidence.invocation.operation.input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };
    await expect(handlerFor({
      ...intent("close_inquiry", { reasonKey: "family_declined" }),
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    })[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(forbiddenEvidence))
      .resolves.toEqual({
        status: "invalid",
        reason_code: "invalid_enrollment_journey_formal_input",
      });
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
  lane:
    | "query"
    | "prepare"
    | "execute"
    | "settlementStatus"
    | "settlementConfirmNoEffect",
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

function canonical(
  namespace: "my_chat" | "nurture",
  objectType: string,
  objectId: string,
) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
  };
}

function hostReservation() {
  return {
    evidence_version: 1 as const,
    logical_operation_id: "logical-operation-1",
    reservation_ref: {
      ...canonical("my_chat", "workflow_run_reservation", "reservation-1"),
      version: 1,
    },
    run_ref: canonical("my_chat", "workflow_run", "run-1"),
    binding_fingerprint_sha256: "b".repeat(64),
    reservation_evidence_sha256: "e".repeat(64),
  };
}
