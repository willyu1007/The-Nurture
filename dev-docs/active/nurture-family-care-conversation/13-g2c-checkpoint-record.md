# G2-C Checkpoint Record — Caregiver Direct Interaction Bridge

## Outcome

- Task: T-005
- Checkpoint: G2-C
- Date: 2026-08-02
- Result: `G2C_CHECKPOINT_PASS`
- Task state: `in-progress`
- Next gate: G2 Exit Qualification
- Non-effects: no persistent DB apply, new migration, deployment, secret change,
  capability activation or traffic authorization

G2-C provider is complete through the formal NestJS Harness ingress. This record
does not claim T-006 consumer adoption, real cross-owner Joint Conformance, Service
Candidate creation or T-005 final Exit.

## Exact contract

- Root: `nurture.surface-contract@1.8.0`
- Digest: `sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a`
- Action: `initiate_caregiver_direct_message@1.0.0`
- Queries: `query_guardian_family_care_timeline@1.1.0`,
  `query_caregiver_family_care_work@1.1.0`,
  `query_family_care_item@1.1.0`
- Typed result: `{ messageRef, receiptRef, contentState: sent }`

The registry contains eleven capabilities. The direct action is an independent
caregiver-initiated capability, not an alias or reverse mode of
`submit_family_care_question`.

## Implemented boundary

- Prepare accepts only closed protected plain text and an owner-issued exact target
  option. Target discovery is bounded and requires a current exact CareGroup
  `caregiver | lead_caregiver`, active Enrollment/Institution/CareGroup/family/thread,
  and a current org-to-family `direct_care_communication` Grant with the frozen
  purpose.
- Target option refs are non-reversible actor/workspace-bound HMAC handles. Raw
  Enrollment/family/CareGroup/Grant identifiers, source body, generated text and
  attachments are not accepted or returned.
- Confirmation binds Enrollment, CareGroup, role, original Grant, thread and safety
  policy heads. Execute re-reads them in the serializable command transaction.
- The canonical effect is exactly one encrypted
  `caregiver_direct_message`, one family-targeted logical Receipt and one immutable
  CommandExecution. No CareItem, ItemEvent or Attention row is created.
- Guardian timeline v2 represents direct communication as a Message-only row with
  `messageRef`; it does not fabricate `careItemRef` or three-axis state. Correction
  and author redaction retain the same Message lineage; withdrawal is unavailable.
- Current original-Grant loss removes protected timeline content and read-result
  access. Immutable exact replay remains body-free.
- Emergency-replacement, diagnostic and prescriptive content is rejected before any
  business fact is created. Human-authored factual care communication remains
  non-diagnostic, non-prescriptive and non-emergency-replacement.

## Quality remediation and cleanup

The post-implementation review found and fixed the following issues before this
checkpoint was accepted:

1. Guardian timeline v1 forced every row through CareItem state. It was replaced by
   one explicit v2 union for CareItem-backed and Message-only rows.
2. Existing query runtime returned `pageInfo` and item detail `replyCount`, while the
   public schemas omitted them. All three query capabilities were rotated together
   to `1.1.0` with result schema `@2`; no compatibility branch or second registry was
   retained.
3. Direct-message correction built the family Receipt target from an absent Item.
   It now uses the canonical Thread family relation.
4. Target-option refs embedded the Enrollment id and a forged supplied option could
   fall back to clarification. Refs are now non-reversible HMAC handles and invalid
   supplied refs fail closed, including the single-target case.
5. Multiple current family/thread rows could be selected by row order. Ambiguous
   family/thread projections now fail closed; target enumeration is bounded and
   batch-loaded.
6. Direct protected content and read-result remained readable after Grant loss.
   Both paths now re-evaluate the original Grant at request time.
7. The surface-contract rotation guard test hard-coded the former root version. It
   now reads the current registry version, preserving the guard without stale
   constants.
8. The formal-ingress self-pin selected only earlier implementation files while the
   service imported unpinned Harness/query code. The unique pin population now covers
   the complete scenario Harness plus the bounded eligibility/query repositories.
9. Confirmation froze only the Grant head, so a different Grant with the same version
   could replace the prepared authority. Confirmation and transaction facts now bind
   and re-read the exact original Grant id; ambiguous current role/thread rows fail closed.

No disposable artifact, alternative G2-C implementation, compatibility registry,
new schema/migration or temporary database is retained.

## Stable acceptance mapping

| Acceptance ID | Evidence |
| --- | --- |
| T005-AC-050 | exact action descriptor/input/result/policy/handler/presenter enters root `1.8.0` |
| T005-AC-051 | exact caregiver/CareGroup/Enrollment/family target and original Grant are re-read at execute |
| T005-AC-052 | canonical transaction creates Message + Receipt + CommandExecution only |
| T005-AC-053 | immutable exact replay returns the original typed result without a second effect |
| T005-AC-054 | guardian timeline v2 projects direct, corrected and redacted Message-only rows |
| T005-AC-055 | correction targets canonical family; withdrawal is not exposed for direct messages |
| T005-AC-056 | raw target/source/grant/attachment, Admin, cross-group and missing disclosure fail closed |
| T005-AC-057 | emergency, diagnostic and prescriptive inputs create no business fact |
| T005-AC-058 | stale Grant head rolls back atomically; revoked Grant removes protected read access |
| T005-AC-059 | query schema/runtime drift and reversible target-option refs are removed without dual-track fallback |

## Verification summary

- Unit: 29 files / 268 tests PASS.
- Scenario service: 8 files / 49 tests PASS.
- Scenario-service disposable PostgreSQL: 2 files / 22 tests PASS; Harness file
  16/16 includes five G2-C cases.
- Production disposable PostgreSQL: 13 files / 86 tests PASS.
- Dual-database dev-host isolation: 11 files / 26 tests PASS.
- Surface conformance: 56/56 synthetic tests, 38 schemas, 11 capabilities,
  26/26 slices and 7 negatives PASS.
- Formal ingress: 7 routes, 8 action keys PASS.
- Nurture self-pin: expanded exact population, 69 files / `0e684436…` PASS.
- Scenario, DB and scenario-service typechecks PASS.
- OpenAPI/API index and context strict verification PASS.
- Root aggregate typecheck and live dependency-pin verification remain external owner
  gates only: local package typechecks pass; the current sibling My-Chat checkout has
  an unrelated `AuditAction` compile error, and current Base `8649e0e` is not frozen
  `06303e9`. No sibling checkout or owner pin was changed.

## Handoff

Proceed to G2 Exit Qualification: bind the current exact `1.8.0` artifact to the
real pinned owner path, run the remaining task-level cross-owner/consumer evidence,
verify the complete single-writer/cutover census, and only then decide whether T-005
can leave `in-progress`. T-006 G3-E must adopt this exact provider separately; this
checkpoint alone does not enable its action.
