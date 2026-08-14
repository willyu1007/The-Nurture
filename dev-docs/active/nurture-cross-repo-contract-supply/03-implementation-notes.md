# Implementation notes

## 2026-08-15 — W11-1 parent-communication extension contract artifact

- Published `contracts/parent-communication-owner/v1-1/`: the extension
  owner-contract JSON (digest `sha256:d705146e…`), 11 fixtures + 12
  executed invalid probes, the
  Ajv-strict validator chained into `verify:formal-ingress-contract`,
  README and the frozen TS constants
  (`src/parent-communication-extension-contract.ts`, base pin included).
- The artifact follows the v1 house style (contract_schema,
  presentation-version envelope, v1 masked/unavailable shapes) and
  declares `base_interface` with
  `relationship: additive_extension_no_base_mutation`; the validator
  recomputes the FROZEN v1 digest (`sha256:b1dce3a7…`) on every run, so a
  byte moved in the v1 directory fails this gate.
- Freeze correction (append-only): the frozen G4-C spec answers an
  already-redacted message with committed `already_satisfied` (never a
  refusal), so the reserved not-committed reason is
  `redaction_evidence_unavailable` instead of the freeze's
  `message_already_redacted`; reason→recovery pairing is enforced by the
  validator (`re_prepare` for confirmation drift, `new_command` for
  payload conflict, `none` for missing evidence).

## 2026-08-15 — W11 parent-communication extension scope freeze

- Froze `nurture.parent-communication-owner@1.1.0`
  (`artifacts/w11-parent-communication-extension-scope-freeze.md`): an
  ADDITIVE extension of the frozen 1.0.0 (base pin `sha256:b1dce3a7…`
  declared, never re-published) supplying P-H05 — the guardian redaction
  preview/commit pair over the existing G4-C author-redaction machinery
  (two-step confirm, cascade summary, irreversible and audited) — and
  P-H06 — the per-message aggregate delivery-receipt read over the
  existing ChildLinkReceipt facts with the frozen v1 state mapping and no
  recipient identity leakage.
- Separate default-off gate
  (`NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED`) and a v1.1 base path
  keep the frozen v1 artifact, routes and posture byte-identical. No new
  kernel transaction: the commit rides the existing `familyCare`
  transaction and `createRedactFamilyCareMessageSpec("author")` verbatim.

## 2026-08-15 — W10-4 assistant-query registration closes

- Registered the W10 conformance fixtures in the service-candidate
  standalone-fixture list (now 8 entries); the frozen G5-A Candidate is
  untouched. The remaining registration surface (env 5-file set, censuses,
  safe codes, context checksum) landed with W10-2/W10-3;
  project-governance sync/lint re-ran clean with no derived-view drift.

## 2026-08-15 — W10-3 assistant-query real owner ports

- Added the DB-free domain service
  (`src/teacher-assistant-query-owner-service.ts`): W6-discipline authority
  and read envelopes; missing-records partitions the five kinds per
  enrolled child and attaches the typed supplement handoff with
  availability from the same daily-care eligibility read the W6 action
  uses; weekly-source computes the Monday-Sunday window by pure calendar
  arithmetic from `local_date` and zero-fills per-child counts.
- The weekly draft is a raw ledger spec (`teacher_assistant_weekly_draft`):
  actor HMAC rides the canonical payload `{care_group_id, week_start,
  actor_binding_ref}` with no volatile heads; `checkPreconditions` re-reads
  authority, the safety-policy identity, the existing (class, week) process
  and the care_day_note/family_weekly_summary target set inside the
  command transaction (`loadWeeklyDraftFacts`), answering
  `already_satisfied` with the existing process; `apply` routes the
  facts-only document through `evaluateContentSafetyRoute` (no classifier)
  and lands process + sealed first revision + targets + assessment row in
  one transaction (`applyWeeklyDraftProcess`, new
  `NurtureTeacherAssistantTransaction` on the command transaction; no
  schema change — `captureBatchId` stays null).
- Replay honesty (the W7 lesson): the `no_weekly_facts` pre-check only
  fires when NO (class, week) draft exists; with one present the command
  always runs so the ledger or the domain answers it. The sealed body is
  the deterministic weekly-facts document (safe labels and counts only, no
  ids); `command_actor_mismatch` stays reserved vocabulary — the kernel
  folds actor identity into the payload hash, so cross-actor reuse lands
  `command_payload_conflict` exactly as W7-W9 do.
- Prisma side: `PrismaTeacherAssistantQueryReadPort` (enrolled children,
  per-day recorded kinds from payload presence, weekly per-kind day counts,
  confirmed-attribution counts over assets captured in-window, weekly-draft
  lookup by process key) and `PrismaTeacherAssistantTransaction` wired into
  `PrismaNurtureCommandRepository`;
  `createPrismaTeacherAssistantQueryBinding` composes them with the AES-GCM
  protected-content port.

## 2026-08-14 — W10-2 assistant-query default-off runtime

- Mounted the three W10 routes in `apps/scenario-service` behind
  `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` with the W6-W9 runtime
  set: strict allowlist HTTP parsers (calendar-valid `local_date`; any
  caller `week_start`/`week_end` — or other hidden field — dies at parse),
  the authority-rereading composition, the digest-pinned Ajv response
  validator, the fail-closed factory and the guarded controller
  (service bearer, `private, no-store`).
- W10-specific bindings: missing-records must echo the requested
  `local_date` and key its partition `class_ref|local_date`; weekly-source
  keys `class_ref|week_start` from the answered owner-computed week and
  the requested date must fall inside the answered window; the runtime
  validator recomputes `missing_count`, the five-kind partition,
  handoff-presence-iff-missing, the seven-day window and both class
  totals. The exchange echoes exact command identity.
- Registration surface: safe codes allowlisted, env 5-file set
  regenerated, ingress census now asserts the W10 block
  (controller-routes 49), scenario-service routing census 25.

## 2026-08-14 — W10-1 assistant-query contract artifact

- Published `contracts/teacher-assistant-query-owner/v1/`: owner-contract
  JSON (digest `sha256:d4010661…`), 11 fixtures + 12 executed invalid
  probes, Ajv-strict validator chained into
  `verify:formal-ingress-contract`, README, and the frozen TS constants
  (`src/teacher-assistant-query-owner-contract.ts`).
- Contract shape follows the freeze exactly: the missing-records child
  partitions the five daily-care kinds into present/missing and carries a
  typed supplement handoff (const-pinned to
  `teacher-organization-owner@1.0.0` / `supplement_exchange`) required
  precisely when a kind is missing; weekly-source answers the
  owner-computed Monday-Sunday window with per-kind counts and W9-chain
  confirmed-media counts; the weekly-draft exchange answers
  `created | already_satisfied` with `process_ref` and the W7 lane state.
  Requests never accept week boundaries (`unevaluatedProperties: false`
  plus a request-side forbidden-field census including
  `week_start`/`week_end`).
- Validator adds W10-specific bindings beyond the W9 template: query keys
  `class_ref|local_date` and `class_ref|week_start` (the latter derived
  from the answered week), `missing_count` = Σ per-child missing kinds,
  kind-partition and handoff-presence checks, seven-day window arithmetic
  with the requested date inside it, class totals = Σ per-child facts, and
  the cross-fixture rule that every `already_satisfied` names a
  `process_ref` some created draft answered.

## 2026-08-14 — W10 assistant-query scope freeze

