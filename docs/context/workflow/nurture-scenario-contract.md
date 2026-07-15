# Nurture Scenario Contract

## Decision

The Nurture is a My-Chat scenario module. My-Chat owns the account identity and scenario shell; The Nurture owns the care ecology graph.

My-Chat users are the single login principals across scenarios. A My-Chat user can join many scenarios such as Nurture or Education. Inside Nurture, the same My-Chat user is mapped to Nurture-owned participants, roles, relationships, workflows, and data.

The Nurture basic product unit is not family or classroom. The basic unit is a child's care process: parents join the child's care process, teachers incorporate the child's care process into their daily care workflow, and institution managers govern how these processes are organized and executed.

## Ownership

The Nurture owns:

- Scenario manifest, capabilities, handlers, actions, presenters, adapters, policies, repository ports.
- Scenario-local canonical care ecology objects: child care process, participant, role assignment, family, guardian, care institution, care group, enrollment, caregiver assignment, consent/grant, care communication, daily care, attention board, and media attribution facts.
- Pregnancy, care-plan, family-strategy, activity-comparison, execution-review, and health-safety artifacts.
- Institution ecology artifacts: family-care messages, family-care items, daily care logs, teacher attention summaries, caregiver observations, cohort plans, child media attribution summaries, and child album views.
- Scenario-specific web console and internal APIs.

My-Chat owns:

- Canonical account identity: user account, authentication, session, and global user id.
- Scenario shell and host runtime: shared workflow runtime, routes, workers, outbox, ledgers, handoffs, and evidence.
- Mobile/web shell, notification, deep link, forum, knowledge base, dashboard, and admin consumers.
- User-facing entry and rendering surfaces that call back into Nurture-owned APIs for Nurture business facts.

Do not copy My-Workflow-Base host runtime into this repo. Integration should register `nurtureScenarioModule` with the My-Chat host and replace local compatibility types with host `workflow-contracts`.

Do not put My-Chat account auth, session, or global user semantics into Nurture. Do not put Nurture-specific family, child, institution, caregiver, enrollment, consent, or care communication semantics into My-Chat as canonical business facts.

## Declared Workflows

P0 workflows:

- `pregnancy_stage_management`
- `family_strategy`
- `care_plan`
- `activity_comparison`
- `execution_review`

N1 institution owner-read workflows:

- `class_family_inbox` / `open_class_family_inbox`
- `teacher_attention_board` / `open_today_attention_board`

The N1 institution workflows resolve the current Nurture participant, role, and care-group scope on every read. Their direct surface handlers return display-safe items and opaque refs only. Their durable workflow handlers emit safe summary artifacts and an explicit empty `handoff_drafts` list.

## Object And Profile Rules

Canonical refs required from My-Chat:

- `my_chat.user`
- `my_chat.workspace` or shell entry ref when needed for routing
- `my_chat.thread_surface` or equivalent render/deep-link ref when a Nurture-owned thread is shown inside My-Chat mobile/web
- `my_chat.notification_target` when Nurture needs host notification/deep-link delivery

Scenario-local canonical refs owned by Nurture:

- `nurture.participant`
- `nurture.child`
- `nurture.child_care_process`
- `nurture.family`
- `nurture.guardian_role`
- `nurture.care_institution`
- `nurture.care_group`
- `nurture.caregiver_role`
- `nurture.institution_admin_role`
- `nurture.enrollment`
- `nurture.child_link_grant`
- `nurture.family_care_thread`
- `nurture.family_care_message`
- `nurture.family_care_item`
- `nurture.nurture_profile`
- `nurture.activity_option`
- `nurture.health_state_summary`

Nurture scenario participants that correspond to login users MUST reference `my_chat.user`. Nurture role and relationship semantics MUST be resolved from Nurture data, not inferred from My-Chat account state.

Nurture children are not My-Chat users. A child care process is Nurture-owned and may have multiple guardian participants, caregiver participants, and institution-manager participants attached through Nurture role assignments.

Nurture family-care communication is Nurture-owned when the conversation is created through a Nurture care workflow. My-Chat MAY render the thread, deliver notifications, and hold display-safe shell references, but the message body, care item extraction, status, acknowledgment, reply, and follow-up facts remain Nurture canonical.

