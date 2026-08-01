# API Index

> Auto-generated at 2026-08-01T06:21:14.157Z — do NOT hand-edit.
> Source: `docs/context/api/openapi.yaml` (SHA-256: `33e7dce59281...`)

Total endpoints: **4**

| Method | Path | Summary | Auth | Input (required) | Output (core) | Errors |
|--------|------|---------|------|------------------|---------------|--------|
| GET | /health | Check scenario-service liveness | none | — | ok | — |
| POST | /internal/nurture/scenario-binding/authorize | Authorize one current scenario-binding owner operation | bearer | workspace_id, acting_user_id, idempotency_key, subject_type, subject_id, scenario_key, acting_actor_id, purpose | status, authorization_ref, workspace_id, subject_type, subject_id, scenario_key, owner_ref, owner_version, authorized_actor_id, purpose, verified_at, expires_at, represented_organization_id | 400, 401, 403, 408, 409, 413, 415, 500, 503 |
| POST | /internal/nurture/harness/prepare-action | Prepare one family-care Harness action for confirmation | bearer | workspace_id, actor_participant_id, surface, capability_key, capability_version | status, preview, confirmation_ref, expires_at, command_request_id, fields, choices, reason_code, alternate_process | 400, 401, 408, 503 |
| POST | /internal/nurture/harness/execute-action | Execute one confirmed family-care Harness action | bearer | workspace_id, actor_participant_id, surface, capability_key, capability_version, invocation_request_id, command_request_id, confirmation_ref | status, execution_disposition, business_outcome, execution_ref, output_refs, decision, reason_code, recovery | 400, 401, 408, 503 |
