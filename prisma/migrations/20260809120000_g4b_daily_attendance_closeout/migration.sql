-- G4-B increment 1 — the daily attendance closeout, frozen by 0D-1
-- (26-g4-0d-1-attendance-closeout-freeze.md).
--
-- Three tables. The two derived types 0D-1 names — attendance evidence and the
-- activity coverage projection — get none: both are read from rows that
-- already have owners, and persisting them would create a second copy that
-- drifts.

CREATE TYPE "NurtureAttendanceSubmissionState" AS ENUM ('submitted', 'reopened');

CREATE TYPE "NurtureAttendanceEntryState" AS ENUM (
  'present', 'absent', 'excused_absent', 'not_expected'
);

-- One row per class-day. The ABSENCE of a row is `unsubmitted`, so that state
-- is not a member of the enum: a value no row can hold is dead surface.
CREATE TABLE "nurture_daily_attendance_submission" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,
    "state" "NurtureAttendanceSubmissionState" NOT NULL,
    "submission_head" INTEGER NOT NULL DEFAULT 1,
    "watermark_source_kind" TEXT,
    "watermark_source_sequence" INTEGER,
    "submitted_by_role_assignment_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "reopened_by_role_assignment_id" TEXT,
    "reopened_at" TIMESTAMP(3),
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nurture_daily_attendance_submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nurture_attendance_entry" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "child_care_process_id" TEXT NOT NULL,
    "state" "NurtureAttendanceEntryState" NOT NULL,
    "adjusted_from_inference" BOOLEAN NOT NULL DEFAULT false,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurture_attendance_entry_pkey" PRIMARY KEY ("id")
);

-- Audit of a non-canonical run. It carries no attendance state, because 0D-1
-- forbids an inference from producing one; the check below enforces that the
-- run at least names the policy it ran under, so an unattributable inference
-- cannot be recorded.
CREATE TABLE "nurture_attendance_inference_run" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "local_date" DATE NOT NULL,
    "policy_version" TEXT NOT NULL,
    "evidence_refs_payload" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_attendance_inference_run_pkey" PRIMARY KEY ("id")
);

-- The concurrency rule at the storage layer: the second of two racing submits
-- loses here even if both read "no row" a moment earlier. Without it,
-- first-writer-wins would depend entirely on application timing.
CREATE UNIQUE INDEX "uq_nurture_attendance_submission_class_day"
  ON "nurture_daily_attendance_submission" ("workspace_id", "care_group_id", "local_date");

CREATE INDEX "ix_nurture_attendance_submission_class"
  ON "nurture_daily_attendance_submission" ("workspace_id", "care_group_id", "local_date", "state");

CREATE UNIQUE INDEX "uq_nurture_attendance_entry_child"
  ON "nurture_attendance_entry" ("workspace_id", "submission_id", "child_care_process_id");

CREATE INDEX "ix_nurture_attendance_entry_child"
  ON "nurture_attendance_entry" ("workspace_id", "child_care_process_id", "state");

CREATE INDEX "ix_nurture_attendance_inference_class"
  ON "nurture_attendance_inference_run" ("workspace_id", "care_group_id", "local_date");

-- Lifecycle completeness, enforced below the service layer in the same posture
-- as `ck_nurture_grant_scope`: a reopened row must name who reopened it and
-- when, exactly as a revoked grant must name its revoker.
ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "ck_nurture_attendance_reopen_lifecycle" CHECK (
  ("state" = 'reopened'
    AND "reopened_by_role_assignment_id" IS NOT NULL
    AND "reopened_at" IS NOT NULL)
  OR "state" <> 'reopened'
);

-- The head is monotonic and starts at 1. A row at 0 would be indistinguishable
-- from the `unsubmitted` a caller asserts with `expectedSubmissionHead: 0`.
ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "ck_nurture_attendance_submission_head" CHECK ("submission_head" >= 1);

-- A watermark is either fully present or fully absent. Half a watermark cannot
-- say where the preview cut.
ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "ck_nurture_attendance_watermark_pair" CHECK (
  ("watermark_source_kind" IS NULL AND "watermark_source_sequence" IS NULL)
  OR ("watermark_source_kind" IS NOT NULL AND "watermark_source_sequence" IS NOT NULL)
);

ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "nurture_daily_attendance_submission_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "nurture_daily_attendance_submission_submitted_by_fkey"
FOREIGN KEY ("submitted_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_daily_attendance_submission"
ADD CONSTRAINT "nurture_daily_attendance_submission_reopened_by_fkey"
FOREIGN KEY ("reopened_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_attendance_entry"
ADD CONSTRAINT "nurture_attendance_entry_submission_id_fkey"
FOREIGN KEY ("submission_id") REFERENCES "nurture_daily_attendance_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nurture_attendance_entry"
ADD CONSTRAINT "nurture_attendance_entry_child_care_process_id_fkey"
FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_attendance_inference_run"
ADD CONSTRAINT "nurture_attendance_inference_run_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
