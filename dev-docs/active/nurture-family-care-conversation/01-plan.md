# Plan — 家庭与照护者对话能力

## G1 Progressive Entry Boundary

- At G1 start, T-005 MAY design `CareInteraction`/CareItem state, pure
  acknowledge/reply/correction/redaction policies, role-safe presenters and isolated
  synthetic fixtures. This work MUST NOT freeze a private owner shape or claim a real
  protected journey.
- Contract Boundary PASS opens capability-specific schemas, handlers, presenters and
  contract tests against the exact T-004 interface ref.
- Owner Integration Readiness PASS opens isolated integration with the real trusted
  caller, binding/association, current-authority reread and Receipt adapter.
- Joint Conformance PASS is required before T-005 may qualify a real
  submit/acknowledge/reply path or issue a Beta Profile Handoff. The PASS must cite
  the exact T-004 Surface Contract Artifact Set and T-002 Owner Integration Handoff
  and execute through the formal NestJS Nurture ingress; Fastify-only evidence is
  provisional.
- No G1 state authorizes capability activation, persistent database apply or traffic.

## Stage G2 Decision Register — Accepted

Stage G2 复用 T-005，不创建新任务。它交付 Nurture 侧第一个真实
family-to-CareGroup `CareInteraction` 闭环，而不是两个聊天页面或共享聊天室。
为避免与 T-002 测试 fixture 中的 Guardian `G1/G2` 标签混淆，任务文档在测试身份
语境之外统一使用 `Stage G2` 或 `G2-*`。

### G2-01 — Stage structure and task Exit

- `G2-A Core CareInteraction Loop`：完成
  `submit → acknowledge → one-or-more reply`、Guardian/Caregiver role-safe
  projections，以及 Chat/Board 同 capability 等价。这里每个 ActionExecution 独立
  transaction-atomic；整个闭环不是跨步骤长事务。
- `G2-B Lifecycle and Owner-read Completion`：完成 correction、family request
  withdrawal、author/system redaction、delivery invalidation 和
  `InstitutionBusinessCommunicationProjectionV1` source-side owner-read。
- `G2-C Caregiver Direct Interaction Bridge`：完成 T-006
  `direct_interaction_required` 所需的专用 caregiver-initiated、exact-target、
  protected capability；不得复用会拒绝该类内容的普通 family-question action。
- G2-A 是可演示、可资格化的中间 checkpoint，不是 T-005 final Exit。只有
  G2-A/B/C 全部完成并通过 G2 Exit Qualification，T-005 才可转为 done 并产生
  Beta Profile Handoff。

### G2-02 — Product space and AI boundary

- Guardian Chat 保持 family-private AI/feedback surface；Caregiver Chat 只呈现
  current authorized work/item projection。两侧不进入共享 room、直接 DM 或共同
  transcript。
- ordinary Chat 默认无业务副作用；LLM 只能在 deterministic eligibility 后帮助选择
  capability/input candidate，不能产生 authority 或 confirmation。
- 跨边界正文必须进入受保护 composer，由用户看到 exact normalized content、target
  与 effect 后明确提交。普通 Chat 不自动复制正文，My-Chat LLM 不改写 protected
  body。
- My-Chat 拥有 LLM gateway、shell 和 rendering；Nurture 只发布当前授权 query
  context、deterministic capability 和 role-safe presenter。

### G2-03 — One Capability Harness

- ordinary Chat、Chat-assisted action 与 board-direct action 的业务 effect 必须收敛
  到 T-004 exact contract 下的 `query | prepareAction | executeAction | readResult`。
- Query lane 不写业务事实。prepare 不创建 Message/CareItem/Receipt/Execution；
  只允许五分钟、body-free、不可跨 actor/account/device/surface 的
  `InteractionContext`。
- Nurture 在 prepare 绑定 stable business command identity、exact target、actor/
  scope、keyed input integrity、expiry 和 capability-specific heads。
- execute 在一个 Nurture transaction 内完成 confirmation consumption、current
  owner reread、effect、Receipt 和 `CommandExecution`。
- 结果正交表达 `committed | not_committed | outcome_unknown`、
  `executed | replayed` 和 `applied | already_satisfied`。未解析
  `outcome_unknown` 禁止替代 command。
- family-care action 是 `ActionExecution`；Handoff/notification/retry 是
  `ActionDelivery`。两者都不是 `InstitutionWorkflow`，不得创建新 Workflow Run/Step。

### G2-04 — Canonical facts, migration and single-writer cutover

- 增量复用 Enrollment、CareGroup、Grant、Message、ItemEvent、Receipt、Attention、
  InteractionContext 和 CommandExecution，不 fork 第二套聊天/runtime。
- CareItem 新路径只认 acknowledgement、response、lifecycle 三轴及独立 heads。
  reply canonical fact 是 Message + ItemEvent + Receipt；`CareReplyV1` 只是
  projection，不新增第二个 canonical reply store。
- legacy `status`、`assignedToRoleAssignmentId`、`linkedReplyMessageId`、
  ThreadParticipant authority、whole-Item reply CAS、raw command DTO 和 claimed-Step
  path 只作为 migration/read compatibility input，不能成为第二个写入面。
