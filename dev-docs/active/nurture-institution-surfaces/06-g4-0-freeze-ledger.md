# G4-0 Freeze Ledger

## Status

- Task: T-007
- Stage: G4-0A Freeze Protocol & Fact Inventory
- State: structure accepted; inventory pending
- This ledger records planning/readiness truth only. It is not an Owner Integration
  Handoff, Joint Conformance record, Beta Profile Handoff or activation authority.

## Inventory States

| State | Meaning |
| --- | --- |
| `PRESENT_PINNED` | Exact artifact/version/digest exists and the cited consumer may use it |
| `DEFINED_UNQUALIFIED` | Semantic/contract requirement is defined, but qualified artifact or exact pin is not yet available |
| `GAP` | Required owner contract, schema, implementation or evidence is missing |
| `DEFERRED_SAFE` | First increment explicitly keeps the capability absent/default-off |
| `NOT_APPLICABLE` | The source does not own or supply this responsibility |

Documentation acceptance alone cannot produce `PRESENT_PINNED`.

## 0A-1 Dependency Pin Ledger

| Input | Owner | Required artifact/ref | Current state | Consumer | Drift/invalidation |
| --- | --- | --- | --- | --- | --- |
| Owner/source path | T-002 | `Owner Integration Handoff` with exact pins, formal ingress and final false/empty evidence | `DEFINED_UNQUALIFIED` | 0C～0E, G4-F | owner/source/ingress/pin drift invalidates owner and joint evidence |
| Public Surface baseline | T-004 | `Surface Contract Artifact Set` with exact interface ref, schemas, registry, fixtures, manifest and digest | `DEFINED_UNQUALIFIED` | 0C～0F, G4-F | public contract/schema/fixture drift invalidates affected synthetic and joint evidence |
| Care interaction | T-005 | exact `CareInteraction`/owner-read/direct-interaction contracts used by Institution consumers | `DEFINED_UNQUALIFIED` | 0C/0D, G4-C/F | provider/version/source lifecycle drift invalidates affected consumer qualification |
| Care/media/publication | T-006 | exact care facts, activity attribution, Board and `PublishProcess` contracts | `DEFINED_UNQUALIFIED` | 0B/0D, G4-B/C/F | fact/schema/policy/source-head drift invalidates affected projections and release evidence |
| Generic Workflow runtime | My-Workflow-Base / My-Chat | pinned Run/Step/worker/ledger/private-carrier contract | `DEFINED_UNQUALIFIED` | 0E, G4-D/F | carrier/runtime/interface drift invalidates Workflow integration evidence |
| Host identity/contact/RAG | My-Chat | pinned auth/session/active-role, Child/Family/contact and generic RAG owner contracts | `DEFINED_UNQUALIFIED` | 0C/0E/0F, G4-A/D/E/F | identity/contact/RAG owner drift invalidates affected owner and joint evidence |
| Institution capability set | T-007 | exact G4 freeze records and branch outputs | `GAP` | G4-A～F | any accepted freeze-record drift reopens the affected branch only |

Exact revisions, versions and digests remain TODOs for 0A implementation. They must not
be inferred from task prose.

## 0A-2 Fact Ownership Matrix

| Fact/capability | Canonical owner | Type |
| --- | --- | --- |
| Account, session, Workspace membership and active-role shell evidence | My-Chat | host fact/evidence |
| Platform Child/Family, stewardship/membership and scenario binding | My-Chat | platform fact |
| Participant, RoleAssignment, Institution, CareGroup, Enrollment and Grant | Nurture / T-002 | scenario-local fact |
| Family-care communication and its lifecycle | Nurture / T-005 | scenario-local fact |
| Care/media/activity attribution, Board and `PublishProcess` | Nurture / T-006 | fact plus derived projection |
| InstitutionWorkflow business stage, eligibility and safe projection | Nurture / T-007 | business fact plus projection |
| Run/Step/worker/ledger and generic durable carrier | My-Workflow-Base / My-Chat | host runtime fact |
| Institution knowledge semantic, revision and publish policy | Nurture / T-007 | scenario-local fact |
| Generic search/vector/model/RAG runtime | My-Chat | host runtime |

Routing ids, bindings, projections, candidates and audit evidence never grant authority by
themselves.

## 0A-3 Schema Delta Inventory

| Concept | Initial classification | Freeze owner |
| --- | --- | --- |
| Existing Institution/CareGroup/RoleAssignment/Enrollment/Grant ecology | `REUSE` pending exact field/index verification | 0C/0E |
| Enrollment `participationPhase=trial|formal` | `EXTEND`; do not add a `trial` main status | 0E |
| Admin/mobile aggregate, support and Workflow views | `PROJECTION_ONLY` unless a later record proves a canonical lifecycle requirement | 0C/0D/0E |
| AI attention | `DEFER`; absent/default-off | 0D |
| Family-share projection without approved schema/consent | `DEFER`; Institution-only | 0C/0F |
| Bulk roster/invite | `DEFER`; first increment uses single explicit commands | 0C |

Exact new aggregates, fields, indexes and migrations remain owned by 0B～0F. 0A records
their destination and cannot invent their schemas.

## 0A-4 Branch Input Map

| Input/gap class | Sole freeze destination |
| --- | --- |
| publication timing/policy/head | 0B |
| active role, Institution/scope/Grant, Surface and communication owner-read | 0C |
| attendance, class schedule/activity/revision/attribution and support signal | 0D |
| Workflow registry/carrier/projection plus Enrollment Journey lifecycle | 0E |
| knowledge lifecycle, retrieval, citation and conflict policy | 0F |

One exact schema gap cannot be independently designed by multiple branches.

## 0A-5 Drift and Default-safe Census

Current baseline:

- T-002/T-004 delivery roles are defined, but exact handoffs must not be marked
  `PRESENT_PINNED` until their own gates pass.
- The workflow Context contract reports formal adoption pending and migration not activated.
- T-007 public capabilities remain absent/default-off.
- `NurtureEnrollmentStatus` has no `trial`; 0E must preserve the accepted
  `status + participationPhase` separation.
- Missing owner contract, mismatch, stale head, unavailable owner or ambiguous scope fails
  closed; no legacy, inferred-id, cached-authority or weak-auth fallback is permitted.
- G4-0 causes no schema/migration apply, database mutation, manifest/capability change,
  Candidate Freeze or traffic.

## G4-0A Exit Checklist

- [ ] Every required input has an exact owner, SSOT, state and consuming branch.
- [ ] Every critical fact has one canonical owner and a fact/projection/candidate class.
- [ ] Every schema need is classified as `REUSE | EXTEND | NEW | PROJECTION_ONLY | DEFER`.
- [ ] Every gap routes to exactly one 0B～0F branch.
- [ ] Every unavailable/deferred capability has an explicit default-safe behavior.
- [ ] Planned/defined artifacts are not reported as qualified or pinned.
- [ ] The final census records zero code, migration apply, activation or traffic effect.
