# G5-0 Readiness Inventory & Beta Profile Confirmation

Status: COMPLETE 2026-08-13 under the separate G5-0 authorization recorded
in the project changelog; the confirm-or-supersede output is profile
v1.0.0 (`08-beta-profile-v1.md`). G5-0 confirms or supersedes
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
| T-002 owner/source subset | `C30_CURRENT_PIN_REQUAL_PASS`; record 26 plus the final 2026-08-14 W4 quality-reseal addendum is authoritative (My-Chat `4db80c9…`; `x5_joint_api=ecaa2de…`; contract parity `85cf56e2…` and wave4 `65d6b0a0…` unchanged; C30 lock `e55c877…`) | T-002 record 26 + addenda; `docs/project/integrations/my-chat-workflow-contract.json`; `docs/project/integrations/c30-i3-owner-adoption-lock.json` |
| T-009 provider | `REQUAL_PASS` at checkpoint `860f73f` / `nurture.surface-contract@1.17.0` | archived T-009 bundle |
| T-010 owner | `I4_C4_EXIT_PASS_DEFAULT_OFF / EXACT_OWNER_CONSUMER_AND_CLEANUP_QUALIFIED`; My-Chat pins `nurture.family-sharing-eligibility@1.0.0` at `sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8` | archived T-010 `04-verification.md` |
| T-011 contract supply | W2 `nurture.parent-context-presenter@1.0.0` / `sha256:3ac0906c…`; W3 `nurture.parent-communication-owner@1.0.0` / `sha256:b1dce3a7…` with W3.1 local owner qualification; W4 read-only `nurture.director-presenter@1.0.0` / `sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9` | T-011 accepted digest records, contract fixtures and exact-pin My-Chat consumer tests; all gates default false |
| Final green shared-input sources | My-Chat `4db80c91a15859b51b193110efa45acaf019deb5`; Nurture W4 `69471858c86d3f1e5612cb4e52bd6ed30504f8af`; T-002 pin source `a577cb21c1ec425f57232e262ced931401b9c03f`; lock commit `329e2ab258eeb0575f43919d3938b77a821b96b6` | Exact committed revisions after joint W4 quality verification and pin reseal; they are Freeze inputs, not a Candidate identity or activation |

Truncated hashes above are convenience references only; the linked records
hold the full values and remain authoritative.

Cross-repo naming note (2026-08-14): this identity table, and specifically
the "Final green shared-input sources" row, is the artifact My-Chat
governance documents refer to as the "G5 shared-input ledger". No separate
ledger file exists in either repository; My-Chat's pointer lives in its
`dev-docs/active/mobile-uiux-delivery/08-g5-companion-readiness.md`.

## 2. Beta Profile v0 drift ledger (explicit, append-only)

