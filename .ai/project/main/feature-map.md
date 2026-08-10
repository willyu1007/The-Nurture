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
- Decision: X0-X5、N1/X4-N2、formal NestJS ingress M0-M5、T-004 Surface Contract `1.7.0` 和 G1 Joint Conformance 已在 exact My-Chat `a019566` / Base `06303e9` pins 上完成。受保护的 T-005～T-007 实现已开放，但所有能力仍 default-off；这不创建 Service Candidate、部署、激活或流量授权。T-002 继续负责 C30-C35、C40-C45、D 与 Pilot gates。2026-07-29 CareGroup shared-responsibility decision 继续取代旧 exact-claimant/terminal-claimant 语义；T-005 G2 与 T-006 G3 exact Exit 均已通过，且不替代 T-002 尚未完成的 cross-repository C/D 与后续 Pilot gates。
- Dependencies: the current Pilot-0-C index, Pilot-0-D topology/operations contract and workflow context contract; pinned Base/My-Chat/Nurture revisions/hashes; strict C30-C35 then C40-C45 implementation/qualification; D implementation and immutable complete-candidate/evidence assembly; then Pilot-0-E before any Pilot-1 decision.
- Risks: confusing `DR-*` design findings with `TR-*` traffic blockers, treating green CI/design completion/X5 PASS or superseded exact-claimant evidence as source/deployment authority, issuing a receipt after its authority source changed, exposing stable anchors through Host clients, widening CareGroup responsibility to same-Institution access, bypassing the opaque My-Chat Child/Family binding chain, publishing mutable artifacts, or weakening owner-reread/revoke/privacy fences for pilot convenience.
- Success Signal: Pilot-0-C and D remain internally consistent at `DR-P0=0 / DR-P1=0 / DR-P2=0`; current C-3/C-4 qualification plus D inputs produce one immutable undeployed complete candidate with zero `QR-P0/QR-P1`; required `TR-*` blockers close; E signs one exact decision; every capability remains default-off until separately authorized Pilot-2.
- Related Tasks: T-002 nurture-institution-mode (`in-progress`).
- Next Checkpoint: preserve the exact T-005 G2 and T-006 G3 handoffs. `C30-I0`
  and Base-only I1-A are complete; C30-I1 remains split into ordered I1-A..F.
  I1-B scope is frozen around neutral reservation/pair/evidence/recovery wires;
  Base-only I1-B is accepted at source `edbcd74…` plus lock `9a15865…` after
  cumulative qualification. I1-C subject-context/presentation is reaccepted at
  successor Base source `ae0c357…` plus lock `3c30337…` after artifact 26-27
  quality repair; the earlier chain is historical. Artifacts 34-35 reaccept I1-D
  at successor Base source `3580a9b…` plus lock `1cb5691…` after closing five
  composition findings; the artifact-33 chain is historical. Neutral direct/claimed
  names stay unchanged and manifest/source convergence remains I1-F. Artifact 36
  froze I1-E as a dedicated plaintext carrier plus body-free lifecycle controls,
  no-copy negatives and five ordered E1-E5 units. Artifacts 42-43 reaccept I1-E at
  successor Base source `48fd3d6…` plus metadata lock `9abde2b…` after closing four
  deterministic validation/composition findings; artifacts 37-41 and their
  source/lock remain historical. Artifacts 44-50 complete and reaccept I1-F at
  successor Base source `15ff031…` plus lock `4350086…`. Artifact 51 freezes
  C30-I2 generic My-Chat adoption as ordered I2-A..G. Artifact 52 accepts that
  chain plus its nine-finding remediation at My-Chat runtime `658b897…`,
  replacement lock `6725dc6…`, aggregate `8172e370…10a5ad` and archive
  `cd7bbc2…`; the first I2-G lock is historical. Artifact 53 freezes C30-I3 as
  ordered I3-A..G, with exact upstream pins, a production trusted+presentation
  complete prefix, detached owner trust, typed Participant/pair association,
  canonical action runtime, protected KMS/retention lifecycle and default-off
  convergence. Artifacts 54-60 record ordered I3-A..G and final acceptance at
  Nurture source `c8b9ce2…`, lock `15207ba…`, aggregate `5c08b542…c4ab6` and
  default-off census `448d37e1…3c3e`; the fresh 19-migration database was
  destroyed and 55440 is free. The next eligible decision is only a separately
  authorized C30-I4 scope review. I4 implementation, C31-C35, C40-C45, D,
  Pilot-0-E and Pilot-1 remain unstarted, and no downstream PASS is deployment
  or traffic authority.

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
  remain in one external My-Chat companion task. The Candidate is an immutable Nurture
  server release unit, not a source tag or full-stack/mobile release: its identity freezes the
  executable artifact, schema/migrations, scenario manifest, exact interfaces, gate/config
  contract and owner pins. Qualification results, deployment bindings, My-Chat builds and
  device evidence reference that identity externally; they do not become Candidate inputs or
  runtime dependencies. This is the release/qualification composition layer in a layered
  version model, not a global version that replaces Git, migrations, interface identities,
  owner pins, environment bindings or cross-owner validation identities. Candidate creation
  and qualification leave every capability default-off and grant no activation or traffic
  authority. Freeze begins only after T-004 through T-007 complete their task-level Exit Gates
  with exact qualified handoffs and the specific T-002 owner/source paths used by the beta
  profile are implemented, jointly qualified and pinned. T-002 may otherwise remain in progress
  and production/external traffic may remain NO-GO; a missing required six-surface path blocks
  Freeze rather than becoming a default-off or limited-pass placeholder. Each Candidate
  deployment is identified separately by an immutable, post-deploy readback-verified
  `NurtureDeploymentBindingV1` that records the actual executable, migration head,
  qualification-relevant configuration, owner deployments and effective gates without secrets
  or traffic authority. Environment drift and rollback create new bindings while leaving the
  Candidate and historical bindings unchanged. My-Chat consumes that deployment only through
  authenticated APIs pinned to the exact Interface Contract ref/digest; generated consumer
  clients/types are allowed, but Candidate/source/ORM/runtime adoption and Host copies of
  Nurture canonical facts are forbidden. Host authentication supplies trusted caller/Workspace
  context while Nurture independently rereads business authority for every protected request;
  contract mismatch or dependency loss fails closed without floating, legacy or synthetic
  fallback. My-Chat then produces immutable, internal-store real-device
  `PlatformValidationRecordV1` evidence for iOS and Android. T-008 may compose a final
  `CompositeValidationBindingV1` only when Nurture local qualification and both platform
  records share the exact Candidate, interface, Deployment Binding, beta profile and suite.
  Shared-input changes require both platforms to rerun; a one-platform build-only change may
  reuse the unchanged platform record but always creates a new composite identity. Each
  composite receives an immutable `InternalBetaDecisionV1`: PASS requires all required
  profile/safety checks; `PASS_WITH_LIMITATIONS` may complete T-008 only for structured,
  optional and fail-closed limitations while every required and authorization/privacy/data-
  integrity invariant passes. Required-path, security, lifecycle, migration, contract or
  real-device evidence defects are always NO-GO, and no internal verdict authorizes external
  beta, production or real traffic. Defects route to the smallest owning layer:
  Candidate/contract fixes mint a new Candidate, deployment fixes a new observed binding,
  platform-consumer fixes a new affected build/record, and evidence-only faults rebuild only
  the affected evidence when all inputs remain exact. Append-only invalidation removes current
  applicability without deleting history. Rollback requires exact consumer/schema/owner
  compatibility and always produces a new binding plus full local and dual-platform
  revalidation; destructive database down migration is not the default. These evidence roles
  are implemented just in time by T-008 and do not require T-004～T-007 to build a new release
  service, database or control plane. Upstream work supplies its existing exact handoff
  artifacts; the initial T-008 implementation should prefer canonical manifests, digests,
  append-only evidence and CI/CLI checks.
