BEGIN;

CREATE TYPE "NurturePrincipalBindingStatus" AS ENUM ('active', 'suspended', 'revoked');
CREATE TYPE "NurtureC30PairOperationState" AS ENUM (
  'eligible',
  'dispatching',
  'committed',
  'confirmed_no_effect',
  'quarantined'
);

ALTER TABLE "nurture_command_execution"
ADD COLUMN "actor_account_ref" JSONB,
ADD COLUMN "actor_binding_version" INTEGER,
ADD COLUMN "actor_principal_binding_id" TEXT,
ADD COLUMN "actor_ref" JSONB,
ADD COLUMN "actor_represented_organization_ref" JSONB,
ADD COLUMN "actor_workspace_ref" JSONB,
ADD COLUMN "execution_driver" TEXT,
ADD COLUMN "invocation_provenance" JSONB,
ADD COLUMN "scenario_effect_identity_hash" CHAR(64),
ADD COLUMN "scenario_key" TEXT;

CREATE TABLE "nurture_scenario_invocation_nonce" (
  "id" TEXT NOT NULL,
  "scope_hash" CHAR(64) NOT NULL,
  "request_id_hash" CHAR(64) NOT NULL,
  "body_sha256" VARCHAR(43) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_scenario_invocation_nonce_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_nonce_hashes" CHECK (
    "scope_hash" ~ '^[0-9a-f]{64}$'
    AND "request_id_hash" ~ '^[0-9a-f]{64}$'
    AND "body_sha256" ~ '^[A-Za-z0-9_-]{43}$'
  ),
  CONSTRAINT "ck_nurture_c30_nonce_window" CHECK ("expires_at" > "consumed_at")
);

CREATE TABLE "nurture_participant_principal_binding" (
  "id" TEXT NOT NULL,
  "participant_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "account_object_id" TEXT NOT NULL,
  "actor_object_id" TEXT NOT NULL,
  "represented_organization_object_id" TEXT,
  "binding_version" INTEGER NOT NULL DEFAULT 1,
  "status" "NurturePrincipalBindingStatus" NOT NULL DEFAULT 'active',
  "current_key" TEXT DEFAULT 'current',
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "suspended_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nurture_participant_principal_binding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_principal_versions" CHECK (
    "binding_version" = 1 AND "aggregate_version" >= 1
  ),
  CONSTRAINT "ck_nurture_c30_principal_identifiers" CHECK (
    length("workspace_id") BETWEEN 1 AND 200
    AND length("account_object_id") BETWEEN 1 AND 200
    AND length("actor_object_id") BETWEEN 1 AND 200
    AND (
      "represented_organization_object_id" IS NULL
      OR length("represented_organization_object_id") BETWEEN 1 AND 200
    )
  ),
  CONSTRAINT "ck_nurture_c30_principal_lifecycle" CHECK (
    ("status" = 'active' AND "current_key" = 'current' AND "suspended_at" IS NULL AND "revoked_at" IS NULL)
    OR ("status" = 'suspended' AND "current_key" IS NULL AND "suspended_at" IS NOT NULL AND "revoked_at" IS NULL)
    OR ("status" = 'revoked' AND "current_key" IS NULL AND "revoked_at" IS NOT NULL)
  )
);

