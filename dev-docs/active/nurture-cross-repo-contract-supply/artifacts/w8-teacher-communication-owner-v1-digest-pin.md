# W8 Teacher Communication Owner v1 — Digest and Adoption Pin

## Exact publication

The private owner interface is published at this exact pin:

| Field | Value |
| --- | --- |
| Interface | `nurture.teacher-communication-owner@1.0.0` |
| Content digest | `sha256:e4a831cdb867ab2a5ad38d6e634e13b9da41d44606a9644c6aa0b7fd36503edf` |
| Digest input | [`teacher-communication-owner.owner-contract.json`](../../../../packages/nurture-scenario/contracts/teacher-communication-owner/v1/teacher-communication-owner.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 through the repository `nurtureCanonicalJson` implementation, UTF-8, then SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| Capability dependencies | `initiate_caregiver_direct_message@1.0.0`, `organize_care_capture_batch@1.0.0` (referenced, not re-declared) |
| Relationship | Standalone composition; the surface baseline and its pin JSON are unchanged |
| Runtime posture | Six private scenario-service routes mounted default-off behind `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED`; absent enablement, service auth or a complete authority/owner/protected-content binding returns `503`; no deployment, activation or traffic |
| Owner ports | Real binding `createPrismaTeacherCommunicationBinding` is implemented and DB-lane qualified; production `main.ts` intentionally constructs no binding |

## Frozen ingress inventory

All responses carry `Cache-Control: private, no-store` and `Pragma:
no-cache`. Read `query_key` derivations: targets = `class_ref`, membership =
`thread_ref`, timeline = `thread_ref|cursor-or-first`. The three exchanges
carry no cache partition and echo `context_ref` plus the exact
`command_request_id`.

| T-039 rows | Operation | Internal path |
| --- | --- | --- |
| `T-C02`, `T-S04` | `targets_query` | `POST /internal/nurture/teacher-communication-owner/v1/targets` |
| `T-C03` | `membership_query` | `POST /internal/nurture/teacher-communication-owner/v1/membership` |
| `T-C04` | `timeline_query` | `POST /internal/nurture/teacher-communication-owner/v1/timeline` |
| `T-C09` | `send_text_exchange` | `POST /internal/nurture/teacher-communication-owner/v1/send-text` |
| `T-C07`, `T-C05` | `withdraw_staged_exchange` | `POST /internal/nurture/teacher-communication-owner/v1/withdraw-staged` |
| `T-C02` badge clear | `mark_read_exchange` | `POST /internal/nurture/teacher-communication-owner/v1/mark-read` |

## Command model the consumer must honor

- Every exchange lands `committed | not_committed | outcome_unknown`;
  recovery from `outcome_unknown` is an exact same-command replay, never a
  new `command_request_id`. Command identity is actor-scoped (the W7 HMAC
  discipline); cross-actor or divergent reuse lands
  `command_payload_conflict`.
- `send_text_exchange` is the only prepare/confirm (outward family-visible
  effect): prepare returns a single-use five-minute body-free
  `confirmation_ref` plus `prepared_preview_digest`; confirm re-submits
  exactly that pair. Text only (1..2000); voice stays excluded.
- `withdraw_staged_exchange` touches **staged** items only
  (`withdrawn`/`already_withdrawn`); sent-message withdrawal is a different
  lifecycle outside this contract. `mark_read_exchange` advances only the
  teacher's own cursor, never backwards (`cursor_regression`).
- The `class_group` rail entry is frozen
  `send_availability: "unavailable"` / `class_group_reserved`; nothing here
  schedules or auto-sends (T-C08 stays gated on I-Q1).

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly; carry the digest into the read cache
  partition type.
- `class_ref` is the W6/W7 ref family; `thread_ref`, `message_ref`,
  `process_ref` are owner-issued opaque refs resolved by candidate
  matching. Stale or foreign refs return `masked` with
  `purge_partition: true`.
- The timeline response echoes the exact request cursor (`null` for the
  first page — the W4 replay rule); `next_cursor` appears only with
  `has_more: true`. Cursors are owner-sealed tokens: never construct or
  edit one; a tampered cursor closes as non-retryable `request_invalid`.
- Unread counts derive from the teacher's own owner-side cursor and only
  `mark-read` clears them; the current runtime never reports
  `delivered` (no device-delivery source exists) — render `sent`/`read`
  plus `not_applicable`.
- Media messages are presence descriptors (`has_media`, no body, no access
  op); bytes arrive with the W9 media supply.
- Conformance fixtures: 18 positive/failure fixtures plus 14 executed
  invalid probes at
  `packages/nurture-scenario/contracts/teacher-communication-owner/v1/conformance-fixtures.json`,
  with a 20-scenario required negative census. The My-Chat sanitized
  snapshot set must be refreshed in the adoption change.

## Qualification summary (2026-08-14)

Contract validator (digest, row coverage, 20-scenario census, 14 invalid
probes) passes; formal ingress census registers the six routes and the
per-contract assertion block (controller-routes 42); scenario-service suite
160 tests including the 7-case W8 e2e; unit lane 101 files / 1111 tests;
production-DB lane 55 files / 484 tests including the 5-case real-owner
integration suite (ledger replay of send/withdraw, own-cursor mark-read,
cancelled-process replay resolution). No activation, durable apply,
deployment, traffic or consumer change occurred in the Nurture repository.
