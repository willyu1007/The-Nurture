# T-009 Implementation Notes

Running log; newest first.

- 2026-08-07 (late): consumer side landed at My-Chat `df7a273` — the
  transport-frozen events ingress answers with synchronous wire receipts
  (lifecycle results carry the original admission/material refs;
  suppression maps to tombstoned), and the rendition importer implements
  the §4 exchange trust-free (actual-digest reporting, mismatches become
  rejected receipts via intake validation). Both ends of the wire now
  exist: I7's twelve joint fixtures are unblocked. Remaining infra gaps on
  both sides are the byte-storage adapters (deployment ports, fail-closed
  absent).

- 2026-08-07 (night): I0 frozen; I3b + I5 landed.
  - Transport addendum frozen at `family_growth_transport@1.0.0`
    (D-T009-09), mirrored to My-Chat with matching digest `38bc6239…`.
  - I3b: pure delivery engine in the scenario domain
    (`delivery.ts`: frozen backoff/settlement constants,
    `decideFamilyGrowthDelivery` — only a valid 200 receipt naming the
    exact event settles; mismatched receipts retry) + the scenario-service
    worker (`family-growth-delivery.worker.ts`: claim with the 10-minute
    stale lease, HTTP transport with 30s timeout, receipt recording,
    attention log at 8 attempts). Worker starts only when
    `MY_CHAT_INTERNAL_BASE_URL` + `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN` are
    both configured. `claimDue` gained stale-claim reclaim with a
    staleness-re-checking conditional update, plus an optional workspace
    scope (a global-claim test flaked against accumulated dev-DB debris —
    claims in tests are now workspace-scoped; the production worker still
    claims globally).
  - I5: rendition exchange on scenario-service
    (`family-growth-rendition.controller.ts` + `family-growth-runtime.ts`):
    dual-token auth, stateless HMAC lease (key derived from the rendition
    token, so rotation invalidates open leases — acceptable at 5-minute
    TTL), per-call re-authorization on resolve AND download via
    `PrismaFamilyGrowthRenditionReadPort` (jsonb containment against the
    released envelope + release visibility + pinned-revision/digest/MIME
    checks), frozen §5 error taxonomy registered in the safe-exception
    whitelist. Byte storage is a deployment-infra port
    (`FamilyGrowthRenditionStoragePort`); unbound storage answers 503,
    never a false 404.
  - New env keys registered in the env contract; context checksums synced.

- 2026-08-07 (evening): I3c fact preparer + quality-review pass; stable
  baseline commit.
  - `PrismaFamilyGrowthEmissionPreparer` loads real canonical facts into the
    prepared emission (mappings recorded as D-T009-08). End-to-end proof in
    the suite: preparer output feeds the real `commitTargetRelease` and
    commits with its outbox event. Additive migration
    `20260807120000_t009_media_mime_type` adds the envelope-required MIME
    column with the same nullable/fail-closed posture as the digest.
  - Review findings, all fixed with regression coverage:
    1. REAL BUG — `familyRefKey` is `<workspaceId>:<familyId>` on the
       production capture path while the preparer compared it as a bare
       family id: every production target would have denied as
       `target_mismatch`. Test seeds had masked it by seeding bare ids; the
       preparer now strips the workspace prefix and the preparer suite seeds
       the production form.
    2. Drift window — admission policy identity now comes from the process's
       frozen schedule fields, not the current policy row, so the envelope
       always names the identity the commit gate validated.
    3. Assembler shared object graphs with caller input; a post-assembly
       mutation could desync the stored envelope from its digest. Inputs are
       now structured-cloned at assembly.
    4. Binding/authorization reads ordered by timestamp only; same-instant
       rows were nondeterministic. Id tiebreakers added.
    5. Display truncation could cut a surrogate pair; now code-unit-capped
       without dangling high surrogates. Receipt parsing double-called its
       ref reader; single-pass now.
  - Known I3b TODO (recorded, not fixed here): a worker that dies after
    `claimDue` leaves rows in `delivering` with no lease/timeout; the I3b
    worker needs a stale-claim recovery rule from the frozen addendum's
    retry parameters.