## Handoffs

Handoff payloads are refs-only.

N1 institution activation remains disabled in the advertised runtime: direct commands store `handoffRequestSnapshotsPayload=[]`, and inbox/attention workflow handlers return `handoff_drafts=[]`. X4-A adds the guarded command-kernel replay seed. My-Chat X4-B supplies one host-owned transient driver/snapshot bridge. The Nurture X4 handler foundation registers `nurture.capture_family_input` in code and the dev host injects that bridge, but the manifest still declares no capture Step, non-empty handoff key/source path, or required host capability. The scenario command-source port is also intentionally absent from default/dev composition. Therefore the handler remains unreachable and fails closed if called directly.

The transient driver is validated before command identity lookup or mutation. Nurture persists only a canonical `host.workflow/workflow_step` ref bound to the `nurture` consumer; claim token and Step version are neither hashed nor stored. Same-Step reclaim may rotate that evidence, but another Step cannot replay the seed. Snapshot contents are bounded refs-only values over the Nurture-owned message, receipt, and item; downstream content still requires current owner reread.

The live handler receives two explicit ports. A host-injected bridge derives `ScenarioCommandDriverContext` from the already claimed Step and maps the returned immutable snapshots to host drafts. A scenario-owned command-source port resolves the current family-input payload plus stable invocation, command, and handoff request IDs. The IDs do not come from claim/version evidence: same-Step reclaim reuses the Execution, while another Step presenting the same command ID is rejected by the persisted original-Step provenance before a second business effect. The handler emits no host-standard event and exposes only an opaque Nurture CommandExecution ref as Step output; message, receipt, and item remain owner-readable context refs inside the handoff draft.

- `public_draft` -> `my_chat.forum`
- `knowledge_candidate` -> `my_chat.knowledge_base`
- `notification` -> `my_chat.notification`
- `family_care_item` -> `my_chat.notification` for teacher/guardian delivery surfaces only; Nurture remains canonical for the care item.
- `family_care_reply` -> `my_chat.notification` for delivery receipt only; Nurture remains canonical for the message and thread.

Downstream services reread Nurture-owned artifacts through Nurture APIs exposed via the My-Chat scenario shell, then apply their own delivery/display policies.

Cross-surface delivery does not transfer ownership. A My-Chat deep link points back to a Nurture-owned business object.

## Health Boundary

Health-state support is limited to basic, non-diagnostic, non-prescriptive guidance.

Escalate or block requests for emergency triage, diagnosis, medication decisions, treatment decisions, or replacement of qualified medical care.

## Database Strategy

`prisma/schema.prisma` is the schema SSOT.

Nurture MAY use an independent database or a dedicated `nurture_*` schema/table group behind the My-Chat scenario shell. Nurture-owned care ecology facts should be canonical in the Nurture persistence boundary. My-Chat should store only account/shell/runtime facts, delivery metadata, and display-safe projections required by shared surfaces.

## Integration Gates

- Host `workflow-contracts` replaces local compatibility types.
- Host module validator accepts `packages/nurture-scenario/scenario.manifest.yaml`.
- My-Chat canonical account/user resolver keys exist.
- Nurture resolver keys exist for child care process, participant, family, institution, care group, enrollment, child link grant, family-care thread, message, and item.
- Shared surfaces consume only standard workflow refs and safe artifact previews.
- Institution inbox/attention surfaces call Nurture owner-read handlers and receive only safe labels, generic badges, aggregate versions, and opaque item refs; My-Chat must not branch on Nurture business lifecycle values.
- Institution owner reads re-resolve current participant/role/care-group scope and recheck enrollment, thread membership, the item-linked grant, source lifecycle, and redaction before every display.
- Advertised institution workflow handlers remain explicit-empty until the X4 manifest/bridge/consumer path is enabled behind the My-Chat host capability gate. The dormant X4-A command foundation is not evidence that activation is enabled.
- Shared mobile/chat/dashboard surfaces do not become the canonical source for Nurture family-care messages or care items.
- Health safety policies are tested before pregnancy or care-plan workflows are enabled.
- DB namespace, migrations, indexes, rollback/export, and seed-data boundaries are reviewed before cloud apply.
