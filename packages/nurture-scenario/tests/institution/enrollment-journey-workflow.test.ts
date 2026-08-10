import { describe, expect, it } from "vitest";
import {
  NURTURE_ENROLLMENT_JOURNEY_STAGES,
  NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES,
  NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1,
  findNurtureInstitutionWorkflowDefinitionV1,
  nurtureScenarioManifest,
  projectNurtureEnrollmentJourneyWorkflowV1 as projectWorkflow,
  type NurtureEnrollmentJourneyMilestone,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "../../src/index.js";

const snapshot = (
  overrides: Partial<NurtureEnrollmentJourneyWorkflowSnapshotV1> = {},
): NurtureEnrollmentJourneyWorkflowSnapshotV1 => ({
  contract_version: "1.0.0",
  workspace_id: "workspace-01",
  institution_ref: "institution-01",
  workflow_ref: "workflow:enrollment-journey:01",
  workflow_run_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_run",
    object_id: "run-01",
    version: 1,
  },
  workflow_type: "EnrollmentJourneyWorkflowV1",
  workflow_head: 1,
  lifecycle: "active",
  current_stage: "inquiry",
  waiting_state: "ready",
  pending_transition: "none",
  terminal_outcome: "none",
  completed_milestones: ["inquiry_started"],
  started_at: "2026-08-09T11:00:00.000Z",
  updated_at: "2026-08-09T12:00:00.000Z",
  ...overrides,
});

type ProjectionInput = Parameters<typeof projectWorkflow>[0];

const projectionContext = (): ProjectionInput["context"] => ({
  workspace_id: "workspace-01",
  institution_scope: {
    contract_version: "1.0.0",
    active_role: {
      contract_version: "1.0.0",
      participant_ref: "participant-admin-01",
      role_assignment_ref: "role-admin-01",
      role_kind: "institution_admin",
      scope_type: "institution",
      scope_ref: "institution-01",
      selection_mode: "unique",
    },
    institution_ref: "institution-01",
    institution_state: "active",
  },
});

const projectNurtureEnrollmentJourneyWorkflowV1 = (
  input: Omit<ProjectionInput, "context"> & {
    context?: ProjectionInput["context"];
  },
) =>
  projectWorkflow({
    ...input,
    context: input.context ?? projectionContext(),
  });

describe("EnrollmentJourneyWorkflowV1 registry", () => {
  it("contains exactly one product Workflow and rejects ordinary work types", () => {
    expect(NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1).toHaveLength(1);
    expect(NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1[0]?.workflow_type).toBe(
      "EnrollmentJourneyWorkflowV1",
    );
    for (const ordinaryType of [
      "GrantChangeWorkflowV1",
      "AttendanceCloseoutWorkflowV1",
      "CareInteractionWorkflowV1",
      "PublishProcessWorkflowV1",
      "InstitutionSupportSignalWorkflowV1",
    ]) {
      expect(findNurtureInstitutionWorkflowDefinitionV1(ordinaryType)).toBeNull();
    }
  });

  it("keeps capacity waitlist a stage and never a waiting state", () => {
    expect(NURTURE_ENROLLMENT_JOURNEY_STAGES).toContain("capacity_waitlist");
    expect(NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES).not.toContain(
      "capacity_waitlist" as never,
    );
  });

  it("is composed only as a disabled surface adapter, not a second legacy Workflow capability", () => {
    expect(
      nurtureScenarioManifest.capabilities.some((capability) =>
        JSON.stringify(capability).includes("EnrollmentJourneyWorkflowV1"),
      ),
    ).toBe(false);
    expect(
      nurtureScenarioManifest.surface_mapping.web_run_workbench?.enrollment_journey,
    ).toMatchObject({
      workflow_type: "EnrollmentJourneyWorkflowV1",
      contract_version: "1.0.0",
      enablement_policy: "disabled",
    });
  });
});

