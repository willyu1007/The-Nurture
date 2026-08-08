-- C30-I3 successor quality repair. This adds durable KMS coordination and
-- freezes canonical object versions independently from principal bindings.

ALTER TABLE "nurture_c30_pair_operation"
ADD COLUMN "participant_version" INTEGER,
ADD COLUMN "child_care_process_version" INTEGER,
ADD COLUMN "family_version" INTEGER;

ALTER TABLE "nurture_c30_pair_operation"
DROP CONSTRAINT "ck_nurture_c30_pair_state";

ALTER TABLE "nurture_c30_pair_operation"
ADD CONSTRAINT "ck_nurture_c30_pair_result_versions" CHECK (
  ("participant_version" IS NULL OR "participant_version" >= 1)
  AND ("child_care_process_version" IS NULL OR "child_care_process_version" >= 1)
  AND ("family_version" IS NULL OR "family_version" >= 1)
),
ADD CONSTRAINT "ck_nurture_c30_pair_state" CHECK (
  (
    "state" IN ('eligible', 'dispatching', 'quarantined')
    AND "participant_binding_id" IS NULL
    AND "child_association_id" IS NULL
    AND "family_association_id" IS NULL
    AND "command_execution_id" IS NULL
    AND "scenario_commit_evidence_hash" IS NULL
    AND "participant_version" IS NULL
    AND "child_care_process_version" IS NULL
    AND "family_version" IS NULL
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
    AND "participant_version" IS NOT NULL
    AND "child_care_process_version" IS NOT NULL
    AND "family_version" IS NOT NULL
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
    AND "participant_version" IS NULL
    AND "child_care_process_version" IS NULL
    AND "family_version" IS NULL
    AND "no_effect_fence_evidence_hash" IS NOT NULL
    AND "committed_at" IS NULL
    AND "recovery_checked_at" IS NOT NULL
    AND "recovery_checked_at" >= "effect_deadline_at"
  )
);

ALTER TABLE "nurture_c30_protected_content"
ADD COLUMN "kms_provisioning_key" CHAR(64);

UPDATE "nurture_c30_protected_content"
SET "kms_provisioning_key" = md5("id" || ':c30-kms-provisioning:1')
  || md5("id" || ':c30-kms-provisioning:2')
WHERE "kms_provisioning_key" IS NULL;

ALTER TABLE "nurture_c30_protected_content"
ALTER COLUMN "kms_provisioning_key" SET NOT NULL,
ALTER COLUMN "kms_key_domain" DROP NOT NULL,
ALTER COLUMN "kms_key_version" DROP NOT NULL,
ALTER COLUMN "kms_key_handle_hash" DROP NOT NULL,
ALTER COLUMN "wrapping_algorithm" DROP NOT NULL,
ALTER COLUMN "committed_at" DROP NOT NULL,
ALTER COLUMN "lifecycle" SET DEFAULT 'provisioning';

CREATE UNIQUE INDEX "uq_nurture_c30_protected_kms_provisioning"
ON "nurture_c30_protected_content"("kms_provisioning_key");

ALTER TABLE "nurture_c30_protected_content"
DROP CONSTRAINT "ck_nurture_c30_protected_hashes",
DROP CONSTRAINT "ck_nurture_c30_protected_policy",
DROP CONSTRAINT "ck_nurture_c30_protected_lifecycle";

