# Requirement — 六个核心 Surface 到双平台内测

## Objective

将 T-003 的六个核心 surface 从设计输入推进到一个可由 My-Chat 通过版本化接口精确集成、可在 iOS TestFlight Internal 与 Google Play Internal Testing 上进行多真机验证的 Nurture 服务候选版本。

本仓库的交付终点不是独立 App，也不是商店上架本身；终点是一个精确 pin、默认关闭、失败关闭、具备六 surface 黑盒验收证据的 Nurture 场景候选。My-Chat companion 任务负责宿主 UI、native/web shell、认证、EAS/签名、商店构建和真机分发。

## Product Terminology

- `InstitutionWorkflow`：当前仅限园区管理的持久化业务过程。
- `InstitutionWorkflowRun`：My-Workflow Runtime 的运行实例。
- `InstitutionWorkflowProjection`：供 mobile/Web/其他授权 surface 消费的角色安全读模型。
- `ActionExecution`：submit/acknowledge/reply 等原子领域动作。
- `ActionDelivery`：Handoff/Outbox/notification/retry/reconcile 等宿主技术投递。
- `CareInteraction`：家庭与照护者的 Message/CareItem/Event/Receipt 闭环。
- `PublishProcess`：caregiver two-stage publish 状态机。

当前只有园区管理属于产品 Workflow。异步、跨 owner、worker、Handoff、Outbox 或通知
不构成 Workflow 分类条件。Web workbench 是 Workflow 主要操作面；boards 可以消费
role-safe projection，但不拥有 Run/Step。

## Confirmed Product Scope

| Surface | Nurture product responsibility | My-Chat integration responsibility |
| --- | --- | --- |
| Guardian Nurture Chat | child-centered private synthesis、跨授权来源反馈、目标已绑定的动作卡 | native chat UI、navigation、notification |
| Guardian family board | family-owned care projection、按 Enrollment 选择目标、发布回读 | native board UI、device interaction |
| Caregiver Nurture Chat | authorized work/item projection、acknowledge/reply、receipt/correction | native chat UI、notification |
| Caregiver teacher board | work queue、capture、two-stage publish | native board、camera/media transport |
| Institution mobile board | read-only aggregate/support + `InstitutionWorkflowProjection` | native read-only surface |
| Institution Web workbench | roster/invite/confirmation、GrantRequest 与 `InstitutionWorkflow` | Web shell、auth、operational UI |

## Functional Requirements

