# Pilot-0-C Current Decision Index

## Current outcome

Pilot-0-C is **decision-complete, implementation-open, and external-traffic
NO-GO**.

- Product/domain/cross-repository design review: `DR-P0=0 / DR-P1=0 /
  DR-P2=0` after the 2026-07-20 clarity repair.
- Traffic readiness: six open `TR-P0` blockers and three open `TR-P1`
  blockers remain in `09-pilot-readiness.md`; D separately classifies
  `TR-P1-3a-native-external-delivery` as an accepted scope exclusion, not an
  implemented capability.
- Candidate qualification: every future C-3/C-4 candidate MUST have zero open
  `QR-P0/QR-P1` findings before the candidate can become
  `qualified_default_off`.
- C-3/C-4/D implementation, complete-candidate assembly, Pilot-0-E, Pilot-1
  through Pilot-4, database apply, artifact publication, secrets,
  capability/allowlist changes, and any external traffic remain separately
  unauthorized. Pilot-0-D design is now locked in the separate D source below.

`DESIGN COMPLETE / IMPLEMENTATION OPEN` means the product decisions,
ownership, invariants, implementation order, and evidence requirements are
closed. That state does not mean the shared types, My-Chat owner APIs, Nurture
schema, routes, runtime, deployment, or activation have been implemented.

## Reader path and source precedence

Use the following order. A lower row MUST NOT override a higher row.

| Priority | Source | Purpose |
| --- | --- | --- |
| 1 | Repository `AGENTS.md` | Repository ownership and safety invariants. |
| 2 | `docs/context/workflow/nurture-scenario-contract.md` | Exact current cross-repository Nurture workflow and identity contract. |
| 3 | `10-pilot0-c-current-decision-index.md` | Current Pilot-0-C status, taxonomy, decisions, and implementation gates. |
| 4 | `11-pilot0-d-topology-operations-contract.md` | Current Pilot-0-D topology, operations, candidate, stage, and observation decisions; it does not override C business/domain decisions. |
| 5 | `09-pilot-readiness.md` | Detailed decision ledger and rationale for B/C/D checkpoints. |
| 6 | `02-architecture.md`, `06-ib-nurture-schema-spec.md`, `08-iia-schema-policy-test-design.md` | Architecture, schema, and test projections of the higher-priority sources. |
| 7 | `03-implementation-notes.md`, `04-verification.md`, `05-pitfalls.md` | Chronological evidence and historical lessons. |

Historical text remains evidence of how a decision converged. When historical
wording conflicts with the current contract or decision index, the current
contract and decision index control. Future edits SHOULD link to the exact
contract instead of restating complete wire shapes in multiple projections.

## Severity namespaces

| Namespace | Meaning | Current state |
| --- | --- | --- |
| `DR-P0/DR-P1/DR-P2` | Defects found while reviewing the Pilot-0-C design documents. | `0/0/0` after the clarity repair. |
| `TR-P0/TR-P1` | Missing implementation or operational capability that blocks real traffic. | `6/3`; see `09-pilot-readiness.md`. |
| `QR-P0/QR-P1` | Findings against one immutable C-3 or C-4 qualification candidate. | No candidate exists; qualification is unauthorized. |

Unqualified `P0`, `P1`, or `P2` MUST NOT be used in current Pilot-0-C status
or exit criteria.

## Locked product scope

- The Pilot cohort is one synthetic Workspace, one Institution, one initial
  CareGroup, three child scopes, three independent families, four Guardian
  accounts distributed `2 + 1 + 1`, one Institution Admin, one human
  Caregiver/Lead, and one refs-only Technical Operator.
- The first business data class is one Guardian-authored protected plain-text
  `family_care_question`, without attachments. Explicit Caregiver acknowledge
  and one Caregiver-confirmed reply are required.
- Guardian surfaces are Nurture Chat, family board, and family workbench.
  Caregiver surfaces are Nurture Chat and teacher board. Institution surfaces
  are the read-only institution board and authoritative institution workbench.
  Technical Operator has only My-Chat technical Admin access.
- `caregiver_daily_care`, `child_media_attribution`, attachments, protected AI,
  multi-Caregiver handoff, bulk action, Institution Chat, ranking, external
  families, and real provider recipients remain outside the first Pilot.

## Locked owner and identity boundary

My-Chat owns account/auth, shared `child_id` and `family_id`, stewardship,
membership, `FamilyChildMembership`, scenario bindings, shell, Workflow
Run/Step/Handoff/Outbox, Notification, and technical recovery. Nurture owns its
local Child profile, ChildCareProcess, child-scoped Family, Participant,
RoleAssignment, Enrollment, Grant, content, policy, and care lifecycle.

The canonical opaque binding is one two-owner chain:

```text
My-Chat child_id/family_id
  -> My-Chat scenario binding with typed ownerRef
  -> Nurture scenario-global typed anchor
  -> Nurture workspace-local association
  -> Nurture local Child/ChildCareProcess/child-scoped Family
```

