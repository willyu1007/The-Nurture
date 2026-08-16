# Implementation notes

## 2026-08-16 — Current-main reseal stage 2

- Minted the owner-adoption lock from committed Nurture source revision
  `d1d330fab91443d7da7581b0b0c176d6003ad090` after the exact My-Chat pin
  stage landed independently.
- The final owner source hash is
  `ddc985e63e4ac6e8e2bdec041fe4be89e97309950186f24bd39b176d0485255d`.
  My-Chat runtime revision/aggregate and all workflow contract/source hashes
  remain unchanged; only qualified repository heads and Nurture adoption
  profiles moved.
- No deployment, migration, gate activation, traffic or shared-worktree user
  change is part of the reseal.

## 2026-08-16 — Current-main reseal stage 1

- Adopted the My-Chat T-044 archive head
  `76651e4d29c84c31437a57862ff5eb42054780df` as the exact current-main host
  revision without changing any contract or source-profile hash.
- Rotated only the workflow pin and the three governed My-Chat revision
  literals used by G2, C30-I3 upstream and owner-adoption computation.
- Verified against a clean detached My-Chat worktree so the seven unrelated
  shared-worktree changes remain excluded. The owner-adoption lock is deferred
  until this first-stage source revision is committed.

## 2026-08-16 — Gray-status semantic reconciliation

- Reconciled the overview with already-landed W4.1 and My-Chat T-039 evidence:
  the director Prisma composition, guarded public API/client and approved
  Mobile Pulse grid are complete and default-off.
- Replaced the parser-invisible `Current next step` label with the governed
  `Next step` field. The remaining work is remote staging qualification,
  native/accessibility evidence and later activation, not additional W4
  repository composition.
- No contract, runtime, schema, migration, gate value, deployment or traffic
  state changed.

## 2026-08-15 — W3 final deep review

- Reviewed the complete six-commit cutover rather than only the final staging
  increment: one carrier codec/parser, seven protected routes, one shared
  association-to-selection mapper, exact authority-head rereads, production
  bindings, family ramp and the single staging path all remain intact.
- Found two `Promise.all` blocks issuing queries through the same Prisma
  interactive-transaction client in the W3 authority repository. Replaced
  them with explicit sequential awaits, matching the repository's pg@9 safety
  rule and the documented sequential-head-read semantics without changing any
  predicate or owner response.
- Replayed all 44 migrations into a second fresh disposable database after the
  repair and reran W3/W11 current-read, prepare/confirm, replay, cross-actor
  refusal, revocation rollback, redaction and receipt behavior. The target was
  destroyed after the green run.

## 2026-08-15 — W3 carrier cutover step 6

- Joint v1/v1.1 conformance, the seven private routes and production assembly
  were requalified against the exact current source pair.
- A loopback disposable PostgreSQL database replayed the complete migration
  history, then exercised current read, prepare, confirm, exact replay,
  cross-actor refusal, revocation rollback, W11 redaction and receipts.
- The replay found migration/Prisma drift from three retained id-only
  family-growth foreign keys. A forward repair removes only those redundant
  keys while preserving the stricter workspace-scoped replacements; 44/44
  status and zero database-to-datamodel diff now hold.
- My-Chat staging assets were generalized into one Nurture overlay, manifest
  and runbook. W3/W11 remain false in the rendered configuration, the W3
  family allowlist is empty, and the independent protected-content secret is
  wired without storing a value.
- No remote BWS request, image push, shared database migration, service deploy,
  authenticated canary traffic or gate flip occurred.

## 2026-08-15 — W3 carrier cutover step 5

- Scenario-service production assembly now exposes the existing real W3 v1
  and W11 v1.1 Prisma binding factories. They share the shutdown-managed
  Prisma client and exact integrity key with the other owner surfaces; W3 also
  requires the existing protected-content key used by encrypted prepare.
- Removed the obsolete startup refusal that claimed Nurture-owned Enrollment
  selection was absent. The only intentionally unassembled published surface
  remains the director presenter, whose Prisma composition is still missing.
- Both provider gates remain exact-literal, default-false and independent.
  All-off startup still creates no Prisma client, and an enabled W3/W11 gate
  still refuses missing service auth, database URL or integrity key; W3 also
  refuses a missing protected-content key.