- G1 Foundation: G1 fixes a four-layer chain from My-Chat authenticated principal
  through canonical Child/Family binding and Nurture typed workspace-local association
  to Nurture current business authority. Private service identity never substitutes for
  the adult; binding-owner Receipt and business Execution/Receipt remain transactionally
  exact but semantically distinct. T-004 publishes one reproducible exact Surface Contract
  Artifact Set; T-002 publishes an Owner Integration Handoff through the formal NestJS
  scenario-service ingress after provisional Fastify owner proof; one Joint Conformance
  Record runs the same fixtures against both. Public-contract drift invalidates synthetic
  and joint evidence, owner/pin/ingress drift invalidates owner and joint evidence, and
  security/privacy risk invalidates immediately. G1 PASS still grants no Candidate Freeze,
  persistent DB apply, internal-store testing, activation or traffic.
  T-004 Phase 0～4、T-002 M5 and G1 Joint Conformance are complete. The exact qualified
  identity is `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`
  at My-Chat `a019566` / Base `06303e9`. T-004 is done; any additive contract or pin
  rotation is owned by the consuming T-005～T-007 work and must requalify its exact path.
- Stage G2: reuse T-005 for the first Nurture-side family/CareGroup CareInteraction
  delivery. G2-A qualifies the Guardian submit → CareGroup acknowledge → one-or-more
  caregiver reply Core Loop; G2-B completes correction/withdrawal/redaction and the
  Institution Admin source-side owner-read projection; G2-C supplies T-006 with a
  dedicated caregiver-initiated, exact-target protected direct-interaction capability.
  G2-A is PASS with the three-axis CareItem schema, Harness kernel, submit/acknowledge/
  reply actions, four formal ingress lanes, role-safe queries and negative/concurrency/
  leakage coverage. G2-B lifecycle/Admin owner-read and G2-C direct interaction are
  also checkpoint PASS; final formal NestJS + real pinned owner-path qualification,
  exact `1.8.0` artifact requalification and single-writer/cutover census are PASS.
  T-005 is done at `nurture.surface-contract@1.8.0` / `sha256:4fe91e13…`; exact
  evidence and invalidation rules are in
  `14-g2-exit-qualification-and-beta-handoff.md`. G2 PASS is a Nurture-side provider
  handoff, not T-006/T-007 consumer adoption, My-Chat native/device completion,
  Candidate Freeze, activation or traffic authority.
