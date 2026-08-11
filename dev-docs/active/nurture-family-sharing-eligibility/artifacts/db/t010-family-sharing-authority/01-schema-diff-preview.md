# T-010 I4-C1 schema diff preview

- Date: 2026-08-12
- Task: T-010 nurture-family-sharing-eligibility, increment I4-C1
- Mode: review-only. The migration is authored and committed but intentionally
  not applied by this task; no database of any kind was written.

## Additive diff

Enums (new; deliberately not `NurtureGrantDataClass` / `NurtureGrantDirection`
per D-I4C-01 — the Grant vocabulary `family_to_org`/`org_to_family` stays
byte-identical and unreferenced):

- `NurtureFamilySharingCategory` — `daily_activity | media |
  focus_collaboration`
- `NurtureFamilySharingDirection` — `nurture_to_family | family_to_nurture`
- `NurtureFamilySharingPolicyAxis` — `release | receiving`
- `NurtureFamilySharingRecordStatus` — `active | revoked | superseded`
  (expiry is temporal via `expires_at`, never a stored status)

Tables (new):

- `nurture_family_sharing_authority` — one purpose-bound authority fact per
  exact workspace-local pair (`child_care_process_id`, `family_id`), selected
  `enrollment_id` and category; direction fixed by category; status +
  effective/expiry/revoke lifecycle; `authorizing_role` +
  `authorizing_role_assignment_id` provenance; `authority_version`.
- `nurture_family_sharing_policy` — same exact scope plus the
  `release | receiving` axis and `policy_version`.

Both tables carry named `Restrict` foreign keys to
`nurture_child_care_process`, `nurture_family`, `nurture_enrollment` and
`nurture_care_role_assignment`. No raw platform id, signed evidence body or
copied lifecycle boolean is persisted (D-I4C-04: lifecycle stays with the two
owners and is re-read at evaluation time).

Hand-authored SQL beyond Prisma's expressiveness (all named, all reviewed):

- `ck_…_direction` — the fixed direction-by-category map on both tables.
- `ck_…_purpose` — `purpose = 'family_nurture_sharing_authorization'`.
- `ck_…_revocation` — `status = 'revoked'` iff `revoked_at IS NOT NULL`
  (revocation writes both atomically).
- `ck_…_expiry` — `expires_at` absent or after `effective_from`.
- Partial unique indexes `uq_nurture_family_sharing_authority_current`
  (scope + category, `WHERE status = 'active'`) and
  `uq_nurture_family_sharing_policy_current` (scope + category + axis,
  `WHERE status = 'active'`) — the fail-closed exactly-one-current guarantee
  of D-I4C-02/03. Writers supersede or revoke the previous row in the same
  transaction; readers never break ties by ordering.

## Cleanup command/receipt table — deferred, not drafted

`01-plan.md` permits a cleanup ledger only if the transport design cannot
safely reuse an existing canonical command ledger. That argument belongs to
the C3 transport design against `NurtureCommandExecution`
(`uq_nurture_command_execution_identity`); no third table is drafted at C1.

## Naming-collision review

T-007 G4-D I3 will add an enrollment prepared-command ledger (record 86,
E7-isomorphic). All new identifiers here use the
`nurture_family_sharing_*` / `uq_nurture_family_sharing_*` /
`ix_nurture_family_sharing_*` / `ck_nurture_family_sharing_*` prefixes and
cannot collide with `*_enrollment_prepared_*` or `*_knowledge_prepared_*`
names.

## Validation

- `pnpm exec prisma format` — clean (back-relations added and named
  `familySharingAuthorities` / `familySharingPolicies` per repo convention).
- `pnpm exec prisma validate` with a non-routable placeholder `DATABASE_URL`
  — valid, no connection.
- Migration SQL body generated with
  `prisma migrate diff --from-schema-datamodel <pre-C1> --to-schema-datamodel
  <post-C1> --script`, then the constraints/partial-unique section appended by
  hand; purely `CREATE TYPE` / `CREATE TABLE` / `CREATE INDEX` /
  `ADD CONSTRAINT` — no `DROP`, no `ALTER … TYPE`, no backfill, no write to
  any existing row.
- `pnpm db:context` — `docs/context/db/schema.json` regenerated
  (`normalized-db-schema-v2`); registry entry `db-schema` checksum
  `1c18d236324baad01ad1f3cc53695a6b460191cebb4215f1323432779fa8a1fc`.

## Projection-impact review

No eligibility projection exists or is added: these tables never project into
My-Chat, Convex, search or any authorization cache (`cache: "forbidden"` in
the frozen interface; overview non-goal). Consumers see only owner responses.

## Non-change assertions

- `NurtureGrantDataClass` and `NurtureGrantDirection` byte-identical;
  `NurtureChildLinkGrant` untouched; no backfill of any existing table.
- The frozen interface digest
  `sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8`
  is not recomputed by this change (harness source untouched); the runtime
  assertion in `family-sharing-eligibility.ts` continues to pass in the unit
  lane.
