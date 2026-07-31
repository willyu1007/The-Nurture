# NestJS Ingress Migration Plan — Bounded Decomposition

## Status

- Task: T-002
- Scope: move the qualified six-surface owner path from the provisional Fastify
  dev-host into the formal, production-intended NestJS scenario-service ingress
  required by G1-05.
- State: M0 decision freeze, M1 skeleton, M2 service auth and M3 baseline
  inventory completed 2026-07-31; M3-A build/composition implementation open.
- This document records planning truth only. It is not an Owner Integration
  Handoff, a Joint Conformance record, activation, deployment or traffic
  authority.

## M0 Baseline Census (captured 2026-07-31)

- `apps/backend` is a Fastify dev-host harness: local-only, binds `127.0.0.1`,
  refuses to start outside `APP_ENV=dev|test`, and its README forbids promotion
  to any deployed service. It hosts the T-001 workflow harness routes
  (`/api/workflow/*`, `/internal/nurture/projects*`) plus the merged Wave 4 P7
  owner route.
- The P7 owner route
  (`POST /internal/nurture/scenario-binding/authorize`) is a thin ingress
  adapter. The route layer performs only: enable check (missing
  secret/authorizer → `503 binding_owner_disabled`), timing-safe bearer
  service auth, bounded-text input validation, and the `ERROR_STATUS`
  error-code→HTTP mapping. Transaction locking, guardian authority reread,
  anchor reservation and exact replay live in
  `@the-nurture/scenario` (`NurtureScenarioBindingOwnerVerifier`) and
  `@the-nurture/db` repositories, composed by
  `createScenarioBindingOwnerAuthorizer` in `apps/backend/src/binding-owner.ts`.
- At M0, no NestJS code existed anywhere in this repository and the formal
  scenario service was greenfield. M1/M2 have since created and hardened it.
- `docs/context/api/openapi.yaml` currently declares zero endpoints; the formal
  route/API index required by `ST-4(c)` starts from empty.
- Port census: the env contract default is `PORT=8000`; the frontend defaults
  target backend `3001`; Base assigns Nurture the `3200/3201` pair.
  Reconciliation is owned by `ST-2`.

## Accepted Decisions (2026-07-31)

- **ING-D1 Repository layout.** Create a new `apps/scenario-service` NestJS
  application. `apps/backend` remains the local dev-host harness, is never
  promoted, and continues serving the T-001 harness routes unchanged.
- **ING-D2 Behavior-preserving migration.** The migration changes the ingress
  shell only. The route path `/internal/nurture/scenario-binding/authorize`,
  request/response field names, error codes and status mapping stay
  byte-identical; no NestJS global prefix or serializer default may alter the
  wire behavior. The endpoint contract remains Nurture-owned and versioned;
  My-Chat remains a pinned consumer.
- **ING-D3 Cross-repository sync point.** Host/port/base-URL topology is
  consumer environment configuration, not contract. The only expected
  My-Chat-side change is pointing the joint resolver-journey test at the new
  ingress during Joint Conformance and renewing owner/joint evidence, which
  G1-05 already requires. Any wire-contract drift would instead force a
  My-Chat pin renewal and is out of scope for this migration.
- **ING-D4 Dev-host P7 route disposition.** After the NestJS path qualifies
  (M5), the dev-host binding-owner route is removed or hard-disabled so a dual
  ingress cannot create owner-evidence drift.
- **ING-D5 v1 route scope.** `/health` and the P7 binding-owner route are the
  complete formal v1 route set. The legacy
  `/internal/nurture/activation/user-attention/resolve` route is not required
  by G1 binding/association Joint Conformance and stays on the default-off
  compatibility path pending a separately versioned T-004/T-005 contract.
- **ING-D6 Scope fence.** This migration does not implement the full G1-03
  private invocation contract (nonce, expiry or canonical-request-hash
  verification beyond current P7 behavior) and does not create any C-3 named
  adoption source set. Such extensions are separate, separately qualified
  slices. M0 records an exact census of which G1-03 requirements P7 already
  satisfies and which remain gaps.
- **ING-D7 Future SPI note (recorded, not a work item).** If a second scenario
  later requires a binding-owner endpoint, consider promoting the generic
  invocation envelope (service auth, idempotency, purpose, error envelope) to
  a Base/My-Chat-defined SPI shape while business fields remain
  scenario-owned. Current scenario count does not justify this abstraction.

## Work Breakdown

### M0 — Decision Freeze (complete 2026-07-31)

- [x] Produce one port-semantics decision record: which process listens on `8000`,
  the role of the Base-assigned `3200/3201` pair, what the frontend targets,
  and which port the dev-host keeps.
- [x] Close ING-D5: fix the v1 route set from Joint Conformance fixture needs.
- [x] Produce the ING-D6 G1-03 gap census (satisfied vs deferred items).
- [x] Confirm ING-D3: verify the migration plan implies zero wire-contract change
  for the pinned My-Chat Host binding source.

