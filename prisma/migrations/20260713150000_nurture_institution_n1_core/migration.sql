-- CreateEnum
CREATE TYPE "NurtureParticipantStatus" AS ENUM ('active', 'inactive', 'suspended', 'merged', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureChildStatus" AS ENUM ('active', 'archived', 'merged', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureChildCareProcessStatus" AS ENUM ('active', 'paused', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureFamilyStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureCareInstitutionStatus" AS ENUM ('active', 'paused', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureCareGroupStatus" AS ENUM ('active', 'paused', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureEnrollmentStatus" AS ENUM ('pending', 'active', 'paused', 'ended', 'withdrawn', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureCareRole" AS ENUM ('guardian', 'caregiver', 'lead_caregiver', 'institution_admin', 'system_operator');

-- CreateEnum
CREATE TYPE "NurtureCareScopeType" AS ENUM ('child_care_process', 'family', 'institution', 'care_group', 'enrollment');

-- CreateEnum
CREATE TYPE "NurtureCareRoleAssignmentStatus" AS ENUM ('active', 'suspended', 'revoked', 'expired', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureChildLinkGrantStatus" AS ENUM ('pending', 'active', 'revoked', 'expired', 'replaced', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureGrantDirection" AS ENUM ('family_to_org', 'org_to_family');

-- CreateEnum
CREATE TYPE "NurtureGrantDataClass" AS ENUM ('daily_care_log', 'care_day_note', 'care_constraint_update', 'family_care_question', 'family_follow_up_request');

-- CreateEnum
CREATE TYPE "NurtureChildLinkReceiptStatus" AS ENUM ('pending', 'delivered', 'read', 'acknowledged', 'failed', 'blocked', 'revoked_after_delivery');

-- CreateEnum
CREATE TYPE "NurtureChildLinkReceiptSourceType" AS ENUM ('family_care_message', 'family_care_item', 'daily_care_log', 'media_attribution', 'system_summary');

-- CreateEnum
CREATE TYPE "NurtureChildLinkReceiptTargetScopeType" AS ENUM ('family', 'participant', 'care_group', 'enrollment', 'institution');

-- CreateEnum
CREATE TYPE "NurtureChildLinkReceiptPendingReason" AS ENUM ('workflow_processing', 'awaiting_confirmation', 'scheduled_release');

-- CreateEnum
CREATE TYPE "NurtureChildLinkReceiptDriverType" AS ENUM ('workflow_step', 'item_action', 'scheduled_step');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareThreadVisibilityScope" AS ENUM ('family_private', 'enrollment_private', 'institution_case');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareThreadStatus" AS ENUM ('active', 'closed', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareParticipantKind" AS ENUM ('guardian', 'caregiver', 'lead_caregiver', 'institution_admin', 'system');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareThreadParticipantVisibilityStatus" AS ENUM ('active', 'muted', 'left', 'removed', 'blocked');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageKind" AS ENUM ('family_message', 'caregiver_reply', 'system_notice', 'care_summary', 'redaction_notice');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageAuthorshipKind" AS ENUM ('family_authored', 'caregiver_confirmed', 'institution_generated', 'system_generated');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageBodyFormat" AS ENUM ('plain_text', 'rich_text');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageBodyStorageMode" AS ENUM ('plain_text_dev', 'protected', 'encrypted', 'redacted');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageSourceSurface" AS ENUM ('mobile', 'web', 'system_import', 'workflow');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareMessageStatus" AS ENUM ('sent', 'redacted', 'failed');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareItemCategory" AS ENUM ('today_attention', 'constraint', 'question', 'follow_up', 'schedule', 'admin', 'other');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareItemUrgency" AS ENUM ('normal', 'today_attention', 'time_sensitive', 'urgent_non_emergency');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareItemStatus" AS ENUM ('open', 'acknowledged', 'waiting_for_family', 'replied', 'followed_up', 'closed', 'expired', 'suppressed');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareItemClassificationSource" AS ENUM ('manual', 'rule', 'ai', 'system');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareItemEventType" AS ENUM ('created', 'classified', 'assigned', 'acknowledged', 'clarification_requested', 'clarification_received', 'clarification_expired', 'clarification_cancelled', 'corrected', 'replied', 'followed_up', 'closed', 'expired', 'suppressed', 'reopened');

-- CreateEnum
CREATE TYPE "NurtureDailyCareLogStatus" AS ENUM ('draft', 'recorded', 'shared', 'suppressed', 'corrected', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureTeacherAttentionItemSourceType" AS ENUM ('family_care_item', 'care_constraint', 'daily_care_log', 'child_applied_institution_policy', 'manual_child_note');

-- CreateEnum
CREATE TYPE "NurtureTeacherAttentionItemPriority" AS ENUM ('normal', 'attention', 'time_sensitive');

-- CreateEnum
CREATE TYPE "NurtureTeacherAttentionItemStatus" AS ENUM ('active', 'resolved', 'expired', 'suppressed');

-- CreateEnum
CREATE TYPE "NurtureMediaAssetSourceKind" AS ENUM ('class_album', 'class_group_message', 'activity_album', 'admin_upload');

-- CreateEnum
CREATE TYPE "NurtureMediaAssetStatus" AS ENUM ('active', 'hidden', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureMediaAttributionSource" AS ENUM ('face_reference', 'manual', 'history_match', 'system');

-- CreateEnum
CREATE TYPE "NurtureMediaAttributionStatus" AS ENUM ('candidate', 'confirmed', 'rejected', 'corrected', 'hidden', 'deleted');

-- CreateEnum
CREATE TYPE "NurtureInteractionPurpose" AS ENUM ('clarify', 'submit_action', 'open_notification');

-- CreateEnum
CREATE TYPE "NurtureInteractionContextStatus" AS ENUM ('active', 'consumed', 'revoked');

-- CreateEnum
CREATE TYPE "NurtureCommandBusinessOutcome" AS ENUM ('applied', 'already_satisfied');

-- CreateTable
CREATE TABLE "nurture_participant" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "my_chat_user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_ref_payload" JSONB,
    "status" "NurtureParticipantStatus" NOT NULL,
    "profile_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "birth_date" DATE,
    "profile_basics_payload" JSONB,
    "status" "NurtureChildStatus" NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child_care_process" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "primary_family_id" TEXT,
    "status" "NurtureChildCareProcessStatus" NOT NULL,
    "current_stage_key" TEXT,
    "care_context_summary" TEXT,
    "care_context_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_child_care_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "display_name" TEXT,
    "status" "NurtureFamilyStatus" NOT NULL,
    "family_profile_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_care_institution" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "profile_payload" JSONB,
    "policy_config_payload" JSONB,
    "philosophy_payload" JSONB,
    "status" "NurtureCareInstitutionStatus" NOT NULL,
    "created_by_participant_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_care_institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_care_group" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age_band_key" TEXT,
    "capacity" INTEGER,
    "rhythm_config_payload" JSONB,
    "status" "NurtureCareGroupStatus" NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_care_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_enrollment" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "status" "NurtureEnrollmentStatus" NOT NULL,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "enrollment_ref_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_care_role_assignment" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "role" "NurtureCareRole" NOT NULL,
    "scope_type" "NurtureCareScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "display_label" TEXT,
    "permissions_payload" JSONB,
    "status" "NurtureCareRoleAssignmentStatus" NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "granted_by_participant_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_care_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child_link_grant" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "granted_by_participant_id" TEXT NOT NULL,
    "granted_to_scope_type" "NurtureCareScopeType" NOT NULL,
    "granted_to_scope_id" TEXT NOT NULL,
    "directions" "NurtureGrantDirection"[],
    "data_classes" "NurtureGrantDataClass"[],
    "purposes" TEXT[],
    "status" "NurtureChildLinkGrantStatus" NOT NULL,
    "effective_from" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_participant_id" TEXT,
    "revoke_reason" TEXT,
    "retention_policy_payload" JSONB,
    "policy_snapshot_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_child_link_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child_link_receipt" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "grant_id" TEXT,
    "child_care_process_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "direction" "NurtureGrantDirection" NOT NULL,
    "data_class" "NurtureGrantDataClass",
    "source_type" "NurtureChildLinkReceiptSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "routing_attempt_key" TEXT NOT NULL,
    "retry_of_receipt_id" TEXT,
    "target_scope_type" "NurtureChildLinkReceiptTargetScopeType",
    "target_scope_id" TEXT,
    "status" "NurtureChildLinkReceiptStatus" NOT NULL,
    "reason_code" TEXT,
    "pending_reason" "NurtureChildLinkReceiptPendingReason",
    "driver_type" "NurtureChildLinkReceiptDriverType",
    "driver_ref" JSONB,
    "next_action_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "metadata_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_child_link_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_thread" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "care_group_id" TEXT,
    "visibility_scope" "NurtureFamilyCareThreadVisibilityScope" NOT NULL,
    "status" "NurtureFamilyCareThreadStatus" NOT NULL,
    "latest_message_at" TIMESTAMP(3),
    "summary_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_care_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_thread_participant" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "role_assignment_id" TEXT NOT NULL,
    "participant_kind" "NurtureFamilyCareParticipantKind" NOT NULL,
    "visibility_status" "NurtureFamilyCareThreadParticipantVisibilityStatus" NOT NULL,
    "last_read_message_id" TEXT,
    "last_read_at" TIMESTAMP(3),
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_family_care_thread_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_message" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "sender_participant_id" TEXT NOT NULL,
    "sender_role_assignment_id" TEXT NOT NULL,
    "message_kind" "NurtureFamilyCareMessageKind" NOT NULL,
    "authorship_kind" "NurtureFamilyCareMessageAuthorshipKind" NOT NULL,
    "source_item_id" TEXT,
    "source_item_event_id" TEXT,
    "source_daily_care_log_id" TEXT,
    "body" TEXT,
    "body_format" "NurtureFamilyCareMessageBodyFormat" NOT NULL,
    "body_storage_mode" "NurtureFamilyCareMessageBodyStorageMode" NOT NULL,
    "body_protection_payload" JSONB,
    "attachments_payload" JSONB,
    "source_surface" "NurtureFamilyCareMessageSourceSurface" NOT NULL,
    "grant_id" TEXT,
    "status" "NurtureFamilyCareMessageStatus" NOT NULL,
    "redacted_at" TIMESTAMP(3),
    "redacted_by_participant_id" TEXT,
    "redaction_reason" TEXT,
    "redaction_payload" JSONB,
    "safety_flags_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_care_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_item" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_message_id" TEXT,
    "thread_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "care_group_id" TEXT NOT NULL,
    "data_class" "NurtureGrantDataClass" NOT NULL,
    "category" "NurtureFamilyCareItemCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "urgency" "NurtureFamilyCareItemUrgency" NOT NULL,
    "requires_ack" BOOLEAN NOT NULL DEFAULT false,
    "requires_reply" BOOLEAN NOT NULL DEFAULT false,
    "status" "NurtureFamilyCareItemStatus" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "active_clarification_request_event_id" TEXT,
    "waiting_for_family_since" TIMESTAMP(3),
    "waiting_for_family_until" TIMESTAMP(3),
    "clarification_expiry_driver_ref" JSONB,
    "assigned_to_role_assignment_id" TEXT,
    "due_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "acked_by_participant_id" TEXT,
    "acked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "suppressed_at" TIMESTAMP(3),
    "suppression_reason" TEXT,
    "linked_reply_message_id" TEXT,
    "classification_source" "NurtureFamilyCareItemClassificationSource" NOT NULL,
    "classification_confidence" DECIMAL(5,4),
    "grant_id" TEXT,
    "safety_flags_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_family_care_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_item_event" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "actor_participant_id" TEXT,
    "actor_role_assignment_id" TEXT,
    "event_type" "NurtureFamilyCareItemEventType" NOT NULL,
    "from_status" "NurtureFamilyCareItemStatus",
    "to_status" "NurtureFamilyCareItemStatus",
    "related_message_id" TEXT,
    "correlation_event_id" TEXT,
    "event_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_family_care_item_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_daily_care_log" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "recorded_by_role_assignment_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "meal_payload" JSONB,
    "nap_payload" JSONB,
    "activity_payload" JSONB,
    "mood_payload" JSONB,
    "health_observation_payload" JSONB,
    "summary" TEXT,
    "status" "NurtureDailyCareLogStatus" NOT NULL,
    "source_item_id" TEXT,
    "grant_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_daily_care_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_teacher_attention_item" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "source_type" "NurtureTeacherAttentionItemSourceType" NOT NULL,
    "source_id" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "priority" "NurtureTeacherAttentionItemPriority" NOT NULL,
    "status" "NurtureTeacherAttentionItemStatus" NOT NULL,
    "effective_date" DATE,
    "expires_at" TIMESTAMP(3),
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_teacher_attention_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_media_asset_ref" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "care_group_id" TEXT,
    "uploaded_by_role_assignment_id" TEXT,
    "source_kind" "NurtureMediaAssetSourceKind" NOT NULL,
    "storage_ref_payload" JSONB NOT NULL,
    "safe_title" TEXT,
    "captured_at" TIMESTAMP(3),
    "status" "NurtureMediaAssetStatus" NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_media_asset_ref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_child_media_attribution" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "media_asset_ref_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "source" "NurtureMediaAttributionSource" NOT NULL,
    "confidence" DECIMAL(5,4),
    "status" "NurtureMediaAttributionStatus" NOT NULL,
    "confirmed_by_role_assignment_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "exposure_policy_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_child_media_attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_interaction_context" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "purpose" "NurtureInteractionPurpose" NOT NULL,
    "surface" TEXT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "token_hash_version" INTEGER NOT NULL DEFAULT 1,
    "host_conversation_ref_hash" CHAR(64),
    "payload_schema_version" INTEGER NOT NULL,
    "state_payload" JSONB NOT NULL,
    "status" "NurtureInteractionContextStatus" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_interaction_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_command_execution" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "command_request_id_hash" CHAR(64) NOT NULL,
    "origin_invocation_request_id_hash" CHAR(64) NOT NULL,
    "parent_command_request_id_hash" CHAR(64),
    "request_identity_hash_version" INTEGER NOT NULL DEFAULT 1,
    "command_key" TEXT NOT NULL,
    "command_scope" TEXT NOT NULL,
    "command_contract_version" INTEGER NOT NULL,
    "payload_hash" CHAR(64) NOT NULL,
    "payload_canonicalization_version" INTEGER NOT NULL DEFAULT 1,
    "business_actor_ref" TEXT NOT NULL,
    "primary_scope_ref" JSONB,
    "child_care_process_id" TEXT,
    "target_refs" JSONB,
    "business_outcome" "NurtureCommandBusinessOutcome" NOT NULL,
    "output_refs" JSONB NOT NULL,
    "handoff_snapshot_schema_version" INTEGER NOT NULL DEFAULT 1,
    "handoff_request_snapshots_payload" JSONB NOT NULL,
    "handoff_driver_ref" JSONB,
    "committed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_command_execution_pkey" PRIMARY KEY ("id")
);

-- Active-only identity/cardinality invariants are Postgres partial indexes;
-- Prisma cannot express them in the schema model.
CREATE UNIQUE INDEX "uq_nurture_participant_active_user"
ON "nurture_participant"("workspace_id", "my_chat_user_id")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_child_process_active_child"
ON "nurture_child_care_process"("workspace_id", "child_id")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_family_active_process"
ON "nurture_family"("workspace_id", "child_care_process_id")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_care_group_active_name"
ON "nurture_care_group"("workspace_id", "institution_id", "name")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_enrollment_active_process_institution"
ON "nurture_enrollment"("workspace_id", "child_care_process_id", "institution_id")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_role_assignment_active_scope"
ON "nurture_care_role_assignment"("workspace_id", "participant_id", "role", "scope_type", "scope_id")
WHERE "status" = 'active' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_thread_active_private_scope"
ON "nurture_family_care_thread"(
  "workspace_id",
  "child_care_process_id",
  "family_id",
  COALESCE("enrollment_id", '<none>'),
  "visibility_scope"
)
WHERE "status" = 'active' AND "deleted_at" IS NULL;

-- Contract-level checks keep lifecycle completeness and N1's explicit-empty
-- activation gate enforceable below the service layer.
ALTER TABLE "nurture_child_link_grant"
ADD CONSTRAINT "ck_nurture_grant_scope"
CHECK (
  "granted_to_scope_type" IN ('institution', 'care_group', 'enrollment')
  AND cardinality("directions") > 0
  AND cardinality("data_classes") > 0
  AND cardinality("purposes") > 0
  AND ("expires_at" IS NULL OR "effective_from" IS NULL OR "expires_at" > "effective_from")
  AND (
    ("status" = 'revoked' AND "revoked_at" IS NOT NULL AND "revoked_by_participant_id" IS NOT NULL)
    OR "status" <> 'revoked'
  )
);

ALTER TABLE "nurture_child_link_receipt"
ADD CONSTRAINT "ck_nurture_receipt_route_lifecycle"
CHECK (
  "version" >= 0
  AND ("target_scope_type" IS NULL) = ("target_scope_id" IS NULL)
  AND "retry_of_receipt_id" IS DISTINCT FROM "id"
  AND (
    "status" <> 'pending'
    OR (
      "pending_reason" IS NOT NULL
      AND "driver_type" IS NOT NULL
      AND "driver_ref" IS NOT NULL
      AND (
        ("pending_reason" = 'scheduled_release' AND "driver_type" = 'scheduled_step' AND "next_action_at" IS NOT NULL)
        OR ("pending_reason" <> 'scheduled_release' AND "next_action_at" IS NULL)
      )
    )
  )
  AND (
    "status" NOT IN ('delivered', 'read', 'acknowledged')
    OR (
      "grant_id" IS NOT NULL
      AND "enrollment_id" IS NOT NULL
      AND "data_class" IS NOT NULL
      AND "target_scope_type" IS NOT NULL
      AND "target_scope_id" IS NOT NULL
      AND "delivered_at" IS NOT NULL
    )
  )
  AND ("status" <> 'read' OR "read_at" IS NOT NULL)
  AND ("status" <> 'acknowledged' OR "acknowledged_at" IS NOT NULL)
  AND ("status" NOT IN ('blocked', 'failed', 'revoked_after_delivery') OR "reason_code" IS NOT NULL)
);

ALTER TABLE "nurture_family_care_message"
ADD CONSTRAINT "ck_nurture_message_redaction"
CHECK (
  (
    "status" = 'redacted'
    AND "body_storage_mode" = 'redacted'
    AND "body" IS NULL
    AND "attachments_payload" IS NULL
    AND "redacted_at" IS NOT NULL
    AND "redaction_reason" IS NOT NULL
  )
  OR (
    "status" <> 'redacted'
    AND "body_storage_mode" <> 'redacted'
    AND "redacted_at" IS NULL
  )
);

ALTER TABLE "nurture_family_care_item"
ADD CONSTRAINT "ck_nurture_item_state"
CHECK (
  "version" >= 0
  AND ("classification_confidence" IS NULL OR ("classification_confidence" >= 0 AND "classification_confidence" <= 1))
  AND (
    (
      "status" = 'waiting_for_family'
      AND "active_clarification_request_event_id" IS NOT NULL
      AND "waiting_for_family_since" IS NOT NULL
    )
    OR (
      "status" <> 'waiting_for_family'
      AND "active_clarification_request_event_id" IS NULL
      AND "waiting_for_family_since" IS NULL
      AND "waiting_for_family_until" IS NULL
      AND "clarification_expiry_driver_ref" IS NULL
    )
  )
  AND ("status" <> 'suppressed' OR ("suppressed_at" IS NOT NULL AND "suppression_reason" IS NOT NULL))
);

ALTER TABLE "nurture_interaction_context"
ADD CONSTRAINT "ck_nurture_interaction_context"
CHECK (
  "token_hash" ~ '^[0-9a-f]{64}$'
  AND ("host_conversation_ref_hash" IS NULL OR "host_conversation_ref_hash" ~ '^[0-9a-f]{64}$')
  AND "token_hash_version" = 1
  AND "payload_schema_version" > 0
  AND "version" >= 0
  AND (
    ("status" = 'consumed' AND "consumed_at" IS NOT NULL AND "revoked_at" IS NULL)
    OR ("status" = 'revoked' AND "revoked_at" IS NOT NULL)
    OR ("status" = 'active' AND "consumed_at" IS NULL AND "revoked_at" IS NULL)
  )
);

ALTER TABLE "nurture_child_media_attribution"
ADD CONSTRAINT "ck_nurture_media_attribution_confirmation"
CHECK (
  ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1))
  AND (
    "status" <> 'confirmed'
    OR (
      "confirmed_by_role_assignment_id" IS NOT NULL
      AND "confirmed_at" IS NOT NULL
      AND "exposure_policy_payload" IS NOT NULL
    )
  )
);

ALTER TABLE "nurture_command_execution"
ADD CONSTRAINT "ck_nurture_command_execution_n1"
CHECK (
  "command_request_id_hash" ~ '^[0-9a-f]{64}$'
  AND "origin_invocation_request_id_hash" ~ '^[0-9a-f]{64}$'
  AND ("parent_command_request_id_hash" IS NULL OR "parent_command_request_id_hash" ~ '^[0-9a-f]{64}$')
  AND "request_identity_hash_version" = 1
  AND "command_contract_version" > 0
  AND "payload_hash" ~ '^[0-9a-f]{64}$'
  AND "payload_canonicalization_version" = 1
  AND jsonb_typeof("output_refs") = 'array'
  AND ("target_refs" IS NULL OR jsonb_typeof("target_refs") = 'array')
  AND "handoff_snapshot_schema_version" = 1
  AND jsonb_typeof("handoff_request_snapshots_payload") = 'array'
  AND "handoff_request_snapshots_payload" = '[]'::jsonb
  AND "handoff_driver_ref" IS NULL
);

-- CreateIndex
CREATE INDEX "ix_nurture_participant_auth" ON "nurture_participant"("workspace_id", "my_chat_user_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_child_status" ON "nurture_child"("workspace_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ix_nurture_child_process_child" ON "nurture_child_care_process"("workspace_id", "child_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_child_process_status" ON "nurture_child_care_process"("workspace_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ix_nurture_family_process" ON "nurture_family"("workspace_id", "child_care_process_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_institution_status" ON "nurture_care_institution"("workspace_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ix_nurture_care_group_institution" ON "nurture_care_group"("workspace_id", "institution_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_enrollment_process" ON "nurture_enrollment"("workspace_id", "child_care_process_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_enrollment_group" ON "nurture_enrollment"("workspace_id", "care_group_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_role_participant" ON "nurture_care_role_assignment"("workspace_id", "participant_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_role_scope" ON "nurture_care_role_assignment"("workspace_id", "role", "scope_type", "scope_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_grant_process" ON "nurture_child_link_grant"("workspace_id", "child_care_process_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_grant_enrollment" ON "nurture_child_link_grant"("workspace_id", "enrollment_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_grant_target" ON "nurture_child_link_grant"("workspace_id", "granted_to_scope_type", "granted_to_scope_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_receipt_grant" ON "nurture_child_link_receipt"("workspace_id", "grant_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_receipt_retry" ON "nurture_child_link_receipt"("workspace_id", "retry_of_receipt_id");

-- CreateIndex
CREATE INDEX "ix_nurture_receipt_process" ON "nurture_child_link_receipt"("workspace_id", "child_care_process_id", "direction", "data_class", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_receipt_target" ON "nurture_child_link_receipt"("workspace_id", "target_scope_type", "target_scope_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_receipt_route" ON "nurture_child_link_receipt"("workspace_id", "direction", "source_type", "source_id", "routing_attempt_key");

-- CreateIndex
CREATE INDEX "ix_nurture_thread_process" ON "nurture_family_care_thread"("workspace_id", "child_care_process_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_thread_group" ON "nurture_family_care_thread"("workspace_id", "care_group_id", "status", "latest_message_at");

-- CreateIndex
CREATE INDEX "ix_nurture_thread_participant_actor" ON "nurture_family_care_thread_participant"("workspace_id", "participant_id", "visibility_status");

-- CreateIndex
CREATE INDEX "ix_nurture_thread_participant_thread" ON "nurture_family_care_thread_participant"("workspace_id", "thread_id", "visibility_status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_thread_participant" ON "nurture_family_care_thread_participant"("workspace_id", "thread_id", "participant_id", "role_assignment_id");

-- CreateIndex
CREATE INDEX "ix_nurture_message_thread" ON "nurture_family_care_message"("workspace_id", "thread_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_message_process" ON "nurture_family_care_message"("workspace_id", "child_care_process_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_message_sender" ON "nurture_family_care_message"("workspace_id", "sender_participant_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_message_source_item" ON "nurture_family_care_message"("workspace_id", "source_item_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_group" ON "nurture_family_care_item"("workspace_id", "care_group_id", "status", "urgency", "due_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_process" ON "nurture_family_care_item"("workspace_id", "child_care_process_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_thread" ON "nurture_family_care_item"("workspace_id", "thread_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_assignee" ON "nurture_family_care_item"("workspace_id", "assigned_to_role_assignment_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_event_item" ON "nurture_family_care_item_event"("workspace_id", "item_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_item_event_actor" ON "nurture_family_care_item_event"("workspace_id", "actor_participant_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_daily_log_group" ON "nurture_daily_care_log"("workspace_id", "care_group_id", "log_date", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_daily_log_process" ON "nurture_daily_care_log"("workspace_id", "child_care_process_id", "log_date", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_attention_group" ON "nurture_teacher_attention_item"("workspace_id", "care_group_id", "effective_date", "status", "priority");

-- CreateIndex
CREATE INDEX "ix_nurture_attention_process" ON "nurture_teacher_attention_item"("workspace_id", "child_care_process_id", "status", "effective_date");

-- CreateIndex
CREATE INDEX "ix_nurture_media_asset_institution" ON "nurture_media_asset_ref"("workspace_id", "institution_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_media_asset_group" ON "nurture_media_asset_ref"("workspace_id", "care_group_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_media_attribution_asset" ON "nurture_child_media_attribution"("workspace_id", "media_asset_ref_id", "status");

-- CreateIndex
CREATE INDEX "ix_nurture_media_attribution_process" ON "nurture_child_media_attribution"("workspace_id", "child_care_process_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_interaction_participant" ON "nurture_interaction_context"("workspace_id", "participant_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "ix_nurture_interaction_conversation" ON "nurture_interaction_context"("workspace_id", "host_conversation_ref_hash", "status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_interaction_token" ON "nurture_interaction_context"("workspace_id", "token_hash");

-- CreateIndex
CREATE INDEX "ix_nurture_command_execution_key" ON "nurture_command_execution"("workspace_id", "command_key", "committed_at");

-- CreateIndex
CREATE INDEX "ix_nurture_command_execution_process" ON "nurture_command_execution"("workspace_id", "child_care_process_id", "committed_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_command_execution_identity" ON "nurture_command_execution"("workspace_id", "command_request_id_hash");

-- AddForeignKey
ALTER TABLE "nurture_child_care_process" ADD CONSTRAINT "nurture_child_care_process_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "nurture_child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family" ADD CONSTRAINT "nurture_family_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_group" ADD CONSTRAINT "nurture_care_group_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_enrollment" ADD CONSTRAINT "nurture_enrollment_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_enrollment" ADD CONSTRAINT "nurture_enrollment_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_enrollment" ADD CONSTRAINT "nurture_enrollment_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_role_assignment" ADD CONSTRAINT "nurture_care_role_assignment_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_grant" ADD CONSTRAINT "nurture_child_link_grant_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_grant" ADD CONSTRAINT "nurture_child_link_grant_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_receipt" ADD CONSTRAINT "nurture_child_link_receipt_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_receipt" ADD CONSTRAINT "nurture_child_link_receipt_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_receipt" ADD CONSTRAINT "nurture_child_link_receipt_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_link_receipt" ADD CONSTRAINT "nurture_child_link_receipt_retry_of_receipt_id_fkey" FOREIGN KEY ("retry_of_receipt_id") REFERENCES "nurture_child_link_receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread" ADD CONSTRAINT "nurture_family_care_thread_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread" ADD CONSTRAINT "nurture_family_care_thread_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "nurture_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread" ADD CONSTRAINT "nurture_family_care_thread_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread" ADD CONSTRAINT "nurture_family_care_thread_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread_participant" ADD CONSTRAINT "nurture_family_care_thread_participant_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "nurture_family_care_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread_participant" ADD CONSTRAINT "nurture_family_care_thread_participant_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_thread_participant" ADD CONSTRAINT "nurture_family_care_thread_participant_role_assignment_id_fkey" FOREIGN KEY ("role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "nurture_family_care_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_sender_participant_id_fkey" FOREIGN KEY ("sender_participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_sender_role_assignment_id_fkey" FOREIGN KEY ("sender_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "nurture_family_care_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "nurture_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_assigned_to_role_assignment_id_fkey" FOREIGN KEY ("assigned_to_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item_event" ADD CONSTRAINT "nurture_family_care_item_event_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "nurture_family_care_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item_event" ADD CONSTRAINT "nurture_family_care_item_event_actor_participant_id_fkey" FOREIGN KEY ("actor_participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_recorded_by_role_assignment_id_fkey" FOREIGN KEY ("recorded_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_source_item_id_fkey" FOREIGN KEY ("source_item_id") REFERENCES "nurture_family_care_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_daily_care_log" ADD CONSTRAINT "nurture_daily_care_log_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_teacher_attention_item" ADD CONSTRAINT "nurture_teacher_attention_item_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_teacher_attention_item" ADD CONSTRAINT "nurture_teacher_attention_item_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_media_asset_ref" ADD CONSTRAINT "nurture_media_asset_ref_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_media_asset_ref" ADD CONSTRAINT "nurture_media_asset_ref_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_media_asset_ref" ADD CONSTRAINT "nurture_media_asset_ref_uploaded_by_role_assignment_id_fkey" FOREIGN KEY ("uploaded_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_media_attribution" ADD CONSTRAINT "nurture_child_media_attribution_media_asset_ref_id_fkey" FOREIGN KEY ("media_asset_ref_id") REFERENCES "nurture_media_asset_ref"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_media_attribution" ADD CONSTRAINT "nurture_child_media_attribution_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_media_attribution" ADD CONSTRAINT "nurture_child_media_attribution_confirmed_by_role_assignme_fkey" FOREIGN KEY ("confirmed_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_interaction_context" ADD CONSTRAINT "nurture_interaction_context_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_command_execution" ADD CONSTRAINT "nurture_command_execution_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
