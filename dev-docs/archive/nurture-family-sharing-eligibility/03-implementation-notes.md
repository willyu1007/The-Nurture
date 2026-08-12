# T-010 implementation notes

## Status

- Current status: `in-progress`
- Last updated: 2026-08-12

## What changed

### 2026-08-11 — I4-C0 task and design freeze

- Created an independent task rather than reopening T-009 or attaching the
  cross-owner authorization path to T-002/T-007 G4 work.
- Adopted a dedicated authority model for all three categories. Existing
  ChildLink Grant values remain unchanged and are not a fallback reader.
- Split release and receiving policy into exact axis rows, made an exact signed
  target selector mandatory and made multi-enrollment ambiguity unavailable.
- Bound private transport to existing C30 verification/trust/nonce primitives
  while keeping it out of the generic Harness action API.
- Bound withdrawal cleanup to Nurture-derived media/focus stores. No current
  production data path or positive provider was enabled.

## Files/modules touched

- `dev-docs/active/nurture-family-sharing-eligibility/`
- `.ai/project/main/registry.yaml`
- `.ai/project/main/feature-map.md`
- `.ai/project/main/dashboard.md`

## Decisions and tradeoffs

- Decision: create T-010 under a distinct cross-owner authorization feature.
  - Rationale: T-009 is a completed released-material provider; G4 owns
    institution surfaces. Reusing either would create misleading ownership and
    status coupling.
  - Alternatives considered: reopen T-009 or attach to T-007. Both were
    rejected as scope conflation.
- Decision: use a dedicated authority fact instead of adding media/focus Grant
  enum values.
  - Rationale: existing Grants authorize care-delivery data classes, not this
    exact cross-owner category/purpose boundary. No safe backfill exists.
  - Alternatives considered: map `child_growth_record` or direction-only
    Grants. Both are semantically under-specified and fail the independent
    review.

## Deviations from plan

- None.

## Known issues and follow-ups

- Prisma model spelling, lifecycle-head mappings and cleanup ledger reuse need
  schema review before code changes.
- Private operation registration needs a C30/surface-contract classification
  decision before transport code.

## Pitfalls and dead ends

- Keep the detailed append-only log in `05-pitfalls.md`.

## 2026-08-12 I4-C1 schema, domain and ports (review-only)

- Added the dedicated category-authority persistence draft:
  `NurtureFamilySharingAuthority` + `NurtureFamilySharingPolicy` with new
  `NurtureFamilySharing*` enums (not the Grant vocabulary), named `Restrict`
  FKs to process/family/enrollment/role-assignment, and provenance
  (authorizing role + role-assignment id, authority/policy versions,
  effective/expiry/revoke lifecycle). Purpose is column-bound and CHECKed to
  `family_nurture_sharing_authorization`.
- The exactly-one-current guarantee lives in partial unique indexes
  (`WHERE status = 'active'`, per scope+category, policies additionally per
  axis); expiry is temporal, writers supersede/revoke in one transaction, and
  the migration is committed preview-only — no database was written.
- Domain layer (`domain/family-sharing/authority-records.ts`): record types
  and `NurtureFamilySharingAuthorityRecordReadPort` with fail-closed
  cardinality for the C2 reader; no Prisma import.
- Cleanup command/receipt table deliberately not drafted: the
  `NurtureCommandExecution` reuse argument belongs to the C3 transport
  design.
- `docs/context/db/schema.json` regenerated; workflow-contract self-pin
  rotated (`003cbe81…`, 281 files).

## 2026-08-12 I4-C1 post-review rework (independent Codex pass, 5 findings addressed)

- Composite FKs replace the single-column FKs: rows now bind
  `(workspace_id, child_care_process_id)` → process,
  `(…, family_id)` → family, `(…, enrollment_id)` → enrollment and
  `(workspace_id, authorizing_role, authorizing_role_assignment_id)` → role
  assignment, backed by four additive unique indexes on the anchor tables —
  cross-workspace/cross-process references and role-provenance mismatch are
  now structurally impossible, not just reader-checked.
- Currentness definition corrected to include `effective_from <= evaluated_at`
  (a future-effective active row is not current), and the slot semantics
  restated honestly: the partial uniques guarantee AT MOST ONE active row;
  writers retire the occupied slot atomically (including after unattended
  natural expiry) and existence stays a reader decision.
- New static verifier `pnpm verify:family-sharing-invariants` pins the
  hand-authored CHECKs/partial uniques/composite FKs that the generated DB
  context cannot represent.
- C30 Step 5 prose, feature-map and dashboard checkpoints reconciled with the
  drafted state. The sixth finding (decision-identity alignment in the
  My-Chat currentness port) was fixed on the My-Chat side (`0400c4c`,
  `ec9f298`).

## 2026-08-12 I4-C2 coherent current-authority reader

