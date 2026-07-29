# Architecture — 儿童照护双看板

## Core Principle

看板是 Nurture facts 的角色化 projection，不是新的事实所有者。Guardian board 和 Caregiver board 不各自维护一份“孩子状态”。

## Logical Components

- Care fact repositories：focus、daily care、attention、media attribution、publication。
- Policy layer：actor + role + grant + child scope + fact visibility。
- `PublishProcess`：draft、review、publish、reject、correct；它是照护内容领域状态机，
  不是园区管理 Workflow。
- AI organizer port：可替换、可测试，只产生建议。
- Guardian presenter：家庭连续性、当前关注、已发布照护记录。
- Caregiver presenter：班级共同工作队列、待确认、快速记录和发布状态；
  acknowledge actor 是审计信息，不是个人 assignment 或 reply authority。

## Publish Invariants

- 草稿默认仅创建方和有权 reviewer 可见。
- 发布前必须重新校验 authority、child scope、目标 family 和 provenance。
- 发布与 receipt/authority evidence 必须事务一致。
- 重复请求返回同一 publication，不产生重复家庭事实。
- correction 不覆盖来源；历史仍可解释。

## AI Boundary

- provider 输入必须是当前 actor 已有权访问的数据。
- 输出标记为 suggestion，必须由人确认。
- 禁止自动诊断、处方、紧急判断、教师/儿童/家庭排名。
- provider failure 不影响人工记录和发布主路径。

## Media Boundary

- Nurture 拥有媒体业务 attribution 和授权引用。
- My-Chat 拥有设备选择、上传 transport、缓存和 native permission。
- presenter 只输出宿主可消费的安全引用和状态，不暴露存储内部路径。

## Read Consistency

guardian 与 caregiver 投影需要共享 source revision / fact version。撤回、更正或 grant 变化后，两侧都必须在规定的一致性窗口内反映。

## Workflow Projection Boundary

- 当前产品 Workflow 只指园区管理 `InstitutionWorkflow`；board 不是 Workflow owner。
- Guardian/Caregiver board MAY 显示与当前角色直接相关的
  `InstitutionWorkflowProjection` 外部切片，例如 GrantRequest 待确认或结果。
- 同角色可获得更完整投影，但仍必须验证 Workspace、Institution、scope、assignment、
  Grant/fact visibility 与 purpose。
- family-care Item 的 action scope 是原始精确 `Enrollment + CareGroup`；同班当前
  合格照护者可追加多条回复，board 不创建或推断个人 claimant。
- teacher board 将回复呈现为 CareGroup-owned append stream；每条回复保留真实
  executor audit/可选署名，第一条回复解除 Attention，后续回复不重复完成事项。
- projection 只包含安全摘要、阶段、里程碑、下一步和当前可执行 capability；不得输出
  raw Run/Step、claim token、园区内部备注或未授权主体。
- board action 调用版本化 capability；不得直接修改 projection 或 runtime state。
