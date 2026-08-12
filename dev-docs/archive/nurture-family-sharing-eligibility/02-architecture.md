# T-010 architecture

## Context and current state

The pure resolver in
`packages/nurture-scenario/src/harness/family-sharing-eligibility.ts` already
defines the exact three-category result and requires role, grant, release,
receiving and both lifecycle axes. Its current authority port accepts opaque
host strings, and no canonical repository or scenario-service composition
implements that port.

C30 already supplies detached Ed25519 request verification, service trust,
short-lived private invocation and atomic PostgreSQL nonce consumption. Those
primitives may be reused, but the generic Harness action route may not become
the authorization endpoint.

## Frozen design decisions

### D-I4C-01 — dedicated authority, not ChildLink Grant

Family-sharing eligibility uses a new purpose-bound authority fact for all
three categories. It does not extend `NurtureGrantDataClass`, map media/focus
to `child_growth_record`, infer permission from a direction-only Grant or
backfill existing rows. This prevents a second interpretation of the existing
care-delivery Grant contract.

### D-I4C-02 — separate policy axes

One category-policy model stores one row per `release` or `receiving` axis.
Both rows bind the exact workspace-local pair, selected enrollment, category,
direction and purpose. Positive eligibility requires exactly one current row
for each axis. A combined boolean policy row and an any-row-wins query are
forbidden.

### D-I4C-03 — exact target cardinality

The signed invocation must resolve typed Child and Family anchors to one exact
workspace-local Child/ChildCareProcess/child-scoped Family pair. The request
must also identify one exact current enrollment target through signed,
contracted evidence. If zero or multiple candidates remain, the entire owner
resolution is unavailable; repository ordering must never choose a winner.

### D-I4C-04 — two-owner lifecycle composition

The My-Chat side of source/destination lifecycle comes only from verified
current pair evidence. The Nurture side comes from current local association,
process, family and enrollment reads. No lifecycle boolean is copied into the
authority or policy rows.

For `daily_activity`, Nurture is the source and My-Chat family is the
destination. For `media` and `focus_collaboration`, the My-Chat family is the
source and Nurture is the destination.

### D-I4C-05 — private transport is a distinct composition

The scenario service will expose a dedicated private operation using the C30
verifier/trust/nonce primitives. Eligibility remains independent of product
surface capability activation. Missing keys, ports or exact contract
composition produce unavailable, never fixture-backed eligibility.

### D-I4C-06 — cleanup is an owned command

Nurture owns cleanup of Nurture-derived media/focus data created through this
sharing boundary. Withdrawal cleanup is an authenticated, purpose/category/
pair-bound idempotent command with a receipt. Every registered derived store
must confirm purge before success. Because no such production import is active
today, the first implementation must prove an empty-store cleanup and prevent
activation until future derived stores register a purge owner.

## Proposed components

- `packages/nurture-scenario`
  - exact internal verified-input types;
  - authority/policy domain semantics;
  - eligibility and cleanup ports;
  - strict request/response validation.
- `packages/nurture-db`
  - one coherent current-authority read repository;
  - additive persistence adapters;
  - idempotent cleanup ledger/receipt adapter if required by schema review.
- `apps/scenario-service`
  - dedicated eligibility controller/runtime;
  - C30 verification and nonce composition;
  - default-unavailable production composition;
  - cleanup controller/runtime and purge-owner registry.

## Interfaces and contracts

### Eligibility

- Logical interface remains pinned to
  `nurture.family-sharing-eligibility@1.0.0` unless the exact wire shape changes.
- Any new private-operation envelope or operation registry entry receives its
  own exact version/digest review; no floating or latest alias is allowed.
- The authority repository input contains verified principal/evidence objects,
  resolved local refs, purpose and selected target. It does not accept raw host
  user/context strings as authority.

### Persistence candidate

- `NurtureFamilySharingAuthority`
  - exact local pair/enrollment/category/direction/purpose;
  - status and effective/expiry/revoke lifecycle;
  - authorizing role provenance and aggregate version.
- `NurtureFamilySharingPolicy`
  - same exact scope plus `release|receiving` axis;
  - status and effective/expiry/revoke lifecycle;
  - policy version/provenance.
- Optional cleanup command/receipt table only if an existing canonical command
  ledger cannot meet exact replay and immutable-receipt requirements without
  semantic coupling.

Names and columns remain candidates until the Prisma diff review. The frozen
semantic requirement is separate exact rows and fail-closed uniqueness, not a
specific ORM spelling.

## Boundaries and dependency rules

- Allowed: scenario domain → repository ports; `nurture-db` → Prisma adapter;
  scenario service → explicit domain/db runtime composition.
- Forbidden: business layer importing Prisma; Nurture querying My-Chat DB;
  raw platform ids in Nurture business tables; Convex/search/cache authorization;
  generic Harness routing; Grant enum reinterpretation; silent fixture fallback.

## Data migration

- Strategy: additive versioned Prisma migration from repository SSOT.
- Review: inspect generated SQL and all uniqueness/check/foreign-key behavior
  before any database write.
- Compatibility: existing Grant and family-growth provider rows remain
  byte-for-byte semantically unchanged; there is no backfill.
- Rollout: apply first to a dedicated disposable/dev-local target after user
  approval; keep runtime uncomposed.
- Backout: before data, remove the unused composition and forward-fix schema;
  after authority/cleanup receipts exist, never drop audit history.

## Non-functional considerations

- Security: service trust and adult/pair evidence are independent mandatory
  axes; exact purpose/audience/operation, short expiry and nonce replay denial.
- Privacy: no protected ids/content in response, logs, metrics, traces or
  caches; errors remain generic and fail closed.
- Consistency: current canonical reads on every decision; no authorization
  projection or stale cache.
- Observability: refs-only outcome/reason families, contract identity and
  latency; no authority evidence bodies or target ids.

## Open questions for schema review

- Which existing immutable command ledger, if any, can host cleanup replay
  without coupling cleanup semantics to unrelated enrollment commands?
- Which current local fields are the canonical lifecycle heads for each side of
  every category, and do they require a dedicated resolver abstraction?
- Does adding the private operation require a surface-contract rotation or a
  separate non-surface private-operation registry under current C30 rules?
