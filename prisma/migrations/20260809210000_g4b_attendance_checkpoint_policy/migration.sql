-- G4-B 0D-1 — canonical exact-class attendance closeout checkpoint policy.
--
-- The support signal continues to store no deadline. Its owner resolves the
-- configured wall clock below to one class/date instant at read time.

CREATE TABLE "nurture_attendance_closeout_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "care_group_id" TEXT NOT NULL,
    "contract_version" TEXT NOT NULL,
    "policy_ref" TEXT NOT NULL,
    "policy_revision" INTEGER NOT NULL,
    "checkpoint_local_time" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "changed_by_role_assignment_id" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_attendance_closeout_policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nurture_attendance_closeout_policy_revision"
  ON "nurture_attendance_closeout_policy"
  ("workspace_id", "care_group_id", "policy_revision");

CREATE INDEX "ix_nurture_attendance_closeout_policy_effective"
  ON "nurture_attendance_closeout_policy"
  ("workspace_id", "institution_id", "care_group_id", "effective_from", "effective_to");

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "ck_nurture_attendance_closeout_policy_revision"
CHECK ("policy_revision" >= 1);

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "ck_nurture_attendance_closeout_policy_local_time"
CHECK ("checkpoint_local_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "ck_nurture_attendance_closeout_policy_effective_window"
CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from");

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "ck_nurture_attendance_closeout_policy_nonempty"
CHECK (
  length(btrim("contract_version")) > 0
  AND length(btrim("policy_ref")) > 0
  AND length(btrim("change_reason")) > 0
);

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "nurture_attendance_closeout_policy_institution_id_fkey"
FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "nurture_attendance_closeout_policy_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_attendance_closeout_policy"
ADD CONSTRAINT "nurture_attendance_closeout_policy_changed_by_role_assignment_id_fkey"
FOREIGN KEY ("changed_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
