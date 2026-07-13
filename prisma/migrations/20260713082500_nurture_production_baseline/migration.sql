-- CreateEnum
CREATE TYPE "NurtureIssueType" AS ENUM ('screen', 'bedtime', 'homework', 'snack', 'custom');

-- CreateEnum
CREATE TYPE "NurtureProjectStatus" AS ENUM ('draft', 'confirmed', 'active', 'checkpoint', 'adjusted', 'completed', 'archived', 'escalated', 'cancelled');

-- CreateEnum
CREATE TYPE "NurtureCaptureType" AS ENUM ('checkin', 'observation', 'conflict_event', 'rule_execution', 'burden_report', 'child_response', 'adjustment_request', 'free_note', 'media_ref');

-- CreateEnum
CREATE TYPE "NurtureCaptureSourceSurface" AS ENUM ('web_workbench', 'mobile_llm', 'system_prompt', 'manual');

-- CreateEnum
CREATE TYPE "NurtureCaptureInputModality" AS ENUM ('text', 'voice_transcript', 'form', 'checklist', 'media_ref', 'system_generated');

-- CreateEnum
CREATE TYPE "NurtureCaptureExtractionStatus" AS ENUM ('pending', 'extracted', 'user_confirmed', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "NurtureCaptureStatus" AS ENUM ('active', 'superseded', 'dismissed', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureMetricValueKind" AS ENUM ('number', 'boolean', 'enum', 'duration', 'count', 'scale', 'text_summary');

-- CreateEnum
CREATE TYPE "NurtureMetricSubjectType" AS ENUM ('family', 'child', 'parent', 'workflow', 'caregiver');

-- CreateEnum
CREATE TYPE "NurtureMetricSourceType" AS ENUM ('capture', 'checkpoint', 'review', 'system_inferred', 'manual');

-- CreateEnum
CREATE TYPE "NurtureMetricObservationStatus" AS ENUM ('active', 'corrected', 'dismissed', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureSnapshotType" AS ENUM ('planning', 'checkpoint', 'review', 'periodic', 'manual');

-- CreateEnum
CREATE TYPE "NurtureSnapshotSourceType" AS ENUM ('metric_rollup', 'workflow_review', 'user_update', 'llm_summary', 'mixed');

-- CreateEnum
CREATE TYPE "NurtureSnapshotStatus" AS ENUM ('active', 'superseded', 'disputed', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureContextLayer" AS ENUM ('L0_safety', 'L1_family_charter', 'L2_current_focus', 'L3_child_profile', 'L4_family_state', 'L5_scenario_constraints', 'L6_historical_feedback', 'L7_community_evidence');

-- CreateEnum
CREATE TYPE "NurtureMaterialAudience" AS ENUM ('mobile_llm', 'workflow_orchestrator', 'web_workbench', 'review_generator', 'recommendation_ranker');

-- CreateEnum
CREATE TYPE "NurtureMaterialSubjectType" AS ENUM ('family', 'child', 'parent', 'caregiver', 'workflow', 'rule_topic', 'scenario');

-- CreateEnum
CREATE TYPE "NurtureFreshnessLevel" AS ENUM ('current', 'recent', 'stale', 'historical');

-- CreateEnum
CREATE TYPE "NurtureSensitivityLevel" AS ENUM ('low', 'medium', 'high', 'restricted');

-- CreateEnum
CREATE TYPE "NurtureMaterialStatus" AS ENUM ('active', 'stale', 'superseded', 'restricted', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureMaterialSourceType" AS ENUM ('family_profile_snapshot', 'child_profile_snapshot', 'family_charter', 'focus_cycle', 'workflow_project', 'workflow_capture', 'quantification_snapshot', 'workflow_review', 'metric_observation', 'evidence');

-- CreateEnum
CREATE TYPE "NurtureMaterialType" AS ENUM ('profile_fact', 'family_constraint', 'charter_principle', 'current_focus', 'development_vector_digest', 'metric_rollup', 'observation_summary', 'workflow_commitment', 'plan_rationale', 'checkpoint_signal', 'review_learning', 'safety_boundary', 'missing_context_question', 'family_preference');

-- CreateEnum
CREATE TYPE "NurturePackType" AS ENUM ('planning', 'checkpoint', 'adjustment', 'review', 'workbench_preview', 'mobile_handoff');

-- CreateEnum
CREATE TYPE "NurturePackAudience" AS ENUM ('workflow_orchestrator', 'mobile_llm', 'web_workbench', 'review_generator');

-- CreateEnum
CREATE TYPE "NurturePackPurpose" AS ENUM ('create_plan', 'select_next_action', 'build_checkpoint', 'propose_adjustment', 'build_review_summary', 'preview_context', 'prepare_mobile_handoff');

-- CreateEnum
CREATE TYPE "NurturePackTriggerType" AS ENUM ('project_created', 'project_updated', 'capture_added', 'checkpoint_requested', 'adjustment_requested', 'review_requested', 'manual_preview', 'mobile_turn_requested');

-- CreateEnum
CREATE TYPE "NurturePackStatus" AS ENUM ('built', 'used', 'superseded', 'discarded', 'failed');

-- CreateTable
CREATE TABLE "nurture_family_profile_snapshot" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "profile_payload" JSONB,
    "semantic_summary" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_profile_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child_profile_snapshot" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT NOT NULL,
    "child_ref" JSONB NOT NULL,
    "development_stage_key" TEXT,
    "profile_payload" JSONB,
    "development_vector_digest_payload" JSONB,
    "semantic_summary" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_child_profile_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_charter" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "charter_payload" JSONB,
    "status" TEXT,
    "supersedes_charter_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_charter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_charter_item" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "charter_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "item_key" TEXT,
    "item_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_charter_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_focus_cycle" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "cycle_start" TIMESTAMP(3),
    "cycle_end" TIMESTAMP(3),
    "focus_payload" JSONB,
    "status" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_focus_cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_focus_goal" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "focus_cycle_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "goal_key" TEXT,
    "goal_payload" JSONB,
    "priority" INTEGER,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_focus_goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_metric_definition" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT,
    "value_kind" "NurtureMetricValueKind",
    "subject_type" "NurtureMetricSubjectType",
    "unit" TEXT,
    "definition_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_metric_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_metric_observation" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "parent_actor_id" TEXT,
    "project_id" TEXT,
    "capture_id" TEXT,
    "checkpoint_id" TEXT,
    "workflow_run_id" TEXT,
    "metric_code" TEXT NOT NULL,
    "subject_type" "NurtureMetricSubjectType" NOT NULL,
    "subject_ref_key" TEXT NOT NULL,
    "subject_ref" JSONB,
    "value_kind" "NurtureMetricValueKind" NOT NULL,
    "numeric_value" DECIMAL(65,30),
    "boolean_value" BOOLEAN,
    "enum_value" TEXT,
    "text_value" TEXT,
    "value_payload" JSONB,
    "unit" TEXT,
    "scale_min" DECIMAL(65,30),
    "scale_max" DECIMAL(65,30),
    "observed_at" TIMESTAMP(3) NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "source_type" "NurtureMetricSourceType" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "semantic_summary" TEXT,
    "semantic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_payload" JSONB,
    "materialization_status" TEXT,
    "generated_context_material_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "NurtureMetricObservationStatus" NOT NULL,
    "supersedes_observation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_metric_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_quantification_snapshot" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "child_ref_key" TEXT,
    "child_ref" JSONB,
    "project_id" TEXT,
    "checkpoint_id" TEXT,
    "review_id" TEXT,
    "workflow_run_id" TEXT,
    "snapshot_type" "NurtureSnapshotType" NOT NULL,
    "source_type" "NurtureSnapshotSourceType" NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "structure_version" INTEGER,
    "metric_schema_version" INTEGER,
    "family_resources_payload" JSONB,
    "parent_bandwidth_payload" JSONB,
    "family_consistency_payload" JSONB,
    "parent_child_connection_payload" JSONB,
    "life_structure_payload" JSONB,
    "value_alignment_payload" JSONB,
    "overload_risk_payload" JSONB,
    "metric_rollup_payload" JSONB,
    "development_vector_digest_payload" JSONB,
    "workflow_effect_payload" JSONB,
    "metric_observation_refs" JSONB,
    "capture_refs" JSONB,
    "evidence_refs" JSONB,
    "summary_payload" JSONB,
    "semantic_summary" TEXT,
    "semantic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_context_digest" TEXT,
    "semantic_embedding_text" TEXT,
    "semantic_payload" JSONB,
    "semantic_version" INTEGER,
    "materialization_status" TEXT,
    "generated_context_material_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION,
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "NurtureSnapshotStatus" NOT NULL,
    "supersedes_snapshot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_quantification_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_context_material" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "subject_type" "NurtureMaterialSubjectType" NOT NULL,
    "subject_ref_key" TEXT,
    "project_id" TEXT,
    "workflow_run_id" TEXT,
    "workflow_step_id" TEXT,
    "material_key" TEXT NOT NULL,
    "source_type" "NurtureMaterialSourceType" NOT NULL,
    "source_ref_id" TEXT NOT NULL,
    "source_ref_payload" JSONB,
    "source_version" INTEGER NOT NULL,
    "source_captured_at" TIMESTAMP(3),
    "source_updated_at" TIMESTAMP(3),
    "material_hash" TEXT NOT NULL,
    "material_type" "NurtureMaterialType" NOT NULL,
    "context_layer" "NurtureContextLayer" NOT NULL,
    "audience" "NurtureMaterialAudience" NOT NULL,
    "template_key" TEXT,
    "issue_type" TEXT,
    "urgency_horizon" TEXT,
    "development_stage_key" TEXT,
    "structured_payload" JSONB,
    "semantic_text" TEXT,
    "semantic_summary" TEXT,
    "semantic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retrieval_key" TEXT,
    "embedding_text" TEXT,
    "language" TEXT,
    "token_estimate" INTEGER NOT NULL,
    "orchestration_hint_payload" JSONB,
    "selection_weight_payload" JSONB,
    "freshness_level" "NurtureFreshnessLevel" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "sensitivity_level" "NurtureSensitivityLevel" NOT NULL,
    "redaction_level" TEXT,
    "safety_scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "staleness_policy" TEXT,
    "status" "NurtureMaterialStatus" NOT NULL,
    "supersedes_material_id" TEXT,
    "semantic_version" INTEGER NOT NULL,
    "materializer_version" TEXT,
    "created_by_pipeline" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_context_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_runtime_context_pack" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "project_id" TEXT,
    "workflow_run_id" TEXT,
    "workflow_step_id" TEXT,
    "pack_key" TEXT NOT NULL,
    "pack_type" "NurturePackType" NOT NULL,
    "purpose" "NurturePackPurpose" NOT NULL,
    "audience" "NurturePackAudience" NOT NULL,
    "template_key" TEXT,
    "issue_type" TEXT,
    "urgency_horizon" TEXT,
    "development_stage_key" TEXT,
    "trigger_type" "NurturePackTriggerType" NOT NULL,
    "trigger_ref_id" TEXT,
    "selection_policy_key" TEXT,
    "selection_policy_version" TEXT,
    "candidate_filter_payload" JSONB,
    "selected_material_refs" JSONB,
    "excluded_material_refs" JSONB,
    "context_layer_coverage_payload" JSONB,
    "known_context_payload" JSONB,
    "missing_context_payload" JSONB,
    "assumptions_payload" JSONB,
    "safety_boundary_payload" JSONB,
    "orchestration_input_payload" JSONB,
    "output_contract_payload" JSONB,
    "context_text" TEXT,
    "context_text_hash" TEXT,
    "token_budget_payload" JSONB,
    "pack_stats_payload" JSONB,
    "model_profile_key" TEXT,
    "model_runtime_hints_payload" JSONB,
    "provider_invocation_ref" TEXT,
    "result_artifact_ref" JSONB,
    "material_set_hash" TEXT,
    "pack_hash" TEXT,
    "pack_version" INTEGER,
    "builder_version" TEXT,
    "created_by_pipeline" TEXT,
    "status" "NurturePackStatus" NOT NULL,
    "supersedes_pack_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_runtime_context_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_workflow_project" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "primary_child_ref_key" TEXT,
    "primary_child_ref" JSONB,
    "template_key" TEXT NOT NULL,
    "issue_type" "NurtureIssueType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "NurtureProjectStatus" NOT NULL,
    "risk_level" TEXT,
    "urgency_horizon" TEXT,
    "workflow_run_id" TEXT,
    "workflow_run_ref" JSONB,
    "workflow_version" INTEGER,
    "context_snapshot_payload" JSONB,
    "family_profile_snapshot_id" TEXT,
    "child_profile_snapshot_id" TEXT,
    "family_charter_id" TEXT,
    "focus_cycle_id" TEXT,
    "quantification_snapshot_id" TEXT,
    "goal_payload" JSONB,
    "constraint_payload" JSONB,
    "measurement_plan_payload" JSONB,
    "baseline_payload" JSONB,
    "plan_payload" JSONB,
    "intent_payload" JSONB,
    "slots_payload" JSONB,
    "missing_context_payload" JSONB,
    "suggested_action_payload" JSONB,
    "capture_prompt_payload" JSONB,
    "semantic_summary" TEXT,
    "semantic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_stage_key" TEXT,
    "semantic_intent_payload" JSONB,
    "semantic_context_digest" TEXT,
    "semantic_embedding_text" TEXT,
    "semantic_payload" JSONB,
    "semantic_version" INTEGER,
    "context_material_refs" JSONB,
    "latest_runtime_context_pack_id" TEXT,
    "orchestration_state_payload" JSONB,
    "latest_checkpoint_at" TIMESTAMP(3),
    "next_checkpoint_at" TIMESTAMP(3),
    "review_due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "resulting_family_policy_id" TEXT,
    "review_summary_payload" JSONB,
    "learning_output_payload" JSONB,
    "profile_update_proposal_payload" JSONB,
    "charter_update_proposal_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_by_actor_id" TEXT,
    "updated_by_actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_workflow_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_workflow_capture" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "workflow_run_id" TEXT,
    "workflow_step_id" TEXT,
    "checkpoint_id" TEXT,
    "capture_type" "NurtureCaptureType" NOT NULL,
    "source_surface" "NurtureCaptureSourceSurface" NOT NULL,
    "input_modality" "NurtureCaptureInputModality" NOT NULL,
    "occurred_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "prompt_key" TEXT,
    "prompt_payload" JSONB,
    "raw_input_text" TEXT,
    "raw_input_payload" JSONB,
    "input_language" TEXT,
    "normalized_input_payload" JSONB,
    "structured_payload" JSONB,
    "semantic_summary" TEXT,
    "semantic_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semantic_intent_payload" JSONB,
    "semantic_extraction_payload" JSONB,
    "semantic_context_refs" JSONB,
    "semantic_embedding_text" TEXT,
    "semantic_payload" JSONB,
    "semantic_version" INTEGER,
    "materialization_status" TEXT,
    "generated_context_material_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extraction_status" "NurtureCaptureExtractionStatus" NOT NULL,
    "extraction_confidence" DOUBLE PRECISION,
    "extracted_by" TEXT,
    "extraction_model_info" JSONB,
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "safety_signal_level" TEXT,
    "generated_metric_observation_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generated_evidence_id" TEXT,
    "status" "NurtureCaptureStatus" NOT NULL DEFAULT 'active',
    "supersedes_capture_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_workflow_capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_workflow_checkpoint" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "workflow_run_id" TEXT,
    "workflow_step_id" TEXT,
    "checkpoint_payload" JSONB,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_workflow_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_workflow_review" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "child_ref_key" TEXT,
    "workflow_run_id" TEXT,
    "review_summary_payload" JSONB,
    "learning_output_payload" JSONB,
    "status" TEXT,
    "completed_at" TIMESTAMP(3),
    "user_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_workflow_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "family_ref" JSONB NOT NULL,
    "child_ref_key" TEXT,
    "source_project_id" TEXT,
    "policy_payload" JSONB,
    "status" TEXT,
    "effective_from" TIMESTAMP(3),
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_evidence" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "family_ref_key" TEXT,
    "child_ref_key" TEXT,
    "project_id" TEXT,
    "target_ref" JSONB,
    "evidence_ref" JSONB,
    "reason_code" TEXT,
    "evidence_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_profile_projection" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "ref_namespace" TEXT NOT NULL,
    "ref_object_type" TEXT NOT NULL,
    "ref_object_id" TEXT NOT NULL,
    "canonical_object_ref" JSONB NOT NULL,
    "scenario_key" TEXT NOT NULL DEFAULT 'nurture',
    "projection_version" INTEGER NOT NULL,
    "safe_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_profile_projection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_activity_comparison_draft" (
    "id" TEXT NOT NULL,
    "comparison_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "target_refs" JSONB NOT NULL,
    "option_refs" JSONB NOT NULL,
    "safe_summary" TEXT NOT NULL,
    "weight_override_payload" JSONB,
    "computed_result_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_activity_comparison_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_evidence_ref" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "target_ref" JSONB NOT NULL,
    "evidence_ref" JSONB NOT NULL,
    "reason_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_evidence_ref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_activity_option" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "canonical_object_ref" TEXT,
    "binding" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_activity_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_health_state_summary" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "canonical_object_ref" TEXT,
    "binding" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_health_state_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_1" ON "nurture_family_profile_snapshot"("workspace_id", "family_ref_key");

-- CreateIndex
CREATE INDEX "ix_2" ON "nurture_child_profile_snapshot"("workspace_id", "family_ref_key", "child_ref_key");

-- CreateIndex
CREATE INDEX "ix_3" ON "nurture_family_charter"("workspace_id", "family_ref_key", "status");

-- CreateIndex
CREATE INDEX "ix_4" ON "nurture_family_charter_item"("workspace_id", "charter_id");

-- CreateIndex
CREATE INDEX "ix_5" ON "nurture_focus_cycle"("workspace_id", "family_ref_key", "status");

-- CreateIndex
CREATE INDEX "ix_6" ON "nurture_focus_goal"("workspace_id", "focus_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_1" ON "nurture_metric_definition"("workspace_id", "metric_code");

-- CreateIndex
CREATE INDEX "ix_7" ON "nurture_metric_observation"("workspace_id", "family_ref_key", "metric_code", "observed_at");

-- CreateIndex
CREATE INDEX "ix_8" ON "nurture_metric_observation"("project_id", "metric_code", "observed_at");

-- CreateIndex
CREATE INDEX "ix_9" ON "nurture_metric_observation"("capture_id");

-- CreateIndex
CREATE INDEX "ix_10" ON "nurture_metric_observation"("checkpoint_id");

-- CreateIndex
CREATE INDEX "ix_11" ON "nurture_metric_observation"("workspace_id", "child_ref_key", "metric_code", "observed_at");

-- CreateIndex
CREATE INDEX "ix_12" ON "nurture_family_quantification_snapshot"("workspace_id", "family_ref_key", "captured_at");

-- CreateIndex
CREATE INDEX "ix_13" ON "nurture_family_quantification_snapshot"("workspace_id", "family_ref_key", "snapshot_type", "captured_at");

-- CreateIndex
CREATE INDEX "ix_14" ON "nurture_family_quantification_snapshot"("project_id", "captured_at");

-- CreateIndex
CREATE INDEX "ix_15" ON "nurture_family_quantification_snapshot"("checkpoint_id");

-- CreateIndex
CREATE INDEX "ix_16" ON "nurture_family_quantification_snapshot"("review_id");

-- CreateIndex
CREATE INDEX "ix_17" ON "nurture_family_quantification_snapshot"("workspace_id", "child_ref_key", "captured_at");

-- CreateIndex
CREATE INDEX "ix_18" ON "nurture_context_material"("workspace_id", "family_ref_key", "context_layer", "status", "valid_until");

-- CreateIndex
CREATE INDEX "ix_19" ON "nurture_context_material"("workspace_id", "family_ref_key", "material_type", "status");

-- CreateIndex
CREATE INDEX "ix_20" ON "nurture_context_material"("workspace_id", "family_ref_key", "audience", "template_key", "status");

-- CreateIndex
CREATE INDEX "ix_21" ON "nurture_context_material"("project_id", "context_layer", "status");

-- CreateIndex
CREATE INDEX "ix_22" ON "nurture_context_material"("source_type", "source_ref_id");

-- CreateIndex
CREATE INDEX "ix_23" ON "nurture_context_material"("retrieval_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_2" ON "nurture_context_material"("workspace_id", "material_key", "source_version", "semantic_version");

-- CreateIndex
CREATE INDEX "ix_24" ON "nurture_runtime_context_pack"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_25" ON "nurture_runtime_context_pack"("workflow_run_id", "workflow_step_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_26" ON "nurture_runtime_context_pack"("workspace_id", "family_ref_key", "pack_type", "created_at");

-- CreateIndex
CREATE INDEX "ix_27" ON "nurture_runtime_context_pack"("workspace_id", "family_ref_key", "audience", "pack_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_28" ON "nurture_runtime_context_pack"("pack_key");

-- CreateIndex
CREATE INDEX "ix_29" ON "nurture_runtime_context_pack"("provider_invocation_ref");

-- CreateIndex
CREATE INDEX "ix_30" ON "nurture_workflow_project"("workspace_id", "family_ref_key", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ix_31" ON "nurture_workflow_project"("workspace_id", "family_ref_key", "template_key", "status");

-- CreateIndex
CREATE INDEX "ix_32" ON "nurture_workflow_project"("workspace_id", "family_ref_key", "issue_type", "status");

-- CreateIndex
CREATE INDEX "ix_33" ON "nurture_workflow_project"("workspace_id", "primary_child_ref_key", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ix_34" ON "nurture_workflow_project"("workspace_id", "family_ref_key", "semantic_stage_key");

-- CreateIndex
CREATE INDEX "ix_35" ON "nurture_workflow_capture"("project_id", "captured_at");

-- CreateIndex
CREATE INDEX "ix_36" ON "nurture_workflow_capture"("workspace_id", "family_ref_key", "captured_at");

-- CreateIndex
CREATE INDEX "ix_37" ON "nurture_workflow_capture"("workspace_id", "child_ref_key", "captured_at");

-- CreateIndex
CREATE INDEX "ix_38" ON "nurture_workflow_capture"("project_id", "capture_type", "captured_at");

-- CreateIndex
CREATE INDEX "ix_39" ON "nurture_workflow_capture"("checkpoint_id");

-- CreateIndex
CREATE INDEX "ix_40" ON "nurture_workflow_checkpoint"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "ix_41" ON "nurture_workflow_checkpoint"("project_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "ix_42" ON "nurture_workflow_review"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "ix_43" ON "nurture_family_policy"("workspace_id", "family_ref_key", "status");

-- CreateIndex
CREATE INDEX "ix_44" ON "nurture_evidence"("workspace_id", "family_ref_key");

-- CreateIndex
CREATE INDEX "ix_45" ON "nurture_evidence"("project_id");

-- CreateIndex
CREATE INDEX "ix_46" ON "nurture_profile_projection"("workspace_id");

-- CreateIndex
CREATE INDEX "ix_profile_id" ON "nurture_profile_projection"("workspace_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_3" ON "nurture_profile_projection"("workspace_id", "ref_namespace", "ref_object_type", "ref_object_id");

-- CreateIndex
CREATE INDEX "ix_47" ON "nurture_activity_comparison_draft"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_5" ON "nurture_activity_comparison_draft"("workspace_id", "comparison_id");

-- CreateIndex
CREATE INDEX "ix_48" ON "nurture_evidence_ref"("workspace_id");

-- CreateIndex
CREATE INDEX "ix_49" ON "nurture_activity_option"("workspace_id");

-- CreateIndex
CREATE INDEX "ix_50" ON "nurture_health_state_summary"("workspace_id");

-- AddForeignKey
ALTER TABLE "nurture_family_charter_item" ADD CONSTRAINT "nurture_family_charter_item_charter_id_fkey" FOREIGN KEY ("charter_id") REFERENCES "nurture_family_charter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_focus_goal" ADD CONSTRAINT "nurture_focus_goal_focus_cycle_id_fkey" FOREIGN KEY ("focus_cycle_id") REFERENCES "nurture_focus_cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_metric_observation" ADD CONSTRAINT "nurture_metric_observation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_metric_observation" ADD CONSTRAINT "nurture_metric_observation_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "nurture_workflow_checkpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_quantification_snapshot" ADD CONSTRAINT "nurture_family_quantification_snapshot_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_runtime_context_pack" ADD CONSTRAINT "nurture_runtime_context_pack_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_workflow_capture" ADD CONSTRAINT "nurture_workflow_capture_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_workflow_checkpoint" ADD CONSTRAINT "nurture_workflow_checkpoint_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_workflow_review" ADD CONSTRAINT "nurture_workflow_review_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "nurture_workflow_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
