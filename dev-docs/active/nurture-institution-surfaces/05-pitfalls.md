# Pitfalls — 机构端双 Surface

## 2026-08-10 — Formalization coupled acceptance time to activation time

- **Symptom:** a Guardian could not accept a future-start formal proposal before
  its start time, and concurrent formalization surfaced a serialization abort as
  owner unavailable.
- **Root cause:** the repository compared `proposedFormalStartAt` with
  `acceptedAt` instead of the commit clock, and inspected only Prisma's top-level
  error code even though raw-query PostgreSQL `40001` is nested under `P2010`.
- **What was tried:** the first concurrent test exposed a blocked owner result;
  propagating only top-level `P2034|40001` still missed the nested database code.
- **Fix/workaround:** acceptance is checked only against issue/expiry, commit is
  checked against formal start, timely acceptance survives proposal expiry, and
  both top-level and nested serialization codes reach the shared
  `command_write_conflict` classifier. The schema now permits one immutable
  proposal per workflow instead of an unreachable revision chain.
- **Prevention:** every future-effective owner action needs separate decision-
  time and effect-time predicates, plus a true competing-command DB test that
  asserts one execution, one transition and retry convergence.

## 2026-08-10 — Extending a shared transition table requires disjoint validators

- **Symptom:** the first 0E-4 migration either required formal evidence on older
  Guardian actions or sent `formalize_enrollment` through both the generic
  journey validator and its exact formalization validator.
- **Root cause:** adding nullable audit fields changed a shared row shape, while
  SQL `CHECK` branches and trigger `WHEN` routing were updated independently.
- **What was tried:** clean migration replay exposed the old-row rejection;
  the targeted formalization test then exposed the second generic validator.
- **Fix:** preserve the old Admin/Guardian branches verbatim, add one exact
  formalization branch, exclude formalization from the generic trigger, and
  require proposal refs only on propose/formalize transitions.
- **Prevention:** every new command shape on a shared audit table MUST have a
  storage truth table covering old rows, the new row and unrelated rows; clean
  migration replay and the full DB lane are both required.

## 2026-08-10 — SQL three-valued checks and derived identity admitted drift

- **Symptom:** an empty JSON carrier could make the exact-key helper return SQL
  `NULL`, while a separately stored workflow-ref hash and shallow lifecycle
  checks allowed the database carrier to become weaker than the domain model.
- **Root cause:** PostgreSQL `CHECK` accepts expressions that are not `FALSE`,
  and the first migration draft checked presence/format without proving exact
  canonical-ref identity or cumulative transition state.
- **What was tried:** regex-checking the hash and validating lifecycle only at
  the command/projector layer; both left a second representation or a direct
  SQL-write gap.
- **Fix/workaround:** exact-key helpers now coalesce missing shapes to `FALSE`;
  the checked canonical `object_id` replaces the hash; SQL mirrors milestone
  and lifecycle rules, reconstructs cumulative state from immutable
  transitions and defers a one-head/one-transition check until transaction
  commit.
- **Prevention:** every persisted derivative must be constrained equal to its
  canonical source, JSON helpers must falsify empty/malformed values, and each
  domain carrier invariant needs a database-level falsification probe before
  migration qualification.

## 2026-08-09 — G4-D schema vocabulary must follow the exact freeze

- **Symptom:** the first local Prisma enum draft used plausible but nonexistent
  enrollment milestone names such as `capacity_confirmed` and
  `process_completed`.
- **Root cause:** the schema draft followed an implementation summary instead
  of mechanically comparing with the exact increment-1 domain registry and
  0E-1 freeze vocabulary.
- **What was tried:** Prisma validation alone passed because the invented enum
  was internally well formed; it could not detect semantic vocabulary drift.
- **Fix/workaround:** replaced every value with the exact 14-item registry,
  regenerated Prisma, and compared domain source, Prisma schema and migration
  SQL together.
