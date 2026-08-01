# Environment Contract Diff (Summary)

## High-level change list

- Added: `NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED`
- Removed: none
- Renamed: none
- Deprecated: none
- Type changes: none
- Default changes: none

## Detailed notes

- Type: `bool`
- Required: no
- Secret: no
- Scope: dev, staging, prod
- Default: `false`
- Compatibility: additive and backward compatible; omitted values preserve the disabled state

## Security notes

No secret value was introduced. The flag does not replace service authentication, exact interface pinning, or request-time owner policy.
