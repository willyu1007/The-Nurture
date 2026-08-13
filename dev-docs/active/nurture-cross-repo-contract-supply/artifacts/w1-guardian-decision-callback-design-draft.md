# W1 Guardian-Decision Callback — Joint Design Record

Status: FROZEN_JOINT_DESIGN (2026-08-13, owner-delegated review mode). No
human My-Chat sign-off occurred; the substitute freeze gate — an
independent adversarial review with zero unresolved REQUIRED findings —
passed on the fourth round (rounds 1-2 structural, round 3 three
surgical items, round 4 FREEZE-READY; review artifacts are retained in
the session record and summarized in the project changelog). This record
supersedes the v1 draft in full. Implementation ships only default-off
and only after the W5 settlement-surface hardening lands (per the W5
ledger sequencing rule).

## Decision summary

The callback is an additive, default-off
`family_growth_transport@1.1.0` push channel from My-Chat to Nurture. The
frozen [`family_growth_transport@1.0.0` addendum][transport-v1] and its
release, lifecycle and admission-receipt contracts remain unchanged.

The terminal wire vocabulary is intentionally limited to:

- `activated`: the pending admission became the active family material.
- `cannot_activate`: the pending admission terminally ended without
  activation.

My-Chat MUST bar guardian activation at `expires_at` and terminally close
every post-cutover `1.1.0` pending admission no later than
`expires_at + 24h` (the sweep-lag bound). The default configured bound is
30 days and the maximum is 365 days.
Every guardian decision or expiry closure for an eligible admission MUST
atomically write the canonical terminal record and its callback outbox event.
Pre-cutover admissions retain `1.0.0` semantics unless one admission is
explicitly upgraded by the idempotent backfill command defined below.

The teacher surface is explicitly permitted to learn that a pending admission
terminally could not activate. It MUST NOT learn why. The wire carries no
decision time or reason. Nurture records only its own local `received_at` for
operational evidence and correlates audits to My-Chat's canonical record by
`decision_event_id`.

## Problem and scope

Transport `1.0.0` settles a release request through one synchronous admission
receipt and specifies no later callback. A
`pending_guardian_confirmation` receipt therefore leaves Nurture's teacher
queue pending even after My-Chat reaches a terminal admission outcome.

Version `1.1.0` adds only:

- one My-Chat-to-Nurture push endpoint;
- one decision-event contract and one receipt contract;
- a terminal admission projection and a versioned teacher-provider DTO; and
- a mandatory finite My-Chat expiry path for post-cutover and explicitly
  upgraded admissions.

The channel does not transfer authorization. My-Chat remains the canonical
admission owner. Nurture treats the event as delivery evidence and checks it
against the existing local release and admission coordinates.

## Endpoint, gates and authentication

The endpoint is:

`POST /internal/family-growth/guardian-decisions`

It accepts exactly one event per request and does not batch. My-Chat sends a
static Bearer token in the same mechanism as transport `1.0.0`. The new token
is capability-scoped and MUST NOT reuse either existing transport token or
`NURTURE_INTERNAL_SERVICE_TOKEN`.

The fixed configuration names are:

- Nurture current validator value, which is mandatory:
  `FAMILY_GROWTH_DECISION_SERVICE_TOKEN`.
- Nurture previous validator value, which is optional:
  `FAMILY_GROWTH_DECISION_SERVICE_TOKEN_PREVIOUS`.
- Nurture receiver gate:
  `FAMILY_GROWTH_GUARDIAN_DECISION_RECEIVER_ENABLED`.
- My-Chat sender gate:
  `FAMILY_GROWTH_GUARDIAN_DECISION_SENDER_ENABLED`.

The sender and receiver gates are independent and default to disabled. A
missing or invalid current validator value fails closed: Nurture MUST NOT
enable the receiver or accept callback traffic. Absence of `_PREVIOUS` is the
normal post-rotation state and MUST NOT disable a valid current token. If
`_PREVIOUS` is present but invalid, Nurture rejects that previous credential
without disabling the valid current credential. Receiver readiness does not
enable the sender, and possessing a valid token does not enable either gate.

Token comparison MUST be timing-safe and tokens MUST contain at least 16
characters. Joint ownership and validator-first rotation are specified under
`Bilateral rollout and rotation`.

## Decision event schema

`family_growth_guardian_decision@1.0.0` is one JSON object. Unknown keys,
duplicate keys, `null` in place of a value and keys described as forbidden
below MUST be rejected.

