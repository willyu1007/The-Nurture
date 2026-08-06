# C30-I1-E1 Protected Carrier Implementation Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: complete ordered C30-I1-E implementation through closure
- Result: `I1_E1_IMPLEMENTED_LOCALLY_VERIFIED`
- Base commit: `75715538e5f320ea8722b76b436f1f4a6feb0b05`
- Source lock: intentionally deferred to I1-E5
- Current acceptance: hardened and superseded by exact source `5433124…` in artifact 41

E1 adds only the Base-neutral static protected-interaction contract, opaque
protected-content reference alias, dedicated `ScenarioProtectedPlainTextCarrierV1`
and request/direction/field-scoped keyed carrier binding. The carrier remains
separate from every generic control and durable Host shape.

## Contract and verification

| Check | Result | Evidence |
| --- | --- | --- |
| Carrier boundary | PASS | Plaintext is admitted only by the dedicated carrier; attachments are exactly empty and generic control fixtures reject body-like copies. |
| Initial content bounds | PASS | The checkpoint enforces 1–2000 Unicode code points, no residual CR/NUL, 8 KiB UTF-8 and 12 KiB carrier JSON limits. |
| Final normalization ownership | PASS in artifact 41 | Exact source `5433124…` removes the Base transformer and validates already-normalized LF text without trim, CRLF or Unicode rewriting. |
| Binding shape | PASS | Closed request/response carrier scopes, field key and lowercase keyed binding hash are joined to the neutral static scenario/action contract; exact request-context provenance is a later artifact-41 hardening. |
| Schema/codec parity | PASS | Three new Schemas, neutral fixtures and the focused E1 adversarial suite pass. |
| Regression boundary | PASS | Contract typecheck/build plus unchanged runtime and Scenario populations pass outside the intentionally stale source-lock gate. |
| Effect boundary | PASS | No prepare/read lifecycle, runtime, consumer, manifest, dependency, database, capability or activation change. |

Rollback by reverting `7571553…`; no runtime or database compensation exists.
E2 consumes this exact carrier/control separation.
