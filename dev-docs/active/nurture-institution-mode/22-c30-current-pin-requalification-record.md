# C30 Current-pin Requalification Record

## Verdict

- Date: 2026-08-12
- Task: T-002
- Verdict: `C30_CURRENT_PIN_REQUAL_PASS`
- State: qualified, default-off
- Supersedes for current-pin evidence: the invalidated 2026-08-08 revision
  binding in
  [`21-c30-landing-requalification-record.md`](./21-c30-landing-requalification-record.md)
- Non-effects: no durable database apply, deployment, capability activation,
  Pilot, traffic authorization or Service Candidate. C31-C35 and T-008 remain
  closed. T-007 G4-F remains closed until the complete G4-D I4 remainder passes.

This record closes the 2026-08-12 rerun of Step 5 in
[`20-c30-cross-repository-landing-plan.md`](./20-c30-cross-repository-landing-plan.md).
It also consumes the separately qualified T-007/T-041 workflow-run settlement
and T-010 family-sharing authorization evidence without turning either
default-off protocol into production activation.

## Exact bound inputs

| Input | Identity |
| --- | --- |
| My-Workflow-Base | `536638a204865ebdc43bca70992388352789a36f` |
| My-Chat pin head | `6d4baeea3f8b23ff5a836c6e9c6e9c8ce55fe36b` |
| My-Chat settlement runtime | `149424c9a05a28aa8c1654258bb919a434208732` |
| Base/My-Chat contract parity | `85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225` (21 files on both sides) |
| `web_workbench` | `815311f7b25b423c725a1f94fa46dbdd65abae84df10cff4c34664ed05db63ca` (64 files) |
| `x5_joint_api` | `39a9689cf2f38e0d8d3d7bd8f59892743228a0ebff0e8fedc8624f4e378bf51e` (284 files) |
| `wave4_binding_host` | `65d6b0a0b52cdb2f98151b2841761c52e8daf7329c981975b5143a9ad15f2a43` (22 files) |
| Nurture scenario self-pin | `543530084c31e2cdbd647ba32387c3fa462403aea643a59b21bb6fd04b5fdac1` (301 files) |
| Surface contract | `nurture.surface-contract@1.20.0` / `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| My-Chat host-adoption lock | `aac525c4f13953671040ce759da8eadf0f55dee9063db8b6389282f78635617d` |
| Nurture owner-adoption lock | source `ae2075ed4bde097fe2400d735ea0a4c3554dd08d`, aggregate `4fccdc1c03b8298254e76a4704af821974eb101f96f5d7c14837a1750060d560` |

## Qualification topology

- `morethan-joint-qualification-pg-20260812`, `pgvector/pgvector:pg16`,
  loopback `55450`: isolated databases for T-007/T-041, T-010, C30 Nurture,
  C30 My-Chat and the Nurture dev host.
- `morethan-c30-step5-census-pg-20260812`, `pgvector/pgvector:pg16`,
  loopback `55438`: the exact My-Chat C30-I2 census target.
- Both containers were created for this qualification only. Test-created rows
  were confined to these targets. Both exact containers were removed after the
  final census, and ports `55450` and `55438` were proved free.

No pre-existing local database, durable environment, secret, deployment or
external service was modified.

## Gate evidence

| Gate | Result |
| --- | --- |
| T-007/T-041 settlement | PASS — 6/6 two-database cases: commit/replay, both response-loss branches, unknown quarantine and both writer-fence winners. |
| T-010 guarded C4 | PASS — 39/39 migrations, 12/12 production-shape cases, zero synthetic business-row residue. |
| T-010 joint authorization | PASS — 5/5; complete x5 population 5 files / 35 tests. |
| `verify:owner-integration` | PASS — formal scenario-service HTTP + real PostgreSQL, 25 actions / 8 queries / 0 unexercised, 68/68 DB cases and both joint journeys. |
| C30 exact gates | PASS — workflow pin, upstream, owner adoption and default-off. Nurture census `298c41f4...`; My-Chat census `989e8294...`; every positive population zero. |
| assert suite | PASS — routing, G2 Exit, G3-0 freeze, persistence, formal ingress, ports, N1 schema, X4 replay, surface contract and surface conformance. |
| Nurture schema | PASS — 39/39 migrations current and no schema diff. |
| My-Chat schema | PASS — 43/43 migrations current and no schema diff. |
| Nurture regression | PASS — unit 97 files / 1047 tests; production DB 50 / 437; dev host 11 / 27; scenario service unit 14 / 95 and DB 3 / 68; x5 5 / 35. |
| Nurture static gates | PASS — root typecheck, frontend ESLint/Stylelint, production DB boundary 103 tables / 127 enums, context DB sync current. |
| My-Chat regression | PASS — typecheck, ESLint, 164 files / 1147 tests; 23 files / 131 environment-gated tests skipped by the ordinary unit lane. Relevant x5 cases ran separately against both databases. |
| Base conformance | PASS — `verify:workflow-contracts`, 441 tests and exact source lock. |
| Cleanup | PASS — both named containers absent; loopback ports `55450` and `55438` free. |

## Defects found and repaired

1. My-Chat's workflow-settlement migration used an invalid PostgreSQL regular
   expression quantifier. The check now applies the length bound separately and
   all 43 migrations replay from empty.
2. T-010 qualification fixtures used non-UUID anchor/association identifiers
   and an untyped generic cleanup principal. Fixtures now match the production
   schema and cleanup remains deliberately service-principal-free.
3. `assert-g2-exit-contract.mjs` hardcoded the superseded Base/My-Chat pins.
   The exact current pin is now asserted instead of bypassing the check.
4. `assert-g3-0-freeze.mjs` omitted the new
   `NurtureWorkflowRunSettlement` table from its explicit no-board-row census.
5. The two new joint suites were counted as x5 but not excluded from the
   production single-database Vitest config. The routes are now disjoint and
   the complete 50-file production DB lane passes.

## What this unlocks

- T-002 again has current-pin C30 owner evidence.
- T-010 may proceed to governance handoff/closure while remaining default-off.
- T-007 may start only the still-unimplemented G4-D I4 remainder:
  native-source/current-owner transport, remaining commands, and the
  Guardian/mobile/head matrix. G4-F starts only after that complete matrix
  qualifies.

## Invalidation

Any bound contract/source hash, settlement or family-sharing protocol byte,
schema/migration population, owner-adoption profile, production test routing or
default-off census drift invalidates the affected evidence and requires a new
qualification. Documentation-only commits outside the locked source
populations do not change the bound identities above.