The exact keys are:

- `contract_key`: the literal `family_growth_guardian_decision`.
- `contract_version`: the literal `1.0.0`.
- `decision_event_id`: an opaque My-Chat event ID, string length 1..256.
- `payload_digest`: lowercase hexadecimal SHA-256, exactly 64 characters.
- `admission_ref`: the opaque My-Chat admission ref, string length 1..256.
- `release_event_id`: the original Nurture release event ID, string length
  1..256.
- `source_scenario_key`: the original release source scenario key, matching
  `^[a-z][a-z0-9_]{0,63}$`.
- `source_release_ref`: the original Nurture publication release ref, string
  length 1..256.
- `family_id`: the original opaque My-Chat family ID, string length 1..256.
- `decision`: exactly `activated` or `cannot_activate`.
- `material_ref`: an opaque My-Chat material ref, string length 1..256;
  required only for `activated` and forbidden for `cannot_activate`.

`decision_time`, `occurred_at`, `reason_code` and every guardian, policy,
expiry or revocation detail are forbidden. There are no other optional keys.

### Digest and canonical request bytes

The sender MUST compute `payload_digest` as follows:

1. Construct the complete event object except for `payload_digest`.
2. Serialize that object with RFC 8785 JSON Canonicalization Scheme (JCS).
3. Hash the exact UTF-8 JCS bytes with SHA-256.
4. Encode the digest as 64 lowercase hexadecimal characters.
5. Add `payload_digest`, JCS-serialize the full event object, and send those
   exact bytes as the request body.

The digest scope is therefore every event field other than
`payload_digest`, including `decision_event_id` and the conditional
`material_ref`. The hash is over the raw JCS UTF-8 byte sequence, not a parsed
object, platform-native serialization or selected-field projection.

Nurture MUST use a duplicate-detecting JSON parser, validate the exact schema,
remove only `payload_digest`, recompute the RFC 8785 JCS bytes and SHA-256, and
compare the result to `payload_digest`. Nurture MUST also JCS-serialize the
full parsed object and compare those bytes byte-for-byte with the raw request
body.

A byte-order mark, duplicate key, lone surrogate, unknown key, non-JCS key
order, alternate escaping, insignificant whitespace, trailing bytes or digest
mismatch is invalid. Nurture MUST reject the request before the event ledger
or admission projection mutates. The rejection is a non-200 response without
a valid receipt, so the sender retains `outcome_unknown` and raises operator
attention rather than falsely settling a contract-invalid event.

### Replay identity and `decision_event_id` uniqueness

Nurture MUST persist the complete validated raw canonical request bytes. The
receiver ledger has a unique constraint on `decision_event_id`. On a unique
constraint collision, Nurture MUST compare the incoming full raw canonical
payload with the stored full raw canonical payload.

Every schema-valid attempt that produces a receipt, including `rejected` and
`conflict`, MUST atomically persist the exact request and receipt bytes before
responding. A divergent ID reuse is stored in append-only collision evidence,
keyed by `decision_event_id` and a receiver-computed hash of the full raw
request. Collision evidence does not become the canonical admission event or
weaken the primary `decision_event_id` uniqueness constraint.

- Byte-for-byte equality, including the declared `payload_digest`, is an exact
  replay. Nurture returns the exact persisted receipt bytes and performs no
  new mutation.
- A repeated divergent payload that exactly matches stored collision evidence
  returns that evidence's exact persisted `conflict` receipt bytes.
- Any other byte difference is a new `conflict`, even if known fields or the
  declared digest appear equal. Nurture performs no admission or
  teacher-projection mutation and atomically persists a valid correlated
  `conflict` receipt with the collision evidence.

Comparing only selected fields, parsed known fields or a claimed digest is
forbidden. This preserves the [W5 N6 full-raw evidence lesson][w5-n6]: a
duplicate identifier may be re-settled only when its canonical payload is
identical; differing content is conflicting evidence.

## Decision receipt schema and validity

The synchronous HTTP `200` body is one JCS-encoded
`family_growth_guardian_decision_receipt@1.0.0` JSON object. Its exact keys
are:

- `contract_key`: the literal
  `family_growth_guardian_decision_receipt`.
