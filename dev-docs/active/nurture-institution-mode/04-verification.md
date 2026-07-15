# Verification — Institution Mode

## Current Verification Status

- Last updated: 2026-07-15
- Current phase: X5 joint acceptance complete; pilot enablement remains a separate authorization gate
- Code/config/schema impact: additive joint acceptance tests, My-Chat technical recovery APIs/repository, and backend-neutral refs-only telemetry. No Nurture or My-Chat schema/migration and no activation flag changed.

## X5 Final Gate

| Check | Result | Evidence |
| --- | --- | --- |
| Delivery CI bootstrap | PASS AFTER REPAIR | PR #3 run `29419715925` failed before Nurture install because the excluded standalone web-workbench resolved the parent workspace; run `29420192609` proved that fix and passed both DB gates, then exposed missing My-Chat workspace/Prisma preparation only in the two cross-repo typecheck jobs. The final workflow uses `--ignore-workspace` for the template and prepares exact-revision My-Chat only where required. A fresh three-repository `/tmp` checkout passes the full preparation/typecheck chain; run `29420657909` passes all seven PR checks, including `175/175` unit, frontend lint/build, production DB, dev-host DB/E2E, contract pin, context/env, and governance. |
| Exact revisions and pins | PASS | My-Chat X5 implementation `0ad5b575...` is merged through PR #3, and PR #4 advances the exact pin to contract-identical delivery-security main revision `249dd8df9222d32cbe176287c0d1b2123dd6523d`; Base/My-Chat shared contract stays `0bd8925e...01aa`; the 25-file Nurture source pin is `e976c235...d193`. Live verification plus all four drift/traversal negative tests pass. |
| My-Chat delivery security | PASS / ACR EXTERNAL BLOCKED | My-Chat main run `29422176395` passes the commit-pinned HIGH/CRITICAL dependency scan, governance, API context, lint/typecheck/unit, and Playwright. Its three ACR jobs stop at login because the repository has no ACR registry/username/password Actions secrets; no image build or push is claimed. The missing external credential configuration remains a release-publishing prerequisite and does not authorize changing the locked ACR target. |
| Fresh migrations and drift | PASS | Approved `pgvector/pgvector:pg16` container on `127.0.0.1:55436`; My-Chat `17`, Nurture production `3`, dev-host `1` migrations current; all datasource-to-schema diffs empty. Existing/shared `localhost:5433/nurture` was not connected or changed. |
| My-Chat full gate | PASS | Full workspace typecheck, ESLint, observability, governance, whitespace, and `79` files / `385` tests with all X2-X5 DB routes enabled. |
| Nurture full gate | PASS | Typecheck; `175/175` unit; `24/24` production DB; `19/19` dev-host; routing `19/3/8/1`; schema/persistence/X4 replay/observability/pin/whitespace gates pass. |
| Joint boundary | PASS x3 | Three consecutive two-database runs each prove business commit plus lost response, wrong-Step denial, one authorized same-Step recovery, exact Nurture replay, atomic materialization/completion replay, one owner delivery, and revoke-time fail-closed open. |
| Catalog ownership | PASS | Nurture production is exactly `43` tables / `71` enums; dev-host is `6/2`; My-Chat contains zero `nurture_*` tables. |
| Persisted privacy and uniqueness | PASS | Three joint workspaces contain 3 messages, 3 capture Executions with non-empty snapshots, 3 completed Handoffs, and 3 notifications. Duplicate-delivery defects, private body/protected type/claim evidence, forbidden driver fields, and zero-version refs are all `0`. |
| Architecture/debt review | PASS AFTER REPAIR | Repaired unknown-outcome terminal drift, 0-based-to-positive ref normalization, activation telemetry no-op, source-pin gaps, Admin actor/causation propagation, and shared-Outbox test races. No remaining blocker or important finding. |
| Cleanup and decision | PASS | Disposable container/data removed and port `55436` free. Capability remains development-only/default-off elsewhere. X5 recommends a separate pilot gate; it does not authorize pilot/staging/production/GA. |

## X5 Pre-Database Gate

| Check | Result | Evidence |
| --- | --- | --- |
| Baseline and routing | PASS AFTER REPAIR | Independent X5 branches start from immutable X4 revisions. The joint suite is an explicit fourth test route (`19` unit files, `3` production DB files, `8` dev-host files, `1` X5 joint file), not an invisible exclusion. |
| Response-loss recovery | PASS STATIC / DB PENDING | Unknown Nurture handler outcome at exhausted retry budget enters `manual_review_required`; only an authorized workspace-scoped Admin action can grant one additional same-Step attempt. Known terminal failures remain `failed`. |
| Admin boundary | PASS STATIC / DB PENDING | Admin may reread safe Handoff counts/status, replay an allowlisted failed technical Handoff, stop a requested Handoff, or reconcile the exact outcome-unknown Step. It cannot edit Nurture facts or Handoff payload/refs. Actions use expected versions, idempotency, actor/correlation evidence, and refs-only Outbox signals. |
| Joint journey | IMPLEMENTED / DB PENDING | One real Nurture DB plus one real My-Chat DB journey covers business commit + response loss, wrong-Step denial, Admin same-Step recovery, exact Nurture replay, atomic materialization/completion replay, idempotent owner delivery, stale open after revoke, and cross-database secret/body probes. |
| Telemetry/privacy | PASS | Nurture command and My-Chat owner instrumentation records duration, context refs, attempt/replay outcome, LLM-call count, and cache hits through injected sinks. Labels are fixed command/owner/outcome dimensions; tests exclude workspace/run/step/handoff/user IDs, bodies, protected refs, and claim material. Both observability registries verify. |
| Nurture static gate | PASS | Full typecheck; `175/175` unit tests; production and placeholder dev-host Prisma validation; routing/population, persistence/N1/X4 replay boundaries, exact pin plus 4 negative tests, root lint, context strict, governance, observability, and whitespace checks. |
| My-Chat static gate | PASS | 17-workspace typecheck, full ESLint, `73` passed files / `359` passed tests with `6` DB files / `26` DB tests skipped, Prisma validation, context strict, governance, observability, and whitespace checks. |
| Exact pins | PASS IN-PROGRESS | Base/My-Chat contract hash remains `0bd8925e...01aa`; the in-progress Nurture source pin expands from 19 to 25 activation-critical files and is `3f506a17...800b29`. Final My-Chat X5 commit revision remains to be locked after DB closure. |
| Database mutation | NOT RUN | Existing/shared `localhost:5433/nurture` was not connected or changed. Disposable container, databases, migrations, and X5 DB suites await explicit approval. |

## X4-C2/N2 Final Gate