- Added exact internal C2 input types for an already-verified service
  principal, time-bounded signed current-pair evidence, the typed local pair
  and one exact enrollment head. Raw My-Chat Child/Family/membership ids and
  host request/user/context strings are not representable in this port.
- Added `PrismaNurtureFamilySharingCurrentAuthorityRepository`. Its one
  parameterized PostgreSQL statement observes, in one MVCC statement
  snapshot, the current child/process/family and binding-association chain,
  committed pair head, selected enrollment/institution/group, dedicated
  authority row, authorizing participant/role and separate release/receiving
  policy rows for all three categories.
- Reused the reviewed C1 authority/policy record shapes for row validation and
  added a coherent C2 read port for the complete snapshot. The two C1
  per-category row methods are not called sequentially: doing so would create
  multiple statement snapshots and violate the C2 consistency requirement.
- The reader refuses missing/expired/revoked facts, stale target or pair heads,
  role/participant or local lifecycle drift, incomplete axes, result
  duplication/cardinality ambiguity and database exceptions. It returns only
  `status=unavailable`, with no internal reason or identifier at the boundary.
- My-Chat family lifecycle is used only on the My-Chat-owned endpoint:
  destination for `daily_activity`, source for `media` and
  `focus_collaboration`. Local lifecycle is reread rather than copied into an
  authority/policy row.
- The authority version is a deterministic SHA-256 value over the exact
  admitted trust, pair evidence, local aggregate heads, authority/policy heads
  and their current role/participant revisions. Result row order cannot change
  it; the evaluated wall-clock instant is not treated as an authority head.
  The local pair inputs deliberately include both distinct committed-operation
  hashes: `current_owner_evidence_hash` is the owner evidence admitted by the
  pair operation, while `pair_commit_evidence_hash` is the local association
  commit receipt. Neither is mislabeled or exposed; both are hashed into the
  deterministic authority version.
- Added 16 DB-lane repository behavior/query-contract tests, including the two
  single-axis negatives, missing/revoked/expired facts, role drift, stale pair
  evidence, non-exact inputs, duplicate/ambiguous rows, deterministic version,
  lifecycle direction and database outage. Fresh-database execution remains
  the explicit C4 qualification gate because the C1 migration is still
  unapplied.

Current state:
`I4_C2_READER_IMPLEMENTED_CONTRACT_QUALIFIED / DB_SQL_EXECUTION_PENDING_C4 /
NO_APPLY`.

## 2026-08-12 I4-C3 private transport and cleanup owner

- Added a dedicated `/internal/nurture/family-sharing/invoke` controller and
  runtime outside the generic Harness API. The application registers only a
  disabled runtime by default; the complete Prisma factory requires explicit
  reviewed trust/signing material, database-backed nonce store, exact-pair
  resolver, C2 reader, cleanup ledger and complete purge-owner registry.
- Reused the C30 detached Ed25519 verifier and trust declarations for the two
  exact `workflow_runtime` operations. Bearer service authentication is an
  independent outer gate. Exact issuer/audience/caller/credential/key/route,
  short expiry and single-use nonce are all required; responses are detached-
  signed and carry `private, no-store` plus `no-cache`.
- Removed local Child/process/Family/association refs from the wire request.
  `PrismaNurtureFamilySharingExactLocalPairResolver` resolves signed typed
  anchor evidence and one exact enrollment to exactly one current local pair;
  zero, duplicate, stale, malformed or database-error states are unavailable.
  The query uses `LIMIT 2` so ambiguity cannot be silently ordered away.
- Strict input parsing rejects extra fields, including caller-supplied
  `local_pair`. Eligibility output contains only contract, purpose, authority
  version, evaluation instant and category decisions; anchors, enrollment,
  roles, policy rows, Grants, raw identity and local refs never cross the
  transport boundary.
- Added `NurtureFamilySharingCleanupOwner` and reused immutable
  `NurtureCommandExecution` for exact command replay. The request fingerprint
  binds the full verified pair evidence and internally resolved local pair,
  while each purge owner receives only Nurture-local process/family/enrollment
  scope, exact purpose and categories. It never receives My-Chat anchors and
  cannot mutate My-Chat identity/binding.
- Cleanup succeeds only after every explicit derived-store owner confirms
  `purged|already_absent`; a partial failure writes no success receipt. Exact
  replay skips purge, mismatch fails closed, and `purged_store_count` counts
  only actual `purged` receipts. The current explicit no-derived-store owner
  attests absence and truthfully reports zero purges.
- No manifest, public surface contract, Prisma schema or migration rotated.
  No database apply, production enablement, deployment or traffic occurred.

Current state:
`I4_C3_TRANSPORT_AND_CLEANUP_IMPLEMENTED_CONTRACT_QUALIFIED /
DB_AND_JOINT_EXECUTION_PENDING_C4 / NO_APPLY / NO_ACTIVATION`.

## 2026-08-12 I4-C4 environment-free qualification vehicle

