# G4-0C Exit Record

## Verdict

- Date: 2026-08-08
- Task: T-007
- Stage: G4-0C Authority & Surface Contracts
- Verdict: **`G4_0C_EXIT_PASS`**
- Opens: G4-A implementation, and the common authority base G4-B/C/D/E consume
- Effects: documentation and one additive contract rotation. No schema apply,
  no migration, no capability enablement, no deployment, no activation, no
  traffic.

## What is satisfied

**Six ordered units, each with an exact freeze record.**

| Unit | Record | Contract identity | Schema |
| --- | --- | --- | --- |
| 0C-1 Active role & actor context | [`11`](./11-g4-0c-1-active-role-freeze.md) | `nurture.institution-active-role@1.0.0` | `REUSE` |
| 0C-2 Institution scope | [`12`](./12-g4-0c-2-institution-scope-freeze.md) | `nurture.institution-scope@1.0.0` | `REUSE` |
| 0C-3 Class & child scope | [`13`](./13-g4-0c-3-class-child-scope-freeze.md) | `nurture.institution-child-scope@1.0.0` | `REUSE` |
| 0C-4 Surface envelope & owner-read | [`14`](./14-g4-0c-4-surface-envelope-freeze.md) | `nurture.surface-contract@1.18.0` | `REUSE` |
| 0C-5 Grant policy & aggregate privacy | [`15`](./15-g4-0c-5-grant-aggregate-freeze.md) | `nurture.institution-grant-aggregate@1.0.0` | `REUSE` |
| 0C-6 Roster & invite | [`16`](./16-g4-0c-6-roster-invite-freeze.md) | `nurture.institution-roster-invite@1.0.0` | **planned, not applied** |

**Three open points closed, none deferred.**

| Point | Outcome |
| --- | --- |
| Institution wind-down read | Mis-posed. The states are unreachable and the behaviour was T-005's, not a choice. Produced [`17`](./17-lifecycle-status-cleanup-decision.md) instead, routing a schema convergence to T-002 and giving 0C its currency rule. |
| Small-cell aggregate suppression | Answered with a stronger rule than the threshold it asked about: full coverage or nothing, which also closes the differential-observation leak a threshold would have left open. |
| Workload-magnitude ordering | Answered by removing system-produced ordering entirely: a fixed class-list order, so the marker does triage and the position does location. |

**0G cross-contract audit passed after repair** —
[`18`](./18-g4-0g-0c-audit-record.md), four findings, all repaired in that
pass.

## Exact identity

| Input | Identity |
| --- | --- |
| Surface contract | `nurture.surface-contract@1.18.0` / `sha256:be84bb23a4842083f7832389b4eb27a47fadd6169729aecd34b6f5daf939e3c0` |
| Shared core | `sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d` — **unchanged across the rotation** |
| Capabilities / surfaces | 34 / 6 |
| My-Workflow-Base | `4350086993d837baa8030564f4e19593dedd96b0` |
| My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |
| Base/My-Chat parity | `98f6c24115e02e4abf0e3c9d855849f1c7993974e2ed9bcc72c868c642433d2f` |
| Owner path | `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` — `verify:owner-integration` at 25 actions / 8 queries / 0 unexercised, both joint journeys PASS |

The rotation was additive: `sharedCoreHash` did not move, so under
`additiveNewSlice: preserve_existing_slice_evidence` every T-005 and T-006
slice keeps its qualification. `verify:g2-exit-contract` and
`verify:g3-0-freeze` pass across it, which is the mechanical proof rather than
an assertion.

## The authority chain 0C delivers

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
   0C-1              0C-2               0C-3                    0C-5
```

Fixed order, each level owned by exactly one unit. A level not yet frozen
denies at that level rather than being skipped. 0C-4 binds the chain to a
surface; 0C-6 composes it into a command without adding a level.

## What this opens

- **G4-A implementation** — the authority and aggregate foundation.
- The **common authority base** G4-B, G4-C, G4-D and G4-E consume. Each branch
  still needs its own domain freeze: 0D for daily operations, 0E for Workflow
  and Enrollment, 0F for knowledge and RAG.

## What this does not open

Not Owner Readiness, not Joint Conformance, not a Beta Profile Handoff, not
Candidate Freeze. No schema apply — 0C-6's delta stays a plan. No capability
enablement: `query_institution_communication_review` is registered and
deliberately unimplemented, `t007_institution_workbench` is unsatisfied, and
the workbench's only legal state remains `unavailable`. No deployment, no
activation, no traffic. T-008 continues to wait for the complete T-007 Exit.

## The honest limitation

**Nothing in 0C has been executed.** Six freeze records, one contract rotation
and zero lines of predicate implementation. The contract-level conformance test
that ships with 0C-4 asserts descriptor, schema and wiring — deliberately, since
I1 has not opened — but it exercises no authority decision.

Today's C30 landing is the cautionary case: five defects sat undetected in
accepted work until gates actually ran, and they were found only by execution.
The same risk applies here, and a freeze is a weaker artifact than a passing
test. Whoever plans the next step should weigh validating 0C by implementing
G4-A against freezing 0D, 0E and 0F on top of predicates no runtime has yet
exercised.
