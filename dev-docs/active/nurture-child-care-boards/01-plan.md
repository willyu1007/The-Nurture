# Plan — 儿童照护双看板

## Current Execution Target — Confirmed 2026-08-05

The next implementation objective is to close T-006 / G3, without opening T-008,
deployment, activation or Pilot scope:

1. T-007 supplies the exact, default-off
   `nurture.institution-publication-policy@1.0.0` provider.
2. T-006 routes `reschedule_publish_process` and runs the real policy-backed
   schedule/reschedule/release joint qualification with T-007.
3. T-006 runs the exact G2-C provider/consumer journey with T-005.
4. T-006 issues its exact Beta Profile Handoff only after both joint records pass.

### Execution checkpoint — 2026-08-05

- Steps 1–3 now have an implementation candidate pending DB qualification: the Prisma SSOT
  and migration, exact policy read port, seven-field frozen schedule,
  reschedule action, release-time current-policy reread and both joint journeys.
- Repository-only qualification is green: schema validation/generation/context,
  TypeScript, 577 unit tests and the relevant contract/topology/governance gates.
- The current blocking gate is intentional: applying the migration and running
  PostgreSQL-backed qualification require explicit database-write approval.
- G3-E, the Beta Profile Handoff and task closure remain pending until those
  database runs pass and the resulting evidence is recorded. T-008,
  deployment, activation and Pilot remain outside the objective.

## G1 Progressive Entry Boundary

- At G1 start, T-006 MAY design the shared read model, `PublishProcess`, content/media
  safety policy, role-safe presenters and isolated synthetic fixtures.
- Contract Boundary PASS opens public board queries, capability handlers, typed
  publication inputs/results and contract tests against the exact T-004 interface ref.
- Owner Integration Readiness PASS opens isolated integration for current child scope,
  CareGroup/Grant authority, Receipt, revoke and publication owner-reread.
- Joint Conformance PASS is required before T-006 may qualify a real protected
  board/publication journey or issue a Beta Profile Handoff. The sensitive-content
  route remains separately dependent on T-005 Stage G2-C and the exact dedicated
  caregiver direct-interaction capability it consumes. The
  PASS must cite the exact T-004 Surface Contract Artifact Set and T-002 Owner
  Integration Handoff and execute through the formal NestJS Nurture ingress;
  Fastify-only evidence is provisional.
- No G1 state authorizes capability activation, persistent database apply or traffic.

## Stage G3 Decision Register — Accepted

Stage G3 复用 T-006，并把现有交付计划重组为五个共同组成 task Exit 的 checkpoint：

- `G3-A Shared Board Foundation`：同一 canonical facts、共享模块语义与 provenance，
  通过 guardian/caregiver 独立 query/presenter 形成角色安全看板；内联 mutation
  只能调用 canonical owner capability。
- `G3-B Capture-to-Draft Pipeline`：CareGroup 内部采集批次、manual/idle/fallback
  organize、stable watermark、确定性内容组装、versioned draft、autosave/edit
  hold 与 30 秒进入待发送队列。
- `G3-C Content and Media Safety`：media/attribution/exposure 三轴、
  ContentSafetyPolicy、群像门禁、人工归属与 direct-interaction route。
- `G3-D Publish and Release Loop`：五状态 `PublishProcess`、逐目标
  `PublicationRelease`、现在/定时发送、revision freeze、partial/retry/reconcile、
  Receipt、Guardian 回读与发布后低频安全动作。
- `G3-E Integration Qualification`：exact T-004/T-002 inputs、T-005 G2-C、
  T-007 publication-policy subset、formal NestJS ingress、disposable PostgreSQL
  黑盒与负向资格验证，并形成 T-006 Beta Profile Handoff。

交付映射保持可追溯：原 Phase 1 对应 G3-A；原 Phase 2 拆为 G3-B/C；原 Phase 3
对应 G3-D；原 Phase 4 对应 G3-E。G3-A～C 可在 G3-0 冻结后并行，G3-D 消费
G3-B saved revision 和 G3-C publish eligibility，G3-E 汇合全部真实 owner/consumer
证据。

### G3 optional enhancement boundary

- `G3-B1` 确定性组装是必需路径；`G3-B2` 显式 AI copy 是 optional enhancement。
  B2 不可用不能阻塞 B1/G3 Exit，采用 suggestion 后必须生成新 draft revision 并
  重新经过 G3-C policy。
- `G3-C1` 人工 attribution/exposure/needs-review 是必需路径；`G3-C2`
  `ClassScopedFaceMatch` 在 C1 contract 稳定后实现，可与 G3-D 并行。首个 beta
  profile 未声明 required 时可保持 absent/default-off，不阻塞 G3 Exit。
- 代码/contract qualification 不等于 biometric activation。consent、PIPIA、
  retention、withdrawal、processor 与法律/隐私门禁未齐时只允许人工 fallback。

### G3 cross-task boundary

- G2-C provider contract/qualification 由 T-005 独立完成，不等待 T-006 整体；
  G3-E 再完成 T-006 consumer 的真实联合资格验证，避免 T-005/T-006 循环依赖。
- T-007 publication-policy subset 是 G3-D/E 硬依赖；T-007 全任务不是前置条件。
- T-007 `InstitutionWorkflowProjection` 是按 beta profile 选择的 G3-A 只读模块；
  absent/empty 不阻塞核心看板与发布路径。