- 新 T-005 rows 只由三轴 Harness path 写入；legacy handler 对这些 rows
  default-off。若旧 consumer 必须显示，只允许从新 canonical state 单向派生
  read-only compatibility projection，禁止双向 dual-write。
- 旧行只迁移可机械证明的状态。claimant、reply owner、Grant 或 lifecycle 有歧义时
  inventory/quarantine，不猜测、不自动 merge。
- migration 可以 author/replay 于 disposable PostgreSQL；Stage G2 不授权 persistent
  environment apply。

### G2-05 — Exact responsibility, authority and concurrency

- submit 固定 exact Enrollment + CareGroup + original bidirectional Grant。后续 action
  重读同一 original Grant；replacement Grant 不接管旧 Item。
- 多个 eligible Enrollment 必须由 Guardian 选择 owner-issued `targetOptionRef`；
  只有唯一合法目标且 capability policy 允许时才可确定性绑定。
- acknowledge 表示 CareGroup 已收到，不创建个人 claim/assignment。并发第二条
  acknowledge 仅在相同 postcondition 已达成且其他 fence 仍有效时返回
  `already_satisfied`，不伪造实际确认者。
- reply 是 append-compatible。同一 exact CareGroup 内任一 current
  `caregiver | lead_caregiver` 可追加独立 reply；第一条只解除 waiting Attention，
  后续 reply 不重复处理 Attention，Item 保持 active/appendable。
- Institution Admin、ThreadParticipant 或同园区关系本身不授权 reply。多角色 Admin
  必须显式切换并通过原 action 的 current caregiver policy。

### G2-06 — Protected content, confirmation and safety

- G2-A 普通 family question/reply 只接受 1–2000 字符 protected plain text；
  acknowledge input 为空。首版不支持附件、富文本、批量、AI protected draft 或用户
  自选 category/urgency。
- public body 与 internal protected-content ref 分层。execute 经 no-store ingress
  原子加密并绑定 content；InteractionContext 只保存 secret-keyed integrity tag，
  不保存正文或 bare body hash。
- submit/reply 使用一个展示准确 content/target/effect 的 CTA；acknowledge 使用一次
  effect-labeled direct gesture。技术 prepare/execute 不增加通用二次弹窗。
- success、already-satisfied、replay 和语义未变的 transparent reprepare 原位收敛；
  content、target、effect 或安全后果变化必须重新展示并取得新 gesture。
- ordinary family-question capability 在业务写入前拒绝医疗、用药和紧急输入，并返回
  machine-readable alternate process；不得静默降级、改写或自动转到 G2-C。

### G2-07 — Correction, withdrawal and redaction

- correction 由 exact Message author 追加版本，不覆盖历史；family source 已
  responded 后必须创建新 Item/context continuation。
- withdrawal 只由 exact family source author 关闭 CareItem work 为
  `closed(family_withdrawn)`，保留 Message/replies/Receipts/history，并阻止未来
  acknowledge/reply。它不是 Grant revoke 或 message deletion。
- author redaction 不可逆清除该 Message body/attachments/corrections，保留 tombstone、
  audit、Receipt 和 Execution。source cascade 抑制依赖 Item/Attention；reply
  redaction 只影响该 reply，不重开 Attention，也不删除其他作者事实。
- policy/safety/admin redaction 使用独立 system capability 和 server-owned reason，
  不能伪装作者。cascade 必须 loop-to-closure 或整笔失败。

### G2-08 — Projection and ActionDelivery boundary

- Guardian/Caregiver 从同一 canonical CareInteraction 生成不同 role-safe projection，
  不产生共享 super DTO 或 transcript。
- G2-B 交付 `InstitutionBusinessCommunicationProjectionV1` 的 Nurture owner-read
  source/query/presenter；T-007 拥有 Admin surface composition。Admin read 只覆盖
  已披露监督的 exact Institution/Enrollment/CareGroup/original Grant/purpose/current
  lifecycle，且不产生 caregiver/author action authority。
- Nurture `committed` 只证明业务 transaction。G2 输出 stable refs、logical Receipts
  和 invalidation scopes；My-Chat 拥有 Handoff、notification、provider send/open、
  deep link 和 device state。
- T-005 Nurture-side Exit 不等待 TestFlight/Play/native push；真实 consumer/device
  闭环由 T-008 + My-Chat companion 验证，不能被 G2 PASS 冒充。

### G2-09 — Caregiver Direct Interaction Bridge

- G2-C 是独立、versioned、caregiver-initiated capability，不是
  `submit_family_care_question` 的反向复用。
- 只有 exact CareGroup 的 current operational caregiver 可发起；必须显式选择
  owner-issued exact child/family target，并重读 org-to-family Grant/data class/
  purpose/current safety policy。
- T-006 只可展示 owner-issued navigation/action。它不自动创建 CareInteraction，
  不复制内部 sensitive body，不把 direct-interaction 内容降级为 ordinary
  `PublishProcess`。
