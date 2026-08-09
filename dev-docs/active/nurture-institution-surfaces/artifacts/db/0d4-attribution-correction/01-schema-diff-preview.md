# Schema Diff Preview — 0D-4 Attribution Correction

The repo Prisma SSOT adds one table and no enum:

- `nurture_attribution_correction_candidate` stores the exact source
  attribution revision, exact Admin role assignment, required reason, command
  identity, contract version and server time.

The migration is additive. It adds a primary key, exact-replay unique index,
source/actor read indexes and restrictive foreign keys. PostgreSQL additionally
enforces the contract version, non-empty bounded reason, SHA-256 request hash,
same-Workspace owner composition and update/delete rejection.

There is deliberately no candidate state, head, deadline, expiry,
`resolved_at`, proposed child or publishability field. The candidate changes
neither `NurtureChildMediaAttribution` nor its exposure payload. A current exact
CareGroup caregiver reads the report and, if action is warranted, uses T-006's
existing append-only canonical attribution capability.

Prisma's datamodel diff reproduced the table columns, three indexes and two
foreign keys. The migration uses Prisma's generated/truncated foreign-key names
to avoid future drift noise. No existing table, column, enum or row is removed
or rewritten.

The first post-deploy whole-schema diff exposed six older physical foreign-key
names that the Prisma relations had never mapped. The constraints themselves
were correct and unchanged. Binding those existing names with relation `map`
attributes removed the false rename plan; the final datasource-to-SSOT diff is
empty.
