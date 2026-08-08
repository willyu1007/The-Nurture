# C30-I1-D1 Domain Action Core Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: ordered C30-I1-D implementation through closure
- Result: `I1_D1_IMPLEMENTED_LOCALLY_VERIFIED`
- Base commit: `57c0be0cab63662e471cfcd25864ff7a3f3e4cda`
- Source lock: intentionally deferred to I1-D5

D1 adds only the Base-neutral domain-action core: the two static driver literals,
the action contract, a content-free Workflow Step reference, and the exact claimed
Step assertion. It does not add prepare/submit, execution results, binding/recovery,
runtime behavior or a manifest declaration.

## Contract and verification

| Check | Result | Evidence |
| --- | --- | --- |
| Neutral contract | PASS | Driver values are exactly `scenario_direct_empty_v1|workflow_claimed_step_v1`; neutral fixtures contain no Nurture registry value. |
| Step boundary | PASS | Step refs/assertions are content-free and closed; token, target, body, claim and business authority fields are rejected. |
| Schema/codec parity | PASS | Three new Schemas and 12 D1 Node tests pass; the cumulative population reaches 39 Schemas and 232 Node tests. |
| Type/regression boundary | PASS | Contract typecheck plus unchanged runtime 28/28 and Scenario 10/10 populations pass outside the intentionally stale source-lock gate. |
| Effect boundary | PASS | No prepare/submit, result/recovery, runtime, consumer, manifest, database, deployment, capability or activation change. |

The existing I1-C source lock was intentionally left stale. D5 owns the one exact
cumulative reseal after D1-D4 stabilize.

## Rollback and successor

Rollback this checkpoint by reverting `57c0be0…`; no runtime or database
compensation exists. D2 is the next ordered checkpoint and consumes this exact
contract without changing the static driver.