- T-008 Candidate/Deployment/Platform tooling 不进入 G3 开发关键路径。

## Stage G3 Overall Audit — PASS

- **Goal closure**：G3-A～E 覆盖 shared facts → role-safe board → internal capture →
  exact saved draft → content/media eligibility → per-target release/Receipt →
  Guardian reread → real qualified handoff，不存在中间无 owner 的产品空档。
- **Ownership closure**：board projection、`PublishProcess`、
  `PublicationRelease`、CareInteraction、ActionDelivery 与
  `InstitutionWorkflow` 分层明确，没有第二事实源或跨 owner 混写。
- **Dependency closure**：T-005 G2-C provider 与 T-006 G3-E consumer 分离交付；
  T-007 只先交付 publication-policy subset；T-008 tooling 后置，无 completion
  cycle。
- **Critical-path closure**：G3-0 是短时 contract/fact/schema freeze；G3-A/B/C
  并行，G3-D 可提前做 pure-domain/synthetic work，G3-E 最后汇合真实依赖。
- **Required/optional closure**：G3-B1/G3-C1/D/E required；G3-B2/G3-C2/optional
  Workflow module 不削弱 deterministic/manual/absent-empty fallback。
- **Exit closure**：formal NestJS ingress、real pinned owner paths、disposable
  PostgreSQL、negative matrix、final false/empty 与 exact T-006 handoff 全部进入
  Exit；Candidate/native/device/activation/traffic 保持在任务外。

Board Envelope/module query 拓扑、capability/module keys、cursor/source-head fields、
T-002 reuse/DB SSOT delta、exact T-005/T-007 schemas 与 fixture composition 留给
G3-0 冻结。它们只有在改变上述 ownership/product boundary 时才重新进入顶层讨论。

## Stage G3-0 — Fact, Contract and Schema Freeze

- 盘点 T-002 中 focus、attention、daily care、media 和 publication 相关事实。
- 区分园所内部 raw capture、家庭发布候选、published care fact/visibility 与
  ActionDelivery；不得用一个状态表复制所有 owner 的生命周期。
- 按业务含义分别盘点 focus、daily care、attention、media、publication 与
  CareInteraction 的 owner、lifecycle、authority 和 mutation capability；看板模块
  只在 presenter 层组合这些事实。
- 将 T-003 两个 board surface 的模块映射到共享事实与角色投影。
- 将 T-005 Stage G2-C exact capability key/version、owner-issued action context、
  canonical effect/response/Receipt contract 和 unavailable behavior 纳入依赖矩阵；
  未冻结时不由 T-006 猜测或占位。
- 冻结 T-007 publication-policy owner contract：institution timezone、默认发送时间、
  notAfter、organize idle/fallback/quiescence 参数、effective version 与
  `policyHead`；区分新 process 解析与既有 process 固化语义。
- 将 G3-B1/B2、G3-C1/C2 capability/profile inclusion 分开登记，避免 optional
  enhancement 成为主路径的隐式 hard dependency。
- 列出缺失字段、权限来源和待解锁 gate。

### G3-0 result — PASS (2026-08-02)

- 冻结记录：
  [06-g3-0-fact-contract-schema-freeze.md](06-g3-0-fact-contract-schema-freeze.md)。
- `T006-AC-001`～`T006-AC-010` 已分别映射到一个机械检查类别；
  `pnpm verify:g3-0-freeze` 当前通过。
- G3-A 与 G3-B1/G3-C1 required domain work 已开放；T-007 provider-backed release、
  G3-C2 activation 与 G3-E 仍按冻结 gate 关闭。
- exact `1.8.0` 当前拒绝 Caregiver Workflow projection，首个 profile 固定 excluded；
  未来采用必须旋转 surface/visibility contract，不允许 presenter 暗中兼容。

## Acceptance-to-Check Mapping — Accepted (2026-07-31)

- 本任务验收条目在 G3-0 freeze 及各组交付（G3-A～G3-E）冻结时获得稳定 ID
  （`T006-AC-###`），并逐条映射到恰好一类机械检查：conformance fixture、
  negative case、unit/integration test、lint/静态检查或 evidence census 字段。
- 无法机械验证的条目显式重分类为 `design_note`：仍是设计约束，但退出资格化门禁。
- 未映射的验收条目不得勾选；各组资格化与 G3-E PASS 的依据是映射检查全部通过，
  而不是对散文条目的自评。
- 映射按组摊销，不做一次性回溯；映射表随该组的 freeze/qualification 记录一起
  交付，fixture/case 侧使用 T-004 conformance manifest 的 AC 引用字段回链。

## G3-A — Shared Board Foundation

- 建立 child-scope-first 的 care timeline / current focus / daily care 查询。
- 建立共享的 board projection pipeline，复用 canonical facts、模块语义、
  provenance、snapshot 和排序规则，但不持久化第二份统一 child state。
- daily care 与 attention 等事实保持独立 lifecycle；同一看板卡片可以组合展示，
  但每项修改必须路由到原 canonical owner。
- 分别定义 guardian 与 caregiver 的查询策略、policy filter 和 public presenter；
  不建立先加载全部角色数据、再在 presenter 隐藏字段的跨角色超级 DTO。
