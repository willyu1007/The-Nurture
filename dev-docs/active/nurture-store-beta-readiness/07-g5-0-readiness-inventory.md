# G5-0 Readiness Inventory & Beta Profile Confirmation

Status: STARTED 2026-08-13 under the separate G5-0 authorization recorded in
the project changelog. G5-0 confirms or supersedes
`nurture.six-surface-beta-profile@0.1.0`; it cannot silently widen or narrow
it. No Candidate identity is allocated and no release-control runtime is
implemented in this phase.

## 1. Exact handoff identity table

| Input | Identity | Authoritative record |
| --- | --- | --- |
| G1 baseline | `nurture.surface-contract@1.7.0` / `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`; My-Chat `a0195662228a2fc6323b9ea0cd327d3608d8cc17`; Base `06303e9f404e4ccc0ba3054b763675efe81b5b15` | `06-beta-profile-v0.md`; T-002 record 18 |
| T-005 G2 Exit | `G2_EXIT_PASS` at `nurture.surface-contract@1.8.0` | `dev-docs/archive/nurture-family-care-conversation/14-g2-exit-qualification-and-beta-handoff.md` |
| T-006 G3 Exit | `G3_EXIT_PASS_RESTORED` at `nurture.surface-contract@1.15.0` | `dev-docs/archive/nurture-child-care-boards/08-g3-exit-qualification-and-beta-profile-handoff.md` |
| T-007 G4 Exit | `G4_F_EXIT_PASS_DEFAULT_OFF / T007_BETA_PROFILE_HANDOFF_ISSUED`; final evidence 41 migrations / 444 production-DB / 1050 unit / three consecutive 37/37 x5 | T-007 records 95/96 |
| Current surface identity | `nurture.surface-contract@1.20.0` (65 capabilities / 6 surfaces) | T-007 record for G4-E I2-A; project dashboard |
| T-002 owner/source subset | `C30_CURRENT_PIN_REQUAL_PASS`; pin currently My-Chat `1db3f03c69dfa7c8cd77a2cd4b9aebd4a868acdb` after the 2026-08-13 revision-only reseal (content hashes unchanged: contract `85cf56e2…`, x5 `f49459af…`, wave4 `65d6b0a0…`, self `e4b26610…`) | T-002 record 26; `docs/project/integrations/my-chat-workflow-contract.json` |
| T-009 provider | `REQUAL_PASS` at checkpoint `860f73f` / `nurture.surface-contract@1.17.0` | archived T-009 bundle |
| T-010 owner | `I4_C4_EXIT_PASS_DEFAULT_OFF / EXACT_OWNER_CONSUMER_AND_CLEANUP_QUALIFIED`; My-Chat pins `nurture.family-sharing-eligibility@1.0.0` at `sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8` | archived T-010 `04-verification.md` |

Truncated hashes above are convenience references only; the linked records
hold the full values and remain authoritative.

## 2. Beta Profile v0 drift ledger (explicit, append-only)

| # | Drift vs the 2026-08-01 freeze | Disposition |
| --- | --- | --- |
| D1 | Surface contract advanced `1.7.0` → `1.20.0` through owning-task exact rotations (G2/G3/G4 chain) | Expected by v0's baseline-input rule; G5-0 confirmation must cite `1.20.0` as the working identity while keeping the G1 baseline as historical input |
| D2 | Teacher-release private provider is now `nurture.teacher-release-owner@3.0.0` over `1.20.0`; private v3 atomically replaced v1/v2 with no compatibility routing | Consumer-side (My-Chat T-036/T-039) boundary already adopted; no profile change |
| D3 | Guardian-decision callback: transport `1.0.0` has no callback; the teacher queue stops at `pending_guardian_confirmation`. T-011 W1 drafts an additive `family_growth_transport@1.1.0` push callback | Joint design must conclude before G5-A (2026-08-11 decision); classify as a G5-A precondition, not a profile widening |
| D4 | T-010 family-sharing eligibility owner qualified default-off; My-Chat adopted at one exact digest | Not part of the v0 required six-surface set; classify during census (candidate `g5_shared` for the authorization surfaces P-S06/P-R01..R04 consumed by the My-Chat companion) |
| D5 | T-002 pin resealed 2026-08-13 to My-Chat `1db3f03` (revision-only, zero content drift) | Record 26 remains the authoritative requalification; no evidence invalidated |

## 3. Pilot carry-forward census (read-only, categories fixed)

Categories: `g5_shared` | `complete_pilot_only` | `evidence_only` | `unknown`.

| Item | Category (initial) |
| --- | --- |
| x5 joint serialized lane (5 files / 35-37 tests) | `g5_shared` |
| Teacher-release v3 joint conformance fixtures | `g5_shared` |
| C30 qualification artifacts (records 18–26) | `evidence_only` |
| T-010 disposable qualification artifacts (`run-t010-c4-qualification.mjs`, C4 records) | `evidence_only` |
| T-007 G4-E knowledge-safety qualification fixtures (15 × 2) | `g5_shared` |
| C31–C35 / C40–C45 / D / Pilot chain assets | `complete_pilot_only` |
| Nurture dev-host harness | `unknown` |

The census is a working list; entries move categories only with an explicit
ledger line here.

## 4. G5-0 remaining duties

1. Confirm-or-supersede decision on profile v0 (owner decision; if any
   `optional_absent → required` change is wanted, that is a new profile
   version plus impact analysis).
2. Complete the pre-candidate inventory over manifest, module, public API,
   presenters, fixtures and DB/migration compatibility.
3. Finish the carry-forward census above.
4. Hold until T-011 W1 concludes (G5-A precondition) before scheduling any
   G5-A Freeze work; G5-A remains a strictly serial gate and is NOT part of
   this phase.

## Boundaries

No Candidate identity, no release-control runtime, no durable apply, no
activation, no deployment, no traffic.