- Froze `nurture.teacher-assistant-query-owner@1.0.0`
  (`artifacts/w10-assistant-query-scope-freeze.md`): missing-records query
  with the typed non-executable supplement handoff (T-H02), the
  deterministic weekly-source facts (daily-care counts per kind plus the
  confirmed-media counts W9's association chain supplies), and the
  weekly-draft exchange that creates one owner-side publish process per
  (class, ISO week) — agent-labelled, entering the existing W7 review lane,
  domain-idempotent with `already_satisfied` answering the same
  `process_ref`. The generation boundary stays engine-ready: no provider
  calls, no generated prose, facts only.
- Week identity is owner-computed under the publication-policy timezone;
  requests never carry week boundaries. Draft editing, release and
  scheduling stay with their existing owners.

## 2026-08-14 — W9-4 teacher media-association registration closes

- Registered the W9 conformance fixtures in the service-candidate
  standalone-fixture list; the frozen G5-A Candidate is untouched. The
  remaining registration surface (env 5-file set, censuses, safe codes,
  context checksum) landed with W9-2/W9-3; governance sync/lint re-ran
  clean with no derived-view drift.

## 2026-08-14 — W9-3 teacher media-association real owner ports

- Added the DB-free domain service
  (`src/teacher-media-association-owner-service.ts`): W6-discipline
  authority and read envelopes; the unassociated queue filters to assets
  with no confirmed attribution (queue-wide count capped 999, page ≤50,
  display fields merged from the new asset-display read); the child option
  list reuses the daily-care eligibility port; the two exchanges run on the
  generic command ledger with the W7 actor HMAC.
- Media refs resolve over the class's FULL asset set (terminal lifecycles
  included) — the W7/W8 replay-resolution lesson applied up front, so
  exact replays after a decision or discard never mask.
- Associate rides the frozen G3-C1 confirm/reject specs verbatim (the
  request carries the expected revisions, so they stay inside the command
  identity); a head conflict is attributed honestly with one extra
  failure-path read (`media_revision_moved` vs
  `attribution_revision_moved`). Discard rides
  `createDiscardMediaAssetSpec` with head-free identity, the freshly-read
  heads as expected-heads, and a wrapped apply that records the discard
  instant into the committed result so replays answer the original moment.
- Prisma side: `PrismaTeacherMediaAssociationReadPort` delegates the G3-C1
  attribution/lifecycle reads to the existing media-safety port and adds
  the class-wide candidate list plus display fields (no bytes or storage
  handles anywhere); `createPrismaTeacherMediaAssociationBinding`
  assembles context/media/child-option reads and the command runner. No
  schema change.
- DB-lane world lesson: `NurtureMediaAttributionSource` has no
  `organizer_candidate` value — candidate rows seed as `history_match`
  (the harness vocabulary maps sources at the read boundary).

## 2026-08-14 — W9-2 teacher media-association default-off runtime

- Mounted the four W9 routes in `apps/scenario-service` behind
  `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` with the established
  五件套 shape (exact-shape parsers with the decision enum and revision
  bounds, current-authority composition, Ajv-pinned response validator,
  fail-closed factory, guarded controller); safe codes allowlisted.
- Binding asserts: read `query_key` = `class_ref` / `media_ref`, associate
  media+child echo with decision→state pairing, discard media echo, and the
  queue-wide count-vs-page consistency on the unassociated read.
- e2e (7 cases, 33 tests with config) green on the first full run; ingress
  census pins the four routes and the W9 assertion block (controller-routes
  42 -> 46); test-routing scenario-service 23 -> 24; env contract 5-file
  set gained the gate with registry checksum refresh.
- Real Prisma owner ports and DB lanes are W9-3; no schema change.

## 2026-08-14 — W9-1 teacher media-association contract artifact

- Published the W9 contract package at
  `packages/nurture-scenario/contracts/teacher-media-association-owner/v1/`:
  owner-contract JSON with four operations (unassociated, association,
  associate, discard), 15 conformance fixtures + 12 executed invalid probes
  + the 18-scenario negative census, hard-pinned `validate-contract.mjs`
  and README. Digest
  `sha256:528e50c8170a8b2fa41679cd7fc8d20f5fb344278a6d8e3a6294adc405dd96b4`
  minted with the shared canonicalizer; strict compile clean on the first
  run, zero digest re-mints (second batch in a row).
- W9-specific validator invariants: media/child ref uniqueness, the
  queue-wide `unassociated_count` may never undercut its own page,
  association media echo, associate media+child echo with decision→state
  pairing (confirm→confirmed, reject→rejected), discard media echo, and the
  candidate/decided_at if-then (a candidate never carries a decision
  instant).
- The forbidden response set adds `media_asset_id`, `attribution_id`,
  `thumbnail_url` and `preview_ref` — bytes/previews have no home in this
  version by design.
- Added `src/teacher-media-association-owner-contract.ts` exported from the
  package index and chained
  `verify:teacher-media-association-owner-contract` into
  `verify:formal-ingress-contract` (six contract validators now). Runtime
  is W9-2; the ingress census is intentionally untouched.

## 2026-08-14 — W9 media-association scope freeze

- Froze `nurture.teacher-media-association-owner@1.0.0`
  (`artifacts/w9-media-association-scope-freeze.md`): association-only over
  existing owner-side assets — four operations (unassociated read with the
  eligible-children option list and the T-H03 count, per-asset association
  read, single-decision associate exchange over the frozen G3-C1
  confirm/reject commands, and a discard exchange over
  `discard_media_asset@1.0.0`). The UI's multi-selection is a client batch
  of single-decision idempotent commands so per-child partial failure stays
  explicit; decisions bind the exact immutable `media_revision`.
- Explicitly out: upload/bytes/thumbnails/preview (reserved ingress + proxy
  do not exist; T-F16's camera half stays blocked), supersede (G4-C
  correction lane), automatic face matching (default-off G3-C2). No schema
  change expected — the G3-C1 read port, command specs and transaction
  wiring already exist.

## 2026-08-14 — W8-4 teacher communication-owner registration closes

- Registered the W8 conformance fixtures in the service-candidate
  standalone-fixture list; the frozen G5-A Candidate is untouched. The
  remaining registration surface (env 5-file set, ingress and test-routing
  censuses, safe codes, context registry checksum) had already landed with
  W8-2/W8-3. Governance sync/lint re-ran clean with no derived-view drift.

## 2026-08-14 — W8-3 teacher communication-owner real owner ports

- Added the DB-free domain service
  (`src/teacher-communication-owner-service.ts`): W6-discipline authority
  and read envelopes; targets rail from live threads with the unread count
  derived from the teacher's own participant cursor (capped 99, summary
  capped 999, `class_group` frozen unavailable); display-safe membership;
  timeline pages sealed behind owner-HMAC cursors (`body` unsealed from the
  protected envelope, ≤4000; a tampered cursor is a non-retryable invalid
  request); and the three exchanges on the generic command ledger with the
  W7 actor HMAC in every canonical payload.
- Send is the W3 prepare/confirm re-run for the teacher actor: prepare
  seals the body into the confirmation state; confirm consumes the
  single-use token and lands `applyThreadTextMessage` (new W8 owner write:
  `caregiver_reply` + `caregiver_confirmed`, protected storage, thread
  activity bump, role re-read in-transaction).
- Withdraw rides the existing `createCancelPublishProcessSpec` with
  head-free command identity (the W7 organize lesson) — and its own W8
  variant of the same defect class surfaced in the DB lane: after a
  successful cancel the process leaves the active lane, so withdraw
  resolution uses a dedicated candidate read that includes `cancelled`
  processes, keeping exact replays resolvable instead of masking.
