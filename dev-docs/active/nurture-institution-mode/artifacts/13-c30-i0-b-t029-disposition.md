# C30-I0-B T-029 Donor Disposition

## Status and boundary

- Reviewed: 2026-07-21
- State: `DISPOSITION_COMPLETE / ZERO_DIRECT_MERGE / C30-I1_NO_GO`
- Task owner: `T-002 nurture-institution-mode`
- Candidate roots:
  - Base: `/Volumes/DataDisk/Project/.codex-worktrees/scenario-platform-convergence/workflow-base`
  - My-Chat: `/Volumes/DataDisk/Project/.codex-worktrees/scenario-platform-convergence/my-chat`
  - Nurture: `/Volumes/DataDisk/Project/.codex-worktrees/scenario-platform-convergence/nurture`
- Coverage: 57 Base files, 79 My-Chat files, and 40 Nurture files; every
  tracked delta and untracked candidate file is covered by a path group below.
- Excluded effects: candidate edits, schema or migration changes, database
  query/apply, artifact publication, capability/Workspace activation, cloud
  resources, secrets, provider calls, and product traffic.

The result is intentionally stricter than a test-health review. T-029's donor
suites pass, but no candidate file is safe to cherry-pick unchanged into C30.
Reusable behavior is recorded as `REWORK` because the surrounding contract,
ownership, security, or lifecycle semantics must change first.

## 1. Disposition vocabulary

| Disposition | Meaning for C30 |
| --- | --- |
| `REUSE` | File can land unchanged. No T-029 file received the `REUSE` disposition. |
| `REWORK` | Preserve a named mechanism or test idea, then implement the mechanism on the clean C30 branch against the locked contract. |
| `DEFER` | Exclude from C30 and assign to the named later DAG node or a separate owning task. |
| `REMOVE` | Do not preserve the candidate semantic track. Build a replacement from the locked architecture if the capability is still required. |
| `REGENERATE` | Discard the generated/derived candidate file and regenerate the file only from accepted committed sources. `REGENERATE` is a specialized `REMOVE`. |
| `DO_NOT_MERGE` | Keep only as donor history; never merge over a newer owner task or governance corpus. |

## 2. Cross-repository findings

### 2.1 Useful mechanisms

The following ideas are valid donors, but not merge-ready implementations:

1. closed-field validation for refs and envelopes;
2. deterministic canonical hashing that excludes per-attempt trace metadata;
3. owner-domain mutation, immutable Execution, and refs-only owner outbox in one
   owner transaction;
4. My-Chat same-subject composite FK and typed owner-ref uniqueness;
5. duplicate identity conflict tests, wrong-Step denial, response-loss recovery,
   and body-leakage negative tests;
6. content-path hashing and a hermetic integration-lock verifier concept.

### 2.2 Blocking incompatibilities

1. **The shared contract is not neutral or complete.** Base hard-codes the
   `my_chat` namespace and product role/provider allowlists, introduces a second
   `CanonicalRef` shape beside the existing identity contract, and exposes only
   umbrella `scenario_federation_v1`/`generation_ticket_v1` capabilities. Base
   does not define the separately attributable C30 sources, trusted principal,
   private caller proof, direct/claimed driver union, subject presentation,
   domain action, or protected-interaction contracts.
2. **The command protocol conflicts with the locked reliability model.** Every
   command requires Run/Step refs, so direct-empty work cannot be represented;
   claimed work carries no trusted claimed-Step driver/claim evidence. The
   sample idempotency key includes `attempt`, which can create a second identity
   on same-Step reclaim. Ordinary business reauthorization is reused for
   response-loss lookup instead of the isolated exact-bound recovery caller.
3. **Command facts and delivery disposition are conflated.** Candidate statuses
   `accepted|applied|already_applied|rejected|compensated` mix commit state,
   replay disposition, and business outcome. The locked Nurture Execution stores
   only `applied|already_satisfied`; `executed|replayed` is response-only, and
   invalid/blocked/conflict/error attempts do not become committed Executions.
