# W2 Parent-Context Presenter v1 — Scope Draft

Status: DRAFT (2026-08-13). Scope and rules only; strict schemas are the
next authoring step against current Nurture domain models. Nothing here
activates a capability or registers a route.

## Purpose

Publish the Nurture-owned parent-context presenter that unblocks the
My-Chat parent institution tab (园区): T-039 rows `P-O01`–`P-O05` are
`implemented` UI-only and `owner-blocked` solely because "no consumable
versioned owner DTO/adapter authority is registered yet". This artifact is
the first item of the 2026-08-11 supply order and the entry condition for
the IR-C01 parent-communication chain that follows it.

## Contract identity (proposed)

- Key: `nurture.parent-context-presenter@1.0.0`, published with an exact
  content digest, over the current surface-contract baseline
  (`nurture.surface-contract@1.20.0`; whether new surface capabilities
  force a minor surface-contract bump is open item 1).
- Adoption is exact-pin only (key + version + digest); no floating alias.
- Same artifact discipline as `nurture.teacher-release-owner@3.0.0`: the
  private owner contract feeds a My-Chat public DTO that My-Chat versions
  and validates separately; owner authority fields are stripped at the
  public boundary.

## Owner-resolution rules (Q6 discipline, unchanged)

- My-Chat authenticates the Host actor; Nurture resolves the current
  Participant/role/scope on EVERY query and action. No caller-supplied
  Participant is accepted as live binding.
- Every response is `private, no-store`; protected content follows the
  T-036 protected-cache partition and invalidation semantics and the
  cross-role async boundary contract (ASYNC-01..12); no owner business
  enum is shared with the consumer.
- Scope loss, revocation or `context_ref` drift masks previously rendered
  data before render (the consumer already implements this; the presenter
  must return the mask signal, not rely on consumer inference).

## Operations mapped to T-039 rows

| Row | Operation (sketch) | Notes |
| --- | --- | --- |
| `P-O01` | `parent-context day query` | exact `context_ref` + date; previous/next bounds; calendar availability; scope mismatch masks prior scope |
| `P-O02` | `daily-care cards query` | per-card partial/missing values preserved individually; shared policy decides protected display removal |
| `P-O03` | `activity detail + protected media payload` | detail presentation closes on scope/revoke; protected media refs follow the protected-media policy (IR-C05 alignment); no old-link reuse |
| `P-O04` | `notice list query + notice confirmation action` | explicit confirmation through the shared request gate; duplicate, stale, offline, revoked, non-retryable and late-completion paths fail closed with safe reason codes |
| `P-O05` | `freshness/attendance projection` | fresh/stale/offline/refresh-failed states; non-retryable refresh failure masks old rows |

## IR-C01-shaped publication requirements

The artifact ships with all five properties the My-Chat readiness review
requires of any owner interface:

1. exact interface key, semantic version and digest;
2. internal operation paths and authentication method (existing formal
   trusted ingress; no new auth mechanism);
3. strict request/response schemas, bounds and a reviewed safe reason-code
   allowlist;
4. compatibility and deprecation policy (exact-pin adoption, additive
   minors, breaking changes bump major);
5. an environment where My-Chat contract and negative integration tests
   can execute (joint conformance fixtures, mirroring the teacher-release
   v3 joint conformance pattern).

## Open items

1. Whether P-O01–P-O05 capabilities require a surface-contract minor bump
   or fit the existing capability set.
2. Field-level schema authoring against current Nurture domain models
   (day/care/activity/notice/attendance projections) — next step.
3. Protected-media payload shape must align with the later IR-C05
   protected-media policy so W3 does not force a v2.
4. Attendance-state vocabulary: presenter-level display states only; no
   canonical attendance claim (institution workflow stays authoritative).
5. Conformance fixture inventory and the disposable environment recipe for
   My-Chat-side contract tests.

## Boundaries

Default-off; no route, no activation, no durable apply. My-Chat adoption
(dormant adapter, negative-path tests, public DTO, Mobile composition)
stays in T-039 and starts only from the published exact pin.
