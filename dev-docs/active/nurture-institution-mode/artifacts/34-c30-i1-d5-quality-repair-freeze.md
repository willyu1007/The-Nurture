# C30-I1-D5 Successor Quality Repair Scope Freeze

## Decision

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every finding from the I1-D implementation quality review
- State: `I1_D_ACCEPTANCE_REOPENED / I1_D5_SUCCESSOR_REPAIR_FROZEN`
- Downstream: `I1_E_NO_GO / I1_F_NO_GO / CONSUMER_ADOPTION_NO_GO / ACTIVATION_NO_GO`

The `52c0dc2…` source and `c179bb5…` metadata lock remain historical evidence,
but artifact 33 no longer qualifies current I1-D acceptance. Independent probes
found five contract-composition gaps that the green Schema, codec and conformance
populations did not exercise. This amendment freezes their repair before changing
Base source and does not expand the original neutral I1-D surface.

## Frozen repair set

| ID | Finding | Required repair and falsification |
| --- | --- | --- |
| `D-R1` | Prepare-result JSON Schema branches are not independently closed, so mixed success/failure objects pass Schema validation while the codec rejects them. | Close both `oneOf` branches and add Schema/codec parity negatives for success plus failure-only fields and failure plus success-only fields. |
| `D-R2` | Submit validation proves token shape and principal/expiry only; it does not bind the echoed token or resolved scenario/action context. | Require the resolved submit token, scenario and action in the private validation context; reject altered token, scenario or action while retaining the public echo wire unchanged. |
| `D-R3` | Exact rebind trusts the new expiry/evidence context and can extend or replace an existing immutable binding seal. | Represent the stored assertion together with its evidence hash and expiry; exact replay must reproduce all three stored values and reject expiry extension or evidence substitution. |
| `D-R4` | Claimed-Step driver and execution-result assertions can pass separately while naming different original Steps. | Add one composed private assertion that joins action contract, claimed-Step assertion, driver, binding and execution result; reject any Step, workspace, scenario/action/handler or action-contract-hash mismatch and unpublished binding. |
| `D-R5` | Contextual bind validation applies success-only metadata before branching, so legitimate fail-closed `unavailable` and differing-request `request_conflict` outcomes cannot qualify. | Validate `unavailable` without fabricated binding metadata; accept `request_conflict` only when a stored assertion exists and differs, while rejecting unexpected conflict and any success-shaped result for a changed request. |

No public wire field, result variant, driver name, manifest dependency or product
value is authorized. The changes are limited to Schema branch closure and neutral
private validation context/helpers required to enforce already frozen semantics.

## Ordered repair and reseal

1. Apply D-R1 through D-R5 to Base assertions, Schema and conformance tests.
2. Commit the complete verified source repair as one reviewable Base source unit.
3. Run the cumulative verifier twice, build twice in isolated output directories,
   and compare byte-tree and source-manifest digests.
4. Refresh the exact source lock against the committed successor revision, commit
   only metadata, and run the cumulative verifier again.
5. Issue a successor qualification record and restore `I1_D_ACCEPTED` only if all
   adversarial negatives, regression populations, source identity and scope checks pass.

## Effect boundary

- Exact Base worktree only for neutral contracts, Schemas, fixtures, tests and the
  final metadata source lock.
- Nurture changes are governance/context evidence only; My-Chat remains byte-clean
  at `dc4a77b257f952e2c0f0aede9521e16ac274de9d`.
- No Prisma/schema/migration, database, runtime/provider/consumer, manifest/module,
  package dependency/version, deployment, capability, activation, T-008, Pilot or
  traffic operation.
- Manifest dependency/source convergence remains I1-F and cannot be folded into
  this repair.

## Exit

The repair exits only through a successor I1-D5 qualification/source-lock record.
Until then, I1-D acceptance is reopened, artifact 33 is superseded as current
qualification evidence, and I1-E/I1-F remain closed.
