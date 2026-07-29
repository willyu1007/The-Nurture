# Workflow、Action 与 Projection 产品语义契约

## Purpose

本文件是 The Nurture 当前 Workflow 术语与产品边界的 SSOT。读者应能在
30 秒内判断一个能力属于 `InstitutionWorkflow`、`ActionExecution`、
`ActionDelivery`、`CareInteraction` 还是 `PublishProcess`。

本契约取代历史上将家庭长期目标、普通 Chat 动作、异步投递和园区管理流程都称为
Workflow 的宽泛用法。历史设计保存在
`docs/project/overview/legacy-family-workflow-product-design-contract.md`，仅供追溯。

## Semantic Precedence

- 最新用户确认的产品决策优先于历史初始化材料和旧任务文字。
- 本文件定义产品语义；`My-Workflow-Base`、`workflow-contracts`、
  `workflow_step_complete_v1` 等现有包名或兼容接口名不自动扩大产品 Workflow 范围。
- 当前阶段只有园区管理过程属于产品 Workflow。未来扩展必须通过新的顶层决策，
  不得因为动作异步、跨 owner、需要 worker 或产生通知就自动归类为 Workflow。
- T-003 与 `nurture-mobile-ux-contract.md` 是设计输入。与本契约或
  T-004～T-008 已确认决策冲突时，以本契约和最新任务决策为准。

## Canonical Terms

| Term | Definition | Current examples |
| --- | --- | --- |
| `InstitutionWorkflow` | 园区管理中可暂停、恢复、追踪阶段和责任人的持久化业务流程 | roster intake、invite/enrollment、GrantRequest、园区配置/审批 |
| `InstitutionWorkflowRun` | `InstitutionWorkflow` 的一次运行实例；通用 Run/Step/ledger 由 My-Chat / My-Workflow-Base runtime 拥有 | 某次入托邀请、某次授权申请 |
| `InstitutionWorkflowProjection` | 从当前业务事实与 runtime state 生成的角色安全读模型 | mobile board 摘要、Web workbench detail |
| `ActionExecution` | 一次确认后原子提交、可立即得到业务提交结论的领域动作 | submit、acknowledge、reply、correct、withdraw request、redact |
| `ActionDelivery` | 将已提交 action result/receipt 幂等交给通知、Handoff、Outbox 或设备消费面的技术机制 | notification dispatch、deep-link materialization |
| `CareInteraction` | 家庭与照护者围绕 Message、CareItem、Event、Receipt 形成的沟通闭环 | family question → acknowledge → reply |
| `PublishProcess` | caregiver draft/review/publish/reject/correct 的领域状态机；当前不属于园区管理 Workflow | two-stage publish |
| `CareItemDependency` | 未来可能出现的事项前置、触发或 SLA 关系；不属于 Increment 1 | 尚未实现 |

`Workflow` 单独出现时 MUST 指 `InstitutionWorkflow`。需要表达技术 runtime 时，
MUST 使用 `Workflow Runtime`、`Run`、`Step` 或具体兼容接口名；需要表达普通业务动作、
投递、沟通或发布状态时，MUST 使用上表中的专用术语。

## Classification Rules

一个当前能力只有同时满足以下产品条件，才可定义为 `InstitutionWorkflow`：

- 目的属于园区管理，而不是普通家庭/照护沟通或内容发布。
- 过程跨越多个可恢复阶段，并且用户可以离开后返回。
- 当前阶段、已完成里程碑、责任角色、阻塞和下一步具有稳定业务含义。
- 园区 Web workbench 是主要操作面；其他 surface 只消费角色安全投影或有限动作。

以下条件本身不足以把能力升级为 Workflow：

- 使用异步调用、worker、retry、Handoff 或 Outbox。
- 跨越家庭与园区边界。
- 产生通知、回执或 deep link。
- 使用 `prepareAction` / `executeAction` 两个技术阶段。
- 需要 CommandExecution 幂等、状态查询或 outcome reconciliation。

## Surface Contract

| Surface | Workflow responsibility |
| --- | --- |
| Institution Web workbench | `InstitutionWorkflow` 的主要列表、详情、步骤、表单和管理动作 |
| Institution mobile board | 只读 `InstitutionWorkflowProjection`；显示关键内容、阶段、里程碑、阻塞和下一步 |
| Guardian/Caregiver board | 只显示与当前角色相关的外部请求、结果或安全摘要；不得暴露园区内部步骤 |
| Chat | 可以解释角色安全的当前状态或提供 action card；不得承载完整流程管理 |

Board 是 Workflow 的 consumer，不是 Workflow 事实或 runtime owner。相同角色可以获得
更完整的投影，但“角色相同”本身不授权；每次读取仍 MUST 验证 Workspace、Institution、
scope、assignment、Grant/fact visibility 与 purpose。

## Workflow Projection Contract

`InstitutionWorkflowProjection` SHOULD 提供：

