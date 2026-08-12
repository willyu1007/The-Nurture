# C30 owner-carrier current-pin addendum

## Verdict

- Date: 2026-08-12
- Task: T-002
- Verdict: `C30_CURRENT_PIN_REQUAL_PASS`
- State: qualified, default-off
- Supersedes for current repository/source identity only: record
  [`23`](./23-c30-signed-route-pin-addendum.md)
- Preserves: records 22–23 database, cleanup and default-off evidence

## Reason for reseal

My-Chat commit `42c94825` adopts the T-041 Enrollment Journey execute-v3
schema used by the request-scoped owner carrier. Nurture commit `82e87df`
rotates the disabled manifest handler keys to prepare v2/execute v3. The
My-Chat change is outside the narrower C30 Host runtime profile, but the exact
Host head and the Nurture manifest-backed C30 profiles changed. C30 therefore
requires a source-lock reseal; it does not require activation or a new schema.

## Exact current inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `42c94825f31cf274e08b4cc9de68425b48498fa6` |
| My-Chat C30 runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| Base/My-Chat contract parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` |
| `x5_joint_api` | `d7cf510bbda566ff48662839b92a5b6c1638b4ace682e0f74254b8561e7b4a63` |
| `wave4_binding_host` | `65d6b0a0b52cdb2f98151b2841761c52e8daf7329c981975b5143a9ad15f2a43` |
| Nurture scenario self-pin | `6337639e3df1cdc58935aa7b6d582161faaecc1913e068973738095874967938` |
| My-Chat C30 Host aggregate | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Nurture owner lock | source `1150071bbc224b0512b8e7a09f2d22036bb58ec8`; aggregate `f4d8c7524019fef08bdc105342e2fee76f7cb9da5a2a9084e8afaa5c20e376bc` |

## Requalification evidence

| Gate | Result |
| --- | --- |
| upstream exact heads and source profiles | PASS |
| workflow contract/source pin | PASS |
| C30 owner-adoption lock | PASS |
| C30 default-off census | PASS — every positive population remains zero |
| G2 exact contract pin | PASS |
| T-007 regression at adopted source | PASS — unit 97/1049, production DB 50/439, focused owner DB 6/6, complete x5 three consecutive runs at 36/36 |
| migrations and cleanup | PASS — Nurture 39/39, My-Chat 43/43; disposable containers destroyed after verification |

## Boundary

No schema, migration, production route, Workspace activation, deployment,
Pilot or traffic state changes here. The manifest changes only disabled
handler versions. G4-F remains closed until the complete T-007 I4
owner/command/head matrix passes. C31-C35 and T-008 remain separately closed.
