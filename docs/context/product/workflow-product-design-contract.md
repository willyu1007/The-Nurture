# Nurture Workflow Product Design Contract

## Purpose

This document is the project-level product contract for The Nurture workflow development.
It turns the parenting workflow design consensus into repo-local rules that future task
packages, schema work, handlers, presenters, prompts, and workbench UI must follow.

After reading this document, contributors should know:

- how to model personalized parenting needs;
- what context an LLM must read before producing workflow output;
- which development-vector and family-quantification dimensions drive consistent output;
- how the 12 workflow template classes relate to MVP task packages.

## Standing Boundary

The Nurture remains a My-Chat scenario module.

The Nurture MUST NOT become an independent parenting product shell. My-Chat owns canonical
identity, auth, shared workflow runtime, dashboard, chat, mobile, forum, knowledge,
notification, admin, outbox, ledgers, and handoff consumers.

The Nurture owns scenario-specific workflow semantics, handlers, actions, presenters,
policies, repository ports, local projections, artifacts, safety gates, and the scenario
workbench experience.

## Naming Collision Warning

The uploaded product documents use `P0-P5` for urgency and planning horizon. This repo also
uses `P0` for implementation phase and P0 workflow scope.

To avoid ambiguity, code and task packages SHOULD use `urgency_horizon` keys:

| Product label | Repo key | Meaning |
| --- | --- | --- |
| P0 即时反应 | `u0_immediate` | minutes to hours; safety or immediate response |
| P1 当日决策 | `u1_today` | today or tomorrow; light action selection |
| P2 短周期调整 | `u2_short_cycle` | 3 days to 2 weeks; micro-adjustment and review |
| P3 中周期计划 | `u3_mid_cycle` | 1 to 3 months; planned intervention |
| P4 阶段规划 | `u4_stage_plan` | 6 months to 3 years; transition or route planning |
| P5 家庭底层系统 | `u5_family_system` | long term; charter, principles, growth archive |

User-facing copy MAY keep natural language labels. Internal DTOs, artifacts, prompts, and
tests SHOULD use stable repo keys.

## Personalized Need Model

Every significant workflow recommendation MUST be positioned on a demand coordinate:

```text
development_stage x urgency_horizon x strategic_context
```

### Axis 1: Development Stage

The product has a two-level stage model.

User-facing stages SHOULD be understandable coarse stages:

| Stage key | User-facing stage |
| --- | --- |
| `pregnancy` | 准备成为父母 |
| `age_0_1` | 高强度照护期 |
| `age_1_3` | 探索与规则初建期 |
| `age_3_6` | 游戏、社交与入学准备期 |
| `age_6_9` | 学校适应与习惯建立期 |
| `age_9_12` | 能力分化与青春期前准备期 |
| `age_12_15` | 青春期与初中适应期 |
| `age_15_18` | 独立性、升学与人生方向期 |

Backend reasoning SHOULD use finer stage keys. Initial implementation MAY store the fine
stage as a string enum or versioned JSON field, but task packages MUST preserve the ability
to distinguish at least:

- pregnancy preparation, early pregnancy, mid pregnancy, late pregnancy;
- postpartum/newborn transition;
- newborn, infant, toddler, preschool, school entry;
- primary school, early adolescence, middle school, high school stages.

Stage is an input prior, not a final answer. Handlers MUST combine stage with the current
child profile, family state, and scenario constraints.

### Axis 2: Urgency Horizon

`urgency_horizon` determines workflow depth and surface behavior:

| Repo key | Product behavior |
| --- | --- |
| `u0_immediate` | Safety gate first; mobile-first; minimal input; escalate when needed |
| `u1_today` | Action card or lightweight plan; no heavy workbench by default |
| `u2_short_cycle` | Observation, micro-intervention, checkpoint, review |
| `u3_mid_cycle` | Plan package, roles, checkpoints, adjustment loop |
| `u4_stage_plan` | Roadmap, resource allocation, transition decision records |
| `u5_family_system` | Family Charter, principles, value weights, long-term archive |

LLM prompts and handlers MUST NOT give a `u3` or `u4` style plan when the user is in a
`u0_immediate` situation. Immediate risk must be reduced before planning.

### Axis 3: Strategic Context