CREATE TABLE "nurture_c30_pair_operation" (
  "id" VARCHAR(200) NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "scenario_key" TEXT NOT NULL,
  "participant_id" TEXT NOT NULL,
  "participant_binding_id" TEXT,
  "account_object_id" TEXT NOT NULL,
  "actor_object_id" TEXT NOT NULL,
  "represented_organization_object_id" TEXT,
  "child_anchor_id" TEXT NOT NULL,
  "family_anchor_id" TEXT NOT NULL,
  "child_owner_version" INTEGER NOT NULL,
  "family_owner_version" INTEGER NOT NULL,
  "authority_source_ref" TEXT NOT NULL,
  "authority_source_version" INTEGER NOT NULL,
  "principal_provenance_hash" CHAR(64) NOT NULL,
  "continuation_context_hash" CHAR(64) NOT NULL,
  "pair_relation_evidence_hash" CHAR(64) NOT NULL,
  "current_owner_evidence_hash" CHAR(64) NOT NULL,
  "canonical_input_hash" CHAR(64) NOT NULL,
  "pair_commit_evidence_hash" CHAR(64) NOT NULL,
  "association_expectation_hash" CHAR(64) NOT NULL,
  "scenario_command_id" VARCHAR(200) NOT NULL,
  "scenario_command_hash" CHAR(64) NOT NULL,
  "request_nonce_hash" CHAR(64) NOT NULL,
  "host_identity_evidence_hash" CHAR(64) NOT NULL,
  "deadline_evidence_hash" CHAR(64) NOT NULL,
  "attempt_ledger_hash" CHAR(64) NOT NULL,
  "writer_fence_hash" CHAR(64) NOT NULL,
  "effect_deadline_at" TIMESTAMP(3) NOT NULL,
  "state" "NurtureC30PairOperationState" NOT NULL DEFAULT 'eligible',
  "child_association_id" TEXT,
  "family_association_id" TEXT,
  "command_execution_id" TEXT,
  "scenario_commit_evidence_hash" CHAR(64),
  "no_effect_fence_evidence_hash" CHAR(64),
  "committed_at" TIMESTAMP(3),
  "recovery_checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nurture_c30_pair_operation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_pair_hashes" CHECK (
    "principal_provenance_hash" ~ '^[0-9a-f]{64}$'
    AND "continuation_context_hash" ~ '^[0-9a-f]{64}$'
    AND "pair_relation_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "current_owner_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "canonical_input_hash" ~ '^[0-9a-f]{64}$'
    AND "pair_commit_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "association_expectation_hash" ~ '^[0-9a-f]{64}$'
    AND "scenario_command_hash" ~ '^[0-9a-f]{64}$'
    AND "request_nonce_hash" ~ '^[0-9a-f]{64}$'
    AND "host_identity_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "deadline_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "attempt_ledger_hash" ~ '^[0-9a-f]{64}$'
    AND "writer_fence_hash" ~ '^[0-9a-f]{64}$'
    AND ("scenario_commit_evidence_hash" IS NULL OR "scenario_commit_evidence_hash" ~ '^[0-9a-f]{64}$')
    AND ("no_effect_fence_evidence_hash" IS NULL OR "no_effect_fence_evidence_hash" ~ '^[0-9a-f]{64}$')
  ),
  CONSTRAINT "ck_nurture_c30_pair_owner_versions" CHECK (
    "child_owner_version" >= 1
    AND "family_owner_version" >= 1
    AND "authority_source_version" >= 1
    AND length("authority_source_ref") BETWEEN 1 AND 256
  ),
  CONSTRAINT "ck_nurture_c30_pair_state" CHECK (
    (
      "state" IN ('eligible', 'dispatching', 'quarantined')
      AND "participant_binding_id" IS NULL
      AND "child_association_id" IS NULL
      AND "family_association_id" IS NULL
      AND "command_execution_id" IS NULL
      AND "scenario_commit_evidence_hash" IS NULL
      AND "no_effect_fence_evidence_hash" IS NULL
      AND "committed_at" IS NULL
      AND ("recovery_checked_at" IS NULL OR "recovery_checked_at" < "effect_deadline_at")
    )
    OR (
      "state" = 'committed'
      AND "participant_binding_id" IS NOT NULL
      AND "child_association_id" IS NOT NULL
      AND "family_association_id" IS NOT NULL
      AND "command_execution_id" IS NOT NULL
      AND "scenario_commit_evidence_hash" IS NOT NULL
      AND "no_effect_fence_evidence_hash" IS NULL
      AND "committed_at" IS NOT NULL
    )
    OR (
      "state" = 'confirmed_no_effect'
      AND "participant_binding_id" IS NULL
      AND "child_association_id" IS NULL
      AND "family_association_id" IS NULL
      AND "command_execution_id" IS NULL
      AND "scenario_commit_evidence_hash" IS NULL
      AND "no_effect_fence_evidence_hash" IS NOT NULL
      AND "committed_at" IS NULL
      AND "recovery_checked_at" IS NOT NULL
      AND "recovery_checked_at" >= "effect_deadline_at"
    )
  )
);

CREATE TABLE "nurture_c30_audit_record" (
  "id" TEXT NOT NULL,
  "operation_id" VARCHAR(200) NOT NULL,
  "event_key" TEXT NOT NULL,
  "aggregate_ref" TEXT NOT NULL,
  "execution_ref" TEXT,
  "evidence_hash" CHAR(64) NOT NULL,
  "correlation_ref" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_c30_audit_record_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_audit_refs" CHECK (
    "event_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "evidence_hash" ~ '^[0-9a-f]{64}$'
    AND length("aggregate_ref") BETWEEN 1 AND 256
    AND ("execution_ref" IS NULL OR length("execution_ref") BETWEEN 1 AND 256)
    AND length("correlation_ref") BETWEEN 1 AND 200
  )
);

CREATE TABLE "nurture_c30_outbox_event" (
  "id" TEXT NOT NULL,
  "operation_id" VARCHAR(200) NOT NULL,
  "event_type" TEXT NOT NULL,
  "aggregate_ref" TEXT NOT NULL,
  "execution_ref" TEXT,
  "participant_ref" TEXT NOT NULL,
  "correlation_ref" TEXT NOT NULL,
  "evidence_hash" CHAR(64) NOT NULL,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nurture_c30_outbox_event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_outbox_refs" CHECK (
    "event_type" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "evidence_hash" ~ '^[0-9a-f]{64}$'
    AND length("aggregate_ref") BETWEEN 1 AND 256
    AND ("execution_ref" IS NULL OR length("execution_ref") BETWEEN 1 AND 256)
    AND length("participant_ref") BETWEEN 1 AND 256
    AND length("correlation_ref") BETWEEN 1 AND 200
  )
);

