# Phase 0 Discovery and Gate Matrix

## Outcome

- Task: T-004
- Phase: Phase 0 — Discovery and Gate Reconciliation
- Evidence head: `13efdb4`
- Completed: 2026-07-31
- Result: **PASS for discovery and gate classification**
- Next critical lane at Phase 0 close: T-002 NestJS ingress M0→M4 before
  T-004 Phase 1-2 implementation. T-002 M0-M4 and T-004 Phase 1-2 are now
  complete; Phase 3 is the current lane.

This result means the current source boundaries, reusable foundations, required
extensions and owner/activation gates are explicit enough to begin the accepted
G1 execution backbone. It does not mean that `SurfaceContractV1`, a Surface
Contract Artifact Set, the formal NestJS ingress, Owner Integration Readiness or
Joint Conformance exists.

Phase 0 changed planning/governance documents only. It created no product
contract artifact, source/schema/migration change, database effect, capability,
secret, deployment, activation or traffic authority.

## Classification Contract

### Source decision

| Decision | Meaning |
| --- | --- |
| `REUSE` | The current boundary can be consumed as a foundation without changing its ownership or semantic role. |
| `EXTEND` | Keep the current owner/pattern, but add a versioned T-004 contract or port before protected use. |
| `REPLACE_SEMANTICS` | The current code may remain as a default-off compatibility seam, but the new public contract MUST NOT adopt its business semantics. |
| `ADD` | No current public boundary satisfies the requirement. |
| `DEFER_SAFE` | The capability remains absent/default-off in the current increment. |

### Execution gate

| Gate | Opens | Does not prove |
| --- | --- | --- |
| `CONTRACT_PARALLEL` | Contract schemas, pure policy/domain types, synthetic fixtures and deterministic contract tests | Real identity, Grant, Receipt, protected content or traffic |
| `OWNER_INTEGRATION` | Real adapter work against an exact T-002 owner handoff through formal ingress | Joint cross-role qualification, Candidate or activation |
| `JOINT_CONFORMANCE` | Protected qualification using the same T-004 fixtures and the exact real owner path | Candidate Freeze, persistent DB apply or traffic |
| `ACTIVATION` | Separately authorized Candidate/deployment/internal-test work | External beta, production or real traffic |

Documentation, task status, a route name, a green synthetic test or a stable
opaque ID MUST NOT advance an item to a later gate.

## Evidence Baseline

| Concern | SSOT / inspected source | Current fact |
| --- | --- | --- |
| Product terminology | `docs/context/product/workflow-product-design-contract.md` | Only `InstitutionWorkflow` is product Workflow; ActionExecution, ActionDelivery, CareInteraction and PublishProcess remain separate. |
| Six-surface design input | `docs/context/product/nurture-mobile-ux-contract.md` and T-003 | Design input only; current T-004～T-008 decisions supersede conflicting demo semantics. |
| Identity/owner boundary | `docs/context/workflow/nurture-scenario-contract.md` | Four-layer principal → platform binding → local association → current business authority chain is required. |
| Persisted facts | generated `docs/context/db/schema.json` from `prisma/schema.prisma` | T-002 ecology, binding/association, care-message/item/receipt, interaction and command foundations exist; G2～G4 target semantics are incomplete. |
| Scenario public boundary | `packages/nurture-scenario/scenario.manifest.yaml`, `src/registry.ts`, `src/module.ts` | Canonical vNext and derived pre-activation manifests exist; the default module is pre-activation. |
| Handler/policy/presenter boundary | `src/handlers/`, `src/policies.ts`, `src/presenters.ts`, `src/institution-surfaces.ts` | Factory/port patterns exist; current presenters and owner reads are not the six-surface contract. |
| Persistence ports | `src/repositories.ts`, `src/deps.ts`, `packages/nurture-db/src/repositories/` | Scenario business code remains Prisma-free and real repositories are injected by the host composition. |
| HTTP boundary | `apps/scenario-service`, `apps/backend`, `docs/context/api/openapi.yaml` | Formal NestJS ingress exposes exactly health plus binding-owner on `PORT=8000`; the Fastify dev host remains transitional on `DEV_HOST_PORT=3001`. |
| Formal ingress plan | T-002 `12-nestjs-ingress-migration-plan.md` | M0-M4 are complete with exact API/env/port gates; M5 handoff regeneration and Fastify route disposition remain. |
| Family-care delta | T-005 `06-t002-fact-schema-gap.md` | Existing family-care commands require semantic replacement/extension before G2. |
| Institution delta | T-007 `06-g4-0-freeze-ledger.md` | T-004 and T-002 exact handoffs remain `DEFINED_UNQUALIFIED`; T-007 public capabilities are absent/default-off. |

