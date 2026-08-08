# C30-I1-E5 Successor Quality Repair Scope Freeze

## Decision

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every finding from the I1-E implementation quality review
- State: `I1_E_ACCEPTANCE_REOPENED / I1_E5_SUCCESSOR_REPAIR_FROZEN`
- Downstream: `I1_F_NO_GO / C30_I2_NO_GO / CONSUMER_ADOPTION_NO_GO /
  ACTIVATION_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

The `5433124…` source and `3a08d1f…` metadata lock remain historical evidence,
but artifact 41 no longer qualifies current I1-E acceptance. Deterministic probes
found four validation/composition defects that the green 66-Schema and 371-test
population did not exercise. This amendment freezes their repair before changing
Base source and does not expand the original neutral I1-E wire surface.

## Frozen repair set

| ID | Finding | Required repair and falsification |
| --- | --- | --- |
| `E-R1` | The plaintext no-copy helper checks a whole candidate as a fragment, so a protected fragment wrapped in a longer control value passes. The same substring rule rejects ordinary controls when the carrier is a one-character value. | Detect exact raw/escaped/base64/base64url representations and every 16-code-point window of longer representations inside a control value. Values shorter than 16 code points use exact-representation comparison only. Prove a wrapped high-entropy fragment fails while a one-character carrier does not reject unrelated control text. |
| `E-R2` | Protected ref/version/integrity scanning checks only direct substrings. A base64url ref passes, while a one-character opaque version rejects unrelated strings containing that character. | Apply the same bounded representation/window scanner to refs, versions and integrity evidence. Prove encoded high-entropy refs fail and one-character prepared/committed versions remain valid unless copied as an exact representation. |
| `E-R3` | Commit composition rejects only `committed_at < prepared_at`; it accepts an owner transaction timestamp after the independently resolved submit `now`, including after submit-context expiry. | Require `prepared_at <= committed_at <= submit_context.now`. Retain the existing I1-D `now < submit_context_expires_at` rule and add future-time negatives for both direct and claimed drivers. |
| `E-R4` | Prepare-input JSON Schema matches only exact lowercase forbidden keys, while the runtime removes separators, folds ASCII case and rejects forbidden prefixes recursively. | Align Schema property-name rejection with the runtime normalization/prefix policy. Add recursive Schema/codec parity cases for case, separator and suffix variants such as `PlainText`, `body-count` and nested `protected.content.refMetadata`. |

The 16-code-point threshold is an explicit structural-scanner safety boundary,
not permission to copy short protected content. Arbitrary low-entropy substring
detection cannot distinguish a one-character secret from ordinary control text.
Separation by construction remains mandatory, exact short representations still
fail, and later My-Chat/Nurture/joint runtime leakage suites remain responsible for
logs, transport, browser state and semantic copies. This preserves artifact 36's
warning that Base structural scans are not runtime DLP evidence.

## Ordered repair and reseal

1. Apply E-R1 through E-R4 to the Base assertions, prepare Schema and E1-E4
   conformance tests.
2. Commit the complete verified source repair as one reviewable Base source unit.
3. Run the cumulative verifier repeatedly and compare deterministic build and
   source-manifest outputs under the already granted I1-E build authorization.
4. Refresh the exact source lock against the committed successor revision, commit
   only metadata, and run the cumulative verifier again.
5. Issue a successor qualification record and restore `I1_E_ACCEPTED` only if all
   adversarial negatives, regression populations, source identity and scope checks pass.

## Effect boundary

- Exact Base worktree only for neutral assertions, one existing Schema, tests and
  the final metadata source lock.
- Nurture changes are governance/context evidence only; My-Chat remains byte-clean
  at `dc4a77b257f952e2c0f0aede9521e16ac274de9d`.
- No public wire, type, result variant, driver, package version, manifest/module,
  source identity, runtime/provider/consumer or product vocabulary is added.
- No Prisma/schema/migration, database, secret/KMS, deployment, capability,
  activation, T-008, Pilot or traffic operation.
- Manifest dependency/source convergence remains I1-F and cannot be folded into
  this repair.

## Exit

The repair exits only through a successor I1-E5 qualification/source-lock record.
Until then, I1-E acceptance is reopened, artifact 41 is superseded as current
qualification evidence, and I1-F/C30-I2 remain closed.

## Successor qualification

Complete: artifact 43 records Base source `48fd3d6…`, metadata lock `9abde2b…`,
source hash `be6fd800…fb7d`, E-R1 through E-R4 closure and cumulative I1-E
reacceptance. Artifact 42 remains the immutable pre-source repair scope record.