- `contract_version`: the literal `1.0.0`.
- `receipt_id`: an opaque Nurture receipt ID, string length 1..256.
- `decision_event_id`: exact echo of the request value.
- `payload_digest`: exact echo of the request value.
- `admission_ref`: exact echo of the request value.
- `release_event_id`: exact echo of the request value.
- `source_scenario_key`: exact echo of the request value.
- `source_release_ref`: exact echo of the request value.
- `family_id`: exact echo of the request value.
- `decision`: exact echo of the request value.
- `material_ref`: exact echo of the request value; required only when the
  event contains it and otherwise forbidden.
- `status`: exactly `applied`, `duplicate`, `rejected` or `conflict`.

There are no optional receipt keys other than the conditional
`material_ref`. In particular, the receipt has no time or reason field.

A receipt is valid only when all of these conditions hold:

- HTTP status is `200` and the body is parseable, duplicate-free JSON.
- The raw body is exactly the RFC 8785 JCS serialization of the parsed body.
- The body has exactly the keys and values allowed by the receipt schema.
- Every event, digest, admission and release coordinate listed above equals
  the sent event, including `decision` and conditional `material_ref`.
- `receipt_id` and `status` satisfy their value constraints.

My-Chat MUST treat an unknown key, duplicate key, non-JCS body, missing echo,
extra `material_ref` or any mismatched echo as an invalid receipt. A response
body on any non-200 status is not a receipt.

The receipt statuses have these precise meanings:

- `applied`: Nurture durably accepted this new event. It either terminalized
  the matching pending projection or durably staged the event until the
  matching pending receipt arrives.
- `duplicate`: this is a new `decision_event_id` whose full admission
  coordinates, decision and conditional `material_ref` exactly match the one
  terminal outcome already recorded for that admission. It performs no new
  projection mutation. `duplicate` does not mean transport replay.
- `rejected`: the event is structurally valid but cannot bind to the claimed
  local release/admission coordinates or admission mode. No projection
  mutation occurred.
- `conflict`: the event reuses a `decision_event_id` with different full raw
  bytes, or a different event ID claims a divergent terminal decision or
  material for an admission that already has a terminal outcome. No
  projection mutation occurred.

An exact transport replay always returns the original persisted receipt
byte-for-byte, including its original status. Nurture MUST NOT change an
original `applied` receipt to `duplicate` merely because the request was
replayed.

## Delivery and settlement parity with transport `1.0.0` section 3

My-Chat MUST create the decision event and its outbox row in the same
transaction as the canonical admission terminal transition. Outbox workers
send the stored canonical bytes; retries MUST NOT regenerate an ID, digest or
payload.

Only a valid receipt in a `200` response settles a decision outbox event:

- `applied` and `duplicate` settle successfully.
- `rejected` and `conflict` settle as failed and do not auto-retry. The first
  such receipt MUST immediately emit the structured operations event
  `guardian_decision_settlement_failed` and page the owning operations queue.
- Timeout, connection failure, any non-200 response, `5xx`, `4xx` without a
  valid receipt, an empty or unparsable body, non-JCS receipt bytes, an unknown
  field or status, or any echo mismatch leaves `outcome_unknown`.

The `guardian_decision_settlement_failed` event MUST include only the opaque
`decision_event_id`, `admission_ref`, sender outbox ID, receipt ID, receipt
status and attempt count. It MUST NOT include family, guardian, reason or
material content. Alerting is immediate on the first failed settlement; it
does not wait for the eight-attempt `outcome_unknown` threshold.

Every failed settlement MUST expose the operator-only, one-event command:

`family-growth guardian-decision reconcile --decision-event-id <id>`

The command is idempotent on `decision_event_id` and MUST coordinate both
owners without rewriting the immutable request or receipt bytes:

1. Acquire a durable My-Chat reconciliation claim keyed by
   `decision_event_id`, then load the canonical terminal record, stored
   callback bytes, receipt and any collision evidence.
2. Invoke the Nurture reconciliation operation with the same event ID. Nurture
   locks the shared admission row in its own transaction; neither owner holds
   a database lock across the cross-repo call.
3. If Nurture already projects the exact canonical outcome, record
   `manually_reconciled` on the sender settlement and make no projection
   mutation.
4. If no Nurture terminal outcome exists, the settlement failure class was
   coordinate-validation `rejected` or transport `outcome_unknown`, and the
   immutable event coordinates now validate, apply that stored event exactly
   once in a Nurture reconciliation transaction and record the
   reconciliation against the original `decision_event_id`. A
   same-identifier/different-raw `conflict` is NEVER applied by
   reconciliation: collision evidence is immutable, and the only
   adjudication path is My-Chat issuing a NEW `decision_event_id` carrying
   the canonical outcome, superseding the conflicted identifier while both
   evidence trails are retained.
