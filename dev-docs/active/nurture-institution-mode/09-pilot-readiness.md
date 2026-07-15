# Pilot Readiness — Institution Ecology

## Status and authorization

- **Review date:** 2026-07-16
- **Current checkpoint:** Pilot-0-A cross-repository readiness audit complete
- **Decision:** **GO for Pilot-0 readiness continuation; NO-GO for external pilot traffic**
- **Authorization boundary:** the review changes only task/governance evidence. The review does not authorize a database apply, artifact publication, secret configuration, capability or manifest-composition change, external traffic, Pilot-1 through Pilot-4, staging, production, or GA.

Pilot-0 answers whether the reviewed X5 implementation can be turned into a bounded pilot safely and what must be built first. X5 proved the contract, persistence, replay, privacy, and failure semantics in deterministic and isolated joint tests. X5 did not produce a deployable, authenticated, user-operable institution product surface.

## Immutable review baseline

| Repository | Reviewed revision | Relevant evidence |
| --- | --- | --- |
| My-Workflow-Base | `acba4e792c85131c19e63e08a5f671133c481c57` | vNext additive handoff/driver/capability contract and conformance harness. |
| My-Chat | `a1b5e64c84c9865e34abb7068be10352cf42c949` | X2-X5 Step/Handoff/Outbox/owner delivery, CI and image-build gates; staging/prod capability false. |
| The-Nurture | `058c792dc86c0f41797632ebabc6f9a04fec6c18` | N1/X4/X5 business kernel, pre-activation default, activation-only factory, owner reread, CI/governance baseline. |
| Shared contract | `0bd8925ec8da88e0b7d0aa76b33bef94c471ff52499651c7b0c2a5da381501aa` | Base/My-Chat path-content contract hash. |
| Nurture activation source | `e976c235962c827367d1c13dcc603a0d315fdac118daf03f00a3df85e153d193` | Exact 25-file X5 activation-critical source population. |

The live pin verifier passes at these revisions. All worktrees were clean before the review branch was created.

## Readiness classification

| Layer | Current state | Pilot interpretation |
| --- | --- | --- |
| Shared contract and validation | Closed and version-pinned | Ready. Legacy remains compatible; vNext fails closed without host capability. |
| My-Chat Step/Handoff/Outbox kernel | Implemented and joint-tested | Ready as a technical kernel, subject to pilot topology and workspace gate. |
| Nurture family-input command/replay/owner read | Implemented and joint-tested for `family_care_question` | Ready as a domain kernel, not yet as a user-facing service composition. |
| Default runtime posture | Nurture dev host is pre-activation; My-Chat staging/prod false | Safe default. The dev host is intentionally not a pilot runtime. |
| Institution user experience | Read-only domain handlers exist; no institution frontend/action closure | Not ready for real users. |
| Provisioning and consent operations | Schema and policies exist; fixtures create topology directly in tests | Not ready. No authenticated onboarding/control path exists. |
| Deployment and operations | My-Chat images build; Nurture packaging/deploy remains an empty scaffold | Not ready for Pilot-1. |
| Observability | Metric/log contracts and injected sinks exist in tested paths | Partial. No deployed sink, dashboard, alert, or incident ownership is configured. |

## Implemented-capability inventory

The pilot scope must follow executable evidence, not the broader product roadmap.

| Product item | Schema/domain | Advertised handler | User surface/action | Joint X5 evidence | Pilot-0 disposition |
| --- | --- | --- | --- | --- | --- |
| `class_family_inbox/open_class_family_inbox` | Yes | Yes | No mounted production shell route or institution UI | Surface policy/query tests only | Target read surface after IIB closure. |
| `class_family_inbox/capture_family_input` | Yes | Activation-only | No production host composition or guardian input surface | Yes, for `family_care_question` | Only candidate write entrypoint for first pilot. |
| `teacher_attention_board/open_today_attention_board` | Yes | Yes | Notification open stops at a generic availability card; no board navigation/detail | Owner reread and stale-open tests | Target read surface after IIB closure. |
| Caregiver acknowledge/reply | Command specs and DB transactions exist | No workflow/internal API handler | No teacher action UI | Domain/DB tests, not a live product journey | Must be wired before real traffic. |
| Family receipt/response timeline | Message/receipt facts exist | No complete presenter/action API | No guardian receipt/reply UX | Domain/DB tests | Must be wired before real traffic. |
| Grant/revoke | Schema, policy and command exist | No authenticated guardian/admin control surface | No consent UX | Revoke is joint-tested fail-closed | Must be wired before real traffic. |
| `caregiver_daily_care` | Schema/design types only for the intended capability | Not advertised as an equivalent executable capability | None | No equivalent joint journey | Out of first pilot. |
| `child_media_attribution` | Persistence/repository foundations exist | Not advertised as an equivalent executable capability | None | No equivalent joint journey | Out of first pilot. |

