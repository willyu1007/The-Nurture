# G4-D I4-B Prisma current-owner and command matrix

Date: 2026-08-12

## Verdict

`G4_D_I4_B_PRISMA_CURRENT_OWNER_AND_ADMIN_COMMAND_MATRIX_QUALIFIED_DEFAULT_OFF /
HOST_CARRIER_PRODUCER_AND_REMAINING_I4_MATRIX_PENDING / G4_F_CLOSED`

## Implemented boundary

The production Enrollment Journey owner composition no longer accepts an
injected local derivation result. One
`PrismaEnrollmentPairOwnerRepository` derives the exact current trial pair
from the request-scoped Host evidence and Nurture canonical rows:

- the active `trial_preparation` Workflow and its one held reservation;
- the ordered Child/Family binding anchors, current associations and exact
  active authorizations;
- the accepted My-Chat actor, its one current Nurture participant binding and
  one current Guardian role scoped to the Family or CareProcess; and
- one current exact-Institution trial Grant policy.

Missing, expired, revoked, cross-pair or ambiguous facts fail closed. The
derived pair expiry is the earliest authorization/Guardian-role expiry. The
Grant snapshot is produced only from the new Nurture policy owner; it is not
copied from Host transport, the prepared command or an existing Grant.

`NurtureEnrollmentTrialGrantPolicy` is an additive repo-Prisma owner. Database
checks constrain its contract, directions, bounded data/purpose sets and
effective window; one unsuperseded row may exist per Institution. A database
trigger prevents delete and in-place policy mutation, allowing only the first
`superseded_at` transition. Rotation after a prior row expires remains
possible, while all historical terms remain auditable.

Prepare and start now re-read the policy inside the serializable command
transaction. This closes the binding-to-command race: a concurrent policy
rotation either makes the stale snapshot fail or participates in serializable
conflict handling. Start also cross-checks the pending Grant's stored policy
snapshot and its trial-bounded effective expiry against the current policy.

## Quality audit repairs

The first implementation review found and repaired four issues before this
record was issued:

1. the test helper treated the command kernel's successful `ok` result as an
   error and used a Guardian action timestamp earlier than offer issuance;
2. append-only Enrollment rows were incorrectly included in fixture cleanup;
3. the first Grant drift check compared a trial-bounded Grant expiry directly
   with the longer policy expiry, rejecting a legal prepared relationship; and
4. current authorization reads selected one row when two active rows existed,
   instead of failing ambiguous.

The final tests prove policy immutability, authorization ambiguity, role
revocation, authorization expiry and policy revision drift. The positive
production path executes the three carrier-gated Admin commands in order:
`qualify_capacity_waitlist`, `prepare_trial_relationship` and `start_trial`.

## Database qualification

The additive migration was applied only to a fresh local disposable
PostgreSQL 16 container. All 40 migrations replayed, `prisma migrate status`
reported current and datasource-to-SSOT diff returned an empty migration.
The DB context contract was regenerated from `prisma/schema.prisma`. No
shared, persistent, staging or production database received an apply or other
mutation. One read-only boundary command initially followed the repository's
default local URL and reported its older migration population; the gate was
then rerun successfully against the explicit disposable target.
The disposable Nurture container and the companion My-Chat x5 container were
removed and confirmed absent after verification.

Evidence is under
[`artifacts/db/t007-current-owner-derivation/`](./artifacts/db/t007-current-owner-derivation/).

## Quality evidence

| Gate | Result |
| --- | --- |
| Prisma format / validate / generate | PASS |
| Nurture repository-root TypeScript | PASS |
| focused current-owner + G4-D lifecycle PostgreSQL set | PASS — 2 files / 18 tests |
| full production PostgreSQL lane | PASS — 50 files / 442 tests |
| full unit lane | PASS — 97 files / 1049 tests |
| clean migration replay / status / drift | PASS — 40/40, current, empty diff |
| complete serialized x5 lane | PASS — three consecutive runs, each 5 files / 36 tests |
| runtime effects | NONE — no durable apply, route, DI activation, deployment or traffic |

## Deliberately open

This closes the production Prisma derivation and the three Admin-command
positive matrix, not all of I4. A real My-Chat carrier producer and serialized
signed positive vehicle are still absent. Native-message source coverage,
the remaining command families, exact replay/response-loss combinations,
Guardian/mobile ingress and the complete revoke/expiry/head-drift joint matrix
also remain. G4-F therefore stays closed.
