# nurture.parent-communication-owner@1.1.0

Additive extension of the frozen `nurture.parent-communication-owner@1.0.0`
(base pin `sha256:b1dce3a7…`, declared and never re-published) supplying
the parent-side gaps P-H05 and P-H06: the guardian redaction
preview/commit pair over the frozen G4-C author-redaction machinery, and
the per-message aggregate delivery-receipt read — three
service-authenticated POST operations under
`/internal/nurture/parent-communication-owner/v1.1/`. The v1 directory,
digest, routes and posture stay byte-identical (the validator recomputes
the v1 digest to prove it).

- Artifact: `parent-communication-owner-extension.owner-contract.json` —
  the digest input. Published digest:
  `sha256:d705146eb00185cbec425953e9a6fa358cc5fb9af193c86f788276617c7b29d1`
- Fixtures: `conformance-fixtures.json` — 11 positive/failure fixtures plus
  12 executed invalid probes and the 16 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:parent-communication-extension-contract`; chained into
  `verify:formal-ingress-contract`.

Command model: two-step confirm in the frozen W3 discipline — the preview
issues the confirmation for the exact message head; the commit consumes it
once, compares the prepared preview digest, and refuses drift as
`stale_confirmation` (re-prepare). Exact same-command replay answers the
recorded result with `execution_disposition: replayed`; a new command
against an already-redacted message answers committed
`already_satisfied` per the frozen G4-C spec. Redaction is irreversible,
author-actor only, and always audited; nothing here deletes rows. The
delivery answer is one aggregate state per message under the frozen v1
mapping — recipient identities, receipt ids and counts never leave the
owner.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind
`NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` (independent of the
frozen v1 gate) plus complete authority/owner ports (W11-2); real Prisma
composition lands with W11-3. Consumers adopt by exact key/version/digest
only. Scope-freeze record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w11-parent-communication-extension-scope-freeze.md`.