Acceptance: PASS. See `13-nestjs-ingress-m0-decision-record.md`; no code, schema
or environment change.

### M1 — NestJS Skeleton and Startup Safety (complete 2026-07-31)

- [x] Bootstrap `apps/scenario-service` with centralized fail-fast
  configuration validation and `PORT=8000` default.
- [x] Add `/health`, body-safe global error handling, 64 KiB body limits,
  five-second handler timeout and allowlisted zero-body structured logging.
- [x] Keep P7 unconditionally default-disabled in M1; missing or present
  secret-shaped environment values cannot select weak/partial auth.
- [x] Prove the legacy `user_attention` and T-001 harness routes are absent.
- [x] Add frozen-install/typecheck/test/build/start/health CI coverage and
  diagnostic artifact capture.

Acceptance: PASS locally after implementation-quality repair. Package
typecheck, 4 files / 14 tests, build and
built-process smoke are green; the bounded frozen install is reproducible.
Remote CI execution awaits the next pushed source. M2 must preserve the
disabled state while adding unauthorized/authorized behavior.

### M2 — Service-auth Guard (complete 2026-07-31)

- [x] Promote the timing-safe bearer check to a NestJS guard with the same
  three-state behavior as P7: disabled (`503`), unauthorized (`401`),
  authorized.
- [x] Negative tests: no token, wrong token, disabled service.
- [x] No authentication-contract extension (ING-D6).

Acceptance: PASS locally. Guard behavior is state-for-state identical to the
Fastify route checks. Package typecheck, 5 files / 25 tests, build and
built-process smoke pass. The smoke configures the exact bearer while leaving
the authorizer absent and proves disabled state still wins. M3 remains
default-disabled and is now implementation-open.

### M3 — P7 Endpoint Migration

- [x] Capture the M3 request/response/error/composition/test baseline and
  prioritize implementation findings in
  [`14-nestjs-ingress-m3-baseline-inventory.md`](./14-nestjs-ingress-m3-baseline-inventory.md).
- [x] M3-A: establish a compiled runtime package boundary; relocate the
  authorizer factory and Guardian authority reader out of `apps/backend`;
  compose the formal service from the production Prisma client only.
- [ ] M3-B: implement the allowlisted controller/request adapter, centralize
  `ERROR_STATUS`, derive guard readiness from the actual optional authorizer,
  and run table-driven Fastify/Nest application-parity fixtures.
- [ ] M3-C: rerun child/family lifecycle, revoke, concurrency, exact replay,
  divergent replay and response-loss suites on disposable PostgreSQL through
  NestJS; execute the exact pinned My-Chat consumer against that ingress.

Acceptance has two bands. Authenticated requests reaching the P7 adapter —
including every route/domain/unknown-authorizer negative — must have
field-identical status, error and response bodies versus Fastify on the
unchanged path. Malformed JSON, payload limit, timeout and other failures
produced before the adapter retain the M1 body-safe formal-shell contract and
must not copy Fastify framework error names or messages.

### M4 — Governance Alignment (may run parallel to M3)

- Populate `docs/context/api/openapi.yaml` with the implemented owner surface;
  regenerate the API index; run `ctl-context.mjs touch` and
  `verify --strict` (`ST-4(c)`).
- Land env-contract key additions/changes via `env-contractctl`; refresh
  `env/.env.example`.
- Land the M0 port decision across env contract, listeners, frontend defaults,
  docs and tests (`ST-2`).
- Close `ST-6(b)` governance hygiene without mixing unrelated tooling changes.

Acceptance: API index describes the implemented owner surface; strict context
verification passes; port references are consistent across code, env, docs and
tests.

### M5 — Owner Integration Handoff Regeneration

- Re-pin the Nurture source population (the source set grows with the new
  service), run the privacy/leakage scan and the final false/empty census
  through the formal ingress.
- Mark the Fastify-era owner evidence as provisional/superseded.
- Remove or hard-disable the dev-host P7 route (ING-D4).

Acceptance: a renewed Owner Integration Handoff cites the formal NestJS
ingress, exact pins and final census; no second live owner ingress remains.

## Ordering and Estimate

- M0 → M1 → M2 → M3 baseline → M3-A → M3-B → M3-C are serial; M4 may
  run in parallel with M3 implementation; M5 is last.
- Rough effort: 4–6 working days of implementation, excluding the downstream
  Joint Conformance run with T-004 (which consumes this migration but is not
  part of it).

## Non-effects

This plan and its M0–M5 slices cause no schema/migration apply, database
mutation, manifest or capability change, Candidate Freeze, artifact
publication, secret provisioning, persistent environment or traffic. All
capabilities remain default-off and external traffic remains NO-GO.