- Mark-read is the only cursor clear (`applyThreadReadCursor`): candidate
  matching over the exact thread's messages, own-row upsert (participant
  row created on first mark-read with the current role), never backwards
  (`cursor_regression`), never another participant's cursor.
- Prisma side: `PrismaTeacherCommunicationReadPort` (threads, withdraw
  candidates, members with W3-style display fallbacks, cursor-paged
  messages; teacher-message delivery derives from guardian cursors —
  `delivered` never appears since no device-delivery source exists) and
  `PrismaTeacherCommunicationTransaction` wired into the command
  repository; `createPrismaTeacherCommunicationBinding` assembles the
  binding. No schema change.
- DB-lane world lessons recorded: thread `visibility_scope` uses the
  frozen enum (`enrollment_private`), and a `pending_release` seed must
  satisfy the all-seven-or-none schedule check
  (`ck_nurture_publish_process_state`).

## 2026-08-14 — W8-2 teacher communication-owner default-off runtime

- Mounted the six W8 routes in `apps/scenario-service` behind
  `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` with the established
  五件套 shape: exact-shape parsers (send prepare/confirm union with the
  1..2000 text bound, optional timeline cursor 1..256), current-authority
  composition, Ajv-pinned response validator, fail-closed factory and the
  guarded controller. The three W8 safe codes joined the allowlist.
- Binding asserts beyond W7: the timeline response must echo the exact
  request cursor (`null` first page, the W4 replay rule) and the requested
  `thread_ref`; targets responses must keep the unread summary equal to
  their threads; membership/mark-read echo the thread, withdraw echoes the
  process; `query_key` derivations are `class_ref` / `thread_ref` /
  `thread_ref|cursor-or-first`.
- e2e (7 cases, 31 tests with config) covers the six mounts, replay and
  outcome_unknown echo, masked short-circuit, parse rejections (foreign
  authority field, digest drift, 2001-char text, prepare+confirm double
  payload), command/pairing/process kills, unread-summary and cursor-echo
  kills, default-503 and 401 — all green on the first full run.
- Census sync: ingress census pins the six routes and the W8 assertion
  block (controller-routes 36 -> 42); test-routing scenario-service census
  22 -> 23; env contract 5-file set gained the gate variable with registry
  checksum refresh.
- Real Prisma owner ports and DB lanes are W8-3; no schema change, no
  activation, no deployment.

## 2026-08-14 — W8-1 teacher communication-owner contract artifact

- Published the W8 contract package at
  `packages/nurture-scenario/contracts/teacher-communication-owner/v1/`:
  owner-contract JSON with six operations (targets, membership, timeline,
  send-text, withdraw-staged, mark-read), 18 conformance fixtures + 14
  executed invalid probes + the 20-scenario negative census, hard-pinned
  `validate-contract.mjs` and README. Digest
  `sha256:e4a831cdb867ab2a5ad38d6e634e13b9da41d44606a9644c6aa0b7fd36503edf`
  minted with the shared canonicalizer; the W7 Ajv strict-mode lessons were
  applied up front and the schema compiled clean on the first run — zero
  digest re-mints this batch.
- W8-specific validator invariants beyond the W7 set: the targets unread
  summary must equal its threads (sum capped 999 + count of non-zero), the
  timeline `cursor_echo` must equal the request cursor (`null` first page,
  the W4 replay rule), thread/member/message ref uniqueness, membership and
  mark-read thread echo, withdraw process echo, and the frozen-unavailable
  `class_group` entry (probe flips it to `available` and must be rejected).
- One probe lesson recorded: a schema pattern cannot reject a well-formed
  wrong digest, so the digest probe mutates to a malformed value; exact
  digest admission stays a runtime-parse and validator-equality concern.
- Added `src/teacher-communication-owner-contract.ts` (six paths + frozen
  interface + descriptor) exported from the package index and chained
  `verify:teacher-communication-owner-contract` into
  `verify:formal-ingress-contract`. Runtime is W8-2; the ingress census is
  intentionally untouched.

## 2026-08-14 — W8 communication-owner scope freeze

- Froze `nurture.teacher-communication-owner@1.0.0`
  (`artifacts/w8-communication-owner-scope-freeze.md`): six operations —
  targets rail (with the frozen-unavailable `class_group` entry and the
  T-S04 unread summary), display-safe membership, cursored timeline with
  cursor echo, the W3 prepare/confirm `send_text_exchange` re-run for the
  teacher actor (outward business effect, so the W7 class-internal
  exemption does not apply), single-step staged withdrawal over
  `cancelPublishProcess`, and a single-step own-cursor `mark_read_exchange`
  (reads never write, so badges need an explicit clear).
- Design decisions recorded in the freeze: unread derives from the
  teacher's own thread-participant cursor without fabricating rows on
  read; media appears in timelines as presence descriptors only (W9 owns
  bytes/access); sent-message withdrawal is a different lifecycle and
  stays out; T-C05 closes over the W7 organization read plus this batch's
  withdraw (no new DTO); T-C08 stays blocked on I-Q1.

## 2026-08-14 — W7-4 teacher organization-owner registration closes

- Registered the W7 conformance fixtures in the service-candidate
  standalone-fixture list (`scripts/service-candidate/candidate-core.mjs`),
  so the next candidate freeze seals them alongside the W3-W6 contracts;
  the frozen G5-A Candidate itself is untouched and
  `verify-service-candidate` continues to report expected post-freeze input
  drift between candidates.
- The remaining W7-4 surface had already landed with W7-2: env contract
  5-file set (SSOT yaml, regenerated example/docs/context JSON, registry
  checksum), ingress and test-routing censuses, safe-code allowlist.
  Governance sync/lint re-ran clean with no derived-view drift.

## 2026-08-14 — W7-3 teacher organization-owner real owner ports

- Added the DB-free domain service
  (`src/teacher-organization-owner-service.ts`): W6-discipline authority and
  read envelopes (workspace-bound opaque refs by candidate matching,
  `query_key === class_ref`), trigger preview through the frozen
  `evaluateOrganizeTrigger`, per-card admission preview through
  `evaluatePublishQueueAdmission` over live facts (quick-adjust and
  edit-hold windows derived from the same facts), and the four exchanges on
  the generic Nurture command ledger. Every canonical payload folds in an
  actor HMAC (workspace + participant), so cross-actor or divergent reuse
  of a `command_request_id` lands `command_payload_conflict` and an exact
  same-command replay answers the recorded result with
  `executed: replayed`. `command_actor_mismatch` stays a reserved schema
  code — the ledger cannot attribute which payload field diverged.
- Organize rides the existing `createOrganizeCareCaptureBatchSpec` with two
  W7 decisions: command identity excludes the volatile batch head (the
  spec's expected-heads check still gates the cut, and a replay after the
  batch left `collecting` must still reach the ledger), and a no-cut
  evaluation answers `committed / nothing_to_organize` without entering the
  ledger, so it always reports `executed: executed`.
- Supplement is the only prepare/confirm: prepare rereads eligibility,
  seals nothing, and issues a single-use five-minute confirmation whose
  state carries the exact typed command and preview digest; confirm
  consumes the token and re-evaluates current authority in-transaction
  before `applyCaregiverDailyCareRecord` (prepared heads are a preview
  fact, not a stale-write license).
