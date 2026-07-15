# X4-C2 Isolated PostgreSQL Connection Check

- Date: 2026-07-15
- Approval: explicit user approval
- Container: `institution-x4-validation-postgres`
- Image: `pgvector/pgvector:pg16`
- Endpoint: loopback `127.0.0.1:55435`
- Production database: `nurture_x4_validation`
- Dev-host database: `nurture_dev_host_x4_validation`
- Existing/shared database use: forbidden
- Backup: not applicable; both targets were new and disposable

The production and dev-host targets were separate empty databases in the same
disposable container. No local `localhost:5433/nurture`, staging, production,
cloud, or shared database was connected or mutated.
