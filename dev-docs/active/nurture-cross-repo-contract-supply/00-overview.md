# T-011 Cross-repo contract supply and guardian-decision callback

## Status

- State: in-progress
- Updated: 2026-08-15
- W2 current implementation: My-Chat now emits the pinned
  `my-chat.parent-context-selection@1.0.0` carrier from current canonical
  family-child + child/family scenario bindings. Nurture maps those opaque
  anchors through its current association to one explicit local
  `NurtureParentContextEnrollmentSelection`, then rereads every authority head.
  No Enrollment id crosses repositories and the frozen W2 body contract is
  unchanged. Source migration and disposable-PostgreSQL qualification are
  complete; no shared/staging/prod database was migrated.
- W3 readiness verdict: the six-step carrier cutover and local/staging-static
  qualification are complete; traffic activation still cannot proceed without
  the external canary and release decision. The original blocker/sequence is
  recorded in
  `artifacts/w3-parent-communication-implementation-readiness-review-2026-08-15.md`.
  That review is historical: the old host-selected Enrollment port has now
  been removed rather than implemented.
- Supply extension (2026-08-14): the owner directed the main effort to the
  teacher-side contract gaps. The batch schedule W6-W11 is frozen in
  `artifacts/w6-teacher-supply-schedule.md` and summarized in `01-plan.md`.
  W6 progress: the scope freeze
  (`artifacts/w6-class-stream-presenter-scope-freeze.md`), the W6-1 contract
  artifact (digest `sha256:00a84945…`, 12 fixtures / 12 invalid probes) and
  the W6-2 default-off runtime (four mounted routes, censuses expanded,
  env key registered, e2e green, built-process smoke green) are complete
  and committed. W6-3 real owner ports are complete and disposable-DB
  qualified (domain service + Prisma binding, 9/9 unit + 4/4 integration,
  full DB lane 53/472; observations/focus sections stay honestly
  `unavailable` pending W9/W10 sources). W6-4/W6-5 are complete — governance
  sync, the digest-pin handoff artifact and the My-Chat dormant strict
  consumer with snapshot refresh all landed; W6 is closed end to end.
  W7 (`nurture.teacher-organization-owner@1.0.0`) is also closed end to
  end: scope freeze, W7-1 contract artifact (digest `sha256:b0d4602f…`,
  17 fixtures / 14 invalid probes / 18-scenario census), W7-2 default-off
  runtime (six mounted routes), W7-3 real owner ports on the generic
  command ledger (unit 9, W7 DB lane 6, full DB battery 54/479), W7-4
  registration and the W7-5 digest-pin handoff with the My-Chat dormant
  strict consumer (`33686a8`; matrix rows
  T-F02/T-F05/T-F08/T-F09/T-F10/T-F11/T-F15 contract-ready, axis
  51/14/23/17). W8 (`nurture.teacher-communication-owner@1.0.0`)
  is also closed end to end: scope freeze, W8-1 contract artifact (digest
  `sha256:e4a831cd…`, 18 fixtures / 14 invalid probes / 20-scenario
  census, first-run strict compile), W8-2 default-off runtime (six mounted
  routes, controller-routes 42), W8-3 real owner ports on the command
  ledger (unit 7, W8 DB lane 5, full battery 55/484; new thread-message
  and read-cursor owner writes), W8-4 registration and the W8-5 digest-pin
  handoff with the My-Chat dormant strict consumer (`967342e`; matrix rows
  T-S04/T-C02/T-C03/T-C04/T-C05/T-C07/T-C09 contract-ready, axis
  58/9/21/17). W9 (`nurture.teacher-media-association-owner@1.0.0`,
  association-only) is also closed end to end: scope freeze, W9-1 contract
  artifact (digest `sha256:528e50c8…`, 15 fixtures / 12 probes /
  18-scenario census, first-run strict compile), W9-2 default-off runtime
  (four mounted routes, controller-routes 46), W9-3 real owner ports over
  the frozen G3-C1 machinery (unit 6, W9 DB lane 5, full battery green),
  W9-4 registration and the W9-5 digest-pin handoff with the My-Chat
  dormant strict consumer (`e092613`; T-F14/T-H03 contract-ready, T-F16
  partial, axis 60/7/21/17). W10
  (`nurture.teacher-assistant-query-owner@1.0.0`, engine-ready facts only)
  is closed on the Nurture side: scope freeze, W10-1 contract artifact
  (digest `sha256:d4010661…`, 11 fixtures / 12 probes / 17-scenario
  census, first-run strict compile), W10-2 default-off runtime (three
  mounted routes, controller-routes 49), W10-3 real owner ports (the
  weekly draft rides a new `NurtureTeacherAssistantTransaction` on the
  command transaction, domain-idempotent per (class, week); unit 9, W10 DB
  lane 5, full battery 57 green), W10-4 registration and the W10-5
  digest-pin artifact; My-Chat adopted the dormant strict consumer at
  `3693e8f` (T-H02/T-H04 contract-ready, axis recount 62/4/22/17) and the
  deferred cross-repo pin reseal landed (`3a8e49e`/`a9c8125`), returning
  both CIs to green. W11 (`nurture.parent-communication-owner@1.1.0`,
  additive extension, base pin `sha256:b1dce3a7…` proven unmoved by the
  validator) is closed on the Nurture side: scope freeze, W11-1 contract
  artifact (digest `sha256:d705146e…`, 11 fixtures / 12 probes /
  16-scenario census, first-run strict compile), W11-2 default-off runtime
  (three v1.1 routes, controller-routes 52), W11-3 real owner ports over
  the frozen v1 resolver/reads and the G4-C redaction spec (unit 7, W11 DB
  lane 5, full battery 58/499), W11-4 registration and the W11-5
  digest-pin artifact; My-Chat adopted the dormant strict consumer at
  `df5af9d` (P-H05/P-H06 contract-ready, axis recount 64/2/22/17) and the
  cross-repo pins resealed to green CI on both heads (`9e41764` /
  `df5af9d`). W11 is closed end to end and the W6-W11 schedule is
  COMPLETE. The end-of-schedule deep review (three adversarial lanes) ran
  and all ten confirmed findings are repaired with regression coverage —
  see `03-implementation-notes.md` / `04-verification.md` (2026-08-15
  deep-review entries). All batches remain default-off contract supply
  with no activation, durable apply, deployment or traffic.
