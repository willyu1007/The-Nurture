# Schema diff preview

- SSOT mode: `repo-prisma`.
- Empty-to-datamodel SQL digest:
  `3b408270e2d6f1e77b5f224ce1295c45e39f20847c0c7a1467a51a42d936f45b`.
- Statement census: `create=503`, `alter=229`, `drop=0`, `truncate=0`.
- Initial migration count: 43. Initial migration-set digest:
  `49bb5c6d91b6b5fdd1117d1782f4a259906c4712fa2b7716a3ab02701d6f3ce9`.

The first replay exposed three redundant id-only foreign keys that were still
present in migration history but absent from the stricter workspace-scoped
Prisma relation model. This was treated as SSOT drift, not waived.
