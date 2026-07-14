-- X4/N2 permits bounded immutable replay seeds only when they are owned by an
-- already-durable My-Chat Workflow Step. The claim token and expected Step
-- version remain transient and are forbidden from the persisted driver ref.
ALTER TABLE "nurture_command_execution"
DROP CONSTRAINT "ck_nurture_command_execution_n1";

ALTER TABLE "nurture_command_execution"
ADD CONSTRAINT "ck_nurture_command_execution_handoff_v1"
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
  AND (
    (
      jsonb_array_length("handoff_request_snapshots_payload") = 0
      AND "handoff_driver_ref" IS NULL
    )
    OR (
      jsonb_array_length("handoff_request_snapshots_payload") > 0
      AND jsonb_typeof("handoff_driver_ref") = 'object'
      AND "handoff_driver_ref" ->> 'namespace' = 'host.workflow'
      AND "handoff_driver_ref" ->> 'consumer_scenario_key' = 'nurture'
      AND "handoff_driver_ref" ->> 'object_type' = 'workflow_step'
      AND "handoff_driver_ref" ->> 'object_id' ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
      AND "handoff_driver_ref" ->> 'owner_scope' = 'workspace'
      AND NOT ("handoff_driver_ref" ? 'version')
      AND NOT ("handoff_driver_ref" ? 'claimToken')
      AND NOT ("handoff_driver_ref" ? 'claim_token')
      AND NOT ("handoff_driver_ref" ? 'expectedStepVersion')
      AND "handoff_driver_ref" = jsonb_build_object(
        'namespace', 'host.workflow',
        'consumer_scenario_key', 'nurture',
        'object_type', 'workflow_step',
        'object_id', "handoff_driver_ref" ->> 'object_id',
        'owner_scope', 'workspace'
      )
    )
  )
) NOT VALID;

ALTER TABLE "nurture_command_execution"
VALIDATE CONSTRAINT "ck_nurture_command_execution_handoff_v1";
