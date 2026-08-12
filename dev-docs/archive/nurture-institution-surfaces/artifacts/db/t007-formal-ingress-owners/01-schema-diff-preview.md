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

## Pre-apply repairs recorded during E7 qualification (2026-08-11)

- The CHECK originally required `snapshot_codec_version >= 1` and a non-empty
  ciphertext unconditionally, contradicting the frozen repository expiry
  scrub (status `expired`, codec `0`, empty ciphertext). It now requires
  exactly the scrubbed form at status `expired` and the original bounds at
  every other status (`DR-E7-01`, commit `b0adb64`).
- The three relations gained `map:` attributes so datamodel names match the
  migration's short foreign-key constraint names, restoring a clean
  datasource-to-datamodel diff (`DR-E7-02`, commit `223daa7`). No database
  shape changed; the context checksum above is unchanged.

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
