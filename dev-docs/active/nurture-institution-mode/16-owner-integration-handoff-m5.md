# Owner Integration Handoff — M5 Regeneration

## Outcome

- Task: T-002
- Slice: M5 — Owner Integration Handoff regeneration
- Completed: 2026-08-01
- Result: `M5_COMPLETE / OWNER_HANDOFF_RENEWED / JOINT_CONFORMANCE_PENDING`

This handoff cites the formal NestJS ingress and exact pins only. It is not
Joint Conformance, activation, Candidate, deployment or traffic authority;
protected T-005～T-007 integration stays NO-GO until the G1 joint run.

## Exact Pins (current handoff inputs)

- My-Chat: `a0195662228a2fc6323b9ea0cd327d3608d8cc17` (declared R3 cut).
- My-Workflow-Base: `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
- `x5_joint_api`: 34 paths, `89a61355…` (unchanged by M5).
- `wave4_binding_host`: 16 paths / 20 files, `960afb2c…` — the census-flagged
  coverage gap is closed: `nurture-owner.resolver.ts`, the R2a
  `scenario-owner-resolver.registry.ts` and the ST-5
  `child-birth-date.controller.ts` are now pinned. The prior 13-path
  population was sanity-reproduced byte-exactly at `a019566` before the
  extension; the new hash is computed at the same exact revision from git
  objects (`15-mychat-drift-census-pin-advance-input.md` is the decision
  input).
- Nurture scenario self-pin: 41 paths / 54 files, `76f9d966…`, recomputed
  with the verifier's own `computeContractHash` after the ING-D4 removal.
- T-004 consumer-side contract: exact
  `nurture.surface-contract@1.7.0` / `sha256:b7691a81…`
  (synthetic qualification record:
  `../nurture-surface-contract-foundation/08-phase-4-synthetic-qualification-and-handoff.md`).

## Single Ingress (ING-D4 executed)

The Fastify dev-host P7 binding-owner route, its server registration and both
transitional P7 e2e tests are removed (`78144cc`). The formal NestJS
scenario-service is the only live owner ingress; no dual-ingress
owner-evidence drift is possible. All Fastify-era owner evidence (the P7
`e9868c5`/`993e0c9` line and the M3-era dev-host parity tests) is now
provisional/superseded history and MUST NOT be cited as current owner
readiness.

## Evidence Census

- Formal-ingress DB journey: `apps/scenario-service` `test:db` — the
  binding-owner e2e (service auth, transaction-locked authority reread,
  deterministic reservation, exact replay, revoke fail-closed) 4/4 green on
  the real disposable PostgreSQL (2026-08-01, local, `run-with-local-env`).
- Scenario-service suite 42/42; dev-host suite 25/25 post-removal (proving
  the dev-host no longer serves the owner route); unit 249/249; test-routing
  census dev-host 12 → 10; backend `tsc --noEmit` clean.
- Default-off/false-empty posture: the scenario-service keeps its
  default-disabled startup and env contract from M4; removing the dev-host
  route also removes its only enablement path, so no owner endpoint can be
  enabled outside the formal service. Capability gates remain false; no
  schema/migration, database mutation, secret, deployment, activation or
  traffic change occurred in M5.
- Authoritative cross-repo verification: sibling checkouts drift locally by
  design; trunk CI on the M5 commits (checking out the exact pinned
  revisions) is the binding pin/regression evidence, per the M4 precedent
  that build-aware CI jobs are authoritative.

## Remaining Before G1

Joint Conformance only: the same T-004 fixtures/suite run against this
handoff's exact owner path through the formal NestJS ingress, with the
negative matrix and final false/empty census, per G1-06. That joint record —
not this handoff — opens protected qualification.