- 首版打开空的 protected composer，由 caregiver 人工填写受保护纯文本；不自动搬运
  T-006 source、AI 文案或附件。健康/事件信息只允许事实沟通，不生成诊断、处方或
  处置建议；紧急情况必须使用线下紧急流程，Nurture 消息不是替代。
- G2-C exact canonical effect、typed input/result、original-scope relation、
  family-side projection/response expectation 和 Receipt 语义必须在 implementation
  前冻结进 T-004 interface digest。未冻结或未资格化时 T-006 只显示安全阻塞。

### G2-10 — Sequencing, qualification and handoff

1. 采用 T-004 exact contract pin。
2. 冻结三轴 schema、legacy cutover 和 G2-C exact capability contract；完成旧行
   ambiguity inventory。
3. 经 formal NestJS ingress 实现 Harness 与 protected-content boundary。
4. 实现并资格化 G2-A。
5. 实现并资格化 G2-B。
6. 实现并资格化 G2-C。
7. 形成 G2 Exit Qualification 与 T-005 Beta Profile Handoff。

G2 protected qualification 必须引用 G1 Surface Contract Artifact Set、Owner
Integration Handoff 和 Joint Conformance Record。它在 formal NestJS ingress +
real pinned owner path 上运行 disposable PostgreSQL transaction/concurrency/replay/
cascade、Chat/Board equivalence、cross-family/CareGroup/Institution、Admin-only、
stale owner/Grant、privacy/leakage 和 default-off/final-empty tests。G2 PASS 不授权
Candidate、persistent DB apply、native/internal-store testing、activation 或 traffic。

## Acceptance-to-Check Mapping — Accepted (2026-07-31)

- 本任务验收条目在 G2 contract/schema freeze 及各 checkpoint（G2-A/B/C、Phase 4、
  Exit Gate）冻结时获得稳定 ID（`T005-AC-###`），并逐条映射到恰好一类机械检查：
  conformance fixture、negative case、unit/integration test、lint/静态检查或
  evidence census 字段。
- 无法机械验证的条目显式重分类为 `design_note`：仍是设计约束，但退出资格化门禁。
- 未映射的验收条目不得勾选；checkpoint/Exit 资格化 PASS 的依据是映射检查全部
  通过，而不是对散文条目的自评。
- 映射按 stage 摊销，不做一次性回溯；映射表随该 stage 的 freeze 记录一起交付，
  fixture/case 侧使用 T-004 conformance manifest 的 AC 引用字段回链。

## Phase 0 — Conversation Contract Discovery

- 已完成 T-002 landed family-care fact/schema/source 盘点，详见
  `06-t002-fact-schema-gap.md`；后续实现以 Prisma/source 为事实，不把 T-002
  implementation-open 设计当成现状。
- 将 T-003 的 guardian/caregiver chat 交互映射为领域状态与命令。
- 将 ordinary chat、Chat-assisted action 与 board-direct action 映射为不同 contract path。
- 对齐 T-004 通用 capability contract，确定 T-005 只扩展哪些 family-care query/action 语义。
- 盘点现有 `NurtureFamilyCareThread` 的必要职责，移除任何共享房间、成员关系或权限语义。
- 标记需要上游 contract pin 或 gate 解锁的部分。
- 采用 T-004 exact `InterfaceContractRefV1`、`CapabilityDescriptorV1`、
  `SurfaceEnvelopeV1` 和 generic invocation/result/error schemas；T-005 只定义
  family-care capability-specific extensions。
- 冻结 G2-C dedicated caregiver-initiated capability 的 exact canonical effect、
  typed schemas、source/target relation、family-side response expectation 和 Receipt；
  在此之前 T-006 direct-interaction action 保持不可用。
- 输出 legacy single-status/assignment/single-reply/claimed-Step 到三轴新路径的
  migration/cutover matrix，明确 single writer、read-only compatibility 与 ambiguous
  row quarantine。

## Phase 1 — Entry Paths and Unified Harness

- 定义 family-private AI room 与草稿所有权。
- 定义 ordinary chat 的无副作用边界，以及需要 Nurture facts 时的安全 query path。
- 让 Chat-assisted action 与 board-direct action 收敛到同一 capability/input/confirmation/execution contract。
- 定义通用 envelope + 强类型 capability 的 Harness contract family：`query`、`prepareAction`、`executeAction`、`readResult`。
- 冻结 T-005 V1 capability registry：stable capability key 与独立 SemVer，query、
  Increment 1、Increment 2 author action、internal system action 分组；key 不携带版本
  后缀。
- 将 preview 定义为 `prepareAction` 输出，将 confirmation 定义为 `executeAction` 输入证据；两者共同构成一次 `ActionExecution`，不是临时 Workflow。
- `prepareAction` 分离 My-Chat authenticated trusted context、capability-specific user input 与 Nurture server-resolved authority/route facts。
- prepare 返回 `ready_to_confirm | needs_input | denied | unavailable`；ready 生成语义 preview 与五分钟 opaque `confirmationRef`。
- 不持久化 prepared business draft、正文或 Message；允许一个非业务事实、body-free
  `InteractionContext` 保存 token hash、target/heads、keyed input integrity、expiry
  和 stable command identity。execute 重交 typed input，ref 不包含 raw body/PII。
