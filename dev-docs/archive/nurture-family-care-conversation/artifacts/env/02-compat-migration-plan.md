# Compatibility & Migration Plan

## Change classification

- Backward compatible: yes
- Requires coordinated rollout: no for this provider-side commit; yes for a future activation
- Requires secret manager changes: no

## Migration steps

1. Merge the additive contract with default `false`.
2. Keep all committed environment values omitted/default-off.
3. Complete T-007 consumer adoption against the exact key/version/digest and private carrier.
4. Only a separately authorized activation may set the flag to `true` and run joint conformance.

## Rename / deprecation policy

Not applicable.

## Rollback plan

Set or retain the value as `false`; the protected route returns a generic disabled response without weakening the existing Harness.

## Approvals

No approval checkpoint is required because this is additive and default-off.
