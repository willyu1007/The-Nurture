# M4 Environment Contract Change Intent

- Task: T-002
- Scope: align the accepted M0 local port semantics without changing deployment,
  activation, secret values or API wire behavior.
- `PORT=8000` remains exclusive to the formal NestJS scenario service.
- Add dev-only `DEV_HOST_PORT=3001` for the loopback Fastify harness.
- Add dev-only `NURTURE_BACKEND_URL=http://localhost:3200` for the
  Base-assigned local backend endpoint consumed by the frontend on `3201`.
- No existing key is renamed or removed; the change is backward compatible.
