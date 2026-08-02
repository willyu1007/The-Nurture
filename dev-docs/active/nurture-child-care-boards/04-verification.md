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

## 2026-08-02 — G3-B1 Step 2 (Publish Queue and Additive Rotation to 1.10.0)

| Command / check | Result |
| --- | --- |
| `pnpm build:surface-contract` / `verify:surface-contract` | PASS — `nurture.surface-contract@1.10.0` / `sha256:40fb7446…`, capabilities=25, deterministic rebuild |
| additive-rotation census | PASS — `sharedCoreHash` and every pre-existing capability/surface slice hash byte-identical |
| `pnpm verify:surface-conformance` | PASS — cases=13 slices=40/40, 69 contract tests |
| `pnpm verify:g3-0-freeze` | PASS — input `1.8.0`, current `1.10.0`, 7 G3-A + 7 G3-B1 keys at `1.0.0`, 8 later-checkpoint keys still absent |
| `pnpm verify:g2-exit-contract` | PASS — T-005 slices still preserved at `1.10.0` |
| `pnpm test:unit` | PASS — 41 files / 397 tests |
| `pnpm typecheck` / `verify:test-routing` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — files=76 unit=41, routes=7 unchanged |
| negative: publish queue read by an Institution Admin, an Institution-scoped role or another CareGroup | PASS — `not_authorized`, read port never invoked |
| negative: queue row whose own class scope lapsed | PASS — dropped, page refilled across scan rounds |
| negative: released process with 2 of 3 targets committed | PASS — `targetSummary` keeps both numbers; no bare published label |
| negative: queue cursor after redaction drift, and page size 21 | PASS — `refresh_required` / `invalid_query_input` |
| negative: scheduled time before an institution policy resolves | PASS — `scheduledAt` absent; caregiver board reports `t007_publication_policy` and stays `limited` |
| end-to-end fixture: capture → manual organize → deterministic assembly → draft | PASS — in-flight upload deferred, teacher text verbatim, quick-adjust deadline set, no generative provider involved |
| photo-only end-to-end fixture | PASS — draft created with no body at all |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 files |
| governance lint + `ctl-context verify --strict` | PASS — after `ctl-context touch` for the rotated workflow contract doc |

## 2026-08-02 — G3-C1 (Manual Content and Media Safety Path)

| Command / check | Result |
| --- | --- |
| `pnpm build:surface-contract` / `verify:surface-contract` | PASS — `nurture.surface-contract@1.11.0` / `sha256:7da48739…`, capabilities=28 |
| additive-rotation census | PASS — `sharedCoreHash` and every pre-existing slice hash byte-identical |
| `pnpm verify:surface-conformance` | PASS — cases=14 slices=43/43, 74 contract tests |
| `pnpm verify:g3-0-freeze` | PASS — 7 G3-A + 7 G3-B1 + 3 G3-C1 keys at `1.0.0`, 5 later keys absent, `c2-matcher=absent` |
| `pnpm verify:g2-exit-contract` | PASS — T-005 slices still preserved at `1.11.0` |
| `pnpm test:unit` | PASS — 45 files / 438 tests |
| `pnpm typecheck` / `verify:test-routing` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — files=80 unit=45, routes=7 unchanged |
| negative: institution overlay or a clean classifier attempting to lower a hard-rule hit | PASS — route stays `direct_interaction_required` |
| negative: classifier `unavailable` / `malformed` / `low_confidence` / below the confidence floor | PASS — raised to `review_required`, never ordinary |
| deterministic-only evaluation with no classifier configured | PASS — neutral content stays `ordinary` |
| negative: safety audit inspected for body, chain-of-thought or prompt text | PASS — revisions, markers and source heads only |
| negative: rejecting a confirmed attribution | PASS — `illegal_attribution_transition`; correction goes through supersession |
| negative: supersede onto an already-confirmed child, or onto the same child | PASS — `target_child_already_confirmed` / `supersession_requires_distinct_child` |
| negative: legacy `hidden`/`deleted` media and attribution rows without evidence | PASS — `ambiguous`, migration gate fails closed instead of guessing |
| negative: raw media id, another actor's media ref, raw child id, ineligible child | PASS — `target_unavailable` / `child_not_eligible` |
| negative: attribution on a discarded or redacted asset | PASS — `media_not_attributable` |
| negative: group photo with an unknown or candidate-only clearly visible child | PASS — `needs_review` with exactly the four allowed remedies |
| negative: every child confirmed but the audience exposure policy disallows one | PASS — `exposure_not_allowed`, still `needs_review` |
| negative: eligibility result inspected for crop/blur/variant/thumbnail | PASS — one ref per exact original revision only |
| negative: one target blocked by Grant while another is eligible | PASS — per-target results, the eligible target is not cancelled |
| negative: global media discard after any committed release | PASS — `already_released`; detach on a released process is `process_not_editable` |
| negative: any capability identity containing `face_match` or `biometric` | PASS — absent from the registry and the manifest |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 files |
| governance lint + `ctl-context verify --strict` | PASS — after `ctl-context touch` for the rotated workflow contract doc |

