# Implementation Notes — 机构端双 Surface

## 2026-08-09 — G4-B increment 12: attendance checkpoint owner

- Added one versioned exact-class `NurtureAttendanceCloseoutPolicy` under the
  0D-1 contract. The owner resolves its configured wall clock to one instant
  and supplies that fact to the existing attendance adapter; the signal policy
  stores no deadline and parses no local time.
- Architecture review removed a proposed second timezone field. Checkpoint
  resolution now reuses the existing Institution local-day owner's timezone
  and the same shared wall-clock utility as publication scheduling. A policy
  first effective after local-day start cannot create a retroactive deadline.
- Missing, invalid, expired, overlapping or non-monotonic policy history fails
  the exact owner read closed. A valid unsubmitted day produces an actor-bound
  source; a stored submission remains resolved and absent.
- A repo-wide blocker audit found no readable canonical fact for
  `authority_or_source_blocked`. Revoked/redacted/withdrawn/cancelled receipts
  are unreadable or terminal; item/workflow-driver blockers already belong to
  the separate WorkItem/Workflow category. No blocker state was added.
- The additive 27th migration passed exact-owner 12/12 and full DB 360/360 on
  the approved disposable target, which was destroyed and confirmed absent.
  See [`46`](./46-g4-b-increment-12-record.md).

## 2026-08-09 — Current-head disposable DB requalification

- The user approved one new empty local disposable PostgreSQL target for the
  previously typechecked owner-quality regressions. The child process replaced
  only the database pathname and validated `localhost:5433` before any write.
- Clean `prisma migrate deploy` applied the complete 26-migration history. The
  exact-owner suite passed 9/9 and the full production-DB lane passed 357/357
  across 37 files; migration status was current afterward.
- The exact target had zero sessions before deletion, was dropped, and was
  confirmed absent. No shared or persistent database was selected or changed.
  See the
  [`rerun evidence`](./artifacts/db/0d5-owner-quality-rerun/03-execution-log.md).
- This closes the execution-evidence gap for the post-increment-11 repairs. It
  does not pre-approve or qualify a future attendance/source-owner schema or
  contract change.

## 2026-08-09 — Post-increment-11 owner quality repair

- Commit `a982aed` removes request-object authority/source caches. Reusing the
  same request object after the selected Admin role is revoked now forces a
  fresh exact-role read instead of returning cached authority.
- Configured load now obtains its source-message set from the canonical
  Institution business-communication owner, including disclosure policy,
  before reading pending items. A grant alone no longer creates an Admin-visible
  count. Ambiguous family-message-to-item mappings fail closed.
- The local `"1.0.0"` support-signal version literal was removed; the provider
  consumes `INSTITUTION_SUPPORT_SIGNAL_CONTRACT_VERSION` from the scenario SSOT.
  Integration cleanup retains workspace IDs until deletion succeeds, repeats
  in `afterAll`, and uses a stable future snapshot rather than a date that ages
  into nondeterminism.
- Commit `e1c93ed` moves scope, local-day, communication, population and opaque
  ref handling into one internal owner-context module. The original provider
  module remains the sole public composition path; no compatibility wrapper or
  second provider track was added. Commit `acbf9eb` adds the ambiguous-source
  regression to the disposable-DB lane.
- Commit `260174a` removes the last legacy pending-work shortcut: configured
  load now follows canonical acknowledgement/response axes rather than coarse
  `status` plus requirement flags. Literal blocked receipts must also match the
  authorized source message's child process, direction and data class.
- No disposable database was newly approved for this quality pass, so the new
  DB regressions were typechecked but not executed against an unapproved target.
  The previously recorded 353/353 qualification remains evidence for commit
  `598926e`, not for these later repairs.

## 2026-08-09 — G4-B increment 11: concrete owners and disposable qualification

- Commit `598926e` adds one production composition factory for the policy SSOT
  and all six exact-owner ports. Providers recheck exact Workspace,
  participant, selected current Institution Admin role and Institution; resolve
  one publication-policy-backed local day; and issue actor-bound HMAC refs.
- Real owner rows now prove business response, review backlog, a literal
  blocked receipt driven by `item_action|workflow_step`, and configured load.
  Threshold categories require the complete authorized class population. Every
  potentially large owner read is bounded at 100 and becomes `unavailable`
  rather than truncated.
- Attendance is available-empty only when a formal submission exists. An
  unsubmitted day remains unavailable because the current owner schema has no
  checkpoint instant. The authority/source provider likewise remains
  unavailable for an enabled scope because no readable canonical blocker fact
  exists; `source_redacted` is explicitly not translated to `blocked`.
- The 0D-5 policy migration passed clean deploy, real-row/constraint probes and
  the full 353-test DB lane on the explicitly approved disposable database.
  The exact database was then destroyed and confirmed absent. See
  [`45`](./45-g4-b-increment-11-record.md) and the
  [`DB evidence`](./artifacts/db/0d5-support-signal-policy/03-execution-log.md).
- No durable database apply, production caller, capability, deployment,
  activation or traffic was added. G-03 remains partial only at the two owner
  fact contracts above.

## 2026-08-09 — G4-B increment 10: exact-owner adapters and consumers

- Commit `5cc2097` adds one typed adapter per deterministic signal category and
  one fail-closed combined reader. Owners receive the resolved active role,
  request snapshot and effective policies and MUST provide their own deadline,
  blocker or full-coverage aggregate facts.
- The Institution home consumes the composer order, returns at most three and
  exposes overflow. Class cards consume the same projection by exact class and
  carry only the frozen body-free subset.
- No concrete owner is substituted with an empty or inferred implementation.
  Owner-provider binding and the apply-gated policy migration remain open, so
  G-03 is still partial. See [`44`](./44-g4-b-increment-10-record.md).

## 2026-08-09 — G4-B increment 9: detail-read repair and 0D-5 core

- Commit `3b9ca9a` makes the class-day communication list structurally
  body-free, snapshot-consistent and bounded; exposes pagination instead of
  silent truncation; and resolves one Institution-timezone day for all detail
  facts.
- Commit `3ee0b78` adds the pure 0D-5 signal composer, authority-first service,
  policy-only Prisma adapter, one versioned policy table/migration and the
  generated DB context. The signal itself remains unstored.
- Exact deterministic source adapters are deliberately still open. They must
  reuse attendance/communication/WorkItem/Workflow owners; the signal layer
  does not invent their checkpoints, deadlines or blocker states.
- The migration is authored and validated but unapplied because no database
  target/apply approval was supplied. See [`43`](./43-g4-b-increment-9-record.md).

## 2026-08-09 — G4-B increment 8: class-day detail at I1

- Added the framework-free `NurtureInstitutionClassDayDetailService` and its
  Prisma repository in commits `d82895f` and `74f3fc2`. The projection composes
  the effective schedule, placed and unplaced photo/text timeline, formal
  attendance state, body-free communication target refs, family/institution
  response state and an optional purpose/grant-gated child drill-down.
- A class target now traverses the existing 0C authority chain directly as a
  `care_group`; the detail does not fabricate a child-shaped target. Protected
  capture bodies are opened only after that scope resolves, and one missing or
  invalid envelope refuses the whole projection rather than returning a
  plausible partial day.
- Today's communication list delegates every candidate to the existing exact
  Institution Admin owner-read predicate. Pagination applies `limit` after
  authorization, so an undisclosed earlier candidate cannot hide a later
  authorized one. The list carries no body; opening the issued target ref must
  re-run the existing single-message owner-read.
