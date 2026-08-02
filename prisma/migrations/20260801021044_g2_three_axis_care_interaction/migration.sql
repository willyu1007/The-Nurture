-- CreateEnum
CREATE TYPE "NurtureFamilyCareAcknowledgementState" AS ENUM ('pending', 'acknowledged');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareResponseState" AS ENUM ('awaiting_reply', 'responded', 'not_applicable');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareLifecycleState" AS ENUM ('active', 'closed', 'suppressed');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareLifecycleReason" AS ENUM ('family_withdrawn', 'grant_revoked', 'source_redacted', 'expired');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareWriterContract" AS ENUM ('legacy_v1', 'legacy_migrated_v1', 'harness_g2_v1');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareCorrectionStatus" AS ENUM ('active', 'redacted');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareCascadeScope" AS ENUM ('source_question', 'reply_local');

-- CreateEnum
CREATE TYPE "NurtureFamilyCareCascadeClosureState" AS ENUM ('complete', 'failed');

-- AlterEnum
ALTER TYPE "NurtureFamilyCareMessageKind" ADD VALUE 'caregiver_direct_message';

-- AlterEnum
ALTER TYPE "NurtureGrantDataClass" ADD VALUE 'direct_care_communication';

-- AlterEnum
ALTER TYPE "NurtureInteractionPurpose" ADD VALUE 'prepare_action';

-- AlterTable
ALTER TABLE "nurture_command_execution" ADD COLUMN     "committed_result_payload" JSONB,
ADD COLUMN     "result_schema_version" INTEGER;

-- AlterTable
ALTER TABLE "nurture_family_care_item" ADD COLUMN     "acked_by_role_assignment_id" TEXT,
ADD COLUMN     "acknowledgement_head" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "acknowledgement_state" "NurtureFamilyCareAcknowledgementState" NOT NULL DEFAULT 'pending',
ADD COLUMN     "context_continuation_of_item_id" TEXT,
ADD COLUMN     "lifecycle_head" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lifecycle_reason" "NurtureFamilyCareLifecycleReason",
ADD COLUMN     "lifecycle_state" "NurtureFamilyCareLifecycleState" NOT NULL DEFAULT 'active',
ADD COLUMN     "response_head" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "response_state" "NurtureFamilyCareResponseState" NOT NULL DEFAULT 'awaiting_reply',
ADD COLUMN     "writer_contract" "NurtureFamilyCareWriterContract" NOT NULL DEFAULT 'legacy_v1';

-- AlterTable
ALTER TABLE "nurture_family_care_message" ADD COLUMN     "care_group_id" TEXT,
ADD COLUMN     "direction" "NurtureGrantDirection",
ADD COLUMN     "enrollment_id" TEXT,
ADD COLUMN     "reply_order_key" TEXT,
ADD COLUMN     "writer_contract" "NurtureFamilyCareWriterContract" NOT NULL DEFAULT 'legacy_v1';

-- CreateTable
CREATE TABLE "nurture_family_care_message_correction" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "correction_version" INTEGER NOT NULL,
    "author_participant_id" TEXT NOT NULL,
    "author_role_assignment_id" TEXT NOT NULL,
    "body_storage_mode" "NurtureFamilyCareMessageBodyStorageMode" NOT NULL,
    "body_protection_payload" JSONB,
    "status" "NurtureFamilyCareCorrectionStatus" NOT NULL,
    "command_execution_id" TEXT,
    "receipt_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_family_care_message_correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurture_family_care_cascade_audit" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "root_message_id" TEXT NOT NULL,
    "cascade_scope" "NurtureFamilyCareCascadeScope" NOT NULL,
    "closure_state" "NurtureFamilyCareCascadeClosureState" NOT NULL,
    "affected_refs_payload" JSONB NOT NULL,
    "command_execution_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_family_care_cascade_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_nurture_correction_message" ON "nurture_family_care_message_correction"("workspace_id", "message_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_correction_head" ON "nurture_family_care_message_correction"("workspace_id", "message_id", "correction_version");

-- CreateIndex
CREATE INDEX "ix_nurture_cascade_audit_root" ON "nurture_family_care_cascade_audit"("workspace_id", "root_message_id", "created_at");

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "nurture_enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message" ADD CONSTRAINT "nurture_family_care_message_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_acked_by_role_assignment_id_fkey" FOREIGN KEY ("acked_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_item" ADD CONSTRAINT "nurture_family_care_item_context_continuation_of_item_id_fkey" FOREIGN KEY ("context_continuation_of_item_id") REFERENCES "nurture_family_care_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message_correction" ADD CONSTRAINT "nurture_family_care_message_correction_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "nurture_family_care_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message_correction" ADD CONSTRAINT "nurture_family_care_message_correction_author_participant__fkey" FOREIGN KEY ("author_participant_id") REFERENCES "nurture_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message_correction" ADD CONSTRAINT "nurture_family_care_message_correction_author_role_assignm_fkey" FOREIGN KEY ("author_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message_correction" ADD CONSTRAINT "nurture_family_care_message_correction_command_execution_i_fkey" FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_message_correction" ADD CONSTRAINT "nurture_family_care_message_correction_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "nurture_child_link_receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_cascade_audit" ADD CONSTRAINT "nurture_family_care_cascade_audit_root_message_id_fkey" FOREIGN KEY ("root_message_id") REFERENCES "nurture_family_care_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_family_care_cascade_audit" ADD CONSTRAINT "nurture_family_care_cascade_audit_command_execution_id_fkey" FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- G2 frozen guards — dev-docs/archive/nurture-family-care-conversation/10-g2-schema-freeze.md (D2/D3/D6).
-- Harness rows must carry the complete original scope; protected bodies never
-- persist as plaintext; reply order is immutable and unique per item.
ALTER TABLE "nurture_family_care_item"
  ADD CONSTRAINT "ck_nurture_item_g2_complete_graph"
  CHECK (
    "writer_contract" <> 'harness_g2_v1'
    OR ("source_message_id" IS NOT NULL AND "enrollment_id" IS NOT NULL AND "grant_id" IS NOT NULL)
  );

ALTER TABLE "nurture_family_care_item"
  ADD CONSTRAINT "ck_nurture_item_lifecycle_reason"
  CHECK ("lifecycle_reason" IS NULL OR "lifecycle_state" IN ('closed', 'suppressed'));

ALTER TABLE "nurture_family_care_message"
  ADD CONSTRAINT "ck_nurture_message_g2_scope"
  CHECK (
    "writer_contract" <> 'harness_g2_v1'
    OR ("enrollment_id" IS NOT NULL AND "care_group_id" IS NOT NULL AND "direction" IS NOT NULL)
  );

ALTER TABLE "nurture_family_care_message"
  ADD CONSTRAINT "ck_nurture_message_g2_protected_body"
  CHECK (
    "writer_contract" <> 'harness_g2_v1'
    OR ("body" IS NULL AND "body_storage_mode" <> 'plain_text_dev')
  );

ALTER TABLE "nurture_family_care_message"
  ADD CONSTRAINT "ck_nurture_message_g2_reply_order"
  CHECK (
    NOT ("writer_contract" = 'harness_g2_v1' AND "message_kind" = 'caregiver_reply')
    OR "reply_order_key" IS NOT NULL
  );

CREATE UNIQUE INDEX "uq_nurture_reply_order"
  ON "nurture_family_care_message" ("workspace_id", "source_item_id", "reply_order_key")
  WHERE "message_kind" = 'caregiver_reply';
