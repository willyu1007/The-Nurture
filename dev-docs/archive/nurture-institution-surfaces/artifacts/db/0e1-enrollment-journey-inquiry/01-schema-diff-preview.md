# Schema Diff Preview — 0E-1 Enrollment Journey Inquiry

The repo Prisma SSOT adds eight exact frozen enums and four tables:

- `nurture_institution_workflow`: current private business state, head and
  opaque My-Chat workflow Run ref;
- `nurture_enrollment_inquiry`: minimum provisional inquiry facts with either
  a protected birth year-month envelope or an age-band key;
- `nurture_enrollment_touchpoint`: append-only exact native source refs or
  protected Admin-authored external summaries;
- `nurture_institution_workflow_transition`: immutable before/after transition
  audit linked one-to-one to the existing `NurtureCommandExecution` ledger.

The migration is additive. It adds restrictive foreign keys, CAS/head and
exact lifecycle/milestone checks, cross-Workspace/Institution scope triggers,
exact active-Admin actor checks, cumulative transition reconstruction,
append-only touchpoint/transition fences, no-delete workflow/inquiry fences
and exact canonical-ref/protected-envelope shape checks. A deferred constraint
requires every committed workflow head to have its exact command-shaped
transition. The checked canonical workflow Run `object_id` is unique per
Workspace; no derived hash identity is stored. A partial expression index
prevents the same native business message from becoming two touchpoints in one
workflow.

There is no projection table, AI candidate table, deadline/blocker state,
Nurture workflow outbox, Host Run/Step table or legacy
`NurtureWorkflowProject` reuse. Legal name, full birth date, raw contact,
attachment and transcript columns are absent.

`prisma migrate diff --from-empty --to-schema-datamodel` statically reproduced
the eight enums and four table column/FK shapes from the Prisma SSOT. Prisma
validation and client generation pass. Datasource-to-SSOT drift cannot be
claimed until the migration is deployed to a separately approved disposable
database.
