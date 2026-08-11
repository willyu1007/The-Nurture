# T-007 formal ingress owner schema diff preview

## Source of truth

- DB mode: `repo-prisma`
- Schema SSOT: `prisma/schema.prisma`
- Generated context: `docs/context/db/schema.json`
- Context checksum after refresh:
  `af51b1d7405667cc58d9a9bc7cb006957e8fb1050194408c78c9c7343c2cf8d9`

## Additive changes

- Add enum `NurtureInstitutionKnowledgePreparedCommandStatus` with
  `prepared`, `consumed`, and `expired`.
- Add table `nurture_institution_knowledge_prepared_command`.
- Add primary key `command_request_id`.
- Add the owner dedup uniqueness tuple:
  `(workspace_id, participant_id, client_surface, client_command_id_hash)`.
- Add participant/status/expiry and institution/status/expiry indexes.
- Add restrictive foreign keys to current Nurture Participant, Institution,
  and care-role assignment rows.
- Add a database CHECK for identifier/hash shapes, the one admitted surface,
  the action-key allowlist, snapshot bounds, TTL ordering, version positivity,
  and status/`consumed_at` consistency.

## Data and ownership posture

- The frozen command and authority snapshot are encrypted before persistence.
- Raw confirmation refs, raw client command ids, and raw invocation request ids
  are not persisted; only keyed hashes are stored.
- No My-Chat ORM, PermissionContext, credential, or provider secret is stored.
- No existing table, column, enum member, index, or row is removed or rewritten.
- Target option contract `ik2` signs the exact role-assignment ref together
  with the target. A caregiver role or another administrator assignment cannot
  be silently merged into the selected authority.
- Ledger creation locks and rechecks the exact active Participant,
  Institution, and Institution Admin scope before inserting a confirmation.

## Static verification

- `prisma validate`: PASS with a non-routable placeholder URL; no connection.
- scenario TypeScript: PASS.
- DB TypeScript: PASS.
- focused owner regression: PASS; current population is recorded in
  `04-verification.md` rather than duplicated here.
- normalized DB context refresh: PASS with no warnings.