ALTER TABLE "nurture_c30_protected_content"
ADD CONSTRAINT "ck_nurture_c30_protected_hashes" CHECK (
  "principal_binding_hash" ~ '^[0-9a-f]{64}$'
  AND "request_identity_hash" ~ '^[0-9a-f]{64}$'
  AND "accepted_carrier_binding_hash" ~ '^[0-9a-f]{64}$'
  AND "canonical_payload_hash" ~ '^[0-9a-f]{64}$'
  AND "keyed_integrity_hash" ~ '^[0-9a-f]{64}$'
  AND "authority_evidence_hash" ~ '^[0-9a-f]{64}$'
  AND "pair_evidence_hash" ~ '^[0-9a-f]{64}$'
  AND "policy_evidence_hash" ~ '^[0-9a-f]{64}$'
  AND "encryption_context_hash" ~ '^[0-9a-f]{64}$'
  AND "kms_provisioning_key" ~ '^[0-9a-f]{64}$'
  AND ("kms_key_handle_hash" IS NULL OR "kms_key_handle_hash" ~ '^[0-9a-f]{64}$')
  AND "last_transition_evidence_hash" ~ '^[0-9a-f]{64}$'
  AND ("erasure_evidence_hash" IS NULL OR "erasure_evidence_hash" ~ '^[0-9a-f]{64}$')
),
ADD CONSTRAINT "ck_nurture_c30_protected_policy" CHECK (
  "encryption_algorithm" = 'aes-256-gcm'
  AND "encryption_version" = 1
  AND "authority_revision" >= 1
  AND "last_transition_authority_revision" >= 1
  AND "aggregate_version" >= 1
  AND "readable_until" > COALESCE("committed_at", "created_at")
  AND "retention_until" >= "readable_until"
),
ADD CONSTRAINT "ck_nurture_c30_protected_lifecycle" CHECK (
  (
    "lifecycle" = 'provisioning'
    AND "committed_at" IS NULL
    AND "ciphertext" IS NULL
    AND "nonce" IS NULL
    AND "authentication_tag" IS NULL
    AND "wrapped_dek" IS NULL
    AND "kms_key_domain" IS NULL
    AND "kms_key_version" IS NULL
    AND "kms_key_handle" IS NULL
    AND "kms_key_handle_hash" IS NULL
    AND "wrapping_algorithm" IS NULL
    AND "tombstone_reason" IS NULL
    AND "tombstoned_at" IS NULL
    AND "erased_at" IS NULL
    AND "erasure_evidence_hash" IS NULL
  )
  OR (
    "lifecycle" = 'active'
    AND "committed_at" IS NOT NULL
    AND "ciphertext" IS NOT NULL
    AND "nonce" IS NOT NULL
    AND "authentication_tag" IS NOT NULL
    AND "wrapped_dek" IS NOT NULL
    AND octet_length("ciphertext") BETWEEN 1 AND 8192
    AND octet_length("nonce") = 12
    AND octet_length("authentication_tag") = 16
    AND octet_length("wrapped_dek") BETWEEN 1 AND 4096
    AND "kms_key_domain" IS NOT NULL
    AND "kms_key_version" IS NOT NULL
    AND "kms_key_handle" IS NOT NULL
    AND "kms_key_handle_hash" IS NOT NULL
    AND "wrapping_algorithm" IS NOT NULL
    AND "tombstone_reason" IS NULL
    AND "tombstoned_at" IS NULL
    AND "erased_at" IS NULL
    AND "erasure_evidence_hash" IS NULL
  )
  OR (
    "lifecycle" = 'erasing'
    AND "committed_at" IS NOT NULL
    AND "ciphertext" IS NOT NULL
    AND "nonce" IS NOT NULL
    AND "authentication_tag" IS NOT NULL
    AND "wrapped_dek" IS NOT NULL
    AND "kms_key_domain" IS NOT NULL
    AND "kms_key_version" IS NOT NULL
    AND "kms_key_handle" IS NOT NULL
    AND "kms_key_handle_hash" IS NOT NULL
    AND "wrapping_algorithm" IS NOT NULL
    AND "tombstone_reason" IS NOT NULL
    AND "tombstoned_at" IS NOT NULL
    AND "erased_at" IS NULL
    AND "erasure_evidence_hash" IS NOT NULL
  )
  OR (
    "lifecycle" IN ('tombstoned', 'erased')
    AND "committed_at" IS NOT NULL
    AND "ciphertext" IS NULL
    AND "nonce" IS NULL
    AND "authentication_tag" IS NULL
    AND "wrapped_dek" IS NULL
    AND "kms_key_domain" IS NULL
    AND "kms_key_version" IS NULL
    AND "kms_key_handle" IS NULL
    AND "kms_key_handle_hash" IS NULL
    AND "wrapping_algorithm" IS NULL
    AND "tombstoned_at" IS NOT NULL
    AND "erasure_evidence_hash" IS NOT NULL
    AND (
      (
        "lifecycle" = 'tombstoned'
        AND "tombstone_reason" IN ('revoked', 'redacted', 'expired', 'policy_changed')
        AND "erased_at" IS NULL
      )
      OR (
        "lifecycle" = 'erased'
        AND "tombstone_reason" IN ('retention_elapsed', 'crypto_erasure')
        AND "erased_at" IS NOT NULL
      )
    )
  )
);
