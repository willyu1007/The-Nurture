import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureEnrollmentJourneyQueryService,
  closeInquirySpec,
  confirmIntentConversationSpec,
  confirmNativeTouchpointNoteSpec,
  createInMemoryNurtureCommandRepository,
  recordExternalTouchpointSpec,
  recordOrSkipVisitSpec,
  startEnrollmentInquirySpec,
  validateExternalTouchpointPayload,
  validateNativeTouchpointPayload,
  validateStartEnrollmentInquiryPayload,
  type NurtureEnrollmentJourneyMutation,
  type NurtureEnrollmentJourneyMutationResult,
  type NurtureEnrollmentJourneyTransaction,
  type NurtureEnrollmentJourneyTransitionDraftV1,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
  type NurtureCommandSpec,
  type NurtureConfirmNativeTouchpointNotePayload,
  type NurtureRecordExternalTouchpointPayload,
  type NurtureStartEnrollmentInquiryPayload,
} from "../../src/index.js";

const envelope = () => ({
  algVersion: 1 as const,
  keyRef: "enrollment-key",
  ciphertext: "c3VtbWFyeQ",
  integrityTag: "dGFn",
});

const startPayload = (
  overrides: Partial<NurtureStartEnrollmentInquiryPayload> = {},
): NurtureStartEnrollmentInquiryPayload => ({
  workspace_id: "workspace-01",
  institution_ref: "institution-01",
  role_assignment_ref: "role-admin-01",
  expected_workflow_head: 0,
  workflow_run_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_run",
    object_id: "run-01",
    version: 1,
  },
  contact_owner_snapshot: {
    contract_version: "1.0.0",
    contact_ref: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "prospective_contact",
      object_id: "contact-01",
      version: 1,
    },
    safe_label: "Guardian contact",
    verified_at: "2026-08-10T01:00:00.000Z",
  },
  preferred_label: "Momo",
  age_band_key: "toddler",
  expected_entry_start_date: "2026-09-01",
  expected_entry_end_date: "2026-09-30",
  target_class_type_key: "full_day",
  target_age_band_key: "toddler",
  care_schedule_need_keys: ["weekdays"],
  source_channel: "referral",
  safety_label_keys: [],
  initial_contact_at: "2026-08-10T01:00:00.000Z",
  next_touchpoint_at: "2026-08-11T01:00:00.000Z",
  ...overrides,
});

const externalPayload = (
  workflowRef: string,
  head: number,
  overrides: Partial<NurtureRecordExternalTouchpointPayload> = {},
): NurtureRecordExternalTouchpointPayload => ({
  workspace_id: "workspace-01",
  institution_ref: "institution-01",
  role_assignment_ref: "role-admin-01",
  workflow_ref: workflowRef,
  expected_workflow_head: head,
  source_channel: "phone",
  confirmed_need_keys: ["weekday_care"],
  safety_label_keys: [],
  next_action_key: "confirm_intent",
  responsible_role: "institution_admin",
  occurred_at: "2026-08-10T02:00:00.000Z",
  due_at: "2026-08-11T01:00:00.000Z",
  next_touchpoint_at: "2026-08-11T01:00:00.000Z",
  external_summary_body_envelope: envelope(),
  ...overrides,
});

class InMemoryJourneyOwner implements NurtureEnrollmentJourneyTransaction {
  workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1 | undefined;
  inquiryRef: string | undefined;
  confirmedTouchpoints = 0;
  transitions: NurtureEnrollmentJourneyTransitionDraftV1[] = [];
  forcedConflict:
    | Extract<NurtureEnrollmentJourneyMutationResult, { status: "conflict" }>["reason_code"]
    | undefined;

