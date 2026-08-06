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

### 2026-08-02 — 固定时钟让"谁在什么时刻读的"在测试里消失

- **Symptom**:为"envelope 是一个快照下的一个结果"写的检查,在缺陷被重新引入后**仍然
  通过**。
- **Root cause**:测试用固定时钟(`() => new Date("...")`)。模块自己算出来的 `now`
  与 envelope 的恰好相同,于是"模块盖了自己的时刻"这件事在测试里根本不可观测。
  检查读取次数也不够——次数对了,时刻仍可能各不相同。
- **Fix**:改用**每次调用都前进**的时钟,并让 fixture 记录每个端口方法收到的
  `snapshot_at`,断言它们全等。改完之后证伪立刻成功。
- **Prevention**:凡是断言"同一时刻/同一快照/同一批"的检查,固定时钟会让它变成空断言。
  时间参与语义时,fixture 的时钟必须会走。

### 2026-08-02 — 守卫检查的是"文本里有没有这句话",不是"规则还成不成立"

- **Symptom**:四条守卫可以被一次编辑绕过,而且绕过之后所有闸门仍是绿的。最刺眼的
  一条:fail-closed 迁移门的守卫要求三个字符串出现,而三个**全在异常消息里**——把
  `IF ambiguous > 0` 改成 `IF false` 就彻底关掉了门,守卫毫无察觉。
- **Root cause**:守卫是"对着源文件 grep 关键词"写的。关键词证明的是**有人写过
  这段话**,不是**这段话现在还起作用**。同类:白名单式的表普查永远无法反对多出来的
  表;行正则解析的准入映射会静默跳过读不懂的行;grep 冻结基线 SQL 的守卫在为一条
  已被 `DROP COLUMN` 连带删除的约束背书。
- **Fix**:每条改为钉住**使它成立的那个结构**——条件读的是不是那个 census 变量、
  表集合是不是恰好这一套、准入映射能不能被完整解析(读不懂就报错)、约束在**活库**
  里还在不在。
- **Prevention**:写完一条守卫,立刻问"我怎么在不惊动它的情况下破坏它所守的东西"。
  能想出来就说明守错了地方。这轮五条守卫全部用**当初制造该缺陷的同一手法**证伪过。

### 2026-08-02 — 两侧各自闭环的测试,抓不到交界处的错

- **Symptom**:owner 仓储与 domain 规则各有一套完整测试,全绿;但两条 lane 的答序
  和它们 binding 宣称的 order 不是一回事,而且一次被否决的归属会让照片永久不可发布。
  两个都是交界处的错,两侧的测试都看不见。
- **Root cause**:domain 套件拿**手写事实**喂规则,owner 套件拿**手写期望**对仓储。
  每一侧都在验证自己对交界的想象,而不是交界本身。
- **Fix**:两层跨界检查。一层把真实 owner 的输出按 binding 发布的 order 字符串
  **解析出来的**比较器验单调(手写比较器在常量改掉后仍会通过,那正是要抓的漂移);
  一层把真实的 `ReleaseFactsV1` 喂给 `derivePublishEligibility` 看结论。
- **它立刻抓到了东西**:三个仓储把 `before` 的形状内联重写成 `{occurred_at,id}`,
  接口新加的 `rank` 项在仓储侧被静默丢掉。
- **Prevention**:凡是"A 侧产出、B 侧消费"的形状,除了各自的测试,必须有一条把 A 的
  真实输出送进 B 的检查。这和 `phase-3-typed-results`(运行时输出 ↔ 已注册 schema)
  是同一条规律的第二次应验。

### 2026-08-02 — 声明的排序里有 cursor 无法续页的首项

- **Symptom**:`child_label_asc,occurred_at_desc,id_asc` 与
  `state_rank_asc,occurred_at_desc,id_desc` 两个 order 常量,首项都不在
  `BoardSortKeyV1{occurred_at,id}` 里。binding 对外宣称的顺序因此不可能是分页
  实际走的顺序,续页会跳行或重复。
- **Root cause**:order 字符串是给人看的产品意图,sort key 是给机器用的续页键,
  两者从来没有被同一条检查约束过。
- **Fix**:给 sort key 加可选的 `rank` 首项,owner 按声明序出行,"严格晚于此位置"
  写成展开的字典序比较(方向混合,单个行比较表达不了)。
- **Prevention**:声明一个 order 时先问:它的每一项都能放进 cursor 吗?放不进的
  首项等于没有声明。

### 2026-08-02 — 一刀切的兜底分支会给事实贴上它没有的标签

- **Symptom**:`dataClass === "child_growth_record" ? ... : "daily_care_log"` 把
  七个 data class 折叠成两个;`kind === "voice_transcript" ? ... : "teacher_text"`
  把照片当成文本送进安全评估。
- **Root cause**:两处都是"目标词汇比来源词汇小"时顺手写的三元兜底。同一次实施里
  我已经用 `satisfies` 显式全映射正确处理过 attention priority 和 attribution
  source——问题不在不知道怎么做,在于兜底分支写起来太顺手。
