import type {
  ScenarioHumanPrincipalV1,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1,
  parseNurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2,
  parseNurtureEnrollmentJourneyFormalExecuteInputV4,
  parseNurtureEnrollmentJourneyFormalPrepareInputV3,
  parseNurtureEnrollmentJourneyFormalQueryInputV2,
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
  it("admits Admin and fresh-carrier Guardian queries on their exact surfaces", () => {
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV2({
      contractVersion: 2,
      clientSurface: "web_run_workbench",
      request: queryRequest("query_institution_enrollment_journey"),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV2({
      contractVersion: 2,
      clientSurface: "mobile_dashboard",
      request: queryRequest("query_guardian_enrollment_waitlist"),
      guardianOwnerCarrier: guardianOwnerCarrier(),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalQueryInputV2({
      contractVersion: 2,
      clientSurface: "web_run_workbench",
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
    expect(parseNurtureEnrollmentJourneyFormalPrepareInputV3({
      contractVersion: 3,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalPrepareInputV3({
      contractVersion: 3,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-1",
      request: intent("record_or_skip_visit", { disposition: "recorded" }),
    })).toBeNull();
  });

  it("parses the execute union: ledgered confirmation or direct intent", () => {
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-1",
      request: intent("record_or_skip_visit", { disposition: "recorded" }),
    })).not.toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-1",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: {
        ...hostReservation(),
        actor_id: "forbidden-host-field",
      },
    })).toBeNull();
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 2,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    })).toBeNull();
    const validOwnerPair = currentOwnerCarrier("enrollment_trial_pair");
    const wrongOwnerPair = {
      ...validOwnerPair,
      currentOwnerEvidence: {
        ...validOwnerPair.currentOwnerEvidence,
        owner_bindings: [
          {
            ...validOwnerPair.currentOwnerEvidence.owner_bindings[0],
            owner_ref: {
              ...validOwnerPair.currentOwnerEvidence.owner_bindings[0].owner_ref,
              object_type: "family_binding_owner",
            },
          },
          validOwnerPair.currentOwnerEvidence.owner_bindings[1],
        ],
      },
    };
    expect(parseNurtureEnrollmentJourneyFormalExecuteInputV4({
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      currentOwnerCarrier: wrongOwnerPair,
    })).toBeNull();
  });

  it("requires request-scoped owner evidence and strips it before prepare persistence", async () => {
    const prepared: unknown[] = [];
    const authority = {
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-1",
      role_assignment_ref: "role-1",
      active_role: "institution_admin" as const,
      surface_key: "institution_workbench" as const,
      authority_version: "1",
      evaluated_at: "2026-08-12T00:00:00.000Z",
    };
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority }),
      },
      preparedCommandOwner: {
        prepare: async (input: unknown) => {
          prepared.push(input);
          return {
            status: "ready_to_confirm",
            command_request_id: "command-request-1",
            confirmation_ref: `ejc1.${"a".repeat(43)}`,
            expires_at: "2026-08-12T00:05:00.000Z",
            effect: "prepare_trial_relationship",
          };
        },
      } as never,
    });
    const invocation = verifiedInvocation("prepare");
    invocation.invocation.operation.input = {
      contractVersion: 3,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-1",
      request: intent("prepare_trial_relationship", {}),
      currentOwnerCarrier: currentOwnerCarrier("enrollment_trial_pair"),
    };

    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare]?.(invocation),
    ).resolves.toMatchObject({
      status: "ready_to_confirm",
      effect: "prepare_trial_relationship",
    });
    expect(prepared).toEqual([expect.objectContaining({
      command: {
        contractVersion: 1,
        clientCommandId: "client-1",
        request: intent("prepare_trial_relationship", {}),
      },
    })]);
    expect(JSON.stringify(prepared)).not.toContain("currentOwnerEvidence");

    invocation.invocation.operation.input = {
      contractVersion: 3,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-2",
      request: intent("prepare_trial_relationship", {}),
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare]?.(invocation),
    ).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_enrollment_journey_formal_input",
    });

    invocation.invocation.operation.input = {
      contractVersion: 3,
      clientSurface: "web_run_workbench",
      clientCommandId: "client-3",
      request: intent("close_inquiry", { reasonKey: "family_declined" }),
      currentOwnerCarrier: currentOwnerCarrier("enrollment_trial_pair"),
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.prepare]?.(invocation),
    ).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_enrollment_journey_formal_input",
    });
    expect(prepared).toHaveLength(1);
  });

  it("carries fresh trial evidence only into the matching execute request", async () => {
    const trustedContexts: unknown[] = [];
    const carrier = currentOwnerCarrier("enrollment_trial_pair");
    const authority = {
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-1",
      role_assignment_ref: "role-1",
      active_role: "institution_admin" as const,
      surface_key: "institution_workbench" as const,
      authority_version: "1",
      evaluated_at: "2026-08-12T00:00:00.000Z",
    };
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureEnrollmentJourneySurfaceDeps,
        bindings: {
          resolve: async ({ trusted }) => {
            trustedContexts.push(trusted);
            return { status: "denied", reason_code: "test_stop_after_carrier" };
          },
        },
      },
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority }),
      },
      preparedCommandOwner: {
        verifyConfirmed: async () => ({
          status: "resolved",
          command_request_id: "command-request-1",
          ledger_status: "prepared",
          frozen_request: {
            ...intent("prepare_trial_relationship", {}),
            confirmationRef: `ejc1.${"a".repeat(43)}`,
          },
          authority,
        }),
      } as never,
    });
    const invocation = verifiedInvocation("execute");
    invocation.invocation.operation.input = {
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      currentOwnerCarrier: carrier,
    };

    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(invocation),
    ).resolves.toEqual({ status: "denied", reason_code: "test_stop_after_carrier" });
    expect(trustedContexts).toEqual([expect.objectContaining({
      current_owner_carrier: carrier,
      invocation_request_id: "host-invocation-request-1",
    })]);

    invocation.invocation.operation.input = {
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(invocation),
    ).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_enrollment_journey_formal_input",
    });
    expect(trustedContexts).toHaveLength(1);
  });

  it("allows only the consumed command's own target-head advance on replay", async () => {
    const preparedAuthority = {
      workspace_id: "workspace-1",
      participant_ref: "participant-1",
      institution_ref: "institution-1",
      role_assignment_ref: "role-1",
      active_role: "institution_admin" as const,
      surface_key: "institution_workbench" as const,
      authority_version: "nurture.ej-authority.v1.b1.p1.r1.i1.t10",
      evaluated_at: "2026-08-12T00:00:00.000Z",
    };
    let currentAuthority = {
      ...preparedAuthority,
      authority_version: "nurture.ej-authority.v1.b1.p1.r1.i1.t11",
    };
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureEnrollmentJourneySurfaceDeps,
        bindings: {
          resolve: async () => ({ status: "denied", reason_code: "replay_reached_binding" }),
        },
      },
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority: currentAuthority }),
      },
      preparedCommandOwner: {
        verifyConfirmed: async () => ({
          status: "resolved",
          command_request_id: "command-request-1",
          ledger_status: "consumed",
          frozen_request: {
            ...intent("close_inquiry", { reasonKey: "family_declined" }),
            confirmationRef: `ejc1.${"a".repeat(43)}`,
          },
          authority: preparedAuthority,
        }),
      } as never,
    });
    const invocation = verifiedInvocation("execute");
    invocation.invocation.operation.input = {
      contractVersion: 4,
      clientSurface: "web_run_workbench",
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(invocation),
    ).resolves.toEqual({ status: "denied", reason_code: "replay_reached_binding" });

    currentAuthority = {
      ...currentAuthority,
      authority_version: "nurture.ej-authority.v1.b1.p1.r2.i1.t11",
    };
    await expect(
      handlers[NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.execute]?.(invocation),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "enrollment_authority_snapshot_drift",
    });
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

  it("parses no-effect only with the exact confirmation-bound v2 input", () => {
    const input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2(
        input,
      ),
    ).toEqual(input);
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2(
        {
          contractVersion: 2,
          commandRequestId: input.commandRequestId,
          hostWorkflowRunReservation: input.hostWorkflowRunReservation,
        },
      ),
    ).toBeNull();
    expect(
      parseNurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2({
        ...input,
        contractVersion: 1,
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
      contractVersion: 2,
      clientSurface: "web_run_workbench",
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
      contractVersion: 3,
      clientSurface: "web_run_workbench",
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
      preparedCommandOwner: {
        verifyHistoricalConfirmation: async (input: unknown) => {
          expect(input).toEqual({
            workspace_id: "workspace-1",
            command: {
              commandRequestId: "command-request-1",
              confirmationRef: `ejc1.${"a".repeat(43)}`,
            },
          });
          callOrder.push("verify_confirmation");
          return {
            status: "resolved",
            command_request_id: "command-request-1",
            effect: "start_enrollment_inquiry",
          };
        },
      } as never,
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
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(
      handlers[
        NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementConfirmNoEffect
      ]?.(invocation),
    ).resolves.toMatchObject(terminal);
    expect(callOrder).toEqual([
      "verify_confirmation",
      "register",
      "confirm_no_effect",
    ]);
  });

  it("does not cross the writer fence when settlement registration fails", async () => {
    let confirmCalls = 0;
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      preparedCommandOwner: {
        verifyHistoricalConfirmation: async () => ({
          status: "resolved",
          command_request_id: "command-request-1",
          effect: "start_enrollment_inquiry",
        }),
      } as never,
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
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
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

  it("does not register or cross the writer fence for another confirmation", async () => {
    let settlementCalls = 0;
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      preparedCommandOwner: {
        verifyHistoricalConfirmation: async () => ({
          status: "conflict",
          reason_code: "prepared_command_reuse_conflict",
        }),
      } as never,
      workflowRunSettlementOwner: {
        register: async () => {
          settlementCalls += 1;
          return { status: "unavailable", reason_code: "not_used" };
        },
        readStatus: async () => ({ status: "unavailable", reason_code: "not_used" }),
        confirmNoEffect: async () => {
          settlementCalls += 1;
          return { status: "unavailable", reason_code: "not_used" };
        },
      } as never,
    });
    const invocation = verifiedInvocation("settlementConfirmNoEffect");
    invocation.invocation.operation.input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"b".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(handlers[
      NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementConfirmNoEffect
    ]?.(invocation)).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_reuse_conflict",
    });
    expect(settlementCalls).toBe(0);
  });

  it("fails closed on malformed historical confirmation owner output", async () => {
    let settlementCalls = 0;
    const handlers = createNurtureEnrollmentJourneyFormalInvocationHandlers({
      surfaceDeps: defaultNurtureEnrollmentJourneySurfaceDeps,
      preparedCommandOwner: {
        verifyHistoricalConfirmation: async () => ({
          status: "resolved",
          command_request_id: "command-request-1",
          effect: "close_inquiry",
        }),
      } as never,
      workflowRunSettlementOwner: {
        register: async () => {
          settlementCalls += 1;
          return { status: "unavailable", reason_code: "not_used" };
        },
        readStatus: async () => ({ status: "unavailable", reason_code: "not_used" }),
        confirmNoEffect: async () => {
          settlementCalls += 1;
          return { status: "unavailable", reason_code: "not_used" };
        },
      } as never,
    });
    const invocation = verifiedInvocation("settlementConfirmNoEffect");
    invocation.invocation.operation.input = {
      contractVersion: 2,
      commandRequestId: "command-request-1",
      confirmationRef: `ejc1.${"a".repeat(43)}`,
      hostWorkflowRunReservation: hostReservation(),
    };

    await expect(handlers[
      NURTURE_ENROLLMENT_JOURNEY_FORMAL_HANDLER_KEYS.settlementConfirmNoEffect
    ]?.(invocation)).resolves.toEqual({
      status: "unavailable",
      reason_code: "enrollment_journey_owner_response_invalid",
    });
    expect(settlementCalls).toBe(0);
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
      contractVersion: 2,
      clientSurface: "web_run_workbench",
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

  it("carries only signed v3 Host reservation evidence into inquiry execution", async () => {
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
          ledger_status: "prepared",
          frozen_request: frozenRequest,
          authority,
        }),
        verifyHistoricalConfirmation: async () => ({
          status: "unavailable",
          reason_code: "not_used",
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
      contractVersion: 4,
      clientSurface: "web_run_workbench",
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
            ledger_status: "prepared",
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
          verifyHistoricalConfirmation: async () => ({
            status: "unavailable",
            reason_code: "not_used",
          }),
          deriveDirectContext: async () => ({ status: "unavailable", reason_code: "not_used" }),
        },
        workflowRunSettlementOwner: {} as never,
      });
    const withoutEvidence = verifiedInvocation("execute");
    withoutEvidence.invocation.operation.input = {
      contractVersion: 4,
      clientSurface: "web_run_workbench",
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
      contractVersion: 4,
      clientSurface: "web_run_workbench",
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
        issued_at: "2026-08-12T00:00:00.000Z",
        expires_at: "2026-08-12T00:01:00.000Z",
        nonce: "n".repeat(32),
      },
    },
  } as unknown as WorkflowVerifiedScenarioInvocationV1;
}

