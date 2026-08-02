# Verification — 儿童照护双看板

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Shared-fact / role-projection model selected | PASS |
| 2026-07-29 | Two-stage publish retained | PASS |
| 2026-07-29 | Ranking and diagnostic behavior excluded | PASS |
| 2026-07-29 | PublishProcess separated from InstitutionWorkflow | PASS |
| 2026-07-29 | Board workflow projection is role-safe and non-owning | PASS |
| 2026-07-29 | Context strict verification plus project governance sync/lint after terminology consolidation | PASS |
| 2026-07-29 | Teacher board aligned to exact-CareGroup shared responsibility without acknowledge-time personal claim | PASS |
| 2026-07-29 | Teacher board aligned to CareGroup-owned multi-reply append stream and first-reply-only Attention resolution | PASS |
| 2026-07-29 | D-01 shared canonical facts/module semantics/projection pipeline with role-specific query and presenter boundary | PASS |
| 2026-07-29 | D-01 board retained as an operable low-interruption surface without making derived snapshots a write authority | PASS |
| 2026-07-29 | D-02 PublishProcess limited to the caregiver-side family-release boundary from explicit candidate to publish/cancel | PASS |
| 2026-07-29 | D-02 raw capture, CareInteraction, ActionDelivery, InstitutionWorkflow and AI-provider ownership excluded | PASS |
| 2026-07-29 | D-03 domain facts retain independent meaning/lifecycle/authority while presenters compose semantic content | PASS |
| 2026-07-29 | D-10 thirty-second quick-adjust timeout enters pending queue without publication or Receipt | PASS |
| 2026-07-29 | D-11 normal edits remain available until release; no post-publication review window or teacher duty added | PASS |
| 2026-07-29 | D-13 My-Chat protected local media cache separated from Nurture business media authority | PASS |
| 2026-07-29 | D-17 through D-22 correctness/integration spine locked without pre-deciding D-05 publication unit | PASS |
| 2026-07-29 | D-05 HTML one-card/multi-family experience mapped to one shared PublishProcess and target-specific PublicationRelease effects | PASS |
| 2026-07-29 | D-05 per-target authority/Receipt, explicit partial result and retry boundary locked | PASS |
| 2026-07-29 | D-06 five-state PublishProcess lifecycle separated from target execution and ActionDelivery states | PASS |
| 2026-07-29 | D-06 exception-only review, first-release revision freeze and partial-result derivation locked | PASS |
| 2026-07-30 | D-07 exact-CareGroup caregivers share T-006 work without creator claim or Lead review gate | PASS |
| 2026-07-30 | D-07 Lead retained for institution operations and excluded as T-006 authority | PASS |
| 2026-07-30 | D-08 Nurture draft/revision separated from My-Chat protected local working buffer | PASS |
| 2026-07-30 | D-08 autosave, single short edit hold, strict revision conflict and online pending edit locked | PASS |
| 2026-07-30 | D-09 explicit now-send and no per-item second approval for pending release locked | PASS |
| 2026-07-30 | D-09 17:00 schedule, 19:00 retry cutoff, current reread and missed-send handling locked | PASS |
| 2026-07-30 | D-12 asset, attribution and PublicationRelease lifecycles separated | PASS |
| 2026-07-30 | D-12 derived media eligibility, group-photo exposure and staged deletion semantics locked | PASS |
| 2026-07-30 | D-10 capture accumulation separated from organize trigger and thirty-second quick-adjust window | PASS |
| 2026-07-30 | D-10 manual, configurable idle and daily fallback triggers bound to stable source watermark | PASS |
| 2026-07-30 | D-10 one-minute quiescence gate separated from ten-minute trigger and thirty-second quick-adjust | PASS |
| 2026-07-30 | D-10 manual bypass, class-wide activity reset and background-progress exclusion locked | PASS |
| 2026-07-30 | D-14 original media remains unchanged while exact-CareGroup face matching minimizes routine teacher confirmation | PASS |
| 2026-07-30 | D-14 high-confidence automatic attribution, exception review and default-off privacy activation gate locked | PASS |
| 2026-07-30 | D-15 automatic photo-first content assembly uses source text, transcript and deterministic templates without generated prose | PASS |
| 2026-07-30 | D-15 AI copy limited to explicit caregiver requests or separately designed summaries | PASS |
| 2026-07-30 | D-15 Nurture ContentSafetyPolicy owns ordinary/review/direct-interaction routing | PASS |
| 2026-07-30 | D-15 sensitive care events leave batch publication for explicit T-005 caregiver action | PASS |
| 2026-07-30 | Full T-006 package cross-check against F-003, T-004/T-005 and current UX/owner boundaries | PASS |
| 2026-07-30 | released+partial handling preserves the first-release exact revision freeze | PASS |
| 2026-07-30 | T-006 direct-interaction route fails closed until a dedicated T-005 caregiver-initiated capability is available | PASS |
| 2026-07-30 | D-04 and D-16 confirmed as unused numbering gaps rather than open decisions | PASS |
| 2026-07-30 | Stage G3 split into G3-A shared boards, G3-B capture/draft, G3-C content/media safety, G3-D publish/release and G3-E integration qualification | PASS |
| 2026-07-30 | G2-C provider qualification separated from G3-E consumer qualification without a T-005/T-006 completion cycle | PASS |
| 2026-07-30 | G3-B1 deterministic and G3-C1 manual lanes fixed as required; AI copy and face match fixed as optional parallel enhancements | PASS |
| 2026-07-30 | T-007 publication-policy subset fixed as hard dependency while full T-007 and optional Workflow projection remain non-blocking | PASS |
| 2026-07-30 | Stage G3 overall audit across goal, ownership, dependencies, critical path, optional lanes and Exit | PASS |