- No schema or migration was added. The increment remains I1: no production
  caller, capability registration, contract rotation, durable database apply,
  deployment, activation or traffic.

## 2026-08-09 — G4-0C/0D frozen and executed; G4-A and G4-B at I1

- G4-0C exited with six frozen units, and G4-A executed the authority chain in
  four increments; G4-0D exited with five, and G4-B executed 0D-1 and 0D-2 in
  seven. Each increment has its own record, `19`–`24` and `32`–`40`, and this
  entry deliberately does **not** restate them: one increment described in two
  places is one that will disagree with itself later.
- Effect boundary unchanged from the branch freezes: implementation and
  migration authoring only, qualified on a disposable PostgreSQL. No shared or
  persistent database apply, no capability registration, no contract rotation,
  no deployment, no activation, no traffic. No unit has a production caller.
- Live gaps and the ordered next steps live in
  `41-t007-gap-and-next-register.md`, which is the only doc in this package that
  is edited to stay current.

## 2026-08-05 — G4-0B bounded provider/consumer dependency qualified

- The exact `nurture.institution-publication-policy@1.0.0` owner provider was
  consumed through the production organize/admission/reschedule/release path during
  the repaired T-006 G3 qualification at Nurture `0374087…`.
- The exact detached owner/joint run passed and kept the provider default-off; its
  disposable PostgreSQL and topology were destroyed after verification.
- This is only the early G4-0B dependency handoff. T-007 remains `planned`; G4-0C～F,
  persistent schema apply, capability activation, deployment, T-008 and traffic were
  not started.

## 2026-07-29 — Task package created

- 创建 T-007 规划包。
- 将 institution mobile read-only board 与 Web workbench 作为一个机构权限/聚合
  领域任务；当时仍为 Surface 概称，后续由 2026-07-30 决策细化为 Admin mobile 与
  `InstitutionAdminWorkbench`。
- 明确 T-003 对机构端仍是框架级设计，未决细节通过 decision log 处理。
- 当前无代码、schema、aggregate 或 presenter 变更。

## 2026-07-29 — InstitutionWorkflow and board projection semantics locked

- 当前产品 Workflow 收敛为园区管理 `InstitutionWorkflow`。
- 当时以通用 institution Web 概称主要操作面，mobile 只读投影 Workflow 关键内容、
  阶段、里程碑、阻塞和下一步；2026-07-30 进一步锁定为 `institution_admin`
  Surface，不适用于其他角色。
- 同角色可获得更完整 projection，但不替代 Workspace/scope/assignment/visibility。
- family-care ActionExecution、ActionDelivery 与 caregiver PublishProcess 明确排除在
  Workflow 之外。
- 当前仅更新规划文档，无代码、schema、aggregate、runtime 或 presenter 变更。

## 2026-07-30 — Role-bound surfaces, attendance and knowledge/RAG decisions locked

- D-01：当前园区管理角色固定为 `institution_admin`；Lead 只是 Admin 指定的内部
  分工标识，不产生额外权限，也不表示园区负责人。
- D-02：mobile/Web 都绑定显式 active role，多角色用户必须切换角色；当前仅定义
  `InstitutionAdminWorkbench`，不为其他角色创建共享或空壳 Web。
- D-03：Admin Web 收敛为人员与关系、日常运营、家长触达、数字资源、知识/RAG 和
  园区责任队列。普通 action/WorkItem 与多阶段 `InstitutionWorkflow` 保持分离。
- `institution_admin` mobile board 继续只读；老师每日出勤提交位于 caregiver
  mobile Surface，因此不构成 Admin mobile 的隐藏写操作。
- AI 仅在每天提交时从当天稳定证据生成出勤推理；有效的当前班级老师确认后才写入
  正式出勤。Admin 可催办、退回和跨日 reopen，不能代确认。
- 同日由有效班级老师直接修订；跨日由 Admin reopen 后仍由有效班级老师修订，全部
  保留提交人、修订人和输入 revision 审计。
- 园区 Admin 可以编辑和发布包括医疗类在内的知识，并可关联权威来源。RAG 回答必须
  区分、引用园区材料或权威来源；医疗来源冲突不得由 AI 静默混合。
- Nurture 保留场景知识语义、metadata、policy、presenter 和 safety routing；
  My-Chat 保留通用知识/向量检索/RAG/model gateway 和 host shell。
- 本轮只更新 T-007 规划与语义文档；没有代码、schema、runtime、provider、模型或
  capability activation 变更。

## 2026-07-30 — D-04 class-first Admin mobile and communication visibility locked

- Admin mobile 从园区统一时间线改为班级顶层入口；园区层只保留园区级事项、班级列表
  和跨班级异常。
- 每个班级使用独立的有效日程、一日活动、今日沟通与关注和家园共育；日程允许园区
  默认、班级覆盖和当日临时安排。
- 照片/文字/活动记录先按显式 activity ref，再按当日安排和班级日程/时间自动落位，
  AI 仅后置处理歧义；无法确定时留在本班待归位。
- “无记录”不等于“活动未开展”，班级卡不得把记录覆盖转写为活动完成或老师绩效。
- 园区业务沟通从发送前即披露 Institution Admin 监督读取用途，Admin 无需老师升级
  即可只读查看当前授权正文、附件与变更状态。
- Admin read 不包含家庭私密 AI、草稿、私人聊天或其他 Institution，也不授予
  CareGroup acknowledge/reply/correct/redact。
- 后置 AI attention 只在相同 owner-read 范围内突出带引用的介入候选，不自动行动、
  归责、诊断或评分。
- 该决定要求 T-004 visibility matrix、T-005 owner-read presenter 和注册 context
  contract 增加一个 versioned、default-off 的 Institution Admin protected read；
  当前 manifest/module/source 尚未实现或启用。

## 2026-07-30 — D-05 class card/detail and complete Web records locked

- 将模糊的“代表照片”改为可解释的“最新照片”：有效显式封面优先，否则使用当前
  活动最新合格照片，再 fallback 到本班今日最近活动；不调用审美/生成式 AI。
- 待复核、candidate-only、归属不明、已撤回/删除/失权的照片不进入卡片；source
  失效或重新归属后按新 snapshot 重算。照片不 crop、不美化、不生成人脸特写。
- 班级卡只显示当前/下一活动、正式出勤提交状态、最新照片/文字、source timestamp
  和待处理数量。沟通正文、AI 出勤推测、孩子名单、匹配 confidence 与绩效/freshness
  分数留出卡片。
- 班级详情提供完整 actor-safe 一日活动、沟通、家园反馈与正式出勤状态；孩子级
  下钻仅服务于明确沟通/出勤/证据核对 purpose。
- Admin Web 可新增园区来源照片/文字、查看完整原图/正文、设置封面并调整活动/孩子
  关联。老师原始内容、作者和时间不可原地覆盖；调整追加 revision 并保留自动匹配、
  操作者、原因和完整变更历史。
- Web 只是 Nurture query/action 的操作面，不成为照片/文字的第二 canonical owner；
  当前仍是文档决策，未修改代码、schema、manifest 或 module。
- 本轮文档变更保留在现有共享 dirty worktree，尚未 commit；不得描述为已实现或
  landed contract。

## 2026-07-30 — D-06 support-signal semantics locked

- Support Signal 固定为“园区可能需要提供支持”的非 canonical 投影，不是异常定责、
  绩效分或 `InstitutionWorkflow`。
- 第一版包含 canonical deadline/blocker 驱动的确定性状态，以及园区显式配置的
  absolute count/time-window 负荷规则；未配置的负荷规则保持 disabled。
