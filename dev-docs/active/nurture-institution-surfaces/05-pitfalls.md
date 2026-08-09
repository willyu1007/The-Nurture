# Pitfalls — 机构端双 Surface

## 2026-08-09 — A targeted DB test initially inherited the shared local URL

- **Symptom:** the first exact-owner integration runs created 16 workspaces in
  the repository's default local database instead of the approved disposable
  target. No migration was applied there.
- **Root cause:** the new test was invoked directly before its child process
  rewrote `DATABASE_URL` to the exact disposable database.
- **What was tried:** the affected rows were first enumerated read-only by the
  unique fixture Institution label and creation window; no broad workspace or
  database cleanup was attempted.
- **Fix/workaround:** exactly those 16 fixture workspaces and dependent rows
  were transactionally deleted, then the test gained per-workspace `afterEach`
  cleanup. All later DB commands used the repository environment loader plus an
  exact database-name rewrite and validation.
- **Prevention:** a disposable DB test command MUST validate and replace the
  database pathname before spawning Vitest. A test that can write owner rows
  MUST own deterministic cleanup even when the runner fails between cases.

## Known Guardrails

- 不要把 G4-0 实现成等待全部 freeze rows PASS 的单体串行阶段；只等待当前分支
  所需的 exact contract/fact/schema，其他分支继续按 G1 gates 工作。
- 不要重新把 G4-C 普通 Workbench 运营与 G4-D Enrollment Journey 压成一个不可
  独立验收的交付包，也不要让 Web/mobile 自行解释未冻结的 Workflow 状态。
- 不要把 G4-F 当作首次验证时点；每个 G4-B/C/D/E 分支必须随包完成负向和集成验证。
- 不要把 G4-0A 扩张成全库重审或重新讨论 D-01～D-07G；它只建立后续 freeze 所需的
  exact owner/fact/schema/gate ledger。
- 不要把 Branch Freeze PASS 当成 Owner Integration Readiness、Joint Conformance、
  Beta Handoff 或 capability activation；除 0B publication-policy 快线外，G4-0
  不强制提前完成所有真实 consumer 集成。
- 不要把 active-role/Surface、class activity/revision/attribution 或通用
  InstitutionWorkflow carrier/projection 继续留在正文供实现者自行推断；它们必须
  各自成为 freeze register 的显式记录。
- 不要越过 I0～I4 实施门：Branch Freeze 不证明真实 owner，Owner Readiness 不证明
  六 surface Joint Conformance，Fastify-only evidence 不能完成 T-007。
- 不要用 placeholder、恒 false、synthetic-only adapter 或 safe-unavailable 正常态
  替代任何 required G4 path；default-safe 只适用于明确 optional/deferred 能力。
- 不要把 `PASS_WITH_LIMITATIONS` 用于 required、authority/privacy、安全、事务、
  replay、formal ingress、real owner 或 cleanup 缺口，这些一律 `NO_GO`。
- 不要把 T-007 Beta Profile Handoff 当成 Candidate Freeze、My-Chat native/device
  completion、capability activation 或 traffic authorization；后续组合资格化属于
  T-008。
- 不要因 migration artifact 已实现就对 shared/persistent database apply；G4
  qualification 仅使用 disposable PostgreSQL，其他环境需要独立授权。
- 不要让 T-006 等待 T-007 全任务才实现 scheduled publication；T-007 先交付 exact
  publication-policy owner subset，T-006 保存解析结果与 policy head。
- 不要让 T-007 后续配置变更静默移动既有 `PublishProcess` 的 scheduledAt/notAfter；
  已解析 schedule 只能通过 T-006 显式、授权的重新排期能力改变。
- 不要把可选 `InstitutionWorkflowProjection` absence/empty 当成 T-006 核心
  board/publication 失败，也不要让它与 publication-policy contract 形成同一硬依赖。
- 不要把 institution membership 当作读取全部 child/family facts 的权限。
- 不要通过 aggregate 间接泄漏小样本家庭或孩子。
- 不要聚合家庭 AI 私密正文、未发送草稿或 My-Chat 私人聊天；园区业务沟通必须走
  exact owner-read projection，不能成为 ambient aggregate。
