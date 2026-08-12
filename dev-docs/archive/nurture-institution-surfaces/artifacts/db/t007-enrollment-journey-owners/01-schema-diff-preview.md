# Schema diff preview — enrollment prepared-command ledger

- Source of truth: repo-prisma (`prisma/schema.prisma`); generated context
  `docs/context/db/schema.json`, checksum
  `69c5eac71447313e652764591ea04fa6c9a8f92cc74615b273f7db80106ab7d6`.

## Additive changes

- Enum `NurtureEnrollmentJourneyPreparedCommandStatus`
  (`prepared | consumed | expired`).
- Table `nurture_enrollment_journey_prepared_command` — E7-isomorphic:
  PK `command_request_id`; keyed hashes for client command id, prepare
  fingerprint, origin invocation id and confirmation ref; encrypted owner-held
  snapshot; dedup unique
  `uq_nurture_enrollment_prepared_client_command`
  (workspace, participant, client_surface, client_command_id_hash);
  status/expiry indexes `ix_nurture_enrollment_prepared_participant` /
  `ix_nurture_enrollment_prepared_institution`; named `Restrict` FKs
  `nurture_enrollment_prepared_{participant,institution,role_assignment}_id_fkey`
  (DR-E7-02 discipline).
- Contract CHECK `ck_nurture_enrollment_prepared_command_contract`: opaque-id
  and hash forms, `client_surface = 'web_run_workbench'`, the 18
  reviewable/strong capability keys (the three direct_commit keys bypass the
  ledger), the DR-E7-01 scrubbed-expiry disjunct
  (`expired` ⇒ codec 0 + empty ciphertext), `prepared_at < expires_at`, and
  the status/consumed_at pairing.

## Pre-apply repairs recorded during qualification

- `DR-I3-01` — the production binding minted `workflow_run_ref` in the
  `nurture` namespace; the pre-existing workflow identity CHECK
  (`ck_nurture_institution_workflow_identity`) requires a `my_chat`
  `workflow_run` canonical ref (workflow runs are Host canonical objects).
  Caught by the targeted suite on real PostgreSQL — an in-memory double cannot
  express the CHECK — and fixed in
  `enrollment-journey-owners.composition.ts` before any durable apply.

## Data and ownership posture

- Additive only; no existing row, column, enum or constraint is touched.
- The encrypted snapshot is owner-held; command execution accepts only opaque
  ids; no raw contact value, guardian identity or protected content is
  persisted in the ledger.

## Static verification

- `prisma format` / `prisma validate` (non-routable placeholder URL): PASS.
- Migration body generated with `prisma migrate diff` from the pre-change
  datamodel, then the contract CHECK appended by hand; header carries the
  standard preview-only marker.