5. If divergent terminal evidence remains, move the teacher delivery axis to
   the existing fail-closed `conflict` state, keep protected content
   unavailable and record the unresolved evidence for joint repair. The
   command MUST NOT invent an `activated` or `cannot_activate` outcome.
6. Persist each owner-local result before releasing its claim. Repeating the
   command resumes from the stored results and creates no new decision event,
   callback outbox row or projection mutation.

The original `rejected` or `conflict` receipt remains immutable after manual
reconciliation. `manually_reconciled` is an internal settlement disposition,
not a new wire receipt status.

An `outcome_unknown` event MUST retry with the same event ID, digest and exact
canonical payload bytes. Delivery uses the complete frozen section-3 rules:

- connect timeout: 10 seconds;
- total request timeout: 30 seconds;
- exponential backoff: 30 seconds, factor 2, capped at 1 hour;
- jitter: plus or minus 20 percent;
- terminal give-up: none; retry indefinitely at the 1-hour cap;
- operator signal: at 8 attempts, approximately 4 hours; and
- stale-claim recovery: a `delivering` row whose last attempt is older than
  10 minutes is reclaimable by any worker.

There is no cross-event ordering guarantee. The exact replay is the status
query: Nurture's ledger returns the stored receipt, so a separate polling
endpoint is not part of `1.1.0`.

## Admission state machine

My-Chat and Nurture MUST each enforce at most one terminal outcome per
`admission_ref`. My-Chat is authoritative; Nurture maintains an evidence
projection. My-Chat's terminal transition and unique outbox insertion are
atomic. Nurture's event insert, admission transition or staging write, and
receipt insert are atomic.

Nurture MUST use one durable admission coordination row as the serialization
anchor for both callback consumption and pending-receipt recording. Both
transactions MUST first idempotently materialize that same row under a
unique `admission_ref` key alone, then lock it with `SELECT FOR UPDATE`
or an equivalent serializable compare-and-set. `release_event_id` is an
attribute of the coordination row, not part of its identity: a callback or
receipt naming the same `admission_ref` with a different `release_event_id`
MUST rendezvous on the existing row and be recorded there as a
coordinate-mismatch conflict, never as a second coordination row. Neither transaction may treat
the absence of a pending receipt or staged callback as final until it owns the
shared row lock and has re-read both states.

The Nurture projection has these logical states:

- `awaiting_pending_receipt`: the release exists locally, but no valid
  `pending_guardian_confirmation` receipt has been recorded.
- `pending`: the matching pending receipt has been recorded.
- `activated`: the terminal `activated` decision has been recorded.
- `cannot_activate`: the terminal `cannot_activate` decision has been
  recorded.

`activated` and `cannot_activate` are terminal. No later receipt, release,
callback, retry, expiry or lifecycle event may move either state back to
`pending` or to the other terminal outcome.

### Callback before the pending receipt

A valid callback may arrive while the release delivery response is
`outcome_unknown`. The callback transaction MUST lock the shared admission row
and re-read the pending-receipt and staged-decision fields. If the matching
pending receipt is already committed, the transaction consumes the callback
directly into the terminal state. If the pending receipt is not recorded, the
same transaction durably stages the callback before returning `applied`. A
staged callback MUST NOT expose a terminal teacher state yet.

The pending-receipt transaction MUST lock the same admission row and re-read
the staged-decision field after acquiring the lock. Nurture MUST compare
`admission_ref`, `release_event_id`, `source_scenario_key`,
`source_release_ref` and `family_id` inside one transaction. An exact match
records `pending` and immediately consumes the staged callback into its
terminal state before commit. A mismatch, a non-pending receipt or a different
admission mode MUST NOT attach the staged callback; the transaction records an
operator-visible conflict and leaves protected content unavailable.

Consequently, callback-first execution commits staged state that the waiting
pending-receipt transaction must observe, while receipt-first execution
commits `pending` that the waiting callback transaction must observe. Both
transactions cannot commit after independently observing the other state as
absent; a staged callback cannot be lost or left permanently unconsumed by
this race.

Replaying the pending receipt after a terminal state MUST return its existing
release receipt result without resetting the admission projection.

### Multiple IDs and outcomes

For one admission:

- the same `decision_event_id` and identical full raw payload is an exact
  replay and returns the original receipt;
