# Pitfalls — 六个核心 Surface 的产品契约基座

## Known Guardrails

- 不要把 T-003 的可点击 demo 当成已实现产品能力。
- 不要为方便 UI 联调复制 My-Chat identity、auth、route 或 runtime。
- 不要把 opaque `child_id`、family binding 或 scenario binding 当作授权。
- 不要把 authenticated principal、platform binding、typed anchor 或 local association
  中任一层当作 Nurture current business authority。
- 不要让 Institution Admin、Caregiver 或 Nurture 创建、推断、PII 匹配或自动合并/
  rebind My-Chat canonical Child/Family。
- 不要让 service token 同时代表 workload 和成人身份；二者必须独立验证。
- 不要用 transaction 外 pre-read authority 签发 Receipt，也不要在 Nurture
  transaction 内调用远端 My-Chat。
- 不要把短生命周期 binding-owner Receipt 与 business
  `CommandExecution`/`Receipt` 合成一种 replay 或 persistence 语义。
- 不要让 client/LLM 提交 raw Enrollment、Grant、RoleAssignment、anchor、
  authority outcome、current permission 或 owner evidence。
- 不要把 Fastify dev-host-only evidence 当作 G1 Joint Conformance；最终 G1 必须经
  formal NestJS scenario-service ingress。
- 不要因为 task 状态、CI 链接或说明文档存在就认为 G1 已完成；必须精确关联
  Surface Contract Artifact Set、Owner Integration Handoff 和 Joint Conformance
  Record。
- 不要用真实儿童或家庭数据构造 fixture。
- 不要因为调用成功就跳过 authority reread、receipt 或 owner-reread 验证。
- 不要把 capability descriptor、supported role 或 LLM 选择结果当作 authorization grant。
- 不要在 T-004 内建设跨 Scenario 共享 LLM 路由引擎或直接调用 provider SDK。
- 不要把 semantic module 退化为通用 `type + props` component tree 或像素级布局协议。
- 不要让当前参考呈现演化成独立 Nurture shell；My-Chat 仍拥有最终 native/web rendering。
- 不要用一条故事主线替代六个 surface 的代表性产品闭环和反向数据流。
- 不要让多条 Journey 共享一个按顺序变异的数据库状态；必须可独立、确定性重跑。
- 不要把单机构试点固化为“一名孩子只能有一个 Institution Enrollment”；多机构数据必须按 Enrollment 隔离。
- 不要把 Institution 发出的 GrantRequest 当成 Grant，或让机构角色代替当前 Guardian 建立、替换、撤销授权。
- 不要让 LLM 为开放式写操作静默选择 Institution；多目标写入应在 family board 绑定具体 Enrollment。
- 不要把 Guardian 可读的跨机构 child-context summary 暴露给任一 Institution，或在聚合时丢失 provenance 和原始 Grant fence。
- 不要把 T-007 的园区业务沟通只读投影实现成 Institution membership 的 ambient body
  access；必须逐请求校验 disclosure、exact original Grant/data class/purpose 和
  source lifecycle。
- 不要因 Admin 可读园区业务沟通就把 Admin 加入 CareGroup、共享 transcript，或授予
  acknowledge/reply/correction/redaction。
- 不要把 family-private AI、草稿、My-Chat 私人聊天或其他 Institution 内容混入
  `InstitutionBusinessCommunicationProjectionV1`。
- 不要把 synthetic owner fixture 接入真实 runtime、fallback 或 migration，也不要用它替代 T-002 owner-path qualification。
- 不要因为 T-004 contract tests 通过就宣称真实 identity、Enrollment/Grant、authenticated path、notification 或 traffic 已通过。
- 不要为绕过 T-002 gate 复制 My-Chat/T-002 的 identity、auth、owner-reread、receipt 或 persistence 代码。
- 不要把 My-Chat/Nurture 的认证接口调用关系写成 My-Chat 采用 Nurture 代码、package 或 Candidate bundle。
- 不要让 My-Chat 浮动组合 API/capability/presenter contract，也不要把 fixture、migration 或 source bundle 变成运行时 consumer dependency。
- 不要原地修改已经分配 identity 的 Service Candidate，也不要把 Service Candidate/contract pin 当作 qualification、activation 或 traffic authorization。
- 不要让 T-004 设计 T-008 的 Service Candidate identifier、发布工具或 composite device-evidence schema；T-004 只负责 interface contract identity/compatibility。
- 不要把异步、跨 owner、worker、Handoff 或通知当作 Workflow 分类条件。
- 不要把 board 能展示 Workflow 进度误写成 board 拥有 Run/Step 或可绕过 authority。
- 不要用未限定的 `workflow` 指代 CareInteraction、ActionDelivery 或 PublishProcess。
- 不要把 domain、execution、delivery 和持久化 process 压成一个 `operationClass`；
  `CareInteraction`、`ActionExecution` 与 `ActionDelivery` 是不同轴。
- 不要把 concurrency heads 塞进 capability-specific business input，或允许客户端/LLM
  自报；它属于 prepare-time precondition。
- 不要让 exact-state action 在 execute 时“重新获取最新版本后继续”，这会把 stale
  user intent 伪装成有效确认。
- 不要把 strict whole-aggregate CAS 套在 append-compatible action 上；兼容的新
  append 不是冲突。
- 不要用 idempotency key 替代 concurrency precondition；重复请求与状态/authority
  安全是两个问题。
- 不要只声明一个 concurrency enum 而省略 exact head bindings 和 declared
  convergence；否则 acknowledge 的合法收敛会与任意 stale version 混淆。
- 不要对受保护正文保存 bare canonical hash；低熵内容完整性必须使用 secret-keyed
  tag，且正文不得进入 confirmation、日志或 telemetry。
- 不要让 surface cursor 跨 contract digest、actor、scope、query、sort 或 snapshot
  复用，也不要静默把两个 snapshot 拼成一个列表。
- 不要把 source revision、build time 或生成环境混进 semantic interface digest；
  它们是 provenance。contract 内容不变时 identity 应可重建，内容变化时才产生新
  version/digest。
- 不要把未确认 `prepareAction` 或技术调用进行中状态自动投影为 canonical
  `pending-send`；只有对应 capability 确有业务/投递状态时才能展示。

## Resolved Pitfalls

当前尚未进入实现阶段。发生并解决实际问题后，按 symptom、root cause、attempts、fix、prevention 的结构补充。
