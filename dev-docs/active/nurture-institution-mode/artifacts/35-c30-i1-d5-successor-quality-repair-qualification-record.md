# C30-I1-D5 Successor Quality Repair Qualification and Source-Lock Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: all C30-I1-D operations through closure, including every review finding
- Result: `I1_D_REACCEPTED / D_R1_D_R2_D_R3_D_R4_D_R5_CLOSED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_I1_B_I1_C_I1_D_ACCEPTED`
- Next state: `I1_E_SCOPE_REVIEW_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `I1_F_BLOCKED / C30_I2_NO_GO / ACTIVATION_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

Artifact 34 reopened acceptance before source work. The successor repair closes
all five findings without changing any public wire, driver, result variant,
manifest dependency or product value. This record restores current I1-D
acceptance against the exact repaired Base source and metadata-only lock below.

## Exact Base successor chain

| Role | Commit | Binding |
| --- | --- | --- |
| Historical D5 lock | `c179bb5fe914311a7a4fe9a59b898eeee53297a4` | Parent of successor source; retained as historical evidence |
| Successor source repair | `3580a9be74bd6ebe81d00c9fe99ccdf98d147664` | Four files: one Schema, one private validation module and two conformance suites |
| Successor metadata source lock | `1cb56910f32ab5e13f9d378af3b3043dfc94b180` | `contract_source_revision = 3580a9b…` |

The lock records 20 normalized TypeScript files and
`source_hash = 5c5f2c5380773ccb651925199d403f267edb60bfbb0512bb0779218d074a99ef`.

## Finding closure

| Finding | Resolution and executable falsification |
| --- | --- |
| `D-R1` prepare Schema branch closure | Both result `oneOf` branches are independently closed. Ajv and the codec now reject prepared-plus-safe-reason and failure-plus-submit-token mixtures. |
| `D-R2` resolved submit identity | Private submit context now carries the resolved token, scenario and action. Altered token or contract-context scenario/action fails before assurance semantics; the public submit echo is unchanged. |
| `D-R3` immutable exact rebind | Stored binding context now contains assertion, evidence hash and expiry. Exact replay reproduces the stored seal and rejects both expiry extension and evidence substitution even when the new context/result agree with each other. |
| `D-R4` claimed-Step execution composition | One exported private assertion joins contract, stored Step assertion, transient driver, execution binding/result and published state. Wrong driver Step, effect Step, Workspace, contract hash or unpublished state fails closed. |
| `D-R5` bind failure outcomes | Body-free `unavailable` needs no fabricated success metadata. `request_conflict` is accepted only for a same-Step/same-Workspace/same-contract stored assertion that differs from the new immutable request; unexpected conflict and success-shaped changed requests are rejected. |

## Qualification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Full Base verifier | PASS | Repaired source/lock content passed repeated cumulative verification before metadata sealing and twice again on the final exact `3580a9b…` / `1cb5691…` chain. |
| Type/build populations | PASS | Contract, runtime, Scenario and conformance typechecks/build pass; runtime 28/28 and Scenario 10/10 remain green. |
| Schema/conformance | PASS | 55 strict Schemas compile and 296 Node tests pass, including all five successor adversarial groups. |
| Source identity | PASS | Exact reachable revision, committed-byte comparison, import-alias portability and normalized source hash all pass. |
| Deterministic build | PASS | Two isolated 76-file builds produce `e702757a6d83a0debce229c3e207f04585e588a2542abc6b21e6d1d0e09bca8d`. |
| Deterministic manifest | PASS | Two source-manifest outputs produce `cb42c39351608dfb72786e56af8df55bb6ddedad3765b1cb0a00fb33d648c068`. |
| Commit hygiene | PASS AFTER CORRECTION | An initial shell invocation encoded `\n\nTask:` literally. Both unpushed Base commits and the Nurture freeze commit were rewritten with real `Task: T-002` trailers; the source lock was rebound to the resulting exact revision and the final verifier reran twice. |
| Scope audit | PASS | No Base runtime/Scenario starter/manifest type/schema/validator diff, `any`, product vocabulary, consumer source, dependency or temporary output. |
| Context/governance/docs | PASS | Context checksum `7ff6f13e9410ce7d0601dce4762f5e51e9684b2e8d3db13cac816387f767b701`; strict Context/project governance, T-002 query and document/anchor lint pass for 65 task and 431 repository Markdown files. |

The pre-lock conformance aggregate initially stopped at source-hash portability
because that check intentionally compares current source with the still-historical
lock. The non-locking 55-Schema/296-test population passed; after the exact
candidate lock was generated, the complete verifier including portability and
revision checks passed. No gate was disabled or weakened.

## Unchanged boundaries

- no public wire field, result variant, driver name or package version;
- no Base workflow runtime, Scenario starter, manifest capability/dependency or
  `scenario_domain_action_source_v1` convergence; those remain I1-F;
- no My-Chat or Nurture consumer, renderer, provider, handler, manifest/module or
  product source;
- no Prisma/schema/migration, database, deployment, capability, activation,
  T-008, Pilot or traffic action.

## Rollback and next gate

Rollback in reverse order: successor lock `1cb5691…`, successor source
`3580a9b…`, then the historical D5/D4 chain if a broader rollback is required.
No runtime, consumer or database compensation exists.

I1-D is reaccepted. The only eligible next T-002 decision is a separately
authorized C30-I1-E protected-interaction scope review and freeze. It is not
I1-E implementation and does not open I1-F, C30-I2, deployment, activation or Pilot.
