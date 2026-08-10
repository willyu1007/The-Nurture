# Schema Diff Preview — G4-E I1 Qualification

The repo contains 35 ordered migrations. G4-E adds exactly two pending
migrations to the previously qualified 33-migration history:

1. `20260810210000_g4e_institution_knowledge_lifecycle` adds the four private
   lifecycle/provenance tables, three enums, additive foreign keys, checks and
   append-only/scope triggers;
2. `20260810230000_g4e_institution_knowledge_answer_safety` adds one immutable
   conflict-review candidate table, its exact payload checks, scope trigger and
   append-only trigger.

The SQL review found no drop, rename, data rewrite, public Surface, provider
runtime, hold/deadline/status column or second command ledger. A read-only
`prisma migrate diff --from-empty --to-schema-datamodel` preview reproduced a
98-table, 4,031-line schema script (`sha256`
`4c964c614b2ef0fc346751a946ad79f604acbbc60dc1c53bf4f51563131786ad`).
`prisma validate` passed before any database write.

Because the approved target is absent and disposable, all migrations will be
replayed from empty. No existing data can be transformed or lost.
