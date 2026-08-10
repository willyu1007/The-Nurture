// Generated from scenario.manifest.yaml. Do not edit.
import type { ScenarioManifestV2 } from "@my-chat/workflow-contracts";

export const nurtureScenarioManifest: ScenarioManifestV2 = {
  "manifest_version": 2,
  "scenario_key": "nurture",
  "scenario_record": {
    "display_name": "The Nurture",
    "required_status": "draft",
    "owner_team": "the-nurture",
    "policy_version": 1
  },
  "owner": "the-nurture",
  "contract": {
    "base_contract_version": "1.0.0",
    "host_sdk_version": "1.0.0",
    "host_abi_range": "^1.0.0",
    "source_hash": "d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383"
  },
  "step_type_registry": [
    {
      "step_type": "nurture.context_binding",
      "runtime_kind": "scenario_action",
      "owner": "scenario"
    },
    {
      "step_type": "nurture.domain_action",
      "runtime_kind": "scenario_action",
      "owner": "scenario"
    },
    {
      "step_type": "nurture.safety_gate",
      "runtime_kind": "scenario_action",
      "owner": "scenario",
      "policy_flags": [
        "policy_gate"
      ]
    },
    {
      "step_type": "nurture.approval",
      "runtime_kind": "human_gate",
      "owner": "scenario",
      "policy_flags": [
        "policy_gate"
      ]
    },
    {
      "step_type": "nurture.artifact_write",
      "runtime_kind": "artifact_write",
      "owner": "scenario"
    },
    {
      "step_type": "nurture.handoff",
      "runtime_kind": "event_emit",
      "owner": "scenario"
    }
  ],
  "owner_integration": {
    "command_contract": "scenario-command-envelope-v1",
    "event_contract": "scenario-event-envelope-v1",
    "receipt_contract": "scenario-command-receipt-v1",
    "status_lookup_required": true,
    "auth_mode": "service_authenticated"
  },
  "launch_phase": "dev",
  "allowed_user_classes": [
    "teacher",
    "admin"
  ],
  "capabilities": [
    {
      "capability_key": "pregnancy_stage_management",
      "label": "Pregnancy stage management",
      "description": "Support expectant mothers with stage-aware preparation, evidence capture, and non-medical safety prompts.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "create_pregnancy_stage_plan",
          "label": "Create pregnancy stage plan",
          "workflow_version": 1,
          "workflow_version_id": "nurture-pregnancy-stage-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.context_binding",
            "nurture.domain_action",
            "nurture.safety_gate",
            "nurture.artifact_write"
          ],
          "steps": [
            {
              "step_key": "collect_context",
              "step_type": "nurture.context_binding",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.collect_context",
              "retry_policy": "none"
            },
            {
              "step_key": "evaluate_pregnancy_stage",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 20,
              "handler_key": "nurture.evaluate_pregnancy_stage",
              "retry_policy": "bounded_exponential",
              "timeout_ms": 30000
            },
            {
              "step_key": "apply_medical_safety_gate",
              "step_type": "nurture.safety_gate",
              "runtime_kind": "scenario_action",
              "policy_flags": [
                "policy_gate"
              ],
              "order": 30,
              "handler_key": "nurture.apply_medical_safety_gate",
              "retry_policy": "none"
            },
            {
              "step_key": "write_artifact",
              "step_type": "nurture.artifact_write",
              "runtime_kind": "artifact_write",
              "order": 40,
              "handler_key": "nurture.write_artifact",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "family_strategy",
      "label": "Family strategy and long-term goals",
      "description": "Convert parenting values, child development constraints, and family resources into a reviewable strategy workflow.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "calibrate_family_strategy",
          "label": "Calibrate family strategy",
          "workflow_version": 1,
          "workflow_version_id": "nurture-family-strategy-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.context_binding",
            "nurture.domain_action",
            "nurture.approval",
            "nurture.artifact_write"
          ],
          "steps": [
            {
              "step_key": "collect_context",
              "step_type": "nurture.context_binding",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.collect_context",
              "retry_policy": "none"
            },
            {
              "step_key": "calibrate_family_strategy",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 20,
              "handler_key": "nurture.calibrate_family_strategy",
              "retry_policy": "bounded_exponential"
            },
            {
              "step_key": "request_approval",
              "step_type": "nurture.approval",
              "runtime_kind": "human_gate",
              "policy_flags": [
                "policy_gate"
              ],
              "order": 30,
              "handler_key": "nurture.request_approval",
              "retry_policy": "none"
            },
            {
              "step_key": "write_artifact",
              "step_type": "nurture.artifact_write",
              "runtime_kind": "artifact_write",
              "order": 40,
              "handler_key": "nurture.write_artifact",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "care_plan",
      "label": "Short-term care plan",
      "description": "Build week-level or month-level care plans connected to child, parent, family, and health-state context refs.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "generate_short_term_plan",
          "label": "Generate short-term care plan",
          "workflow_version": 1,
          "workflow_version_id": "nurture-care-plan-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.context_binding",
            "nurture.domain_action",
            "nurture.safety_gate",
            "nurture.artifact_write"
          ],
          "steps": [
            {
              "step_key": "collect_context",
              "step_type": "nurture.context_binding",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.collect_context",
              "retry_policy": "none"
            },
            {
              "step_key": "generate_care_plan",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 20,
              "handler_key": "nurture.generate_care_plan",
              "retry_policy": "bounded_exponential"
            },
            {
              "step_key": "apply_medical_safety_gate",
              "step_type": "nurture.safety_gate",
              "runtime_kind": "scenario_action",
              "policy_flags": [
                "policy_gate"
              ],
              "order": 30,
              "handler_key": "nurture.apply_medical_safety_gate",
              "retry_policy": "none"
            },
            {
              "step_key": "write_artifact",
              "step_type": "nurture.artifact_write",
              "runtime_kind": "artifact_write",
              "order": 40,
              "handler_key": "nurture.write_artifact",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "activity_comparison",
      "label": "Activity comparison and modeling",
      "description": "Compare parenting, education, growth, and family activities against goals, constraints, cost, burden, and evidence.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "compare_activity_options",
          "label": "Compare activity options",
          "workflow_version": 1,
          "workflow_version_id": "nurture-activity-comparison-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.context_binding",
            "nurture.domain_action",
            "nurture.approval",
            "nurture.artifact_write"
          ],
          "steps": [
            {
              "step_key": "collect_context",
              "step_type": "nurture.context_binding",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.collect_context",
              "retry_policy": "none"
            },
            {
              "step_key": "compare_activities",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 20,
              "handler_key": "nurture.compare_activities",
              "retry_policy": "bounded_exponential"
            },
            {
              "step_key": "request_approval",
              "step_type": "nurture.approval",
              "runtime_kind": "human_gate",
              "policy_flags": [
                "policy_gate"
              ],
              "order": 30,
              "handler_key": "nurture.request_approval",
              "retry_policy": "none"
            },
            {
              "step_key": "write_artifact",
              "step_type": "nurture.artifact_write",
              "runtime_kind": "artifact_write",
              "order": 40,
              "handler_key": "nurture.write_artifact",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "execution_review",
      "label": "Execution review and learning",
      "description": "Capture evidence, review outcomes, update scenario-local profile projections, and request handoffs when outputs are publishable.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "record_execution_review",
          "label": "Record execution review",
          "workflow_version": 1,
          "workflow_version_id": "nurture-execution-review-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.context_binding",
            "nurture.domain_action",
            "nurture.artifact_write",
            "nurture.handoff"
          ],
          "steps": [
            {
              "step_key": "collect_context",
              "step_type": "nurture.context_binding",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.collect_context",
              "retry_policy": "none"
            },
            {
              "step_key": "record_review",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 20,
              "handler_key": "nurture.record_review",
              "retry_policy": "bounded_exponential"
            },
            {
              "step_key": "write_artifact",
              "step_type": "nurture.artifact_write",
              "runtime_kind": "artifact_write",
              "order": 30,
              "handler_key": "nurture.write_artifact",
              "retry_policy": "bounded_exponential"
            },
            {
              "step_key": "request_handoff",
              "step_type": "nurture.handoff",
              "runtime_kind": "event_emit",
              "order": 40,
              "handler_key": "nurture.request_handoff",
              "retry_policy": "none"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "class_family_inbox",
      "label": "Class family inbox",
      "description": "Resolve the current caregiver scope and open the current class-level family-care work collection.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "open_class_family_inbox",
          "label": "Open class family inbox",
          "workflow_version": 1,
          "workflow_version_id": "nurture-class-family-inbox-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.domain_action"
          ],
          "steps": [
            {
              "step_key": "open_class_family_inbox",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.open_class_family_inbox",
              "retry_policy": "bounded_exponential"
            }
          ]
        },
        {
          "entrypoint_key": "capture_family_input",
          "label": "Capture family input",
          "workflow_version": 1,
          "workflow_version_id": "nurture-capture-family-input-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.domain_action"
          ],
          "steps": [
            {
              "step_key": "capture_family_input",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.capture_family_input",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    },
    {
      "capability_key": "teacher_attention_board",
      "label": "Teacher attention board",
      "description": "Resolve the current caregiver scope and open the current teacher attention collection.",
      "enablement_policy": "disabled",
      "entrypoints": [
        {
          "entrypoint_key": "open_today_attention_board",
          "label": "Open today's attention board",
          "workflow_version": 1,
          "workflow_version_id": "nurture-teacher-attention-board-v1",
          "input_schema_version": 1,
          "output_schema_version": 1,
          "allowed_step_types": [
            "nurture.domain_action"
          ],
          "steps": [
            {
              "step_key": "open_today_attention_board",
              "step_type": "nurture.domain_action",
              "runtime_kind": "scenario_action",
              "order": 10,
              "handler_key": "nurture.open_today_attention_board",
              "retry_policy": "bounded_exponential"
            }
          ]
        }
      ]
    }
  ],
  "scenario_data": {
    "context_ref_types": [
      {
        "namespace": "my_chat",
        "object_type": "child",
        "resolver_key": "my_chat.object.child",
        "owner_scope": "workspace",
        "canonical_required": true,
        "scenario_local_allowed": false,
        "snapshot_required": true
      },
      {
        "namespace": "my_chat",
        "object_type": "expectant_mother",
        "resolver_key": "my_chat.object.expectant_mother",
        "owner_scope": "workspace",
        "canonical_required": true,
        "scenario_local_allowed": false,
        "snapshot_required": true
      },
      {
        "namespace": "my_chat",
        "object_type": "parent",
        "resolver_key": "my_chat.object.parent",
        "owner_scope": "workspace",
        "canonical_required": true,
        "scenario_local_allowed": false,
        "snapshot_required": true
      },
      {
        "namespace": "my_chat",
        "object_type": "family",
        "resolver_key": "my_chat.object.family",
        "owner_scope": "workspace",
        "canonical_required": true,
        "scenario_local_allowed": false,
        "snapshot_required": true
      },
      {
        "namespace": "nurture",
        "object_type": "nurture_profile",
        "resolver_key": "nurture.profile",
        "owner_scope": "workspace",
        "canonical_required": false,
        "scenario_local_allowed": true,
        "snapshot_required": true
      },
      {
        "namespace": "nurture",
        "object_type": "activity_option",
        "resolver_key": "nurture.activity_option",
        "owner_scope": "workspace",
        "canonical_required": false,
        "scenario_local_allowed": true,
        "snapshot_required": true
      },
      {
        "namespace": "nurture",
        "object_type": "health_state_summary",
        "resolver_key": "nurture.health_state_summary",
        "owner_scope": "workspace",
        "canonical_required": false,
        "scenario_local_allowed": true,
        "snapshot_required": true
      }
    ],
    "run_start_requirements": [
      {
        "requirement_key": "target_family_context",
        "schema_version": 1,
        "entrypoints": [
          "create_pregnancy_stage_plan",
          "calibrate_family_strategy",
          "generate_short_term_plan",
          "compare_activity_options",
          "record_execution_review"
        ],
        "surfaces": [
          "chat_workflow_control",
          "web_run_workbench",
          "mobile_dashboard"
        ],
        "required": true
      },
      {
        "requirement_key": "safety_boundary_acknowledgement",
        "schema_version": 1,
        "entrypoints": [
          "create_pregnancy_stage_plan",
          "generate_short_term_plan"
        ],
        "surfaces": [
          "chat_workflow_control",
          "web_run_workbench"
        ],
        "required": true
      },
      {
        "requirement_key": "nurture_family_input_command_v1",
        "schema_version": 1,
        "entrypoints": [
          "capture_family_input"
        ],
        "surfaces": [
          "chat_workflow_control",
          "mobile_dashboard"
        ],
        "required": true
      }
    ],
    "step_interventions": [
      {
        "intervention_type": "adjust_activity_weights",
        "schema_version": 1,
        "step_keys": [
          "compare_activities"
        ],
        "surface": "web_run_workbench",
        "handler_key": "nurture.intervention.adjust_activity_weights"
      },
      {
        "intervention_type": "update_care_constraints",
        "schema_version": 1,
        "step_keys": [
          "generate_care_plan",
          "evaluate_pregnancy_stage"
        ],
        "surface": "web_run_workbench",
        "handler_key": "nurture.intervention.update_care_constraints"
      }
    ]
  },
  "artifact_policy": {
    "artifact_types": [
      "pregnancy_stage_summary",
      "family_strategy_summary",
      "care_plan_summary",
      "activity_comparison_summary",
      "execution_review_summary",
      "health_state_summary",
      "family_care_inbox_summary",
      "teacher_attention_board_summary"
    ],
    "exposure_levels": {
      "L0": [],
      "L1": [
        "pregnancy_stage_summary",
        "family_strategy_summary",
        "care_plan_summary",
        "activity_comparison_summary",
        "execution_review_summary",
        "health_state_summary",
        "family_care_inbox_summary",
        "teacher_attention_board_summary"
      ],
      "L2": [
        "family_strategy_summary",
        "activity_comparison_summary",
        "execution_review_summary"
      ],
      "L3": [
        "pregnancy_stage_summary",
        "care_plan_summary",
        "health_state_summary"
      ],
      "L4": []
    },
    "handoff_eligible": {
      "public_draft": [
        "family_strategy_summary",
        "activity_comparison_summary",
        "execution_review_summary"
      ],
      "indexing": [
        "family_strategy_summary",
        "activity_comparison_summary",
        "execution_review_summary"
      ],
      "notification": [
        "pregnancy_stage_summary",
        "care_plan_summary",
        "execution_review_summary"
      ]
    }
  },
  "action_availability": {
    "shared_actions": [
      "start_run",
      "submit_start_requirements",
      "approve",
      "reject",
      "confirm",
      "retry",
      "cancel",
      "request_manual_review",
      "step_intervention",
      "create_handoff"
    ],
    "scenario_actions": [
      "adjust_activity_weights",
      "update_care_constraints",
      "mark_health_safety_escalated",
      "attach_nurture_profile_snapshot"
    ],
    "expected_version_required": true
  },
  "handoffs": [
    {
      "handoff_type": "public_draft",
      "source_artifact_types": [
        "family_strategy_summary",
        "activity_comparison_summary",
        "execution_review_summary"
      ],
      "requested_purposes": [
        "forum_publication"
      ],
      "downstream_owner": "my_chat.forum",
      "policy_key": "nurture.can_create_public_draft_handoff",
      "receipt_required": true
    },
    {
      "handoff_type": "indexing",
      "source_artifact_types": [
        "family_strategy_summary",
        "activity_comparison_summary",
        "execution_review_summary"
      ],
      "requested_purposes": [
        "rag_knowledge"
      ],
      "downstream_owner": "my_chat.knowledge_base",
      "policy_key": "nurture.can_create_knowledge_candidate_handoff",
      "receipt_required": true
    },
    {
      "handoff_type": "notification",
      "source_artifact_types": [
        "pregnancy_stage_summary",
        "care_plan_summary",
        "execution_review_summary"
      ],
      "requested_purposes": [
        "notification_push"
      ],
      "downstream_owner": "my_chat.notification",
      "policy_key": "nurture.can_create_notification_handoff",
      "receipt_required": true
    },
    {
      "handoff_key": "user_attention",
      "handoff_type": "notification",
      "source_artifact_types": [],
      "source_context_ref_types": [
        {
          "namespace": "nurture",
          "object_type": "family_care_message"
        },
        {
          "namespace": "nurture",
          "object_type": "child_link_receipt"
        },
        {
          "namespace": "nurture",
          "object_type": "family_care_item"
        }
      ],
      "requested_purposes": [
        "user_attention"
      ],
      "downstream_owner": "user_attention",
      "policy_key": "nurture.can_request_user_attention",
      "receipt_required": true,
      "materialization_mode": "workflow_step_complete_v1"
    }
  ],
  "surface_mapping": {
    "chat_workflow_control": {
      "adapter_key": "nurture.chat_workflow",
      "recommendation_policy": "user_message_intent_and_context_refs",
      "enrollment_journey": {
        "workflow_type": "EnrollmentJourneyWorkflowV1",
        "contract_version": "1.0.0",
        "query_handler_key": "nurture.internal.query_enrollment_journey",
        "command_handler_key": "nurture.internal.execute_enrollment_journey",
        "enablement_policy": "disabled"
      }
    },
    "chat_dashboard_summary": {
      "presenter_key": "nurture.chat_dashboard_summary"
    },
    "chat_citation": {
      "artifact_policy": "refs_only_safe_summary"
    },
    "web_domain_workbench": {
      "route_namespace": "/nurture",
      "owner": "the-nurture"
    },
    "web_run_workbench": {
      "adapter_key": "nurture.web_run_workbench",
      "supports_step_interventions": true,
      "enrollment_journey": {
        "workflow_type": "EnrollmentJourneyWorkflowV1",
        "contract_version": "1.0.0",
        "query_handler_key": "nurture.internal.query_enrollment_journey",
        "command_handler_key": "nurture.internal.execute_enrollment_journey",
        "enablement_policy": "disabled"
      }
    },
    "mobile_dashboard": {
      "adapter_key": "nurture.mobile_dashboard",
      "enrollment_journey": {
        "workflow_type": "EnrollmentJourneyWorkflowV1",
        "contract_version": "1.0.0",
        "query_handler_key": "nurture.internal.query_enrollment_journey",
        "command_handler_key": "nurture.internal.execute_enrollment_journey",
        "enablement_policy": "disabled"
      }
    },
    "forum_publication": {
      "handoff_type": "public_draft",
      "downstream_owner": "my_chat.forum"
    },
    "rag_knowledge": {
      "handoff_type": "indexing",
      "downstream_owner": "my_chat.knowledge_base"
    },
    "notification_push": {
      "handoff_type": "notification",
      "downstream_owner": "my_chat.notification"
    },
    "admin_operator": {
      "adapter_key": "nurture.admin_operator"
    },
    "worker_runtime": {
      "adapter_key": "nurture.worker_runtime"
    }
  },
  "internal_api": {
    "routes": [
      {
        "method": "GET",
        "path": "/internal/nurture/profiles/:canonicalObjectId",
        "owner_surface": "web_domain_workbench",
        "command_class": "scenario_internal",
        "writes_workflow_facts": false,
        "handler_key": "nurture.internal.get_profile"
      },
      {
        "method": "PATCH",
        "path": "/internal/nurture/profiles/:canonicalObjectId",
        "owner_surface": "web_domain_workbench",
        "command_class": "workflow_fact_write",
        "writes_workflow_facts": true,
        "handler_key": "nurture.internal.update_profile_projection"
      },
      {
        "method": "POST",
        "path": "/internal/nurture/activity-comparisons",
        "owner_surface": "web_run_workbench",
        "command_class": "scenario_internal",
        "writes_workflow_facts": false,
        "handler_key": "nurture.internal.preview_activity_comparison"
      },
      {
        "method": "GET",
        "path": "/internal/nurture/institution/class-family-inbox",
        "owner_surface": "web_domain_workbench",
        "command_class": "scenario_internal",
        "writes_workflow_facts": false,
        "handler_key": "nurture.internal.open_class_family_inbox"
      },
      {
        "method": "GET",
        "path": "/internal/nurture/institution/teacher-attention-board",
        "owner_surface": "web_domain_workbench",
        "command_class": "scenario_internal",
        "writes_workflow_facts": false,
        "handler_key": "nurture.internal.open_today_attention_board"
      },
      {
        "method": "POST",
        "path": "/internal/nurture/activation/user-attention/resolve",
        "owner_surface": "admin_operator",
        "command_class": "scenario_internal",
        "writes_workflow_facts": false,
        "handler_key": "nurture.internal.resolve_user_attention"
      }
    ]
  },
  "event_registry": {
    "standard_workflow_events": [
      "workflow.run.created",
      "workflow.run.updated",
      "workflow.step.started",
      "workflow.step.completed",
      "workflow.step.failed",
      "workflow.step.retry_requested",
      "workflow.step.manual_review_required",
      "workflow.approval.requested",
      "workflow.approval.resolved",
      "workflow.artifact.created",
      "workflow.artifact.updated",
      "workflow.handoff.requested",
      "workflow.handoff.receipt_recorded",
      "workflow.context.bound",
      "workflow.context.rebind_required",
      "workflow.evidence.recorded"
    ],
    "scenario_internal_events": [
      "nurture.profile.snapshot_attached",
      "nurture.activity_comparison.artifact_generated",
      "nurture.health_state.safety_escalated"
    ],
    "event_payload_policy": {
      "signal_version": 1,
      "body": "no_body",
      "pii": "no_pii",
      "status_in_payload": false,
      "presenter_output_in_payload": false,
      "idempotency_key": "{event_type}:{aggregate_id}:{aggregate_version}"
    },
    "producers": {
      "workflow.run.created": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.run.updated": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.step.completed": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.artifact.created": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.handoff.requested": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.context.bound": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "workflow.evidence.recorded": {
        "owner": "workflow_ledger",
        "write_boundary": "same_transaction"
      },
      "nurture.profile.snapshot_attached": {
        "owner": "the-nurture",
        "write_boundary": "scenario_internal"
      },
      "nurture.activity_comparison.artifact_generated": {
        "owner": "the-nurture",
        "write_boundary": "scenario_internal"
      },
      "nurture.health_state.safety_escalated": {
        "owner": "the-nurture",
        "write_boundary": "scenario_internal"
      }
    },
    "consumers": {
      "my_chat.chat": {
        "allowed_events": [
          "workflow.run.created",
          "workflow.run.updated",
          "workflow.artifact.created"
        ],
        "forbidden_events": [
          "nurture.health_state.safety_escalated"
        ]
      },
      "my_chat.forum": {
        "allowed_events": [
          "workflow.handoff.requested"
        ],
        "forbidden_events": [
          "nurture.health_state.safety_escalated"
        ]
      },
      "my_chat.knowledge_base": {
        "allowed_events": [
          "workflow.handoff.requested"
        ],
        "forbidden_events": [
          "nurture.health_state.safety_escalated"
        ]
      },
      "my_chat.notification": {
        "allowed_events": [
          "workflow.handoff.requested",
          "workflow.step.manual_review_required"
        ],
        "forbidden_events": [
          "nurture.health_state.safety_escalated"
        ]
      }
    }
  },
  "governance": {
    "admin_actions": [
      "validate_manifest",
      "publish_scenario_version",
      "disable_capability",
      "inspect_safety_escalations"
    ],
    "rollback": "Disable capability, preserve workflow facts, keep scenario-local profile projections exportable by canonical object ref.",
    "projection_review_required": true,
    "evidence_records": [
      "care_context_snapshot",
      "activity_comparison_inputs",
      "family_strategy_decision_basis",
      "execution_review_outcome",
      "health_safety_escalation_reason"
    ],
    "outbox_events": [
      "workflow.run.created",
      "workflow.run.updated",
      "workflow.artifact.created",
      "workflow.handoff.requested",
      "workflow.evidence.recorded"
    ]
  },
  "verification": {
    "deterministic_tests": [
      "nurture p0 journey fixture",
      "activity comparison happy path",
      "medical safety escalation path"
    ],
    "journey_harness": "nurture-p0-first-journey"
  },
  "scenario_contracts": {
    "scenario_contracts_version": 1,
    "source_dependencies": [
      {
        "source_identity": "platform_child_family_identity_source_v1",
        "source_hash": "81d9fb9db244b8e56bc85e8770eb13915ca87b6053bb3411420b569d59d8fed4"
      },
      {
        "source_identity": "scenario_interface_source_v1",
        "source_hash": "37f0cdae3ad8807073dd250a51f4de990dcccf40952c127b2340161db2e28eaf"
      }
    ],
    "capability_dependencies": [
      {
        "capability_key": "trusted_scenario_invocation_v1",
        "requires_capabilities": [],
        "requires_sources": [
          "scenario_interface_source_v1"
        ]
      },
      {
        "capability_key": "scenario_subject_presentation_v1",
        "requires_capabilities": [
          "trusted_scenario_invocation_v1"
        ],
        "requires_sources": [
          "platform_child_family_identity_source_v1",
          "scenario_interface_source_v1"
        ]
      }
    ],
    "trusted_invocation": {
      "trusted_invocation_version": 1,
      "invocation_contract": "scenario-private-invocation-v1",
      "operations": [
        {
          "endpoint_key": "nurture.subject_context.list",
          "method": "POST",
          "operation_key": "list_subject_contexts",
          "input_schema_key": "nurture.list_subject_contexts.input",
          "input_schema_version": 1,
          "handler_key": "nurture.c30.list_subject_contexts.transport",
          "ingress": [
            {
              "ingress_category": "host_transition",
              "ingress_key": "nurture.subject_context.list",
              "principal_origins": [
                "interactive_session"
              ]
            }
          ]
        },
        {
          "endpoint_key": "nurture.subject_context.resolve",
          "method": "POST",
          "operation_key": "resolve_subject_context",
          "input_schema_key": "nurture.resolve_subject_context.input",
          "input_schema_version": 1,
          "handler_key": "nurture.c30.resolve_subject_context.transport",
          "ingress": [
            {
              "ingress_category": "host_transition",
              "ingress_key": "nurture.subject_context.resolve",
              "principal_origins": [
                "interactive_session"
              ]
            }
          ]
        },
        {
          "endpoint_key": "nurture.subject_context.present",
          "method": "POST",
          "operation_key": "present_subject_context",
          "input_schema_key": "nurture.present_subject_context.input",
          "input_schema_version": 1,
          "handler_key": "nurture.c30.present_subject_context.transport",
          "ingress": [
            {
              "ingress_category": "product_surface",
              "ingress_key": "nurture.child_care_process_overview_v1",
              "principal_origins": [
                "interactive_session"
              ]
            }
          ]
        }
      ]
    },
    "subject_context_providers": [
      {
        "provider_key": "nurture.child_care_process_v1",
        "provider_version": 1,
        "list_operation_key": "list_subject_contexts",
        "resolve_operation_key": "resolve_subject_context",
        "handler_key": "nurture.c30.child_care_process.provider"
      }
    ],
    "semantic_presentations": [
      {
        "presentation_key": "nurture.child_care_process_overview_v1",
        "presentation_version": 1,
        "provider_key": "nurture.child_care_process_v1",
        "operation_key": "present_subject_context",
        "handler_key": "nurture.c30.child_care_process_overview.presenter",
        "safe_reason_codes": [
          "subject_available",
          "subject_unavailable",
          "authority_changed"
        ]
      }
    ],
    "product_surfaces": [
      {
        "product_surface_key": "nurture.child_care_process_overview_v1",
        "presentation_key": "nurture.child_care_process_overview_v1",
        "view_modes": [
          "current"
        ],
        "route_classes": [
          "scenario_overview"
        ],
        "action_offer_policy": "none",
        "action_keys": []
      }
    ],
    "domain_action_contracts": [],
    "protected_interaction_contracts": []
  }
};