- 用户只看到“需要处理 / 建议关注”两级。前者仅对应明确 overdue/blocker，后者用于
  绝对负荷阈值和未来 AI attention；AI 不决定级别。
- Mobile 首页最多突出三个跨班信号，班级卡只显示 body-free count/safe reason，并
  通过 exact owner-read 下钻；Mobile 不提供 dismiss/ack/escalate 写操作。
- Admin Web 提供 policy 配置、来源查看和既有 source action；WorkItem/Workflow 必须
  独立显式创建，signal 不自动升级或通知他人。
- source 解决、纠正、撤回、redaction、revoke 或失效后投影自动消失；不保留老师/
  班级长期“标红”历史。AI 内容介入继续 default-off。
- 当前仍为未提交文档决策；没有代码、schema、manifest、module 或 runtime activation
  变更。

## 2026-07-30 — D-07 enrollment-journey top-level scope locked

- 首个实现的 `InstitutionWorkflow` 只选择
  `EnrollmentJourneyWorkflowV1`；不并行实现 Grant-change 或通用 Workflow builder。
- 顶层旅程覆盖意向、沟通、可选到访、可选满班候补、identity/binding 与
  pending Enrollment/Grant/CareGroup 准备、trial-start、试入园/复盘、formal
  Enrollment 和完成。
- 将此前泛化的“等待期”纠正为 `capacity_waitlist`：只在目标班级满员时进入。等待
  Guardian、caregiver、system、未来日期或 blocker 是独立 waiting/blocking state，
  不进入候补顺序或容量统计。
- 意向期只保留最少 local provisional data；D-07C 后，实际试入园前必须完成
  Guardian-authorized My-Chat identity/binding 与 pending Enrollment/Grant/CareGroup，
  再由 trial-start commit 建立 active trial relationship；未绑定 provisional child
  不再允许产生内部试入园事实。
- Admin 对整体 journey accountable；Guardian、trial CareGroup caregiver 和 system
  owner 在各自步骤成为 waiting party。Caregiver 继续使用 role-bound mobile，不新增
  caregiver Web；Lead/coordinator 不增加权限。
- 原顶层草案曾把正式激活后的 settling period 作为完成前阶段；该部分已由 D-07F
  supersede。试入园本身承担适应过程，激活成功后不再等待第二段业务闭环。
- 本轮只锁顶层产品范围；精确阶段 enum、command/schema 与
  activation-success/completion event contract 仍待冻结；最终 `status +
  participationPhase` 映射与 owner/local 业务顺序由 package closeout 和 D-07E 锁定。
- 当前仍为共享 dirty worktree 中的未提交文档决策；没有代码、schema、manifest、
  module 或 runtime activation 变更。

## 2026-07-30 — D-07A inquiry/touchpoint boundary locked

- inquiry 默认最少数据固定为孩子称呼、出生月份或年龄段、期望入园时间、目标班型/
  年龄段、照护时间需求、来源、Host contact ref、安全 label 和 last/next touchpoint；
  法定姓名/完整出生日期推迟到后续明确 purpose/consent。
- raw phone/WeChat/email/account identity 由 My-Chat invitation/contact owner 持有；
  Nurture 只保存 opaque ref，owner contract 不可用时不降级复制明文。
- native 园区业务沟通通过 canonical Message/source owner-read；external phone/WeChat
  只保存 Admin structured summary，不保存/伪造 transcript、recording、screenshot 或
  raw export。修订 append-only。
- AI 只从当前授权、可引用的 native source 生成 summary candidate；Admin 确认后才
  形成 note。AI 不生成 intent/fit/conversion score，也不推进 Journey stage。
- `inquiry → intent_conversation` 必须由 Admin 在真实沟通后显式确认；新咨询、AI
  summary 或 next-follow-up 不能自动推进。
- 当前仍是未提交产品文档；exact DTO/persistence/owner-contact interface 未冻结，
  没有代码、schema、manifest、module 或 runtime 变更。

## 2026-07-30 — D-07B capacity waitlist qualification/order/offer locked

- 只有目标班级已满、家庭明确接受候补、目标班级和最少意向数据均已确认时，才形成
  `capacity_waitlist` 资格；`waitlistQualifiedAt` 不得回填为首次咨询时间。
- 园区可配置版本化 priority category；同一 category 内按 `waitlistQualifiedAt`
  FIFO，无 category 时全队列纯 FIFO。AI 不排序、不预测转化或适配。
- Admin 人工调整必须是显式 append-only override，记录前后位置、原因、操作者和
  时间；不得静默改写原资格时间或排序依据。
- 候补记录至少需要目标班级、期望入园日期/窗口、`waitlistQualifiedAt`、容量/
  policy revision、category/basis、`nextReviewAt`、continued-interest state、
  last-confirmed-at 和当前 waiting party；exact persistence schema 尚未冻结。
- 家庭只看候补状态、目标班级、下次复核时间和最近联系时间，不显示精确名次；
  Admin 可看完整顺序、category、依据和 override history。
- 每条候补必须有 `nextReviewAt`。未回复进入 `waiting_on_guardian`，按园区配置执行
  reminder/deadline；一次未回复不自动删除、降级或重排。
- 空位只创建 Admin source task。Admin 核实后发送有 `expiresAt` 的限时 offer；
  Guardian 必须显式接受，接受前不得自动创建 identity、Grant 或 Enrollment。
- 当前仍是未提交产品文档；没有代码、schema、manifest、module 或 runtime
  activation 变更。

## 2026-07-30 — D-07C My-Chat-bound normal trial care locked

- 前一版“缺少 binding 时可保留有限内部试入园事实”的分支已被本决定 supersede。
  provisional subject 只停留在 inquiry/visit/waitlist，不能进入实际照护。
- Guardian 接受 trial 后，先完成 current My-Chat Child/Family、scenario binding、
  Nurture association、pending Enrollment/Grant 和 exact CareGroup assignment；
  未完成时 Workflow 保持 `trial_preparation`，完成后由 trial-start commit 写 active
  trial relationship。
- 试入园不建立 TrialChild、独立 trial consent aggregate、媒体/出勤/retention
  pipeline 或 caregiver Surface。Guardian 接受以普通 owner action/evidence 保留。
- 班级老师按其他孩子的相同 role-bound mobile 流程记录 attendance、care facts 和
  media；照片自动关联、board、family publication 和 PublishProcess 复用既有 policy。
- `participationPhase=trial` 是既有 Enrollment/roster 的 canonical phase，不产生权限。
  试入园当天计入照护/安全人数和真实出勤，但不进入 formal Enrollment 统计。
- 转正式只把同一关系改为 `active`，不复制孩子或历史记录；退出时结束 assignment/
  Grant，历史沿用统一 retention/redaction。
- exact lifecycle field 与 command schema 仍未冻结；owner/local transaction
  ordering 已由 D-07E 锁定。没有代码、schema、manifest、module 或 runtime
  activation 变更。

## 2026-07-30 — D-07D bounded trial review locked

- trial offer 接受后关闭原 waitlist entry，并将 exact class capacity 转为一条有
  `trialStartsAt`、`trialEndsAt`、`reviewAt <= trialEndsAt` 的有界 reservation；
  同一名额不可并行承诺。
- review 到期只创建 Admin task/signal，不自动改变 trial、capacity、Enrollment、
  Grant 或 CareGroup。超过 endsAt 继续试入园必须先显式延长。
