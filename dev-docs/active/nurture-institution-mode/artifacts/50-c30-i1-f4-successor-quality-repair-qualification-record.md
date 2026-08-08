# C30-I1-F4 Successor Quality Repair Qualification Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every artifact-49 finding and reclose C30-I1-F
- Result: `I1_F_REACCEPTED / F_R1_F_R2_F_R3_F_R4_CLOSED`
- Cumulative state:
  `C30_I1_BASE_CONTRACTS_ACCEPTED / C30_I2_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `CONSUMER_ADOPTION_NO_GO / CAPABILITY_ACTIVATION_NO_GO /
  DEPLOYMENT_NO_GO / T_008_NO_GO / PILOT_NO_GO / EXTERNAL_TRAFFIC_NO_GO`

C30-I1-F is reaccepted at one successor neutral Base source and a following
metadata-only lock. The repair changes no I1-A through I1-E wire field, driver,
operation name, capability dependency, source identity or package version.

## Exact successor chain

| Role | Commit | Binding |
| --- | --- | --- |
| Historical F1-F4 qualification | `3d91591eb506de2c2c6c6633536c5b43d07c2af9` + `afe47e8a529a52b38bd07053e55f625cdb16c194` | Superseded acceptance evidence in artifact 48 |
| Successor repair / exact source | `15ff031ed16897920c13fe24c9849531d98607ad` | Parent historical lock `afe47e8…`; ten source, Schema, fixture and test files |
| Metadata-only successor source lock | `4350086993d837baa8030564f4e19593dedd96b0` | `contract_source_revision = 15ff031…` |

The lock records 22 normalized aggregate TypeScript files and
`source_hash = d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`.

## Finding closure

| Finding | Closure |
| --- | --- |
| `F-R1` multi-action handler contradiction | The trusted `prepare_domain_action` transport handler and per-action business handlers are distinct declaration kinds. Each action handler is unique across the complete Scenario handler namespace; the exact prepare operation and its entitled ingress set remain mandatory. A two-action manifest passes, while shared and cross-kind handlers fail. |
| `F-R2` presentation ingress not operation-local | Each product surface now resolves through its presentation to the exact presentation operation and must occur in that operation's `product_surface` ingress set. A surface declared only on another operation fails `missing_surface_presentation_ingress`; the existing reverse ingress-to-surface rule remains. |
| `F-R3` unbounded declaration arrays | Runtime and strict JSON Schema both accept the frozen maxima and reject maximum plus one: `safe_reason_codes <= 64`, `route_classes <= 64`, and `action_keys <= 128`. Existing grammar, uniqueness and outer-population bounds remain unchanged. |
| `F-R4` ancestor symlink acceptance | Source hashing checks every physical-root and explicit-file path segment with `lstat`. A symbolic-link root fails with the dedicated symbolic-link reason, while relocation, import-alias, BOM/CRLF and ordering portability stay green. |

The action-handler correction also makes the existing `WF-MAN-120` legacy
no-alias rule inspect action handlers directly. Base still declares contracts and
validation only; no dispatch implementation or consumer adoption was added.

## Current named Base profiles

| Source identity | SHA-256 | Files |
| --- | --- | ---: |
| `platform_child_family_identity_source_v1` | `81d9fb9db244b8e56bc85e8770eb13915ca87b6053bb3411420b569d59d8fed4` | 27 |
| `scenario_interface_source_v1` | `37f0cdae3ad8807073dd250a51f4de990dcccf40952c127b2340161db2e28eaf` | 29 |
| `scenario_domain_action_source_v1` | `b7c35259d03a84778cc909075a08d6b147a43a38a12cddeb875c94f01591e48d` | 45 |
| `scenario_protected_interaction_source_v1` | `78eadaf4448b61ab3629026fefe4befbb2522eccbc7e459366d1032885d90efb` | 58 |

The shared manifest assertion, Schema and module validator belong to every named
profile, so the four source hashes intentionally changed together.

## Qualification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Focused F2/F3 regressions | PASS 46/46 | Maximum/max-plus-one, split-operation surface reachability, two-action acceptance, handler collision and missing-prepare cases pass. |
| Full Base verifier | PASS x3 | Contract/runtime/Scenario/conformance typechecks and contract builds, canonical-ref lint, all tests, portability and exact source-lock checks pass in three complete rounds. |
| Runtime / Scenario | PASS | 35/35 and 10/10. |
| Schema / Node conformance | PASS | 66 strict Schemas and 441/441 Node tests. |
| Deterministic contracts build | PASS | Two isolated 84-file trees: `984d4fab5069fde7cf3d1415302774d2450818d50583fc9d61b4e311fc71d5f6`. |
| Deterministic runtime build | PASS | Two isolated 92-file trees: `26b9a84c38fd2657e74fa0408e0b21446c3f750c94d2aa85e7cbc1b0c9441961`. |
| Deterministic Scenario build | PASS | Two isolated 56-file trees: `8b361719fa295a5edf3f7d4b80bdd1196d7e66ec918958a2bd334802d6d4eb54`. |
| Deterministic source manifest | PASS | Two byte-identical outputs: `02d8bec583b55f4b2080538e00037a3ebf0f8e188d59f0ee240b30b7b8276a6b`. |
| Metadata-only seal | PASS | `4350086…` changes only `conformance/workflow-contract-source-lock.json` and points to committed source `15ff031…`. |
| Scope audit | PASS | The successor chain changes only the eleven frozen Base paths; no `any`, package version, starter adoption, consumer source, public I1-A through I1-E wire, capability graph or source-identity vocabulary was added. |
| Three-repository boundary | PASS | Base is clean at `4350086…`; My-Chat is unchanged and clean at `dc4a77b…`; Nurture product source is unchanged before the governance-only reacceptance update. |
| Effect boundary | PASS | No Prisma/schema/migration, PostgreSQL/database, environment/secret/KMS, deployment, capability/Workspace activation, C30-I2 implementation, T-008, Pilot or external traffic action ran. |
| Context/governance/docs | PASS | Workflow-context checksum `7f62af978bb5ef252b1a5655659622f9774153c0908e7d0781dd2e95e902af16`; strict Context/project-state/project-governance checks and T-002 query pass; strict task and repository Markdown/anchor lint cover 80/446 files with zero warnings/errors. |

The pre-lock conformance population passed 440/441 and failed only the expected
historical F4 profile-lock equality. The source commit landed before lock
generation; the complete verifier then passed three times without weakening or
bypassing the lock.

## Rollback and next gate

Rollback metadata lock `4350086…`, then successor source `15ff031…`.
Artifact 48 remains historical rather than current acceptance evidence. No
runtime, consumer, database or operational compensation exists.

The only eligible next decision is a separately authorized C30-I2 scope review
and freeze against Base `4350086…`. The qualification record does not authorize
C30-I2 implementation, consumer adoption, deployment, activation, T-008 or Pilot.
