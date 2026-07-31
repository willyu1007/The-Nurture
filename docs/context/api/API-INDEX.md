# API Index

> Auto-generated at 2026-07-31T07:01:25.171Z — do NOT hand-edit.
> Source: `docs/context/api/openapi.yaml` (SHA-256: `cf613e1988eb...`)

Total endpoints: **2**

| Method | Path | Summary | Auth | Input (required) | Output (core) | Errors |
|--------|------|---------|------|------------------|---------------|--------|
| GET | /health | Check scenario-service liveness | none | — | ok | — |
| POST | /internal/nurture/scenario-binding/authorize | Authorize one current scenario-binding owner operation | bearer | workspace_id, acting_user_id, idempotency_key, subject_type, subject_id, scenario_key, acting_actor_id, purpose | status, authorization_ref, workspace_id, subject_type, subject_id, scenario_key, owner_ref, owner_version, authorized_actor_id, purpose, verified_at, expires_at, represented_organization_id | 400, 401, 403, 408, 409, 413, 415, 500, 503 |