- 对与当前角色相关的园区管理请求/结果，消费最小
  `InstitutionWorkflowProjection`；不读取 raw Run/Step 或园区内部备注。
- 固定空态、过期、撤回、更正和权限不足状态。

验收：

- 同一事实的两种投影保持一致 provenance。
- 任意 aggregate 均不能绕过 row/fact-level policy。

### G3-A result — PASS (2026-08-02)

- surface artifact additive 旋转为 `nurture.surface-contract@1.9.0` /
  `sha256:d769e496692553dd6358eb434f992df09841d3703f968bdf2562b37b9c8ee68c`；
  shared core 与全部 T-005 capability slice 哈希不变，`additiveNewSlice`
  规则保住 G2 Exit 证据。
- 新增并实现 7 个 key，全部 `1.0.0`：两个 envelope、三个 module query
  与两个 canonical owner 内联 mutation。`query_caregiver_family_care_work@1.1.0`
  直接复用，没有 T-006 兼容副本。
- `query_teacher_publish_queue` 与 G3-B～G3-D 的其余 adoption-set key 保持未注册；
  `pnpm verify:g3-0-freeze` 现在同时检查"已实现的必须注册在 1.0.0"和"未实现的
  必须缺席"。

#### G3-A acceptance-to-check mapping

| Acceptance ID | Requirement | Mechanical check |
| --- | --- | --- |
| `T006-AC-011` | 两个角色投影共享 canonical facts 与 provenance，不建持久化统一 child state | `phase-3-boards.test.ts` 的 presenter 复现 + `board-envelopes.test.ts` 角色字段隔离 |
| `T006-AC-012` | envelope 模块顺序取 `surface-registry.json` 精确值 | `phase-3-boards.test.ts` 顺序断言 + `board-envelopes.test.ts` registry 对齐 |
| `T006-AC-013` | 每个 typed module result 绑定 contract/capability/actor/scope/snapshot/order/`sourceHeads[]` | `guardian-board-queries.test.ts`、`caregiver-board-queries.test.ts` binding 断言 |
| `T006-AC-014` | cursor 身份绑定七要素并在 source/authority/correction/redaction/Grant 漂移后失效 | `board-projection.test.ts` cursor 矩阵 + 两条 query 的 `refresh_required` 用例 |
| `T006-AC-015` | Guardian 读需五项 fact-level authority；Caregiver 读需 exact-CareGroup RoleAssignment | `board-projection.test.ts` 谓词矩阵 + 两条 query 的负向用例 |
| `T006-AC-016` | 公开 typed 输入不接受原始 child/family/Enrollment/CareGroup/Grant 标识符 | `guardian-board-queries.test.ts` 与 `board-mutations.test.ts` 的 raw-id/他人 ref 拒绝用例 |
| `T006-AC-017` | action ref 只来自 current owner eligibility | `board-projection.test.ts` `projectOwnerActions` + 两个 presenter 的 no-grant 用例 |
| `T006-AC-018` | 内联 mutation 路由到 canonical owner，并在事务内 re-read | `board-mutations.test.ts` precondition/apply 用例 |
| `T006-AC-019` | Caregiver Workflow projection 在 `1.8.0` 及之后保持 excluded | `phase-3-boards.test.ts` visibility 断言 + `board-envelopes.test.ts` 注入负向用例 |
| `T006-AC-020` | 未实现的 `teacher_publish_queue` 以 dependency NO-GO 呈现且 optional 模块不成为隐式 gate | `phase-3-boards.test.ts` NO-GO/state 断言 + `board-envelopes.test.ts` optional 缺席用例 |

## G3-B — Capture-to-Draft Pipeline

- 定义快速记录、photo/media attribution、attention 和待办/待确认项目。
- 只有内部采集被明确选为家庭发布候选时才创建/进入 `PublishProcess`；普通班级记录
  可以保留在园所内部而不产生家庭发布。
- 支持草稿保存和后续继续，不把草稿直接发布给家庭。
- 原始拍摄/记录先进入当前 CareGroup 待整理批次；单张采集、上传完成或 media ready
  不创建 family-publication candidate，也不启动 30 秒。
- 整理由本班老师点击“整理”，或命中园区可配置的静默期/每日兜底时点触发；Pilot
  默认 10 分钟静默期与 `default send window - 30 分钟`（17:00 对应 16:30）。
  正常 idle trigger 已自然满足一分钟 gate；兜底先标记 due，连续一分钟无用户操作
  后立即切批，不再等待完整 10 分钟。
- 一分钟 capture-quiescence gate 默认可在 30 秒～3 分钟内配置；任一本班老师的采集/
  增删/选择/编辑或有效 capture-activity lease 重置它。后台上传、缩略图、heartbeat
  和 provider 进度不重置、不阻塞；自动整理启用时 gate 不可设为 0。
- 手动“整理”绕过 quiescence gate。所有 trigger 按 stable source watermark 切批，
  未完成上传、未保存及之后的新拍摄进入下一批。
- 普通、高置信整理结果提交为 draft 后提供 30 秒快捷调整；用户触碰编辑即暂停推进，
  超时只进入 pending-release queue，且候选不能在自身 deadline 前发布。
- pending-release 内容在实际发布前持续可编辑，不要求逐条二次审批；正在编辑或存在
  未保存 revision 时跳过当前发布批次。
