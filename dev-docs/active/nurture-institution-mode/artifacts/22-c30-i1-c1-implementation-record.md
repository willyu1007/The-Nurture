# C30-I1-C1 Safe-Copy and Locator Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: complete ordered I1-C implementation
- Result: `I1_C1_IMPLEMENTED / LOCALLY_VERIFIED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_C2_NEXT`
- Downstream: `I1_D_BLOCKED / C30_I2_NO_GO / ACTIVATION_NO_GO`

## Exact source checkpoint

| Repository | Branch | Commit | Worktree state |
| --- | --- | --- | --- |
| My-Workflow-Base | `codex/T-002-c30-i0-base` | `64533a66d2b95c9b31ff317920515962a0d3cb32` | Clean after commit |

The commit subject is `feat(contracts): add presentation primitives`. The source
lock remains the accepted I1-B lock `9a15865…`; I1-C4 deliberately owns the final
cumulative refresh after C1-C3 source stabilizes.

## Implemented surface

- `ScenarioSafeTextV1`, `ScenarioSafeLabelV1` and `ScenarioSafeReasonV1`;
- the five generic tones, two narration policies and four retry classes;
- opaque subject-context, presentation-item and action-target locator types;
- cursor and continuation-ref validation slots;
- normalized canonical locale/plain-text checks, copy exposure negatives and exact
  label/message/help bounds;
- two strict JSON Schemas, typed/JSON neutral fixtures, package exports and
  conformance tests.

Locators accept only 32-512 character base64url-shaped opaque values. They reject
canonical-ref objects and id-shaped colon strings. The codec does not decode hidden
expiry claims: later issuing/resolving owners enforce the frozen five- or
thirty-minute lifetime.

## Verification

| Check | Result |
| --- | --- |
| Full Base typecheck | PASS |
| Contract build | PASS |
| Runtime / Scenario tests | 28/28 and 10/10 PASS |
| Schema package | 25 Schemas compile |
| Node tests | 129 PASS |
| Canonical-ref / consumer / doc / semantic checks | PASS |
| Source-lock portability | EXPECTED FAIL against stale I1-B lock; deferred to I1-C4 |
| Diff and secret scan | PASS |
| Nurture governance/context/docs | Checksum `19924622…34fe`; strict checks and 418-file lint PASS |

The first typecheck exposed TS2775 on an inferred internal assertion helper. The
fix gives the helper an explicit assertion signature. Strict Ajv then exposed
missing nested `object`/`string` annotations in the help-length overlay. Adding the
annotations closed strict compilation without changing accepted wire data or
weakening a validator. These prevention rules are recorded in `05-pitfalls.md`.

## Boundaries and rollback

No provider/result union, semantic block, navigation/action offer, narration
projection, runtime, registry, renderer, consumer, database, capability, deployment
or activation was added. Revert Base commit `64533a6…` to roll back C1; there is no
database or consumer compensation.

## Next unit

Proceed only to I1-C2 list/resolve subject-context provider contracts. C3 and C4
remain ordered after C2; I1-D and C30-I2 remain blocked.