Current verification notes:

- Context strict verification, test routing, persistence boundaries and the N1
  schema contract pass.
- `pnpm verify:workflow-contract-pin` remains an Owner Integration NO-GO when
  the floating sibling checkout differs from exact T-002 My-Chat pin
  `f00b86861cf0b751d747c7e0bc5cb86a952900de`.
- That drift is an `OWNER_INTEGRATION` NO-GO. It does not invalidate this
  repository-local Phase 0 census and MUST NOT be repaired by silently adopting
  the live checkout.

## Current Public Boundary Census

### Manifest and module

- The canonical vNext manifest declares seven capability keys and eight
  entrypoints:
  - `pregnancy_stage_management`
  - `family_strategy`
  - `care_plan`
  - `activity_comparison`
  - `execution_review`
  - `class_family_inbox`
  - `teacher_attention_board`
- `class_family_inbox` contains both `open_class_family_inbox` and the legacy
  `capture_family_input` entrypoint.
- The derived pre-activation manifest removes `capture_family_input`, its
  requirement, the `user_attention` handoff and the activation owner-read route.
- `nurtureScenarioModule` is intentionally an alias of the pre-activation
  module. Only `createNurtureActivationScenarioModule` advertises the non-empty
  vNext path, and its required ports prevent accidental partial activation.
- The YAML manifest and `src/registry.ts` are two current representations. T-004
  MUST NOT add a third manually maintained capability truth; Phase 1 must add
  parity checks between the surface contract registry and the scenario
  implementation bindings.

### API and presenter

- The vNext manifest declares six internal routes; the pre-activation manifest
  exposes five.
- The P7 binding-owner route now runs through the formal NestJS scenario
  service with the frozen application behavior. The Fastify copy remains
  transitional until M5 removes or hard-disables it.
- `docs/context/api/openapi.yaml` and the generated API index contain exactly
  `GET /health` and
  `POST /internal/nurture/scenario-binding/authorize`; CI checks
  source/OpenAPI/index parity.
- Current `WorkflowPresenters` return generic Run/Card/Artifact shapes and use
  `activity_comparison` placeholders. They are reusable only as an exposure and
  dependency-injection pattern.
- `InstitutionSurfaceResponse` currently covers only
  `class_family_inbox | teacher_attention_board` and emits display-safe labels,
  generic badges, aggregate versions and opaque refs. It is not
  `SurfaceEnvelopeV1`, and `nurture:item:{id}`-style refs are not accepted as
  final product capability targets.
- `InstitutionBusinessCommunicationProjectionV1` is absent from manifest,
  source, API and presenter code.

### Domain and persistence

- `NurtureCommandRunner`, canonical payload hashing, transaction-local
  CommandExecution persistence and exact replay are reusable foundations.
- `NurtureInteractionContext` supplies a body-free, hashed, expiring,
  consumable/revocable context foundation.
- The institution resolver and policy paths re-resolve current participant,
  role and CareGroup facts and fail closed on missing repositories or owner
  state.
- Current family-care commands still accept raw actor/role/object identifiers,
  use legacy Item status/whole-Item expected-version semantics and expose a
  single-reply-oriented lifecycle. Those public/business semantics MUST be
  replaced for G2 even though the command kernel is reused.
- Existing schema contains the T-002 canonical foundations:
  Participant, Child/Family and CareProcess, Institution/CareGroup/Enrollment,
  RoleAssignment/Grant/Receipt, family-care Message/Item/Event, daily care,
  attention, media attribution, InteractionContext and CommandExecution.
- Existing schema does not contain the final three-axis G2 Item contract,
  correction chain, G3 PublishProcess/PublicationRelease, G4 InstitutionWorkflow
  or the six-surface artifact identity. T-004 records these as downstream owner
  gaps; it does not invent their database schemas.

## Reuse / Extend / Gate Matrix