- 六个 surface 共享稳定的 actor/role/workspace/visibility 和 presenter contract。
- Nurture queries / commands 按业务 capability 组织，六个 surface 只拥有 role-aware presenter/view-model，不复制业务事实和写入规则。
- T-004 发布 engine-ready 的 capability descriptors、typed schemas、eligibility policy references 与选择 fixtures；不以交付跨 Scenario 共享路由引擎为前置条件。
- 当前阶段按 The Nurture 产品节奏先验证 semantic UI contract；My-Chat 在后续 companion 中适配 native/web shell，不反向阻塞 Nurture 的领域与产品验证。
- surface 输出采用 atomic envelope，并按 Conversation timeline、Board semantic modules、Workbench Hub/List/Insight 三类内容模型组织；不下发任意 UI component tree。
- Nurture 规范展示内容、业务状态、语义顺序和 capability affordances；My-Chat 决定终端组件、响应式布局、动画、导航、缓存和设备交互。
- 验收采用 Golden Journey Portfolio，而不是单一主线：GJ-1 家庭关注流向照护者、GJ-2 照护日常流向家庭、GJ-3 多源事实沉淀为成长连续性、GJ-4 入托/家长确认/授权建立、GJ-5 机构理念流向日常支持，以及 RJ-1 撤权/纠正/恢复。
- 六条 Journey 共享一个版本化 synthetic world，但必须在独立、可重复的初始状态中运行；每条至少证明一个产品价值闭环及其最高风险拒绝路径。
- LLM 只能在确定性 policy 过滤后的候选 capability 中做意图选择或请求澄清，最终执行必须重新校验 authority、input、version、idempotency 和 confirmation。
- 家庭 AI 对话默认私密并以孩子为中心；Nurture 可以在 Guardian 当前可读范围内聚合家庭事实和多个 Institution Enrollment 的授权事实，LLM 只总结已过滤、带来源和时间的上下文，不选择机构 API。
- 开放式跨家庭—机构写操作默认进入家庭看板并绑定具体 Enrollment；Chat 只直接执行目标已经被服务端绑定的动作卡，或试点中唯一合法目标的确定性动作，不让 LLM 静默选择机构。
- Guardian Chat 与 Caregiver Chat 不构成跨角色共享聊天室或直接 DM；两侧只消费同一 Nurture-owned `CareInteraction` 的角色化投影。
- 跨边界闭环由 Message、CareItem、Event、Receipt 和追加式 correction/withdrawal/redaction 连接；My-Chat Chat transcript、room membership 和 host unread 均不是 Nurture canonical 事实或授权来源。
- 每个跨边界事实必须绑定精确 Institution Enrollment 与原始 Grant；多机构之间不得共享 room、transcript 或可推断其他 Enrollment 的导航信息。
- ordinary chat、Chat-assisted action 与 board-direct action 是三条不同交互路径：普通聊天默认无业务写入；需要事实时只消费安全 query；Chat 与看板动作共同调用同一 Nurture Capability Harness。
- Chat 可用 LLM 形成 capability/input 候选，看板可直接提供结构化输入；两者对同一 capability 必须共享 authority、confirmation、version、idempotency、execution、effect、receipt 和 error contract。
- CareItem 仅由对应的已确认跨边界 capability 创建；普通总结、动作建议或未确认 preview 不创建业务事项。
- Capability Harness 采用通用 envelope + capability-specific typed schemas，逻辑契约族分为无副作用的 `query/readResult` Query lane 和确定性的 `prepareAction/executeAction` Action lane。
- preview 是 prepare 输出，confirmation 是用户通过 My-Chat UI 提交给 execute 的显式证据；`surface_origin` 只影响 presenter/审计/观测，不影响 authority、effect 或 replay。
- family-care `ActionExecution` 复用 Nurture CommandExecution kernel；异步、跨 owner、
  Handoff/Outbox/notification 属于 My-Chat `ActionDelivery`，不创建产品 Workflow。
- `prepareAction` 不做 capability discovery；trusted context、typed user input 与 Nurture server-resolved authority/route facts 分层，Grant/role/policy/internal route 不接受客户端或 LLM 声明。
- prepare 只返回 `ready_to_confirm | needs_input | denied | unavailable`；ready 使用五分钟、opaque/body-free、不可延长/复活、对新 effect 单次消费且不跨 actor/account/device/surface 的 `confirmationRef`。
- 不持久化 prepared draft；execute 在同一 surface 重交 typed input 并校验 canonical hash。prepare/expire/reprepare 不产生 Message、CareItem、Receipt、CommandExecution 或正文副本，execute 响应丢失依赖 exact replay。
- My-Chat 拥有 per-call invocation identity；Nurture prepare 生成 stable business command identity。原子 execute 在同一事务完成 confirmation consumption、owner/authority/capability-specific concurrency reread、effect/receipt 与 CommandExecution。
- execute 结果分为 `committed | not_committed | outcome_unknown`；committed 分开表达 `executed | replayed` 和 `applied | already_satisfied`。outcome unknown 禁止替代 command，必须解析原 identity。
- T-005 Stage G2-A 交付 `submit → acknowledge → one or more replies` Core
  CareInteraction Loop；每个 ActionExecution 各自在一个 Nurture transaction
  内原子提交，但整个多人闭环不是一个跨步骤原子事务或产品 Workflow。
- G2-B 继续交付 correction/withdrawal/author-or-system redaction、delivery
  invalidation 与 Admin exact owner-read；Grant revoke 仍是独立授权动作。G2-A
  checkpoint 不得误写为 T-005 final completion，T-005 Exit 还要求 G2-C
  caregiver direct-interaction、legacy single-writer cutover 和 formal-ingress
  qualification。
- T-005 CareItem 由原始精确 CareGroup 共同承接；第一条 reply 将 response 置为
  responded 并解除待回复 Attention，但不关闭 Item。同班当前合格老师可通过不同
  command 追加多条回复；家长继续提问仍创建新的 Item。
