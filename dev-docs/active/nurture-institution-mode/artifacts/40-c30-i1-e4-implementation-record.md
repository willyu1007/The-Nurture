# C30-I1-E4 Protected Detail Read Implementation Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: complete ordered C30-I1-E implementation through closure
- Result: `I1_E4_IMPLEMENTED_LOCALLY_VERIFIED`
- Base commit: `7506eb796a7c38963ae7dd33a4ba308d5379bb25`
- Parent: `4b23c79e6558d5d93e201b53e1a12b005e3fd67d`
- Source lock: intentionally deferred to I1-E5
- Current acceptance: hardened and superseded by exact source `5433124…` in artifact 41

E4 adds the opaque read locator, body-free read input, at-most-60-second no-store
display lease and the `ready|tombstone|context_changed|unavailable` result family.
A ready result requires exactly one separately transported carrier and foreground
verification; the later artifact-41 source makes each failure arm exact and binds
the full current foreground request context. Every non-ready branch remains
body-free.

## Contract and verification

| Check | Result | Evidence |
| --- | --- | --- |
| Locator non-authority | PASS | The locator is bounded to five minutes and requires foreground verification; exact request/Workspace/principal/surface/scenario/action provenance is closed in artifact 41. |
| Result closure | PASS | All four branches are distinct; only `ready` admits one carrier plus display lease, and safe failures expose no carrier or decrypted evidence. |
| Freshness/cache boundary | PASS | Lease exceeds neither 60 seconds nor current context; stale, cache and offline fallback are rejected. |
| Cumulative no-copy scan | PASS | High-entropy text/ref/version/integrity sentinels, escaped/base64/fragment forms and protected body keys are scanned across every generic Base fixture. |
| Schema/codec parity | PASS | Four new Schemas, neutral fixtures and the focused E4 lifecycle/adversarial suite pass. |
| Effect boundary | PASS | No generic erase/tombstone write, protected AI, runtime, consumer, manifest, database, capability or activation change. |

Rollback by reverting `7506eb7…` before E3/E2/E1. E5 adds no wire and owns the
cumulative review, deterministic qualification and source-lock seal.
