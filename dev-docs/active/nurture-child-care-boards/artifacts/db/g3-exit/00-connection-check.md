# G3 Exit Connection Check

- Date: 2026-08-05
- Environment: local disposable qualification only
- PostgreSQL image: `postgres:16-alpine`
- Container: `the-nurture-g3-exit-9e024de`
- Endpoint: loopback `127.0.0.1:55437`
- Database: `nurture_g3_exit`
- Storage: container-local tmpfs; destroyed after qualification
- Existing `127.0.0.1:5433/nurture`: explicitly excluded
- Existing listener on `127.0.0.1:55439`: explicitly excluded
- Deployment, capability activation, T-008 and Pilot: excluded

Exact detached source topology:

- My-Workflow-Base: `06303e9f404e4ccc0ba3054b763675efe81b5b15`
- My-Chat: `a0195662228a2fc6323b9ea0cd327d3608d8cc17`
- The-Nurture: `97eab0388e3136cb1fda9735cadab334d5cbb587`

No credentials are retained in this evidence.