- caregiver 不填专用试入园报告；复盘复用 attendance、care facts、普通 observations
  和 family communication。AI 只生成 source-cited draft，不作 suitability/录取建议。
- Admin 结果限定为延长、提出正式入园、结束。正式方案等待 Guardian 明确接受且
  期间继续保留名额；结束释放名额。所有决定记录
  actor/time/source/reason/before/after。
- 结束 trial 不自动恢复旧候补位置；继续等待需重新取得 D-07B qualification 和新的
  `waitlistQualifiedAt`，例外走 append-only Admin override。
- 当前仍是未提交产品文档；exact reservation/review/formal-proposal/exit schema
  未冻结，没有代码、schema、manifest、module 或 runtime 变更。

## 2026-07-30 — D-07E safe formalization/exit ordering locked

- [SUPERSEDED by 2026-07-30 package closeout state mapping] 初稿把 Enrollment lifecycle
  表达为 `trial | active | ended`；最终映射复用现有 status enum，并增加独立 canonical
  `participationPhase=trial|formal`。
- formal activation 需要 Guardian 接受 current proposal；随后 My-Chat 重验
  Child/Family membership 和 scenario binding，Nurture 在 commit 时验证短期 signed
  evidence。
- 一个 Nurture local transaction 原子完成 trial→formal phase、reservation→active
  occupancy、Grant/CareGroup 更新和 audit/idempotency。跨 owner 不宣称 distributed
  transaction。
- owner outage、binding drift、evidence expiry、version conflict 或本地失败均保持
  `status=active + participationPhase=trial + reserved`，进入 waiting_on_system 并
  exact replay；surface 只在 commit 后显示 formal。
- end trial 是 owner outage 下仍可执行的 Nurture local downscope transaction：
  `status: active→ended`（历史 phase=`trial`）、结束 CareGroup/trial Grant、释放
  reservation。之后只创建 Admin task。
- exit 不删除 My-Chat identity/membership/binding、Nurture association 或历史 care
  facts；只停止未来 caregiver access/publication，历史沿用 T-006 lifecycle。
- 当前仍是未提交产品文档；exact command/evidence/idempotency/outbox schema 未冻结，
  没有代码、schema、manifest、module 或 runtime activation 变更。

## 2026-07-30 — D-07F separate settling period removed

- 产品判断更正为：trial 本身就是适应期，不在正式 active Enrollment 后增加第二段
  settling period。
- 需要更多观察时在正式激活前显式延长 trial；继续复用普通 attendance/care/
  observation/communication，不新增 caregiver 表单或 AI 适应评分。
- Nurture activation commit 是最后一个业务里程碑。Workflow 消费成功事实后幂等
  complete；delivery/replay 失败只产生 technical waiting，不是业务阶段。
- 不要求额外 Guardian 回复、Admin 完成确认或时间门。trial end 走 D-07E 的未正式
  入园结束路径。
- exact completion terminal label、event/envelope 和 projection schema 仍未冻结；
  没有代码、schema、manifest、module 或 runtime activation 变更。

## 2026-07-30 — Package closeout audit fixes locked

- D-05 与 T-006 authority 对齐：Admin 可调整 activity placement、封面、园区说明和
  downscope hide，但不能确认/新增/替换 canonical child attribution。Admin 只创建
  correction candidate/WorkItem，exact CareGroup caregiver 确认；多角色用户必须切换
  caregiver role。
- Enrollment 状态映射固定为现有 `NurtureEnrollmentStatus` 加 canonical
  `participationPhase=trial|formal`：preparation=`pending`，真实 trial/formal
  relationship=`active`；正式入园只切 phase，trial exit 写 `ended`。
- 新增 `cancel_trial_preparation`：accepted offer 已占位但 trial-start 尚未 commit 时，
  可关闭 preparation shell 并释放 reservation，不依赖 Enrollment/Grant/CareGroup
  已存在，也不修改 My-Chat identity/binding。
- Workflow formalization 成功后完成；正式离园属于 ordinary Enrollment maintenance，
  不重新打开 Journey，也不默认创建第二个 Workflow。
- “enrollment offer”明确为 accepted trial-offer preparation shell；首轮没有 direct
  formal-enrollment bypass。
- D-06 创建边界改为 WorkItem 或“当前 registry 已注册且 eligible 的 Workflow”；普通
  support signal 不得启动 `EnrollmentJourneyWorkflowV1`。
- 所有未冻结 contract/schema 已迁入 `02-architecture.md` 的
  Pre-implementation Contract Freeze Register，逐项具有 owner、enablement gate 和
  default-safe behavior；首轮 roster/invite 固定单条操作。
- Workflow context、mobile UX、T-006 authority 说明、Lead glossary、feature checkpoint
  与官方 NHC 链接同步修正。当前仍无代码、schema、manifest/module 或 runtime activation。

## Contract Freeze Work Queue — Superseded by G4-0A～0G

以下 P0/P1/P2 是结构确认前的初始优先级草案，保留为历史映射；2026-07-30 起由
G4-0A～0G 的 rolling branch release 顺序取代。权威 owner/gate/default 继续见
`02-architecture.md#pre-implementation-contract-freeze-register`。

1. **P0 — Enrollment/Workflow core**：盘点现有 status/Enrollment/Grant/CareGroup/
   capacity，冻结 `participationPhase` migration、trial-start/preparation-cancel/
   formalization/exit transaction、waitlist/offer DTO 和 completion event。
2. **P0 — Cross-owner contracts**：冻结 My-Chat prospective-contact/current-binding
   evidence、Admin business-communication owner-read、Workflow private carrier，以及
   T-006 G3-D/E publication-policy owner contract/provider。
3. **P1 — Institution operations**：冻结 attendance、support signal、aggregate privacy、
   activity placement/downscope 与 caregiver-confirmed child-attribution contracts。
4. **P1 — Knowledge/RAG**：冻结 knowledge revision/publish、citation、medical-conflict
   review 和 My-Chat RAG owner contract。
5. **P2 — Deferred AI attention**：完成 model/policy/privacy/retention/invalidation
   qualification 前保持 absent/default-off。

## 2026-07-30 — T-006 Stage G3 policy-owner subset accepted

- 用户确认 T-007 全任务不成为 T-006 Stage G3 的串行前置；T-007 先交付
  publication-policy exact owner contract/provider。
- 子合同覆盖 institution timezone、default send、retry cutoff、organize
  idle/fallback/quiescence、effective version 与 policy head。T-006 解析并固化
  process schedule，后续策略变化不静默移动既有 process。
- T-006 对 `InstitutionWorkflowProjection` 的消费是按 beta profile 选择的只读
  module；absence/empty 不阻塞其核心看板、采集、草稿或发布。
- 当前只更新规划/架构合同，无代码、schema、migration、database、environment、
  capability activation 或 traffic 变更。

## 2026-07-30 — Stage G4 delivery structure accepted

- G4 overall goal 固定为 My-Chat host ownership 下的机构角色化治理闭环，不建立
  独立机构产品壳或 unioned super-surface。
- 交付视图固定为 G4-0 Contract & Fact Freeze、G4-A Authority/Aggregate、
  G4-B Role-bound Mobile、G4-C Admin Workbench Core、G4-D Enrollment Journey、
  G4-E Knowledge/RAG 和 G4-F Integration Qualification/Handoff。
- Phase 3 只在交付视图中拆成 C/D：普通 Web 运营与 Enrollment Journey 分属不同
  owner/failure domain；既有 D-01～D-07G 产品决策和 Phase 0～5 内容不被删除。