## Planned Verification

- Domain and policy unit tests.
- Repository transaction, concurrency and idempotency tests.
- Presenter snapshots for both roles.
- Wrong-child, revoked-grant and cross-family leakage tests.
- Optional AI-copy provider failure / malformed suggestion tests proving the deterministic
  assembly and manual path remain available.
- Media attribution and correction tests.
- Full capture → review → publish → guardian reread black-box journey.
- Projection tests proving same-role visibility still requires Workspace/scope/policy.
- Negative tests proving board projections expose no raw Run/Step/internal note and cannot be mutated directly.
- Same-CareGroup alternate-caregiver reply and cross-CareGroup denial tests after acknowledgement.
- Concurrent distinct-reply ordering, same-command replay and no-duplicate-Attention tests.
- Inline adjustment tests proving display preferences, PublishProcess drafts and canonical
  fact mutations use their declared owners and invalidate/re-read the board projection.
- Negative tests proving direct snapshot/cache patching cannot create a business fact,
  Receipt, authority result or ActionDelivery.
- Negative tests proving capture/upload success or an AI suggestion cannot by itself create
  a Guardian-visible publication or Receipt.
- Boundary tests proving published means Nurture fact/Receipt commit rather than Host
  notification, provider or device delivery.
- Capture-batch tests proving a photo, upload completion or media-ready event does not create
  a family candidate or start the thirty-second window; pre-organize removal only changes
  the batch input.
- Organize-trigger tests covering manual action, configurable ten-minute idle and
  default-send-minus-thirty-minute fallback (16:30 for 17:00), due-without-cut while capture
  remains active, server clock/timezone, stable source watermark, in-flight upload rollover
  and exact replay without duplicate PublishProcess.
- Quiescence tests proving manual organize bypasses the gate, ten-minute idle does not wait
  twice, and fallback due cuts after the configurable one-minute user-idle gate rather than
  another ten minutes.
- Multi-caregiver activity tests proving any current exact-CareGroup capture/edit activity or
  valid short activity lease resets quiescence, while upload percentage, thumbnails,
  heartbeat and provider progress do not; enabling automatic triggers rejects a zero gate.
- Timer tests proving only a committed ordinary/high-confidence organizer draft starts the
  thirty-second advance, edit interaction pauses it, timeout only queues, and scheduler
  cannot publish before the candidate-specific deadline.
- Deterministic-assembly tests proving teacher text remains unchanged, voice transcript keeps
  provenance, versioned activity/time/media-count templates are stable, and photo-only content
  needs no generated body.
- Optional-copy tests proving routine auto-organize never calls the copy provider; explicit
  caregiver invocation returns a suggestion that changes the draft only after adoption, while
  rejection preserves the exact prior draft.