The first pilot must therefore not claim all four roadmap capabilities. Its only eligible business data class is `family_care_question`, without attachments, using the reviewed immediate route with acknowledgment and reply required. `care_day_note`, `care_constraint_update`, `family_follow_up_request`, `daily_care_log`, health observations, and media attribution remain outside the first pilot until they receive equivalent handler, UX, privacy, and joint evidence.

## Blocking findings

### P0 — blocks any external pilot traffic

1. **No production activation composition.** `createNurtureActivationScenarioModule` exists, but no runnable My-Chat composition loads the Nurture scenario package, supplies the host seed/Actor readers, opens the separate Nurture repository, and advertises the capability. The Nurture backend is explicitly a dev-host harness and constructs `createNurtureScenarioModule`, which is pre-activation.
2. **The IIB workflow is not operable.** The Nurture frontend contains only family-project workbench pages. The manifest declares institution inbox/attention routes, but the current Fastify server does not mount them. My-Chat mobile can only display a generic “available in teacher attention board” card. Caregiver acknowledge/reply and guardian receipt/reply are not exposed through live handlers/routes or UI.
3. **No controlled onboarding path.** Institution, group, participant, role, child process, enrollment, thread, and grant creation occur through direct Prisma fixture writes in tests. A real pilot cannot rely on manual database edits as an identity, authorization, or audit mechanism.
4. **No workspace-level activation gate.** My-Chat has one environment-global `WORKFLOW_HANDOFF_MATERIALIZATION_V1_ENABLED` switch. A value of `true` enables the owner consumer and host capability for the entire environment. Pilot-2 requires a second, fail-closed workspace allowlist; the global flag alone is insufficient.
5. **No deployable Nurture artifact/topology.** `ops/packaging` has no service definitions, `ops/deploy/config.json` has no registered services, and the deploy script is a placeholder. The current backend also exposes dev-host workflow/project routes without production authentication and must not be deployed as-is.
6. **Operational recovery is not instantiated.** Contracts cover telemetry and X5 covers Admin recovery semantics, but the proposed pilot still lacks deployed metric/log sinks, dashboards, alerts, backup/restore evidence, credential-rotation procedure, named incident owners, and an executable kill-switch runbook.

### P1 — must be closed or explicitly accepted before Pilot-2

1. The retention/legal wording for grant revoke and the encryption/KMS/attachment posture remain production gates. The first pilot avoids attachments but still needs a written retention and access policy for question content.
2. User-value evidence is not yet instrumented. Existing telemetry measures technical command/owner behavior, not teacher triage time, guardian completion, or operator manual intervention.
3. Mobile distribution and deep-link routing for the approved pilot cohort need an explicit delivery channel; My-Chat container images do not package the mobile client.

## Recommended first-pilot slice

### Pilot-0-B1 — internal experiment cohort (LOCKED, REVISED)

The owner refinement supersedes the earlier proposed 2 then 5–8 real-cohort shape. The first experiment MUST remain internal and use one allowlisted test workspace:

1. Create one synthetic institution, one synthetic care group, three synthetic child care processes, and three distinct synthetic families. Each child care process has exactly one independent family in this experiment.
2. One family has two guardian participants; the other two families have one guardian participant each. The experiment therefore uses four distinct guardian identities and four distinct My-Chat test accounts.
3. The two-guardian family MAY label its internal personas “father” and “mother”, but the domain contract remains two `guardian` role assignments and MUST NOT hard-code one family structure as a product requirement.
4. One designated primary guardian in each family creates the grant and submits the question. The second guardian in the two-guardian family validates same-family receipt/reply visibility. Every guardian MUST be denied access to the other two families.
5. All child, family, institution, and message data are synthetic. One internal tester MAY operate multiple personas, but every account, session, command actor, and audit record remains distinct.
6. This cohort validates structure, isolation, multi-guardian visibility, correct reply routing, per-family revoke, notification, deep link, and owner reread. It does not claim real caregiver-efficiency or institution-value evidence.
7. The real Pilot-4 cohort size and expansion policy remain uncommitted until the internal experiment passes its stop gates and Pilot-4 receives separate authorization.

