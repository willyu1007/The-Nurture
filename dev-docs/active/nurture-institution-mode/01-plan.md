# Plan — Institution Ecology

> 分阶段推进（IA → III）。当前重点是 IB：把 My-Chat account/shell 与 Nurture care ecology graph 的边界落成 schema SPEC，并让 `family_to_org` 能支撑班级沟通中枢。

---

## Phase IA — 设计 & 治理登记（本仓，已完成）

**目标：** 把机构生态正式写入项目治理与设计文档，产出可交付的设计包，不改 live manifest，不破坏 conformance。

**步骤：**

1. 写设计包：`00-overview.md` / `01-plan.md` / `02-architecture.md` / `roadmap.md`。
2. 治理登记：`registry.yaml` 加 M-002 / F-002 / T-002；`feature-map.md` 加 F-002 语义 brief；跑 `ctl-project-governance sync --apply`。
3. manifest 增量以 SPEC 形式保留在架构文档里，暂不改 `scenario.manifest.yaml`。

**验收：**

- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` 绿。
- `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` 绿。
- 现有 conformance 不受影响。

---

## Phase IA.1 — 边界与 `family_to_org` 对齐（本仓，已完成）

**目标：** 在进入 schema/代码实现前，确认 Nurture 的中心对象、场景角色、My-Chat/Nurture ownership 边界，以及班级家庭沟通中枢的 MVP。

**已对齐结论：**

1. **中心对象**：Nurture 的基本单位是 `NurtureChildCareProcess`。家长加入这个过程；老师把这个过程并入班级工作流；机构管理者治理这些过程。
2. **用户边界**：家长、老师、机构管理者都是 My-Chat 用户；小孩不是 My-Chat 用户。
3. **ownership**：My-Chat owns account identity and scenario shell; Nurture owns the care ecology graph。
4. **场景关系**：家庭、孩子、机构、班级、老师分配、入托、授权、家园沟通都归 Nurture canonical。
5. **家园沟通**：Nurture 保存 `NurtureFamilyCareMessage` 原文和 `NurtureFamilyCareItem` 结构化事项；My-Chat 只做 shell/render/notification/deep link。
6. **老师痛点**：一个班 10 个孩子产生 10 个私密沟通线程，老师侧必须聚合成 `class_family_inbox`。

**待细化：**

1. `NurtureChildCareProcess`、`NurtureParticipant`、`NurtureCareRoleAssignment`、`NurtureEnrollment` 的字段和生命周期。
2. `NurtureChildLinkGrant` 的 data class、direction、receipt、revoke、保留窗口。
3. `NurtureFamilyCareItem` 的分类、状态机、过期规则和指派规则。
4. My-Chat shell 需要保存哪些 display-safe projection metadata。

**验收：**

- 决策结论写入 `roadmap.md` 和 `02-architecture.md`。
- 关键 tradeoff 写入 `03-implementation-notes.md`。
- `docs/context/workflow/nurture-scenario-contract.md` 同步新 ownership 边界。
- context/governance 校验通过。

---

## Phase IB — Nurture care ecology canonical（本仓，已锁定）

**目标：** 设计 Nurture-owned canonical schema 和 resolver contract，为 IIA 接线准备。

**当前产物：**

- `06-ib-nurture-schema-spec.md`（design-only，不改 Prisma schema，不接 live manifest）
- `07-ib-decision-convergence.md`（child scope baseline + 7 个 IB open decisions 的 implementation defaults）
- IB-D0 through IB-D7 are locked and feed IIA.

**步骤：**

1. Review/lock 核心对象 schema SPEC：
   - `NurtureParticipant`
   - `NurtureChild`
   - `NurtureChildCareProcess`
   - `NurtureCareRoleAssignment`
   - `NurtureFamily`
   - `NurtureCareInstitution`
   - `NurtureCareGroup`
   - `NurtureEnrollment`
   - `NurtureChildLinkGrant`
2. Review/lock 家园沟通 schema SPEC：
   - `NurtureFamilyCareThread`
   - `NurtureFamilyCareMessage`
   - `NurtureFamilyCareItem`
3. Review/lock My-Chat integration contract：
   - `my_chat_user_id` 映射
   - mobile/web render refs
   - notification/deep link payload
   - host workflow runtime refs
4. 设计 policies：
   - `can_view_child_care_process`
   - `can_write_family_care_message`
   - `can_receive_family_context`
   - `can_share_to_family`
   - `caregiver_scope`
5. 收敛 Prisma implementation defaults：
   - `NurtureChildCareProcess` as independent child scope
   - `NurtureParticipant` uniqueness
   - `NurtureFamily` MVP cardinality
   - `NurtureTeacherAttentionItem` projection strategy
   - grant revoke retention semantics
   - data class/category vocabulary model
   - message protection/redaction boundary
   - My-Chat shell metadata envelope

**门禁/依赖：**

- 不改 live manifest。
- 不改 Prisma schema，除非正式进入 schema implementation 并走 DB SSOT 流程。
- My-Chat 只需提供 account/shell/runtime contract，不需要拥有 Nurture care canonical。

**验收：**

- schema SPEC 可解释一个班 10 个小孩、多个家长、多个老师和机构管理者的全关系。
- 所有 child-specific care facts 都能通过 `childCareProcessId` 解释，老师/家长视角只是 child scopes 的聚合/过滤/再组织。
- 7 个 IB open decisions 已有 implementation defaults，且生产 rollout gates 明确。
- `family_to_org` 和 `org_to_family` 都能通过 grant + policy + receipt fail-closed。
- fresh reader 可从 `02-architecture.md` 和 `06-ib-nurture-schema-spec.md` 推导首批表、权限和 UI 工作流。

---

## Phase IIA — 场景契约 + 数据 + 领域逻辑（本仓，当前）

**目标：** 把 IA/IB 的设计接线，跑通机构侧首批 capability 和家园沟通闭环。IIA-0 contract preflight 已锁定；实施按 X0-X5/N1-N2 跨仓门禁推进，不做三仓同时切换。

**步骤：**

1. X0 My-Workflow-Base：以 additive/migration-safe 方式增加 vNext handoff/driver/host-capability 合同和模板 conformance；不实现运行时。
2. X1 My-Chat contract adoption：采用相同类型/validator/worker pass-through，保持旧场景可编译，`workflow_handoff_materialization_v1` 默认关闭。
3. X2 My-Chat Step kernel：实现真实 Postgres `WorkflowRuntimePort`、claim/complete/fail、completion replay 和 host dependency injection。
4. X3 My-Chat Handoff kernel：实现 Handoff Ledger、`complete_step` 原子 materializer、outbox、Admin reconciliation；dev capability 才可开启。
5. N1 Nurture core（可在 X2/X3 期间并行）：按 IB/IIA 设计增加 schema、`NurtureCommandExecution`、`NurtureInteractionContext`、command runner 和首批 inbox/attention 业务；所有 Execution 只允许 explicit `handoffRequestSnapshotsPayload=[]`。
6. X4/N2 双仓 activation：接 claimed driver、non-empty snapshots、manifest `handoff_key`/context refs、`user_attention` owner reread；仍在 feature gate 后。
7. X5 joint acceptance：通过 commit/response loss、same-Step reclaim、wrong-Step denial、partial duplicate、revoke/redaction/cancel/provider failure 矩阵后才启用非空 activation。
8. `scenario.manifest.yaml`：按能力增量声明 `class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution`；teacher mobile 是 surface composition，不作为 canonical business capability。
9. `prisma/schema.prisma`：进入 N1 时使用 `sync-db-schema-from-code` 工作流；不把 host Handoff Ledger 写进 Nurture schema。
10. handlers：
   - `open_class_family_inbox`
   - `open_today_attention_board`
   - `record_daily_care_log`
   - `classify_child_media_assets`
11. family-care processing：
   - 保存 `NurtureFamilyCareMessage`
   - 提取 `NurtureFamilyCareItem`
   - 指派/确认/回复/跟进状态流转
12. presenters：
   - 老师班级 inbox
   - 今日看板
   - 家长私密线程
   - display-safe notification/deep link summary
13. tests：
   - caregiver scope 越组拒绝
   - family_to_org data class 不匹配拒绝
   - revoke 后新投递拒绝
   - teacher 回复只回到对应小孩家庭线程
   - Chat-entitled guardian/caregiver role-agnostic ingress plus institution Chat denial
   - dashboard role switch validation
   - one active family per child care process
   - message redaction vs projection suppression
   - stale notification/deep link re-resolves through Nurture
   - institution command + at least one existing family-core command share the same CommandExecution repository/runner and replay contract

**IIA-0-C1 implementation sequence：**

1. `class_family_inbox` + `teacher_attention_board` first.
2. `caregiver_daily_care` second.
3. `child_media_attribution` third.

**N1 implementation checkpoints（2026-07-14）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| N1-A | Complete | Cross-repo revision/hash pin and explicit-empty activation boundary. |
| N1-B | Complete | Additive production schema/migration/context; migration applied only to the approved local `localhost:5433/nurture` target and catalog boundary verified. |
| N1-C | Complete | Shared CommandExecution runner, InteractionContext, Prisma transaction adapter, and one family-core command migration. |
| N1-D | Complete | Fail-closed resolver, candidate kernel, structured policy, and current-state source adapters. |
| N1-E | Complete | Family input → receipt/item/attention, caregiver acknowledge/reply, grant revoke, source redaction, pre-delivery cancel, class inbox/attention owner reads; explicit `[]` only. |
| N1-F | Complete | Approved production-DB migration apply; 22/22 DB tests; DB-backed capture/replay/revoke/redaction/cancel and direct surface journey; YAML/registry/module conformance; final architecture repairs and N1 review. |

**X4/N2 implementation-entry checkpoints（2026-07-15）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| X4-0A | Complete | My-Chat X3 hardening delivered and post-commit verified at final revision `4d40d81`. |
| X4-0B | Complete | Nurture dependency pin updated to X3; Base/My-Chat parity, scenario pin, and negative drift tests pass. |
| X4-0C | Complete | Nurture typecheck, 152 unit tests, Prisma/schema/boundary, routing/population, context, governance, and whitespace gates pass after refreshing the local `file:` dependency snapshot. |
| X4-0D | Complete | Pin/SSOT update committed at `6f2c836`; independent X4 branches created from immutable Nurture/My-Chat baselines; first slice locked to claimed-Step `user_attention` replay seeds without manifest/host activation. |
| X4-A1 | Complete | Command runner validates trusted driver binding before lookup/transaction, persists bounded refs-only snapshots plus canonical original-Step provenance, preserves direct explicit-empty, and fences replay to the same Step. |
| X4-A2 | Complete | Custom CHECK migration preview, strict persisted JSON parser, static contract assertion, unit/privacy/replay tests, and DB-backed test case implemented. No database was connected or mutated. |
| X4-A3 | Complete | Approved disposable database `nurture_x4_validation_e7d4590` is migration-current; 23/23 DB/E2E, 43-table/71-enum boundary, validated CHECK, negative JSON probes, DB context, and public database suite pass. Existing `nurture` was not touched. |
| X4-B | Complete | My-Chat worker bridge converts a claimed Step into the Base-shaped transient driver and converts returned snapshots into whitelisted handoff drafts. Runtime implementation `a9685d5`, final delivery/exact pin `26f57be`; 327 non-DB tests and all delivery gates pass with capability disabled. |
| X4-C1 | Complete | Delivered at `2398d98`. Nurture receives the bridge only through a host-injected port, resolves stable scenario command/request IDs through a scenario-owned source port, replays only on the original Step, returns one opaque CommandExecution output ref, and emits no host-standard event. The handler is registered but absent from the manifest and the default composition has no business-source adapter. |
| X4-C2 | Complete | Added the versioned manifest handoff/context-source declarations, strict production business-source adapter, explicit activation-only module factory, current owner reread, service-auth boundary, My-Chat dev-only owner/capability, idempotent notification/deep-link shell, and isolated PostgreSQL verification. Default Nurture composition plus My-Chat staging/prod remain disabled. |
| X4-C3 | Complete | Final architecture/privacy review repaired Actor/user binding, receipt-open state, unauthorized lifecycle reason leak, notification channel convergence, generic fallback coupling, owner-outage open behavior, and global mobile deep-link routing. Cross-repo pins and full static/DB gates pass. |
| X5 | Complete | Combined fault/privacy/recovery/telemetry matrix passes; pilot enablement remains a separate authorization node. |

**X5 joint-acceptance checkpoints（2026-07-15）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| X5-A | Complete | X4 revisions/hashes, existing-vs-missing evidence, and the fresh two-production-DB plus private dev-host DB validation topology are locked without changing activation posture. |
| X5-B | Complete | The real two-database response-loss/reclaim/wrong-Step/revoke/privacy journey and My-Chat Admin technical recovery pass. Existing deterministic tests remain the authority for mixed/rollback, redaction/cancel/withdrawal/policy, provider/dead-letter, and owner-outage rows. |
| X5-C | Complete | Added backend-neutral, refs-only command/owner telemetry for duration, context-ref count, attempts, LLM calls, cache hits, and replay; static privacy tests and both observability registries pass. |
| X5-D | Complete | Three clean isolated databases received the 17/3/1 migration streams with no drift; full suites and three consecutive joint runs pass; the disposable container was removed and port `55436` released. |
| X5-E | Complete | Dual-repo review repaired outcome-unknown handling, version normalization, telemetry composition, Outbox test isolation, source-pin coverage, and Admin actor/causation evidence. Exact revisions/hashes are locked; pilot is recommended but not enabled. |

**Pilot Enablement checkpoints（2026-07-16）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| Pilot-0 | Authorized / In progress | Readiness and scope lock only: identify the pilot institution/workspace/cohort, roles and data classes; audit IIB teacher/guardian UX gaps; choose the delivery/environment shape; define observation duration, success/stop criteria, privacy ownership, and rollback evidence. No runtime or environment enablement is authorized. |
| Pilot-1 | Not authorized | Prepare an isolated pilot environment only after Pilot-0 acceptance: exact revisions/hashes, database and backup/restore plan, service-token scope, artifact provenance, and secret handling. ACR becomes a prerequisite here only if the approved pilot deployment uses the current container publication path. |
| Pilot-2 | Not authorized | Enable the activation composition and `workflow_handoff_materialization_v1` only for an explicit workspace allowlist; all other workspaces and staging/production remain default-off. |
| Pilot-3 | Not authorized | Rehearse response loss, same-Step reclaim, wrong-Step denial, revoke/redaction/cancel, dead-letter/Admin recovery, stale deep links, owner outage, capability kill-switch, credential rotation, and database recovery in the approved pilot topology. |
| Pilot-4 | Not authorized | Run the bounded observation window, review latency/errors/retries/LLM/cache/manual-work/privacy evidence, rehearse rollback, and make an explicit continue/expand/stop decision. It cannot authorize staging, production, or GA. |

The 2026-07-16 approval opens only Pilot-0 inside the existing T-002 task bundle. Any database apply, ACR publication, repository/environment secret configuration, capability or manifest-composition change, external pilot traffic, or Pilot-1 through Pilot-4 entry requires a new explicit approval. Pilot rollback remains capability/activation deactivation and must not rewrite committed Nurture business facts.

Pilot-0 detailed evidence and recommendations are canonical in `09-pilot-readiness.md`:

| Pilot-0 checkpoint | Status | Exit |
| --- | --- | --- |
| Pilot-0-A baseline/actual-capability audit | Complete | Exact cross-repo baseline and contract/source hashes pass; actual runtime, UX, provisioning, delivery, security, and observability gaps are classified. |
| Pilot-0-B cohort/role/surface/data lock | In progress — B3-2 complete | Revised B1/B2 and B3-0/B3-1 are locked; B3-2a-d close transition, token, notification/deep-link stale handling, and draft/result/history continuity. B3-3/B3-4 remain open. |
| Pilot-0-C IIB/onboarding contract | Proposed | Accept the minimum authenticated guardian, caregiver, institution-admin, grant/revoke, acknowledge/reply, and receipt UX closure. |
| Pilot-0-D topology/operations contract | Proposed | Accept the isolated environment, exact scenario artifact, two-key workspace gate, observation, stop, recovery, and rollback terms. |
| Pilot-0-E Go/No-Go review | Pending | Assign implementation owners and review all evidence. Pilot-1 remains separately authorized. |

X5 acceptance matrix (each row must have deterministic evidence; adjacent single-repo tests may support but cannot replace the joint boundary where noted):

- business commit success and worker response loss;
- same-Step lease reclaim and wrong-Step replay denial;
- exact duplicate, mixed existing/new partial duplicate, and crash rollback/retry;
- grant revoke, source redaction, pre-delivery cancel, post-delivery withdrawal, and current policy change;
- owner/provider failure, Outbox retry/dead-letter, and authorized Admin technical reconciliation;
- stale notification/deep-link owner reread and owner outage fail-closed behavior;
- contract/source-pin drift and refs-only privacy boundary;
- latency, context size, retry attempts, LLM calls, and cache-hit telemetry.

X5 remains a validation and hardening gate. It does not authorize schema ownership changes, staging/production activation, pilot enablement, or rollback of committed Nurture business facts. Rollback remains capability/manifest deactivation only.

**Cross-repo task ownership：**

- My-Workflow-Base：复用 `dev-docs/active/workflow-base`，因为 X0 是既有模板合同收敛。
- My-Chat：新建 `workflow-handoff-materialization`；现有 `workflow-runtime` task 明确 scope-out concrete persistence/Prisma/DB transaction，禁止事后改写其历史范围。
- The-Nurture：继续复用本 `nurture-institution-mode` task，不拆第二个 Nurture bundle。

**Compatibility/rollback：**

- Base/My-Chat contract first uses additive optional fields plus validator warnings；只有声明 non-empty activation 时提升为 fatal capability requirement。
- Nurture直接依赖 My-Chat contract package，不直接依赖 Base template；N1 must record the adopted My-Chat contract revision/hash。
- Rollback disables host capability and Nurture non-empty manifest path；explicit-empty business facts、Execution and InteractionContext remain valid，不需要跨库回滚。

**验收：**

- 模块过 `validateWorkflowModule` + `loadWorkflowRegistry`。
- Nurture DB migration/schema context 刷新完成。
- 家园沟通闭环：家长私密会话输入 → 班级 inbox item → 老师 workflow action → 可追溯的家庭侧 receipt/response/care outcome；老师无需进入 direct family chat。

---

## Phase IIB — 操作台 + 同意 UX（本仓）

**目标：** 机构、老师、家长可用；同意/撤销/沟通工作流可演示。

**步骤：**

1. 机构管理者 web/admin：机构、班级、老师、入托、理念/流程配置。
2. 老师 mobile：班级 inbox、今日看板、快速记录、照片归属确认。
3. 家长端：加入小孩养育过程、私密沟通线程、授权/撤销、receipt 查看。
4. org/family 双向流动：daily care 回流、care day note 投递、reply/ack 状态回显。

**验收：** 手动走完"机构建组 → 老师绑定 → 家长加入孩子养育过程 → 家长发今日提醒 → 老师 inbox 处理 → 日结回流 → 家长撤销授权"全旅程。

---

## Phase III — 生态飞轮（双仓）

**目标：** 机构采用驱动在园家庭参与 Nurture 家庭生态。

**步骤：** 招生导入 → 家长加入小孩养育过程 → 授权家园沟通和照护摘要 → 老师日常工作流产生可感知价值 → 家庭生态被激活 → 归因记录。

**验收：** 一条端到端演示通过；机构/老师有直接价值；无排名、无交易、无竞争性评分。

---

## 上线前 gate / 范围外（跟踪，不阻断 IA.1）

- **同意/保留法务签核** PENDING：`ChildLinkGrant` revoke 语义 + 数据保留窗口需产品/合规签核。
- **儿童数据跨角色合规** PENDING：看护者跨组授权、家园沟通原文保留和通知摘要需合规复核。
- **医疗边界** PENDING：family_to_org 中涉及健康观察、用药、急救的内容需要安全闸和线下流程分流。