- **Fix**:能映射的用 `satisfies` 约束的全映射;不能映射的(不可发布的 data class)
  在查询层排除,而不是贴上一个它没有的类别。
- **Prevention**:看到 `? :` 的 else 分支落在一个**具体的业务值**上就停下来——
  那不是默认值,那是断言。

### 2026-08-02 — 生成出来的迁移是草稿,不是证据

- **Symptom**：`prisma migrate diff` 为"退役 legacy 枚举、换成新生命周期枚举"生成的
  是 `DROP COLUMN status` + `ADD COLUMN lifecycle NOT NULL DEFAULT …`。它跑得通,
  而且看起来干净——代价是把 legacy `hidden`/`deleted` 行静默塞进某一个新值。
- **Root cause**：diff 工具只对齐 schema 形状,不知道哪些旧值的语义需要证据才能判定。
  domain 侧的 `mapLegacyMediaAssetStatus` 早就是 fail-closed 的,但迁移没有调用它,
  两者从未被放在一起。
- **Fix**：手改为「加可空列 → 回填无歧义值 → 普查剩余 NULL → 有则 `RAISE EXCEPTION`
  中止整个迁移」,两条 gate 分别对应两个 legacy 枚举的映射规则。
- **它被证伪过**：在一次性 scratch 库里插一行 legacy `hidden` media 再重放迁移,
  确认整体回滚并报出行数。没有这一步,"fail closed" 只是注释。
- **Prevention**：凡是有 legacy 行的枚举/状态迁移,先问"哪些旧值无法从行内推出新值",
  再把那批行写成一条会中止的普查。生成的 SQL 一律当草稿读。

### 2026-08-02 — schema delta 落库了,镜像它的手写类型没跟上

- **Symptom**：`NurtureGrantDataClass += child_growth_record` 落库后,
  `packages/nurture-db` 编译失败——Prisma 生成的枚举不再可赋值给 domain 侧的同名
  联合类型。
- **Root cause**：`institution-context.ts` 里手写了一份镜像联合,它是第二个 SSOT,
  但没有任何检查把它和 Prisma 生成物绑在一起;只有 typecheck 恰好会撞上。
- **Fix**：扩展 domain 联合。更重要的是记住:schema delta 的完成标准包含"所有镜像
  该枚举的手写类型"。
- **Prevention**：改共享枚举时,先 `grep` 该类型名。typecheck 这次抓到了,是因为两侧
  恰好在同一个赋值点相遇;若某个镜像只被内部使用,它会静默漂移。

### 2026-08-02 — 新事实类型会继承既有表上的 CHECK

- **Symptom**：给 `NurtureChildLinkReceipt` 加了 `publication_release` source type
  后,第一条测试用的 Receipt 直接被 T-005 的 `ck_nurture_receipt_route_lifecycle`
  拒了。
- **Root cause**：把"扩展枚举"当成了纯加法,忘了这张表上还有一条管辖全部 source type
  的生命周期 CHECK——`delivered` 必须带齐 grant/enrollment/data class/target scope/
  `delivered_at`。
- **Fix**：按约束写 Receipt,并把正反两例都固定在 DB 测试里,供 B2 的
  `commitTargetRelease` 直接照抄形状。
- **Prevention**：往既有表加枚举值时,先读该表全部 CHECK,而不只看列定义。
  additive 只对列成立,对约束不成立。

### 2026-08-02 — "typed result" 说了四个 checkpoint,却从来没有被检查过

- **Symptom**：G3-A～G3-D 每一格都声称能力返回 typed result,合同侧 schema 编译通过、
  运行时侧单测通过,但没有任何一条检查把二者放在一起跑过。
- **Root cause**：两侧各自有守卫,交界处没有。schema 校验器只编译它实际用来校验
  文档的那些指针,运行时测试只断言自己关心的字段,中间那层"运行时输出是否满足
  已注册 result schema"无人负责。
- **Fix**：新增 `phase-3-typed-results.test.ts`,为每个已注册 T-006 capability
  准备运行时生产者,按 descriptor 的 `resultSchemaRef` 用 Ajv 严格校验实际 payload;
  没有生产者的 capability 让普查失败。同一套件顺带把 19 个此前无人引用的
  `*_CAPABILITY` 常量双向绑定到注册表。
- **它立刻抓到了东西**：`query-guardian-current-focus` 的 `focusCard` 条件式在严格
  模式下根本编译不过(`then` 里 `required` 的属性没在同一子 schema 声明),
  以及 `organize_care_capture_batch` 的已注册 result 没有任何生产者。
- **Prevention**：凡是"A 侧声明、B 侧实现"的合同,守卫必须跨过交界。各自侧的检查
  再多也只是证明各自自洽。写完一个 schema 就问:哪段代码会被喂给它?

### 2026-08-02 — 同一个概念在不同模块发出两种不可互换的 ref

