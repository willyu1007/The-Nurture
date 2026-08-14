# nurture.teacher-class-stream-presenter@1.0.0

Private owner presenter for the teacher class-stream read core (T-011 W6).
Serves My-Chat T-039 rows T-S03, T-F01, T-H01 (context), T-F03 (child strip),
T-F04 (child day detail) and T-F06/T-F07 (schedule) as four read-only,
service-authenticated POST operations under
`/internal/nurture/teacher-class-stream/v1/`.

- Artifact: `teacher-class-stream.owner-contract.json` — the digest input.
  Published digest:
  `sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3`
- Fixtures: `conformance-fixtures.json` — 12 positive/failure fixtures plus
  12 executed invalid probes and the 12 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:teacher-class-stream-contract`; chained into
  `verify:formal-ingress-contract`.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED`
plus complete authority/owner ports (W6-2); real Prisma composition lands with
W6-3. Consumers adopt by exact key/version/digest only. All four operations are
reads; class-stream writes belong to the W7 organization owner. Scope-freeze
record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w6-class-stream-presenter-scope-freeze.md`.
