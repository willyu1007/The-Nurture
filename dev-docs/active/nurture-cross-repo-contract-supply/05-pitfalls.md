# Pitfalls

## 2026-08-14 — Root-import dist masking swallowed source-level fixes and probes

- Symptom: a repaired `receiptReplayMatches` in `packages/nurture-db/src` had
  no effect on the joint suite, and console probes added to the same source
  file never printed, while probes inside the test file always did.
- Root cause: the joint tests import `@the-nurture/db` by its package root,
  whose runtime export maps to `dist/index.js`; every source edit was invisible
  until `pnpm build:binding-owner-runtime` regenerated the dist output.
- What was tried: three rounds of increasingly wide source-level probes, all
  silent, before the export map was rechecked.
- Fix: rebuild the binding-owner runtime before interpreting any joint-lane
  result that involves `@the-nurture/db` or `@the-nurture/scenario` root
  imports.
- Prevention: when a source change appears to have no effect under the x5/DB
  lanes, check the import form first — root imports execute dist, subpath
  source aliases execute TypeScript. The same session also lost an uncommitted
  fixture repair to a `git checkout --` used to strip probes; instrumentation
  on files carrying uncommitted work must be removed by inverse edits, never
  by checkout.

## 2026-08-13 — Real-route tests need listener-free HTTP and explicit filter DI

- Symptom: the replacement Nest route suite first failed before collection on
  a startup helper TDZ, then both TCP and Unix-domain `app.listen` attempts
  failed with sandbox `EPERM`; after switching transport, guard errors became
  generic 500s because `PrivateResponseExceptionFilter` had an undefined
  dependency under the Vitest transform.
- Root cause: top-level AJV compilation ran before a `const` helper was
  initialized; the managed sandbox blocks all listener creation; and
  transform-time constructor metadata is not a reliable DI contract.
- What was tried: a normal loopback listener and then a writable temporary
  Unix-domain socket. Both listener forms were denied before any route
  assertion. Provider overrides alone did not repair class-scoped filter
  construction selected by `@UseFilters`.
- Fix: hoist the startup helper as a function declaration, inject Node HTTP
  request/response objects into the mounted Express adapter with
  `light-my-request`, and add explicit `@Inject` tokens to the private and safe
  filter constructors.
- Prevention: real-route tests in restricted environments should use the
  listener-free HTTP injector from the outset, and Nest cross-cutting classes
  must not rely solely on emitted constructor metadata.

## 2026-08-13 — Global exception-filter hosts do not retain controller identity

- Symptom: an initial N9 repair attempted to scope private response headers by
  calling `getClass()` on the host received by the existing global exception
  filter.
- Root cause: Nest's router proxy constructs the exception-filter
  `ExecutionContextHost` with request/response/next only; its controller
  reference is `null`, and the public `ArgumentsHost` contract does not expose
  `getClass()`.
- What was tried: a typed optional `getClass()` capability check. This compiled
  after narrowing but could not provide a reliable runtime controller match.
- Fix: register a dedicated `PrivateResponseExceptionFilter` with `@UseFilters`
  on the exact private controllers and delegate safe serialization to the
  existing filter. Controller scope is selected when Nest builds the route's
  exception-filter chain, before the guard can throw.
- Prevention: for guard-error behavior, pin controller-scoped filter metadata
  and providers; do not infer route ownership from a global filter host.
## 2026-08-14 — A frozen media access shape could imply an unmounted stream

- Symptom: the first W3 draft could return a ready owner-relative stream path,
  but no private media stream controller existed.
- Root cause: freezing the access contract and implementing an executable P0
  runtime were treated as the same delivery milestone.
- Attempted approach: documenting the path as future work was insufficient
  because enabling the common flag could still return an unusable ready result.
- Fix: reserve the path namespace in the contract, explicitly record
  `reserved_not_mounted_p0`, and force runtime media access to
  `content_unavailable` after current-authority resolution.