## 2026-08-02 — G3-0 Adoption-set Amendment (Media Lifecycle Identities)

| Command / check | Result |
| --- | --- |
| `pnpm verify:g3-0-freeze` | PASS — `reserved-keys=19`, every reserved identity adopted at `1.0.0` or explicitly unimplemented |
| negative: drop one reserved key from the tracking lists | PASS — the guard throws; verified by temporarily removing `discard_media_asset` and restoring it |
| `pnpm verify:surface-conformance` | PASS — artifact unchanged at `1.11.0` / `sha256:7da48739…`; no capability registered by this amendment |
| `phase-3-capture-to-draft.test.ts` later-checkpoint absence census | PASS — both new keys required absent until G3-D implements them |
| `pnpm test:unit` / `typecheck` / `verify:test-routing` / `verify:g2-exit-contract` | PASS — unchanged |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 files |
| governance lint + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-D (Publish and Release Loop)

| Command / check | Result |
| --- | --- |
| `pnpm build:surface-contract` / `verify:surface-contract` | PASS — `nurture.surface-contract@1.12.0` / `sha256:a9dcd5c8…`, capabilities=35 |
| additive-rotation census | PASS — `sharedCoreHash` and every pre-existing slice hash byte-identical |
| `pnpm verify:surface-conformance` | PASS — cases=15 slices=50/50, 80 contract tests |
| `pnpm verify:g3-0-freeze` | PASS — 7+7+3+7 adopted at `1.0.0`, adoption set closed, `c2-matcher=absent`, `reserved-keys=19` |
| `pnpm verify:g2-exit-contract` | PASS — T-005 slices still preserved at `1.12.0` |
| `pnpm test:unit` | PASS — 49 files / 478 tests |
| `pnpm typecheck` / `verify:test-routing` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — files=84 unit=49, routes=7 unchanged |
| schedule resolution against the exact T-007 pilot fixture | PASS — 17:00/19:00 Asia/Shanghai resolve to `09:00Z`/`11:00Z`; UTC institution resolves to `17:00Z` |
| negative: null policy, cutoff at/before release, bad timezone, bad local time, version 0, not-yet-effective, expired | PASS — `unavailable` with a distinct reason each |
| negative: policy head change after a window was frozen | PASS — window unmoved, `policyDrift` reported |
| content queued after the local cutoff | PASS — next day's window, not a silent roll-forward of a missed send |
| negative: reschedule into the past, past the cutoff, on a released or non-queued process, under a colleague's hold | PASS — distinct reason each |
| negative: scheduler attempt with hold, unsaved revision, lapsed authorizing role, policy drift, active quick-adjust, non-queued state | PASS — `skip` with its own reason; past the cutoff returns `missed` first |
| per-target fan-out with one revoked Grant | PASS — committed target keeps its release, blocked target never reaches the commit port, summary reports 1/1 |
| zero targets committing | PASS — stays `pending_release`, never labelled released, no `frozenRevision` |
| retry after partial release | PASS — committed target replays as `already_committed`, remaining target binds the frozen revision, not the newer one |
| `rejected` vs `outcome_unknown` | PASS — separate retry and reconcile lists; shared revision no longer editable |
| same command identity across every target of one attempt | PASS |
| negative: release from needs_review, draft, cancelled, under a hold, with unsaved work, wider identity, lapsed authorizing role | PASS — denied before any commit |
| scheduler past the cutoff vs an explicit send now | PASS — `past_cutoff` for the scheduler; the class teacher may still send explicitly |
| group photo with an unknown visible child at release time | PASS — target rejected with `unknown_visible_child` |
| post-release safety a year later | PASS — no expiry window; Receipt and source revision preserved |
| negative: safety result inspected for recall/unsend/unread/delivered/notification/erase | PASS — none present |
| negative: open-ended reason text, unknown reason key, extra input field | PASS — `needs_input` |
| post-release safety without any T-007 policy | PASS — redaction still available; only release/reschedule carry the policy gate |
| negative: any registered T-006 capability the freeze never reserved | PASS — inverse census added alongside the freeze-side completeness check |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 7/7 files |
| governance lint + `ctl-context verify --strict` | PASS — after `ctl-context touch` for the rotated workflow contract doc |

