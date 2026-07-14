# X4-A Handoff Replay-Seed Schema Diff Preview

## Source and migration

- Prisma storage fields already exist in `NurtureCommandExecution` from N1:
  - required `handoffRequestSnapshotsPayload Json`
  - optional `handoffDriverRef Json?`
- X4-A changes the database invariant through custom SQL only:
  - `prisma/migrations/20260715070000_nurture_handoff_replay_seed_x4/migration.sql`
- `prisma format` and `prisma validate` pass without changing `prisma/schema.prisma`.

## Effective change

The migration replaces `ck_nurture_command_execution_n1`, which allowed only explicit-empty replay state, with `ck_nurture_command_execution_handoff_v1`.

The new constraint preserves all N1 hash, version, and JSON type checks, then permits exactly two states:

1. `handoff_request_snapshots_payload=[]` and `handoff_driver_ref IS NULL`.
2. A bounded non-empty snapshot array and one exact five-field driver ref identifying a `host.workflow/workflow_step` owned for Nurture replay.

Additional fences:

- Snapshot batch length is at most 32.
- Claim token, expected Step version, and contract binding fields are forbidden from snapshot JSON.
- Persisted driver JSON must equal the canonical five-field object; unknown keys, Step version, claim token, and expected Step version are rejected.
- No My-Chat Workflow Run, Step, Handoff, Outbox, lease, attempt, or queue table is added to the Nurture production schema.

## Destructive and compatibility review

- Data rows/tables/columns: no drop, truncate, rewrite, or delete.
- Constraint: the N1 CHECK is dropped and replaced in the same migration.
- Existing valid N1 explicit-empty rows remain valid.
- `VALIDATE CONSTRAINT` will fail closed if historical rows violate either explicit-empty or canonical non-empty state.
- The migration is additive in runtime meaning but forward-only after non-empty rows exist: restoring the N1 explicit-empty CHECK would reject valid X4 rows.

Static checks passed:

```text
pnpm db:validate
pnpm verify:x4-handoff-replay-contract
pnpm typecheck
git diff --check
```

SQL execution and PostgreSQL integration tests remain pending the mandatory apply approval.