- Prevention: every ready capability must have an executable downstream ingress;
  otherwise keep the shape frozen but the runtime outcome unavailable.

## 2026-08-14 — P0 text send briefly admitted a class-group second track

- Symptom: the contract narrative said teacher-only text, while schema, API
  types and Mobile requests still allowed `class_group`.
- Root cause: the shared read-segment type was reused at the narrower command
  boundary.
- Attempted approach: relying on the owner to return unsupported was rejected;
  it leaves an advertised action that P0 never supports.
- Fix: narrow owner schema/parser, strict source, public validation/client and
  Mobile composition to `teachers`; add negative class-group fixtures/tests.
- Prevention: derive read and command admissibility separately even when they
  share display segment names.

## 2026-08-14 — Workspace root exports bypassed built runtime modules

- Symptom: the scenario-service compiled, but its smoke process exited before
  health because `@the-nurture/db` resolved `src/index.ts`, whose ESM `.js`
  imports do not exist beside TypeScript sources.
- Root cause: root package exports were source-only while subpath exports
  already separated `types` from runtime `import` targets.
- Fix: route both scenario and DB root `types` to `src/index.ts` and runtime
  imports to `dist/index.js`; extend smoke to the new default-off owner route.
- Prevention: package build acceptance must execute the compiled entry, not
  stop at TypeScript emit.

## 2026-08-14 — Cross-repo closure was documented before the last Mobile DTO closed

- Symptom: this task's earlier class-group pitfall said Mobile had been narrowed
  to `teachers`, but the landed My-Chat model constructor and positive unit
  fixture still accepted the shared read union. Runtime UI happened to block
  the path, so ordinary behavior tests did not expose the semantic drift.
- Root cause: provider-side schema/API closure was treated as proof of the final
  consumer command type, and the task document was updated before a field-by-
  field consumer census.
- What was tried: keeping the prior record unchanged as sufficient historical
  evidence was rejected because it would leave a false closed-loop claim.
- Fix: My-Chat narrowed and runtime-guarded its Mobile DTO/constructor/Composer;
  Nurture rechecked the exact pin and recorded this correction append-only.
- Prevention: do not mark a cross-repo restriction resolved until provider
  schema, provider parser, consumer source, public API/client and final UI
  command constructor have all been compared independently.

## 2026-08-14 — Published contract validator was not part of a maintained gate

- Symptom: the W3 validator passed when invoked by its deep path, but no named
  package command or formal ingress gate guaranteed it would run again.
- Root cause: publication evidence and repeatable repository verification were
  treated as separate concerns.
- What was tried: invoking the `.mjs` with plain `node` after adding the script
  failed because its canonicalizer imports TypeScript syntax unsupported by
  Node 25 strip-only mode.
- Fix: add a named `tsx` validator command and chain it into
  `verify:formal-ingress-contract`; retain one canonical JSON implementation.
- Prevention: every published owner artifact validator must be reachable from
  a maintained top-level gate with its actual runtime declared.

## 2026-08-14 — Raw Prisma dates need an explicit UTC convention

- Symptom: valid family-growth authorizations were reported unavailable and
  Enrollment Journey workflow updates failed their monotonicity trigger when
  PostgreSQL ran in `Asia/Shanghai`.
- Root cause: Prisma raw `Date` parameters are `timestamptz`, while canonical
  columns are UTC-convention `timestamp without time zone`; one raw update also
  wrote local-wall-clock `CURRENT_TIMESTAMP`. PostgreSQL compared different
  wall-clock interpretations.
- Fix: convert raw parameters and transaction timestamps explicitly with
  `AT TIME ZONE 'UTC'`. The same audit renamed the PostgreSQL 17 reserved alias
  `authorization` to `authz` and updated its shape assertion.
- Prevention: raw SQL crossing `DateTime` fields must state its timezone and be
  exercised under a non-UTC session in the full database lane.

