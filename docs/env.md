# Environment Configuration

This document is generated from `env/contract.yaml`. Do not hand-edit.

Generated at (UTC): `2026-07-15T02:56:21Z`

## Environments
- `dev`, `prod`, `staging`

## Variables

| Name | State | Type | Required | Secret | Default | Secret Ref | Scopes | Deprecate After | Replacement | Rename From | Description |
|---|---:|---:|:---:|:---:|---|---|---|---|---|---|---|
| `APP_ENV` | `active` | `enum` | yes | no | `dev` | `` | `*` | `` | `` | `` | Deployment environment profile. |
| `DATABASE_URL` | `active` | `url` | yes | yes | `` | `database_url` | `*` | `` | `` | `` | PostgreSQL connection URL for Nurture-owned production schema and migrations. |
| `DEV_HOST_DATABASE_URL` | `active` | `url` | yes | yes | `` | `dev_host_database_url` | `dev` | `` | `` | `` | PostgreSQL connection URL for backend-private workflow dev-host schema and migrations. |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `nurture_internal_service_token` | `*` | `` | `` | `` | Shared service-auth token for refs-only activation owner reads; never persisted or logged. |
| `PORT` | `active` | `int` | yes | no | `8000` | `` | `*` | `` | `` | `` | Service listen port. |
| `SERVICE_NAME` | `active` | `string` | yes | no | `your-service` | `` | `*` | `` | `` | `` | Service name (logical). |

## Loading model (recommended)

1. Runtime injection (cloud)
2. Local .env.local (gitignored)
3. env/values/<env>.yaml
4. env/contract.yaml defaults

## Secret handling rules

- Secret values must never be committed to the repository.
- Secret variables are defined in the contract with `secret: true` and `secret_ref`.
- Secret refs are stored in `env/secrets/<env>.ref.yaml`.
