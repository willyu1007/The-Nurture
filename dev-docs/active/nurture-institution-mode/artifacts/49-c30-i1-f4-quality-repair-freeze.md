# C30-I1-F4 Successor Quality Repair Freeze

## Decision

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every finding from the post-I1-F quality review
- Prior accepted Base chain: source `3d91591eb506de2c2c6c6633536c5b43d07c2af9`,
  metadata lock `afe47e8a529a52b38bd07053e55f625cdb16c194`
- State: `I1_F_ACCEPTANCE_REOPENED / SUCCESSOR_REPAIR_AUTHORIZED`
- Downstream: `C30_I2_NO_GO / CONSUMER_ADOPTION_NO_GO /
  CAPABILITY_ACTIVATION_NO_GO / T_008_NO_GO / PILOT_NO_GO`

The prior F1-F4 commits remain immutable historical checkpoints, but artifact 48
is no longer current acceptance evidence. A successor Base source plus a new
metadata-only source lock is required before I1-F can be reaccepted.

## Reproduced findings

| Finding | Severity | Reproduction | Required correction |
| --- | --- | --- | --- |
| `F-R1 multi-action handler contradiction` | P1 | A second action with a distinct handler fails `missing_domain_action_handler`; sharing the prepare handler fails `duplicate_scenario_handler`. | Separate the one transport `prepare_domain_action` handler from unique per-action business handlers. Preserve exact prepare-operation and entitled-ingress binding. |
| `F-R2 presentation ingress not operation-local` | P1 | A product surface may resolve a presentation while appearing only on another trusted operation; the manifest still validates although `present_subject_context` cannot be invoked from that surface. | Resolve each product surface through its presentation's exact trusted operation and require the same surface key in that operation's `product_surface` ingress set. |
| `F-R3 unbounded declaration arrays` | P2 | JSON Schema and the runtime assertion both accept 10,000 `safe_reason_codes` and 10,000 `route_classes`. | Freeze and enforce `safe_reason_codes <= 64`, `route_classes <= 64`, and `action_keys <= 128` in runtime and JSON Schema. |
| `F-R4 ancestor symlink acceptance` | P2 | Existing workspace-root symlinks supplied through source-hash root overrides reproduce the trusted aggregate and four named hashes. | Reject a symlink in any physical-root or file ancestor segment, not only a symlink leaf. |

## Frozen repair semantics

### F-R1 — action versus transport handler

- `trusted_invocation.operations[].handler_key` identifies the transport operation
  handler.
- `domain_action_contracts[].handler_key` identifies the Scenario-owned business
  action handler.
- The two keys MUST be distinct declarations; every action handler MUST be unique
  across the complete Scenario declaration handler namespace.
- Every action still requires the exact `prepare_domain_action` operation, and every
  entitled ingress still resolves within that operation.
- The module no-alias validator MUST include action handlers directly rather than
  relying on their former accidental equality with the prepare handler.
- A neutral manifest with two actions and two unique handlers MUST pass. A shared or
  cross-kind handler collision MUST fail.

### F-R2 — operation-local presentation reachability

- A product surface still resolves one exact presentation.
- That presentation's `operation_key` remains `present_subject_context`.
- The product surface key MUST be a `product_surface` ingress key on the exact
  presentation operation; presence on list, resolve, action, read or another
  operation cannot substitute.
- The existing reverse rule remains: every declared product ingress key resolves a
  product-surface declaration.

### F-R3 — explicit bounds

| Array | Maximum |
| --- | ---: |
| `semantic_presentations[].safe_reason_codes` | 64 |
| `product_surfaces[].route_classes` | 64 |
| `product_surfaces[].action_keys` | 128 |

Runtime and JSON Schema MUST agree at the maximum and reject maximum plus one.
These limits do not change key grammar, ordering, uniqueness or the outer
provider/presentation/surface/action population bounds.

### F-R4 — symlink path ancestry

- Every configured physical root MUST be an existing regular directory reached
  without a symbolic-link path segment.
- Every explicit profile file MUST be a regular file reached without a symbolic-link
  path segment.
- Existing logical-path, relocation, import-alias, BOM/CRLF and committed-byte
  behavior remains unchanged.
- Portability conformance MUST include a symlink-root negative and verify rejection
  is caused by the symbolic-link rule.

## Planned source and evidence impact

Base changes are limited to:

- `scenario-release.ts` and the manifest JSON Schema;
- F2/F3 manifest fixtures and focused tests;
- `validate-module.ts` and its tests for direct action-handler no-alias coverage;
- source-hash computation and portability conformance;
- the mechanically aligned validator rule documentation if required;
- one successor source commit followed by one metadata-only lock commit.

No public I1-A..E wire field, driver, operation name, source identity or capability
dependency set changes. No Scenario starter, Base dispatch, My-Chat/Nurture
consumer, package version, Prisma/schema/migration, database, environment, secret,
KMS, deployment, capability/Workspace activation, T-008, Pilot or traffic action is
in scope.

## Acceptance

1. Two-action and operation-local presentation adversarial tests close F-R1/F-R2.
2. Runtime/Schema parity accepts each frozen limit and rejects limit plus one.
3. Root/ancestor symlink overrides fail while relocation, alias and line-ending
   portability remain green.
4. Full Base verification passes repeatedly; deterministic builds/manifests remain
   byte-identical.
5. Source is committed before one metadata-only exact lock; all changed source,
   Schema and source-lock scripts are present in the locked revision.
6. Three repositories finish clean and all downstream/effect boundaries remain
   false, empty or untouched.

## Rollback and next gate

Rollback removes the successor metadata lock before the successor source commit.
No runtime or operational compensation exists. Only a successful successor
qualification can restore
`C30_I1_BASE_CONTRACTS_ACCEPTED / C30_I2_SEPARATE_AUTHORIZATION_REQUIRED`.