- **Symptom**：publish target 在草稿卡片是 sealed ref、在 eligibility/release 是
  opaque ref;publication 在结果里是 opaque ref、在输入解析处是 sealed ref。
  后者更严重——客户端拿到的 `publicationRef` 永远无法回传给
  `remove_publication_target_visibility`。
- **Root cause**：ref 发放散落在各模块,每处按当时的直觉选 opaque 还是 sealed,
  没有"一个概念一个发放器"的约束。跨模块的 ref 相等性没有任何测试覆盖。
- **Fix**：每个概念一个导出发放器(`issuePublishTargetRef` 用 opaque,
  `issuePublicationRef` 用 sealed 因为它确实被当输入接受),所有调用点改走它;
  发放器放在两侧共同依赖的模块里,避免 lane 之间反向依赖。
- **Prevention**：新增一类公开 ref 时,先决定它是否会被回传;然后只写一个发放器
  并从共享模块导出。不要在使用点直接调 `issueBoard*Ref` 加字面量 kind。

### 2026-08-02 — 冻结的 adoption set 漏了两个必需的能力身份

- **Symptom**：G3-C 的计划文本要求"从单张卡片 detach、未发布 asset 全局
  discarded",但 06 冻结件的 Capability Adoption Set 里 G3-C1 只保留了三个
  attribution key,没有为这两个动作预留身份。
- **Root cause**：adoption set 是按"能力"枚举的,而 detach/discard 在设计文本里
  是以"产品删除的三个阶段"描述的,枚举时被归进了 media lifecycle 而没有单独成键。
- **Fix**：分两步。先在 G3-C1 实现并测试两者的领域规则
  (`evaluateMediaDetach` / `evaluateMediaDiscard`),但**不**注册未被冻结件保留的
  key,把缺口显式记进实现说明与 checkpoint 结论;随后 2026-08-02 的 adoption-set
  增补把 `detach_publish_process_media` 与 `discard_media_asset` 补入 G3-D,
  并在冻结件里写明它们是发布前动作、只是与 G3-D 同批交付。
- **Prevention**：冻结 adoption set 时按"用户能触发的动作"过一遍设计文本,
  而不是按事实模型过。发现缺口时宁可显式记账,也不要顺手发明一个未冻结的身份。
  更重要的是,这条缺口本身没有机械兜底——`verify:g3-0-freeze` 现在会遍历冻结件
  adoption set 里的每个身份,要求它要么已注册在 `1.0.0`,要么显式列为未实现,
  所以"冻结件写了但没人跟踪"这类缺口不会再靠人读文档发现。

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

### 2026-08-03 — 幂等的"已经做过了"需要一个它自己的时刻

- **Symptom**:`cancel_publish_process` 的 `already_satisfied` 分支要返回冻结 schema
  要求的 `cancelledAt`,而 `nurture_publish_process` 根本没有这一列。
- **Root cause**:能力被设计成幂等的,但承载它的事实只记了**状态**,没记**时刻**。
  最顺手的替代品是 `updated_at`——任何别的写都会推动它,于是重放会报出一个取消并未
  发生的时刻。这与"`? :` 的 else 落在具体业务值上就是断言"是同一种错误:一个看起来
  像默认值的东西,其实在宣称一件没有证据的事。
- **Fix**:加 `cancelled_at`(可空,只有 cancelled 行有这个事实),迁移带按行普查的
  `RAISE EXCEPTION`——历史 cancelled 行推不出取消时刻,所以是中止而不是回填——再加
  一条 CHECK 长期维持。
- **它立刻抓到了东西**:两个既有 DB fixture 直接 seed 了没有取消时刻的 cancelled
  process,即在造一个写通道永远产生不出来的状态。
- **Prevention**:设计一个幂等能力时,先问"重放要回答什么",再问"哪条事实能证明它"。
  答不上来的字段就是缺一列,不是缺一个默认值。

### 2026-08-03 — 让"引擎接不住的 key"变成编译错误,而不是运行时兜底

- **Symptom**:准入表(transport 的 key→version 字面量)与引擎能服务的能力集合,此前
  只靠一条脚本普查对齐;而 `prepare` 的 `switch` 连 default 都没有,一个漏网的 key
  会让它返回 `undefined`。
- **Root cause**:两个集合的一致性写在**检查**里,不写在**类型**里。检查能被绕过,也
  只在有人跑它时说话。
- **Fix**:每个 key 一个 `{prepare, build}` 描述表,整张表
  `satisfies Record<HarnessCapabilityKey, …>`。两个方向都成为编译错误:多一个 key
  没有描述、少一个 key 有描述,都过不了 `pnpm typecheck`。
- **它立刻抓到了我自己**:先写描述表、后改准入表,`cancel_publish_process` 当场报
  "does not exist in type Record<…>"。
- **Prevention**:当"A 集合必须等于 B 集合"能用类型表达时,就不要用脚本表达。脚本普查
  留给类型系统够不着的地方(生成物、文档、数据库)。

### 2026-08-03 — 比 head 只比交集,等于不比