- 不要用园区统一时间线覆盖班级独立日程，也不要假设所有班级同时开展同一活动。
- 不要把“未发现活动记录”显示成“活动未开展”，或把记录数量变成老师绩效。
- 不要让生成式/审美 AI 挑“最佳代表照片”。班级卡使用可选显式封面或确定性最新
  合格照片，并对 source revoke/redaction/reassignment 重新计算。
- 不要要求老师为每个活动额外挑封面；封面只是 Web/既有整理流程中的可选能力。
- 不要在班级卡展示沟通正文、孩子名单、AI 出勤推测、匹配 confidence/embedding 或
  freshness/绩效分数；完整数据属于详情/Web 的精确 owner-read。
- 不要因为 Admin Web 能记录完整照片/文字就允许原地改写老师内容、作者或时间。
  placement/downscope/correction/hide 必须追加 revision 并保留来源历史。Admin-only
  child-attribution 修正只能形成 candidate/WorkItem，由 exact CareGroup caregiver
  确认，不能扩大 audience 或获得 publish eligibility。
- 不要让 My-Chat Web shell 复制照片/文字 canonical facts；完整数据仍由 Nurture
  持有，Web 通过 query/action contract 操作。
- 不要要求老师升级后 Admin 才能查看已明确披露的园区业务沟通。
- 不要把 Admin 的园区业务沟通读取权扩大到家庭私密 AI、草稿、私人聊天、其他
  Institution，或误当成 CareGroup reply/author-change 权限。
- 不要让后置 AI attention 扩大读取范围、保留已 redacted/revoked 摘要、自动回复/
  建 Workflow，或形成情绪/责任/绩效评分。
- 不要让 read-only Admin mobile board 出现隐藏写操作。
- 不要把 Admin mobile 的只读约束误套到 caregiver mobile；老师出勤提交是独立的
  role-bound capability。
- 不要为多角色用户合并 board/Web 权限；必须显式切换 active role。
- 不要把 Lead 当作园区负责人、独立角色或权限捷径。
- 不要让非 Admin 角色进入 `InstitutionAdminWorkbench`，仅隐藏菜单不等于授权。
- 不要把 support signal 设计成排名、绩效或诊断分数。
- 不要使用红黄绿班级状态、跨班/跨老师百分位、历史异常基线或隐藏 AI risk score
  生成 support signal。
- 不要在园区未配置绝对 count/window 时猜测负荷阈值；该类 signal 应保持 disabled。
- 不要让 signal adapter 解析 `checkpoint_ref`/`window_key`，或拿 local date、
  `occurredAt`、`updatedAt`、普通 status 猜 deadline/blocker；这些事实必须由 exact
  owner 显式提供。缺少 owner binding 时返回 unavailable，不能用恒空 placeholder
  冒充完整列表。
- 不要让 AI 决定“需要处理”。只有明确 canonical overdue/blocker 可以进入该级别；
  未来 AI candidate 最多是“建议关注”。
- 不要仅因缺少照片/文字生成 support signal；无记录不等于活动未开展。
- 不要把 signal 复制成长期老师/班级“标红”历史；来源解决或失效后投影应自动消失。
- 不要让 mobile signal 卡产生 dismiss/ack/escalate 隐藏写操作，或自动回复、通知、
  创建 WorkItem/Workflow。处理必须在 Web 通过独立 source action 完成；只有当前
  registry 已注册且业务 eligible 的 Workflow 才能显式启动，普通 signal 不能启动
  Enrollment Journey。
- 不要把 body、孩子名单或个人老师指标放入园区首页 signal；下钻必须重新 owner-read。
- 不要把“有业务记录的孩子数”当作正式出勤人数。
- 不要让 AI 推理或 Admin 代替当前班级老师确认出勤。
- 不要在跨日修订时绕过 Admin reopen 和老师重新提交，也不要丢失 revision 审计。
- 不要因 T-003 的框架 demo 而虚构尚未确认的机构管理功能。
- 不要因为 capability 异步、跨 owner 或需要通知就把它定义为 Workflow；当前 Workflow
  只指园区管理 `InstitutionWorkflow`。
- 不要在第一增量注册多个园区 Workflow；当前只选择完整的
  `EnrollmentJourneyWorkflowV1`，其他事项继续使用 Action/WorkItem/projection。
