# G4-B Increment 10 — Exact-owner Signal Adapters and Consumers

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Commit: `5cc2097`
- Effect level: **I1 only**
- Verdict: adapter and consumer implementation PASS; owner integration and
  policy-migration qualification remain open

The six deterministic categories now enter one production-compatible source
reader through six typed exact-owner adapters. A missing owner implementation
cannot be replaced by an inferred deadline, a translated status or an empty
placeholder that claims success.

## Exact-owner boundary

Every owner read receives the exact Workspace, participant, active role,
Institution, request snapshot and effective signal policies. The owner MUST
resolve its own checkpoint and window vocabulary. The signal layer never
parses `checkpoint_ref`, `window_key`, local date, `updatedAt` or adjacent
status into a deadline or blocker.

The adapter inputs make the six obligations explicit:

1. attendance supplies formal submission state plus its owner checkpoint
   instant;
2. business communication supplies response/lifecycle state plus its own
   response deadline;
3. review backlog supplies current condition and a full-coverage member/Grant
   aggregate;
4. authority/source work supplies its canonical blocker condition;
5. WorkItem/Workflow supplies its canonical blocker condition; and
6. configured load supplies current condition and a full-coverage member/Grant
   aggregate.

All source refs are owner-issued opaque refs. If any deterministic owner is
unavailable or throws, the combined source read is `unavailable` with no
partial list. The AI slot is outside this reader and cannot weaken or upgrade
the deterministic result.

## Consumers

The Institution home now consumes the already-ordered projection, returns at
most three signals and exposes `support_signals_has_more`; it does not invent a
second score or selection order.

The class-list service now consumes the same projection once per request and
filters by exact `care_group_ref`. A class card exposes only tier, fixed safe
reason, optional current count, source deadline/occurrence and opaque source
ref. It cannot represent category/policy internals, communication body, child
roster or teacher metrics. An unavailable/denied source projection remains an
explicit unavailable arm instead of a plausible empty list.

Neither consumer adds a dismiss, acknowledge, escalate, WorkItem or Workflow
command.

## Falsification

| Attempt | Required result | Evidence |
| --- | --- | --- |
| Derive attendance deadline from occurrence/local date | impossible | owner fact requires `checkpoint_deadline_at`; adapter contains no derivation |
| Translate ordinary status into blocker | impossible | blocker adapters accept only owner-supplied `condition` |
| Let one owner fail while presenting five categories as complete | refused | exception and unavailable fixtures return one empty `unavailable` result |
| Leak another class's signal onto a card | refused | exact `scopeRef === care_group_ref` fixture |
| Hide a fourth Institution-home signal | refused | first three retained and `support_signals_has_more=true` |
| Add protected/body or ranking fields to a card | refused | exact key/body-free negative fixture |

## Verification

- Scenario and DB package typechecks: zero errors.
- Targeted signal/class tests: **37/37**.
- Full unit lane: **825/825**, 73 files.
- Targeted production-DB lane: **12/12** for class-list and support-policy
  repository compatibility.
- Full production-DB lane: **347/348**, 36 files. The sole red check remains
  the four CHECK constraints authored in the deliberately unapplied
  `20260809180000_g4b_institution_support_signal_policy` migration.
- Test routing: 136 files — unit 73, production DB 36, dev host 11, scenario
  service 14 and X5 joint 2.
- Persistence boundary, G2 Exit DB census, G3-0 freeze and whitespace checks
  pass.
- C30-I3 Nurture source lock passes at `5cc2097`, hash `0b00f2ee…`; the
  exact Nurture runtime self-pin is `e8b827a1…` over 223 files. External
  My-Chat remains intentionally unadopted: workflow pin expected `567b96c`,
  C30 upstream expected `51ad97f`, observed `ebc7605`.

Re-run the non-build checks with:

```sh
pnpm --filter @the-nurture/scenario typecheck
pnpm --filter @the-nurture/db typecheck
pnpm test:unit
node scripts/run-with-local-env.mjs pnpm exec vitest run -c vitest.db.config.ts
pnpm verify:test-routing
pnpm verify:persistence-boundaries
```

The DB command is expected to remain 347/348 until the policy migration is
applied to an explicitly approved disposable target; no other red test is an
accepted result.

## Remaining gate and non-effects

This increment does **not** claim I3 owner integration or close G-03. Each
adapter still needs a concrete exact-owner provider in the eventual ingress,
and the policy migration still needs an explicitly approved disposable target
before its real table path can qualify. Missing owner bindings fail closed;
there is no synthetic production fallback.

No database was migrated, no capability/contract was registered or rotated,
and no deployment, activation or traffic occurred.
