# G4-D I4-A Host Run ownership preflight

Date: 2026-08-12

## Verdict

`ADAPTER_IMPLEMENTED / CROSS_DB_COMMIT_PROTOCOL_GAP /
JOINT_EXECUTION_BLOCKED_BY_X5_DATABASES / I4_NOT_QUALIFIED`

## Intended slice

The first bounded I4 vehicle was intended to connect the exact My-Chat
prospective-contact owner, the Base formal dispatcher and Nurture's qualified
query/prepare/execute owners for `start_enrollment_inquiry`, exact replay,
post-commit Web head and revoke-before-execute denial.

## Ownership finding

The preflight found that the start-inquiry binding still creates a
`CanonicalRef{namespace=my_chat, object_type=workflow_run}` inside Nurture.
Its current random object id changes on an exact execute replay. A proposed
Nurture-local deterministic replacement would make replay stable, but was
rejected because it would still mint a Host-owned canonical identity without a
My-Chat Run row, owner receipt or pinned issuance contract.

The frozen 0E contract says the ref is issued through the pinned generic
runtime boundary, and My-Chat owns Run/Step/worker/ledger/outbox state. The
current verified invocation supplies no Host-issued Run ref, and the adopted
My-Chat owner set has no production reservation/issuance seam for this
Enrollment Journey command. A test-local hash or direct cross-database insert
cannot substitute for that owner.

## Required repair before the joint vehicle lands

1. My-Chat must own an idempotent Run issue/reserve/read operation with an exact
   contract, lifecycle and replay identity.
2. The Host-issued opaque ref must cross a pinned trusted boundary; it must not
   be accepted as an ordinary public business input.
3. Nurture may validate and persist the opaque ref with its private workflow,
   but must not derive or mint the My-Chat object id.
4. Joint evidence must prove the exact My-Chat Run exists, exact replay uses
   the same ref, a different command cannot reuse it, and revoke-before-execute
   creates no Nurture workflow.

Only after that seam is adopted should the two-database I4-A suite be restored
to the serialized x5 lane. The unavailable disposable database pair is a
second execution blocker, not permission to bypass the ownership blocker.

## Evidence and non-effects

- My-Chat `ec9f298` and Base `536638a` remain the exact adopted revisions.
- Nurture unit, typecheck and structural gates remained green after the
  rejected implementation vehicle was removed; its preflight self-pin was
  `3276062e...` over 291 exact-runtime files.
- No database was written, no route or capability was activated, and no I4 or
  G4-F qualification is claimed.

## Second-round follow-up

My-Chat T-041 now contains a locally contract-qualified implementation of
repair item 1. The generic owner uses a DB-generated Run id, stores the queued
Run and body-free creation outbox atomically, rejects semantic idempotency
drift and returns the same Run identity after later Run-version changes. It
adds no route, DI activation, schema, deployment or traffic.

Repair items 2 through 4 remain open. The candidate is uncommitted, so there is
no new My-Chat revision to pin; Nurture has not adopted it through the trusted
dispatcher; the removed joint vehicle has not been restored; and no
two-database execution occurred. The current follow-up verdict is therefore:

`G4_D_I4_A_HOST_RUN_OWNER_CANDIDATE_QUALIFIED /
ADOPTION_AND_JOINT_EXECUTION_PENDING / I4_NOT_QUALIFIED`.

## Third-round adoption review

Nurture now implements a narrow structural adapter for the uncommitted owner
candidate. It uses verified Host `invocation.request_id`, omits `actor_id`, and
never forwards the Nurture participant, command id or contact facts. The owner
response must contain exact My-Chat Workflow Run identity plus positive
version evidence; the Scenario strips aggregate version and retains only
versionless identity. Host v1→v3 remains the same local association. Changed
correlation/trace is exact replay, not semantic conflict.

This is not production adoption. `issueRun` immediately commits a queued Host
Run and body-free outbox event, while the Nurture command commits later in a
different database. Local validation/CAS/commit failure or crash can orphan
the Host effect. A new Host invocation id after response loss can create a
second Run, and no current cited dispatcher contract guarantees stable logical
identity. No reserve→confirm/abandon lifecycle or orphan reconciler exists.

Production start inquiry therefore stays fail-closed with
`workflow_run_cross_db_commit_protocol_unavailable`, before contact-owner read
or protected-data sealing. The restored x5 file is a negative proof: it will
show Run/outbox presence with no Nurture journey, same-request correlation
replay and a second orphan for a new Host request id. It typechecks but was not
executed because Docker and both x5 URLs are absent.

No My-Chat revision was invented or pinned; the candidate remains uncommitted.
The root integration pass rotated only Nurture's settled exact-runtime
self-pin to `5a59039b...` over 298 files and merged the 178-file routing census.
The complete verifier stays red only on the changed uncommitted My-Chat source
population. No schema, route, activation, deployment, traffic or durable
database changed. I4-A/I4/G4-F remain open.

## Baseline cleanup follow-up

The third-round adapter and negative x5 vehicle have now been removed after
the dedicated Host reservation ledger and Nurture settlement ledger replaced
that design direction. This record remains as the audit trail for why direct
queued issuance was rejected; it is not a description of current executable
source.

Current source has one protocol direction: Host reserve with no Run/event,
signed Nurture execution plus historical writer-fenced settlement, then Host
confirm or abandon. The transport, atomic command attachment and Host verifier
remain open, so production still fails closed and no positive I4 claim is
made.

## Signed-adoption follow-up

The Nurture transport and atomic attachment are now implemented. Formal
execute v2 admits the exact signed reservation evidence, registers it before
prospective-contact/protected work, persists the Host Run ref without deriving
it, and marks the settlement committed after command-execution creation in the
same transaction. The success response includes the committed proof.

This does not restore a positive joint vehicle yet. A dedicated historical
status operation, the My-Chat verifier and an approved two-database execution
environment remain missing. The record verdict advances only to
`NURTURE_SIGNED_ATOMIC_ADOPTION_IMPLEMENTED / HOST_CONFIRMATION_NOT_ADMITTED /
I4_NOT_QUALIFIED`.