- the same `decision_event_id` and different full raw payload is `conflict`;
- a new `decision_event_id` with the same decision, coordinates and
  `material_ref` is `duplicate`; and
- a new `decision_event_id` with a different decision, coordinate or
  `material_ref` is `conflict`.

`activated` requires one stable `material_ref`. A later `activated` event with
a different `material_ref` is divergent, not a duplicate.

### Lifecycle ordering and no resurrection

Admission outcome and lifecycle suppression are separate axes. The display
precedence remains `redacted`, then `target_removed`, then
`correction_appended`. Suppressive lifecycle state always prevents protected
content from becoming visible.

- Lifecycle first: a target removal or redaction may tombstone the local
  release before the pending receipt or callback. Later matching evidence is
  recorded for audit, but it does not restore visibility.
- Lifecycle late: a removal or redaction arriving after either terminal
  decision suppresses content without rewriting the recorded decision.
- Callback late: a callback arriving after suppression records the one
  terminal admission result, but the lifecycle display remains authoritative.
- Correction: `correction_appended` remains an overlay and does not change the
  terminal admission outcome.

A late release, pending receipt, callback replay or `activated` decision MUST
NOT resurrect content after `target_removed`, `redacted` or `tombstoned`.

## Teacher queue and privacy contract

The provider projection maps the terminal decision axis as follows:

- `activated` maps to the existing `applied` delivery semantics.
- `cannot_activate` maps to a new terminal, non-success delivery value
  `cannot_activate`, with exact neutral copy `未能接纳` and no retry action.

The sibling My-Chat `teacher-release-component-contract-v2.md` has eight
closed delivery values, rejects unknown values and promises no later v1
callback. Version 2 MUST NOT be widened in place.

The mandatory consumer gate is exactly
`teacher-release-component-contract v3`, bound to My-Chat public DTO
`contract_version: 3` and protected cache partition `publish_queue_v3`. That
named contract, DTO, adapter, component behavior and cache partition MUST be
frozen and deployed before My-Chat emits any decision event. Only this named
gate satisfies the requirement.

The v3 delivery union MUST preserve all eight v2 values and add only
`cannot_activate`. Its adapter maps callback `activated` to `applied` and
callback `cannot_activate` to `cannot_activate`. It MUST preserve lifecycle
precedence, reject unknown values before render, and read and write only
`publish_queue_v3`; callback state MUST NOT mutate `publish_queue_v2`.

The freeze gate MUST include these named acceptance fixtures:

- `v3-activated-no-lifecycle` and `v3-cannot-activate-no-lifecycle` prove both
  terminal mappings, exact copy, content visibility and absence of retry.
- `v3-activated-redacted-first`, `v3-activated-redacted-late`,
  `v3-activated-target-removed-first`,
  `v3-activated-target-removed-late`,
  `v3-activated-correction-appended-first` and
  `v3-activated-correction-appended-late` prove every lifecycle ordering for
  activation.
- `v3-cannot-activate-redacted-first`,
  `v3-cannot-activate-redacted-late`,
  `v3-cannot-activate-target-removed-first`,
  `v3-cannot-activate-target-removed-late`,
  `v3-cannot-activate-correction-appended-first` and
  `v3-cannot-activate-correction-appended-late` prove every lifecycle ordering
  for non-activation.
- `v3-unknown-delivery-rejected` and `v3-unknown-lifecycle-rejected` prove
  fail-closed validation before component render.
- `v3-publish-queue-cache-isolation` proves v3 reads and writes
  `publish_queue_v3` without reading, evicting or rewriting
  `publish_queue_v2`.
- `v3-legacy-pending-age-hint` proves that an optional legacy hint is sourced
  from authorized v3 presenter data, remains non-terminal and does not imply
  a deadline or later callback.

The owner-delegated disclosure decision is recorded as follows:

- The teacher may learn only that a previously pending admission was
  `activated` or terminally `cannot_activate`.
- `cannot_activate` intentionally collapses guardian decline, bounded expiry,
  authorization or policy closure, cancellation, revocation and any other
  non-activation terminal cause.
- The teacher MUST NOT receive or infer a reason code, guardian identity,
  guardian action, policy fact or canonical decision timestamp from this
  contract.

The collapse is a deliberate disclosure decision, not a claim that terminal
failure is invisible. The teacher learns that admission terminally failed,
but never why.