| Check | Result | Evidence |
| --- | --- | --- |
| Exact cross-repo pin | PASS | My-Chat revision `d47929d12e1a3368a99fa24757732988e5072e1e`; Base/My-Chat contract hash remains `0bd8925e...01aa`; logical source remains `a97a5b14...e981`; 19-file Nurture source hash is `1b124cb4...d72`. |
| Manifest/module gate | PASS | Canonical vNext manifest declares one exact Handoff and activation entrypoint. Default/static/factory dev-host paths remain pre-activation. Only the activation factory can advertise vNext and it requires materialization + bridge + source ports. |
| Source/identity gate | PASS AFTER REPAIR | Exact versioned seed parser rejects bodies, unknown keys, pending routes, invalid refs, and claim fields. Durable Run Actor maps through active My-Chat membership to exactly one active Nurture participant; command preconditions recheck role/scope/grant. |
| Owner/current-state gate | PASS AFTER REPAIR | Owner rereads message/receipt/item/grant/enrollment/thread/group/institution/recipient roles and selects no business body. Unauthorized actor is classified before revoke/redaction; delivered/read/acknowledged receipt states support current opens. |
| Service boundary | PASS | Missing token returns disabled; wrong token returns unauthorized; valid service token reaches refs-only owner read. 3/3 endpoint auth E2E tests pass. |
| Static/unit | PASS | Typecheck and 173/173 unit tests; routing/population, X4 replay, persistence, N1 schema, both Prisma validations, environment contract, context strict, governance, pin, negative pin, and whitespace gates pass. |
| Production DB | PASS | Three migrations current, drift empty, Prisma valid, 24/24 DB/E2E, exact 43 tables/71 enums, no My-Chat runtime tables. |
| Dev-host DB | PASS | One private migration current, drift empty, Prisma valid, 19/19 DB/E2E, exact 6 tables/2 enums. |
| Privacy probe | PASS | Final DB population: 46 Executions, 2 non-empty snapshot rows, 0 persisted `claimToken`, `claim_token`, or `expectedStepVersion` fields in snapshots/driver refs. |
| My-Chat host journey | PASS | 23/23 X2/X3/X4 DB/worker tests: Step claim/complete atomically materializes one Handoff/Outbox, owner creates one idempotent notification/delivery, current open resolves ready, simulated revoke resolves unavailable. |
| Cleanup | PASS | `institution-x4-validation-postgres` and anonymous data removed; loopback port 55435 free. No existing/shared DB used. |
| Architecture review | PASS AFTER REPAIR | No remaining blocker/important finding in X4 scope. X5 owns combined failure/privacy/telemetry and pilot decision. |

## X4-B/X4-C1 Handler-Bridge Pre-Activation Gate

| Check | Result | Evidence |
| --- | --- | --- |
| Nurture implementation | PASS | X4-C1 code and pre-activation evidence committed at `2398d98d8860e5f90e6c365e652f40043ce8d82d`. |
| Cross-repo baseline | PASS | My-Chat runtime implementation `a9685d538ddc320df2dd4ee68a0a65e004f446a0`; final delivery/exact checkout pin `26f57be9aaee9d20be1a6d83db28f37b8e7fe466`; no `packages/` diff between them. Base/My-Chat contract hashes remain `0bd8925e...01aa` path-content and `a97a5b14...e981` logical-source. |
| Scenario pin | PASS | Expanded eight-file source population hashes to `c208e684a2d314f0b1332e6bdc7c261836b8aeaef00fdc39487e7b6d202aa2d0`; exact pin verifier and all 4 drift/traversal/revision negative tests pass. |
| Ownership boundary | PASS AFTER REPAIR | My-Chat runtime implementation is host-injected behind a two-operation port; the scenario package has no production runtime dependency. Nurture owns command-source resolution and business execution. Redundant source-port scope/ref/version fields were removed so they cannot become a second provenance or authorization authority. |
| Stable identity/replay | PASS | Stable invocation/command/handoff IDs come from the scenario source rather than claim/version/current Step. Targeted tests prove same-Step reclaim with rotated token/version returns the same draft and one business effect; a different Step is denied before a second effect. |
| Output/event boundary | PASS AFTER REPAIR | Step output contains one opaque CommandExecution ref only. Message/receipt/item refs remain owner-readable handoff context refs. Scenario emits no host-standard step/handoff event draft. |
| Fail-closed activation | PASS | Handler is registered in TypeScript but absent from the manifest; YAML has no `user_attention` handoff declaration; default backend composition injects the technical bridge but no family-input business-source adapter. The path is unadvertised and cannot activate. |
| Static/unit gate | PASS | Nurture typecheck; 4 focused handler tests; 161/161 unit tests; 27-file routing census; persistence/N1/X4 contract assertions; both Prisma validations; pin, context strict, governance, root lint, public database suite run `20260715-013854-807272`, and whitespace gates pass. |
| Database regression | PASS | Existing approved production validation DB `nurture_x4_validation_e7d4590` passes 23/23 DB/E2E tests. Disposable dev-host DB `nurture_x4_handler_final_c208e684` received only its existing baseline migration, passed 16/16 tests, and was force-dropped afterward. No schema change was introduced and shared `localhost:5433/nurture` was not targeted. |
| Architecture review | PASS AFTER REPAIR | Overall activation-foundation risk is medium. No remaining must-fix or should-fix finding after source-authority and duplicate-ref repairs. Manifest/capability/owner-consumer activation remains a separate approval gate. |

## X4-A Claimed-Step Replay-Seed Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Pre-transaction driver gate | PASS | Missing driver, wrong namespace/type/scenario/binding, unexpected ref keys, or Step version returns stable invalid state before command lookup/transaction and does not consume command identity. |
| Secret and hash boundary | PASS | Claim token and expected Step version are validated transiently, omitted from semantic payload hash, snapshots, persisted driver, results, and error content; SQL also forbids secret/binding field names in snapshot JSON. |
| Persistence shape | PASS | Non-empty state requires bounded, sorted, unique, refs-only snapshots plus an exact canonical five-field original-Step ref. Empty state requires null driver. Unknown keys and invalid stored JSON fail closed. |
| Replay ownership | PASS | Same Step may replay after token/version rotation; another Step is rejected. Stored request/handoff/purpose/expiry drift returns `invalid_stored_handoff_replay_seed` instead of being materialized. |
| First business slice | PASS | Immediate family input emits exactly one `user_attention` seed referencing the Nurture message, child-link receipt, and care item. Pending-workflow and direct no-activation paths remain explicit-empty. |
| Unit/type/static gate | PASS | Typecheck, 41 focused tests, all 157 unit tests, X4 migration contract assertion, test routing, both Prisma schema validations, persistence/N1 boundaries, workflow pin plus 4 negative tests, refreshed context checksum/strict verification, project state, governance lint, and whitespace checks pass. |
| DB migration | PASS | All three migrations applied to approved disposable database `nurture_x4_validation_e7d4590`; `prisma migrate status` is current. Existing `localhost:5433/nurture` was not targeted. |
| DB/E2E journey | PASS | 23/23 tests cover explicit-empty compatibility, canonical non-empty seed persistence, claim-secret absence, same-Step reclaim, wrong-Step denial, and single business effect. |
| PostgreSQL constraint | PASS | `ck_nurture_command_execution_handoff_v1` is validated; direct negative updates containing driver `version` or snapshot `claimToken` are rejected. Final probe after repeated suites: 45 Executions, 3 non-empty, 0 forbidden snapshot fields, 0 forbidden driver fields. |
| Production catalog boundary | PASS | Exact 43 Nurture tables and 71 enums; no My-Chat Workflow runtime table or enum. |
| DB context/public suite | PASS | `ctl-db-ssot sync-to-context`, strict context verify, and public database suite pass. Optional Convex/init smokes explicitly SKIP because those feature packs are not installed in this repo; applicable repo-prisma smoke remains green. |
| Activation posture | PASS | Manifest handoff key/source declarations, live claimed-driver bridge, My-Chat owner consumer, and capability enablement remain absent. |