- **Symptom**:写工厂里的 head 比较最初写成"遍历 expected,owner 没报的就跳过"。
- **Root cause**:看起来像宽容,实际是"owner 不再报这个 head 就不检查它"——而 owner
  不再报某个 head,正是漂移最该被抓住的形态之一。
- **Fix**:比键集的并集,任一侧缺失即冲突,两个方向都失败关闭。
- **Prevention**:凡是"把冻结的值和当前的值对起来"的检查,先问"如果一侧少了一项会
  怎样"。答案是"就不比了",这条检查就还没写完。

### 2026-08-03 — "不存在"和"刚刚创建"不能编码成同一个数

- **Symptom**:`publish_edit_hold must_equal` 在没有 hold 时要冻结一个值,自然编码是 0;
  而 `aggregate_version` 默认也是 0。
- **Root cause**:哨兵值取自与真实取值同一个域。于是一个按"没有 hold"准备的 acquire,
  在同班另一位老师刚拿到 hold 之后仍然通过头部检查,把对方的 hold 覆盖掉——这正是这个
  头存在的理由。
- **Fix**:让哨兵对真实行不可达。默认值改 1,加 CHECK 把下界钉在数据库里,迁移带按行
  普查中止。"0 表示不存在"从约定变成保证。
- **Prevention**:选哨兵值时先问"真实数据能不能取到它"。取得到就不是哨兵,是巧合。

### 2026-08-03 — 一次判定读了两个时钟

- **Symptom**:owner 按传入的 `at` 过滤过期 hold,而头部比较、规则判定与写入各自
  又读一次 `new Date()`。
- **Root cause**:"现在"被当成随处可取的常量。实际上一次判定里的每一次取值都是不同的
  瞬间,于是 owner 认为还在的 hold,规则可能认为已经过期——同一行、同一次请求,两个结论。
- **Fix**:owner **回报它读取的那一刻**,facts 带着 `read_at` 走完全程;过期与新窗口都
  从这一刻起算。
- **它被证伪过**:同一行 hold、同一条命令,只把 `read_at` 推过到期时刻,结论从
  `held_by_other` 变成 `ready`。两者可区分,断言才不是空的。这是"固定时钟让断言变空"
  那条的另一面:不是时钟不动,是时钟太多。
- **Prevention**:一次判定只允许有一个"现在"。它应该随事实一起传递,而不是在每个用到
  它的地方各自取一次。

### 2026-08-03 — 测试绿着,是因为两列碰巧装了同一个字符串

- **Symptom**:draft 重放的 owner 测试一直通过,而重放查找本身是死的——它按
  `organizer_input_revision` 查 command id。
- **Root cause**:fixture 的 `organizerInputRevision` 写的是 `"organizer:1"`,测试传的
  `command_request_id` 也是 `"organizer:1"`。两个含义完全不同的列恰好相等,于是错误的
  查找返回了正确的行。
- **Fix**:先断言"用装配谱系当命令 id 必须查不到",再写入真正的命令哈希去查。
- **Prevention**:测试里出现两个不同概念用同一个字面量的时候停下来。它们相等通常不是
  简洁,是把一次巧合当成了证据。

### 2026-08-03 — 两个空集合比较起来永远相等

- **Symptom**:写命令工厂的头部比较对两个空 map 返回 true,所以一条漏写 head 的能力
  **无条件通过**头部比较。
- **Root cause**:比较的是"两边碰巧有哪些键",而不是"这条能力声称冻结哪些键"。没有
  任何地方说得出预期的键集,于是"一个都没有"和"全都对上了"在实现里是同一个结果。
- **Fix**:让键集**被声明**——`head_keys` 写在定义里,工厂断言两侧产出恰好等于它;
  再加一条跨界检查把它绑到注册表的 `must_equal` 声明上,空集必须具名豁免,而过期的
  豁免同样失败。
- **副产物**:声明断言使原来的并集比较变成不可达。**死掉的防御代码和守不住的检查是
  同一种问题**,所以收敛成一条。
- **Prevention**:一条比较型的检查,先问"两边都为空时它说什么"。答案是"通过",这条
  检查就还缺一个来自外部的期望值。

### 2026-08-03 — 端口返回历史,规则却当它是现状

- **Symptom**:归属规则四处 `.find()` 按孩子取第一条,而读端口按修订号升序返回全部
  修订——规则读到的永远是最旧的那一版。
- **Root cause**:端口和规则对同一个字段有两种理解(历史 vs 现状),而两侧的测试各自
  只验证自己那一种。owner 套件甚至把"返回两条修订"钉成了期望值。
- **Fix**:在**读端口**归约成每个孩子一条当前事实——顺序是端口自己的契约,在每条规则里
  各自 reduce 会制造第二处可能不一致的地方。并加一条把真实 owner 输出喂进规则自己那个
  `find` 的跨界检查。
- **Prevention**:一个返回集合的端口,契约里必须写清它是**历史**还是**现状**。消费侧
  用 `find`/`[0]` 取值,就是在假设后者;这个假设没有写下来时,两侧都会觉得自己是对的。