Strategic context is what makes The Nurture different from a generic advice system.
Every non-trivial workflow SHOULD read or explicitly mark missing:

- Family Charter;
- Current Focus;
- Child Development Vector;
- Family Quantification Metrics;
- historical feedback;
- community or evidence candidates;
- safety and privacy boundary.

If strategic context is missing, the LLM SHOULD ask for the smallest missing input needed
for the current urgency horizon. It SHOULD NOT force full profile completion before helping.

## Decision Context Stack

Every recommendation, workflow plan, comparison, review, or proactive push SHOULD be built
from this context stack.

| Layer | Content | Rule |
| --- | --- | --- |
| L0 Safety boundary | medical, mental health, physical safety, legal, privacy | MUST be evaluated first |
| L1 Family Charter | values, principles, long-term priorities | SHOULD shape "good advice" |
| L2 Current Focus | 1 to 3 focus areas for the next 4 to 12 weeks | SHOULD shape short-term recommendations |
| L3 Child current profile | age, development, interests, temperament, challenges | MUST shape fit and burden |
| L4 Family current state | parent bandwidth, budget, time, caregivers | MUST shape feasibility |
| L5 Scenario constraints | today, weekend, travel, conflict, homework, health context | MUST shape the concrete plan |
| L6 Historical feedback | what worked, failed, overloaded, or helped before | SHOULD shape ranking |
| L7 Community evidence | similar family cases and outcomes | MAY support ranking when available |

### LLM Design Rules

LLM-facing services MUST represent context as structured fields, not only prompt prose.

For each workflow step, prompts or tool inputs SHOULD include:

- `known_context`: structured context available to the step;
- `missing_context`: fields not available;
- `assumptions`: explicit temporary assumptions;
- `safety_boundary`: applicable non-diagnostic, privacy, or escalation constraints;
- `output_contract`: required artifact fields and exposure limits.

If the LLM infers beyond available context, the output MUST mark that inference as tentative.

## Family Charter

Family Charter is the stable family-level target function. It is not a free-form note.

Initial fields SHOULD include:

- priority values;
- non-negotiables;
- negotiables;
- family style;
- caregiver roles;
- conflict principles;
- money principles;
- time principles;
- screen principles;
- long-term vision.

Family Charter SHOULD influence recommendation weights, review interpretation, proactive
pushes, and value-alignment summaries.

Stable workflow results MAY propose Family Charter updates, but MUST NOT silently rewrite
the charter. Charter changes require explicit user confirmation.

## Current Focus

Current Focus captures 1 to 3 stage priorities for the next 4 to 12 weeks.

Examples:

- language expression;
- emotional regulation;
- sleep protection;
- movement coordination;
- social cooperation;
- autonomy;
- responsibility;
- early reading;
- screen boundary.

Recommendations SHOULD explain which Current Focus they serve. If a recommendation does
not serve any Current Focus, it SHOULD explain why it is still worth doing.

## Child Development Vector

The Child Development Vector is the main consistency anchor for child-specific output.
It SHOULD be stored as a scenario-local projection attached to an opaque
`my_chat.child` / `child_id` binding. The Nurture-local child ID remains
distinct, and the shared ID MUST NOT substitute for Nurture authorization.

Initial dimensions:

| Dimension key | Content |
| --- | --- |
| `physical_state` | sleep, diet, illness recovery, energy |
| `gross_motor` | crawling, walking, running, jumping, balance, ball skills |
| `fine_motor` | grasping, building, drawing, tools |
| `language` | comprehension, expression, narration, bilingual context |
| `cognition` | attention, memory, classification, problem solving |
| `emotion` | intensity, recovery, expression |
| `social` | peer interest, conflict handling, cooperation |
| `self_care` | dressing, toileting, organizing, chores |
| `executive_function` | waiting, transitions, planning, inhibition |
| `learning_state` | reading, math, homework, tests, interests |
| `adolescent_state` | body change, privacy, identity |
| `risk_signals` | safety, mental health, bullying, self-harm, overload |

Risk signals MUST NOT be folded into a generic child score. They are safety and escalation
signals with restricted exposure.

## Family Quantification Metrics

Family metrics are for calibration, not judgment.

Initial metric groups:

| Metric group | Examples |
| --- | --- |
| `family_resources` | available time, budget, commute radius, caregiver support |
| `parent_bandwidth` | energy, sleep, work pressure, emotional margin, execution stability |
| `family_consistency` | parent alignment, grandparent alignment, role clarity, conflict frequency |
| `parent_child_connection` | positive interaction, conflict frequency, repair rate, child expression space |
| `life_structure` | sleep, diet, movement, screen, rituals, free play |
| `value_alignment` | whether actual time and resources match Family Charter |

Recommended derived indicators:

- family bandwidth index;
- parenting consistency index;
- parent-child connection index;
- life stability;
- plan execution burden;
- value alignment;
- conflict repair rate;
- overload risk.

### Anti-Metrics

The product MUST NOT introduce:

- child comprehensive ranking;
- parent quality score;
- single-day performance score;
- institution-style ability ranking;
- excessively precise KPIs that families cannot maintain.

Quantification exists to help the family self-calibrate. It MUST NOT create shame,
competition, or false precision.

## Workflow Product Framework

The full product catalog contains 12 high-level workflow template classes.
These are product templates, not necessarily one-to-one scenario capabilities.

| Template key | Template class |
| --- | --- |
| `transition_adaptation` | 阶段/环境转换适应 |
| `health_event_recovery` | 健康事件与康复管理 |
| `parent_child_experience` | 亲子体验设计与复盘 |
| `routine_life_structure` | 作息、习惯与生活结构调整 |
| `emotion_behavior_regulation` | 情绪、行为与自我调节 |
| `social_relationship_support` | 社交关系与集体生活 |
| `learning_capability_development` | 学习与能力发展 |
| `family_rule_trial` | 家庭规则、协商与关系修复 |
| `immediate_conflict_repair` | 即时冲突降温与关系修复 |
| `resource_trial_evaluation` | 资源投入与试用评估 |
| `care_coordination_operations` | 照护协同与家庭运营 |
| `safety_risk_management` | 安全、边界与风险管理 |

Each template task package MUST define:

- user-facing instances;
- trigger conditions;
- lifecycle and status states;
- required context stack layers;
- artifact schemas;
- checkpoints;
- adjustment actions;
- review and learning outputs;
- safety and privacy boundaries;
- handoff eligibility.

## Proposed MVP Template Set

MVP SHOULD prioritize 3 product workflow templates plus 1 short-cycle validation template.

Product templates:

1. `learning_capability_development`
2. `family_rule_trial`
3. `parent_child_experience`

MVP validation template:

4. `short_cycle_validation`

`short_cycle_validation` is an MVP validation slice, not a full product catalog class.
It exists to prove that The Nurture can run a 3 to 14 day loop with baseline, plan,
mobile capture, checkpoint, adjustment, review, and learning output. It MAY later be
absorbed by a full template such as `routine_life_structure`,
`emotion_behavior_regulation`, or `family_rule_trial`.

Rationale:

- `learning_capability_development` validates goal-driven learning support without reducing
  the product to homework supervision. It exercises development stage, Current Focus,
  child capability profile, parent bandwidth, plan checkpoints, and learning outcome review.
- `family_rule_trial` validates Family Charter as a real decision constraint. It exercises
  non-negotiables, negotiables, caregiver alignment, child participation, 7 to 14 day trial
  rules, conflict repair, and charter update proposals.
- `parent_child_experience` validates Family Charter, Current Focus, recommendation
  ranking, activity comparison, execution review, and community-case candidate flow.
- `short_cycle_validation` validates that any MVP template can produce measurable but
  non-shaming short-cycle evidence: baseline, intervention, burden, side effects,
  checkpoint adjustment, and review.

`health_event_recovery` remains high value but safety-sensitive. It SHOULD remain supported
by the health safety gate and can become the first post-MVP template unless the project
explicitly chooses a health-led MVP.

## Current Build Sequence

The first implementation slice SHOULD build one concrete workflow end to end before adding
the real mobile LLM conversation surface.

The first vertical slice is `family_rule_trial`.

This MUST be implemented as a configurable rule-trial workflow, not as a single hard-coded
screen, sleep, homework, or snack scenario. Concrete rule topics SHOULD be represented as
`issue_type` or equivalent template data, while the lifecycle, data model, workbench panels,
checkpoints, and review outputs remain template-compatible.

