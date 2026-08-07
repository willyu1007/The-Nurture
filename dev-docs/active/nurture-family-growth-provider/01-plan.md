# T-009 Plan

Increments are ordered so that everything transport-independent lands first;
wire work waits for the joint transport freeze (I0). Each increment has its
own DoD; nothing activates by default at any point.

## I0 — Joint transport freeze (with My-Chat)

- Frozen artifact: `artifacts/family-growth-transport-addendum.md` (identical
  copy in My-Chat `dev-docs/active/growth-record/artifacts/`).
- Settle: endpoint paths, service-auth mechanism, receipt-in-response rule,
  rendition exchange (short-lived URL TTL, digest verification), retry/backoff
  parameters, error taxonomy.
- DoD (MET 2026-08-07): both repos record `family_growth_transport@1.0.0`
  with matching digest; open-items list is empty (D-T009-09).
- Blocking: I3 wire delivery, I5 rendition endpoint. Not blocking: I1, I2.

## I1 — Domain envelope layer (no schema, no wire)

- `envelope.ts`: TypeScript wire types for `release_event`, `lifecycle_event`,
  `admission_receipt` exactly mirroring the frozen v1 JSON Schema, plus a
  structural validator (reject unknown fields, const/enum checks). No copy of
  the schema file into contracts/ (no private extension).
- `jcs.ts`: RFC 8785 canonical JSON serialization + SHA-256 `payload_digest`
  (digest computed over the envelope without the `payload_digest` field).
- `assembler.ts`: pure function from canonical fact inputs (release, frozen
  revision, target, binding-resolved canonical IDs, media facts, display
  snapshot) to a validated `release_event`; the same for the three lifecycle
  kinds, including correction display-safe text input. Enforces the envelope
  prohibitions (no enumerable primary keys except opaque UUID refs, no
  protected envelope, no storage keys, no other-child/family data — media
  list must be the target-eligible subset).
- `receipt.ts`: receipt interpretation — the six statuses, required
  companion refs per status, `outcome_unknown` as a distinct provider-side
  state (not a receipt status), and the rule that a receipt never grants
  read/write authority.
- Unit tests for all of the above, including JCS vectors from RFC 8785 and
  fixture-shaped envelopes validated against the frozen schema file read from
  the pinned My-Chat checkout in CI-less mode (fixture copies allowed under
  `tests/`, marked as test fixtures, not contracts).
- DoD: `pnpm test:unit` green; no new runtime deps beyond a JCS
  implementation (prefer self-contained ~100-line implementation over a new
  dependency, to keep the pin surface small).

## I2 — Schema increment (media digest, provider outbox, receipt store)

- `NurtureMediaAssetRef.contentDigest` (sha256, immutable per revision;
  backfill strategy: nullable + required-for-new via check, then tighten
  after backfill — real values only, no placeholder digests).
- `NurtureFamilyGrowthOutboxEvent`: id (= envelope `event_id`), kind
  (release|correction|target_removal|redaction), source refs
  (publicationReleaseId / visibilityEventId), payloadDigest, canonical
  envelope JSON, deliveryState (pending|delivering|delivered|failed),
  attempt bookkeeping, uniqueness on the source fact (one event per fact).
- `NurtureFamilyGrowthAdmissionReceipt`: receiptId, releaseEventId (FK to
  outbox event id), status (six values), refs, reasonCode, processedAt;
  append-only.
- Follow the DB-SSOT workflow (`sync-db-schema-from-code` skill), migration,
  `db:validate`, context sync, boundary assert.
- DoD: `pnpm test:db` green including new integration coverage for outbox
  append inside the release transaction (I3 dependency is only the table).

## I3 — Transactional emit + delivery worker

Split executed as I3a (non-wire, DONE 2026-08-07), I3c (fact preparer,
DONE 2026-08-07) and I3b (wire, DONE 2026-08-07 after the I0 freeze):

