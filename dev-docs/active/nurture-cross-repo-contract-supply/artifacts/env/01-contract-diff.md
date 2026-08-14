# W3/W4 owner-presenter environment contract diff

- Add `NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED` as optional `bool`.
- Default remains `false` in every environment.
- No secret value or secret reference is added.
- No existing configuration behavior changes while the key is absent.
- Add `NURTURE_DIRECTOR_PRESENTER_ENABLED` as optional `bool` with default
  `false`; no environment value, secret value or secret reference is added.
