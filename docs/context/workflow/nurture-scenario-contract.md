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
- Protected child/family identity: stable `my_chat.child` / `child_id` and
  `my_chat.family` / `family_id`, stewardship, creation authorization, and
  scenario-binding lifecycle.
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

- `class_family_inbox` / `open_class_family_inbox` / `capture_family_input`
- `teacher_attention_board` / `open_today_attention_board`

The N1 institution workflows resolve the current Nurture participant, role, and care-group scope on every read. Their direct surface handlers return display-safe items and opaque refs only. Existing owner-read workflow handlers remain explicit-empty. The activation-only `capture_family_input` Step may emit one refs-only `user_attention` draft only when the host loads the vNext manifest with `workflow_handoff_materialization_v1` enabled.

## Object And Profile Rules

Canonical refs required from My-Chat:

- `my_chat.user`
- `my_chat.child` (`child_id`) when a Nurture child is globally bound
- `my_chat.family` (`family_id`) when a Nurture family is globally bound
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

## My-Chat `child_id` Usage Contract

### Meaning and local representation

`child_id` identifies the protected child across My-Chat scenarios. It is an
opaque identity key, not a Nurture profile, login principal, PII match key, or
authorization grant.

Nurture MUST keep two identities distinct:

- `NurtureChild.id` is the Nurture-owned child/profile identifier.
- `my_chat.child` / `child_id` is the My-Chat-owned shared subject identifier.

The existing `NurtureChildCareProcess.childId` points to `NurtureChild.id`; it
MUST NOT be interpreted, exposed, or copied as a My-Chat `child_id`.

When persistence implementation follows this contract, `NurtureChild` SHOULD
carry a nullable opaque domain property `myChatChildId`, mapped to
`my_chat_child_id`, with at most one active local child per platform child. The
field remains nullable so an authorized Nurture workflow can hold a provisional
local child before a global binding exists. My-Chat remains canonical for the
binding lifecycle.

### Creation and binding happy path

1. Authenticate the My-Chat user and resolve the current Actor plus any
   represented organization through the pinned host contract.
2. Resolve the Nurture participant and local roles independently.
3. Obtain `child_id` from the My-Chat child owner API. A parent/steward creates
   the child, or My-Chat verifies an explicit, current creation authorization
   for the acting person and represented organization.
4. Create or select the Nurture child under Nurture policy. Bind by sending the
   canonical `nurture.child` ref to the My-Chat binding API and store only the
   returned opaque `child_id`/version locally.
5. On every protected read or command, resolve the local Nurture child/care
   process and recheck current Nurture role assignment, enrollment,
   child-link grant, purpose, consent/policy, and lifecycle. `child_id` alone
   MUST fail closed.

Nurture MUST consume My-Chat through pinned contracts, owner APIs, and refs-only
handoffs. It MUST NOT import a sibling ORM, query the My-Chat database, or join
databases directly.

### Provisional, claim, and reconciliation rules

- Without current parent/steward authority, a teacher, caregiver, institution,
  or school MAY create only a Nurture-local provisional child/care record.
- A provisional record MUST NOT contain an invented `child_id` or be visible as
  a globally bound child.
- Claim/bind requires a new, explicit parent/steward-authorized operation. It
  MUST NOT auto-match on name, birth date, school identifier, family contact,
  or other PII.
- Existing Nurture rows MUST NOT be bulk backfilled into My-Chat children.
- My-Chat merge, redirect, revocation, archive, or deletion signals require a
  current owner reread and an auditable local reconciliation. Nurture MUST NOT
  silently rewrite subject bindings from stale cache data.

### Education interoperability

The same My-Chat `child_id` MAY bind one Nurture child and one Education
learner. That shared key permits routing and authorized correlation only:

- Nurture MUST NOT query The-Education storage or import its ORM.
- Education MUST NOT query Nurture storage or infer Nurture permissions.
- Cross-scenario handoffs contain opaque canonical refs and minimal policy
  metadata; the receiving owner rereads its own facts and current grants.
