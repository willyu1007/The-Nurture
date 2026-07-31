# Scenario service

`@the-nurture/scenario-service` is the production-intended NestJS ingress for
Nurture-owned APIs. M1 exposes only health and a fail-closed placeholder for
the binding-owner route. It does not replace My-Chat auth/runtime ownership and
does not enable any scenario capability.

## Current routes

| Method | Path | Current behavior |
| --- | --- | --- |
| `GET` | `/health` | `200 {"ok":true}` |
| `POST` | `/internal/nurture/scenario-binding/authorize` | `503 {"error":"binding_owner_disabled"}` until M2/M3 |

All other paths return a body-safe `404`. The legacy Fastify workflow harness
and `user_attention` route do not run in this service.

## Configuration

The service reads configuration only through `src/config.ts`.

| Variable | Default | Rule |
| --- | --- | --- |
| `APP_ENV` | `dev` | `dev`, `staging` or `prod` |
| `SERVICE_NAME` | `the-nurture` | lower-case service identifier |
| `PORT` | `8000` | integer from 1 through 65535 |

Owner secrets remain optional and are not consumed by M1. Their absence keeps
the binding-owner endpoint disabled. Configuration errors fail startup without
printing environment values.

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
- M2 adds the timing-safe service-auth guard. M3 composes the existing P7
  authorizer without changing the wire contract.