- **Prevention:** for frozen closed vocabularies, run a three-source exact-value
  comparison before authoring adapters or migration evidence; schema syntax
  validation is not semantic contract validation.

## 2026-08-09 — Request caching and grant-only counting weakened owner rechecks

- **Symptom:** reusing the same owner-read request object could retain a prior
  successful role/source read after authority changed. Configured load also
  counted pending items from grant terms without requiring the exact
  Institution Admin disclosure owner, and a family message with multiple source
  items could be resolved by an arbitrary `findFirst` row.
- **Root cause:** request identity was incorrectly treated as a request-lifetime
  boundary, while the provider object is longer-lived. Configured load copied a
  partial grant predicate instead of consuming the existing exact communication
  owner, and the source-message relation is indexed but not unique.
- **What was tried:** the architecture audit traced every provider's incoming
  and outgoing dependencies, then compared its predicates with the canonical
  communication read port and the frozen no-cache/no-partial rules. No schema
  uniqueness was assumed or added during the repair.
- **Fix/workaround:** all cross-invocation caches were removed; only a
  method-local local-day cache remains. Configured load now derives authorized
  message IDs from the disclosure-aware owner read. Family messages require
  exactly one matching source item, otherwise the read fails closed. Pending
  work follows the canonical acknowledgement/response axes, and blocked
  receipts must match their authorized source dimensions. Regression fixtures
  cover revoke-after-first-read, undisclosed work, duplicate items, completed
  acknowledgement-only items and mismatched receipts.
- **Prevention:** cache immutable parsing or method-local repeated lookups only;
  never cache authority/source results on caller object identity. Protected
  aggregates must reuse their exact direct-read owner rather than a similar
  local predicate. Non-unique source links must be cardinality-checked, and
  legacy coarse status must not replace canonical independent state axes.

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
  owner 显式提供。缺少 canonical owner fact 时返回 unavailable，不能用恒空
  placeholder 冒充完整列表。
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

### 2026-08-09 — Fresh runtime exports were loaded from stale harness output

- Symptom: production-DB tests typechecked but failed at runtime because the
  new intake constructor and zoned-instant helper were not functions.
- Root cause: DB adapters imported new values through the `./harness` package
  subpath, whose runtime target was a checked-in `dist` tree older than the
  source declarations TypeScript used.
- What was tried: changing only the new intake adapter exposed the same defect
  in the shared local-day helper.
- Fix: runtime consumers added by this increment import the scenario package's
  source-backed root entry; exact integration tests exercise both values.
- Prevention: a typecheck is insufficient for conditional package exports.
  New runtime exports MUST be tested through the same entrypoint production-DB
  tests load, and no second stale import route should be retained.

### 2026-08-09 — Existing foreign-key names appeared as schema drift

- Symptom: the clean 29-migration database was up to date, but Prisma proposed
  six foreign-key renames on older attendance and support-signal tables.
- Root cause: hand-written migrations used stable physical constraint names
  that their Prisma relations did not declare; generated names differed only
  textually.
- What was tried: migration status alone passed but could not detect the
  datasource-to-datamodel naming mismatch.
- Fix: bind each existing physical name with relation `map`; no constraint or
  data was rewritten, and the final schema diff is empty.
- Prevention: every disposable migration qualification MUST include a final
  datasource-to-SSOT diff, not only `migrate status`.

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

### 2026-08-10 — Serialization abort occurred inside the command finalizer

- Symptom: concurrent acceptance preserved capacity but returned
  `command_execution_failed/technical_error` instead of a stable write
  conflict; after correcting the classification, an older bounded-retry DB
  test stopped retrying it.
- Root cause: PostgreSQL raised the serialization abort during the same-ledger
  transition finalizer. The scenario kernel intentionally wrapped unknown
  finalizer errors, so the outer Prisma repository never saw the driver code.
  Retryability was also duplicated in callers as a technical-error check.
- What was tried: classifying `P2034` only around the outer transaction did not
  reach finalizer-stage errors; merely accepting the generic technical result
  would have kept infrastructure and business failures conflated.