- 执行采用 rolling per-domain freeze；A 后 B/C/D/E dependency-aware 并行，D 的
  projection/commands 后接入 B/C，F 最终汇合。publication-policy subset 继续作为
  最早独立交付解除 T-006 G3-D/E 依赖。
- 下一步是整体确认 G4-0 的冻结范围和内部顺序。当前未提前冻结其 exact schema，
  也无代码、migration、database、manifest/capability、Candidate 或 traffic 变更。

## 2026-07-30 — Stage G4-0 scope and internal order accepted

- G4-0 固定为 0A Freeze Protocol/Fact Inventory、0B publication-policy fast lane、
  0C Authority/Surface、0D Daily Operations、0E Workflow/Enrollment、
  0F Knowledge/RAG 和 0G Cross-contract Audit/Branch Release。
- 0A 只建立最小 owner/fact/schema/gate ledger；0B 优先解除 T-006 G3-D/E 依赖；
  0C 是 G4 公共基础；0D/0E/0F dependency-aware 并行；0G 为各分支滚动签发
  Freeze PASS，而不是末尾一次性放行。
- freeze record 必须包含 exact owner/source pin、fact/projection/candidate 边界、
  schema version、authority predicate、lifecycle/concurrency/idempotency/replay、
  default-safe behavior、fixtures/negative tests 和 DB delta plan。
- register 补入三条原先只存在于正文的独立记录：active-role/exact Surface、
  class schedule/activity/revision/attribution，以及 InstitutionWorkflow
  registry/carrier/projection/command。
- G4-0 Branch Freeze PASS 不替代 Owner Integration Readiness、Joint Conformance 或
  G4-F。除 0B 的早期跨任务 consumer conformance 外，真实 owner/protected
  qualification 不前置到 G4-0。
- 下一步进入 0A 具体交付物确认。当前仍无代码、schema/migration apply、database、
  manifest/capability、Candidate 或 traffic 变更。

## 2026-07-30 — G4-0A deliverable structure accepted

- 新增 `06-g4-0-freeze-ledger.md` 作为 0A 的独立工作台账，包含 dependency pin、
  fact ownership、schema delta、branch routing、drift/default-safe census 和 Exit
  checklist。
- inventory state 固定为 `PRESENT_PINNED | DEFINED_UNQUALIFIED | GAP |
  DEFERRED_SAFE | NOT_APPLICABLE`；文档定义完成不能被误报为 qualified/pinned。
- 当前只记录可由正式 Context/task artifact 证明的 baseline。Exact revisions、
  digests、schema deltas 和 PASS 状态仍待 0A 实施核验。
- 下一步转入 G4 整体实施门、包级 DoD、总体验收与 T-007 Beta Profile Handoff
  收敛；无代码、migration apply、activation 或 traffic 变更。

## 2026-07-30 — Stage G4 implementation and overall acceptance accepted

- 实施门固定为 I0 Design/Synthetic、I1 Branch Freeze、I2 Contract Boundary、
  I3 Owner Integration Readiness 和 I4 Joint Conformance；每层只开放明确的下一类
  工作，不能越级声明真实 owner/protected readiness。
- G4-0/A/B/C/D/E/F 均具有独立 DoD；D 预计为最长业务分支，B/C 的非 Workflow
  能力继续并行，G4-F 只汇合已完成分支而不首次执行其负向验证。
- 总体验收固定为 Contract/Ownership、Product Closure、Authority/Privacy/Safety、
  Consistency/Recovery、Formal Integration 和 Handoff/Cleanup 六个维度。
- verdict 固定为 `PASS | PASS_WITH_LIMITATIONS | NO_GO`；limited pass 只能容纳
  optional fail-closed，任何 required/safety/owner/formal-ingress/cleanup 缺口均
  `NO_GO`。
- T-007 完成输出 Nurture-side Beta Profile Handoff，供 T-008 消费；不等于
  Candidate Freeze、native/device completion、activation 或 traffic authority。
- Stage G4 顶层规划至此收口。若开始实施，从 G4-0A exact inventory 开始；当前没有
  code、migration apply、database、manifest/capability、Candidate 或 traffic 变更。

## 2026-07-31 — Acceptance-to-check mapping accepted

- 用户确认验收条目机械化映射方案：G4-0 各分支 freeze（0B～0F）及各 package DoD
  冻结时为对应验收条目分配稳定 `T007-AC-###` ID，逐条映射到 conformance fixture、
  negative case、unit/integration test、lint/静态检查或 evidence census 之一；
  不可机械验证的条目显式降级为 `design_note`。
- 未映射条目不得勾选；package DoD 与 G4-F PASS 依据是映射检查通过。回链使用
  T-004 conformance manifest 的 AC 引用字段。详见 `01-plan.md`
  Acceptance-to-Check Mapping 小节。本次只更新规划文档，无代码或 schema 变更。

## 2026-08-01 — G4-0A inventory and G4-0B policy freeze

- Reconciled the 0A ledger with the exact G1 PASS: T-002 Owner Integration and
  T-004 Surface Contract inputs are now `PRESENT_PINNED` with exact refs rather
  than stale `DEFINED_UNQUALIFIED` prose.
- Added `07-g4-0a-inventory-record.md` with verdict
  `G4_0A_INVENTORY_PASS`; unresolved T-005/T-006/T-007/My-Chat Workflow/RAG
  inputs remain explicitly unqualified or gaps and route to one 0B～0F owner.
- Added `08-g4-0b-publication-policy-freeze.md`, freezing
  `nurture.institution-publication-policy@1.0.0`: IANA timezone, default
  release/cutoff, organize idle/fallback/quiescence, activity lease, policy
  version/head, new-process resolution and existing-process freeze semantics.
- 0B is a planning/contract freeze only. No policy repository, admin command,
  schema/migration, capability, database, activation or traffic effect exists;
  provider/consumer implementation and qualification remain pending.

## 2026-08-09 — G4-C increment 1 append-only revision/downscope

- Added `nurture.content-revision-downscope@1.0.0` with exact 0C Admin
  authority, complete-chain reads and three closed commands: placement adjust,
  monotone visibility downscope and protected institution note.
- Added one append-only Prisma owner and migration. Placement projection and
  revision commit atomically; visibility/note have no mutable shadow column.
  The old direct Admin placement port is removed.
- Quality review replaced a three-layer schedule union with the existing
  single effective-schedule owner and added a storage-time fence so a stale
  automatic pass cannot overwrite Admin.
- The approved disposable PostgreSQL qualified all 28 migrations, 22/22
  targeted regressions, direct constraints and 370/370 full DB tests; the
  exact target is destroyed and confirmed absent.
- At the increment-1 boundary, G-02 was closed and G-05/0D-4 were the next
  units. No caller, capability, durable apply, deployment, activation or
  traffic was added.

## 2026-08-09 — G4-C increment 2 capture intake and attribution correction

- Connected stored care-capture intake to the existing deterministic placement
  pass. Exact class, Institution-local date and minute come from stored owner
  facts; the existing schedule provider and storage-time Admin precedence fence
  remain the only placement path.
- Added `nurture.child-attribution-authority@1.0.0` and an append-only
  `NurtureAttributionCorrectionCandidate`. Only the exact selected current
  Institution Admin can append a sourced report; exact-class caregivers can
  read it and continue to use T-006 for canonical attribution decisions.
- The candidate has no status, head, expiry, deadline, resolution,
  proposed-child or publishability state. It changes neither canonical
  attribution nor exposure.
