# T-009 Implementation Notes

Running log; newest first.

- 2026-08-08 (post-requal quality pass — 4 findings fixed, requal refreshed):
  independent review (Codex gpt-5.6-sol) + self-review of the I6.2 + I7b
  range surfaced four real defects; all fixed and the batch requalified
  again at the new checkpoint:
  1. The queue's family-growth states lived OUTSIDE the source-head drift
     contract: a receipt landing moved no head, so a cursor could stitch
     pages from different delivery worlds with no refresh signal. Fixed by
     folding a queue-wide family-growth census into the `publish_queue`
     source head — bucketed by DISPLAY state (pending+delivering share a
     bucket, so claim transitions deliberately do not churn the head) plus
     receipt count/newest. Test proves heads move on each receipt.
  2. "Latest receipt" selection ordered by `createdAt` only — same-ms
     receipts picked arbitrarily (and uuid ids are random, so id alone is
     not insertion order). Now ordered by `processedAt` (the consumer's
     meaningful instant — a guardian confirmation post-dates the pending
     receipt it resolves), then createdAt/id as deterministic tiebreaks.
     Test: pending_guardian_confirmation → applied wins the display.
  3. J9 isolated its two families into separate WORKSPACES, so cross-family
     mixing inside one workspace was untested, and it never asserted the
     rejected family's zero side effects. Rewritten: one workspace/care
     group, split processes (the sanctioned multi-family route — a shared
     composition fails the privacy gate for the other target, re-confirmed
     while reworking), DISTINCT media bytes per child, one delivery tick
     for both; asserts A has exactly one material carrying exactly A's
     bytes and B has zero materials/admissions/media assets/blobs.
  4. The digest-verification evidence was happy-path only (expected digest
     and served bytes came from the same constant). New JX1: the rendition
     endpoint serves TAMPERED bytes for an asset whose envelope digest
     describes the true ones — the real consumer rejects
     `media_import_mismatch`, discards the staged download
     (`validation_failed`), the provider settles `failed`, and no
     material/asset/blob lands family-side.
  Seeder consequence worth keeping: the joint world now creates one publish
  process PER child (split_process); a shared two-child composition is
  unrepresentable in the suite, matching the qualified privacy gate.
  Lanes after fixes: 615 unit / 256 db / 66+64 scenario-service / 12 x5
  (was 11). Self-pin re-frozen (`48dbe2c1…`). Environmental note: the live
  My-Chat sibling moved past the pin (`8b2f3ae` > `df7a273`, another
  session's work); pin-population checks for the record run in detached
  worktrees at the exact pin, where they pass.

- 2026-08-08 (1.16.0 batch requalified — `REQUAL_PASS`): full record in
  `06-i6-batch-requalification-record.md`. Exact detached topology (Nurture
  `97b9afe`, My-Chat `df7a273`, Base `8a3ea90`, adjacent worktrees so the
  `link:` deps and pin verifier load frozen sources), two disposable tmpfs
  databases migrated from empty, every gate green including the x5 joint
  lane (11 tests). Environmental facts worth keeping: My-Chat's schema
  needs the `vector` extension (use `pgvector/pgvector:pg16`, plain
  postgres fails deploy); `@my-chat/workflow-contracts` must be built in
  the frozen My-Chat worktree before the Nurture unit lane resolves it;
  the self-pin includes `packages/nurture-db/package.json`, so the I7b
  dep addition forced one self-pin re-freeze (`48502f6d…`). Batch closed;
  T-009 remainder is I8 only.

- 2026-08-08 (I7b joint suite green): the N8 fixtures now run with the REAL
  My-Chat consumer on its own database
  (`packages/nurture-db/tests/t009-family-growth-joint.integration.test.ts`,
  x5 lane, env `X5_NURTURE_DATABASE_URL` + `X5_MY_CHAT_DATABASE_URL`). Real
  on both ends: provider side uses the actual preparer, release/lifecycle
  transactions, outbox port and `decideFamilyGrowthDelivery`; consumer side
  wraps the real `FamilyGrowthIntakeService` + intake/lifecycle repositories
  + wire-receipt builder behind a thin HTTP shim (My-Chat's `apps/api` layer
  is not linkable from this workspace — the shim is transport plumbing only,
  noted in the file header). Rendition exchange serves real bytes through
  the real `PrismaFamilyGrowthRenditionReadPort` with per-download
  re-authorization, and the consumer verifies the blob digest end-to-end.
  Seven joint cases (J1+J3, J2, J4, J5/6/7, J8, J9, J12); fixtures 10/11
  remain I7a-proven as noted in the header. Facts learned against the real
  consumer worth keeping:
  - Intake requires the source scenario REGISTERED (`scenarios` row,
    status pilot/active) — `scenario_not_available` otherwise; the joint
    seed upserts `scenarioKey: "nurture"`.
  - Consumer receipt identity is deterministic per ingress event
    (`family-growth-receipt:<ingressId>`), so a replayed release answers
    `duplicate` under the ORIGINAL receipt id; the provider's append-only
    store keeps exactly the applied row (skipDuplicates no-op) while the
    outbox still settles — replay identity holds at the store level, and
    the wire-level duplicate (original admission/material refs) is
    asserted by direct POST.
  - My-Chat's Prisma 7 client factory takes no URL argument (adapter reads
    `DATABASE_URL`), so the suite uses the x5 lane's env-swap construction
    pattern.
  Lane wiring: `vitest.x5.config.ts` includes / `vitest.db.config.ts`
  excludes the suite; routing census now 57/26/11/14 + x5-joint=2;
  `@my-chat/domain` added as a dev-visible dep of `nurture-db`. Gates all
  green: 615 unit / 256 db / 66+64 scenario-service / joint 7/7; freeze
  asserts unchanged (no pinned sources touched). Remaining for the 1.16.0
  batch close: the requalification record (detached worktrees at exact
  pins, fresh DBs, full gates), then I8.

