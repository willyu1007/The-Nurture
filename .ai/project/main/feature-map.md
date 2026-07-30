# Feature Map

Project: `main`

## Semantic Feature Briefs (LLM-authored)
- Keep one subsection per active feature (`F-xxx`).
- This section is the LLM-authored semantic layer and is not overwritten by sync.
- LLM SHOULD generate or refresh this section from current task artifacts.
- Human review MAY refine wording, but structure SHOULD remain stable.

### F-001 MVP baseline delivery
- Intent: provide a clean, reviewable Nurture family-MVP baseline with production business persistence structurally separated from the backend-private workflow dev host.
- Scope In: scenario/repository restoration, production/dev-host dual Prisma streams, deterministic tests, frontend workbench, cross-repo revision/source pins, and local hardening.
- Scope Out: Institution Ecology business schema, My-Chat production runtime, Handoff Ledger, and non-empty activation.
- Decision: completed through the five-increment G0 merge, fresh-worktree verification, cleanup, and closure hardening; keep the verified task active until archival is explicitly approved.
- Dependencies: pinned My-Workflow-Base and My-Chat source revisions.
- Risks: treating the dev harness as production runtime or letting sibling source drift bypass the pin.
- Success Signal: 86 unit, 15 production DB, 16 dev-host E2E, dual catalog boundaries, seven-job main CI, and clean post-merge verification.
- Related Tasks: T-001 nurture-mvp (`done`).
- Next Checkpoint: archive T-001 after explicit approval; no additional G0 implementation remains.

### F-002 Institution ecology
- Intent: deliver child-scope-first family/institution care coordination with Nurture-owned business facts and My-Chat-owned account, shell, and durable runtime.
- Scope In: participants/roles, child care process, institution/group/enrollment/grant, family-care messages/items/receipts, class inbox, teacher attention, daily care, and media attribution.
- Scope Out: institution ranking, marketplace behavior, competitive caregiver scoring, My-Chat identity duplication, and ambient access to family-private data.
- Decision: X0-X5 and N1/X4-N2 are complete with exact cross-repository pins and default-off boundaries. The Wave 4 P2 implementation is CI-green but its source qualification is reopened until authority reread and receipt persistence are transaction-atomic and the repaired Host private-anchor/idempotency contract is pinned. Pilot-0-B/C and Pilot-0-D historical decisions remain traceable, but the 2026-07-29 CareGroup shared-responsibility decision supersedes C-3-3/C-4-4 exact-claimant reply and terminal-claimant staffing-blocked semantics. Those slices require redesign and requalification; C-3/C-4/D implementation remains unauthorized, and external traffic stays NO-GO.
- Dependencies: the current Pilot-0-C index, Pilot-0-D topology/operations contract and workflow context contract; pinned Base/My-Chat/Nurture revisions/hashes; strict C30-C35 then C40-C45 implementation/qualification; D implementation and immutable complete-candidate/evidence assembly; then Pilot-0-E before any Pilot-1 decision.
- Risks: confusing `DR-*` design findings with `TR-*` traffic blockers, treating green CI/design completion/X5 PASS or superseded exact-claimant evidence as source/deployment authority, issuing a receipt after its authority source changed, exposing stable anchors through Host clients, widening CareGroup responsibility to same-Institution access, bypassing the opaque My-Chat Child/Family binding chain, publishing mutable artifacts, or weakening owner-reread/revoke/privacy fences for pilot convenience.
- Success Signal: Pilot-0-C and D remain internally consistent at `DR-P0=0 / DR-P1=0 / DR-P2=0`; current C-3/C-4 qualification plus D inputs produce one immutable undeployed complete candidate with zero `QR-P0/QR-P1`; required `TR-*` blockers close; E signs one exact decision; every capability remains default-off until separately authorized Pilot-2.
- Related Tasks: T-002 nurture-institution-mode (`in-progress`).
- Next Checkpoint: repair and qualify the Wave 4 P1/P2 owner boundary with
  transaction/concurrency/privacy evidence, then run the separately scoped
  C30-C35, C40-C45 and D readiness review; Pilot-0-E and Pilot-1 remain
  blocked.

