# Pitfalls — 儿童照护双看板

## Known Guardrails

- 不要把 Stage G3 当作 T-006 之外的新任务，也不要继续用一个过大的 Phase 2 同时承载
  capture、draft、media、AI、安全和 release；按 G3-A～E checkpoint 交付。
- 不要让 T-005 G2-C provider qualification 等待 T-006 整体 completion；T-005 先
  独立交付 provider，T-006 只在 G3-E 完成 consumer joint qualification。
- 不要因 AI copy 或 `ClassScopedFaceMatch` 未实现阻塞 deterministic/manual 主路径；
  optional enhancement 不得成为隐藏 hard dependency。
- 不要把 optional/default-off 写成已实现占位；beta profile 必须明确 inclusion，
  required 时完整资格化，optional 时保持安全 absent/default-off。
- 不要等待 T-007 全任务才开始 G3；只冻结/消费 exact publication-policy subset。
  也不要把可选 `InstitutionWorkflowProjection` absence 当作发布主路径失败。
- 不要在 G3 overall audit PASS 后把 module key、query topology、cursor field 或
  adapter choice 再包装成顶层产品争论；除非它改变 ownership、权限、required path
  或 Exit，均在 G3-0 contract freeze 内解决。
- 不要因为 T-005/G2-A 核心 family-question 闭环通过就认为
  `direct_interaction_required` 已有可用 action；它单独依赖 Stage G2-C。
- 不要让 T-006 猜测 G2-C capability key/schema、发布占位 action、复制 sensitive
  source body，或在 G2-C unavailable 时降级为 family question/PublishProcess。
- 不要为两个 board 各建一套不可同步的 child state。
- 不要把“derived snapshot 不是 canonical fact”误解为“看板只能只读”；看板可以原地
  微调，但业务修改必须进入正确的 canonical owner capability。
- 不要直接 patch snapshot/cache 并把客户端 optimistic state 当成已提交事实、权限、
  Receipt 或 ActionDelivery。
- 不要为复用方便创建包含 Guardian/Caregiver 全部字段的跨角色超级 DTO，再依赖
  presenter 隐藏敏感字段。
- 不要让 AI 建议自动进入已发布家庭记录。
- 不要假设每张照片都需要 AI 写一句话；自动 photo-first 路径优先老师原文、语音转写
  和确定性模板，photo-only 没有自由正文也成立。
- 不要在日常自动整理中静默调用 copy provider；只有老师显式请求或独立总结能力才可
  生成 suggestion，且选择采用后才改变 draftRevision。
- 不要让 AI 文案覆盖老师原文、补齐不存在的事实，或把观察改成情绪、动机、性格和
  发展结论；不确定性、否定、引语、数值与 source refs 必须保留。
- 不要因 copy provider 失败、malformed output 或低置信阻塞原文/转写/模板/photo-only
  主路径，也不要保存 chain-of-thought。
- 不要让 classifier、老师或园区设置成为最终 safety tier owner；Nurture
  ContentSafetyPolicy 最终派生 route，硬规则先于模型 signal，园区只能收紧。
- 不要把 direct-interaction-required 塞成第六个 PublishProcess state；它是创建候选前
  或发布前派生的路由/eligibility 结果。
- 不要把磕碰、健康/用药、明显情绪行为事件、身体隐私或证件联系方式混入自动批量
  发布；保留内部来源并让本班老师显式进入 T-005。
- 不要因路由到 T-005 就自动创建 CareInteraction、复制敏感 body 或假设 child/family
  target；T-006 只能输出 owner-issued navigation/action，老师明确选择后由 T-005 owner
  创建。
- 不要假设现有普通 family-question action 能承接 caregiver 发起的健康/用药等敏感
  事项；专用 T-005 capability 未交付或当前不可用时必须安全阻塞，不能降级批量发布。
- 不要在 provider failure、低置信、规则冲突或 policy drift 时默认 ordinary；既有
  draft/pending 必须失去 publish eligibility，但不能发明新 lifecycle state。
- 不要把拍照、录入、上传或 AI 整理成功等同于已经创建家庭发布候选。
- 不要在单次拍照、上传完成或 media ready 后立即启动 30 秒；先进入待整理采集批次，
  只有 manual 或园区策略 trigger 按 stable source watermark 切批并提交普通、高置信
  draft 后才启动。