The chain is the repository rule's opaque binding to the local child. Nurture
MUST NOT persist raw My-Chat `child_id`, `family_id`, binding id, membership id,
or protected platform identity fields. The typed anchor and local association
MUST NOT be interpreted as a second platform identity or as authorization.

Every protected read, command, delivery, retry, and open requires both:

1. current My-Chat binding, exact Child/Family membership, and required adult
   membership evidence; and
2. current Nurture workspace association, Participant, RoleAssignment,
   ChildCareProcess/Family, Enrollment, Grant, purpose, policy, source, and
   destination evidence.

Either owner being stale, revoked, ambiguous, unavailable, or mismatched fails
closed without existence leakage.

## My-Chat owner API minimum contract

`platform_child_family_identity_source_v1` MUST contain one completed,
versioned My-Chat owner API family with these closed responsibilities:

1. Resolve or create a parent/steward-authorized platform Child/Family pair
   and reread the exact `FamilyChildMembership` plus both scenario-binding
   heads.
2. Commit or exact-replay all missing Child/Family scenario bindings in one
   My-Chat transaction against expected heads and typed Nurture owner refs.
3. Issue short-lived, signed, audience-bound current binding evidence to the
   Nurture private boundary. The evidence contains Workspace/scenario,
   operation/purpose, typed Child/Family anchor refs, a non-reversible current
   owner-evidence hash, issue/expiry time, key id, and signature. The evidence
   contains no raw platform id, binding id, membership id, PII, role, Grant, or
   dossier field.
4. Recheck current binding, pair membership, and adult membership before every
   Host route, delivery, retry, and open. Cached evidence never fills an owner
   outage or extends authorization.
5. Return only closed `current|unavailable` routing outcomes to ordinary
   callers. Wrong kind/head/pair, revoke, archive/delete, merge ambiguity,
   signature/key failure, expiry, or owner outage is unavailable and cannot
   trigger an alternate-id, PII-match, or legacy fallback.

The exact reusable Base envelope/type names and the concrete My-Chat HTTP/port
shape are C30-I1/I2 implementation deliverables. C-3 cannot freeze or qualify a
candidate until those artifacts, My-Chat runtime/API behavior, Nurture
anchor/association adapters, and joint conformance are implemented, immutable,
and pinned under `platform_child_family_identity_source_v1`.

## Locked onboarding order

1. My-Chat authenticates the adult and establishes the exact Workspace.
2. Institution intake may create only a RosterEntry and Enrollment Invitation
   intent/shell. Institution actors cannot create, select, infer, or merge a
   platform or local Child/Family.
3. The invited adult explicitly creates or selects the platform Child/Family
   pair under current My-Chat authority.
4. The durable identity operation resolves both bindings, reserves only
   missing typed anchors, commits all missing bindings atomically in My-Chat,
   then commits the local associations and first Guardian relationship in one
   Nurture transaction.
5. Enrollment confirmation is a separate Nurture transaction. Grant/Thread
   confirmation is later and separate again.

Response loss reuses the same durable operation. `outcome_unknown` blocks
replacement work until the writer-fenced status lookup resolves
`committed|confirmed_no_effect|unknown`. Invitation cancellation or expiry
never compensates identity or local relationship facts already committed by
their owners.

## Implementation and qualification order

- C-3: strict `C30 -> C31 -> C32 -> C33 -> C34 -> C35`.
- C-4 may start only after the current C-3 resolver returns
  `C3_QUALIFIED_DEFAULT_OFF` for one immutable candidate containing the
  qualified `platform_child_family_identity_source_v1`.
- C-4: strict `C40 -> C41 -> C42 -> C43 -> C44 -> C45`.
- C-3 success is only `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING /
  EXTERNAL_TRAFFIC_NO_GO`.
- C-4 success, evaluated after the later D design lock, is only
  `C4_QUALIFIED_DEFAULT_OFF / PILOT0_D_DESIGN_LOCKED /
  COMPLETE_PILOT_CANDIDATE_PENDING / EXTERNAL_TRAFFIC_NO_GO`.

No node may be skipped, qualified from design evidence, run against mutable
source, or activate a Workspace. Candidate changes invalidate every affected
downstream evidence edge.

## Next stage boundary

Pilot-0-D is design-locked in
`11-pilot0-d-topology-operations-contract.md`. The next permitted work is a
separately scoped implementation-readiness review or separately authorized
C-3/C-4/D implementation. It is not candidate assembly, Pilot-0-E, Pilot-1,
database/artifact/secret/environment creation, activation, or traffic. The
current detailed traffic blockers remain in `09-pilot-readiness.md`; Pilot-0 is
not complete until implemented inputs produce the complete candidate and
Pilot-0-E reaches an explicit decision.
