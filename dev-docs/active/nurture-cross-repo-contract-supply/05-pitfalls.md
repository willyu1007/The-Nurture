# Pitfalls

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
