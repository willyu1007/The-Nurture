-- G4-B 0D-5 — versioned Institution support-signal policy.
--
-- Signals themselves are request-composed and intentionally get no table.
-- Persisting them would create a second resolved/closed truth and a covert
-- historical performance record.

CREATE TYPE "NurtureInstitutionSupportSignalCategory" AS ENUM (
  'attendance_submission_overdue',
  'business_response_overdue',
  'review_backlog_threshold',
  'authority_or_source_blocked',
  'work_item_or_workflow_blocked',
  'configured_load_threshold',
  'ai_attention_candidate'
);

CREATE TABLE "nurture_institution_support_signal_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "care_group_id" TEXT,
    "contract_version" TEXT NOT NULL,
    "policy_ref" TEXT NOT NULL,
    "category" "NurtureInstitutionSupportSignalCategory" NOT NULL,
    "absolute_threshold" INTEGER,
    "window_key" TEXT NOT NULL,
    "checkpoint_ref" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "policy_revision" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "changed_by_role_assignment_id" TEXT NOT NULL,
    "change_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_institution_support_signal_policy_pkey" PRIMARY KEY ("id")
);

-- PostgreSQL treats NULLs as distinct in ordinary unique indexes. The split
-- indexes make the Institution default and each class override independently
-- revision-monotonic without a second synthetic scope column.
CREATE UNIQUE INDEX "uq_nurture_support_signal_policy_institution_revision"
  ON "nurture_institution_support_signal_policy"
  ("workspace_id", "institution_id", "category", "policy_revision")
  WHERE "care_group_id" IS NULL;

CREATE UNIQUE INDEX "uq_nurture_support_signal_policy_class_revision"
  ON "nurture_institution_support_signal_policy"
  ("workspace_id", "institution_id", "care_group_id", "category", "policy_revision")
  WHERE "care_group_id" IS NOT NULL;

CREATE INDEX "ix_nurture_support_signal_policy_effective"
  ON "nurture_institution_support_signal_policy"
  ("workspace_id", "institution_id", "category", "effective_from", "effective_to");

CREATE INDEX "ix_nurture_support_signal_policy_class_effective"
  ON "nurture_institution_support_signal_policy"
  ("workspace_id", "care_group_id", "category", "effective_from", "effective_to");

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "ck_nurture_support_signal_policy_revision"
CHECK ("policy_revision" >= 1);

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "ck_nurture_support_signal_policy_threshold"
CHECK (
  (
    "category" IN ('review_backlog_threshold', 'configured_load_threshold')
    AND "absolute_threshold" IS NOT NULL
    AND "absolute_threshold" >= 1
  )
  OR (
    "category" NOT IN ('review_backlog_threshold', 'configured_load_threshold')
    AND "absolute_threshold" IS NULL
  )
);

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "ck_nurture_support_signal_policy_effective_window"
CHECK ("effective_to" IS NULL OR "effective_to" > "effective_from");

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "ck_nurture_support_signal_policy_nonempty"
CHECK (
  length(btrim("contract_version")) > 0
  AND length(btrim("policy_ref")) > 0
  AND length(btrim("window_key")) > 0
  AND length(btrim("checkpoint_ref")) > 0
  AND length(btrim("change_reason")) > 0
);

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "nurture_support_signal_policy_institution_id_fkey"
FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "nurture_support_signal_policy_care_group_id_fkey"
FOREIGN KEY ("care_group_id") REFERENCES "nurture_care_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_institution_support_signal_policy"
ADD CONSTRAINT "nurture_support_signal_policy_changed_by_role_assignment_id_fkey"
FOREIGN KEY ("changed_by_role_assignment_id") REFERENCES "nurture_care_role_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
