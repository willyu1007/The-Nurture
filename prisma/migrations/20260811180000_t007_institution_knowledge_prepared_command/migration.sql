-- T-007 formal Institution Knowledge prepare/confirm ledger.
-- Preview only: this migration is intentionally not applied by this task.

CREATE TYPE "NurtureInstitutionKnowledgePreparedCommandStatus" AS ENUM (
  'prepared',
  'consumed',
  'expired'
);

CREATE TABLE "nurture_institution_knowledge_prepared_command" (
  "command_request_id" VARCHAR(200) NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "participant_id" TEXT NOT NULL,
  "institution_id" TEXT NOT NULL,
  "role_assignment_id" TEXT NOT NULL,
  "client_surface" TEXT NOT NULL,
  "client_command_id_hash" CHAR(64) NOT NULL,
  "prepare_fingerprint" CHAR(64) NOT NULL,
  "origin_invocation_request_id_hash" CHAR(64) NOT NULL,
  "confirmation_ref_hash" CHAR(64) NOT NULL,
  "capability_key" VARCHAR(100) NOT NULL,
  "snapshot_codec_version" INTEGER NOT NULL,
  "frozen_snapshot_ciphertext" TEXT NOT NULL,
  "status" "NurtureInstitutionKnowledgePreparedCommandStatus" NOT NULL,
  "prepared_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_institution_knowledge_prepared_command_pkey"
    PRIMARY KEY ("command_request_id"),
  CONSTRAINT "ck_nurture_knowledge_prepared_command_contract" CHECK (
    "command_request_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
    AND "client_surface" = 'web_run_workbench'
    AND "client_command_id_hash" ~ '^[0-9a-f]{64}$'
    AND "prepare_fingerprint" ~ '^[0-9a-f]{64}$'
    AND "origin_invocation_request_id_hash" ~ '^[0-9a-f]{64}$'
    AND "confirmation_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "capability_key" IN (
      'answer_institution_knowledge',
      'create_institution_knowledge_item',
      'create_institution_knowledge_revision',
      'record_institution_knowledge_review',
      'publish_institution_knowledge_revision',
      'revoke_institution_knowledge_revision'
    )
    AND (("status" = 'expired'
        AND "snapshot_codec_version" = 0
        AND "frozen_snapshot_ciphertext" = '')
      OR ("status" <> 'expired'
        AND "snapshot_codec_version" >= 1
        AND length("frozen_snapshot_ciphertext") BETWEEN 20 AND 1000000))
    AND "aggregate_version" >= 1
    AND "prepared_at" < "expires_at"
    AND (("status" = 'consumed' AND "consumed_at" IS NOT NULL)
      OR ("status" <> 'consumed' AND "consumed_at" IS NULL))
  )
);

CREATE UNIQUE INDEX "uq_nurture_knowledge_prepared_client_command"
  ON "nurture_institution_knowledge_prepared_command"
  ("workspace_id", "participant_id", "client_surface", "client_command_id_hash");
CREATE INDEX "ix_nurture_knowledge_prepared_participant"
  ON "nurture_institution_knowledge_prepared_command"
  ("workspace_id", "participant_id", "status", "expires_at");
CREATE INDEX "ix_nurture_knowledge_prepared_institution"
  ON "nurture_institution_knowledge_prepared_command"
  ("workspace_id", "institution_id", "status", "expires_at");

ALTER TABLE "nurture_institution_knowledge_prepared_command"
  ADD CONSTRAINT "nurture_knowledge_prepared_participant_id_fkey"
  FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_prepared_institution_id_fkey"
  FOREIGN KEY ("institution_id") REFERENCES "nurture_care_institution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "nurture_knowledge_prepared_role_assignment_id_fkey"
  FOREIGN KEY ("role_assignment_id") REFERENCES "nurture_care_role_assignment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
