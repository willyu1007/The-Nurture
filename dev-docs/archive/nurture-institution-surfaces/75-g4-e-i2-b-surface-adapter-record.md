# G4-E I2-B — Institution Knowledge Surface Adapters

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input artifact: `nurture.surface-contract@1.20.0` /
  `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273`
- Verdict: `G4_E_I2_B_SURFACE_ADAPTER_QUALIFIED`
- Effect boundary: synthetic/default-off internal adapter composition only

## Implemented boundary

- Added one closed adapter request union for the preview query, effectful answer
  action and five lifecycle actions. Every external DTO is validated before
  trusted owner resolution; caller-supplied Workspace, actor, role, Institution,
  item head, source snapshot and currentness fields are rejected.
- The authoring validator reuses the I1 body validator for the canonical 8,192
  UTF-8 byte cap and unique section keys. It separately enforces the exact wire
  metadata, UTC-instant applicability order and opaque source-option bounds.
- One binding port resolves the actor-bound target, action confirmation,
  current Admin/Institution scope, expected item head and complete authority-
  source snapshots. Capability, target, confirmation, Workspace and actor must
  round-trip exactly or the adapter fails unavailable.
- Five lifecycle actions pass their exact existing `NurtureCommandSpec` to one
  command executor. Preview calls the existing I1 preview provider. Answer
  remains on the command lane and invokes the exact I1 answer orchestration over
  injected retrieval/currentness/generation/safety/candidate owner ports.
- Presenters convert private snake-case facts into the I2-A wire DTOs, issue
  actor-bound item/revision option refs and preserve exact citation/source/
  safety labels. Private item/revision refs never appear as public target refs.

## Default-off composition

- The scenario module registers exactly
  `nurture.internal.query_institution_knowledge` and
  `nurture.internal.execute_institution_knowledge`. Their immutable default
  dependencies return `institution_knowledge_runtime_unavailable` before any
  preview, command, retrieval, model or candidate operation.
- The canonical manifest declares only the Web Workbench composition at
  `contract_version: 1.0.0` with `enablement_policy: disabled`. Chat and mobile
  receive no Institution Knowledge composition.
- Neither internal key appears in `internal_api.routes`; the seven public
  descriptors remain in the formal-ingress unrouted census. I3 alone may add
  authenticated formal ingress after Q2–Q4 close.
- No My-Chat owner implementation, safety/model provider, DB operation,
  deployment, activation or traffic was added.

## Quality review and repairs

| Priority | Finding | Repair |
| --- | --- | --- |
| Must | The first adapter validator treated applicability values as calendar dates, while the private I1 contract and I2-A schema require exact UTC instants. | Reused the I1 body validator and aligned `validFrom`/`validUntil` with the I1 instant validator and strict ordering. |
| Must | The effectful answer accepted a confirmation ref but the prepared binding did not prove which confirmation was resolved. | Added exact confirmation round-trip to the owner binding; queries forbid it and every action requires it. |
| Should | An initial citation presenter used a revision number as an item version when the I1 citation does not carry an item head. | Issue a current item option without inventing a head; revision options retain the exact revision number. |
| Should | The E5 historical suite still prohibited every module/manifest handler. | Replace the stale absence assertion with the exact two-handler, Workbench-only, disabled and no-formal-route boundary. |
| Should | Adapter-local body validation duplicated I1 size and section rules. | Delete the duplicate implementation and call `validateInstitutionKnowledgeBody` directly. |

No finding remains open. The adapter is not exported from the public package
barrel, and no compatibility handler, formal route, temporary fixture, second
ledger or alternate Knowledge runtime remains.

## Qualification

- Dedicated adapter suite: PASS, 7/7 for pre-binding validation, all five exact
  command-spec mappings, authority snapshot resolution, preview/answer I1
  delegation, cited presentation, denial/drift and immutable default-off
  composition.
- Full unit: PASS, 951/951 across 86 files.
- Root direct TypeScript and scenario package typecheck: PASS.
- Synthetic Surface Contract: PASS, tooling 5/5 and Vitest 139/139 across 14
  files; 19 cases cover 80/80 slices with seven negatives.
- Test routing, persistence, port topology, formal ingress, G2 exit/census, G3
  freeze, exact generic owner pin and generated-manifest checks: PASS.
- Strict task docs 127/127, Context, project-state and project governance:
  PASS with zero task-doc warnings.
- Database: not run and not needed. E6 changes no schema/repository and the E4
  disposable target remains destroyed.

## Next gate

E7/E8 cannot start honestly until Q2 identifies an adopted My-Chat revision,
Q3 identifies a qualified deterministic safety owner and rule pin, and Q4
authorizes or externally supplies the required sibling-repository deltas. The
moving checkout and synthetic adapters cannot satisfy those gates.