- Stage G3: reuse T-006 and deliver five checkpoints. G3-A builds the shared,
  role-safe Guardian/Caregiver board foundation; G3-B carries CareGroup capture to
  one exact saved draft through deterministic assembly; G3-C owns content/media
  eligibility, manual attribution and the G2-C safety route; G3-D owns the five-state
  PublishProcess and per-target PublicationRelease; G3-E performs real cross-task
  qualification and issues the T-006 Beta Profile Handoff. G3-B1 deterministic and
  G3-C1 manual paths are required. Explicit AI copy and ClassScopedFaceMatch are
  optional parallel enhancements unless the beta profile marks them required.
  G3-E requires the exact T-005 G2-C provider and T-007 publication-policy subset,
  but G3-A～D do not wait for them and T-006 does not wait for full T-007 completion.
  The repaired exact Exit is `G3_EXIT_PASS_RESTORED` at Nurture `0374087…`,
  surface contract `1.15.0` and the 168-file self-pin `b44f4fad…`. Formal owner,
  both joint journeys, full production DB, default-off census and teardown passed;
  T-006 is done and awaits separate archival approval.
- Stage G4: reuse T-007 and organize delivery as G4-0 Contract & Fact Freeze,
  G4-A Authority/Aggregate Foundation, G4-B Role-bound Mobile Operations,
  G4-C InstitutionAdminWorkbench Core, G4-D Enrollment Journey Workflow,
  G4-E Institution Knowledge/RAG and G4-F Integration Qualification/Handoff.
  This is a delivery/acceptance view over the existing Phase 0～5 and does not
  reopen D-01～D-07G. G4-0 is a rolling per-domain gate rather than a monolithic
  serial phase: its publication-policy subset is delivered first for T-006 G3-D/E,
  then B/C/D/E proceed dependency-aware in parallel after their exact freeze rows
  and relevant G4-A foundation are ready. D supplies versioned Workflow
  projections/commands to B/C; absence remains a legal mobile empty state and Web
  does not register placeholders. G4-F is the final join, while branch-local
  negative/integration qualification remains mandatory. G4-0 itself is fixed as
  0A Freeze Protocol/Fact Inventory, 0B publication-policy fast lane, 0C
  Authority/Surface, 0D Daily Operations, 0E Workflow/Enrollment, 0F Knowledge/RAG
  and 0G rolling audit/branch release. The register explicitly includes active-role/
  Surface, class activity/revision/attribution and generic InstitutionWorkflow
  carrier/projection records. A Branch Freeze PASS opens only its implementation
  inputs; it is not Owner Readiness, Joint Conformance, Beta Handoff or activation.
  G4-0A exact dependency/fact/schema/census inventory is PASS. G4-0B's
  `nurture.institution-publication-policy@1.0.0` bounded provider/consumer path is
  qualified through the T-006 handoff and remains default-off. 0C～0E are now frozen
  and exited; the G4-D branch has private I1 plus default-off I2. 0F has accepted its
  exact generic owner source pin, three-unit scope and lifecycle/provenance contract;
  0F-2/3 and G4-E implementation remain open. None of these checkpoints completes T-007.
  Implementation advances through I0 Design/Synthetic, I1 Branch Freeze, I2 Contract
  Boundary, I3 Owner Integration Readiness and I4 Joint Conformance. Each G4 package
  has its own DoD; overall acceptance covers contract/ownership, required product
  closure, authority/privacy/safety, consistency/recovery, formal integration and
  handoff/cleanup. Verdicts are PASS, PASS_WITH_LIMITATIONS only for optional
  fail-closed limitations, or NO_GO for any required/safety/owner/ingress/cleanup
  gap. A qualifying T-007 Beta Profile Handoff is consumed by T-008 and is not
  Candidate Freeze, native/device completion, activation or traffic authority.
