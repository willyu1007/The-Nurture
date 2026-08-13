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