- New owner writes: `applyClassNoteCapture` on the care-capture transaction
  (stable text capture appended to — or opening — the collecting batch;
  intake holds the plaintext, so the deterministic safety pass records the
  honest empty marker list, distinct from NULL "never derived") and the
  in-transaction `publishQueueAdmission` port on the command transaction so
  `admitPublishProcessToQueue` freezes the schedule inside the same ledger
  command (`already_satisfied` maps to a committed disposition, waiting and
  blocked reasons roll back deterministically into the frozen enum).
- Prisma side: `PrismaTeacherOrganizationBatchReadPort` (newest
  non-cancelled batch + owner-ordered lane with safe child labels) and
  `createPrismaTeacherOrganizationBinding({ prisma, integrityKey,
  protectedContent, now })` assembling context/capture/admission/
  eligibility reads, the interaction-context service and the command
  runner. No schema change was needed.
- World prerequisites surfaced by the DB lane (recorded for W7-4 e2e):
  organize needs the institution `policyConfigPayload` content-safety
  identity, an active family per child-care process and an org-to-family
  grant covering `daily_care_log`; enrollment rows need
  `participation_phase` under the G4-D check constraint.

## 2026-08-14 — W7-2 teacher organization-owner default-off runtime

- Mounted the six W7 routes in `apps/scenario-service` behind
  `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` with the W6 五件套 shape:
  exact-shape HTTP parsers (including the supplement prepare/confirm
  discriminated union and the note/text 1..500 bound), current-authority
  composition, Ajv-pinned response validator, fail-closed factory and the
  guarded Nest controller. The three W7 safe codes joined the
  `SafeExceptionFilter` allowlist.
- Write-path binding asserts beyond W6: exchange responses must echo the
  exact `command_request_id`; supplement responses must pair with the
  request kind (prepare never lands `committed`, confirm never answers
  `ready_to_confirm`); a committed admission must answer the requested
  `process_ref`. Read asserts reuse the W6 resolution/cache/query-key
  discipline with `query_key === class_ref`.
- Two composition lessons recorded: ready read responses carry the context
  echo only inside `owner_resolution`/`cache_partition` (a top-level
  `context_ref` check must branch by status first), and a `never`-returning
  `violation` helper needs an explicit `() => never` annotation for TS
  control-flow narrowing.
- e2e (listener-free light-my-request, 7 cases) covers all six mounts with
  private headers, replay/outcome_unknown echo, masked short-circuit without
  owner calls, parse-level rejections (foreign authority field, digest
  drift, non-manual trigger, 501-char note), command-identity/pairing/
  process drift kills, quick-adjust duplication kill, default-503 and 401.
- Census sync: ingress census now pins the six routes, controller
  registration, contract constants, gate flag, runtime completeness and
  command-echo assert (controller-routes 30 -> 36); test-routing
  scenario-service census 21 -> 22; env contract 5-file set gained the gate
  variable (SSOT yaml, regenerated example/docs/context JSON, registry
  checksum refreshed).
- Real Prisma owner ports and DB lanes are W7-3; no schema change, no
  activation, no deployment.

## 2026-08-14 — W7-1 teacher organization-owner contract artifact

- Published the W7 contract package at
  `packages/nurture-scenario/contracts/teacher-organization-owner/v1/`:
  owner-contract JSON with six operations (feed, organization, organize,
  supplement, class-note, queue-admission), 17 conformance fixtures + 14
  executed invalid probes + the 18-scenario negative census, hard-pinned
  `validate-contract.mjs` and README. Digest
  `sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161`
  is minted with the shared RFC 8785 canonicalizer and asserted in the
  validator, the TS interface constant and every fixture.
- First write-path contract: the validator additionally checks exchange
  invariants — command identity echo, supplement prepare/confirm status
  pairing, admission answering only the requested `process_ref`, at most one
  active quick-adjust window per lane, and per-batch coverage of `masked`,
  `unavailable`, `outcome_unknown` and `executed: replayed` fixtures.
- Ajv strict-mode composition lessons (recorded for W8+): a `$ref` with
  sibling `required`/`properties` needs an explicit `type: "object"`
  (strictTypes), and every `required` name must also appear in the same
  subschema's `properties` (strictRequired) — satisfied by inert
  `<name>: true` placeholders in if/then branches whose real definitions
  live on the parent, and by not re-listing the identity fields already
  required inside `identity_request`. Three digest re-mints during
  stabilization; only the final digest is published.
- Added `src/teacher-organization-owner-contract.ts` (six paths + frozen
  interface + descriptor, `mobile_mode: "read_and_command"`), exported from
  the package index, and chained
  `verify:teacher-organization-owner-contract` into
  `verify:formal-ingress-contract`.
- Runtime routes, gate flag and e2e lanes are W7-2; real Prisma ports and DB
  lanes are W7-3. The ingress census is intentionally untouched and still
  reports the pre-W7 route population.

## 2026-08-14 — x5 joint repair round two: full lane green (37/37)

- t010 authorization suite (5): completed the b514b68 clock alignment — the
  suite already passed `() => COMMAND_NOW` Clock ports to prepare/confirm but
  left `service.query`'s optional clock on the system default, so the
  T-042-era freshness evaluation ran at wall-clock against the fixture's
  frozen `T010_EVALUATED_AT` window and reported the media change
  unavailable. Both query call sites now pass the fixture clock.
- x5-acceptance (2 asserted, 4 total): the stop was
  `target_unavailable` from the My-Chat consumer, not an owner fault — the
  Nurture user-attention resolve answered a healthy `nurture_attention_v1`
  item, but the T-042 notification hardening
  (`assertActiveWorkspaceRecipients`) refuses recipients who are not active
  members of the exact workspace, and the x5 My-Chat fixture never seeded
  the `caregiver:<workspaceId>` user. The fixture now creates the workspace
  (type `organization`), the caregiver user and an active membership. The
  stale 2026-08-08-era header note claiming the lane "stays red until the
  Nurture owner endpoint adopts" the Dashboard contract was corrected — the
  adoption completed on 2026-08-08 (record 19).
- Full x5 joint lane on the disposable pair: 5 files / 37 tests green — the
  first complete lane pass since the W5 N1 hardening landed.

## 2026-08-14 — x5 joint repair: t009 provenance seed and replay settlement

- Repaired the T-009 joint fixture to the W5 N1 provenance model: the seed now
  creates a guardian Participant + RoleAssignment per family and chains each
  `NurtureScenarioBindingAuthorization` through
  `nurture-care-role:<roleAssignmentId>` with exact versions, replacing the
  pre-W5 `my_chat_child_identity` source ref that had made every prepare fail
  `authorization_provenance_invalid` since 2026-08-13.
- Diagnosed and fixed a real cross-owner settlement regression introduced by
  the `170edd4` hardening: the frozen wire contract re-answers an applied
  release replay with `status: "duplicate"` (same companion refs, same
  original `processed_at`), but the hardened matcher demanded byte-identical
  receipts, so every response-loss recovery rolled back its settlement as
  `receipt_conflict` and the outbox row spun in `delivering`. The matcher now
  treats exactly the stored-`applied` -> incoming-`duplicate` pair (with all
  other fields equal and payloads equal modulo that status) as
  replay-equivalent; My-Chat's consumer (its `T-031` companion commit
  `afb25b5`) now echoes the intake row's original `processedAt` on every
  answer so replayed receipts really are byte-stable.
- Updated the W5 N2/N6 hardening suite accordingly: the pure status-swap
  variant is now a positive settled case, and the conflicting-variant loop
  keeps the boundary honest with a `duplicate`-plus-foreign-`admission_ref`
  probe. Joint state after the repair: t009 8/8 and both t007 joint suites
  green (30/37 lane-wide); the t010 suite (5) and two x5-acceptance cases
  remain red and queued next.