4. **The Nurture identity direction is reversed.** Candidate rows put raw
   My-Chat Child/Family ids on `NurtureChild`/`NurtureFamily` and call those ids
   anchors. The locked chain is My-Chat Child/Family -> My-Chat binding
   `ownerRef` -> scenario-global Nurture typed anchor -> exact workspace-local
   association -> local Child/Process/child-scoped Family. Raw platform
   Child/Family ids never enter Nurture persistence.
5. **The My-Chat binding operation is not an atomic pair operation.** Separate
   `bindChild` and `bindFamily` calls can leave a partial pair and do not provide
   the writer-fenced `committed|confirmed_no_effect|unknown` recovery required
   by onboarding. Repository preconditions also prove an active stewardship but
   do not by themselves prove that the authenticated initiating principal owns
   that stewardship.
6. **The Nurture owner path creates a second command kernel.** Federation-only
   columns, statuses, hashes, and a Prisma-coupled handler sit beside the existing
   command runner. The adapter persists rejected/compensated rows and forces a
   compatibility reader to throw. C30 must extend the one canonical command
   kernel with typed principal/provenance, not add a parallel Execution model.
7. **The candidate contains executable dual tracks.** Nurture derives v2 from an
   embedded v1 manifest and exports a separate pre-activation manifest; My-Chat
   mixes new registry/activation with legacy capability cutover; Base starter
   templates combine generic scenario setup with education roles and protected
   AI. C30 requires one additive contract and explicit absent/disabled
   declarations, not runtime fallback manifests.
8. **The work is not one DAG increment.** T-029 combines C30 ingress/identity,
   C34 event/notification mechanics, C35 registry/activation, protected AI that
   is excluded from Pilot, Base packaging, and My-Chat T-028 Education removal.
   Those changes cannot share one migration, commit, or adoption decision.
9. **The evidence is mutable.** Package-mode joint verification accepts mutable
   local directories, the installed verifier entrypoint is incomplete, and the
   starter CI calls a missing script. Local hashes and public `1.0.0` version
   declarations are not immutable adoption evidence.

## 3. Required C30 replacement seams

| Gate | Required clean implementation seam |
| --- | --- |
| `C30-I1` Base | Additive neutral contracts and strict codecs for trusted public/private ingress, authenticated principal versus business Actor, canonical-object scenario binding, subject presentation, domain actions, protected interactions, direct-empty versus claimed-Step drivers, and atomic dependency declarations. Keep `platform_child_family_identity_source_v1`, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, and `scenario_protected_interaction_source_v1` separately hashable. |
| `C30-I2` My-Chat | Signed private invocation and nonce verification, public session/workspace ingress, atomic Child/Family pair-binding operation with writer-fenced recovery, subject-provider/presentation registry, generic direct/claimed orchestration, protected composer/read controls, and default-off capability adoption. Do not mix T-028, C34, C35, or protected AI. |
| `C30-I3` Nurture | Scenario-global Child/Family typed anchors, exact workspace associations, Participant binding from the authenticated account, principal verifier, one canonical CommandExecution runner, action preparation/handler registry, presenters/protected reads, and owner transaction/outbox. Store no raw platform Child/Family id. |
| `C30-I4` joint | Pin exact clean commits and source hashes; prove pair binding, direct/claimed execution, duplicate/response loss, wrong-Step/cross-scope denial, principal/service separation, body-free transport, owner reread, privacy scans, rollback, and tracked false/empty gates. |

## 4. Base file disposition — 57 files