- 支持低打扰内联微调：展示偏好可以本地更新，业务草稿/归属/focus/publication 调整
  调用对应 canonical owner 的 versioned capability；不得直接 patch read snapshot
  或 derived cache。
- My-Chat 负责受保护的本地媒体缓存、缩略图、离线上传队列、进度和重试；Nurture
  不读取本地文件路径，只在稳定 media ref 后管理业务 lifecycle 与 attribution。
- 自动整理使用老师原文、My-Chat 语音转写和版本化模板组装标题/标签/元数据；
  photo-only 不强制生成正文，也不因 copy provider 不可用而阻塞。
- AI copy 只在本班老师显式请求“帮我整理一句/润色”，或独立日/周总结能力中产生
  suggestion；老师选择采用后才进入当前 draftRevision，不自动覆盖原文。
- 同一内容面向多个孩子/家庭时，teacher board 保留一个共享编辑的
  `PublishProcess` 卡片；target 使用 Nurture owner-issued opaque ref，不接受客户端
  或 AI 自行拼装 raw child/family ID。
- Nurture 持久化当前 PublishProcess draft/revision；My-Chat 使用按
  account/Workspace/scenario 隔离的受保护本地 working buffer，约 1 秒 debounce 调用
  versioned autosave capability。
- 在线编辑先取得单一短期 edit hold；其他本班老师可查看但暂不同时编辑。hold 暂停
  scheduler，却不形成个人 owner、业务 authority 或新的 lifecycle。
- pending_release 内容只允许在线取得 hold 后编辑；离线只准备尚未进入服务端待发送
  队列的新草稿/media。

### G3-B1 result — PASS (2026-08-02)

- surface artifact additive 旋转为 `nurture.surface-contract@1.10.0` /
  `sha256:40fb7446de386d30cb0418a545128e7b6d15748efcfda6ef4df1944555e62ef4`;
  shared core 与全部既有 slice 哈希不变。
- 新增并实现 7 个 `1.0.0` key:`query_teacher_publish_queue`、
  `organize_care_capture_batch`、`save_publish_process_draft`、
  `acquire_publish_edit_hold`、`renew_publish_edit_hold`、
  `release_publish_edit_hold`、`cancel_publish_process`。
- `reschedule_publish_process` 未注册:它验证的时间窗来自 T-007 解析结果,
  provider 缺席时只能永远 fail closed。G3-B2 显式 AI copy 保持 absent,
  确定性主路径在无任何 provider 时完整可用。
- pending_release 入队的所有非策略门禁已实现;真正的 schedule 解析与 release
  属于 G3-D,在 provider 缺席时返回 `dependency_no_go` fail closed。

#### G3-B1 acceptance-to-check mapping

| Acceptance ID | Requirement | Mechanical check |
| --- | --- | --- |
| `T006-AC-021` | 单次拍照/记录/上传完成/media ready 不创建发布候选、不启动 30 秒 | `care-capture-batch.test.ts` trigger 矩阵 + `phase-3-capture-to-draft.test.ts` 端到端用例 |
| `T006-AC-022` | 整理只由 manual、10 分钟 idle 或发送前 30 分钟兜底触发,使用服务端时间与园区 timezone | `care-capture-batch.test.ts` 三个 trigger 与 `fallbackLocalMinutes` 用例 |
| `T006-AC-023` | 一分钟 gate 只防打断:manual 绕过、idle 不重复等待、兜底 due 后只等一分钟,自动整理开启时不可设为 0 | `care-capture-batch.test.ts` policy 校验与 gate 用例 |
| `T006-AC-024` | 后台上传/缩略图/心跳/provider 进度不重置 gate;有效 capture lease 会 | `care-capture-batch.test.ts` machine-progress 与 lease 负向用例 |
| `T006-AC-025` | trigger 按 stable source watermark 原子切批,未稳定与其后内容进入下一批,相同 identity exact replay | `care-capture-batch.test.ts` watermark 与 replay 用例 |
| `T006-AC-026` | 确定性组装保留老师原文与转写 provenance,photo-only 不生成正文,不调用生成式 provider | `content-assembler.test.ts` 全部用例 + `phase-3-capture-to-draft.test.ts` |
| `T006-AC-027` | `PublishProcess` 只有五个业务状态与冻结转换,ordinary→draft、review→needs_review、direct-interaction 不建候选 | `publish-process.test.ts` 状态机与路由用例 |
| `T006-AC-028` | 30 秒是交互 posture:编辑/hold 暂停,超时前不得发布,入队还需已解析 schedule | `publish-process.test.ts` quick-adjust 与 admission 用例 |
| `T006-AC-029` | autosave 绑定 `expectedDraftRevision`,exact replay 返回原 revision,漂移 conflict,无 last-write-wins | `publish-process-editing.test.ts` autosave 用例 |
| `T006-AC-030` | edit hold 单一短期可续、不是 authority/owner/state,`pending_release` 编辑必须在线持有;cancel 仅在任何 release commit 前合法 | `publish-process-editing.test.ts` hold 与 cancel 用例 |

## G3-C — Content and Media Safety

- Nurture `ContentSafetyPolicy` 结合硬规则与可选 classifier signals，最终派生
  ordinary / review-required / direct-interaction-required；classifier 不拥有 route。
