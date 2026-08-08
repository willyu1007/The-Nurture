# G4-0 Freeze Ledger

## Status

- Task: T-007
- Stage: G4-0A Freeze Protocol & Fact Inventory
- State: `G4_0A_INVENTORY_PASS` on 2026-08-01; branch implementation and
  qualification remain pending
- Pins rebound on 2026-08-08 after the T-009 rotations — see
  [`07-g4-0a-inventory-record.md`](./07-g4-0a-inventory-record.md) "Pin Rebind".
  The T-002 owner-path row moved from `PRESENT_PINNED` to
  `DEFINED_UNQUALIFIED` as a result; every other rebound row kept its state.
- Restored the same day: the C30 cross-repository landing re-established the
  owner path at current pins, so that row is `PRESENT_PINNED` again. Evidence
  is `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md`.
  Pins advanced once more in that landing — Base `4350086…`, My-Chat
  `51ad97f…`, parity `98f6c241…`, Nurture self-pin `c18ef2e0…`.
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
| Owner/source path | T-002 | Re-established at current pins by `21-c30-landing-requalification-record.md` (`C30_LANDING_REQUAL_PASS`): `verify:owner-integration` green at `1.17.0` / `sha256:d22851d9…` with 25 ingress actions, 8 queries, **0 unexercised**, over formal scenario-service HTTP against real PostgreSQL, both joint journeys PASS. The original M5/G1 records at My-Chat `a019566` / Base `06303e9` / self-pin `b2c53eb7…` remain exact history at their own topology. | `PRESENT_PINNED` (restored 2026-08-08; was `DEFINED_UNQUALIFIED` between the T-009 rotation and this requalification) | 0C～0E, G4-F | owner/source/ingress/pin drift invalidates owner and joint evidence |
| Public Surface baseline | T-004 | `nurture.surface-contract@1.17.0` / `sha256:d22851d98a55299fb4a90f4ff461f6dbeb7ed3f075669ffb19cccb93018acdf8`; shared core `sha256:7bd8a82d…`; 33 capabilities / 6 surfaces (rebound 2026-08-08 from `1.7.0` / `sha256:b7691a81…`) | `PRESENT_PINNED` | 0C～0F, G4-F | public contract/schema/fixture drift invalidates affected synthetic and joint evidence |
| Owner revisions | My-Chat / My-Workflow-Base | My-Chat `df7a273bff65b965da45e2e9604cee3b6b8fc20b` (`x5_joint_api` `30878ba3…`, `wave4_binding_host` `947b4857…`), Base `8a3ea9028d414813994a57ef3501ecad3dd7c434`, parity `8dd53be4…`, Nurture self-pin `c0f97aec…` (rebound 2026-08-08 per D-T009-04) | `PRESENT_PINNED` | 0C～0F, G4-F | any revision/source-pin/parity drift invalidates the affected branch evidence |
| Care interaction | T-005 | exact `CareInteraction`/owner-read/direct-interaction contracts used by Institution consumers | `DEFINED_UNQUALIFIED` | 0C/0D, G4-C/F | provider/version/source lifecycle drift invalidates affected consumer qualification |
| Care/media/publication | T-006 | exact care facts, activity attribution, Board and `PublishProcess` contracts | `DEFINED_UNQUALIFIED` | 0B/0D, G4-B/C/F | fact/schema/policy/source-head drift invalidates affected projections and release evidence |
| Generic Workflow runtime | My-Workflow-Base / My-Chat | pinned Run/Step/worker/ledger/private-carrier contract | `DEFINED_UNQUALIFIED` | 0E, G4-D/F | carrier/runtime/interface drift invalidates Workflow integration evidence |
| Host identity/contact/RAG | My-Chat | pinned auth/session/active-role, Child/Family/contact and generic RAG owner contracts | `DEFINED_UNQUALIFIED` | 0C/0E/0F, G4-A/D/E/F | identity/contact/RAG owner drift invalidates affected owner and joint evidence |
| Institution capability set | T-007 | 0A inventory current; 0B policy contract frozen; 0C～0F exact branch records/outputs missing | `GAP` | G4-A～F | any accepted freeze-record drift reopens the affected branch only |

0A may cite only exact artifacts already qualified by their owner. T-005/T-006 and
the T-007 branch set remain non-pinned until their own implementation/qualification;
My-Chat Workflow/contact/RAG inputs require branch-specific source pins in 0E/0F.

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
| Institution publication timing/policy/head | `NEW`; contract frozen at `nurture.institution-publication-policy@1.0.0`, implementation/schema placement pending | 0B |
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

- T-002/T-004 exact handoffs are `PRESENT_PINNED` because M5, Phase 4 and G1
  Joint Conformance passed at the exact refs above. Later drift invalidates only
  according to their recorded rules.
- T-005 G2-A is implemented, but G2-B owner-read and G2-C direct interaction remain
  `DEFINED_UNQUALIFIED`; T-006 and T-007 implementations remain absent/default-off.
- The workflow Context contract reports formal T-007 adoption pending and migration not activated.
- T-007 public capabilities remain absent/default-off.
- `NurtureEnrollmentStatus` has no `trial`; 0E must preserve the accepted
  `status + participationPhase` separation.
- Missing owner contract, mismatch, stale head, unavailable owner or ambiguous scope fails
  closed; no legacy, inferred-id, cached-authority or weak-auth fallback is permitted.
- G4-0 causes no schema/migration apply, database mutation, manifest/capability change,
  Candidate Freeze or traffic.

## G4-0A Exit Checklist

- [x] Every required input has an exact owner, SSOT, state and consuming branch.
- [x] Every critical fact has one canonical owner and a fact/projection/candidate class.
- [x] Every schema need is classified as `REUSE | EXTEND | NEW | PROJECTION_ONLY | DEFER`.
- [x] Every gap routes to exactly one 0B～0F branch.
- [x] Every unavailable/deferred capability has an explicit default-safe behavior.
- [x] Planned/defined artifacts are not reported as qualified or pinned.
- [x] The final census records zero code, migration apply, activation or traffic effect.