function canonical(
  namespace: "my_chat" | "nurture" | "scenario-owner",
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

function currentOwnerCarrier(
  purposeKey: "enrollment_family_acceptance" | "enrollment_trial_pair",
) {
  const currentOwnerEvidence = {
    binding_evidence_version: 1 as const,
    purpose_key: purposeKey,
    owner_bindings: [
      {
        owner_binding_ref_version: 1 as const,
        binding_slot: "child" as const,
        owner_ref: {
          ...canonical(
            "scenario-owner",
            "child_binding_owner",
            "nurture_child_binding_anchor_v1:00000000-0000-4000-8000-000000000001",
          ),
          version: 1,
        },
      },
      {
        owner_binding_ref_version: 1 as const,
        binding_slot: "family" as const,
        owner_ref: {
          ...canonical(
            "scenario-owner",
            "family_binding_owner",
            "nurture_family_binding_anchor_v1:00000000-0000-4000-8000-000000000002",
          ),
          version: 1,
        },
      },
    ] as const,
    pair_relation_evidence_hash: "a".repeat(64),
    current_owner_evidence_hash: "b".repeat(64),
  };
  return purposeKey === "enrollment_trial_pair"
    ? { carrierVersion: 1 as const, currentOwnerEvidence }
    : {
        carrierVersion: 1 as const,
        currentOwnerEvidence,
        guardianAction: {
          contract_version: "1.0.0" as const,
          actor_ref: canonical("my_chat", "actor", "guardian-actor-1"),
          contact_ref: canonical("my_chat", "nurture_prospective_contact", "contact-1"),
          action_ref: canonical("my_chat", "enrollment_action", "action-1"),
          occurred_at: "2026-08-12T00:00:00.000Z",
          verified_at: "2026-08-12T00:00:01.000Z",
        },
      };
}

function guardianOwnerCarrier() {
  return {
    carrierVersion: 1 as const,
    guardianAction: {
      contract_version: "1.0.0" as const,
      actor_ref: canonical("my_chat", "actor", "actor-1"),
      contact_ref: canonical(
        "my_chat",
        "nurture_prospective_contact",
        "contact-1",
      ),
      action_ref: canonical("my_chat", "enrollment_action", "action-1"),
      occurred_at: "2026-08-12T00:00:00.000Z",
      verified_at: "2026-08-12T00:00:01.000Z",
    },
  };
}
