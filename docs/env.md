# Environment Configuration

This document is generated from `env/contract.yaml`. Do not hand-edit.

Generated at (UTC): `2026-08-01T06:21:53Z`

## Environments
- `dev`, `prod`, `staging`

## Variables

| Name | State | Type | Required | Secret | Default | Secret Ref | Scopes | Deprecate After | Replacement | Rename From | Description |
|---|---:|---:|:---:|:---:|---|---|---|---|---|---|---|
| `APP_ENV` | `active` | `enum` | yes | no | `dev` | `` | `*` | `` | `` | `` | Deployment environment profile. |
| `DATABASE_URL` | `active` | `url` | yes | yes | `` | `database_url` | `*` | `` | `` | `` | PostgreSQL connection URL for Nurture-owned production schema and migrations. |
| `DEV_HOST_DATABASE_URL` | `active` | `url` | yes | yes | `` | `dev_host_database_url` | `dev` | `` | `` | `` | PostgreSQL connection URL for backend-private workflow dev-host schema and migrations. |
| `DEV_HOST_PORT` | `active` | `int` | no | no | `3001` | `` | `dev` | `` | `` | `` | Loopback-only Fastify workflow dev-host listen port; never used by the formal scenario service. |
| `MY_CHAT_INTERNAL_BASE_URL` | `active` | `url` | no | no | `` | `` | `*` | `` | `` | `` | My-Chat host base URL for host-ward internal reads (ST-5 derived age/stage); the shared internal service token authenticates the call. Absence keeps derived reads disabled. |
| `NURTURE_BACKEND_URL` | `active` | `url` | no | no | `http://localhost:3200` | `` | `dev` | `` | `` | `` | Local Base-assigned Nurture backend endpoint consumed by the frontend workbench; topology only, not an API-contract field. |
| `NURTURE_BINDING_EVIDENCE_KEY` | `active` | `string` | no | yes | `` | `nurture_binding_evidence_key` | `*` | `` | `` | `` | HMAC key (at least 32 characters) enabling the scenario-binding owner endpoint; absence keeps the endpoint disabled and never degrades to an unhashed path. |
| `NURTURE_HARNESS_INTEGRITY_KEY` | `active` | `string` | no | yes | `` | `nurture_harness_integrity_key` | `*` | `` | `` | `` | HMAC key (at least 32 characters) for Harness confirmation input-integrity tags and owner-issued target refs; absence keeps both Harness routes disabled. |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `nurture_internal_service_token` | `*` | `` | `` | `` | Private My-Chat-to-Nurture service-auth token for owner endpoints; never persisted or logged. |
| `NURTURE_PROTECTED_CONTENT_KEY` | `active` | `string` | no | yes | `` | `nurture_protected_content_key` | `*` | `` | `` | `` | AES-256-GCM key material (at least 32 characters) sealing protected family-care bodies at rest; absence keeps both Harness routes disabled and never degrades to plaintext. |
| `PORT` | `active` | `int` | yes | no | `8000` | `` | `*` | `` | `` | `` | Formal NestJS scenario-service listen port; local ecosystem routing maps the Base-assigned backend endpoint separately. |
| `SERVICE_NAME` | `active` | `string` | yes | no | `the-nurture` | `` | `*` | `` | `` | `` | Nurture owner service name used by logs and deployment metadata. |

## Loading model (recommended)

1. Runtime injection (cloud)
2. Local .env.local (gitignored)
3. env/values/<env>.yaml
4. env/contract.yaml defaults

## Secret handling rules

- Secret values must never be committed to the repository.
- Secret variables are defined in the contract with `secret: true` and `secret_ref`.
- Secret refs are stored in `env/secrets/<env>.ref.yaml`.