- Fix: add a repository rollback-classification port used inside apply and
  finalizer catches, then centralize same-command retryability. Only explicit
  `command_write_conflict` joins busy/technical/unknown infrastructure
  outcomes; ordinary business conflicts remain terminal.
- Prevention: every serializable command with an in-transaction finalizer must
  include true concurrent DB coverage, and callers must use the shared
  retryability predicate rather than reconstructing decision lists.

### 2026-08-10 — Opaque object ID alone was not canonical action identity

- Symptom: two approved My-Chat canonical action object types with the same
  opaque `object_id` could collide in the waitlist uniqueness indexes.
- Root cause: the first index treated the object ID as globally typed even
  though the owner contract defines identity as namespace, object type and ID.
- What was tried: including the action version would avoid some collisions but
  would also let a new version of the same logical decision execute twice.
- Fix: enforce the fixed `my_chat` namespace and index `object_type + object_id`;
  omit version deliberately so one logical action stays idempotent.
- Prevention: every persisted canonical-ref dedupe must derive its exact owner
  identity tuple from the contract, never from an opaque ID alone.

### 2026-08-10 — Reservation safety must fence the capacity source

- Symptom: offer acceptance respected held reservations, but a direct
  `CareGroup` capacity/status/deletion update could later make the class
  overcommitted or inactive underneath an existing hold.
- Root cause: the invariant was enforced only on reservation writes, not on
  the capacity owner's reverse mutation path.
- What was tried: relying on application order and acceptance recounts could
  not protect later direct class updates or concurrent transactions.
- Fix: a database trigger requires an active, nondeleted class with nonnull
  capacity and `active occupancy + held reservations <= capacity`; the existing
  exact-class row lock serializes both sides.
- Prevention: capacity invariants need forward and reverse write guards on
  every canonical source that can invalidate them.

## 2026-08-10 — Wire-only capabilities are not runtime fixture modules

- **Symptom:** the first full I2-A Surface Contract conformance run failed four
  historical G2/G3 suites after the new descriptors were valid and generated.
- **Root cause:** the draft added new surface module-kind names even though the
  existing Workflow projection/queue families already carried the data, while
  three bidirectional runtime censuses assumed every newly registered
  capability already had a G2/G3 handler or fixture.
- **What was tried:** the initial source added `family_waitlist_status`,
  `institution_capacity_waitlist` and Workbench-specific module kinds. That
  widened the closed content-family union and forced unrelated historical
  fixtures to pretend I2-A had a presenter runtime.
- **Fix/workaround:** removed the redundant module kinds and reused the existing
  `institution_workflow_projection` / `institution_workflow_queue` families.
  The dedicated I2-A suite owns the exact 24-key inventory. I2-B cleanup makes
  historical selection, adoption and ingress censuses derive that group from
  its unique runtime gate rather than copying the list into each suite.
- **Prevention:** a wire-only rotation must reuse an existing presentation
  family unless it actually introduces a new rendered module. Every
  bidirectional runtime census must classify new default-off descriptors
  explicitly, and that classification must fail once a handler is routed.

## 2026-08-10 — A default-off adapter still needs exact lane and identity fences

- **Symptom:** the first I2-B draft shared one invocation helper between query
  and command handler keys without checking which lane the parsed capability
  belonged to. Its committed-result check compared only the Workflow Run
  `object_id`.
- **Root cause:** default-off composition was mistaken for sufficient runtime
  isolation, an opaque ID was treated as the complete canonical identity, and
  the confirmation ref stopped at the surface adapter instead of reaching the
  transactional command executor.
- **Fix:** both internal keys now reject the opposite capability lane before
  binding resolution. Query and committed command results compare the full
  canonical Workflow Run tuple and fail unavailable on target/scope drift.
  Action/query request types enforce confirmation presence/absence, and the
  executor port carries the opaque ref for future in-transaction verification
  and consumption.
