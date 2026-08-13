# Pitfalls

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
