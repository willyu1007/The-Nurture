# Environment Contract Change Intent

## Summary

- Change type: add
- Target env(s): dev, staging, prod
- Affected service(s)/component(s): scenario-service protected Institution Admin owner-read

## Context

T-005 G2-B introduces a provider-side protected owner-read that must remain disabled until the exact interface pin and consumer adoption are complete. The change touches `env/contract.yaml` and the typed scenario-service configuration.

## Rationale

The explicit boolean gate prevents the newly qualified provider interface from becoming reachable merely because the existing Harness keys are configured. Missing or invalid configuration remains fail-closed.

## Risk assessment

- Breaking change: no
- Requires rollout coordination: no; the default is `false`

## Human inputs required

None for provider qualification. A future activation task must provide consumer adoption evidence before setting the value to `true` in any target environment.
