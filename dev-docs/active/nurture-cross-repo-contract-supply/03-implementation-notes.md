# Implementation notes

## 2026-08-13 — W5 N9 adversarial review repair

- Replaced the formal-ingress filename/decorator regex with a TypeScript AST
  census over every `.ts` file below `apps/scenario-service/src`. The census
  resolves all `@nestjs/common` named imports, named aliases, namespace imports
  and default namespace-style references before recognizing route decorators.
  Inline fail-closed self-checks cover an aliased `Post`, namespace-qualified
  `Nest.Post`, and a controller route declared in a non-standard filename.
- Parsed the real `@Module({ controllers: [...] })` metadata and the
  complete scenario-service `NestFactory.create` call inventory. Static and
  dynamic controller registrations are combined and pinned to the exact
  source/export inventory, so a registered controller cannot evade the route
  census by filename, decorator spelling or a dynamic-module controller list.
  The dynamic module's two exception-filter providers are pinned as well.
- Added `PrivateResponseExceptionFilter` as a controller-scoped filter on the
  teacher-release and family-sharing private controllers. It writes
  `Cache-Control: private, no-store` and `Pragma: no-cache` before delegating to
  the existing safe error serializer, so guard-thrown 401/503 responses receive
  the same privacy posture as successes. The family-sharing guard's duplicate
  header mutation was removed, making the filter the single error-path owner.
- Added 401/503 header assertions to both existing controller E2E suites and a
  non-listening filter unit test. The trusted-invocation suite now proves an
  exactly 60-second request passes upstream validation but fails the local
  expired-window branch before nonce consumption; accepted invocations spy on
  the nonce store and prove exactly one consumption per invocation.
- No route, schema, migration, workflow pin, runtime default, deployment or
  activation change was made.

## 2026-08-13 — W5 N7/N9/N10/N11 closure

- N7: the family-sharing invariant guard now strips SQL comments, parses
  statements, requires each full normalized CHECK against its owning table,
  requires the complete composite-FK target columns/table and `ON DELETE` / `ON
  UPDATE` actions, and rejects non-additive or unanchored statement shapes. Its
  self-checks cover comment-only SQL, a wrong owning table, and a trailing
  destructive FK clause. CI runs it next to the family-growth outbox guard.
- N9: the formal-ingress guard recursively censuses every controller route in
  `apps/scenario-service/src` and compares all 14 method/decorator declarations
  to an explicit allowlist. The signed family-sharing endpoint is bound to its
  service bearer, error/success no-store headers, exact route/operation/schema/
  interface pins, disabled default, trusted declarations, Ed25519 verifier,
  60-second invocation lifetime and Prisma nonce store. Each teacher-release
  v3 route is bound to the class service-bearer guard, per-route no-store
  headers, exact path/interface/dependency pins, parser/handler and default-off
  composition.
- N10: `c30/canonical-json.ts` is the sole RFC 8785 serializer; the family-growth
  module is a compatibility wrapper over that core. Valid JSON continues to use
  the same `JSON.stringify` primitive bytes, array order and UTF-16 key sorting,
  so existing valid persisted digest semantics are unchanged. Non-plain values,
  undefined, sparse/extended arrays, cycles, non-finite numbers and unpaired
  surrogates now fail closed. Tests include the RFC 8785 primitive, Unicode
  ordering and Appendix B number vectors plus lone-surrogate negatives.
- N11: cleanup-ledger receipt lookup has one shared implementation. The parser
  constructs `completed_at` once, checks `Number.isFinite(getTime())` before
  `toISOString()`, and returns `null` for corrupt values; the repository then
  reports its stable invalid-receipt error rather than leaking `RangeError`.
- No schema, migration, pin JSON, capability gate, runtime default, deployment
  or traffic change was made.

## 2026-08-13 — W5 N1/N3 hardening

- N1: prepared family-growth emissions now carry the exact workspace/local
  pair, child/family anchor IDs and aggregate versions, child/family
  association IDs and aggregate versions, the selected authorization IDs,
  aggregate versions, owner refs/versions, purpose, authorization-source refs/
  versions and expiries, current Guardian-role/Participant heads, the required
  canonical-owner evidence expiry, and the exact canonical child/family target
  returned by that exchange. The Serializable release transaction binds both
  the local tuple and canonical tuple to its loaded target and checks the whole
  chain with one `SELECT ... FOR SHARE` statement before its first retained
  write. Revocation/rebind updates must wait or conflict after lock acquisition;
  head/currentness/authority/expiry drift returns terminal
  `binding_unavailable`, while cross-pairing returns the distinct terminal
  `binding_target_mismatch`. Real-PostgreSQL lane cases at Read Committed,
  Repeatable Read and Serializable open the guard transaction and attempt
  revocation from a second connection mid-flight;
  the focused no-database suite pins the exact locking SQL shape.
- N3: Prisma now expresses composite release, release/visibility lineage and
  receipt/outbox relations. Migration
  `20260813120000_t011_family_growth_outbox_scope` adds four supporting uniques
  and three strictly stronger composite FKs while retaining all original FKs;
  it contains no drop or data mutation/backfill.
- Added the N3 schema-diff preview and migration plan, parsed static invariant
  guard, and a guarded three-phase qualification runner. Phase A replays from
  empty and runs the existing controls/probes. Phase B1 migrates to the
  previous head, seeds CHECK-valid coherent legacy rows, applies only T-011 and
  verifies populated validation. Phase B2 executes the exact failing FK in a
  rollback-only transaction, requires SQLSTATE `23503`, then records PASS only
  when the transactional migration aborts and leaves no T-011 object. The
  runner accepts only a loopback `t011_n3_*` URL, requires approval to repeat
  the literal database name and bind the SHA-256 of the exact URL, and censuses
  relations, sequences, routines, domains, enums and non-default extensions.
  Loopback/private-server assertions are defense-in-depth only and cannot prove
  local Docker ownership. Prisma CLI reasserts identity with the exact
  migration URL immediately before every deploy.
- The approved loopback disposable qualification executed against
  `t011_n3_disposable_20260813b`: phase A replayed all migrations from empty,
  phase B1 validated the populated previous-head upgrade, phase B2 passed by
  FK-caused abort with rollback proof, final emptiness passed, and the
  disposable containers were destroyed.
- Qualification release fixtures now derive digest/lifecycle values from the
  existing CHECK constraints. In particular `command_request_id_hash`, revision
  content identity and routing identity are 64-hex digests, replacing the
  invalid `qualification:<uuid>` placeholder that failed a real disposable run.
- Regenerated the Prisma client offline and refreshed/strictly verified the DB
  context contract. Default-off runtime posture and workflow pins are
  unchanged.

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
