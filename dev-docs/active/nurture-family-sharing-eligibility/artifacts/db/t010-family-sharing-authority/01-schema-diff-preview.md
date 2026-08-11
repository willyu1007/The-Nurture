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

Both tables carry named `Restrict` **composite** foreign keys (reworked after
the 2026-08-12 independent review): `(workspace_id, child_care_process_id)` →
process, `(workspace_id, child_care_process_id, family_id)` → family,
`(workspace_id, child_care_process_id, enrollment_id)` → enrollment, and
`(workspace_id, authorizing_role, authorizing_role_assignment_id)` → role
assignment — so a row cannot claim workspace A while referencing another
workspace's family, an enrollment under a different process, or a role
assignment whose actual role differs from `authorizing_role`. Four additive
unique indexes on the existing anchor tables back these FKs
(`uq_nurture_child_care_process_workspace_id`,
`uq_nurture_family_workspace_process_id`,
`uq_nurture_enrollment_workspace_process_id`,
`uq_nurture_care_role_assignment_workspace_role_id`; each is implied-unique
already since `id` is the primary key, so they cannot fail on existing data).
No raw platform id, signed evidence body or copied lifecycle boolean is
persisted (D-I4C-04: lifecycle stays with the two owners and is re-read at
evaluation time).

Hand-authored SQL beyond Prisma's expressiveness (all named, all reviewed):

- `ck_…_direction` — the fixed direction-by-category map on both tables.
- `ck_…_purpose` — `purpose = 'family_nurture_sharing_authorization'`.
- `ck_…_revocation` — `status = 'revoked'` iff `revoked_at IS NOT NULL`
  (revocation writes both atomically).
- `ck_…_expiry` — `expires_at` absent or after `effective_from`.
- Partial unique indexes `uq_nurture_family_sharing_authority_current`
  (scope + category, `WHERE status = 'active'`) and
  `uq_nurture_family_sharing_policy_current` (scope + category + axis,
  `WHERE status = 'active'`) — **at most one `active` slot** per scope
  (D-I4C-02/03). Currentness is `active AND effective_from <= evaluated_at
  AND (expires_at IS NULL OR expires_at > evaluated_at)`; a granting writer
  atomically retires (supersedes/revokes) any status-active row — expired or
  not — in the same transaction, so renewal after unattended natural expiry
  never collides with the index; existence of a current row is a reader
  decision and readers never break ties by ordering.
- The hand-authored invariants are pinned by a static verifier,
  `pnpm verify:family-sharing-invariants`
  (`scripts/assert-family-sharing-invariants.mjs`): the generated
  `docs/context/db/schema.json` cannot represent partial uniques or CHECKs,
  so the verifier is the drift guard for this section.

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
  `0a9d51f119c40466e7461e3787d298f5bb87fdce8b395141a91829e911bdf20d`
  (post-review rework; the initial draft's checksum was `1c18d236…`).
- `pnpm verify:family-sharing-invariants` — PASS (8 CHECKs, 2 partial
  uniques, 4 target uniques, 8 composite FKs pinned).

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
