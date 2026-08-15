# Post-verification and cleanup

- Only the three scoped foreign keys remain:
  `fk_nurture_fg_outbox_workspace_release`,
  `fk_nurture_fg_outbox_workspace_release_visibility`, and
  `fk_nurture_fg_receipt_workspace_outbox`.
- Their three id-only predecessors are absent.
- Database and environment public feature suites passed.
- DB context refresh completed; the Prisma datamodel itself was unchanged.
- The exact disposable database was dropped; a catalog count for its name
  returned `0`.