- 不要让新的拍摄无限重置同一个倒计时，也不要把仍在上传的媒体塞入已切出批次；
  watermark 之后和未稳定内容进入下一批。
- 不要把设备后台 timer 当作整理 trigger；10 分钟静默期与“默认发送前 30 分钟”兜底
  使用服务端时间、园区 timezone 和版本化 policy，且园区可以调整/关闭或切为全手动；
  兜底先标记 due，再通过一分钟 quiescence gate 防止打断正在进行的活动。
- 不要把一分钟无操作实现成新的自动整理 trigger；它只在其他自动 trigger 已 due 时
  判断是否可以切批。正常 10 分钟 idle 不再重复等待，手动“整理”直接绕过。
- 不要让上传进度、缩略图、同步 heartbeat 或 provider job 重置/阻塞 quiescence；
  它只观察本班老师的采集、增删、选择、编辑和短期 capture-activity lease，未稳定
  上传按 watermark 进入下一批。
- 不要把 capture-activity lease 变成个人 claim、业务 authority、PublishProcess state
  或长期锁；它只延迟自动切批并必须短 TTL 失效。
- 不要把 30 秒超时等同于发布、Receipt 或 AI 获得授权；它只把普通、高置信候选移入
  待发送队列，产品文案也不得写成“30 秒后发布”。
- 不要在用户正在编辑或存在未保存 revision 时让 scheduler 发布旧版本。
- 不要增加 5 分钟/24 小时发布后复查窗口、老师待办或持续内容运营义务；低频
  correction/visibility removal/replacement/redaction 能力不需要快捷窗口。
- 不要把允许少量可纠正错误解释为跨家庭隐私豁免、敏感内容自动发布或教师质量评分。
- 不要让 `PublishProcess` 吸收设备上传、provider job、CareInteraction、
  ActionDelivery 或 InstitutionWorkflow 的状态。
- 不要把 `published` 展示成通知、provider 或设备已经送达。
- 不要因为多个家庭目标而给老师复制多张相同编辑卡片；共享内容只维护一个
  `PublishProcess` revision。
- 不要把一个多家庭 UI 批次实现成跨家庭全有或全无事务；每个
  `PublicationRelease` 必须独立授权、提交、回执和重试。
- 不要在共享 revision 内隐藏 target-specific 正文或 media 组合；内容不同就拆分
  `PublishProcess`。
- 不要用 process 级“已发布给 N 个家庭”汇总代替逐目标 authority、Receipt 或明确的
  partial result。
- 不要把 needs_review 变成每条普通内容都必须经过的审核关卡；它只承接低置信、归属
  不明确或 D-15 可修正灰区。direct-interaction-required 不能借 needs_review 回到
  批量发布。
- 不要为 scheduled、sending、failed、delivered、corrected 或 partially_released
  扩张 `PublishProcess` 主状态；分别使用属性、execution、逐目标结果、ActionDelivery、
  后续事实或派生 summary。
- 不要在首个 target release commit 后继续修改共享 revision、退回 draft 或整体
  cancel；未提交目标只能按冻结版本重试。
- 不要把 released+partial 的“未按时发送”当成重新编辑原卡片的入口；若正文、媒体组合
  或目标语义需要变化，创建新的 `PublishProcess`/replacement。
- 不要在零目标成功时把 process 标成 released，也不要在部分成功时只显示笼统的
  “已发布”而隐藏未发送目标。
- 不要给 T-006 增加 Lead review gate，也不要把 Lead designation、Institution Admin、
  园区成员或 system operator 当成班级内容 authority；Lead 留给园区运营管理。
- 不要把 process 创建者变成 owner、claimant 或唯一 reviewer；同一 exact CareGroup
  的当前本班老师共同处理，个人身份只保留审计和可选署名。
- 不要因为园区级异常需要运营处理就把 InstitutionWorkflow 或 Lead 审批塞进
  PublishProcess；通过 T-007 独立边界处理。
- 不要把 T-006 publication correction 与 T-005 exact-author Message correction
  混为一条 capability；班级共同责任不能越权改写另一位作者的 CareInteraction Message。
- 不要把 My-Chat local working buffer、saving 状态或设备时间戳当成 canonical draft
  或可发布 revision；发布只绑定 Nurture 已提交的 exact draftRevision。
- 不要用 last-write-wins 静默覆盖另一位老师的修改；expectedDraftRevision drift 必须
  conflict/rebase。