- Next step: finish the current-main reseal before any remote gray work. The
  first-stage exact My-Chat pin and three governed revision literals now target
  `76651e4d29c84c31437a57862ff5eb42054780df`; pin, G2 and C30-I3 upstream
  checks pass. Commit that stage, mint the owner-adoption lock from the
  committed Nurture revision, run the final gates and then push both `main`
  branches. Afterward, continue the owner-selected restricted-staging
  deployment/migration and W6 teacher
  class-stream progression. Repository preparation is complete: Nurture
  secret-file startup, provider refusal logs, G7 aggregation contracts/tool,
  My-Chat Compose overlay/BWS manifest and the human-run migration/rehearsal/
  gate-off runbook are in place. The local class → child → day-detail path is
  now closed through real My-Chat strict-client/Nurture HTTP conformance and
  canonical PostgreSQL owner tests. W6 still defaults false until the release
  operator supplies the reviewed staging organization allowlist and executes
  the runbook; no remote operation has run. Keep every provider gate false.
  W2 parent context now has its production Prisma owner
  composition and canonical PostgreSQL qualification, without changing its
  frozen contract or default-false gate. W4.1 director Prisma composition is
  closed at step 6 of 6: the DB-free presenter service and bounded Prisma
  authority/read repository now implement the frozen source matrix, including
  current exact-head rereads, honest partial sections, signed drilldown refs,
  protected-material denial and reuse of the configured-load signal owner.
  One production binding now composes those reads plus the existing support-
  signal policy owner through the shutdown-managed shared Prisma client; the
  stale director-only startup refusal is gone and the gate still defaults
  false. Cache/ref lifetime, per-open authority, context replacement,
  protected denial, pagination binding and D-O13 are now adversarially covered
  against real generated owner responses and the published validator. Three
  fresh disposable PostgreSQL targets replayed all 44 migrations and passed
  the focused owner, full production-DB and scenario-service DB lanes with
  zero schema drift; all exact targets were removed and absence proven. The
  final review repaired policy-timezone day boundaries, request-snapshot
  cutoffs, legacy-axis admission, inactive-Enrollment authorization counts and
  one stale N8 binding-authority fixture. The W4 digest and default-false gate
  are unchanged. My-Chat public API/Mobile composition has since closed under
  T-039; deployed default-off qualification, native/accessibility evidence,
  activation and traffic remain separate next work. W3/W11 carrier
  cutover is now closed at step 6 of 6: the
  shared mapper, seven carrier-protected routes, association-first authority,
  exact My-Chat current-context emission, default-off production/family-ramp
  wiring, joint conformance, disposable-DB behavior and local staging gate-off
  rehearsal are complete. The W2
  implementation and C30 lock are already landed; no
  task status should describe them as uncommitted.