## 2026-08-02 — Implementation Quality Pass and G3-E Readiness Review

| Command / check | Result |
| --- | --- |
| cross-module ref consistency audit (publish target, publication) | FAIL then PASS — two issuers disagreed; unified and re-verified |
| `pnpm test:unit` | PASS — 50 files / 504 tests |
| `pnpm typecheck` | PASS — no diagnostics |
| `pnpm verify:surface-conformance` | PASS — `1.13.0` / `sha256:1919a289…`, cases=16 slices=50/50, 105 contract tests |
| additive-rotation census | PASS — shared core and every pre-existing slice hash byte-identical |
| `pnpm verify:g3-0-freeze` / `verify:g2-exit-contract` / `verify:test-routing` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — files=85 unit=50 |
| new: runtime payload of every registered T-006 capability validated against its `resultSchemaRef` | PASS — 24 capabilities, Ajv strict |
| new: producer census over registered T-006 capabilities | PASS — a capability without a runtime producer fails the suite |
| new: runtime `*_CAPABILITY` constants bound to registry key/version, both directions | PASS — 20 constants |
| defect found by the new suite: `focusCard` conditional not strict-compilable | FIXED — both branches now declare the properties they constrain |
| defect: publish target ref issued sealed on the draft card and opaque in eligibility/release | FIXED — single `issuePublishTargetRef` |
| defect: publication ref issued opaque but resolved sealed, so it could never be passed back | FIXED — single `issuePublicationRef` |
| defect: publish-queue `counts` accumulated from the page, not the queue | FIXED — owner supplies the queue-wide census; test asserts page ≠ census |
| defect: scheduler refused to attempt a released+partial process the release lane accepts | FIXED — `has_uncommitted_targets` |
| defect: zero-target release produced a contract-invalid empty result | FIXED — `no_eligible_target` guard |
| defect: `organize_care_capture_batch` result had no runtime producer | FIXED — `projectOrganizeResult` |
| seam: `admitToPendingRelease` still took a boolean instead of the resolver | FIXED — consumes `ScheduleResolutionV1`, returns the frozen window |
| G3-E readiness review | `G3_E_NOT_READY` — 7 blockers recorded in `07-g3-e-implementation-readiness-review.md` |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS — 8/8 files |
| governance lint + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B1 (DB SSOT Delta and Migration)