| Group | Paths covered | Disposition | Extraction rule |
| --- | --- | --- | --- |
| `B01` | `templates/host-runtime/packages/workflow-contracts/src/types/federation.ts`, `federation-validation.ts`, `schemas/canonical-ref-v1.schema.json`, `scenario-command-envelope-v1.schema.json`, `scenario-command-receipt-v1.schema.json`, `scenario-contract-release-v1.schema.json`, `scenario-event-envelope-v1.schema.json`, and matching `src/index.ts` | `REWORK / C30-I1` | Keep closed codecs, stable hash, receipt identity, and generic release-ref ideas. Converge with the existing identity types; parameterize owner namespaces; add trusted-principal/private-caller and direct/claimed semantics; replace the status vocabulary. |
| `B02` | `src/types/manifest.ts`, `src/types/validation.ts`, `schemas/scenario-manifest-v2.schema.json`, runtime `validate-module.ts`, `validate-module.test.ts`, and `federation-contract.test.ts` | `REWORK / C30-I1` | Preserve strict unknown-field and declared-dependency validation. Replace umbrella capabilities with separately named sources and neutral dependency rules. Do not make step-runtime taxonomy or v2 conversion a prerequisite unless required by C30. |
| `B03` | workflow-contracts `package.json`, `tsconfig.json` | `DEFER / packaging` | Version/public-build changes land only after accepted contract bytes and release policy. |
| `B04` | `schemas/integration-lock-v3.schema.json`, `conformance/scripts/verify-integration-lock.mjs`, `conformance/tests/verify-integration-lock.test.mjs`, and `templates/scenario-module/integration-lock.example.json` | `REWORK / C30-I0-D` | Require immutable Git revision or content-addressed artifact in joint mode, reject mutable/symlinked/mismatched logical sources, and prove clean-installed CLI parity. |
| `B05` | `conformance/scripts/check-federation-schemas.mjs` and federation descriptor fixtures | `REWORK / C30-I1/I4` | Execute the JSON Schemas against positive and negative fixtures and prove JSON-Schema/TypeScript-codec parity; filename and `additionalProperties` inspection is insufficient. |
| `B06` | `conformance/scripts/semantic-lint.mjs`, `check-semantic-lint.mjs` | `REMOVE + REWORK` | Remove My-Chat namespace, education-role, and provider-brand policy from Base. A replacement may validate only declared neutral invariants. |
| `B07` | `conformance/package.json`, root `package.json`, `conformance/workflow-contract-source-lock.json` | `REGENERATE / I0-D then I1` | Rebuild scripts and locks from accepted source; never preserve candidate hashes or package versions. |
| `B08` | `templates/scenario-module/src/owner-api.ts`, `src/repositories.ts`, `prisma/schema.prisma`, `tests/owner-api.test.ts` | `REWORK / starter after C30-I1` | Reuse owner-transaction/outbox/replay test ideas. Remove hard-coded example authority, attempt-based idempotency, current-business-auth recovery, and any implication that Base owns owner persistence. |
| `B09` | `templates/scenario-module/src/model-gateway.ts`, `schemas/generation-ticket-v1.schema.json` | `DEFER / protected AI outside Pilot` | Protected AI is excluded from the Pilot candidate and must not widen C30. |
| `B10` | `schemas/scenario-workspace-activation-v1.schema.json` | `DEFER / C35-I1` | Activation/admission and qualification belong to C35, not C30. |
| `B11` | scenario starter `README.md`, `package.json`, `scenario.manifest.yaml`, `src/index.ts`, `src/registry.ts`, `tsconfig.build.json` | `DEFER + REWORK` | Regenerate a neutral starter after C30 contracts stabilize. Remove education/admin defaults and public version assumptions. |
| `B12` | `templates/scenario-module/.github/workflows/scenario-conformance.yml` | `REMOVE` | The workflow calls a script that the generated starter does not contain. Replace only after the installed conformance CLI is hermetic. |
| `B13` | `.ai/**`, `docs/context/federation/descriptor.json`, `docs/context/project.registry.json`, `docs/project/release-status.md` | `DO_NOT_MERGE / REGENERATE` | Governance and descriptors must be generated from the accepted Base task, not imported from T-029. |
| `B14` | `dev-docs/active/workflow-base/**` including `.ai-task.yaml` | `DO_NOT_MERGE` | Port only implementation facts accepted by the future Base task; T-029 status prose is not C30 evidence. |

