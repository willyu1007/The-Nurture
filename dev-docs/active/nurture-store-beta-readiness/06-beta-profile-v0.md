# Six-surface Beta Profile v0

## Identity and Status

- Planning identity: `nurture.six-surface-beta-profile@0.1.0`
- Frozen: 2026-08-01
- State: `FROZEN_PLANNING_INPUT`
- Owner: T-008
- Qualification authority: none

This profile fixes the first internal-beta required/optional boundary before the
remaining G2～G4 implementation. It is not a Service Candidate, qualification
record, deployment binding, activation gate or traffic authorization.

## Exact G1 Baseline

- Surface contract: `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`
- My-Chat owner pin: `a0195662228a2fc6323b9ea0cd327d3608d8cc17`
- My-Workflow-Base pin: `06303e9f404e4ccc0ba3054b763675efe81b5b15`
- Current Nurture owner/source pin:
  `b2c53eb7d35e315e5d319ab341d7ca31779c1bf848a0c24824a64ecdbb59a4a8`
- G1 record:
  `dev-docs/active/nurture-institution-mode/18-g1-joint-conformance-record.md`

Later interface or owner drift must be handled through the owning task's exact
version/digest rotation and affected qualification; these values are baseline
inputs, not floating aliases.

## Required Six-surface Capability Set

| Surface | Minimum required product path |
| --- | --- |
| Guardian Nurture Chat | family-private ordinary chat with zero business write; role-safe family-care timeline/detail; explicit submit; current reply/receipt; correction, withdrawal and author redaction |
| Guardian family board | child-centered authorized projection; exact Enrollment target selection for open writes; family-care actions; published-care continuity with provenance |
| Caregiver Nurture Chat | exact CareGroup work/detail; acknowledge and append-compatible reply; dedicated G2-C caregiver-initiated direct interaction with empty protected composer |
| Caregiver teacher board | shared role-safe board; deterministic capture-to-draft; manual child attribution/content safety; per-target publish/release; safe routing to G2-C |
| Institution mobile board | explicit active Admin role; class-first read-only aggregate; current attendance state; communication/attention and safe Workflow projection without private-body aggregation |
| InstitutionAdminWorkbench | people/relationships and daily operations; exact business-communication owner-read; responsibility queues; complete Enrollment Journey; versioned source-cited Institution Knowledge/RAG |

Every required path includes current authority reread, exact contract admission,
role/workspace/Institution/CareGroup isolation, revoke/redaction behavior,
idempotency/concurrency/recovery, formal NestJS ingress, real pinned owner-path
qualification and final false/empty cleanup.

## Required Stage Inputs

### T-005 / G2

- G2-A Core CareInteraction Loop.
- G2-B correction/withdrawal/redaction plus Institution Admin owner-read.
- G2-C dedicated `initiate_caregiver_direct_message@1.0.0` provider path.
- Legacy single-writer cutover and final G2 Exit Qualification.

### T-006 / G3

- G3-A shared board foundation, excluding the optional Workflow board module.
- G3-B1 deterministic teacher-text/transcript/template/photo-only capture-to-draft.
- G3-C1 manual attribution, exposure and content-safety fallback.
- G3-D PublishProcess and per-target PublicationRelease.
- G3-E exact G2-C and T-007 publication-policy integration qualification.

### T-007 / G4

- G4-A authority/aggregate foundation.
- G4-B Admin mobile read-only and caregiver attendance paths.
- G4-C InstitutionAdminWorkbench Core.
- G4-D complete `EnrollmentJourneyWorkflowV1` path.
- G4-E at least one eligible, published, source-cited Institution Knowledge/RAG
  positive path plus medical-conflict abstention.
- G4-F exact formal integration and Beta Profile Handoff.

## Optional-absent / Default-off

| Capability | v0 posture | Required fallback |
| --- | --- | --- |
| G3-B2 generative AI copy | `optional_absent` | teacher original text, provenance-bearing transcript, versioned template or photo-only draft |
| G3-C2 `ClassScopedFaceMatch` | `optional_absent` | manual exact-CareGroup child attribution and needs-review path |
| T-006 Workflow board module | `optional_absent` | legal absent/empty module; Institution Workflow remains available on its owned Institution surfaces |
| AI attention candidate | `optional_absent` | deterministic support signals and explicit source actions |
| Bulk roster/invite | `optional_absent` | single explicit commands |
| Unapproved family-share projection | `optional_absent` | Institution-only knowledge visibility |
| External communication connector/transcript | `optional_absent` | Admin-authored structured summary with opaque contact reference |

Optional absence may complete the upstream task only when the fallback is qualified,
fail-closed and does not remove a required six-surface path.

## T-002 Owner/source Subset Required Before Candidate Freeze

- authenticated trusted caller/Workspace context with service identity separate
  from the adult actor;
- canonical Child/Family binding-owner path and opaque Nurture association;
- Participant/RoleAssignment/Institution/CareGroup/Enrollment/Grant current
  authority reread;
- transaction-atomic reservation/Execution/Receipt semantics, replay and
  response-loss recovery;
- revoke, correction/redaction visibility fences, cross-Institution isolation and
  owner-unavailable/contract-mismatch failure closure;
- formal NestJS scenario-service ingress, exact source pins and final false/empty
  evidence for every consumed protected path.

This subset does not include Pilot-1 publication, production/external traffic or
real-user activation.

## Change and Failure Rules

- Any `optional_absent → required` change creates a new profile version and an
  explicit impact analysis for affected G2～G5 evidence.
- A failed or missing required path cannot be reclassified as optional in the
  same qualification attempt.
- Contract/schema/owner drift routes to the smallest owning task and invalidates
  affected evidence append-only; historical results are never rewritten.
- G5-0 may confirm or supersede this planning profile, but it cannot silently
  widen or narrow it.