`decision_time` is removed from the wire payload entirely. Nurture records a
server-generated `received_at` when it durably accepts the request. That value
is operational evidence only, is not echoed to My-Chat, and MUST NOT appear in
the teacher DTO. Cross-repo audit correlation uses `decision_event_id` against
My-Chat's canonical admission and outbox record.

## Admission eligibility, cutover and legacy policy

Callback eligibility is a durable per-admission fact, not an inference from a
timestamp or the current feature-gate values. At initial activation My-Chat
MUST persist one immutable global cutover record containing the activation
time and `family_growth_transport` version `1.1.0`. Every pending admission
created after that record commits MUST store
`guardian_decision_contract_version = "1.1.0"` and the cutover record ID in
its creation transaction. An admission without that per-row marker is a
legacy `1.0.0` admission, regardless of its creation timestamp.

The finite-expiry, atomic-outbox and eventual queue-resolution guarantees
apply only to post-cutover `1.1.0` admissions and legacy admissions explicitly
upgraded as described below. A temporary sender or receiver outage after
cutover does not downgrade a new admission to `1.0.0` or remove its marker.

Pre-cutover pending admissions retain frozen `1.0.0` semantics: they receive
no automatic deadline, decision callback or callback outbox row and may remain
permanently `pending_guardian_confirmation`. Already-terminal legacy
admissions also produce no callback. `teacher-release-component-contract v3`
MAY render a neutral age-based hint for a legacy pending admission only from
authorized `publish_queue_v3` presenter data. The hint MUST NOT assert an
expiry, guardian action or promised later callback, and it MUST NOT alter any
`1.0.0` transport byte or `publish_queue_v2` byte.

An operator MAY upgrade exactly one still-pending legacy admission with:

`family-growth guardian-decision backfill --admission-ref <ref>`

The command has no range, wildcard or `--all` form and MUST NOT be invoked by
a scheduler, rollout job or automatic migration. In one transaction the
command locks the canonical admission, verifies that the admission is still
pending and unmarked, validates the current expiry configuration, writes the
`1.1.0` marker with an `upgraded_at` value, and sets
`expires_at = upgraded_at + configured bound`. Re-running the command for an
upgraded admission returns the stored marker and deadline without mutation.
Running the command for a terminal legacy admission returns a deterministic
refusal and MUST NOT synthesize a historical transition, decision event or
outbox row.

## Bounded expiry and queue resolution

My-Chat MUST assign every new `1.1.0` pending guardian admission a finite
`expires_at` in its creation transaction. The bound is configured by
`FAMILY_GROWTH_GUARDIAN_PENDING_MAX_AGE_DAYS`, defaults to 30 days, and MUST be
a base-10 integer from 1 through 365 inclusive. An absent value uses 30. Zero,
a negative value, a value above 365, an unbounded sentinel, a fraction or any
other invalid value MUST block creation of every new post-cutover pending
admission fail-closed; My-Chat MUST create no pending row and MUST NOT return a
`pending_guardian_confirmation` receipt. The request follows the existing
fail-closed rejection/error contract. Invalid configuration does not silently
downgrade the new admission to legacy `1.0.0` behavior.

The stored `expires_at` is derived once from the canonical creation or explicit
upgrade time and is not recomputed when configuration changes. Guardian
activation and expiry use the database transaction time and the same atomic
closure operation:

1. Lock the canonical admission row with `SELECT FOR UPDATE` or an equivalent
   serializable compare-and-set while it is `pending`.
2. A guardian activation may commit only when transaction `now < expires_at`.
   At `now >= expires_at`, activation MUST fail and the expiry sweep wins.
3. Write exactly one terminal result and one stable `decision_event_id`.
4. Insert the canonical JCS decision payload and callback outbox row in the
   same transaction.
5. Commit both or neither.

The expiry sweep MUST claim every still-pending eligible row whose
`expires_at <= now` and close it as `cannot_activate`. Its configured schedule
and processing capacity MUST bound successful sweep closure to no later than
24 hours after `expires_at`; crossing that bound emits an immediate structured
operations escalation. A racing guardian action at or after the deadline
cannot activate even if the sweep has not yet run. The loser observes the
terminal record and MUST NOT emit another decision event.

