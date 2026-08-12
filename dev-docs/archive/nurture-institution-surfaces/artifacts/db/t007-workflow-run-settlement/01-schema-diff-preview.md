# T-007 Workflow Run settlement schema preview

Status: `PREVIEW_ONLY / NOT_APPLIED`

The repository Prisma SSOT adds `NurtureWorkflowRunSettlementState` and
`nurture_workflow_run_settlement`. The table binds one hashed Host logical
operation, one Host reservation evidence hash, one versionless Run id and one
hashed Nurture command identity.

Key constraints:

- one row per `(workspace, logical_operation_hash)`;
- one row per `(workspace, reservation_evidence_hash)`;
- one row per `(workspace, command_request_id_hash)`;
- `prepared` has no execution or settlement receipt;
- `committed` requires the exact `NurtureCommandExecution` foreign key and a
  receipt/evidence hash;
- `confirmed_no_effect` requires a receipt/evidence hash and forbids an
  execution foreign key;
- the only admitted command is `nurture.start_enrollment_inquiry`;
- no contact, participant, child, family, authority or command payload column
  exists.

Artifact: `prisma/migrations/20260812170000_t007_workflow_run_settlement/migration.sql`.
Prisma format, validate and generate pass with a schema-only placeholder URL;
no database connection or write was made.