- 不要把所有等待泛化成“等待期”。`capacity_waitlist` 只表示目标班级满员；等待
  Guardian/caregiver/system、未来日期或 blocker 是独立 state。
- 不要用首次咨询时间预占候补资格；只有家庭明确接受候补、目标班级和最少数据确认
  后才生成 `waitlistQualifiedAt`。
- 不要让候补阶段演变成家庭价值、转化概率或孩子适配排序；AI 不决定候补顺序或
  试入园结果。排序只来自版本化 category policy 与 category 内 FIFO，未配置
  category 时为纯 FIFO。
- 不要静默改写 `waitlistQualifiedAt`、category 或队列位置；Admin 调整必须显式、
  有原因并保留 append-only history。新 policy revision 如何作用于既有队列在 contract
  冻结前不得擅自实现。
- 不要向家庭显示精确名次、队列长度、priority category、排序依据或其他家庭信息；
  家庭只获得自身状态、目标班级和复核/联系时间。
- 不要创建没有 `nextReviewAt` 的无限期候补，也不要因一次未回复自动删除、降级或
  重排；应进入 `waiting_on_guardian` 并执行配置的 reminder/deadline。
- 不要因出现空位自动推进候补、创建 Enrollment/Grant 或发送无期限承诺；先创建
  Admin task，由 Admin 发出限时 offer，并等待 Guardian 明确接受。
- 不要在意向阶段 mint/infer My-Chat child/family identity，或把 provisional record
  当成 Enrollment、binding、Grant 或读取权限。
- 不要在 inquiry 默认收集法定姓名、完整出生日期、健康/过敏等尚无当前 purpose 的
  深层信息；称呼 + 出生月份/年龄段足以支持早期班型判断。
- 不要把 raw phone、WeChat、email 或 account identity 复制进 Nurture Workflow、
  presenter、日志或 AI context；使用 Host-owned contact ref，owner 不可用时 fail closed。
- 不要把 external phone/WeChat manual summary 伪装成 transcript，也不要隐式附加
  recording、screenshot、raw export 或外部 participant roster。
- 不要原地覆盖 external summary；更正必须 append revision 并保留 Admin author/time。
- 不要让 AI 从无 source 的 external note 推断完整沟通、意向等级、家庭价值、转化率
  或孩子适配度；只有可引用 native source 可生成待 Admin 确认的 summary candidate。
- 不要因新 inquiry、AI summary、next-follow-up 或多次未回复自动推进/降级 stage；
  `inquiry → intent_conversation` 是独立 Admin action。
- 不要让只有 local provisional record 的孩子进入实际试入园；真实照护前必须完成
  Guardian-authorized My-Chat Child/Family、current binding/association、
  pending Enrollment/Grant 和 exact CareGroup assignment，再由 trial-start commit
  写入 `status=active, participationPhase=trial`。
- 不要建立 TrialChild、独立 trial consent/media/attendance/retention pipeline 或
  caregiver Web/表单；老师继续使用普通 role-bound mobile，Workflow 只引用授权事实。
- 不要向现有 `NurtureEnrollmentStatus` 增加 `trial`，或把
  `participationPhase=trial` 当作 authority。真实 trial/formal relationship 都使用
  `status=active`，仍需 binding、Grant、CareGroup、purpose 和 source-lifecycle。
- 不要把试入园孩子排除在当天照护安全人数或真实出勤之外，也不要在转正式前把其
  计入 formal Enrollment 总数。
- 不要在 `participationPhase: trial→formal` 时复制 child、media 或 care facts；
  更新同一关系并保留连续 provenance。退出时也不得用删除历史代替
  status/assignment/Grant lifecycle。
- 不要让同一个名额同时进入多个 trial offer/reservation；接受 trial 后旧 waitlist
  entry 应关闭，名额保持占用直到明确延长、正式激活或结束。
- 不要让 trial-start 前的 Guardian withdrawal 留下永久 reservation，也不要要求
  尚不存在的 Enrollment/Grant/CareGroup 先执行 end-trial；
  `cancel_trial_preparation` 应关闭 shell 并释放占位。
- 不要把 `reviewAt`/`trialEndsAt` 当作自动转换定时器；到期只生成 Admin task/signal，
  不自动录取、结束、释放名额或联系下一位。