- capability-specific typed input 只包含业务字段：acknowledge input 为空对象，
  reply input 只含受保护正文；CareItem target 和 expected version 不进入业务 schema。
- prepare 将精确 target、capability-specific concurrency precondition、actor/scope、
  canonical input integrity 与 expiry 绑定进 `confirmationRef`。
- acknowledge 使用精确 acknowledgement head + declared acknowledged convergence；
  reply 使用 replyable lifecycle/authority heads + compatible append，新增合法回复
  不构成 stale。precondition 与 stable command identity 仍分别负责状态安全和
  transport retry/exact replay。
- ref 不延长、不复活、不跨 actor/surface/device/account；对新 effect 单次消费，过期或任何绑定漂移必须重新 prepare。
- My-Chat 生成 per-call invocation identity；Nurture 在 prepare context 中生成并绑定 stable business command identity。
- 对原子 action，在同一 Nurture transaction 内完成 confirmation consumption、current owner/authority reread、effect、receipt 与 CommandExecution。
- `executeAction` 结果使用 `committed | not_committed | outcome_unknown`；success 内继续区分 disposition `executed | replayed` 与 business outcome `applied | already_satisfied`。
- 将 `executionDisposition` 放在调用外壳，将 business outcome、capability-specific
  body-free output、receipt refs 与 invalidation scopes 放在不可变
  `committedResult`；`commandExecutionRef` 是该结果的持久化 authority，不新增平行
  result row/ref。replay 不重新计算历史业务结果。
- acknowledge 输出稳定 CareItem/acknowledgement-event/Receipt refs 与 acknowledged
  状态；班级已确认且其他 fence 仍有效时收敛为 `already_satisfied`，不重复记确认事实。
- reply 输出稳定 reply Message/Event/Receipt refs、`replyOrderKey`、
  `first_response | additional_response` 与 Attention `resolved | unchanged`；
  `CareReplyV1` 是 typed projection，不是第二个 canonical reply table。
- not-committed 结果携带明确 `recovery=none|refresh|reprepare|retry_same_command`；
  current-state hint 只在 current actor 仍有读取权限时返回最小 role-safe 三轴状态。
- confirmation UX 只要求一次结构化、effect-labeled 用户手势；技术 prepare/execute 不等于两个可见步骤。
- submit/reply 在 Chat action card 或 board form 中先显示准确内容、目标和效果，再通过一个 CTA commit；不追加通用确认弹窗。
- acknowledge 使用一次“确认收到” direct gesture；自然语言文本不构成 confirmation。
- 低打扰作为跨 surface 交互原则：成功、already-satisfied、replay 和语义未变的
  transparent reprepare 原位反馈；不显示 Harness/CommandExecution 技术状态，不用
  toast/modal 打断已收敛结果。只有可见语义或安全后果实质变化才强制 rereview。
- 原子写入委托现有 CommandExecution kernel；My-Chat 的 Handoff/Outbox/notification/retry 归入 `ActionDelivery`，不得改变动作分类。
- 第一增量实现 `submit → acknowledge → reply` 三个 `ActionExecution`；不创建 Workflow Run/Step 或通用 Workflow dispatcher。
- CareItem 拆分 acknowledgement、response 与 lifecycle 三轴；第一条 reply 将
  response 置为 responded 并解除待回复 Attention，但不关闭 Item。
- CareItem 由提交时绑定的精确 `Enrollment + CareGroup` 共同承接；`acknowledge`
  记录班级已收到和实际操作者审计，不创建个人 claim/assignment。
- reply 不要求由 acknowledge actor 完成；任一当前属于同一精确 CareGroup 的
  `caregiver | lead_caregiver` 且通过原始 Grant/Enrollment/policy reread 后都可以
  追加一条或多条回复。`institution_admin`、ThreadParticipant 或同园区关系本身不授权。
- 不同 command 的并发 reply 均可成功；每条回复拥有独立 Message/Event/Receipt/
  CommandExecution 与真实操作者审计，班级是家庭侧主要业务发送主体。
- 继续交流必须通过新的 `submit` 创建新 CareItem；可选 `contextContinuationOfItemRef` 仅表达交流上下文，不使用通用 `followUpOf`。
- 将 `submit_family_care_question` 的逻辑 operation input 固定为规范化后的 1–2000 字符受保护纯文本正文与可选 `contextContinuationOfItemRef`。
- 将 owner-issued `targetOptionRef` 保持在 prepare target context；它不是 raw Enrollment ID，也不是 operation input。唯一合法目标可按 policy 确定性绑定。
- 由 Nurture 固定推导 family-care data class、question category、today-attention
  urgency、family-to-org direction、ack/reply 要求、空附件、author、original
  bidirectional Grant、route、safe summary 与 command identity。
