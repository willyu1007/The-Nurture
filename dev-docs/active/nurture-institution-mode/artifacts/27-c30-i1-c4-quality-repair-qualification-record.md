# C30-I1-C4 Quality Repair Qualification and Source-Lock Record

> This remains the accepted I1-C evidence. Its original “I1-D ready” next-state
> handoff was consumed by artifacts 28-33, which later accepted I1-D.

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every I1-C quality-review finding and requalify I1-C
- Result: `I1_C_ACCEPTED / I1_C4_QUALITY_REPAIR_COMPLETE`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_I1_B_I1_C_ACCEPTED`
- Next state: `I1_D_READY_NOT_STARTED / SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `C30_I2_NO_GO / ACTIVATION_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

All six frozen findings are closed. Five executable gaps are repaired in neutral
Base source; the semantic-copy overclaim is corrected by making locale/domain-aware
diagnostic, prescriptive and Anti-Metric policy an executable Scenario-owner gate
before later consumer adoption. No product consumer or runtime was added.

## Exact successor chain

| Role | Commit | Binding | Worktree state |
| --- | --- | --- | --- |
| Quality-scope reopening | Nurture `d793fcfffe23d922963b6296df552b0b084d9f8b` | Artifact 26 freezes R1-R6 before source work. | Clean after commit |
| Base source repair | `ae0c35709f0798abb7b0a2a365805b76ba9f5cd4` | Parent = prior lock `9d168105…`; eight scoped files. | Exact sealed source |
| Base successor lock | `3c30337eabe012eb936e91eec5c9d421463e67c7` | Parent and `contract_source_revision` = `ae0c357…`. | Metadata-only, clean |
| My-Chat negative pin | `dc4a77b257f952e2c0f0aede9521e16ac274de9d` | No diff, adoption or consumer source. | Clean |

The successor source lock records 18 normalized TypeScript files and
`source_hash = fc35c6b8aec9e7d7c01a336884f49e4f0821626d72846449e2b186a6102e5cf3`.

## Finding closure

| ID | Closure |
| --- | --- |
| `R1` | TypeScript and JSON Schema reject generic URI schemes, network-path locators, bare domains, email-like addresses and IPv4 address forms. The original five bypass probes and added single-label/IPv4 cases fail; ordinary `Note: ...` prose still passes. |
| `R2` | Explicitly clocked option/list/resolve active assertions reject not-yet-issued, expired and future-resolved output. Structural assertions remain deterministic and wall-clock-free; fail-closed unavailable results qualify without locator extension. |
| `R3` | Artifact 21 now states the enforceable boundary: Base owns structural safe-copy and explicit forbidden metric keys; each Scenario owner must qualify localized disclosure/Anti-Metric semantics before adoption. Base does not add brittle English medical parsing. |
| `R4` | `Intl.getCanonicalLocales` failures map to stable `invalid_locale`; `en-abcde-abcde` no longer escapes as `RangeError`. |
| `R5` | Default 10 and maximum 20 are exported constants; a validating resolver applies omission as 10; both request Schemas carry `default: 10`. |
| `R6` | Every `item_key` and `entry_key` shares one presentation-response namespace; cross-block and cross-kind duplicates fail in the codec. |

## Qualification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Full verifier | PASS x3 | `pnpm verify:workflow-contracts` passes twice before and once after the successor lock commit. |
| Typecheck/build | PASS | Contracts, runtime, Scenario example and conformance typechecks pass; the contract package builds. |
| Runtime/Scenario tests | PASS | Runtime 28/28 and Scenario example 10/10. |
| Schema/conformance | PASS | 36 strict Ajv Schemas compile; 220 Node tests pass. |
| Source identity/portability | PASS | Exact revision/byte comparison, alternate host path/import alias, BOM/CRLF normalization and unexpected-alias negative pass at `fc35c6b…e5cf3`. |
| Consumer/exposure boundary | PASS | Actual consumer scan, self-test, canonical-ref, claim-token, semantic and documentation alignment checks pass. |
| Deterministic build | PASS | Two isolated 68-file builds produce `3770474a427ee909bb37eac4d821b1e5d5ef38529dd11f3b232eca29c13c0dbf`. |
| Deterministic manifest | PASS | Two source-manifest outputs produce `35861319c09c6cc70d9f94fd66b6bf98b3cb7b85f28ad9cf9a80bb7d84ce925d`. |
| Output hygiene | PASS | Isolated build/manifest directories were destroyed; tracked generated output is absent; the lock commit changes one JSON file. |
| Context/governance/docs | PASS | Context checksum `6e77aab9f6482b805163d5682bf3831eb3328ecec3f2341408747602bafeca52`; strict Context/governance checks and 423-file document/anchor lint pass. |

## Unchanged boundaries

- no Base runtime/provider, product registry value, package version or dependency;
- no My-Chat/Nurture consumer, renderer, presenter, manifest/module or product source;
- no Prisma/schema/migration, database, capability, deployment, activation or traffic;
- no I1-D, I1-E, I1-F, C30-I2, T-008 or Pilot work.

## Rollback and next gate

Rollback the successor by reverting lock `3c30337…` before source `ae0c357…`.
That restores the prior historical I1-C chain but does not silently restore its
superseded qualification claim; governance evidence must be reviewed again.

I1-C is reaccepted. A later I1-D scope review/freeze requires separate explicit
authorization and cannot infer product adoption, activation, deployment or traffic.
