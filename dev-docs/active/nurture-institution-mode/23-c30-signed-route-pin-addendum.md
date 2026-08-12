# C30 signed-route current-pin addendum

## Verdict

- Date: 2026-08-12
- Task: T-002
- Verdict: `C30_CURRENT_PIN_REQUAL_PASS`
- State: qualified, default-off
- Supersedes for current repository/source identity only: record
  [`22`](./22-c30-current-pin-requalification-record.md)
- Preserves: record 22's database, schema, cleanup and default-off evidence

## Reason for reseal

My-Chat commit `4673712` repairs the T-041 signed Enrollment Journey execute
declaration. The change affects the broad `x5_joint_api` source profile but is
outside the narrower C30 Host runtime profile. C30 therefore requires an exact
head/source-lock reseal, not a new activation or a claim that its runtime bytes
changed.

## Exact current inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `4673712d4d829a2450d5ea712ece3afec8c984d1` |
| My-Chat settlement runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| Base/My-Chat contract parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` |
| `x5_joint_api` | `312d0477e3400ffabf81cbc26c00af6bea85ea5ddfbca1e311cc080cf466e831` |
| `wave4_binding_host` | `65d6b0a0b52cdb2f98151b2841761c52e8daf7329c981975b5143a9ad15f2a43` |
| Nurture scenario self-pin | `efdfb54a9aaa5980623f82fc68d48efc0d91e926ba3b285b559471ea6b521a75` |
| My-Chat C30 Host aggregate | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Nurture owner lock | source `33d3147a08b8e467a5bc6e7c5ac08a251a944791`; aggregate `a9dea27e0fc2093b5f92657f58cb851794fba1e5c7a7a2503a61c626d3ca5d37` |

## Requalification evidence

| Gate | Result |
| --- | --- |
| upstream exact heads and source profiles | PASS |
| workflow contract/source pin | PASS |
| C30 owner-adoption lock | PASS |
| C30 default-off census | PASS — every positive population remains zero |
| G2 exact contract pin | PASS |
| T-007 regression inherited by the new source head | PASS — unit 97/1047, production DB 50/439, signed settlement file 7/7, complete x5 36/36 |
| disposable effects | NONE — both verification containers were destroyed and ports `55438`/`55450` are free |

## Boundary

No schema, migration, manifest capability, production route, Workspace
activation, deployment, Pilot or traffic state changes here. G4-F remains
closed until the complete T-007 I4 current-owner/command/head matrix passes.
C31-C35 and T-008 remain separately closed.