The first slice SHOULD establish durable data landing points:

| Layer | Data landing |
| --- | --- |
| Canonical refs | My-Chat `family_id`, `child_id`, parent User/Actor, and related actor refs; IDs are routing keys, not scenario grants |
| Scenario profile projection | FamilyProfile and ChildProfile projections attached to canonical refs |
| Stable strategy | FamilyCharter and CurrentFocus |
| Calibration snapshot | FamilyQuantificationSnapshot using non-ranking metrics |
| Metric facts | MetricObservation records for short-cycle evidence |
| Workflow facts | NurtureWorkflowProject with baseline, plan, checkpoints, captures, adjustments, review, and learning |

Web workbench comes before real mobile dialogue. The workbench MUST be able to create,
inspect, adjust, checkpoint, and review the `family_rule_trial` project without assuming a
single rule topic.

Mobile LLM runtime integration is deferred until the first vertical slice has real data
and workflow facts. The first slice SHOULD still reserve structured fields for later mobile
handoff, such as `intent`, `slots`, `missing_context`, `suggested_action`, and `capture_prompt`.

## Harness And Orchestration Corpus Model

The P1 data model exists to supply controlled corpus material for LLM harnesses and workflow
orchestration. It is not only a family-profile storage model.

Scenario facts MUST be transformed before they are used by an LLM or orchestrator:

```text
facts and aggregates
  -> NurtureContextMaterial
  -> NurtureRuntimeContextPack
  -> workflow artifact or user-facing output
```

`NurtureContextMaterial` is the durable scenario-local corpus unit. It SHOULD be generated
from profile snapshots, Family Charter, Current Focus, workflow projects, captures,
metric observations, quantification snapshots, reviews, and evidence. It MUST record source
refs, context-layer mapping, audience, safety/redaction scope, structured payload, and
LLM-ready semantic text.

Each material record MUST be family-scoped, source-traceable, subject-aware, time-bound,
and replaceable. It SHOULD include a stable material key, source version/timestamps,
material hash, subject type/ref, primary context layer, audience, redaction/safety scopes,
validity window, semantic version, and materializer version. Harnesses and orchestrators
MUST NOT assemble prompts directly from raw source tables when a material record or runtime
context pack can be used.

P1 materialization MUST be intentionally bounded. The first implementation SHOULD only
materialize compact digests from family/child profile snapshots, Family Charter, Current
Focus, workflow project state, gated workflow captures, quantification snapshots, and
workflow reviews. Atomic metric observations and evidence records SHOULD NOT directly
become prompt material in P1; they should first feed rollups, snapshots, reviews, or source
references. Embeddings SHOULD be optional and off by default; pack builders should prefer
structured filters before semantic retrieval.