- 普通 Chat 只形成意图并打开空的受保护 composer；不自动搬运 Chat 正文，不把 protected body 交给 LLM，不启用 AI protected draft。
- public operation input 中的 `body` 与内部 protected-content write ref 分层：
  client/LLM 不提交 `protected_content_ref`；execute 通过 no-store protected ingress
  在业务 transaction 内加密、持久化并绑定 Message。
- 在写入前拒绝附件、富文本、批量输入、用户自选 category/urgency，以及医疗、用药或紧急事项；不静默改写或改路由。
- 为每次发送固定 Institution Enrollment、原始 Grant、authority source、target scope、idempotency key 和 receipt。

验收：

- 普通聊天、总结和未确认建议不创建 Message、CareItem 或 Receipt。
- Chat 与看板对同一 capability 的 canonical effect 与拒绝结果一致。
- generic envelope 不弱化 capability-specific typed schema、policy、version 和 handler/command binding。
- acknowledge typed input 必须为空，reply typed input 只允许 protected body；
  raw CareItem id/version、Grant、CareGroup 或 actor 字段均被拒绝。
- 两个 reply prepare 面向同一 replyable Item 时可分别提交；另一条兼容回复不使
  confirmation stale。只有 lifecycle/authority/target 等可执行条件变化才拒绝。
- `surface_origin` 不参与 authority 或业务幂等身份。
- Grant、role、policy、data class/direction/purpose、内部 target/route fields 不接受客户端或 LLM 填写。
- 多 Enrollment 返回 safe `needs_input` choices；只有一个当前 eligible target 时才允许 capability policy 定义的确定性默认。
- prepare 结果和 token 均不是 canonical business fact，不支持跨设备/跨 surface 恢复。
- body-free InteractionContext 是 confirmation protocol state，不是 prepared business
  draft；它不得被 timeline/presenter 当成待发送 Message。
- same command identity + same canonical payload 必须 exact replay；payload drift 必须 idempotency conflict。
- deterministic invalid/denied/stale/conflict 不提交；明确 no-commit 的技术失败可在 TTL 内以原 identity 重试；outcome unknown 禁止替代命令。
- committed 只代表 Nurture 业务事务，不代表 Host/provider delivery、device read 或 Nurture acknowledge。
- 仅目标不唯一或可见内容/目标/effect 漂移时增加用户步骤；token 单纯过期且可见语义完全不变时允许在同一提交手势内透明 reprepare。
- 若 transparent reprepare 发现任何可见变化，必须中止 execute、重新展示并等待新的结构化手势。
- 未确认、过期授权和 target 改变均不发送。
- 多 Enrollment 时不得由 LLM 静默选择目标，也不得向其他机构生成投影。
- 重试不产生重复消息或重复事项。
- 上下文续接只允许引用同一 ChildCareProcess、同一 Enrollment、当前可读且
  response 已 `responded` 的源 Item；关系不继承 Grant、authority、owner、SLA、
  状态或幂等身份。
- 新续接 Item 从 current eligibility 选择 Grant，并将其固化为自己的 original
  Grant，同时使用新的 business command identity；源 Item 后续不可读时隐藏关系，
  但不改变新 Item 的可用性。
- operation input 不接受 raw Participant/Child/Enrollment/CareGroup/Grant refs、safe summary、分类、route、receipt 或 command identity。
- 正文规范化只允许 trim 与换行等机械规范化；用户确认前展示的 exact normalized text 必须与 protected content effect 一致，不做 LLM 语义改写。
- 目标 option ref 只能来自当前 prepare 的 actor-safe choices，且必须在 execute 时重新解析并验证 current authority。
- 非支持内容在 prepare 阶段返回明确的 unavailable/alternate-process 结果，且医疗表达保持非诊断、非处方、非紧急替代。

## Phase 2 — Canonical Facts and Role Projections

- 定义 capability execution 产生的 canonical message、structured care item、event、receipt 与媒体引用；不是所有 Chat turn 都产生这些事实。
- 迁移 CareItem 到 acknowledgement/response/lifecycle 三轴和独立 heads；旧
  `status`、`assignedToRoleAssignmentId`、`linkedReplyMessageId` 仅作 legacy row
  迁移，不参与新 action authority。
- caregiver reply 继续使用 canonical Message + ItemEvent + Receipt；不创建重复
  `CareReply` table。增加可稳定重建的 `replyOrderKey` 和 typed author/role audit。
- 增加 typed original Enrollment/CareGroup/Grant complete-graph constraint、
  context-continuation relation、InteractionContext dependencies、immutable
  committed-result payload 和 cascade audit。
- 将 submit/confirmation 和第二增量变更动作分别落到
  `08-increment-1-submit-ux-contract.md` 与
  `07-increment-2-change-contract.md`，实现与 qualification 必须引用其 normative
  input/output/effect。
- 将 capability registry、guardian timeline、caregiver work 与 role-specific detail
  output 固定在 `09-capability-query-contract.md`，复用 T-004 generic query
  envelope/cursor。
