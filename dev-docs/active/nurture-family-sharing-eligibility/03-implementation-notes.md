# T-010 implementation notes

## Status

- Current status: `in-progress`
- Last updated: 2026-08-11

## What changed

### 2026-08-11 — I4-C0 task and design freeze

- Created an independent task rather than reopening T-009 or attaching the
  cross-owner authorization path to T-002/T-007 G4 work.
- Adopted a dedicated authority model for all three categories. Existing
  ChildLink Grant values remain unchanged and are not a fallback reader.
- Split release and receiving policy into exact axis rows, made an exact signed
  target selector mandatory and made multi-enrollment ambiguity unavailable.
- Bound private transport to existing C30 verification/trust/nonce primitives
  while keeping it out of the generic Harness action API.
- Bound withdrawal cleanup to Nurture-derived media/focus stores. No current
  production data path or positive provider was enabled.

## Files/modules touched

- `dev-docs/active/nurture-family-sharing-eligibility/`
- `.ai/project/main/registry.yaml`
- `.ai/project/main/feature-map.md`
- `.ai/project/main/dashboard.md`

## Decisions and tradeoffs

- Decision: create T-010 under a distinct cross-owner authorization feature.
  - Rationale: T-009 is a completed released-material provider; G4 owns
    institution surfaces. Reusing either would create misleading ownership and
    status coupling.
  - Alternatives considered: reopen T-009 or attach to T-007. Both were
    rejected as scope conflation.
- Decision: use a dedicated authority fact instead of adding media/focus Grant
  enum values.
  - Rationale: existing Grants authorize care-delivery data classes, not this
    exact cross-owner category/purpose boundary. No safe backfill exists.
  - Alternatives considered: map `child_growth_record` or direction-only
    Grants. Both are semantically under-specified and fail the independent
    review.

## Deviations from plan

- None.

## Known issues and follow-ups

- Prisma model spelling, lifecycle-head mappings and cleanup ledger reuse need
  schema review before code changes.
- Private operation registration needs a C30/surface-contract classification
  decision before transport code.

## Pitfalls and dead ends

- Keep the detailed append-only log in `05-pitfalls.md`.

## 2026-08-12 I4-C1 schema, domain and ports (review-only)

- Added the dedicated category-authority persistence draft:
  `NurtureFamilySharingAuthority` + `NurtureFamilySharingPolicy` with new
  `NurtureFamilySharing*` enums (not the Grant vocabulary), named `Restrict`
  FKs to process/family/enrollment/role-assignment, and provenance
  (authorizing role + role-assignment id, authority/policy versions,
  effective/expiry/revoke lifecycle). Purpose is column-bound and CHECKed to
  `family_nurture_sharing_authorization`.
- The exactly-one-current guarantee lives in partial unique indexes
  (`WHERE status = 'active'`, per scope+category, policies additionally per
  axis); expiry is temporal, writers supersede/revoke in one transaction, and
  the migration is committed preview-only — no database was written.
- Domain layer (`domain/family-sharing/authority-records.ts`): record types
  and `NurtureFamilySharingAuthorityRecordReadPort` with fail-closed
  cardinality for the C2 reader; no Prisma import.
- Cleanup command/receipt table deliberately not drafted: the
  `NurtureCommandExecution` reuse argument belongs to the C3 transport
  design.
- `docs/context/db/schema.json` regenerated; workflow-contract self-pin
  rotated (`003cbe81…`, 281 files).

## 2026-08-12 I4-C1 post-review rework (independent Codex pass, 5 findings addressed)

- Composite FKs replace the single-column FKs: rows now bind
  `(workspace_id, child_care_process_id)` → process,
  `(…, family_id)` → family, `(…, enrollment_id)` → enrollment and
  `(workspace_id, authorizing_role, authorizing_role_assignment_id)` → role
  assignment, backed by four additive unique indexes on the anchor tables —
  cross-workspace/cross-process references and role-provenance mismatch are
  now structurally impossible, not just reader-checked.
- Currentness definition corrected to include `effective_from <= evaluated_at`
  (a future-effective active row is not current), and the slot semantics
  restated honestly: the partial uniques guarantee AT MOST ONE active row;
  writers retire the occupied slot atomically (including after unattended
  natural expiry) and existence stays a reader decision.
- New static verifier `pnpm verify:family-sharing-invariants` pins the
  hand-authored CHECKs/partial uniques/composite FKs that the generated DB
  context cannot represent.
- C30 Step 5 prose, feature-map and dashboard checkpoints reconciled with the
  drafted state. The sixth finding (decision-identity alignment in the
  My-Chat currentness port) was fixed on the My-Chat side (`0400c4c`,
  `ec9f298`).