## X4/N2 Entry Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| My-Chat X3 delivery | PASS | Final local delivery revision `4d40d81cceaa5eee84134729900cc3f5c2e15547`; X3 code hardening is `f73eba9`; post-commit typecheck, 323 non-DB tests, lint, context, environment, database, governance, and clean-tree gates pass. |
| Exact dependency pin | PASS | `docs/project/integrations/my-chat-workflow-contract.json` now requires My-Chat `4d40d81`; live verification rejects any different checkout revision. |
| Base/My-Chat contract parity | PASS | Both contract roots hash to `0bd8925ec8da88e0b7d0aa76b33bef94c471ff52499651c7b0c2a5da381501aa`; the cross-layout logical source hash remains `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`. |
| Nurture scenario pin | PASS | X4-A context contract plus unchanged YAML manifest/module/registry are pinned at `b56ce4d5f0758ecad037cc2ce2c2c4aaa0e67cc08c59f1173b6adcab31567e21`. |
| Pin regression tests | PASS | 4/4 cover ordering/traversal stability, content/path drift, path escape, and exact-revision drift rejection. |
| Nurture static/unit gate | PASS AFTER REPAIR | Typecheck; 152/152 unit tests; production and placeholder dev-host Prisma validation; persistence and N1 schema boundaries; test routing/population; context strict; governance; and whitespace checks pass. |
| Local dependency snapshot | PASS AFTER REPAIR | The first run found the pnpm `file:` runtime snapshot missing three new X3 source files. `pnpm install --offline --frozen-lockfile --force` rebuilt `node_modules` without lockfile changes; typecheck and the two previously blocked conformance suites then passed. |
| Activation posture | PASS | Capability remains unavailable and all advertised handlers stay explicit-empty. The guarded X4-A command foundation exists but no manifest or live handler can activate it. |

## N1 Entry Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Nurture baseline | PASS | `main` clean at `4040466`; G0 production/dev-host persistence streams remain isolated. |
| Base revision | PASS | Merged `acba4e792c85131c19e63e08a5f671133c481c57`. |
| My-Chat X1 adoption | PASS | X1 revision `2c783675de896b93cf1157b7d1c7ae9e3051150e`; logical contract hash `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`. |
| Current My-Chat dependency | PASS | X2 revision `bda1542d6e6989a348254917a5e49f30de68083d`; no `packages/workflow-contracts` diff from X1. |
| N1 activation gate | PASS | Explicit-empty snapshots only; manifest non-empty activation remains disabled. |

## N1-B Schema Preview Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm db:generate` | PASS | Prisma Client generated from the additive production SSOT. |
| `pnpm db:validate` | PASS | N1 schema is structurally valid. |
| `pnpm verify:n1-schema-contract` | PASS | 21 tables, 7 partial unique indexes, and 7 lifecycle CHECK constraints are present; explicit-empty command gate enforced. |
| `pnpm verify:persistence-boundaries` | PASS | Production migration stream remains Nurture-only; dev-host stream remains Workflow-only. |
| DB context sync + strict verify | PASS | Context refreshed to 43 total tables / 71 total enums and registry checksum updated. |
| `pnpm typecheck` | PASS AFTER REPAIR | Refreshed the local `file:` dependency snapshot and updated the backend-private dev-host to the X2 worker constructor/materialization-v1 empty-draft contract. |
| `pnpm test:unit` | PASS | Existing 12 files / 86 tests pass; no P0 behavior regression. |
| Migration apply | PENDING APPROVAL | Preview only; no target database was mutated. See `artifacts/db/n1-schema-preview.md`. |

## N1-C Command / Interaction Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Command canonicalization/hash | PASS | Object-key stability, ordered arrays, null/omission difference, workspace/namespace separation, and family-strategy set normalization covered. |
| Command replay/outcomes | PASS | executed/applied, replayed/applied, executed/replayed already-satisfied, same-key/different-hash conflict, blocked identity reuse, lock busy, lookup/transaction failure covered. |
| Explicit-empty persistence | PASS | Runner always commits version 1 `[]`; Prisma mapper rejects corrupt non-empty/driver replay state; DB CHECK remains the final fence. |
| Family-core adoption | PASS | `family_strategy.calibrate` uses the shared runner; update + evidence + Execution execute once and exact replay performs no second effect. |
| Interaction context | PASS | Hash-only token/conversation storage, binding mismatch, derived expiry, one-time consume, reusable notification open, revoke, and forbidden body/policy/grant state covered. |
| `pnpm typecheck` | PASS | Scenario ports and Prisma adapters compile without Prisma leaking into the scenario package. |
| Unit gate | PASS | 14 files / 100 tests; exact population and routing gates pass. |

## N1-D Resolver / Policy Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Host-envelope boundary | PASS | Resolver rejects host-authored role, target, child, family, group, institution, grant, direction, data-class, and policy fields before any business resolution. Missing host workspace is accepted only when current Nurture participation resolves exactly one workspace. |
| Candidate kernel | PASS | Complete actor-to-scope-to-target paths are merged and deduplicated deterministically; semantic ties and weak-recency matches require clarification; recency and stable ids never manufacture an auto-resolution. Aggregate and rendered-option limits fail into narrowing instead of silent truncation. |
| Structured clarification | PASS | Nurture-issued scenario and option tokens are opaque/hash-only, safe labels are bounded, candidate refs remain Nurture-local, same-conversation recovery is purpose-bound, selection is one-time, and current participant/role/scope/grant/lifecycle are revalidated after selection. |
| Business-memory adapters | PASS | Bounded adapters cover nonterminal family-care items, active attention items, and active private threads; attention rows deduplicate to actionable backing items; revoked/missing grant and inactive enrollment are filtered or returned as specific blocked reasons. No model, cache, vector, Redis, or new memory table was added. |
| Structured policy | PASS | Six locked Nurture policy predicates return allow/deny, stable reason, refs-only audit evidence, and safe user state; repository failures deny as `policy_unavailable`. Grant direction/data class, enrollment, caregiver scope, redaction, thread membership, media scope, and exposure gates are current-state checks. |
| Architecture review | PASS AFTER REPAIR | Fixed inactive role-scope resolution, tenant-qualified child reachability, grant-target binding, revoked backing-item/deep-link revalidation, unbounded grant history reads, sequential per-role source queries, and oversized clarification labels before acceptance. Scenario remains Prisma-free; My-Chat runtime ownership is unchanged. |
| `pnpm typecheck` | PASS | Full workspace, scenario, and Prisma repository adapters compile. |
| Unit gate | PASS | 15 files / 125 tests; exact population and routing gates pass. |
| Static DB/boundary gates | PASS | Both Prisma schemas validate (dev-host with a non-connecting placeholder URL), production/dev-host boundaries pass, N1 schema contract passes, and cross-repo contract pin passes. No database was mutated. |

