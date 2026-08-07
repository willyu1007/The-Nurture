# Family Growth Transport Addendum — family_growth_transport@1.0.0

Status: FROZEN 2026-08-07 (user decision, all six open items settled).
This document binds the transport mechanics only; the
`family_growth_material_*` v1 envelope (My-Chat `d4ed0ce`) stays frozen and
is not modified by this addendum. An identical copy lives in My-Chat
`dev-docs/active/growth-record/artifacts/`; both copies carry the same
content digest. Breaking transport changes bump this addendum's version
only; the envelope compatibility rules are unchanged.

## Parties

- Provider: The Nurture scenario service (release/lifecycle event source,
  rendition source, receipt consumer).
- Consumer: My-Chat (ingress owner, admission decider, receipt issuer,
  media importer).

## 1. Endpoints and configuration

| Direction | Endpoint | Purpose |
| --- | --- | --- |
| Nurture → My-Chat | `POST /internal/scenario/family-growth/events` | One v1 envelope per request (`release_event` or `lifecycle_event`); no batching |
| My-Chat → Nurture | `POST /internal/family-growth/renditions/resolve` | `{rendition_ref}` → `{url, expires_at, content_digest, mime_type}` |
| My-Chat → Nurture | `GET <url from resolve>` | Streams the rendition bytes while the lease is valid |

Configuration keys (absence of any key = that capability stays off,
fail closed; nothing floats to a default credential):

- `MY_CHAT_INTERNAL_BASE_URL` (existing) — Nurture's outbound base.
- `FAMILY_GROWTH_EVENTS_SERVICE_TOKEN` — sent by Nurture, validated by
  My-Chat's events ingress.
- `FAMILY_GROWTH_RENDITION_SERVICE_TOKEN` — sent by My-Chat, validated by
  Nurture's rendition endpoints.

Tokens are direction- and capability-scoped: an outbound token is never
accepted for inbound validation (the Q-1 finding-3 discipline), and neither
reuses `NURTURE_INTERNAL_SERVICE_TOKEN`.

## 2. Authentication and rotation

- Static Bearer token per direction, timing-safe comparison, minimum 16
  characters — the mechanism both repos already use for service-to-service
  endpoints. No mTLS/JWT in v1.
- Rotation: each validator accepts `{current, previous}` via
  `<KEY>` / `<KEY>_PREVIOUS`. Runbook order: deploy the new token to the
  validator first, then switch the sender, then clear `_PREVIOUS`.

## 3. Event delivery and retry

- Response `200`: body is the `family_growth_material_admission_receipt@1.0.0`
  for that event. The synchronous response IS the receipt channel; there is
  no callback in v1.
- Idempotency: (`event_id`, `payload_digest`) is the replay identity. Exact
  replay returns the existing result; same `event_id` with a different
  digest → `conflict` (fail closed).
- Ordering: no cross-event guarantee; lifecycle may arrive before its
  release (consumer suppression handles late releases).
- Settlement rule: ONLY a valid 200 receipt settles an event
  (`rejected`/`conflict` settle as failed and never auto-retry). Everything
  else — timeout, 5xx, 4xx without a receipt body, an unparsable receipt, a
  receipt whose `release_event_id` mismatches — is `outcome_unknown`,
  retriable with the SAME event id + digest.
- Request timeouts: 10s connect / 30s total.
- Backoff: exponential, base 30s, factor 2, cap 1 hour
  (30s → 1m → 2m → … → 60m), ±20% jitter. No terminal give-up: an
  `outcome_unknown` event retries indefinitely at the 1-hour cap.
- Operator attention: at 8 attempts (~4h) the provider raises an ops
  signal (structured log/metric); the teacher queue keeps showing
  `outcome_unknown`.
- Stale-claim recovery: a row in `delivering` whose last attempt is older
  than 10 minutes (≫ the 30s request cap) is reclaimable by any worker.

## 4. Rendition exchange

- The envelope carries `family_rendition_ref`
  (`nurture_family_rendition_v1:<assetId>:<mediaRevision>`); media bytes
  never travel in the event request.
- `resolve` re-verifies authorization ON EVERY CALL: the ref must appear in
  a committed `released` outbox envelope and that release must still be
  `visible`. Removal/redaction denies from that moment — this is where
  independent revocation bites.
- Lease TTL: **5 minutes**, re-resolvable within TTL (NOT single-use):
  a failed download retries by re-resolving; safety comes from per-call
  re-authorization, not one-shot leases.
- The `GET` also requires the rendition Bearer token; the lease binds the
  exact asset+revision and the expiry, not the caller identity.
- The consumer verifies `content_digest` over the downloaded bytes before
  opening its admission transaction (v1 prose-contract rule, unchanged).

## 5. Error taxonomy (rendition endpoints)

| HTTP | reason | Covers |
| --- | --- | --- |
| 401 | `service_unauthorized` | missing/wrong Bearer; no detail |
| 400 | `rendition_ref_invalid` | malformed ref |
| 404 | `rendition_unavailable` | unknown ref, removed/redacted release, expired lease — ONE collapsed answer; lifecycle state never leaks through this surface |
| 503 | `rendition_temporarily_unavailable` | storage backend unavailable; retriable |

## 6. Receipt persistence and outcome_unknown resolution

- Provider duty: every consumed receipt is persisted append-only
  (`nurture_family_growth_admission_receipt`) and settles its outbox row;
  receipts are audit evidence and are not purged in v1.
- `outcome_unknown` resolves by REPLAY ONLY in v1: the consumer's ingress
  ledger answers an exact replay idempotently, so the POST is the query.
  A dedicated read-only status endpoint is a v1.1 candidate if operational
  experience shows replays are too heavy.

## Version identity

`family_growth_transport@1.0.0`. Open-items list: empty.