- ordinary 进入 G3-B/D，灰区进入 needs_review。磕碰/健康/用药、明显情绪行为事件、
  身体隐私/裸露/如厕影像、证件/联系方式等 direct-interaction 内容不进入批量发布；
  只有 T-005 提供当前可用的专用 caregiver-initiated capability 时，本班老师才通过
  owner-issued action 显式启动 CareInteraction；现有普通 family-question action
  不能作为降级路径。
- T-007 园区策略只能提高 tier/阈值；老师可提高 tier 或修改灰区后重判，不能降低硬
  门禁。provider failure/低置信/冲突不默认 ordinary。
- D-14 专用 `ClassScopedFaceMatch` 可在默认关闭的隐私门禁、当前班级范围和高置信
  profile 全部满足时自动确认孩子归属；该例外不扩张到文案或安全路由。
- stable media ref 进入 Nurture 后，分别维护 media asset lifecycle 与 child
  attribution；publish eligibility 始终派生，不增加统一 media-publication 状态。
- 支持从单张卡片 detach、未发布 asset 全局 discarded、发布后逐目标 visibility
  removal 或全局 redaction；物理 storage cleanup 由无引用和 retention policy 驱动。
- 群像媒体要求所有清晰可见孩子的 confirmed attribution 与目标 audience exposure
  policy；否则进入 needs_review，等待人工纠正、整图移除、目标调整或拆分。首轮产品
  不修改原图、不 crop、不 blur。
- 自动匹配只使用 current exact CareGroup/current Enrollment 中当前允许用途的孩子
  头像 reference set，不使用全园/跨班/离园历史库或跨照片 history match；高置信结果
  自动 confirmed，低置信、相似/遮挡、未知和冲突才要求老师处理。
- reference template 按 CareGroup/purpose 加密隔离，照片临时 embedding 匹配后删除；
  consent/PIPIA/retention/withdrawal/processor contract/正式隐私评审未齐时禁用 matcher
  并回退人工归属。

### G3-C1 result — PASS (2026-08-02)

- surface artifact additive 旋转为 `nurture.surface-contract@1.11.0` /
  `sha256:7da487390ae4278347e64959ae4795b856eeee38a92d3230e4e209a7fc403f8e`;
  shared core 与全部既有 slice 哈希不变。
- 新增并实现 3 个 `1.0.0` key:`confirm_child_media_attribution`、
  `reject_child_media_attribution`、`supersede_child_media_attribution`。
- G3-C2 `ClassScopedFaceMatch` 保持 default-off 且**完全未注册**;
  `verify:g3-0-freeze` 新增一条普查禁止任何含 `face_match`/`biometric` 的能力身份。
  人工归属主路径在没有 matcher 时完整可用。
- 冻结件的 adoption set 原本未为 media detach / global discard 预留能力身份。
  两者的领域规则已在 G3-C1 实现并测试,但当时没有注册未被保留的 key。
  2026-08-02 的 adoption-set 增补已把 `detach_publish_process_media` 与
  `discard_media_asset` 补入 G3-D,注册与 handler 随 G3-D 一起交付。

#### G3-C1 acceptance-to-check mapping

| Acceptance ID | Requirement | Mechanical check |
| --- | --- | --- |
| `T006-AC-031` | Nurture 版本化 `ContentSafetyPolicy` 是最终 route owner,硬规则先于 classifier | `content-safety-policy.test.ts` 硬规则与分层用例 |
| `T006-AC-032` | 园区只能收紧、老师只能抬 tier,任何一层都不能下调 | `content-safety-policy.test.ts` overlay/teacher 用例 + `phase-3-media-safety.test.ts` |
| `T006-AC-033` | provider 不可用/malformed/低置信/冲突不默认 ordinary | `content-safety-policy.test.ts` classifier 状态矩阵 |
| `T006-AC-034` | 安全审计不含正文、图片或 chain-of-thought | `content-safety-policy.test.ts` 序列化负向断言 |
| `T006-AC-035` | media asset 与 child attribution 是两条独立封闭轴,published 不污染任一 | `media-attribution.test.ts` 状态与转换矩阵 |
| `T006-AC-036` | 已确认归属只能 supersede,历史追加而非覆写 | `media-attribution.test.ts` reject/supersede 用例 |
| `T006-AC-037` | legacy `hidden/deleted/corrected` 行无证据时卡住迁移门禁,不被猜成新状态 | `media-attribution.test.ts` legacy 映射用例 |
| `T006-AC-038` | 归属决策只接受 owner 签发的 media/child sealed ref | `media-attribution.test.ts` ref 负向用例 |
| `T006-AC-039` | 发布资格实时派生;群像任一清晰可见孩子未确认或 exposure 不允许即 needs_review,只提供四条解法且不做视觉变体 | `publish-eligibility.test.ts` + `phase-3-media-safety.test.ts` |
| `T006-AC-040` | 产品"删除"按阶段映射:detach 只影响当前草稿,global discard 仅限零 committed release | `publish-eligibility.test.ts` detach/discard 用例 |

## G3-D — Publish and Release Loop

- 以 `PublishProcess` 管理一个 caregiver 可见、共享编辑的 family-publication
  content unit；同一 source CareGroup、source refs 与 shared content revision 可以
  关联多个 owner-issued target candidate。
