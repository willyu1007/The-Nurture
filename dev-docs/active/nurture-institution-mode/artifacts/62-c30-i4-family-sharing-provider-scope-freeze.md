# C30-I4 Family-sharing Provider Scope Freeze

## Decision

- Date: 2026-08-11
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Trigger: My-Chat T-039 froze `my-chat.family-nurture-authorization@1.0.0`
  and the user authorized the next implementation unit.
- State: `C30_I4_A_BOUNDED_IMPLEMENTATION_AUTHORIZED`

This record freezes only the first independently reversible C30-I4 unit. It
publishes the Nurture-owned current family-sharing eligibility boundary and lets
My-Chat adopt one exact key/version/digest. It does not activate a product
capability and does not open later C30, C31-C35, T-008, deployment or Pilot work.

## Owner boundary

| Fact or decision | Canonical owner | This unit |
| --- | --- | --- |
| Family acceptance, withdrawal, purpose, version and receipt | My-Chat | Consume only; never copy into Nurture. |
| Current scenario role, Grant, release, receiving eligibility and lifecycle | Nurture | Reread through an owner port for every request. |
| Effective family sharing | My-Chat | Compose current My-Chat consent with the exact Nurture result. |
| Child/family identity or binding | My-Chat platform owner | Lookup/routing context only; never authority. |

The provider request may carry current private host identity and opaque context
evidence. It must not carry raw child/family ids. The response is a closed,
body-free category decision and cannot expose participant, role, Grant, policy,
release or lifecycle-record ids.

## Frozen categories and derivation

| Category | Direction | Eligible only when |
| --- | --- | --- |
| `daily_activity` | `nurture_to_family` | Current role, Grant, release, receiving eligibility and both endpoint lifecycles are positive. |
| `media` | `family_to_nurture` | Same closed intersection. |
| `focus_collaboration` | `family_to_nurture` | Same closed intersection. |

The existing `NurtureGrantDataClass` enum has no media or focus-sharing class.
This unit must not pretend that `daily_care_log`, `child_growth_record` or a
generic family-communication Grant authorizes those categories. The owner port
may return a resolved negative category; a future persisted authority design
requires a separate schema/projection review and authorization.

## Ordered implementation

1. `I4-A1`: publish `nurture.family-sharing-eligibility@1.0.0` with an exact
   SHA-256 digest, closed request/result shapes and current-owner semantics.
2. `I4-A2`: implement an HTTP-free provider service over a Nurture authority
   port. Malformed input, owner outage, ambiguous/missing facts or contract drift
   return only `status=unavailable`; resolved negative authority returns the
   affected category as `ineligible`.
3. `I4-A3`: add deterministic unit tests for exact digest, all-category
   completeness, per-request reread, derivation, privacy and fail-closed paths.
4. `I4-B1`: pin the exact provider contract in My-Chat and add a no-cache
   adapter that validates every owner response before returning it to T-039.
5. `I4-B2`: run focused and repository checks, record the cross-repository
   compatibility evidence, and commit each repository under its own task id.

## Explicit non-goals

- No Prisma/schema/migration, repository adapter or database apply.
- No public HTTP route, controller, NestJS registration or network transport.
- No `scenario.manifest.yaml`, generated manifest, product action, protected
  declaration, Workspace capability, feature flag or deployment change.
- No cache, fallback contract, version range, `latest` alias or inferred
  authority.
- No activation of the parent archive/cultivation mobile surfaces.

## Baseline and lock handling

`verify:c30-i3-default-off` still passes with the exact zero-positive census.
The historical C30-I3 owner-adoption source lock is currently stale because
later committed T-007 G4 work changed files already inside its cumulative
profiles. The provider source also adds one explicit export. After the source
unit is committed, the deterministic lock must be re-sealed against that exact
revision; the lock must not be weakened or silently ignored.

## Exit criteria

- Exact Nurture key/version/digest is runtime-checked and test-proved.
- Every resolved result contains exactly the three frozen categories and no
  owner-internal evidence.
- Positive eligibility requires the complete owner-fact intersection and active
  source/destination lifecycles.
- Invalid request/result, owner exception and incomplete/duplicate facts fail
  closed without a partial response.
- My-Chat sends no raw child/family id, pins one exact contract and validates
  every response without caching.
- Default-off census remains unchanged; no DB, manifest, activation or traffic
  effect occurs.