- My-Chat completed the paired consumer half at `7f2da94` plus the current
  step: canonical-family allowlist, request-time gate reread and bounded
  identity-free outcome telemetry. No deployment, migration or traffic change
  occurred.

## 2026-08-15 — W2 explicit Enrollment selection and W3 readiness review

- Added the owner contract `my-chat.parent-context-selection@1.0.0`: canonical
  base64url JSON in `x-morethan-parent-context-selection`, exact pin and closed
  keys, carrying current context version plus opaque child/family owner refs and
  versions. The frozen W2 request/response contract did not change.
- Added the Nurture-owned `nurture_parent_context_enrollment_selection` table.
  The migration backfills only a unique formal Enrollment or a sole active
  Enrollment; ambiguity deliberately remains absent/fail-closed. Trial start
  creates only the first selection, formal acceptance advances it, and trial
  end clears its own selection.
- Reworked W2 authority to resolve exact binding anchors/association before the
  local selection, select the Guardian role through the exact thread
  membership, bound grant queries, and sequentially reread all heads inside
  interactive transactions. Multi-Enrollment is now deterministic without a
  cross-owner Enrollment id.
- My-Chat parent contexts include internal-only current Nurture binding
  evidence; public DTOs still map only canonical context fields. The BFF
  refuses W2 when either binding is absent and the strict client sends the
  shared carrier on every subrequest.
- W3 readiness review found the pre-carrier host-selected Enrollment port,
  direct caller-context forwarding, resolver cardinality/transaction issues
  and missing production composition. They are retained only as an explicit
  not-ready implementation seam and must be replaced in one cutover; see the
  readiness artifact. No staging/prod operation ran.

## 2026-08-15 — End-of-schedule deep review repairs (W7-W11)

Three adversarial review lanes (W10 stack, W11 stack, cross-batch closure
audit) ran after the schedule closed; every confirmed finding is repaired:

- W10 weekly-source/missing-records now REFUSE what the frozen schema
  cannot represent instead of clamping or truncating: class totals above
  9999 and classes above 80 children answer `unavailable /
  content_unavailable` (a clamped total was unservable — the runtime
  validator recomputes it from the children, so it was a guaranteed 500);
  the weekly draft keeps the W7 replay lesson (an existing (class, week)
  draft still answers through the ledger/domain, via a deterministic
  in-transaction refusal when a fresh draft would be unrepresentable).
  Reads dedupe duplicated child identities defensively (service and
  Prisma), and the weekly-draft target set fans a family out once per
  child.
- W10 confirmed-media counts now reduce the append-only attribution
  history to the CURRENT fact per (asset, child) — max live revision,
  `deletedAt: null` — so corrected/superseded confirmations no longer
  count and one photo can no longer count twice.
- Retryable ledger outcomes are honest across W10 and W11: results the
  kernel itself calls retryable (`isNurtureCommandRetryable` — busy locks,
  rolled-back write conflicts) map to `temporarily_unavailable`, and the
  repository's rollback classifier now recognizes unique-constraint aborts
  (P2002) as `command_write_conflict` — the (class, week) first-command
  race retries into `already_satisfied` instead of failing terminally.
- W11 replay honesty: the recorded result now carries the exact redacted
  message identity (`extensionMessageRef`); a retry naming a different
  message answers `command_payload_conflict` instead of confirming the
  wrong message. `cascade.affected_count` now reports exactly the reply
  count the preview promised (carried in the prepared state) — never the
  internal cascade fan-out, which leaked the receipt/recipient shape. The
  confirmation is consumed only AFTER the frozen preconditions accept, so
  a refused commit leaves it valid for the re-prepare.
- `host_request_id` is now constrained to the command kernel's id pattern
  in all five command-carrying parsers (W7-W11) — a malformed id dies as
  400 `invalid_*_request` instead of surfacing later as
  `content_unavailable`.
- Runtime hygiene from the closure audit: the five W7-W11 default-off
  codes plus `parent_communication_owner_disabled` no longer log spurious
  unhandled exceptions; `parent_communication_owner_disabled` is finally
  in the safe-code allowlist so the frozen v1 owner answers its own
  documented code (the v1 e2e had codified the degraded generic answer);
  unit/db population floors raised to the measured 1133/499.
