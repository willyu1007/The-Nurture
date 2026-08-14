# Implementation notes

## 2026-08-14 — W7-4 teacher organization-owner registration closes

- Registered the W7 conformance fixtures in the service-candidate
  standalone-fixture list (`scripts/service-candidate/candidate-core.mjs`),
  so the next candidate freeze seals them alongside the W3-W6 contracts;
  the frozen G5-A Candidate itself is untouched and
  `verify-service-candidate` continues to report expected post-freeze input
  drift between candidates.
- The remaining W7-4 surface had already landed with W7-2: env contract
  5-file set (SSOT yaml, regenerated example/docs/context JSON, registry
  checksum), ingress and test-routing censuses, safe-code allowlist.
  Governance sync/lint re-ran clean with no derived-view drift.

## 2026-08-14 — W7-3 teacher organization-owner real owner ports

- Added the DB-free domain service
  (`src/teacher-organization-owner-service.ts`): W6-discipline authority and
  read envelopes (workspace-bound opaque refs by candidate matching,
  `query_key === class_ref`), trigger preview through the frozen
  `evaluateOrganizeTrigger`, per-card admission preview through
  `evaluatePublishQueueAdmission` over live facts (quick-adjust and
  edit-hold windows derived from the same facts), and the four exchanges on
  the generic Nurture command ledger. Every canonical payload folds in an
  actor HMAC (workspace + participant), so cross-actor or divergent reuse
  of a `command_request_id` lands `command_payload_conflict` and an exact
  same-command replay answers the recorded result with
  `executed: replayed`. `command_actor_mismatch` stays a reserved schema
  code — the ledger cannot attribute which payload field diverged.
- Organize rides the existing `createOrganizeCareCaptureBatchSpec` with two
  W7 decisions: command identity excludes the volatile batch head (the
  spec's expected-heads check still gates the cut, and a replay after the
  batch left `collecting` must still reach the ledger), and a no-cut
  evaluation answers `committed / nothing_to_organize` without entering the
  ledger, so it always reports `executed: executed`.
- Supplement is the only prepare/confirm: prepare rereads eligibility,
  seals nothing, and issues a single-use five-minute confirmation whose
  state carries the exact typed command and preview digest; confirm
  consumes the token and re-evaluates current authority in-transaction
  before `applyCaregiverDailyCareRecord` (prepared heads are a preview
  fact, not a stale-write license).
- New owner writes: `applyClassNoteCapture` on the care-capture transaction
  (stable text capture appended to — or opening — the collecting batch;
  intake holds the plaintext, so the deterministic safety pass records the
  honest empty marker list, distinct from NULL "never derived") and the
  in-transaction `publishQueueAdmission` port on the command transaction so
  `admitPublishProcessToQueue` freezes the schedule inside the same ledger
  command (`already_satisfied` maps to a committed disposition, waiting and
  blocked reasons roll back deterministically into the frozen enum).
- Prisma side: `PrismaTeacherOrganizationBatchReadPort` (newest
  non-cancelled batch + owner-ordered lane with safe child labels) and
  `createPrismaTeacherOrganizationBinding({ prisma, integrityKey,
  protectedContent, now })` assembling context/capture/admission/
  eligibility reads, the interaction-context service and the command
  runner. No schema change was needed.
- World prerequisites surfaced by the DB lane (recorded for W7-4 e2e):
  organize needs the institution `policyConfigPayload` content-safety
  identity, an active family per child-care process and an org-to-family
  grant covering `daily_care_log`; enrollment rows need
  `participation_phase` under the G4-D check constraint.

## 2026-08-14 — W7-2 teacher organization-owner default-off runtime

- Mounted the six W7 routes in `apps/scenario-service` behind
  `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` with the W6 五件套 shape:
  exact-shape HTTP parsers (including the supplement prepare/confirm
  discriminated union and the note/text 1..500 bound), current-authority
  composition, Ajv-pinned response validator, fail-closed factory and the
  guarded Nest controller. The three W7 safe codes joined the
  `SafeExceptionFilter` allowlist.
- Write-path binding asserts beyond W6: exchange responses must echo the
  exact `command_request_id`; supplement responses must pair with the
  request kind (prepare never lands `committed`, confirm never answers
  `ready_to_confirm`); a committed admission must answer the requested
  `process_ref`. Read asserts reuse the W6 resolution/cache/query-key
  discipline with `query_key === class_ref`.
