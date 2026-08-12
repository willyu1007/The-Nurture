# Schema Diff Preview — 0E-4 Quality Repair

The reviewed repo diff simplifies the not-yet-durably-applied 0E-4 proposal
shape without introducing a second migration lane:

1. `proposal_head` remains in the v1 contract but is fixed to `1` by its
   default and check constraint;
2. the workflow/head unique index becomes one unique
   `(workspace_id, workflow_id)` index;
3. unreachable head-2+ trigger branches and greatest-revision subqueries are
   removed;
4. the proposal remains immutable and the transition retains its exact
   proposal foreign key.

There is no data rewrite on the disposable target because all migrations are
replayed from empty. No durable database has received the earlier 0E-4
migration, so editing that migration is the single-path correction rather than
an additive compatibility migration.
