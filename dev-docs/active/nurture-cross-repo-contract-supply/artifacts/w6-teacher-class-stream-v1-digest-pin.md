# W6 Teacher Class-Stream Presenter v1 — Digest and Adoption Pin

## Exact publication

The private owner interface is published at this exact pin:

| Field | Value |
| --- | --- |
| Interface | `nurture.teacher-class-stream-presenter@1.0.0` |
| Content digest | `sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3` |
| Digest input | [`teacher-class-stream.owner-contract.json`](../../../../packages/nurture-scenario/contracts/teacher-class-stream/v1/teacher-class-stream.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 through the repository `nurtureCanonicalJson` implementation, UTF-8, then SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| Capability dependencies | `query_caregiver_teacher_board@1.0.0`, `query_caregiver_child_today@1.0.0` (referenced, not re-declared) |
| Relationship | Standalone composition; the surface baseline and its pin JSON are unchanged |
| Runtime posture | Four private scenario-service routes mounted default-off behind `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED`; absent enablement, service auth or a complete authority/owner binding returns `503`; no deployment, activation or traffic |
| Owner ports | Real Prisma binding `createPrismaTeacherClassStreamBinding` is implemented and disposable-DB qualified; production `main.ts` intentionally constructs no binding (presence is not activation; the deployed carrier is a separate gate) |

The digest scope is exactly the parsed owner-contract JSON value. README,
fixtures, validator and this record are outside the digest scope. Every fixture
request and cache partition carries the computed digest, and both the contract
validator and the runtime response validator reject drift.

## Frozen ingress inventory

All responses, including authentication and validation failures, carry
`Cache-Control: private, no-store` and `Pragma: no-cache`. All four operations
are bounded single-page reads; no cursor exists in this version, and
`query_key` is the deterministic request derivation asserted at three layers
(fixtures, contract validator, runtime binding assert).

| T-039 rows | Operation | Internal path | Query key |
| --- | --- | --- | --- |
| `T-S03`, `T-F01`, `T-H01` context | `class_context_query` | `POST /internal/nurture/teacher-class-stream/v1/class-context` | `local_date` |
| `T-F03` | `child_strip_query` | `POST /internal/nurture/teacher-class-stream/v1/child-strip` | `class_ref\|local_date` |
| `T-F04` | `child_day_detail_query` | `POST /internal/nurture/teacher-class-stream/v1/child-day-detail` | `child_ref\|local_date` |
| `T-F06`, `T-F07` | `schedule_query` | `POST /internal/nurture/teacher-class-stream/v1/schedule` | `class_ref\|local_date` |

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly; carry the digest into the cache
  partition type so rotation invalidates by construction.
- `class_ref`/`child_ref` are owner-issued opaque refs. A stale or foreign ref
  returns a `masked` response with `purge_partition: true`; the client must
  drop the partition and re-enter from `class_context_query`.
- The `child_day_detail_query` response always carries the five ordered
  sections `arrival, daily_care, family_instructions, observations,
  focus_link`. In the current runtime `observations` and `focus_link` are
  honestly `unavailable` (their caregiver-visible sources arrive with
  W9/W10); consumers must render the unavailable state, not treat it as
  empty.
- `not_expected` attendance is reported as an `empty` arrival section; no slot
  ever carries `current: true` until an institution timezone becomes
  canonical; `as_of` is still reported.
- The daily-care section may carry a `supplement_action` availability
  descriptor (`record_caregiver_daily_care@1.0.0`); it is never an executable
  reference. Writes belong to the W7 organization owner.
- Conformance fixtures: 12 positive/failure fixtures plus 12 executed invalid
  probes at
  `packages/nurture-scenario/contracts/teacher-class-stream/v1/conformance-fixtures.json`.
  The My-Chat sanitized snapshot set
  (`packages/scenario-integrations/fixtures/nurture/` + `SNAPSHOT.json`)
  must be refreshed in the adoption change, per its recorded refresh rule.
- Invalid probes use only set-mutations at object keys or array indices, so
  the established consumer `applyMutation` helper replays them without
  array-splice support.

## Qualification summary (2026-08-14)

Contract validator (digest, row coverage, negative-scenario census, 12 invalid
probes) passes; formal ingress census registers the four routes and the
per-contract assertion block; scenario-service e2e passes 18 files / 142
tests including the five W6 scenarios; unit lane 99 files / 1095 tests;
production-DB lane 53 files / 472 tests including the 4-case real-owner
integration suite; root typecheck, build and built-process smoke pass. No
activation, durable apply, deployment, traffic or consumer change occurred.
