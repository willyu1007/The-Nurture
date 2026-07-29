# Architecture — 儿童照护双看板

## Core Principle

看板是 Nurture facts 的角色化 projection，不是新的事实所有者。Guardian board 和 Caregiver board 不各自维护一份“孩子状态”。

## D-01 — Operable Shared Projection Pipeline

双看板共享 canonical facts、board 模块语义、provenance、snapshot 与排序规则，但
不新增一个持久化的统一 child-state aggregate，也不向两个角色暴露包含全部字段的
super DTO。每个请求先解析当前 actor、Workspace、child/CareGroup scope、Grant 与
fact visibility，再只读取该角色可用的事实，最后由 Guardian 或 Caregiver presenter
形成 T-004 `SurfaceEnvelopeV1` 下的角色独立 content。

请求期组合出的 board snapshot 是 derived read result：它可以缓存或按性能证据增加
可重建索引，但不是授权输入、事实写入目标或历史真相。删除、过期或失效后必须能够从
canonical facts 重建。不得先加载跨角色完整事实，再依赖 presenter 隐藏敏感字段。

“snapshot 不可直接修改”不表示看板只读。看板是可操作的领域投影窗口，用户可以原地
完成低打扰微调，但写入路径按 effect 分类：

- 排序、折叠、筛选和默认日期等展示偏好写入 surface/host preference，不改变业务事实。
- AI suggestion、草稿正文、备注和发布时间等发布前调整写入 `PublishProcess` draft。
- child attribution、media attribution、focus 和其他业务调整调用对应 Nurture
  canonical owner 的 versioned capability，并保留 actor、version 与 provenance。
- 已跨家庭边界发布的内容不得静默覆盖，使用 correction、withdrawal、redaction 或
  replacement 的明确能力。

所有业务修改提交后通过 invalidation + owner-reread 重新生成 board projection。
客户端 MAY 提供原地或 optimistic 反馈，但未提交 snapshot 不能成为其他查询、权限、
Receipt 或 ActionDelivery 的事实来源。

## D-02 — PublishProcess Purpose and Ownership Boundary

`PublishProcess` 是 caregiver-side 的内容发布领域过程，不是用户需要理解的功能名。
它解决“一条园所内部内容如何在明确归属、人工可控和重新授权后成为家庭可见事实”：

```text
internal capture
  -> selected as family-publication candidate
  -> suggestion / attribution / draft adjustment / review / release timing
  -> atomic Nurture publication + Receipt, or pre-publication cancellation
```

过程从内部采集被明确选为家庭发布候选时开始。拍照、录入或上传成功本身不会自动创建
家庭发布，也不会使内容对 Guardian 可见。过程在 Nurture 原子提交家庭可见发布事实与
Receipt，或在发布前取消时结束。发布后的 correction/replacement/redaction 通过明确的
后续事实和 capability 衔接，不原地改写既有发布。

`PublishProcess` 主要由 Caregiver teacher board 操作，并绑定当前精确 CareGroup、
child/target attribution、source provenance 与发布所需 authority。AI organizer 只能
产生 suggestion；Guardian 是发布结果的授权消费者；My-Chat scheduler/worker 只能执行
已经获得业务授权的技术调用，不能成为虚假的内容作者或业务审批人。精确的
`caregiver` / `lead_caregiver` review 权限与 institution policy 配置边界留给后续角色
决策冻结。

它明确不拥有：

- 相机、相册、语音转写、上传、缓存或设备权限；
- T-005 Message/CareItem/acknowledge/reply `CareInteraction`；
- My-Chat notification、Handoff、Outbox、deep link 或 device `ActionDelivery`；
- 园区管理 `InstitutionWorkflow` Run/Step；
- AI provider job 的技术执行状态。

终端产品只显示草稿、待确认、待发送、已发布、已取消等生活化状态，不展示
`PublishProcess` 术语。published 只表示 Nurture 发布事务已经提交，不表示通知或设备
投递完成。

## Logical Components

- Care fact repositories：focus、daily care、attention、media attribution、publication。
- Policy layer：actor + role + grant + child scope + fact visibility。
- Shared projection pipeline：角色安全的 fact selection、provenance、snapshot、
  semantic module composition 与 invalidation。
- `PublishProcess`：从 family-publication candidate 到原子 publish 或 pre-publish
  cancel 的照护内容领域过程；它不是采集 transport、CareInteraction、ActionDelivery
  或园区管理 Workflow。
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

共享 source revision 不要求两侧返回相同字段。它只证明两个角色化结果来自可解释的
canonical fact heads。任何微调完成后，旧 snapshot/cursor 必须失效或 rebase；不能
通过原地修改 derived response 假装 canonical commit 已完成。

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
