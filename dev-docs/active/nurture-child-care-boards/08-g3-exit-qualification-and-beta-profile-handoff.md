# G3 Exit Qualification and T-006 Beta Profile Handoff

## Verdict

- Task: T-006
- Date: 2026-08-05
- Verdict: `G3_EXIT_PASS`
- Provider state: Nurture-side `qualified`, default-off
- Task state: `done` after this record and governance sync land
- Non-effects: no existing database access, persistent qualification database,
  deployment, capability activation, Candidate, native/internal-store effect,
  T-008, Pilot, device validation or traffic authorization

G3-A, deterministic G3-B1, manual G3-C1, G3-D and G3-E are joined into one Exit
verdict. Optional G3-B2 AI copy and G3-C2 face match remain absent/default-off.
This handoff qualifies the Nurture scenario provider and its exact owner/consumer
boundary. It does not claim My-Chat native camera/cache/device/notification delivery
completion and does not authorize T-008 to start.

## Exact Bound Inputs

1. Surface contract: `nurture.surface-contract@1.15.0` /
   `sha256:a5e8e226704647f1a1d20d8b8faa91f955bcb5ca45ad2d583c0a85d5d7d0073e`.
2. My-Workflow-Base: `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
3. My-Chat: `a0195662228a2fc6323b9ea0cd327d3608d8cc17`.
4. Qualified Nurture implementation checkpoint:
   `97eab0388e3136cb1fda9735cadab334d5cbb587`.
5. T-005 exact G2 Exit provider:
   `../../archive/nurture-family-care-conversation/14-g2-exit-qualification-and-beta-handoff.md`.
6. T-007 publication-policy subset:
   `nurture.institution-publication-policy@1.0.0`, read-only exact provider with
   version/head/effective-window/timezone validation and no loose JSON fallback.

Owner/source recomputation passed for Base/My-Chat contract parity (11 files,
`8dd53be4…`), Base `web_workbench` (59 files), My-Chat `x5_joint_api` (169 files),
My-Chat `wave4_binding_host` (20 files) and the complete Nurture runtime population
(168 files, `4980226cba92780b558f60aa010b6d2c48917b379e901456d0acf931699a8b1a`).

## Qualification Topology

The run used three adjacent detached worktrees. Package-manager links, pin verifier
and the formal scenario-service process therefore loaded the same frozen sources.
Frozen installs used `pnpm`; required workflow/Nurture packages and Prisma clients
were built/generated explicitly.

One `postgres:16-alpine` container used loopback `127.0.0.1:55437`, database
`nurture_g3_exit` and tmpfs storage. The existing listeners at 5433 and 55439 were
explicitly excluded. All 16 Nurture migrations were replayed from empty, migration
status was current, and schema-to-DB diff was empty. The named container and tmpfs
were destroyed after final census; port 55437 is free.
After one final pin/G2/G3/formal-ingress rerun, the detached worktree topology was
moved to Trash and remains recoverable there.

## Exit Gate Mapping

| Exit requirement | Evidence | Result |
| --- | --- | --- |
| G3-0 and `T006-AC-001…010` exact contract/schema/profile freeze | G3 freeze, DB context, persisted-table and optional-profile census | PASS |
| G3-A shared facts, role-safe boards and canonical mutations | `T006-AC-011…020`, formal queries/actions and surface conformance | PASS |
| G3-B1 deterministic capture-to-draft | `T006-AC-021…030`, production DB trigger/admission and formal organize path | PASS |
| G3-C1 manual content/media safety | `T006-AC-031…040`, policy/media/exposure suites and T-005 direct-interaction joint path | PASS |
| G3-D schedule and per-target release | `T006-AC-041…050`, frozen schedule, reschedule/release, Receipt and Guardian reread | PASS |
| T-007/T-006 real provider/consumer integration | formal organize → provider-backed admission → reschedule → release on one persisted process | PASS |
| T-005/T-006 real provider/consumer integration | T-006 owner-issued option → exact G2-C prepare/execute | PASS |
| Formal ingress and real pinned owner path | 7 routes; 26 committed actions; 9 successful queries; 0 unrouted/unexercised | PASS |
| Default-off and no persistent/external effect | built smoke, activation census, resource destruction and excluded-listener proof | PASS |
| Exact bounded handoff | this record | PASS |

The checked high-level acceptance list is satisfied at the Nurture scenario,
cross-owner contract and handoff level. Items describing host cache, camera, native
performance, device interaction or notification behavior are boundary requirements
for the future My-Chat companion/T-008 implementation, not claims that those host
features were built in T-006.

## Mechanical Results

| Check | Result |
| --- | --- |
| exact workflow/source pin and G2 preservation | PASS |
| aggregate and scenario-service DB typecheck | PASS |
| root unit suite | PASS — 52 files / 577 tests |
| scenario-service unit suite | PASS — 8 files / 52 tests |
| production DB suite | PASS — 21 files / 216 tests |
| formal owner integration | PASS — 2 files / 55 tests; Harness 49, binding owner 6 |
| runtime evidence census | PASS — 37 keys; actions 26, queries 9, unexercised 0; SHA-256 `e02ee06300c3c232ca938314f38cec156fdc24a75fff11bf94fe4ad67e929910` |
| joint runtime markers | PASS — T-007/T-006 publication and T-005/T-006 direct interaction |
| surface conformance/tooling | PASS — 11 files / 110 tests; tooling 5/5 |
| clean migration/catalog/drift | PASS — 16 migrations; 61 tables / 90 enums; no drift |
| G2 DB preservation census | PASS — CareItems 68/11, Messages 97/12, violations 0 |
| built smoke | PASS — binding owner and Harness disabled, legacy route absent |
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
drift invalidates the affected portion and requires requalification. T-008 must
independently verify this record before any Candidate/native/device/deployment work;
that future verification requires separate user authorization.