describe("EnrollmentJourneyWorkflowV1 projection", () => {
  it("builds a body-free Admin mobile projection with no command refs", () => {
    const decision = projectNurtureEnrollmentJourneyWorkflowV1({
      snapshot: snapshot({
        current_stage: "capacity_waitlist",
        waiting_state: "waiting_on_guardian",
        workflow_head: 4,
        completed_milestones: [
          "inquiry_started",
          "intent_confirmed",
          "waitlist_qualified",
        ],
        due_at: "2026-08-12T12:00:00.000Z",
      }),
      surface: "institution_admin_mobile",
    });

    expect(decision.status).toBe("ok");
    if (decision.status !== "ok") return;
    expect(decision.output).toMatchObject({
      workflowType: "EnrollmentJourneyWorkflowV1",
      workflowRunRef: {
        schema_version: 1,
        namespace: "my_chat",
        object_type: "workflow_run",
        object_id: "run-01",
        version: 1,
      },
      state: "waiting",
      currentStage: "capacity_waitlist",
      waitingState: "waiting_on_guardian",
      responsibleRole: "guardian",
      workflowHead: 4,
      projectionVersion: 1,
      capabilityRefs: [],
    });
    expect(JSON.stringify(decision.output)).not.toMatch(
      /phone|wechat|email|contact|child_id|family_id|claim|lease|step_id|body/i,
    );
  });

  it("rejects a pending transition attached to the wrong business stage", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({ pending_transition: "formalization_pending" }),
        surface: "institution_admin_web",
      }),
    ).toEqual({
      status: "unavailable",
      reason_code: "invalid_pending_transition",
    });
  });

  it("rejects an unknown runtime surface", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot(),
        surface: "guardian_mobile" as ProjectionInput["surface"],
      }),
    ).toEqual({
      status: "unavailable",
      reason_code: "unsupported_surface",
    });
  });

  it("binds the projection to the exact resolved Workspace and Institution Admin scope", () => {
    const wrongInstitution = projectionContext();
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot(),
        surface: "institution_admin_web",
        context: {
          ...wrongInstitution,
          institution_scope: {
            ...wrongInstitution.institution_scope,
            institution_ref: "institution-02",
          },
        },
      }),
    ).toEqual({ status: "unavailable", reason_code: "scope_mismatch" });

    const wrongRole = projectionContext();
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot(),
        surface: "institution_admin_web",
        context: {
          ...wrongRole,
          institution_scope: {
            ...wrongRole.institution_scope,
            active_role: {
              ...wrongRole.institution_scope.active_role,
              role_kind: "caregiver",
            },
          },
        },
      }),
    ).toEqual({ status: "unavailable", reason_code: "scope_mismatch" });
  });

  it("rejects an expanded or body-bearing private snapshot", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: {
          ...snapshot(),
          raw_contact: "must-not-enter-the-projection-boundary",
        } as NurtureEnrollmentJourneyWorkflowSnapshotV1,
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
  });

  it("requires formalization and completion milestones to commit together", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          lifecycle: "completed",
          current_stage: "completed",
          terminal_outcome: "formalized",
          completed_milestones: [
            "inquiry_started",
            "intent_confirmed",
            "trial_offer_accepted",
            "trial_started",
            "formal_enrollment_committed",
          ],
        }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });

    const committed = projectNurtureEnrollmentJourneyWorkflowV1({
      snapshot: snapshot({
        lifecycle: "completed",
        current_stage: "completed",
        terminal_outcome: "formalized",
        waiting_state: "waiting_on_system",
        completed_milestones: [
          "inquiry_started",
          "intent_confirmed",
          "trial_offer_accepted",
          "trial_started",
          "trial_review_reached",
          "formal_proposed",
          "guardian_formal_acceptance_recorded",
          "formal_enrollment_committed",
          "journey_completed",
        ],
      }),
      surface: "institution_admin_mobile",
    });
    expect(committed.status).toBe("ok");
    if (committed.status !== "ok") return;
    expect(committed.output.currentStage).toBe("completed");
    expect(committed.output.state).toBe("waiting");
    expect(committed.output.waitingState).toBe("waiting_on_system");
    expect(committed.output.responsibleRole).toBe("system_owner");

    for (const contradictoryMilestone of [
      "preparation_cancelled",
      "trial_ended",
    ] as const) {
      const completedMilestones: NurtureEnrollmentJourneyMilestone[] = [
        "inquiry_started",
        "intent_confirmed",
        "trial_offer_accepted",
        "trial_started",
        "trial_review_reached",
        "formal_proposed",
        "guardian_formal_acceptance_recorded",
        contradictoryMilestone,
        "formal_enrollment_committed",
        "journey_completed",
      ];
      completedMilestones.sort(
        (left, right) =>
          NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1[0].milestones.indexOf(left) -
          NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1[0].milestones.indexOf(right),
      );
      expect(
        projectNurtureEnrollmentJourneyWorkflowV1({
          snapshot: snapshot({
            lifecycle: "completed",
            current_stage: "completed",
            terminal_outcome: "formalized",
            completed_milestones: completedMilestones,
          }),
          surface: "institution_admin_mobile",
        }),
      ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
    }
  });

  it("rejects duplicate or out-of-order milestone histories", () => {
    for (const completed_milestones of [
      ["inquiry_started", "inquiry_started"],
      ["trial_started", "intent_confirmed"],
    ] as const) {
      expect(
        projectNurtureEnrollmentJourneyWorkflowV1({
          snapshot: snapshot({ completed_milestones }),
          surface: "institution_admin_web",
        }),
      ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
    }
  });

  it("requires the matching terminal milestone for cancelled preparation and trial end", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          lifecycle: "closed_without_formalization",
          current_stage: "closed",
          terminal_outcome: "preparation_cancelled",
        }),
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });

    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          lifecycle: "closed_without_formalization",
          current_stage: "closed",
          terminal_outcome: "trial_ended",
          completed_milestones: [
            "inquiry_started",
            "intent_confirmed",
            "trial_offer_accepted",
            "trial_started",
            "trial_ended",
          ],
        }),
        surface: "institution_admin_web",
      }).status,
    ).toBe("ok");
  });

  it("requires the canonical milestone for each durable business stage", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          current_stage: "capacity_waitlist",
          completed_milestones: ["inquiry_started", "intent_confirmed"],
        }),
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          current_stage: "trial_review",
          completed_milestones: [
            "inquiry_started",
            "intent_confirmed",
            "trial_offer_accepted",
            "trial_started",
          ],
        }),
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
  });

  it("allows an explicitly skipped optional visit without inventing a visit milestone", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          current_stage: "visit_or_consultation",
          completed_milestones: ["inquiry_started", "intent_confirmed"],
        }),
        surface: "institution_admin_web",
      }).status,
    ).toBe("ok");
  });

  it("rejects missing milestone prerequisites and stage regression", () => {
    for (const candidate of [
      snapshot({
        current_stage: "trial_review",
        completed_milestones: [
          "inquiry_started",
          "intent_confirmed",
          "trial_started",
          "trial_review_reached",
        ],
      }),
      snapshot({
        current_stage: "inquiry",
        completed_milestones: [
          "inquiry_started",
          "intent_confirmed",
          "trial_offer_accepted",
          "trial_started",
        ],
      }),
    ]) {
      expect(
        projectNurtureEnrollmentJourneyWorkflowV1({
          snapshot: candidate,
          surface: "institution_admin_web",
        }),
      ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
    }
  });

  it("rejects a terminal outcome that mislabels a later journey", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          lifecycle: "closed_without_formalization",
          current_stage: "closed",
          terminal_outcome: "inquiry_closed",
          completed_milestones: [
            "inquiry_started",
            "intent_confirmed",
            "trial_offer_accepted",
            "trial_started",
          ],
        }),
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
  });

  it("keeps a pending local transition on the system-waiting axis", () => {
    const pendingFormalization = snapshot({
      current_stage: "formal_enrollment_confirmation",
      pending_transition: "formalization_pending",
      completed_milestones: [
        "inquiry_started",
        "intent_confirmed",
        "trial_offer_accepted",
        "trial_started",
        "trial_review_reached",
        "formal_proposed",
        "guardian_formal_acceptance_recorded",
      ],
    });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: {
          ...pendingFormalization,
          waiting_state: "waiting_on_guardian",
        },
        surface: "institution_admin_web",
      }),
    ).toEqual({
      status: "unavailable",
      reason_code: "invalid_pending_transition",
    });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: {
          ...pendingFormalization,
          waiting_state: "waiting_on_system",
        },
        surface: "institution_admin_web",
      }).status,
    ).toBe("ok");
  });

  it("fails closed for contract and workflow type drift", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({ contract_version: "2.0.0" }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({ status: "unavailable", reason_code: "contract_mismatch" });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({ workflow_type: "AnotherWorkflowV1" }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({
      status: "unavailable",
      reason_code: "unsupported_workflow_type",
    });
  });

  it("rejects a Nurture-private ref masquerading as the Host workflow Run ref", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          workflow_run_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "institution_workflow",
            object_id: "private-workflow-01",
          },
        }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
  });

  it("rejects non-canonical or body-bearing Host refs instead of copying extra fields", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          workflow_run_ref: {
            schema_version: 1,
            namespace: "my_chat",
            object_type: "workflow_run",
            object_id: "run-01",
            raw_contact: "must-not-cross",
          } as NurtureEnrollmentJourneyWorkflowSnapshotV1["workflow_run_ref"],
        }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
  });

  it("fails closed when a persisted vocabulary value drifts", () => {
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: snapshot({
          waiting_state: "capacity_waitlist" as NurtureEnrollmentJourneyWorkflowSnapshotV1["waiting_state"],
        }),
        surface: "institution_admin_mobile",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
  });

  it("requires canonical ISO instants and an opaque bounded workflow ref", () => {
    for (const candidate of [
      snapshot({ started_at: "2026-08-09" }),
      snapshot({ workflow_ref: "  workflow-01" }),
    ]) {
      expect(
        projectNurtureEnrollmentJourneyWorkflowV1({
          snapshot: candidate,
          surface: "institution_admin_mobile",
        }),
      ).toEqual({ status: "unavailable", reason_code: "invalid_snapshot" });
    }
  });

  it("allows only ready or technical system waiting on terminal workflows", () => {
    const terminal = snapshot({
      lifecycle: "closed_without_formalization",
      current_stage: "closed",
      terminal_outcome: "trial_ended",
      completed_milestones: [
        "inquiry_started",
        "intent_confirmed",
        "trial_offer_accepted",
        "trial_started",
        "trial_ended",
      ],
    });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: { ...terminal, waiting_state: "waiting_on_guardian" },
        surface: "institution_admin_web",
      }),
    ).toEqual({ status: "unavailable", reason_code: "invalid_lifecycle" });
    expect(
      projectNurtureEnrollmentJourneyWorkflowV1({
        snapshot: { ...terminal, waiting_state: "waiting_on_system" },
        surface: "institution_admin_web",
      }).status,
    ).toBe("ok");
  });
});
