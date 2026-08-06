# G3 Exit Qualification and T-006 Beta Profile Handoff

## Verdict

- Task: T-006
- Date: 2026-08-05
- Verdict: `G3_EXIT_PASS_RESTORED`
- Provider state: Nurture-side qualified, default-off
- Task state: `done`
- Non-effects: no existing database access, persistent qualification database,
  deployment, capability activation, Candidate, native/internal-store effect,
  T-008, Pilot, device validation or traffic authorization

G3-A, deterministic G3-B1, manual G3-C1, G3-D and G3-E are joined into one Exit
verdict. Optional G3-B2 AI copy and G3-C2 face match remain absent/default-off.
This handoff qualifies the Nurture scenario provider and its exact owner/consumer
boundary. It does not claim My-Chat native camera/cache/device/notification delivery
completion and does not authorize T-008 to start.

The original PASS was withdrawn after implementation-quality review found that the
per-target transaction did not enforce one frozen revision under concurrent first
commits, did not place every release gate in the effect transaction, and could mint a
valid-looking receipt reference from a receipt-less release row. Those defects were
repaired at the checkpoint below. A fresh empty-database qualification on the exact
detached topology passed all targeted, full, cross-owner and governance gates, so the
Exit verdict is restored rather than inheriting the historical run.

## Exact Bound Inputs

1. Surface contract: `nurture.surface-contract@1.15.0` /
   `sha256:a5e8e226704647f1a1d20d8b8faa91f955bcb5ca45ad2d583c0a85d5d7d0073e`.
2. My-Workflow-Base: `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
3. My-Chat: `a0195662228a2fc6323b9ea0cd327d3608d8cc17`.
4. Qualified Nurture implementation checkpoint:
   `03740871de5582b30af9eff5111c84398a61f490`.
5. T-005 exact G2 Exit provider:
   `../../archive/nurture-family-care-conversation/14-g2-exit-qualification-and-beta-handoff.md`.
6. T-007 publication-policy subset:
   `nurture.institution-publication-policy@1.0.0`, read-only exact provider with
   version/head/effective-window/timezone validation and no loose JSON fallback.

Owner/source recomputation passed for Base/My-Chat contract parity (11 files,
`8dd53be4…`), Base `web_workbench` (59 files), My-Chat `x5_joint_api` (169 files),
My-Chat `wave4_binding_host` (20 files) and the complete Nurture runtime population
(168 files, `b44f4fad985bf760b0bf1a6c4abac8badd7e91ea7999d829bb1fabcd2dfbf8c0`).

## Qualification Topology

The repair qualification used three adjacent exact detached worktrees. Package-manager
links, pin verifier and the formal scenario-service process therefore loaded the same
frozen sources. Frozen installs used `pnpm --ignore-scripts`; the necessary workflow/
Nurture packages and all required Prisma clients were built/generated explicitly.

One disposable `postgres:16-alpine` container named
`the-nurture-t006-g3-requal-20260805` used loopback `127.0.0.1:55437`, database
`nurture_g3_requal` and tmpfs storage. Existing listeners at 5433 and 55439 were
explicitly excluded and their container identities remained unchanged. All 16 Nurture
migrations were replayed from empty, migration status was current, and schema-to-DB
diff was empty. The named container/tmpfs was destroyed, port 55437 is free, and the
detached worktrees were cleanly removed through Git; the topology is reconstructible
from the exact revisions above.

## Exit Gate Mapping

| Exit requirement | Evidence | Result |
| --- | --- | --- |
| G3-0 and `T006-AC-001…010` exact contract/schema/profile freeze | G3 freeze, DB context, persisted-table and optional-profile census | PASS |
| G3-A shared facts, role-safe boards and canonical mutations | `T006-AC-011…020`, formal queries/actions and surface conformance | PASS |
| G3-B1 deterministic capture-to-draft | `T006-AC-021…030`, production DB trigger/admission and formal organize path | PASS |
| G3-C1 manual content/media safety | `T006-AC-031…040`, policy/media/exposure suites and T-005 direct-interaction joint path | PASS |
| G3-D schedule and per-target release | `T006-AC-041…050`, Serializable freeze-first transaction, in-transaction gate rereads, Receipt and Guardian reread | PASS |
| T-007/T-006 real provider/consumer integration | formal organize → provider-backed admission → reschedule → release on one persisted process | PASS |
| T-005/T-006 real provider/consumer integration | T-006 owner-issued option → exact G2-C prepare/execute | PASS |
| Formal ingress and real pinned owner path | 7 routes; 26 committed actions; 9 successful queries; 0 unrouted/unexercised | PASS |
| Default-off and no persistent/external effect | built smoke, activation census, resource destruction and excluded-listener proof | PASS |
| Exact bounded handoff | this record | PASS |

The checked high-level acceptance list is satisfied at the Nurture scenario,
cross-owner contract and handoff level. Items describing host cache, camera, native
performance, device interaction or notification behavior remain boundary requirements
for a future separately authorized My-Chat companion task, not T-006 claims.

## Mechanical Results

| Check | Result |
| --- | --- |
| repair-target DB suite | PASS — 2 files / 64 tests |
| isolated concurrent first-freeze regression | PASS — 3/3 |
| exact workflow/source pin and G2 preservation | PASS |
| aggregate and scenario-service DB typecheck | PASS |
| root unit suite | PASS — 52 files / 579 tests |
| scenario-service unit suite | PASS — 8 files / 52 tests |
| production DB suite | PASS — 21 files / 225 tests |
| formal owner integration | PASS — 2 files / 55 tests; actions 26, queries 9, unexercised 0 |
| runtime evidence census | PASS — 37 keys; SHA-256 `e02ee06300c3c232ca938314f38cec156fdc24a75fff11bf94fe4ad67e929910` |
| joint runtime markers | PASS — T-007/T-006 publication and T-005/T-006 direct interaction |
| surface conformance/tooling | PASS — 11 files / 110 tests; tooling 5/5 |
| clean migration/catalog/drift | PASS — 16 migrations; 61 tables / 90 enums; no drift |
| G2 DB preservation census | PASS — CareItems 53/11, Messages 74/12, violations 0 |
| built smoke | PASS — binding owner and Harness disabled, legacy route absent |
| final release census | PASS — 31 releases; 21 Receipts; 10 receipt-less fixtures; 0 receipt-less applied execution |
| disposable teardown | PASS — container absent, port 55437 free, excluded listeners unchanged |

## Beta Profile Handoff

T-006 hands off only this qualified, default-off profile:

- Guardian family board and Caregiver teacher board public view-model/query surfaces;
- 26 versioned actions and 9 queries through formal private Harness ingress;
- deterministic capture/organize/draft, manual attribution/exposure/safety and
  five-state `PublishProcess` behavior;
- exact T-007 policy-backed admission, frozen seven-field schedule, reschedule,
  scheduler/immediate release policy reread and per-target Receipt semantics;
- exact T-005 caregiver direct-interaction bridge for restricted content;
- correction/removal/redaction, owner-reread, provenance and raw-ID-safe projection;
- G3-B2/C2 absent/default-off and Workflow projection absent/excluded posture.

Any surface digest, owner revision/source hash, Nurture self-pin population, DB
schema/migration, T-005/T-007 exact contract, default-off posture or formal ingress
drift invalidates the affected portion and requires requalification. T-008 remains
unstarted and requires a separate governance decision and user authorization.