## 2026-08-14 — Reseal tooling consolidation

- Consolidated the manual reseal chain into
  `scripts/reseal-cross-repo-pins.mjs` (`pnpm reseal:pins`): `plan` reports
  every stale pin/lock/literal read-only; `apply --note` rewrites the
  workflow contract pin plus the g2/c30-upstream/owner-adoption revision
  literals (replacing their dated comment blocks with the supplied
  rationale) and runs the three verifiers; `lock` mints the C30-I3 owner
  adoption lock at the committed HEAD. The two-step split preserves the
  commit-then-lock discipline; sibling worktrees must be clean; a Base
  revision move is refused without `--allow-base-move`; a stale My-Chat
  scenario-host-adoption lock is reported with its My-Chat-side refresh
  instructions and never written from here.
- `replaceAnchoredLiteral` is covered by
  `scripts/reseal-cross-repo-pins.test.mjs` (`pnpm test:reseal-pins`, 3
  cases). Entry points are recorded in the W6-W11 schedule artifact (per
  batch/adoption) and in the T-002 implementation notes (C30 lock
  governance).

## 2026-08-14 — W6-3 teacher class-stream real owner ports

- Added the DB-free domain owner
  `packages/nurture-scenario/src/teacher-class-stream-service.ts`: the
  authority resolver rereads the caller's current caregiver context per call
  (participant from workspace + My-Chat user, live caregiver/lead_caregiver
  care-group assignments); owner reads echo the resolved authority verbatim
  and fetch payload facts only. Opaque class/child refs are deterministic
  workspace-bound HMACs resolved by candidate matching, so foreign or stale
  refs purge without existence leaks.
- Added the Prisma read port
  `packages/nurture-db/src/repositories/teacher-class-stream.repository.ts`
  and `teacher-class-stream.composition.ts`
  (`createPrismaTeacherClassStreamBinding`). Reads anchor on canonical
  `@db.Date` class-day columns (daily care logs, attendance submission and
  entries, schedule day override) and the three-layer schedule resolution
  (day override -> class standing -> institution default) with strict
  slots-payload parsing that reports malformed data as
  `content_unavailable` instead of guessing.
- Honesty boundaries implemented per the scope freeze: observations and
  focus-link sections return `unavailable` because no caregiver-visible
  child-associated observation source or granted focus projection exists yet
  (W9/W10 own those); `not_expected` attendance reports the arrival section
  `empty`; no slot is ever marked current because no institution timezone is
  canonical; family-instruction timestamps use the documented UTC day-window
  limitation shared with the G3 board.
- Production `main.ts` intentionally does not construct the binding; like
  W3.1, real-owner presence is not activation and the deployed carrier
  remains a separate W3.2-class gate.

## 2026-08-14 — W6-2 teacher class-stream default-off runtime

- Mounted the four class-stream routes in `apps/scenario-service` with the
  established five-file shape: controller (guard + private headers),
  strict request parsers, composition (authority reread + owner ports +
  request binding), fail-closed runtime factory and an Ajv runtime response
  validator that re-mints the artifact digest at load. The composition binds
  `query_key` to its deterministic request derivation (`local_date`,
  `class_ref|local_date`, `child_ref|local_date`), and the same rule now
  lives in the contract validator and fixtures.
- Registered gate `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED`
  (default false; exact-literal parsing) in config, safe reason codes in the
  exception filter, module/application wiring with the optional
  `teacherClassStream` register input, the ingress census (controller routes
  26 -> 30, six -> seven owner-contract controllers), the test-routing census
  (scenario-service 20 -> 21) and the future-candidate fixture list.
- Environment contract: added the key to `env/contract.yaml`, regenerated
  `.env.example`/`docs/env.md`/`docs/context/env/contract.json`, refreshed the
  `env-contract` registry checksum and appended the W6 entries to the env
  change-record set.
- New e2e suite covers: all four routes with private headers, read-only
  availability-descriptor semantics, masked fail-closed without owner reads,
  foreign-authority/pin-drift 400s, owner scope/query-key/hidden-payload/
  double-current 500s, and default-off 503 plus 401 service auth.

## 2026-08-14 — W6-1 teacher class-stream contract artifact

- Published the W6 contract package at
  `packages/nurture-scenario/contracts/teacher-class-stream/v1/`: hand-authored
  owner-contract JSON (four read operations: class-context, child-strip,
  child-day-detail, schedule), 12 conformance fixtures + 12 executed invalid
  probes, a hard-pinned `validate-contract.mjs` and the README posture note.
  Digest
  `sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3`
  is minted over the artifact with the shared RFC 8785 canonicalizer and
  asserted in the validator, the TS interface constant and every fixture.
- Added `src/teacher-class-stream-contract.ts` (paths + frozen interface +
  descriptor) exported from the package index, and chained
  `verify:teacher-class-stream-contract` into `verify:formal-ingress-contract`.
- Design followed the W4 skeleton with one deliberate simplification recorded
  against the scope freeze: all four operations are bounded single-page reads
  with explicit caps (classes 8, children 80, entries 40, slots 24) and no
  cursor exists in v1, so the freeze's cursored-drift clause is vacuous until
  a later version introduces paging.
- Consumer-compatibility detail: invalid probes use only set-mutations at
  object keys or array indices, because the established My-Chat
  `applyMutation` helper deletes array elements without splicing; an
  enum-violation probe replaced the initial array-delete probe.
- Runtime routes, gate flag, composition and e2e lanes are W6-2; real Prisma
  ports and DB lanes are W6-3. The ingress census is intentionally untouched
  in this step and still reports the pre-W6 route population.

## 2026-08-13 — W2 P0 quality and single-track closure

- Deleted the superseded W2 scope draft. The published contract directory,
  strict validator and accepted digest-pin record are the only active owner
  contract/handoff lane; historical review evolution remains in Git.
- Updated the Nurture scenario self-hash after the maintained root typecheck
  began regenerating both Prisma clients. `typecheck` now owns generation and
  `build` no longer repeats it, preventing stale generated clients and duplicate
  work from producing contradictory evidence.
- Repaired historical T-009/T-010/T-011 test fixtures that the current generated
  types correctly rejected: current owner-evidence expiry and guardian-role
  identity are explicit, authorization clocks use the maintained port, and the
  raw-query mock implements the exact Prisma transaction-client method shape.
- Verified the upstream workflow/base pins in repository-external detached
  worktrees at the exact recorded revisions. The current developer Base
  checkout may advance independently; no floating revision or local-HEAD
  exception was introduced.

## 2026-08-13 — W2 My-Chat P0 consumer adoption handoff

- My-Chat T-039 adopted the exact W2 pin across a private HTTP source, strict
  public Dashboard DTO/API client and production Mobile parent-garden
  controller. The provider gate remains false by default and there is no
  fixture fallback.
- The consumer supplies only Workspace/user/request identity plus opaque
  `context_ref`; it does not send Participant, role, child or family authority.
  It strips owner resolution/cache fields and protected media access refs from
  its public/mobile boundary.
- Joint verification passed the provider validator and 12-case mounted route
  suite plus 65 My-Chat focused tests. My-Chat also fails closed when the four
  composed read operations return different owner scope versions or when a
  structurally valid response belongs to another ref/date/action request.
- This completes W2 P0 adoption but does not qualify deployment, active owner
  ports, media resolution, native devices, activation or traffic. W3 remains
  the next supply item.

