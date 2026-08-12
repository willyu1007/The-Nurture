# 96 — G4-F Exit and Beta Profile Handoff

## Decision

- Date: 2026-08-13
- Task: T-007
- Result: `G4_F_EXIT_PASS_DEFAULT_OFF /
  T007_BETA_PROFILE_HANDOFF_ISSUED`
- Opens: T-008 planning/intake after its separate authorization.
- Does not open: Candidate Freeze, durable database apply, route/DI
  composition, capability activation, deployment, live-provider
  qualification, Pilot or external traffic.

## Exact handoff identity

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat provider head | `2d415cecea6c40cb41daf10bca0638bfaa0c504e` |
| Nurture G4-D I4 source | `21cfb3b1cd6d45f3cf572224ef0e97919d893963` |
| Nurture pin adoption source | `de4897f2c03fdc1f391108c19ea13060862b57eb` |
| C30 owner aggregate | `856cd6c6cd4b1312509fe3b074730ceb22e69381427cf2804b290ade3f5ced95` |
| Base/My-Chat workflow parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` |
| My-Chat x5 source | `f49459af932c1be6c19ee6ad8099eb319f078a56623cac14263bbb541eb865ce` |
| Nurture scenario self-pin | `e4b26610e785840e13bd22396291e44b5ed000cc5de83736dc06c05a4ecec393` |
| public Surface artifact | `nurture.surface-contract@1.20.0` / `sha256:35d6340f…` |

## Branch join

- G4-A authority/aggregate, G4-B role-bound mobile operations and G4-C
  Workbench core retain their qualified branch records and safe unavailable
  arms. No placeholder capability was added for an owner fact that does not
  exist.
- G4-D Enrollment Journey is complete through default-off I4 by
  [`95`](./95-g4-d-i4-exit-record.md): real Host contact/action/pair carriers,
  production Nurture native-source and current owners, exact Admin/Guardian
  surfaces, prepared/execute confirmation, transactional effects, replay,
  response-loss and negative currentness coverage.
- G4-E Knowledge/RAG retains
  `G4_E_EXIT_PASS_ADAPTER_QUALIFIED` from records 83–85. Recorded/synthetic
  transport is not live qualification; `live_qualified=false` remains the
  activation gate.
- The current T-002 source reseal passes at record
  [`26`](../../active/nurture-institution-mode/26-c30-signed-owner-carrier-pin-addendum.md).
  There is no stale dependency or self-pin in the handoff.

## Final qualification

| Gate | Result |
| --- | --- |
| Nurture full unit lane | PASS — 97 files / 1050 tests |
| Nurture repository-root TypeScript | PASS |
| G4-D focused production owner matrix | PASS — 11/11 |
| Nurture production DB lane | PASS — 50 files / 444 tests |
| fresh Nurture migration replay | PASS — 41/41, current status, empty drift |
| cross-repository x5 | PASS — 5 files / 37 tests, three consecutive runs |
| My-Chat full unit/typecheck/lint | PASS — 167 files / 1158 tests; 17 typed projects; lint clean |
| exact workflow/source/owner pins | PASS |
| G2/G3/formal ingress/persistence/port/routing/manifest | PASS |
| C30 default-off census | PASS — enabled manifest capabilities 0; positive routes/registrations 0; Workspace activation models 0 |
| privacy | PASS — raw Host contact and owner carrier absent from Nurture persistence; native source body absent from output |
| cleanup | PASS — both named disposable containers destroyed; ports 55453/55454 free; ignored test/build outputs removed from both repositories |

The first post-clean unit invocation failed during collection because the
ignored My-Chat pinned workflow package output had intentionally been removed.
Running the repository-declared `pnpm typecheck` preparation first restored the
dependency, after which all 97 files / 1050 tests and every final gate passed.
The generated output was removed again after verification. This was a local
execution-order prerequisite, not a product failure.

## Handoff boundary

T-007 is repository-complete and archived as a default-off provider handoff.
T-008 may consume this record only after explicit authorization and must still
establish its own Candidate Freeze, device/profile evidence, persistent apply,
activation and rollback gates. No task may infer production readiness or
traffic authority from this Exit.
