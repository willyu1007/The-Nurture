-- CreateEnum
CREATE TYPE "WorkflowStepResultStatus" AS ENUM ('completed', 'failed', 'retry_requested', 'manual_review_required');

-- CreateEnum
CREATE TYPE "WorkflowApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'confirmed');

-- CreateTable
CREATE TABLE "workflow_run" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "scenario_key" TEXT NOT NULL,
    "capability_key" TEXT NOT NULL,
    "entrypoint_key" TEXT NOT NULL,
    "workflow_version_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "actor_id" TEXT,
    "requirement_values_payload" JSONB,
    "context_refs_payload" JSONB,
    "canonical_refs_payload" JSONB,
    "aggregate_versions_payload" JSONB,
    "idempotency_key" TEXT,
    "correlation_id" TEXT,
    "trace_id" TEXT,
    "client_surface" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "step_key" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "result_status" "WorkflowStepResultStatus",
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "claim_token" TEXT,
    "claimed_by_worker_id" TEXT,
    "claim_expires_at" TIMESTAMP(3),
    "output_refs_payload" JSONB,
    "reason_code" TEXT,
    "retryable" BOOLEAN,
    "idempotency_key" TEXT,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_artifact" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT,
    "workspace_id" TEXT NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "exposure_level" TEXT NOT NULL,
    "source_refs_payload" JSONB,
    "storage_ref_payload" JSONB,
    "safe_title" TEXT,
    "safe_summary" TEXT,
    "safe_preview" TEXT,
    "unavailable_reason" TEXT,
    "status" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expired_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflow_artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_approval" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT,
    "workspace_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_ref_payload" JSONB,
    "status" "WorkflowApprovalStatus" NOT NULL,
    "action" TEXT,
    "reason_code" TEXT,
    "expected_version" INTEGER,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "actor_id" TEXT,
    "idempotency_key" TEXT,
    "correlation_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_context_binding" (
    "id" TEXT NOT NULL,
    "run_id" TEXT,
    "step_id" TEXT,
    "workspace_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_ref_payload" JSONB,
    "context_refs_payload" JSONB NOT NULL,
    "snapshot_refs_payload" JSONB,
    "expected_versions_payload" JSONB,
    "status" TEXT,
    "rebind_reason" TEXT,
    "aggregate_version" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" TEXT,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_context_binding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_outbox_event" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "run_id" TEXT,
    "step_id" TEXT,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "aggregate_version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "trace_id" TEXT,
    "client_surface" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dispatched_at" TIMESTAMP(3),
    "dispatch_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_51" ON "workflow_run"("workspace_id", "scenario_key", "status");

-- CreateIndex
CREATE INDEX "ix_52" ON "workflow_run"("workspace_id", "status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_6" ON "workflow_run"("workspace_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "ix_53" ON "workflow_step"("run_id", "step_order");

-- CreateIndex
CREATE INDEX "ix_54" ON "workflow_step"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_7" ON "workflow_step"("run_id", "step_key");

-- CreateIndex
CREATE UNIQUE INDEX "uq_8" ON "workflow_step"("claim_token");

-- CreateIndex
CREATE INDEX "ix_55" ON "workflow_artifact"("run_id", "artifact_type");

-- CreateIndex
CREATE INDEX "ix_56" ON "workflow_artifact"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "ix_57" ON "workflow_artifact"("step_id");

-- CreateIndex
CREATE INDEX "ix_58" ON "workflow_approval"("run_id", "status");

-- CreateIndex
CREATE INDEX "ix_59" ON "workflow_approval"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "ix_60" ON "workflow_approval"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "ix_61" ON "workflow_context_binding"("run_id", "status");

-- CreateIndex
CREATE INDEX "ix_62" ON "workflow_context_binding"("workspace_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "ix_63" ON "workflow_outbox_event"("status", "created_at");

-- CreateIndex
CREATE INDEX "ix_64" ON "workflow_outbox_event"("workspace_id", "event_type");

-- CreateIndex
CREATE INDEX "ix_65" ON "workflow_outbox_event"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "ix_66" ON "workflow_outbox_event"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_9" ON "workflow_outbox_event"("workspace_id", "idempotency_key", "event_type");

-- AddForeignKey
ALTER TABLE "workflow_step" ADD CONSTRAINT "workflow_step_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_artifact" ADD CONSTRAINT "workflow_artifact_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_approval" ADD CONSTRAINT "workflow_approval_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_context_binding" ADD CONSTRAINT "workflow_context_binding_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_outbox_event" ADD CONSTRAINT "workflow_outbox_event_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;