## 5. My-Chat file disposition — 79 files

| Group | Paths covered | Disposition | Extraction rule |
| --- | --- | --- | --- |
| `M01` | `packages/workflow-contracts/**` candidate deltas | `REWORK / C30-I2 adoption` | Adopt only the exact accepted Base C30-I1 revision. Do not maintain a My-Chat-authored fork of federation types or validators. |
| `M02` | `packages/scenario-integrations/src/scenario-owner-client.ts`, test, package/index exports | `REWORK / C30-I2` | Keep exact receipt identity and response-loss branch tests. Add signed private caller/principal envelope, direct/claimed union, isolated recovery protocol, and frozen same-Step identity; never turn arbitrary transport/domain errors into lookup. |
| `M03` | `packages/domain/scenario-federation/**`, `packages/db/src/scenario-identity-binding-repository.ts` and test, related `packages/domain/index.ts`/`package.json` exports | `REWORK / C30-I2` | Preserve typed owner refs, duplicate conflict checks, same-subject FK, and refs-only audit ideas. Replace independent child/family calls with one durable pair operation, exact initiating authority, deterministic database-time fences, and `committed|confirmed_no_effect|unknown` recovery. |
| `M04` | identity/binding portions of `prisma/schema.prisma`, `prisma/migrations/20260720230000_scenario_platform_federation/migration.sql`, `packages/db/src/index.ts`, `packages/outbox/src/index.ts`, audit type/repository additions | `REWORK / split C30-I2 migration` | Create one narrowly owned C30 migration after API/domain contracts are final. Do not reuse the mixed migration. Keep only accepted identity-operation/binding rows and event names. |
| `M05` | `packages/db/src/scenario-command-admission-gate.ts` and test | `REWORK / C30-I2 ingress portion`; activation portion `DEFER / C35` | Separate public session/workspace admission from signed private service ingress and Nurture business authorization. Remove teacher/expert-style release allowlisting from the generic seam. |
| `M06` | `scenario-registry-repository.ts`, `workflow-host-snapshot-builder.ts`, registry/activation domain types, and registry/activation portions of Prisma/migration | `DEFER / C35-I2` | Registry qualification, positive-only Workspace activation, admission evidence, and Host snapshot convergence are C35 outputs. |
| `M07` | `scenario-event-inbox-repository.ts` and test plus event-inbox schema/migration | `DEFER / C34 or later owner-event adoption` | Preserve refs-only validation, idempotent ingest, claim, retry/dead-letter, and atomic platform effects as donor mechanisms. Reconcile with typed Notification continuity before implementation. |
| `M08` | `packages/llm/src/scenario-model-gateway.ts` and test; `packages/db/src/scenario-generation-repository.ts`; content/LLM/index/package and GenerationRecord schema changes; `2026-07-21-generation-completion-gate.md` | `DEFER / protected AI outside Pilot` | Do not place provider selection, generation tickets, or new generation persistence in C30. |
| `M09` | `apps/api/src/app.module.ts`, `legacy-education-cutover.test.ts`, `packages/db/src/domain-capabilities-repository.ts`, domain-capability repository changes, `packages/db/src/projection-source-reader.ts`, `workflow-notification-source-reader.ts`, worker projection changes/tests, and `prisma/migrations/20260720190000_child_identity_scenario_boundary/migration.sql` edit | `REMOVE FROM C30 / separate T-028 review` | Education route removal, 3,000-line repository deletion, projection retirement, and migration portability are not C30 adoption. Land or repair them only under their owning cutover task. |
| `M10` | `packages/domain/admin-governance/types.ts`, `packages/domain/audit/types.ts`, `packages/db/src/audit-repository.ts` | `SPLIT` | Identity/binding audit additions are `REWORK / C30-I2`; Education removals and unrelated knowledge/workflow additions are `DEFER` to their owners. |
| `M11` | `apps/workers/package.json` export of `nurture-user-attention-owner` | `DEFER / C34` | Existing X4 owner-consumer wiring is not a C30 contract change. |
| `M12` | workflow runtime `registry/loader.ts`, validation source/tests, runtime package; WorkflowRun `scenarioReleaseId` and WorkflowStep `runtimeKind` schema changes | `DEFER + REWORK` | Adopt only the Base dependency model required by the relevant DAG node. Do not couple C30 ingress/identity to registry/activation or a global step taxonomy. |
| `M13` | `docs/context/realtime/projection-changes/2026-07-20-scenario-platform-federation.md` | `REGENERATE` | Write a new projection review for the final split C30 schema; candidate scope includes deferred and removed changes. |
| `M14` | `packages/db/src/migration-portability.test.ts` | `DEFER / T-028` | The test validates an unrelated cutover migration. |
| `M15` | `.ai/project/main/**`, `dev-docs/active/scenario-platform-convergence/**` | `DO_NOT_MERGE` | Preserve as donor history only; regenerate My-Chat governance from the future C30-I2 task. |
| `M16` | `docs/context/federation/descriptor.json`, `docs/context/db/schema.json`, `docs/context/registry.json`, `pnpm-lock.yaml` | `REGENERATE` | Derived descriptors, DB context, registry checksums, and lockfile follow accepted source/schema/dependency changes. |