### Pilot-0-B2 — role/personnel matrix

- **B2-1 guardian matrix: LOCKED.** Four guardian accounts across three families: `2 + 1 + 1`.
- **B2-2 institution/caregiver/operator matrix: LOCKED.** The internal experiment uses one institution administrator, one lead caregiver, no backup caregiver, and one internal technical operator.

The B2-2 role boundary is exact:

1. The institution administrator and lead caregiver are separate My-Chat users and separate Nurture participants. Role overlap is not permitted in the internal experiment.
2. The institution administrator configures the synthetic institution, care group, participant invitations, and enrollment setup. The administrator MUST NOT grant on behalf of a guardian and has no default permission to read family question content.
3. The lead caregiver is the only caregiver work actor. The caregiver opens the class inbox/attention board and performs acknowledge/reply actions for all three child scopes under one care-group assignment.
4. No backup caregiver is included. Caregiver reassignment, duty handoff, and multi-caregiver concurrency are outside the first internal experiment.
5. The internal technical operator is a My-Chat host/admin identity, not an implicit Nurture business participant. The operator may inspect technical Run/Step/Handoff/Outbox/notification evidence and invoke allowlisted recovery, but MUST NOT read or edit Nurture business content or lifecycle state.
6. The matrix contains seven logical test accounts: four guardians, one institution administrator, one lead caregiver, and one technical operator. One internal human MAY operate multiple accounts, but account, session, actor, role, and audit evidence remain distinct.

The remaining rows are recommendations until their Pilot-0-B decision is explicitly accepted.

| Dimension | Recommended lock |
| --- | --- |
| Environment | A new isolated `pilot` environment, separate from current dev, staging, and production. No shared database. |
| Cohort | **LOCKED by revised Pilot-0-B1:** one allowlisted internal test workspace; one synthetic institution/group; three synthetic child scopes and three independent families. Real Pilot-4 cohort sizing remains open. |
| Guardian matrix | **LOCKED by Pilot-0-B2-1:** one family has two guardians, the other two have one guardian each; four distinct My-Chat test accounts. |
| Staff/operator matrix | **LOCKED by Pilot-0-B2-2:** one separate institution administrator, one lead caregiver, no backup caregiver, and one non-business technical operator; seven logical accounts in total. |
| Business path | Guardian private input → `family_care_question` → class inbox/teacher attention → caregiver acknowledge + reply → family receipt/reply → grant revoke/stale-open check. |
| Data | Text question only, no attachment, no health observation, no media, no daily-care log, no batch import. `requires_ack=true`, `requires_reply=true`, immediate route. |
| Operation model | Operator-assisted and allowlisted. No self-service institution signup and no traffic outside the named workspace. |
| Observation window | Five consecutive operating days after Pilot-3 rehearsal passes. Extend only by explicit Pilot-4 decision. |

## Recommended delivery contract

The pilot topology should preserve runtime and data ownership rather than promote the dev host:

1. My-Chat API/workers remain the host for account auth, Workflow Run/Step/Handoff/Outbox, notification, deep link, and Admin technical recovery.
2. The My-Chat worker build consumes an immutable, exact-revision Nurture scenario artifact and constructs `createNurtureActivationScenarioModule` with host-owned seed/Actor/claimed-Step ports and a separate Nurture database client. The Nurture package does not acquire queue, lease, attempt, or Handoff Ledger ownership.
3. An intentionally small Nurture owner API serves current-state owner reads over a private service network with scoped service authentication. The current dev-host workflow/project API is not part of the artifact.
4. My-Chat authenticated shell routes invoke Nurture-owned presenters/actions. Raw Nurture business routes are not exposed directly to clients.
5. Activation requires both the environment capability and an exact workspace allowlist. Removing either one stops new activation and owner delivery fail-closed.
6. My-Chat and Nurture databases, migrations, backup/restore evidence, secrets, artifact provenance, and service-to-service token scope remain separate Pilot-1 deliverables.

If the approved topology uses the current My-Chat container publication path, ACR credentials/publication become a Pilot-1 prerequisite. ACR is not required for Pilot-0 documentation and is not configured here. Nurture still needs its own real artifact definition regardless of registry provider.

## Minimum IIB closure before real traffic