## 2026-08-13 — W2 second adoption-review repair

- Bound every confirm fixture to the prepared five-field identity tuple:
  `action_ref`, `action_version`, RFC 8785 `prepared_preview_digest`,
  `confirmation_ref` and `command_request_id`. The validator lookup and
  real-route e2e both compare the complete tuple, with executed drift probes
  for the two previously omitted fields.
- Added a Draft 2020-12 `notice_operation_exchange` schema whose `oneOf`
  branches discriminate `list`, `prepare_confirmation` and `confirm` and admit
  only their allowed response-status sets. The validator executes that schema
  for every notice fixture and rejects `list + not_committed`; the composition
  has the same closed matrix as an independent runtime check.
- Added startup compilation of all five published response schemas from the
  canonical artifact. Every owner and composition response is schema-checked;
  schema or semantic drift throws across the private filter as generic
  `500 internal_error`. The real route proves an owner-only
  `private_care_note` is rejected and never forwarded.
- Replaced manual guard/controller/filter dispatch with
  `Test.createTestingModule` plus in-memory Node HTTP injection through the
  mounted Express adapter. All routing, decorators, parsing, guards and filters
  are real. The route suite also exposed and repaired transform-sensitive
  filter DI by making both filter dependencies explicit.
- Made ASYNC-12 an application rule. Enabled composition now requires an async
  boundary port that captures the response generation and reads current
  generation/context state; the composition performs equality and returns a
  closed unavailable response instead of forwarding a late owner result.
- Rotated the strict RFC 8785 adoption digest across artifact consumers and
  records to
  `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196`.
  No pin JSON, route enablement, deployment or traffic posture changed.

## 2026-08-13 — W2 adoption-review repair

- Added a bounded `activities[]` source to the day response: at most 20 opaque
  activity refs with bounded title, UTC timestamp and presenter media state.
  Activity detail remains a separate operation, and validator probes require a
  detail ref to originate from the same context/date day response.
- Bound notice list, prepare and confirm through one action ref/version and an
  RFC 8785 digest of byte-equivalent confirmation preview copy. Confirm must
  echo the exact identity and digest; list/prepare/confirm fixture consistency
  and prepared digest recomputation now fail hard on drift.
- Mounted all five private `POST` routes in scenario-service behind
  `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED`. The guard requires configured
  service bearer auth plus a complete Q6 authority-resolver/owner binding;
  otherwise it returns private/no-store `503`. The controller, scoped private
  exception filter, providers and all five routes are pinned in the formal
  ingress AST census.
- Added a focused in-process Nest e2e suite covering all five paths, auth and
  exact-pin negatives, Q6 resolution before every owner call, all six masking
  classes, action/digest mismatch, replay and ASYNC-12 late-result rejection.
  The in-process transport exercises the real controller/guard/filter graph
  without opening a listener in restricted test environments.
- Added eight mutation fixtures that the AJV schemas must reject and operation-
  specific probes for selected date, cache query key, day-to-detail activity
  refs, notice/action foreign consistency, preview identity/digest, media-state
  exclusions, unique refs and pagination cursor requirements.
- Hard-pinned the published RFC 8785 adoption digest in the validator and
  rotated the artifact, fixtures, source constant and records to
  `sha256:e19642198f5022f0e68e5908e6d17098abee6a12942f47a247e7e5a8db633fd6`.
  No pin JSON changed; routes remain default-off and no deployment or traffic
  was enabled.

## 2026-08-13 — W2 parent-context presenter v1 initial authoring (pre-review)

- Published a standalone, default-off
  `nurture.parent-context-presenter@1.0.0` source artifact over the unchanged
  `nurture.surface-contract@1.20.0` baseline. The artifact declares five
  service-bearer internal ingress paths but adds no controller, route,
  composition, feature flag or runtime adapter.
- Embedded strict Draft 2020-12 request/response schemas for day navigation,
  partial daily-care cards, activity detail with opaque protected-media access,
  notice list/prepare/confirm and freshness/attendance display projection.
  Every call accepts Host identity plus `context_ref` only and requires fresh
  Nurture owner resolution; caller Participant/role/scope fields and recursive
  foreign fields are rejected.
- Froze a reviewed 14-code safe reason vocabulary, explicit mask signals for
  access/scope/context/policy/non-retryable-refresh drift, universal private
  no-store response rules, and the complete protected-cache dimension and
  invalidation semantics referencing ASYNC-01 through ASYNC-12. Presenter
  display enums are isolated from Prisma/domain business enums.
- Resolved protected media to opaque, actor/context/expiry-bound owner-stream
  access refs with no URL or storage ref. Resolved attendance tokens as display
  states only, not canonical attendance facts. Notice confirmation uses closed
  list/prepare/confirm sub-exchanges with same-command reconciliation only.
- Added 16 joint conformance fixtures and an offline schema/digest validator.
  The matrix has positive and negative coverage for every operation plus scope
  loss, revocation, stale `context_ref`, ambiguous Enrollment,
  protected-display denial, non-retryable refresh, replay and late completion.
- Computed the canonical source digest with the repository's strict RFC 8785
  implementation and recorded the exact pin plus all five IR-C01 properties in
  `artifacts/w2-parent-context-presenter-v1-digest-pin.md`. No pin JSON was
  changed. The final publication review accepted the exact pin, fixtures and
  listener-free conformance environment; W2 is adoption-ready and My-Chat
  T-039 owns the separate dormant consumer adoption.

## 2026-08-13 — W5 N9 adversarial review repair

- Replaced the formal-ingress filename/decorator regex with a TypeScript AST
  census over every `.ts` file below `apps/scenario-service/src`. The census
  resolves all `@nestjs/common` named imports, named aliases, namespace imports
  and default namespace-style references before recognizing route decorators.
  Inline fail-closed self-checks cover an aliased `Post`, namespace-qualified
  `Nest.Post`, and a controller route declared in a non-standard filename.
- Parsed the real `@Module({ controllers: [...] })` metadata and the
  complete scenario-service `NestFactory.create` call inventory. Static and
  dynamic controller registrations are combined and pinned to the exact
  source/export inventory, so a registered controller cannot evade the route
  census by filename, decorator spelling or a dynamic-module controller list.
  The dynamic module's two exception-filter providers are pinned as well.
- Added `PrivateResponseExceptionFilter` as a controller-scoped filter on the
  teacher-release and family-sharing private controllers. It writes
  `Cache-Control: private, no-store` and `Pragma: no-cache` before delegating to
  the existing safe error serializer, so guard-thrown 401/503 responses receive
  the same privacy posture as successes. The family-sharing guard's duplicate
  header mutation was removed, making the filter the single error-path owner.
- Added 401/503 header assertions to both existing controller E2E suites and a
  non-listening filter unit test. The trusted-invocation suite now proves an
  exactly 60-second request passes upstream validation but fails the local
  expired-window branch before nonce consumption; accepted invocations spy on
  the nonce store and prove exactly one consumption per invocation.
- No route, schema, migration, workflow pin, runtime default, deployment or
  activation change was made.

## 2026-08-13 — W5 N7/N9/N10/N11 closure

- N7: the family-sharing invariant guard now strips SQL comments, parses
  statements, requires each full normalized CHECK against its owning table,
  requires the complete composite-FK target columns/table and `ON DELETE` / `ON
  UPDATE` actions, and rejects non-additive or unanchored statement shapes. Its
  self-checks cover comment-only SQL, a wrong owning table, and a trailing
  destructive FK clause. CI runs it next to the family-growth outbox guard.