- Quality review moved fresh runtime imports off stale `dist/harness`, added a
  domain-level exact role-assignment assertion and mapped six existing physical
  FK names so whole-schema diff is zero.
- The approved disposable PostgreSQL applied all 29 migrations, passed 7/7
  exact-owner and 377/377 full DB tests, then was destroyed with zero sessions.
  Full unit tests passed 842/842.
- G-04 and G-05 are closed at I1. Next is 0E Workflow/Enrollment Journey
  freeze, then 0F Knowledge/RAG; G-03's missing blocker remains an external
  owner gate.

## 2026-08-09 — 0E freeze and G4-D increment 1

- Issued the four 0E unit freezes, 0G audit and `G4_0E_EXIT_PASS`: one
  Enrollment Journey registry/inquiry carrier, capacity-only waitlist and
  preparation reservation, status+phase trial lifecycle, and current-owner
  formalization/completion.
- The audit assigned inquiry to the single Journey instead of a CRM Workflow,
  made formal Enrollment a milestone committed atomically with `completed`,
  and kept shared Run/Step/ledger/outbox replay in My-Chat.
- Implemented only the released pure slice: one local domain registry, exact
  stage/waiting/pending/lifecycle/outcome/milestone vocabularies, fail-closed
  combination validation and a body-free Admin mobile/Web projection with no
  capability refs.
- Quality review replaced a Nurture-ref masquerade with an exact My-Chat-owned
  workflow Run `CanonicalRef`, rejects unknown/extra ref fields and vocabulary
  drift, allowlists the projected ref fields, and constrains pending/terminal/
  milestone combinations. Completed business state may retain only technical
  `waiting_on_system`; no Guardian/Caregiver wait survives terminal state.
- The canonical manifest/module remain unchanged and contain no
  `EnrollmentJourneyWorkflowV1`. No Prisma, migration, DB, owner adapter,
  production caller, capability, activation or traffic was added.
- Targeted tests passed 15/15; full unit passed 857/857 across 77 files;
  scenario typecheck, manifest check, persistence boundary, port topology,
  governance lint and `git diff --check` passed.
- The exact implementation commit is `17c0b97`. C30-I3's local source lock was
  refreshed to `50361da1…`, and the Nurture exact runtime self-pin to
  `c5b57c06…` over 236 files. The external My-Chat revision remains the
  attributed expected `567b96c` versus observed `05e8331` failure; no adoption
  was performed.
- Next is the private workflow/inquiry/touchpoint carrier plus command,
  repository and migration authoring under the DB-SSOT gate. No database apply
  is authorized by this increment.

## 2026-08-09 — G4-D increment 2 source and migration artifact

- Quality-reviewed increment 1 and added exact Workspace/Institution/Admin
  projection admission, strict runtime shape/time/ref checks, milestone/stage/
  terminal consistency and the legal skipped-visit path.
- Added six inquiry commands over `NurtureCommandExecution`; exact owner refs,
  not mutable owner labels/timestamps, form request identity for replay.
- Added one private Prisma repository inside the existing serializable command
  transaction and four carrier tables with append-only/scope/head/protected
  storage fences. No workflow outbox or legacy project path was added.
- Added a body-free query composition service. It does not return the private
  workflow ref or inquiry/contact facts and does not register a capability.
- Prisma SSOT/context, migration and three production-DB cases are authored.
  No database was connected or applied; the DB suite remains explicitly
  unexecuted pending a new exact disposable target approval.
- Scenario/DB/direct TypeScript checks, 27/27 targeted, 869/869 full unit,
  persistence, port, formal-ingress, routing, manifest/module absence and diff
  hygiene pass. See [`58`](./58-g4-d-increment-2-record.md).

## 2026-08-10 — G4-D increment 2 final quality pass

- Replaced the persisted workflow-run hash with the exact canonical
  `workflowRunRef.object_id`, constrained it against the JSON ref and made it
  Workspace-unique. One My-Chat Run can no longer bind two local Institution
  workflows, and no second derived identity can drift.
- Made canonical refs and protected envelopes exact-key checks whose helpers
  return `FALSE`, not SQL `NULL`, for missing shapes. Closed responsible roles
  now use one domain vocabulary shared by command validation and persistence.
- Mirrored lifecycle/stage/prerequisite and terminal milestone invariants into
  PostgreSQL functions. Transition finalization now proves the exact command
  scope, current Institution Admin actor, no milestone re-addition and the
  cumulative transition state before advancing the head. A deferred constraint
  also requires every committed workflow head to have its exact transition.
- Mapped deterministic apply-time write races to stable conflict/blocked
  decisions instead of reporting every rollback as a technical error.
  Command results expose only local workflow and transition refs; inquiry and
  touchpoint carriers remain private repository facts.
- Expanded unit and authored PostgreSQL falsification coverage without adding
  a parallel model, compatibility path or temporary artifact. The migration
  remains unapplied pending a newly approved exact disposable target.
- Rechecked exact owner facts at the command boundary, rejected native owner
  verification before source occurrence and rejected external corrections
  whose recorded occurrence predates the source touchpoint.
- Refreshed only the local Nurture exact-runtime self-pin to
  `fdb2f9d9…` over 239 files. This does not adopt or conceal the independently
  divergent My-Chat revision.
- Re-froze the affected C30-I3 local profiles at implementation revision
  `695630d`, aggregate hash `273abb78…`; unchanged upstream Base/Host fields
  remain untouched.

## 2026-08-10 — G4-D increment 2 DB qualification and increment 3

- Qualified increment 2 on an exact approved disposable PostgreSQL target:
  all 30 migrations, targeted 3/3, full DB 380/380, current migration status,
  zero drift and zero-session destruction passed.
- Implemented 0E-2 with eight closed commands and five private carriers for
  policy, FIFO entry, append-only override, explicit trial offer and held
  exact-class reservation. Default policy is standard-only FIFO; entry order
  remains pinned until an explicit Admin override.
- Kept Admin ordering facts separate from the family-safe status projection.
  Guardian acceptance locks and recounts the exact class; preparation
  cancellation releases capacity without Enrollment, Grant or My-Chat effects.
- Quality review fixed open policy supersession, permanent reservation
  uniqueness, missing Guardian actor retention and stale accepted-family
  projection admission. A final temporal pass also rejects Guardian review,
  decline, withdrawal and cancellation actions predating the state they mutate.
- The release audit fixed four further boundary defects: canonical action
  uniqueness now includes `object_type`; held reservations fence direct
  CareGroup capacity/status/deletion downscope; accepted preparation uses the
  current offer review time; and Admin queue reads select only required fields,
  cap at 500 and fail unavailable rather than silently truncating.
- True concurrent acceptance exposed a finalizer-stage PostgreSQL serialization
  abort. Added a repository rollback-classification port and one shared
  retryability helper: only infrastructure outcomes and explicit
  `command_write_conflict` retry with the same command identity; ordinary
  business conflicts remain terminal.
- Qualified all 31 migrations on approved disposable targets. The final exact
  target `nurture_t007_g4d_i3_release_20260810_05` passed targeted
  inquiry/waitlist DB 8/8 and full DB 385/385 across 42 files; full
  unit passed 874/874 across 79 files; status and datasource drift are clean.
  Every diff, qualification and rerun target was destroyed and confirmed absent.
- The initial behavior-preserving simplification checkpoint removed 114 lines
  from the three largest increment-3 files. Required release-audit guards and
  falsification tests brought the final comparison to 3,239 -> 3,214 lines
  (net -25): no dead compatibility path or duplicate runtime was retained.