- Claim-fidelity tests proving adopted AI copy maps every claim to exact source refs, preserves
  uncertainty/negation/quotes/numbers, adds no unsupported emotion/cause/frequency/development
  conclusion, and stores no chain-of-thought.
- Safety-policy tests proving deterministic hard rules precede optional classifier signals,
  institution policy can only tighten, caregiver can raise risk or resolve reviewable text,
  and no actor/provider can lower a hard restricted route.
- Routing tests proving ordinary creates a D-10 draft, review-required maps to needs_review,
  and injury/health/medication/serious emotion-behavior/body-privacy/identity-contact content
  remains internal with only an owner-issued explicit T-005 action.
- Negative tests proving T-006 never auto-creates CareInteraction or copies restricted body,
  provider failure/low confidence/conflict cannot default ordinary, and policy drift blocks
  existing draft/pending release without adding a PublishProcess state.
- Capability-availability tests proving T-006 does not reuse the ordinary T-005 family-question
  action for restricted caregiver-originated content and remains safely blocked until the
  dedicated owner-issued capability is current and eligible.
- Pending-release tests proving content remains editable until commit and an active/unsaved
  edit is skipped rather than published from a stale revision.
- Post-publication tests proving no review task/window is created while correction, target
  visibility removal, replacement and redaction remain auditable low-frequency actions.
- My-Chat cache tests for account/Workspace isolation, TTL/logout cleanup, offline retry and
  denial after current owner-reread fails.
- Transaction/replay tests proving owner-reread, effect, Receipt and CommandExecution share
  the declared commit boundary and delivery/cache/provider state cannot substitute for it.
- Multi-target tests proving one shared revision creates independently authorized releases,
  one target failure does not roll back valid targets, and each target has its own Receipt.
- Retry/reconcile tests proving only failed or outcome-unknown targets are retried and an
  already committed release is not duplicated.
- Split-unit tests proving target-specific body or media composition cannot be hidden under one
  shared revision.
- State-transition tests covering draft, exception-only needs_review, pending_release,
  released and pre-release cancelled, including rejection of illegal rollback.
- Partial-release tests proving first committed target freezes the shared revision, zero
  commits remain pending, partial/full are derived from explicit target results, and remaining
  targets only retry/reconcile the exact frozen revision.
- Partial-release mutation tests proving body/media/target-semantic changes after the first
  commit require a new process/replacement rather than rewriting the released process.
- Ownership tests proving timer, scheduledAt, CommandExecution, rejected/outcome-unknown and
  ActionDelivery do not become PublishProcess lifecycle values.
- Shared-caregiver tests proving another current caregiver in the exact CareGroup can edit,
  review, send, cancel and perform safety actions without taking a personal claim.
- Negative role tests proving wrong-CareGroup, Lead-only, Institution-Admin-only, general
  institution membership and system-operator identities cannot access T-006 content.
- Audit tests proving CareGroup remains the family-facing sender while each creator, editor,
  reviewer, release executor and safety executor remains attributable.
- Autosave tests for debounce, saving/saved/failed feedback, exact replay, exit flush and
  explicit retry/discard behavior.
- Edit-hold tests for single active editor, authorized renewal, scheduler skip, release on
  completion/leave/expiry and absence of personal ownership semantics.
- Conflict tests proving expectedDraftRevision drift cannot last-write-win and local-only or
  failed saves cannot become a published revision.
- Offline tests proving pending-release edit/cancel/pause requires an online hold, while a
  protected new local draft can re-enter through current owner/policy/revision checks.
- Schedule tests proving institution-timezone 17:00/19:00 resolution uses server time and
  later default-policy changes do not silently move existing processes.
- Manual-send tests proving one explicit tap has no second modal but cannot bypass saved
  revision, edit-hold, role, Grant, target, media or policy gates.
- Retry-window tests proving exact retry/reconcile before notAfter, target-local partial
  compensation, no blind retry for policy rejection, and visible queue retention after cutoff.
- Boundary tests proving notification quiet hours/provider/device delivery cannot rewrite
  Nurture scheduledAt, notAfter or publication results.
- Media lifecycle tests for preparing/ready/unavailable/discarded/redacted independent from
  candidate/confirmed/rejected/superseded attribution and PublicationRelease.
