# W2 Parent-Context Presenter v1 — Scope Draft

Status: AUTHORED (2026-08-13), awaiting adoption-readiness review. This scope
record now points to the standalone v1 artifact, fixtures and exact digest. It
does not activate a capability. Five scenario-service routes are mounted behind
an absent-by-default enablement gate and fail closed unless service auth plus
the complete Q6 owner ports and active consumer-generation boundary port are
supplied.

## Authored artifact

- Canonical owner contract:
  [`parent-context-presenter.owner-contract.json`](../../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/parent-context-presenter.owner-contract.json)
- Joint conformance fixtures and validator:
  [`parent-context-presenter/v1`](../../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/)
- Exact digest, IR-C01 property record and executable recipe:
  [`w2-parent-context-presenter-v1-digest-pin.md`](./w2-parent-context-presenter-v1-digest-pin.md)
- Authored identity:
  `nurture.parent-context-presenter@1.0.0` /
  `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196`

## Purpose

Publish the Nurture-owned parent-context presenter that unblocks the
My-Chat parent institution tab (园区): T-039 rows `P-O01`–`P-O05` are
`implemented` UI-only and `owner-blocked` solely because "no consumable
versioned owner DTO/adapter authority is registered yet". This artifact is
the first item of the 2026-08-11 supply order and the entry condition for
the IR-C01 parent-communication chain that follows it.

## Contract identity

- Key: `nurture.parent-context-presenter@1.0.0`, published with an exact
  content digest, over the current surface-contract baseline
  (`nurture.surface-contract@1.20.0`) as a standalone composition.
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
  enum is shared with the consumer. The service compiles the published closed
  response schemas at startup and rejects schema or semantic drift with a
  generic private/no-store 500 response.
- Scope loss, revocation or `context_ref` drift masks previously rendered
  data before render (the consumer already implements this; the presenter
  must return the mask signal, not rely on consumer inference).

## Operations mapped to T-039 rows

| Row | Operation (sketch) | Notes |
| --- | --- | --- |
| `P-O01` | `parent-context day query` | exact `context_ref` + date; previous/next bounds; calendar availability; scope mismatch masks prior scope |
| `P-O02` | `daily-care cards query` | per-card partial/missing values preserved individually; shared policy decides protected display removal |
| `P-O03` | `day activity summaries + activity detail + protected media payload` | day query supplies bounded card summaries and activity refs; detail presentation closes on scope/revoke; protected media refs follow the protected-media policy (IR-C05 alignment); no old-link reuse |
| `P-O04` | `notice list query + notice confirmation action` | a discriminated exchange schema closes the kind/status matrix; list, prepare and confirm bind action ref/version, RFC 8785 preview digest, `confirmation_ref` and `command_request_id`; duplicate, stale, offline, revoked, non-retryable and late-completion paths fail closed |
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

## Resolved decision ledger

The v1 field and failure semantics are closed for this review round. Future
owner-adapter composition and My-Chat adoption still require their separate
review decisions; the mounted default-off routes do not decide either.

1. **Publication shape — resolved.** W2 is a standalone artifact over the
   exact existing Surface `1.20.0` baseline, matching the knowledge-safety
   `/v2` standalone pattern. It does not mutate the Surface artifact or any pin
   JSON.
2. **Field schemas — resolved.** One embedded Draft 2020-12 schema document
   closes every request and response recursively for all five operations. The
   schemas use bounded display projections from current day, daily-care,
   activity/media, notice and attendance models without exposing their owner
   business enums.
3. **Protected media — resolved.** The v1 wire carries only opaque
   actor/context/expiry-bound owner-stream access refs, never a storage ref,
   signed URL or reusable link. IR-C05 owns later issuance/resolution policy;
   additive optional metadata uses a minor and a breaking reinterpretation uses
   a major.
4. **Attendance vocabulary — resolved.** `present`, `no_attendance`, `closed`
   and `unknown` are presenter display states only. They do not become a second
   canonical attendance claim; institution workflow remains authoritative.
5. **Conformance environment — resolved.** Sixteen versioned owner fixtures
   cover every operation, eight mutation fixtures are required to fail schema
   validation, and a 12-case Nest testing-module suite injects real Node HTTP
   requests into all five mounted routes. It covers auth negatives, Q6 owner
   resolution, six masking classes, full-tuple notice confirmation, invalid
   notice kind/status pairing, closed-response rejection, replay and
   application-owned ASYNC-12 rejection. No database, listener, deployment,
   activation or traffic is required.

## Boundaries

Default-off; routes are mounted but absent configuration returns `503`; no
activation or durable apply occurs. My-Chat adoption (dormant adapter,
negative-path tests, public DTO, Mobile composition) stays in T-039 and starts
only from the published exact pin. The async-boundary port reads My-Chat-owned
active generation/context state; Nurture does not create canonical consumer
state.