- Stage G5: reuse T-008 and organize delivery as G5-0 Readiness Inventory/Beta
  Profile, G5-A Service Candidate Freeze, G5-B Deployment Binding/Local
  Qualification, G5-C Interface Handoff/Consumer Readiness, G5-D Dual-platform
  Internal Validation and G5-E Composite Decision/Evidence Lifecycle. D08-01～D08-07
  remain closed. G5-A is the strict serial Freeze gate; B/C may partially overlap,
  iOS/Android records run in parallel only against identical Candidate/interface/
  Binding/profile/suite inputs, and E is the final exact join. Internal-test
  enablement is a separate scoped/revocable gate that Binding observes but does not
  authorize. T-002 production/external traffic gates are not Freeze prerequisites.
  Defects route to the smallest owning version layer; rollback creates a new observed
  Binding and reruns local, both platforms, Composite and Decision. Beta Profile v0 is
  frozen as `nurture.six-surface-beta-profile@0.1.0`: deterministic/manual G3 paths and
  source-cited G4 knowledge are required, while AI copy, face match and other explicitly
  listed enhancements remain optional/default-off. Tooling remains just-in-time/minimal.
- Stage G6: top-level planning is accepted as G6-0 Candidate/Evidence
  Reconciliation, G6-A C3/C4/D Implementation Closure, G6-B Pilot-0-E,
  G6-C Pilot-1 Private Publication/Default-off Deployment, and G6-D Default-off
  Qualification/G7 Handoff. G6-0, C3->C4 qualification, complete-candidate/D-seal
  join, E, separate Pilot-1 authorization, deployment, and final readiness join
  are serial. D source/IaC/runbook preparation may overlap late C3/C4 work after
  exact-input freeze; owner-separated Pilot-1 provisioning may overlap only
  after E Go and separate authorization. G5's Service Candidate is an exact
  component input, not the complete Pilot candidate: Candidate-defining G6
  changes require a successor Service Candidate and affected G5 revalidation.
  G6 exits with capability false, active rows empty, zero external product
  traffic and a Pilot-2 readiness seal; it grants no G7 activation. Execution
  task identity remains pending and this planning decision authorizes no
  implementation, publication, persistent deployment, secret, database or cloud
  mutation. The detailed scope review makes G6-A a closure over, not a duplicate
  implementation of, T-004～T-007. It orders A1 C-3 qualification, A2 C-4
  qualification, A3 D preparation, A4 complete-candidate assembly and A5 disposable
  D evidence/TR census；G6-C/D separately own authorized default-off deployment and
  restore/hard-stop/readiness sealing. Drift is classified as G5-shared,
  complete-Pilot-only or evidence-only, so only the first class reruns affected G5
  evidence. G5-0 maintains a read-only Pilot carry-forward census to surface this
  before Freeze. G6 has no generic limited PASS: all P0 and P1-1/2/3b rows close,
  only P1-3a may be an accepted scope exclusion, and the exit remains
  `PILOT2_STAGE_AUTHORIZATION_PENDING / EXTERNAL_TRAFFIC_NO_GO`.