- 不要把短期 edit hold 解释成个人认领、内容 owner、业务 authority 或新的
  PublishProcess state；它只协调单一编辑者并暂停 scheduler。
- 不要允许设备离线修改、取消或声称暂停已经 pending_release 的内容；没有在线 hold
  就无法可靠阻止服务端发送。
- 不要在 saving/failed、hold active 或未保存本地变更存在时从旧 snapshot 推断发布
  内容；scheduler 只能采用 owner-reread 后的已保存 revision。
- 不要让 pending-release 内容再次逐条审批，也不要给“现在发送”增加重复确认弹窗；
  explicit tap 和完整发布门禁已经构成确认边界。
- 不要使用设备时钟、UI 批次或 notification quiet hours 判断 Nurture 发布时间；
  scheduledAt/notAfter 由园区 timezone 与服务端时钟解释。
- 不要让园区默认时段变化静默移动已有卡片，也不要在 19:00 cutoff 后深夜发送、自动
  顺延第二天或丢弃内容；保持真实状态并显示 missed-send attention。
- 不要在 scheduler 中静默选择另一位老师替代失效 authorizing RoleAssignment；需要
  当前本班老师重新处理。
- 不要对 authority/policy/target/media rejection 盲目重试，也不要为
  outcome-unknown 创建新 command；先以原 identity reconcile。
- 不要把 upload completed、media ready、attribution confirmed 与 published 压成一个
  状态；三个 owner 轴分别解释。
- 不要把 ready 当成 publishable；群像中任一清晰可见孩子未确认或不允许目标 audience
  查看时必须 needs_review，并通过纠正、整图移除、目标调整或拆分解决。
- 不要 crop、blur、美化或生成供发布使用的视觉变体；发布始终绑定 exact unchanged
  original-media revision。
- 不要把通用 LLM 的识别猜测当作孩子归属。首轮自动确认只允许专用、版本化
  `ClassScopedFaceMatch` 在当前 exact CareGroup、授权头像 reference set 和高置信
  quality/top-1/margin 门禁内执行。
- 不要为提高 recall 降低阈值、跨到全园/其他班/离园历史库或启用跨照片
  `history_match`；不确定结果进入 needs_review，只让老师处理异常。
- 不要把 raw child/family ID、姓名、家庭关系、原始人脸或可逆模板交给 matcher/
  普通日志；使用 owner-issued opaque refs，reference template 按班级/用途加密隔离，
  临时照片 embedding 匹配后删除。
- 不要在专门告知、单独同意/监护人同意、PIPIA、retention、撤回、processor contract
  或正式隐私评审缺失时启用人脸匹配；园区开关不能覆盖逐孩子/逐目的授权。
- 不要原地覆盖 media ref 或已确认 attribution；使用 exact revision 和 superseding
  fact。
- 不要把“从卡片删除”实现成全局删除，也不要在已有 committed release 后 discard
  asset；发布后使用 target removal/redaction。
- 不要让产品“删除”硬删 Receipt、CommandExecution 或审计，也不要宣称召回已查看/
  下载媒体或已发通知；storage GC 另受引用与 retention/privacy policy 控制。
- 不要把拍照成功等同于媒体已授权、已归属或已发布。
- 不要把 My-Chat 本地缓存、文件路径或上传进度当成 Nurture canonical media fact 或
  authority；logout/撤权/owner-reread denial 后不能继续展示受保护缓存。
- 不要展示其他孩子、家庭或 class draft 的内容。
- 不要使用“评分”“排名”“风险等级”等竞争性或诊断性表达。
- 不要在 publish 事务外生成孤立 receipt。
- 不要把 `PublishProcess` 因为包含多个状态或异步发送就叫作 Workflow。
- 不要让 board 直接读取/修改 Workflow Run/Step；只能消费 role-safe projection 并调用
  versioned capability。
- 不要把“角色相同”当成 Workflow projection 的充分权限。
- 不要把 teacher-board acknowledge actor 投影成独占负责人；班级共同责任不等于
  同园区共享权限，action 仍绑定原始精确 CareGroup。
- 不要把第一条班级回复当成 unique/terminal reply；同班合法回复是追加集合，
  但只有第一条解除待回复 Attention。

## Resolved Pitfalls

