# Scenario-Service Environment Manifest

Scope: every variable read by `apps/scenario-service/src/config.ts` or a runtime loader invoked by the service. `NODE_ENV=production` is set by the runtime image, not read by service code.

## Loading Rules

`APP_ENV` accepts only `dev`, `staging`, or `prod`. `PORT` accepts only a base-10 integer from 1 through 65535. `SERVICE_NAME` must match the lower-case DNS-label pattern enforced by `config.ts`.

Each `NURTURE_*_ENABLED` variable accepts only `true` or `false`; omission means `false`. All provider gates default to false. Enabling any provider gate requires explicit activation authorization in addition to the listed runtime prerequisites and adopted consumer contract.

The long-running image also accepts `<SECRET>_FILE` for the allowlisted secret variables in `apps/scenario-service/src/runtime-secrets.ts`. File paths must be absolute and refer to non-empty regular files no larger than 64 KiB. Supplying both a direct value and its `_FILE` twin fails startup. Staging Compose uses this path so secret values stay out of rendered configuration.

| Variable | Purpose | Default | Required when | Gray-release wave |
| --- | --- | --- | --- | --- |
| `APP_ENV` | Service deployment profile. | `dev` | Never; the loader supplies `dev`. | Infrastructure |
| `SERVICE_NAME` | Structured-log and deployment service identifier. | `the-nurture` | Never; the loader supplies `the-nurture`. | Infrastructure |
| `PORT` | NestJS listen port. | `8000` | Never; the loader supplies `8000`. | Infrastructure |
| `DATABASE_URL` | Nurture-owned PostgreSQL connection for Prisma-backed routes, rendition reads, and family-growth delivery. | Unset | Binding-owner or Harness runtime, rendition reads, or family-growth delivery must operate. | Shared prerequisite |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | Timing-safe bearer accepted by private owner routes. | Unset | Any service-authenticated provider route must operate. | Shared prerequisite |
| `NURTURE_BINDING_EVIDENCE_KEY` | At-least-32-character HMAC material for scenario-binding evidence. | Unset | The scenario-binding owner endpoint must operate. Missing material leaves the endpoint disabled. | Shared prerequisite |
| `NURTURE_HARNESS_INTEGRITY_KEY` | At-least-32-character HMAC material for Harness confirmations and target references. | Unset | Harness routes or the Institution business-communication read must operate. Missing material leaves Harness disabled. | Shared prerequisite |
| `NURTURE_PROTECTED_CONTENT_KEY` | At-least-32-character AES-GCM key material for protected family-care bodies. | Unset | Harness routes or a provider composition requiring protected content must operate. Missing material leaves Harness disabled. | Shared prerequisite |
| `NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED` | Enables the protected Institution Admin business-communication owner-read after Harness prerequisites pass. | `false` | Explicitly authorized Institution business-communication release. | Separate from listed waves |
| `NURTURE_TEACHER_RELEASE_OWNER_ENABLED` | Enables the versioned teacher release-owner composition after consumer pin and runtime prerequisites pass. | `false` | Explicitly authorized teacher-release activation. | Separate from listed waves |
| `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED` | Enables the W2 read-only parent-context presenter. | `false` | Explicitly authorized W2 activation with complete owner ports and adopted digest. | Wave 1 — W2 |
| `NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED` | Enables the W3 parent-communication owner v1 composition. | `false` | Explicitly authorized W3 activation with complete authority, owner, and async ports plus an adopted digest. | Separate from listed waves |
| `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED` | Enables the W6 read-only teacher class-stream presenter. | `false` | Explicitly authorized W6 activation with complete owner ports and adopted digest. | Wave 1 — W6 |
| `NURTURE_DIRECTOR_PRESENTER_ENABLED` | Enables the W4 read-only director presenter. | `false` | Explicitly authorized W4 activation with complete owner ports and adopted digest. | Wave 2 — W4 |
| `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` | Enables W7 teacher organization reads and commands. | `false` | Explicitly authorized W7 activation with complete owner ports and adopted digest. | Wave 3 — W7 |
| `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` | Enables W8 teacher communication reads and commands. | `false` | Explicitly authorized W8 activation with complete owner ports and adopted digest. | Wave 3 — W8 |
| `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` | Enables W10 deterministic teacher assistant queries. | `false` | Explicitly authorized W10 activation with complete owner ports and adopted digest. | Wave 3 — W10 |
| `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` | Enables W9 association-only teacher media operations. | `false` | Explicitly authorized W9 activation with complete owner ports and adopted digest. | Wave 4 — W9 |
| `NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` | Enables W11 parent-communication v1.1 redaction and delivery-receipt extension routes. | `false` | Explicitly authorized W11 activation with complete owner ports and adopted digest. | Wave 5 — W11 |
| `MY_CHAT_INTERNAL_BASE_URL` | Base URL for Nurture-to-My-Chat family-growth event delivery. Trailing slashes are removed. | Unset | Family-growth delivery must operate; pair with `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN`. | Family-growth delivery |
| `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN` | Nurture-to-My-Chat bearer for family-growth event delivery. | Unset | Family-growth delivery must operate; pair with `MY_CHAT_INTERNAL_BASE_URL`. A missing or short pair keeps the delivery worker off. | Family-growth delivery |
| `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN` | Current My-Chat-to-Nurture bearer for family-growth rendition endpoints and rendition lease derivation. Minimum accepted length: 16 characters. | Unset | Family-growth rendition endpoints must authorize requests or mint leases. No accepted token leaves requests refused. | Family-growth rendition |
| `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN_PREVIOUS` | Previous accepted My-Chat-to-Nurture rendition bearer during a bounded rotation window. Minimum accepted length: 16 characters. | Unset | A rendition-token rotation is in progress. Remove after My-Chat uses the current token and the rotation window closes. | Family-growth rendition |

## Family-Growth Pairing

`MY_CHAT_INTERNAL_BASE_URL` and `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN` form one delivery capability. Supplying only one value leaves the worker off. `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN` and its optional previous value form the inbound rendition authorization set; at least one valid token is required before any bearer can pass.