- Prior next step (superseded but preserved): W3.1 real local owner qualification is complete without
  activation. The default-off binding now resolves one host-selected
  Enrollment as routing input only, rereads exact current Nurture authority,
  serves minimized summary and bounded teacher detail from canonical
  family-care rows, and closes encrypted prepare plus atomic
  Message/Item/Event/Receipt/Attention/CommandExecution confirm with exact
  replay. Real PostgreSQL revocation rollback and cross-actor replay denial are
  qualified. The standalone `nurture.parent-communication-owner@1.0.0`
  contract is
  frozen at digest
  `sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f`.
  It supplies minimized summary, explicit-open bounded detail, a frozen
  protected-media access contract and teacher-only text prepare/confirm with
  same-command reconciliation. Four private routes are mounted default-off;
  every operation re-resolves current owner authority. P0 media access always
  returns `content_unavailable` until the private stream ingress and My-Chat
  proxy exist; `class_group` can be read as explicitly unavailable and cannot
  send. The final 2026-08-14 audit verified the same narrow write union in
  My-Chat Mobile DTOs and Composer guards, promoted the contract validator into
  the maintained formal-ingress gate, and resealed the consumer at My-Chat
  `84914f2`. My-Chat T-039 has the exact-pin dormant consumer. Next, keep both flags
  false. W3.2 deployment/current-context carrier, secret delivery,
  cross-service/native/accessibility qualification and any gate change require
  separate authorization; protected media remains unavailable. The other
  completed W4 branch publishes the read-only director contract described
  below. W1 is FROZEN
  (2026-08-13):
  `artifacts/w1-guardian-decision-callback-design-draft.md` is the frozen
  joint design record for the additive `family_growth_transport@1.1.0`
  push callback, closed through a four-round owner-delegated adversarial
  review gate. W5 has closed the settlement-surface hardening prerequisite;
  W1 runtime implementation remains a separate default-off batch. W2 is
  published and adoption-ready as the standalone, default-off
  `nurture.parent-context-presenter@1.0.0` artifact at digest
  `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196`,
  with five closed schema pairs, a discriminated notice-exchange matrix, 16
  owner fixtures, eight executed-invalid mutations, a hard-pinned validator,
  runtime response-schema enforcement and a 12-case real-route e2e suite. All
  six first-round, four second-round and final publication review findings are
  repaired; `artifacts/w2-parent-context-presenter-v1-digest-pin.md` is the
  accepted exact-pin handoff for My-Chat T-039. My-Chat completed the W2 P0
  exact-pin consumer adoption on 2026-08-13 across its default-off private
  source, public API/client and production Mobile controller; joint negative
  conformance passes with no activation. W3 now has the P0 contract/runtime
  boundary and exact consumer adoption described above. W4 is published as
  `nurture.director-presenter@1.0.0` at digest
  `sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9`;
  its three default-off read operations cover D-O01 through D-O14, and the
  current Institution Mobile action-free rule makes D-O13 explicitly
  `web_workbench_required` with no action/confirmation/command refs. My-Chat
  owns consumer adoption and has exact-pinned the strict private source without
  composing a public API or Mobile controller. The W4 quality closure now
  binds every material page to its exact request cursor, orders resolution /
  generation / cache / protected-access lifetimes, rejects hidden payloads in
  empty or unavailable sections, and closes malformed ratio/photo cases. The
  closing quality pass removed the obsolete W2 scope
  draft, made the accepted digest pin the only active handoff, repaired
  generated-client typecheck drift and passed the repository unit/typecheck,
  direct frontend lint and exact-revision cross-repo pin gates. W1's design
  precondition for T-008 G5-A is satisfied.
  W5 findings N2, N5, N6 and N8 plus their five review
  repairs are implemented; package typechecks, focused mocked suites, unit tests
  and routing verification pass. N1 and N3 are now implemented: release commit
  binds the prepared tuple to the loaded target and revalidates/SHARE-locks the
  exact association, anchor, authorization-provenance, Guardian-role and
  Participant heads in one statement, and the provider outbox has a
  preview-only transactional composite-FK migration, parsed static guard and
  three-phase qualification vehicle. An approved loopback disposable run on
  `t011_n3_disposable_20260813b` passed phase A replay from empty, phase B1
  populated upgrade validation, and phase B2 FK-caused pass-by-abort; final
  emptiness was proven and the disposable containers were destroyed. N7, N9,
  N10 and N11 are implemented and W5 is closed: both invariant guards are in
  CI, the ingress census resolves Nest decorator imports across every service
  TypeScript file and pins all 14 routes plus the exact six-controller module
  inventory, private controller errors receive no-store headers from a scoped
  exception filter, canonical JSON has one strict RFC 8785 core, and corrupt
  cleanup receipts parse fail-closed.

