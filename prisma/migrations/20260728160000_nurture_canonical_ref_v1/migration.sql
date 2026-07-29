-- Migrate durable X4 replay seeds to the canonical reference shape introduced
-- by the pinned My-Chat workflow contract. Existing request identity and
-- replay ownership remain unchanged.
ALTER TABLE "nurture_command_execution"
DROP CONSTRAINT "ck_nurture_command_execution_handoff_v1";

CREATE OR REPLACE FUNCTION "nurture_migrate_canonical_ref_v1"(ref JSONB)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN ref ? 'namespace' AND ref ? 'object_type' AND ref ? 'object_id' THEN
      jsonb_build_object(
        'schema_version', 1,
        'namespace', CASE
          WHEN ref ->> 'namespace' = 'host.workflow' THEN 'my_chat'
          ELSE ref ->> 'namespace'
        END,
        'object_type', ref ->> 'object_type',
        'object_id', ref ->> 'object_id'
      )
      || CASE
        WHEN ref ? 'version' THEN jsonb_build_object('version', ref -> 'version')
        ELSE '{}'::jsonb
      END
    WHEN ref ? 'kind' AND ref ? 'id' THEN
      jsonb_build_object(
        'schema_version', 1,
        'namespace', CASE
          WHEN ref ->> 'kind' IN (
            'scenario',
            'capability',
            'workflow_version',
            'workflow_run',
            'workflow_step',
            'workflow_artifact',
            'workflow_approval',
            'workflow_handoff'
          ) THEN 'my_chat'
          ELSE 'nurture'
        END,
        'object_type', ref ->> 'kind',
        'object_id', ref ->> 'id'
      )
      || CASE
        WHEN ref ? 'version' THEN jsonb_build_object('version', ref -> 'version')
        ELSE '{}'::jsonb
      END
    ELSE ref
  END
$$;

CREATE OR REPLACE FUNCTION "nurture_migrate_canonical_ref_array_v1"(refs JSONB)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      "nurture_migrate_canonical_ref_v1"(entry.value)
      ORDER BY entry.ordinality
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(refs) WITH ORDINALITY AS entry(value, ordinality)
$$;

UPDATE "nurture_command_execution"
SET "handoff_driver_ref" = jsonb_build_object(
  'schema_version', 1,
  'namespace', 'my_chat',
  'object_type', 'workflow_step',
  'object_id', "handoff_driver_ref" ->> 'object_id'
)
WHERE "handoff_driver_ref" IS NOT NULL
  AND "handoff_driver_ref" ->> 'namespace' = 'host.workflow'
  AND "handoff_driver_ref" ->> 'object_type' = 'workflow_step';

UPDATE "nurture_profile_projection"
SET "canonical_object_ref" =
  "nurture_migrate_canonical_ref_v1"("canonical_object_ref");

UPDATE "nurture_activity_comparison_draft"
SET
  "target_refs" = "nurture_migrate_canonical_ref_array_v1"("target_refs"),
  "option_refs" = "nurture_migrate_canonical_ref_array_v1"("option_refs");

UPDATE "nurture_evidence_ref"
SET
  "target_ref" = "nurture_migrate_canonical_ref_v1"("target_ref"),
  "evidence_ref" = "nurture_migrate_canonical_ref_v1"("evidence_ref");

UPDATE "nurture_command_execution"
SET
  "primary_scope_ref" = CASE
    WHEN "primary_scope_ref" IS NULL THEN NULL
    ELSE "nurture_migrate_canonical_ref_v1"("primary_scope_ref")
  END,
  "target_refs" = CASE
    WHEN "target_refs" IS NULL THEN NULL
    ELSE "nurture_migrate_canonical_ref_array_v1"("target_refs")
  END,
  "output_refs" = "nurture_migrate_canonical_ref_array_v1"("output_refs");

UPDATE "nurture_family_care_message"
SET "body_protection_payload" = jsonb_set(
  "body_protection_payload",
  '{content_ref}',
  "nurture_migrate_canonical_ref_v1"("body_protection_payload" -> 'content_ref')
)
WHERE "body_protection_payload" ? 'content_ref';

UPDATE "nurture_family_care_message"
SET "attachments_payload" = jsonb_set(
  "attachments_payload",
  '{attachment_refs}',
  "nurture_migrate_canonical_ref_array_v1"("attachments_payload" -> 'attachment_refs')
)
WHERE "attachments_payload" ? 'attachment_refs';

UPDATE "nurture_child_link_receipt"
SET "driver_ref" = "nurture_migrate_canonical_ref_v1"("driver_ref")
WHERE "driver_ref" IS NOT NULL;