`NurtureRuntimeContextPack` records the context material selected for one harness or
orchestration decision, such as planning, checkpointing, adjustment, review, or mobile
handoff. It SHOULD preserve selected material refs, excluded material refs, known context,
missing context, assumptions, safety boundary, orchestration input, and output contract.
It MUST remain a scenario-side context assembly artifact, not a complete prompt log,
provider invocation log, or host trace. It SHOULD preserve trigger, selection-policy,
material-set hash, pack hash, token-budget, and pack-stat information so planning and review
decisions can be replayed without storing unnecessary provider details.
In P1, selected and excluded material refs MAY remain JSON arrays, but they MUST be shaped
as stable row-like refs with material id/key, source version, semantic version, materializer
version, material hash, reason code, token estimate, redaction level, and safety metadata so
they can later be migrated into a join table without losing replayability.
`candidate_filter_payload` MUST record the admission rules used to form the material
candidate pool, not the candidate result set. `context_layer_coverage_payload` MUST record
the L0-L7 coverage result, including missing or blocked required layers, without storing
full context explanations.
`known_context_payload` MUST remain a compact structured index of usable context, not a
copy of selected material text or the sole LLM context. `missing_context_payload` MUST be an
actionable gap list that can become a user question, form field, workflow action, downgrade,
or safety path.
`assumptions_payload` MUST contain only explicit, bounded, temporary assumptions derived
from assumable missing-context items. Assumptions MUST be scoped, confirmable, and excluded
from final review conclusions unless they are confirmed.
`safety_boundary_payload` SHOULD remain a thin pack-level boundary in P1. It MUST decide
whether normal orchestration may proceed, which output modes are allowed or blocked, and
which sourced safety signals require output limits or review. It MUST NOT become an
independent safety platform or replace My-Chat host safety policy.
`orchestration_input_payload` MUST remain a structured task input for scenario harnesses and
workflow orchestration. It SHOULD contain the task key, task mode, workflow position,
normalized intent, slot values, decision constraints, requested operations, and refs to known,
missing, assumed, or safety-bound context. It MUST NOT duplicate selected material text,
known-context summaries, full prompts, provider requests, or host runtime state.
`output_contract_payload` MUST define the allowed output boundary for the same pack. It
SHOULD contain output mode, artifact type/schema key, required sections, allowed and blocked
actions, validation rules, persistence targets, and fallback policy. It MUST respect
`safety_boundary_payload`, stay within The Nurture-owned scenario artifacts, and avoid becoming
a full workflow engine DSL or provider response schema.
`token_budget_payload` SHOULD stay simple and cost-aware: it MAY define estimated context and
output token budgets, selected-material limits, truncation policy, and fallback policy. It MUST
NOT store provider billing, model price tables, full prompt token ledgers, or complex cost
optimizer state. `pack_stats_payload` SHOULD store only the actual pack-builder facts needed
for replay and operations, such as candidate/selected/excluded/truncated counts, estimated
tokens, estimated cost units, budget-exceeded flag, applied fallback, and build duration.
`model_profile_key` and `model_runtime_hints_payload` MAY express provider-agnostic capability
and behavior preferences, such as latency preference, reasoning depth, determinism, creativity,
and structured-output need. They MUST NOT store concrete provider model ids, provider-specific
parameter names, prompt templates, billing keys, or provider request options. The My-Chat host
runtime remains responsible for mapping these scenario hints to provider-specific settings.
`provider_invocation_ref` MAY store only the My-Chat host/provider invocation reference, while
`result_artifact_ref` MAY point only to The Nurture-owned scenario artifacts or scenario table
fields produced from the pack.

The Nurture MAY build scenario-specific context packs, but My-Chat continues to own the
canonical chat/mobile runtime and provider invocation layer. Context packs are scenario
artifacts, not host model-call logs.

## P1 Data Modeling Decisions

The first database implementation MUST follow these decisions:

1. Family and child profile projections SHOULD be split into separate tables. The split
   keeps family-system semantics and child-development semantics explicit, while both remain
   scenario-local projections attached to opaque My-Chat canonical refs. A
   child projection SHOULD store nullable `my_chat_child_id`; it MUST NOT reuse
   the local child primary key, auto-create a global child, or infer a binding
   from PII.
2. Workflow goals, constraints, and measurement plans SHOULD initially live inside
   `NurtureWorkflowProject` structured payloads. They MUST be shaped so they can later be
   extracted into dedicated tables without changing user-facing semantics.
3. Both `FamilyQuantificationSnapshot` and `MetricObservation` are required. Snapshots
   support planning and review summaries; observations provide time-series facts for 3 to
   14 day validation loops.
4. `NurtureWorkflowProject` SHOULD include first-class semantic fields for LLM routing,
   retrieval, explanation, and later prompt construction. Semantic fields supplement
   structured workflow facts; they MUST NOT replace status, refs, lifecycle fields,
   captures, checkpoints, reviews, or metric observations.
5. `NurtureContextMaterial` SHOULD be the first-class corpus supply layer for LLM harnesses
   and workflow orchestration. Facts, snapshots, captures, observations, and reviews may
   generate materials; prompts and orchestrators should consume materials or runtime packs,
   not raw source tables directly.
6. `NurtureRuntimeContextPack` SHOULD record the exact context assembled for each planning,
   checkpoint, adjustment, review, or mobile handoff decision. It is required for replay,
   auditability, prompt regression testing, and explaining why a recommendation was made.

`MetricObservation` MUST be treated as factual observation, not scoring. It may store
conflict counts, execution consistency, parent burden, recovery time, or similar values,
but product surfaces MUST avoid shame-oriented labels such as parent score or child rank.