## Goal

Own the cross-repo contract gaps that currently block My-Chat T-039 Phase 4/6
and T-008 G5-A but previously belonged to no task: jointly design the
guardian-decision callback missing from the frozen transport `1.0.0` (the
teacher queue stops at `pending` because the provider never learns the
guardian decision), and register the Nurture-owned presenter/owner contracts
in the agreed supply order, each as a versioned owner DTO with adapters and
conformance fixtures, all default-off.

## Workstreams

- W1 guardian-decision callback joint design: one joint design record with
  My-Chat; a versioned transport contract delta (the frozen
  `family_growth_transport@1.0.0` addendum is not mutated); provider- and
  consumer-side obligations; failure, replay and reconciliation semantics;
  default-off.
- W2 parent-context presenter v1: a versioned owner DTO/adapter plus
  conformance fixtures that let My-Chat T-039 start IR-C01 adoption against
  an exact pin and unblock the parent institution tab.
- W3 IR-C01 parent-communication gates: owner contracts for the
  parent-communication surfaces (P-C01..P-C07 equivalents) with
  negative-path fixtures.
- W4 director presenter: the read-only director lens owner contract
  (D-O01..D-O14 equivalents), exact-pin consumer and conformance fixtures;
  Institution Mobile remains action-free and operations stay in Web.
- W5 audit-defect hardening: fix the 2026-08-13 Codex audit findings in
  the provider delivery/receipt path and the family-sharing validators
  (`artifacts/w5-audit-defect-ledger.md`). These defects originate in
  F-004/F-005 code (mapped through R-003/R-004); they execute here
  because the W1 callback implementation lands on the same settlement
  surface, and channel hardening precedes the second delivery leg.
- W6-W11 teacher-side supply extension (2026-08-14): close the remaining
  teacher/parent contract-blocked rows in My-Chat's T-039 matrix through
  six ordered default-off batches — W6 class-stream read core, W7
  organization loop, W8 teacher communication owner, W9 media association,
  W10 assistant queries, W11 parent-communication additive extensions.
  Schedule SSOT: `artifacts/w6-teacher-supply-schedule.md`.

## Non-goals

- No capability activation, durable database apply, deployment or traffic.
- No T-008 G5 execution; Candidate work stays in T-008 under its own
  authorization.
- No T-002 C31+ institution-mode gates.
- No My-Chat-side consumer implementation; adoption is owned by My-Chat
  T-039/T-036.
- No reinterpretation of My-Chat canonical identity or consent facts.

## Dependencies and gates

- Supply order decided 2026-08-11: parent-context presenter, then IR-C01
  parent-communication gates, then the director presenter.
- W1 must conclude before any T-008 G5-A Candidate Freeze.
- Contract changes ship as new versions against the current surface identity
  baseline (`nurture.surface-contract@1.20.0`); no frozen artifact is
  mutated.
