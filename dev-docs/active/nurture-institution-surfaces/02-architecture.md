# Architecture — 机构端双 Surface

## Institution Boundary

机构关联、group membership、enrollment 或 scenario binding 只决定路由候选范围。读取事实仍需 actor role、grant、child scope、fact visibility 和用途策略同时通过。

## Logical Components

- Institution/group/enrollment/grant repositories and services。
- Aggregate policy：从已授权、可聚合的 care facts 生成安全统计。
- Institution mobile presenter：只读概览和支持信号。
- Institution workbench presenter：Workflow queue/detail、roster/invite/confirmation/grant 状态。
- Institution Workflow service：园区管理类型、阶段、业务 eligibility、里程碑和
  role-safe projection。
- Institution commands：最小、显式、幂等、可审计。

## Aggregate Privacy

- 不读取或拼接 family-private conversation body。
- 不向小样本 aggregate 暴露可识别的 child/family 细节。
- grant 撤销或 fact redaction 后，后续 projection 必须删除对应贡献。
- support signal 只描述需要关注的工作，不形成 child/teacher/institution score。
- 原始事实与 aggregate 都保留 provenance，但 presenter 只暴露 actor-safe 解释。

## Mobile vs Web

| Concern | Mobile board | Web workbench |
| --- | --- | --- |
| Primary use | quick awareness | operational work |
| Mutation | none | minimal authorized commands |
| Workflow | read-only `InstitutionWorkflowProjection` | primary Workflow operation surface |
| Detail | aggregate、safe stage/milestones/blocker/next action | queue/detail/steps/forms/audit |
| Host owner | My-Chat native shell | My-Chat web shell |
| Domain owner | Nurture presenters/policy | Nurture services/presenters/policy |

## InstitutionWorkflow Boundary

当前阶段 `InstitutionWorkflow` 只覆盖园区管理，例如 roster intake、invite/enrollment、
GrantRequest 与后续明确纳入的园区配置/审批。family-care submit/acknowledge/reply、
notification delivery 和 caregiver `PublishProcess` 不属于 Workflow。

Nurture owns Workflow 类型、业务阶段、eligibility、handlers、业务 facts 和 projection
内容。My-Chat / My-Workflow-Base owns 通用 Run/Step/worker/ledger runtime 与
Web/native shell。任何一侧都不得复制另一侧数据库或运行时。

## Workflow Projection

mobile 与 Web 必须从同一 canonical Workflow/business facts 生成 versioned
`InstitutionWorkflowProjection`。最小字段包括：

- opaque `workflowRunRef`、`workflowType`、safe title/summary；
- state、current stage、completed milestones；
- actor-safe blocker、next action、responsible role；
- started/updated/due timestamps 与 projection version；
- 当前角色允许执行的 capability refs（mobile 当前为空）。

同角色可以看到更深内容，但 role 不是充分权限；读取仍验证 Workspace、Institution、
scope、assignment、Grant/fact visibility 与 purpose。projection 不输出 claim token、
lease、worker internals、raw DB ID、未授权家庭正文或园区内部备注给外部角色。

## Open Product Decisions

- 哪些理念/目标是家庭可选择共享、哪些仅机构配置。
- support signal 的最小样本和时间窗口。
- roster/invite 是否需要批量操作；默认不纳入首轮。
- institution mobile 是否需要 drill-down；默认只读且不进入家庭私密详情。
- Workflow progress 使用阶段/里程碑/下一步，不默认制造无业务依据的百分比。

## Failure Model

未知机构、过期 grant、group mismatch、aggregate 样本不足和 source pin 不匹配均返回稳定的 fail-closed 状态。
