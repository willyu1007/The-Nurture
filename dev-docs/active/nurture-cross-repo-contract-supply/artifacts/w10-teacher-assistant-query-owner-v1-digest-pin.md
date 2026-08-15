# W10 Teacher Assistant Query Owner v1 — Digest and Adoption Pin

## Exact publication

| Field | Value |
| --- | --- |
| Interface | `nurture.teacher-assistant-query-owner@1.0.0` |
| Content digest | `sha256:d401066102cb398f00b6bd897611ba794abb36d11837a25423f1c19101cadb8e` |
| Digest input | [`teacher-assistant-query-owner.owner-contract.json`](../../../../packages/nurture-scenario/contracts/teacher-assistant-query-owner/v1/teacher-assistant-query-owner.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 via `nurtureCanonicalJson`, UTF-8, SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f…` (unchanged) |
| Capability dependencies | `record_caregiver_daily_care@1.0.0` (handoff vocabulary), `organize_care_capture_batch@1.0.0` (lane vocabulary) — referenced, not re-declared |
| Runtime posture | Three private routes mounted default-off behind `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED`; no deployment, activation or traffic |
| Owner ports | `createPrismaTeacherAssistantQueryBinding` implemented and DB-lane qualified; production `main.ts` constructs no binding |

## Frozen ingress inventory

Read `query_key` derivations: missing-records = `class_ref|local_date`,
weekly-source = `class_ref|week_start` (the week the owner answered). The
exchange echoes `context_ref` + exact `command_request_id`.

| T-039 rows | Operation | Internal path |
| --- | --- | --- |
| `T-H02` | `missing_records_query` | `POST /internal/nurture/teacher-assistant-query-owner/v1/missing-records` |
| `T-H04` facts | `weekly_source_query` | `POST /internal/nurture/teacher-assistant-query-owner/v1/weekly-source` |
| `T-H04` draft | `weekly_draft_exchange` | `POST /internal/nurture/teacher-assistant-query-owner/v1/weekly-draft` |

## Command model the consumer must honor

- The weekly draft is a class-internal single-step command on the generic
  ledger (actor-scoped identity; exact replay answers the recorded result
  with `executed: replayed`; `outcome_unknown` recovery is same-command
  replay) and is additionally domain-idempotent per `(class, week)` — a
  duplicate week answers `already_satisfied` with the SAME `process_ref`.
- Cross-actor or divergent reuse of a command id lands
  `command_payload_conflict` (actor identity is folded into the canonical
  payload). `command_actor_mismatch` is reserved vocabulary in v1.0.0:
  render `command_actor_mismatch` if that token ever arrives, but the current
  owner cannot distinguish the actor from any other payload divergence, so the
  token is never emitted.
- Requests never carry week boundaries — the owner computes the
  Monday-Sunday window from `local_date` and echoes the computed window.
  Rendering must use the echoed `week_start`/`week_end`, never a
  client-computed week.

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly. `class_ref`/`child_ref` are the
  W6-W9 ref families; `process_ref`/`draft_process_ref` are owner-issued.
- The supplement handoff is a typed descriptor
  (`nurture.teacher-organization-owner@1.0.0` / `supplement_exchange` /
  `child_ref` / `availability`) and is present exactly when a child has
  missing kinds. The descriptor is never executable: the handoff target
  re-runs its own current-authority prepare; nothing in this contract writes
  on reads.
- The generation boundary is engine-ready: responses carry deterministic
  facts only (counts, kinds, safe labels) — any prose is the Host engine's
  concern and never rides this interface.
- Conformance fixtures: 11 + 12 invalid probes at
  `packages/nurture-scenario/contracts/teacher-assistant-query-owner/v1/conformance-fixtures.json`,
  17-scenario census; refresh the sanitized snapshot in the adoption
  change.

## Qualification summary (2026-08-15)

Contract validator passes (digest, rows T-H02/T-H04, 17-scenario census,
11 fixtures, 12 probes); ingress census registers the three routes
(controller-routes 49); scenario-service suite 178 tests incl. the 7-case
W10 e2e; unit lane 103 files / 1126 tests; production-DB lane 57 files
green incl. the 5-case real-owner suite (draft create/replay/duplicate
`already_satisfied` with one process row, cross-actor denial, grant-free
refusal). No activation, deployment, traffic or consumer change occurred
in the Nurture repository.
