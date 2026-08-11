# Phase 3 Decomposition — Synthetic World, Journeys and Selection Fixtures

## Outcome

- Task: T-004
- Slice: Phase 3 execution decomposition (planning only)
- Prepared: 2026-07-31
- Baseline: exact `nurture.surface-contract@1.0.1` /
  `sha256:ee3f83626f6b948ae3e8791890c0c6fafcb2a2c7c4523500cee7c71cf3837f59`
- Result: five increments `P3-0 … P3-4`, each landing as an independently
  verified unit with a commit point.

Phase 3 is My-Chat-independent by construction: every artifact is synthetic
and contract-local. The parallel T-002 pin-advance decision
(`../nurture-institution-mode/15-mychat-drift-census-pin-advance-input.md`)
does not gate any increment below. Synthetic PASS never claims owner
integration; all protected capabilities stay default-off.

## Boundary Rules (frozen before implementation)

1. A journey proves exactly one user-value loop plus one highest-risk refusal
   path. A case that does not change the journey's narrative outcome goes to
   the Phase 4 conformance matrix, never into the journey script.
2. Journeys share one versioned synthetic world definition but each derives an
   independent, repeatable initial state; no journey consumes another
   journey's mutable output.
3. Capability selection fixtures are their own fixture family, not journey
   steps.
4. Full role × action × surface enumeration belongs to the Phase 4 conformance
   manifest (per-slice hashes); acceptance back-links use the manifest's
   optional acceptance-item reference field (for example `T005-AC-###`).
5. Fixture increments may only add steps that the Phase 3 plan or a journey's
   frozen description names; newly discovered cases are appended to the
   matrix backlog inside the fixture manifest, not to journey scripts.
6. Phase 3 MUST NOT modify the shared invocation/confirmation/concurrency or
   error envelope layer (`changedSharedCore` invalidates all evidence). If an
   envelope change proves necessary, implementation stops and the change is
   raised as an explicit decision, not silently edited.

## Increments

### P3-0 — Synthetic World Source Freeze

Add `contracts/surfaces/v1/source/fixtures/world/`:

- `synthetic-world.schema.json` — typed world definition: participants,
  children, child-care processes, families, guardians, institutions, care
  groups, enrollments, grants, role assignments. Synthetic namespaced IDs
  (`syn-…`) only; a PII lint forbids realistic names, dates of birth,
  addresses, phone/email shapes.
- `world-v1.json` — the canonical population:
  - Family `F1` with two guardians; child `C1` with one bound
    ChildCareProcess.
  - Two isolated Institution Enrollments for `C1`: institution `IA`
    (care group `IA-G1`, one caregiver, one lead caregiver) and institution
    `IB` (care group `IB-G1`, one caregiver). Isolation is a first-class
    assertion: nothing in `IA` scope references `IB` or vice versa.
  - Family `F2` with child `C2` enrolled only at `IA` — the
    cross-family-isolation control.
  - Readiness-axis variants: one enrollment pre-grant, one with a current
    family-care grant, supporting `ready | limited | needs_setup`
    envelope states without mutating the base world.
- `profile-single-institution.json` — the pilot profile view selecting `IA`
  only, proving deterministic convergence to a unique enrollment target.

DoD: schema validates the world; determinism test (double serialization is
byte-identical); PII lint green; no generated artifact rotated yet.

### P3-1 — Per-Journey Initial States

Add `source/fixtures/journeys/<journey>/initial-state.json` for GJ-1…GJ-5 and
RJ-1, each derived deterministically from `world-v1` plus a journey overlay
(actor set, active grants, pre-existing threads/items where the journey needs
them). A structural test asserts pairwise independence: no initial state
references an artifact produced by another journey.

### P3-2 — Journey Scripts (value loop + highest-risk refusal)

Add `source/fixtures/journeys/<journey>/script.json` +
`expected/<step>.json` snapshots. Frozen mapping:

| Journey | Value loop (V1 capabilities / surfaces) | Highest-risk refusal |
| --- | --- | --- |
| GJ-1 family concern → caregiver | `submit_family_care_question` (guardian chat + family board) → `query_caregiver_family_care_work` → `acknowledge_family_care_item` → `reply_family_care_item` → `query_guardian_family_care_timeline` | Submit against the pre-grant enrollment: fail closed, no partial write, `needs_setup` affordance |
| GJ-2 care routine → family | Caregiver `reply_family_care_item` append flow → guardian timeline + family board projection | Reply from a caregiver outside the exact bound care group: refused |
| GJ-3 multi-source continuity | `query_guardian_family_care_timeline` aggregating both authorized enrollments of `C1` | Aggregate never leaks an unauthorized source; `IA` surfaces cannot infer `IB`'s existence |
| GJ-4 enrollment/confirmation/grant | Readiness-axis progression rendered through envelope states (`needs_setup → limited → ready`); first eligible write after grant | Any write before the grant axis is satisfied is ineligible, not queued |
| GJ-5 institution philosophy → daily support | Institution workbench + institution board envelope snapshots consuming `InstitutionWorkflowProjection`; caregiver board consumption | Institution-admin owner-read never yields a CareGroup action affordance (T-007 D-04 separation) |
| RJ-1 revoke/correct/recover | `withdraw_family_care_request`, `correct_family_care_message`, `redact_family_care_message`, `policy_redact_family_care_message`; post-revoke recovery | Post-revoke write refused; correction/redaction never silently rewrites history (append-only lineage visible) |

Notes:

- The closed ten-capability V1 registry is family-care only. GJ-4/GJ-5
  institution-side coverage is read-side envelope/projection snapshots;
  Phase 3 mints no new capability (that scope belongs to G2～G4).
- Each journey directory is one commit-sized unit; GJ-1 lands first and
  freezes the snapshot conventions the other five reuse.

### P3-3 — Capability Selection Fixtures

Add `source/fixtures/selection/`: five deterministic families bound to the
registry's `intentKeys` — candidate filtering (eligibility pre-filter),
correct selection, clarification-needed (ambiguous intent across
capabilities or across enrollment targets in the multi-enrollment world),
confirmation-needed (`reviewable_commit`), unavailable (dependency NO-GO /
default-off). Selection fixtures never bypass the deterministic policy
filter and never let an LLM pick a write target in the multi-institution
case.

### P3-4 — Fixture Manifest, Canonicalization and Exact Rotation

- Extend canonicalization to enumerate fixture slices (world, per-journey,
  selection) alongside capability/surface slices.
- Generate the fixture manifest into the artifact set; rotate the interface
  identity from `1.0.1` to the next exact version per
  `optionalAdditiveChange = new_version_and_digest`; rebuild manifest +
  trusted artifact pin; update `phase-2-contract` admission tests and add
  `phase-3-fixture` tests.
- Slice-invariance guard: a dedicated test asserts every pre-existing
  capability/surface slice hash is byte-identical after rotation
  (`additiveNewSlice` preserves existing evidence); shared-core hash is
  asserted unchanged.
- `pnpm build:surface-contract` / `pnpm verify:surface-contract` stay the
  single deterministic entry points; CI keeps the permanent gate green.

## Acceptance Mapping

| Plan acceptance (Phase 3) | Covered by |
| --- | --- |
| Fixtures contain no real PII | P3-0 PII lint + schema constraints |
| Multi-role projections of one fact are consistent; cross-boundary content appears only after explicit send; no institution can infer another | GJ-3 assertions + `F2`/`IB` isolation controls in P3-0/P3-2 |
| Every journey re-runs independently | P3-1 independence test |
| Portfolio covers six surfaces; full role/action combinations stay in the conformance matrix | P3-2 mapping table + Boundary Rules 1/4 |
| Selection fixtures cover filter/correct/clarify/confirm/unavailable | P3-3 |
| Rotation from exact `1.0.1` with mechanical evidence scope | P3-4 slice-invariance guard |

## Non-effects

Phase 3 creates synthetic contract-local artifacts only: no schema/migration
apply, no database mutation, no capability activation, no Candidate, no
secret, no owner-integration claim, no traffic. Synthetic qualification
(Phase 4) and Joint Conformance remain separate, later gates.