### F-003 Six-surface store-beta readiness
- Intent: turn the six-surface T-003 design into a qualified, default-off Nurture Service Candidate and versioned interface that My-Chat can integrate through authenticated API calls and validate on iOS and Android internal-testing channels.
- Scope In: product/public/presenter contracts, synthetic cross-role fixtures, guardian/caregiver conversation, family/teacher boards, institution mobile/Web surfaces, immutable Service Candidate qualification, interface handoff, and composite validation binding.
- Scope Out: an independent Nurture app shell, My-Chat identity/auth/runtime duplication, store credentials, TestFlight External, Google Play Closed/Open, production rollout, or real-traffic authorization.
- Decision: use five local task packages. T-004 establishes the shared surface contract;
  T-005 delivers `CareInteraction`/`ActionExecution`/`ActionDelivery`; T-006 delivers
  board projections and `PublishProcess`; T-007 owns institution-management
  `InstitutionWorkflow`, Web operations and mobile read-only
  `InstitutionWorkflowProjection`; T-008 freezes and qualifies one independently deployed
  Nurture Service Candidate plus its interface handoff. Store builds and device distribution
  remain in one external My-Chat companion task.
- Care Responsibility: family CareItems are jointly handled by the exact original
  `Enrollment + CareGroup`; acknowledge records class receipt and individual audit but does
  not create an exclusive claimant/assignment. The CareGroup is the family-facing business
  sender; any currently eligible caregiver in that exact CareGroup may append multiple replies,
  while individual executor identity remains audit/optional secondary attribution. The first
  reply resolves waiting-for-reply attention but does not close the Item.
- Board Publication: raw capture first accumulates in a CareGroup batch; only an explicit or
  institution-policy organize trigger cuts a stable source watermark, after which an
  ordinary/high-confidence draft gets a quick-adjust window and remains editable until actual
  release. Automatic triggers pass a short class-wide user-activity quiescence gate; manual
  organize bypasses it, and background upload/provider progress cannot hold the batch open.
  Routine content assembly uses caregiver-authored text, transcript and deterministic
  templates; generative copy is optional only after explicit caregiver request or within a
  separately governed summary. Nurture policy routes ordinary content through low-friction
  publication, reviewable ambiguity to caregiver review, and sensitive care events to an
  explicit T-005 family interaction rather than batch publication. Original media is not
  visually transformed. A dedicated, default-off,
  exact-CareGroup face matcher may automatically confirm only high-confidence child attribution;
  ambiguous results require caregiver handling, and biometric consent/PIPIA/privacy gates remain
  mandatory before activation.
- Institution Surfaces: mobile and Web are bound to one explicit active-role context; a
  multi-role user must switch roles and never receives a unioned super-surface. Lead is an
  Admin-managed internal designation with no permission delta. Current T-007 Web scope is only
  `InstitutionAdminWorkbench`, covering people/relationships, daily operations, parent reach,
  digital resources, institution knowledge/RAG and responsibility queues; non-Admin Web
  workbenches remain undefined. Admin mobile stays read-only and is class-first: each class has
  its own effective schedule, activity evidence timeline, today communication/attention and
  home–institution dynamics; park-level presentation only summarizes park-wide items and
  cross-class exceptions. Class cards use deterministic latest eligible media rather than an
  AI-selected representative image, expose canonical attendance submission state rather than
  inference, and keep full communication/child detail behind exact-purpose drill-down. Admin Web
  may create and read complete authorized photo/text records, set optional covers, and revise
  activity/child associations append-only while preserving teacher originals and automatic-match
  provenance. Support signals are noncanonical, two-tier (`action_required` /
  `attention_suggested`) projections derived from canonical deadlines/blockers or explicit
  Institution absolute count/time-window policies; they never use peer ranking, hidden AI scores,
  or automatic WorkItem/Workflow creation. Mobile displays at most three cross-class signals and
  body-free class counts, while Admin Web owns threshold configuration and explicit source
  actions. The first Institution Workflow implementation is limited to
  `EnrollmentJourneyWorkflowV1`, spanning inquiry, intent/optional visit, optional full-class
  capacity waitlist, trial preparation/care/review, enrollment offer, identity/Grant/Enrollment
  activation, settling, and completion. Capacity waitlist is distinct from waiting on a Guardian,
  caregiver, system owner, future date, or blocker; exact states/schema remain open until the
  journey deep dive closes. Explicitly disclosed institution-business communication is available
  to the exact Institution Admin through a request-time owner-read projection without teacher
  escalation, while family-private AI/drafts/private chat remain excluded and Admin read never
  grants CareGroup reply authority. A later AI attention capability may only highlight cited
  candidates inside that same scope and remains default-off. At daily attendance submission,
  AI may infer from stable business evidence, but only a currently assigned class caregiver can
  confirm canonical attendance. Admin may oversee, remind, return and reopen a prior day but
  cannot substitute for teacher confirmation. Institution Admin may author and publish medical
  as well as general knowledge and link authoritative sources; RAG must distinguish and cite
  institution versus authority revisions, retain provenance on reuse, and abstain rather than
  silently merge material medical conflicts.
