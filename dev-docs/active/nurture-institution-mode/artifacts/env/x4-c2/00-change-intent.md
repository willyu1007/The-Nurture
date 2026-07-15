# X4-C2 Environment Contract Change Intent

- Change type: additive secret reference
- Target environments: dev, staging, prod
- Component: Nurture internal owner-read endpoint

`NURTURE_INTERNAL_SERVICE_TOKEN` authenticates My-Chat calls to the refs-only
`user_attention` owner-read endpoint. The value is optional at process level so
the default/pre-activation composition remains bootable; absence makes the
endpoint return `503 activation_owner_disabled`.

No secret value is stored in the repository.
