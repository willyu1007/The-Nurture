# C30-I1-D4 Claimed-Step Binding and Recovery Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: ordered C30-I1-D implementation through closure
- Result: `I1_D4_IMPLEMENTED_LOCALLY_VERIFIED`
- Base commit: `6fc07bd4abef1146604a189db053b6ed9cd93d6a`
- Parent: `818b9838c14d68f78f6a5439c8306f70bfdce8ed`
- Source lock: intentionally deferred to I1-D5

D4 adds immutable Step bind/rebind, body-free binding lookup and the transient
claimed-driver input/result. Contextual assertions bind operation, action,
Workspace, scenario, submit context, command, request correlation and the original
Step across the full wire.

## Contract and verification

| Check | Result | Evidence |
| --- | --- | --- |
| Immutable binding | PASS | Exact replay may reuse the same Step/binding; wrong Step, action, driver, command or operation fails. |
| Crash-window recovery | PASS | Lookup supports absent, bound and unavailable outcomes without minting or transferring an effect seed. |
| Expiry and replay | PASS | Submit-context expiry is enforced; a different Step cannot acquire the original Step's seed. |
| Schema/codec parity | PASS | Five new Schemas and 15 D4 Node tests pass; cumulative population reaches 55 Schemas and 289 Node tests. |
| Pre-commit audit | PASS | Cross-binding for `client_mutation_id` and `request_correlation_hash` was repaired before the D4 commit. |

The later D5 review confirmed that an unavailable lookup remains a valid
fail-closed outcome even when stored binding evidence is present. Artifact 33
records that repair and the final acceptance.

## Rollback and successor

Rollback D4 before D3/D2/D1. D5 is qualification and source-lock work only; it
must add no new wire or runtime behavior.