- Invocation Contract: capability-specific typed input contains business fields only.
  Prepare binds the exact target and declared concurrency heads, actor/scope, canonical input
  hash and expiry into `confirmationRef`. Acknowledge uses exact-state concurrency; reply is
  append-compatible, so another valid reply is not stale. Preconditions and stable
  CommandExecution identity independently protect action safety and exact replay.
- Dependencies: T-003 six-surface design input; T-002 identity, authority, receipt, owner-reread, source-qualification and traffic gates; exact Base/My-Chat owner-contract pins.
- Risks: mistaking design or green CI for implementation authority, copying host runtime for
  speed, conflating interface integration with code/bundle adoption, allowing floating
  contract/environment bindings, leaking family-private facts into institution aggregates,
  calling every asynchronous/cross-owner action a Workflow, treating board projection as
  Workflow ownership, starting release intent from individual photo events, widening biometric
  matching beyond the current CareGroup/purpose/consent boundary, or treating internal beta as
  production approval; merging role surfaces, treating record coverage or AI inference as
  canonical attendance, letting Admin substitute for class-teacher confirmation, or presenting
  institution-authored medical material as an authoritative source.
- Success Signal: one immutable Nurture Service Candidate passes the six-surface black-box and negative conformance suite; a composite binding links its exact interface digest and test deployment to the My-Chat builds that pass TestFlight Internal plus Google Play Internal real-device validation.
- Related Tasks: T-004 through T-008 (`planned`).
- Next Checkpoint: T-004～T-006 顶层契约以及 T-007 角色/Admin Web、每日出勤和
  知识/RAG 决策已完成对齐；继续收敛 T-007 首批 `InstitutionWorkflow`、聚合隐私
  阈值与精确 schema。随后各任务仍需在 T-002 owner gates 下
  分别完成 contract/schema inventory、实现与资格验证；所有能力保持 default-off，
  external traffic 继续 NO-GO。

## Notes (manual)
- Keep human notes here. Everything below the AUTO section is generated by sync.

<!-- AUTO-GENERATED:START feature-map -->
## Features

### F-000 Inbox / Untriaged

- (no tasks)

### F-001 MVP baseline delivery

| Task | Status | Dev Docs |
| --- | --- | --- |
| T-001 nurture-mvp | done | dev-docs/active/nurture-mvp |

### F-002 Institution ecology

| Task | Status | Dev Docs |
| --- | --- | --- |
| T-002 nurture-institution-mode | in-progress | dev-docs/active/nurture-institution-mode |
| T-003 nurture-uiux-pitch | in-progress | dev-docs/active/nurture-uiux-pitch |

### F-003 Six-surface store-beta readiness

| Task | Status | Dev Docs |
| --- | --- | --- |
| T-004 nurture-surface-contract-foundation | planned | dev-docs/active/nurture-surface-contract-foundation |
| T-005 nurture-family-care-conversation | planned | dev-docs/active/nurture-family-care-conversation |
| T-006 nurture-child-care-boards | planned | dev-docs/active/nurture-child-care-boards |
| T-007 nurture-institution-surfaces | planned | dev-docs/active/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | planned | dev-docs/active/nurture-store-beta-readiness |
<!-- AUTO-GENERATED:END feature-map -->