- **Prevention:** every adapter key must enforce its declared execution class
  even while disabled. Cross-owner canonical identities are compared as exact
  typed tuples, never by opaque object ID alone. A confirmation token must
  reach the transaction that applies the effect; a pre-transaction read or
  consume is not qualification evidence.

## 2026-08-10 — A broad host pin did not freeze the generic RAG boundary

- **Symptom:** 0A described the My-Chat RAG owner as pinned, but the existing
  broad source set covered the Knowledge domain and PBR code without the
  `packages/rag` public service. At the same time, the old family-scoped
  `NurtureContextMaterial` tables looked superficially reusable for Institution
  knowledge.
- **Root cause:** the inventory grouped host Knowledge, permission and RAG
  ownership into one prose row before 0F had selected an exact consumer
  boundary. The legacy 5h/5i names described corpus/runtime mechanics, not the
  Institution Admin revision/publish product.
- **What was tried:** inspected the pinned My-Chat revision and the current
  Nurture DB context before selecting files or schemas. The generic service
  proved reusable for retrieval/citation mechanics but lacked Institution
  lifecycle, audience, preview and medical-conflict semantics.
- **Fix/workaround:** added a dedicated Git-revision source pin covering the
  Knowledge types/repository, PBR entrypoint, RAG service and their package
  export manifests, plus a verifier that hashes committed objects despite
  checkout drift. The 0F scope record explicitly excludes both legacy Nurture
  corpus models.
- **Prevention:** every cross-owner branch must pin the exact public consumer
  surface, not a nearby domain directory or prose digest. Similar table names
  are never reuse evidence; ownership and product lifecycle must match first.

## 2026-08-10 — Knowledge authoring must fit the protected atomic boundary

- **Symptom:** the first 0F-1 draft allowed a structured body far larger than
  the existing protected-content port and allowed a requested authority link
  to disappear while still saving the revision.
- **Root cause:** product-level field maxima were chosen before checking the
  concrete 8 KiB sealed-plaintext invariant, and draft availability was valued
  over the caller's atomic revision intent.
- **What was tried:** the architecture review traced the planned sealed body to
  `ProtectedContentWritePort` before any schema or implementation was authored.
  The mismatch and silent partial-success branch were therefore found at
  freeze time.
- **Fix/workaround:** cap canonical serialized UTF-8 body JSON at 8,192 bytes,
  bound sections to 16 and require every requested authority link to resolve
  or fail the whole revision command. Larger material uses multiple items, not
  a second storage path.
- **Prevention:** freeze records that reuse a security/storage port must cite
  its concrete size and atomicity constraints. Optional enrichment may be
  omitted only when the caller did not request it.

## 2026-08-10 — Lifecycle events alone cannot maintain retrieval discovery

- **Symptom:** the first 0F-2 draft used one predicate for indexing and online
  answer, then relied only on publish/supersede/revoke events. A future
  `validFrom`/`validUntil` passage or authority-source currentness change could
  remain undiscovered after an initial read.
- **Root cause:** index admission, request-time authorization and source-change
  discovery were conflated. Not every eligibility change is or should be a
  lifecycle write.
- **What was tried:** traced future-effective, expired and authority-revoked
  sources through publish, pull, index, retrieval and final validation without
  inventing timer-authored business states.
- **Fix/workaround:** separate index admission from online eligibility, include
  review changes in the event feed and add bounded current-source-state
  reconciliation. Future sources may be indexed, but cannot enter model
  context until request-time currentness passes.
- **Prevention:** every derived index fed by canonical owner facts needs both
  incremental changes and full reconciliation. Cache/index presence never
  replaces owner validation, and time passage must not require a fake
  lifecycle transition.

## 2026-08-10 — Closed DTO fields do not make free text non-sensitive

- **Symptom:** the first 0F-3 draft excluded `child_id` and family fields but
  would still have allowed a user to paste child-specific/private care facts
  into the question and reach generation.
- **Root cause:** structural input minimization was mistaken for semantic
  content classification. The same draft also proposed leaving general
  generation available before a medical-safety provider could distinguish a
  general question from a medical one.
