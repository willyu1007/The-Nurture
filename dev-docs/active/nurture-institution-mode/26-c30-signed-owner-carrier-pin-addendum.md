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

My-Chat T-041 commit `ae33b31363b86b0664412e0d053104780048c342`
adds the real Enrollment Journey current-owner carrier producer and signed
prepare/execute client. The C30 Host runtime population is unchanged, but the
broader `x5_joint_api` source pin intentionally includes
`packages/scenario-integrations/src`, so its exact hash changed.

Nurture T-007 commit `9ab05e6497a7d7fa8fec6375ed4d9671b731f544`
adds only the signed positive joint vehicle and task evidence. T-002 pin
adoption commit `bb0f1a8082aaf5aba1afb0ee995733ffc11eb512`
rotates the exact Host head, `x5_joint_api` hash and upstream/G2 check inputs.
The workflow verifier also exposed a stale Nurture scenario self-pin left by
the earlier trial-owner runtime change; the adoption commit repairs it to the
recomputed exact bytes.

## Exact current inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `ae33b31363b86b0664412e0d053104780048c342` |
| My-Chat C30 runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| My-Chat C30 Host aggregate | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Base/My-Chat contract parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` |
| `x5_joint_api` | `20768714cf859829538e03227c1effc9253bccaed157d9e5fabc8ca8e079d86b` |
| `wave4_binding_host` | `65d6b0a0b52cdb2f98151b2841761c52e8daf7329c981975b5143a9ad15f2a43` |
| Nurture scenario self-pin | `48ede77188dd9d8d94a29cabf0f1b7f992139755d1a387fbcc4099ac2ed63fa7` |
| Nurture lock source | `bb0f1a8082aaf5aba1afb0ee995733ffc11eb512` |
| Nurture owner aggregate | `bcbe6b3330caaa8632b720584fec883bddd72e7ad7b1fd9932037ec1b4a8b401` |

## Requalification evidence

| Gate | Result |
| --- | --- |
| exact upstream heads and Host/Base source profiles | PASS |
| workflow contract/source pin | PASS — 21/21 parity; exact Host source pins; Nurture self 303 files |
| C30 owner-adoption lock | PASS — `bcbe6b33...` |
| C30 default-off census | PASS — every positive production population remains zero |
| G2 exact contract pin | PASS |
| T-007 signed positive joint vehicle | PASS — focused file 8/8 |
| complete serialized x5 | PASS — three consecutive runs, each 5 files / 37 tests |
| repository regressions | PASS — Nurture unit 97/1049 and root TypeScript; My-Chat unit 166/1154, root TypeScript and ESLint |
| disposable databases | PASS — Nurture 40 migrations and My-Chat 43 migrations; both named containers destroyed after qualification |

## Boundary

The reseal changes metadata only. It does not alter the C30 Host runtime
aggregate, scenario runtime, schema, migration, production route, Workspace
activation, deployment, Pilot or traffic state. G4-F remains closed until the
remaining T-007 I4 native-source, command-family, Guardian/mobile and complete
negative/replay/head matrix passes. C31-C35 and T-008 remain separately
closed.
