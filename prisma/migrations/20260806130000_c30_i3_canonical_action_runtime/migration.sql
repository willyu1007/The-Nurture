-- C30-I3-E generic owner-action persistence. This adds no product action,
-- route, capability declaration or activation population.

CREATE TYPE "NurtureC30ActionOperationState" AS ENUM (
  'eligible',
  'dispatching',
  'committed',
  'confirmed_no_effect',
  'quarantined'
);

CREATE TABLE "nurture_c30_action_operation" (
  "id" VARCHAR(200) NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "scenario_key" TEXT NOT NULL,
  "action_key" TEXT NOT NULL,
  "driver" TEXT NOT NULL,
  "effect_identity_hash" CHAR(64) NOT NULL,
  "canonical_payload_hash" CHAR(64) NOT NULL,
  "participant_id" TEXT NOT NULL,
  "participant_binding_id" TEXT NOT NULL,
  "principal_binding_hash" CHAR(64) NOT NULL,
  "account_object_id" TEXT NOT NULL,
  "actor_object_id" TEXT NOT NULL,
  "represented_organization_object_id" TEXT,
  "target_ref_hash" CHAR(64) NOT NULL,
  "target_version" TEXT NOT NULL,
  "primary_scope_ref" JSONB NOT NULL,
  "child_care_process_id" TEXT,
  "submit_context_ref" JSONB,
  "original_workflow_step_ref" JSONB,
  "action_contract_hash" CHAR(64) NOT NULL,
  "authority_evidence_hash" CHAR(64) NOT NULL,
  "authority_revision" INTEGER NOT NULL,
  "scenario_command_id" VARCHAR(200) NOT NULL,
  "scenario_command_hash" CHAR(64) NOT NULL,
  "client_mutation_id_hash" CHAR(64) NOT NULL,
  "request_nonce_hash" CHAR(64) NOT NULL,
  "host_identity_evidence_hash" CHAR(64) NOT NULL,
  "principal_provenance_hash" CHAR(64) NOT NULL,
  "request_correlation_hash" CHAR(64) NOT NULL,
  "deadline_evidence_hash" CHAR(64) NOT NULL,
  "attempt_ledger_hash" CHAR(64) NOT NULL,
  "writer_fence_hash" CHAR(64) NOT NULL,
  "effect_deadline_at" TIMESTAMP(3) NOT NULL,
  "state" "NurtureC30ActionOperationState" NOT NULL DEFAULT 'eligible',
  "command_execution_id" TEXT,
  "business_outcome" "NurtureCommandBusinessOutcome",
  "output_refs" JSONB,
  "handoff_request_snapshots" JSONB,
  "commit_evidence_hash" CHAR(64),
  "no_effect_fence_evidence_hash" CHAR(64),
  "committed_at" TIMESTAMP(3),
  "recovery_checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_c30_action_operation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_action_keys" CHECK (
    "scenario_key" = 'nurture'
    AND "action_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "target_version" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
  ),
  CONSTRAINT "ck_nurture_c30_action_hashes" CHECK (
    "effect_identity_hash" ~ '^[0-9a-f]{64}$'
    AND "canonical_payload_hash" ~ '^[0-9a-f]{64}$'
    AND "principal_binding_hash" ~ '^[0-9a-f]{64}$'
    AND "target_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "action_contract_hash" ~ '^[0-9a-f]{64}$'
    AND "authority_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "scenario_command_hash" ~ '^[0-9a-f]{64}$'
    AND "client_mutation_id_hash" ~ '^[0-9a-f]{64}$'
    AND "request_nonce_hash" ~ '^[0-9a-f]{64}$'
    AND "host_identity_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "principal_provenance_hash" ~ '^[0-9a-f]{64}$'
    AND "request_correlation_hash" ~ '^[0-9a-f]{64}$'
    AND "deadline_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "attempt_ledger_hash" ~ '^[0-9a-f]{64}$'
    AND "writer_fence_hash" ~ '^[0-9a-f]{64}$'
    AND ("commit_evidence_hash" IS NULL OR "commit_evidence_hash" ~ '^[0-9a-f]{64}$')
    AND ("no_effect_fence_evidence_hash" IS NULL OR "no_effect_fence_evidence_hash" ~ '^[0-9a-f]{64}$')
  ),
  CONSTRAINT "ck_nurture_c30_action_driver_identity" CHECK (
    (
      "driver" = 'scenario_direct_empty_v1'
      AND "submit_context_ref" IS NOT NULL
      AND "original_workflow_step_ref" IS NULL
    )
    OR (
      "driver" = 'workflow_claimed_step_v1'
      AND "submit_context_ref" IS NULL
      AND "original_workflow_step_ref" IS NOT NULL
    )
  ),
  CONSTRAINT "ck_nurture_c30_action_authority" CHECK (
    "authority_revision" >= 1
    AND jsonb_typeof("primary_scope_ref") = 'object'
    AND "effect_deadline_at" > "created_at"
  ),
  CONSTRAINT "ck_nurture_c30_action_state" CHECK (
    (
      "state" IN ('eligible', 'dispatching', 'quarantined')
      AND "command_execution_id" IS NULL
      AND "business_outcome" IS NULL
      AND "output_refs" IS NULL
      AND "handoff_request_snapshots" IS NULL
      AND "commit_evidence_hash" IS NULL
      AND "no_effect_fence_evidence_hash" IS NULL
      AND "committed_at" IS NULL
      AND "recovery_checked_at" IS NULL
    )
    OR (
      "state" = 'committed'
      AND "command_execution_id" IS NOT NULL
      AND "business_outcome" IS NOT NULL
      AND jsonb_typeof("output_refs") = 'array'
      AND jsonb_typeof("handoff_request_snapshots") = 'array'
      AND "commit_evidence_hash" IS NOT NULL
      AND "no_effect_fence_evidence_hash" IS NULL
      AND "committed_at" IS NOT NULL
    )
    OR (
      "state" = 'confirmed_no_effect'
      AND "command_execution_id" IS NULL
      AND "business_outcome" IS NULL
      AND "output_refs" IS NULL
      AND "handoff_request_snapshots" IS NULL
      AND "commit_evidence_hash" IS NULL
      AND "no_effect_fence_evidence_hash" IS NOT NULL
      AND "committed_at" IS NULL
      AND "recovery_checked_at" IS NOT NULL
    )
  )
);

