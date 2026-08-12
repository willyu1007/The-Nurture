# C30 signed owner-carrier current-pin addendum

## Verdict

- Date: 2026-08-12
- Task: T-002
- Verdict: `C30_CURRENT_PIN_REQUAL_PASS`
- State: qualified, default-off
- Supersedes for current repository/source identity only: record
  [`25`](./25-c30-trial-owner-policy-pin-addendum.md)
- Preserves: records 22–25 database, joint, policy and default-off evidence

## Reason for reseal

My-Chat T-041 commit `2d415cecea6c40cb41daf10bca0638bfaa0c504e`
completes the real Enrollment Journey Admin/Guardian carrier producers and
signed query-v2/prepare-v3/execute-v4 clients. The C30 Host runtime population
is unchanged, but the broader `x5_joint_api` source pin intentionally includes
`packages/scenario-integrations/src`, so its exact hash changed.

Nurture T-007 commit `21cfb3b1cd6d45f3cf572224ef0e97919d893963`
closes G4-D I4 with the production native-source, exact Guardian/mobile
formalization/replay matrix and its additive prepared-ledger migration. T-002
pin adoption commit `de4897f2c03fdc1f391108c19ea13060862b57eb`
rotates the exact Host head, `x5_joint_api`, Nurture scenario self-pin and the
upstream/G2 check inputs. This addendum reseals the cumulative C30 source lock
from that committed adoption population.

## Exact current inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `2d415cecea6c40cb41daf10bca0638bfaa0c504e` |
| My-Chat C30 runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| My-Chat C30 Host aggregate | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Base/My-Chat contract parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` |
| `x5_joint_api` | `f49459af932c1be6c19ee6ad8099eb319f078a56623cac14263bbb541eb865ce` |
| `wave4_binding_host` | `65d6b0a0b52cdb2f98151b2841761c52e8daf7329c981975b5143a9ad15f2a43` |
| Nurture scenario self-pin | `e4b26610e785840e13bd22396291e44b5ed000cc5de83736dc06c05a4ecec393` |
| Nurture lock source | `de4897f2c03fdc1f391108c19ea13060862b57eb` |
| Nurture owner aggregate | `856cd6c6cd4b1312509fe3b074730ceb22e69381427cf2804b290ade3f5ced95` |

## Requalification evidence

| Gate | Result |
| --- | --- |
| exact upstream heads and Host/Base source profiles | PASS |
| workflow contract/source pin | PASS — 21/21 parity; exact Host source pins; Nurture self 303 files |
| C30 owner-adoption lock | PASS — `bcbe6b33...` |
| C30 default-off census | PASS — every positive production population remains zero |
| G2 exact contract pin | PASS |
| T-007 complete I4 owner matrix | PASS — focused DB 11/11; production DB 444/444 |
| complete serialized x5 | PASS — three consecutive runs, each 5 files / 37 tests |
| repository regressions | PASS — Nurture unit 97/1050 and root TypeScript; My-Chat unit 167/1158, root TypeScript and ESLint |
| disposable databases | PASS — Nurture 41 migrations and My-Chat 43 migrations; final destruction is part of the adjacent G4-F cleanup census |

## Boundary

The reseal changes metadata only. It does not alter the C30 Host runtime
aggregate, scenario runtime, schema, migration, production route, Workspace
activation, deployment, Pilot or traffic state. G4-D I4 is complete; the exact
pin now permits T-007 to execute the G4-F integration/handoff census. C31-C35,
T-008 and all activation gates remain separately closed.

## 2026-08-13 revision-only reseal addendum

- My-Chat pin head: `1db3f03c69dfa7c8cd77a2cd4b9aebd4a868acdb`. Drift since
  `2d415ce` is confined to `ci/scenario-federation/qualification-lock.json`
  and archived dev-docs; every content hash in the exact-current-inputs
  table above is unchanged.
- Nurture lock source: `a78e7ddb467e53fce97bb6ca7e8c89cc3872260f` (the
  guard-head reseal commit).
- Nurture owner aggregate:
  `ec5198acb7fef7450414d56d62312f33deeeddb7878303e8d9ffb54cb2c85d44`. The
  aggregate rotates only because the three guard scripts are part of the
  `nurture_c30_manifest_foundation_v1` profile.
- The 2026-08-12 requalification evidence above remains authoritative; no
  content requalification was required for this reseal.