### 2026-08-04 — 证伪轮先于测试存在,守卫才算存在

- **Symptom**:supersede 的 to-child 迁移守卫(复核 finding 6)落地后,按惯例撤掉它
  验证——**测试仍然全绿**。
- **Root cause**:修复和它的覆盖是两件事。守卫写对了,但没有任何测试走到"to-child
  当前事实是终态"的分支,于是它是一段没有证人的正确代码——下一次重构可以无声删掉它。
- **Fix**:先补覆盖(rejected 与 superseded 两个终态),再重跑证伪,CAUGHT。
- **Prevention**:证伪不是修复的验收,是**覆盖**的验收。每条新守卫落地后立即撤一次;
  绿着就说明缺的是测试,不是运气。

### 2026-08-04 — 守卫技术要匹配泄漏通道:被 catch 吞掉的异常探测不到越界调用

- **Symptom**:B5 用「被调用即抛」的 fixture 断言 ordinary 路径不咨询 T-005 资格,
  证伪(把资格读取挪到路由判定之前)后 25 个测试**仍然全绿**。
- **Root cause**:resolver 按设计吞掉端口异常转 `dependency_no_go`(fail-closed 是
  对的),于是 throwing fixture 的信号在到达断言之前就被合法地消化了。守卫依赖的
  信号通道(异常传播)恰好被被测代码的正确行为切断。
- **Fix**:换成计数端口,断言 `calls() === 0`;再证伪,CAUGHT。
- **Prevention**:选守卫技术时先问:**缺陷发生时,信号能否活着到达断言?** 异常会被
  沿途任何 catch 消化,计数、记录参数、副作用探针不会。fail-closed 的代码尤其如此——
  它的健壮性正是吞掉证据的机制。
- **另一条工艺教训**:未提交状态下的证伪回退要用逆向编辑,不能 `git checkout`——
  后者把同文件里未提交的实现一并冲掉(本次 B5 实现被冲掉重写了一遍)。

### 2026-08-05 — "第一个"式解析是一类缺陷,不是一处缺陷

- **Symptom**:双班老师的第二个班在全部能力 lane 不可达;多子女 guardian 的第二个
  家庭在看板上不存在。两个角色、同一个 bug 形状,而且都通过了当时的全部测试。
- **Root cause**:`resolveCaregiverReach` 与 guardian 的 `families[0]` 都是
  "解析出列表、取第一个"。列表可能多于一个元素时,`list[0]` 就是一个未声明的
  产品决定——而调用方以为自己拿到的是"the reach",不是"某一个 reach"。
- **Fix**:拆成两个正确形状——`resolveReaches`(全部,供列表并集)与
  `resolveReachFor(精确 id)`(供行范围授权);"第一个"只允许留在明确声明为
  单绑定 posture 的表面(看板默认),并注释禁止能力 lane 使用。
- **Prevention**:任何返回 `T | null` 的解析函数,如果内部出现 `[0]`,先问:
  列表能否合法地多于一个?能,就是这类缺陷的温床——把复数形状显式化。

### 2026-08-05 — 选择可以跨越绑定时,绑定必须跟着选择走

- **Symptom**:独立 activity 查询按 B 家庭的 enrollment 选项服务 B 的行,但
  drift heads、snapshot version、scopeRef、游标身份全部来自默认绑定的 A 家庭——
  B 家庭的 redaction 永远作废不了打开的 B 页集,恰恰违反 redaction census
  存在的目的。同一缺陷在 envelope 的自动默认选择里再现一次。
- **Root cause**:重绑逻辑只写在一个调用点(envelope 的显式选项分支)。凡是
  "先加载 scope、再解析选择"的路径,选择跨出绑定后,所有从 scope facts 派生的
  值都成了另一个聚合的值——派生点有多少个,缺陷就复制多少份。
- **Fix**:重绑下沉到每个消费点自身:查询在解析出选择后、派生任何东西之前
  重载 scope facts;envelope 先算选择(显式或自动唯一)再统一重绑。
- **Prevention**:引入"选择器"时列出全部从旧绑定派生的值(refs、heads、
  版本、census、游标身份),逐个确认它们在重绑后派生。漏掉的每一个都是一个
  "标签是 A、内容是 B"的潜伏缺陷。

### 2026-08-05 — 证据普查必须观察执行,不能观察源码

- **Symptom**:owner-integration 普查用字面量 grep 判定"该能力有端到端证据";
  `query_caregiver_teacher_board` 唯一的出现处是一条**拒绝**测试,普查照样绿。
- **Root cause**:源码里出现 key ≠ 该 key 在真实路径上成功执行过。注释、
  skip 块、拒绝断言、未执行的数据结构都含有字面量。
- **Fix**:e2e 运行时逐 key 记录实际结局(action 须有 committed 执行、query 须
  有 ok 读取)写入产物,普查读产物。新普查当场又抓出 `reject_child_media_attribution`
  同样只有拒绝覆盖——一个仪器换对了,第二个病灶立刻显影。
