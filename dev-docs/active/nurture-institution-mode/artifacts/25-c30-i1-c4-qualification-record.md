# C30-I1-C4 Cumulative Qualification and Source-Lock Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: complete ordered I1-C implementation
- Result: `I1_C_ACCEPTED / I1_C1_C2_C3_C4_COMPLETE`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_I1_B_I1_C_ACCEPTED`
- Next state: `I1_D_READY_NOT_STARTED / SCOPE_REVIEW_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `C30_I2_NO_GO / ACTIVATION_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

I1-C now passes as one cumulative neutral Base contract slice. C4 adds no wire or
runtime behavior: it reviews the committed C1-C3 population, repairs one portable
Schema/codec exposure-parity gap, qualifies the final source and seals its exact
TypeScript manifest.

## Exact Base chain

| Role | Commit | Parent / binding | Worktree state |
| --- | --- | --- | --- |
| C1 primitives | `64533a66d2b95c9b31ff317920515962a0d3cb32` | I1-B lock `9a15865…` | Clean after commit |
| C2 provider | `600faee233490a4d3110b24594474dd7ff79eae5` | Parent `64533a6…` | Clean after commit |
| C3 presentation | `13d207791d91b5efb168494af896c5f716d16c39` | Parent `600faee…` | Clean after commit |
| C4 review repair | `d14bf31da957ed42e6ce0dfecc3299c42b7c6a51` | Parent `13d2077…` | Exact sealed source |
| C4 source lock | `9d168105ea8ccdf701c0b527764ede4de1f25a82` | Parent and `contract_source_revision` = `d14bf31…` | Clean after lock commit |

The review repair adds no field or variant. It aligns SafeText JSON Schema with the
existing TypeScript codec for case-insensitive URLs, single-line Markdown prefixes
and internal provider/database detail, with dual-layer negative fixtures.

The metadata lock records:

- `source_hash = 9e18ae68fb4541ab562ee8209edf497f58af0a09daa31783e5099ce8364609ae`;
- 18 normalized TypeScript files across `workflow-contracts` and
  `workflow-validator`;
- exact byte count and SHA-256 for every file;
- exact reachable Git source revision with byte equality for every current source.

## Cumulative contract closure

The accepted population covers owner-safe text/reasons and opaque locator slots;
distinct subject-context list/resolve semantics; all six flat semantic blocks;
closed ready/empty/context-changed/unavailable results; read-only navigation;
prepare-only action offers; strict bounds and expiry contracts; and a safe-text-only
AI narration projection. It rejects product identity, raw/canonical ids, protected
bodies, URLs/renderers, command/submit authority, mixed variants, Anti-Metrics,
over-bound data, duplicate local keys and request/result subject/key drift.

JSON Schemas own portable closed shape and exposure checks. Exported assertions
add cross-field lifetime, ordering/distinctness, request/result parity, Unicode
normalization and 64 KiB UTF-8 size checks. Owner registries still own locator
expiry/claims, disclosure semantics and registered action/provider availability.

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Full verifier | PASS x3 | `pnpm verify:workflow-contracts` passes twice before and once after the lock commit. |
| Typecheck/build | PASS | Contracts, runtime, Scenario example and conformance typechecks pass; contract build succeeds. |
| Runtime/Scenario tests | PASS | Runtime 28/28 and Scenario example 10/10. |
| Schema/conformance | PASS | 36 Schemas compile under strict Ajv; 206 Node tests pass. |
| Source portability/revision | PASS | Host path/import alias/BOM/CRLF normalization, unexpected-alias negative, exact revision resolution and source byte comparison pass. |
| Consumer/exposure boundary | PASS | Actual consumer scan, self-test, canonical-ref, claim-token, semantic and documentation alignment checks pass. |
| Deterministic build | PASS | Two isolated 68-file builds produce `2b504b48c934f74798fcef42bac62360828651e1c854cb763eeda3574ca759d1`. |
| Deterministic manifest | PASS | Two outputs produce `9a9b0aefdd072585334aa60f64b272202ac280b77b5932589f9c0813092f14f6`. |
| Tracked-output hygiene | PASS | Generated build output remains ignored; the lock commit changes only its metadata file. |
| Context/governance/docs | PASS | Checksum `3fac79261f7fe8a8d5671dd11a016b68e4be734184a3e2c71744d324a36a02dd`; strict checks and document/anchor lint pass. |

## Unchanged boundaries

- no Base runtime/provider, Scenario product value, package version or dependency;
- no My-Chat/Nurture consumer, renderer, presenter, manifest/module or product source;
- no Prisma/schema/migration, database, capability, deployment, activation or traffic;
- no I1-D, I1-E, I1-F or C30-I2 source.

## Rollback and next gate

Rollback I1-C acceptance by reverting lock `9d16810…`, then review repair
`d14bf31…`, C3 `13d2077…`, C2 `600faee…` and C1 `64533a6…` in reverse order as
needed. No runtime, consumer or database compensation exists.

I1-C is closed. The next eligible T-002 decision is separate authorization for an
I1-D scope review/freeze. It is not authorization for I1-D implementation, consumer
adoption, C30-I2, capability activation, deployment, Pilot or traffic.