`NurtureWorkflowProject` semantic fields SHOULD include `semantic_summary`,
`semantic_tags`, `semantic_domains`, `semantic_stage_key`, `semantic_intent_payload`,
`semantic_context_digest`, `semantic_embedding_text`, `semantic_payload`, and
`semantic_version`. These fields should be sanitized and compact enough for LLM reuse.

`NurtureWorkflowCapture` MUST preserve three layers when user input enters a workflow:
raw input evidence, structured extraction, and LLM-ready semantic data. Raw input is for
traceability, structured payloads are business facts, and semantic fields are acceleration
data for routing, summarization, retrieval, and explanation. User corrections SHOULD append
new captures linked by `supersedes_capture_id` rather than overwriting historical input.

`MetricObservation` records are the short-cycle factual layer. They SHOULD be generated
from captures, checkpoints, reviews, manual entry, or system inference, and they SHOULD use
stable `metric_code` values plus typed value columns. They MUST be presented as observations
or trends, never as parent quality scores, child rankings, or single-day performance grades.

`FamilyQuantificationSnapshot` MUST preserve both structured and semantic content. The
structured layer SHOULD contain stable metric-group payloads such as family resources,
parent bandwidth, family consistency, parent-child connection, life structure, value
alignment, overload risk, metric rollups, development-vector digests, and workflow effect
summaries. The source layer SHOULD cite metric observations, captures, evidence,
checkpoints, or reviews used to build the snapshot. The semantic layer SHOULD include
`semantic_summary`, `semantic_tags`, `semantic_domains`, `semantic_context_digest`,
`semantic_embedding_text`, `semantic_payload`, and `semantic_version` for LLM routing,
retrieval, prompt construction, and explanation. Semantic fields MUST NOT replace
structured payloads or source refs, and snapshot presenters MUST NOT expose aggregate
family, parent, or child scores.

Previously discussed nodes MUST be checked against the corpus model:

- `NurtureWorkflowProject` is a workflow state and intent source. It may generate materials
  such as workflow commitment, plan rationale, missing-context question, checkpoint signal,
  or review learning, but it MUST NOT become the prompt source of record by itself.
- `NurtureWorkflowCapture` is the raw-input and extraction source. It may generate material
  only after redaction, safety classification, and structured extraction.
- `NurtureMetricObservation` is the time-series fact source. Atomic observations SHOULD
  normally feed rollups or snapshots before becoming prompt material, except when an
  observation is safety-critical or explicitly needed for a short-cycle checkpoint.
- `FamilyQuantificationSnapshot` is the aggregate calibration source. It is a primary
  source for L4 family-state and L6 historical-feedback material, but it still requires
  source refs and non-scoring presentation.

## Relationship To Existing Scenario Capabilities

The existing 5 scenario capabilities remain the technical foundation:

- `pregnancy_stage_management`
- `family_strategy`
- `care_plan`
- `activity_comparison`
- `execution_review`

Product templates MAY compose multiple scenario capabilities.

Example:

```text
parent_child_experience
  -> family_strategy
  -> care_plan
  -> activity_comparison
  -> execution_review
```

```text
family_rule_trial
  -> family_strategy
  -> care_plan
  -> execution_review
```

```text
learning_capability_development
  -> family_strategy
  -> care_plan
  -> activity_comparison
  -> execution_review
```

Do not expose internal capability names as the primary user mental model when a workflow
template gives a clearer product expression.

## Task Package Rule

Workflow template implementation MUST be planned in task packages under `dev-docs/`.

The project-level contract defines common semantics. A task package defines concrete scope,
fields, acceptance criteria, verification, and rollout for one template or one template
slice.

The first template task package SHOULD define the `family_rule_trial` vertical slice and
must keep the rule topic configurable. It SHOULD verify at least two rule topics with the
same schema and workbench flow to prove the implementation is not hard-coded to one case.

## Verification Expectations

Any implementation using this contract SHOULD verify:

- recommendation output includes `development_stage`, `urgency_horizon`, and strategic
  context references;
- LLM outputs identify missing context and assumptions;
- artifacts reference Family Charter and Current Focus when applicable;
- development-vector and family metrics are used as calibration dimensions, not rankings;
- risk signals remain restricted and do not leak to low-trust surfaces;
- workflow results can update profile projections only through explicit policy gates;
- community-case candidates are opt-in, sanitized, and refs-only for handoff.
