# C30 trial-owner policy current-pin addendum

## Verdict

- Date: 2026-08-12
- Task: T-002
- Verdict: `C30_CURRENT_PIN_REQUAL_PASS`
- State: qualified, default-off
- Supersedes for current Nurture source identity only: record
  [`24`](./24-c30-owner-carrier-pin-addendum.md)
- Preserves: records 22–24 database, joint and default-off evidence

## Reason for reseal

T-007 commit `a6727df3c3ce0cd941a9ac1d05ed34b9b3507654`
adds the repository-Prisma trial Grant policy owner and refreshes the generated
DB context. The C30 pair, canonical-action, protected-owner and cumulative
profiles intentionally include `prisma/schema.prisma` and/or the generated DB
context, so their byte identity changed even though no C30 behavior, Host
contract or activation state changed.

## Exact current inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `42c94825f31cf274e08b4cc9de68425b48498fa6` |
| My-Chat C30 runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| My-Chat C30 Host aggregate | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Nurture source | `a6727df3c3ce0cd941a9ac1d05ed34b9b3507654` |
| Nurture owner aggregate | `04c3176c3e1de9637f6e36fdacb703af73fd63d0658a269ba5968cc6ded0fe02` |

## Requalification evidence

| Gate | Result |
| --- | --- |
| upstream exact heads and source profiles | PASS |
| C30 owner-adoption lock | PASS — `04c3176c...` |
| C30 default-off census | PASS — positive production populations remain zero |
| G2 exact contract pin | PASS |
| T-007 unit / production DB | PASS — 97 files / 1049 tests; 50 files / 442 tests |
| complete serialized x5 | PASS — three consecutive runs, each 5 files / 36 tests |
| migration replay / cleanup | PASS — Nurture 40/40, My-Chat 43/43; disposable containers destroyed |

## Boundary

The reseal changes metadata only. The underlying T-007 migration remains
repository SSOT plus destroyed-disposable evidence; it was not applied to a
durable environment. No route, Workspace activation, deployment, Pilot or
traffic state changed. G4-F, C31-C35 and T-008 remain closed.