- 实际跨边界 effect 拆为逐目标 `PublicationRelease`：每条独立绑定精确
  ChildCareProcess、Enrollment、child-scoped Family、原 Grant、data class/purpose，
  并拥有独立 publication ref、Receipt、authority check、idempotency 和 retry。
- 多目标发送不是跨家庭事务：一个目标失败不回滚其他合法目标，并返回明确逐目标结果。
  若目标需要不同正文或媒体组合，则拆成不同 `PublishProcess`。
- `PublishProcess` 使用 draft / needs_review / pending_release / released / cancelled
  五状态；只有异常内容进入 needs_review，普通内容从 draft 进入 pending_release。
- scheduledAt 是属性，sending/failed 属于 execution/逐目标结果，delivered 属于
  ActionDelivery；这些都不扩张 `PublishProcess` 主状态机。
- 首个 `PublicationRelease` commit 将共享 revision 冻结并使 process 进入 released。
  部分成功由逐目标结果和派生 summary 表达；零目标提交则保持 pending_release。
- released+partial 的剩余目标只允许基于冻结 revision reconcile/retry；共享正文、媒体
  组合或目标语义需要变化时创建新的 `PublishProcess`/replacement，不回写原 revision。
- cancelled 只允许在任何 release commit 前发生；角色授权由 D-07 冻结。
- 所有 T-006 内容操作只授权给当前 exact CareGroup 的合格 caregiver；同班老师共同
  处理 draft、needs_review、pending_release 与低频发布后安全动作，不形成 creator-only
  ownership。
- Lead designation 留在园区日常运营管理，不进入 T-006 capability eligibility。
  Institution Admin、园区成员或 system operator 也不能代替 exact CareGroup caregiver。
- CareGroup 是家庭侧业务发送方；每次创建、编辑、确认、发送和安全处置仍记录真实
  executor 与 RoleAssignment episode。
- 每次 autosave 携带 expectedDraftRevision 并返回新 revision；冲突时 refresh/rebase，
  不允许 last-write-wins。发布只绑定已保存 revision，local buffer、saving 或 failed
  状态均不可被 scheduler 采用。
- pending_release 默认解析为园区当地 17:00 的 scheduledAt 与 19:00 的 notAfter；
  园区 schedule policy 由 T-007 管理，T-006 保存解析结果、timezone 和 policy head。
- “现在发送”是本班老师的 explicit action，不再弹二次确认；needs_review、active
  edit hold、saving/failed 或未提交 revision 均不可立即发送。
- scheduler 在 scheduledAt 后、notAfter 前按 exact saved revision 和 authorizing
  caregiver RoleAssignment 执行；role/policy/target/media drift 跳过，不能静默替换
  授权老师。
- transient failure 在 notAfter 前使用相同 command identity 重试；
  outcome-unknown 先 reconcile，partial failure 只重试对应目标。超过 notAfter 留队并
  呈现 missed-send attention，不顺延或深夜静默发布。
- 常规修改机会集中在实际发布前。发布后不创建 5 分钟/24 小时复查窗口或老师待办；
  correction、target visibility removal、replacement 与 redaction 作为低频、无固定
  过期时间的安全 capability 保留。
- 不把相机/上传、AI provider execution、T-005 `CareInteraction`、My-Chat
  `ActionDelivery` 或园区 `InstitutionWorkflow` 的状态合并进该过程。
- 通过 T-004 Harness 冻结 capability-specific heads；在发布事务中重新读取
  authority，并原子提交 domain effect、Receipt 与 CommandExecution。相同 command
  exact replay，payload/head drift 明确 conflict/stale。
- 将已发布事实投影到 guardian board 和必要的 conversation item。

### G3-D adoption-set 增补（2026-08-02）

- `detach_publish_process_media` 与 `discard_media_asset` 已按 06 冻结件的
  Amendment 补入 G3-D adoption set,与 post-release safety 能力同批交付。
- 两者是**发布前**动作,与 G3-D 同批只是交付排期:它们共用逐目标 release 事实
  与 safety-action 复核。`discard_media_asset` 恰恰是"一旦有 release commit
  就不再合法"的那个动作,不能被当成 post-release 能力。
- `verify:g3-0-freeze` 现在会遍历冻结件 adoption set 里的每个 capability 身份,
  要求它要么已按 `1.0.0` 注册,要么显式列在未实现清单里;冻结件再出现无人跟踪的
  身份会直接失败。

### G3-D result — PASS (2026-08-02)

- surface artifact additive 旋转为 `nurture.surface-contract@1.12.0` /
  `sha256:a9dcd5c89b0671fc89a0de618375c85b667742bf96ae27a9f66498eb8e3ca29f`;
  shared core 与全部既有 slice 哈希不变,共 35 个 capability。
- 新增并实现 7 个 `1.0.0` key:`release_publish_process`、
  `reschedule_publish_process`、`correct_publication`、
  `remove_publication_target_visibility`、`redact_publication`、
  `detach_publish_process_media`、`discard_media_asset`。**G3 adoption set 至此关闭**。
- release 与 reschedule 携带 `t007_publication_policy@joint_conformance` gate;
  发布后安全能力不带该 gate,provider 缺席时降低可见性的动作依然可用。
