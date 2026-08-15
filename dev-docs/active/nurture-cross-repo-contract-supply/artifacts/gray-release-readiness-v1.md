# Gray-release readiness — joint assessment and forward tracks (v1)

- Date: 2026-08-15
- Baseline: The-Nurture `4b388d1` (CI green) · My-Chat `1cd1888` (CI green)
- Scope: what stands between the completed W2-W11 contract supply and a
  complete gray release — real deployed interop, per-surface ramp-up,
  observable, minute-level rollback. Fixture-level verification is done and
  is not repeated here.

## Goal definition

Complete gray release = the Nurture scenario-service and the My-Chat host
interoperate in a deployed environment; each surface opens behind its env
gate, ramps by family/org allowlist then percentage; refusal-code
distribution and ledger consistency are observable; any surface returns to
default-off within minutes by flipping its gate.

## Verified facts this assessment stands on (code-checked 2026-08-15)

1. Production `bootstrap()` calls `createScenarioServiceApplication()` with
   no input — **no owner binding is injected in production**. Even with an
   env gate set true, the process has no Prisma-backed binding; bindings are
   composed only in tests/e2e. This is the deliberate default-off posture,
   and it means "production assembly" is real, authorization-independent
   code work.
2. My-Chat has **no rollout/canary/feature-flag infrastructure**; a minimal
   control plane (per-surface gate + family/org allowlist ramp) must be
   built host-side.
3. Both sides observe through structured logs only
   (`nurture_scenario_service_log_v1` + request-logging middleware); no
   metrics aggregation exists. The three ramp metrics — reason-code
   distribution, ledger reconcile/replay rate, timeout rate — need a
   minimal log-aggregation answer.

## Gap list

| # | Gap | Repo | Needs activation authorization? | Notes |
|---|---|---|---|---|
| G1 | Activation authorization | governance | — | The only external input; blocks nothing below |
| G2 | Production assembly: gate-guarded Prisma binding factory in `main.ts` | Nurture | No (stays default-off) | See verified fact 1 |
| G3 | Deployment environment for scenario-service (containerization, config manifest, DB migration baseline) | Nurture | Deployment itself yes; preparation no | |
| G4 | Service trust: `NURTURE_INTERNAL_SERVICE_TOKEN` issuance/injection/rotation | both | No | |
| G5 | My-Chat wiring layer: the nine dormant strict clients have no host API/UI caller | My-Chat | No (wired but host-gated off) | Prerequisite for the joint rehearsal |
| G6 | Ramp control plane (per-surface gate + allowlist) | My-Chat | No | See verified fact 2 |
| G7 | Observability for the three ramp metrics | both | No | See verified fact 3 |
| G8 | Joint rehearsal: real-service replay of the frozen fixture scenarios plus fault injection (timeout, disconnect, auth failure) | both | Runs on staging | The only layer fixtures cannot cover: network, auth, real latency |
| G9 | First teacher/director Mobile UI batch (27 teacher-ready rows have no UI) | My-Chat | No | Mock-first per house rule |

## Three tracks — parallelism

Only the activation spine is serial: G1 authorization → staging deployment →
rehearsal → ramp. G2/G4/G5/G6/G7/G9 are authorization-independent, split
cleanly across the two repos (the only shared surface is the cross-repo pin,
handled by the per-batch reseal discipline), and can all start now.

- **Track A — activation spine**: A1 authorization (external) → A2
  production assembly (G2, can start now) → A3 staging deployment + token
  (G3/G4; containerization prep can start now) → A4 joint rehearsal (G8,
  needs B1) → A5 per-surface ramp (order below) → A6 full volume.
- **Track B — My-Chat wiring and UI** (starts now): B1 host wiring layer
  (G5) → B2 minimal ramp control (G6) → B3 first teacher UI batch (G9,
  class-stream + organization reads, matching ramp waves 1-3) → B4
  parent-side UI closure (P-G03 milestone card, P-H03 chat receipt —
  independent of the ramp).
- **Track C — remaining contract supply** (starts now): C1 director
  composition layer (host composed API + Mobile assembly; converts the 13
  D-O partial rows — W4 contract and dormant consumer already in place) →
  C2 reserved media ingress + upload proxy → C3 W1
  `family_growth_transport@1.1.0` callback runtime → C4 stragglers (lens
  context presenters S-01/S-03, P-H01 family-private lens context, P-G02
  scenario anchors, T-C08 scheduling, P-R03 cleanup consumer).

## Ramp order (risk-ascending)

| Wave | Surface | Contract (gate) | Risk | Key metrics | Rollback |
|---|---|---|---|---|---|
| 1 | Teacher class stream (read-only) | W6 `TEACHER_CLASS_STREAM_PRESENTER` | Lowest: pure reads | refusal distribution, p95, timeout rate | gate off, immediate |
| 1b | Parent context (read-only), once its owner ports exist | W2 `PARENT_CONTEXT_PRESENTER` | Low; blocked on supply gap 1 below | same as wave 1 | same |
| 2 | Director read-only (once C1 lands) | W4 `DIRECTOR_PRESENTER` | Low; heavy aggregate reads | + query latency | same |
| 3 | Teacher commands | W7 / W8 / W10 owner gates | Medium: first real traffic through the command ledger | **reconcile rate, `already_satisfied` replay hits, `command_write_conflict` count** | gate off; committed ledger entries are append-only and stay (replay converges after reopen) |
| 4 | Teacher media association | W9 gate | Medium | attribution-count spot checks | same |
| 5 | Parent communication extension (redaction/receipts) | W11 `PARENT_COMMUNICATION_EXTENSION` | Highest: user-visible destructive semantics | preview/commit agreement, `command_payload_conflict` refusals | gate off; performed redactions are contractually irreversible — smallest allowlist, longest observation |

Within each wave: staging full → production allowlist (single-digit
families/orgs) → percentage → full; the three G7 metrics gate each step.

## Pre-ramp checklist (joint sign-off)

- [ ] G1 explicit authorization on record
- [ ] G2 assembly landed; default-posture test (all gates false → all
      routes 404/degraded) still green
- [ ] G3 staging interop both ways; DB migration baseline flat
- [ ] G4 token issuance/rotation exercised once
- [ ] G5 wiring reaches all nine clients; host-side default-off test green
- [ ] G6 gate-off drill under one minute
- [ ] G7 three metrics readable on staging
- [ ] G8 rehearsal green, refusal codes matched to the contracts line by line
- [ ] G9 wave-1 UI usable
- [ ] Cross-repo pin resealed at the rehearsal head; both CIs green

Presentation copies of this assessment (HTML status report + Markdown plan)
live outside the repo per house rule; this artifact is the maintained
project record.

## Amendment 2026-08-15 — A2 assembly findings

The A2 production-assembly work (commit `dc92d97`) established that only
the five teacher surfaces (W6-W10) have production-ready Prisma
compositions in `@the-nurture/db`. Three supply gaps join Track C and
gate the affected ramp waves:

1. W2 parent-context presenter — no Prisma owner composition exists;
   wave 1b waits on it.
2. W4 director presenter — no Prisma owner composition exists; wave 2
   waits on it in addition to the director composition layer (C1).
3. Parent-communication owner + extension — missing a production
   `ParentCommunicationContextSelectionPortV1` host adapter; wave 5
   waits on it.

Until each gap closes, its gate fails fast at startup by design (the
assembly refuses with a structured log naming the missing piece), so a
premature flip cannot limp into undefined behavior.