| Command / check | Result |
| --- | --- |
| `pnpm exec prisma validate` | PASS — ten additive models, five extend-in-place deltas |
| `prisma migrate diff` → hand-edited migration → `prisma migrate deploy` | PASS — applied on disposable PostgreSQL |
| migration ambiguity gate, falsified on a scratch database | PASS — one legacy `hidden` media row aborts the whole migration with `g3 media lifecycle migration gate: 1 …`; scratch databases dropped afterwards |
| `pnpm db:context` | PASS — 60 tables, both legacy enums absent from the generated SSOT |
| `pnpm typecheck` | FAIL then PASS — the domain `NurtureGrantDataClass` union lacked `child_growth_record`; extended and re-run |
| `pnpm test:db` | PASS — 14 files / 98 tests |
| new: live `pg_enum` labels for the two retired/replaced identities | PASS — exact frozen labels, legacy types gone rather than kept beside them |
| new: T-005 data-class labels and order after the additive extension | PASS — byte-identical prefix |
| new: family-scope focus goal stores zero child scope rows | PASS — no row a reader could mistake for a child binding |
| new: batch trigger replay, capture sequence, single edit hold, one release per target, one revision number, attribution revision | PASS — all refused by unique constraints, asserted on `P2002` column lists |
| found by the new suite: `ck_nurture_receipt_route_lifecycle` also governs `publication_release` | RECORDED — a delivered publication Receipt must carry grant/enrollment/data class/target scope/`delivered_at`; both the positive and the negative are pinned for B2 |
| `pnpm test:unit` | PASS — 50 files / 504 tests |
| `pnpm verify:test-routing` | PASS — files=86 unit=50 production-db=14 |
| `pnpm verify:g3-0-freeze` | PASS — `schema_delta=landed legacy_enums=retired migration_gate=fail_closed` |
| `pnpm verify:surface-conformance` / `verify:g2-exit-contract` / `verify:formal-ingress-contract` / `verify:persistence-boundaries` / `verify:port-topology` | PASS — artifact unchanged at `1.13.0` / `sha256:1919a289…` |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-child-care-boards --strict --check-anchors` | PASS |
| governance lint + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B2-1 (G3-A Owner Repositories)

| Command / check | Result |
| --- | --- |
| `pnpm typecheck` | PASS — five ports implemented against the frozen interfaces |
| `pnpm test:db` | PASS — 15 files / 116 tests |
| guardian scope binds one family and only that family's enrollments | PASS |
| negative: outsider, caregiver, and a guardian role outside its own validity window | PASS — `authorized: false`, empty scope |
| child focus only from an explicit `NurtureFocusGoalChildScope` row | PASS — a goal whose payload names a child stays family focus |
| grant drift head moves on revoke while the source head does not | PASS — authorization alone invalidates an open page |
| redaction head moves when a released fact is withdrawn | PASS |
| enrollment activity drops a release once its visibility is not `visible` | PASS |
| negative: Enrollment of another family | PASS — `authorized: false` |
| caregiver lane refuses an institution-scoped assignment and a sibling class | PASS |
| owner attention priority mapped, not passed through | PASS — `time_sensitive` → `urgent` |
| absent institution policy reads as unresolved | PASS — never a default window |
| focus goal write lands on the owner row; stale expected version refused | PASS — `updateMany` matches zero rows, first write preserved |
| negative: guardian of another family in the same workspace | PASS — `guardian_authority_current: false` |
| daily care lands in the owner's per-kind column; unknown kind refused | PASS — no empty log row written |
| found: `ck_nurture_grant_scope` requires `revoked_at` + `revoked_by_participant_id` | RECORDED — pinned by the revoke test |
| `pnpm test:unit` / `verify:test-routing` | PASS — 504 tests, files=87 production-db=15 |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisites B2-2 and B3 (Publish Lane and Capture Port)

| Command / check | Result |
| --- | --- |
| `pnpm typecheck` | PASS — four publish-lane ports plus the new capture port |
| `pnpm test:db` | PASS — 16 files / 130 tests |
| queue census is queue-wide while the page is not | PASS — `take: 1` over a four-card queue |
| queue title comes from the saved revision; no key material shows no title | PASS — never ciphertext in a public result |
| released targets counted per target | PASS — 1 of 2, never a bare "published" |
| scheduled time omitted until the owner resolved one | PASS |
| negative: sibling class, institution-scoped assignment | PASS — `authorized: false` |
| a colleague's live hold does not remove the reader's own authority | PASS — class-shared responsibility |
| an expired hold reads as no hold and is not renewed by being read | PASS |
| `known_source_refs` only from the owner's recorded payload; malformed reads as empty | PASS — never a partial set |
| exact command replay answered from the revision that command wrote | PASS |
| process key stops resolving once the assignment is revoked | PASS |
| capture read reports intake in sequence order with the owner's stability fact | PASS — unstable capture reported, not filtered |
| capture read never opens or advances a batch | PASS — state, watermark and `cutAt` unchanged after read |
| negative: caregiver of another class, revoked assignment | PASS — `null` |
| `pnpm test:unit` / `verify:test-routing` | PASS — 504 tests, files=88 production-db=16 |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B2-3 (Media and Content Safety Ports)

| Command / check | Result |
| --- | --- |
| `pnpm exec prisma validate` + `migrate deploy` | PASS — additive nullable marker columns on both source tables |
| `pnpm db:context` | PASS — regenerated SSOT |
| `pnpm verify:g3-0-freeze` | PASS — now also `safety_markers=nullable`, asserted on both tables |
| defect: unrecognised marker silently dropped, leaving the route ordinary | FIXED — raises to `review_required` with a bounded `unrecognised_marker` risk code |
| `pnpm test:unit` | PASS — 50 files / 506 tests, two new cases for the marker fix |
| `pnpm test:db` | PASS — 17 files / 143 tests |
| recorded markers returned with the institution's exact policy head | PASS |
| derived-but-empty routes ordinary; never-derived fails the whole derivation closed | PASS — the two are different facts |
| negative: source outside this CareGroup, unknown source id | PASS — `null`, never a partial assessment |
| negative: institution with no safety policy | PASS — no route rather than a default bar |
| unrecognised marker reaches the review tier through the real owner port | PASS |
| attribution offers only children of the exact CareGroup | PASS — sibling class excluded |
| owner attribution source mapped, not passed through | PASS — `face_reference` → `automatic_face_match` |
| attribution history reported in revision order including superseded rows | PASS |
| media lifecycle counts every unreleased draft still citing the asset | PASS — released cards excluded |
| committed releases reported so the global discard window can close | PASS |
| negative: unknown process key, malformed composition payload | PASS — `null` / empty, never a partial set |
| `verify:test-routing` | PASS — files=89 production-db=17 |
| `verify:surface-conformance` / `g2-exit-contract` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B2-4 (Atomic Per-target Release and Post-release Safety)

| Command / check | Result |
| --- | --- |
| `pnpm typecheck` | PASS — the last two T-006 ports implemented |
| `pnpm test:db` | PASS — 18 files / 157 tests |
| release, Receipt and CommandExecution land together | PASS — one transaction, all three present |
| atomicity falsified: audit row blocked mid-transaction | PASS — release and Receipt counts return to 0, process still `pending_release`, revision unfrozen |
| exact replay returns the original refs and writes nothing | PASS — all three counts unchanged |
| a different command on an already-released target | PASS — `already_released`, still one release |
| one attempt across two targets | PASS — two committed identities, one shared parent identity |
| first commit freezes the shared revision and moves the process to released | PASS |
| negative: unknown revision, caregiver of another class | PASS — refused before any write |
| Receipt satisfies the T-005 lifecycle CHECK for the new source type | PASS — delivered with full routing identity |
| found: `ck_nurture_command_execution_handoff_v2`/`_n1` require canonical-ref arrays and an empty handoff snapshot list | RECORDED — release carries no Workflow handoff |
| defect: `mediaCompositionPayload` read two incompatible ways across lanes | FIXED — one `readMediaComposition` in the shared support module |
| per-target eligibility read from the current Grant | PASS — one revoked Grant blocks only its own target |
| partially recorded schedule is not a resolved window | PASS — `null` |
| lapsed authorizing role | PASS |
| already-committed target surfaced so a retry reconciles | PASS — plus the frozen revision the remaining target binds to |
| composed media revision reported against the asset's current one | PASS — drift visible, never silently republished |
| post-release safety lists every publication whatever its visibility | PASS — redacted stays addressable with its Receipt |
| `pnpm test:unit` / `verify:test-routing` | PASS — 506 tests, files=90 production-db=18 |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — Owner Implementation Quality Pass and Cross-boundary Checks

| Command / check | Result |
| --- | --- |
| review of B1–B2-4 owner code | 14 findings: 6 wrong-behaviour, 4 fabricated/dead facts, 4 structural |
| a rejected attribution blocked its media forever | FIXED — dropped from `visible_children`; proven through the real rule |
| `data_class` collapsed every other class into `daily_care_log` | FIXED — non-publishable classes excluded from queue and census |
| a media capture entered safety assessment as teacher text | FIXED — explicit total capture-kind map |
| two lanes emitted rows out of their advertised order | FIXED — `BoardSortKeyV1.rank`, owner orders by the declared terms, lexicographic strictly-after |
| global discard counted every release the class ever made | FIXED — only releases whose frozen composition carries the asset |
| queue offered a draft save on released and cancelled cards | FIXED — gated on process state |
| dead `exposure_allows_child_ids` computation, page-shaped source head, unused helpers | FIXED |
| four copies of the caregiver reach predicate | FIXED — one shared `resolveCaregiverReach` |
| scope censuses loaded every row they counted | FIXED — database `aggregate` |
| `has_unsaved_revision` answered a different question | FIXED — constant `false` with the reason recorded |
| unresolved schedule classified as a missing target | FIXED — `schedule: null` plus a `schedule_unavailable` refusal |
| new: emitted row order vs. the binding's advertised order, comparator parsed from the order string | PASS — 3 lanes, plus gap-free continuation |
| new: real owner `ReleaseFactsV1` fed to `derivePublishEligibility` | PASS — 5 cases across rejected, group-photo, unconfirmed, drift and revoked-Grant |
| found by the new boundary check: repositories re-declared `before` inline and dropped the `rank` term | FIXED — all three use `BoardSortKeyV1` |
| `pnpm typecheck` / `pnpm test:unit` | PASS — 50 files / 506 tests |
| `pnpm test:db` | PASS — 19 files / 170 tests |
| `verify:test-routing` | PASS — files=91 production-db=19 |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B4-1 (Query Lane on the Formal Ingress)

| Command / check | Result |
| --- | --- |
| defect: ingress pinned `capability_version` per lane, not per capability | FIXED — 35-entry key→version admission map |
| defect: query dispatch fell through to item detail for any unmatched key | FIXED — every key matches explicitly |
| 6 T-006 query keys routed end to end through the real owner ports | PASS |
| contract identity and module order read from the artifact pin and surface registry | PASS — no literal copy in the ingress |
| `pnpm verify:formal-ingress-contract` | PASS — `harness-queries=9 registered=35 unrouted=18 versions=per-capability` |
| census falsified: a routed query key removed | PASS — guard reports it as unexpectedly unrouted |
| census falsified: a routed key admitted at another version | PASS — guard reports the registry mismatch |
| new e2e: every routed query capability admitted at its own exact version | PASS — 9 keys |
| new e2e: a routed key at another capability's version | PASS — `invalid_harness_request` both directions |
| new e2e: a write key on the query lane, an unregistered key, a write key on prepare | PASS — `unknown_capability`, engine never called |
| `pnpm test:scenario-service` | PASS — 8 files / 52 tests |
| `pnpm typecheck` / `test:unit` / `test:db` | PASS — 506 and 170 tests |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `persistence-boundaries` / `port-topology` / `test-routing` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — G3-E Prerequisite B4-2 (Board Write Keys on the Formal Ingress)

| Command / check | Result |
| --- | --- |
| design question: does `direct_commit` skip prepare? | RESOLVED — the frozen `ExecuteActionInvocationV1` requires `confirmationRef` and carries no typed input, so every write key goes prepare → execute |
| `update_guardian_current_focus` and `record_caregiver_daily_care` routed | PASS |
| found: `PrismaBoardMutationTransaction` was never held by the command transaction | FIXED — wired as `boardMutations`; the spec would otherwise refuse with `board_mutation_port_unavailable` |
| guard assertion was too tight: T-005 action keys pinned by equality | FIXED — containment, so the action lane can grow |
| OpenAPI action and query enums bound to the routed maps | PASS — a published enum that drifted would misinform callers |
| new DB e2e: focus update commits on the owner row through the real ingress | PASS — `aggregateVersion` +1, `businessOutcome=applied` audit row |
| new DB e2e: daily care commits into the owner's per-kind column | PASS |
| new DB e2e: same target ref offered to a participant with no caregiver role | PASS — denied at prepare |
| new DB e2e: guardian board and focus module over the query route | PASS — contract from the artifact pin, no raw id in the response |
| new DB e2e: caregiver board to a guardian, guardian board to a caregiver | PASS — denied |
| `pnpm verify:formal-ingress-contract` | PASS — `harness-actions=10 harness-queries=9 unrouted=16` |
| `pnpm test:scenario-service` / `test:scenario-service:db` | PASS — 52 and 26 tests |
| `pnpm typecheck` / `test:unit` / `test:db` | PASS — 506 and 170 tests |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `persistence-boundaries` / `port-topology` / `test-routing` | PASS — artifact unchanged at `1.13.0` |
| governance lint + `lint-docs --strict --check-anchors` + `ctl-context verify --strict` | PASS |

## 2026-08-02 — Independent Review Findings (id leakage, dropped constraint)

| Command / check | Result |
| --- | --- |
| three read-only review agents over B1–B4 | 3 severe findings the author and the boundary check both missed |
| A2: `issueBoardTargetRef` published the raw id beside the opaque ref hiding it | FIXED — plaintext pair deleted, all callers on the sealed issuer |
| A2 side effect: a ref stops resolving once the actor loses eligibility | PASS — a self-describing ref could not express this |
| found: a unit test pinned the leaking format as the contract | FIXED — asserts the sealed shape and that no id or kind appears |
| A3: cursor payload was base64url, decodable with no key | FIXED — AES-256-GCM sealed, key derived from integrity key + actor scope |
| A3 regression source: the quality pass added the child's name to the sort key | RECORDED |
| new: public refs and cursors contain no part of the identifier they stand for | PASS — asserted over goal, child process and publish process |
| A1: `DROP COLUMN "status"` silently dropped `ck_nurture_media_attribution_confirmation` | FIXED — restored over `state` with `NOT VALID` + `VALIDATE` |
| live census: 14 declared CHECKs, 3 absent | RESOLVED — two superseded by design, one a regression |
| 71 confirmed attributions in the dev database violated the restored rule | FIXED — tests corrected, database recreated from the full chain |
| new: every declared CHECK must be alive unless explicitly superseded | PASS — falsified by dropping the constraint by hand |
| new: a superseded entry that is actually alive also fails | PASS — a stale exemption hides the next regression |
| new: confirmation completeness and confidence bounds enforced by the database | PASS — 5 refusal cases |
| `pnpm typecheck` / `test:unit` / `test:db` / `test:scenario-service:db` | PASS — 508, 173 and 26 tests |
| `verify:test-routing` | PASS — files=92 production-db=20 |
| `verify:surface-conformance` / `g2-exit-contract` / `g3-0-freeze` / `formal-ingress-contract` / `persistence-boundaries` / `port-topology` | PASS — artifact unchanged at `1.13.0` |

## 2026-08-02 — Independent Review Findings (paging, per-fact authority, mid-fan-out consent)

| Command / check | Result |
| --- | --- |
| A5 reproduced before fixing | 25 rows seeded, 20 delivered, `has_more: false` |
| A5: strictly-after pushed into the query | FIXED — all three paging lanes now share one shape |
| new: page the guardian activity lane to closure against a known total | PASS — 25/25, no repeats |
| A4: per-row guardian authority derived from that row's own Grant | FIXED — was one object per request with 4/5 fields hardcoded |
| new: a revoked Grant withdraws its own facts while another Grant is live | PASS — `grant_visible: false` on that row alone |
| new: a Grant that never admitted the fact's data class | PASS — `purpose_allowed: false` |
| clarified: family charter and focus never travelled through a Grant | RECORDED — gating them on institution grants hid a family's own goals |
| A7: Grant, Enrollment, data class and purpose re-checked inside the release transaction | FIXED |
| new: Grant revoked mid fan-out | PASS — `grant_not_allowed`, no publication and no delivered Receipt |
| new: Enrollment ended mid fan-out | PASS — `enrollment_inactive` |
| A8: the guardian lane still had the `data_class` fallback | FIXED — explicit total map plus query-level exclusion |
| doc correction: the earlier note claimed the fallback fix was a class, it was one lane | AMENDED in place |
| `pnpm typecheck` / `test:unit` / `test:db` / `test:scenario-service:db` | PASS — 508, 178 and 26 tests |
| `verify:test-routing` and the six contract/boundary gates | PASS — artifact unchanged at `1.13.0` |

## 2026-08-02 — C/D Verification and Fact-table CHECK Constraints

| Command / check | Result |
| --- | --- |
| 22 C/D claims verified one by one | 18 confirmed, 2 refuted, 2 partly — agent output was not taken at face value |
| refuted: nullable-column unique "no-op" for the batch trigger | correct by design; two agents independently agreed |
| partly: `caregiverRowAuthority` tautological | 2 of 8 call sites, both already filtered by the query — redundant, not wrong |
| partly: `snapshot_ref` unused | dead field yes; cursor state IS checked via drift head and snapshot version |
| C9: release executions were unreadable through read-result | FIXED — `businessActorRef` is the participant, as everywhere else |
| A6: prepare offered a target execute then refused | FIXED — both sides resolve the same care-group-scoped role |
| A12: `current_focus` emitted cycle-major against `priority_asc` | FIXED — total sort in the declared order |
| D3: unmatched query keys fell through to the publish queue | FIXED — explicit refusal |
| D5: a process with nothing saved had no satisfiable expected revision | FIXED — 0 is valid; the test that pinned the dead end is replaced |
| D8: draft count workspace-wide, release count care-group-scoped | FIXED — one scope |
| A9 remainder: the queue advertised an unroutable action | FIXED — no action grant until B8 |
| D7: ten new fact tables had zero CHECK constraints | FIXED — `20260802150000_g3_fact_check_constraints` |
| the new constraints caught tests creating impossible states | `released` before a revision exists, `sha256:` command hashes, holds born expired, half-recorded windows |
| released is now reachable only by the update that freezes the revision | PASS — tests reshaped to the real `commitTargetRelease` flow |
| C2/C4/C5/C6/C8/C10 small fixes | FIXED — charter label, discard comment, invented process state, `cutAt` as fallback, `?? 99`, raw id in `commandScope` |
| `pnpm typecheck` / `test:unit` / `test:db` / `test:scenario-service:db` | PASS — 509, 178 and 26 tests |
| `verify:test-routing` and the six contract/boundary gates | PASS — artifact unchanged at `1.13.0` |

## 2026-08-02 — Guards That Did Not Guard (B category)

| Command / check | Result |
| --- | --- |
| B3: the migration fail-closed gate was pinned by three strings inside its own exception message | FIXED — parses each gate block, requires the conditional to read the census variable |
| B3 falsified with the same edit that defeated it | PASS — `IF false THEN` now fails `gate 0 aborts on a non-zero ambiguous` |
| B2: "envelope never persisted" was a three-name blocklist | FIXED — the exact 60-table persisted census is pinned |
| B2 falsified by adding `NurtureChildBoardSnapshot` | PASS |
| B1: module-result binding and cursor identity had zero assertions | FIXED — both pinned against the frozen schema and the runtime type |
| B1 falsified by deleting `snapshot`/`sourceHeads` and by dropping `page_size` | PASS — both fail |
| B6: the routing census skipped lines it could not parse | FIXED — an unparseable entry is now an error |
| B6 falsified by inserting a spread into the admission map | PASS |
| B4: a guard certified a constraint the database no longer had | FIXED — labelled as a baseline-declaration pin; live existence is the DB test's job |
| `pnpm typecheck` / `test:unit` / `test:db` | PASS — 509 and 178 tests |
| all seven contract/boundary gates | PASS — artifact unchanged at `1.13.0` |

## 2026-08-02 — B7/B8 and Dead-weight Cleanup

| Command / check | Result |
| --- | --- |
| B7: the frozen input digest was pinned only as prose | FIXED — cross-pinned against the guard that proves it with artifact evidence |
| B8: the adoption set was pinned by a floor | FIXED — exact count; a 36th capability no longer passes |
| the freeze document contradicted its own guard | AMENDED — posture and table count marked superseded, freeze content untouched |
| C13: an empty-list loop read as a check | FIXED — documented as a declaration |
| C12: `snapshot_ref` carried, validated and returned but never compared | REMOVED — the two terms that are compared stay |
| C11: a composite unique fully implied by a single-column unique | REMOVED — migration `20260802160000` |
| `pnpm typecheck` / `test:unit` / `test:db` / `test:scenario-service:db` | PASS — 509, 178 and 26 tests |
| all eight contract/boundary gates | PASS — artifact unchanged at `1.13.0` |