## 6. Nurture file disposition — 40 files

| Group | Paths covered | Disposition | Extraction rule |
| --- | --- | --- | --- |
| `N01` | `packages/nurture-scenario/src/federation/owner-api.ts` and tests | `REWORK / C30-I3` | Keep strict unknown-field, exact release/receipt identity, duplicate, wrong-Step, and no-body tests. Add signed principal/private caller verification, fresh nonce, direct/claimed driver, action/surface contract, and isolated recovery; do not reauthorize committed recovery through ordinary business access. |
| `N02` | `packages/nurture-db/src/federation-owner-ports.ts` and tests | `REWORK / C30-I3` | Preserve one-transaction business effect + Execution + refs-only outbox and rollback tests. Integrate through repository/application ports without exposing `Prisma.TransactionClient` to the business handler and without a second status/hash kernel. |
| `N03` | `packages/nurture-scenario/src/federation/identity-binding.ts` and tests; Child/Family direct-ref schema/migration fields; `NurtureIdentityMigrationCandidate` | `REMOVE / replace identity model` | Raw My-Chat Child/Family refs are not Nurture anchors. Implement separate scenario-global typed Child/Family anchors and exact workspace Child/Family associations. Legacy local rows stay local/provisional; no candidate mapping queue may infer or promote identity. |
| `N04` | Participant actor, Workspace association, and Institution organization binding portions of `prisma/schema.prisma` and migration | `REWORK / C30-I3` | Typed account/Actor/Workspace/organization provenance may be retained only through the accepted signed owner contract and exact current binding. Keep that provenance separate from Child/Family anchors and from business authorization. |
| `N05` | federation columns/statuses on `NurtureCommandExecution`, `NurtureFederatedCommandStatus`, and the guard in `institution-core.repositories.ts` | `REMOVE / replace with one runner` | Do not persist rejected/compensated Executions or make old readers throw. Add only the typed/versioned principal and provenance fields required by the canonical command runner. Response-only replay disposition remains outside the row. |
| `N06` | `NurtureOwnerIntegrationOutbox` schema/migration and DB port behavior | `REWORK / C30-I3` | Keep owner-transaction and body-free refs-only event mechanics; add closed event codecs, deterministic event identity, lease/retry ownership, and privacy tests after the command model is final. |
| `N07` | `packages/nurture-scenario/scenario.manifest.yaml`, `src/registry.ts`, `src/policies.ts`, related conformance/module/policy tests | `REMOVE CURRENT CONVERSION / REWORK AFTER C30-I1` | Eliminate derived v1->v2 plus pre-activation dual manifests, education-role substitution, placeholder source hash, and unrelated `knowledge_candidate` rename. Adopt exact separate source dependencies and declare only implemented actions/surfaces. |
| `N08` | `packages/nurture-scenario/src/index.ts`, `packages/nurture-db/src/index.ts` | `REGENERATE` | Export only accepted C30-I3 ports after their contracts stabilize. |
| `N09` | scenario/root `package.json`, `tsconfig.build.json`, `pnpm-lock.yaml`, integration-lock candidate | `DEFER / I0-D and packaging` | Remove mutable host DB/worker/runtime links from release evidence. Do not publish `1.0.0` or make the scenario public before an accepted package/release plan. Joint harness dependencies must remain test-only and immutable. |
| `N10` | `packages/nurture-db/tests/x5-joint-acceptance.integration.test.ts` additions | `DEFER / C30-I4` | Rebuild joint tests against accepted C30 seams and separate databases. Passing direct sibling-package tests cannot qualify C30-I4. |
| `N11` | `prisma/migrations/20260721003000_scenario_federation_identity/migration.sql`, schema preview and local-X5 DB artifacts | `REMOVE / replace with split C30-I3 migration` | Never apply the candidate migration. The migration reverses the anchor direction, changes every existing local Child/Family binding state, and mixes identity, command, outbox, and legacy review concerns. |
| `N12` | `docs/context/db/schema.json`, `docs/context/federation/descriptor.json`, `docs/context/registry.json`, workflow contract context | `REGENERATE` | Generate only after accepted canonical manifest, schema, API, and source pins. |
| `N13` | `.ai/project/main/registry.yaml`, all T-029 edits under `dev-docs/active/nurture-institution-mode/**`, and `artifacts/10-scenario-federation-verification.md` | `DO_NOT_MERGE` | The primary T-002 corpus is newer and normative. Port only verified facts from a future implementation; do not import T-029 status, pitfalls, or qualification claims. |
| `N14` | `.ai/scripts/lint-docs.mjs`, `scripts/assert-test-routing.mjs` | `REGENERATE / separate maintenance` | Candidate count changes merely accommodate candidate files and do not define C30 semantics. |

