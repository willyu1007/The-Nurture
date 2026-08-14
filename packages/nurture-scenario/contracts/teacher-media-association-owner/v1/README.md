# nurture.teacher-media-association-owner@1.0.0

Private owner exchange for teacher media association (T-011 W9),
association-only over media assets that already exist owner-side: the
unassociated queue with the eligible-children option list (T-F14 plus the
T-H03 count), the per-asset association read, the single-decision associate
exchange over the frozen G3-C1 confirm/reject attribution commands, and the
discard exchange over `discard_media_asset@1.0.0` — four
service-authenticated POST operations under
`/internal/nurture/teacher-media-association-owner/v1/`.

- Artifact: `teacher-media-association-owner.owner-contract.json` — the
  digest input. Published digest:
  `sha256:528e50c8170a8b2fa41679cd7fc8d20f5fb344278a6d8e3a6294adc405dd96b4`
- Fixtures: `conformance-fixtures.json` — 15 positive/failure fixtures plus
  12 executed invalid probes and the 18 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:teacher-media-association-owner-contract`; chained into
  `verify:formal-ingress-contract`.

Command model: association and discard are class-internal single-step
commands on the generic ledger (actor HMAC in every canonical payload;
exact replay answers the recorded result; `outcome_unknown` recovery is
same-command replay). Decisions are always explicit child refs — no face or
name inference input exists anywhere in this contract — and bind the exact
immutable `media_revision`. The UI's multi-selection is a client batch of
single-decision commands so per-child partial failure stays explicit. No
bytes, thumbnails or previews exist in this version (the private media
stream ingress and My-Chat proxy stay reserved); supersede stays with the
G4-C correction lane; automatic face matching stays default-off G3-C2.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind
`NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` plus complete
authority/owner ports (W9-2); real Prisma composition lands with W9-3.
Consumers adopt by exact key/version/digest only. Scope-freeze record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w9-media-association-scope-freeze.md`.
