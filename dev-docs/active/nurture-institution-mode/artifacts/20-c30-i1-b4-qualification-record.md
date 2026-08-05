# C30-I1-B4 Cumulative Qualification and Source-Lock Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: I1-B4 only
- Result: `I1_B_ACCEPTED / I1_B1_B2_B3_B4_COMPLETE`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_ACCEPTED / I1_B_ACCEPTED`
- Next state: `I1_C_READY_NOT_STARTED / SCOPE_REVIEW_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `C30_I2_NO_GO / C30_I3_NO_GO / C30_I4_NO_GO`

I1-B now passes as one cumulative Base contract slice. B4 adds no new wire or
runtime behavior: it qualifies the committed B1-B3 population and seals the exact
TypeScript source manifest.

## Exact Base chain

| Role | Commit | Parent / binding | Worktree state |
| --- | --- | --- | --- |
| B1-B3 source | `edbcd747eb50106b8f4967c3cb03b5480cbebc7f` | B2 `445c23649c5177f6d10ebcb1456b8191ea928fb4` | Clean after source commit |
| B4 source lock | `9a1586597a2eabd2876ad39e02c90491373595d0` | Parent and `contract_source_revision` = `edbcd747eb50106b8f4967c3cb03b5480cbebc7f` | Clean after lock commit |

The lock records:

- `source_hash = 16be693cd877bfac3638a615b391614cddccbf219ef6a115a450ff5f47eb2512`;
- 16 normalized TypeScript files across `workflow-contracts` and
  `workflow-validator`;
- exact byte count and SHA-256 for every file;
- an exact reachable Git revision containing every current contract source file.

The B4 commit changes only
`conformance/workflow-contract-source-lock.json`. It does not change source,
Schema, fixture, test, package, dependency or runtime files.

## Cumulative contract closure

The complete I1-B verifier covers:

- B1 neutral owner-ref reservation and exact replay;
- all four B2 reuse/create atomic-pair branches and exchange parity;
- B3 current-owner evidence and closed
  `committed|confirmed_no_effect|unknown` recovery;
- all four allowlisted unknown quarantine reasons;
- Host-internal versus Scenario-private exposure negatives;
- I1-A operation-input composition and legacy regression.

JSON Schemas and assertions reject the same closed-body structural mutations.
Standard JSON Schema owns shape, cardinality, scalar formats and closed variants;
the exported assertions additionally own arbitrary cross-item ordering/distinctness
and request/result cross-object parity. The executable qualification always runs
both layers, so a Schema-only pass is never treated as complete I1-B validation.

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Full verifier | PASS x3 | `pnpm verify:workflow-contracts` passes twice before and once after the B4 commit. |
| Typecheck/build | PASS | Contracts, runtime, Scenario example and conformance typechecks pass; contract build succeeds. |
| Runtime/Scenario tests | PASS | Runtime 28/28 and Scenario example 10/10. |
| Schema/conformance | PASS | 23 Schemas compile; 107 Node tests pass, including all B1-B3 legal/illegal fixtures and six integration-lock cases. |
| Source portability | PASS | Host-path/import-alias/BOM/CRLF normalization produces the exact locked source hash; unexpected aliases change it. |
| Source revision | PASS | Lock verification resolves exact `edbcd74…` and byte-compares every current TypeScript source file to that commit. |
| Consumer boundary | PASS | Both the conformance self-test and actual repository consumer-boundary scan pass. |
| Deterministic build | PASS | Two 60-file contract builds produce `e7195035c4c9e062aee26f2b759aca7c48167dcb2119713c4fe12913fd5a9a1a`. |
| Deterministic manifest | PASS | Two manifest outputs produce identical digest `76eeb87a9ea088cc619d362879f9dff327e55e649cd84f0d6114b2f278e1d876`. |
| Tracked-output hygiene | PASS | Only the metadata lock is committed; generated `dist` remains ignored and no dependency metadata changed. |
| Context/governance/docs | PASS | Context checksum `040f9bd16ee83667dcbc73b712fef8bfdc2c7a7017ed868fe71fbdbfdbdcbf91`; strict Context/project-state/governance checks, T-002 query and 416-file document/anchor lint pass. |

The first cumulative conformance attempt correctly stopped at source-hash
portability because the lock still named the accepted I1-A population. The
verifier was not changed or weakened. Refreshing the manifest and exact committed
revision closed that expected two-commit gate.

## Unchanged boundaries

- no Base runtime, Scenario starter, package version, dependency or capability;
- no My-Chat/Nurture source, manifest/module, Prisma/schema/migration, database,
  route, signer, registry, writer fence or activation;
- no I1-C source, C30-I2, deployment, T-007/T-008, Pilot or traffic.

## Rollback and next gate

Rollback I1-B acceptance by reverting lock commit
`9a1586597a2eabd2876ad39e02c90491373595d0`, then revert B3/B2/B1 source commits
in reverse order if their contracts must also be removed. No runtime, consumer or
database compensation exists.

The separately authorized I1-C review has now frozen its subject-presentation
scope in `21-c30-i1-c-scope-freeze.md`. The only eligible next implementation
decision is separate authorization for I1-C1 safe-copy/ref primitives. All I1-C
source work and C30-I2 otherwise remain unauthorized.
