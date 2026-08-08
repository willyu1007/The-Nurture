# C30-I1-D3 Effect Identity and Result Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: ordered C30-I1-D implementation through closure
- Result: `I1_D3_IMPLEMENTED_LOCALLY_VERIFIED`
- Base commit: `818b9838c14d68f78f6a5439c8306f70bfdce8ed`
- Parent: `9a357574a5162f827a15c0d2a50af6fa695e1bef`
- Source lock: intentionally deferred to I1-D5

D3 adds the two server-only effect-identity input branches, immutable payload and
execution binding evidence, the private execution result, and the public
progress/current-result shell. Both identity branches explicitly include
`scenario_key`; client and attempt evidence cannot become effect identity.

## Contract and verification

| Check | Result | Evidence |
| --- | --- | --- |
| Identity symmetry | PASS | Direct identity binds Workspace/scenario/action/submit context; claimed identity binds Workspace/scenario/action/original Step. |
| Result layering | PASS | Business outcome, invocation disposition, current result and Host progress use distinct closed vocabularies. |
| Exposure boundary | PASS | Public submit output contains no execution, effect, command, Step, snapshot or owner refs. |
| Schema/codec parity | PASS | Five new Schemas and 27 D3 Node tests pass; cumulative population reaches 50 Schemas and 274 Node tests. |
| Deferred seal | EXPECTED / I1-D5 | Source lock remains intentionally stale until D4 and cumulative review complete. |

The later D5 review tightened exact replay so both the original and replayed
execution result must be committed. Artifact 33 records the repair and accepted
source.

## Rollback and successor

Rollback D3 before D2/D1. D4 is the next ordered checkpoint; no runtime execution,
database persistence, consumer or manifest adoption is introduced here.