- **What was tried:** traced raw question text, retrieved excerpts, model draft,
  candidate persistence, copy/export and Host replay independently from the
  typed request keys.
- **Fix/workaround:** require one structured request/source/draft safety owner
  for every online generation. Child-private input receives a fixed
  safety abstention; the question is excluded from candidate identity/evidence
  and all generation remains unavailable until that owner is qualified.
- **Prevention:** free-text contracts need semantic privacy/safety gates in
  addition to closed object schemas. If the required service adapter is unqualified,
  the caller cannot safely infer the request belongs to an allowed subset.

## 2026-08-10 — A review candidate is not an eligibility decision

- **Symptom:** the first combined 0F-2/0F-3 contract made a newly appended
  conflict candidate an active retrieval hold. An invocation could return
  conflict, lose its response, then replay as no-source because its own side
  effect filtered the source.
- **Root cause:** “fail closed” was applied by adding another persistent policy
  input instead of preserving the one structured answer-safety owner.
  Candidate review evidence and online adjudication were conflated.
- **What was tried:** replayed the exact source set through retrieve, safety,
  candidate commit, response loss and currentness. Actor/invocation exemptions
  and a candidate dismiss state were rejected because both add a second path.
- **Fix/workaround:** the immutable candidate is canonical review evidence but
  non-authoritative for index/retrieval. Every request re-evaluates current
  sources through the answer-safety owner; candidate replay only deduplicates
  the review fact.
- **Prevention:** a candidate may inform human work without becoming a status,
  permission, hold or lifecycle. Any candidate side effect must be replayed
  through the enclosing operation to prove the result class stays coherent.

## 2026-08-11 — A private dependency rotation is not a public DTO rotation

- **Symptom:** the retained Q4/Q6 branches named private owner v1/v2, Surface
  `1.18.0` and a My-Chat public DTO v2 close together. A direct branch merge
  would have made stale private pins look like supported compatibility paths.
- **Root cause:** private provider identity, dependent Surface identity and
  public component identity were not consistently named as three separate
  contracts in maintained handoff text.
- **What was tried:** preserving old private routes during migration was
  considered, but there was no approved compatibility consumer and doing so
  would create two trusted decoders and two provider selections.
- **Fix/workaround:** squash-port only the valuable net implementation, rotate
  the sole private interface to v3/Surface `1.20.0`, keep My-Chat public DTO v2
  unchanged and delete the superseded private route/evidence artifacts.
- **Prevention:** every cross-owner adoption record names all three identities
  independently. Never derive a public DTO version from a private interface
  version, and never retain an old trusted route without an explicit consumer.

## 2026-08-11 — Exact recovery maps must not inherit wider Harness unions

- **Symptom:** the private descriptor/type advertised `decision=invalid` and
  `recovery=retry_same_command`, although none of its four safe public reasons
  could produce either value.
- **Root cause:** the first private DTO copied the wider internal Harness result
  union while its runtime validator already enforced a narrower reason map.
- **What was tried:** pair validation prevented invalid wire values, but left
  dead states in exported types and contract documentation.
- **Fix/workaround:** derive the private alternatives from the exact reason map,
  narrow both repositories before publication and recompute the v3 digest.
- **Prevention:** contract unions are reviewed for reachability, not only type
  validity. A value absent from every declared reason mapping is removed.

## 2026-08-11 — Generated environment booleans must match runtime syntax

- **Symptom:** generated examples emitted Python-style `True`/`False` while the
  TypeScript runtime parser accepts lowercase `true`/`false` only.
- **Root cause:** the environment generator used generic scalar stringification
  and lacked boolean fixtures.
- **What was tried:** regenerating outputs reproduced the mismatch, proving it
  was a canonical generator defect rather than hand-edited output drift.
- **Fix/workaround:** add one scalar formatter in the canonical skill, cover
  enabled/disabled booleans in the environment feature suite and regenerate all
  derived outputs.
