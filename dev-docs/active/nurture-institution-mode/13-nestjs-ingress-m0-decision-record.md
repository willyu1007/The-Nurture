# NestJS Ingress M0 Decision Record

## Outcome

- Task: T-002
- Slice: NestJS ingress M0 — Decision Freeze
- Completed: 2026-07-31
- Result: `M0_PASS / M1_IMPLEMENTATION_OPEN`
- Evidence head: `e5cc524`

M0 fixes the port semantics, formal v1 route set, G1-03 gap census and
wire-stability fence required before `apps/scenario-service` is created.
It changes documentation only and does not claim Owner Integration Readiness,
Joint Conformance, activation, deployment or traffic authority.

## Port Semantics

| Boundary | Port | Decision |
| --- | --- | --- |
| NestJS scenario-service process | `8000` | The process MUST listen on `PORT`; the env-contract default remains `8000`. It MUST NOT also listen on `3001` or `3200`. |
| Base-assigned Nurture backend endpoint | `3200` | Host-visible local integration endpoint. Local composition/proxy MAY map `127.0.0.1:3200` to scenario-service `:8000`; this is topology, not an application compatibility listener or API-contract field. |
| Base-assigned Nurture frontend endpoint | `3201` | The Nurture frontend local server moves to `3201` during M4 and targets the backend endpoint at `http://localhost:3200`. |
| Fastify dev-host harness | `3001` | The existing local-only workflow harness remains on `127.0.0.1:3001`. During M4 it stops consuming the shared `PORT` key and uses a dev-only `DEV_HOST_PORT` default of `3001`. |

Consequences:

- `PORT=8000` belongs only to `apps/scenario-service`.
- `3200/3201` are local ecosystem topology assignments and do not enter the
  scenario API or My-Chat wire contract.
- `3001` remains the Fastify dev-host port until M5 removes or hard-disables
  its binding-owner route. The harness is never promoted.
- M4 MUST reconcile env contract, frontend defaults, listeners, docs and tests
  to this table. No dual listener or silent compatibility alias is allowed.

## Formal v1 Route Set

The first formal NestJS ingress version contains exactly:

| Method | Path | M1 behavior | Final owner |
| --- | --- | --- | --- |
| `GET` | `/health` | Body-free liveness response; no configuration or dependency detail | scenario-service |
| `POST` | `/internal/nurture/scenario-binding/authorize` | `503 {"error":"binding_owner_disabled"}` until the M2/M3 guard and authorizer are configured | Nurture binding owner |

The application MUST NOT use a global prefix or a serializer that changes these
paths or response bodies.

`POST /internal/nurture/activation/user-attention/resolve` is excluded from v1.
It belongs to the legacy, default-off `user_attention` compatibility path and
is not required by the G1 binding/association Joint Conformance fixtures. Its
future formal-ingress inclusion requires the exact T-004/T-005 action-delivery
contract and an independently qualified route slice. The T-001 workflow harness
routes also remain Fastify-only and are excluded.

Unknown paths MUST return the framework's body-safe `404`; they MUST NOT fall
through to the Fastify dev host.

## G1-03 Gap Census

`P7` below means the current Fastify
`POST /internal/nurture/scenario-binding/authorize` implementation. This census
prevents M1-M3 from being reported as the full private-invocation contract.