| Area | Current boundary | Decision | Gate | Owner / next action |
| --- | --- | --- | --- | --- |
| Scenario registration | `ScenarioManifest`, module validator, registry loader | `REUSE` | `CONTRACT_PARALLEL` | T-004 adds exact surface-binding parity without replacing My-Chat workflow registration. |
| Module composition | dependency-injected handler/policy/presenter/repository factories; explicit pre-activation module | `REUSE` | `CONTRACT_PARALLEL` | T-004 reuses factory/port boundaries and keeps new capabilities absent from default activation. |
| Capability discovery | legacy workflow capability/entrypoint registry | `EXTEND` | `CONTRACT_PARALLEL` | T-004 adds `CapabilityDescriptorV1`; it MUST remain distinct from workflow entrypoint semantics. |
| Handler registry | 13 workflow handlers including legacy family capture and two institution reads | `EXTEND` | `CONTRACT_PARALLEL` → `OWNER_INTEGRATION` | Add typed query/prepare/execute/readResult bindings; do not route new family actions through Run/Step. |
| Command execution | command kernel, transaction port, canonical hash, exact replay | `REUSE` | `CONTRACT_PARALLEL` | T-004 defines generic invocation/result/head schemas; T-005～T-007 own domain effects. |
| Current family-care DTO/state | raw ids, whole-Item expected version, single status/reply slot | `REPLACE_SEMANTICS` | `CONTRACT_PARALLEL` | T-005 owns three-axis Item, append-compatible reply and single-writer cutover. Legacy path stays default-off/read-only. |
| Interaction confirmation | hashed/expiring InteractionContext | `EXTEND` | `CONTRACT_PARALLEL` | T-004 defines capability/target/actor/scope/head/integrity binding; protected body never enters context. |
| Institution resolution | current Participant/RoleAssignment/CareGroup resolution and fail-closed policies | `REUSE` | `OWNER_INTEGRATION` | T-002 supplies exact owner handoff; T-005～T-007 add capability-specific business authority. |
| Binding owner | P7 Fastify route, transaction-local Guardian role reread, private anchor and Receipt | `EXTEND` | `OWNER_INTEGRATION` | T-002 migrates unchanged wire behavior to formal NestJS ingress and renews exact pins/evidence. |
| Institution safe reads | class inbox and teacher attention owner-read projections | `EXTEND` | `CONTRACT_PARALLEL` → `OWNER_INTEGRATION` | Reuse query/policy patterns; replace output with exact contract-bound surface modules. |
| Admin protected business read | no public/source implementation | `ADD` | `OWNER_INTEGRATION` → `JOINT_CONFORMANCE` | T-005 owns canonical communication projection source; T-007 owns Admin composition; T-004 owns schema/visibility contract. |
| Surface presenters | generic workflow Card/Mobile/Workbench plus two legacy institution collections | `ADD` | `CONTRACT_PARALLEL` | T-004 adds six `SurfaceEnvelopeV1` presenter contracts; My-Chat retains final rendering. |
| Repository ports | scenario-owned ports with Prisma implementations isolated in `@the-nurture/db` | `REUSE` | `CONTRACT_PARALLEL` | New surface/authority reads MUST use versioned ports; no Prisma or My-Chat ORM in scenario code. |
| T-002 ecology facts | identity anchors/associations and Institution/CareGroup/Enrollment/Grant foundation | `REUSE` | `OWNER_INTEGRATION` | Consumers cite exact owner/source pins and reread current authority; prose/schema existence is insufficient. |
| G2/G3/G4 facts | partial family-care/daily/media facts; no final target contracts | `EXTEND` / `ADD` | downstream branch freeze | T-005/T-006/T-007 own exact domain/schema work after T-004 Contract Boundary. |
| HTTP ingress | local-only Fastify dev host; OpenAPI empty | `ADD` | `OWNER_INTEGRATION` | T-002 builds `apps/scenario-service`, API/env/port contract and removes/hard-disables duplicate P7 ingress after qualification. |
| Synthetic fixtures | in-memory institution ports and workflow journey fixtures | `REUSE` | `CONTRACT_PARALLEL` | T-004 creates a versioned bound synthetic world and independent GJ/RJ initial states. |
| Conformance evidence | module validator, architecture tests and domain tests | `EXTEND` | `CONTRACT_PARALLEL` | Add surface/capability matrix, schema/digest determinism, negative privacy and per-slice evidence. |
| Surface artifact tooling | no schemas, registry, digest builder or conformance manifest | `ADD` | `CONTRACT_PARALLEL` | T-004 Phase 1-4 implement the artifact source set, build/verify commands and qualification. |
| Service Candidate / device evidence | none in T-004 | `DEFER_SAFE` | `ACTIVATION` | T-008 owns Candidate/Binding/composite evidence; T-004 supplies only exact interface artifacts. |

