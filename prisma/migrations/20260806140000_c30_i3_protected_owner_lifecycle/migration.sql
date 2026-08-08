-- C30-I3-F authoritative protected-content lifecycle. This creates no product
-- declaration, route, capability activation or KMS secret.

CREATE TYPE "NurtureC30ProtectedContentLifecycle" AS ENUM (
  'active',
  'tombstoned',
  'erased'
);

CREATE TABLE "nurture_c30_protected_content" (
  "id" VARCHAR(200) NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "scenario_key" TEXT NOT NULL,
  "action_key" TEXT NOT NULL,
  "protected_content_ref" VARCHAR(512) NOT NULL,
  "content_kind" TEXT NOT NULL,
  "protected_field_key" TEXT NOT NULL,
  "owning_action_ref" JSONB NOT NULL,
  "aggregate_ref" JSONB NOT NULL,
  "creator_participant_id" TEXT NOT NULL,
  "creator_participant_binding_id" TEXT NOT NULL,
  "creator_account_object_id" TEXT NOT NULL,
  "creator_actor_object_id" TEXT NOT NULL,
  "creator_represented_organization_object_id" TEXT,
  "principal_binding_hash" CHAR(64) NOT NULL,
  "request_identity_hash" CHAR(64) NOT NULL,
  "accepted_carrier_binding_hash" CHAR(64) NOT NULL,
  "canonical_payload_hash" CHAR(64) NOT NULL,
  "keyed_integrity_hash" CHAR(64) NOT NULL,
  "authority_evidence_hash" CHAR(64) NOT NULL,
  "authority_revision" INTEGER NOT NULL,
  "pair_evidence_hash" CHAR(64) NOT NULL,
  "policy_evidence_hash" CHAR(64) NOT NULL,
  "prepared_content_version" TEXT NOT NULL,
  "committed_content_version" TEXT NOT NULL,
  "encryption_algorithm" TEXT NOT NULL,
  "encryption_version" INTEGER NOT NULL,
  "encryption_context_hash" CHAR(64) NOT NULL,
  "ciphertext" BYTEA,
  "nonce" BYTEA,
  "authentication_tag" BYTEA,
  "wrapped_dek" BYTEA,
  "kms_key_domain" TEXT NOT NULL,
  "kms_key_version" TEXT NOT NULL,
  "kms_key_handle" VARCHAR(512),
  "kms_key_handle_hash" CHAR(64) NOT NULL,
  "wrapping_algorithm" TEXT NOT NULL,
  "lifecycle" "NurtureC30ProtectedContentLifecycle" NOT NULL DEFAULT 'active',
  "readable_until" TIMESTAMP(3) NOT NULL,
  "retention_until" TIMESTAMP(3) NOT NULL,
  "tombstone_reason" TEXT,
  "tombstoned_at" TIMESTAMP(3),
  "erased_at" TIMESTAMP(3),
  "erasure_evidence_hash" CHAR(64),
  "last_transition_participant_id" TEXT NOT NULL,
  "last_transition_participant_binding_id" TEXT NOT NULL,
  "last_transition_evidence_hash" CHAR(64) NOT NULL,
  "last_transition_authority_revision" INTEGER NOT NULL,
  "aggregate_version" INTEGER NOT NULL DEFAULT 1,
  "committed_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "nurture_c30_protected_content_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_protected_identity" CHECK (
    "scenario_key" = 'nurture'
    AND "action_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "content_kind" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "protected_field_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND jsonb_typeof("owning_action_ref") = 'object'
    AND jsonb_typeof("aggregate_ref") = 'object'
    AND "prepared_content_version" <> "committed_content_version"
  ),
  CONSTRAINT "ck_nurture_c30_protected_hashes" CHECK (
    "principal_binding_hash" ~ '^[0-9a-f]{64}$'
    AND "request_identity_hash" ~ '^[0-9a-f]{64}$'
    AND "accepted_carrier_binding_hash" ~ '^[0-9a-f]{64}$'
    AND "canonical_payload_hash" ~ '^[0-9a-f]{64}$'
    AND "keyed_integrity_hash" ~ '^[0-9a-f]{64}$'
    AND "authority_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "pair_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "policy_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND "encryption_context_hash" ~ '^[0-9a-f]{64}$'
    AND "kms_key_handle_hash" ~ '^[0-9a-f]{64}$'
    AND "last_transition_evidence_hash" ~ '^[0-9a-f]{64}$'
    AND (
      "erasure_evidence_hash" IS NULL
      OR "erasure_evidence_hash" ~ '^[0-9a-f]{64}$'
    )
  ),
  CONSTRAINT "ck_nurture_c30_protected_policy" CHECK (
    "encryption_algorithm" = 'aes-256-gcm'
    AND "encryption_version" = 1
    AND "authority_revision" >= 1
    AND "last_transition_authority_revision" >= 1
    AND "aggregate_version" >= 1
    AND "readable_until" > "committed_at"
    AND "retention_until" >= "readable_until"
  ),
  CONSTRAINT "ck_nurture_c30_protected_lifecycle" CHECK (
    (
      "lifecycle" = 'active'
      AND "ciphertext" IS NOT NULL
      AND "nonce" IS NOT NULL
      AND "authentication_tag" IS NOT NULL
      AND "wrapped_dek" IS NOT NULL
      AND octet_length("ciphertext") BETWEEN 1 AND 8192
      AND octet_length("nonce") = 12
      AND octet_length("authentication_tag") = 16
      AND octet_length("wrapped_dek") BETWEEN 1 AND 4096
      AND "kms_key_handle" IS NOT NULL
      AND "tombstone_reason" IS NULL
      AND "tombstoned_at" IS NULL
      AND "erased_at" IS NULL
      AND "erasure_evidence_hash" IS NULL
    )
    OR (
      "lifecycle" = 'tombstoned'
      AND "ciphertext" IS NULL
      AND "nonce" IS NULL
      AND "authentication_tag" IS NULL
      AND "wrapped_dek" IS NULL
      AND "kms_key_handle" IS NULL
      AND "tombstone_reason" IN ('revoked', 'redacted', 'expired', 'policy_changed')
      AND "tombstoned_at" IS NOT NULL
      AND "erased_at" IS NULL
      AND "erasure_evidence_hash" IS NOT NULL
    )
    OR (
      "lifecycle" = 'erased'
      AND "ciphertext" IS NULL
      AND "nonce" IS NULL
      AND "authentication_tag" IS NULL
      AND "wrapped_dek" IS NULL
      AND "kms_key_handle" IS NULL
      AND "tombstone_reason" IN ('retention_elapsed', 'crypto_erasure')
      AND "tombstoned_at" IS NOT NULL
      AND "erased_at" IS NOT NULL
      AND "erasure_evidence_hash" IS NOT NULL
    )
  )
);

