# T-011 Cross-repo contract supply and guardian-decision callback

## Status

- State: in-progress
- Updated: 2026-08-13
- Next step: W1 design draft is written
  (`artifacts/w1-guardian-decision-callback-design-draft.md`, additive
  `family_growth_transport@1.1.0` push callback with a collapsed two-value
  decision vocabulary); next is the My-Chat joint review and sign-off of its
  six open items, then freezing the joint design record. W2 scope draft is
  written (`artifacts/w2-parent-context-presenter-scope-draft.md`, proposed
  `nurture.parent-context-presenter@1.0.0` mapped to P-O01..P-O05 with
  IR-C01-shaped publication requirements); next is field-level schema
  authoring against current domain models. The supply order decided 2026-08-11 is
  fixed: parent-context presenter, then IR-C01 parent-communication gates,
  then the director presenter. W1 must conclude before any T-008 G5-A
  Candidate Freeze.

## Goal

Own the cross-repo contract gaps that currently block My-Chat T-039 Phase 4/6
and T-008 G5-A but previously belonged to no task: jointly design the
guardian-decision callback missing from the frozen transport `1.0.0` (the
teacher queue stops at `pending` because the provider never learns the
guardian decision), and register the Nurture-owned presenter/owner contracts
in the agreed supply order, each as a versioned owner DTO with adapters and
conformance fixtures, all default-off.

## Workstreams

- W1 guardian-decision callback joint design: one joint design record with
  My-Chat; a versioned transport contract delta (the frozen
  `family_growth_transport@1.0.0` addendum is not mutated); provider- and
  consumer-side obligations; failure, replay and reconciliation semantics;
  default-off.
- W2 parent-context presenter v1: a versioned owner DTO/adapter plus
  conformance fixtures that let My-Chat T-039 start IR-C01 adoption against
  an exact pin and unblock the parent institution tab.
- W3 IR-C01 parent-communication gates: owner contracts for the
  parent-communication surfaces (P-C01..P-C07 equivalents) with
  negative-path fixtures.
- W4 director presenter: the director lens owner contract (D-O01..D-O14
  equivalents); starts only after W2/W3.
- W5 audit-defect hardening: fix the 2026-08-13 Codex audit findings in
  the provider delivery/receipt path and the family-sharing validators
  (`artifacts/w5-audit-defect-ledger.md`). These defects originate in
  F-004/F-005 code (mapped through R-003/R-004); they execute here
  because the W1 callback implementation lands on the same settlement
  surface, and channel hardening precedes the second delivery leg.

## Non-goals

- No capability activation, durable database apply, deployment or traffic.
- No T-008 G5 execution; Candidate work stays in T-008 under its own
  authorization.
- No T-002 C31+ institution-mode gates.
- No My-Chat-side consumer implementation; adoption is owned by My-Chat
  T-039/T-036.
- No reinterpretation of My-Chat canonical identity or consent facts.

## Dependencies and gates

- Supply order decided 2026-08-11: parent-context presenter, then IR-C01
  parent-communication gates, then the director presenter.
- W1 must conclude before any T-008 G5-A Candidate Freeze.
- Contract changes ship as new versions against the current surface identity
  baseline (`nurture.surface-contract@1.20.0`); no frozen artifact is
  mutated.
- Consumers adopt only via exact version/digest pins; no floating
  references.

## Acceptance criteria

- [ ] W1: a frozen joint design record exists with My-Chat sign-off, a
  versioned callback contract delta and a defined resolution path for the
  teacher queue `pending` state; no runtime activation.
- [ ] W2: parent-context presenter v1 is registered as a versioned owner DTO
  with adapter and conformance fixtures, and My-Chat T-039 can start IR-C01
  adoption against an exact pin.
- [ ] W3: parent-communication owner contracts are registered with
  negative-path fixtures.
- [ ] W4: the director presenter contract is registered after W2/W3.
- [ ] W5: every open ledger item is fixed forward-only with its negative
  test; N3's additive migration passes disposable-target qualification;
  N2/N5/N6/N8 land before or with the W1 callback implementation.
- [ ] Everything remains default-off; no durable apply, activation,
  deployment or traffic results from this task.