CREATE UNIQUE INDEX "uq_nurture_c30_nonce_scope"
ON "nurture_scenario_invocation_nonce"("scope_hash");
CREATE INDEX "ix_nurture_c30_nonce_expiry"
ON "nurture_scenario_invocation_nonce"("expires_at");
CREATE INDEX "ix_nurture_c30_principal_status"
ON "nurture_participant_principal_binding"("workspace_id", "status", "updated_at");
CREATE UNIQUE INDEX "uq_nurture_c30_principal_current"
ON "nurture_participant_principal_binding"("workspace_id", "account_object_id", "actor_object_id", "current_key");
CREATE UNIQUE INDEX "uq_nurture_c30_participant_current"
ON "nurture_participant_principal_binding"("workspace_id", "participant_id", "current_key");
CREATE UNIQUE INDEX "uq_nurture_c30_pair_child_assoc"
ON "nurture_c30_pair_operation"("child_association_id");
CREATE UNIQUE INDEX "uq_nurture_c30_pair_family_assoc"
ON "nurture_c30_pair_operation"("family_association_id");
CREATE UNIQUE INDEX "uq_nurture_c30_pair_execution"
ON "nurture_c30_pair_operation"("command_execution_id");
CREATE INDEX "ix_nurture_c30_pair_state"
ON "nurture_c30_pair_operation"("workspace_id", "scenario_key", "state", "updated_at");
CREATE UNIQUE INDEX "uq_nurture_c30_pair_command"
ON "nurture_c30_pair_operation"("workspace_id", "scenario_command_id");
CREATE UNIQUE INDEX "uq_nurture_c30_audit_event"
ON "nurture_c30_audit_record"("operation_id", "event_key");
CREATE INDEX "ix_nurture_c30_outbox_delivery"
ON "nurture_c30_outbox_event"("published_at", "created_at");
CREATE UNIQUE INDEX "uq_nurture_c30_outbox_event"
ON "nurture_c30_outbox_event"("operation_id", "event_type");
CREATE INDEX "ix_nurture_command_execution_actor_binding"
ON "nurture_command_execution"("workspace_id", "actor_principal_binding_id", "committed_at");

ALTER TABLE "nurture_participant_principal_binding"
ADD CONSTRAINT "nurture_participant_principal_binding_participant_id_fkey"
FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_participant_id_fkey"
FOREIGN KEY ("participant_id") REFERENCES "nurture_participant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_participant_binding_id_fkey"
FOREIGN KEY ("participant_binding_id") REFERENCES "nurture_participant_principal_binding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_child_anchor_id_fkey"
FOREIGN KEY ("child_anchor_id") REFERENCES "nurture_child_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_family_anchor_id_fkey"
FOREIGN KEY ("family_anchor_id") REFERENCES "nurture_family_binding_anchor"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_child_association_id_fkey"
FOREIGN KEY ("child_association_id") REFERENCES "nurture_child_anchor_association"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_family_association_id_fkey"
FOREIGN KEY ("family_association_id") REFERENCES "nurture_family_anchor_association"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "nurture_c30_pair_operation_command_execution_id_fkey"
FOREIGN KEY ("command_execution_id") REFERENCES "nurture_command_execution"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_audit_record"
ADD CONSTRAINT "nurture_c30_audit_record_operation_id_fkey"
FOREIGN KEY ("operation_id") REFERENCES "nurture_c30_pair_operation"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_outbox_event"
ADD CONSTRAINT "nurture_c30_outbox_event_operation_id_fkey"
FOREIGN KEY ("operation_id") REFERENCES "nurture_c30_pair_operation"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_command_execution"
ADD CONSTRAINT "nurture_command_execution_actor_principal_binding_id_fkey"
FOREIGN KEY ("actor_principal_binding_id") REFERENCES "nurture_participant_principal_binding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nurture_command_execution"
ADD CONSTRAINT "ck_nurture_c30_command_typed_actor" CHECK (
  (
    "scenario_key" IS NULL
    AND "actor_principal_binding_id" IS NULL
    AND "actor_binding_version" IS NULL
    AND "actor_account_ref" IS NULL
    AND "actor_ref" IS NULL
    AND "actor_workspace_ref" IS NULL
    AND "actor_represented_organization_ref" IS NULL
    AND "invocation_provenance" IS NULL
    AND "scenario_effect_identity_hash" IS NULL
    AND "execution_driver" IS NULL
  )
  OR (
    "scenario_key" ~ '^[a-z][a-z0-9-]{0,63}$'
    AND "actor_principal_binding_id" IS NOT NULL
    AND "actor_binding_version" >= 1
    AND "actor_account_ref" IS NOT NULL
    AND "actor_ref" IS NOT NULL
    AND "actor_workspace_ref" IS NOT NULL
    AND "invocation_provenance" IS NOT NULL
    AND "scenario_effect_identity_hash" ~ '^[0-9a-f]{64}$'
    AND (
      "execution_driver" IS NULL
      OR "execution_driver" IN ('scenario_direct_empty_v1', 'workflow_claimed_step_v1')
    )
  )
);

COMMIT;
