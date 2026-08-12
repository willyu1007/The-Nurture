# Target and scope

- Date: 2026-08-12
- Authorization: the user authorized all related operations and requested
  closure, quality repair and cleanup.
- Nurture target: disposable PostgreSQL 16 container
  `nurture-t007-g4f-db`, database `nurture`, host port `55453`.
- My-Chat companion target: disposable pgvector/PostgreSQL 16 container
  `mychat-t041-g4f-db`, database `mychat`, host port `55454`.
- Data class: synthetic-only test fixtures.
- Durable/shared/staging/production targets: not contacted.
- Exit condition: migration/status/drift and required test lanes pass, then
  both named containers are destroyed and their ports disappear.