- Recorded, not repaired (frozen artifacts): `safe_reason_codes` means
  transport codes in W8-W11 artifacts but domain degradation vocabulary in
  W6/W7 (the W2-W4 precedent). The digests are frozen and adopted, so the
  divergence stands as documented vocabulary; the forward rule is that new
  contracts declare transport codes under `transport`-scoped keys and keep
  `safe_reason_codes` for the domain vocabulary.

## 2026-08-15 — W11-4/W11-5 parent-communication extension registration and closure

- W11-4: registered the W11 fixtures in the service-candidate
  standalone-fixture list (now 9 entries); governance sync/lint clean.
- W11-5: sealed the digest-pin handoff
  (`artifacts/w11-parent-communication-extension-v1-1-digest-pin.md`);
  My-Chat adopted the dormant strict consumer at `df5af9d` (P-H05/P-H06
  `contract-ready`, axis recount 64/2/22/17) with the sanitized snapshot
  re-pinned to `6485afe`; the cross-repo pins resealed at
  `3a8e49e`→`9e41764` (see `04-verification.md`). W11 is closed end to
  end; the W6-W11 schedule is complete.

## 2026-08-15 — W11-3 parent-communication extension real owner ports

- Added the DB-free extension service
  (`src/parent-communication-extension-service.ts`): authority,
  presentation identity and message refs come from the SAME machinery the
  frozen v1 owner uses (the v1 resolver, the v1 read port and the exact v1
  ref HMAC, exported `presentationVersionFor`), so a ref the v1 detail
  issued resolves in the extension and nothing about the v1 surface moves.
  Message resolution runs over the thread's FULL id set (terminal states
  included — the W7/W8 replay lesson).
- The preview restates the frozen G4-C author-authority rule, refuses a
  stale presentation by masking `context_changed`, and issues the
  confirmation with the full prepared command (message id, expected head,
  minted cascade audit id, scope) in the interaction-context state.
- The commit follows the W8 confirm discipline exactly: the command
  identity is the confirmation digest + actor HMAC; the confirmation is
  verified and consumed INSIDE the command transaction, then the frozen
  `createRedactFamilyCareMessageSpec("author")` preconditions/apply/
  finalize run through composition — an exact replay short-circuits on the
  ledger and never re-touches the consumed confirmation. The recorded
  result is enriched with `redactedAt` and the cascade size (from the
  finalization refs) so replays answer the original apply evidence and
  `already_satisfied` never fabricates one.
- Prisma side: `PrismaParentCommunicationExtensionReadPort` (thread ids,
  bounded impact facts over item-linked replies and derived daily-care
  logs, receipt aggregate promoting read > delivered > sent with
  `not_applicable` only when every receipt is terminal) and
  `createPrismaParentCommunicationExtensionBinding` reusing the v1
  resolver/read repository, the family-care facts read and the generic
  command runner. No new kernel transaction and no schema change.

## 2026-08-15 — W11-2 parent-communication extension default-off runtime

- Mounted the three v1.1 routes in `apps/scenario-service` behind
  `NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` (independent of the
  frozen v1 gate) with the established runtime set: strict allowlist
  parsers (confirmation refs 32-256, `sha256:` preview digests validated
  at parse), the authority-rereading composition, the digest-pinned Ajv
  response validator and the guarded controller.
- W11-specific bindings: the preview must echo the exact
  `command_request_id`, `message_ref` and `presentation_version` it was
  asked for; the delivery read must echo its `message_ref`; committed
  redactions must echo command identity and message; the runtime
  validator enforces the applied-vs-already_satisfied evidence rule
  (instant+cascade exactly when applied) and the frozen reason→recovery
  pairing.
- Registration surface: safe codes allowlisted, env 5-file set
  regenerated, ingress census asserts the W11 block (controller-routes
  52), scenario-service routing census 26.

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
- Successor migration `20260815190000_align_family_growth_fk_ssot` supersedes
  that temporary additive posture: after clean replay proved the composite FKs
  preserve and strengthen the same referential guarantees, it removes the three
  redundant id-only FKs. The current static guard therefore requires the three
  composite constraints and rejects retention of their id-only predecessors;
  the earlier retention statement describes only the W5 migration checkpoint.
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