### 2026-08-02 — 冻结的 adoption set 漏了两个必需的能力身份

- **Symptom**：G3-C 的计划文本要求"从单张卡片 detach、未发布 asset 全局
  discarded",但 06 冻结件的 Capability Adoption Set 里 G3-C1 只保留了三个
  attribution key,没有为这两个动作预留身份。
- **Root cause**：adoption set 是按"能力"枚举的,而 detach/discard 在设计文本里
  是以"产品删除的三个阶段"描述的,枚举时被归进了 media lifecycle 而没有单独成键。
- **Fix**：实现并测试两者的领域规则(`evaluateMediaDetach` /
  `evaluateMediaDiscard`),但**不**注册未被冻结件保留的 key,并把缺口显式记进
  实现说明与 checkpoint 结论,留给 G3-D 或一次 freeze 增补。
- **Prevention**：冻结 adoption set 时按"用户能触发的动作"过一遍设计文本,
  而不是按事实模型过。发现缺口时宁可显式记账,也不要顺手发明一个未冻结的身份。

### 2026-08-02 — owner-issued target ref 会把内部标识符原样带出去

- **Symptom**：`publish target` 的公开 ref 里出现了 `child-1`。测试
  "serialized targets 不含 raw id" 直接抓到。
- **Root cause**：`issueBoardTargetRef` 为了能反解，把 id 内嵌在
  `version.kind.id.tag` 里。对 care item 这类单一 id 尚可接受，但 publish target
  的复合键包含 child/Enrollment/Grant 三个标识符，而冻结件要求 target 必须
  "behind an opaque public ref"。
- **Attempts**：一度考虑只对 publish target 做特例哈希，但那样 process ref 里的
  careGroupId 仍然会泄漏——同一个 board 的 `careGroupRef` 明明已经是哈希过的。
- **Fix**：新增 `issueBoardSealedRef` / `resolveBoardSealedRef`：纯 HMAC、不可逆，
  按 owner 当前候选集枚举解析。publish process 与 publish target 都改用它，
  顺带得到"失去访问权的 ref 直接解析不出来"这个额外性质。
- **Prevention**：新增一类公开 ref 时先问"它内嵌了什么"。可反解的内嵌式 ref 只用于
  单一、非关联标识符；一旦是复合键或跨实体键，就用 sealed + 枚举解析。

### 2026-08-02 — 领域常量超出 generic invocation 冻结上限（第二次）

- **Symptom**：board query 的 `MAX_PAGE_SIZE` 一开始沿用 T-005 lane 的 100。
- **Root cause**：`query-invocation.schema.json` 冻结了 `pageSize` `maximum: 20`。
  这条在 G3-A 已经踩过一次，G3-B1 的 publish queue 直接复用了修好的 helper 才没
  再犯。
- **Prevention**：新 query lane 一律复用 `parseBoardPageSize`，不要各自定义上限。

### 2026-08-02 — 合同检查假设了 schema 文件的组织方式

- **Symptom**：三个 edit-hold 能力共用一个 schema 文件、指针分别是
  `acquireInput`/`renewInput`/`releaseInput`，phase-2 的 typed-input 检查悄悄
  漏掉了它们——它硬编码读 `/$defs/input`。
- **Root cause**：检查绕过了 schema-registry 已经提供的 `jsonPointer`，用文件
  约定代替了合同声明。
- **Fix**：改为按 registry 的 `jsonPointer` 解析，并断言指针形状。
- **Prevention**：合同检查要沿着合同自己的解析路径走。凡是"按文件名/固定位置"
  取值的地方，都是一个会静默漏检的假设。

### 2026-08-02 — 归档任务的守卫把"当前 artifact"钉死，任何 checkpoint 旋转都会炸

- **Symptom**：G3-A 按冻结件把 surface artifact additive 旋转到 `1.9.0` 后，
  `pnpm verify:g2-exit-contract` 与 `pnpm verify:g3-0-freeze` 立刻失败。
- **Root cause**：两个守卫都用 `expectedInterface` 直接断言"当前生成件 ==
  `1.8.0` / `4fe91e…`"。但那是 T-005 被资格化时的身份、以及 G3-0 冻结时的输入身份，
  是历史证据，不是当前 head。冻结件本身要求"每个 checkpoint 只加已实现的 key
  并旋转 artifact"，所以这两条断言与冻结规则互相矛盾。