- **Prevention**:任何"X 已被 Y 覆盖"式的机械普查,先问信号来源:静态文本只能
  证明"被提到",只有运行时记录能证明"被执行"。(与 08-04 的"异常被 catch 吞掉"
  同属一类:守卫技术必须匹配信号通道。)

### 2026-08-05 — 冻结值必须整组读取，不能用相邻聚合字段补洞

- **Symptom**:持久化已经有 `schedulePolicyVersion` 和 `scheduleResolvedAt`，release
  读取却返回 `PublishProcess.aggregateVersion` 与 `updatedAt`；类型形状正确，语义身份
  错误，策略 drift 判断会拿错 head 的来源。
- **Root cause**:schedule 在多个 repository 内各自拼装，partial NULL 检查和字段映射
  被复制；“都是 number/date”让 TypeScript 无法区分聚合版本与策略版本。
- **Fix**:建立唯一 `readResolvedPublishSchedule`，把七个字段视为 all-or-none 值；任一
  缺失即 fail closed，并只返回实际持久化的 policy version/resolved-at。迁移同时把
  数据库 check constraint 扩为同一七字段约束。
- **Prevention**:跨 owner 冻结值需要一个共享 reader 和数据库 all-or-none constraint；
  不允许调用点用相邻聚合的“看起来同型”字段补默认值。

### 2026-08-05 — 精确持久化普查是 schema 变更的显式登记点

- **Symptom**:新增合法的 T-007 policy owner table 后，`verify:g3-0-freeze` 立即失败，
  虽然 Prisma validation 和全部单元测试通过。
- **Root cause**:该 guard 的 persisted-table census 是冻结 allowlist，不会从 schema
  自动接受新表；这是刻意的治理边界，不是生成器漂移。
- **Fix**:把 `NurtureInstitutionPublicationPolicy` 作为本次 exact owner delta 显式
  加入 census，并重跑 freeze guard。
- **Prevention**:每次新增持久化 owner 都同时检查 schema、migration、DB context 和
  exact table census；不能为了让 guard 变绿而扩大为通配或自动发现。

### 2026-08-05 — 联合测试不能手工伪造中间 owner fact

- **Symptom**:早期 T-007/T-006 e2e 先手工写入七字段 schedule，再验证 reschedule 与
  release；后半段虽真实，仍没有证明 provider 的输出能通过生产 admission 路径成为
  T-006 输入。
- **Root cause**:测试把“准备夹具”误当成“上游能力已执行”，跳过了真正缺失的
  `draft -> pending_release` owner transaction。
- **Fix**:新增 scenario-side queue admission，并把联合旅程改为 formal organize →
  provider-backed atomic admission → formal reschedule → formal release；同一 process
  贯穿全链。
- **Prevention**:联合验证的跨任务交接点必须来自生产 provider/consumer 路径；若测试
  直接 seed 交接 fact，只能标为下游隔离测试，不能计作 joint conformance。

### 2026-08-05 — 历史授权字段缺失不能解释为仍有效

- **Symptom**:release 读取在 `authorizingRoleAssignmentId` 为 NULL 时返回
  `authorizing_role_current=true`，且非空时只检查时间窗，没有验证 role、scope 与
  Participant currentness。
- **Root cause**:兼容旧夹具的便利逻辑进入了生产事实解释，形成 fail-open。
- **Fix**:缺失直接返回 false；非空必须是同一 Workspace/CareGroup 的 current
  caregiver/lead_caregiver assignment，且 Participant current。
- **Prevention**:用于未来自动执行的授权 episode 必须精确重读；缺失、错误 scope、
  错误 role 或主体失效都属于授权不可用，不能以历史兼容为默认值。

### 2026-08-05 — Host timer 只能提供触发身份，不能提供策略事实

- **Symptom**:`resolveOrganizeTrigger` 虽然通过 owner port 读取 capture source，却仍要求
  caller 同时传入 `policy`；T-007 owner read 的结果被忽略，idle/fallback 可以被 host
  提供的 timezone/head/threshold 驱动。
- **Root cause**:早期 isolated-domain API 把 fixture policy 当作依赖注入，provider 落地后
  没有把该参数从生产边界删除。
- **Fix**:resolver 只接受 trigger kind/identity，策略只能来自同次 owner read；缺失时以
  `policy_unavailable` fail closed，并增加 persisted-provider → idle/fallback/watermark/replay
  DB 联合用例。
- **Prevention**:provider 落地时不仅替换 repository，还要删除 consumer 边界上的同名
  caller 输入；测试夹具可构造 owner fact，但生产函数签名不能继续接受替代 authority。

### 2026-08-05 — 已计算的 trigger evidence 必须作为事务输入落库

- **Symptom**:manual organize 已计算 exact T-007 policy、timezone、quiescence 与 activity
  head，但 owner write 仍硬编码 `resolvedTrigger=manual`，其余证据列保持 NULL；纯函数
  测试正确，持久化后的批次却无法证明自己在哪个 policy head 下切出。
- **Root cause**:write port 只接收 watermark，没有接收 authorize 阶段已经冻结的 trigger
  evidence，repository 只能靠路由名称猜测。