## 2026-08-15 — Joint gray-release readiness assessment (planning only)

- Assessed both repos against the "complete gray release" goal and froze
  the result in `artifacts/gray-release-readiness-v1.md` (gap list G1-G9,
  three parallel tracks, risk-ascending ramp order, pre-ramp checklist).
- Code-verified the three load-bearing facts: production `bootstrap()`
  constructs the application with no owner bindings injected (assembly is
  real pending work, doable before authorization while staying
  default-off); My-Chat has no rollout/feature-flag infrastructure (a
  minimal per-surface gate + allowlist control plane must be built
  host-side); both sides observe through structured logs only, so the
  three ramp metrics need a minimal aggregation answer.
- No code, schema, dependency, environment, deployment, activation or
  traffic change was made in this round; both heads and CIs are unchanged
  at assessment time (Nurture `4b388d1` / My-Chat `1cd1888`, green).

## 2026-08-15 — A2 scenario-service production assembly

- Added a production-only binding factory at the scenario-service bootstrap
  boundary. It delegates to the five existing `@the-nurture/db` Prisma
  composition factories for teacher class stream, organization,
  communication, media association and assistant query, then supplies those
  bindings to the existing application runtime factories.
- All enabled teacher bindings share one Prisma client. `main.ts` disconnects
  it on HTTP-server close and on application startup failure; the all-off path
  constructs neither a binding nor a Prisma client and emits no new log.
- At that point, enabling parent context or director refused startup with the
  missing-Prisma-composition reason. Parent context is now assembled; parent
  communication owner and extension still refuse until they cut over from the
  obsolete host-selected Enrollment seam to Nurture-owned selection.
- Enabled teacher surfaces fail startup before Prisma construction when
  service auth, `DATABASE_URL`, integrity-key material or required protected-
  content key material is absent. Refusals use the structured
  `nurture_scenario_service_log_v1` schema without exposing secret values.
- No enrollment-journey composition, schema, migration, dependency, package
  script, environment default, deployment, activation or traffic setting was
  changed.
- Handoff state: the verified A2 changes remain uncommitted because this
  worktree session cannot create the parent repository's
  `.git/worktrees/agent-a0e941a653300dd46/index.lock`. No file was partially
  staged. The next actor with Git metadata write access should stage the A2
  source, focused test, routing census and T-011 docs, then commit as
  `feat(service): assemble teacher bindings` with trailer `Task: T-011`;
  preserve the unrelated untracked `codex-run.log` and `codex-task.md`.

## 2026-08-15 — Wave 1 parallel closure (gray-release tracks)

- Closed the first parallel wave of the gray-release plan across both
  repos with four concurrent agents and a serial merge queue. Landed in
  this repo: the A2 production assembly (`dc92d97`, five teacher surfaces
  assembled, four unready gates fail fast), the `deploy/scenario-service/`
  preparation artifacts (`1fca2de`: Dockerfile with the two-checkout build
  context the `link:../My-Chat` workspace requires, full env manifest
  mapped to ramp waves, token issuance/rotation runbook), the cross-repo
  pin reseal pair (`1614037`/`834e360`) and the ramp-plan amendment
  (`3b95698`). Landed in My-Chat: the minimal ramp control plane
  (per-surface gate + allowlist, request-time env reads) and the first
  two BFF wirings (W2 parent-context routes migrated into a dedicated
  `nurture-bff` module, W6 teacher class-stream added), `83274e1`.
- The reseal surfaced a latent cross-repo debt: the P-G03 milestone
  migration had changed `prisma/schema.prisma`, a locked byte source in
  My-Chat's scenario-host-adoption lock, without the lock refresh. Fixed
  in My-Chat by advancing the compute script's pinned `sourceRevision`
  to the P-G03 head and regenerating the lock (`99fe4d2` + `99be59c`);
  the refresh procedure is three coupled steps in one commit.
- Gap progress: G2 (assembly), G5 (first wiring), G6 (control plane)
  closed; G3/G4 preparation artifacts done, their deployment halves wait
  on authorization. Open: G1 (authorization), G7 (metrics aggregation),
  G8 (joint rehearsal, needs G1+G3), G9 (UI batch — four mock files
  with A/B/C variants were delivered outside the repo; variant selection
  is deferred because a concurrent effort owns the UI line).