- Refreshed the DB context and Nurture exact-runtime hash (`f03b75fb…`, 242
  files). C30 default-off remains green. After the implementation commit,
  affected local profiles were re-frozen at exact revision `e7604ec` and
  aggregate hash `57e4759f…`; unchanged Base/Host fields were retained. My-Chat
  remains unadopted at observed `fd2a213c` versus expected `567b96c`.

## 2026-08-10 — G4-D increment 4 trial lifecycle

- Added one nullable Enrollment phase and no new business table. Existing
  active rows backfill formal; active new/current rows must declare trial or
  formal.
- Added six private command specs and one repository owner inside the existing
  serializable command transaction. Preparation/start revalidate current C30
  binding owners and exact local association heads; end uses local authority
  only so My-Chat outage cannot preserve future access.
- Reused the accepted offer/reservation, Enrollment, Grant, CareGroup and
  workflow transition chain. Review time does not write; one explicit extension
  retains the same seat and cannot exceed the Grant policy snapshot.
- Database replay found and repaired narrow pre-0E-3 workflow identity,
  due/stage-loop and converted-release constraints. Full DB regression then
  caught an implicit dynamic formal fixture and an over-broad active-Grant
  uniqueness rule; both were corrected without a compatibility path.
- Final architecture review restricted the Guardian canonical ref to the
  current My-Chat `actor`, bound trial start to the pending Grant's exact
  granting participant and stored terms, required active local Child/Family/
  CareProcess plus a currently effective Guardian role, and made the deferred
  reservation invariant reject unaudited date drift. The phase-aware indexes
  replace the two indexes they subsume instead of creating parallel
  enforcement/read paths. The unused aggregate payload export was removed.
- Final qualification passed targeted 6/6, full production DB 386/386, full
  unit 876/876, typecheck, structure gates, current migration status and zero
  drift. DB context checksum is `30086d74…`; both exact disposable targets were
  destroyed and confirmed absent.
- After the implementation commit, affected C30 profiles were re-frozen at
  exact revision `407cb97` with aggregate `49793dc5…`; the Nurture exact
  runtime pin is `7c3b1564…` over 245 files. Base/Host pins were not advanced.
- No caller, capability, module/manifest registration, deployment, activation
  or traffic was added. 0E-4 remains the next dependent unit.

## 2026-08-10 — G4-D increment 5 formalization and completion

- Added one immutable formal-proposal owner and one private formalization
  command inside the existing serializable command-ledger transaction.
- The same Enrollment changes `trial -> formal`; the existing Grant is narrowed
  to accepted terms; the converted reservation remains occupied; and the
  workflow reaches `completed/formalized` with one immutable acceptance audit.
- Extracted the exact Child/Family/current-Guardian checks from the trial
  repository into one shared local verifier. No second current-owner adapter,
  alternate formalization state or Host outbox was introduced.
- Empty-database replay repaired old Guardian transition compatibility,
  disjoint formalization trigger routing, proposal time boundaries and exact
  proposal-link storage. Expired evidence now returns an owner denial instead
  of a business conflict.
- Qualification passed 33 migrations, targeted 7/7, full DB 387/387, full unit
  878/878, root typecheck and structural gates with zero schema drift. Only an
  evidence digest and detached metadata allowlist are persisted.
- This closes frozen 0E-4 at private I1. No caller, capability, module/manifest
  registration, durable apply, deployment, activation or traffic was added;
  I2 is next and I3 remains blocked by G-09.
- The implementation commit is `c4ac700`. Its affected local C30 profiles are
  re-frozen at aggregate `9a88a32a…`; the Nurture exact-runtime self-pin is
  `6b8edb81…` over 249 files. Base/Host and the divergent My-Chat pin were not
  advanced.

## 2026-08-10 — G4-D increment 5 quality repair

- Replaced the coupled `formalStart <= acceptedAt` predicate with separate
  acceptance-window and effect-time checks. Guardian acceptance may precede a
  future formal start, and timely acceptance remains valid after proposal
  expiry when fresh owner evidence and unchanged local heads pass.
- Removed the unreachable proposal revision lane. V1 now has one immutable
  proposal per workflow, `proposal_head=1`, one workflow unique index and no
  greatest-revision queries or revision-chain trigger branches.
- Added true competing-command coverage. It exposed raw-query serialization as
  Prisma `P2010` with nested PostgreSQL `40001`; both nested and top-level codes
  now reach the shared retryable `command_write_conflict` classifier.
- Qualification passes targeted PostgreSQL 9/9, complete PostgreSQL 389/389,
  unit 878/878, root typecheck, 33 migrations from empty, current migration
  status and zero datasource drift. The manifest/module and default-off posture
  remain unchanged.
- Registered the proposal table in the G3 persisted-table census. After exact
  implementation commit `1a79e13`, the C30 lock was re-frozen at aggregate
  `ef33c0bd…` and the Nurture exact-runtime pin at `25b7ad2f…` over 250 files.
  Base/Host fields and the divergent My-Chat revision were not advanced.

## 2026-08-10 — G4-D I2-A public wire artifact

- Rotated `nurture.surface-contract` once from `1.18.0` to `1.19.0`, exact
  digest `6f67d49c…`, with 58 capabilities and six unchanged surface identities.
- Added three query descriptors and one descriptor for each of the 21 completed
  Enrollment Journey commands. Three aggregate schema files replace a
  per-command input/result file pair; identical empty/reason/result shapes and
  five actor-level eligibility policies are shared without hiding individual
  command roles, confirmation or head bindings.
- The first review rejected a wider token constraint and an open-ended action
  result. Public tokens now match the private I1 vocabulary, and action effects
  are closed to the exact 21-command enum.
- Institution mobile remains action-free. Guardian surfaces receive only their
  family-safe waitlist result and Guardian/mixed actions; caregiver surfaces
  receive none. Guardian visibility now names the explicit
  `enrollment_journey_guardian_actions_only` rule.
- Public inputs exclude trusted Workspace/role, owner snapshots/evidence,
  private Workflow refs, expected local heads and derived state. Exact heads
  remain confirmation bindings; the family result remains rank/category/ref-
  free.
- All new descriptors require the unique unqualified
  `t007_enrollment_journey_runtime` gate. Manifest/module, runtime handlers,
  owner adapters and persistence are unchanged, so I2-A is not activation or
  owner-integration evidence.

## 2026-08-10 — G4-D I2-B surface adapters

- Added one cohesive Enrollment Journey surface adapter. It validates the
  exact I2-A request shell and operation family before resolving a server-only
  prepared binding; caller-supplied Workspace, active role, owner evidence,
  protected bodies, private refs and expected heads are rejected as extra
  fields.
- Action request types require a confirmation ref while query types prohibit
  one. The ref is forwarded unchanged to the command executor; the future I3
  implementation must verify its input/target/head binding and consume it in
  the same transaction as the I1 effect, never in the surface adapter.
- The adapter uses an explicit 21-case command map to the existing I1 specs.
  This is deliberate closed-world dispatch, not a generic transition endpoint
  or a duplicate lifecycle engine. The three reads reuse the existing Journey
  and waitlist query services.
- Institution and Guardian surfaces have separate role matrices. The internal
  query and command keys also enforce separate lanes, so a valid query cannot
  be submitted through the command key or vice versa.
- Presenters omit private Workflow/entity refs, seal Admin targets, keep the
  family waitlist free of rank/category/policy facts, and verify the full
  canonical Workflow Run tuple before projecting committed/query results.
