# Phase 4 — Synthetic Contract Qualification and Handoff

## Outcome

- Task: T-004
- Slice: Phase 4 synthetic contract qualification and consumer handoff
- Completed: 2026-08-01
- Result: `SYNTHETIC_CONTRACT_QUALIFICATION_PASS / OWNER_INTEGRATION_NO_GO /
  JOINT_CONFORMANCE_NOT_RUN`
- Qualified exact interface: `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`

This record is the T-004 contract-baseline milestone of G1-06's first
qualification layer only. It claims no real binding, Enrollment/Grant,
authenticated path, notification, activation or traffic readiness. Every
T-002 gate that was NO-GO before this record remains NO-GO.

## Qualification Suite

- Single command: `pnpm verify:surface-conformance`
  (`scripts/surface-contract/run-surface-conformance.mjs`). It reruns, in
  order: deterministic digest rebuild, strict schema validation including
  every fixture/conformance registry check and seven negatives, the
  generator/rotation tooling guards, and all six surface-contract vitest
  files (55 tests), then re-verifies conformance coverage and prints the
  layer summary with the explicit owner-integration NO-GO line.
- Case registry: `source/conformance/conformance-cases.json` — 11 cases
  across the closed kind set (schema compilation, digest rebuild, tooling
  guard, descriptor/handler/presenter consistency, contract admission,
  dependency fail-closed, visibility, deterministic fixtures). Every case
  binds `covers` slice refs; the validator expands `all_slices` against the
  generated manifest and fails if any of the 25 slices (10 capabilities, 6
  surfaces, 8 fixtures, shared core) is uncovered, if a case covers an
  unknown slice, or if a suite target is missing. The optional
  `acceptanceRefs` field (`T###-AC-###`) lets consuming tasks back-link
  acceptance items mechanically; absence does not affect T-004
  qualification.
- CI runs the same single command as the permanent surface-contract gate.

## Deterministic Chain Coverage (engine-ready, not engine-complete)

- catalog → eligibility: the descriptor registry plus the P3-3 selection
  fixtures prove deterministic candidate filtering, unique-target
  convergence, clarification instead of silent write-target choice,
  confirmation-policy parity and dependency fail-closed.
- typed handler: capability slices bind typed input/result/error schemas and
  effects; journey scripts exercise every action capability's business
  input shape and result effect. Handler/presenter binding keys are
  engine-ready declarations; executing them is T-005+ scope behind
  Contract Boundary and Joint Conformance.
- surface presenter: expected views bind surfaces, roles, role-safe states
  and affordances; visibility and D-04 separation are covered read-side.

## Breaking-change Policy and Exact Pin Method (consumer-facing)

Normative sources: `interface/compatibility-policy.json` plus the Consumer
adoption checklist in `contracts/surfaces/v1/README.md`. Summary: exact
key+version+digest admission only; no ranges, `latest` or fallback; every
semantic or additive change rotates version+digest; evidence scope is
per-slice (unchanged slice keeps evidence, changed slice invalidates
referencing evidence, shared-core drift invalidates all); the manifest is
loadable only with the separately trusted artifact pin.

## T-008 Handoff Inputs

- Interface contract identity: the exact ref above, rebuildable from a clean
  checkout by `pnpm build:surface-contract` and byte-verified by
  `pnpm verify:surface-contract`.
- Artifact set: descriptor registry, surface/invocation/error schemas,
  policy/schema refs, fixture manifest (eight fixture slices in the
  generated manifest) and the conformance-case registry — all under the one
  root digest.
- Service Candidate identifier, bundle freeze and composite validation
  binding remain T-008 (+ My-Chat companion) scope and do not block this
  baseline.

## Invalidation Semantics for This Record

Per G1-07: any public-contract drift (root digest change) supersedes this
record for the affected slices; slice-hash comparison against
`nurture.surface-contract@1.7.0` decides the affected set mechanically;
shared-core drift voids the record entirely and the recovery is one rerun of
`pnpm verify:surface-conformance` on the successor identity. This record is
append-only history; later identities add new records instead of rewriting
it.

## Next

The T-004 side of G1 is ready for convergence: Joint Conformance requires
the T-002 pin advance (`a019566` line) plus the M5 Owner Integration Handoff
regeneration, then the same fixtures/suite run against the real pinned owner
path through the formal NestJS ingress. Only that joint result opens
protected T-005～T-007 implementation.