- Next queue (Wave 2, all authorization-independent): C1 director
  composition layer, the remaining seven client wirings on the My-Chat
  side, G7 minimal log aggregation, and the three supply gaps recorded
  in the ramp-plan amendment (W2/W4 real Prisma owner ports, production
  parent-communication context-selection adapter).
- Both heads closed green: this repo `3b95698`, My-Chat `99be59c`.

## 2026-08-15 — W6 current-main gray implementation

- Added allowlisted `_FILE` loading for scenario-service secrets. The W6
  runtime can now consume Compose file secrets for its dedicated database,
  service bearer and integrity key without placing values in rendered
  configuration. The migration Docker target runs Prisma through the same
  loader.
- Registered W6 provider route classes and `request_refused` events containing
  only request correlation, bounded route, HTTP status and safe reason.
- Added `scripts/summarize-gray-w6.mjs`, which joins provider completion/
  refusal logs and My-Chat ramp logs into outcome/reason/p95/timeout aggregates.
  W6 reconciliation is explicitly `not_applicable_read_only` with zero
  commands.
- Registered the internal scenario-service artifact and staging authorization
  in `ops/deploy`; remote execution remains human-owned through My-Chat's
  `staging-nurture.md` runbook.
- Parameterized the Docker base image so staging can use a reviewed private ACR
  digest. The long-running image has no public-listener deployment contract;
  My-Chat's overlay gives it only the private Compose network.
- The release choice is current-main, not the older T-008 Candidate 1.0.
  Candidate identity/evidence remains immutable and untouched.

## 2026-08-15 — W6 local My-Chat class-to-child-detail closure

- Added a maintained joint HTTP test in scenario-service that runs the actual
  My-Chat strict client through TCP, service bearer auth, Nurture request
  parsing, all four ingress operations and strict response validation.
- Kept the provider contract, digest, owner implementation and schema
  unchanged; the new test uses the frozen conformance fixtures and therefore
  detects cross-repository transport drift without creating a second contract.
- Re-ran the real Prisma W6 owner-port suite against the healthy local
  PostgreSQL service. Class context, strip, child day detail, schedule and
  fail-closed authority cases remain green on canonical rows.
- Updated G7 aggregation so both `class_stream_query` and
  `child_detail_query` are composite requests. Detail composites no longer
  inflate owner-call or timeout-rate denominators.

## 2026-08-15 — W2 parent-context production owner closure

- Added one shared scenario-layer W2 owner model and removed the service
  composition, runtime and HTTP parser's parallel local type definitions. The frozen
  `nurture.parent-context-presenter@1.0.0` JSON artifact and digest are
  unchanged.
- Added a conservative Prisma authority resolver. It requires exactly one
  current guardian participant path, current family/child association,
  enrollment, eligible `org_to_family` daily-care grant, private thread and
  guardian membership. Zero or multiple eligible enrollment paths mask the
  surface; the opaque host `context_ref` is never queried as a Nurture key or
  accepted as permission.
- Added exact-head rereads for every repository read and command commit.
  Shared `NurtureDailyCareLog` rows supply the day, care-card and activity
  views; canonical attendance submission/entry rows supply attendance; grant-
  bound link receipts supply notices. No media stream, diagnosis, prescription
  or raw domain-enum payload is synthesized.
- Notification projection excludes `failed` and `blocked` receipts that never
  became family-visible. Only delivered/read/acknowledged and previously
  delivered-but-revoked rows may produce a notice. The owner also masks a
  direct call whose resolved authority is bound to a different `context_ref`.
- Implemented notice-read prepare/confirm on the existing interaction-context
  and generic command-ledger machinery. The transaction rechecks the complete
  authority head, binds actor/scope/action/version/preview digest, advances an
  eligible delivered receipt to read, and preserves exact same-command replay.
  Busy or technical commit outcomes remain `outcome_unknown` and are safe to
  reconcile with the same command.
- Added the Prisma composition to scenario-service production assembly. W2 now
  shares the existing shutdown-managed client with the five teacher bindings;
  the all-off path still constructs no client and the gate remains false by
  default. Production refusals are now limited to W4 director and the two
  parent-communication surfaces that still require the shared carrier and
  Nurture-owned selection cutover.
