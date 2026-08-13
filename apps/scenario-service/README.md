# Scenario service

`@the-nurture/scenario-service` is the production-intended NestJS ingress for
Nurture-owned APIs. It exposes health, the fail-closed binding-owner route and
the default-disabled Harness/institution owner-read routes through service-authenticated
production Prisma compositions. It does not replace My-Chat auth/runtime ownership;
route availability does not activate a scenario capability or authorize traffic.

## Current routes

| Method | Path | Current behavior |
| --- | --- | --- |
| `GET` | `/health` | `200 {"ok":true}` |
| `POST` | `/internal/nurture/scenario-binding/authorize` | Disabled-first service auth; when fully configured, runs the M3 owner authorizer and returns the frozen P7 receipt |
| `POST` | `/internal/nurture/harness/prepare-action` | Prepares one exact admitted capability and returns a bound confirmation or fail-closed decision |
| `POST` | `/internal/nurture/harness/execute-action` | Executes one confirmed action through the real owner path |
| `POST` | `/internal/nurture/harness/query` | Reads one role-safe capability projection |
| `POST` | `/internal/nurture/harness/read-result` | Re-reads the current projection for a committed command |
| `POST` | `/internal/nurture/institution/business-communications:read` | Additional default-off Institution Admin owner-read route |
| `POST` | `/internal/nurture/parent-context-presenter/v1/day` | Default-off parent day presenter with bounded activity summaries |
| `POST` | `/internal/nurture/parent-context-presenter/v1/daily-care` | Default-off daily-care card presenter |
| `POST` | `/internal/nurture/parent-context-presenter/v1/activity-detail` | Default-off detail for an activity ref returned by the day presenter |
| `POST` | `/internal/nurture/parent-context-presenter/v1/notices` | Default-off list/prepare/confirm presenter with a closed kind/status matrix and five-field confirmation identity |
| `POST` | `/internal/nurture/parent-context-presenter/v1/freshness-attendance` | Default-off freshness and attendance projection |
| `POST` | `/internal/nurture/parent-communication-owner/v1/summary` | Default-off minimized communication availability and unread summary; no private detail |
| `POST` | `/internal/nurture/parent-communication-owner/v1/detail` | Default-off explicit-open bounded members and teacher timeline |
| `POST` | `/internal/nurture/parent-communication-owner/v1/media-access` | Default-off P0 contract ingress; resolves current authority but returns `content_unavailable` until the private stream ingress and My-Chat proxy are implemented |
| `POST` | `/internal/nurture/parent-communication-owner/v1/send-text` | Default-off text prepare/confirm exchange with same-command reconciliation |

All other paths return a body-safe `404`. The legacy Fastify workflow harness
and `user_attention` route do not run in this service. Every private route uses
the same service bearer; the Harness remains disabled until service auth,
`DATABASE_URL`, the integrity key and the protected-content key are all present.
Institution business-communication read additionally requires its explicit flag.
The five parent-context presenter routes require their explicit flag, the
shared service bearer, complete Q6 owner ports and an active
consumer-generation boundary port. Every composed response is checked against
the published closed schema before it can cross the controller. Missing
configuration is always a private `503`; route registration alone does not
activate the routes.

The owner route returns `503 {"error":"binding_owner_disabled"}` when either
the authorizer composition or the service token is absent. Only when both are
supplied does a missing/wrong bearer return
`401 {"error":"service_auth_required"}`. The exact bearer reaches the M3 owner
authorizer; domain denial, replay and current-authority errors retain the frozen
P7 HTTP/error mapping.

## Configuration

The service reads configuration only through `src/config.ts`.

| Variable | Default | Rule |
| --- | --- | --- |
| `APP_ENV` | `dev` | `dev`, `staging` or `prod` |
| `SERVICE_NAME` | `the-nurture` | lower-case service identifier |
| `PORT` | `8000` | integer from 1 through 65535 |
| `DATABASE_URL` | none | Nurture-owned production Prisma connection |
| `NURTURE_INTERNAL_SERVICE_TOKEN` | unset | optional secret; absence disables the owner guard |
| `NURTURE_BINDING_EVIDENCE_KEY` | unset | optional secret of at least 32 characters; absence disables production owner composition |
| `NURTURE_HARNESS_INTEGRITY_KEY` | unset | secret of at least 32 characters; absence disables the Harness runtime |
| `NURTURE_PROTECTED_CONTENT_KEY` | unset | secret of at least 32 characters; absence disables the Harness runtime |
| `NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED` | `false` | exact `true` enables only the additional Institution owner-read route after the Harness is available |
| `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED` | `false` | exact `true` permits parent-context composition only when the exact adopted digest and all owner ports are also configured |
| `NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED` | `false` | exact `true` permits parent-communication composition only when the exact adopted digest and authority/owner/async ports are also configured |

The service token is loaded into a dedicated timing-safe authenticator rather
than the printable non-secret configuration object. The evidence key is loaded
only by the production owner composition. Configuration errors fail startup
without printing environment values.

## Local verification

```bash
pnpm --filter @the-nurture/scenario-service typecheck
pnpm --filter @the-nurture/scenario-service test
pnpm --filter @the-nurture/scenario-service build
node scripts/smoke-scenario-service.mjs
```

Expected: typecheck/tests/build pass; the smoke process starts the compiled
service, verifies health, disabled binding-owner behavior and absent legacy
routes, then terminates it.

## Security boundary

- Only JSON bodies are parsed, with a 64 KiB limit.
- Node header/request receipt and handler execution are each bounded to five
  seconds.
- Unknown errors return `{"error":"internal_error"}`.
- Structured logs contain only generated request id, method, allowlisted route
  class, status and duration. URL, query, headers, body, identity and secret
  values are never logged.
- Unknown HTTP methods are normalized to `UNKNOWN`, and the Express
  `X-Powered-By` header is disabled.
- The route-scoped M2 guard preserves P7 ordering: owner composition/token
  absence is `503` before credentials are inspected; an invalid bearer is
  `401`; an exact bearer passes using length-gated `timingSafeEqual`.
- M3 composes the existing P7 authorizer without changing the wire contract.