- 不要让过期 trial 在没有显式延期时继续安排照护，也不要在复盘未决时把名额再次
  承诺给其他家庭。
- 不要要求 caregiver 填写试入园评分表，或让 AI 判断“是否适合”、推荐录取/结束；
  复盘复用既有事实，由 Admin 作三选一的人类决定。
- 不要在 trial 结束后恢复旧 `waitlistQualifiedAt` 或名次；重新等待需要新的
  qualification，例外通过可审计 override。
- 不要把 My-Chat currentness revalidation 与 Nurture commit 描述成一个 distributed
  transaction；两者是有明确失败边界的顺序 owner operation。
- 不要在 Guardian 接受正式方案前、使用 stale/cached owner evidence、或只完成部分
  Grant/CareGroup 写入时标记 active。
- 不要在 activation 失败时释放 reservation、扩大权限或显示半完成 active；保留
  `status=active + participationPhase=trial + reserved`，把 pending/waiting 放在
  Workflow 并幂等重试。
- 不要让 mobile/Web/notification 各自猜测 activation；只能消费 Nurture commit 后
  的同一 canonical lifecycle。
- 不要让 My-Chat owner outage 阻止 Nurture 本地降权 exit，也不要把下游 task/
  notification 失败当成重新开放照护权限的理由。
- 不要因 end trial 删除 My-Chat Child/Family/membership/binding、Nurture association
  或历史 care facts；binding/history 不等于当前 authority。
- [SUPERSEDED by D-07F] 原口径要求不要在 Enrollment 激活时结束 journey，并把适应期
  作为后续业务阶段；现已明确 trial 本身就是适应期。
- 不要在正式激活后再增加 settling period、额外 caregiver/Guardian 反馈表或 Admin
  完成门；需要继续观察时必须在激活前显式延长 trial。activation delivery/replay
  只可产生 technical waiting，不得伪装成新的业务阶段。
- 不要把 Workflow 完成后的正式离园重新塞回 Enrollment Journey；它是普通 Enrollment
  lifecycle maintenance，不默认产生第二个 Workflow。
- 不要把当前顶层阶段标签误作 public enum/schema；Pre-implementation Contract
  Freeze Register 未通过前 implementation activation 保持 NO-GO。
- 不要让 Admin mobile board 拥有或修改 Workflow；它只消费 role-safe projection。
- 不要把相同 institution role 当作读取完整 Workflow 的充分权限。
- 不要用无业务依据的百分比冒充进度；优先展示阶段、里程碑、阻塞和下一步。
- 不要因为园区材料被 AI 引用就把它显示成权威医疗来源。
- 不要在园区材料与权威材料发生医疗冲突时由模型静默拼接或自行裁决。
- 不要让 draft、已撤回/过期材料或未授权 child facts 进入线上 RAG。
- 不要让 RAG 发布知识、确认出勤、执行 Workflow、诊断、处方或替代急救。

## Resolved Pitfalls

### 2026-08-09 — Body-free list reused a protected single-message DTO

- Symptom: the Institution business-communication list was documented as
  body-free but returned a type that could carry protected body envelopes.
- Root cause: exact authorization reuse was conflated with DTO reuse.
- Fix: retain one internal authorized-fact predicate, then present either the
  exact single-message raw DTO or a list DTO with no body field.
- Prevention: protected single-object reads and body-free lists may share
  authorization facts, never their outward DTO.

### 2026-08-09 — Institution local date was interpreted as UTC

- Symptom: captures and communications near midnight could land on the wrong
  class day outside UTC institutions.
- Root cause: several readers created `localDateT00:00Z` independently instead
  of resolving the Institution publication policy's timezone once.
- Fix: resolve one policy-backed local-day context and pass its storage date
  and instant bounds to all detail readers; missing policy is unavailable.
- Prevention: a local date is not an instant. Do not add another UTC day helper
  to an Institution projection or guess UTC when timezone policy is absent.

### 2026-07-30 — 出勤覆盖率被误读为正式出勤

- Symptom：最初讨论可能把“当天有几个孩子存在业务记录”直接呈现为出勤。
- Root cause：混合了运营覆盖 projection、AI inference 和 canonical attendance。
- What was tried：以记录数量自动生成出勤结果。
- Fix：记录覆盖单独展示；AI 仅在每日提交时推理，当前班级老师明确提交后才形成
  正式出勤，Admin 只负责监督/reopen。