- Two composition lessons recorded: ready read responses carry the context
  echo only inside `owner_resolution`/`cache_partition` (a top-level
  `context_ref` check must branch by status first), and a `never`-returning
  `violation` helper needs an explicit `() => never` annotation for TS
  control-flow narrowing.
- e2e (listener-free light-my-request, 7 cases) covers all six mounts with
  private headers, replay/outcome_unknown echo, masked short-circuit without
  owner calls, parse-level rejections (foreign authority field, digest
  drift, non-manual trigger, 501-char note), command-identity/pairing/
  process drift kills, quick-adjust duplication kill, default-503 and 401.
- Census sync: ingress census now pins the six routes, controller
  registration, contract constants, gate flag, runtime completeness and
  command-echo assert (controller-routes 30 -> 36); test-routing
  scenario-service census 21 -> 22; env contract 5-file set gained the gate
  variable (SSOT yaml, regenerated example/docs/context JSON, registry
  checksum refreshed).
- Real Prisma owner ports and DB lanes are W7-3; no schema change, no
  activation, no deployment.

## 2026-08-14 — W7-1 teacher organization-owner contract artifact

- Published the W7 contract package at
  `packages/nurture-scenario/contracts/teacher-organization-owner/v1/`:
  owner-contract JSON with six operations (feed, organization, organize,
  supplement, class-note, queue-admission), 17 conformance fixtures + 14
  executed invalid probes + the 18-scenario negative census, hard-pinned
  `validate-contract.mjs` and README. Digest
  `sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161`
  is minted with the shared RFC 8785 canonicalizer and asserted in the
  validator, the TS interface constant and every fixture.
- First write-path contract: the validator additionally checks exchange
  invariants — command identity echo, supplement prepare/confirm status
  pairing, admission answering only the requested `process_ref`, at most one
  active quick-adjust window per lane, and per-batch coverage of `masked`,
  `unavailable`, `outcome_unknown` and `executed: replayed` fixtures.
- Ajv strict-mode composition lessons (recorded for W8+): a `$ref` with
  sibling `required`/`properties` needs an explicit `type: "object"`
  (strictTypes), and every `required` name must also appear in the same
  subschema's `properties` (strictRequired) — satisfied by inert
  `<name>: true` placeholders in if/then branches whose real definitions
  live on the parent, and by not re-listing the identity fields already
  required inside `identity_request`. Three digest re-mints during
  stabilization; only the final digest is published.
- Added `src/teacher-organization-owner-contract.ts` (six paths + frozen
  interface + descriptor, `mobile_mode: "read_and_command"`), exported from
  the package index, and chained
  `verify:teacher-organization-owner-contract` into
  `verify:formal-ingress-contract`.
- Runtime routes, gate flag and e2e lanes are W7-2; real Prisma ports and DB
  lanes are W7-3. The ingress census is intentionally untouched and still
  reports the pre-W7 route population.

## 2026-08-14 — x5 joint repair round two: full lane green (37/37)

- t010 authorization suite (5): completed the b514b68 clock alignment — the
  suite already passed `() => COMMAND_NOW` Clock ports to prepare/confirm but
  left `service.query`'s optional clock on the system default, so the
  T-042-era freshness evaluation ran at wall-clock against the fixture's
  frozen `T010_EVALUATED_AT` window and reported the media change
  unavailable. Both query call sites now pass the fixture clock.
- x5-acceptance (2 asserted, 4 total): the stop was
  `target_unavailable` from the My-Chat consumer, not an owner fault — the
  Nurture user-attention resolve answered a healthy `nurture_attention_v1`
  item, but the T-042 notification hardening
  (`assertActiveWorkspaceRecipients`) refuses recipients who are not active
  members of the exact workspace, and the x5 My-Chat fixture never seeded
  the `caregiver:<workspaceId>` user. The fixture now creates the workspace
  (type `organization`), the caregiver user and an active membership. The
  stale 2026-08-08-era header note claiming the lane "stays red until the
  Nurture owner endpoint adopts" the Dashboard contract was corrected — the
  adoption completed on 2026-08-08 (record 19).
- Full x5 joint lane on the disposable pair: 5 files / 37 tests green — the
  first complete lane pass since the W5 N1 hardening landed.

