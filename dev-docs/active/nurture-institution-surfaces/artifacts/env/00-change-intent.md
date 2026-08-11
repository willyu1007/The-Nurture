# Teacher release owner v3 environment change intent

- Add one non-secret boolean gate for the v3 production composition.
- Reconcile three already-used family-growth service-token keys into the env
  contract SSOT so regeneration does not delete their existing generated
  contract entries.
- Keep the only provider route family and the consumer pin on v3 while the
  gate remains default `false` in every environment.
- Do not configure deployment values, secrets, activation or traffic.