- **Prevention:** generated examples must round-trip through the runtime parser;
  every scalar type has an explicit fixture and canonical textual form.

## 2026-08-11 — Do not make model-weight attestation the only path to Q3

- **Symptom:** Q3 remained blocked while the team searched for a fixed-weight,
  locally verifiable non-generative classifier that covered every medical,
  privacy and source-conflict class.
- **Root cause:** required safety behavior was coupled to one implementation and
  assurance strategy: bitwise determinism plus semantic-model artifact hashes.
- **What was tried:** policy engines, PII recognizers, generic moderation,
  custom categories and keyword libraries were compared with the full decision
  taxonomy. None satisfied that stronger artifact-attestation standard alone.
- **Fix/workaround:** accept a service-backed structured safety adapter through
  the single My-Chat gateway. Pin an explicit model/deployment version and
  immutable prompt id/version, validate closed structured output, fail closed
  and retain all 15 regression fixtures. Qwen/Bailian is an acceptable service
  implementation; local model weights are not required.
- **Prevention:** treat the former artifact-attestation posture as historical
  and superseded, not an optional current harness. Bind all current
  evidence to the sole `/v2` `2.1.0` service qualification contract. Never claim
  bitwise determinism or model-weight verification when the provider does not
  expose those properties.

## 2026-08-11 — Synthetic transport qualification is not a live provider smoke

- **Symptom:** rejecting all synthetic evidence would block default-off
  integration, while accepting a mock response as “real provider evidence”
  would overstate runtime readiness.
- **Root cause:** adapter correctness and live credential/provider readiness
  were represented as one qualification state.
- **What was tried:** one all-or-nothing provider gate required real artifact
  resolution, invocation receipts and attestation before E7 could begin.
- **Fix/workaround:** split the gate. `adapter_qualified` requires the real
  adapter, no-secret synthetic transport tests and all 15 fixtures; it closes
  Q3 and permits default-off E7/E8. `live_qualified` requires an actual request
  through the configured My-Chat gateway and is deferred until feature-flag or
  traffic activation.
- **Prevention:** every evidence record MUST name its level. Mock/stub transport
  is never labelled live, and no capability or traffic is enabled until the
  separate `live_qualified` smoke passes.

## 2026-08-11 — A declared trusted handler is not yet a safe formal ingress

- **Symptom:** the first formal binding passed focused tests while direct
  registry calls omitted method/scenario checks, execute trusted an authority
  snapshot without an explicit current reread, the manifest retained stale
  internal handler names, and the adoption lock still pointed to older bytes.
- **Root cause:** manifest declaration, direct-handler defense, business
  authority currentness and source locking were treated as one mechanical
  registration step.
- **What was tried:** the initial query/prepare/execute registration was kept
  default-off, but focused happy-path tests and the old default-off census did
  not detect the dangling surface mapping or source-lock drift.
- **Fix/workaround:** remove the old internal track, freeze the full declaration
  tuple, validate both declaration and invocation, resolve current authority at
  prepare and execute, compare the prepared authority version, expand the
  default-off allowlist, run the full 996-test suite, then rotate the locks from
  the final source revision.
- **Prevention:** future trusted operations land in four ordered units:
  contract, fail-closed handler, full conformance/default-off verification, and
  metadata-only lock. A port-only owner is reported as pending and never as an
  activated transport.

## 2026-08-12 — A historical replay is not a writer-fenced status receipt

- **Symptom:** an already committed command could not be rediscovered after
  prepared expiry or current participant/authority change, while an absent
  execution read could be mistaken for proof that no effect happened.
- **Root cause:** normal formal execute verifies current owners before reaching
  command-kernel replay, and an unlocked absence check races the command writer.
- **Fix/workaround:** add a separate opaque settlement ledger. Historical reads
  use its exact frozen binding; `confirmed_no_effect` acquires the same advisory
  transaction lock as the command writer and checks the execution under that
  fence. If execution exists, reconcile to committed instead.
