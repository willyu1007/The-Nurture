# M4 Environment Contract Diff

## Added

- `DEV_HOST_PORT`: optional, dev-only integer, default `3001`.
- `NURTURE_BACKEND_URL`: optional, dev-only URL, default
  `http://localhost:3200`.

## Clarified

- `PORT` remains required with default `8000` and belongs only to the formal
  NestJS scenario service.

No secret, requiredness, type, rename or removal change is present.