- 将 `contextContinuationOfItemRef` 作为 body-free、role-safe 的可选显示/总结关系；不把它解释为业务前驱、执行触发器或授权证据。
- 从同一照护事项生成 guardian timeline projection 与 caregiver work projection，不创建共享聊天室或共享 transcript。
- 若保留 Enrollment-private thread，仅用于路由、索引和历史组织；它不是产品身份、room membership 或授权事实。
- 支持 delivery、read、acknowledge 的可查询状态。
- presenter 输出适合 Guardian Chat、Caregiver Chat 及对应看板消费的稳定 role-safe view-model。
- 真正的事项 successor/dependency、跨事项触发与 SLA 继承后续以 `CareItemDependency` 独立设计，不进入 Increment 1，也不占用 Workflow 术语。

## Phase 3 — Correction and Revocation

- 作为第二增量，在 G2-A Core CareInteraction Loop checkpoint 之后开始。
- `correct_family_care_message` 只允许确切 Message 作者追加 1–2000 字符受保护纯文本
  correction version；原文和历史版本不可变，presenter 默认展示最新有效解释并允许
  展开历史。
- correction 使用严格 correction-head precondition；并发 correction 不自动合并。
  同班其他老师可以追加新的班级 reply，但不能修改或更正同事的作者事实。
- 家长问题只在 response 为 `awaiting_reply` 时允许同 Item correction；responded
  后的新增/修正请求必须创建新 Item，并可使用 context continuation。
- `withdraw_family_care_request` 只允许确切家长问题作者关闭 CareItem 为
  `closed(family_withdrawn)`，解除 active Attention 并阻止后续 ack/reply；问题、
  已有回复、Receipt 和 delivery/read 历史保持可见且可审计。
- caregiver reply 不提供 withdrawal；Grant revoke 是独立授权管理动作，也不复用
  withdrawal 的产品文案或领域状态。
- `redact_family_care_message` 只允许 exact sender Participant 在 current same-side
  relationship 仍可达时，通过一次显式、effect-labeled 手势不可逆移除正文/附件及其
  correction versions；Message tombstone、Receipt、Event、Execution 与 server-owned
  redaction reason 保留。
- author redaction typed input 为空，不接受客户端 reason。历史 sender
  RoleAssignment 只作审计，不要求同一 role row 仍 current；policy/safety/admin
  redaction 使用独立 system capability。
- source question redaction 原子抑制依赖 Item 与 active Attention、阻止未来
  acknowledge/reply；已有 caregiver replies 作为独立作者事实保留。
- reply redaction 只影响该 reply/correction chain 与对应 Receipt；原问题、其他
  replies 和 Item appendability 保持，不自动把 response 改回 awaiting 或重开原
  Attention。班级仍可追加 replacement reply。
- correction 是新的跨边界内容并产生独立 Receipt/ActionDelivery。withdrawal/
  redaction 使尚未 materialize/send 的相关通知候选跳过；已发 push 不声明召回，
  deep-link open 必须 owner-reread 当前状态。
- 三个 capability 均复用 prepare/execute、CommandExecution、immutable result、
  exact replay 与低打扰原位反馈，不创建 Workflow Run/Step。
- 对 author authority、授权撤销、跨机构隔离、并发 head、cascade、response loss、
  notification invalidation 和 replay 建立测试。

## T-007 D-04 — Institution Admin Read-only Projection Addendum

- 在 T-005 presenter family 中新增
  `InstitutionBusinessCommunicationProjectionV1`，它是非 canonical、按请求组合的
  owner-read 结果，不是 Message 副本、共享 room 或共享 transcript。
- 每次读取都重新验证 current `institution_admin`、精确 Institution / Enrollment /
  CareGroup、original Grant、data class、direction、purpose、发送前监督披露与源
  Message/CareItem lifecycle；opaque ref、同园区关系或 Admin 标签本身不授权。
- 允许投影当前可见的园区业务沟通正文、附件、作者/方向、correction、
  withdrawal/redaction tombstone 与当前状态；不允许 Guardian private AI、未发送
  composer、My-Chat private chat 或其他 Institution Enrollment。
- Admin projection 只读。acknowledge/reply 仍要求 exact CareGroup current
  `caregiver | lead_caregiver`；correction/withdrawal/redaction 仍使用各自
  exact-author 或独立 system-policy capability。
- 后续 `InstitutionAttentionCandidate` 只能在同一 owner-read 范围内引用原始材料并
  突出可能需要介入的事项；不自动执行、诊断、归责或评分，也不属于当前增量。
- provider 已实现 exact
  `nurture.institution-business-communication-owner-read@1.0.0` / digest、
  service-auth no-store carrier、request-time owner-read 与负向测试；独立环境开关
  默认 `false`。T-007 consumer composition/adoption 与 joint activation 仍未发生。

## G2-A — Core CareInteraction Loop Checkpoint

- `submit → acknowledge → reply` 三个 action 全部使用同一 Harness/CommandExecution contract。
- 验证 acknowledge actor 只进入审计，不进入 reply authority；同班其他当前合格照护者可回复。
- 验证跨 CareGroup、过期角色、非照护者和园区管理员不能利用“园区/同角色”获得回复权限。
- 验证两名同班照护者并发 reply 时两条独立 command 均提交，并按 immutable
  `replyOrderKey` 排序；同一 command retry 只 exact replay 一条回复。
