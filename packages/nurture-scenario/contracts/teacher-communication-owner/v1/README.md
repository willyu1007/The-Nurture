# nurture.teacher-communication-owner@1.0.0

Private owner exchange for the teacher communication sheet (T-011 W8): the
class conversation rail with unread summary, display-safe membership, the
cursored thread timeline, manual text send, staged withdrawal and the
own-cursor mark-read. Serves My-Chat T-039 rows T-C02/T-S04 (targets +
mark-read), T-C03 (membership), T-C04 (timeline), T-C09 (send text),
T-C07/T-C05 (withdraw staged) as six service-authenticated POST operations
under `/internal/nurture/teacher-communication-owner/v1/`.

- Artifact: `teacher-communication-owner.owner-contract.json` — the digest
  input. Published digest:
  `sha256:e4a831cdb867ab2a5ad38d6e634e13b9da41d44606a9644c6aa0b7fd36503edf`
- Fixtures: `conformance-fixtures.json` — 18 positive/failure fixtures plus
  14 executed invalid probes and the 20 required negative e2e scenarios.
- Validator: `validate-contract.mjs` — run via
  `pnpm verify:teacher-communication-owner-contract`; chained into
  `verify:formal-ingress-contract`.

Command model: `send_text_exchange` is the only two-step confirm (outward
family-visible effect; single-use five-minute body-free confirmation);
`withdraw_staged_exchange` and `mark_read_exchange` are class-internal
single-step commands. Every exchange lands
`committed | not_committed | outcome_unknown` on the generic command ledger
with the actor HMAC folded into the canonical payload; recovery from
`outcome_unknown` is exact same-command replay. The `class_group` rail entry
is frozen `unavailable` (`class_group_reserved`); sent-message withdrawal is
a different lifecycle outside this contract; media messages are presence
descriptors only (W9 owns bytes/access); reads never advance the unread
cursor — `mark_read_exchange` is the only clear.

Posture: default-off, undeployed, no activation authority. Routes mount in
`apps/scenario-service` behind
`NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` plus complete
authority/owner/protected-content ports (W8-2); real Prisma composition
lands with W8-3. Consumers adopt by exact key/version/digest only.
Scope-freeze record:
`dev-docs/active/nurture-cross-repo-contract-supply/artifacts/w8-communication-owner-scope-freeze.md`.