The outbox has no terminal give-up for `outcome_unknown`, so an eligible
terminal admission keeps the same callback awaiting a valid receipt. The
post-cutover queue-resolution promise is explicitly conditioned on transport
liveness: the database, expiry and outbox workers, network and receiver must
eventually make progress. It is also conditioned on an operator completing
`family-growth guardian-decision reconcile` after any `rejected` or `conflict`
settlement. A permanent transport outage or an unattended failed-settlement
escalation is outside the promise. Pre-cutover admissions that were not
explicitly upgraded are also outside the promise.

## Bilateral rollout and rotation

Rollout MUST use separate receiver and sender gates in this order:

1. Freeze and deploy `teacher-release-component-contract v3`, its
   `contract_version: 3` `publish_queue_v3` DTO, adapter, component, protected
   cache partition and every named acceptance fixture above. Existing v2 and
   `publish_queue_v2` remain unchanged.
2. Deploy the Nurture endpoint, event ledger, staging/state-machine logic and
   provider projection with the receiver gate disabled.
3. The My-Chat operator mints the sender secret. Through the approved secret
   channel, the Nurture operator installs it as the mandatory current validator
   value first while the receiver gate remains disabled. `_PREVIOUS` is absent
   for an initial installation.
4. The Nurture operator enables and verifies the receiver, then confirms
   validator readiness to the My-Chat operator. The My-Chat sender gate is
   still disabled.
5. Deploy My-Chat's canonical closure, expiry and outbox sender code with its
   sender gate disabled. Run every shared golden-byte vector and all four gate
   matrix cells below.
6. Enable the My-Chat sender last and atomically persist the immutable global
   cutover record before creating the first eligible admission. No callback
   may be emitted and no admission may be marked `1.1.0` before steps 1–5
   pass.

Initial token installation and every rotation are jointly owned:

- The My-Chat operator mints and rotates the sender secret.
- The Nurture operator owns validator installation and confirmation.
- For rotation, Nurture first installs the new value as current and keeps the
  old value as previous. My-Chat continues sending the old value during this
  step.
- After Nurture confirms both values validate, My-Chat switches the sender to
  the new value.
- After delivery is verified, Nurture removes the old previous value.

Absence of `_PREVIOUS` after the final step is the normal steady state. Only
the current token is mandatory and fail-closed; `_PREVIOUS` exists solely for
the bounded overlap during an active rotation.

Neither operator may skip the other owner's confirmation. My-Chat MUST NOT
switch or enable the sender before Nurture's validator-first step completes.

### Compatibility and golden-byte gate

The additivity claim is scoped to existing `1.0.0` surfaces; it is not a claim
that the global route set is byte-identical after a new route is mounted.

The shared bilateral fixture bundle MUST freeze exact raw UTF-8 request bytes,
digest-input bytes, lowercase digest, HTTP status, raw receipt bytes and
expected sender-outbox, receiver-ledger and projection mutations for this
enumerated vector set:

1. `g01-activated-applied`: `activated` with `material_ref` returns `applied`.
2. `g02-cannot-activate-applied`: `cannot_activate` without `material_ref`
   returns `applied`.
3. `g03-duplicate-new-id`: a new event ID with the same coordinates and
   outcome returns `duplicate`.
4. `g04-rejected-coordinate-binding`: a schema-valid event that cannot bind
   to the local release/admission coordinates returns `rejected`.
5. `g05-conflict-divergent-outcome`: a new event ID claiming a divergent
   outcome for an already-terminal admission returns `conflict`.
6. `g06-exact-replay`: replaying `g01` byte-for-byte returns its original
   persisted receipt byte-for-byte, including `receipt_id` and `applied`.
7. `g07-divergent-id-conflict`: reusing the `g01` decision event ID with
   different canonical payload bytes returns a persisted `conflict` receipt
   and records collision evidence without projection mutation.
8. `g08-invalid-jcs`: a schema-shaped but non-canonical request returns a
   non-200 response with no receipt, ledger or projection mutation.
9. `g09-unknown-request-field`: a canonical request containing one unknown
   field is rejected with a non-200 response and no receipt, ledger or
   projection mutation.
10. `g10-unknown-receipt-field`: a `200` response whose otherwise matching
    receipt contains one unknown field is invalid at the sender, leaves the
    event `outcome_unknown` and retries the identical request bytes.

Vectors `g01` through `g05` cover both decisions and all four valid receipt
statuses. Vectors `g06` through `g10` separately freeze replay identity,
divergent-ID conflict, invalid JCS and unknown-field rejection. Both repos MUST
consume the same checked-in byte files; generated look-alike fixtures do not
satisfy this gate.