## 2026-08-14 — Workspace idempotency is not actor idempotency

- Symptom: the generic command ledger keys a replay by workspace and command
  id; without an actor value in the canonical payload, another authorized
  guardian who knew the tuple could receive the first guardian's replay before
  confirmation ownership was checked.
- Root cause: replay short-circuits before operation preconditions by design.
- Fix: bind the parent-communication command payload to an actor-scoped HMAC;
  keep the external response free of raw participant ids and retain exact
  same-actor replay after thread-head movement.
- Prevention: every command built on a broader idempotency namespace must bind
  the narrower actor/scope in its canonical payload and carry a negative
  cross-actor replay test.

## 2026-08-14 — Source aliases covered subpaths but not package roots

- Symptom: the focused W4 scenario-service test could not resolve root imports
  for `@the-nurture/scenario` and `@the-nurture/db` without first building the
  workspace packages.
- Root cause: Vitest source aliases covered their subpaths but omitted the exact
  package-root specifiers used by the production controller composition.
- Fix: add exact root aliases after the existing subpath aliases so source tests
  resolve TypeScript while built runtime exports remain unchanged.
- Prevention: when a workspace exposes both root and subpath exports, test the
  exact production import forms in a clean source-only runner.

## 2026-08-15 — Root verification assumes the main-checkout sibling layout

- Symptom: `pnpm typecheck` stopped before local compilation because its
  pinned workflow-contract build resolves `../My-Chat`, which does not exist
  beside an isolated `.claude/worktrees/<id>` checkout. A subsequent external
  absolute path could read My-Chat but could not emit there under the worktree
  sandbox.
- Root cause: repository scripts and pnpm link dependencies encode the main
  checkout's sibling topology, while Codex worktrees are four levels deeper
  and have write permission only inside the Nurture worktree and temp space.
- What was tried: an offline pnpm relink was rejected because the local store
  lacked several tarballs; the unchanged locked dependency tree was restored
  from the main checkout's installed modules.
- Fix: point the build step temporarily at the pinned sibling source, redirect
  TypeScript output to `/private/tmp`, and restore `package.json` before the
  final diff. Package-local My-Chat links were resolved to that same checkout
  only in ignored `node_modules`.
- Prevention: in isolated worktrees, validate sibling paths before running
  root scripts. Keep any topology workaround temporary and verify that package
  manifests, lockfiles and scripts are unchanged before committing.

## 2026-08-15 — Scenario-service test census lagged W6 test additions

- Symptom: `pnpm verify:test-routing` reported `scenarioService=29/27` after
  the new joint HTTP test was added.
- Root cause: the earlier W6 runtime-secret test had increased the maintained
  scenario-service lane without advancing its expected census; the joint test
  exposed both increments together.
- What was tried: first confirmed all 29 files were classified into the
  intended scenario-service lane and that no file belonged in DB or X5.
- Fix: advance the maintained scenario-service census to 29 and rerun the
  routing gate.
- Prevention: every added or removed `*.test.ts` file must update and run
  `verify:test-routing` in the same verified work unit.

## 2026-08-15 — Current-main preparation moved without resealing cross-repo pins

- Symptom: the workflow-contract and C30 upstream gates still expected My-Chat
  `99be59c` after the already-committed W6 gray preparation had advanced its
  main checkout.
- Root cause: the prior current-main preparation commit did not finish the
  repository's two-phase pin apply and owner-lock remint workflow.
- What was tried: first ran every pin verifier independently to distinguish an
  exact revision mismatch from an actual workflow-runtime contract change.
- Fix: use `pnpm reseal:pins apply` against the clean committed My-Chat head,
  commit the managed pins/literals, then run `pnpm reseal:pins lock` and commit
  the regenerated owner-adoption lock.
- Prevention: treat the three cross-repository pin checks and the two-phase
  reseal as part of every current-main release-preparation work unit, before
  publication.
