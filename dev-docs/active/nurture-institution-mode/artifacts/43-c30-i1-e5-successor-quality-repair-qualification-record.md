# C30-I1-E5 Successor Quality Repair Qualification Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair all findings and reclose C30-I1-E
- Result: `I1_E_REACCEPTED / E_R1_E_R2_E_R3_E_R4_CLOSED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_I1_B_I1_C_I1_D_I1_E_ACCEPTED`
- Next state: `I1_F_SCOPE_REVIEW_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `I1_F_IMPLEMENTATION_NOT_AUTHORIZED / C30_I2_NO_GO /
  CONSUMER_ADOPTION_NO_GO / ACTIVATION_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

I1-E is reaccepted at one successor neutral Base source and metadata-only lock.
The repair changes no public wire or driver. It closes the four artifact-42
validation/composition defects while retaining the protected carrier/control split,
same I1-D direct/claimed execution paths and I1-F convergence boundary.

## Exact successor chain

| Role | Commit | Binding |
| --- | --- | --- |
| Historical E1-E5 qualification | `5433124506ca8d48a536a283796765209b93d808` | Superseded source in artifact 41 |
| Successor quality repair / exact source | `48fd3d65b34a1dd7a6b1e85713fca81f7c9da171` | Parent lock `3a08d1f…`; six repair/test/Schema files |
| Metadata-only successor source lock | `9abde2b994f6528fc5afb26125eb029ed6027237` | `contract_source_revision = 48fd3d6…` |

The lock records 22 normalized TypeScript files and
`source_hash = be6fd80042a2998688dbeeaa6b4161ef80482d51eac413cfc0a53eaf2491fb7d`.

## Finding closure

| Finding | Closure |
| --- | --- |
| `E-R1` plaintext fragment bypass and low-entropy false positive | One shared profile computes exact raw/escaped/base64/base64url representations and 16-code-point windows. Wrapped high-entropy fragments fail; short protected values use exact-representation matching and no longer poison ordinary control strings. |
| `E-R2` encoded ref bypass and short opaque-version false positive | The same bounded scanner covers protected refs, versions and integrity evidence recursively. Base64url refs fail in I1-D output refs; one-character prepared/committed versions compose successfully unless copied exactly. |
| `E-R3` future commit timestamp | Commit composition now requires `prepared_at <= committed_at <= submit_context.now`; the accepted I1-D assertion separately requires `now < submit_context_expires_at`. Direct and claimed future-time negatives fail with `commit_after_context_now`. |
| `E-R4` prepare Schema/runtime key drift | The recursive Schema property-name rule now mirrors ASCII case folding, non-alphanumeric removal and forbidden-prefix matching. All 18 forbidden forms pass case/separator/suffix Schema/codec parity negatives. |

The 16-code-point window is a deliberate structural-scanner threshold, not an
exposure allowance. Exact short representations still fail, and separation by
construction remains mandatory. Base does not claim semantic DLP for arbitrary
low-entropy fragments or runtime proof over logs, transport, browser state,
storage or consumers; those remain later owner/joint obligations.

## Qualification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Focused E1-E4 population | PASS 80/80 | Wrapped fragment, one-character carrier/version, encoded ref, both-driver future time and recursive 18-form forbidden-key parity are executable regressions. |
| Full Base verifier | PASS x3 | Contract/runtime/Scenario/conformance typechecks and build, canonical-ref lint, all tests, portability and exact source-lock verification pass repeatedly before and after the metadata commit. |
| Runtime/Scenario populations | PASS | Runtime 28/28 and Scenario 10/10 remain green. |
| Schema/conformance | PASS | 66 strict Schemas compile and 376 Node conformance tests pass. |
| Source identity | PASS | Exact reachable source revision, committed-byte comparison and import-alias portability pass for 22 normalized TypeScript files at hash `be6fd800…fb7d`. |
| Deterministic build | PASS | Two isolated 84-file builds produce identical byte-tree digest `1e03ea30868e39554333c696b81b27d1aed344fa61459bd6a3776d4e12034749`. |
| Deterministic manifest | PASS | Consecutive source manifests are byte-identical with digest `6ae16f44434a10dded17aeab9d6f16e1d95f620a013c25de313f323d4af633c3`. |
| Metadata-only seal | PASS | Lock commit `9abde2b…` changes only `conformance/workflow-contract-source-lock.json` and points to the already committed exact source. |
| Scope audit | PASS | No public type/wire, runtime/Scenario starter, manifest dependency/source identity, package version, product vocabulary, `any`, consumer source or retained temporary artifact. |
| Repository boundary | PASS | Base, My-Chat and Nurture worktrees are clean at qualification input; My-Chat remains byte-identical at `dc4a77b257f952e2c0f0aede9521e16ac274de9d`. |
| Context/governance/docs | PASS | Workflow-context checksum `672d4bf758b4fa9d075f5c6d888d712aa37bbdfb5366c45c82b376418f74dce6`; strict Context/project-state/project-governance checks and T-002 query pass; 73 task and 439 repository Markdown files pass strict anchor lint. |

The first pre-lock aggregate correctly stopped at portability because changed
source was still compared with artifact 41's historical lock. Remaining checks
passed independently; after the source checkpoint and lock refresh, the complete
verifier passed three times. The expected sequencing rejection was not bypassed.

## Unchanged boundaries

- manifest dependency, legacy/vNext exclusion and
  `scenario_protected_interaction_source_v1` convergence remain I1-F;
- no My-Chat or Nurture consumer, protected route/store/KMS, renderer, provider,
  handler, manifest/module or product source;
- no Prisma/schema/migration, database, deployment, capability, activation,
  T-008, Pilot or traffic action.

## Rollback and next gate

Rollback successor lock `9abde2b…`, then source repair `48fd3d6…`; artifact 41's
source/lock remains historical rather than current qualification. No runtime,
consumer or database compensation exists.

I1-E is reclosed. The only eligible next T-002 decision is a separately authorized
C30-I1-F scope review and freeze. This record does not authorize I1-F
implementation, C30-I2, deployment, activation, T-008 or Pilot.
