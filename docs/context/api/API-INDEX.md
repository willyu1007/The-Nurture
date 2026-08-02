# API Index

> Auto-generated at 2026-08-01T23:56:28.445Z — do NOT hand-edit.
> Source: `docs/context/api/openapi.yaml` (SHA-256: `f3995b300e29...`)

Total endpoints: **7**

| Method | Path | Summary | Auth | Input (required) | Output (core) | Errors |
|--------|------|---------|------|------------------|---------------|--------|
| GET | /health | Check scenario-service liveness | none | — | ok | — |
| POST | /internal/nurture/scenario-binding/authorize | Authorize one current scenario-binding owner operation | bearer | workspace_id, acting_user_id, idempotency_key, subject_type, subject_id, scenario_key, acting_actor_id, purpose | status, authorization_ref, workspace_id, subject_type, subject_id, scenario_key, owner_ref, owner_version, authorized_actor_id, purpose, verified_at, expires_at, represented_organization_id | 400, 401, 403, 408, 409, 413, 415, 500, 503 |
| POST | /internal/nurture/harness/prepare-action | Prepare one family-care Harness action for confirmation | bearer | workspace_id, actor_participant_id, surface, capability_key, capability_version | status, preview, confirmation_ref, expires_at, command_request_id, fields, choices, reason_code, alternate_process | 400, 401, 408, 503 |
| POST | /internal/nurture/harness/execute-action | Execute one confirmed family-care Harness action | bearer | workspace_id, actor_participant_id, surface, capability_key, capability_version, invocation_request_id, command_request_id, confirmation_ref | status, execution_disposition, business_outcome, execution_ref, output_refs, committed_result, decision, reason_code, recovery | 400, 401, 408, 503 |
| POST | /internal/nurture/harness/query | Read one role-safe family-care query projection | bearer | workspace_id, actor_participant_id, surface, capability_key, capability_version | status, output, reason_code | 400, 401, 408, 503 |
| POST | /internal/nurture/harness/read-result | Re-read the role-safe projection for a committed action | bearer | workspace_id, actor_participant_id, surface, command_request_id | status, output, reason_code | 400, 401, 408, 503 |
| POST | /internal/nurture/institution/business-communications:read | Read one disclosed Institution business communication | bearer | workspace_id, actor_participant_id, surface, interface_contract, target_option_ref | status, output, reason_code | 400, 401, 408, 503 |
