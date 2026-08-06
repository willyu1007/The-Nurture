# Family Growth Transport Addendum — DRAFT v0.1

Status: DRAFT — not frozen. Joint freeze with My-Chat is T-009 increment I0.
This document binds the transport mechanics only; the
`family_growth_material_*` v1 envelope (My-Chat `d4ed0ce`) stays frozen and
is not modified by this addendum. Mirrored copy lives in My-Chat
`dev-docs/active/growth-record/artifacts/`; on freeze both copies carry the
same version and digest.

## Parties

- Provider: The Nurture scenario service (release/lifecycle event source,
  rendition source, receipt consumer).
- Consumer: My-Chat (ingress owner, admission decider, receipt issuer,
  media importer).

## 1. Event delivery

- My-Chat exposes one service-authenticated ingress endpoint (NestJS,
  following the existing `user_attention` owner-endpoint auth pattern):
  `POST <my-chat>/internal/scenario/family-growth/events` (path TBD at freeze).
- Request body: exactly one v1 envelope — `release_event` or
  `lifecycle_event`. One event per request; no batching in v1.
- Response `200`: body is the `family_growth_material_admission_receipt@1.0.0`
  for that event. The synchronous response IS the receipt channel; there is
  no separate callback in v1.
- Idempotency: (`event_id`, `payload_digest`) is the replay identity. Exact
  replay returns the existing result (`duplicate` status where applicable);
  same `event_id` with a different digest → `conflict` (fail closed).
- Ordering: no cross-event ordering guarantee. Lifecycle events may arrive
  before their release; the consumer's suppression ledger handles late
  releases (already implemented consumer-side).

## 2. Provider retry semantics

- Timeout / 5xx / network failure → provider records `outcome_unknown`
  (delivery state, not a receipt status) and retries the SAME `event_id` +
  `payload_digest` with exponential backoff (parameters fixed at freeze).
- `rejected` and `conflict` are terminal for that event id: no automatic
  retry; surfaced to the teacher publish queue for explicit handling.
- `pending_guardian_confirmation` is terminal for delivery (the receipt was
  issued); later state changes are consumer-internal.

## 3. Media import (reverse direction)

- The envelope carries `family_rendition_ref` (opaque). Media bytes never
  travel in the event request.
- Nurture exposes a service-authenticated exchange endpoint:
  `POST <nurture>/internal/family-growth/renditions/resolve`
  with `{ rendition_ref }` → `{ url, expires_at, content_digest, mime_type }`.
- The URL is short-lived (TTL fixed at freeze; minutes, not hours),
  single-purpose, and never a permanent public URL. My-Chat downloads,
  verifies `content_digest`, and stages the blob BEFORE opening its
  admission transaction (consumer rule already in the v1 prose contract).
- v1 rendition semantics: the ref resolves to the exact unchanged original
  media revision, authorized for the target family (Nurture D-T009-02).
  An unresolvable/revoked ref fails the exchange closed; it never falls back
  to another rendition or revision.

## 4. Authentication

- Mutual service credentials per environment (mechanism fixed at freeze;
  same class as the existing service-authenticated owner endpoints). No user
  tokens on either direction. Transport identity is never business
  authorization: both sides re-verify their own authority facts.

## 5. Versioning

- This addendum is versioned independently as `family_growth_transport@…`;
  v1 envelope compatibility rules are unchanged. Breaking transport changes
  bump the addendum version only.

## Open items for freeze (I0 checklist)

1. Final endpoint paths and environment configuration keys.
2. Concrete service-auth mechanism and credential rotation story.
3. Retry/backoff parameters and attempt cap before operator attention.
4. Rendition URL TTL and single-use vs. re-resolvable within TTL.
5. Error taxonomy for the exchange endpoint (auth vs unknown ref vs revoked).
6. Receipt persistence duty on the provider side (T-009 I2 table is the
   proposal) and the `outcome_unknown` re-query path, if any, beyond replay.
