# W11 Scope Freeze — nurture.parent-communication-owner@1.1.0

Frozen 2026-08-15 under the W6-W11 schedule
(`w6-teacher-supply-schedule.md`). W11 supplies the two parent-side gaps
P-H05 and P-H06 as an ADDITIVE extension of the frozen
`nurture.parent-communication-owner@1.0.0`: the guardian redaction
preview/commit pair over the existing G4-C redaction machinery, and the
per-message delivery-receipt read over the existing ChildLinkReceipt
facts. The frozen 1.0.0 artifact, digest, routes and posture are not
touched; consumers of 1.0.0 keep working unchanged. Changes after this
point follow the append-only correction convention.

## Interface identity

- Key/version: `nurture.parent-communication-owner@1.1.0`
- Kind: `private_owner_query_and_command` (two reads plus one command)
- Base interface (declared, never re-published):
  `nurture.parent-communication-owner@1.0.0` at digest
  `sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f`
- Artifact home: `contracts/parent-communication-owner/v1-1/` — a separate
  digest input; the v1 directory stays byte-identical
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `redact_family_care_message@1.0.0` (the G4-C author-redaction command)
- Transport: POST, JSON, service bearer, `Cache-Control: private,
  no-store`, base path
  `/internal/nurture/parent-communication-owner/v1.1/`
- Env gate: `NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` (optional,
  non-secret, default false) — independent of the frozen v1 gate, so the
  1.0.0 posture is untouched; fail-closed factory as in W6-W10
- Safe reason codes: `parent_communication_extension_disabled`,
  `invalid_parent_communication_extension_request`,
  `parent_communication_extension_contract_mismatch`

## Operations and consumer rows

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `redaction_preview_query` | `redaction-preview` | P-H05 prepare | For one guardian-authored message (`message_ref`, v1 candidate matching): the typed redaction preview — cascade scope (`source_question` or `reply_local`), bounded impact facts (affected reply count, whether a derived daily-care record exists), and the prepared confirmation (`confirmation_ref`, `prepared_preview_digest`, `expires_at`, `command_request_id`) issued through the same `prepareRedactFamilyCareMessage` machinery the Harness uses (actor `author`). Preview writes nothing; a message the guardian cannot redact answers `masked`. |
| `redact_exchange` | `redact` | P-H05 commit | Confirms the prepared redaction on the generic command ledger via `createRedactFamilyCareMessageSpec("author")` verbatim: exact confirmation consume, preview-digest equality, W3 conflict discipline (`stale_confirmation` re-prepares), exact same-command replay, `outcome_unknown` recovery `reconcile_same_command`. Committed answers `message_ref`, `redacted_at` and the cascade summary `{scope, affected_count}`. Redaction is irreversible and audited; nothing here deletes rows. |
| `delivery_receipt_query` | `delivery-receipts` | P-H06 | For one guardian-sent message: the aggregate delivery state derived from the owner's ChildLinkReceipt facts — `sent | delivered | read | not_applicable` (the frozen v1 mapping: read/acknowledged→read, delivered→delivered, failed/blocked/revoked_after_delivery→not_applicable, else sent) plus the advancing instant when one exists. No recipient identities, receipt ids or counts leak; the read is trivially idempotent (P-H06's retry gate). |

## Authority and command model

- Caller identity, forbidden fields, enrollment-scoped guardian authority
  resolution, message candidate matching and the ready-envelope binding
  follow the frozen v1 discipline verbatim; read `query_key` is
  `message_ref` for both reads.
- The exchange reuses the W3 two-step confirm discipline: the preview is
  the prepare; the confirm consumes the exact confirmation and compares
  the prepared preview digest; expected message version rides
  expected-heads (never the command identity); cross-actor or divergent
  reuse lands `command_payload_conflict`.
- `not_committed` reasons (frozen): `stale_confirmation`,
  `confirmation_expired`, `confirmation_foreign`,
  `preview_digest_mismatch`, `message_already_redacted`,
  `command_payload_conflict`.

## Port set (implemented in-wave, W3.1 style)

- Reuses the v1 owner service's authority resolver and read facts; adds a
  W11 read for the redaction-impact preview facts and the per-message
  receipt aggregation (both over existing rows: messages, replies,
  derived daily-care logs, ChildLinkReceipts).
- The commit rides the existing `familyCare` command transaction and the
  frozen G4-C spec — expected schema change: none; no new kernel
  transaction.

## Negative matrix (fixture-backed, minimum)

v1 set (not_authorized guardian variants, stale/cross-scope refs,
disabled gate, service auth, forbidden request field, hidden payload,
digest mismatch) plus: teacher-authored message preview masked, foreign
confirmation refused, expired confirmation refused, preview-digest
mismatch refused, already-redacted reuse answering
`message_already_redacted`, cross-actor replay denial, divergent
same-command payload conflict, `outcome_unknown` same-command recovery,
receipt read never exposing recipient identity or counts.

## Explicitly out of W11

Policy-actor redaction (stays internal to the Harness), media redaction,
bulk/thread-level operations, any v1 artifact or route change, receipt
push/webhooks, any activation, durable apply, deployment or traffic
claim. The frozen G5-A Candidate is untouched.

## Implementation order

W11-1 contract artifact -> W11-2 default-off runtime -> W11-3 real owner
ports (unit + production-DB lanes) -> W11-4 registration -> W11-5
digest-pin handoff + My-Chat dormant strict consumer + matrix rows
(P-H05, P-H06).