- **Fix**:将实际 trigger 与 durable evidence 作为 `applyOrganizeCut` 的显式输入，并与
  batch CAS、process/revision/targets 一起提交；端到端断言 exact ref/head/timezone/gate/
  activity head。
- **Prevention**:authorize 阶段产生且用于“不被后续策略重解释”的证据，必须显式进入
  owner transaction；repository 不得从 capability key、调用路径或默认值重建。

### 2026-08-05 — 家庭摘要不能拿内部幂等键充当安全文案

- **Symptom**:`PublicationRelease` 已正确写入 Receipt，但 guardian activity repository
  把 `PublishProcess.processKey` 直接放进 `summary`；原有 e2e 在 release row 处结束，
  没有读取家庭投影，因此 raw key 泄漏未被发现。
- **Root cause**:owner reader 缺少 protected-content port，使用“非空且稳定”的内部键
  填补用户文案；opaque ref 保护了 `activityRef`，却没有保护普通字符串字段。
- **Fix**:guardian reader 只从 current frozen revision 的 title envelope 解封安全摘要，
  无密钥/非法 envelope 返回空串；联合旅程延伸到 delivered Receipt + guardian reread，
  并扫描 process/release/receipt/enrollment raw ids。
- **Prevention**:跨 owner 旅程必须在最终消费者投影结束，不能以中间事实表落库作为终点；
  user-facing string 也必须接受与 ref 字段相同的 raw-identifier 泄漏审计。

### 2026-08-05 — 验证的 pin 路径必须与运行时 link 指向同一 source

- **Symptom**:T-005 slice/core 静态守卫仍绿，但 live workflow pin verifier 拒绝当前
  sibling revision；若继续运行 scenario-service，pnpm link 会加载这个浮动 sibling，
  “real pinned owner path”只剩文案。
- **Root cause**:owner-integration runner 先前只读 artifact manifest，不先验证相邻
  Base/My-Chat revision/source population，也未证明 verifier 与 runtime dependency 同源。
- **Fix**:runner 在数据库测试前强制执行 workflow/source pin 与 G2 Exit guard；正式
  G3 qualification 使用相邻 exact detached worktrees，pnpm link 与 verifier 自然指向
  同一冻结 checkout。
- **Prevention**:联合资格化不能把“pin 文件存在”当作“运行使用了 pin”；必须同时证明
  revision/hash 和实际 module resolution topology。

同一轮 detached rehearsal 还暴露了入口本身的空跑风险：macOS 的 `/tmp` 与
`/private/tmp` 指向同一位置，verifier 却用未 realpath 的字符串判断
`process.argv[1] === import.meta.url`，导致脚本在 `/tmp` checkout 中静默退出 0。
入口判断已改为 filesystem realpath 比较，并用 symlink alias 回归用例钉住；CLI 工具的
“exit 0”只有在 `main` 确实执行后才可作为证据。

### 2026-08-05 — frozen install 后的类型检查不能假设 Prisma client 已存在

- **Symptom**：exact detached aggregate typecheck 首次失败，My-Chat 与 Nurture
  dev-host 的生成类型缺失。
- **Root cause**：资格化刻意用 `--ignore-scripts` 做 frozen install；这也跳过了平时可能
  隐式生成 Prisma client 的生命周期脚本。
- **Attempts**：先运行 aggregate typecheck 暴露缺失；没有通过放松类型或改用浮动
  `node_modules` 绕过。
- **Fix**：以不连接数据库的 qualification-only 配置显式生成 My-Chat、Nurture SSOT
  与 Nurture dev-host 三套 client，再重跑类型检查并通过。
- **Prevention**：clean/frozen 资格化清单必须把每个 schema 的 generate 列成显式步骤，
  不依赖 install side effect。

### 2026-08-05 — “未知能力”测试值不能取自正在扩展的生产命名空间

- **Symptom**：`harness-controller.e2e` 的未知写能力负例在 exact run 中不再未知，
  因为 `release_publish_process` 已正式路由。
- **Root cause**：测试把一个当时尚未实现、但已在产品 adoption set 中的真实 key 当作
  永久 sentinel。
- **Attempts**：完整 owner-integration 首次运行如实失败；没有删除负例或降低 ingress
  断言。
- **Fix**：改用明确保留给测试的 `unregistered_write_capability`，目标拒绝语义不变。
- **Prevention**：unknown-key 用例使用永不进入 registry 的测试专名，并由 formal ingress
  census 独立证明所有真实 key 的路由状态。

### 2026-08-05 — 联合旅程必须区分 public DTO 与 Prisma 行字段

- **Symptom**：数据库联合旅程读取 Receipt 时断言不存在的 `logicalStatus`，同时 organize
  execute 还提交了调用方不应拥有的 `expected_batch_version`。
- **Root cause**：测试把 public Receipt DTO 命名投射到 Prisma `Receipt.status`，并把
  confirmation 冻结的 owner head 又错误放回 operation input。
