# 95 — G4-D I4 Exit record

## Decision

- Date: 2026-08-12
- Result: `G4_D_I4_EXIT_PASS_DEFAULT_OFF`
- Input owner revision: My-Chat
  `2d415cecea6c40cb41daf10bca0638bfaa0c504e`
- Opens: G4-F Integration Qualification and Handoff only.
- Does not open: durable database apply, route/DI composition, capability
  activation, deployment, live-provider qualification or traffic.

## Qualified integration

- The sole formal Enrollment Journey ingress is query v2, prepare v3 and
  execute v4 across exact Admin Web/mobile-query and Guardian chat/mobile
  surfaces. Every manifest mapping remains disabled.
- Native communication is read only through the production current message
  owner, returns body-free source metadata and denies after current Admin role
  revocation.
- Guardian ordinary actions carry a short-lived Host actor/contact/action
  carrier. Formalization alone additionally carries current Child/Family pair
  evidence for purpose `formalize_enrollment`.
- Nurture independently rereads its current participant, target, association,
  Guardian role, Grant policy and entity heads. Formalization rechecks those
  facts inside the serializable business transaction before changing the
  existing trial Enrollment/Grant/Workflow.
- Prepared Guardian rows contain no fabricated Admin role and no owner
  carrier. PostgreSQL enforces the exact surface/nullable-role split.
- Exact replay is admitted only from a consumed prepared row and the existing
  committed execution. Current authority must still match; only the target
  workflow-head component may advance because of the already committed
  command.

## Quality repairs included

1. Admin mobile queries now resolve through `institution_board`; Admin writes
   remain Web-only.
2. The original prepared-command CHECK was rotated, not weakened, to encode
   Web-with-role versus Guardian-without-role exactly.
3. Guardian executions attribute the business actor to the canonical Host
   Actor, never the Nurture Participant id.
4. Guardian post-commit response construction uses pure workflow
   shape/lifecycle validation after the authorized command; it is explicitly
   not an authorization read.
5. Consumed replay is recovered before rebuilding a now-advanced payload, so
   exact response-loss replay succeeds while role/participant/institution/
   contact/action drift still denies.
6. The new policy table remains covered by the G3-0 persistence census.

## Evidence

| Gate | Result |
| --- | --- |
| focused formal-owner PostgreSQL matrix | PASS — 11/11 |
| full unit lane | PASS — 97 files / 1050 tests |
| repository-root TypeScript | PASS |
| production PostgreSQL lane | PASS — 50 files / 444 tests |
| fresh migration replay | PASS — 41/41 |
| migration status / datasource drift | PASS — current / empty |
| complete x5 lane | PASS — 5 files / 37 tests, three consecutive runs |
| persistence/port/routing/formal/default-off/manifest gates | PASS |
| Prisma format/validate and DB context refresh | PASS |

Detailed database evidence is in
[`artifacts/db/t007-g4d-i4-exit/`](./artifacts/db/t007-g4d-i4-exit/).

## Exit

G4-D I4 is complete at a default-off provider/consumer handoff. G4-F may now
join the already-qualified G4-A/B/C/D/E branches and issue the task-level Exit
after the exact cross-repository adoption pin is resealed. This record is not
an activation or durable-apply authorization.
