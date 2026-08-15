# Contract diff

- `env/contract.yaml`: unchanged; `NURTURE_PROTECTED_CONTENT_KEY` was already
  the SSOT secret variable.
- `env/secrets/staging.ref.yaml`: adds the missing environment-backed logical
  reference for that existing variable.
- Generated public examples and context contain no secret value.