- Stage G7: accepted planning projects the locked D-3.3/D-4～D-7 contract into
  G7-0 current-head/authority freeze, G7-A Pilot-2 activation and exact synthetic
  cohort bootstrap, G7-B ordered Pilot-3 rehearsal with terminal disable, G7-C
  final-Binding/no-reset-baseline Pilot-4 activation and five contiguous 24-hour
  observation segments, and G7-D terminal evidence/recommendation. Pilot-2 and
  Pilot-4 use different authorizations and fresh rows；the rehearsal row is never
  restored. Scope is one seven-account synthetic cohort and exactly seven planned
  paths；real users/data, a second cohort/window, native/external delivery, staging,
  production, GA and external product traffic remain out. `pass|no_pass|stopped`
  are disjoint, only pass satisfies success, no generic limited pass exists, and no
  recommendation grants next scope. The 120-hour window freezes only the observed
  environment, so mainline successor development may continue without deploying
  into it. Future execution is triaged as `NEW_TASK`, proposed slug
  `nurture-bounded-pilot-observation`, under a proposed Internal Pilot Operations
  feature with a separate My-Chat companion；Task/Feature IDs remain pending and
  this planning sync creates neither.
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
    activity placement/downscope visibility append-only while preserving teacher originals and
    automatic-match provenance. Admin-only child-attribution correction creates a candidate/
    WorkItem; the current exact CareGroup caregiver confirms canonical attribution. Support
    signals are noncanonical, two-tier (`action_required` /
  `attention_suggested`) projections derived from canonical deadlines/blockers or explicit
  Institution absolute count/time-window policies; they never use peer ranking, hidden AI scores,
  or automatic WorkItem/Workflow creation. Mobile displays at most three cross-class signals and
    body-free class counts, while Admin Web owns threshold configuration and explicit source
    actions. Admin Web may create a WorkItem or start only a currently registered and eligible
    Workflow; an ordinary signal cannot start Enrollment Journey. The first Institution Workflow
    implementation is limited to
    `EnrollmentJourneyWorkflowV1`, spanning inquiry, intent/optional visit, optional full-class
    capacity waitlist, pre-trial identity/binding plus pending Enrollment/Grant/CareGroup,
    ordinary trial adaptation/review, formal Enrollment and
    completion. Capacity waitlist is distinct from waiting on a Guardian,
    caregiver, system owner, future date, or blocker. The product journey is closed; exact
    contracts/schemas remain default-off behind an owner/gate/default freeze register. Inquiry
    stores only minimum provisional
  child data and a Host-owned opaque contact ref. Native business communication is owner-read
  from canonical sources;
  external phone/WeChat touchpoints are Admin-authored structured summaries, not transcripts.
  Only cited authorized native sources may produce an Admin-reviewed AI summary candidate, and
  neither AI nor a new inquiry advances the stage or assigns intent/fit/conversion scores.
  Capacity waitlist qualification begins only after explicit family acceptance plus confirmed
  target class/minimum data, uses versioned priority categories with FIFO inside each category
  (or pure FIFO without categories), and never uses AI ordering. Families do not see exact rank;
    vacancies create an Admin task and time-limited offer, never automatic Enrollment or Grant.
    Before actual trial care, the Guardian-authorized My-Chat Child/Family binding, Nurture
    association, pending Enrollment/Grant and exact CareGroup assignment must all be current;
    trial start atomically writes `status=active, participationPhase=trial`.
    Trial children then use the same roster, attendance, care-fact, media-attribution, board and
    PublishProcess paths as other children; participation phase is canonical metadata, never
    authority. Trial attendance counts for same-day care/safety, while formal totals require
    `status=active && participationPhase=formal`; formalization updates the same relationship
    without copying historical facts.
    Accepted trial closes the waitlist entry and reserves one exact class seat for bounded
    starts/ends/review times. Review due creates an Admin task only: Admin explicitly extends,
    proposes formal enrollment for Guardian acceptance, or ends and releases the seat. Caregivers
    have no trial scoring report, AI makes no suitability decision, and ended trial never restores
    an old waitlist rank without a new qualification or audited override. Guardian withdrawal
    before trial-start uses `cancel_trial_preparation` to close the shell and release reservation
    without requiring Enrollment/Grant/CareGroup or mutating My-Chat identity/binding.
    Formal activation requires Guardian acceptance and fresh My-Chat Child/Family
    membership/binding evidence, then one Nurture local transaction keeps Enrollment active,
    changes `participationPhase: trial -> formal`, narrows the existing Grant and retains the
    same occupied reservation/CareGroup. Failure remains `active trial + occupied seat`; no
    partial formal state is published.
    Trial exit is a local downscope transaction that closes care access
    and releases capacity without deleting My-Chat identity/bindings, Nurture associations or
    historical care facts. Trial itself is the adaptation period: when more observation is needed,
    Admin extends trial before activation. Confirmed activation success is the final business
    milestone and idempotently completes the Workflow; there is no post-activation settling stage
    or additional caregiver, Guardian or Admin completion gate. Later formal offboarding is
    ordinary Enrollment maintenance and neither reopens Journey nor creates a second Workflow by
    default.
  Explicitly disclosed institution-business communication is available
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
- Dependencies: T-003 six-surface design input; the exact T-002 identity, authority, Receipt,
  owner-reread and source-qualification subset consumed by the beta profile; exact Base/My-Chat
  owner-contract pins. Production/external traffic gates remain separate and do not block
  Candidate Freeze or internal-beta evidence once the required source-owner subset is qualified.
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
- Related Tasks: T-004 (`done`); T-005 (`archived`); T-006 (`done`);
  T-007 (`in-progress`); T-008 (`planned`).
