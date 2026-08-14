# W8 Scope Freeze — nurture.teacher-communication-owner@1.0.0

Frozen 2026-08-14 under the W6-W11 schedule
(`w6-teacher-supply-schedule.md`). W8 completes the teacher communication
sheet by lifting the W3 `parent-communication-owner` shape family to the
teacher actor over the same canonical thread/message rows, plus the staged
withdrawal that closes the organization lane's pre-send lifecycle. Changes
after this point follow the append-only correction convention.

## Interface identity

- Key/version: `nurture.teacher-communication-owner@1.0.0`
- Kind: `private_owner_exchange` (reads plus command exchanges)
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `initiate_caregiver_direct_message@1.0.0` (vocabulary only),
  `organize_care_capture_batch@1.0.0` (staged-item provenance only)
- Transport: POST, JSON, service bearer, `Cache-Control: private, no-store`
- Env gate: `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` (optional,
  non-secret, default false); composition additionally requires the service
  token and complete authority/owner/protected-content ports (fail-closed
  factory)
- Safe reason codes: `teacher_communication_owner_disabled`,
  `invalid_teacher_communication_request`,
  `teacher_communication_contract_mismatch`

## Operations and consumer rows

Base path `/internal/nurture/teacher-communication-owner/v1/`:

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `targets_query` | `targets` | T-C02, T-S04 | The class's conversation rail: one entry per active family thread of the exact CareGroup (opaque `thread_ref`, family/child safe labels, unread count from the teacher's own participant cursor, `latest_message_at`), a leading `class_group` entry frozen `send_availability: "unavailable"` with closed reason `class_group_reserved` (P0 rule; no separate decision exists), and the class-level unread summary the T-S04 badge renders. Bounded ≤80 threads, owner-ordered by latest activity. |
| `membership_query` | `membership` | T-C03 | Display-safe members of one thread (W3 `member` shape: `member_ref`, `display_name` ≤80, `role_display` ≤40); owner-resolved, never raw participant/role identifiers. |
| `timeline_query` | `timeline` | T-C04 | Bounded cursored page over one thread (W3 detail split): text messages (sealed bodies unsealed to bounded display copy), media messages as presence descriptors only (no bytes, no access op — the media ingress stays reserved for W9), system/instruction receipts; every message carries sender kind (`parent`/`teacher`/`system`/`agent`), explicit agent authorship, sent instant and delivery/read state. The response echoes the exact request cursor (`null` for the first page, per the W4 replay rule). |
| `send_text_exchange` | `send-text` | T-C09 | Manual teacher text into one family thread — the W3 prepare/confirm union re-run for the teacher actor: prepare rereads authority, seals the body, returns a single-use five-minute body-free `confirmation_ref` plus preview digest; confirm re-submits the digest pair and lands `committed`/`not_committed`/`outcome_unknown` with same-command reconciliation. Sending to families is an outward business effect, so the two-step confirm applies (the W7 class-internal exemption does not). Text only; voice stays excluded. |
| `withdraw_staged_exchange` | `withdraw-staged` | T-C07, T-C05 closure | Single-step withdrawal of one **staged** (pending_release) publish process through the frozen `cancelPublishProcess` rule; class-internal (families never saw the item), so no confirmation gesture. Result mirrors the cancel facts: `withdrawn`/`already_withdrawn` inside `committed`; the closed `not_committed` set covers state conflicts. Sent-message withdrawal is a **different lifecycle explicitly out of this contract**. |
| `mark_read_exchange` | `mark-read` | T-C02 usability | Single-step, class-internal: advances the teacher's own thread cursor to an owner-issued `message_ref` (never backwards, never another participant's cursor). Idempotent by domain design (`already_satisfied`); reads never write, so this is the only way a badge clears. |

## Authority and command model

- Caller context and forbidden request fields identical to W6/W7 (routing
  only; `participant_id`/`role`/`family_id`/`thread_id`/... fatal).
  `class_ref` is the W6 ref family; `thread_ref`, `message_ref`,
  `process_ref` are owner-issued opaque refs resolved by candidate matching
  within the exact CareGroup; foreign or stale refs purge (`masked`,
  `access_changed`) without existence leaks.