- 2026-08-07: I3 non-wire half landed (transactional emit; the wire half —
  delivery worker + ingress POST — still waits on the I0 transport freeze).
  - Release path: `commitTargetRelease` accepts an optional prepared
    emission (`FamilyGrowthPreparedReleaseEmissionV1`). Release and receipt
    ids are pre-generated inside the transaction so the envelope binds the
    exact rows about to commit; assembly runs after every gate and before
    the first kept write, so an invalid emission aborts write-free (freeze
    CAS included) and surfaces as `family_growth_emission_invalid`. One
    deliberate deviation from the plan wording: assembly runs INSIDE the
    transaction (it is pure computation; N5 bans network/storage calls, not
    CPU work) — only resolution and fact loading stay pre-transaction.
  - Harness: `PublicationReleaseDependencies.family_growth` is the optional
    pre-commit preparer port. Denied resolution → that one target rejects
    with `binding_unavailable` before any write and the owner exchange is
    the only network touch; absent preparer → byte-identical G3-D commit
    input (default-off preserved).
  - Lifecycle path: `appendPublicationVisibilityEvents` now lands each
    lineage row and its outbox event as one pair (per-event transaction).
    Emission follows the release's own delivery: only releases with a
    `released` outbox row propagate lifecycle, and the lifecycle target is
    read back from the stored release envelope — never re-resolved, so a
    binding revoked after release cannot stop a redaction cascade.
  - Correction plaintext: the spec shape gained `display_safe_text`; the
    teacher's correction input rides as `correction_display_safe_text` next
    to the sealed body and rests only in the outbox envelope. No unseal
    path was needed on the live route.
  - `appendFamilyGrowthOutboxEventWithin` extracted as a standalone
    function so release/safety owners append with their own `tx`.

- 2026-08-07: I2 + I4 landed.
  - I2 schema: migration `20260807080000_t009_family_growth_provider_outbox`
    (outbox + receipt tables, media `content_digest`, hand-authored partial
    unique and CHECK invariants); `PrismaFamilyGrowthOutboxPort`
    (`appendWithin` caller-transaction append, `claimDue`, `recordReceipt`,
    `recordTransportFailure`). Postgres lesson the suite caught: a caught
    unique violation still aborts the surrounding transaction (25P02), so
    receipt-replay idempotency uses `createMany skipDuplicates`
    (ON CONFLICT DO NOTHING), never catch-and-continue.
  - I4 resolution: `target-resolution.ts` pure resolver over a binding read
    port and a canonical-exchange port (the owner reread), all deny reasons
    fail closed, exchange never called for locally denied chains, canonical
    IDs never persisted; `PrismaFamilyGrowthBindingReadPort` reads the
    LATEST association state so revoked chains deny with precise reasons.
    Schema fact worth keeping: an active family association MUST reference
    its child association as current
    (`ck_nurture_family_anchor_assoc_lifecycle`), so "current family
    association over a revoked child association" is unrepresentable in
    rows — that resolver guard is defense-in-depth, unit-tested only.
  - Local dev DB repair before deploy: three failed zero-step attempts of
    the T-007 migration were blocked by its data gate (627 partial-schedule
    test-debris rows); repaired by NULLing the seven schedule fields on
    exactly those rows, resolve --rolled-back, redeploy. Full evidence in
    `artifacts/db/i2/00-sync-evidence.md`.
  - New subpath export `@the-nurture/scenario/family-growth` (types→src,
    import→dist), matching the `binding-owner` pattern, so `nurture-db`
    binds the ports without importing the scenario root.

- 2026-08-07: I1 domain envelope layer landed under
  `packages/nurture-scenario/src/domain/family-growth/`
  (`envelope.ts` wire types + full-pass structural validator, `jcs.ts`
  canonical serialization + payload digests, `assembler.ts` pure
  deterministic assembly, `receipt.ts` receipt parsing/consequences).
  Interop detail worth repeating: the consumer's digest scope is
  `{source,target,admission,material,retention}` for releases and
  `{source,target,correction?}` for lifecycle events — NOT the whole
  envelope — with recursive key-sort + `JSON.stringify` canonicalization;
  the digest tests replicate the consumer algorithm verbatim to lock this.
  No new runtime dependency (self-contained canonicalization per plan).
  Known environmental note: one pre-existing `tsc` error in
  `x5-joint-acceptance.integration.test.ts` from live-sibling drift
  (`resolveNurtureAttentionOpen` removed at My-Chat head); unrelated to I1
  and resolved by the I6 pin rotation.

- 2026-08-07: Task created. T-006 branch merged to `main` (`447e646`),
  making checkpoint `0374087…` and My-Chat's evidence pin `882d80f…`
  reachable from `main`. Decision records D-T009-01…07 written. Transport
  addendum draft v0.1 authored and mirrored to My-Chat. Implementation
  begins with I1 (domain envelope layer).
