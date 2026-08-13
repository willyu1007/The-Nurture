# Implementation notes

## 2026-08-13 — W5 scoped hardening (N2/N5/N6/N8)

- N2: `attemptCount` is now the delivery lease version. Receipt and transport
  failure settlement use `updateMany` CAS over event/workspace,
  `deliveryState=delivering`, and the exact attempt. A reclaimed lease makes
  the older completion an ignored no-op.
- N5: the worker structurally validates the stored release/lifecycle envelope,
  checks its row identity and canonical payload digest before transport, and
  binds receipt settlement to event, source scenario, source release and
  family coordinates.
- N6: receipt insertion count is inspected. Exact canonical replays may
  re-settle without a second evidence row; status/ref/time/payload differences
  return `receipt_conflict`, with the outbox CAS rolled back.
- N8: binding reads select only the cardinal current family association and
  follow its exact child-association id; updated historical rows cannot shadow
  the current chain.
- No Prisma schema, migration, route, configuration, dependency, activation or
  deployment change was made.

## 2026-08-13 — W5 review repairs (NR1–NR5)

- NR1: `recordReceipt` now parses the raw receipt and, inside its settlement
  transaction, loads and validates the stored outbox envelope before comparing
  release event, source scenario, source release and family coordinates. A
  mismatch returns `receipt_coordinate_mismatch` without settlement/evidence.
- NR2: a CAS miss now rereads current outbox/evidence state. An exact receipt
  against the matching terminal state returns `replayed` without mutation;
  `stale` is returned only when a newer attempt superseded the caller, while a
  same-attempt non-replay returns `not_settled`.
- NR3: the delivery decision retains the raw response body, and the repository
  canonicalizes/persists that full body (unknown fields included) for
  replay/conflict comparison. Receipt conflicts emit a structured warn record
  carrying the `family_growth_delivery_receipt_conflicts_total` increment-style
  signal.
- NR4: the `outcome_unknown` claim CAS now repeats the due-time predicate as
  well as the state predicate, preventing a candidate read from reclaiming a
  row concurrently moved into future backoff.
- NR5: the mocked hardening suite adds coordinate, replay-result, raw-content,
  CAS-scope, due-predicate and no-mutation assertions. Its source comment states
  that real PostgreSQL locking/rollback evidence is deferred to the T-011 N3
  disposable-target qualification run.
- No schema, migration, configuration, activation or default change was made.

## 2026-08-13 — W1 callback design draft v2

- Replaced the first callback draft with the owner-delegated v2 design after
  the independent adversarial review returned six REQUIRED findings.
- Froze exact event and receipt keys, RFC 8785 canonical-byte digest and replay
  rules, full receipt correlation, and complete frozen section-3 settlement
  parity.
- Added a one-terminal-outcome admission state machine, pre-receipt staging,
  lifecycle precedence, explicit coarsened teacher disclosure, and removal of
  `decision_time` from the wire.
- Required finite My-Chat expiry with a 30-day default and atomic closure plus
  outbox emission. Added bilateral gates, validator-first token sequencing,
  successor teacher DTO deployment and scoped golden-byte gates.
- No schema, route, token, deployment, activation or runtime change was made.