- **Prevention:** never use prepared expiry, authority revoke, timeout, 404 or
  an unlocked missing row as no-effect evidence. Unknown remains quarantined.

## 2026-08-12 — Prisma schema validation may require a URL without using a DB

- **Symptom:** `prisma validate` failed before schema validation because
  `DATABASE_URL` was unset.
- **Root cause:** Prisma resolves datasource environment variables during
  configuration parsing even when the operation does not connect.
- **Fix/workaround:** use a one-command invalid local placeholder URL for
  format/validate/generate only; do not invoke migrate/apply.
- **Prevention:** qualification records distinguish schema parsing from database
  execution and explicitly record whether any target was contacted.

## 2026-08-12 - A stable logical key still needs an exact operation binding

- **Symptom:** the Host reservation froze runtime pins but, before Nurture saw
  the first attempt, the same logical key could be paired with a different
  prepared command.
- **Root cause:** transport id, logical replay identity and the semantic
  command/confirmation pair were treated as if one implied the others.
- **What was tried:** depending on Nurture's settlement uniqueness closes
  drift only after the first request reaches Nurture and therefore does not
  cover a Host crash before transport.
- **Fix/workaround:** My-Chat stores only a domain-separated SHA-256 of the
  exact command id + confirmation ref and includes it in reservation evidence.
  Any changed pair conflicts before Scenario transport.
- **Prevention:** both ledgers must freeze their own side of the operation
  binding; remote observation is not a substitute for local durable identity.

## 2026-08-12 - Writer-fenced no-effect must bind the attempted confirmation

- **Symptom:** a wrong confirmation was denied by execute, but no-effect named
  only the command id and could still close that command's real prepared row.
- **Root cause:** the Host ledger froze command + confirmation, while the
  Scenario mutation boundary projected only the command portion.
- **Fix/workaround:** rotate no-effect to v2, carry the exact confirmation and
  verify its owner-held historical HMAC/hash evidence before registering the
  settlement or acquiring the command writer fence.
- **Prevention:** destructive reconciliation inputs must preserve the complete
  semantic identity of the attempted operation across every owner boundary.

## 2026-08-12 - Do not combine Host evidence with Scenario business snapshots

- **Symptom:** the I3 source port could return valid Host current-owner evidence
  together with a separately chosen Nurture pair and Grant snapshot.
- **Root cause:** signed transport acquisition and Nurture business derivation
  were represented by one mixed remote-source result.
- **What was tried:** structural evidence validation and a final local pair
  reread rejected malformed or stale facts, but they did not make the source
  ownership boundary explicit and still allowed cross-pair substitution.
- **Fix/workaround:** carry only exact Host evidence in the enclosing verified
  invocation, strip it before prepare persistence, and derive pair/Grant facts
  through a Nurture-local port before exact cross-binding and currency reread.
- **Prevention:** transport adapters never manufacture or cache Scenario
  business snapshots; each owner supplies its own facts at request time.

## 2026-08-12 - A bounded Grant may expire before its policy

- **Symptom:** the first start-time policy drift guard rejected the valid
  positive path even though the policy revision and allowed terms were still
  current.
- **Root cause:** pending Grant `expiresAt` is intentionally bounded to the
  trial end, while its stored policy snapshot retains the longer policy
  expiry. Comparing those two timestamps for equality conflated permission
  ceiling with relationship lifetime.
- **Fix/workaround:** compare the stored snapshot's policy expiry to the
  current policy and require the Grant expiry to be no later than that policy;
  keep the existing lifecycle invariant that Grant expiry equals trial end.
- **Prevention:** distinguish policy maximums from per-relationship narrowing
  in every drift check. Equality is required for policy identity, not for a
  legal downscoped effective lifetime.

## 2026-08-12 - Current-owner reads must reject ambiguity

- **Symptom:** an authorization query ordered active rows and selected the
  first, so two simultaneously active current facts could still authorize a
  pair.
