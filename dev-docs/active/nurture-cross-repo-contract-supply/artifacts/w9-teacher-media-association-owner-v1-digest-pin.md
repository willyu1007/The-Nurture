# W9 Teacher Media Association Owner v1 — Digest and Adoption Pin

## Exact publication

| Field | Value |
| --- | --- |
| Interface | `nurture.teacher-media-association-owner@1.0.0` |
| Content digest | `sha256:528e50c8170a8b2fa41679cd7fc8d20f5fb344278a6d8e3a6294adc405dd96b4` |
| Digest input | [`teacher-media-association-owner.owner-contract.json`](../../../../packages/nurture-scenario/contracts/teacher-media-association-owner/v1/teacher-media-association-owner.owner-contract.json) |
| Canonicalization | Strict JSON parse, RFC 8785 via `nurtureCanonicalJson`, UTF-8, SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f…` (unchanged) |
| Capability dependencies | `confirm_child_media_attribution@1.0.0`, `reject_child_media_attribution@1.0.0`, `discard_media_asset@1.0.0` (referenced, not re-declared) |
| Runtime posture | Four private routes mounted default-off behind `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED`; no deployment, activation or traffic |
| Owner ports | `createPrismaTeacherMediaAssociationBinding` implemented and DB-lane qualified; production `main.ts` constructs no binding |

## Frozen ingress inventory

Read `query_key` derivations: unassociated = `class_ref`, association =
`media_ref`. Both exchanges echo `context_ref` + exact `command_request_id`.

| T-039 rows | Operation | Internal path |
| --- | --- | --- |
| `T-F14`, `T-H03` count | `unassociated_query` | `POST /internal/nurture/teacher-media-association-owner/v1/unassociated` |
| `T-F14` review | `association_query` | `POST /internal/nurture/teacher-media-association-owner/v1/association` |
| `T-F14` commit | `associate_exchange` | `POST /internal/nurture/teacher-media-association-owner/v1/associate` |
| `T-F14` hygiene | `discard_exchange` | `POST /internal/nurture/teacher-media-association-owner/v1/discard` |

## Command model the consumer must honor

- Both exchanges are class-internal single-step commands on the generic
  ledger (actor-scoped identity; exact replay answers the recorded result
  with `executed: replayed`; `outcome_unknown` recovery is same-command
  replay; divergent/cross-actor reuse lands `command_payload_conflict`).
- One decision per command (`decision: confirm | reject`, explicit
  `child_ref`, exact expected revisions). Multi-selection is a client batch
  of single-decision commands — render per-child results; never collapse
  partial failure. Head drift answers `media_revision_moved` or
  `attribution_revision_moved`; re-read then re-prepare, never guess.
- No face/name inference input exists; no bytes/thumbnails/previews exist
  (`media_asset_id`/`storage_ref`/`thumbnail_url`/`preview_ref` are
  forbidden response fields). Association never releases anything.

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly. `class_ref`/`child_ref` are the
  W6-W8 ref families; `media_ref` is owner-issued and resolves by candidate
  matching (stale/foreign → `masked`, purge).
- The queue-wide `unassociated_count` may exceed the ≤50 asset page; it
  never undercuts it. Assets carry lifecycle `ready`/`unavailable` only.
- Conformance fixtures: 15 + 12 invalid probes at
  `packages/nurture-scenario/contracts/teacher-media-association-owner/v1/conformance-fixtures.json`,
  20-scenario census 18; refresh the sanitized snapshot in the adoption
  change.

## Qualification summary (2026-08-14)

Contract validator passes (digest, rows T-F14/T-H03, 18-scenario census, 12
probes); ingress census registers the four routes (controller-routes 46);
scenario-service suite 169 tests incl. the 7-case W9 e2e; unit lane 102
files / 1117 tests; production-DB lane 56 files green incl. the 5-case
real-owner suite (ledger replay of associate/discard, cross-actor denial,
moved-revision refusal, terminal-reuse refusal). No activation, deployment,
traffic or consumer change occurred in the Nurture repository.