## 2026-08-14 — x5 joint repair: t009 provenance seed and replay settlement

- Repaired the T-009 joint fixture to the W5 N1 provenance model: the seed now
  creates a guardian Participant + RoleAssignment per family and chains each
  `NurtureScenarioBindingAuthorization` through
  `nurture-care-role:<roleAssignmentId>` with exact versions, replacing the
  pre-W5 `my_chat_child_identity` source ref that had made every prepare fail
  `authorization_provenance_invalid` since 2026-08-13.
- Diagnosed and fixed a real cross-owner settlement regression introduced by
  the `170edd4` hardening: the frozen wire contract re-answers an applied
  release replay with `status: "duplicate"` (same companion refs, same
  original `processed_at`), but the hardened matcher demanded byte-identical
  receipts, so every response-loss recovery rolled back its settlement as
  `receipt_conflict` and the outbox row spun in `delivering`. The matcher now
  treats exactly the stored-`applied` -> incoming-`duplicate` pair (with all
  other fields equal and payloads equal modulo that status) as
  replay-equivalent; My-Chat's consumer (its `T-031` companion commit
  `afb25b5`) now echoes the intake row's original `processedAt` on every
  answer so replayed receipts really are byte-stable.
- Updated the W5 N2/N6 hardening suite accordingly: the pure status-swap
  variant is now a positive settled case, and the conflicting-variant loop
  keeps the boundary honest with a `duplicate`-plus-foreign-`admission_ref`
  probe. Joint state after the repair: t009 8/8 and both t007 joint suites
  green (30/37 lane-wide); the t010 suite (5) and two x5-acceptance cases
  remain red and queued next.

## 2026-08-14 — Reseal tooling consolidation

- Consolidated the manual reseal chain into
  `scripts/reseal-cross-repo-pins.mjs` (`pnpm reseal:pins`): `plan` reports
  every stale pin/lock/literal read-only; `apply --note` rewrites the
  workflow contract pin plus the g2/c30-upstream/owner-adoption revision
  literals (replacing their dated comment blocks with the supplied
  rationale) and runs the three verifiers; `lock` mints the C30-I3 owner
  adoption lock at the committed HEAD. The two-step split preserves the
  commit-then-lock discipline; sibling worktrees must be clean; a Base
  revision move is refused without `--allow-base-move`; a stale My-Chat
  scenario-host-adoption lock is reported with its My-Chat-side refresh
  instructions and never written from here.
- `replaceAnchoredLiteral` is covered by
  `scripts/reseal-cross-repo-pins.test.mjs` (`pnpm test:reseal-pins`, 3
  cases). Entry points are recorded in the W6-W11 schedule artifact (per
  batch/adoption) and in the T-002 implementation notes (C30 lock
  governance).

## 2026-08-14 — W6-3 teacher class-stream real owner ports

- Added the DB-free domain owner
  `packages/nurture-scenario/src/teacher-class-stream-service.ts`: the
  authority resolver rereads the caller's current caregiver context per call
  (participant from workspace + My-Chat user, live caregiver/lead_caregiver
  care-group assignments); owner reads echo the resolved authority verbatim
  and fetch payload facts only. Opaque class/child refs are deterministic
  workspace-bound HMACs resolved by candidate matching, so foreign or stale
  refs purge without existence leaks.
- Added the Prisma read port
  `packages/nurture-db/src/repositories/teacher-class-stream.repository.ts`
  and `teacher-class-stream.composition.ts`
  (`createPrismaTeacherClassStreamBinding`). Reads anchor on canonical
  `@db.Date` class-day columns (daily care logs, attendance submission and
  entries, schedule day override) and the three-layer schedule resolution
  (day override -> class standing -> institution default) with strict
  slots-payload parsing that reports malformed data as
  `content_unavailable` instead of guessing.
- Honesty boundaries implemented per the scope freeze: observations and
  focus-link sections return `unavailable` because no caregiver-visible
  child-associated observation source or granted focus projection exists yet
  (W9/W10 own those); `not_expected` attendance reports the arrival section
  `empty`; no slot is ever marked current because no institution timezone is
  canonical; family-instruction timestamps use the documented UTC day-window
  limitation shared with the G3 board.
