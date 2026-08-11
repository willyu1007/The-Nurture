# Teacher release owner v3 migration record

## Scope and result

- Date: 2026-08-11
- Task: T-007
- Result: `TEACHER_RELEASE_OWNER_V3_PASS / MY_CHAT_CONSUMER_PASS /
  G_09_ADOPTION_CLOSED / DEFAULT_OFF / NO_DUAL_TRACK`

This increment migrates the valuable net implementation from the historical
Q4 fixed-target-presenter and Q6 owner-composition branches onto current main.
It does not merge their stale Surface history or preserve their route families.

## Exact contracts

| Boundary | Adopted identity |
| --- | --- |
| Nurture private owner | `nurture.teacher-release-owner@3.0.0` |
| Private digest | `sha256:b17970ed6ad8b1db36737348c54c14cae00a02bf4074b902fcc9c5d81cf5ae73` |
| Surface dependency | `nurture.surface-contract@1.20.0` |
| Surface digest | `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273` |
| My-Chat adopted revision | `6d909bcfde64d4152add902679ba29907cc91883` |
| My-Chat public DTO | unchanged `contract_version: 2` / `publish_queue_v2` |

The only private routes are `/v3/query`, `/v3/targets`, `/v3/prepare` and
`/v3/confirm`. There is no private v1/v2 compatibility route, decoder, fixture
fallback or direct Harness proxy.

## Implementation boundary

- My-Chat supplies service-authenticated Workspace/user/request context only.
- Nurture reruns exact Participant, caregiver/lead-caregiver and CareGroup scope
  resolution before every operation.
- Queue projects only the pinned teacher capability and release actions.
- Targets returns the complete fixed process set with display-safe labels,
  neutral unavailable rows and one actor-bound five-minute snapshot.
- Prepare requires the current snapshot. Confirm revalidates its internal fact
  digest and preserves the same command identity through replay or reconciliation.
- Canonical UTC milliseconds, bounded opaque IDs/refs, closed recursive keys,
  exact summary census and exact reason/recovery pairs are enforced on both
  sides of the boundary.

## Quality repairs and cleanup

- Fixed DB tests that skipped target review before prepare and corrected their
  family reference fixture to the canonical local family.
- Removed unreachable private recovery alternatives and recomputed the digest.
- Removed formatting-only repository/test churn and root-owned the shared
  Vitest source resolver to avoid stale compiled dependency results.
- Deleted three superseded branch-era Q4/Q6 artifacts; historical branch value
  is represented by this consolidated record and the squash migration.
- Fixed canonical environment boolean generation, added regression fixtures,
  declared existing family-growth runtime secrets in the environment SSOT and
  regenerated derived context/example files. No secret value is stored.

## Verification

| Layer | Result |
| --- | --- |
| Nurture typecheck | PASS |
| Nurture unit | 88 files / 973 tests PASS |
| Scenario Service unit | 13 files / 83 tests PASS |
| Scenario Service disposable-DB journeys | 52/52 PASS |
| Nurture production DB | 43 files / 391 tests PASS |
| My-Chat scenario integration | typecheck + 6/6 PASS |
| Migrations | 35 applied from empty; status current; schema diff empty |
| Surface/schema/synthetic conformance | PASS |
| Exact Workflow/source pins and G2 | PASS |
| Environment feature suite | PASS |

The PostgreSQL target was explicitly disposable, isolated from maintained
environments and removed after qualification. No schema change was introduced
by this increment and no durable database received the migrations.

## Remaining work

G-09 is closed. This does not implement G4-D I3 owner adapters/formal ingress or
G4-E E7/E8. The live priority remains: qualify one concrete deterministic
safety provider/rule artifact, bind the adopted G4-E owners default-off, run E8
joint conformance, then continue G4-D I3/I4. No activation or traffic is implied.
