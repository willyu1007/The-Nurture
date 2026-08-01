# G1 Joint Conformance Record (G1-07)

## Outcome

- Task: T-002 + T-004 (joint)
- Slice: G1 Joint Conformance execution (G1-06 matrix run and G1-07 record)
- Executed: 2026-08-01 (local, single run; all disposable resources destroyed
  inside the run)
- **Verdict: `PASS`**
- Effect of the verdict: protected T-005～T-007 implementation is now open per
  the G1 gate definition. Nothing else changes: every consumer stays
  default-off, and persistent DB apply, capability activation, secrets,
  artifact publication, deployment, staging/production and external traffic
  remain separately unauthorized.

## Bound Identities

- T-004 consumer-side contract: exact `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`,
  qualification record
  `../nurture-surface-contract-foundation/08-phase-4-synthetic-qualification-and-handoff.md`.
  Re-verified inside this run by `pnpm verify:surface-conformance`
  (deterministic digest rebuild, byte-identical identity, 11 conformance
  cases, 25/25 slices, 6 files / 56 tests).
- T-002 owner-side handoff: `16-owner-integration-handoff-m5.md`
  (`M5_COMPLETE / OWNER_HANDOFF_RENEWED`), My-Chat pin
  `a0195662228a2fc6323b9ea0cd327d3608d8cc17` (declared R3 cut), Base pin
  `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
- Pin verification (before any suite, and re-run at the final revision):
  workflow-contract parity `8dd53be4…a34d` (11 files on each side),
  Base `web_workbench` `d4642808…d056` (59 files), My-Chat `x5_joint_api`
  `89a613555cab5bb1934c31b239b8d24b6f6a2ae14b0ff3e45b41542956dcca35`
  (169 files), My-Chat `wave4_binding_host`
  `960afb2c429ba4cfc946fd002706ebaf1e5745ae234eaef0616676b27fd8f4f1`
  (20 files) — all exactly as the M5 handoff cites.
- Nurture scenario self-pin at run time:
  `ec763a279361d4ec4ac1a53f367030becc72ab9ea0c96e57ae31c262b70f4152`
  (41 paths / 54 files). This supersedes the `76f9d966…` value cited inside
  the M5 handoff text: commit `c7909db` (dead binding-owner composition
  removal + single-ingress gating, post-M5) rotated the self-pin; the pin
  file, not the M5 prose, is the mechanical authority and verified green.
- The-Nurture revisions: the run started from head `2b3efcc` (the G1
  execution plan); the joint-negative additions verified inside this run
  landed as `bad4523`. The only concurrent commit between them, `b428e67`,
  is documentation-only (governance decision records), so the code tree the
  suites executed is byte-identical to `bad4523`.

## Run Materialization (preconditions per `17-g1-joint-conformance-execution-plan.md`)

- Detached verification worktrees (never the drifting sibling working
  copies): My-Chat at exact `a019566`, My-Workflow-Base at exact `06303e9`,
  The-Nurture at the run head, laid out CI-style as siblings so the pnpm
  `link:../My-Chat/...` overrides resolve to the pinned tree. Frozen-lockfile
  installs in both repos; pinned workflow contracts compiled; Prisma clients
  generated. Worktrees were removed at the end of the run; both sibling
  working copies remained untouched throughout.
- `node scripts/verify-workflow-contract-pin.mjs --my-chat-repo ../My-Chat
  --workflow-base-repo ../My-Workflow-Base` — all `[ok]` (values above);
  `node --test scripts/verify-workflow-contract-pin.test.mjs` — pass; Base
  strict consumer-boundary scanner
  (`check-consumer-boundaries.mjs --consumer-role scenario --strict`) — ok.
- Disposable PostgreSQL: a dedicated compose project on `127.0.0.1:5434`
  (`pgvector/pgvector:pg16` — the pinned My-Chat migrations require the
  `vector` extension) with tmpfs storage. Databases created inside the run:
  `x5_my_chat` (pinned My-Chat `prisma migrate deploy`), `x5_nurture`
  (`pnpm db:deploy`; ownership boundary 48 tables / 75 enums),
  `nurture_dev_host` (`pnpm dev-host:db:deploy`; 6 tables / 2 enums).
  The whole instance was destroyed (`docker compose down -v`, tmpfs data
  gone) before this record was committed. The persistent local compose
  instance on port 5433 was not touched.
- The formal NestJS scenario-service was compiled from the current head and
  smoke-verified as a built artifact
  (`binding-owner=disabled legacy-route=absent`).

## G1-06 Matrix Results

| Matrix cell | Suite executed | Result |
| --- | --- | --- |
| Positive binding/association/auth, exact replay, response-loss recovery | scenario-service `test:db` case 1 | PASS |
| Post-revoke, unknown/ended/future/inactive authority fail-closed | `test:db` case 2 | PASS |
| Lock/concurrency until HTTP receipt commit | `test:db` case 3 | PASS |
| Missing/stale production anchors (pinned-consumer denial) | `test:db` case 4 | PASS |
| X5 materialize-once, replay, revoke fail-closed on two real DBs | `packages/nurture-db` x5 joint acceptance case 1 | PASS |
| Service auth (wrong/missing token) | scenario-service suite 42/42 incl. security-boundary e2e + guard unit | PASS |
| Wrong workspace/user/actor/purpose, `bound_empty` recovery | case 2 (workspace/authority) + new named negatives added in-run (`bad4523`): wrong user, wrong purpose, `bound_empty` recovery, quarantined anchor | PASS (gap closed) |
| Owner unavailable, contract mismatch, stale confirmation/heads | three new joint negatives added in-run (`bad4523`) to the x5 joint layer | PASS (gap closed) |
| Leakage scan + final false/empty census | joint-harness DB scans + census below | PASS |

Commands and populations (all on the disposable databases, worktree
materialization, `DATABASE_URL`→`x5_nurture`,
`DEV_HOST_DATABASE_URL`→`nurture_dev_host`, `X5_*`→both):

| Command | Result |
| --- | --- |
| `pnpm test:local-env-runner && pnpm typecheck && pnpm verify:test-routing && pnpm verify:persistence-boundaries` | PASS; routing census 53 files: 28 unit / 5 production-db / 11 dev-host / 8 scenario-service / 1 x5-joint |
| `pnpm test:unit:ci && pnpm verify:unit-population` | 250/250 (floor 216) |
| `pnpm verify:surface-conformance` | PASS; exact `1.7.0` / `b7691a81…` byte-verified; 11 cases, 25/25 slices, 56 tests; the runner derives execution from the conformance-case registry, so the registry records the executed targets |
| `pnpm --filter @the-nurture/scenario-service typecheck && test && build && node scripts/smoke-scenario-service.mjs` | typecheck clean; 42/42; build ok; smoke `binding-owner=disabled legacy-route=absent` |
| `pnpm test:db:ci && pnpm verify:db-population` | 38/38 (floor 38) |
| `pnpm typecheck:scenario-service:db && pnpm test:scenario-service:db` | clean; 6/6 (4 M5 journeys + 2 new named-negative cases) |
| `pnpm test:dev-host:ci && pnpm verify:dev-host-population` | 26/26 (floor 25); dev host serves no owner route |
| `pnpm test:x5` | 4/4 (1 M5 acceptance + 3 new joint negatives) |
| `pnpm verify:formal-ingress-contract && pnpm verify:port-topology` | routes=2 owner-fields=8; ports 8000/3001/3200/3201 |
| `pnpm db:assert-boundary && pnpm dev-host:db:assert-boundary` | 48 tables/75 enums; 6 tables/2 enums |
| `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` | PASS (run before each commit) |

## Negative Matrix (executed refusals)

Owner path through the formal NestJS ingress (real PostgreSQL, service
authenticated):

| Named negative | Observed refusal |
| --- | --- |
| Unknown workspace | `owner_authorization_denied`; no anchor persisted |
| Wrong user inside a valid workspace (new, `bad4523`) | `owner_authorization_denied`; anchor count unchanged |
| Wrong purpose (new) | HTTP 400 `invalid_binding_request` at the transport contract |
| Wrong actor | By design evidence-only: actor ids are HMAC evidence, never authority keys; raw ids proven non-persisted |
| Soft-deleted participant / ended / future / revoked authority | `owner_authorization_denied` (incl. non-UTC session proof) |
| Revoked receipt replay | `authorization_receipt_inactive` |
| `bound_empty` anchor (new) | Recovery: exact anchor reuse (`ownerRef` identical), fresh receipt issued |
| Quarantined anchor (new) | `anchor_not_current` fail-closed |
| Missing / stale production anchor | `anchor_not_found` / `anchor_not_current` |
| Divergent replay | `authorization_replay_conflict` |
| Response loss after owner commit | `owner_read_failed`, then exact recovery replay |
| Wrong/missing service token | 401/403 body-safe denials (suite + e2e) |

Joint layer (two real databases, pinned x5 runtime):

| Named negative | Observed refusal |
| --- | --- |
| Owner unavailable (new) | Dispatch against an unreachable owner rejects; the handoff stays `requested` at aggregate_version 1, zero notifications; attention-open resolves `unavailable`/`handoff_unavailable`; the next dispatch with a live owner completes exactly once |
| Contract mismatch (new) | Unpinned run contract hash refuses materialization: `workflow_handoff_contract_unavailable`, completion commits as `manual_review_required` with zero materialized handoffs, zero `workflow.handoff.requested` outbox events, zero ledger rows/notifications; the defect completion replays deterministically; the committed Nurture-side result stays intact |
| Stale confirmation / stale heads (new) | Stale-head claim → `workflow_step_version_conflict`; stale claim token at the current head → `workflow_step_claim_invalid`; self-consistent stale confirmation pair → `workflow_step_version_conflict`; the claimed step is uncorrupted and the current confirmation then materializes exactly one handoff |

T-004 refusal-semantics mapping onto the real owner path, as G1-06 requires:
`not_authorized` ↔ `owner_authorization_denied` / `authorization_receipt_inactive`;
`setup` ↔ `invalid_binding_request` / default-off `binding_owner_disabled`;
`target_unavailable` ↔ `owner_read_failed` / `handoff_unavailable` /
`workflow_handoff_contract_unavailable`.

## Leakage Scan (joint harness, whole-table dumps over the run's real population)

- Host database `x5_my_chat` (`workflow_handoffs`, `workflow_handoff_receipts`,
  `outbox_events`, `notifications`, `notification_deliveries`,
  `workflow_steps`; population 7 handoffs / 31 outbox events /
  5 notifications / 18 steps): zero hits for the protected-content marker,
  the family-side safe-summary text, `claimToken`, `expectedStepVersion`.
- Nurture database `x5_nurture` binding tables
  (`nurture_scenario_binding_authorization` 30 rows, child/family anchors
  27/6 rows): zero raw `user-`/`actor-`/`child-`/`family-` identity hits —
  evidence is hash-only. `nurture_command_execution` (35 rows): zero
  `claimToken` / `expectedStepVersion` hits.
- In-suite assertions additionally prove per-workspace non-leakage of raw
  claim tokens and protected content on both sides.

## Final False/Empty Census

- Formal scenario-service: default-disabled startup contract intact — no
  owner secrets in config, binding-owner runtime absent without
  `NURTURE_BINDING_EVIDENCE_KEY`; built-artifact smoke reports
  `binding-owner=disabled legacy-route=absent`.
- Dev host: no owner route and no owner enablement path (ING-D4 posture
  re-proven: 26/26 dev-host tests, formal-ingress contract pins exactly two
  formal routes).
- Consumers/capability gates: all default-off; the conformance layer summary
  still prints its explicit owner-integration NO-GO line (synthetic PASS
  never claims the owner path); this record, not that line, is the joint
  authority.
- Databases: all three run databases were disposable (tmpfs) and are
  destroyed; no persistent DB apply occurred anywhere.
- No capability activation, no secret configuration (test-only tokens), no
  artifact publication, no deployment, no staging/production state, no
  traffic. All consumers stay default-off regardless of this verdict.

## Invalidation and Follow-ups

- Per G1-07 semantics: drift of either pinned owner population, the
  workflow-contract parity hash, the Nurture self-pin, or the T-004 root
  digest supersedes this record for the affected side; shared-core or pin
  drift voids it entirely and the recovery is one rerun of this suite
  against the successor identities.
- Wave4 import-closure scoping (T-002 review finding #5) is decided at the
  next pin action; it did not block this run.
- Evidence commits: `bad4523` (joint/named negatives), plus this record's
  commit. Suite logs were kept only in the session scratchpad; this record
  is the durable evidence per the bundle's append-only ledger convention.