- Every operation rereads the current caregiver/lead_caregiver
  RoleAssignment for the exact CareGroup (W6 resolver pattern); reads echo
  the resolved envelope verbatim; `query_key` derivations: targets =
  `class_ref`, membership = `thread_ref`, timeline = `thread_ref|cursor`
  (cursor rendered `first` when null).
- Unread counts derive from the teacher's own
  `NurtureFamilyCareThreadParticipant` cursor; a teacher without a
  participant row on a thread sees `unread_count` equal to the bounded
  message total (never negative, capped 99) — the owner does not fabricate
  cursors on read.
- Exchanges run on the generic Nurture command ledger with the W7 actor
  HMAC folded into every canonical payload: exact same-command replay
  answers the recorded result (`executed: replayed`); cross-actor or
  divergent reuse lands `command_payload_conflict`
  (`command_actor_mismatch` stays reserved). `outcome_unknown` recovery is
  exact same-command replay.
- Read vs command admissibility are derived separately; a rail entry
  reporting a thread as sendable is never itself authorization.

## Port set (implemented in-wave, W3.1 style)

- `TeacherCommunicationAuthorityResolverV1` — W6-pattern caregiver
  resolver (context read port reused structurally).
- `TeacherCommunicationOwnerV1` — the six operations over
  `{ request, authority }`.
- Real composition in `packages/nurture-db`:
  `createPrismaTeacherCommunicationBinding({ prisma, integrityKey,
  protectedContent, now })`, reusing the family-care thread/participant/
  message rows, the protected-content port for body unsealing/sealing, the
  command ledger (`PrismaNurtureCommandRepository`), the family-care send
  write path (thread message + item/event/receipt rows exactly as the W3
  confirm writes them, with the teacher as sender), `cancelPublishProcess`
  facts/apply, and a new cursor write (`applyThreadReadCursor`) plus a
  teacher thread/timeline read port. Expected schema change: none; if a
  gap emerges it routes through the DB-SSOT process as its own step.

## Negative matrix (fixture-backed, minimum)

W6/W7 set (not_authorized variants incl. guardian, stale/cross-scope
refs, disabled gate, service auth, forbidden request field, hidden
payload, digest mismatch) plus per-write: cross-actor replay denial,
confirmation expiry/single-use/foreign/digest-mismatch (send), divergent
same-command payload conflict, `outcome_unknown` same-command recovery,
withdraw on a non-staged process (closed reason), backwards or foreign
mark-read denial, `class_group` send attempt rejected at parse (no such
operation input), cursor echo violation (timeline), voice/media send
rejection.

## T-C05 / T-C08 assessment (recorded per the schedule)

- T-C05 (staged content visibility): the W7 organization read already
  carries origin, state, `scheduled_at`, recipients and the quick-adjust
  window per staged card; with W8's staged withdrawal the staged-item
  loop (see → withdraw) closes without a new DTO. T-C05 moves to
  contract-ready at W8-5 on that basis.
- T-C08 (scheduled delivery policy/action) stays blocked on product
  decision I-Q1; nothing here schedules, sends automatically, or extends
  the owner schedule contract.

## Implementation order

1. **W8-1 contract artifact**: owner-contract JSON + fixtures + validator +
   README; digest minted to its homes; validator chained into
   `verify:formal-ingress-contract`.
2. **W8-2 runtime**: 五件套 + config flag + safe codes + e2e + config
   tests; censuses.
3. **W8-3 real owner ports**: domain service + Prisma binding + unit lane +
   production-DB lane.
4. **W8-4 registration**: env 5-file set, context registry, candidate
   fixture list, governance sync, full battery.
5. **W8-5 handoff**: digest-pin artifact + My-Chat snapshot refresh +
   dormant strict consumer + matrix rows
   (T-C02/T-C03/T-C04/T-C05/T-C07/T-C09/T-S04).

## Explicitly out of W8

`class_group` send (reserved, closed reason frozen), sent-message
withdrawal/correction lifecycles, scheduled delivery (I-Q1), voice input,
media bytes/access (W9), any activation, durable apply, deployment, or
traffic claim. The frozen G5-A Candidate is untouched.