- acknowledge 使用 exact-state concurrency；reply 使用 append-compatible
  lifecycle/authority precondition。另一条合法 reply 不构成 stale；同一 command
  retry 才 exact replay。
- 新 Item 可选使用 `contextContinuationOfItemRef` 表达同一 ChildCareProcess、同一 Enrollment 内的交流上下文；不使用同时暗示交流和工作流的通用 `followUpOf`。
- 上下文续接关系只用于当前授权下的展示与总结，不继承 Grant、authority、owner、SLA、状态、confirmation 或 command identity；新 Item 使用当前 Grant 和新的业务命令身份。
- 真正的事项 successor/dependency/trigger 后续以 `CareItemDependency` 独立表达，
  不进入 T-005 Increment 1，也不占用 Workflow 术语。
- T-005 `submit` v1 的逻辑 operation input 只包含规范化后 1–2000 字符受保护纯文本与可选上下文续接引用；多目标使用 owner-issued prepare target option，不接受 raw Enrollment/CareGroup ID。
- family-care data class、question category、today-attention urgency、family-to-org direction、ack/reply 要求、空附件、author、Grant、route、safe summary 与 command identity 均由 Nurture 推导，客户端/LLM 不得声明。
- 普通 Chat 只识别意图并打开空的 protected composer；不自动复制 Chat 正文，不把 protected body 交给 LLM，不在第一增量启用附件、富文本、批量或 AI protected draft。
- 医疗、用药和紧急事项在产生业务事实前安全失败；不得静默降级为普通 family-care question。
- confirmation UX 默认每个 business effect 只需要一次结构化、effect-labeled 用户手势；技术 prepare/execute 不映射为二次页面或通用确认弹窗。
- submit/reply 必须先让准确内容、目标和 effect 可见，再以一个 CTA commit；acknowledge 一次明确 gesture 即可。自然语言文本不能由 LLM 单独解释为 confirmation。
- 只有 target/input 歧义或 fresh prepare 发现可见语义漂移才增加用户步骤；token 过期但可见语义完全一致时可在同一手势内透明 reprepare。
- 所有事实访问同时满足 actor、role、grant、child scope 和 fact visibility。
- guardian/caregiver 看板使用同一事实来源和不同角色投影。
- T-006 Stage G3 由 G3-A shared boards、G3-B capture/draft、G3-C content/media
  safety、G3-D publish/release 和 G3-E integration qualification 组成；仅完成
  capture、draft 或安全阻塞不等于 T-006 Exit。
- deterministic teacher-text/transcript/template/photo-only assembly 与 manual
  attribution/exposure/needs-review 是 required main paths。显式 AI copy、
  `ClassScopedFaceMatch` 与 Workflow board module 只有在 beta profile 标为 required
  时才阻止 Exit；optional 时必须保持安全 absent/default-off 并保留完整 fallback。
- `direct_interaction_required` 必须在 G3-E 与 T-005 G2-C 完成真实联合资格验证；
  T-007 publication-policy exact subset 必须为 scheduled release 提供
  timezone/send/cutoff/trigger/policy-head owner evidence。两者都不能用占位代替。
- 看板可以展示当前 actor-safe 的 `InstitutionWorkflowProjection`；相同角色仍需通过
  Workspace、Institution、scope、assignment 和 visibility policy，且不得暴露 raw Run/Step。
- 照护内容采用两阶段发布并保留 provenance、authority 和 receipt。
- 两阶段发布称为 `PublishProcess`，不归类为 Workflow。
- 机构 aggregate 不读取家庭私密正文，不形成教师/儿童/家庭排名。
- AI 只提供可审阅的整理/建议，不做诊断、处方或紧急服务替代。
- Nurture public API、presenter 和 capability contract 可被 My-Chat 通过认证接口与精确 contract version/digest 消费；fixtures 和黑盒旅程用于共同 conformance，不作为运行时代码依赖。

## Identity, Enrollment and Grant Baseline

