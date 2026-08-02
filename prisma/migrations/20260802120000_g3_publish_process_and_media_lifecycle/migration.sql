-- T-006 Stage G3 — capture, publish process, publication and the one-time
-- media/attribution lifecycle migration.
--
-- Additive throughout: no existing fact family gains a second source. The two
-- in-place lifecycle replacements carry an explicit ambiguity gate rather than
-- guessing legacy rows into new terminal states.

-- CreateEnum
CREATE TYPE "NurtureMediaAssetLifecycle" AS ENUM ('preparing', 'ready', 'unavailable', 'discarded', 'redacted');

-- CreateEnum
CREATE TYPE "NurtureChildAttributionState" AS ENUM ('candidate', 'confirmed', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "NurtureCareCaptureBatchState" AS ENUM ('collecting', 'cut', 'organized', 'cancelled');

-- CreateEnum
CREATE TYPE "NurtureCareCaptureKind" AS ENUM ('text', 'voice_transcript', 'media');

-- CreateEnum
CREATE TYPE "NurtureCareCaptureOrganizeTrigger" AS ENUM ('manual', 'idle', 'daily_fallback');

-- CreateEnum
CREATE TYPE "NurturePublishProcessState" AS ENUM ('draft', 'needs_review', 'pending_release', 'released', 'cancelled');

-- CreateEnum
CREATE TYPE "NurtureContentSafetyRoute" AS ENUM ('ordinary', 'review_required', 'direct_interaction_required');

-- CreateEnum
CREATE TYPE "NurturePublicationVisibilityEventKind" AS ENUM ('correction', 'target_removal', 'redaction');

-- CreateEnum
CREATE TYPE "NurturePublicationVisibility" AS ENUM ('visible', 'removed', 'redacted');

-- AlterEnum
ALTER TYPE "NurtureChildLinkReceiptSourceType" ADD VALUE 'publication_release';

-- AlterEnum
ALTER TYPE "NurtureGrantDataClass" ADD VALUE 'child_growth_record';

-- DropForeignKey
ALTER TABLE "nurture_family_anchor_association" DROP CONSTRAINT "nurture_family_anchor_assoc_current_child_fkey";

-- DropIndex
DROP INDEX "ix_nurture_media_attribution_asset";

-- DropIndex
DROP INDEX "ix_nurture_media_attribution_process";

-- DropIndex
DROP INDEX "ix_nurture_media_asset_group";

-- DropIndex
DROP INDEX "ix_nurture_media_asset_institution";

-- ---------------------------------------------------------------------------
-- One-time, evidence-backed legacy migration
-- (06-g3-0-fact-contract-schema-freeze.md "DB SSOT Delta").
--
-- `active` and the three attribution states that survive are unambiguous.
-- Legacy `hidden`/`deleted` conflate "removed before any family saw it" with
-- "stopped showing after a family already had it", and `corrected` only means
-- superseded when the successor is actually known. Those rows are NOT guessed:
-- the migration gate below aborts and the census has to be resolved first.
-- ---------------------------------------------------------------------------

-- AlterTable: media asset gains its lifecycle and immutable original revision.
ALTER TABLE "nurture_media_asset_ref"
ADD COLUMN     "lifecycle" "NurtureMediaAssetLifecycle",
ADD COLUMN     "media_revision" INTEGER NOT NULL DEFAULT 1;

UPDATE "nurture_media_asset_ref"
SET "lifecycle" = 'ready'
WHERE "status" = 'active';

-- Ambiguity gate. A legacy hidden/deleted asset can only be mapped with release
-- evidence, which this baseline does not carry.
DO $$
DECLARE ambiguous BIGINT;
BEGIN
  SELECT count(*) INTO ambiguous
  FROM "nurture_media_asset_ref"
  WHERE "lifecycle" IS NULL;
  IF ambiguous > 0 THEN
    RAISE EXCEPTION
      'g3 media lifecycle migration gate: % legacy hidden/deleted media rows lack release evidence; resolve the pre-migration census before applying',
      ambiguous;
  END IF;
END $$;

ALTER TABLE "nurture_media_asset_ref" ALTER COLUMN "lifecycle" SET NOT NULL;
ALTER TABLE "nurture_media_asset_ref" DROP COLUMN "status";

-- AlterTable: attribution gains its state, immutable revision and supersession.
ALTER TABLE "nurture_child_media_attribution"
ADD COLUMN     "state" "NurtureChildAttributionState",
ADD COLUMN     "attribution_revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "superseded_by_attribution_id" TEXT,
ADD COLUMN     "evidence_payload" JSONB;

UPDATE "nurture_child_media_attribution"
SET "state" = "status"::text::"NurtureChildAttributionState"
WHERE "status" IN ('candidate', 'confirmed', 'rejected');

-- Ambiguity gate. `corrected` needs its supersession link; `hidden`/`deleted`
-- need an explicit resolution. Neither is inferred here.
DO $$
DECLARE ambiguous BIGINT;
BEGIN
  SELECT count(*) INTO ambiguous
  FROM "nurture_child_media_attribution"
  WHERE "state" IS NULL;
  IF ambiguous > 0 THEN
    RAISE EXCEPTION
      'g3 attribution state migration gate: % legacy corrected/hidden/deleted attribution rows lack resolution evidence; resolve the pre-migration census before applying',
      ambiguous;
  END IF;
END $$;

ALTER TABLE "nurture_child_media_attribution" ALTER COLUMN "state" SET NOT NULL;
ALTER TABLE "nurture_child_media_attribution" DROP COLUMN "status";

-- DropEnum
DROP TYPE "NurtureMediaAssetStatus";

-- DropEnum
DROP TYPE "NurtureMediaAttributionStatus";

-- CreateTable
CREATE TABLE "nurture_focus_goal_child_scope" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "focus_goal_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "scope_version" INTEGER NOT NULL DEFAULT 1,
    "provenance_payload" JSONB,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_focus_goal_child_scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_care_capture" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "capture_batch_id" TEXT,
    "captured_by_role_assignment_id" TEXT NOT NULL,
    "kind" "NurtureCareCaptureKind" NOT NULL,
    "source_sequence" INTEGER NOT NULL,
    "stable" BOOLEAN NOT NULL DEFAULT false,
    "body_protection_payload" JSONB,
    "transcript_revision" TEXT,
    "media_asset_ref_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_care_capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_care_capture_batch" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "state" "NurtureCareCaptureBatchState" NOT NULL,
    "resolved_trigger" "NurtureCareCaptureOrganizeTrigger",
    "trigger_request_id" TEXT,
    "policy_ref" TEXT,
    "policy_head" INTEGER,
    "time_zone" TEXT,
    "quiescence_seconds" INTEGER,
    "observed_user_activity_at" TIMESTAMP(3),
    "watermark_source_sequence" INTEGER,
    "cut_at" TIMESTAMP(3),
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_care_capture_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publish_process" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "capture_batch_id" TEXT,
    "process_key" TEXT NOT NULL,
    "state" "NurturePublishProcessState" NOT NULL,
    "data_class" "NurtureGrantDataClass" NOT NULL,
    "purpose_key" TEXT NOT NULL,
    "current_revision_id" TEXT,
    "frozen_revision_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "not_after" TIMESTAMP(3),
    "schedule_time_zone" TEXT,
    "schedule_policy_ref" TEXT,
    "schedule_policy_head" INTEGER,
    "authorizing_role_assignment_id" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_publish_process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publish_process_revision" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publish_process_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "content_digest" TEXT NOT NULL,
    "organizer_input_revision" TEXT NOT NULL,
    "template_key" TEXT,
    "template_version" TEXT,
    "title_protection_payload" JSONB,
    "body_protection_payload" JSONB,
    "media_composition_payload" JSONB,
    "source_refs_payload" JSONB,
    "saved_by_role_assignment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_publish_process_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publish_process_target" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publish_process_id" TEXT NOT NULL,
    "target_key" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "family_ref_key" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_publish_process_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publish_edit_hold" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publish_process_id" TEXT NOT NULL,
    "holder_role_assignment_id" TEXT NOT NULL,
    "holder_participant_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_publish_edit_hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_content_safety_assessment" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publish_process_id" TEXT NOT NULL,
    "route" "NurtureContentSafetyRoute" NOT NULL,
    "policy_ref" TEXT NOT NULL,
    "policy_head" INTEGER NOT NULL,
    "rule_revision" TEXT NOT NULL,
    "provider_revision" TEXT,
    "model_revision" TEXT,
    "prompt_policy_revision" TEXT,
    "risk_codes_payload" JSONB NOT NULL,
    "source_heads_payload" JSONB NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_content_safety_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publication_release" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publish_process_id" TEXT NOT NULL,
    "publish_process_target_id" TEXT NOT NULL,
    "publish_process_revision_id" TEXT NOT NULL,
    "released_by_role_assignment_id" TEXT NOT NULL,
    "command_request_id_hash" TEXT NOT NULL,
    "receipt_id" TEXT,
    "visibility" "NurturePublicationVisibility" NOT NULL DEFAULT 'visible',
    "committed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_publication_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_publication_visibility_event" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "publication_release_id" TEXT NOT NULL,
    "kind" "NurturePublicationVisibilityEventKind" NOT NULL,
    "reason_key" TEXT NOT NULL,
    "actor_role_assignment_id" TEXT NOT NULL,
    "source_release_revision" INTEGER NOT NULL,
    "body_protection_payload" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_publication_visibility_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_nurture_focus_goal_scope_process" ON "nurture_focus_goal_child_scope"("workspace_id", "child_care_process_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_focus_goal_child_scope" ON "nurture_focus_goal_child_scope"("workspace_id", "focus_goal_id", "child_care_process_id");

-- CreateIndex
CREATE INDEX "ix_nurture_care_capture_group" ON "nurture_care_capture"("workspace_id", "care_group_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_care_capture_sequence" ON "nurture_care_capture"("workspace_id", "capture_batch_id", "source_sequence");

-- CreateIndex
CREATE INDEX "ix_nurture_care_capture_batch_group" ON "nurture_care_capture_batch"("workspace_id", "care_group_id", "state", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_care_capture_batch_trigger" ON "nurture_care_capture_batch"("workspace_id", "care_group_id", "trigger_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "nurture_publish_process_current_revision_id_key" ON "nurture_publish_process"("current_revision_id");

-- CreateIndex
CREATE INDEX "ix_nurture_publish_process_group" ON "nurture_publish_process"("workspace_id", "care_group_id", "state", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publish_process_key" ON "nurture_publish_process"("workspace_id", "process_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publish_revision" ON "nurture_publish_process_revision"("workspace_id", "publish_process_id", "revision");

-- CreateIndex
CREATE INDEX "ix_nurture_publish_target_process" ON "nurture_publish_process_target"("workspace_id", "child_care_process_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publish_target_key" ON "nurture_publish_process_target"("workspace_id", "publish_process_id", "target_key");

-- CreateIndex
CREATE UNIQUE INDEX "nurture_publish_edit_hold_publish_process_id_key" ON "nurture_publish_edit_hold"("publish_process_id");

-- CreateIndex
CREATE INDEX "ix_nurture_publish_edit_hold_expiry" ON "nurture_publish_edit_hold"("workspace_id", "expires_at");

-- CreateIndex
CREATE INDEX "ix_nurture_content_safety_process" ON "nurture_content_safety_assessment"("workspace_id", "publish_process_id", "assessed_at");

-- CreateIndex
CREATE UNIQUE INDEX "nurture_publication_release_publish_process_target_id_key" ON "nurture_publication_release"("publish_process_target_id");

-- CreateIndex
CREATE INDEX "ix_nurture_publication_release_process" ON "nurture_publication_release"("workspace_id", "publish_process_id", "committed_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publication_release_command" ON "nurture_publication_release"("workspace_id", "publish_process_id", "command_request_id_hash", "publish_process_target_id");

-- CreateIndex
CREATE INDEX "ix_nurture_publication_visibility_release" ON "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ix_nurture_media_attribution_asset" ON "nurture_child_media_attribution"("workspace_id", "media_asset_ref_id", "state");

-- CreateIndex
CREATE INDEX "ix_nurture_media_attribution_process" ON "nurture_child_media_attribution"("workspace_id", "child_care_process_id", "state", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_media_attribution_revision" ON "nurture_child_media_attribution"("workspace_id", "media_asset_ref_id", "child_care_process_id", "attribution_revision");

-- CreateIndex
CREATE INDEX "ix_nurture_media_asset_institution" ON "nurture_media_asset_ref"("workspace_id", "institution_id", "lifecycle", "created_at");

-- CreateIndex
CREATE INDEX "ix_nurture_media_asset_group" ON "nurture_media_asset_ref"("workspace_id", "care_group_id", "lifecycle", "created_at");

-- RenameForeignKey
ALTER TABLE "nurture_child_anchor_association" RENAME CONSTRAINT "nurture_child_anchor_assoc_anchor_fkey" TO "nurture_child_anchor_association_child_anchor_id_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_child_anchor_association" RENAME CONSTRAINT "nurture_child_anchor_assoc_child_fkey" TO "nurture_child_anchor_association_workspace_id_child_id_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_family_anchor_association" RENAME CONSTRAINT "nurture_family_anchor_assoc_child_anchor_fkey" TO "nurture_family_anchor_association_child_anchor_id_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_family_anchor_association" RENAME CONSTRAINT "nurture_family_anchor_assoc_child_assoc_fkey" TO "nurture_family_anchor_association_child_association_id_wor_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_family_anchor_association" RENAME CONSTRAINT "nurture_family_anchor_assoc_family_anchor_fkey" TO "nurture_family_anchor_association_family_anchor_id_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_family_anchor_association" RENAME CONSTRAINT "nurture_family_anchor_assoc_family_fkey" TO "nurture_family_anchor_association_workspace_id_family_id_c_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_family_anchor_association" RENAME CONSTRAINT "nurture_family_anchor_assoc_process_fkey" TO "nurture_family_anchor_association_workspace_id_child_care__fkey";

-- RenameForeignKey
ALTER TABLE "nurture_scenario_binding_authorization" RENAME CONSTRAINT "nurture_binding_auth_child_anchor_fkey" TO "nurture_scenario_binding_authorization_child_anchor_id_fkey";

-- RenameForeignKey
ALTER TABLE "nurture_scenario_binding_authorization" RENAME CONSTRAINT "nurture_binding_auth_family_anchor_fkey" TO "nurture_scenario_binding_authorization_family_anchor_id_fkey";

-- AddForeignKey
ALTER TABLE "nurture_family_anchor_association" ADD CONSTRAINT "nurture_family_anchor_association_current_child_associatio_fkey" FOREIGN KEY ("current_child_association_id", "current_key") REFERENCES "nurture_child_anchor_association"("id", "current_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_child_media_attribution" ADD CONSTRAINT "nurture_child_media_attribution_superseded_by_attribution__fkey" FOREIGN KEY ("superseded_by_attribution_id") REFERENCES "nurture_child_media_attribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_focus_goal_child_scope" ADD CONSTRAINT "nurture_focus_goal_child_scope_focus_goal_id_fkey" FOREIGN KEY ("focus_goal_id") REFERENCES "nurture_focus_goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_focus_goal_child_scope" ADD CONSTRAINT "nurture_focus_goal_child_scope_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_capture" ADD CONSTRAINT "nurture_care_capture_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_capture" ADD CONSTRAINT "nurture_care_capture_capture_batch_id_fkey" FOREIGN KEY ("capture_batch_id") REFERENCES "nurture_care_capture_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_capture" ADD CONSTRAINT "nurture_care_capture_captured_by_role_assignment_id_fkey" FOREIGN KEY ("captured_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_capture" ADD CONSTRAINT "nurture_care_capture_media_asset_ref_id_fkey" FOREIGN KEY ("media_asset_ref_id") REFERENCES "nurture_media_asset_ref"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_care_capture_batch" ADD CONSTRAINT "nurture_care_capture_batch_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process" ADD CONSTRAINT "nurture_publish_process_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process" ADD CONSTRAINT "nurture_publish_process_capture_batch_id_fkey" FOREIGN KEY ("capture_batch_id") REFERENCES "nurture_care_capture_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process" ADD CONSTRAINT "nurture_publish_process_current_revision_id_fkey" FOREIGN KEY ("current_revision_id") REFERENCES "nurture_publish_process_revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process_revision" ADD CONSTRAINT "nurture_publish_process_revision_publish_process_id_fkey" FOREIGN KEY ("publish_process_id") REFERENCES "nurture_publish_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process_target" ADD CONSTRAINT "nurture_publish_process_target_publish_process_id_fkey" FOREIGN KEY ("publish_process_id") REFERENCES "nurture_publish_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process_target" ADD CONSTRAINT "nurture_publish_process_target_child_care_process_id_fkey" FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process_target" ADD CONSTRAINT "nurture_publish_process_target_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_process_target" ADD CONSTRAINT "nurture_publish_process_target_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "nurture_child_link_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_edit_hold" ADD CONSTRAINT "nurture_publish_edit_hold_publish_process_id_fkey" FOREIGN KEY ("publish_process_id") REFERENCES "nurture_publish_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publish_edit_hold" ADD CONSTRAINT "nurture_publish_edit_hold_holder_role_assignment_id_fkey" FOREIGN KEY ("holder_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_content_safety_assessment" ADD CONSTRAINT "nurture_content_safety_assessment_publish_process_id_fkey" FOREIGN KEY ("publish_process_id") REFERENCES "nurture_publish_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_release" ADD CONSTRAINT "nurture_publication_release_publish_process_id_fkey" FOREIGN KEY ("publish_process_id") REFERENCES "nurture_publish_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_release" ADD CONSTRAINT "nurture_publication_release_publish_process_target_id_fkey" FOREIGN KEY ("publish_process_target_id") REFERENCES "nurture_publish_process_target"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_release" ADD CONSTRAINT "nurture_publication_release_publish_process_revision_id_fkey" FOREIGN KEY ("publish_process_revision_id") REFERENCES "nurture_publish_process_revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_release" ADD CONSTRAINT "nurture_publication_release_released_by_role_assignment_id_fkey" FOREIGN KEY ("released_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_release" ADD CONSTRAINT "nurture_publication_release_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "nurture_child_link_receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_visibility_event" ADD CONSTRAINT "nurture_publication_visibility_event_publication_release_i_fkey" FOREIGN KEY ("publication_release_id") REFERENCES "nurture_publication_release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