- Registered the W2 validator as the named
  `verify:parent-context-presenter-contract` command and included it in the
  maintained formal-ingress gate; the production-DB routing census advances by
  exactly the new W2 integration file.
- Added no Prisma schema, migration, dependency, contract version, gate
  default, deployment, activation or traffic change.
- Handoff state: all W2 source, tests, docs and the first-phase
  `nurtureScenario.contractSha256` reseal are verified but uncommitted. Next:
  (1) commit this work unit with `Task: T-011`; (2) from the resulting clean
  HEAD run `pnpm reseal:pins lock`; (3) verify and commit the regenerated C30
  owner-adoption lock separately. W4 composition and the production
  parent-communication carrier cutover remains later, independent work.
  Superseded on 2026-08-15: W2 now adds the explicit local selection migration;
  W3 must replace, not implement, the old host-selected Enrollment adapter.

## 2026-08-15 — W3 carrier cutover step 1

- Extracted W2's carrier identity/binding validation, exact current
  child-family association lookup and local Enrollment selection lookup into
  one Nurture DB mapper. The mapper returns routing facts only and explicitly
  requires each consumer to perform its own operation authority checks.
- W2 now consumes that mapper inside the same repeatable-read transaction. Its
  Participant-first authority precedence, local selection version, bounded
  cardinality, lifecycle checks and exact authority head remain unchanged.
- Removed the former inline association/selection implementation. A source
  census finds one binding parser and one local-selection query in the DB
  package; no compatibility adapter or second mapping track was retained.
- No W3/W11 request parsing, authority behavior, schema, migration, contract,
  gate, deployment or traffic setting changed in this step.

## 2026-08-15 — W3 carrier cutover step 2

- Extracted the canonical base64url/JSON carrier parser from the W2-specific
  HTTP module into one shared scenario-service ingress parser. W2 retains its
  existing public 400 semantics through a thin error adapter; W3 and W11 now
  use the same bytes, contract pin, exact-key and identity-binding checks.
- All four v1 and all three v1.1 controllers require the carrier after body
  validation and before composition execution. Missing, malformed, foreign or
  contract-drifted carriers fail as private `invalid_request`; authority and
  owner ports are not called.
- Passed the parsed carrier through the v1 authority resolver input and the
  v1.1 resolver/owner-internal resolution. The frozen v1/v1.1 request and
  response bodies, paths and digests are unchanged.
- Retained the obsolete DB context-selection port only until step 3 replaces
  its authority implementation; no production binding can be enabled in this
  intermediate state.
- No schema, migration, environment default, production binding, deployment,
  activation or traffic change was made.

## 2026-08-15 — W3 carrier cutover step 3

- Removed `ParentCommunicationContextSelectionPortV1` and every
  `contextSelection` factory parameter/test stub. No Nurture-local Enrollment
  id can now enter W3/W11 from My-Chat or another host adapter.
- W3 resolves the carrier's exact current child-family association and binding
  versions through the step-1 mapper, then reads the Nurture-owned selection,
  then resolves Participant, Guardian role, family-care thread membership and
  bidirectional family-care Grant. Zero/multiple/missing/stale states fail
  closed with bounded cardinality.
- W11 still composes the same v1 resolver and read repository. Its internal
  resolution carries the already-validated carrier so every owner-side
  redaction/receipt reread uses the same route without changing a frozen body.
- Added child/family anchor heads and local selection version to the internal
  exact authority. Every read and command reread now checks association,
  anchors, selection, Enrollment, CareGroup, institution, family, process,
  role, thread, membership and Grant before using facts.
- Removed the former primary-family shortcut. The exact current family binding
  and Nurture association are the routing fact; My-Chat family identity still
  grants no scenario permission.
- No schema, migration, contract artifact, gate default, production binding,
  deployment, activation or traffic setting changed.

## 2026-08-15 — W4 Prisma composition step 1

- Froze one maintained source matrix for D-O01 through D-O14. It binds each
  ready section to current canonical rows and records why philosophy insight
  and protected material access must remain explicitly unavailable rather
  than be inferred from free-form JSON or storage metadata.
