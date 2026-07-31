# Environment Configuration

This document is generated from `env/contract.yaml`. Do not hand-edit.

Generated at (UTC): `2026-07-31T07:00:36Z`

## Environments
- `dev`, `prod`, `staging`

## Variables

| Name | State | Type | Required | Secret | Default | Secret Ref | Scopes | Deprecate After | Replacement | Rename From | Description |
|---|---:|---:|:---:|:---:|---|---|---|---|---|---|---|
| `APP_ENV` | `active` | `enum` | yes | no | `dev` | `` | `*` | `` | `` | `` | Deployment environment profile. |
| `DATABASE_URL` | `active` | `url` | yes | yes | `` | `database_url` | `*` | `` | `` | `` | PostgreSQL connection URL for Nurture-owned production schema and migrations. |
| `DEV_HOST_DATABASE_URL` | `active` | `url` | yes | yes | `` | `dev_host_database_url` | `dev` | `` | `` | `` | PostgreSQL connection URL for backend-private workflow dev-host schema and migrations. |
| `DEV_HOST_PORT` | `active` | `int` | no | no | `3001` | `` | `dev` | `` | `` | `` | Loopback-only Fastify workflow dev-host listen port; never used by the formal scenario service. |
| `NURTURE_BACKEND_URL` | `active` | `url` | no | no | `http://localhost:3200` | `` | `dev` | `` | `` | `` | Local Base-assigned Nurture backend endpoint consumed by the frontend workbench; topology only, not an API-contract field. |
| `NURTURE_BINDING_EVIDENCE_KEY` | `active` | `string` | no | yes | `` | `nurture_binding_evidence_key` | `*` | `` | `` | `` | HMAC key (at least 32 characters) enabling the scenario-binding owner endpoint; absence keeps the endpoint disabled and never degrades to an unhashed path. |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `nurture_internal_service_token` | `*` | `` | `` | `` | Private My-Chat-to-Nurture service-auth token for owner endpoints; never persisted or logged. |
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