- Eligibility tests proving ready alone cannot publish and every visible child/exposure,
  exact original-media revision, Grant, target and redaction fence is current.
- If G3-C2 is implemented or profile-required, face-match scope tests proving only current
  exact-CareGroup/current-Enrollment authorized
  avatar opaque refs enter the matcher; raw IDs/names, institution-wide, cross-class,
  departed-child and history-match inputs are rejected.
- If G3-C2 is implemented or profile-required, face-match decision tests proving versioned
  quality/top-1/margin gates automatically
  confirm only high-confidence results; low-confidence, occluded, look-alike, unknown and
  conflicting results enter needs_review, and manual correction supersedes the automatic fact.
- Group-photo tests proving every clearly visible child requires current confirmed attribution
  and audience exposure; unresolved/disallowed faces block automatic queueing and are resolved
  only by attribution correction, whole-photo removal, target adjustment or process split.
- Original-media tests proving published media is the exact unchanged source revision and no
  crop, blur, beautification or other visual rendition is created.
- If G3-C2 is implemented or profile-required, biometric-lifecycle tests proving the matcher
  is default-off until consent/PIPIA/privacy
  gates pass, reference templates remain encrypted and CareGroup/purpose-scoped, temporary
  photo embeddings are deleted, and withdrawal/Enrollment end disables further matching.
- Deletion tests proving process detach is local, global discard requires zero committed
  releases, post-release removal/redaction preserves Receipt/audit, and storage cleanup
  respects references and retention.

## Required Evidence

证据必须绑定精确 source pin 与 fixture version，并包含失败路径。UI mock、静态截图或数据库直查不能替代发布回执和权限验证。

## Documentation Checks

| Date | Command | Result |
| --- | --- | --- |
| 2026-07-30 | `git diff --check` | PASS — no whitespace errors |
| 2026-07-30 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS — project governance lint passed |
| 2026-07-30 | `rg -n -i "下一步审计\|未逐项\|Open Items\|待锁定\|待决定\|15 秒否决窗\|否决窗 15s\|12:30" dev-docs/active/nurture-child-care-boards .ai/project/main/feature-map.md --glob '!04-verification.md'` | PASS — no stale open-decision wording or superseded prototype constants |
| 2026-07-30 | Stage G2-C dependency review against T-005 and T-008 | PASS — exact dedicated capability required; no guessed key, source-body copy, auto-create or PublishProcess fallback |
| 2026-07-30 | `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --check-anchors` | PASS — 6/6 files, no errors or warnings |
| 2026-07-30 | Stage G3 cross-task consistency review across T-005/T-006/T-007/T-008 and project hub | PASS |
| 2026-07-30 | Governance sync/lint, strict context verification, Markdown links/anchors/headings and `git diff --check` | PASS |
| 2026-07-30 | G3 overall audit landing: governance sync/lint, project-state verify, 6/6 task-doc link/anchor lint, strict context verification and `git diff --check` | PASS |

## 2026-08-02 — G3-0 Freeze Qualification

