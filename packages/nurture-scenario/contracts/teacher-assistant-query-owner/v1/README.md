# nurture.teacher-assistant-query-owner@1.0.0

Private owner exchange for the assistant-backed teacher queries (T-011
W10): the missing-record answer with its typed non-executable supplement
handoff (T-H02), the deterministic weekly-source facts for the ISO week
containing the requested date, and the weekly-draft exchange that creates
the owner-side summary draft in the existing W7 review lane (both T-H04)
— three service-authenticated POST operations under
`/internal/nurture/teacher-assistant-query-owner/v1/`.

- Artifact: `teacher-assistant-query-owner.owner-contract.json` — the
  digest input. Published digest:
  `sha256:d401066102cb398f00b6bd897611ba794abb36d11837a25423f1c19101cadb8e`
- Fixtures: `conformance-fixtures.json` — 11 positive/failure fixtures plus
  12 executed invalid probes and the 17 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:teacher-assistant-query-owner-contract`; chained into
  `verify:formal-ingress-contract`.

Command model: the weekly draft is a class-internal single-step command on
the generic ledger (actor HMAC in every canonical payload; exact replay
answers the recorded result; `outcome_unknown` recovery is same-command
replay) and is additionally domain-idempotent per `(class, week)` — an
existing draft answers `already_satisfied` with the same `process_ref`.
Week identity is owner-computed from `local_date` under the institution
publication-policy timezone; requests never carry week boundaries. The
generation boundary stays engine-ready: the owner assembles deterministic
facts only and never calls a model provider — any prose is the Host
engine's separate concern over the same facts. The supplement handoff is a
typed descriptor (`nurture.teacher-organization-owner@1.0.0` /
`supplement_exchange` / `child_ref`), never an executable reference.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind
`NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` plus complete
authority/owner ports (W10-2); real Prisma composition lands with W10-3.
Consumers adopt by exact key/version/digest only. Scope-freeze record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w10-assistant-query-scope-freeze.md`.