| G1-03 requirement | P7 state | Evidence / remaining work |
| --- | --- | --- |
| Timing-safe service credential check | `SATISFIED_BY_P7` | Static bearer comparison is timing-safe and missing token disables the route. M2 preserves this three-state behavior. |
| Workload identity, issuer/audience and caller allowlist | `DEFERRED_G1_EXTENSION` | The static bearer proves possession only; it does not bind an allowlisted workload subject or audience. |
| Exact Workspace/User/Actor fields | `PARTIAL` | P7 requires bounded values, but they are caller body fields and are not independently signed or bound to a trusted principal envelope. |
| Service identity is not adult authority | `PARTIAL` | P7 separately carries `acting_user_id`/`acting_actor_id` and transactionally reads a Guardian role, but the service credential does not authenticate those body fields. |
| Exact purpose | `SATISFIED_BY_P7` | Only `scenario_binding_write` is accepted and persisted. |
| Invocation issue time and expiry | `DEFERRED_G1_EXTENSION` | P7 creates a five-minute owner Receipt; it does not validate request `issuedAt`/`expiresAt`. Receipt TTL is not invocation freshness. |
| Single-use nonce and transport replay ledger | `DEFERRED_G1_EXTENSION` | No invocation nonce or transport replay store exists. |
| Idempotency key | `SATISFIED_BY_P7` | Workspace-bound HMAC evidence is persisted; exact replay rereads current authority. |
| Canonical request hash / signature | `PARTIAL` | P7 computes an internal HMAC request fingerprint and detects same-key/different-input conflict, but accepts no explicit canonical request hash/signature and does not reject unknown HTTP body fields. |
| Exact typed anchor lock | `SATISFIED_BY_P7` | Receipt issuance locks the exact Child/Family anchor and validates owner version. Anchor reservation is a separate, body-free transaction before issuance. |
| Transaction-scoped current authority reread | `PARTIAL` | P7 locks a current active Guardian RoleAssignment in the Receipt transaction. It does not yet prove the full subject-specific binding/association/principal chain. |
| Receipt insert or exact replay in the authority transaction | `SATISFIED_BY_P7` | Current authority is reread before insert and before replay; replay conflict and inactive Receipt fail closed. |
| Revoke/concurrency/response-loss behavior | `SATISFIED_PROVISIONALLY` | P7 PostgreSQL tests cover revoke interleaving and exact replay. They MUST be rerun through NestJS on disposable PostgreSQL before Owner Integration Readiness. |
| No remote call inside Nurture transaction | `SATISFIED_BY_P7` | Authority and Receipt work use the injected Prisma transaction only. |
| Binding-owner Receipt is separate from business Execution/Receipt | `SATISFIED_BY_P7` | Separate types, persistence and TTL are retained. |
| Business effect + CommandExecution + business Receipt atomicity | `OUT_OF_P7_SCOPE` | Owned by later capability-specific T-005～T-007 command slices; NestJS migration MUST NOT invent it. |
| Host principal/binding admission before owner attempt | `DEFERRED_G1_EXTENSION` | Requires the pinned My-Chat current-owner carrier and Joint Conformance, not a NestJS shell change. |

M1-M3 are allowed to preserve the P7 column exactly. They MUST NOT silently
upgrade a `PARTIAL`, `DEFERRED_G1_EXTENSION` or `OUT_OF_P7_SCOPE` row to
complete. Those rows require separate contract, implementation and
qualification work.

## Wire-stability Fence

M3 is behavior-preserving. For
`POST /internal/nurture/scenario-binding/authorize`, the following are frozen:

- exact method and path;
- current snake_case request field names, required/optional rules and bounded
  text semantics;
- `authorized` response field names and ISO timestamp formatting;
- error codes and current HTTP status mapping;
- three-state disabled/unauthorized/authorized behavior;
- no global prefix, redirect, envelope wrapper or serializer-added fields.

Host/port/base URL changes are consumer environment configuration and do not
change the wire contract. Joint Conformance MAY point the pinned My-Chat
resolver journey at the NestJS base URL. Any request/response/error change is
not part of this migration; it requires an additive versioned contract and
consumer pin renewal.

M3 acceptance MUST compare Fastify and NestJS responses for the same positive
and negative request corpus and require field-identical status codes and JSON
bodies.

## M1 Release Conditions

M1 may now create `apps/scenario-service` only if it:

1. uses the existing env-contract `APP_ENV`, `SERVICE_NAME` and `PORT`;
2. exposes only `/health` and the disabled binding-owner response when owner
   secrets/composition are absent;
3. applies body-size, timeout, body-safe error and zero-PII logging defaults;
4. adds clean build/start/health verification;
5. makes no DB, schema, manifest, capability, secret, activation or traffic
   change.

M2 service auth and M3 authorizer composition remain serial follow-ups.

## Verification

Run:

```bash
node .ai/scripts/lint-docs.mjs \
  --path dev-docs/active/nurture-institution-mode \
  --strict --check-anchors
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs \
  verify --repo-root . --strict
git diff --check
```

Expected result: all commands pass; the diff contains task/governance
documentation only.

## Non-effects

M0 creates no application source, package dependency, lockfile, schema,
migration, database mutation, API artifact, environment value, secret,
capability, Scenario row, deployment, activation or traffic.
