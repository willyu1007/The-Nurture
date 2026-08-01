# G1 Joint Conformance — Execution Plan

## Outcome

- Task: T-002 + T-004 (joint)
- Slice: G1 Joint Conformance execution plan (planning only; no run yet)
- Prepared: 2026-08-01
- Inputs: T-004 `nurture.surface-contract@1.7.0` / `sha256:b7691a81…`
  (synthetic qualification PASS, review-hardened) and the T-002 M5 Owner
  Integration Handoff (`16-owner-integration-handoff-m5.md`, My-Chat
  `a019566` / Base `06303e9`).

## Run Preconditions

1. Materialize detached worktrees of My-Chat at exact `a019566` and Base at
   exact `06303e9` (verification materialization; never the drifting sibling
   working copies). `pnpm verify:workflow-contract-pin` must pass against
   them before any suite runs.
2. Fresh disposable PostgreSQL databases for both sides (`x5_my_chat` with
   its pinned migrations, `x5_nurture`, `nurture_dev_host`), created and
   destroyed inside the run.
3. The formal NestJS scenario-service built from the current head; the
   dev host has no owner route (single-ingress regression test green).

## Suite Composition (G1-06 matrix mapping)

| Matrix cell | Existing suite | Status |
| --- | --- | --- |
| Positive binding/association/auth, exact replay, response-loss recovery | `apps/scenario-service` `test:db` case 1 | green |
| Post-revoke, unknown/ended/future/inactive authority fail-closed | `test:db` case 2 | green |
| Lock/concurrency until HTTP receipt commit | `test:db` case 3 | green |
| Missing/stale production anchors (pinned-consumer denial) | `test:db` case 4 | green |
| X5 materialize-once, replay, revoke fail-closed on two real DBs | `packages/nurture-db` x5 joint acceptance | green |
| Service auth (wrong/missing token) | scenario-service suite + unit | green |
| Wrong workspace/user/actor/purpose, `bound_empty` recovery | partially inside fail-closed cases | verify coverage during run; add named negatives if absent |
| Owner unavailable, contract mismatch, stale confirmation/heads | not yet explicit at the joint layer | gap — add before declaring PASS |
| Leakage scan + final false/empty census | M5 posture + unit assertions | rerun through the joint harness and record |

The T-004 fixtures bind the consumer side: the same synthetic world/journey
refusal semantics (`not_authorized`/`setup`, `target_unavailable`) must map
onto the real owner-path denials observed in the run; the conformance-case
registry records the executed targets.

## Record (G1-07)

One `g1-joint-conformance-record` appended to this bundle citing: both
artifact/handoff identities above, exact revisions, commands, per-cell
results, the negative matrix, final false/empty census, and a single verdict
`PASS | NO_GO | INVALIDATED`. Only PASS opens protected T-005～T-007
implementation. Wave4 import-closure scoping (review finding #5) is decided
at the next pin action and does not block this run.

## Non-effects

Planning only. The run itself creates no persistent database, capability,
secret, deployment, activation or traffic change; all consumers stay
default-off until and beyond the verdict.