- Consumers adopt only via exact version/digest pins; no floating
  references.

## Acceptance criteria

- [x] W1: the joint design record is frozen (2026-08-13) after the
  fourth-round independent adversarial review reported zero unresolved
  REQUIRED items, with a versioned callback contract delta
  (`family_growth_transport@1.1.0`) and a defined resolution path for the
  teacher queue `pending` state (bounded expiry plus reconciliation); no
  runtime activation.
- [x] W2: the published standalone parent-context presenter v1 exact pin,
  strict DTO schemas, safe-code policy, protected-cache semantics and joint
  conformance environment passed adoption-readiness review on 2026-08-13.
  My-Chat T-039 adopted the dormant consumer against the exact pin on
  2026-08-13 and passed joint conformance. The production Prisma owner now
  resolves one exact current guardian/enrollment/grant/thread scope, serves
  canonical shared-care and attendance rows, and confirms notice-read state
  atomically through the generic command ledger. Its real PostgreSQL lane
  covers replay, ambiguity and post-resolution revocation. The five Nurture
  routes remain mounted default-off and require the explicit gate, service
  auth and active consumer-generation boundary; their presence is not
  activation.
- [x] W3.0 P0: parent-communication owner contracts, four default-off private
  routes, response-schema enforcement, negative-path fixtures and exact My-Chat
  consumer adoption are implemented.
- [x] W3.1: real Prisma authority/read ports, encrypted prepare, atomic
  teacher-text confirm, exact replay, revocation rollback and bounded
  latest-generation behavior are qualified. Media streaming, deployment,
  activation, traffic and device evidence remain separate gates.
- [x] W4: `nurture.director-presenter@1.0.0` is registered after W2/W3 with
  exact digest, three default-off service-authenticated read routes, real
  current-authority Prisma ports, conformance fixtures, a strict My-Chat
  private consumer, guarded public API/client and the approved Mobile Pulse
  grid composition. Deployment and device evidence remain later gates.
- [x] W5: every open ledger item is fixed forward-only with its negative
  test; N3's additive migration passes disposable-target qualification;
  N2/N5/N6/N8 land before or with the W1 callback implementation.
- [x] W3 implementation remains default-off; no durable apply, activation,
  deployment or traffic results from this task.
- [x] W6: `nurture.teacher-class-stream-presenter@1.0.0` published with exact
  digest, default-off service-authenticated routes, real Prisma owner ports,
  conformance fixtures, formal-ingress gate registration and a digest-pin
  handoff artifact; My-Chat adopted the dormant strict consumer with the
  sanitized snapshot at `5babf85` (T-039), moving seven matrix rows to
  contract-ready.
- [x] W7: `nurture.teacher-organization-owner@1.0.0` published with the same
  gate set plus prepare/confirm command semantics, actor-scoped idempotency
  and owner-persisted lane state.
- [x] W8: `nurture.teacher-communication-owner@1.0.0` published reusing the
  W3 shape family with the IR-C01..C07 gate list re-run for the teacher
  actor; `class_group` send remains unavailable absent a separate decision.
- [x] W9: media association supply (association-only before the reserved
  media ingress exists).
- [x] W10: teacher assistant queries (missing-record handoff, weekly draft)
  with agent-generated labelling and no direct provider calls.
- [x] W11: `nurture.parent-communication-owner@1.1.0` additive extensions
  for redaction prepare and delivery receipts; the frozen 1.0.0 artifact is
  not mutated.
- [ ] Post-schedule: gray-release readiness tracks are frozen in
  `artifacts/gray-release-readiness-v1.md` (2026-08-15). The activation
  spine waits on explicit authorization; production assembly, the My-Chat
  wiring/ramp/UI track and the remaining contract supply proceed in
  parallel without it.
  - [x] A2 production assembly: the five teacher Prisma bindings, W2
    parent-context binding and W3/W11 communication bindings are injected by
    `main.ts` only when their unchanged
    default-false gates and required secrets are present, sharing one
    shutdown-managed Prisma client. W4 director production composition now
    uses the same lifecycle boundary with its complete authority/read ports;
    all-off startup still constructs no owner.