- I3a: `commitTargetRelease` and the lifecycle finalize append the outbox
  row in the same transaction (N5). Resolution and fact loading run
  pre-transaction (network allowed there); pure envelope assembly runs
  in-transaction after every gate and before the first kept write, binding
  pre-generated release/receipt ids — an invalid emission aborts write-free
  as `family_growth_emission_invalid`. A denied resolution rejects only its
  target (`binding_unavailable`) before any write. Lifecycle emission
  follows the release's own delivery (released outbox row present) and
  copies the stored envelope target rather than re-resolving.
- I3c: `PrismaFamilyGrowthEmissionPreparer` fills the prepared emission
  from real canonical facts (mappings in D-T009-08), fail-closed per gap
  with two-tier deny reasons.
- I3b: the scenario-service worker claims due rows (including stale
  `delivering` claims past the frozen 10-minute lease), POSTs per the
  addendum, records the synchronous receipt via I2's store, and maps every
  non-settling outcome to `outcome_unknown` with the frozen 30s→1h backoff
  and the 8-attempt attention signal; terminal `rejected`/`conflict` stop
  retries and surface to the queue.
- I3a DoD (met): DB integration tests for same-tx atomicity in both
  rollback directions, replay identity, default-off parity, lifecycle
  pairing/skip/fail-closed. I3b DoD (met): engine and worker state
  transitions against a fake consumer per the addendum, plus the DB
  stale-claim reclaim test.

## I4 — Canonical target resolution (N1)

- Provider-side resolution port: local target (childCareProcess, enrollment,
  familyRefKey, grant) → current child/family anchor associations → owner
  verification → canonical `child_id` + `family_id`.
- Fail closed on: missing/revoked/quarantined/expired anchor or
  authorization, ambiguous association, workspace mismatch. Never inferred
  from PII or legacy Education data. Resolution output is used in envelope
  assembly only and never persisted to business tables.
- DoD: unit tests over an in-memory owner port covering every deny case;
  integration test proving a deny blocks the release before the transaction.

## I5 — Rendition exchange (DONE 2026-08-07)

- Service-authenticated endpoint: `family_rendition_ref` → short-lived URL +
  digest for the exact unchanged original revision, authorized per target
  family (D-T009-02). No permanent public URLs; TTL per addendum.
- DoD: endpoint tests incl. auth failure, unknown/revoked ref, digest match.

## I6 — Surface contract 1.16.0 batch

- Remove `guardian_current_focus` content kind + `query/update` capabilities
  (D-T009-01); freeze register notes the ceded ownership.
- Add provider-facing publish-queue status vocabulary: per-target
  `family_growth` delivery state (delivering / applied / pending guardian /
  duplicate / tombstoned / rejected / conflict / outcome_unknown) as
  display-only projection of I2's receipt store (requirements §四).
- Rotate the My-Chat pin to the jointly designated commit (D-T009-04);
  regenerate artifact pin; update Base pin only if parity requires.
- DoD: contract tooling green (`assert-*` scripts), conformance suite
  updated, `1.16.0` manifest/digest regenerated.

## I7 — N8 fixtures + requalification

- The twelve fixtures from requirements §二 N8, run provider-side against a
  fake consumer and jointly against real My-Chat at the pinned commit
  (fixtures 1, 2, 4, 8, 12 are the currently-missing ones; 3, 5, 6, 7, 9,
  10, 11 extend existing G3 suites).
- One requalification round in detached worktrees at exact pins (same
  topology discipline as the G3 exit), refreshing evidence invalidated by
  I6.
- DoD: all twelve fixtures pass on both sides; requalification record
  appended under this task; default-off census re-proven.

## I8 — Teacher queue binding (requirements §三.8)

- Bind the already-reviewed publish-queue UI states to real provider results
  (receipt statuses, binding-unavailable, policy drift, correction appended,
  target removed, redacted).
- DoD: surface conformance tests over the new states; no family-archive data
  reachable from teacher surfaces (existing invariant re-asserted).

## Sequencing summary

```
I0 (joint) ──────────────┐
I1 ──► I2 ──► I3 ──► I7 ──► I8
        └──► I4 ──┘   │
I0 ──► I5 ────────────┘
I6 rides with I7's requalification round
```

Worked in this repo: I1–I6, I7 provider half, I8. Worked in My-Chat (T-031):
ingress controller, media importer, receipt delivery implementation, guardian
confirmation, I7 consumer half.
