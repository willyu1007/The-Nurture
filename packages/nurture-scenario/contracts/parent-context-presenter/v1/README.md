# Parent-context presenter owner contract v1

This directory is the standalone, default-off publication of
`nurture.parent-context-presenter@1.0.0`. It composes the existing
`nurture.surface-contract@1.20.0` baseline without changing that surface
artifact. The scenario service mounts the five private routes behind
`NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED`; absent enablement, service auth or
complete Q6/async-boundary owner ports returns `503` before composition.

The canonical digest scope is exactly
`parent-context-presenter.owner-contract.json`, parsed as strict JSON and
serialized with the repository's RFC 8785 canonicalizer before SHA-256. The
conformance fixtures carry the resulting exact pin but are outside the digest
scope so joint consumers can add execution evidence without changing the
owner interface.

Run the contract and fixture validator from the repository root:

```bash
pnpm verify:parent-context-presenter-contract
```

A pass verifies the computed digest, all five strict request/response schema
pairs, the discriminated notice-exchange matrix, owner-resolution input
exclusions, positive and negative operation coverage, eight executed
expected-invalid fixtures, the required fail-closed scenarios,
operation-specific consistency, full five-field notice confirmation binding,
reason-code admission and foreign-field rejection probes.

The focused scenario-service conformance suite builds a real Nest testing
module and injects Node HTTP requests through all mounted routes. It covers the
private response filter, service authentication, Q6 owner resolution, all six
masking classes, full confirmation binding, invalid notice status pairing,
published-response rejection, replay and application ASYNC-12 rejection:

```bash
pnpm --dir apps/scenario-service exec vitest run -c vitest.config.ts tests/parent-context-presenter-controller.e2e.test.ts
```

The production owner composition is qualified against canonical PostgreSQL
rows. My-Chat sends its separately pinned binding-only selection carrier; the
provider resolves those opaque anchors to one current association and reads the
Nurture-owned current Enrollment selection. It then rereads the exact selection,
anchor, guardian, enrollment, grant and thread heads for every operation,
projects shared daily-care and attendance facts, and commits notice-read
confirmation through the generic command ledger transaction:

```bash
node scripts/run-with-local-env.mjs pnpm exec vitest run -c vitest.db.config.ts packages/nurture-db/tests/t011-parent-context-presenter.integration.test.ts
```

The local selection schema/migration backfills only unambiguous current rows;
missing or changed selection masks. The opaque My-Chat `context_ref` and
binding refs are routing evidence, never Nurture authorization or shared
database identifiers. This remains default-off provider evidence. The exact-
pin My-Chat consumer is adopted, but no shared migration, deployment activation
or traffic is claimed here.
