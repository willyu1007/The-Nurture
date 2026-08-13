# Six-surface Beta Profile v1

## Identity and Status

- Identity: `nurture.six-surface-beta-profile@1.0.0`
- State: `CONFIRMED_G5_INPUT` (frozen 2026-08-13)
- Owner: T-008
- Supersedes: `nurture.six-surface-beta-profile@0.1.0`
  (`FROZEN_PLANNING_INPUT`, 2026-08-01; retained unmodified in
  [`06-beta-profile-v0.md`](./06-beta-profile-v0.md))
- Qualification authority: none. This profile is the G5-0
  confirm-or-supersede output; it is not a Service Candidate,
  qualification record, deployment binding, activation gate or traffic
  authorization.

Per the v0 change rules this version neither widens nor narrows the
required six-surface set: no `optional_absent → required` promotion and
no required-path removal occurs, so no impact analysis against G2–G5
evidence is triggered. Changes are identity updates and two explicit
`optional_absent` classifications for capabilities v0 predated.

## Working identity and baselines

- Working surface identity: `nurture.surface-contract@1.20.0`
  (65 capabilities / 6 surfaces; shared core `sha256:7bd8a82d…`).
- Historical G1 baseline (unchanged, citable): `1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`,
  My-Chat `a0195662228a2fc6323b9ea0cd327d3608d8cc17`, Base
  `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
- Stage inputs are the actual exits: T-005 `G2_EXIT_PASS` (`1.8.0`),
  T-006 `G3_EXIT_PASS_RESTORED` (`1.15.0`), T-007
  `G4_F_EXIT_PASS_DEFAULT_OFF / T007_BETA_PROFILE_HANDOFF_ISSUED`
  (records 95/96), teacher boundary
  `nurture.teacher-release-owner@3.0.0` over `1.20.0`.
- T-002 owner/source subset citation: record 26
  (`C30_CURRENT_PIN_REQUAL_PASS`) including its 2026-08-13 reseal
  addenda; current pin per
  `docs/project/integrations/my-chat-workflow-contract.json`.

## Required six-surface capability set

Unchanged from v0 (see `06-beta-profile-v0.md` section "Required
Six-surface Capability Set"): Guardian Nurture Chat, Guardian family
board, Caregiver Nurture Chat, Caregiver teacher board, Institution
mobile board, InstitutionAdminWorkbench — each with current authority
reread, exact contract admission, isolation, revoke/redaction,
idempotency/concurrency/recovery, formal NestJS ingress, real pinned
owner-path qualification and final false/empty cleanup.

Clarified qualification level for one required path: the
InstitutionAdminWorkbench Institution Knowledge/RAG positive path
participates in Candidate Freeze at `ADAPTER_QUALIFIED`
(`live_qualified=false`). Live enablement is NOT a Freeze input: it is a
separate, scoped, revocable internal-test capability gate exercised
during G5-D, with the Q3 live qualification (one real provider receipt
with body-free observability evidence) as its prerequisite.

## Optional-absent / Default-off

All v0 entries continue unchanged. Two additional classifications:

| Capability | v1 posture | Required fallback |
| --- | --- | --- |
| Guardian-decision callback (`family_growth_transport@1.1.0`, W1 frozen joint design) | `optional_absent` | teacher queue shows the honest `pending_guardian_confirmation` state; provider raises the eight-attempt ops signal; the frozen design's bounded-expiry and reconciliation rules apply only post-cutover once implemented |
| Family-sharing authorization surfaces (T-010 owner + My-Chat consumer composition; companion rows P-S06/P-R01..R04) | `optional_absent` | surfaces are not exposed; both sides stay default-off; contracts remain citable by exact pin (census category `g5_shared`) |

Rationale: the 2026-08-11 decision requires only the callback DESIGN to
conclude before G5-A (satisfied 2026-08-13 by the frozen W1 record);
making the implementation a beta requirement would couple Freeze to an
unfinished joint qualification. Family-sharing activation gates are
explicitly independent decisions and are not dragged into Freeze.

## Change and failure rules

Unchanged from v0: any `optional_absent → required` change creates a new
profile version plus impact analysis; a failed required path cannot be
reclassified optional in the same attempt; drift routes to the smallest
owning task append-only; this profile may be superseded only by a later
G5-0-authorized version.