- opaque `workflowRunRef` 与 projection version；
- `workflowType`、actor-safe title/summary；
- `state`、`currentStage`、已完成的关键 milestones；
- actor-safe blocker、next action 和 responsible role；
- `startedAt`、`updatedAt`、可选 `dueAt`；
- 当前角色可执行的 versioned capability refs。

Projection MUST NOT 输出：

- raw runtime/database identifiers、claim token、lease、worker internals；
- 未授权家庭/孩子正文、其他 Institution/Enrollment 的存在；
- 园区内部备注给外部角色；
- 没有稳定业务含义的伪百分比进度；
- 可绕过 owner-reread 的 action payload 或 authority snapshot。

状态展示 SHOULD 优先使用“当前阶段 + 已完成里程碑 + 下一步/阻塞”，而不是人为百分比。

## Action and Delivery Contract

- `submit`、`acknowledge`、`reply` 在当前阶段 MUST 是 Harness 下的
  `ActionExecution`，并通过 Nurture `CommandExecution` 保持原子 effect、幂等与 exact replay。
- `ActionDelivery` 由 My-Chat 的 Handoff、Outbox、notification、deep-link 与
  reconciliation 机制承担。技术投递 MAY 异步，但不得形成产品 Workflow 或暴露 Run/Step 心智。
- Nurture committed result 与 My-Chat delivery/read/notification 是不同事实。
- response loss MUST 使用原 command identity replay；`outcome_unknown` MUST 先按原
  identity reconcile，再决定是否 materialize delivery。
- 当前兼容实现若把 family-care action 绑定到泛化 Workflow Step，只能视为待迁移的
  runtime seam，不得成为新增产品契约或真实流量 activation 的依据。

## CareInteraction Post-send Mutation Contract

CareInteraction 的 post-send 动作 MUST 按对象和 effect 区分，不得统一实现为
“撤回/删除消息”：

- `correction` 修改 Message 的有效解释。它 MUST 由 exact author 追加不可变 correction
  version；不得原地覆盖正文，也不得因 CareGroup 业务发送身份允许老师修改同事文字。
  家长问题在 responded 后的修正 MUST 创建新的续接 CareItem。
- `withdrawal` 停止家庭 CareItem 的后续工作。它 MUST 关闭事项、停止未来
  acknowledge/reply 并保留 Message、Reply、Receipt 和 delivery/read 历史。caregiver
  reply 与 Grant revoke MUST NOT 复用该 capability 或用户文案。
- `redaction` 不可逆移除 Message 正文/附件/correction versions。author redaction
  MUST 是 exact-author action；policy/safety/admin redaction MUST 使用独立 system
  actor/reason。Message tombstone、Receipt、Event、Execution 与审计 MUST 保留。
- source-question redaction MUST suppress dependent Item/active Attention and stop future
  actions；reply redaction MUST remain local to that reply/correction chain and MUST NOT
  reopen the original waiting Attention or erase other authors' facts.
- correction MAY create a new ActionDelivery candidate。withdrawal/redaction MUST invalidate
  pending candidates where applicable；already-sent push cannot be recalled，and every open
  MUST owner-reread the current Nurture projection before showing content。

PublishProcess 中“待发送气泡撤回”是 publish 前取消，不是上述 post-send withdrawal。

## Ownership

The Nurture owns:

- `InstitutionWorkflow` 的领域类型、阶段语义、业务 eligibility、handlers/actions；
- scenario artifacts、业务事实、role-safe presenters 和
  `InstitutionWorkflowProjection` 的内容定义；
- `ActionExecution`、`CareInteraction`、`PublishProcess` 的领域语义。

My-Chat / My-Workflow-Base owns:

- 通用 Run/Step/worker/ledger runtime；
- Web/native shell、navigation、Handoff、Outbox、notification 与 device delivery；
- 对 Nurture versioned contract 的消费，不导入 Nurture ORM 或 source。

## Current Scope

当前 Workflow 产品范围只包括园区管理：

- roster intake、邀请和入托确认；
- Institution Enrollment 管理；
- GrantRequest 发起、等待 Guardian 决定、过期/拒绝/撤销结果；
- 后续明确纳入的园区配置或审批流程。

家庭沟通、照护记录、caregiver 发布和普通 Chat 不属于当前 Workflow 范围。

## Verification

修改 Workflow 相关文档后 MUST：

1. 搜索未限定的 `workflow`、`care workflow`、`publish workflow`、
   `workflow dependency` 和 `claimed Workflow Step`。
2. 确认每处分别改为本契约的 canonical term，或明确标注为 runtime compatibility name。
3. 运行：

```bash
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

Expected result：context strict verification 和 project lint 均通过；T-004～T-008
不再把 family-care action、delivery 或 `PublishProcess` 归类为 Workflow。

## Change Log

- 2026-07-29：固定 CareInteraction correction/withdrawal/redaction 的不同 target、
  exact-author boundary、append-only/tombstone 语义与 notification owner-reread。
- 2026-07-29：将 Workflow 收敛为园区管理业务过程；明确 board projection、
  Web operation、ActionExecution、ActionDelivery、CareInteraction 与 PublishProcess。
