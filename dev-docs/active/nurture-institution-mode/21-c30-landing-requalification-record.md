# C30 Landing Requalification Record

> Historical evidence: this 2026-08-08 revision binding was invalidated by
> later pin drift. The current-pin replacement is
> [`22-c30-current-pin-requalification-record.md`](./22-c30-current-pin-requalification-record.md).

## Verdict

- Date: 2026-08-08
- Task: T-002
- Verdict: `C30_LANDING_REQUAL_PASS`
- State: qualified, default-off
- Non-effects: no persistent database (disposable containers only, destroyed
  after the run), no deployment, no capability activation, no traffic
  authorization, no Service Candidate. `C30-I4`, C31-C35, T-007 G4 and T-008
  remain separately gated.

This closes step 5 of
[`20-c30-cross-repository-landing-plan.md`](./20-c30-cross-repository-landing-plan.md).
It qualifies the landing — that C30 works at current pins across all three
repositories — and inherits, rather than re-adjudicates, the branch's own
per-increment acceptances.

## Exact Bound Inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `4350086993d837baa8030564f4e19593dedd96b0` |
| My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |
| Base/My-Chat contract parity | `98f6c24115e02e4abf0e3c9d855849f1c7993974e2ed9bcc72c868c642433d2f` (21 files, both sides) |
| `x5_joint_api` | `ba2a4f9fe0b9cf893bf1de40cfd27c404304e3bb38c3d41f4cf90189c211a3d4` (227 files) |
| `wave4_binding_host` | `604796160dd58230e022585006d0f9fcf608e4428e785ae51be2ca875f758e62` (22 files) |
| `web_workbench` | `815311f7…` (unchanged) |
| Nurture self-pin | `c18ef2e070de91a401aa374e09e5b0f914bc8f497382e9c0bc48901e0f1b2e38` (204 files) |
| Surface contract | `nurture.surface-contract@1.17.0` / `sha256:d22851d9…` (unchanged by C30) |
| C30 owner-adoption lock | `41d310a211c5ae6e…` at source revision `e323d844` |
| My-Chat host-adoption lock | `a95bb9835ad27081…` at runtime revision `8228c2a` |

## Topology

Two disposable containers on free loopback ports, both created empty and
destroyed after the run. The pre-existing `nurture-postgres` (5433) and
`codex-q4b5-mychat-pg` (55439) were never touched.

- `c30-requal-nurture` (`postgres:16-alpine`, `127.0.0.1:55444`) — production
  database plus the dev-host database.
- `c30-requal-mychat` (`pgvector/pgvector:pg16`, `127.0.0.1:55445`) — the joint
  x5 consumer.
- `c30-i2-census` (`pgvector`, `127.0.0.1:55438/mychat_c30_i2`) — created
  because the C30-I2 default-off census pins that exact endpoint. The pin is a
  guard against running the census against a real database, so it was satisfied
  rather than relaxed.

Unlike T-009's closing run, this used the live checkouts rather than detached
worktrees, because all three were verified clean and at exactly the pinned
heads. That is a weaker guarantee than a detached topology and is recorded as
such.

## Gate Evidence