## N1-E Inbox / Attention Domain Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Command closure | PASS | Family input, grant revoke, acknowledge, caregiver-confirmed reply, source redaction, and pre-delivery cancel all run through the shared CommandExecution transaction and return refs plus explicit empty snapshots. |
| Identity/scope fence | PASS | Payload workspace, business actor, child process, participant/role, item-linked source grant, enrollment, thread, target scope, direction, and data class are current-state checked. Claim material and bodyful/foreign protected refs are rejected. |
| Revoke/redaction semantics | PASS | Revoke updates Grant and bounded dependent Receipt/Item/attention rows without redacting the source; redaction removes protected body/attachment refs, sanitizes derived item/attention display, and blocks/revokes receipts. New grants do not reactivate old-grant items. |
| Owner-read privacy | PASS | Class inbox and attention queries are bounded, group-authorized, source-message/grant/enrollment/thread revalidated, semantically ordered, and return display-safe fields without message body, thread id, grant policy, or host runtime state. |
| Architecture review | PASS AFTER REPAIR | Removed premature manifest/context-ref declarations that produced 16 host-resolver fatals; repaired grant target selection, actor/child binding, stale convergence authorization, receipt versioning, linked-grant reactivation, redaction sanitization/bounds, and current participant/enrollment/thread/group/institution fences. |
| Targeted tests | PASS | `packages/nurture-scenario/tests/institution/class-family-inbox.test.ts`: 22/22. |
| Full unit/static gate | PASS | 16 unit files / 147 tests; full typecheck, test routing/population, production Prisma validate, dev-host Prisma validate with a non-connecting placeholder URL, persistence boundary, N1 schema contract, workflow contract pin, module validator/registry test, and diff whitespace pass. |
| Production DB catalog | PASS | Approved local target `localhost:5433/nurture` is migration-current; production boundary reports 43 Nurture tables and 71 enums with no dev-host Workflow tables. |
| N1 direct surfaces | PASS | `class_family_inbox` and `teacher_attention_board` resolve current Nurture scope, owner-reread current DB facts, emit safe/opaque presenter output, and keep workflow handoff drafts explicit-empty. |

## Automated Checks

Run after task-doc or governance edits:

