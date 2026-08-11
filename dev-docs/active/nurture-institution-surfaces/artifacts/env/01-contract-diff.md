# Teacher release owner v3 environment contract diff

`NURTURE_TEACHER_RELEASE_OWNER_ENABLED` is an optional boolean with default
`false`. It gates only `nurture.teacher-release-owner@3.0.0`; no v1/v2 route or
compatibility toggle remains. It does not alter the existing Harness or
Institution communication gates.

The contract also adopts the three existing family-growth runtime token keys
that were already present in code and generated context but missing from the
YAML SSOT. This is a drift repair, not a new activation or secret value.
