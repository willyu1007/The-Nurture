# Overview — 机构端双 Surface

## Status

- State: in-progress
- Task: T-007
- Milestone / Feature: M-002 / F-003
- Updated: 2026-08-12
- Next step: **complete the remaining G4-D I4 owner/command/head matrix** over
  the now-qualified reservation/settlement protocol. The serialized
  two-database race and response-loss suite passed 6/6 on an approved
  synthetic-only disposable pair
  ([`89`](./89-g4-d-i4-a-workflow-run-settlement-qualification-record.md)).
  The writer-fenced signed
  `confirmed_no_effect` operation and the default-off My-Chat reserve ->
  execute -> fence/status -> settle coordinator are implemented locally;
  status bypasses prepared TTL and current authority while remaining bound to
  the original command and reservation evidence. I3 is
  qualified by record [`87`](./87-g4-d-i3-qualification-record.md). Both
  dedicated ledgers and their additive migrations are implemented locally;
  neither migration is applied. The superseded immediate queued-Run issuer,
  its Nurture adapter and the negative protocol-gap x5 vehicle are removed.
  The product path remains default-off because the Host coordinator has no
  route, DI or activation binding. The protocol subset is DB-qualified and
  default-off; native-source, current-owner, remaining command families,
  Guardian/mobile/head negatives and the full I4 exit matrix remain open.
  G4-F therefore remains closed. E7
  disposable
  qualification (`223daa7`, record 83) and E8 joint conformance (`8d41be1`,
  record 84) are closed and the G4-E Exit is issued
  (`G4_E_EXIT_PASS_ADAPTER_QUALIFIED`, record 85); `live_qualified=false`
  remains the separate activation gate and no durable apply is authorized.
  The dedicated verified-invocation
  registry is committed and pinned across Base, My-Chat and Nurture. Nurture
  now exposes one exact query/prepare/execute formal ingress, removes the old
  Institution Knowledge internal-handler track, and binds one complete owner
  set: exact signed-role current authority, encrypted owner-held confirmation,
  and principal-bound My-Chat retrieval plus final access recheck. The module
  remains fail-closed when that single binding is absent or any pin drifts. No
  HTTP route, authenticated Host composition, credential, activation or
  traffic is bound ([`81`](./81-g4-e-e7-owner-composition-record.md),
  [`82`](./82-g4-e-e7-formal-ingress-contract-audit.md)). The next bounded
  source, migration or test artifact in this slice is activation evidence.
  The migration is authored but remains `NOT_RUN_APPROVAL_PENDING`.
  The canonical machine contract is
  `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` /
  `sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741`
  under `packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/`.
  It binds `nurture.institution-knowledge-answer-safety@2.0.0` plus the exact
  My-Chat owner-contract and service tuple. New V2 evidence passed all 15
  fixtures with 30 unique invocation ids, so Q3 is `ADAPTER_QUALIFIED`
  ([`80`](./80-g4-e-q3-provider-qualification-contract.md)).
  `live_qualified=false` remains the separate activation gate.
  Q2 durable ingestion/currentness and Q3 structured-generation/
  provider-neutral safety owners are landed through `My-Chat@942bd00`; Q4
  sibling-mutation authority is closed. Pre-V2 qualification evidence is
  invalid/non-current after the single-track `/v2` contract rotation
  ([`77`](./77-g4-e-q2-source-snapshot-owner-delta.md),
  [`78`](./78-g4-e-q2-q3-owner-progress.md)). The exact generic
  My-Chat Knowledge/PBR/RAG source boundary and 0F decomposition are now pinned
  without adopting the divergent checkout
  ([`64`](./64-g4-0f-scope-freeze.md)); 0F-1 freezes the Nurture-owned item,
  immutable revision, provenance, review and explicit publish/revoke contract
  ([`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md)); 0F-2 freezes
  indexing/online/preview eligibility plus pull, retrieval and final-currentness
  owner ports without adopting a compatibility mapping
  ([`66`](./66-g4-0f-2-retrieval-owner-bridge-freeze.md)); 0F-3 freezes
  structured cited answers, source/medical safety abstention, final citation
  validation, portable provenance and one immutable conflict-review candidate
  ([`67`](./67-g4-0f-3-citation-answer-safety-freeze.md)); the 0G audit repaired
  candidate-as-hold replay/SSOT ambiguity and separated the internal candidate
  append from the five knowledge-lifecycle commands
  ([`68`](./68-g4-0g-0f-audit-record.md)); 0F is released by
  `G4_0F_EXIT_PASS`, opening G4-E I1 only
  ([`69`](./69-g4-0f-exit-record.md)). The macro sequence, per-node quality
  gates and I3 external/DB prerequisites are fixed in
  [`roadmap.md`](./roadmap.md). E1 now implements the strict private lifecycle,
  sealed revision/provenance facts, exact-replay commands and four-table
  migration artifact with `G4_E_I1_1_PASS_STATIC`
  ([`70`](./70-g4-e-increment-1-record.md)). E2 now implements the pure
  index/online/preview eligibility, body-free source pull/reconciliation,
  exact candidate/currentness ports and actor-bound opaque preview options
  with `G4_E_I1_2_PASS_STATIC` ([`71`](./71-g4-e-increment-2-record.md)); no
  schema or database was touched. E3 now implements strict generated-claim
  validation, structured safety/currentness orchestration, owner-typed
  citations, fixed abstention/portable presenters and the one immutable
  conflict candidate with `G4_E_I1_3_PASS_STATIC`
  ([`72`](./72-g4-e-increment-3-record.md)); its fifth-table migration is
  authored and no model/provider runtime is bound. E4 now closes the I1 audit
  with `G4_E_I1_PASS_QUALIFIED`: all 35 migrations, targeted/full PostgreSQL,
  status/drift and exact destroyed-target checks pass
  ([`73`](./73-g4-e-i1-audit-qualification-record.md)). I2-A
  for G4-D rotated the exact public wire artifact to
  `nurture.surface-contract@1.19.0` / `sha256:6f67d49c…`: three queries and 21
  commands map the completed private I1 domain without exposing trusted scope,
  owner evidence, private Workflow refs or caller-supplied heads
  ([`62`](./62-g4-d-i2-a-contract-artifact-record.md)). I2-B now supplies the
  exact public validators, role-safe presenters, I1 command/query adapters and
  fail-closed module/manifest composition
  ([`63`](./63-g4-d-i2-b-surface-adapter-record.md)). Every descriptor remains
  behind the unqualified Enrollment Journey runtime gate. Real contact/native-
  source and authenticated My-Chat owner adapters remain unimplemented I3
  work. G-09's cross-repository workflow/source adoption is now closed by the
  exact My-Chat teacher-release v3 migration; that removes the stale-pin gate
  but does not implement those G4-D adapters. All three 0F unit contracts,
  their 0G audit and branch Exit pass. E1
  through E4 remain private/default-off: no model call, indexing, public
  caller, activation or traffic, and the only G4-E DB operation was the
  destroyed disposable qualification. G4-E E5 now rotates the additive
  Institution Knowledge wire artifact to `nurture.surface-contract@1.20.0` /
  `sha256:35d6340f…` with one read-only preview, one effectful answer action and
  five lifecycle actions ([`74`](./74-g4-e-i2-a-contract-artifact-record.md)).
  E6 maps all seven through exact public validation, trusted target/
  confirmation/scope binding, existing I1 services/specs and role-safe
  presenters. Its former two internal Workbench handlers are superseded and
  removed; the only current Institution Knowledge entrypoints are the three
  dedicated trusted handlers, mapped to the disabled Web Workbench surface
  with no Host route ([`75`](./75-g4-e-i2-b-surface-adapter-record.md)).
  The historical E7 audit correctly found no owner delta at My-Chat
  `4d22aab` ([`76`](./76-g4-e-i3-owner-gate-audit.md)); the later authorized
  T-040 sequence supersedes that external-state finding. Q2 and the
  provider-neutral Q3 boundary are now adopted at `942bd00`. The My-Chat
  service-backed adapter/prompt/profile/test implementation has now passed the
  current `2.1.0` verifier with answer-safety `2.0.0` and owner contract `2.0.0`.
  Q3 no longer blocks E7. Exact owner/adapter admission, the scenario-neutral
  verified-invocation registry, the two-stage command contract and the
  Nurture formal handler binding and complete owner composition now pass
  default-off. The remaining E7 gate is disposable-DB qualification; E8 then
  proves the cross-repository chain. Prior
  qualification evidence remains invalid/non-current. Record
  [`80`](./80-g4-e-q3-provider-qualification-contract.md) is the current SSOT
  and preserves the separate `live_qualified` activation boundary.
- **Live branch state, gaps and next steps:**
  [`41-t007-gap-and-next-register.md`](./41-t007-gap-and-next-register.md).
  That register is the single answer to "where is T-007 now"; the numbered
  records are history and are not edited to stay current.
- Domain and persistence owners remain qualified at **I1**; G4-D and G4-E now have
  an **I2-A wire-contract artifact and I2-B synthetic/default-off surface
  composition**. All implemented
  daily-operations persistence paths, including 0D-3
  revision/downscope, 0D-4 correction reports, 0D-5 policy, the 0D-1
  checkpoint policy and all four G4-D inquiry/waitlist/preparation/trial/
  formalization persistence slices are qualified on
  disposable PostgreSQL. Nothing has a
  production caller, no runtime capability is registered, and no schema is applied
  anywhere durable. G4-E's four-table lifecycle and one-table conflict-
  candidate migrations are now qualified only on a destroyed disposable
  target; no persistent target has received them. 0C, 0D and all four
  0E persistence slices are therefore
  validated as *buildable as frozen*, not as running. The 24 earlier
  descriptors and the three fail-closed formal Institution Knowledge lanes are
  default-off and do not change that runtime posture.
- Exit is not Owner Readiness, Joint Conformance, a Beta Profile Handoff,
  Candidate Freeze, activation or traffic; T-008 continues to wait for the
  complete T-007 Exit.

## Goal

落地角色化 Institution surfaces 的 Nurture 侧产品能力。当前仅提供
`institution_admin` 的 mobile read-only board 与 `InstitutionAdminWorkbench`：
mobile 提供安全聚合、支持信号和只读 Workflow 关键内容/进度投影；Web 提供人员与
关系、日常运营、家长触达、数字资源、知识/RAG 和园区管理 Workflow 操作。同一用户
拥有多个角色时必须显式选择角色上下文，不存在合并权限的超级 Surface。

每日出勤在老师的 caregiver 移动端完成：AI 只在每日提交时根据当天业务证据生成
推理，当前班级老师确认、调整并提交后才形成正式出勤事实。园区 Admin 可查看汇总、
催办、退回或跨日重新打开，但不能代替老师确认。

Admin mobile 以班级为顶层入口，每个班级按自己的当日有效日程组织照片、文字与活动
记录，并提供“今日沟通与关注”和“家园共育”。园区业务沟通从发送前即明确
`institution_admin` 的监督读取权，无需老师主动升级；家庭私密 AI 对话、未发送草稿
和非园区私人聊天仍不可见。后置 AI 只能在相同 owner-read 范围内生成可解释的介入
候选，不自动采取行动。

班级卡只提供当前活动、正式出勤提交状态、最新一张合格班级照片、最新文字、来源
时间和待处理数量；不生成 AI “代表照片”或 freshness/绩效分数。班级详情展开完整
日程活动、沟通、家园反馈和必要的目的限定 child-level 信息。Admin Web 可记录和
查看完整照片/文字，并可调整活动落位、设置可选封面、添加园区说明或执行 downscope
hide；不得覆盖老师原始内容、伪造作者或抹去自动匹配及后续修订历史。Admin-only
不能确认、新增或替换 canonical child attribution，只能提出由 exact CareGroup
caregiver 确认的修正候选。

Support Signal 只表示“园区可能需要提供支持”。第一版由确定性业务状态和园区显式
配置的绝对数量/时间窗口规则生成，用户只看到“需要处理 / 建议关注”两级，不形成
班级、老师或孩子评分。Mobile 只读展示并下钻来源；阈值配置和实际处理位于 Admin
Web。内容语义介入仍是后置、default-off 的 AI candidate。

首个实现的园区 Workflow 只选择 `EnrollmentJourneyWorkflowV1`，覆盖意向咨询、
意向沟通、可选到访、班级满员候补、试入园准备/过程/复盘、正式入园确认、正式
Enrollment 正式化和完成。`capacity_waitlist` 只表示目标班级满员；等待
家长、老师、系统或未来日期是当前等待状态，不是候补业务阶段。实际试入园前已经
完成 My-Chat identity/binding、pending Enrollment/Grant/CareGroup；开始试入园时
同一本地事务将 Enrollment 写为 `status=active, participationPhase=trial`。正式确认
只把 phase 从 `trial` 转为 `formal`，不新增 `trial` 主状态。试入园本身就是适应期；
若仍需观察，必须在转正式前按 D-07D 显式延长。正式化成功是最后一个业务里程碑，
Workflow 随确认结果幂等完成，不再增加 post-activation settling stage。

意向阶段默认只记录孩子称呼、出生月份或年龄段、期望入园时间、目标班型/年龄段、
照护时间需求、来源渠道、Host-owned opaque contact ref、安全标签及最近/下一
touchpoint；这些 provisional 信息不能进入实际试入园。原生园区业务沟通可按
owner-read 保留正文；电话/微信等外部沟通只保存 Admin 确认的结构化摘要，不伪造完整
transcript。AI 只能形成带来源的摘要候选，不能判断意向等级、转化概率或自动推进阶段。

满班候补只在家庭明确接受候补、目标班级和必要信息已确认后进入，排序起点为
`waitlistQualifiedAt`，不是首次咨询时间。园区可配置少量、透明、可审计的优先类别，
类别内 FIFO；无类别配置时为纯 FIFO，AI 不参与排序。家庭只看候补状态、目标班级和
复核/联系时间，不显示精确名次；Admin 查看当前顺序和依据。名额出现后仍由 Admin
发出限时 offer，不能自动进入试入园或创建 Enrollment。

家庭接受试入园后，先由 Guardian 创建/选择并授权 My-Chat Child/Family，完成 current
scenario binding、Nurture association、pending Enrollment/Grant 和 exact CareGroup
assignment，之后由 trial-start commit 进入真实照护。试入园孩子与班内其他孩子使用
相同的名册、出勤、照护记录、照片自动关联、看板与 PublishProcess；产品使用 canonical
`participationPhase=trial` 区分正式关系，不建立独立 TrialChild、媒体、retention 或
caregiver 流程。phase 不授予权限。试入园当天计入照护/安全人数和实际出勤，但正式
在园统计只计算 `status=active && participationPhase=formal`。

试入园开始后占用一个真实班级名额，直到明确结束或转为 formal Enrollment；延长和
待 Guardian 接受的正式方案期间都继续保留该名额。每次 trial 都有
`trialStartsAt`、`trialEndsAt` 和不晚于结束时间的 `reviewAt`；到期只产生
Admin 待办/支持信号，不自动录取、结束或释放名额。老师不填写专用评估表，系统从
既有出勤、照护、观察和家园沟通中汇总证据；AI 只能提供带引用的 review draft，不
判断“适不适合”。家庭接受正式方案后才转为 `participationPhase=formal`；结束后释放
名额。offer 已接受但 trial 尚未开始时，Guardian 撤回由
`cancel_trial_preparation` 关闭 preparation shell 并释放 reservation，不要求不存在的
Enrollment/Grant/CareGroup 先执行 end-trial。原候补 entry
在接受 trial offer 时关闭，结束试入园不会自动恢复旧名次；如需继续等待，按 D-07B
重新取得候补资格，特殊调整必须可审计。

转正式不使用跨 owner 分布式事务：Guardian 接受正式方案后，先由 My-Chat 重验
current Child/Family membership 与 scenario binding，再由 Nurture 在一个本地事务中
保持同一 Enrollment `status=active`、把 `participationPhase` 从 `trial` 改为
`formal`、保留 trial-start 已转换的 active occupancy，并更新 Grant。owner 不可用、
binding 失效或事务失败时保持 `active trial + occupied seat`，Workflow 进入
`waiting_on_system`，幂等重试后才能显示正式在园。结束 trial 则由 Nurture 一个本地
事务把 `status` 改为 `ended`、结束 CareGroup、关闭 trial-purpose Grant 并释放名额；
My-Chat Child/Family/binding 与已有照护历史不删除。Workflow 完成后的正式离园属于
普通 Enrollment maintenance，不重新打开 Journey，也不默认创建第二个 Workflow。

## Stage G4 Delivery Structure — Accepted

G4 的整体目标是形成机构角色化治理闭环，而不是建立独立的机构产品壳。Nurture
交付 role-bound policy、presenter、command、`InstitutionWorkflow` 业务语义和
scenario artifact；My-Chat 继续拥有身份、宿主 Surface、通用 Workflow/RAG runtime
与分发。

交付视图固定为：

- **G4-0 Contract & Fact Freeze**：按域冻结 owner contract、事实模型、schema、
  enablement gate 与默认安全行为；T-006 所需 publication-policy subset 是最早的
  独立交付。
- **G4-A Authority & Aggregate Foundation**：active-role、Institution/class/child
  scope、Grant policy、安全聚合与 support-signal 基础。
- **G4-B Role-bound Mobile Operations**：B1 Admin 只读班级看板与 B2 caregiver
  每日出勤闭环。
- **G4-C InstitutionAdminWorkbench Core**：人员关系、日常运营、沟通读取、活动
  记录、责任队列和 support-signal 处理。
- **G4-D Enrollment Journey Workflow**：D1 inquiry/waitlist、D2 trial、
  D3 formalization/exit/completion。
- **G4-E Institution Knowledge & RAG**：知识 revision/publish、来源、检索资格、
  引用和医疗冲突拒答。
- **G4-F Integration Qualification & Handoff**：正式入口、owner conformance、
  隐私/负向验证和 T-007 Beta Profile Handoff。

G4-0 是按域滚动放行的 gate，不是等待全部条目冻结后才开始后续工作的单一串行阶段。
在各自必需合同和 G4-A 基础就绪后，G4-B/C/D/E 可并行；G4-D 的 Workflow projection
后接入 B/C，未就绪时保持合法 absent/empty。G4-F 汇合全部必选路径，但各任务包的
contract、negative 与 integration verification 必须随包完成，不能全部后置。

G4-0 内部顺序固定为 0A Freeze Protocol/Fact Inventory、0B publication-policy
fast lane、0C Authority/Surface、0D Daily Operations、0E Workflow/Enrollment、
0F Knowledge/RAG 和 0G Cross-contract Audit/Branch Release。0A 之后 0B 立即解除
T-006 依赖；0C 是 G4 自身公共基础，0D/0E/0F 按域并行，0G 滚动签发分支 PASS。

## Scope In

- T-006 Stage G3 publication-policy owner contract：园区 timezone、默认发送时点、
  automatic retry cutoff、organize idle/fallback/quiescence 配置、effective version
  与 `policyHead`。T-007 拥有配置，T-006 为每个 `PublishProcess` 解析并固化结果。
- 角色化 Surface policy：同一用户显式切换角色；Lead 仅为 Admin 确定的内部分工
  标识，不授予权限，也不代表园区负责人。
- `institution_admin` mobile read-only board：园区级事项、班级列表、班级独立一日
  活动、今日沟通与关注、家园共育、跨班级异常摘要和
  `InstitutionWorkflowProjection`。
- 班级日程与活动投影：园区默认模板、班级覆盖、当日临时安排和有效期；照片/文字/
  活动记录先按明确关联，再按班级日程/时间，最后才由 AI 辅助落位，无法确定时留在
  本班待归位。
- 班级卡/详情：卡片展示当前/下一活动、正式出勤提交状态、确定性选出的最新合格
  照片、最新文字、source timestamp 和待处理数量；详情展示完整 actor-safe 一日
  活动、沟通、家园反馈、出勤与目的限定的孩子级下钻。
- 园区业务沟通 Admin 只读投影：精确绑定 Institution/Enrollment/CareGroup、
  Grant/data class/purpose、source lifecycle 和 redaction；包含 family-to-org、
  org-to-family 和家长直达园区的正文/附件/更正状态。
- 后置 `InstitutionAttentionCandidate`：在同一授权沟通范围内突出可能需要园区介入
  的内容并引用来源，不形成老师/家长/孩子评分或自动 action。
- `InstitutionSupportSignalProjectionV1`：从确定性业务 deadline/blocker 与园区
  配置的绝对负荷阈值生成“需要处理 / 建议关注”两级只读投影；不做跨班比较、历史
  基线异常检测或自动 Workflow。
- `EnrollmentJourneyWorkflowV1` 顶层旅程：单一首发 Workflow，覆盖意向、试入园
  适应/复盘到正式激活和完成；园区 Admin 对整体负责，Guardian/Caregiver/system
  仅在各自步骤成为当前 waiting party，不因此进入 Admin Web。
- D-07A inquiry/touchpoint：最少 local provisional child data、Host-owned contact
  ref、native owner-read message 与 external manual summary 分流、append-only
  correction，以及 Admin 显式阶段推进。
- D-07B capacity waitlist：明确候补资格时点、versioned priority category + 组内
  FIFO、Admin-only ordered view、家庭无精确名次、定期意向复核和人工限时 offer。
- D-07C trial handling：实际试入园前完成 My-Chat Child/Family 与 current binding、
  Nurture pending Enrollment/Grant/CareGroup；trial-start 后使用现有
  `status=active` 加 `participationPhase=trial`，照护链路与其他孩子一致。
- D-07D trial review：trial 占用真实名额并有 starts/ends/review 时间；Admin 只可
  显式延长、提出正式入园或结束，老师无专用评估表，AI 无 suitability decision，
  结束后不自动恢复旧候补位置。
- D-07E formalization/exit：My-Chat 只重验 identity/binding currentness；Nurture
  本地事务原子更新 `participationPhase`、reservation、Grant 与 CareGroup。失败保留
  safe active trial，结束不删除平台身份或历史事实。
- D-07F completion：trial 本身承担适应期；需要更多观察时延长 trial。正式激活成功
  后 Workflow 幂等完成，不增加 post-activation settling、额外反馈表或人工完成门。
- D-07G cancellation/offboarding：trial-start 前撤回通过 preparation cancellation
  释放 reservation；Workflow 完成后的正式离园使用普通 Enrollment lifecycle，
  不重新打开 Journey 或默认创建第二个 Workflow。
- `InstitutionAdminWorkbench`：人员与关系、日常运营、家长触达、数字资源、知识/RAG、
  roster/invite、parent confirmation、grant lifecycle 和 `InstitutionWorkflow` 操作。
- Admin Web 完整活动记录：园区可新增照片/文字、查看完整原图和正文、设置可选活动
  封面、调整活动落位并执行 downscope hide；child attribution 修正由 Admin 提议、
  exact CareGroup caregiver 确认。原始内容、作者、capture/source time、自动匹配
  结果与 revision history 保留。
- 每日班级出勤闭环：AI submission-time inference、当前班级老师确认、同日可审计
  修订，以及跨日由 Admin 重新打开后再由老师修订。
- 园区可编辑和发布的知识库，包括儿童沟通/发展、日常照护、园区制度、活动资源、
  家长沟通与基础医疗/急救知识；知识可关联权威来源。
- role-safe RAG：仅使用当前有效、已发布、actor-safe 的材料，回答区分并引用园区
  材料或权威来源，医疗冲突不静默混合。
- 机构 actor、role、group、enrollment、child scope 与 aggregate policy。
- 去排名、去诊断、隐私安全的聚合规则。
- institution presenters、queries、commands、fixtures 和审计证据。
- 对尚未锁定的机构产品细节建立显式 open-question / decision log。

## Scope Out

- 完整 CRM、ERP、排班、计费、人事或市场化机构后台。
- 招生销售漏斗、家庭价值/转化概率/孩子适配评分或通用 prospect marketing automation；
  入园 Workflow 只保存完成该旅程所需的最少 provisional 信息和业务 touchpoints。
- 在 Nurture Workflow/projection 中复制原始手机号、微信号、邮箱或 Host account
  identity；联系信息由 My-Chat invitation/contact owner 持有。
- 将电话/微信等外部沟通摘要伪装成完整消息 transcript，或在没有可引用 source 时
  让 AI 生成“沟通总结”。
- Caregiver、Guardian 或其他非 Admin 角色的 Web 操作台；Lead designation 当前不
  形成独立 Surface。后续 Web 按真实角色分别定义，不创建空壳或共享 Admin Web。
- 教师、儿童、家庭、班级或机构排名。
- 家庭 AI 私密对话、未发送草稿、My-Chat 私人聊天或其他 Institution Enrollment
  沟通的机构读取/汇总。园区业务沟通的精确只读投影不属于该私域。
- AI 自动确认正式出勤、Admin 代替班级老师确认出勤，或把“有记录的孩子数”直接
  当作出勤人数。
- 使用生成式/审美模型挑选“最佳代表照片”，或要求老师必须为每个活动挑封面。
- Admin 原地改写老师照片/文字、伪造原始作者/时间，或用关联调整删除自动匹配与
  历史 revision。
- Admin-only 确认、新增或替换 canonical child attribution，扩大 audience，或让
  未经 exact CareGroup caregiver 确认的修正候选满足 publish eligibility。
- 将支持信号变成班级/老师绩效分、红黄绿排名、同伴比较或隐藏 AI risk score。
- 仅因“没有活动记录”生成支持信号，或由信号自动回复、通知他人、创建 WorkItem/
  Workflow。
- 将所有等待都塞进 `capacity_waitlist`，或在班级未满时用候补阶段代替
  `waiting_on_guardian | caregiver | system | scheduled_for_future | blocked`。
- 按首次咨询时间占位、使用 AI/家庭价值/孩子适配分排序、静默手工插队，或向家庭
  展示可推断其他家庭信息的精确候补名次。
- 名额出现后自动录取、自动建立 Enrollment/Grant，或一次未回复就从候补中删除。
- 在家长授权前创建/推断 My-Chat child/family identity，或允许只有 local
  provisional record 的孩子进入实际试入园。
- 为试入园另建 TrialChild、独立媒体/出勤/retention/caregiver 流程，或把 `trial`
  标签本身当作读取授权。
- 用同一个空位并行安排多个试入园孩子，或在试入园尚未明确结束时把名额再次承诺
  给其他家庭。
- 让 `reviewAt`/`trialEndsAt` 自动录取、自动结束、自动释放名额，或允许过期 trial
  不经显式延长继续产生新的计划照护。
- accepted offer 在 trial-start 前撤回时继续占用 reservation，或要求不存在的
  Enrollment/Grant/CareGroup 先执行 `end trial`。
- 要求老师填写另一套试入园评分/报告，允许 AI 判断“是否适合”，或结束后自动恢复
  原候补名次。
- 把 My-Chat currentness check 与 Nurture 写入伪装成跨库原子事务，或在任一 owner/
  本地事务失败时显示半完成的 active Enrollment。
- 激活过程中先释放 trial reservation、先扩张正式 Grant，或让 mobile/Web 在本地
  commit 前显示 active。
- 结束试入园时删除 My-Chat Child/Family/scenario binding、复制/删除已有 care
  facts，或因 My-Chat owner 暂时不可用而无法关闭 Nurture 本地照护权限。
- 因收到一次咨询、AI 判断高意向或设置了下一跟进时间而自动从 `inquiry` 推进到
  `intent_conversation`。
- 首轮绕过 trial 直接正式入园，或把文档中的 enrollment offer 解释为 direct-formal
  Enrollment 旁路。
- 诊断、处方、替代急救/医疗人员的回答，或把园区材料伪装成权威医疗结论。
- My-Chat 的通用知识存储、向量检索、模型 gateway、RAG runtime、Web/native shell、
  admin runtime、账号、通知和商店分发。

## Dependencies and Gates

- T-004 公共 surface、visibility 和 aggregate contract。
- T-005 family-care communication 与 owner-reread。
- T-006 care facts、publication 和 role projections。
- T-006 G3-D/E 只硬依赖上述 publication-policy 精确子合同，不等待 T-007 全任务；
  T-006 G3-A 对 `InstitutionWorkflowProjection` 的消费是按 beta profile 选择的
  只读展示依赖，absence/empty 不阻塞其核心看板/发布路径。
- T-002 institution/group/enrollment/grant、opaque identity binding 与 qualification gates。
- T-003 机构 surface 仅为框架级输入，未决定内容不得被实现者默认为产品承诺。

## Acceptance Criteria

- [ ] publication-policy contract 可独立于 T-007 全任务发布 exact version/head；
  T-006 解析后的 `scheduledAt/notAfter/timezone/policyHead` 对既有 process 保持稳定，
  后续配置变更只影响新解析。
- [ ] T-006 对 `InstitutionWorkflowProjection` 的 optional board module 在无适用
  Workflow 或 projection unavailable 时返回合法空态，不形成整任务依赖。
- [ ] 每个 mobile/Web Surface 都绑定一个显式角色上下文；多角色用户不会获得合并
  权限，Lead 不产生额外 capability。
- [ ] `institution_admin` mobile board 为 read-only，且只显示 policy-approved
  class/detail projections、aggregate 与支持信号。
- [ ] Admin mobile 首页以班级为顶层入口；每个班级使用自己的有效日程，不把全园
  班级强行落到一条统一活动时间线。
- [ ] 班级活动只展示 actor-safe 的照片/文字/记录证据；无记录不等于活动未开展，
  自动归位不确定时留在本班待归位。
- [ ] 班级卡使用“最新照片”而非主观“代表照片”：可选显式封面优先，否则按当前
  活动、当日最近活动的稳定规则选择；待复核、归属不明、已撤回/删除/失权内容排除。
- [ ] 班级卡不展示沟通正文或 AI 出勤推测，只展示正式出勤提交状态、活动摘要、
  source timestamp 和待处理数量；完整内容在班级详情/Web 读取。
- [ ] Admin 可只读查看明确属于该 Institution 的园区业务沟通正文、附件与更正状态，
  无需老师升级；家庭私密 AI、草稿、私人聊天和其他 Institution 仍不可见。
- [ ] 后置 AI attention 只在同一 owner-read 范围内产生带 source refs 的候选；
  redaction/correction/revoke 会同步失效候选，且 AI 不自动回复、建 Workflow 或评分。
- [ ] Support Signal 只分“需要处理 / 建议关注”；确定性信号来自 canonical
  deadline/blocker，负荷信号只使用园区配置的绝对阈值，不做跨班/跨老师比较。
- [ ] 未配置负荷阈值时该类信号保持 disabled；来源解决、撤回、纠正、撤权或失效后
  派生信号自动消失，不形成长期绩效历史。
- [ ] Admin mobile 最多突出三个跨班级信号并只读下钻；阈值配置、source action 与
  显式创建 WorkItem/当前已注册且 eligible 的 Workflow 位于 Admin Web；普通 signal
  不能启动 `EnrollmentJourneyWorkflowV1`，信号本身不自动产生业务动作。
- [ ] 首个实现只包含 `EnrollmentJourneyWorkflowV1`；Grant change、出勤修订、知识
  编辑、CareInteraction、PublishProcess 和 support signal 不伪装成第二个 Workflow。
- [ ] 顶层阶段覆盖意向 → 沟通/可选到访 → 满班候补（可选）→ My-Chat/binding 与
  trial relationship preparation/start → 试入园适应 → 复盘 → 正式确认/formal phase
  → 完成。
- [ ] `capacity_waitlist` 只由目标班级容量不足进入；其他等待保持为 waiting state，
  并显示当前等待方和下一次复核/预计时间。
- [ ] 意向/候补期可以只保留最少本地 provisional record；实际试入园前必须由
  Guardian 创建/选择并授权 My-Chat Child/Family，完成 current binding、Nurture
  association、pending Enrollment/Grant 和 exact CareGroup assignment，再通过
  trial-start commit 进入真实照护。
- [ ] 试入园本身就是适应期；如需继续观察必须在正式激活前显式延长 trial。确认
  Nurture 激活成功后 Workflow 幂等完成，不要求额外老师/家庭反馈、Admin 确认或
  post-activation settling gate。
- [ ] D-07A 默认只收集称呼 + 出生月份/年龄段等最少 provisional 信息；法定姓名、
  完整出生日期和更深敏感事实仅在后续明确 purpose/consent 下采集。
- [ ] 成人联系信息由 Host owner 持有；Nurture 只保存 opaque contact ref 与安全
  label，无法取得受支持 owner contract 时不降级复制 raw contact。
- [ ] native 园区业务沟通使用 canonical Message/source refs；外部电话/微信只保存
  structured manual summary、channel、occurredAt、confirmed needs、next action/dueAt
  和责任角色，修订 append-only。
- [ ] AI 摘要必须基于当前授权、可引用的 native source，并由 Admin 确认后成为
  touchpoint note；AI 不生成 intent/fit/conversion score，也不自动推进阶段。
- [ ] D-07B 只有家庭明确接受候补、目标班级和最少信息已确认时才产生
  `waitlistQualifiedAt`；首次咨询/到访时间不预占候补顺序。
- [ ] 候补使用 versioned priority categories + category 内 FIFO；未配置优先类别时
  为单一 FIFO，Admin 手工调整必须记录 reason 和前后顺序，AI 不参与。
- [ ] 候补记录包含目标班级、期望日期/窗口、qualifiedAt、capacity/policy revision、
  priority basis、nextReviewAt、continued-interest 状态、最近确认和 waiting party。
- [ ] 家庭端不显示精确名次，只显示候补中、目标班级、最近复核和下次预计联系；
  Admin Web 才能查看完整顺序及依据。
- [ ] 名额释放只产生 Admin 待处理事项；Admin 发出限时 offer，Guardian 接受后才进入
  `trial_preparation`。拒绝/超时后再处理下一位，不自动激活 Enrollment。
- [ ] `nextReviewAt` 必填；复核未回复先进入 `waiting_on_guardian`，只在园区配置的
  reminder/deadline 完成后过期，不因一次未回复自动删除。
- [ ] D-07C 不创建独立 TrialChild、trial media/attendance/retention 或 caregiver
  Surface；老师使用普通 role-bound mobile，记录进入既有 care facts、照片关联、
  attendance、board 和 PublishProcess。
- [ ] `NurtureEnrollmentStatus` 不新增 `trial`：preparation 使用 `pending`，真实
  trial/formal relationship 都使用 `active`，并由 canonical
  `participationPhase=trial|formal` 区分；phase 不是 authority。
- [ ] 试入园孩子当天计入照护安全人数和真实出勤，但不计入 formal Enrollment
  统计；转正式只更新同一关系的 lifecycle，不复制孩子、照片或照护记录。
- [ ] D-07D trial offer 接受后关闭原 waitlist entry，并创建绑定 exact class 与
  `trialStartsAt`/`trialEndsAt`/`reviewAt` 的 capacity reservation；同一名额不能
  并行承诺。
- [ ] trial-start 前撤回使用 `cancel_trial_preparation` 原子关闭 preparation shell
  并释放 reservation，不要求 Enrollment/Grant/CareGroup 已存在；trial 已开始后改走
  end-trial。
- [ ] `reviewAt` 到期只产生 Admin 待办/支持信号；未完成显式延长、正式激活或结束
  时不自动转换。超过 `trialEndsAt` 后不得继续安排试入园照护。
- [ ] 复盘使用既有 attendance/care facts/观察/家园沟通；caregiver 无专用报告。
  AI draft 必须引用来源且不能评分、推荐录取或判断孩子适配度。
- [ ] Admin 复盘结果只允许 `extend trial | propose formal enrollment | end trial`：
  延长更新期限并保留名额，正式方案等待 Guardian 明确接受且期间继续占位，结束
  释放名额。
- [ ] 结束后需要继续等待时重新满足 D-07B qualification 并产生新的
  `waitlistQualifiedAt`；旧名次不自动恢复，例外只允许带原因的 append-only override。
- [ ] D-07E formal activation 必须先取得 Guardian acceptance，并在 Nurture commit
  前重验 current My-Chat Child/Family membership、scenario binding 和 signed owner
  evidence；cached/stale/unavailable evidence 均不能激活。
- [ ] Nurture formalization 在一个本地事务中保持 `status=active`、完成
  `participationPhase: trial → formal`、保留同一 occupied reservation 并更新
  Grant；失败或重试期间保持 `active trial + occupied seat`。
- [ ] `trial_start_pending | formalization_pending | exit_pending | waiting_on_system`
  只属于 Workflow，不增加 Enrollment 主状态；mobile/Web 只在 canonical local commit
  后显示 trial/formal/ended。
- [ ] end trial 是可在 My-Chat owner outage 下执行的 Nurture 本地降权事务：同时
  `status: active → ended`（历史 phase=`trial`）、结束 CareGroup、关闭 trial-purpose
  Grant、释放 reservation，
  之后只创建下一候补 Admin task，不自动 offer。
- [ ] end trial 不删除 My-Chat Child/Family/membership/scenario binding 或 Nurture
  association/care history；只停止未来 caregiver access 和新 publication，历史沿用
  T-006 retention/redaction/revoke。
- [ ] Workflow 完成后的 formal Enrollment 离园属于普通
  `status: active → ended` lifecycle maintenance，不重新打开 Enrollment Journey，
  也不默认创建第二个 Workflow。
- [ ] Admin mobile board 可查看当前 actor-safe Workflow 关键内容、阶段、里程碑、阻塞和
  下一步，但不暴露 raw Run/Step 或提供隐藏写操作。
- [ ] 当前只有 `institution_admin` 可以进入 `InstitutionAdminWorkbench`；非 Admin
  角色不能进入或借用其 capability。
- [ ] Admin Web 的 roster/invite/confirmation/grant、日常运营、家长触达、数字资源和
  知识操作均有明确 authority、状态和审计。
- [ ] Admin Web 可记录/查看完整照片和文字，并可设置封面、调整活动落位与 downscope
  visibility；这些修改追加 revision；child attribution 由 Admin 提议、exact
  CareGroup caregiver 确认，老师原始内容/作者/时间与自动匹配 provenance 不被覆盖。
- [ ] AI 只在每日提交时生成带证据的出勤推理；当前班级老师明确提交后才产生正式
  出勤，同日修订和跨日 reopen 均保留审计，Admin 不能代确认。
- [ ] 出勤事实、记录覆盖率和 AI 推理候选在 contract 与 UI 中保持不同语义。
- [ ] 园区 Admin 可编辑/发布包括医疗类在内的知识；RAG 回答逐项标明园区或权威
  来源、版本和引用片段，来源冲突时不静默拼接。
- [ ] Web 与 mobile 消费同一 `InstitutionWorkflow` 事实与 versioned projection；
  Admin Web 是主要 Workflow 操作面，Admin mobile 不复制或拥有 Workflow。
- [ ] aggregate 无法反推出家庭私密正文或未授权 child-level facts。
- [ ] 产品中不存在教师/孩子/家庭的排名、评分或诊断性结论。
- [ ] institution presenter 可被 My-Chat 消费且不暴露内部 persistence。
- [ ] 顶层产品问题已收口；所有实现前 contract/schema 项均在 freeze register 中
  标明 owner、启用门和默认安全行为。


## Next Step

See [`41-t007-gap-and-next-register.md`](./41-t007-gap-and-next-register.md)
"Next steps, in dependency order". It is kept there rather than here so there is
one list to update instead of two that disagree.

## 2026-08-12 fifth-round mainline increment

The two durable owner candidates now exist in the shared worktrees. My-Chat has
a dedicated logical-operation reservation ledger: reserve creates no Run,
Step or outbox event; confirm atomically creates the queued Run and the existing
body-free `workflow.run.created` event; no-effect abandons without either.

Nurture now has a separate settlement ledger and owner boundary. It freezes
only hashes/opaque ids, reuses the exact command advisory-lock identity, reads
historical committed status without current authority or prepared TTL, and can
issue `confirmed_no_effect` only while holding that writer fence. The command
transaction adapter can attach the exact `NurtureCommandExecution` and receipt
in the same database transaction.

These are schema and local owner candidates only. Neither migration was
applied, the Nurture command spec/transport is not yet carrying the reservation
binding, the Host proof verifier is not composed, and production remains
fail-closed. Verdict: `DUAL_LEDGER_CANDIDATES_IMPLEMENTED /
TRANSPORT_AND_ATOMIC_COMMAND_ADOPTION_PENDING / NO_DB_APPLY /
I4_NOT_QUALIFIED`.

## 2026-08-12 sixth-round signed settlement adoption

The Nurture side now carries an exact Host reservation through the verified,
signed execute operation. Enrollment Journey execute rotated to input schema
v2; v1 execute, malformed evidence, missing inquiry evidence and evidence on a
non-inquiry command fail closed. The reservation is registered before any
prospective-contact read or protected-content sealing.

`start_enrollment_inquiry` now attaches the settlement finalizer after
`NurtureCommandExecution` creation. The business effect, immutable command
receipt and committed settlement proof share one serializable Nurture
transaction. A successful formal execute returns the body-free committed proof
needed by the future Host verifier.

This is a default-off local implementation, not I4 qualification. Historical
status transport after response loss, the My-Chat proof verifier, two-database
race/replay qualification and migration apply remain open. Verdict:
`SIGNED_TRANSPORT_AND_ATOMIC_SETTLEMENT_IMPLEMENTED / HOST_VERIFIER_AND_STATUS_TRANSPORT_PENDING /
NO_DB_APPLY / I4_NOT_QUALIFIED`.

## 2026-08-12 current protocol checkpoint

Historical signed status, the writer-fenced no-effect mutation and the
default-off My-Chat coordinator are implemented. The quality audit rotated
no-effect to input/handler v2: it now carries the original opaque
`confirmationRef`, and Nurture verifies that exact historical confirmation
before it registers a settlement or acquires the command writer fence. A
different confirmation cannot close the real prepared command.

The implementation still adds no public route, DI activation, deployment,
traffic or database apply. The remaining gate is the serialized two-database
race/response-loss qualification on an explicitly approved disposable pair.
Verdict: `CONFIRMATION_BOUND_WRITER_FENCE_AND_HOST_COORDINATOR_IMPLEMENTED /
LOCAL_CONTRACTS_GREEN / TWO_DATABASE_QUALIFICATION_PENDING / NO_DB_APPLY /
I4_NOT_QUALIFIED`.
