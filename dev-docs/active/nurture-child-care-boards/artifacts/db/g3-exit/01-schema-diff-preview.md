# G3 Exit Schema Diff Preview

SSOT is `prisma/schema.prisma` in `repo-prisma` mode. The qualified migration is
`20260805090000_t007_publication_policy_provider`.

Reviewed delta:

- add append-only `nurture_institution_publication_policy` version history;
- add exact contract, version/head, local-time, interval and effective-window checks;
- add unique version/head indexes plus effective-window lookup index;
- add the Institution foreign key with `RESTRICT` delete behavior;
- replace the existing named `nurture_publish_process` state check with the
  seven-field all-null-or-all-present schedule invariant;
- abort before DDL when any historical process has a partial seven-field schedule;
- execute the gate and all DDL inside one explicit transaction.

Destructive-data review: no table/column drop, truncate, data delete or rename. The
only `DROP` replaces one named check constraint in the same transaction.

Reviewed hashes:

- `prisma/schema.prisma`: `5e03c69ab617bda8f7c6eb4369b5a1bf00ca9c8c34375051ef61301e37b609a9`
- migration SQL: `b98a3764401c2371e1e682d9d732f6049095da5fb4d229bd5a02e2d4e28cfcda`