- **Attempts**：exact detached DB run 在真实 Prisma 类型/输入校验处暴露两处错误；没有
  用类型断言或放宽 schema 掩盖。
- **Fix**：持久化断言改读 `status`；organize execute 删除 forbidden head，让版本只从
  confirmation owner evidence 进入事务。目标用例及完整 55-test owner suite 均通过。
- **Prevention**：跨层 e2e 分别按 public contract 与持久化 schema 命名字段；owner-frozen
  heads 只在 prepare/confirmation 边界出现，client operation input 不重复提交。

### 2026-08-05 — 共享 revision 必须先冻结，再产生任何逐目标 effect

- **Symptom**：两个首发 target 可以各自写入 Receipt/Release/CommandExecution，随后都
  对 `frozenRevisionId IS NULL` 做一个不检查 count 的更新；并发时不同 revision 的 effect
  可能共存，而 process 最终只显示其中一个 frozen revision。
- **Root cause**：freeze 被当作 effect 后的状态同步，而不是 effect 的前置所有权 CAS；
  `updateMany` 的零行结果被忽略。
- **Attempts**：顺序 fan-out 和单 target replay 全绿，但它们没有制造两个首发事务的
  interleaving，因此不能证伪该竞态。
- **Fix**：逐 target 使用 Serializable transaction；先按 exact pending/current/unfrozen
  条件 CAS 到 released/frozen，`count === 1` 后才写三个 effect；后续 target 只能绑定
  exact frozen revision，`P2034` 有界重试。
- **Prevention**：凡是“首个子 effect 冻结父聚合”的模型，freeze CAS 必须排在 effect
  前且检查 affected-row count；资格测试必须包含同父聚合的真实并发首发。

### 2026-08-05 — preview 事实不是 effect authority

- **Symptom**：T-007 policy、原始 authorizing role、edit hold、schedule 与 media 在
  `loadReleaseFacts` 中判断，逐 target transaction 只重读 executor/Grant/Enrollment；
  prepare 到 effect 之间的撤权或 revision drift 仍可能放行发布。
- **Root cause**：把“给用户看的可发布预览”误当成“提交瞬间仍然成立的授权事实”，
  事务边界只包住写入，没有包住决定写入是否合法的全部读。
- **Attempts**：先补单项顺序负例只能证明 repository 会读取该字段，不能证明读与 effect
  不可被并发变更拆开。
- **Fix**：effect transaction 内按 exact process scope 重读 policy/schedule、executor、
  original authorizer、hold、Grant/Enrollment、receipt census 和 frozen media；共享
  eligibility derivation 避免 preview/commit 规则复制。
- **Prevention**：列出每个 effect 的 authorizing fact，并要求它们与 effect 在同一隔离
  边界内读取；外层 prepare 只负责 UX 和 confirmation，不承担最终 authority。

### 2026-08-05 — 缺失证据不能编码成可哈希的空值，也不能被过滤成“无对象”

- **Symptom**：receipt-less release 被映射为 `receipt_ref: ""` 后仍可生成合法-looking
  opaque ref；缺失/跨班 media asset 被过滤后，含媒体的 revision 被解释成无媒体；
  organize writer 的 snake_case 数组同样被 canonical reader 读成空 composition。
- **Root cause**：三条路径都把“证据存在但不可用”折叠成空字符串或空数组；下游只能把
  空集合解释为业务上确实没有该对象。
- **Attempts**：类型检查无法区分 `""` 与真实 id，也无法发现合法 JSON 的语义 shape
  不一致；原有 happy-path fixture 使用 canonical shape，未走自动 organize writer。
- **Fix**：缺 Receipt 时省略 committed mapping 并全 process fail closed；缺失/外组 asset
  保留为 unavailable blocker；organize writer 统一 canonical shape 并按 exact CareGroup
  查资产。
- **Prevention**：absence、unavailable 与 empty 是三种事实；owner contract 必须分别表示。
  JSON payload 应只有一个 writer/reader shape，并用生产 writer → owner reader 的 DB 回归
  钉住，不只手工 seed canonical fixture。

### 2026-08-05 — 冲突分类必须来自已提交事实，而不是异常类型本身

- **Symptom**：强制 `CommandExecution` 唯一键冲突时，整个逐目标事务已确定回滚且目标
  `PublicationRelease` 不存在，但实现仍返回 `outcome_unknown`；若直接把 `P2002` 当 replay，
  又会把未发布错误报告成 `already_released`。
- **Root cause**：异常分类没有区分“事务结局未知”和“事务确定回滚”，也没有在唯一键冲突后
  读取目标 release 事实进行 reconciliation。
- **Fix**：`P2002` 后读取 exact target release；存在且身份匹配才按 replay 返回，不存在且事务
  已确定回滚则返回 `command_identity_conflict`。只有数据库无法确认提交结局时才使用
  `outcome_unknown`。
- **Prevention**：幂等冲突的业务结论必须由已提交行证明；异常码只触发 reconciliation，不能
  单独证明“已执行”或“结果未知”。
