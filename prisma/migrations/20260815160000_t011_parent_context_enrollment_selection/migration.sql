CREATE TABLE "nurture_parent_context_enrollment_selection" (
    "workspace_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 1,
    "selected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_parent_context_selection_pkey"
      PRIMARY KEY ("workspace_id", "child_care_process_id")
);

CREATE INDEX "ix_nurture_parent_context_selection_enrollment"
  ON "nurture_parent_context_enrollment_selection"("workspace_id", "enrollment_id");

ALTER TABLE "nurture_parent_context_enrollment_selection"
  ADD CONSTRAINT "nurture_parent_context_selection_process_fkey"
  FOREIGN KEY ("workspace_id", "child_care_process_id")
  REFERENCES "nurture_child_care_process"("workspace_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_parent_context_enrollment_selection"
  ADD CONSTRAINT "nurture_parent_context_selection_enrollment_fkey"
  FOREIGN KEY ("workspace_id", "child_care_process_id", "enrollment_id")
  REFERENCES "nurture_enrollment"("workspace_id", "child_care_process_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill only an unambiguous current Enrollment. Prefer the unique formal
-- Enrollment; otherwise accept the sole active Enrollment. Multiple formal,
-- or multiple candidates without one unique formal, remain unselected.
WITH eligible AS (
  SELECT
    "workspace_id",
    "child_care_process_id",
    "id",
    "participation_phase"
  FROM "nurture_enrollment"
  WHERE "status" = 'active'
    AND "deleted_at" IS NULL
    AND ("left_at" IS NULL OR "left_at" > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'))
), candidates AS (
  SELECT
    "workspace_id",
    "child_care_process_id",
    CASE
      WHEN COUNT(*) FILTER (WHERE "participation_phase" = 'formal') = 1
        THEN MIN("id") FILTER (WHERE "participation_phase" = 'formal')
      WHEN COUNT(*) = 1 THEN MIN("id")
      ELSE NULL
    END AS "enrollment_id"
  FROM eligible
  GROUP BY "workspace_id", "child_care_process_id"
)
INSERT INTO "nurture_parent_context_enrollment_selection" (
  "workspace_id",
  "child_care_process_id",
  "enrollment_id",
  "aggregate_version",
  "selected_at",
  "updated_at"
)
SELECT
  "workspace_id",
  "child_care_process_id",
  "enrollment_id",
  1,
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
FROM candidates
WHERE "enrollment_id" IS NOT NULL;
