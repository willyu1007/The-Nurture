# nurture.teacher-organization-owner@1.0.0

Private owner exchange for the teacher organization loop (T-011 W7): class
feed, batch head + draft lane, manual organize, supplement prepare/confirm,
atomic class note and explicit queue admission. Serves My-Chat T-039 rows
T-F08 (feed), T-F09/T-F11 and the T-F10 preview (organization), T-F02
(organize), T-F05 (supplement), T-F15 (class note) and T-F10 (queue
admission) as six service-authenticated POST operations under
`/internal/nurture/teacher-organization-owner/v1/`.

- Artifact: `teacher-organization-owner.owner-contract.json` — the digest
  input. Published digest:
  `sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161`
- Fixtures: `conformance-fixtures.json` — 17 positive/failure fixtures plus
  14 executed invalid probes and the 18 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:teacher-organization-owner-contract`; chained into
  `verify:formal-ingress-contract`.

Command model: every exchange lands `committed | not_committed |
outcome_unknown`; recovery from `outcome_unknown` is exact same-command
replay (actor-scoped idempotency), never a new command. Only
`supplement_exchange` uses the prepare/confirm two-step (child-record
business effect); organize, class note and queue admission are
class-internal single-step commands. Nothing here auto-sends: admission only
places a draft into the frozen owner-side schedule, and release stays with
the separate teacher-release-owner confirm.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind
`NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` plus complete
authority/owner/protected-content ports (W7-2); real Prisma composition
lands with W7-3. Consumers adopt by exact key/version/digest only. Voice
input and media bytes stay excluded (W9 stream ingress). Scope-freeze
record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w7-organization-owner-scope-freeze.md`.