- N9: the formal-ingress guard recursively censuses every controller route in
  `apps/scenario-service/src` and compares all 14 method/decorator declarations
  to an explicit allowlist. The signed family-sharing endpoint is bound to its
  service bearer, error/success no-store headers, exact route/operation/schema/
  interface pins, disabled default, trusted declarations, Ed25519 verifier,
  60-second invocation lifetime and Prisma nonce store. Each teacher-release
  v3 route is bound to the class service-bearer guard, per-route no-store
  headers, exact path/interface/dependency pins, parser/handler and default-off
  composition.
- N10: `c30/canonical-json.ts` is the sole RFC 8785 serializer; the family-growth
  module is a compatibility wrapper over that core. Valid JSON continues to use
  the same `JSON.stringify` primitive bytes, array order and UTF-16 key sorting,
  so existing valid persisted digest semantics are unchanged. Non-plain values,
  undefined, sparse/extended arrays, cycles, non-finite numbers and unpaired
  surrogates now fail closed. Tests include the RFC 8785 primitive, Unicode
  ordering and Appendix B number vectors plus lone-surrogate negatives.
- N11: cleanup-ledger receipt lookup has one shared implementation. The parser
  constructs `completed_at` once, checks `Number.isFinite(getTime())` before
  `toISOString()`, and returns `null` for corrupt values; the repository then
  reports its stable invalid-receipt error rather than leaking `RangeError`.
- No schema, migration, pin JSON, capability gate, runtime default, deployment
  or traffic change was made.

## 2026-08-13 — W5 N1/N3 hardening

- N1: prepared family-growth emissions now carry the exact workspace/local
  pair, child/family anchor IDs and aggregate versions, child/family
  association IDs and aggregate versions, the selected authorization IDs,
  aggregate versions, owner refs/versions, purpose, authorization-source refs/
  versions and expiries, current Guardian-role/Participant heads, the required
  canonical-owner evidence expiry, and the exact canonical child/family target
  returned by that exchange. The Serializable release transaction binds both
  the local tuple and canonical tuple to its loaded target and checks the whole
  chain with one `SELECT ... FOR SHARE` statement before its first retained
  write. Revocation/rebind updates must wait or conflict after lock acquisition;
  head/currentness/authority/expiry drift returns terminal
  `binding_unavailable`, while cross-pairing returns the distinct terminal
  `binding_target_mismatch`. Real-PostgreSQL lane cases at Read Committed,
  Repeatable Read and Serializable open the guard transaction and attempt
  revocation from a second connection mid-flight;
  the focused no-database suite pins the exact locking SQL shape.
- N3: Prisma now expresses composite release, release/visibility lineage and
  receipt/outbox relations. Migration
  `20260813120000_t011_family_growth_outbox_scope` adds four supporting uniques
  and three strictly stronger composite FKs while retaining all original FKs;
  it contains no drop or data mutation/backfill.
- Added the N3 schema-diff preview and migration plan, parsed static invariant
  guard, and a guarded three-phase qualification runner. Phase A replays from
  empty and runs the existing controls/probes. Phase B1 migrates to the
  previous head, seeds CHECK-valid coherent legacy rows, applies only T-011 and
  verifies populated validation. Phase B2 executes the exact failing FK in a
  rollback-only transaction, requires SQLSTATE `23503`, then records PASS only
  when the transactional migration aborts and leaves no T-011 object. The
  runner accepts only a loopback `t011_n3_*` URL, requires approval to repeat
  the literal database name and bind the SHA-256 of the exact URL, and censuses
  relations, sequences, routines, domains, enums and non-default extensions.
  Loopback/private-server assertions are defense-in-depth only and cannot prove
  local Docker ownership. Prisma CLI reasserts identity with the exact
  migration URL immediately before every deploy.
- The approved loopback disposable qualification executed against
  `t011_n3_disposable_20260813b`: phase A replayed all migrations from empty,
  phase B1 validated the populated previous-head upgrade, phase B2 passed by
  FK-caused abort with rollback proof, final emptiness passed, and the
  disposable containers were destroyed.
- Qualification release fixtures now derive digest/lifecycle values from the
  existing CHECK constraints. In particular `command_request_id_hash`, revision
  content identity and routing identity are 64-hex digests, replacing the
  invalid `qualification:<uuid>` placeholder that failed a real disposable run.
- Regenerated the Prisma client offline and refreshed/strictly verified the DB
  context contract. Default-off runtime posture and workflow pins are
  unchanged.

## 2026-08-13 — W5 scoped hardening (N2/N5/N6/N8)

- N2: `attemptCount` is now the delivery lease version. Receipt and transport
  failure settlement use `updateMany` CAS over event/workspace,
  `deliveryState=delivering`, and the exact attempt. A reclaimed lease makes
  the older completion an ignored no-op.
- N5: the worker structurally validates the stored release/lifecycle envelope,
  checks its row identity and canonical payload digest before transport, and
  binds receipt settlement to event, source scenario, source release and
  family coordinates.
- N6: receipt insertion count is inspected. Exact canonical replays may
  re-settle without a second evidence row; status/ref/time/payload differences
  return `receipt_conflict`, with the outbox CAS rolled back.
- N8: binding reads select only the cardinal current family association and
  follow its exact child-association id; updated historical rows cannot shadow
  the current chain.
- No Prisma schema, migration, route, configuration, dependency, activation or
  deployment change was made.

## 2026-08-13 — W5 review repairs (NR1–NR5)

- NR1: `recordReceipt` now parses the raw receipt and, inside its settlement
  transaction, loads and validates the stored outbox envelope before comparing
  release event, source scenario, source release and family coordinates. A
  mismatch returns `receipt_coordinate_mismatch` without settlement/evidence.
- NR2: a CAS miss now rereads current outbox/evidence state. An exact receipt
  against the matching terminal state returns `replayed` without mutation;
  `stale` is returned only when a newer attempt superseded the caller, while a
  same-attempt non-replay returns `not_settled`.
- NR3: the delivery decision retains the raw response body, and the repository
  canonicalizes/persists that full body (unknown fields included) for
  replay/conflict comparison. Receipt conflicts emit a structured warn record
  carrying the `family_growth_delivery_receipt_conflicts_total` increment-style
  signal.
- NR4: the `outcome_unknown` claim CAS now repeats the due-time predicate as
  well as the state predicate, preventing a candidate read from reclaiming a
  row concurrently moved into future backoff.
- NR5: the mocked hardening suite adds coordinate, replay-result, raw-content,
  CAS-scope, due-predicate and no-mutation assertions. Its source comment states
  that real PostgreSQL locking/rollback evidence is deferred to the T-011 N3
  disposable-target qualification run.
- No schema, migration, configuration, activation or default change was made.

## 2026-08-13 — W1 callback design draft v2

- Replaced the first callback draft with the owner-delegated v2 design after
  the independent adversarial review returned six REQUIRED findings.
- Froze exact event and receipt keys, RFC 8785 canonical-byte digest and replay
  rules, full receipt correlation, and complete frozen section-3 settlement
  parity.
- Added a one-terminal-outcome admission state machine, pre-receipt staging,
  lifecycle precedence, explicit coarsened teacher disclosure, and removal of
  `decision_time` from the wire.
- Required finite My-Chat expiry with a 30-day default and atomic closure plus
  outbox emission. Added bilateral gates, validator-first token sequencing,
  successor teacher DTO deployment and scoped golden-byte gates.
