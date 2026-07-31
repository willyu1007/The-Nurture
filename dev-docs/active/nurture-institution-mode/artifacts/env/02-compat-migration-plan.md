# M4 Environment Compatibility Plan

The change is additive and requires no breaking-change approval.

1. Existing scenario-service environments keep `PORT=8000`.
2. Local dev-host launchers may set `DEV_HOST_PORT`; absence keeps `3001`.
3. Local frontend launchers may set `NURTURE_BACKEND_URL`; absence now targets
   the Base-assigned `http://localhost:3200` endpoint.
4. The frontend local listener moves from `3000` to `3201`.

There is no compatibility listener or dual use of `PORT`. Environment topology
does not change the frozen owner API wire contract.