- 2026-08-08 (I6.2 landed, merge `6cbf32d` — logged retroactively): the
  teacher publish queue now projects per-target family-growth delivery
  state as a display-only projection of the receipt store.
  `familyGrowthQueueState` vocabulary (delivering / applied /
  pending_guardian_confirmation / duplicate / tombstoned / rejected /
  conflict / outcome_unknown) added to `publish-process-types.schema.json`,
  optional `familyGrowth` array on the queue item, harness projection via
  `issuePublishTargetRef`, and `publish-lane.read.ts` joins outbox
  (kind=released) → latest receipt after the page slice. Fourteen
  publish-family slice hashes re-frozen in the phase-3 world register;
  manifest stayed at `1.16.0` via the restore-generated-to-baseline
  rotation discipline.

- 2026-08-08 (I6 cession landed): `query/update_guardian_current_focus`
  retired across all layers — contract sources (registries, two capability
  schemas deleted, envelope/fixture enums, selection cases, gj-2 journey
  view), harness (guardian query, board envelope assembly, board mutation
  spec), scenario-service routing, owner read/write ports and eligibility
  resolver, OpenAPI enums — and the manifest regenerated at
  `nurture.surface-contract@1.16.0` (33 capabilities, digest `a6563819…`,
  shared-core `7bd8a82d…`). Freeze registers updated deliberately: the
  G3-0 assert now tracks the pair as reserved-but-RETIRED (identities can
  never be silently reused), the phase-3 world register re-froze the
  shared-core and two board slice hashes, the G2 exit assert carries the
  rotated shared-core and owner pins, the persisted-table census declares
  the two T-009 tables, and the test-routing census caught up
  (57/26/11/14/1). Formal ingress: 25 actions / 8 queries, 0 unrouted.
  Full gates green: 614 unit / 255 db / 66+64 scenario-service / 27
  dev-host; deterministic conformance rebuild verified; pins re-frozen
  (self `a24fa3d2…`).
  - Batch remainder before the requalification record: I6.2 publish-queue
    family-growth status vocabulary (display-only projection of the
    receipt store) and I7b (the twelve N8 fixtures against the real
    My-Chat consumer at the rotated pin, in detached worktrees).

- 2026-08-07 (I6 opening — pin rotation): the My-Chat pin rotated
  `a019566` → `df7a273` and the Base pin `06303e9` → `8a3ea90` in one move
  (D-T009-04). The workflow-contracts population was verified UNCHANGED on
  both sides across the rotation, so contract parity holds at the same
  `8dd53be4…` digest; `x5_joint_api` re-pinned at 190 files now including
  `packages/domain/family-growth` (the joint lane's new dependency), and
  the Nurture self-pin re-froze at 185 files. `pnpm
  verify:workflow-contract-pin` passes against live siblings for the first
  time since the contract freeze.
  - Drift surfaced by the rotation, routed OUT of T-009: My-Chat's
    Dashboard interaction loop (`8d508f1`) replaced the route-only
    attention path with typed dashboard items + an acknowledge contract,
    while Nurture's user-attention owner still serves the `route_key`
    shape. The x5 joint lane was adapted to compile against the NEW
    contract (it stays red at runtime until the owner endpoint adopts it)
    and the adoption is tracked as a T-002 follow-up task, not a T-009
    item. Root `tsc --noEmit` is fully clean for the first time this task.
  - Remaining I6+I7b closing work (next session-sized unit): the
    `guardian_current_focus` cession removal spans 33 files (contract
    sources incl. two capability schemas, registries, fixtures and
    journey views; harness guardian-board/envelopes/mutations; the
    scenario-service routing; guardian-board read; assert-script key
    inventories; and the dependent suites), then the publish-queue
    family-growth status vocabulary, the `1.16.0` manifest regeneration
    via `scripts/surface-contract/build-surface-contract.mjs`, the joint
    N8 run against real My-Chat, and the requalification record.

- 2026-08-07 (I7a): N8 provider conformance landed
  (`apps/scenario-service/tests/family-growth-n8.db.e2e.test.ts`, 10 cases
  covering all twelve fixtures; 5/6/7 share one ordered case, 11 covers
  both expired and missing bindings). The consumer double answers over a
  real local HTTP listener through the worker's real transport, revalidates
  every envelope with the frozen schema + recomputed digests (any
  violation fails the suite), and implements the frozen semantics: ledger
  idempotency (replay → duplicate with original refs), source-key digest
  conflict, pre-release suppression with late-release tombstoning, per-
  family policy (applied/pending/rejected), and full/targeted 503 modes.
  Worker deliveries are workspace-scoped in tests via a wrapping outbox
  port so shared-database debris cannot leak into fixtures.
  - Model finding worth keeping: fixture 9 ("one photo to two families")
    cannot mean both-families-succeed under the qualified G3 exposure gate
    — a photo showing another family's child fails closed for that family
    (that is the privacy model working, and exactly the D-T009-02 posture).
    The realized fixture: family A commits and delivers `applied` while
    family B rejects locally, provably independent. Both-families-succeed
    arrives with the shared-infrastructure derivative capability;
    the sanctioned multi-family route today is `split_process`.
  - I7b (real My-Chat on both ends + requalification) rides with I6: the
    joint lane needs the pin rotation anyway (the x5 joint test already
    fails typecheck from live-sibling drift).

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
