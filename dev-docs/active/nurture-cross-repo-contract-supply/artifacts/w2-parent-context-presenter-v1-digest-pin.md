# W2 Parent-Context Presenter v1 — Digest and Adoption Pin

## Exact publication

The authored private owner interface is ready for review at this exact pin:

| Field | Value |
| --- | --- |
| Interface | `nurture.parent-context-presenter@1.0.0` |
| Content digest | `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196` |
| Digest input | [`parent-context-presenter.owner-contract.json`](../../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/parent-context-presenter.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 through the repository `nurtureCanonicalJson` implementation, UTF-8, then SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| Relationship | Standalone composition; the surface baseline and its pin JSON are unchanged |
| Runtime posture | Five private scenario-service routes mounted default-off; absent enablement, service auth, complete Q6 owner ports or active consumer-generation boundary port returns `503`; no deployment activation or traffic |

The digest scope is exactly the parsed owner-contract JSON value. README,
fixtures, validator and this record are outside the digest scope. Every fixture
request and protected-cache partition carries the computed digest, and the
validator rejects drift.

## IR-C01 publication-property satisfaction

| IR-C01 property | Satisfaction in this publication |
| --- | --- |
| 1. Exact identity | The key, semantic version and RFC 8785 content digest are recorded above. Adoption MUST pin all three; a file path or branch is not identity. |
| 2. Ingress and authentication | Five internal `POST` paths are mounted through the formal scenario-service ingress. Every path uses the existing teacher-release-style `service_bearer` mode and `NURTURE_INTERNAL_SERVICE_TOKEN` contract, the controller-scoped private-response exception filter, and the pinned ingress census. Missing configuration returns `503`; invalid service auth returns `401`; both are private/no-store. The signed Ed25519/nonce profile remains confined to invocation-envelope routes and is not applicable to this service-bearer owner DTO. |
| 3. Strict schemas and safe reasons | The canonical artifact embeds Draft 2020-12 closed request/response schemas for every operation plus a discriminated `oneOf` notice-exchange matrix. The service compiles the published response schemas at startup and validates every composed response. Recursive foreign fields fail closed as generic private/no-store 500s. Caller Participant/role/scope fields fail. The reviewed 14-code safe allowlist is closed and coarsens owner failures; no owner business enum is a wire field. |
| 4. Compatibility and deprecation | Adoption is exact-pin only. Additive optional fields or operations require a new minor and digest. Removal, rename, narrowing, reinterpretation or reason/enum changes require a new major. A bilateral retirement record is required before deprecation; no floating alias or version range is allowed. |
| 5. Executable conformance environment | The versioned directory contains 16 owner fixtures, eight executed expected-invalid mutations and an RFC 8785 validator. A 12-case Nest e2e suite uses `Test.createTestingModule` and in-memory Node HTTP injection against all five mounted routes, including auth, Q6 resolution, masking, full-tuple confirmation, notice-matrix, closed-response, replay and application ASYNC-12 negatives without a database, deployment or listener. |

## Frozen ingress inventory

All responses, including authentication and validation failures, MUST carry
`Cache-Control: private, no-store` and `Pragma: no-cache`.

| T-039 row | Operation | Internal path | Request/response schema refs |
| --- | --- | --- | --- |
| `P-O01` | `day_query` | `POST /internal/nurture/parent-context-presenter/v1/day` | `day_query_request` / `day_query_response` |
| `P-O02` | `daily_care_cards_query` | `POST /internal/nurture/parent-context-presenter/v1/daily-care` | `daily_care_cards_query_request` / `daily_care_cards_query_response` |
| `P-O03` | day `activities[]` source plus `activity_detail_query` | `POST /internal/nurture/parent-context-presenter/v1/day` and `POST /internal/nurture/parent-context-presenter/v1/activity-detail` | day response carries at most 20 opaque-ref/title/timestamp/media-state summaries; retained detail schemas resolve one list-supplied `activity_ref` |
| `P-O04` | `notice_list_and_confirmation` | `POST /internal/nurture/parent-context-presenter/v1/notices` | `notice_operation_request` / `notice_operation_response` plus `notice_operation_exchange`; discriminated `list`, `prepare_confirmation`, `confirm` branches bind action ref/version, prepared preview digest, `confirmation_ref` and `command_request_id` |
| `P-O05` | `freshness_attendance_projection` | `POST /internal/nurture/parent-context-presenter/v1/freshness-attendance` | `freshness_attendance_request` / `freshness_attendance_response` |

My-Chat supplies only the exact interface pin plus authenticated Workspace,
user, request and `context_ref` inputs. Nurture MUST resolve the current
Participant, Guardian role, exact association, single Enrollment, CareGroup,
Grant, visibility, purpose and protected-display policy on every call and every
notice sub-exchange. None of those owner authority facts may be accepted from
the caller or returned as raw identifiers.

## Reviewed safe reason-code allowlist

| Code | Retry | Mask | Consumer recovery |
| --- | --- | --- | --- |
| `access_changed` | No | Yes | Leave the private surface |
| `context_changed` | No | Yes | Resolve context again |
| `ambiguous_context` | No | Yes | Select context again; never pick the first Enrollment |
| `protected_display_denied` | No | Yes | None |
| `refresh_not_retryable` | No | Yes | Resolve context again |
| `content_unavailable` | No | No | None |
| `temporarily_unavailable` | Yes | No | Retry the read through the shared transient allowlist |
| `request_invalid` | No | No | Repair the request or exact pin |
| `media_unavailable` | No | No | None; do not reuse an old media link |
| `confirmation_expired` | No | No | Reprepare |
| `confirmation_replayed` | No | No | Refresh; never infer success |
| `invalid_confirmation` | No | No | None |
| `stale_confirmation` | No | No | Reprepare |
| `confirmation_outcome_unknown` | No | No | Reconcile only the same command |

`access_changed` intentionally coarsens Participant, role, association,
Enrollment, Grant, visibility and scope loss. It neither identifies which owner
fact changed nor discloses whether another protected context exists.

## Protected-cache and media boundary

The artifact normatively references
`my-chat.mobile.async-boundary@1.0.0` and ASYNC-01 through ASYNC-12. A protected
partition includes interface key/version/digest, Workspace, My-Chat user,
presenter role, `context_ref`, owner `resolution_ref`, owner `scope_version`,
operation and query key. There is no prefix, prior-role or prior-context
fallback.

A mask signal synchronously removes protected content, actions and media access
before navigation or replacement render. Stale display is explicit and
read-only. Offline is a My-Chat transport state, not an owner response fact.
Non-retryable refresh masks old rows. A response from an older request
generation cannot render or write cache. Enabled composition therefore requires
an active-consumer boundary port: application code captures the response
generation, rereads current generation/context after owner completion and
replaces a late result with a closed unavailable response. The port supplies
My-Chat-owned state; Nurture does not mint or infer that state.

Protected activity media contains only an opaque `media_ref`, an actor/context/
expiry-bound `access_ref`, a bounded expiry and `delivery_mode=owner_stream`.
It contains no storage ref, signed URL or reusable link. This shape leaves the
later IR-C05 policy responsible for access-ref issuance and resolution without
requiring a v2 wire shape; any additive optional metadata would use a minor.

## Executable conformance recipe

Prerequisites are Node 20 or newer and the repository's existing pnpm install.
No database, deployment, network listener or generated pin update is required.

From the exact Nurture checkout under review:

```bash
node --import tsx packages/nurture-scenario/contracts/parent-context-presenter/v1/validate-contract.mjs
```

Expected result begins with:

```text
[ok] parent-context-presenter contract=nurture.parent-context-presenter@1.0.0 digest=sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196 operations=5 fixtures=16 invalid-fixtures=8 consistency-probes=11 strict-probes=10
```

Then execute the mounted default-off ingress conformance:

```bash
pnpm --dir apps/scenario-service exec vitest run -c vitest.config.ts tests/parent-context-presenter-controller.e2e.test.ts
```

The suite builds the real Nest testing module and injects Node HTTP
request/response objects into its mounted Express adapter. Route selection,
body parsing, decorators, guards and filters execute normally without a
listener or manual controller dispatch. The formal ingress census separately
hard-pins all five physical routes and controller/filter registration.

For My-Chat joint conformance, its dormant strict adapter MUST load the
canonical artifact and [`conformance-fixtures.json`](../../../../packages/nurture-scenario/contracts/parent-context-presenter/v1/conformance-fixtures.json)
from this exact digest, execute each fixture through the corresponding private
DTO decoder/state adapter, and assert the fixture `client_rule`. In particular,
the joint lane MUST retain the fixture labels for scope loss, revoke, stale
`context_ref`, ambiguous Enrollment, protected-display denial, non-retryable
refresh, confirmation replay and ASYNC-12 late completion. This is executable
contract evidence only; owner integration and adoption readiness remain review
gates.

## Review boundary

This record publishes a repaired candidate and does not tick W2 acceptance.
Review must judge field semantics, safe-code coarsening, fixture sufficiency and
My-Chat dormant-adapter readiness against the exact digest. No pin JSON,
database, deployment or activation change is authorized here; mounted routes
remain unavailable without explicit configuration and complete owner ports.
