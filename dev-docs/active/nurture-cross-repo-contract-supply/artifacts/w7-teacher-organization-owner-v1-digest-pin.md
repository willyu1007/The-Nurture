# W7 Teacher Organization Owner v1 — Digest and Adoption Pin

## Exact publication

The private owner interface is published at this exact pin:

| Field | Value |
| --- | --- |
| Interface | `nurture.teacher-organization-owner@1.0.0` |
| Content digest | `sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161` |
| Digest input | [`teacher-organization-owner.owner-contract.json`](../../../../packages/nurture-scenario/contracts/teacher-organization-owner/v1/teacher-organization-owner.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 through the repository `nurtureCanonicalJson` implementation, UTF-8, then SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| Capability dependencies | `organize_care_capture_batch@1.0.0`, `record_caregiver_daily_care@1.0.0`, `query_teacher_publish_queue@1.0.0` (referenced, not re-declared) |
| Relationship | Standalone composition; the surface baseline and its pin JSON are unchanged |
| Runtime posture | Six private scenario-service routes mounted default-off behind `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED`; absent enablement, service auth or a complete authority/owner/protected-content binding returns `503`; no deployment, activation or traffic |
| Owner ports | Real binding `createPrismaTeacherOrganizationBinding` is implemented and DB-lane qualified; production `main.ts` intentionally constructs no binding (presence is not activation) |

The digest scope is exactly the parsed owner-contract JSON value. README,
fixtures, validator and this record are outside the digest scope. Every fixture
request and read cache partition carries the computed digest, and the contract
validator, runtime request parsers and runtime response validator all reject
drift.

## Frozen ingress inventory

All responses carry `Cache-Control: private, no-store` and `Pragma: no-cache`.
The two reads use `query_key === class_ref`; the four exchanges carry no cache
partition and echo `context_ref` plus the exact `command_request_id`.

| T-039 rows | Operation | Internal path |
| --- | --- | --- |
| `T-F08` | `feed_query` | `POST /internal/nurture/teacher-organization-owner/v1/feed` |
| `T-F09`, `T-F11`, `T-F10` preview | `organization_query` | `POST /internal/nurture/teacher-organization-owner/v1/organization` |
| `T-F02` | `organize_exchange` | `POST /internal/nurture/teacher-organization-owner/v1/organize` |
| `T-F05` | `supplement_exchange` | `POST /internal/nurture/teacher-organization-owner/v1/supplement` |
| `T-F15` | `class_note_exchange` | `POST /internal/nurture/teacher-organization-owner/v1/class-note` |
| `T-F10` | `queue_admission_exchange` | `POST /internal/nurture/teacher-organization-owner/v1/queue-admission` |

## Command model the consumer must honor

- Every exchange result is `committed | not_committed | outcome_unknown`
  (organize and admission fold their domain outcomes inside `committed`);
  recovery from `outcome_unknown` is an exact same-command replay
  (`recovery: reconcile_same_command`), never a new `command_request_id`.
- Command identity is actor-scoped: the owner folds a workspace+participant
  HMAC into every canonical payload, so another actor replaying the same
  `command_request_id` — or the same actor with a divergent payload — lands
  `not_committed / command_payload_conflict`. `command_actor_mismatch`
  remains a reserved schema code.
- `supplement_exchange` is the only prepare/confirm: prepare returns a
  single-use, five-minute, body-free `confirmation_ref` plus
  `prepared_preview_digest`; confirm re-submits exactly that pair. Expired,
  consumed, foreign or digest-mismatched confirmations land the frozen
  `not_committed` reasons.
- `organize`, `class-note` and `queue-admission` are single-step
  class-internal commands (no confirmation gesture). A no-cut organize
  answers `committed / nothing_to_organize` with `executed: executed` (no
  ledger entry exists to replay); admission is additionally idempotent by
  domain design (`disposition: already_satisfied`).
- Nothing here auto-sends: admission freezes the owner-side schedule only;
  release stays with the separate teacher-release-owner confirm.

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly; carry the digest into the read cache
  partition type so rotation invalidates by construction.
- `class_ref`, `child_ref`, `process_ref`, `capture_ref` are owner-issued
  opaque refs resolved by candidate matching. `class_ref`/`child_ref` are the
  same ref family the W6 class-stream presenter issues, so W6 reads feed W7
  commands directly. A stale or foreign ref returns `masked` with
  `purge_partition: true`.
- Feed captures carry `text_excerpt` only for stable text kinds (≤120
  chars); media bytes never appear (the stream ingress stays reserved for
  W9). In the current runtime `failure` is always `none` — the owner has no
  upload-failure column yet.
- The organization read reports at most one active `quick_adjust_until` per
  lane; a `pending_release` card always previews `already_satisfied`. The
  read preview is never command authorization — every exchange re-evaluates
  on execution.
- Conformance fixtures: 17 positive/failure fixtures plus 14 executed
  invalid probes at
  `packages/nurture-scenario/contracts/teacher-organization-owner/v1/conformance-fixtures.json`,
  with an 18-scenario required negative census. The My-Chat sanitized
  snapshot set (`packages/scenario-integrations/fixtures/nurture/` +
  `SNAPSHOT.json`) must be refreshed in the adoption change.
- Invalid probes use only set/delete mutations at object keys, replayable by
  the established consumer `applyMutation` helper.

## Qualification summary (2026-08-14)

Contract validator (digest, row coverage, 18-scenario census, 14 invalid
probes) passes; formal ingress census registers the six routes and the
per-contract assertion block (controller-routes 36); scenario-service suite
151 tests across 22 files including the 7-case W7 e2e; unit lane 100 files /
1104 tests; production-DB lane 54 files / 479 tests including the 6-case
real-owner integration suite (ledger replay, cross-actor denial, supplement
prepare/confirm, admission windows). No activation, durable apply,
deployment, traffic or consumer change occurred in the Nurture repository.
