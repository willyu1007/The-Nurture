-- T-007 exact-Institution publication-policy provider consumed by T-006.
--
-- The table is append-only version history. Absence, overlap, an unsupported
-- contract ref or invalid values all remain dependency-unavailable at the read
-- port; no device/client value and no JSON fallback becomes authority.

BEGIN;

-- Abort before any DDL if a historical process cannot satisfy the new complete
-- schedule invariant. The migration never invents a policy version or
-- resolution instant from mutable aggregate metadata.
DO $$
DECLARE partial_schedules BIGINT;
BEGIN
  SELECT count(*) INTO partial_schedules
  FROM "nurture_publish_process"
  WHERE num_nonnulls(
    "scheduled_at",
    "not_after",
    "schedule_time_zone",
    "schedule_policy_ref",
    "schedule_policy_head",
    "schedule_policy_version",
    "schedule_resolved_at"
  ) NOT IN (0, 7);
  IF partial_schedules > 0 THEN
    RAISE EXCEPTION
      't007 publication policy migration gate: % publish processes carry a partial seven-field schedule; repair or remove those rows before applying',
      partial_schedules;
  END IF;
END $$;

CREATE TABLE "nurture_institution_publication_policy" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "policy_ref" TEXT NOT NULL,
    "policy_version" INTEGER NOT NULL,
    "policy_head" INTEGER NOT NULL,
    "time_zone" TEXT NOT NULL,
    "default_release_local_time" TEXT NOT NULL,
    "retry_cutoff_local_time" TEXT NOT NULL,
    "organize_idle_seconds" INTEGER NOT NULL,
    "organize_fallback_lead_seconds" INTEGER NOT NULL,
    "automatic_quiescence_seconds" INTEGER NOT NULL,
    "capture_activity_lease_seconds" INTEGER NOT NULL,
    "automatic_organize_enabled" BOOLEAN NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "superseded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurture_institution_publication_policy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ck_nurture_publication_policy_contract" CHECK (
      "policy_ref" = 'nurture.institution-publication-policy@1.0.0'
    ),
    CONSTRAINT "ck_nurture_publication_policy_heads" CHECK (
      "policy_version" >= 1 AND "policy_head" >= 1
    ),
    CONSTRAINT "ck_nurture_publication_policy_times" CHECK (
      "default_release_local_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "retry_cutoff_local_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "retry_cutoff_local_time" > "default_release_local_time"
    ),
    CONSTRAINT "ck_nurture_publication_policy_intervals" CHECK (
      "organize_idle_seconds" >= 60
      AND "organize_fallback_lead_seconds" >= 60
      AND "automatic_quiescence_seconds" >= 30
      AND "automatic_quiescence_seconds" <= 180
      AND "capture_activity_lease_seconds" >= 30
      AND "capture_activity_lease_seconds" <= 180
      AND (
        NOT "automatic_organize_enabled"
        OR "organize_idle_seconds" >= "automatic_quiescence_seconds"
      )
    ),
    CONSTRAINT "ck_nurture_publication_policy_effective_window" CHECK (
      "superseded_at" IS NULL OR "superseded_at" > "effective_from"
    )
);

CREATE UNIQUE INDEX "uq_nurture_publication_policy_version"
ON "nurture_institution_publication_policy"("workspace_id", "institution_id", "policy_version");

CREATE UNIQUE INDEX "uq_nurture_publication_policy_head"
ON "nurture_institution_publication_policy"("workspace_id", "institution_id", "policy_head");

CREATE INDEX "ix_nurture_publication_policy_effective"
ON "nurture_institution_publication_policy"("workspace_id", "institution_id", "effective_from", "superseded_at");

ALTER TABLE "nurture_institution_publication_policy"
ADD CONSTRAINT "nurture_institution_publication_policy_institution_id_fkey"
FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_publish_process"
DROP CONSTRAINT "ck_nurture_publish_process_state";

ALTER TABLE "nurture_publish_process"
ADD CONSTRAINT "ck_nurture_publish_process_state"
CHECK (
  ("state" <> 'released' OR "frozen_revision_id" IS NOT NULL)
  AND (
    (
      "scheduled_at" IS NULL
      AND "not_after" IS NULL
      AND "schedule_time_zone" IS NULL
      AND "schedule_policy_ref" IS NULL
      AND "schedule_policy_head" IS NULL
      AND "schedule_policy_version" IS NULL
      AND "schedule_resolved_at" IS NULL
    )
    OR (
      "scheduled_at" IS NOT NULL
      AND "not_after" IS NOT NULL
      AND "schedule_time_zone" IS NOT NULL
      AND "schedule_policy_ref" IS NOT NULL
      AND "schedule_policy_head" IS NOT NULL
      AND "schedule_policy_version" IS NOT NULL
      AND "schedule_resolved_at" IS NOT NULL
      AND "not_after" > "scheduled_at"
      AND "schedule_policy_head" >= 1
      AND "schedule_policy_version" >= 1
    )
  )
);

COMMIT;