- A valid Education association does not authorize Nurture access, and a valid
  Nurture association does not authorize Education access.

### Verification checklist

- A parent-created or parent-authorized child binds to one local
  `NurtureChild` and retains distinct local/global identifiers.
- An unauthorized institution actor can create only a provisional local child;
  My-Chat child creation/binding fails closed.
- Binding-only, family-association-only, and `child_id`-only reads are denied.
- Revoked grants and stale owner versions are denied after owner reread.
- Logs, outbox payloads, handoffs, and projections contain opaque refs rather
  than child PII or scenario dossier content.
- One `child_id` can route separately to Nurture and Education without a
  cross-database join or cross-scenario permission leak.

Nurture family-care communication is Nurture-owned when the conversation is created through a Nurture care workflow. My-Chat MAY render the thread, deliver notifications, and hold display-safe shell references, but the message body, care item extraction, status, acknowledgment, reply, and follow-up facts remain Nurture canonical.

## Handoffs

Handoff payloads are refs-only.

The canonical vNext manifest declares `capture_family_input` and one `user_attention` handoff with `workflow_step_complete_v1` materialization. Its source contract is exactly one `family_care_message`, `child_link_receipt`, and `family_care_item`, with no artifact refs. This declaration is not a global enablement: `nurtureScenarioModule`, `createNurtureScenarioModule`, and the local dev host use the derived pre-activation manifest. Only `createNurtureActivationScenarioModule` exposes vNext and its constructor requires a materializing host runtime, the claimed-Step bridge, and the production family-input source port.

The transient driver is validated before command identity lookup or mutation. Nurture persists only a canonical `host.workflow/workflow_step` ref bound to the `nurture` consumer; claim token and Step version are neither hashed nor stored. Same-Step reclaim may rotate that evidence, but another Step cannot replay the seed. Snapshot contents are bounded refs-only values over the Nurture-owned message, receipt, and item; downstream content still requires current owner reread.

The live handler receives two explicit ports. A host-injected bridge derives `ScenarioCommandDriverContext` from the already claimed Step and maps returned immutable snapshots to host drafts. A scenario-owned command-source adapter parses one opaque persisted Run requirement and resolves stable invocation, command, and handoff request IDs. Before participant lookup, the host must map the Run's canonical Actor to an active My-Chat user through current workspace membership; the queue cannot supply this identity. The IDs do not come from claim/version evidence: same-Step reclaim reuses the Execution, while another Step presenting the same command ID is rejected by persisted original-Step provenance before a second business effect. The handler emits no host-standard event and exposes only an opaque Nurture CommandExecution ref as Step output; message, receipt, and item remain owner-readable context refs inside the handoff draft.

The `user_attention` owner endpoint is service-authenticated and returns only current My-Chat recipient IDs plus fixed generic display text. It rereads message, receipt, item, grant, enrollment, thread membership, care group, institution, and recipient role state. My-Chat owns the Handoff Ledger, notification idempotency, Outbox, and deep-link shell. Opening a deep link repeats the Ledger and Nurture owner reads for the authenticated user; stale notification content is never treated as authorization.

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
- The default/dev scenario module remains pre-activation. The canonical vNext manifest may be loaded only through `createNurtureActivationScenarioModule` and only when the My-Chat development composition advertises `workflow_handoff_materialization_v1` and provides the claimed requirement, Actor-to-user, bridge, and materializing runtime ports.
- `NURTURE_INTERNAL_SERVICE_TOKEN` is configured on both sides of the owner-read boundary; absence disables activation owner reads and never falls back to an unauthenticated route.
- Shared mobile/chat/dashboard surfaces do not become the canonical source for Nurture family-care messages or care items.
- Health safety policies are tested before pregnancy or care-plan workflows are enabled.
- DB namespace, migrations, indexes, rollback/export, and seed-data boundaries are reviewed before cloud apply.