## Six-surface Matrix

| Surface | Reusable input today | Required T-004 contract work | Downstream owner dependency | Current safe behavior |
| --- | --- | --- | --- | --- |
| Guardian Nurture Chat | generic chat summary presenter, safe artifact exposure, family-care canonical facts | child-centered timeline, deterministic discovery, bound-target action cards, `SurfaceEnvelopeV1` | T-005 CareInteraction; T-006 family-facing publication; T-002 owner chain | No protected six-surface capability; ordinary Chat has no business effect. |
| Guardian family board | generic mobile summary pattern, child/family/care-process facts | per-Enrollment modules, provenance, open-write target selection, pagination/cursors | T-005/T-006; T-007 Workflow projection optional where declared | No six-surface board contract; no LLM-selected Institution target. |
| Caregiver Nurture Chat | institution resolver/policy and class work query patterns | role-safe work projection, typed actions, no shared transcript | T-005 G2 A/B/C and exact CareGroup authority | No protected caregiver Chat contract. |
| Caregiver teacher board | class inbox/attention safe reads, daily/media facts | board modules, capture/publish affordances, exact target and source refs | T-005 G2-C; T-006 G3; T-007 publication policy | Existing collection remains display-safe compatibility input only. |
| Institution board (mobile) | Institution/CareGroup facts; no Admin surface presenter | class-first read-only aggregate, Workflow projection, protected Admin-read module with body-safe fence | T-007 G4; T-005 Admin owner-read; T-002 current Admin authority | Capability absent/default-off; no ambient body access. |
| Institution workbench (Web) | generic workflow run workbench pattern only | Hub/List/Insight, InstitutionWorkflow operations, people/daily/communication/knowledge modules | T-007 G4 and My-Chat host runtime | Existing generic Run workbench is not the Institution workbench product contract. |

Cross-surface invariant: a shared canonical fact may produce multiple
role-safe projections, but no presenter may load a cross-role super DTO and hide
fields after the fact. Every protected query/action must route to its canonical
owner and reread current authority.

## Four-layer Owner Gate

| Layer | Owner | Current state | Required evidence before protected use |
| --- | --- | --- | --- |
| Authenticated adult principal / Workspace / active role context | My-Chat | Formal service auth exists; no T-004 public trusted-context invocation carrier exists | Exact trusted-context contract through formal NestJS ingress; service identity remains separate from adult identity. |
| Canonical Child/Family and scenario binding | My-Chat | P7 Host integration was pinned historically; current sibling checkout is drifted | Current exact Host pin, binding lifecycle and negative pair/revoke/recovery evidence. |
| Nurture typed anchor and workspace-local association | T-002 | Schema/repository and formal private owner endpoint exist; M4 governance is complete | Renewed M5 Owner Integration Handoff through formal ingress, current pins and final false/empty census. |
| Nurture current business authority | T-002/T-005/T-006/T-007 by capability | Partial current policies/facts exist | Per-request current Participant/Role/Enrollment/CareGroup/Grant/purpose/source-lifecycle reread and transaction-local effect/Receipt/Execution. |

No layer substitutes for another. In particular, a service token, opaque
binding, `child_id`, Institution membership, cached presenter output or
descriptor eligibility never grants Nurture fact access.

## Surface Contract Artifact Set Landing

Phase 1 uses one scenario-owned, framework-neutral artifact source instead
of adding contract truth to the host or copying implementation types into
My-Chat.

Current layout after Phase 1:

```text
packages/nurture-scenario/
  contracts/surfaces/v1/
    README.md
    source/
      interface/
      capabilities/
      surfaces/
  tests/surface-contract/
```

Phase 2 has added `source/invocation/`, concrete capability registry inputs,
`generated/surface-contract.manifest.json`, `src/surface-contract/` and
`scripts/surface-contract/`. Phase 3 adds fixture inputs; Phase 4 adds the
conformance manifest and qualification cases.

