-- T-007 I4 cross-owner workflow Run settlement ledger.
-- Repository migration artifact. Apply only to an explicitly approved target.

-- CreateEnum
CREATE TYPE "NurtureWorkflowRunSettlementState" AS ENUM (
  'prepared',
  'committed',
  'confirmed_no_effect'
);

-- CreateTable
CREATE TABLE "nurture_workflow_run_settlement" (
  "id" TEXT NOT NULL,
  "workspace_id" VARCHAR(200) NOT NULL,
  "logical_operation_id_hash" CHAR(64) NOT NULL,
  "reservation_ref_hash" CHAR(64) NOT NULL,
  "reservation_evidence_hash" CHAR(64) NOT NULL,
  "run_object_id" VARCHAR(200) NOT NULL,
  "binding_fingerprint_sha256" CHAR(64) NOT NULL,
  "command_request_id_hash" CHAR(64) NOT NULL,
  "command_key" VARCHAR(100) NOT NULL,
  "state" "NurtureWorkflowRunSettlementState" NOT NULL,
  "command_execution_id" TEXT,
  "settlement_receipt_ref" VARCHAR(200),
  "settlement_evidence_hash" CHAR(64),
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "prepared_at" TIMESTAMP(3) NOT NULL,
  "committed_at" TIMESTAMP(3),
  "confirmed_no_effect_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_workflow_run_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_nurture_run_settlement_execution"
  ON "nurture_workflow_run_settlement"("command_execution_id");

CREATE UNIQUE INDEX "uq_nurture_run_settlement_logical_operation"
  ON "nurture_workflow_run_settlement"("workspace_id", "logical_operation_id_hash");

CREATE UNIQUE INDEX "uq_nurture_run_settlement_reservation_evidence"
  ON "nurture_workflow_run_settlement"("workspace_id", "reservation_evidence_hash");

CREATE UNIQUE INDEX "uq_nurture_run_settlement_command"
  ON "nurture_workflow_run_settlement"("workspace_id", "command_request_id_hash");

CREATE INDEX "ix_nurture_run_settlement_reconciliation"
  ON "nurture_workflow_run_settlement"("workspace_id", "state", "updated_at");

-- AddForeignKey
ALTER TABLE "nurture_workflow_run_settlement"
  ADD CONSTRAINT "nurture_run_settlement_execution_id_fkey"
  FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Contract checks. The row contains opaque ids/hashes only and has exactly one
-- terminal shape. A committed/no-effect receipt is immutable evidence for the
-- Host reconciler; `prepared` remains outcome-unknown and cannot settle a Run.
ALTER TABLE "nurture_workflow_run_settlement"
  ADD CONSTRAINT "ck_nurture_workflow_run_settlement_contract" CHECK (
    "id" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
    AND "workspace_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
    AND "logical_operation_id_hash" ~ '^[0-9a-f]{64}$'
    AND "reservation_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "reservation_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "run_object_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
    AND "binding_fingerprint_sha256" ~ '^[0-9a-f]{64}$'
    AND "command_request_id_hash" ~ '^[0-9a-f]{64}$'
    AND "command_key" = 'nurture.start_enrollment_inquiry'
    AND "aggregate_version" >= 1
    AND (
      ("state" = 'prepared'
        AND "command_execution_id" IS NULL
        AND "settlement_receipt_ref" IS NULL
        AND "settlement_evidence_hash" IS NULL
        AND "committed_at" IS NULL
        AND "confirmed_no_effect_at" IS NULL)
      OR
      ("state" = 'committed'
        AND "command_execution_id" IS NOT NULL
        AND "settlement_receipt_ref" IS NOT NULL
        AND "settlement_receipt_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
        AND "settlement_evidence_hash" ~ '^[0-9a-f]{64}$'
        AND "committed_at" IS NOT NULL
        AND "confirmed_no_effect_at" IS NULL)
      OR
      ("state" = 'confirmed_no_effect'
        AND "command_execution_id" IS NULL
        AND "settlement_receipt_ref" IS NOT NULL
        AND "settlement_receipt_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$'
        AND "settlement_evidence_hash" ~ '^[0-9a-f]{64}$'
        AND "committed_at" IS NULL
        AND "confirmed_no_effect_at" IS NOT NULL)
    )
  );