- Current posture: T-007 completed 0C, 0D and the full frozen 0E chain at
  private I1. G4-D increments 2–5 are qualified through 33 migrations on
  disposable PostgreSQL. I2-A publishes the exact three-query/21-action
  Surface Contract at `1.19.0`; I2-B maps it to the existing I1 ports through
  fail-closed, explicitly disabled module/manifest adapters. No formal ingress,
  real owner provider, capability activation or durable database apply exists.
  0F has an exact generic Knowledge/PBR/RAG source pin, accepted three-unit
  scope and frozen lifecycle/provenance unit; retrieval and citation/safety
  remain open.
- Next Checkpoint: complete 0F-2/0F-3 and its audit/Exit, then enter G4-E I1;
  independently, explicit G-09 adoption may open G4-D I3 authenticated
  prospective-contact/native-source/current-owner and formal-ingress binding.
  I4 joint conformance follows only after I3 qualifies.
  T-008 remains planned until the complete T-007 G4 Exit; Candidate Freeze,
  deployment, activation and external traffic remain closed.

### F-004 Family growth material provider

- Intent: make an explicitly released teacher photo become a long-lived
  My-Chat family growth material — Nurture provides material and interaction
  anchor points; My-Chat owns the admitted family fact, cultivation and
  archive composition.