  async loadCommandFacts(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    workflow_ref?: string;
  }) {
    if (
      input.workspace_id !== "workspace-01" ||
      input.institution_ref !== "institution-01" ||
      input.participant_ref !== "participant-admin-01" ||
      input.role_assignment_ref !== "role-admin-01"
    ) {
      return { status: "denied" as const, reason_code: "not_authorized" as const };
    }
    if (input.workflow_ref && this.workflow?.workflow_ref !== input.workflow_ref) {
      return { status: "denied" as const, reason_code: "not_authorized" as const };
    }
    return {
      status: "resolved" as const,
      facts: {
        actor_role_assignment_ref: input.role_assignment_ref,
        ...(this.workflow ? { workflow: this.workflow } : {}),
        confirmed_touchpoint_count: this.confirmedTouchpoints,
      },
    };
  }

  async commitMutation(
    mutation: NurtureEnrollmentJourneyMutation,
  ): Promise<NurtureEnrollmentJourneyMutationResult> {
    if (this.forcedConflict) {
      const reasonCode = this.forcedConflict;
      this.forcedConflict = undefined;
      return { status: "conflict", reason_code: reasonCode };
    }
    if (mutation.kind === "start_inquiry") {
      if (this.workflow) {
        return { status: "conflict", reason_code: "workflow_head_conflict" };
      }
      const now = "2026-08-10T01:00:00.000Z";
      const workflowRef = randomUUID();
      this.inquiryRef = randomUUID();
      this.workflow = {
        contract_version: "1.0.0",
        workspace_id: mutation.workspace_id,
        institution_ref: mutation.institution_ref,
        workflow_ref: workflowRef,
        workflow_run_ref: mutation.workflow_run_ref,
        workflow_type: "EnrollmentJourneyWorkflowV1",
        workflow_head: 1,
        lifecycle: "active",
        current_stage: "inquiry",
        waiting_state: "ready",
        pending_transition: "none",
        terminal_outcome: "none",
        completed_milestones: ["inquiry_started"],
        started_at: now,
        updated_at: now,
      };
      return {
        status: "committed",
        workflow: this.workflow,
        added_milestones: ["inquiry_started"],
      };
    }

    if (
      !this.workflow ||
      !this.inquiryRef ||
      this.workflow.workflow_ref !== mutation.workflow_ref ||
      this.workflow.workflow_head !== mutation.expected_workflow_head
    ) {
      return { status: "conflict", reason_code: "workflow_head_conflict" };
    }
    const before = this.workflow;
    const added = [] as Array<
      NurtureEnrollmentJourneyWorkflowSnapshotV1["completed_milestones"][number]
    >;
    let currentStage = before.current_stage;
    let lifecycle = before.lifecycle;
    let terminalOutcome = before.terminal_outcome;
    if (
      mutation.kind === "record_external_touchpoint" ||
      mutation.kind === "confirm_native_touchpoint_note"
    ) {
      this.confirmedTouchpoints += 1;
    } else if (mutation.kind === "confirm_intent") {
      currentStage = "intent_conversation";
      added.push("intent_confirmed");
    } else if (mutation.kind === "record_visit") {
      currentStage = "visit_or_consultation";
      added.push("visit_recorded");
    } else if (mutation.kind === "skip_visit") {
      currentStage = "visit_or_consultation";
    } else {
      currentStage = "closed";
      lifecycle = "closed_without_formalization";
      terminalOutcome = "inquiry_closed";
    }
    this.workflow = {
      ...before,
      workflow_head: before.workflow_head + 1,
      current_stage: currentStage,
      lifecycle,
      terminal_outcome: terminalOutcome,
      completed_milestones: [...before.completed_milestones, ...added],
      updated_at: `2026-08-10T01:00:0${before.workflow_head}.000Z`,
    };
    return {
      status: "committed",
      before,
      workflow: this.workflow,
      added_milestones: added,
    };
  }

  async appendTransition(input: {
    transition: NurtureEnrollmentJourneyTransitionDraftV1;
    command_execution_ref: string;
  }): Promise<void> {
    expect(input.command_execution_ref).toBeTruthy();
    this.transitions.push(input.transition);
  }
}

