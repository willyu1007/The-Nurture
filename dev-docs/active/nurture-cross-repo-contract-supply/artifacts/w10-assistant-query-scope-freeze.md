# W10 Scope Freeze — nurture.teacher-assistant-query-owner@1.0.0

Frozen 2026-08-14 under the W6-W11 schedule
(`w6-teacher-supply-schedule.md`). W10 supplies the two assistant-backed
teacher queries: the missing-record answer with its typed (non-executable)
handoff, and the weekly summary as owner facts plus an owner-created draft
that enters the existing W7 review lane. The generation boundary stays
engine-ready: the owner assembles deterministic content only and never
calls a model provider; any prose generation is the Host engine's separate
concern over the same facts. Changes after this point follow the
append-only correction convention.

## Interface identity

- Key/version: `nurture.teacher-assistant-query-owner@1.0.0`
- Kind: `private_owner_exchange` (two reads plus one command)
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `record_caregiver_daily_care@1.0.0` (handoff vocabulary only),
  `organize_care_capture_batch@1.0.0` (lane vocabulary only)
- Transport: POST, JSON, service bearer, `Cache-Control: private, no-store`
- Env gate: `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` (optional,
  non-secret, default false); fail-closed factory as in W6-W9
- Safe reason codes: `teacher_assistant_query_owner_disabled`,
  `invalid_teacher_assistant_query_request`,
  `teacher_assistant_query_contract_mismatch`

## Operations and consumer rows

Base path `/internal/nurture/teacher-assistant-query-owner/v1/`:

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `missing_records_query` | `missing-records` | T-H02 | For the exact class and `local_date`: per enrolled child (≤80) the five daily-care kinds' presence, the missing-kind list, and — when at least one kind is missing — a typed handoff descriptor `{interface: nurture.teacher-organization-owner@1.0.0, operation: supplement_exchange, child_ref}` plus availability. The descriptor is never an executable reference: the handoff target rereads current authority and this query writes nothing (the W6 `supplement_action` discipline). `missing_count` summarizes the class. |
| `weekly_source_query` | `weekly-source` | T-H04 facts | Deterministic weekly facts for the ISO week containing `local_date` (owner-computed Monday-Sunday window echoed as `week_start`/`week_end`): per child the daily-care log count per kind and the confirmed-media count (the observation chain W9's association supplies), plus class totals and whether an owner weekly draft already exists for this week (`draft_process_ref` when it does). No prose, no generated text — facts only, agent labelling is the draft's concern. |
| `weekly_draft_exchange` | `weekly-draft` | T-H04 draft | Creates the owner-side weekly summary draft for `(class, week)` on the generic ledger: one publish process (`data_class: care_day_note`, purpose `family_weekly_summary`, origin agent-labelled), a first revision whose sealed body is the deterministic weekly-facts document assembled by the owner, and per-child targets over the same eligibility the organize cut uses. The process enters the W7 organization lane in `draft`/`needs_review` per the frozen safety route and follows the existing review -> admission -> release lifecycle — nothing here sends, schedules or releases. Domain-idempotent by `(class, week)`: an existing draft answers `already_satisfied` with the same `process_ref`. |

## Authority and command model

- Caller context, forbidden fields, W6 caregiver resolver, `class_ref`
  candidate matching and read `query_key` derivations
  (`class_ref|local_date` for missing-records, `class_ref|week_start` for
  weekly-source) follow W6-W9 verbatim.
- The exchange runs on the generic command ledger with the W7 actor HMAC;
  exact same-command replay answers the recorded result; command identity
  excludes volatile heads (the W7 lesson); cross-actor or divergent reuse
  lands `command_payload_conflict`; `outcome_unknown` recovery is exact
  same-command replay.
- Week identity is owner-computed from `local_date` under the institution
  publication-policy timezone; the caller never supplies week boundaries.

## Port set (implemented in-wave, W3.1 style)

- W6-pattern authority resolver (context read port reused structurally).
- Reads reuse the W6 class-stream read port for children/day facts plus a
  W10 aggregation read (daily-care counts per kind per week, confirmed
  media counts via the W9 attribution rows, weekly-draft existence by
  process key `weekly:<care_group>:<week_start>`).
- The draft write is a new owner transaction
  (`applyWeeklyDraftProcess`) on the command transaction: process +
  sealed first revision + targets in one transaction, reusing the
  eligibility and protected-content ports. Expected schema change: none
  (`NurturePublishProcess` and its revision/target tables carry it).

## Negative matrix (fixture-backed, minimum)

W6-W9 set (not_authorized variants incl. guardian, stale/cross-scope refs,
disabled gate, service auth, forbidden request field, hidden payload,
digest mismatch, invalid date) plus: cross-actor replay denial, divergent
same-command payload conflict, `outcome_unknown` same-command recovery,
duplicate weekly draft answering `already_satisfied` with the same
process_ref, handoff descriptor never executable (no `action_ref` class
fields anywhere), week-boundary tampering rejected at parse (no week
fields accepted in requests).

## Explicitly out of W10

Model/provider calls, generated prose, auto-send or scheduling (I-Q1),
draft editing (the existing W7/W3 editing lanes own it), release (the
teacher-release-owner confirm owns it), any activation, durable apply,
deployment, or traffic claim. The frozen G5-A Candidate is untouched.

## Implementation order

W10-1 contract artifact -> W10-2 default-off runtime -> W10-3 real owner
ports (unit + production-DB lanes) -> W10-4 registration -> W10-5
digest-pin handoff + My-Chat dormant strict consumer + matrix rows
(T-H02, T-H04).