- **Attempts**：一度考虑不旋转、把 capability 注册推迟到后面的 checkpoint；
  这会让 G3-A 交付一批没有合同身份的实现，反而制造了"实现与合同不同步"的更大缺口。
- **Fix**：把被资格化的身份改成历史 pin —— 断言归档记录仍然引用它、当前版本不得
  回退 —— 并把"当前 artifact 仍然安全"改为**证明旋转确实是 additive**：
  `sharedCoreHash` 不变、11 个 T-005 capability slice 哈希逐个不变、T-005
  population 仍在。这正是 `compatibility-policy.json` 的
  `additiveNewSlice: preserve_existing_slice_evidence` 所承诺的东西。
- **Prevention**：区分"被资格化的身份"和"当前 head"。前者写进归档记录并只做
  存在性/不回退检查；后者用 slice 级不变量证明兼容。守卫改动只能让断言更强，
  改完必须能说清楚新断言覆盖了旧断言的哪一条。

### 2026-08-02 — 冻结的 placeholder 普查会随实现推进变成假阳性

- **Symptom**：`assert-g3-0-freeze.mjs` 断言 11 个 proposed capability key 全部
  未注册。G3-A 实现其中 7 个之后，这条检查在"正确的进展"上失败。
- **Root cause**：检查表达的是"未实现的 key 不得出现"，但实现成了"全部 proposed
  key 不得出现"，把 adoption set 当成了永久禁令。
- **Fix**：拆成两半 —— G3-A 已实现的 7 个 key 必须注册且版本恰为 `1.0.0`；
  G3-B～G3-D 的 15 个 key 必须仍然缺席。冻结件里"每个 checkpoint 只加已实现的
  key、新 key 从 1.0.0 起"这句话第一次有了完整的机械兜底。
- **Prevention**：写 absence 类检查时先问"这条什么时候应该合法地不再成立"，
  并在那一刻把它改成 presence + absence 的分区，而不是删掉。

### 2026-08-02 — 领域层页大小超出 generic invocation 的冻结上限

- **Symptom**：board query 最初沿用 T-005 query lane 的 `MAX_PAGE_SIZE = 100`
  与默认 50。
- **Root cause**：`invocation/query-invocation.schema.json` 冻结了
  `pageSize` `maximum: 20`。领域层接受 100 意味着接受一个 ingress 永远不会放行的
  页大小，负向测试也会测到一条不可达的分支。
- **Fix**：board lane 收敛到上限 20、默认 10，并在测试里直接断言 21 被拒。
- **Prevention**：新增 query 时先读 generic invocation schema 的边界，再定领域常量；
  两者不一致时以合同为准。

### 2026-08-02 — `domainClass` 是 shared core，不能为新领域顺手扩枚举

- **Symptom**：两个 board mutation 在 `care_interaction | institution_management |
  publish_process | read_model` 里没有精确对应值。
- **Root cause**：`capability-descriptor.schema.json` 属于 `sharedCorePaths`，
  改它会触发 `changedSharedCore: invalidate_all_surface_contract_evidence`，
  直接作废 T-005 已归档的 G2 Exit 资格。
- **Fix**：使用既有的 care-domain 写入类 `care_interaction`，并把"它不是 T-005
  `CareInteraction` 生命周期"落到可检查的隔离上：独立 command scope、独立 head
  binding、独立 transaction port，以及 committed result 不含
  receipt/publication/visibility 的负向断言。
- **Prevention**：改合同前先查该文件是否在 `sharedCorePaths`。落在 shared core
  的改动要按"作废全部证据"的代价评估，而不是按"加一个枚举值"的直觉。

### 2026-08-02 — 旋转时生成器必须从已发布基线重建

- **Symptom**：连续修改合同 source 并重复 `build:surface-contract` 时报
  `Surface contract content changed without a version rotation from 1.9.0`。
- **Root cause**：`assertVersionRotation` 拿"工作区里已有的生成件"当基线。
  第一次构建已经把生成件写成 `1.9.0`，之后任何 source 改动都要求再次抬版本。
- **Fix**：每次 source 变更后先 `git checkout -- .../generated/` 回到已发布基线，
  再重建一次，得到唯一一个新版本与新 digest。
- **Prevention**：一个 checkpoint 只发布一次旋转。中途改 source 就回滚生成件重来，
  不要靠连续抬版本掩盖。
