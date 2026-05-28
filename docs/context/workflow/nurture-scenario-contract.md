# Nurture Scenario Contract

## Decision

The Nurture is a My-Chat scenario module. My-Chat owns host runtime; The Nurture owns only scenario-specific workflow logic and projections.

## Ownership

The Nurture owns:

- Scenario manifest, capabilities, handlers, actions, presenters, adapters, policies, repository ports.
- Scenario-local profile projections attached to My-Chat canonical object refs.
- Pregnancy, care-plan, family-strategy, activity-comparison, execution-review, and health-safety artifacts.
- Scenario-specific web console and internal APIs.

My-Chat owns:

- Canonical object identity and resolvers.
- Auth, shared workflow runtime, routes, workers, outbox, ledgers, handoffs, and evidence.
- Dashboard, chat, mobile, forum, knowledge base, notification, and admin consumers.

Do not copy My-Workflow-Base host runtime into this repo. Integration should register `nurtureScenarioModule` with the My-Chat host and replace local compatibility types with host `workflow-contracts`.

## P0 Workflows

- `pregnancy_stage_management`
- `family_strategy`
- `care_plan`
- `activity_comparison`
- `execution_review`

## Object And Profile Rules

Canonical refs required from My-Chat:

- `my_chat.child`
- `my_chat.expectant_mother`
- `my_chat.parent`
- `my_chat.family`

Scenario-local refs allowed:

- `nurture.nurture_profile`
- `nurture.activity_option`
- `nurture.health_state_summary`

Nurture profile projections MUST point to a My-Chat canonical object. Do not create a separate child, parent, or family identity owned only by The Nurture.

## Handoffs

Handoff payloads are refs-only.

- `public_draft` -> `my_chat.forum`
- `knowledge_candidate` -> `my_chat.knowledge_base`
- `notification` -> `my_chat.notification`

Downstream services reread artifacts through host-owned APIs and apply their own policies.

## Health Boundary

Health-state support is limited to basic, non-diagnostic, non-prescriptive guidance.

Escalate or block requests for emergency triage, diagnosis, medication decisions, treatment decisions, or replacement of qualified medical care.

## Database Strategy

`prisma/schema.prisma` is the schema SSOT.

Local testing MAY use independent Postgres. Cloud integration SHOULD use My-Chat Postgres with a dedicated schema or `nurture_*` table group after migration gates pass.

## Integration Gates

- Host `workflow-contracts` replaces local compatibility types.
- Host module validator accepts `packages/nurture-scenario/scenario.manifest.yaml`.
- My-Chat canonical object resolver keys exist.
- Shared surfaces consume only standard workflow refs and safe artifact previews.
- Health safety policies are tested before pregnancy or care-plan workflows are enabled.
- DB namespace, migrations, indexes, rollback/export, and seed-data boundaries are reviewed before cloud apply.