- 全部为 pure-domain + isolated T-007 fixture。真实 policy-backed schedule/release
  与 provider/consumer 联合资格化仍属 G3-E。

#### G3-D acceptance-to-check mapping

| Acceptance ID | Requirement | Mechanical check |
| --- | --- | --- |
| `T006-AC-041` | scheduledAt/notAfter 由园区 timezone + 服务端时钟解析并冻结 policy head | `publish-schedule.test.ts` 解析用例 |
| `T006-AC-042` | 后续 policy 变化不静默移动既有 process,只报 drift | `publish-schedule.test.ts` `scheduleAfterPolicyChange` 用例 |
| `T006-AC-043` | scheduler 在窗口内执行,任一 drift 跳过而非发布旧版本,不静默换授权老师 | `publish-schedule.test.ts` attempt 矩阵 |
| `T006-AC-044` | 超过 notAfter 留队并呈现 missed-send,不顺延、不深夜发布 | `publish-schedule.test.ts` + `publication-release.test.ts` |
| `T006-AC-045` | 逐目标 `PublicationRelease` 各自授权/Receipt/重试,一个失败不回滚其他 | `publication-release.test.ts` 扇出用例 |
| `T006-AC-046` | 首个 commit 冻结 revision 并转 released;零提交保持 pending_release | `publication-release.test.ts` |
| `T006-AC-047` | released+partial 只按冻结 revision retry/reconcile;内容变化必须新建 process | `publication-release.test.ts` + `derivePartialReleaseFollowUp` |
| `T006-AC-048` | rejected 与 outcome-unknown 分开,summary 不冒充"已发布" | `publication-release.test.ts` |
| `T006-AC-049` | 发布后 correction/removal/redaction 无过期窗口、append-only、保留 Receipt,不宣称召回 | `publication-safety.test.ts` |
| `T006-AC-050` | detach 只影响当前草稿;discard 仅限零 committed release | `publication-safety.test.ts` |

## G3-E — Integration Qualification

- 跑同一孩子的 caregiver capture → review → family board receipt 旅程。
- 验证看板内联微调提交到正确 canonical owner，并在重新读取后反映；直接修改
  snapshot/cache 不得形成业务事实。
- 验证拍照/上传不启动倒计时；manual、10 分钟 idle 与发送前 30 分钟兜底 trigger 按
  stable source watermark 切批，相同 trigger 不重复建卡。
- 验证 manual 绕过一分钟 gate；正常 10 分钟 idle 不重复等待；兜底 due 后只等待
  一分钟无用户操作。任一本班老师的 capture/edit lease 重置 gate，后台上传/机器进度
  不重置，未稳定上传和后续拍摄进入下一批。
- 验证 30 秒只在普通、高置信整理 draft 提交后启动；超时只入队、编辑暂停推进、
  deadline 前不可发布、发布前持续可改，以及发布后无强制复查工作。
- 验证自动 photo-first organizer 只使用原文、转写和版本化模板；photo-only 无正文、
  copy provider failure 或 malformed output 都不阻塞确定性路径。
- 验证日常整理不会静默调用生成式 copy；只有老师显式请求或独立总结能力可调用，
  suggestion 必须选择采用后才进入 exact draftRevision，拒绝不改变原文。
- 验证 AI copy 的每条 claim 绑定 source refs，不新增事实/情绪/原因/频率/引语/发展
  结论，不改变不确定性，并且不保存 chain-of-thought。
- 验证 ContentSafetyPolicy 硬规则优先于 classifier；园区只能收紧，老师可提高 tier
  或纠正灰区，但 classifier/园区/老师都不能降低 product hard fence。
- 验证 ordinary 进入普通 draft，review-required 进入 needs_review，direct-interaction
  保留内部来源且只提供 T-005 owner-issued action；T-006 不自动创建 CareInteraction。
- 验证 T-005 专用 caregiver-initiated capability 不存在、不可用或不满足当前门禁时，
  T-006 显示安全阻塞且不复用普通 family-question action、不降级到批量发布。
- 验证 Stage G2-C provider 与 T-006 owner-issued consumer action 通过同一 exact
  T-004 digest 在 formal ingress 上联合运行；仅 safe-unavailable 或 synthetic
  provider 不能签发 T-006 Beta Profile Handoff。
- 验证 candidate/edit/release current-reread source/content/policy/target/risk heads；
  provider failure/低置信/冲突 fail closed，policy drift 阻止既有 draft/pending 发布
  而不新增 PublishProcess state。
- 验证 My-Chat 本地缓存 logout/撤权清理、owner-reread denial 和离线重试不会绕过
  Nurture media/publication authority。
- 验证错误 child scope、撤销 grant、并发发布、重复提交和媒体归属。
- 验证一个共享内容 revision fan-out 到多个目标时逐目标授权/Receipt，部分成功不回滚，
  且重试只补偿失败或 outcome-unknown 目标。
- 验证目标特有正文或媒体组合必须拆分内容单元，不能隐藏在共享 revision 中。
- 验证普通/异常候选的五状态合法转换、首个 release 后 revision 冻结、零提交保持
  pending_release，以及 release 后不能退回草稿或整体取消。
- 验证 released+partial 只对未提交目标按冻结 revision retry/reconcile；任何正文、
  媒体组合或目标语义变化都创建新 process/replacement。