- **Root cause:** ordering was used as if it were an ownership rule, although
  no canonical contract declared “latest active wins.”
- **Fix/workaround:** read at most two and admit exactly one for Child/Family
  authorizations, actor bindings, roles, reservations and policies. Add a
  duplicate-active negative fixture.
- **Prevention:** every current-owner repository must encode exact-one,
  explicit priority or a database uniqueness invariant. `findFirst` alone is
  never an ambiguity policy.

## 2026-08-12 - A positive fixture cannot skip append-only journey history

- **Symptom:** signed execute reached the real transaction owner but PostgreSQL
  rejected the effect because the fixture's advanced Workflow head had no
  matching transition history.
- **Root cause:** direct row setup represented final state without producing
  the canonical command facts required by database invariants.
- **What was tried:** adjusting the numeric head did not restore the missing
  history and would have turned the joint vehicle into a constraint bypass.
- **Fix/workaround:** build the prerequisite journey through six existing
  command specs, then run signed prepare/execute only for the increment under
  qualification.
- **Prevention:** direct setup is acceptable for base identities and owner
  sources in a disposable fixture; state-machine business history must be
  created through its canonical command path.

## 2026-08-12 - Canonical Actor and Scenario Participant are not aliases

- **Symptom:** the first Guardian acceptance fixture supplied a Nurture
  Participant id where the Host carrier required a `my_chat.actor` ref.
- **Root cause:** both ids represented the same adult in the fixture, but they
  belong to different owner namespaces and lifecycles.
- **What was tried:** shape-compatible string reuse failed the real
  actor/action binding check, as designed.
- **Fix/workaround:** keep the canonical Host actor in the Guardian action and
  the Nurture participant only in local role/command facts.
- **Prevention:** fixtures must name account, Actor, Participant, role and
  business actor separately even when one human connects them.

## 2026-08-12 - A nullable authority field still needs a relational invariant

- **Symptom:** dropping `role_assignment_id` NOT NULL enabled Guardian rows but
  the original CHECK still admitted only the Web surface and did not prove the
  intended role/surface pairing.
- **Root cause:** the column migration and the existing table-level contract
  were reviewed separately.
- **What was tried:** relying on TypeScript unions would not protect direct SQL
  writes or future repository drift.
- **Fix/workaround:** replace the old CHECK in the same migration: Web requires
  a role assignment; chat/mobile forbid one; only the three exact surfaces are
  admitted.
- **Prevention:** every nullability change must inventory all CHECK, unique,
  index and foreign-key semantics that previously relied on non-nullness.

## 2026-08-12 - Post-commit projection is not an authorization read

- **Symptom:** a Guardian command committed correctly but response assembly
  called the Admin-only projection read and returned outcome unknown.
- **Root cause:** one repository method combined shape validation with Admin
  projection authority, even though command authority had already been checked
  and consumed inside the effect transaction.
- **What was tried:** fabricating an Admin role for Guardian response assembly
  would have crossed the owner boundary and was rejected.
- **Fix/workaround:** extract a pure snapshot shape/lifecycle validator and add
  an explicitly named after-authorized-command read. It cannot be used to make
  a permission decision.
- **Prevention:** distinguish current authorization reads from post-commit
  result reconstruction in repository contracts and method names.

## 2026-08-12 - Exact replay may legitimately advance one head

- **Symptom:** retrying the same consumed formalization was denied because the
  current workflow head had advanced after the first successful command,
  causing both authority and payload hashes to differ.
- **Root cause:** replay rebuilt a pre-effect payload and compared the complete
  prepared authority string before checking the consumed ledger/execution.
- **What was tried:** ignoring all authority drift would have admitted revoked
  participants, roles, contacts or actions and was rejected.
- **Fix/workaround:** detect the exact consumed ledger and existing committed
  execution first; still resolve current authority and permit only the
  structured target-head component to differ.
- **Prevention:** idempotent replay contracts must list which facts are
  expected to change because of the original effect and keep every other
  current-owner component exact.
