-- Closes the four schema gaps that block the write lane (B8 prerequisites).
--
-- 1. `nurture_content_safety_assessment.publish_process_id` was NOT NULL, but
--    the `direct_interaction_required` route deliberately creates no publication
--    candidate — so the single most safety-relevant routing decision had nowhere
--    to be recorded. The column becomes nullable and the row gains an anchor
--    that does not depend on a process.
-- 2. `nurture_publish_process_revision` had no command identity, so the draft
--    replay lookup searched `organizer_input_revision` — a column that carries
--    the assembler's input revision — by command id, and could never match.
-- 3. `nurture_publication_visibility_event` could not name the command behind
--    it and had no unique constraint, so a replayed correction appended twice.
-- 4. `nurture_publish_process` had no frozen policy version or resolution
--    instant, so `aggregateVersion` and `updatedAt` were standing in for them —
--    and a reschedule moves both.
--
-- The two new NOT NULL columns are backfilled from the process each existing row
-- already points at, and a census aborts the migration rather than inventing an
-- anchor for a row that cannot supply one.

-- AlterTable
ALTER TABLE "nurture_content_safety_assessment" ADD COLUMN     "care_group_id" TEXT,
ADD COLUMN     "organizer_input_revision" TEXT,
ALTER COLUMN "publish_process_id" DROP NOT NULL;

-- Every existing assessment has a process, so both anchor values are derivable
-- from it: the CareGroup directly, the organizer input revision from the
-- revision the process currently points at.
UPDATE "nurture_content_safety_assessment" AS a
SET "care_group_id" = p."care_group_id"
FROM "nurture_publish_process" AS p
WHERE a."publish_process_id" = p."id";

UPDATE "nurture_content_safety_assessment" AS a
SET "organizer_input_revision" = r."organizer_input_revision"
FROM "nurture_publish_process" AS p
JOIN "nurture_publish_process_revision" AS r ON r."id" = p."current_revision_id"
WHERE a."publish_process_id" = p."id";

DO $$
DECLARE unanchored BIGINT;
BEGIN
  SELECT count(*) INTO unanchored
  FROM "nurture_content_safety_assessment"
  WHERE "care_group_id" IS NULL OR "organizer_input_revision" IS NULL;
  IF unanchored > 0 THEN
    RAISE EXCEPTION
      'g3 content safety anchor migration gate: % assessment rows cannot be anchored from their process; resolve the pre-migration census before applying',
      unanchored;
  END IF;
END $$;

ALTER TABLE "nurture_content_safety_assessment"
ALTER COLUMN "care_group_id" SET NOT NULL,
ALTER COLUMN "organizer_input_revision" SET NOT NULL;

-- AlterTable
ALTER TABLE "nurture_publication_visibility_event" ADD COLUMN     "command_execution_id" TEXT;

-- AlterTable
ALTER TABLE "nurture_publish_process" ADD COLUMN     "schedule_policy_version" INTEGER,
ADD COLUMN     "schedule_resolved_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "nurture_publish_process_revision" ADD COLUMN     "command_request_id_hash" CHAR(64);

-- CreateIndex
CREATE INDEX "ix_nurture_content_safety_anchor" ON "nurture_content_safety_assessment"("workspace_id", "care_group_id", "organizer_input_revision");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publication_visibility_command" ON "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "command_execution_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_publish_revision_command" ON "nurture_publish_process_revision"("workspace_id", "publish_process_id", "command_request_id_hash");

-- AddForeignKey
ALTER TABLE "nurture_content_safety_assessment" ADD CONSTRAINT "nurture_content_safety_assessment_care_group_id_fkey" FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurture_publication_visibility_event" ADD CONSTRAINT "nurture_publication_visibility_event_command_execution_id_fkey" FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