- 第一条 reply 解除待回复 Attention，后续回复不重复完成 Attention；CareItem
  保持 active/appendable，Increment 1 不增加显式 close action。
- 家长继续提问仍创建新 Item；老师对原 Item 的多条补充回复不构成跨角色聊天室，
  且上下文关系不影响授权、状态或 `CareItemDependency`。
- happy path、duplicate click、concurrent execute、response loss、stale Grant/version 与 outcome-unknown safety 通过。
- correction/withdrawal/redaction 和 G2-C caregiver direct interaction 仍明确显示为
  未完成，不宣称 T-005 final Exit。

## G2-B — Lifecycle and Owner-read Completion Checkpoint

- Checkpoint status: `G2B_CHECKPOINT_PASS`（2026-08-02 质量复核后 requalified）；机械证据见
  `12-g2b-checkpoint-record.md`，不等于 T-005 final Exit 或 T-007 consumer adoption。

- correction、withdrawal、author/system redaction 全部使用统一 Harness、
  CommandExecution、immutable result、exact replay 和独立 Receipt。
- source/reply redaction cascade、correction-chain erasure、Attention behavior、
  pending-delivery invalidation 与 stale deep-link owner-reread 全部通过。
- `InstitutionBusinessCommunicationProjectionV1` 只在 exact disclosed
  Institution-business scope 内 current owner-read，并与 caregiver/author actions
  分离。
- G2-B 不改变 G2-A submit/ack/reply 的 original Grant、CareGroup responsibility、
  append-compatible reply 或 role-safe projection 语义。
- 四个 G2-B action 的 immutable public result 必须逐字段符合 T-004 exact schemas；
  policy redaction 必须提交并重验 current-head-bound `policyDecisionRef`；correction
  timeline 必须选择 correction 自己的 Receipt，withdrawal 以
  `withdrawal_notice + lifecycle=closed` 呈现。transaction-local finalizer 失败是
  确定回滚，不得报告 `outcome_unknown`。

## G2-C — Caregiver Direct Interaction Bridge Checkpoint

- dedicated caregiver-initiated capability 使用独立 capability key/version、typed
  input/result、policy、handler 和 presenter binding，不复用
  `submit_family_care_question`。
- T-006 owner-issued action 只传递 body-free source/navigation context；T-005
  prepare 解析 exact caregiver、CareGroup、child/family target、Grant、data class、
  purpose 和 safety policy，打开空 protected composer。
- 首版正文由 caregiver 人工填写；T-006 internal source、AI suggestion、附件和医疗
  建议不自动搬运。事实性健康/事件沟通保持非诊断、非处方，紧急流程不由消息替代。
- exact canonical effect、family-side projection/response expectation、Receipt、
  correction/redaction 和 ActionDelivery invalidation 已冻结并通过正向/负向测试。
- capability 缺失、contract mismatch、owner/policy unavailable 或资格化未通过时，
  T-006 保留内部 source 并显示安全阻塞，不创建 CareInteraction、不降级批量发布。
- T-005 G2-C provider qualification 使用 exact T-004 contract 与 synthetic
  owner-issued consumer fixture 独立完成，不等待 T-006 整体；T-006 在 Stage G3-E
  负责真实 consumer joint qualification。该分工避免 T-005/T-006 completion cycle。

## Phase 4 — Black-box Qualification

- 使用 T-004 fixture 跑 guardian projection → caregiver work projection → guardian receipt/reply projection 闭环。
- 验证家庭私域泄漏、越权 child scope、重复发送和旧 pin 失败。
- 验证 ordinary chat 无副作用，以及 Chat/board 相同 capability 的等价业务结果。
- 验证 Query lane 不产生 CommandExecution，原子 Action lane exact retry 复用既有 execution/replay 语义。
- 验证 prepare 四分支、五分钟 TTL、单次新 effect、input integrity mismatch、
  target/authority/head drift 与跨主体/跨 surface 拒绝。
- 验证 prepare/expire/reprepare 全程不产生 prepared-draft 业务记录或受保护正文副本。
- 验证 executed/replayed 与 applied/already-satisfied 正交组合，且 committed 不冒充 delivery/read/ack。
- 验证 replay 仅改变调用外壳判定，`committedResult` 的 output/receipt refs
  保持稳定；当前回复数量与 delivery 状态只能通过 `readResult` 获取。
- 验证 `commandExecutionRef` 与 persisted result schema/payload 是唯一 committed-result
  authority，不出现第二个 result row/ref 或 replay-time result recomputation。
- 验证并发 acknowledge 收敛为 already-satisfied 且不重复 event/个人归属；并发
  reply 按独立 command 全部 applied，并正确区分 first/additional response。
- 验证 stale current-state 的 role-safe disclosure fence，以及 authority loss 下的
  generic denied/no-current-state。