The enabled-gate matrix is mandatory:

| Sender gate | Receiver gate | Existing `1.0.0` surfaces | Callback surfaces |
| --- | --- | --- | --- |
| off | off | All v1 golden bytes MUST match. | Inactive; no claim, emission, receipt or v3 projection. |
| off | on | All v1 golden bytes MUST match. | Inactive; receiver-ready only, with no sender emission or v3 projection. |
| on | off | All v1 golden bytes MUST match. | Inactive and rollout-invalid; receiver-readiness validation MUST block sender claims before emission. |
| on | on | All v1 golden bytes MUST match. | Active; `g01`–`g10` and the v3 acceptance fixtures MUST pass. |

The sender's effective start condition is its local sender gate plus the
current bilateral receiver-readiness confirmation from rollout step 4. The
confirmation MUST be invalidated before the receiver gate is disabled, so the
on/off cell fails closed before any callback outbox claim. The callback
event/receipt and `publish_queue_v3` surfaces are active only in the on/on
cell.

In every matrix cell, golden-byte tests MUST prove that:

- requests to and receipts from
  `POST /internal/scenario/family-growth/events` are byte-identical to the
  frozen `1.0.0` fixtures;
- rendition resolve responses and downloaded rendition bytes are unchanged;
- the existing admission-receipt DTO has no added, removed or reinterpreted
  field;
- the existing teacher provider DTO/component contract v2 retains its exact
  eight delivery values and behavior; and
- `publish_queue_v2` cache keys, values and invalidation behavior remain
  byte-identical and do not observe callback terminal state.

The new callback endpoint, event/receipt DTOs and `publish_queue_v3` teacher
DTO are new versioned surfaces. Their existence does not authorize mutation
of an existing `1.0.0` endpoint or DTO.

## Resolved decision ledger

There are no open design choices in this v2 draft.

1. **Terminal vocabulary — resolved.** Push carries only `activated` and
   `cannot_activate`; see `Decision event schema` and
   `Teacher queue and privacy contract`.
2. **Decision time — resolved.** `decision_time` is absent. Nurture records
   local `received_at`, and audits correlate by `decision_event_id`; see
   `Teacher queue and privacy contract`.
3. **Mechanism — resolved.** The channel is an atomic-outbox push with full
   section-3 settlement parity; see `Endpoint, gates and authentication` and
   `Delivery and settlement parity with transport 1.0.0 section 3`.
4. **Token ownership — resolved.** My-Chat mints and switches the sender
   secret; Nurture installs the mandatory current validator first, and the
   previous validator is optional; see
   `Bilateral rollout and rotation`.
5. **Teacher contract — resolved.** The named
   `teacher-release-component-contract v3` with `publish_queue_v3` MUST freeze
   and deploy before emission; see
   `Teacher queue and privacy contract` and `Bilateral rollout and rotation`.
6. **Eligibility and expiry — resolved.** Post-cutover and explicitly upgraded
   admissions have a 1..365-day bound, deadline precedence and a sweep lag of
   at most 24 hours; untouched legacy admissions retain v1 semantics; see
   `Admission eligibility, cutover and legacy policy` and
   `Bounded expiry and queue resolution`.
7. **Failed settlement — resolved.** `rejected` and `conflict` immediately
   escalate and require the idempotent one-event reconciliation command; the
   queue promise names its liveness conditions; see
   `Delivery and settlement parity with transport 1.0.0 section 3`.
8. **Bilateral compatibility — resolved.** Shared vectors `g01`–`g10` and all
   four sender/receiver cells preserve every v1 byte; callback surfaces are
   active only in the on/on cell; see `Compatibility and golden-byte gate`.

## Freeze, boundaries and sign-off model

The owner delegated the My-Chat-side design decision. No human My-Chat
sign-off is expected or required. An independent adversarial review substitutes
for that sign-off and MUST report no unresolved REQUIRED item before this
draft can freeze. The frozen record must then be mirrored into the designated
My-Chat artifact location with content identity recorded by both tasks.

This draft performs no schema apply, route mount, token minting, deployment,
traffic activation or runtime change. Implementation remains default-off and
starts only after the adversarial freeze gate passes. Transport `1.0.0` and
the `family_growth_material_*@1.0.0` contracts remain frozen.

[transport-v1]: ../../../archive/nurture-family-growth-provider/artifacts/family-growth-transport-addendum.md
[w5-n6]: ./w5-audit-defect-ledger.md#p1