| Gate | Result |
| --- | --- |
| `verify:workflow-contract-pin` | ok — all six entries |
| `verify:owner-integration` | ok — `nurture.surface-contract@1.17.0` / `sha256:d22851d9…`, ingress-actions 25 / ingress-queries 8 / **unexercised 0**, formal scenario-service HTTP against real PostgreSQL with runtime-recorded per-key evidence, and both joint journeys PASS (`t007-t006=publication`, `t005-t006=direct-interaction`). Run on a fresh disposable database; an earlier attempt after teardown reached the local development database and failed on its pre-existing rows, which is a topology error and not a defect. |
| `verify:c30-i3-upstream` | ok — exact heads on both siblings plus both source profiles |
| `verify:c30-i3-owner-adoption` | ok — `41d310a2…` |
| `verify:c30-i3-default-off` | ok — census `448d37e1…`, every positive count zero |
| My-Chat C30-I2 default-off census | `status: default_off`, census `989e8294…`, all row sets empty |
| assert suite | ok — test-routing, g2-exit-contract, g3-0-freeze, persistence-boundaries, formal-ingress-contract, port-topology, n1-schema-contract, x4-handoff-replay-contract, surface-contract, surface-conformance |
| Nurture migrations from empty | 23 applied, `migrate status` current, `migrate diff` **No difference detected** |
| `db:assert-boundary` | ok — 73 tables / 97 enums |
| `dev-host:db:assert-boundary` | ok — 6 tables / 2 enums |
| `pnpm typecheck` | 0 errors |
| `pnpm lint` | ok |
| `pnpm test:unit` | 63 files / 672 tests |
| `pnpm test:db` | 291 tests |
| `pnpm test:dev-host` | 11 files / 27 tests |
| scenario-service `test` + `test:db` (dist) | 11/66 + 3/64 |
| x5 joint lane | 2 files / 12 tests, both databases |
| My-Chat typecheck / unit | 0 errors / 769 passed |
| Base `verify:workflow-contracts` | 441 tests, 0 failures |

The migration result is the one that settles the plan's open question: the C30
migrations dated 2026-08-06 and T-009's dated 2026-08-07 interleave by
timestamp but create and alter disjoint tables, enums and columns, so replaying
all 23 from empty yields a schema with no diff against the model.

## Defects Found and Fixed

Every one was pre-existing in the branch and surfaced only because this run
executed gates the branch's own qualification did not.

1. **`assert-g3-0-freeze` table census** — the branch adds ten persisted tables
   and never declared them. Declared after reviewing each against the census's
   claim that the board envelope is never persisted as a unified child-state
   row; none of them is.
2. **`assert-g2-exit-contract` pins** — a gap in step 3 of this landing, not the
   branch's: the pin file rotated but the gate asserting its contents did not.
3. **Dev-host validation snapshot** — drifted from the conformance snapshot it
   documents itself as mirroring, failing fatally at WF-MAN-111, WF-MAN-119
   (twice) and WF-MAN-042.
4. **Missing Run binding verifier** — the newer runtime requires one whenever a
   manifest declares a `workflow_step_complete_v1` handoff, which
   `user_attention` does. Implemented for the dev host, rereading the run row
   instead of trusting the payload.
5. **Joint fixture J2** — asserted that a guardian-confirmation envelope fails
   closed "until the consumer implements it". The pin rotation brought in the
   My-Chat commits that implement it, so the premise expired.
   `pending_guardian_confirmation` was already the frozen contract's answer, so
   the fixture now asserts the implemented path and its companion rule
   (`admission_ref`, never `material_ref`, no material while pending).

One thing deliberately **not** done: the first draft of the Run binding verifier
required an actor before activating a Handoff. `actor_id` is optional in
`WorkflowRunExecutionBinding` and the dev host legitimately creates actorless
runs, so the invented rule was removed rather than the fixtures bent to satisfy
it.

## Known Pre-existing Drift, Not Addressed

My-Chat's `migrate diff` reports one difference on `guardian_current_focus` — an
index renamed between what `20260808060000_family_growth_cultivation_wave2`
wrote and what the model derives. That migration is My-Chat's own, dated
2026-08-08, and the C30 branch has zero references to that table. It belongs to
whoever owns the cultivation wave.

## What This Restores

This record is the current-pin evidence T-002's owner path has lacked since the
T-009 rotations. It is what allows the G4-0A ledger row in
`dev-docs/active/nurture-institution-surfaces/07-g4-0a-inventory-record.md`
("Pin Rebind") to move from `DEFINED_UNQUALIFIED` back to `PRESENT_PINNED`,
which is why option C was chosen over the two T-007 0C paths on 2026-08-08.

## Invalidation

Any surface digest, owner revision or source-pin hash, Nurture self-pin
population, database schema or migration, or default-off posture drift
invalidates the affected portion and requires requalification. Because this run
used live checkouts rather than a detached topology, any sibling commit
invalidates the revision binding even when content-inert — three such advances
already happened during the landing itself.