- Production `main.ts` intentionally does not construct the binding; like
  W3.1, real-owner presence is not activation and the deployed carrier
  remains a separate W3.2-class gate.

## 2026-08-14 — W6-2 teacher class-stream default-off runtime

- Mounted the four class-stream routes in `apps/scenario-service` with the
  established five-file shape: controller (guard + private headers),
  strict request parsers, composition (authority reread + owner ports +
  request binding), fail-closed runtime factory and an Ajv runtime response
  validator that re-mints the artifact digest at load. The composition binds
  `query_key` to its deterministic request derivation (`local_date`,
  `class_ref|local_date`, `child_ref|local_date`), and the same rule now
  lives in the contract validator and fixtures.
- Registered gate `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED`
  (default false; exact-literal parsing) in config, safe reason codes in the
  exception filter, module/application wiring with the optional
  `teacherClassStream` register input, the ingress census (controller routes
  26 -> 30, six -> seven owner-contract controllers), the test-routing census
  (scenario-service 20 -> 21) and the future-candidate fixture list.
- Environment contract: added the key to `env/contract.yaml`, regenerated
  `.env.example`/`docs/env.md`/`docs/context/env/contract.json`, refreshed the
  `env-contract` registry checksum and appended the W6 entries to the env
  change-record set.
- New e2e suite covers: all four routes with private headers, read-only
  availability-descriptor semantics, masked fail-closed without owner reads,
  foreign-authority/pin-drift 400s, owner scope/query-key/hidden-payload/
  double-current 500s, and default-off 503 plus 401 service auth.

## 2026-08-14 — W6-1 teacher class-stream contract artifact

- Published the W6 contract package at
  `packages/nurture-scenario/contracts/teacher-class-stream/v1/`: hand-authored
  owner-contract JSON (four read operations: class-context, child-strip,
  child-day-detail, schedule), 12 conformance fixtures + 12 executed invalid
  probes, a hard-pinned `validate-contract.mjs` and the README posture note.
  Digest
  `sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3`
  is minted over the artifact with the shared RFC 8785 canonicalizer and
  asserted in the validator, the TS interface constant and every fixture.
- Added `src/teacher-class-stream-contract.ts` (paths + frozen interface +
  descriptor) exported from the package index, and chained
  `verify:teacher-class-stream-contract` into `verify:formal-ingress-contract`.
- Design followed the W4 skeleton with one deliberate simplification recorded
  against the scope freeze: all four operations are bounded single-page reads
  with explicit caps (classes 8, children 80, entries 40, slots 24) and no
  cursor exists in v1, so the freeze's cursored-drift clause is vacuous until
  a later version introduces paging.
- Consumer-compatibility detail: invalid probes use only set-mutations at
  object keys or array indices, because the established My-Chat
  `applyMutation` helper deletes array elements without splicing; an
  enum-violation probe replaced the initial array-delete probe.
- Runtime routes, gate flag, composition and e2e lanes are W6-2; real Prisma
  ports and DB lanes are W6-3. The ingress census is intentionally untouched
  in this step and still reports the pre-W6 route population.

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

## 2026-08-14 — W3 P0 quality and governance closure

- Promoted the standalone parent-communication artifact validator to
  `pnpm verify:parent-communication-owner-contract` and made the maintained
  `verify:formal-ingress-contract` command invoke it before the runtime/route
  census. The validator now cannot silently drift as a manual-only deep-path
  script.
- The first promoted run exposed that direct `node` cannot execute the imported
  TypeScript canonicalizer under Node 25 strip-only mode. The named command now
  uses the repository's existing `tsx` runtime; no duplicate canonical JSON or
  JavaScript fallback was added.
- Cross-checked the exact owner key/version/digest, all four private paths,
  summary/detail read union and teacher-only write union against My-Chat
  `30a14d07d2bad6d7fbc2280ad1d46bece047632a`. My-Chat corrected its final
  Mobile DTO/constructor/Composer drift; `class_group` remains read-only and
  unavailable, not a second write track.
- Resealed the maintained cross-repo pin without changing Base/My-Chat contract
  parity, `x5_joint_api` or `wave4_binding_host` hashes. The Nurture scenario
  hash changed only because `package.json` now contains the maintained
  validator command. No database, deployment, activation or traffic action was
  performed.

## 2026-08-14 — W3.1 real local owner qualification