UPDATE "nurture_family_care_item"
SET "clarification_expiry_driver_ref" =
  "nurture_migrate_canonical_ref_v1"("clarification_expiry_driver_ref")
WHERE "clarification_expiry_driver_ref" IS NOT NULL;

WITH transformed_snapshots AS (
  SELECT
    execution."id",
    jsonb_agg(
      (
        snapshot.value - 'sourceContextRefs' - 'sourceArtifactRefs'
        || CASE
          WHEN snapshot.value ? 'sourceContextRefs' THEN jsonb_build_object(
            'sourceContextRefs',
            "nurture_migrate_canonical_ref_array_v1"(
              snapshot.value -> 'sourceContextRefs'
            )
          )
          ELSE '{}'::jsonb
        END
        || CASE
          WHEN snapshot.value ? 'sourceArtifactRefs' THEN jsonb_build_object(
            'sourceArtifactRefs',
            "nurture_migrate_canonical_ref_array_v1"(
              snapshot.value -> 'sourceArtifactRefs'
            )
          )
          ELSE '{}'::jsonb
        END
      )
      ORDER BY snapshot.ordinality
    ) AS payload
  FROM "nurture_command_execution" AS execution
  CROSS JOIN LATERAL jsonb_array_elements(execution."handoff_request_snapshots_payload")
    WITH ORDINALITY AS snapshot(value, ordinality)
  WHERE jsonb_array_length(execution."handoff_request_snapshots_payload") > 0
  GROUP BY execution."id"
)
UPDATE "nurture_command_execution" AS execution
SET "handoff_request_snapshots_payload" = transformed_snapshots.payload
FROM transformed_snapshots
WHERE execution."id" = transformed_snapshots."id";

ALTER TABLE "nurture_command_execution"
ADD CONSTRAINT "ck_nurture_command_execution_handoff_v2"
CHECK (
  "command_request_id_hash" ~ '^[0-9a-f]{64}$'
  AND "origin_invocation_request_id_hash" ~ '^[0-9a-f]{64}$'
  AND ("parent_command_request_id_hash" IS NULL OR "parent_command_request_id_hash" ~ '^[0-9a-f]{64}$')
  AND "request_identity_hash_version" = 1
  AND "command_contract_version" > 0
  AND "payload_hash" ~ '^[0-9a-f]{64}$'
  AND "payload_canonicalization_version" = 1
  AND jsonb_typeof("output_refs") = 'array'
  AND ("target_refs" IS NULL OR jsonb_typeof("target_refs") = 'array')
  AND "handoff_snapshot_schema_version" = 1
  AND jsonb_typeof("handoff_request_snapshots_payload") = 'array'
  AND jsonb_array_length("handoff_request_snapshots_payload") <= 32
  AND NOT (
    "handoff_request_snapshots_payload"::text
      ~ '"(claimToken|claim_token|expectedStepVersion|contractHash)"[[:space:]]*:'
  )
  AND NOT (
    "handoff_request_snapshots_payload"::text
      ~ '"(consumer_scenario_key|owner_scope|canonical_ref|kind|id)"[[:space:]]*:'
  )
  AND (
    (
      jsonb_array_length("handoff_request_snapshots_payload") = 0
      AND "handoff_driver_ref" IS NULL
    )
    OR (
      jsonb_array_length("handoff_request_snapshots_payload") > 0
      AND jsonb_typeof("handoff_driver_ref") = 'object'
      AND "handoff_driver_ref" -> 'schema_version' = '1'::jsonb
      AND "handoff_driver_ref" ->> 'namespace' = 'my_chat'
      AND "handoff_driver_ref" ->> 'object_type' = 'workflow_step'
      AND "handoff_driver_ref" ->> 'object_id' ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
      AND NOT ("handoff_driver_ref" ? 'version')
      AND NOT ("handoff_driver_ref" ? 'claimToken')
      AND NOT ("handoff_driver_ref" ? 'claim_token')
      AND NOT ("handoff_driver_ref" ? 'expectedStepVersion')
      AND "handoff_driver_ref" = jsonb_build_object(
        'schema_version', 1,
        'namespace', 'my_chat',
        'object_type', 'workflow_step',
        'object_id', "handoff_driver_ref" ->> 'object_id'
      )
    )
  )
) NOT VALID;

ALTER TABLE "nurture_command_execution"
VALIDATE CONSTRAINT "ck_nurture_command_execution_handoff_v2";

DROP FUNCTION "nurture_migrate_canonical_ref_array_v1"(JSONB);
DROP FUNCTION "nurture_migrate_canonical_ref_v1"(JSONB);