| Command / check | Result |
| --- | --- |
| `node .ai/scripts/ctl-project-governance.mjs resume --task T-006 --json` | PASS — explicit `T-006 nurture-child-care-boards`, clean worktree, state `planned` before transition |
| `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main --changelog` + strict lint | PASS — T-006 synchronized to `in-progress` |
| registered DB context census over focus/daily care/attention/media/authority facts | PASS — 15 required landed tables; T-006 process/release facts correctly absent before implementation |
| exact T-004/T-005 surface, visibility, direct capability/input/result/head/unavailable census | PASS — `1.8.0` / `4fe91e…`; Caregiver Workflow projection denial identified |
| exact T-007 G4-0B policy freeze census | PASS — `nurture.institution-publication-policy@1.0.0`, required fields/defaults and provider-pending gate present |
| first `pnpm verify:g3-0-freeze` | FAIL — verifier compared semantically equal JSON objects by insertion order; no contract mismatch |
| verifier canonicalization repair | PASS — recursive key canonicalization removes order sensitivity without weakening array/value checks |
| second `pnpm verify:g3-0-freeze` | PASS — facts=15, surfaces=2, exact T-005, frozen T-007, explicit schema delta/profile/stage gates, no placeholders |
| `node --check scripts/assert-g3-0-freeze.mjs` | PASS — verifier syntax valid |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 Markdown files, zero warnings/errors, links and anchors valid |
| `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS — registered context remains consistent; no context artifact changed |
| governance sync + strict lint | PASS — T-006 remains the sole `in-progress` task for this bundle and project views are synchronized |
| `git diff --check` | PASS — no whitespace errors |

## 2026-08-02 — G3-A Step 1 (Shared Read Pipeline and Role-safe Envelopes)

| Command / check | Result |
| --- | --- |
| `pnpm test:unit` | PASS — 33 files / 310 tests (42 new G3-A board tests) |
| `pnpm typecheck` | PASS — no diagnostics |
| `pnpm verify:test-routing` | PASS — files=68 unit=33 production-db=13 dev-host=11 scenario-service=10 x5-joint=1 |
| `pnpm verify:surface-conformance` | PASS — `nurture.surface-contract@1.8.0` / `4fe91e…`, cases=11 slices=26/26, artifact unchanged this step |
| `pnpm verify:formal-ingress-contract` | PASS — routes=7 unchanged |
| `pnpm verify:persistence-boundaries` | PASS — board projection stays out of the persistence layer |
| `pnpm verify:port-topology` | PASS — unchanged |
| `pnpm verify:g3-0-freeze` | PASS — placeholders still absent; no capability key registered ahead of its implementation |
| negative: raw Enrollment id, another actor's option ref and an unknown target as `query_guardian_enrollment_activity` input | PASS — all three `denied/target_unavailable` before the source is touched |
| negative: Institution-scoped Lead, Institution Admin, Institution member and other-CareGroup caregiver on the Caregiver lane | PASS — `denied/not_authorized`, read port never invoked |
| negative: `NurtureFocusGoal` row with child hints but no explicit child-scope fact | PASS — projected as family focus, never child focus |
| negative: cursor replay after source/authority/correction/redaction/Grant drift or snapshot-version change | PASS — `refresh_required` for all six |
| negative: Caregiver envelope with an injected `institution_workflow_projection` grant | PASS — absent from content and from the serialized envelope |
| paging closure: fact-level drops across three source batches with `pageSize=4` | PASS — full page returned over two scan rounds; a fixed `take` would have returned 2 of 4 |

## 2026-08-02 — G3-A Step 2 (Canonical-owner Inline Board Mutations)

| Command / check | Result |
| --- | --- |
| `pnpm test:unit` | PASS — 34 files / 320 tests (10 new mutation tests) |
| `pnpm typecheck` | PASS — no diagnostics |
| `pnpm verify:test-routing` | PASS — files=69 unit=34 |
| `pnpm verify:surface-conformance` | PASS — artifact still `1.8.0` / `4fe91e…`; no key registered before its rotation step |
| `pnpm verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` / `verify:g3-0-freeze` | PASS — unchanged |
| negative: raw FocusGoal id, another actor's ref, unknown goal and a cross-kind target ref on `update_guardian_current_focus` | PASS — `denied/not_authorized` for all four |
| negative: raw ChildCareProcess id, unknown child and a cross-kind ref on `record_caregiver_daily_care` | PASS — `denied/not_authorized`; missing target is `needs_input` |
| negative: Institution Admin, guardian role, Institution-scoped role, other-CareGroup role and inactive Enrollment on the daily-care write | PASS — `blocked/not_authorized`; exact-CareGroup `lead_caregiver` still `ready` |
| negative: focus-goal head drift and Enrollment head drift | PASS — `conflict/stale_confirmation` before commit; in-transaction drift throws |
| negative: absent `boardMutations` owner port | PASS — `invalid/board_mutation_port_unavailable`, fail closed |
| negative: daily-care committed result inspected for receipt/publication/visibility/delivery claims | PASS — internal class fact only |

## 2026-08-02 — G3-A Step 3 (Additive Surface Contract Rotation to 1.9.0)

| Command / check | Result |
| --- | --- |
| `pnpm build:surface-contract` | PASS — `nurture.surface-contract@1.9.0` / `sha256:d769e496…`, capabilities=18 surfaces=6 |
| `pnpm verify:surface-contract` | PASS — deterministic rebuild matches byte for byte |
| `pnpm verify:surface-conformance` | PASS — cases=12 slices=33/33, 63 contract tests, shared-core hash unchanged |
| additive-rotation census | PASS — `sharedCoreHash` and all 11 T-005 capability slice hashes plus all 6 surface slice hashes are byte-identical to `1.8.0` |
| `pnpm verify:g2-exit-contract` | PASS — qualified identity `1.8.0` / `4fe91e…` still recorded, current `1.9.0`, every T-005 slice preserved |
| `pnpm verify:g3-0-freeze` | PASS — input `1.8.0`, current `1.9.0`, 7 G3-A keys registered at `1.0.0`, 15 later-checkpoint keys still absent |
| `pnpm test:unit` | PASS — 35 files / 327 tests |
| `pnpm typecheck` / `verify:test-routing` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — files=70 unit=35, routes=7 unchanged |
| negative: rebuild without a version rotation | PASS — the generator refuses a changed artifact that keeps its version |
| negative: board fixture declaring a module kind outside the surface registry | PASS — `phase-3-boards.test.ts` order/partition assertions fail closed |
| negative: caregiver board fixture NO-GO not declared as a surface dependency gate | PASS — caught during this step and corrected to `t006_teacher_board_projection` |
| fixture reproduction | PASS — the real presenters regenerate both board fixtures' module order, required bits, state and dependency NO-GOs from the same synthetic facts |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 files |
| `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` | PASS — after `ctl-context touch` for the rotated workflow contract doc |

## 2026-08-02 — G3-B1 Step 1 (Capture Batch, Deterministic Assembly and Draft Lane)

| Command / check | Result |
| --- | --- |
| `pnpm test:unit` | PASS — 39 files / 383 tests (56 new G3-B1 tests) |
| `pnpm typecheck` | PASS — no diagnostics |
| `pnpm verify:test-routing` | PASS — files=74 unit=39 |
| `pnpm verify:surface-conformance` | PASS — artifact still `1.9.0` / `d769e496…`; no key registered before its rotation step |
| `pnpm verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` / `verify:g3-0-freeze` / `verify:g2-exit-contract` | PASS — unchanged |
| negative: quiescence gate set to 0, 29 or 181 seconds while auto-organize is on | PASS — `invalid_quiescence_gate`; a fully manual policy accepts 0 |
| negative: idle period configured below its own gate | PASS — `idle_below_quiescence_gate` |
| negative: background upload/thumbnail/heartbeat progress during the fallback gate | PASS — the cut proceeds; only the user-activity head is observed |
| negative: live capture-activity lease under idle and fallback triggers | PASS — both wait; manual still cuts |
| negative: batch with an in-flight upload followed by a settled capture | PASS — watermark stops at the stable prefix, both later captures defer |
| negative: empty or entirely unstable batch | PASS — `empty_stable_batch`, no organizer job and no candidate |
| negative: automatic triggers with auto-organize disabled | PASS — `automatic_disabled`; manual organize still works |
| negative: transcript without its revision, media source without an asset, empty source text | PASS — assembly refuses instead of producing partial content |
| photo-only assembly | PASS — no body at all; serialized content contains no invented observation |
| negative: safety route null or provider throwing | PASS — `safety_route_unavailable`, never defaults to ordinary |
| negative: `review_required` candidate | PASS — `needs_review` with no quick-adjust window attached |
| negative: `direct_interaction_required` candidate | PASS — no process, no draft, internal source refs only |
| negative: mixed audience data class or purpose across targets | PASS — `mixed_audience_data_class` |
| negative: serialized publish targets inspected for content or raw identifiers | PASS — identity only; sealed refs leak no child/Enrollment/Grant id |
| negative: pending-release admission before the quick-adjust deadline, mid-edit, under a hold, with unsaved work, from needs_review or released | PASS — each blocked with its own reason code |
| negative: pending-release admission without a resolved institution schedule | PASS — `dependency_no_go` |
| negative: revision drift, replay with a changed payload, released/cancelled process, unknown source ref | PASS — conflict or denial, never a silent overwrite |
| negative: `pending_release` edit without an online hold, and a colleague's live hold | PASS — `edit_hold_required` / `held_by_other` |
| negative: cancel after any committed release | PASS — `already_released`; repeat cancel is `already_satisfied` |
| negative: sealed process ref used by another actor or after losing access | PASS — `target_unavailable` |