- Scope In: fail-closed canonical child/family target resolution at envelope
  assembly time; RFC 8785 JCS + SHA-256 payload digests; v1
  `family_growth_material_release`/`_lifecycle` envelope assembly; immutable
  per-revision media content digests; provider outbox appended inside the
  existing per-target release transaction; delivery worker with
  same-event-id/digest retry; family rendition exchange (short-lived URL over
  the exact unchanged original revision); `family_growth_admission_receipt`
  consumption with `outcome_unknown` as a retriable delivery state; the
  twelve N8 conformance fixtures; teacher publish-queue status binding; the
  surface-contract `1.16.0` batch (guardian_current_focus cession removal +
  provider status vocabulary + My-Chat pin rotation + one requalification
  round); and the `1.17.0` teacher-queue lifecycle overlay rotation.
- Scope Out: My-Chat-side implementation (ingress, media importer, receipt
  delivery, guardian confirmation — My-Chat T-031); derivative/cropped
  rendition generation (later shared-media-infrastructure enhancement);
  family archive/cultivation data in Nurture; any activation, deployment,
  Candidate or traffic effect.
- Decision: conflict-resolution records D-T009-01…07 in
  `dev-docs/active/nurture-family-growth-provider/02-architecture.md` —
  planning-surface cession, original-revision rendition baseline,
  synchronous-receipt transport proposal, single pin rotation, photo-loop
  priority, UIUX consolidation into My-Chat T-036, and naming/identity
  discipline.
- Dependencies: frozen My-Chat contract at `d4ed0ce`
  (`family_growth_material_*@1.0.0`); T-006 G3 provider base at `0374087…`;
  the joint `family_growth_transport@1.0.0` addendum (T-009 I0, frozen and
  mirrored in My-Chat) before any wire implementation. Consumer-side pins
  advanced to My-Chat `df7a273…` / Base `8a3ea90…` in the single D-T009-04
  rotation.
- Risks: targeting the legacy `growth_record_*` path; persisting canonical
  IDs into Nurture business tables; outbox rows escaping release-transaction
  atomicity; placeholder media digests; leaking sibling-child assets into
  another family's envelope; treating a receipt as authorization; partial
  contract-visible changes landing outside the `1.16.0` batch.
- Success Signal: all twelve N8 fixtures pass on both provider and consumer
  sides at exact pins; one photo released in Nurture appears as an admitted
  My-Chat family material with correction/removal/redaction propagating and
  the teacher queue showing exact receipt states — all default-off.
- Related Tasks: T-009 nurture-family-growth-provider (`done`).
- Next Checkpoint: none inside F-004's provider scope — I0–I8 are closed by
  the 2026-08-08 `REQUAL_PASS` at `860f73f` / `1.17.0` / `sha256:d22851d9…`.
  The remaining consumer half (ingress, media importer, receipt delivery,
  guardian confirmation) belongs to My-Chat T-031. Archive T-009 only after
  explicit approval.

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
| T-003 nurture-uiux-pitch | done | dev-docs/active/nurture-uiux-pitch |

### F-003 Six-surface store-beta readiness

| Task | Status | Dev Docs |
| --- | --- | --- |
| T-004 nurture-surface-contract-foundation | done | dev-docs/active/nurture-surface-contract-foundation |
| T-005 nurture-family-care-conversation | archived | dev-docs/archive/nurture-family-care-conversation |
| T-006 nurture-child-care-boards | done | dev-docs/active/nurture-child-care-boards |
| T-007 nurture-institution-surfaces | in-progress | dev-docs/active/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | planned | dev-docs/active/nurture-store-beta-readiness |

### F-004 Family growth material provider

| Task | Status | Dev Docs |
| --- | --- | --- |
| T-009 nurture-family-growth-provider | done | dev-docs/active/nurture-family-growth-provider |
<!-- AUTO-GENERATED:END feature-map -->
