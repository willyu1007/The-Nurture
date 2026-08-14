# Environment Configuration

This document is generated from `env/contract.yaml`. Do not hand-edit.

Generated at (UTC): `2026-08-14T15:54:23Z`

## Environments
- `dev`, `prod`, `staging`

## Variables

| Name | State | Type | Required | Secret | Default | Secret Ref | Scopes | Deprecate After | Replacement | Rename From | Description |
|---|---:|---:|:---:|:---:|---|---|---|---|---|---|---|
| `APP_ENV` | `active` | `enum` | yes | no | `dev` | `` | `*` | `` | `` | `` | Deployment environment profile. |
| `DATABASE_URL` | `active` | `url` | yes | yes | `` | `database_url` | `*` | `` | `` | `` | PostgreSQL connection URL for Nurture-owned production schema and migrations. |
| `DEV_HOST_DATABASE_URL` | `active` | `url` | yes | yes | `` | `dev_host_database_url` | `dev` | `` | `` | `` | PostgreSQL connection URL for backend-private workflow dev-host schema and migrations. |
| `DEV_HOST_PORT` | `active` | `int` | no | no | `3001` | `` | `dev` | `` | `` | `` | Loopback-only Fastify workflow dev-host listen port; never used by the formal scenario service. |
| `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `family_growth_events_service_token` | `*` | `` | `` | `` | Nurture-to-My-Chat bearer for family-growth event delivery (family_growth_transport@1.0.0); absent = delivery worker off. |
| `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `family_growth_rendition_service_token` | `*` | `` | `` | `` | My-Chat-to-Nurture bearer validated by the rendition exchange (family_growth_transport@1.0.0); absent = endpoints refuse all requests. |
| `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN_PREVIOUS` | `active` | `string` | no | yes | `` | `family_growth_rendition_service_token_previous` | `*` | `` | `` | `` | Rotation window twin of FAMILY_GROWTH_RENDITION_SERVICE_TOKEN; cleared after rotation completes. |
| `MY_CHAT_INTERNAL_BASE_URL` | `active` | `url` | no | no | `` | `` | `*` | `` | `` | `` | My-Chat host base URL for host-ward internal reads (ST-5 derived age/stage); the shared internal service token authenticates the call. Absence keeps derived reads disabled. |
| `NURTURE_BACKEND_URL` | `active` | `url` | no | no | `http://localhost:3200` | `` | `dev` | `` | `` | `` | Local Base-assigned Nurture backend endpoint consumed by the frontend workbench; topology only, not an API-contract field. |
| `NURTURE_BINDING_EVIDENCE_KEY` | `active` | `string` | no | yes | `` | `nurture_binding_evidence_key` | `*` | `` | `` | `` | HMAC key (at least 32 characters) enabling the scenario-binding owner endpoint; absence keeps the endpoint disabled and never degrades to an unhashed path. |
| `NURTURE_DIRECTOR_PRESENTER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the read-only director presenter v1 composition; true requires the exact adopted contract digest, current-authority/owner ports and separate activation approval, and never enables Institution Mobile commands. |
| `NURTURE_HARNESS_INTEGRITY_KEY` | `active` | `string` | no | yes | `` | `nurture_harness_integrity_key` | `*` | `` | `` | `` | HMAC key (at least 32 characters) for Harness confirmation input-integrity tags and owner-issued target refs; absence keeps both Harness routes disabled. |
| `NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off provider gate for the protected Institution Admin business-communication owner-read; true only after exact interface pin and consumer adoption. |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | `active` | `string` | no | yes | `` | `nurture_internal_service_token` | `*` | `` | `` | `` | Private My-Chat-to-Nurture service-auth token for owner endpoints; never persisted or logged. |
| `NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the parent-communication owner v1 composition; true requires the exact adopted contract digest, complete authority/owner/async ports and separately authorized activation. |
| `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the parent-context presenter v1 owner composition; true requires the exact adopted contract digest and separately authorized owner-port activation. |
| `NURTURE_PROTECTED_CONTENT_KEY` | `active` | `string` | no | yes | `` | `nurture_protected_content_key` | `*` | `` | `` | `` | AES-256-GCM key material (at least 32 characters) sealing protected family-care bodies at rest; absence keeps both Harness routes disabled and never degrades to plaintext. |
| `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the teacher assistant-query owner v1 exchange composition (missing-records, weekly-source, weekly-draft); true requires the exact adopted contract digest, complete caregiver authority/owner ports and separate activation approval; the owner assembles deterministic facts only and never calls a model provider. |
| `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the read-only teacher class-stream presenter v1 composition; true requires the exact adopted contract digest, complete caregiver authority/owner ports and separate activation approval, and admits no class-stream write path. |
| `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the teacher communication-owner v1 exchange composition; true requires the exact adopted contract digest, complete caregiver authority/owner/protected-content ports and separate activation approval; class-group send stays reserved and nothing schedules or auto-sends. |
| `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the teacher media-association owner v1 exchange composition (association-only); true requires the exact adopted contract digest, complete caregiver authority/owner ports and separate activation approval; no bytes, thumbnails or previews exist until the reserved media ingress ships. |
| `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the teacher organization-owner v1 exchange composition; true requires the exact adopted contract digest, complete caregiver authority/owner/protected-content ports and separate activation approval, and never authorizes release or auto-send. |
| `NURTURE_TEACHER_RELEASE_OWNER_ENABLED` | `active` | `bool` | no | no | `false` | `` | `*` | `` | `` | `` | Default-off gate for the versioned teacher release owner composition; true requires the exact My-Chat consumer pin and separately authorized activation. |
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
