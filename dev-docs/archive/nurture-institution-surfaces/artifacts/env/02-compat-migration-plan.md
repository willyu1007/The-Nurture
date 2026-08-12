# Teacher release owner v3 migration plan

The environment key is additive and existing environments remain disabled
without any values change. The private owner contract is an atomic v2-to-v3
replacement because it now pins the current Surface 1.20 contract; v2 is not a
registered fallback. My-Chat must carry the exact v3 pin before any future
activation, together with service auth and the required runtime dependencies.

The family-growth entries preserve existing optional/default-off behavior.
They add no values or secret references to an environment; deployment owners
may provision them only through a separately authorized environment change.