- 六个正式 surface 不把 product-visible provisional child 作为产品基线；当前开发使用版本化 synthetic bound fixtures，真实采用必须由家长授权建立 My-Chat Child/Family binding。Institution RosterEntry 只是机构本地 intake，不是 provisional child 或平台身份。
- 身份就绪度不压缩为单一 `provisional → bound → enrolled → granted` 枚举，而是分别计算 My-Chat identity binding、当前 Family/Guardian 关系、Institution Enrollment/CareGroup 关系，以及 `data class × direction` Grant。
- 同一个 ChildCareProcess 可以同时或先后存在多个彼此隔离的 Institution Enrollment；每个机构只能看到自己的 Enrollment 切片，不得获知其他机构的存在、数量、名称、状态或内容。
- Enrollment 建立机构照护关系但不产生跨边界数据权限；Grant 必须绑定具体 Enrollment 和目标 scope，并按 data class、direction 与 purpose 解锁 capability。
- 机构可针对自己的当前 Enrollment 发起 GrantRequest；申请本身不产生读取或写入权限。当前 Guardian 明确确认后才创建 Grant，拒绝、忽略、过期、撤回或 supersede 均不授权。
- 任一当前 Guardian 可以首次确认；首个成功确认者成为该 Grant 的 replace/revoke owner。其他当前 Guardian 可在现行政策下使用和查看，但不继承 Grant 所有权。机构管理员、Caregiver 和技术操作员不能代替 Guardian 建立、替换或撤销 Grant。
- 转机构、重新入托或进入新的 Enrollment 不继承旧 Grant；任何 revoke、expiry、replacement、role loss 或 owner-reread 失败都必须 fail closed，且不复活历史受保护内容。
- surface route 不等于能力可用。envelope 使用 `ready | limited | needs_setup | unavailable` 表达整体状态，具体 module/action 仍分别计算 eligibility。

## Dependency and Activation Strategy

- 采用 contract-first parallel development + activation fence。T-004 不等待 T-002 全部 runtime/qualification 完成即可开发和验证公共契约，但不得把 synthetic 证据描述为真实 owner path。
- Contract lane 可以并行交付 capability descriptors、typed schemas、policy/repository ports、surface presenters、synthetic owner fixtures、Journey 与 conformance tests。
- Owner-integration lane 必须等待 T-002 对应 identity binding、authenticated principal、Enrollment/Grant、owner-reread、receipt 与 persistence contract 的精确版本，然后才能接真实 adapter、migration 或 public authenticated path。
- Activation lane 必须等待所需 T-002 owner contracts 和 qualification pins 全部满足，才允许进入 T-008 immutable service candidate、My-Chat interface integration、TestFlight/Play 真机验证或任何流量 gate。
- synthetic owner fixtures 必须显式标识为测试来源，只能进入 fixture/reference/conformance 路径；不得成为 production fallback、默认 identity、临时 Grant 或真实数据迁移来源。
- 未解锁的 owner integration 保持 capability default-off，并以 `needs_setup`、`unavailable` 或明确 dependency NO-GO 表达；不得复制 My-Chat/T-002 实现来绕过 gate。

## Service Candidate and Interface Integration Strategy

- Nurture 独立冻结、部署和回滚不可变 Service Candidate；Candidate bundle 是 Nurture 的发布与资格化单元，不是 My-Chat 的代码采用或运行时依赖。
- My-Chat 不导入 Nurture source/package/ORM，也不下载 Candidate bundle；My-Chat 通过认证的私有 API 消费 versioned interface contract，并声明支持的 contract version/digest。
- Nurture Service Candidate 精确绑定 source revision、manifest、API/capability/presenter contracts、schema/migration、fixtures/evidence profile 与 dependency pins；任一受 pin 内容变化都产生新的 Candidate identity，不得原地覆盖。
- 禁止浮动 interface version、`latest`、未固定依赖或 consumer 自行拼装未经共同 conformance 的 contract 组合。
- 真机资格证据必须通过独立 composite validation binding 同时引用 My-Chat app/backend build identity、Nurture Service Candidate identity、interface contract digest 和 test environment binding；任一项漂移都使原证据失效。
- Service Candidate identity、interface contract compatibility、qualification、deployment、capability activation 和 traffic authorization 是不同事实，不能互相替代。
- T-004 只定义 interface contract identity、version/digest 语义与兼容规则；它不设计或生成具体 Service Candidate identifier。
- T-008 定义并冻结 Service Candidate identity/digest、bundle contents、qualification 和 rollback 证据。
- My-Chat companion 与 T-008 联合生成 composite validation binding；该记录不进入普通业务请求，也不成为 Nurture authorization input。
- Service Candidate identifier 的具体格式与发布工具选择不阻塞 T-004～T-007 的 surface/capability 开发。

