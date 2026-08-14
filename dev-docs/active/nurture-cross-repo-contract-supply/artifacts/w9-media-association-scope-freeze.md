# W9 Scope Freeze — nurture.teacher-media-association-owner@1.0.0

Frozen 2026-08-14 under the W6-W11 schedule
(`w6-teacher-supply-schedule.md`). W9 ships **association-only** over media
assets that already exist owner-side: the reserved private media stream
ingress and the My-Chat proxy do not exist, so no upload, byte, thumbnail or
preview shape is designed here (the `reserved_not_mounted` /
`content_unavailable` rule). The batch wraps the frozen G3-C1 attribution
machinery (`confirm/reject_child_media_attribution@1.0.0`, single-child
commands over immutable media revisions) and `discard_media_asset@1.0.0`
into the W6-W8 private owner-exchange shape. Changes after this point follow
the append-only correction convention.

## Interface identity

- Key/version: `nurture.teacher-media-association-owner@1.0.0`
- Kind: `private_owner_exchange`
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `confirm_child_media_attribution@1.0.0`,
  `reject_child_media_attribution@1.0.0`, `discard_media_asset@1.0.0`
- Transport: POST, JSON, service bearer, `Cache-Control: private, no-store`
- Env gate: `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` (optional,
  non-secret, default false); composition additionally requires the service
  token and complete authority/owner ports (fail-closed factory)
- Safe reason codes: `teacher_media_association_owner_disabled`,
  `invalid_teacher_media_association_request`,
  `teacher_media_association_contract_mismatch`

## Operations and consumer rows

Base path `/internal/nurture/teacher-media-association-owner/v1/`:

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `unassociated_query` | `unassociated` | T-F14, T-H03 count half | The class's attributable media still needing a decision: per asset an opaque `media_ref`, optional owner `safe_title`, optional `captured_at`, lifecycle (`ready`/`unavailable`), `media_revision`, and per-asset attribution tallies (candidate/confirmed counts). Includes the class's eligible child option list (`child_ref` in the W6 family + safe label) for the explicit multi-select, and an `unassociated_count` for the T-H03 badge. No bytes, thumbnails or preview refs — media presence is descriptive only. Bounded ≤50 assets / ≤80 children. |
| `association_query` | `association` | T-F14 review | One asset's current facts: lifecycle, `media_revision`, and the per-child attribution list (`child_ref`, state `candidate`/`confirmed`/`rejected`/`superseded`, `revision`, optional `decided_at`). Read admissibility is never command authorization. |
| `associate_exchange` | `associate` | T-F14 commit | One explicit decision per command: `{media_ref, child_ref, decision: confirm \| reject, expected_attribution_revision, expected_media_revision}` through the frozen single-child G3-C1 command specs. The UI's multi-selection is a client batch of single-decision commands, each with its own `command_request_id`, so per-child results and partial failure stay explicit. `committed` mirrors the attribution record (state, revision, `decided_at` from the owner-recorded instant); `already_satisfied` maps to a committed disposition. No face/name inference input exists anywhere in the contract — decisions are always explicit child refs. |
| `discard_exchange` | `discard` | T-F14 hygiene | Single-step discard of one attributable asset through `discard_media_asset@1.0.0` (class-internal; the capability refuses assets backing drafts or releases). `discarded`/`already_discarded` inside `committed`; the closed `not_committed` set mirrors the capability's refusal codes. |

## Authority and command model

- Caller context and forbidden request fields identical to W6-W8
  (routing only). `class_ref` is the W6 ref family; `media_ref` and
  `child_ref` are owner-issued opaque refs resolved by candidate matching —
  `media_ref` over the actor's attributable set (including
  already-decided/discarded assets for exact replays, the W8 lesson),
  `child_ref` over the class's eligible children. Foreign or stale refs
  purge (`masked`, `access_changed`).
- Every operation rereads the current caregiver/lead_caregiver
  RoleAssignment for the exact CareGroup (W6 resolver); read `query_key`
  derivations: unassociated = `class_ref`, association = `media_ref`.
- Exchanges run on the generic command ledger with the W7 actor HMAC in
  every canonical payload; exact same-command replay answers the recorded
  result (`executed: replayed`); cross-actor or divergent reuse lands
  `command_payload_conflict`; `outcome_unknown` recovery is exact
  same-command replay. Expected revisions ride the spec's expected-heads
  check, not the command identity (the W7 head-free lesson).
- Attribution decisions bind the exact `media_revision`; a revision moved
  between read and command lands the frozen `not_committed` reason
  `media_revision_moved` (mapped from the spec's head drift).

## Port set (implemented in-wave, W3.1 style)

- `TeacherMediaAssociationAuthorityResolverV1` — W6-pattern caregiver
  resolver (context read port reused structurally).
- `TeacherMediaAssociationOwnerV1` — the four operations over
  `{ request, authority }`.
- Real composition in `packages/nurture-db`:
  `createPrismaTeacherMediaAssociationBinding({ prisma, integrityKey,
  now })`, reusing the G3-C1 `MediaAttributionReadPort` Prisma
  implementation and the confirm/reject/discard command specs on the
  generic ledger (`transaction.mediaAttribution` /
  `transaction.publicationSafety` are already wired). Expected schema
  change: none.

## Negative matrix (fixture-backed, minimum)

W6-W8 set (not_authorized variants incl. guardian, stale/cross-scope refs,
disabled gate, service auth, forbidden request field, hidden payload,
digest mismatch) plus per-write: cross-actor replay denial, divergent
same-command payload conflict, `outcome_unknown` same-command recovery,
media-revision drift (`media_revision_moved`), attribution-revision drift,
illegal decision on an already-decided attribution, discard of a
draft-backing asset (closed refusal), foreign child option, foreign media
ref, decision enum violation.

## Explicitly out of W9

Upload, byte/thumbnail/preview access, the private media stream ingress and
My-Chat proxy (all reserved; T-F16's camera/upload half stays blocked on
them), `supersede_child_media_attribution` (the correction lifecycle stays
with the G4-C correction-candidate lane), automatic face matching
(`automatic_face_match` stays default-off G3-C2), any activation, durable
apply, deployment, or traffic claim. The frozen G5-A Candidate is
untouched.

## Implementation order

1. **W9-1 contract artifact**: owner-contract JSON + fixtures + validator +
   README; digest minted; validator chained into
   `verify:formal-ingress-contract`.
2. **W9-2 runtime**: 五件套 + config flag + safe codes + e2e + censuses.
3. **W9-3 real owner ports**: domain service + Prisma binding + unit lane +
   production-DB lane.
4. **W9-4 registration**: candidate fixture list, governance sync, full
   battery.
5. **W9-5 handoff**: digest-pin artifact + My-Chat snapshot refresh +
   dormant strict consumer + matrix rows (T-F14 contract-ready; T-F16 and
   T-H03 recorded as partially closed by this batch).
