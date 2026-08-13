# Implementation notes

## 2026-08-13 — W2 P0 quality and single-track closure

- Deleted the superseded W2 scope draft. The published contract directory,
  strict validator and accepted digest-pin record are the only active owner
  contract/handoff lane; historical review evolution remains in Git.
- Updated the Nurture scenario self-hash after the maintained root typecheck
  began regenerating both Prisma clients. `typecheck` now owns generation and
  `build` no longer repeats it, preventing stale generated clients and duplicate
  work from producing contradictory evidence.
- Repaired historical T-009/T-010/T-011 test fixtures that the current generated
  types correctly rejected: current owner-evidence expiry and guardian-role
  identity are explicit, authorization clocks use the maintained port, and the
  raw-query mock implements the exact Prisma transaction-client method shape.
- Verified the upstream workflow/base pins in repository-external detached
  worktrees at the exact recorded revisions. The current developer Base
  checkout may advance independently; no floating revision or local-HEAD
  exception was introduced.

## 2026-08-13 — W2 My-Chat P0 consumer adoption handoff

- My-Chat T-039 adopted the exact W2 pin across a private HTTP source, strict
  public Dashboard DTO/API client and production Mobile parent-garden
  controller. The provider gate remains false by default and there is no
  fixture fallback.
- The consumer supplies only Workspace/user/request identity plus opaque
  `context_ref`; it does not send Participant, role, child or family authority.
  It strips owner resolution/cache fields and protected media access refs from
  its public/mobile boundary.
- Joint verification passed the provider validator and 12-case mounted route
  suite plus 65 My-Chat focused tests. My-Chat also fails closed when the four
  composed read operations return different owner scope versions or when a
  structurally valid response belongs to another ref/date/action request.
- This completes W2 P0 adoption but does not qualify deployment, active owner
  ports, media resolution, native devices, activation or traffic. W3 remains
  the next supply item.

## 2026-08-13 — W2 second adoption-review repair

- Bound every confirm fixture to the prepared five-field identity tuple:
  `action_ref`, `action_version`, RFC 8785 `prepared_preview_digest`,
  `confirmation_ref` and `command_request_id`. The validator lookup and
  real-route e2e both compare the complete tuple, with executed drift probes
  for the two previously omitted fields.
- Added a Draft 2020-12 `notice_operation_exchange` schema whose `oneOf`
  branches discriminate `list`, `prepare_confirmation` and `confirm` and admit
  only their allowed response-status sets. The validator executes that schema
  for every notice fixture and rejects `list + not_committed`; the composition
  has the same closed matrix as an independent runtime check.
- Added startup compilation of all five published response schemas from the
  canonical artifact. Every owner and composition response is schema-checked;
  schema or semantic drift throws across the private filter as generic
  `500 internal_error`. The real route proves an owner-only
  `private_care_note` is rejected and never forwarded.
- Replaced manual guard/controller/filter dispatch with
  `Test.createTestingModule` plus in-memory Node HTTP injection through the
  mounted Express adapter. All routing, decorators, parsing, guards and filters
  are real. The route suite also exposed and repaired transform-sensitive
  filter DI by making both filter dependencies explicit.
- Made ASYNC-12 an application rule. Enabled composition now requires an async
  boundary port that captures the response generation and reads current
  generation/context state; the composition performs equality and returns a
  closed unavailable response instead of forwarding a late owner result.
- Rotated the strict RFC 8785 adoption digest across artifact consumers and
  records to
  `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196`.
  No pin JSON, route enablement, deployment or traffic posture changed.

## 2026-08-13 — W2 adoption-review repair

- Added a bounded `activities[]` source to the day response: at most 20 opaque
  activity refs with bounded title, UTC timestamp and presenter media state.
  Activity detail remains a separate operation, and validator probes require a
  detail ref to originate from the same context/date day response.
- Bound notice list, prepare and confirm through one action ref/version and an
  RFC 8785 digest of byte-equivalent confirmation preview copy. Confirm must
  echo the exact identity and digest; list/prepare/confirm fixture consistency
  and prepared digest recomputation now fail hard on drift.
- Mounted all five private `POST` routes in scenario-service behind
  `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED`. The guard requires configured
  service bearer auth plus a complete Q6 authority-resolver/owner binding;
  otherwise it returns private/no-store `503`. The controller, scoped private
  exception filter, providers and all five routes are pinned in the formal
  ingress AST census.
- Added a focused in-process Nest e2e suite covering all five paths, auth and
  exact-pin negatives, Q6 resolution before every owner call, all six masking
  classes, action/digest mismatch, replay and ASYNC-12 late-result rejection.
  The in-process transport exercises the real controller/guard/filter graph
  without opening a listener in restricted test environments.