Rules:

- Files under `source/` are the normative machine-readable artifact inputs.
- Once added, `generated/surface-contract.manifest.json` is reproducible output and MUST
  record the exact interface ref, root digest, per-capability/per-surface slice
  hashes and canonical file inventory. Generated output is not part of its own
  digest.
- Phase 2 `src/surface-contract/` owns Nurture-side loaders, typed bindings and
  framework-neutral helpers. It MUST NOT import Prisma, My-Chat ORM/runtime or a
  model provider.
- `tests/surface-contract/` owns schema, binding, determinism, negative and
  fixture tests.
- `scripts/surface-contract/` owns ESM build/verify commands. Phase 2 added
  root commands `build:surface-contract` and `verify:surface-contract` together
  with the exact canonicalization/digest rules; this avoids creating a
  placeholder generated identity in Phase 1. The verifier MUST rebuild in a
  clean `.ai/.tmp/` location, compare checked output and fail on drift.
- My-Chat consumes the exact generated interface through authenticated API
  handoff or generated consumer types. It MUST NOT import
  `@the-nurture/scenario`, read this source directory at runtime or adopt a
  Nurture Candidate bundle.
- Source revision, build time, environment and Candidate identity are
  provenance, not semantic interface-digest inputs.

The initial normative source set will cover:

1. `InterfaceContractRefV1`;
2. `CapabilityDescriptorV1` registry;
3. six `SurfaceEnvelopeV1` schemas and three content-family unions;
4. query/prepare/execute/readResult plus result/error/cursor schemas;
5. policy/schema refs and handler/presenter binding records;
6. versioned synthetic-world and Journey fixture manifests;
7. conformance manifest entries with optional downstream acceptance-item refs.

Phase 1 provides the interface-ref and descriptor schemas, six-surface
registry, atomic envelope/content unions, visibility matrix and shared
readiness/snapshot rules. Phase 2 now provides concrete descriptors, typed
invocation/result/error/cursor artifacts, canonicalization, slice boundaries,
exact root digest and generated manifest. Phase 3-4 still own fixtures and
qualification; the current artifact is not an owner-integration or published
runtime result.

## Work Release Map

### Contract-parallel work now defined

- Build the artifact source/manifest/verification skeleton.
- Define the six-surface visibility matrix and `SurfaceEnvelopeV1`.
- Define descriptor, invocation, result, error, cursor and head-binding schemas.
- Bind current handler/presenter/repository foundations without activating them.
- Build synthetic world, GJ-1～GJ-5/RJ-1 fixtures and deterministic conformance.

### Owner-integration-gated work

- Formal NestJS service-auth/trusted-context ingress.
- Real Child/Family binding and typed association carrier.
- Current Enrollment/CareGroup/Grant/business-authority reads.
- Protected content and Institution Admin business-communication read.
- Transaction/revoke/concurrency/replay/privacy qualification and final
  false/empty census.

### Activation-gated work

- Persistent DB apply outside separately approved disposable qualification.
- Capability/manifest enablement.
- Service Candidate Freeze, environment deployment and My-Chat internal-store
  validation.
- External pilot, production or real traffic.

## Phase 0 Exit Checklist

- [x] Workflow, product, DB and scenario context boundaries were inspected.
- [x] Current capability, entrypoint, handler, policy, presenter, internal API,
  repository and test foundations were inventoried.
- [x] Every six-surface item has an owner, SSOT, source decision and execution
  gate.
- [x] Legacy compatibility semantics that cannot be reused are explicitly
  marked `REPLACE_SEMANTICS`.
- [x] Synthetic default dependencies are mechanically distinguishable from
  real owner integration; they cannot become a runtime fallback.
- [x] The artifact-set repository landing and build/verify responsibility are
  fixed without creating or publishing an artifact.
- [x] Current owner-pin drift, formal-ingress absence and empty OpenAPI are
  recorded as explicit downstream gates.
- [x] No design/demo/route/task-status evidence is treated as authority.
- [x] Final effect census is documentation/governance only.

Phase 0 remains a historical PASS. T-002 ingress M0-M4 and T-004 Phase 1 are
now complete; T-004 remains `in-progress` and the accepted project backbone
continues with Phase 2.