- Added one HTTP-free scenario contract for context selection, exact authority,
  owner/read and async-generation ports, then removed the duplicate service
  request/authority/binding declarations. The published `1.0.0` artifact and
  digest are unchanged.
- Added the explicit Prisma binding factory. Host current-context selection
  supplies only one Enrollment candidate; the resolver rereads the current
  Participant, Guardian role, current association/anchors, Enrollment,
  CareGroup/institution, primary family/process, private thread membership and
  purpose-scoped bidirectional Grant before every operation.
- Summary returns only availability and bounded unread counts. Teacher detail
  is explicit, capped, actor-ref protected, encrypted-cursor paginated and
  decrypts message bodies only after the exact owner chain succeeds. Summary
  and detail share one presentation head. `class_group` and media remain
  unavailable.
- Prepare writes only an encrypted, five-minute InteractionContext. Confirm
  reuses `NurtureCommandRunner`, the existing CommandExecution ledger and the
  existing G2 transaction to consume the token and atomically write
  Message/Item/ItemEvent/ChildLinkReceipt/Attention. Exact replay returns the
  stored opaque refs; the internal command hash now includes an actor-bound
  value so a second guardian cannot replay another guardian's result.
- Strengthened the existing family-care writer with an exact thread-head and
  full-scope CAS, propagated the command clock into its transaction, and kept
  the family-growth provider outbox restricted to its existing cross-owner
  release/lifecycle semantics. No generic local-message outbox or second
  persistence track was added.
- The final review repaired bounded-map recency eviction, latest receipt-head
  selection, control-character/surrogate-safe display text, association anchor
  currentness, PostgreSQL 17's reserved `authorization` alias, raw Date UTC
  comparisons and one raw workflow timestamp that violated its monotonicity
  trigger outside UTC.
- No Prisma schema, migration, dependency, environment default, deployment,
  activation or traffic change was made.

## 2026-08-14 — W4 read-only director presenter supply

- Published `nurture.director-presenter@1.0.0` at exact digest
  `sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9`
  with overview, bounded drilldown and protected-material query operations.
- Reconciled D-O13 with the current product authority: Institution Mobile is
  action-free, so W4 returns only `web_workbench_required`. The artifact and
  both strict runtimes reject action, confirmation, command, storage and URL
  fields instead of publishing an unauthorized Mobile command surface.
- Added current-authority and read-owner port contracts, exact request/response
  binding, service bearer authentication, private/no-store responses and one
  default-false provider gate. The runtime is unavailable unless every owner
  port and service-auth dependency is explicitly supplied.
- Added 12 conformance fixtures and eleven invalid probes, response-shape
  enforcement and three controller routes. The W4 validator is a maintained
  top-level command and is chained into formal-ingress verification.
- My-Chat T-039 adopted only the exact private consumer: it sends host routing
  context, validates the full response locally and fails closed on any drift.
  Public API/Mobile composition and any family archive/organization admission
  remain outside this batch.
- No real Prisma owner port, schema/migration, database operation, deployment,
  activation, traffic, native-device or accessibility work was performed.

## 2026-08-14 — W4 final quality closure

- Closed a page-replay gap by requiring every ready material response to echo
  the exact request cursor, including `null` for the first page. Provider
  composition and the My-Chat consumer both compare that value before use.
- Added ordered lifetime checks from current owner resolution through response
  generation, cache expiry and protected owner-stream access. Expired 2xx
  payloads now fail closed at the consumer instead of entering a retry loop.
- Empty and unavailable overview sections can no longer carry metrics, trends,
  drilldown refs or material refs. Ratio values require a valid denominator and
  cannot exceed it; photo presentations require alternative text.
- Hardened the private My-Chat source to accept only an HTTP(S) service origin
  and a control-free service token. Invalid 2xx payloads and 401/403/404
  responses become non-retryable `content_unavailable`; network and 5xx
  failures remain the only transport-retry path.
- Removed obsolete Mobile drawer-axis code after the shell moved to the native
  edge-aware drawer. Bottom-aligned interaction and selection sheets retain one
  vertical dismiss substrate; no duplicate gesture implementation remains.
- No owner business port, public API/Mobile composition, schema/migration,
  database operation, deployment, activation, traffic, Candidate identity or
  device claim was added.