```bash
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

Expected result:

- Governance registry and derived views stay consistent.
- `T-002 nurture-institution-mode` remains mapped to `M-002 / F-002`.

Run if registered context artifacts are changed:

```bash
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
```

Expected result:

- Context registry verifies cleanly.

## Manual Smoke Checks

For IA/IA.1 discussion work:

1. Confirm `dev-docs/active/nurture-institution-mode/` contains the standard task bundle files.
2. Confirm `roadmap.md` carries the current decision queue.
3. Confirm `00-overview.md` states the current phase and next discussion step.
4. Confirm no live manifest, source, or Prisma schema changes were made for institution mode before IB exists.

## Rollout / Backout

- Rollout: task-doc and governance-only changes can be merged once governance lint is green.
- Backout: revert the T-002 task-doc changes and governance registry entries; no runtime data migration is involved.

## Verification Log

| Date | Command / check | Result | Notes |
| --- | --- | --- | --- |
| 2026-07-03 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Derived governance views regenerated. |
| 2026-07-03 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Registry/task bundle consistency verified. |
| 2026-07-03 | Manual bundle layout check | PASS | Standard files exist: roadmap, 00-05, `.ai-task.yaml`; no code/manifest/schema edits intended. |
| 2026-07-03 | Product semantics update review | PASS | Reframed from "institution mode / authorization bridge" to "institution ecology / external growth environment"; `ChildLinkGrant` documented as cross-ecology connection mechanism. |
| 2026-07-03 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Regenerated feature map after M-002/F-002 title updates. |
| 2026-07-03 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance consistency verified after semantics update. |
| 2026-07-04 | Product capability review | PASS | Clarified `child_media_attribution`: use child reference images such as attendance cards to classify class group photos into teacher-confirmed child album views. |
| 2026-07-04 | Institution value model review | PASS | Reframed institution-side value around philosophy transmission, digital asset sedimentation/re-organization, and operational quality workflows. |
| 2026-07-05 | Context/architecture ownership review | PASS | Synced My-Chat account/shell vs Nurture-owned care ecology graph; added `NurtureChildCareProcess`, `class_family_inbox`, Nurture-owned family-care messages/items, and Nurture-owned `ChildLinkGrant`. |
| 2026-07-05 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch` | PASS | Registered context checksum checked after `docs/context/workflow/nurture-scenario-contract.md` update. |
| 2026-07-05 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` | PASS | Context layer verification passed. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Regenerated governance derived views from updated registry and task metadata. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after manual dashboard/feature-map semantic updates. |
| 2026-07-05 | IB schema SPEC review | PASS | Added `06-ib-nurture-schema-spec.md` with core ecology, grant/receipt, family-care communication, first-slice care facts, resolver/policy contracts, and class-of-10 acceptance scenario. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after adding the IB schema SPEC task-doc references. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed. Context verify not rerun because no registered context artifacts changed in this edit. |
| 2026-07-05 | IB decision convergence review | PASS | Added `07-ib-decision-convergence.md` and converted the 7 schema open decisions into IIA implementation defaults with explicit production rollout gates. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after decision convergence docs and task metadata updates. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed. Context verify not rerun because no registered context artifacts changed in this edit. |
| 2026-07-05 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Final governance sync/lint passed after verification log updates. |
| 2026-07-06 | Child-scope baseline review | PASS | Documented `NurtureChildCareProcess` as the independent child scope; parent/teacher/institution views are reorganizations over child scopes. |
| 2026-07-06 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance sync/lint passed after child-scope baseline docs update. |
| 2026-07-06 | IB-D0 lock sync | PASS | Marked `NurtureChildCareProcess` child-scope baseline as locked for IB/IIA schema defaults. |
| 2026-07-06 | IB-D3 lock sync | PASS | Marked `NurtureTeacherAttentionItem` as a materialized child-scoped projection grouped by `careGroupId`; group-level notices deferred to a separate future object. |
| 2026-07-06 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance sync/lint passed after IB-D3 lock docs update. |
| 2026-07-06 | IB-D4 runtime fence sync | PASS | Marked `NurtureChildLinkGrant` revoke as a runtime fence covering future delivery, in-flight workflow, pending outbox, retry/replay, cached context pack, UI submit, active surface exit, and limited/auditable history. |
| 2026-07-07 | IB-D5 data-class contract sync | PASS | Marked `dataClass` as the system grant/policy/runtime contract, `category` as workflow/display taxonomy, and institution vocabulary as a mapping layer. |
| 2026-07-07 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance sync/lint passed after IB-D5 docs update. |
| 2026-07-07 | IB-D6 message lifecycle sync | PASS | Marked `NurtureFamilyCareMessage` canonical status as `sent` / `redacted` / `failed`; removed message-level `hidden` / `deleted`; added redaction and body-protection metadata requirements. |
| 2026-07-07 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main && node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance sync/lint passed after IB-D6 docs update. |
| 2026-07-07 | IB-D7 My-Chat opaque delivery sync | PASS | Marked My-Chat shell integration as realtime by default; host persistence is limited to minimal opaque routing/dedupe/status/expiry delivery bookkeeping when delivery requires it. |
| 2026-07-07 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IB-D7 docs update. |
| 2026-07-07 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IB-D7 docs update. |
| 2026-07-08 | IB-D1 / IB-D2 lock sync | PASS | Marked participant identity + surface role resolution as locked: mobile chat is role-agnostic Nurture ingress; dashboard/board surfaces may switch validated role assignments. Marked one active `NurtureFamily` per `NurtureChildCareProcess` as locked for MVP. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IB-D1/IB-D2 docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IB-D1/IB-D2 docs update. |
| 2026-07-08 | IIA schema/policy/test design sync | PASS | Added `08-iia-schema-policy-test-design.md` with implementation slices, schema model groups, resolver/policy contracts, capability design, and test matrix. Design-only; no Prisma, manifest, source, or runtime edits. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA design docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA design docs update. |
| 2026-07-08 | `markdownlint --version` | SKIP | `markdownlint` is not installed in this environment; not a repo gate. |
| 2026-07-08 | IIA-0 Test Contract sync | PASS | Finalized Test Contract categories: required semantics, test layers, fixture shape, structured decision reason codes, and non-pass conditions. Design-only; no test/source/schema edits. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0 Test Contract docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0 Test Contract docs update. |
| 2026-07-08 | IIA-0-C1 capability slice sync | PASS | Locked teacher mobile as surface composition, kept four first-slice capability keys separate, and set implementation order to inbox + attention, then daily care, then media attribution. Design-only; no manifest/source/schema edits. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-C1 docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-C1 docs update. |
| 2026-07-08 | IIA-0-C2 Surface Contract sync | PASS | Locked My-Chat conversation continuity vs Nurture interaction context/business memory boundary; conversation refs are untrusted hints and every render/action/write re-resolves through Nurture. Design-only; no manifest/source/schema edits. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-C2 docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-C2 docs update. |
| 2026-07-08 | IIA-0-R1 Resolver output consumers sync | PASS | Locked resolver output as a Nurture-internal context contract consumed by capability/orchestrator, policy, query/projection, command/workflow, presenter, and interaction context manager. My-Chat only consumes final scenario response. Design-only; no manifest/source/schema edits. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-R1 docs update. |
| 2026-07-08 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-R1 docs update. |
| 2026-07-09 | IIA-0-R2 Resolver context shape sync | PASS | Locked resolver output into `actor`, `workScope`, and optional `target`; `childCareProcessId` is required for child-specific writes/actions but not for every teacher/institution collection work surface. Design-only; no manifest/source/schema edits. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-R2 docs update. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-R2 docs update. |
| 2026-07-09 | IIA-0-R3 Resolver input envelope sync | PASS | Locked resolver input as host facts, conversation refs, current payload, generic display state, Nurture-issued scenario token, and idempotency only. Removed host-authored target/workScope/role/grant/dataClass/direction/policy inputs. Design-only; no manifest/source/schema edits. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-R3 docs update. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-R3 docs update. |
| 2026-07-09 | IIA-0-R4/R5 ambiguity and structured clarification sync | PASS | Locked ambiguity handling with typed candidates and precedence; locked `needs_clarification` as structured My-Chat interaction requests with Nurture-owned prompt/options/fields/tokens. Design-only; no manifest/source/schema edits. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-R4/R5 docs update. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-R4/R5 docs update. |
| 2026-07-09 | IIA-0-R6 scenario token MVP TTL/staleness sync | PASS | Locked scenario token MVP as opaque Nurture DB handle with `clarify` / `submit_action` / `open_notification`, conservative `current` / `expired` / `recoverable` / `blocked` classification, and no token-as-authorization behavior. Design-only; no manifest/source/schema edits. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after IIA-0-R6 docs update. |
| 2026-07-09 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after IIA-0-R6 docs update. |
| 2026-07-10 | IIA-0-R7 business-memory semantic boundary sync | PASS | Locked business memory as bounded retrieval over current Nurture canonical facts, producing candidates rather than authorization or commands; retrieval sources, candidate shape, and deterministic ranking remain in convergence. Design-only; no manifest/source/schema edits. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance sync passed after the R7 semantic-boundary docs update. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after the R7 semantic-boundary docs update. |
| 2026-07-10 | IIA-0-R7 full resolver-recovery contract sync | PASS | Locked thin reusable kernel + Nurture adapters, three MVP sources, complete-path candidates, categorical deterministic ranking, dedupe/tie/limit behavior, reuse path, and no-extra-storage/vector/cache/model cost gates. Design-only; no manifest/source/schema edits. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --dry-run --project main --init-if-missing` | PASS | Preview confirmed only registry and generated governance views required regeneration; manual F-002 semantic brief remained in the non-AUTO section. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance derived views regenerated after the complete R7 contract update. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after the complete R7 contract update. |
| 2026-07-10 | IIA-0-C3 workflow-mediated family conversation sync | PASS | Locked conversation-shaped family UX, workflow-shaped teacher UX, Nurture-mediated canonical messages, authentic authorship/source traceability, and the Nurture transaction vs My-Chat notification/outbox boundary. Design-only; no Prisma/manifest/runtime edits. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --dry-run --project main --init-if-missing` | PASS | Preview confirmed governance derived-view regeneration after C3 task/semantic brief updates. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views regenerated after C3 convergence. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after C3 convergence. |
| 2026-07-10 | IIA-0-R8 robustness review sync | PASS | Recorded retained command direction, B1-B3 lock blockers, typical-scenario compatibility, and cross-repo My-Chat handoff/outbox implementation evidence. R8 remains in convergence; design-only with no Prisma/manifest/runtime edits. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --dry-run --project main --init-if-missing` | PASS | Preview confirmed registry/derived-view updates after the R8 review and F-002 risk/checkpoint refresh. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views regenerated after the R8 robustness review sync. |
| 2026-07-10 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after the R8 robustness review sync. |
| 2026-07-11 | IIA-0 model execution and cost posture sync | PASS | Locked cost as an observed architecture dimension rather than an MVP product gate: no fixed call/token/monetary quota, reliability circuit breakers retained, context/memory ownership clarified, retry/fan-out reuse required, and R7 scope unchanged. Design-only; no Prisma/manifest/runtime edits. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after the model execution and cost posture decision. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after the model execution and cost posture decision. |
| 2026-07-11 | `git diff --check` | PASS | No whitespace errors after the documentation-only decision sync. |
| 2026-07-11 | R8-B1-A logical delivery ownership sync | PASS | Locked `NurtureChildLinkReceipt` as the pending logical delivery lifecycle committed with the source fact, logical-target granularity, non-mirrored My-Chat transport ownership, and no separate Nurture distribution-intent/outbox runtime. Design-only; no Prisma/manifest/runtime edits. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-A convergence. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-A convergence. |
| 2026-07-11 | `git diff --check` | PASS | No whitespace errors after the B1-A documentation sync. |
| 2026-07-11 | R8-B1-B unified ingress/result/activation boundary sync | PASS | Locked all adult roles onto My-Chat main-chat scenario routing, kept role/scope/target/business direction inside Nurture, separated structured scenario response and explicit dashboard presenter paths from optional host activation handoff, and corrected Receipt so target-readable content may be immediately `delivered`. Design-only; no Prisma/manifest/runtime edits. |
| 2026-07-11 | B1 terminology drift scan | PASS | No active contract still treats dashboard/main-chat display as handoff delivery or Nurture `pending` as My-Chat notification state; the only match is the intentional D-035 supersede history. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-B convergence. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-B convergence. |
| 2026-07-11 | `git diff --check` | PASS | No whitespace errors after the B1-B documentation sync. |
| 2026-07-11 | R8-B1-C1 activation source authority sync | PASS | Locked direct Nurture `DomainContextRef` sources for existing messages/items/receipts, retained Workflow Artifact only for genuine independent workflow products, allowed mixed sources, and recorded the shared-base `source_context_ref_types` contract gap. Design-only; no My-Workflow-Base/My-Chat/Nurture runtime edits. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-C1 convergence. |
| 2026-07-11 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-C1 convergence. |
| 2026-07-11 | `git diff --check` | PASS | No whitespace errors after the B1-C1 documentation sync. |
| 2026-07-12 | R8-B1-C2 generic handoff snapshot/replay sync | PASS | Locked the cross-scenario `ScenarioHandoffRequestSnapshot`/`WorkflowHandoffDraft` contract, scenario-local immutable persistence, stable manifest `handoffKey`, pinned-contract host enrichment, retry versus explicit resend identity, per-target snapshots, and thin non-Saga boundary. Design-only; no shared-base/host/runtime/schema edits. |
| 2026-07-12 | B1-C2 terminology/next-step scan | PASS | Historical B1-C1 next-step text was advanced to B1-C3; no active document still treats the request snapshot as a Nurture-only replay-seed contract. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-C2 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-C2 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B1-C2 documentation sync. |
| 2026-07-12 | R8-B1-C3 host transaction materialization sync | PASS | Locked `complete_step` atomic Step/Handoff/outbox materialization, completion and per-Draft idempotency, claim/lease ordering, mixed existing/new behavior, deterministic handoff mapping, bounded preflight, post-commit-only dispatch, and host-ledger standard event ownership. Design-only; no shared-base/host/runtime/schema edits. |
| 2026-07-12 | B1-C3 terminology/next-step scan | PASS | Historical B1-C2 next-step text was advanced to B1-D; current contracts consistently treat standard step/handoff events as host-ledger products and current Nurture direct drafts as scaffold. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-C3 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-C3 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B1-C3 documentation sync. |
| 2026-07-12 | R8-B1-D1 minimal Handoff failure taxonomy sync | PASS | Locked `requested/completed/stopped/failed` as the only generic Handoff lifecycle states, moved `created/existing` to disposition and transient details to attempt/outbox evidence, converged rejected/invalidated behavior into stopped reasons, and kept contract defects at Workflow Step manual review. Design-only; no shared-base/host/runtime/schema edits. |
| 2026-07-12 | B1-D1 lifecycle drift scan | PASS | No active task contract retains accepted/rejected/invalidated/duplicate as required generic Handoff lifecycle states; the unrelated media-attribution `rejected` business status remains valid. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-D1 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1-D1 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B1-D1 documentation sync. |
| 2026-07-12 | R8-B1-D2/D3/D4 recovery/cancellation/operations sync | PASS | Locked Step reconciliation versus same-Handoff technical replay versus new-business resend, post-commit cancellation/expiry/in-flight outcomes, source-version owner resolution, dead-letter ownership, Admin allow/deny boundaries, refs-only observability, and no Nurture transport polling. B1 activation handoff contract is closed; design-only with no runtime/schema edits. |
| 2026-07-12 | B1 closure next-step scan | PASS | Historical D1 next-step text was advanced through D2-D4 to B2; overview and roadmap now identify durable Nurture command idempotency/concurrency as the next R8 decision. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B1-D2/D3/D4 convergence and B1 contract closure. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B1 contract closure. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B1 closure documentation sync. |
| 2026-07-12 | R8-B2-A1 Nurture-wide command-kernel scope sync | PASS | Locked one scope-neutral `NurtureCommandExecution` mechanism across family long-term/short-term and institution authoritative writes, excluded reads/Prepare/host-only writes, required institution plus one existing family-core adoption in IIA, and prohibited permanent dual idempotency mechanisms before GA. Design-only; no schema/runtime edits. |
| 2026-07-12 | B2-A1 scope drift scan | PASS | Architecture, IIA design, plan, overview, and roadmap consistently describe B2 as Nurture-wide rather than institution-only and keep child/institution scope optional at the shared model level. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B2-A1 scope convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2-A1 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-A1 documentation sync. |
| 2026-07-12 | R8-B2-A2 committed execution/response semantics sync | PASS | Locked visible Execution as immutable committed result, persisted only applied/already-satisfied, kept invalid/blocked/conflict/error non-consuming, split executed/replayed response disposition from business outcome, and required current-visibility filtering on user replay with trusted reconciliation access. Design-only; no schema/runtime edits. |
| 2026-07-12 | B2-A2 outcome terminology scan | PASS | The former `already_applied`/three-value CommandOutcome remains only in explicit supersede history; active contracts use separate disposition and business outcome dimensions. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B2-A2 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2-A2 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-A2 documentation sync. |
| 2026-07-12 | R8-B2-B1 generic Scenario Command Pipeline boundary sync | PASS | Locked reusable envelope/key/hash semantics in My-Workflow-Base, restricted My-Chat to scenario selection, authenticated identity and opaque request transport/retry orchestration, and kept execution truth plus canonical mutation atomic in each scenario database. Design-only; no schema/runtime edits. |
| 2026-07-12 | B2-B1 ownership and scope drift scan | PASS | Active contracts consistently prohibit a central cross-scenario execution table and keep role/scope/target, business canonicalization, convergence, and transaction ownership inside Nurture. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B2-B1 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2-B1 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-B1 documentation sync. |
| 2026-07-12 | R8-B2-B2a invocation/command identity lifecycle sync | PASS | Locked generic invocation versus scenario-command semantics, one-to-one value reuse, Prepare-only cross-invocation continuity, first-commit lifecycle termination, and transaction/replay boundary as the only child-command split rule. Design-only; no schema/runtime edits. |
| 2026-07-12 | Education/ERP cross-scenario identity validation | PASS | Education assignment publication versus per-image intake and ERP PaymentDoc submit/approve/confirm versus voucher-post work-item effects confirmed that process identity, command identity, and effect dedupe keys must remain separate. |
| 2026-07-12 | B2-B2a terminology and fan-out drift scan | PASS | Active task contracts use generic `invocationRequestId`, no longer infer command count from target/effect count, and keep My-Chat free of scenario command interpretation. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B2-B2a convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2-B2a convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-B2a documentation sync. |
| 2026-07-12 | R8-B2-B2b key/hash/storage contract sync | PASS | Locked workspace-scoped command-ID uniqueness, bounded opaque identifiers, raw-ID prohibition, versioned namespaced SHA-256 identity/payload hashes, semantic field inclusion/exclusion, and first-commit-wins replay/conflict behavior. Design-only; no schema/runtime edits. |
| 2026-07-12 | B2-B2b security and dynamic-state boundary scan | PASS | Active contracts keep PII/prose out of request IDs, reserve HMAC for future low-entropy integrations, include finalized business content but exclude model telemetry, and recheck dynamic auth/grant/object state without making it part of request identity. |
| 2026-07-12 | B2-B2b replay/version drift scan | PASS | Execution versions retain canonicalizer compatibility; same-key/same-hash, same-key/different-hash, new-key/same-payload, failed-attempt correction, and concurrent winner semantics are explicit. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B2-B2b convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2-B2b convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-B2b documentation sync. |
| 2026-07-12 | R8-B2-C simplified MVP runner/concurrency/result sync | PASS | Locked one immutable Execution table and thin command runner, authenticated fast replay, bounded transaction advisory lock, aggregate optimistic concurrency, stable multi-object order, refs-only results, current-visibility replay, and no IIA deletion path. Design-only; no schema/runtime edits. |
| 2026-07-12 | B2 complexity/scope reduction scan | PASS | HMAC v2, partition/archive/tombstone jobs, multi-database adapters, Redis, reservation/attempt/processing states, generic lock/rules DSL, and universal transaction retry engine are explicitly deferred rather than implementation blockers. |
| 2026-07-12 | B2 concurrency and actor compatibility scan | PASS | Same-ID versus same-target concurrency are separate, service-principal retry preserves the business actor, busy/rollback do not consume identity, and Education/ERP-compatible behavioral semantics remain implementation-agnostic outside the Nurture Postgres adapter. |
| 2026-07-12 | B2 closure next-step scan | PASS | B2-A1/A2, B2-B1, B2-B2a/B2-B2b, and B2-C are closed; overview and roadmap now identify B3 durable family-input routing/clarification as the remaining R8 blocker. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after simplified B2-C convergence and B2 closure. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B2 closure. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B2-C documentation sync. |
| 2026-07-12 | R8-B3-A Receipt/Item/Event ownership sync | PASS | Reused ChildLinkReceipt for durable family-to-org routing and FamilyCareItem/Event for long clarification, rejected duplicate Routing/Clarification aggregates, and retained InteractionContext/token only for short resolver ambiguity. Design-only; no schema/runtime edits. |
| 2026-07-12 | B3-A pending-receipt schema correction | PASS | Reconciled B1 unresolved-target pending semantics with nullable grant/data-class/target fields, added stable routingAttemptKey identity independent of nullable state, and required complete current grant/target fields before delivered/read/acknowledged. |
| 2026-07-12 | B3-A long-clarification contract scan | PASS | Added waiting_for_family + optimistic version and correlated request/received/expired/cancelled ItemEvents; multi-round history is append-only and no dedicated clarification table is required for MVP. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B3-A convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B3-A convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B3-A documentation sync. |
| 2026-07-12 | R8-B3-B host-first durable-driver sync | PASS | Locked direct atomic fast path versus host-first async Run/Step, required an already-durable typed driver before pending Receipt creation, and kept host Step technical state separate from Nurture business status. Design-only; no schema/runtime edits. |
| 2026-07-12 | B3-B current-runtime compatibility review | PASS | My-Workflow-Base/My-Chat already provide Run/Step claim/lease/worker execution but no cross-scenario pending scanner; the design reuses existing runtime and records the host ChatMessage owner-read/start-run wiring as implementation work. |
| 2026-07-12 | B3-B crash-window and boundary scan | PASS | Host-first Run closes pre-capture orphan risk, B2 replay closes post-commit/pre-step-complete gaps, B1 remains activation-only, queue payloads are refs-only, and Receipt stores no lease/attempt/DLQ/provider state. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B3-B convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B3-B convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B3-B documentation sync. |
| 2026-07-12 | R8-B3-C1 scenario-owned lifecycle-status sync | PASS | Locked My-Chat Run/Step/Handoff and shared Command states as technical/reusable only, while Receipt/Item/Event/token statuses and reasons remain exclusively Nurture business policy. Design-only; no schema/runtime edits. |
| 2026-07-12 | B3-C1 host-consumption boundary scan | PASS | My-Chat cannot branch on Nurture statuses or edit them through Admin; Nurture presenters/actions produce generic structured UI and business recovery availability from current owner state. |
| 2026-07-12 | B3-C1 shared-base scope scan | PASS | Shared contracts retain durable-driver, refs-only, replay, and owner-revalidation invariants without adding a generic business lifecycle or universal DriverType/analytics class. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B3-C1 convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B3-C1 convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B3-C1 documentation sync. |
| 2026-07-12 | R8-B3-C2a-d Nurture transition sync | PASS | Locked grant revoke, source redaction, pre-delivery cancel/post-delivery withdrawal, correction/resend, and clarification deadline/cancel/late-response transitions as Nurture-only lifecycle policy. Design-only; no schema/runtime edits. |
| 2026-07-12 | B3-C2a-d history/non-erasure scan | PASS | Delivery/read/ack timestamps and append-only events remain auditable; revoke differs from redaction, withdrawal differs from cancellation, and correction/resend never overwrite prior actions. |
| 2026-07-12 | B3-C2a-d clarification-state scan | PASS | Current wait pointers live on Item, event history remains append-only, token TTL has no business effect, optional deadline is host-first, and late response is retained without inferred consent. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS | Governance views synchronized after B3-C2a-d convergence. |
| 2026-07-12 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Governance lint passed after B3-C2a-d convergence. |
| 2026-07-12 | `git diff --check` | PASS | No whitespace errors after the B3-C2a-d documentation sync. |
| 2026-07-12 | R8-B3-C2e technical-exhaustion/Admin-recovery sync | PASS | Locked host exhaustion as manual-review evidence rather than a Receipt transition; only Nurture owner commands may classify blocked, already delivered, recoverable pending, or terminal failed outcomes. Design-only; no schema/runtime edits. |
| 2026-07-12 | B3-C2e terminality/recovery scan | PASS | Pre-failure technical retry reuses Step/command/routing identity; post-failure recovery creates a new host-first Run/Step, command, routing key, and Receipt linked by `retryOfReceiptId`; failed rows never reopen. |
| 2026-07-12 | B3-C2e Admin/race/taxonomy scan | PASS | Admin cannot directly mutate Nurture status or gates; delivery-versus-failure uses current-state/version/B2 convergence; MVP adds only `technical_recovery_exhausted` while host evidence retains technical details. |
| 2026-07-12 | IIA-0-R8 closure scan | PASS | B1/B2/B3-A/B/C1/C2a-e are locked; `grantDependencies[]` and transaction-external remote work already satisfy the two prior refinements, leaving no R8 blocker. |
| 2026-07-12 | IIA-0 scenarioToken responsibility-boundary sync | PASS | Locked My-Workflow-Base to opaque continuation/structured-interaction protocol and conformance, My-Chat to render/pass-through, and Nurture to local persistence/business recovery/authorization. Design-only; no schema/runtime edits. |
| 2026-07-12 | scenarioToken scope/complexity scan | PASS | Token remains limited to clarify/submit-action/open-notification continuation, does not become session/authorization/workflow/object-access state, and no central token service/shared DB is introduced before a second scenario validates extraction. |
| 2026-07-12 | IIA-0 `NurtureInteractionContext` schema-contract sync | PASS | Locked one local row per token, hash-only token storage, participant/purpose/surface binding, versioned purpose payload, optimistic version, and no separate token/session/draft platform. Design-only; no Prisma/runtime edits. |
| 2026-07-12 | InteractionContext lifecycle/classification scan | PASS | Persisted state is only active/consumed/revoked; expiry derives from `expiresAt`, while current/expired/recoverable/blocked remain resolver outcomes after current-state revalidation. |
| 2026-07-12 | InteractionContext command/replay scan | PASS | Multi-turn submit derives a stable B2 command identity from context id; direct commands retain invocation identity; consumed submit can recover an exact committed Execution without storing raw host request IDs. |
| 2026-07-12 | IB resolver-input drift correction | PASS | Removed host-authored target/role-assignment input from the IB schema narrative and aligned it with the locked R3 host invocation envelope plus Nurture-owned resolution. |
| 2026-07-12 | B1 replay-seed carrier architecture review | PASS WITH BLOCKER RESOLVED IN CONTRACT | Versioned Execution JSON is appropriate because seeds are bounded immutable command results, but persistence alone cannot wake My-Chat; non-empty seeds now require a pre-existing durable host Step. Design-only; no schema/runtime edits. |
| 2026-07-12 | B1 orphan-seed crash-window scan | PASS | Direct no-Run commands are limited to explicit empty snapshots; requested activation without a service-authenticated durable Step fails before Nurture commit, while post-commit response loss is recovered by Step replay. |
| 2026-07-12 | B1 responsibility/complexity review | PASS | Nurture owns business + Execution + replay seed; My-Chat owns Step + Handoff Ledger + outbox/attempts; My-Workflow-Base owns contracts only. No scanner, Nurture outbox, Redis state, Saga, or extra model call is introduced. |
| 2026-07-12 | B1 current-host readiness review | BLOCKED FOR IMPLEMENTATION | My-Chat `complete_step` currently lacks handoff drafts/materialized results, Handoff Ledger has no discovered concrete Postgres repository/model, and the Nurture adapter is synthetic. Non-empty snapshots remain disabled until the cross-repo host prerequisite is implemented. |
| 2026-07-12 | B1 claimed-Step driver-attestation sync | PASS | Locked persist+claim before Nurture invocation, trusted runtime driver context, transient non-persisted claim token/version, and host-side final claim validation without a cyclic owner-read. Design-only; no runtime edits. |
| 2026-07-12 | B1 exclusive replay-owner scan | PASS | Only the persisted original Step ref may retrieve non-empty snapshots; reclaim may rotate token/version, another Step cannot take over, Admin uses the original Step, and post-materialization replay stays on Handoff Ledger. |
| 2026-07-12 | B1 claim-expiry/cancel race scan | PASS | Claim expiry reclaims the same Step and B2-replays; cancellation never deletes recovery evidence and cannot erase a committed Nurture result; current gates determine stopped/completed host activation. |
| 2026-07-12 | B1 driver-complexity/security scan | PASS | No Nurture owner-read callback, signed driver-token platform, cross-DB lock, or persisted/logged claim secret; service/ref/binding mismatch fails before first commit and wrong-Step replay exposes no snapshots. |
| 2026-07-13 | Cross-repo dependency/source inspection | PASS | Confirmed My-Workflow-Base is template-only, Nurture directly consumes My-Chat workflow packages, My-Chat has Run/Step/Outbox schema but its current workflow-runtime task excludes concrete persistence, and Nurture supports host runtime injection with synthetic defaults. |
| 2026-07-13 | X0-X5/N1-N2 sequencing review | PASS | Contract-first adoption, host Step then Handoff kernels, parallel Nurture explicit-empty core, gated activation integration, and joint enablement are independently mergeable and avoid a three-repo cutover. |
| 2026-07-13 | Implementation-entry worktree scan | CONDITIONAL PASS | My-Workflow-Base and My-Chat were clean; The-Nurture was ahead one commit with extensive existing changes. X0/X1 may start; N1 requires scoped isolation/commit before schema work. |
| 2026-07-13 | G0 formal baseline isolation | PASS | Reconstructed from `origin/main` as five independent increments; production Prisma has only Nurture tables and backend-private Prisma has only workflow dev-host tables. No institution schema/live manifest was added. |
| 2026-07-13 | G0 test and ownership matrix | PASS | 86 unit, 15 production DB, 14 dev-host E2E, both catalog boundaries, frontend lint/build, contract pin, context, and governance passed. N1 dirty-worktree blocker is resolved; X1 remains its contract dependency. |
| 2026-07-13 | G0 merge/closure hardening audit | PASS | PR/main CI, fresh-worktree verification, cleanup, loopback-only dev host/Postgres, env-loader tests, Base web-workbench source pin, 86 unit + 15 production DB + 16 dev-host E2E, and governance completion passed. T-002 remains planned; X0 is the next implementation gate. |
| 2026-07-13 | N1-D resolver/policy targeted verification | PASS | 30 targeted interaction/resolver/policy tests cover opaque tokens, binding/replay/revoke, candidate ranking/ties/limits, host-scope rejection, role-agnostic and workspace-optional ingress, current-state/lifecycle revalidation, and structured policy reasons. |
| 2026-07-13 | N1-D architecture review and repair | PASS AFTER REPAIR | Closed inactive-scope, cross-workspace reachability, grant-target/revoke, same-conversation purpose, unbounded-query, sequential-query, safe-label-size, and repository-failure gaps before acceptance. |
| 2026-07-13 | N1-D full static/unit gate | PASS | Full typecheck; 15 unit files / 125 tests; test routing; both Prisma validations; persistence boundary; N1 schema contract; cross-repo contract pin; and diff whitespace pass. No DB apply occurred. |
| 2026-07-13 | N1-E targeted command/query verification | PASS | 22 tests cover explicit-empty capture/replay, actor/workspace/child binding, durable driver ref shape, grant revoke, ack/reply, redaction/cancel, class-of-10 inbox, attention board, invalid dates, and authorization/outage separation. |
| 2026-07-13 | N1-E architecture review and repair | PASS AFTER REPAIR | Removed premature manifest activation and closed linked-grant reactivation, target-scope, current participant/enrollment/thread, receipt-version, bounded redaction, semantic ordering, and protected-ref validation gaps. |
| 2026-07-13 | `pnpm test:unit:ci && pnpm verify:unit-population && pnpm verify:test-routing` | PASS | 16 unit files; 147/147 tests pass; routing census remains 16 unit / 2 production DB / 7 dev-host files. |
| 2026-07-13 | N1-E static contract gates | PASS | Full typecheck, production Prisma validate, placeholder dev-host Prisma validate, persistence/N1 schema contracts, workflow contract pin tests, module validator/registry, and `git diff --check` pass. |
| 2026-07-13 | `pnpm db:assert-boundary` | EXPECTED FAIL / N1-F GATE | Configured production DB still contains the G0 catalog and is missing the 21 additive N1 tables. No database was mutated; target-specific approval is required before apply. |
| 2026-07-14 | Destructive SQL preflight + `pnpm db:deploy` | PASS | No `DROP`, `TRUNCATE`, `DELETE FROM`, or ALTER rename/drop statement; applied `20260713150000_nurture_institution_n1_core` only to approved `localhost:5433/nurture`. |
| 2026-07-14 | Prisma migration status + production catalog boundary | PASS | Both migrations applied; schema up to date; production catalog is 43 Nurture tables / 71 enums. |
| 2026-07-14 | `pnpm test:unit:ci` + population | PASS | 53 suites; 152/152 unit tests pass. |
| 2026-07-14 | `pnpm test:db:ci` + population | PASS | 16 suites; 22/22 production DB tests pass, including full resolver → query → presenter reread before/after grant revoke and thread-membership denial for acknowledge/reply. |
| 2026-07-14 | `pnpm test:dev-host:ci` + population | PASS | 15 suites; 16/16 isolated dev-host tests pass. |
| 2026-07-14 | Production/dev-host Prisma and catalog boundaries | PASS | Both Prisma schemas validate; production remains 43/71 Nurture-only and dev-host remains 6/2 Workflow-only. |
| 2026-07-14 | My-Chat validator/registry targeted conformance | PASS | 32/32 targeted surface + module tests pass; both new manifest handler keys resolve and module registration has no fatal finding. |
| 2026-07-14 | YAML/TypeScript manifest parity | PASS AFTER REPAIR | Full parsed objects match after correcting the pre-existing parent/family declaration-order drift. |
| 2026-07-14 | Workflow contract pin verification | PASS AFTER REPAIR | Base and My-Chat remain byte-identical at shared hash `0bd892...`; Nurture source pin now covers four files and verifies at `de32f2...`. |
| 2026-07-14 | Context strict verification | PASS | Workflow context checksum refreshed; context layer strict verification passed. |
| 2026-07-14 | Persistence/schema/test-routing gates | PASS | Persistence boundaries, N1 schema contract, routing census 16 unit / 3 production DB / 7 dev-host files, and population locks all pass. |