## Release and Device Validation Requirements

- 本阶段渠道：TestFlight Internal Testing 与 Google Play Internal Testing。
- 测试对象：内部测试成员；使用合成数据或明确授权的测试数据。
- Nurture 候选必须声明 source revision、依赖 revision/hash、manifest/API/presenter contract 版本、DB/migration 状态和 fixture 版本。
- 候选默认关闭；服务部署缺少精确环境绑定、授权或兼容 contract version 时 fail closed。
- My-Chat companion 必须在真实 iOS/Android 设备上完成六 surface 主旅程、权限负例、恢复/重试和基础性能观察。
- TestFlight External、Google Play Closed/Open/Production 不属于本轮完成标准，必须另过隐私、运营和 Pilot traffic gate。

## Constraints

- The Nurture 不是独立产品壳；不得复制或 fork My-Chat host runtime。
- My-Chat 拥有 canonical `child_id` / `family_id`、auth、shell、runtime、routes、workers 和 store distribution。
- 本地 `NurtureChild.id` 不是平台 `child_id`。
- T-002 未完成的 identity、authority、receipt、qualification 和 external-traffic NO-GO 继续有效。
- LLM provider 调用和跨 Scenario capability 路由属于 My-Chat 共享 LLM/capability
  runtime；Nurture 不直接引入 provider SDK，也不以 My-Workflow-Base 包名扩大产品 Workflow 范围。
- 不在当前任务包中存储商店凭证、签名材料或真实儿童 PII。

## Acceptance Criteria

- [ ] T-004 至 T-007 的任务级验收全部完成。
- [ ] 精确 Nurture Service Candidate identity、interface contract digest 和依赖 pin 已冻结且可重复验证。
- [ ] 六 surface 合成数据黑盒旅程在公共契约上通过。
- [ ] 默认关闭、失败关闭、回滚和兼容性矩阵有可审核证据。
- [ ] My-Chat companion integration checklist 完整，且不要求导入 Nurture 代码、直连 Nurture 数据库或复制任一侧 runtime。
- [ ] My-Chat 在 TestFlight Internal 与 Google Play Internal Testing 的真实设备验证均通过，或明确记录为外部未完成依赖。
- [ ] 未将内部测试结果误写为外部流量、正式上架或 Pilot authorization。

## Out of Scope

- 独立 Nurture App 或第二套产品 shell。
- 跨 Scenario 语义检索、全局 capability router 或完整共享 LLM tool-execution engine。
- 通用 server-driven UI、像素级布局协议或由 LLM 生成任意组件树。
- TestFlight External、Play Closed/Open、生产发布或公开获客。
- 真实生产流量激活、数据迁移或非空 capability rollout。
- 商店账号、合同、税务、营销素材和正式审核提交。

## External Companion Task

建议在 My-Chat 仓库建立单一任务：`my-chat-nurture-store-beta-validation`。

它应通过版本化认证接口连接测试环境中部署的精确 Nurture Service Candidate，负责：

- 六个 surface 的 React Native / Web consumer。
- auth、navigation、shell、notification 和设备能力。
- EAS/native build、signing、TestFlight Internal 与 Google Play Internal 分发。
- iOS/Android 多真机矩阵、缺陷证据和 composite validation binding。

当前仓库只定义交接标准，不替 My-Chat 创建或维护该任务包。

## Open Questions

- My-Chat 现有构建链采用 EAS managed、prebuild 还是原生工程；由 companion discovery 决定。
- 首批设备/OS 矩阵和内部测试成员名单；不阻塞 Nurture 本地规划。
- TestFlight External / Play Closed 的下一阶段隐私、运营与 Pilot gate；本轮不推定通过。
