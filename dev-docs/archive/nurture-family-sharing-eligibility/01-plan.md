# T-010 implementation plan

## Phases

1. I4-C0 — owner contract and fact freeze.
2. I4-C1 — additive schema, domain types and repository ports.
3. I4-C2 — coherent PostgreSQL current-authority reader.
4. I4-C3 — default-off private eligibility and cleanup transport.
5. I4-C4 — database qualification and cross-repository conformance.

## Detailed steps

### I4-C0 — owner contract and fact freeze

1. Freeze the exact matrix for `daily_activity`, `media` and
   `focus_collaboration`: direction, purpose, required local role, pair
   authority, release-policy owner, receiving-policy owner and lifecycle
   sources.
2. Use a dedicated family-sharing authority fact for all three categories.
   Existing ChildLink Grant classes remain unchanged and are not an alternate
   reader for this interface.
3. Represent release and receiving policy as separate axis rows under one
   category-policy model. A positive result requires one current row for each
   axis; missing or duplicate rows deny.
4. Require signed current My-Chat binding-pair evidence to name the typed
   Nurture anchors. Resolve exactly one workspace-local pair and one selected
   current enrollment. Multiple eligible enrollments without an exact signed
   target selector make the owner result unavailable.
5. Freeze a dedicated private operation and cleanup command before changing a
   public contract, manifest operation set or transport composition.

I4-C0 exit: this task bundle, project mapping and contract decisions pass
strict documentation and governance lint. No schema or runtime changes occur.

### I4-C1 — schema, domain and ports

1. Use `prisma/schema.prisma` as SSOT and produce an additive migration for:
   - exact pair/category/direction/purpose authority;
   - category policy rows with disjoint `release` and `receiving` axes;
   - idempotent cleanup command/receipt state only if the transport design
     cannot reuse an existing canonical command ledger safely.
2. Add explicit status, effective/expiry/revoke, authority version and
   authorizing-role provenance. Do not persist raw platform ids or signed
   evidence bodies.
3. Add domain types and repository ports outside Prisma. Business code must
   not import Prisma.
4. Refresh `docs/context/db/schema.json` after the reviewed schema change.

I4-C1 exit: Prisma format/validate, migration SQL review, schema context sync,
domain tests and projection-impact review pass. Database apply remains behind
an explicit target approval.

### I4-C2 — current authority reader

1. Accept only a verified service principal plus verified current pair
   evidence, resolved local pair, exact purpose and exact target selector.
2. In one PostgreSQL repository read, recheck current participant/role,
   association, enrollment, authority, release policy, receiving policy and
   Nurture-owned lifecycle.
3. Use signed My-Chat current-pair evidence only for the My-Chat-owned
   lifecycle side. Host request/user/context strings are integrity and audit
   inputs, never authority.
4. Produce a deterministic authority version from the exact admitted heads.
5. Fail closed for absence, expiry, revoke, soft deletion, contract drift,
   duplicate policy rows, multi-target ambiguity and database failure.

I4-C2 exit: each positive authority axis has a single-axis negative, drift and
ambiguity test; media/focus have no positive path without the new exact facts.

### I4-C3 — private transport and cleanup owner

1. Add a dedicated scenario-service route; do not use the generic Harness
   action API.
2. Reuse the C30 detached Ed25519 verifier, trust declarations and database
   nonce store. Require exact audience/operation/purpose, short expiry and
   single-use nonce.
3. Validate exact request/response fields and the pinned eligibility contract.
   Return `private, no-store`; never return anchor, participant, role, policy,
   Grant, enrollment, raw Child/Family or protected-content identifiers.
4. Compose the runtime only when all key material and owner ports exist.
   Otherwise expose no positive provider and return unavailable.
5. Bind Nurture as cleanup owner for any Nurture-derived media/focus data. The
   cleanup command is idempotent, scope/purpose/category bound and cannot
   silently succeed while a registered derived-store purge fails.

I4-C3 exit: signature, trust, audience, expiry, nonce replay, extra-field,
outage and cleanup-partial-failure tests all fail closed.

### I4-C4 — qualification and joint conformance

1. Build and statically qualify a deterministic production-shape vehicle that:
   - accepts only `NURTURE_T010_C4_DATABASE_URL` with an exact disposable-name
     pattern and separate explicit approval token;
   - refuses generic `DATABASE_URL`, non-PostgreSQL, non-public-schema and
     non-empty targets;
   - applies the full migration history from empty and verifies the C1
     constraints/indexes before behavior tests;
   - exercises the real C2/exact-pair SQL, durable nonce and cleanup ledger,
     response loss, partial failure, no over-delete and transient duplicate
     cardinality;
   - removes synthetic business data and proves no residue.
2. Obtain explicit approval for a dedicated Nurture database target, then run
   the vehicle. An unavailable target is `EXECUTION_PENDING`, never permission
   to reuse another database.
3. Run joint My-Chat fixtures for grant, withdrawal, provider outage, stale
   authority, exact replay, response loss, cleanup and unknown outcome.
4. Re-prove that production composition and activation remain off.

I4-C4 exit: exact-pin conformance and cleanup pass with no residual test data;
activation still requires a separate rollout decision.

Environment-free checkpoint: step 1 is `VEHICLE_READY`; steps 2-4 remain
`EXECUTION_PENDING`. This checkpoint is not the I4-C4 exit.

## Risks and mitigations

- Risk: treating current ChildLink Grant data as media/focus permission.
  - Mitigation: dedicated authority model, enum non-change assertion and tests
    that existing Grant rows never create a positive result.
- Risk: selecting an arbitrary enrollment when one child has several current
  enrollments.
  - Mitigation: exact target selector in signed evidence; ambiguity returns
    unavailable.
- Risk: caching a once-valid owner answer after role, policy or lifecycle drift.
  - Mitigation: current canonical reads on every query/prepare/confirm call and
    no authorization cache.
- Risk: private service authentication substitutes for the adult or pair.
  - Mitigation: service trust and signed current pair evidence are both
    required; each is independently insufficient.
- Risk: withdrawal reports success before Nurture-derived data is removed.
  - Mitigation: registered purge owners, idempotent receipt and partial-failure
    refusal.
- Risk: schema work collides with G4.
  - Mitigation: independent T-010 branch/worktree, additive models and explicit
    migration review against the current main head.