- Added eight mutation fixtures that the AJV schemas must reject and operation-
  specific probes for selected date, cache query key, day-to-detail activity
  refs, notice/action foreign consistency, preview identity/digest, media-state
  exclusions, unique refs and pagination cursor requirements.
- Hard-pinned the published RFC 8785 adoption digest in the validator and
  rotated the artifact, fixtures, source constant and records to
  `sha256:e19642198f5022f0e68e5908e6d17098abee6a12942f47a247e7e5a8db633fd6`.
  No pin JSON changed; routes remain default-off and no deployment or traffic
  was enabled.

## 2026-08-13 — W2 parent-context presenter v1 initial authoring (pre-review)

- Published a standalone, default-off
  `nurture.parent-context-presenter@1.0.0` source artifact over the unchanged
  `nurture.surface-contract@1.20.0` baseline. The artifact declares five
  service-bearer internal ingress paths but adds no controller, route,
  composition, feature flag or runtime adapter.
- Embedded strict Draft 2020-12 request/response schemas for day navigation,
  partial daily-care cards, activity detail with opaque protected-media access,
  notice list/prepare/confirm and freshness/attendance display projection.
  Every call accepts Host identity plus `context_ref` only and requires fresh
  Nurture owner resolution; caller Participant/role/scope fields and recursive
  foreign fields are rejected.
- Froze a reviewed 14-code safe reason vocabulary, explicit mask signals for
  access/scope/context/policy/non-retryable-refresh drift, universal private
  no-store response rules, and the complete protected-cache dimension and
  invalidation semantics referencing ASYNC-01 through ASYNC-12. Presenter
  display enums are isolated from Prisma/domain business enums.
- Resolved protected media to opaque, actor/context/expiry-bound owner-stream
  access refs with no URL or storage ref. Resolved attendance tokens as display
  states only, not canonical attendance facts. Notice confirmation uses closed
  list/prepare/confirm sub-exchanges with same-command reconciliation only.
- Added 16 joint conformance fixtures and an offline schema/digest validator.
  The matrix has positive and negative coverage for every operation plus scope
  loss, revocation, stale `context_ref`, ambiguous Enrollment,
  protected-display denial, non-retryable refresh, replay and late completion.
- Computed the canonical source digest with the repository's strict RFC 8785
  implementation and recorded the exact pin plus all five IR-C01 properties in
  `artifacts/w2-parent-context-presenter-v1-digest-pin.md`. No pin JSON was
  changed. The final publication review accepted the exact pin, fixtures and
  listener-free conformance environment; W2 is adoption-ready and My-Chat
  T-039 owns the separate dormant consumer adoption.

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
## 2026-08-14 — W3 parent communication P0 vertical slice

- Published `nurture.parent-communication-owner@1.0.0` at exact digest
  `sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f`
  with four closed request/response operations, nine positive fixtures and
  eight invalid fixtures. Summary has no member/message/media detail and an
  unavailable segment must expose zero unread; detail is explicit-open and
  bounded to 20 members/50 messages.
- Mounted summary, detail, media-access and send-text private routes in the
  formal scenario service. The explicit boolean gate defaults false and
  composition additionally requires service auth, a current-authority resolver,
  owner port and async-generation boundary.
- Send P0 is one semantic track: teacher text only, prepare creates no business
  fact, confirm retains the exact command id, replay is exact, and transport or
  commit ambiguity returns `outcome_unknown/reconcile_same_command`.
  A malformed or foreign confirm receipt uses the same result because the
  canonical write may already have happened; it is never downgraded to a
  generic retry with a new command.
  `class_group`, attachments and voice are not admitted into this command.
- Froze the protected-image access request/response policy, but made the P0
  runtime return `content_unavailable` after current-authority resolution. The
  access-stream path namespace is reserved but not mounted, preventing a ready
  access response that no ingress could honor.
- Removed unused schema fragments, made cache expiry explicit, fixed the
  scenario-service package typecheck root, raised the scenario-service test
  census to 19 and synchronized the env contract with a non-secret default-false
  flag. No database schema, migration, deploy, activation or traffic changed.
- Repaired the root runtime exports of `@the-nurture/scenario` and
  `@the-nurture/db` to resolve built `dist` modules while retaining TypeScript
  sources for types. The maintained scenario-service smoke now starts the real
  build and verifies the parent-communication owner is default-off.
- My-Chat T-039 adopted the exact digest through a strict private source,
  public API/client and dormant Mobile controller. The remaining next actions
  are: implement real owner/async ports, implement and qualify the media stream
  plus proxy if promoted into P1, and run controlled deployed/native
  qualification before either flag changes.