- Required Participant -> institution Admin role -> active Institution
  cardinality and exact-head reread on every operation. Host `context_ref`
  remains routing/cache input only; every emitted navigation/page ref will be
  owner-issued and integrity protected.
- Reused the existing configured-load support-signal owner as the sole D-O09
  threshold source. No director projection table, policy, threshold, cache,
  identity mapping, or protected-material access track was introduced.
- Fixed the implementation boundary: scenario owns presentation semantics,
  DB owns bounded canonical facts, and scenario-service retains transport,
  schema enforcement, and the unchanged default-false gate.
- Added no product code, schema, migration, environment default, deployment,
  activation, traffic, public API, or Mobile business composition in this
  freeze step.

## 2026-08-15 — W4 Prisma composition step 2

- Added one database-free director presenter service. It resolves exactly one
  current Participant, institution-scoped Admin role and active Institution,
  keeps the exact heads private, and emits only opaque owner/cache/navigation
  refs. Overview composition has exactly the published eleven sections;
  philosophy insight and organized materials remain honestly unavailable and
  D-O13 remains `web_workbench_required` without an action surface.
- Added one Prisma read repository in `@the-nurture/db`. Overview and
  drilldown reads rerun exact Participant/role/Institution predicates inside
  repeatable-read transactions, use only the step-1 source matrix and bound
  classes, Enrollments, response items, messages, focus scopes and drilldown
  rows. No presenter projection, cache table, threshold or storage-ref read was
  introduced.
- Reused the existing institution support-signal query structurally for
  `configured_load_threshold`; the presenter does not import its repository,
  duplicate policy evaluation or rank staff. Missing policy/source data marks
  only that section unavailable.
- Centralized the request/authority/owner types in the scenario package and
  made scenario-service retain only parsing, composition binding and published
  response enforcement. An attempted package subpath added no behavioral
  value and failed the maintained runtime resolver, so it was removed rather
  than retained as a second package entry.
- Focused negative testing found that Node's hex decoder tolerates a trailing
  half-byte. Drilldown signatures now require exactly 64 lowercase hex digits
  before constant-time comparison; appended-character, workspace-switch and
  expiry probes all mask the ref.
- Invalid counts, impossible ratios and malformed seven-day series fail to an
  unavailable section instead of being clamped or rendered. Attendance counts
  unique child-care processes so duplicate joined rows cannot inflate the
  numerator.
- Added no schema, migration, frozen contract, gate default, production
  assembly, deployment, activation, public API or Mobile business rendering.

## 2026-08-15 — W4 Prisma composition step 3

- Added one `createPrismaDirectorPresenterBinding` factory. It composes the
  step-2 Prisma read repository, the DB-free presenter and the existing
  configured-load support-signal repository plus institution authority chain.
  The same integrity key protects presenter refs and exact-owner support refs;
  no second threshold or support projection was added.
- Added the director binding to the scenario-service production assembly. It
  uses the same lazily constructed, shutdown-managed Prisma client as all eight
  existing production bindings and flows through the application input that
  already creates the published composition.
- Removed the sole obsolete production refusal stating that the director had
  no Prisma composition. No generic refusal layer or compatibility branch was
  retained because every declared production surface now has a concrete
  factory.
- Reused the scenario package's `DirectorPresenterOwnerBindingV1` in the
  scenario-service runtime instead of keeping a second structurally identical
  binding type.
- The director gate still parses only the exact `true` literal and remains
  false in the environment SSOT/defaults. Director composition needs service
  auth, `DATABASE_URL` and the existing integrity key, but correctly does not
  require the protected-content key because W4.1 never opens protected
  material.
- Added no schema, migration, environment value, contract, deployment,
  activation, public API or Mobile business rendering.

## 2026-08-15 — W4 Prisma composition step 4

- Moved overview `generated_at` and cache-expiry creation after the independent
  configured-load source finishes. A slow support read can no longer consume
  the advertised response lifetime before the response is composed.
- Made ready-response time monotonic against the resolved authority instant.
  If the process clock moves backward, `generated_at` is clamped to
  `resolved_at` and the cache still receives a fresh bounded lifetime rather
  than violating the published ordering invariant.
- Added explicit context replacement checks at the start of overview,
  drilldown and material operations. A mismatched owner invocation masks with
  `context_changed` before any source or authority read.