| # | Drift vs the 2026-08-01 freeze | Disposition |
| --- | --- | --- |
| D1 | Surface contract advanced `1.7.0` → `1.20.0` through owning-task exact rotations (G2/G3/G4 chain) | Expected by v0's baseline-input rule; G5-0 confirmation must cite `1.20.0` as the working identity while keeping the G1 baseline as historical input |
| D2 | Teacher-release private provider is now `nurture.teacher-release-owner@3.0.0` over `1.20.0`; private v3 atomically replaced v1/v2 with no compatibility routing | Consumer-side (My-Chat T-036/T-039) boundary already adopted; no profile change |
| D3 | Guardian-decision callback: transport `1.0.0` has no callback; the teacher queue stops at `pending_guardian_confirmation`. T-011 W1 drafts an additive `family_growth_transport@1.1.0` push callback | Joint design must conclude before G5-A (2026-08-11 decision); classify as a G5-A precondition, not a profile widening |
| D4 | T-010 family-sharing eligibility owner qualified default-off; My-Chat adopted at one exact digest | Not part of the v0 required six-surface set; classify during census (candidate `g5_shared` for the authorization surfaces P-S06/P-R01..R04 consumed by the My-Chat companion) |
| D5 | T-002 pin resealed 2026-08-13 to My-Chat `1db3f03` (revision-only, zero content drift) | Record 26 remains the authoritative requalification; no evidence invalidated |
| D6 | Same-day follow-up reseals: My-Chat `b90cce2` (T-042 authorization hardening rotated `x5_joint_api`) and Nurture self-pin rotations through the W5 hardening and W2 publication batches | Record 26 addenda + changelog `pin-reseal`/`fix-batch` entries; C30 Host profiles unchanged; W1 frozen design and W2 publication close the D3/D4 dispositions |
| D7 | W2 P0 closing audit removed the superseded scope draft, regenerated both Prisma clients before root typecheck, pinned the landed My-Chat consumer at `1f306cb…` / `x5_joint_api=561614f0…`, and rotated the Nurture scenario self-hash to `976cd876…` | Exact Base `536638a…` / My-Chat `1f306cb…` detached-worktree verification passed; owner contract digest and default-off posture are unchanged; no successor Candidate is required |
| D8 | W3.1 qualified real local owner ports without changing the W3 digest; W4 then published the missing director contract and My-Chat exact-pin private consumer. The current product SSOT also corrects D-O13 from a Mobile prepare/confirm action to read-only `web_workbench_required`. | W3.1 database evidence is `evidence_only`; W3 and W4 contracts/fixtures/strict consumers are `g5_shared`. This closes source semantics before G5-A without widening profile v1 or authorizing deployment. |

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
| Nurture dev-host harness | `evidence_only` |
| W1 frozen callback design record (T-011) | `g5_shared` |
| W2 presenter conformance environment (`parent-context-presenter/v1`) | `g5_shared` |
| W3 parent-communication exact contract/strict consumer (`parent-communication-owner/v1`) | `g5_shared` |
| W3.1 disposable real-owner qualification | `evidence_only` |
| W4 read-only director contract/fixtures/strict consumer (`director-presenter/v1`) | `g5_shared` |
| W3.2 deployed carrier/secrets/private path and native evidence | `evidence_only` |
| T-011 N3 qualification runner + artifacts | `evidence_only` |

The census is a working list; entries move categories only with an
explicit ledger line here.

Ledger:

- 2026-08-13: dev-host harness classified `evidence_only` (backend-private
  qualification tooling; not part of the beta slice). W1 design record and
  W2 conformance environment added as `g5_shared` (direct G5-A/G5-C
  inputs). N3 runner artifacts added as `evidence_only`. Census complete —
  no `unknown` entries remain.
- 2026-08-14: added W3 exact contract/consumer and W4 director
  contract/fixtures/consumer as `g5_shared`; W3.1 and future W3.2 execution
  evidence remain `evidence_only`. D-O13 was aligned to the existing
  Institution Mobile read-only SSOT. No required-set change and no `unknown`
  entry were introduced.

## 4. G5-0 remaining duties

1. DONE 2026-08-13 — profile v1.0.0 confirmed and frozen
   (`08-beta-profile-v1.md`), superseding v0 with no required-set change.
2. DONE 2026-08-13 — the pre-candidate inventory is the exact identity
   table above plus the census; manifest/module/API/presenter/fixture and
   DB/migration compatibility all carry current green evidence (see the
   T-011 W5 closure and W2 publication records).
3. DONE 2026-08-13 — census complete, ledgered above.
4. SATISFIED 2026-08-14 — T-011 W1 is frozen and W2/W3.1/W4 source closure is
   exact-pin/default-off. G5-A itself remains strictly serial, unauthorized and
   outside this phase. Final green source revisions are recorded above; the next
   gate requires separate authorization before minting an identity, and this
   document does not mint one.
   Synthetic token, Q3 live qualification
   and devices belong to the later G5-D operator/device window; Q3 live is a
   prerequisite for the scoped internal-test enablement, not for G5-A Freeze.

## Boundaries

No Candidate identity, no release-control runtime, no durable apply, no
activation, no deployment, no traffic.

Post-phase handoff: G5-A was separately authorized and completed on 2026-08-14
at `nurture.service-candidate@1.0.0` /
`sha256:c739f9291dbed99b8c96dd27be57e88429dfaeb9f2a8946395b9f58ba244debb`
from source `e6aba3792c3aec9b1b282ca665125fb416fae6f8`.
The boundary above remains the exact G5-0 phase boundary; the later Freeze did
not retroactively add deployment, qualification, activation or traffic effects.