- `nurtureScenarioModule` remains fail-closed through unavailable default
  dependencies. The generated manifest records disabled surface composition;
  no scenario-service ingress, owner provider, database code or activation was
  introduced.
- Adapter request/response names are intentionally internal. They compose the
  public business DTO with opaque prepare/confirmation refs but do not fork the
  generic Surface invocation/error contracts; I3 will provide their only
  formal-ingress mapping.

## 2026-08-10 — G4-D I2-A/I2-B quality and cleanup

- Fixed the trusted-boundary order: malformed trusted Workspace/actor/request
  identity now fails before the injected binding resolver is called.
- Froze the canonical unavailable dependency graph, removed its package-root
  export surface, and made Admin waitlist option issuance carry the exact
  private entry ref/head instead of an ambiguously named target head.
- Reduced four copied 24-key exception inventories to derivation from the one
  `t007_enrollment_journey_runtime` gate. The dedicated I2-A suite remains the
  sole exact inventory owner, so adding a capability still requires one
  deliberate contract edit without duplicating runtime lists.
- Replaced source-text assertions with actual manifest/module behavior checks
  and expanded the adapter suite from 7 to 14 cases for trusted-context,
  mixed-role and query-result drift coverage.
- Full qualification passes 901/901 unit tests, root typecheck, Surface
  Contract 130/130 plus tooling 5/5, and all structural gates. No DB path or
  database operation was introduced.

## 2026-08-10 — G4-0F scope and generic owner source pin

- Added a dedicated SSOT pin for the exact My-Chat Knowledge domain, PBR and
  generic RAG public boundary, including their package export manifests. Its
  verifier reads committed Git objects at the pinned revision, so the
  divergent sibling checkout cannot silently change the freeze input or be
  mistaken for owner adoption.
- The generic owner boundary is reusable for search, PBR, current citation
  validation and citation packaging. It does not supply Institution revision,
  audience/applicability, Admin draft preview, authority-linked medical
  provenance, conflict review or a scenario source/currentness bridge.
- Accepted three non-overlapping 0F units: lifecycle/provenance,
  retrieval/owner bridge, and citation/answer safety. Publication, retrieval
  eligibility and read authority remain distinct gates.
- Explicitly excluded the family-scoped legacy `NurtureContextMaterial` and
  `NurtureRuntimeContextPack` models, child-specific/private facts and all
  local provider/vector/prompt/model runtime work. Scope freeze creates no
  knowledge fact, database change, model call, index, capability or traffic.

## 2026-08-10 — G4-0F-1 lifecycle and provenance freeze

- Froze `nurture.institution-knowledge-lifecycle@1.0.0`: one stable
  Institution item, immutable structured revisions, append-only source links
  and events, explicit review/publish/revoke, expected-head concurrency and
  the existing command ledger.
- Kept authorship and authority provenance separate. Every revision remains
  `institution_authored`; a verified authority link is a separate source and
  never upgrades the Institution statement.
- Publication, current time and retrieval eligibility remain independent.
  Admin may publish medical-class content without an authority link, but 0F-2
  must keep it out of online retrieval until its stricter predicates pass.
- Reused the existing protected-content port and its exact 8 KiB plaintext
  limit. Requested authority links are atomic with revision creation; an owner
  failure cannot silently save a partial revision without the requested link.
- Planned four new Nurture tables only. Legacy family corpus/runtime tables and
  all My-Chat model/vector/index facts remain excluded; no schema was authored
  or applied.

## 2026-08-10 — G4-0F-2 retrieval and owner bridge freeze

- Froze `nurture.institution-knowledge-retrieval@1.0.0` with three closed
  purposes: Host indexing, Admin online answer and exact Admin editor preview.
  Generic `public_rag_answer` and unqualified reserved-source mappings are not
  compatibility fallbacks.
- Split Host index admission from request-time online eligibility. Future
  effective reviewed material may be indexed, but current Admin authority,
  applicability, time and source currentness must pass before any candidate
  enters model context.
- Defined bounded Nurture source-change/current-source pull, My-Chat candidate
  retrieval and Nurture final-currentness ports. Host owns cursors/index/retry;
  Nurture owns source truth and never imports Host ORM/RAG/provider code.
- Added current-source reconciliation because lifecycle events alone cannot
  rediscover time-window or authority-source currentness changes. Index/cache
  presence remains non-authoritative, and used citations require a later 0F-3
  revalidation after generation.
- Admin preview is all-or-nothing, same-Institution, exact-revision and
  in-memory only. It can display explicit draft warnings but cannot index,
  publish, export or leak into online answer.
- 0F-2 itself plans no Nurture table beyond 0F-1; 0F-3 still owns any exact
  conflict-review/safety fact. No source, model, index or DB operation was
  executed. The Institution-specific My-Chat delta remains defined but
  unqualified.

## 2026-08-10 — G4-0F-3 cited answer and safety freeze

- Froze `nurture.institution-knowledge-answer-safety@1.0.0`: strict replayable
  Host claim drafts, Nurture-built source-identity citations, pre/post owner
  currentness, deterministic request/source/draft safety and bounded answer
  dispositions.
- Every positive claim is cited; medical facts/actions/danger signals require
  a current authority-source citation. Model prose, URLs, citation refs, trust
  upgrades and safety self-ratings remain untrusted and cannot enter results.
- Kept the authority-currentness bridge unqualified: the pinned generic
  `sourceVersion` and excerpt fingerprint cannot be renamed into the exact
  authority content hash required by the scenario citation contract.
- Kept all online generation unavailable until one exact deterministic safety
  provider qualifies. Field-level child-ref exclusion is not treated as enough:
  child/private facts in free-text questions or drafts produce a safety
  abstention and are never persisted in Nurture candidate/command facts.
- Defined one immutable, protected conflict-review candidate deduplicated by
  exact rule/finding/source/revision identity. It has no status/deadline/
  blocker or dismiss path; remediation uses the existing immutable
  revision/review/publish/revoke lifecycle instead of a second knowledge state
  machine.
- Copy/export is an Admin-only portable presenter that must preserve every
  citation, AI provenance and applicable fixed safety notice. It creates no
  delivery, family visibility or canonical answer row.
- Planned one Nurture conflict-candidate table and reused the command ledger
  plus protected-content port. No schema, DB, model, source, export or runtime
  operation was executed; all scenario generation/safety bridges remain
  defined but unqualified.

## 2026-08-10 — G4-0G audit of the 0F branch

- Issued `G4_0G_0F_AUDIT_PASS_AFTER_REPAIR` over records 64–67.
- Removed the persisted conflict candidate from 0F-2 retrieval currentness.
  Treating the candidate as an eligibility hold changed an exact retry from
  conflict abstention to no-source and created a second safety-policy SSOT.
  Every invocation now reuses the one deterministic answer-safety owner;
  candidate append remains immutable/deduplicated review evidence only.
- Clarified that 0F-1 owns exactly five knowledge-lifecycle mutations. The
  internal 0F-3 candidate append uses the shared command ledger but is not a
  sixth lifecycle command, public capability or review decision.
- Reconfirmed five non-overlapping planned tables: four 0F-1 Knowledge facts,
  none for 0F-2 and one 0F-3 candidate fact. No schema or DB operation occurred.
- Recomputed nested bounds and verified that 16 final citations fit both owner
  currentness paths without truncation. Generic owner pin remains exact; all
  Institution generation/currentness/safety bridges remain unqualified.