## 7. Merge and branch rules produced by the review

1. Do not merge, cherry-pick, or squash any T-029 worktree as a unit.
2. Do not use the T-029 Base package, My-Chat contract package, Nurture package,
   integration lock, manifest source hash, or database artifacts as an adoption
   pin.
3. C30 implementation starts from clean scoped commits selected by C30-I0-C.
4. New implementation may copy small mechanisms only with a source note in the
   owning implementation commit and new tests against the locked C30 contract.
5. Base lands first. My-Chat adopts the exact Base revision. Nurture adopts the
   exact Base and My-Chat revisions. Joint tests follow all three commits.
6. T-028 cutover, C34 Notification continuity, C35 activation/qualification,
   protected AI, package publication, and generated governance/context remain
   outside the C30 commit series.
7. Any candidate migration remains unapplied. Final schema changes require the
   repository DB workflow, a fresh projection review where applicable, and
   separate migration verification.

## 8. C30-I0-B exit decision

`C30-I0-B=COMPLETE` because every T-029 candidate file/semantic block now has
an owner and `reuse/rework/defer/remove` outcome, the direct platform-ref model
and umbrella-source path are explicitly prohibited, and the clean replacement
seams are defined.

The completion does not make a code candidate merge-ready. `C30-I0-C` must
separate and commit T-002/T-003/cloud-deployment ownership and create clean
three-repository C30 worktrees. `C30-I0-D` must then establish immutable pins,
repair the hermetic verifier, prove false/empty gates, and rerun the canonical
baseline. `C30-I1` remains `NO_GO` until C and D both pass.

## Next three actions

1. Produce the scoped T-002 commit while excluding T-003 and every T-029 path.
2. Resolve the My-Chat cloud-deployment worktree ownership and create clean Base,
   My-Chat, and Nurture C30 branches from exact commits.
3. Repair immutable dependency verification and record repository-level
   false/empty gate evidence before authorizing C30-I1.