- No schema, route, token, deployment, activation or runtime change was made.
## 2026-08-14 — W3 parent communication P0 vertical slice

- Published `nurture.parent-communication-owner@1.0.0` at exact digest
  `sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f`
  with four closed request/response operations, nine positive fixtures and
  eight invalid fixtures. Summary has no member/message/media detail and an
  unavailable segment must expose zero unread; detail is explicit-open and
  bounded to 20 members/50 messages.
- Mounted summary, detail, media-access and send-text private routes in the
  formal scenario service. The explicit boolean gate defaults false and
  composition additionally requires service auth, a current-authority resolver,
  owner port and async-generation boundary.
- Send P0 is one semantic track: teacher text only, prepare creates no business
  fact, confirm retains the exact command id, replay is exact, and transport or
  commit ambiguity returns `outcome_unknown/reconcile_same_command`.
  A malformed or foreign confirm receipt uses the same result because the
  canonical write may already have happened; it is never downgraded to a
  generic retry with a new command.
  `class_group`, attachments and voice are not admitted into this command.
- Froze the protected-image access request/response policy, but made the P0
  runtime return `content_unavailable` after current-authority resolution. The
  access-stream path namespace is reserved but not mounted, preventing a ready
  access response that no ingress could honor.
- Removed unused schema fragments, made cache expiry explicit, fixed the
  scenario-service package typecheck root, raised the scenario-service test
  census to 19 and synchronized the env contract with a non-secret default-false
  flag. No database schema, migration, deploy, activation or traffic changed.
- Repaired the root runtime exports of `@the-nurture/scenario` and
  `@the-nurture/db` to resolve built `dist` modules while retaining TypeScript
  sources for types. The maintained scenario-service smoke now starts the real
  build and verifies the parent-communication owner is default-off.
- My-Chat T-039 adopted the exact digest through a strict private source,
  public API/client and dormant Mobile controller. The remaining next actions
  are: implement real owner/async ports, implement and qualify the media stream
  plus proxy if promoted into P1, and run controlled deployed/native
  qualification before either flag changes.

## 2026-08-14 — W3 P0 quality and governance closure

- Promoted the standalone parent-communication artifact validator to
  `pnpm verify:parent-communication-owner-contract` and made the maintained
  `verify:formal-ingress-contract` command invoke it before the runtime/route
  census. The validator now cannot silently drift as a manual-only deep-path
  script.
- The first promoted run exposed that direct `node` cannot execute the imported
  TypeScript canonicalizer under Node 25 strip-only mode. The named command now
  uses the repository's existing `tsx` runtime; no duplicate canonical JSON or
  JavaScript fallback was added.
- Cross-checked the exact owner key/version/digest, all four private paths,
  summary/detail read union and teacher-only write union against My-Chat
  `30a14d07d2bad6d7fbc2280ad1d46bece047632a`. My-Chat corrected its final
  Mobile DTO/constructor/Composer drift; `class_group` remains read-only and
  unavailable, not a second write track.
- Resealed the maintained cross-repo pin without changing Base/My-Chat contract
  parity, `x5_joint_api` or `wave4_binding_host` hashes. The Nurture scenario
  hash changed only because `package.json` now contains the maintained
  validator command. No database, deployment, activation or traffic action was
  performed.

## 2026-08-14 — W3.1 real local owner qualification

- Added one HTTP-free scenario contract for context selection, exact authority,
  owner/read and async-generation ports, then removed the duplicate service
  request/authority/binding declarations. The published `1.0.0` artifact and
  digest are unchanged.
- Added the explicit Prisma binding factory. Host current-context selection
  supplies only one Enrollment candidate; the resolver rereads the current
  Participant, Guardian role, current association/anchors, Enrollment,
  CareGroup/institution, primary family/process, private thread membership and
  purpose-scoped bidirectional Grant before every operation.
- Summary returns only availability and bounded unread counts. Teacher detail
  is explicit, capped, actor-ref protected, encrypted-cursor paginated and
  decrypts message bodies only after the exact owner chain succeeds. Summary
  and detail share one presentation head. `class_group` and media remain
  unavailable.
- Prepare writes only an encrypted, five-minute InteractionContext. Confirm
  reuses `NurtureCommandRunner`, the existing CommandExecution ledger and the
  existing G2 transaction to consume the token and atomically write
  Message/Item/ItemEvent/ChildLinkReceipt/Attention. Exact replay returns the
  stored opaque refs; the internal command hash now includes an actor-bound
  value so a second guardian cannot replay another guardian's result.
- Strengthened the existing family-care writer with an exact thread-head and
  full-scope CAS, propagated the command clock into its transaction, and kept
  the family-growth provider outbox restricted to its existing cross-owner
  release/lifecycle semantics. No generic local-message outbox or second
  persistence track was added.
- The final review repaired bounded-map recency eviction, latest receipt-head
  selection, control-character/surrogate-safe display text, association anchor
  currentness, PostgreSQL 17's reserved `authorization` alias, raw Date UTC
  comparisons and one raw workflow timestamp that violated its monotonicity
  trigger outside UTC.
- No Prisma schema, migration, dependency, environment default, deployment,
  activation or traffic change was made.

## 2026-08-14 — W4 read-only director presenter supply

- Published `nurture.director-presenter@1.0.0` at exact digest
  `sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9`
  with overview, bounded drilldown and protected-material query operations.
- Reconciled D-O13 with the current product authority: Institution Mobile is
  action-free, so W4 returns only `web_workbench_required`. The artifact and
  both strict runtimes reject action, confirmation, command, storage and URL
  fields instead of publishing an unauthorized Mobile command surface.
- Added current-authority and read-owner port contracts, exact request/response
  binding, service bearer authentication, private/no-store responses and one
  default-false provider gate. The runtime is unavailable unless every owner
  port and service-auth dependency is explicitly supplied.
- Added 12 conformance fixtures and eleven invalid probes, response-shape
  enforcement and three controller routes. The W4 validator is a maintained
  top-level command and is chained into formal-ingress verification.
- My-Chat T-039 adopted only the exact private consumer: it sends host routing
  context, validates the full response locally and fails closed on any drift.
  Public API/Mobile composition and any family archive/organization admission
  remain outside this batch.
- No real Prisma owner port, schema/migration, database operation, deployment,
  activation, traffic, native-device or accessibility work was performed.

## 2026-08-14 — W4 final quality closure

- Closed a page-replay gap by requiring every ready material response to echo
  the exact request cursor, including `null` for the first page. Provider
  composition and the My-Chat consumer both compare that value before use.
- Added ordered lifetime checks from current owner resolution through response
  generation, cache expiry and protected owner-stream access. Expired 2xx
  payloads now fail closed at the consumer instead of entering a retry loop.
- Empty and unavailable overview sections can no longer carry metrics, trends,
  drilldown refs or material refs. Ratio values require a valid denominator and
  cannot exceed it; photo presentations require alternative text.
- Hardened the private My-Chat source to accept only an HTTP(S) service origin
  and a control-free service token. Invalid 2xx payloads and 401/403/404
  responses become non-retryable `content_unavailable`; network and 5xx
  failures remain the only transport-retry path.
- Removed obsolete Mobile drawer-axis code after the shell moved to the native
  edge-aware drawer. Bottom-aligned interaction and selection sheets retain one
  vertical dismiss substrate; no duplicate gesture implementation remains.
- No owner business port, public API/Mobile composition, schema/migration,
  database operation, deployment, activation, traffic, Candidate identity or
  device claim was added.