CREATE TABLE "nurture_c30_action_audit_record" (
  "id" TEXT NOT NULL,
  "action_operation_id" VARCHAR(200) NOT NULL,
  "event_key" TEXT NOT NULL,
  "aggregate_ref" TEXT NOT NULL,
  "execution_ref" TEXT,
  "evidence_hash" CHAR(64) NOT NULL,
  "correlation_ref" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_c30_action_audit_record_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_action_audit_refs" CHECK (
    "event_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "aggregate_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND ("execution_ref" IS NULL OR "execution_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$')
    AND "evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "correlation_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
  )
);

CREATE TABLE "nurture_c30_action_outbox_event" (
  "id" TEXT NOT NULL,
  "action_operation_id" VARCHAR(200) NOT NULL,
  "event_type" TEXT NOT NULL,
  "aggregate_ref" TEXT NOT NULL,
  "execution_ref" TEXT,
  "participant_ref" TEXT NOT NULL,
  "correlation_ref" TEXT NOT NULL,
  "evidence_hash" CHAR(64) NOT NULL,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_c30_action_outbox_event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_action_outbox_refs" CHECK (
    "event_type" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "aggregate_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND ("execution_ref" IS NULL OR "execution_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$')
    AND "participant_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND "correlation_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND "evidence_hash" ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX "uq_nurture_c30_action_effect"
ON "nurture_c30_action_operation"("effect_identity_hash");
CREATE UNIQUE INDEX "uq_nurture_c30_action_execution"
ON "nurture_c30_action_operation"("command_execution_id");
CREATE INDEX "ix_nurture_c30_action_state"
ON "nurture_c30_action_operation"("workspace_id", "scenario_key", "action_key", "state", "updated_at");
CREATE UNIQUE INDEX "uq_nurture_c30_action_command"
ON "nurture_c30_action_operation"("workspace_id", "scenario_command_id");
CREATE UNIQUE INDEX "uq_nurture_c30_action_audit_event"
ON "nurture_c30_action_audit_record"("action_operation_id", "event_key");
CREATE INDEX "ix_nurture_c30_action_outbox_delivery"
ON "nurture_c30_action_outbox_event"("published_at", "created_at");
CREATE UNIQUE INDEX "uq_nurture_c30_action_outbox_event"
ON "nurture_c30_action_outbox_event"("action_operation_id", "event_type");

ALTER TABLE "nurture_c30_action_operation"
ADD CONSTRAINT "nurture_c30_action_operation_participant_id_fkey"
FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_action_operation"
ADD CONSTRAINT "nurture_c30_action_operation_participant_binding_id_fkey"
FOREIGN KEY ("participant_binding_id") REFERENCES "nurture_participant_principal_binding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_action_operation"
ADD CONSTRAINT "nurture_c30_action_operation_child_care_process_id_fkey"
FOREIGN KEY ("child_care_process_id") REFERENCES "nurture_child_care_process"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_action_operation"
ADD CONSTRAINT "nurture_c30_action_operation_command_execution_id_fkey"
FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_action_audit_record"
ADD CONSTRAINT "nurture_c30_action_audit_record_action_operation_id_fkey"
FOREIGN KEY ("action_operation_id") REFERENCES "nurture_c30_action_operation"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_action_outbox_event"
ADD CONSTRAINT "nurture_c30_action_outbox_event_action_operation_id_fkey"
FOREIGN KEY ("action_operation_id") REFERENCES "nurture_c30_action_operation"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