- Reviewed the C1 Prisma models and hand-authored migration against the C2
  current-authority query, C3 exact-pair resolver, DB nonce store and cleanup
  ledger. Static Prisma validation and the family-sharing invariant verifier
  pass. No schema/migration mismatch requiring a change was found; schema,
  migration and manifest remain unchanged.
- Added a production-shape integration vehicle at
  `packages/nurture-db/tests/t010-family-sharing-c4.production-shape.integration.test.ts`.
  Without the dedicated target it defines only six deterministic safety and
  cleanup-lock contract tests and makes no connection. With the target it adds
  six PostgreSQL tests for migration shape, real resolver/C2 SQL, transient
  duplicate cardinality, DB nonce concurrency, cleanup response-loss replay,
  partial failure/no-over-delete and same-key/different-fingerprint
  concurrency.
- Added the task-owned runner under `artifacts/qualification/`. The runner has
  an environment-free `--check-only` mode. Execution mode requires both the
  exact `NURTURE_T010_C4_DATABASE_URL` and
  `NURTURE_T010_C4_DISPOSABLE_APPROVED=I_APPROVE_T010_C4_DISPOSABLE_WRITES`;
  the runner refuses a non-empty target before `prisma migrate deploy`, runs
  the focused vehicle and verifies zero synthetic participant/execution/nonce
  residue afterward. The runner never reads generic `DATABASE_URL` as target
  input.
- Fixed a C3 concurrency defect found during vehicle review. The earlier
  `ledger.find -> purge -> ledger.commit` sequence allowed two concurrent
  different fingerprints under the same cleanup key to purge two scopes
  before only one receipt won. `NurtureFamilySharingCleanupLedgerV1` now owns
  an exclusive execution callback. The Prisma adapter acquires a
  workspace+command-key `pg_try_advisory_xact_lock` in a Serializable
  transaction, rereads the immutable receipt before invoking purge, and writes
  the receipt only after every bounded Nurture-local purge succeeds. A lock
  loser or fingerprint mismatch returns before invoking purge. A malformed
  callback result, partial callback failure or transaction error cannot write
  a success receipt; however, a callback can complete before a later
  transaction/receipt failure. Registered purge owners therefore remain
  strictly Nurture-local, exact-scope and idempotent so an exact retry safely
  confirms the same purge. No schema change was required.
- C3 transport/cleanup regression remains 11/11 passing. Three environment-
  free adapter contract cases additionally prove no callback on lock loss or
  mismatch and no receipt on callback failure. Real advisory-lock concurrency
  is encoded in the target-only vehicle and remains execution pending.
- No Docker, generic/local database URL, network database or unknown target
  was probed. No migration was applied and no runtime/provider was activated.

Root integration merged the combined census as 178 files. After removal of
the superseded T-007 negative vehicle and addition of the settlement DB suite,
the current split is unit 97, production DB 50, dev host 11, scenario service
17 and x5 joint 3. The ordinary no-target
DB population floor is 209; the approved qualification execution defines 12
tests in the C4 file. Root integration also rotated only the settled Nurture
self-pin to `5a59039b...`; external My-Chat source drift remains unadopted.

Current state:
`I4_C4_PRODUCTION_SHAPE_VEHICLE_READY / DISPOSABLE_DB_AND_JOINT_EXECUTION_PENDING /
NO_DATABASE_CONTACT / NO_APPLY / NO_ACTIVATION`.

## 2026-08-12 cleanup receipt boundary hardening

The domain owner now validates the entire ledger-returned receipt rather than
trusting a repository status flag. Exact command, fingerprint, categories,
deterministic receipt ref, completion time, and the ordered registered-store
receipt set must all match. A substituted or truncated receipt returns generic
unavailable and cannot be reported as cleanup success.

## 2026-08-12 I4-C4 disposable and joint qualification

- Executed the guarded runner against
  `t010_i4c4_disposable_20260812`. It applied all 39 migrations from empty,
  ran the six environment-free and six PostgreSQL cases, then proved zero
  synthetic participant/execution/nonce residue.
- Added a shared production-shape fixture helper and a serialized two-database
  x5 suite. The joint owner is My-Chat's pinned exact contract consumer backed
  by Nurture's real current-authority repository; My-Chat uses its real parent
  context, authorization repository, receipts and outbox.
- Five joint cases prove fresh grant and owner-free exact replay, authority
  version drift, provider outage, committed-response loss with
  `outcome_unknown -> replayed`, and withdrawal during owner outage followed
  by one Nurture cleanup purge plus exact cleanup replay.
- The cleanup bridge is qualification-only and consumes the real My-Chat
  withdrawal outbox payload. Production My-Chat and Nurture compositions stay
  unbound/default-off; the qualification does not create a route, worker,
  secret, rollout flag or traffic authority.

Current state:
`I4_C4_EXIT_PASS_DEFAULT_OFF / HANDOFF_READY / DURABLE_APPLY_AND_ACTIVATION_CLOSED`.