- Added generated-owner conformance coverage through the real scenario-service
  composition and published response validator. The test exercises overview,
  signed drilldown and protected-material denial, pins cache operation/query
  binding and proves that exact Participant/role/Institution ids and action
  fields do not escape.
- Expanded focused adversarial coverage for slow sources, clock rollback,
  owner-side scope loss, class-load reopen after revocation, material per-open
  authority, signature suffix tampering, cross-Workspace reuse and expiry.
  Existing formal-ingress fixtures continue to cover ready material cursor
  binding and reject cursor drift even though W4.1 issues no material
  collection ref.
- D-O12 still never reads a storage ref or protected body and always returns
  `protected_material_denied` after current authority. D-O13 still emits only
  an unavailable `web_workbench_required` section with no operation command.
- Added no schema, migration, contract, gate, production assembly, deployment,
  activation, public API or Mobile business rendering.

## 2026-08-15 — W4 Prisma composition step 5

- Added one real PostgreSQL integration lane for the production Prisma
  director binding. Its canonical fixture exercises all currently available
  overview sources, the reused configured-load policy owner, signed attendance
  drilldown and the deliberately denied protected-material open.
- The first disposable run rejected an incomplete G2 care-item fixture at the
  database constraint. The fixture now carries a distinct canonical source
  message and Grant for each item rather than bypassing the complete-graph
  invariant. Institution Admin disclosure is represented by the existing
  policy-snapshot contract, so the configured-load result comes through its
  real protected business-communication owner.
- The schema also proved that duplicate Participant identities and duplicate
  identical role assignments cannot be fabricated. Ambiguity coverage now
  models the valid risk: one My-Chat user with two current Institution Admin
  scopes. The exact authority resolver closes it as `ambiguous_institution`.
- The same owner lane proves current canonical counts, honest unavailable
  sections, cross-Workspace isolation, stale-authority masking and both old-
  token and new-resolution closure after role revocation.
- Replayed all 44 repository migrations into the exact disposable database,
  confirmed migration status and zero Prisma schema diff, then dropped that
  database and proved its absence. No shared, staging or production database
  was contacted.
- Reconciled the maintained test-routing census for the W4 unit, scenario-
  service owner-validator and PostgreSQL integration files. No test is left
  unclassified or silently admitted to the wrong lane.
- Added no schema, migration, contract, gate, environment value, deployment,
  activation, public API or Mobile business rendering.

## 2026-08-15 — W4 Prisma composition step 6

- Replaced the director repository's UTC-midnight shortcut with the existing
  Institution publication-policy local-day owner. Attendance/activity keep the
  canonical storage date; response, flow, authorization, focus and seven-day
  trend windows use timezone-correct instants, including non-24-hour days.
  Missing or invalid policy now makes date-bound sections honestly unavailable
  instead of guessing UTC.
- Capped request-time rows at the exact owner snapshot, required canonical G2
  writer graphs for response/message metrics, restricted authorization-change
  counts to current active Enrollments, and rejected a child process with two
  active class Enrollments from the aggregate attendance ratio. Drilldowns use
  the same predicates as their overview sections.
- Reused the shared active-role window helper and retained one repository,
  presenter, production factory and response-enforcement path. No compatibility
  lane, projection table, material reader or director action path was added.
- Expanded the real PostgreSQL lane with policy-timezone boundaries, a future
  canonical row beyond the snapshot, pre-G2 default axes and a revoked Grant
  attached to an inactive Enrollment. Those rows no longer change W4 metrics.
- The full scenario-service DB lane exposed a stale N8 fixture that still used
  `my_chat_child_identity` as binding authorization provenance. It now creates
  the current Guardian role and binds both owner authorizations to that exact
  role/version; no legacy acceptance branch was introduced.
- Updated the maintained gray-readiness artifact: G2 production assembly and
  W4 provider owner supply are closed, while the My-Chat director composition,
  deployment and activation gates remain explicitly separate.
- Resealed current clean My-Chat `main` pins after its already-landed parent
  carrier/ramp work. The W4 contract digest remains byte-identical and all
  provider gates remain false.
- Added no schema, migration, contract, environment value, deployment,
  activation, public API or Mobile business rendering.
