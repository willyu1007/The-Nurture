# Scenario service

`@the-nurture/scenario-service` is the production-intended NestJS ingress for
Nurture-owned APIs. M3 exposes health and the fail-closed binding-owner route
through the frozen P7 service-auth guard and production Prisma composition. It
does not replace My-Chat auth/runtime ownership and does not enable any scenario
capability.

## Current routes

| Method | Path | Current behavior |
| --- | --- | --- |
| `GET` | `/health` | `200 {"ok":true}` |
| `POST` | `/internal/nurture/scenario-binding/authorize` | Disabled-first service auth; when fully configured, runs the M3 owner authorizer and returns the frozen P7 receipt |

All other paths return a body-safe `404`. The legacy Fastify workflow harness
and `user_attention` route do not run in this service.

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