const run = <Payload>(input: {
  runner: NurtureCommandRunner;
  commandRequestId: string;
  payload: Payload;
  spec: NurtureCommandSpec<Payload>;
}) =>
  input.runner.execute({
    workspace_id: "workspace-01",
    invocation_request_id: `invocation:${input.commandRequestId}`,
    command_request_id: input.commandRequestId,
    business_actor_ref: "participant-admin-01",
    payload: input.payload,
    spec: input.spec,
  });

describe("G4-D increment 2 inquiry command contract", () => {
  it("rejects expanded inputs and mutually overlapping provisional age facts", () => {
    expect(validateStartEnrollmentInquiryPayload(null)).toBe(false);
    expect(validateExternalTouchpointPayload(null)).toBe(false);
    expect(validateNativeTouchpointPayload(null)).toBe(false);
    expect(
      validateStartEnrollmentInquiryPayload({
        ...startPayload(),
        protected_birth_year_month: envelope(),
      }),
    ).toBe(false);
    expect(
      validateStartEnrollmentInquiryPayload({
        ...startPayload(),
        legal_name: "Must not enter inquiry",
      } as NurtureStartEnrollmentInquiryPayload),
    ).toBe(false);
    expect(
      validateExternalTouchpointPayload({
        ...externalPayload("workflow-01", 1),
        attachment_ref: "forbidden",
      } as NurtureRecordExternalTouchpointPayload),
    ).toBe(false);
    expect(
      validateExternalTouchpointPayload({
        ...externalPayload("workflow-01", 1),
        responsible_role: "sales_agent",
      }),
    ).toBe(false);
    expect(
      validateNativeTouchpointPayload({
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        role_assignment_ref: "role-admin-01",
        workflow_ref: "workflow-01",
        expected_workflow_head: 1,
        source_channel: "native_thread",
        confirmed_need_keys: [],
        safety_label_keys: [],
        next_action_key: "confirm_intent",
        responsible_role: "institution_admin",
        due_at: "2026-08-11T01:00:00.000Z",
        next_touchpoint_at: "2026-08-11T01:00:00.000Z",
        source_owner_snapshot: {
          contract_version: "1.0.0",
          source_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "family_care_message",
            object_id: "message-future-01",
          },
          occurred_at: "2026-08-10T03:00:00.000Z",
          verified_at: "2026-08-10T02:00:00.000Z",
        },
      }),
    ).toBe(false);
  });

  it("confirms one exact native owner source and replays across owner refresh metadata", async () => {
    const owner = new InMemoryJourneyOwner();
    const runner = new NurtureCommandRunner(
      createInMemoryNurtureCommandRepository({ enrollmentJourney: owner }),
    );
    await run({
      runner,
      commandRequestId: "command:start-native",
      payload: startPayload({
        workflow_run_ref: {
          schema_version: 1,
          namespace: "my_chat",
          object_type: "workflow_run",
          object_id: "run-native",
        },
      }),
      spec: startEnrollmentInquirySpec,
    });
    const workflowRef = owner.workflow!.workflow_ref;
    const nativePayload: NurtureConfirmNativeTouchpointNotePayload = {
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      role_assignment_ref: "role-admin-01",
      workflow_ref: workflowRef,
      expected_workflow_head: 1,
      source_channel: "native_thread",
      confirmed_need_keys: ["weekday_care"],
      safety_label_keys: [],
      next_action_key: "confirm_intent",
      responsible_role: "institution_admin",
      due_at: "2026-08-11T01:00:00.000Z",
      next_touchpoint_at: "2026-08-11T01:00:00.000Z",
      source_owner_snapshot: {
        contract_version: "1.0.0",
        source_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "family_care_message",
          object_id: "message-native-01",
          version: 1,
        },
        occurred_at: "2026-08-10T02:00:00.000Z",
        verified_at: "2026-08-10T02:01:00.000Z",
      },
    };
    expect(
      await run({
        runner,
        commandRequestId: "command:native-01",
        payload: nativePayload,
        spec: confirmNativeTouchpointNoteSpec,
      }),
    ).toMatchObject({ status: "ok", disposition: "executed" });
    expect(
      await run({
        runner,
        commandRequestId: "command:native-01",
        payload: {
          ...nativePayload,
          source_owner_snapshot: {
            ...nativePayload.source_owner_snapshot,
            verified_at: "2026-08-10T03:00:00.000Z",
          },
        },
        spec: confirmNativeTouchpointNoteSpec,
      }),
    ).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(owner.transitions).toHaveLength(2);
  });

  it("commits inquiry, touchpoint, explicit stage actions and exact replay through one ledger", async () => {
    const owner = new InMemoryJourneyOwner();
    const runner = new NurtureCommandRunner(
      createInMemoryNurtureCommandRepository({ enrollmentJourney: owner }),
    );
    const started = await run({
      runner,
      commandRequestId: "command:start-01",
      payload: startPayload(),
      spec: startEnrollmentInquirySpec,
    });
    expect(started).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        workflow_head: 1,
        current_stage: "inquiry",
        added_milestones: ["inquiry_started"],
      },
    });
    if (started.status !== "ok") {
      throw new Error("enrollment start did not commit");
    }
    expect(started.output_refs.map((ref) => ref.object_type)).toEqual([
      "institution_workflow",
      "institution_workflow_transition",
    ]);
    expect(owner.transitions).toHaveLength(1);

    const replayed = await run({
      runner,
      commandRequestId: "command:start-01",
      payload: startPayload({
        contact_owner_snapshot: {
          ...startPayload().contact_owner_snapshot,
          safe_label: "Refreshed safe label",
          verified_at: "2026-08-10T02:00:00.000Z",
        },
      }),
      spec: startEnrollmentInquirySpec,
    });
    expect(replayed).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(owner.transitions).toHaveLength(1);

    const workflowRef = owner.workflow!.workflow_ref;
    const touchpoint = await run({
      runner,
      commandRequestId: "command:touchpoint-01",
      payload: externalPayload(workflowRef, 1),
      spec: recordExternalTouchpointSpec,
    });
    expect(touchpoint).toMatchObject({
      status: "ok",
      committed_result: { workflow_head: 2, current_stage: "inquiry" },
    });

    const intent = await run({
      runner,
      commandRequestId: "command:intent-01",
      payload: {
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        role_assignment_ref: "role-admin-01",
        workflow_ref: workflowRef,
        expected_workflow_head: 2,
      },
      spec: confirmIntentConversationSpec,
    });
    expect(intent).toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 3,
        current_stage: "intent_conversation",
        added_milestones: ["intent_confirmed"],
      },
    });

    const visit = await run({
      runner,
      commandRequestId: "command:visit-01",
      payload: {
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        role_assignment_ref: "role-admin-01",
        workflow_ref: workflowRef,
        expected_workflow_head: 3,
        disposition: "skipped" as const,
      },
      spec: recordOrSkipVisitSpec,
    });
    expect(visit).toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 4,
        current_stage: "visit_or_consultation",
        added_milestones: [],
      },
    });

    const closed = await run({
      runner,
      commandRequestId: "command:close-01",
      payload: {
        workspace_id: "workspace-01",
        institution_ref: "institution-01",
        role_assignment_ref: "role-admin-01",
        workflow_ref: workflowRef,
        expected_workflow_head: 4,
        close_reason_key: "family_declined",
      },
      spec: closeInquirySpec,
    });
    expect(closed).toMatchObject({
      status: "ok",
      committed_result: {
        workflow_head: 5,
        current_stage: "closed",
      },
    });
    expect(owner.transitions.map((row) => row.workflow_head_after)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("requires a confirmed touchpoint and rejects stale workflow heads", async () => {
    const owner = new InMemoryJourneyOwner();
    const runner = new NurtureCommandRunner(
      createInMemoryNurtureCommandRepository({ enrollmentJourney: owner }),
    );
    await run({
      runner,
      commandRequestId: "command:start-02",
      payload: startPayload({
        workflow_run_ref: {
          schema_version: 1,
          namespace: "my_chat",
          object_type: "workflow_run",
          object_id: "run-02",
        },
      }),
      spec: startEnrollmentInquirySpec,
    });
    const workflowRef = owner.workflow!.workflow_ref;
    expect(
      await run({
        runner,
        commandRequestId: "command:intent-02",
        payload: {
          workspace_id: "workspace-01",
          institution_ref: "institution-01",
          role_assignment_ref: "role-admin-01",
          workflow_ref: workflowRef,
          expected_workflow_head: 1,
        },
        spec: confirmIntentConversationSpec,
      }),
    ).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "confirmed_touchpoint_required",
    });
    expect(
      await run({
        runner,
        commandRequestId: "command:touchpoint-stale",
        payload: externalPayload(workflowRef, 9),
        spec: recordExternalTouchpointSpec,
      }),
    ).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "workflow_head_conflict",
    });

    owner.workflow = {
      ...owner.workflow!,
      workspace_id: "workspace-drifted",
    };
    expect(
      await run({
        runner,
        commandRequestId: "command:touchpoint-scope-drift",
        payload: externalPayload(workflowRef, 1),
        spec: recordExternalTouchpointSpec,
      }),
    ).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });

    const racingOwner = new InMemoryJourneyOwner();
    racingOwner.forcedConflict = "workflow_run_already_bound";
    const racingRunner = new NurtureCommandRunner(
      createInMemoryNurtureCommandRepository({
        enrollmentJourney: racingOwner,
      }),
    );
    expect(
      await run({
        runner: racingRunner,
        commandRequestId: "command:start-race",
        payload: startPayload(),
        spec: startEnrollmentInquirySpec,
      }),
    ).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "workflow_run_already_bound",
    });
  });

  it("keeps the query consumer on the body-free projection", async () => {
    const owner = new InMemoryJourneyOwner();
    await owner.commitMutation({
      kind: "start_inquiry",
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      participant_ref: "participant-admin-01",
      role_assignment_ref: "role-admin-01",
      expected_workflow_head: 0,
      workflow_run_ref: startPayload().workflow_run_ref,
      inquiry: {
        preferred_label: "Momo",
        age_band_key: "toddler",
        expected_entry_start_date: "2026-09-01",
        expected_entry_end_date: "2026-09-30",
        target_class_type_key: "full_day",
        target_age_band_key: "toddler",
        care_schedule_need_keys: ["weekdays"],
        source_channel: "referral",
        host_contact_ref: startPayload().contact_owner_snapshot.contact_ref,
        contact_safe_label: "Guardian contact",
        safety_label_keys: [],
        last_touchpoint_at: "2026-08-10T01:00:00.000Z",
        next_touchpoint_at: "2026-08-11T01:00:00.000Z",
        visit_disposition: "not_decided",
      },
    });
    const service = new NurtureEnrollmentJourneyQueryService({
      readWorkflow: async () => ({
        status: "resolved" as const,
        workflow: owner.workflow!,
        projection_context: {
          workspace_id: "workspace-01",
          institution_scope: {
            contract_version: "1.0.0" as const,
            institution_ref: "institution-01",
            institution_state: "active" as const,
            active_role: {
              contract_version: "1.0.0" as const,
              participant_ref: "participant-admin-01",
              role_assignment_ref: "role-admin-01",
              role_kind: "institution_admin" as const,
              scope_type: "institution" as const,
              scope_ref: "institution-01",
              selection_mode: "explicit" as const,
            },
          },
        },
      }),
    });
    const result = await service.read({
      workspace_id: "workspace-01",
      institution_ref: "institution-01",
      participant_ref: "participant-admin-01",
      role_assignment_ref: "role-admin-01",
      workflow_ref: owner.workflow!.workflow_ref,
      surface: "institution_admin_web",
    });
    expect(result).toMatchObject({
      status: "resolved",
      projection: { capabilityRefs: [], workflowHead: 1 },
    });
    expect(JSON.stringify(result)).not.toContain(owner.workflow!.workflow_ref);
    expect(JSON.stringify(result)).not.toContain("Guardian contact");
  });
});