1. Authenticated institution onboarding/control plane for institution, care group, participant mapping, role assignment, child process, enrollment, thread, grant, revoke, and cohort disablement; all authoritative writes use the Nurture CommandExecution kernel.
2. Guardian UX for explicit grant review, question submission, sent/blocked/replied receipt state, reply display, and revoke with clear consequence/retention text.
3. Teacher mobile/web UX for class inbox, attention board, item detail, acknowledge, reply, current-scope re-resolution, empty/error/permission states, and no direct cross-family chat.
4. Owner-reread on every open and action; workspace, role, care group, enrollment, grant, thread membership, receipt, redaction, and current policy remain fail-closed.
5. Authenticated My-Chat shell routing and negative tests for cross-workspace, cross-child, stale notification, revoked grant, and disabled cohort.
6. Manual journey evidence for onboarding → question → attention → acknowledge/reply → family receipt → revoke, on the exact pilot artifact and topology.

## Success and stop contract

### Success criteria

Pilot-4 may recommend continuation only when all of the following hold for the complete observation window:

- every participating guardian can submit at least two eligible questions and see the current receipt/reply without operator database intervention;
- the caregiver can triage, acknowledge, and reply across at least two child scopes from the aggregated board without entering a direct family chat;
- every accepted write has one CommandExecution/business effect, one original-Step replay owner, at most one Handoff, and at most one logical notification delivery;
- revoke, redaction, disabled cohort, and stale deep-link opens fail closed on current owner reread;
- every retry/dead-letter/manual-review case is visible to the named operator and resolved through an allowlisted action or explicitly stopped;
- the observation record contains latency, retry/replay, context-ref count, LLM-call/cache count, manual intervention, and product-completion evidence without business bodies or claim material in telemetry;
- backup restore, credential rotation, owner outage, and capability kill-switch rehearsals pass on the approved topology.

### Immediate stop criteria

Any one of these stops new pilot writes immediately and triggers the kill switch:

- cross-workspace, cross-child, cross-family, or unauthorized-role disclosure;
- revoked/redacted/cancelled content remains readable after current owner reread;
- duplicate Nurture business effect, wrong-Step replay acceptance, duplicate Handoff, or non-idempotent delivery;
- claim token, protected body, attachment, or forbidden identity/driver material appears in logs, Outbox, Handoff, notification, or My-Chat persistence;
- the workspace allowlist cannot isolate the pilot cohort or the capability cannot be disabled without changing committed Nurture facts;
- unrecoverable database integrity/drift, missing backup, loss of audit evidence, or an owner outage that does not fail closed;
- any health content is treated as diagnosis, prescription, emergency replacement, or medication advice.

Product friction, latency, or provider failure that does not create a privacy/integrity breach pauses the affected journey and enters operator review; such a failure does not justify bypassing policy or editing business state directly.

## Rollback evidence required before Pilot-2

- Two-key kill switch demonstrated: remove workspace allowlist first, then disable environment capability; both prevent new activation.
- Existing Nurture message/item/receipt/Execution facts remain intact and auditable; rollback never rewrites or deletes them.
- Requested/failed Handoffs are stopped or reconciled through My-Chat owner actions; Admin never edits Nurture facts.
- Notification/deep-link opens after rollback return unavailable through current Ledger + Nurture reread.
- Both databases have tested backup/restore and forward-migration procedures; no distributed rollback is required.
- Service token rotation and revocation are demonstrated without persisting or logging the token.

## Pilot-0 checkpoints

| Checkpoint | State | Exit evidence |
| --- | --- | --- |
| Pilot-0-A — baseline and actual-capability audit | **Complete** | Exact revisions/hashes reverified; executable capability, runtime composition, IIB, provisioning, delivery, security, and observability gaps classified. |
| Pilot-0-B — cohort and data-class lock | **In progress — B1/B2 locked** | B1 locks the three-child/three-family synthetic internal cohort. B2 locks seven logical accounts across guardians, institution admin, lead caregiver, and technical operator. B3 business path/data-class decisions remain open. |
| Pilot-0-C — IIB and onboarding closure contract | **Proposed** | Minimum guardian/teacher/admin journeys and authenticated action boundaries accepted. |
| Pilot-0-D — topology, operations, success/stop/rollback contract | **Proposed** | Isolated pilot topology, two-key allowlist, five-day window, ownership, recovery, stop, and rollback terms accepted. |
| Pilot-0-E — final Go/No-Go | **Pending** | Blocker owners and implementation nodes assigned; Pilot-0 evidence reviewed. Only then may the user separately authorize Pilot-1. |

Pilot-0 is not complete while Pilot-0-B through Pilot-0-E remain unresolved. The current decision is deliberately **NO-GO for external traffic** and **GO for readiness decisions only**.