- 验证 timer、scheduledAt、CommandExecution、逐目标结果和 ActionDelivery 不污染
  `PublishProcess` lifecycle。
- 验证同班另一位当前合格 caregiver 可以继续编辑、确认、发送或取消共享 process，
  而跨 CareGroup、仅 Lead、仅 Institution Admin 或仅园区成员身份均被拒绝。
- 验证 CareGroup family-facing sender 与 creator/editor/reviewer/executor 个人审计
  同时保留，且个人审计不变成独占权限。
- 验证约 1 秒自动保存、saving/saved/failed UI、离开前 flush/discard 选择和本地缓冲
  logout/撤权清理。
- 验证单一 edit hold 的取得、heartbeat、完成/离开/超时释放；另一位老师只读等待，
  scheduler 在 hold 有效时跳过。
- 验证 expectedDraftRevision conflict 不静默覆盖，只发布已保存 revision；连接中断后
  local unsaved buffer 不冒充服务端暂停或业务事实。
- 验证 pending_release 离线编辑被拒绝，而离线新草稿/media 可在恢复连接后按当前
  owner 和 revision 重新提交。
- 验证 17:00/19:00 按 institution timezone 解析、server clock 执行，园区默认策略
  变化不静默移动已排期 process。
- 验证“现在发送”无需二次弹窗但必须通过 saved revision、无 active hold、current
  role/policy/target/media 等全部门禁。
- 验证 scheduler 延迟可在 notAfter 前 exact retry，超过窗口留队；permanent rejection
  不盲目重试，outcome-unknown 必须先 reconcile。
- 验证 media preparing/ready/unavailable/discarded/redacted 与 attribution
  candidate/confirmed/rejected/superseded 独立转换，published 不污染两者。
- 验证 ready 不等于 publishable；exact media revision、全体可见孩子 attribution/
  exposure、Grant、scope 和 redaction 任一不满足都阻止 release。
- 验证 detach 只影响当前 process；全局 discarded 仅限无 committed release，发布后
  target removal/redaction 不删除 Receipt/audit，storage GC 遵循引用与 retention。
- 若 G3-C2 被实现或列为 profile required，验证 `ClassScopedFaceMatch` 只使用当前
  班级有效头像 opaque refs；质量/top-1/margin
  均过线时自动 confirmed，低置信、相似/遮挡、未知或冲突进入 needs_review，且人工
  纠正 supersede 自动结果。
- 验证群像中的未知、未确认或不允许跨家庭展示孩子阻止自动入队，只能通过纠正归属、
  整图移除、目标调整或拆分解决；发布引用始终是未改动的 exact original-media revision。
- 对已实现的 G3-C2，验证禁用/撤回/离班/Enrollment 结束立即停止匹配并失效
  reference template；临时
  embedding 删除、班级隔离和 provider no-training/no-secondary-use 均有证据。
- 验证没有 ranking、诊断或私域泄漏。
- 验证 G3-B1 在无 AI copy provider 时完成 deterministic draft；B2 不存在时不产生
  placeholder，存在时只有明确采用才改变 revision 并触发重新安全判定。
- 验证 G3-C1 人工归属/群像 exposure/needs-review 完整；C2 未列入 beta profile 时
  default-off 不影响 Exit，列为 required 时 provider/privacy/threshold/evidence
  全部门禁必须通过。
- 验证 T-007 publication-policy exact owner contract 解析并固化 schedule heads；
  `InstitutionWorkflowProjection` absent/empty 不阻塞核心旅程。

## Exit Gate

- [x] G3-A Shared Board Foundation 通过（`T006-AC-011`～`T006-AC-020` 全部映射检查通过）。
- [x] G3-B1 Capture-to-Draft deterministic main path 通过（`T006-AC-021`～
  `T006-AC-030` 全部映射检查通过）；G3-B2 optional AI copy 保持 absent，
  确定性主路径无 provider 也完整可用。
- [x] G3-C1 manual content/media safety path 通过（`T006-AC-031`～`T006-AC-040`
  全部映射检查通过）；G3-C2 face match 明确 optional/default-off，能力身份完全
  未注册，人工归属主路径不依赖它。
- [x] G3-D Publish and Release Loop 通过（`T006-AC-041`～`T006-AC-050` 全部映射检查通过）；真实 policy-backed schedule/release 资格化留给 G3-E。
- [ ] G3-E 通过 formal NestJS ingress + real pinned owner path，在 disposable
  PostgreSQL 完成完整黑盒与负向资格验证。
- [ ] `direct_interaction_required` 已与 T-005 Stage G2-C 完成真实联合资格验证；
  不接受 safe-unavailable 占位、普通 family-question 或 PublishProcess fallback。
- [ ] T-007 publication-policy subset 已按 exact owner contract 资格化；可选
  `InstitutionWorkflowProjection` 的 absent/empty 行为与 beta profile 一致。
- [ ] 最终 capability/environment 为 false、active test rows 为空；无 persistent
  DB apply、Candidate、native/internal-store、activation 或 traffic effect。
- [ ] 形成 exact T-006 Beta Profile Handoff；宿主相机、原生列表性能、设备交互和
  notification/delivery 留给 My-Chat companion/T-008。

所有清单项满足后 T-006 才可转为 done。T-008 仍需独立核验该 handoff 后才能开始
Candidate Freeze。
