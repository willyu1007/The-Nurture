# C30-I1-C3 Semantic-Presentation Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: complete ordered I1-C implementation
- Result: `I1_C3_IMPLEMENTED / LOCALLY_VERIFIED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_C4_NEXT`
- Downstream: `I1_D_BLOCKED / C30_I2_NO_GO / ACTIVATION_NO_GO`

## Exact source checkpoint

| Repository | Branch | Commit | Worktree state |
| --- | --- | --- | --- |
| My-Workflow-Base | `codex/T-002-c30-i0-base` | `13d207791d91b5efb168494af896c5f716d16c39` | Clean after commit |

The commit subject is `feat(contracts): add semantic presentation`. The source
lock remains the accepted I1-B lock `9a15865…`; I1-C4 owns the cumulative refresh
after this final I1-C wire source.

## Implemented surface

- exact `PresentScenarioSubjectContextInputV1` and closed four-state result;
- six flat semantic block kinds with exact branch fields and bounded row counts;
- read-only navigation offers and prepare-only available/unavailable action offers;
- bounded machine keys, opaque locators, canonical instants and 64 KiB UTF-8 output;
- duplicate response-local key and Anti-Metrics rejection;
- derived narration projection containing copied allowed safe text only;
- strict JSON Schemas, typed/JSON neutral fixtures and exposure negatives.

The exchange assertion binds `subject_context_ref` and `presentation_key` back to
the exact request. Action offers contain no raw target, Run target, server action,
params, command or submit authority. The narration projection strips every ref,
version, code and cursor and cannot mutate the original presentation.

## Verification

| Check | Result |
| --- | --- |
| Full Base typecheck | PASS |
| Contract build | PASS |
| Runtime / Scenario tests | 28/28 and 10/10 PASS |
| Schema package | 36 Schemas compile under strict Ajv |
| Node tests | 201 PASS |
| Canonical-ref / consumer / doc / semantic checks | PASS |
| Source-lock portability | EXPECTED FAIL against stale I1-B lock; deferred to I1-C4 |
| Diff and secret scan | PASS |
| Nurture governance/context/docs | Checksum `35f2808a…20dd`; strict checks and document/anchor lint PASS |

The initial typecheck found incomplete TypeScript narrowing for the combined
collection/timeline path. Splitting the terminal branch made every access explicit.
The new negative population then found that top-level Schema closure plus property
counts did not prevent another union branch's optional field from filling the same
slot. Exact branch-level `propertyNames` allowlists now protect block/action unions
and the affected C2 selection result. Strict Ajv also required a scalar type on the
nested Anti-Metric `not.pattern` constraint.

## Boundaries and rollback

No Base runtime/provider, My-Chat consumer/renderer, Nurture presenter/manifest,
database, capability, deployment or activation was added. Revert Base commit
`13d2077…` to roll back C3; C1/C2 remain independently usable and there is no
database or consumer compensation.

## Next unit

Proceed to authorized I1-C4 cumulative qualification, repeated deterministic build
and exact source-lock sealing only. I1-D, consumer adoption and C30-I2 remain blocked.

The later cumulative C4 review added only portable SafeText Schema/codec parity
repair `d14bf31…` before sealing; artifact 25 is the final accepted I1-C chain.