- 验证 response loss exact replay、payload drift conflict、concurrent winner、retryable no-commit 与 outcome-unknown quarantine。
- 验证 Chat card/board form 的单 CTA commit、ack direct gesture、无通用二次弹窗和自然语言确认拒绝。
- 验证 success/already-satisfied/replay 使用原位低打扰反馈，只有实质可见变化或
  安全边界变化才中断并要求 refresh/reprepare/rereview。
- 验证 token expiry unchanged-view transparent reprepare 与 changed-view forced rereview。
- 验证同一 active/appendable Item 可接收多个独立 reply、新 Item 从 current
  eligibility 选择并固化自己的 original Grant/新 command identity，以及上下文续接
  关系不产生 authority/state/SLA/dependency 继承。
- 验证 reply Message/Event/Receipt 的 `replyOrderKey` 在并发、response loss 和 exact
  replay 下稳定，且不依赖 whole-Item version CAS 或 mutable reply counter。
- 验证源 Item 不再可读时 presenter 隐藏关联，但新 Item 仍按自身权限正常读取和执行。
- 验证纯文本 1–2000 字符边界、trim/换行规范化、空白正文、超长正文、富文本与附件拒绝。
- 验证 target option ref 与 operation input 分离，raw Enrollment/Grant/internal route fields 被拒绝。
- 验证 client/LLM-supplied `protected_content_ref` 被拒绝；protected ingress 在 execute
  transaction 内生成 internal content binding，prepare 仅保存 keyed integrity tag。
- 验证 ordinary Chat 到 protected composer 只传递 intent，不复制正文或调用 protected-body LLM。
- 验证固定 server-derived classification/ack/reply/empty-attachment 语义与 body-free safe summary。
- 验证医疗、用药与紧急内容在写入前安全失败且不产生业务事实。
- 验证 ActionExecution、ActionDelivery 与 InstitutionWorkflow 不被错误混用；family-care action 不创建产品 Workflow Run/Step。
- 验证 legacy `capture_family_input`/claimed-Step、ThreadParticipant、
  institution-admin-only role、single reply slot 和 raw command DTO 均不能进入新
  T-005 activation path。
- 验证新 G2 rows 只有三轴 Harness writer；legacy handlers/default-off paths 不写，
  read-only compatibility 只从 canonical state 单向派生，ambiguous old rows
  quarantine 而不猜测。
- 验证 capability registry 的 exact key/version、user/system discovery boundary、
  typed input/output refs 与 T-004 contract digest 双向一致。
- 验证不存在共享 room membership、共享 transcript 或 My-Chat Chat-history authority。
- 验证 correction append-only history、exact-author boundary、correction-head race 与
  responded-family-question new-Item rule。
- 验证 withdrawal 只关闭家庭 CareItem 工作、保留内容/Receipt/历史、阻止未来动作，
  且 caregiver reply 与 Grant revoke 不暴露同名 capability。
- 验证 source/reply redaction 的不同 cascade、correction-chain erasure、tombstone、
  exact-author/system-policy separation 与 reply-redaction no-reopen。
- 验证 correction 新 Receipt/ActionDelivery、withdrawal/redaction pending candidate
  invalidation，以及已发 push open 时 current owner-reread。
- 验证 G2-C exact CareGroup/current caregiver、owner-issued child/family target、
  org-to-family Grant/data class/purpose 和 empty protected composer；cross-CareGroup、
  Admin-only、raw target、source-body copy、AI medical copy 与 emergency-replacement
  路径全部 fail closed。
- 验证 T-006 action 在 G2-C unavailable/contract mismatch/owner outage 时只返回安全
  阻塞，不复用普通 family question、不创建 CareInteraction、不进入 PublishProcess。
- 固化 consumer adoption 示例与 contract evidence。

## Exit Gate

- [x] G2-A Core CareInteraction Loop 通过。
- [x] G2-B Lifecycle and Owner-read Completion 通过。
- [ ] G2-C Caregiver Direct Interaction Bridge 通过。
- [ ] 三轴 CareItem、reply collection、protected content、typed result 和 cascade
  schema 可由 clean checkout 重建；legacy cutover 保持 single writer，ambiguous
  old rows 不被猜测迁移。
- [ ] G2 protected qualification 精确引用当前 G1 三类输入，并经 formal NestJS
  ingress + real pinned owner path 在 disposable PostgreSQL 运行。
- [ ] Chat/Board canonical effect/error 等价；ordinary Chat 无副作用；不存在共享
  room/transcript、raw target/authority input 或 protected-body leakage。
- [ ] transaction/concurrency/replay/response-loss/cascade 与全部 cross-family/
  CareGroup/Institution、Admin-only、stale Grant/role、contract mismatch negatives
  通过。
- [ ] 最终 capability/environment 为 false、active test rows 为空，无 PII、secret、
  persistent DB apply、Candidate、native/internal-store effect、activation 或 traffic。
- [ ] 形成 exact G2 Exit Qualification 与 T-005 Beta Profile Handoff；该 handoff
  只声明 Nurture-side qualified capability，不冒充 My-Chat native/device completion。

所有清单项满足后 T-005 才可转为 done。T-002 仍未满足的部署/流量门禁不得被本任务
结果替代。