- Prevention：schema、presenter 和测试均须使用不同类型，禁止覆盖率字段进入
  attendance write path。

### 2026-07-30 — 将来源可信度错误等同于园区编辑权限

- Symptom：初始建议限制园区编辑医疗正文，与园区知识自主编辑需求冲突。
- Root cause：把“权威来源身份”和“园区内容编辑权”合并成一个 policy。
- What was tried：只允许园区选择不可变的权威医疗基线。
- Fix：园区 Admin 可编辑/发布医疗知识并关联权威来源；RAG 明确显示来源身份，医疗
  冲突时 abstain 并进入复核。
- Prevention：知识 revision 必须分别建模 author/publisher、source provenance、
  safety class 和 retrieval/citation policy。

### 2026-07-30 — 将老师升级误作 Admin 沟通可见性条件

- Symptom：最初把“老师明确升级”作为园区管理者查看班级家园沟通的前置条件。
- Root cause：没有区分从发送前即披露的园区业务沟通与家庭私密/个人聊天。
- What was tried：Admin 默认只看状态，老师升级后才可读正文。
- Fix：园区业务渠道从发送前明确 Admin 监督读取用途；Admin 可在 exact
  Institution/Enrollment/CareGroup/Grant/purpose 下只读，无需老师升级。家庭私域
  继续不可见。
- Prevention：消息/投影必须携带 channel class、disclosure、purpose 和 source
  lifecycle；Admin read 与 CareGroup action authority 分别测试。

### 2026-07-30 — Admin Web child attribution 越过 T-006 caregiver authority

- Symptom：D-05 初稿允许 Admin 直接调整 confirmed child association，与 T-006 只允许
  current exact CareGroup caregiver 确认/纠正归属的规则冲突。
- Root cause：把 Admin Web 的便捷整理能力与 canonical child-attribution authority
  合并成一个“关联调整”动作。
- What was tried：让 Admin append-only 修改 association，并仅依赖历史审计降低风险。
- Fix：Admin 可改 activity placement/cover/note，并可立即 downscope hide；child
  attribution 只能提出 correction candidate/WorkItem，由 exact CareGroup caregiver
  确认。多角色用户必须切换 caregiver role。
- Prevention：activity placement、visibility downscope、child attribution 和 publish
  eligibility 使用不同 capability/negative tests，禁止共享通用 patch endpoint。

### 2026-07-30 — Trial 主状态与现有 DB enum 不一致

- Symptom：D-07E 初稿使用 `trial | active | ended` 主状态，但现有
  `NurtureEnrollmentStatus` 没有 `trial`，且 trial 孩子需要复用 active 照护路径。
- Root cause：把业务 participation phase、关系 lifecycle 和 Workflow waiting state
  压成了一个 enum。
- What was tried：把 `trial` 同时描述成主状态或安全标签，导致 formal 统计和 authority
  predicate 不确定。
- Fix：preparation 使用 `status=pending`；真实 trial/formal relationship 都使用
  `status=active`，另设 canonical `participationPhase=trial|formal`；trial exit 写
  `status=ended`，Workflow waiting 继续独立。
- Prevention：schema inventory 必须验证 status/phase 组合、正式统计、trial-start、
  formalization/exit 原子性与 UI projection，禁止 label 代替 policy predicate。

### 2026-07-30 — Accepted trial offer 缺少 preparation cancellation

- Symptom：Guardian 接受 offer 后 reservation 已占用，但 identity/binding 或 trial
  Enrollment 尚未建立时，原设计只有要求完整 trial facts 的 end-trial 路径。
- Root cause：把“已接受 offer”误当作“trial relationship 已 commit”。
- What was tried：等待 owner 恢复或复用 end-trial；前者可能永久占位，后者依赖不存在的
  facts。
- Fix：增加 `cancel_trial_preparation`，在一个本地事务中关闭 preparation shell、
  释放 reservation 并记录审计；不修改 My-Chat identity/binding。trial-start 已 commit
  后才使用 end-trial。
- Prevention：waitlist offer、capacity reservation、trial preparation、trial-start
  relationship 必须有独立状态与取消/重放测试。