CREATE TABLE "nurture_c30_protected_content_audit_record" (
  "id" TEXT NOT NULL,
  "protected_content_id" VARCHAR(200) NOT NULL,
  "event_key" TEXT NOT NULL,
  "content_ref_hash" CHAR(64) NOT NULL,
  "aggregate_ref" TEXT NOT NULL,
  "participant_ref" TEXT NOT NULL,
  "principal_binding_ref" TEXT NOT NULL,
  "evidence_hash" CHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nurture_c30_protected_content_audit_record_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ck_nurture_c30_protected_audit" CHECK (
    "event_key" ~ '^[a-z][a-z0-9._:-]{0,127}$'
    AND "content_ref_hash" ~ '^[0-9a-f]{64}$'
    AND "aggregate_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND "participant_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND "principal_binding_ref" ~ '^[A-Za-z0-9][A-Za-z0-9._:~-]{0,255}$'
    AND "evidence_hash" ~ '^[0-9a-f]{64}$'
  )
);

CREATE UNIQUE INDEX "uq_nurture_c30_protected_ref"
ON "nurture_c30_protected_content"("protected_content_ref");
CREATE INDEX "ix_nurture_c30_protected_retention"
ON "nurture_c30_protected_content"("workspace_id", "lifecycle", "retention_until");
CREATE INDEX "ix_nurture_c30_protected_creator"
ON "nurture_c30_protected_content"("creator_participant_id", "lifecycle", "updated_at");
CREATE UNIQUE INDEX "uq_nurture_c30_protected_request"
ON "nurture_c30_protected_content"("workspace_id", "action_key", "request_identity_hash");
CREATE UNIQUE INDEX "uq_nurture_c30_protected_audit_event"
ON "nurture_c30_protected_content_audit_record"("protected_content_id", "event_key");

ALTER TABLE "nurture_c30_protected_content"
ADD CONSTRAINT "fk_c30_protected_creator"
FOREIGN KEY ("creator_participant_id") REFERENCES "nurture_participant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_protected_content"
ADD CONSTRAINT "fk_c30_protected_creator_binding"
FOREIGN KEY ("creator_participant_binding_id") REFERENCES "nurture_participant_principal_binding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_protected_content"
ADD CONSTRAINT "fk_c30_protected_transition_actor"
FOREIGN KEY ("last_transition_participant_id") REFERENCES "nurture_participant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_protected_content"
ADD CONSTRAINT "fk_c30_protected_transition_binding"
FOREIGN KEY ("last_transition_participant_binding_id") REFERENCES "nurture_participant_principal_binding"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "nurture_c30_protected_content_audit_record"
ADD CONSTRAINT "nurture_c30_protected_content_audit_record_protected_conte_fkey"
FOREIGN KEY ("protected_content_id") REFERENCES "nurture_c30_protected_content"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
