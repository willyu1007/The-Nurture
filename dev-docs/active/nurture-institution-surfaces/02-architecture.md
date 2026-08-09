# Architecture — 机构端双 Surface

## Institution Boundary

机构关联、group membership、enrollment 或 scenario binding 只决定路由候选范围。读取事实仍需 actor role、grant、child scope、fact visibility 和用途策略同时通过。

## T-006 Stage G3 Publication-policy Owner Contract

T-007 拥有园区运营配置；T-006 拥有 `PublishProcess` 与 release execution。两者通过
一个 versioned owner contract 连接，不共享数据库模型或 UI state。

最小 owner output 包括：

- institution timezone；
- default send local time 与 automatic retry cutoff local time；
- organize idle duration、fallback lead time 与 capture-quiescence duration；
- automatic-trigger enablement/profile；
- effective range、stable `policyRef`/`policyHead` 与 source revision。

T-006 在创建或重新排期一个尚未发布的 process 时通过 current owner-read 解析并保存
`scheduledAt`、`notAfter`、timezone 与 policy head。T-007 后续配置变化不能静默移动
既有 process；是否允许显式重新排期由 T-006 capability/current policy 决定。

该子合同是 T-006 G3-D/E 硬依赖，但不是 T-007 整体 completion gate。T-007 可先交付
contract/provider qualification，T-006 再在 G3-E 完成 consumer joint qualification。
`InstitutionWorkflowProjection` 是另一条独立、可选、只读的 G3-A module；无适用
Workflow 或 owner unavailable 时返回合法 absent/empty，不影响 publication policy。

## Confirmed Product Decisions

### D-01 — Role and Lead semantics

- 当前精确园区管理角色为 `institution_admin`。
- Lead 是由 Admin 确定的内部分工/责任标识，不是独立 authority role，不增加
  visibility、capability 或 Web 权限，也不等同“园区负责人”。
- 访问能力始终由 active role、Workspace、Institution、scope、assignment、
  Grant/fact visibility 与 purpose 共同决定。

### D-02 — Role-bound surfaces

- mobile board 与 Web workbench 均绑定一个显式 active-role context；同一用户拥有
  多个角色时必须切换角色，不提供合并权限的超级看板或超级工作台。
- 当前 T-007 只定义 `institution_admin` 的 Web 操作台
  `InstitutionAdminWorkbench`。Caregiver、Guardian、Lead 等角色的 Web 工作台
  留待后续按角色单独定义。
- `institution_admin` mobile board 只读。老师的每日出勤提交属于 caregiver
  mobile Surface，不是 Admin mobile 的隐藏写操作。

### D-03 — Responsibility queue and Admin Web scope

- 园区工作以责任角色队列呈现，但普通 CRUD/action、短期异常 WorkItem 和
  `InstitutionWorkflow` 必须保持不同语义。
- 只有需要跨阶段恢复、明确责任流转、里程碑和审计的园区管理过程才进入
  `InstitutionWorkflow`。
- 当前 Admin Web 包含人员与关系、日常运营、家长触达、数字资源、园区知识/RAG 和
  `InstitutionWorkflow` 操作；不扩展成完整 CRM/ERP。

### D-04 — Class-first Admin mobile and institution communication

- Admin mobile 以班级为顶层入口。园区层只展示园区级事项、班级列表和跨班级异常，
  不用一条统一时间线假定所有班级同时开展相同活动。
- 每个班级按自己的当日有效日程展示一日活动、今日沟通与关注和家园共育。日程支持
  园区默认、班级长期覆盖、当日临时安排和 effective-date/version。
- 图片、文字与活动记录在本班范围内自动落位；没有记录只表示“尚未发现记录”，不能
  推断活动未开展。
- Nurture 内明确标识为园区业务渠道的 family-to-org、org-to-family 与家长直达园区
  沟通，从发送前即披露并绑定 Institution Admin 的监督读取用途。Admin 无需等待老师
  升级即可只读查看正文、附件、更正和当前状态。
- 该读取不包含 Guardian family-private AI conversation、未发送草稿、My-Chat 私人
  聊天或其他 Institution Enrollment，也不授予 Admin acknowledge/reply/author-change
  capability。
- AI 介入判断后置；未来只可在相同 owner-read 范围内产生带来源的
  `InstitutionAttentionCandidate`，不能自动行动、诊断、归责或形成绩效评分。

### D-05 — Class card/detail and complete Web records

- 班级卡是当前状态入口，不是 KPI 面板。固定展示当前/下一活动、正式出勤提交状态、
  最新合格班级照片、最新文字、source timestamp，以及待回应沟通/家长新反馈/
  园区待处理数量；不展示沟通正文、AI 出勤推测或 freshness/绩效分数。
- 不使用主观“代表照片”。用户可选设置活动封面；未设置时按当前活动最新合格照片 →
  今日最近活动最新合格照片的确定性顺序选择“最新照片”。该选择不使用审美/生成式
  AI，不裁剪、美化或生成人脸特写，也不要求老师额外挑图。
- 班级详情展示完整 actor-safe 一日活动、园区业务沟通、家园反馈和正式出勤状态。
  child-level 下钻只在明确的沟通、出勤、活动证据核对等 purpose 下提供，不能演变为
  Admin 任意浏览的全量孩子档案。
- `InstitutionAdminWorkbench` 可记录和查看完整照片/文字，设置可选封面，并调整
  活动落位。Web 是操作面，canonical 事实仍由 Nurture 持有。
- Admin 可立即执行设置/取消封面、活动落位、园区补充说明，以及只缩小可见性或暂停
  发布资格的 hide/safety action。Admin-only 不得确认、新增或替换 canonical child
  attribution；发现错误时只能创建带来源的归属修正候选/WorkItem，由当前 exact
  CareGroup caregiver 确认。若同一用户同时持有 caregiver role，必须切换角色并通过
  T-006 capability 操作。
- Admin 不得原地覆盖老师的原始照片/文字、作者或 capture/source time。活动落位、
  园区补充说明、downscope hide 和 caregiver 确认的归属更正均追加 revision，保留
  原始自动匹配结果、调整 actor/reason 和完整 history；不得保存或展示人脸 embedding。

### D-06 — Support signals without performance scoring

- Support Signal 的语义是“园区可能需要提供支持”，不是异常定责、风险评分、老师
  绩效或 Workflow。
- 第一版包含两类规则：canonical deadline/blocker 驱动的确定性业务状态，以及园区
  显式配置的绝对 count/time-window 负荷阈值。负荷规则未配置时保持 disabled，不
  使用跨班/跨老师比较、历史基线异常检测或隐藏模型分数。
- 产品只展示 `action_required | attention_suggested` 两级，文案为“需要处理 /
  建议关注”。排序仅使用明确 deadline、业务状态和发生时间。
- Mobile 最多突出三个跨班级信号，班级卡只显示 body-free 数量/原因并允许只读
  下钻。阈值配置、来源业务 action、显式创建 WorkItem，以及当前 registry 已注册且
  满足业务 eligibility 的 Workflow 位于 Admin Web。普通 support signal 不得启动
  `EnrollmentJourneyWorkflowV1`。
- Signal 是可重建的非 canonical projection。来源解决、撤回、纠正、redaction、
  revoke 或失效后自动消失；不得自动回复、通知他人、创建 action/WorkItem/Workflow
  或沉淀为长期绩效历史。
- `InstitutionAttentionCandidate` 仍是独立、后置、default-off 的内容语义能力；
  它未来只能映射为 `attention_suggested`，不能自行升级为 `action_required`。

### D-07 — One complete enrollment journey Workflow

- 首个实现只注册 `EnrollmentJourneyWorkflowV1`，不同时实现通用 Workflow builder
  或第二个业务 Workflow。
- 顶层旅程覆盖：意向咨询 → 意向沟通 → 可选到访 → 可选满班候补 → 试入园准备
  （identity/binding 与 pending Enrollment/Grant/CareGroup）→ trial-start →
  试入园 →
  试入园复盘 → 正式入园确认/formal Enrollment → 完成。试入园本身就是适应期，可
  显式延长或结束；结束后若继续等待，需要重新取得候补资格。
- `capacity_waitlist` 只表示目标班级当前满员。等待家长、caregiver、system owner、
  已约定未来日期或 blocker 是 Workflow 当前 waiting/blocking state，不是候补阶段，
  也不得进入候补顺序/容量统计。
- 意向阶段只保留完成旅程所需的最少本地 provisional record 和 touchpoints，不创建
  CRM/营销评分，不 mint/infer My-Chat child/family identity。
- 意向/候补阶段可以只有 local provisional subject；实际试入园前必须由 Guardian
  创建/选择并授权 My-Chat Child/Family，完成 current binding、Nurture association、
  pending Enrollment/Grant 和 exact CareGroup assignment，再由 trial-start commit
  写入 active trial relationship。未绑定对象不得产生
  实际试入园照护事实。
- 整体 accountable role 是 `institution_admin`。Guardian、exact trial CareGroup
  caregiver 和 system owner 只在各自步骤成为当前 waiting party；Lead/coordinator
  只作内部分工，不增加 authority。
- 试入园复用既有 Enrollment/roster 关系；实现映射由 D-07E 固定为现有
  `NurtureEnrollmentStatus` 加独立
  `participationPhase=trial|formal`，不新增 `trial` 主状态。正式入园只把同一关系的
  phase 从 `trial` 切为 `formal`。确认成功是最后一个业务里程碑，并触发 Workflow
  幂等完成；不再增加独立的 post-activation settling stage。
- 顶层产品旅程、现有状态映射和 owner/local 业务顺序已经锁定。精确 command/schema、
  predicate、event/envelope 与 projection contract 仍需按本文 freeze register
  完成；未冻结部分不得由实现者自行补全。
- 当前 scenario manifest/module/source 尚未声明该 Workflow；在 exact public
  contract、owner integration、fixture 和 qualification 完成前保持 default-off。

### D-07A — Inquiry minimum data and touchpoint boundary

- inquiry 默认只收集：孩子称呼、出生月份或年龄段、期望入园时间、目标班型/年龄段、
  照护时间需求、来源渠道、Host-owned opaque contact ref、安全 label、last/next
  touchpoint。法定姓名、完整出生日期和更深敏感事实不是意向期默认字段。
- My-Chat invitation/contact owner 持有 raw phone、WeChat、email 和 account identity；
  Nurture 不复制 raw contact，也不以联系方式匹配/推断 platform identity。Host owner
  contract 不可用时 fail closed，不降级本地明文保存。
- native 园区业务沟通保留 canonical Message/source refs，并按当前 owner-read 读取
  正文；电话/微信等 external communication 只保存 Admin 确认的 structured summary、
  channel/time、confirmed needs、next action/dueAt 和 responsible role，不冒充完整
  transcript。
- external summary 的修订 append-only；原始 note、author、time 和变更历史保留。
  call recording、聊天截图或 raw export 不作为 summary 的隐式附件。
- AI 只能基于当前授权、可引用的 native source 生成 reviewable summary candidate；
  Admin 确认后才能成为 touchpoint note。模型不得输出意向等级、转化概率、家庭价值/
  孩子适配分，也不能自动推进 stage。
- `inquiry → intent_conversation` 只由 Admin 在真实沟通后显式确认；收到一次咨询、
  创建 next follow-up 或 AI summary 本身均不足以推进。
- 本决定锁定产品字段/owner/交互边界，不等于精确 persistence/API schema 已冻结。

### D-07B — Capacity waitlist ordering and offers

- 只有目标班级满员、家庭明确接受候补、目标班级与意向期最少信息已确认后，Admin
  才能创建 `waitlistQualifiedAt`。首次 inquiry/visit time 不预占顺序。
- 排序使用园区 versioned priority categories + category 内 FIFO；未配置类别时为
  单一 FIFO。类别必须少量、透明、可审计，AI/家庭价值/孩子适配度不得参与。
- Admin 手工顺序调整必须 append-only 记录 reason、before/after、actor 和 policy
  revision，不允许静默插队。
- 候补保留目标班级、期望入园日期/窗口、qualifiedAt、capacity/policy revision、
  priority category/basis、nextReviewAt、continued-interest 状态、最近确认和当前
  waiting party。
- 家庭只看到“候补中”、目标班级、最近复核和下次预计联系，不显示精确名次、其他
  家庭数量或可反推优先类别的信息；完整顺序和依据只在 exact Admin Web policy 下读取。
- 名额出现只创建 Admin 待处理事项。Admin 按 current queue/policy 发出 time-limited
  offer；Guardian 接受后才进入 `trial_preparation`。拒绝或超时后再
  处理下一位，不自动创建 Enrollment/Grant。
- `nextReviewAt` 必填。复核未回复先进入 `waiting_on_guardian`；只有园区配置的
  reminder/deadline 完成后才可过期，一次未回复不能删除候补。
- 精确 category allowlist、policy revision 对既有候补的影响、offer command/schema
  和 expiry transition 仍在 contract 阶段冻结，本决定不授权调用方自定义排序字段。

### D-07C — Trial as normal My-Chat-bound care

- local provisional subject 只允许存在于 inquiry、intent、visit 和 waitlist。实际
  试入园前，Guardian 必须创建/选择并授权 current My-Chat Child/Family，owner
  validation 必须完成 scenario binding 与 Nurture workspace association。
- 进入班级前还必须建立现有 Nurture institution relationship：`status=pending` 的
  Enrollment/placement、所需 Grant 和 exact trial CareGroup assignment。缺一项时
  保持 `trial_preparation`，不得创建真实出勤、照护或媒体事实。试入园开始的本地事务
  将同一 Enrollment 置为 `status=active, participationPhase=trial`，并同时确认
  reservation、Grant 与 CareGroup currentness。
- Guardian 接受试入园作为普通 owner action/evidence 保留；当前产品不建立独立
  `TrialParticipationConsent`、`TrialChild`、trial media、trial attendance、trial
  retention 或 caregiver Web/表单体系。
- 试入园孩子进入普通 roster 后，与其他孩子使用相同的 caregiver role-bound mobile、
  attendance、care facts、照片自动关联、board、family publication 与 T-006
  `PublishProcess`。Workflow 只引用这些 current-policy source refs。
- `participationPhase=trial` 是既有 Enrollment/roster 上的 canonical 可筛选标记，
  不是 authority。读取和操作仍逐次验证 `status=active`、active role、current
  binding、Grant、exact CareGroup assignment、purpose 和 source lifecycle。
- 试入园孩子当天在班时计入照护/安全人数和 canonical attendance，但在转为
  `participationPhase=formal` 前不进入正式 Enrollment 统计。
- 正式入园只把同一 Enrollment/placement 的 `participationPhase` 从 `trial` 转为
  `formal`，`status` 继续为 `active`；孩子、CareProcess、照片和照护事实保持连续，
  不复制或迁移。未正式入园时结束 trial，将 `status` 改为 `ended`、移出 CareGroup
  并按既有 owner policy 关闭/撤销相关 Grant；历史事实沿用统一 retention/redaction。
- 该双维状态映射是实现 contract 的硬约束。字段编码、command DTO 与 migration
  仍需在 Phase 0 inventory 冻结，但实现者不得新增 `trial` status、把 UI label 当作
  policy predicate，或用 `status=active` 单独计算正式在园人数。

### D-07D — Bounded trial reservation and human review

- Guardian 接受 trial offer 后，原 waitlist entry 以 accepted/closed 结束；该 offer
  的 exact class capacity 转为一条有界 trial reservation。一个名额不能同时承诺给
  多个 trial/family。
- trial 至少有 `trialStartsAt`、`trialEndsAt`、`reviewAt` 和 capacity/offer refs；
  `reviewAt <= trialEndsAt`。这些是时点/期限，不增加 Enrollment 主状态。
- `reviewAt` 到期只创建 Admin WorkItem/support signal。系统不得自动延长、转
  `participationPhase=formal`、结束、释放名额或联系下一位；未决期间也不得把同一
  名额再次分配。
- `trialEndsAt` 后没有新的计划试入园照护授权；如需继续，Admin 必须先显式
  `extend trial`，更新 ends/review 时间并记录 reason。
- 复盘默认使用普通 attendance、care facts、caregiver observations、family
  communication 与当前 source lifecycle，不要求 caregiver 填写专用评估/评分表。
  AI 只生成逐项引用的 review draft，不能判断 suitability、推荐录取或输出分数。
- Admin 只有三个产品结果：
  1. `extend trial`：更新时间并继续保留该名额；
  2. `propose formal enrollment`：形成待 Guardian 明确接受的正式方案，不直接激活，
     等待期间继续保留该名额；
  3. `end trial`：进入显式 exit transition 并释放名额。
- 三类 action 均保留 actor、occurredAt、current source refs、reason 和 before/after
  lifecycle。家庭看到 outcome/下一步；protected internal note 不进入 caregiver 或
  家庭 projection。
- 试入园结束不直接返回 `capacity_waitlist`，也不恢复旧 `waitlistQualifiedAt`/
  名次。家庭若继续等待，必须重新满足 D-07B qualification 并生成新时间；特殊情况
  只能通过有 reason/history 的 append-only Admin override。
- offer 已接受但真实 trial 关系尚未完整建立时，Guardian 撤回或 Admin 明确终止准备
  必须走 D-07G `cancel_trial_preparation`；不得要求一个尚不存在的 Enrollment/Grant/
  CareGroup 先执行 `end trial`，也不得让 reservation 永久占用。
- 精确 reservation、review command、reason category、formal proposal 和 exit
  transaction schema 仍未冻结。

### D-07E — Owner revalidation and local atomic formalization/exit

- 复用现有 `NurtureEnrollmentStatus`：`pending` 只用于 trial preparation，
  `active` 同时承载正在试入园和正式入园的 current relationship，`ended` 表示该
  relationship 已结束。独立 canonical `participationPhase=trial|formal` 区分试入园
  与正式在园；不得向主状态 enum 添加 `trial`。
- `trial_start_pending`、`formalization_pending`、`exit_pending`、
  `waiting_on_system` 是 Workflow/waiting state，不写入 Enrollment lifecycle，
  也不作为 authority。
- formal activation 的人类门是 Guardian 对 current formal proposal 的明确接受。
  Admin proposal、trial review 完成或日期到期都不能替代该 action。
- Guardian 接受后，My-Chat owner 重新验证 current Child、Family、
  `FamilyChildMembership` 与两条 scenario-binding head，并签发短期、purpose-bound
  current evidence。Nurture 不保存 raw platform IDs，也不用 cached evidence 跨越
  owner outage。
- Nurture 在 commit 时验证 signed evidence、expected Enrollment/reservation/Grant/
  CareGroup versions，并在一个本地事务中：
  1. 保持同一 Enrollment/placement `status=active`，将 `participationPhase` 从
     `trial` 改为 `formal`；
  2. 将 trial reservation 转为同一名额的 active occupancy，不先 release/reacquire；
  3. 更新正式 purpose/duration 的 Grant；
  4. 延续或调整 exact CareGroup assignment；
  5. 写入 actor、Guardian acceptance ref、owner-evidence hash、before/after 与
     idempotency record。
- My-Chat owner validation 和 Nurture commit 是两个 owner boundary，不声称为一个
  distributed transaction。owner unavailable、binding drift、evidence expiry、
  expected-version conflict 或本地失败时，不写部分 active facts；canonical 状态保持
  `status=active + participationPhase=trial + reserved`，Workflow 进入
  `waiting_on_system` 并允许 exact replay。
- mobile/Web/notification 只能在 Nurture commit 后从同一 canonical lifecycle 投影
  formal Enrollment；Host delivery 失败只重试 delivery，不能回滚或伪造 formalization。
- end trial 是 Nurture-owned downscope command，可在 My-Chat owner outage 时执行。
  一个本地事务将 Enrollment 从
  `status=active, participationPhase=trial` 改为 `status=ended`、结束 CareGroup
  assignment、关闭/到期 trial-purpose Grant、释放 reservation，并写入完整
  audit/idempotency record。
- exit commit 后只创建“处理下一候补”的 Admin task，不自动发 offer。下游 task/
  notification 失败不得重新开放已关闭的照护权限或重新占用名额。
- end trial 不删除或改变 My-Chat Child、Family、membership、scenario binding；
  Nurture binding association 与历史 care facts 也不删除。它们不产生当前 authority。
  未来 caregiver access/new publication 停止，历史内容遵循 T-006 retention、
  redaction、revoke 和既有家庭可见性。
- 精确 command/envelope、expected-version tuple、owner-evidence purpose、Grant
  transition 和 outbox/event schema 仍需 contract 冻结；当前 manifest/module/source
  未声明或激活该 Workflow。

### D-07F — Trial is the adaptation period; no post-activation settling

- `trial` 阶段本身承担孩子、家庭和园区的适应过程；普通出勤、照护、观察与家园沟通
  已在 D-07C/D-07D 中作为复盘依据，不再复制一套“入园后适应期”数据或表单。
- 仍需更多观察时，Admin 必须在正式方案被接受并激活前显式 `extend trial`，继续
  保留名额并更新 trial/review 时点。不能先把 `participationPhase` 转为 `formal`
  再用 settling stage 延长判断。
- D-07E 的 Nurture activation commit 成功是最后一个业务里程碑。Workflow owner
  消费确认的成功事实后幂等进入 `completed`；不要求额外 caregiver/Guardian 反馈、
  Admin 完成确认、倒计时或 AI 适应结论。
- activation-success event/projection delivery 可以因为系统失败重试并显示
  `waiting_on_system`，但这是技术等待，不是新的业务阶段，也不得回滚已提交的
  formal Enrollment。
- trial 结束则以未正式入园的结果结束 journey；不会进入 `formal` 或 `completed`
  成功路径。精确 terminal labels、event/envelope 和 projection schema 仍需在
  contract 冻结时确定。

### D-07G — Preparation cancellation and post-completion offboarding

- `cancel_trial_preparation` 处理“offer 已接受并占位，但 trial relationship 尚未
  commit”的撤回。它由 Admin 基于 Guardian withdrawal 或明确终止决定执行；identity/
  binding owner 暂时失败只进入 `waiting_on_system`，不得自动取消。
- 该命令在一个 Nurture 本地事务中关闭 accepted-offer/trial-preparation shell、释放
  exact reservation，并写入 actor、reason、expected version 和 idempotency evidence。
  它不要求 Enrollment/Grant/CareGroup 已存在，也不创建、撤销或删除 My-Chat
  Child/Family/binding。若 trial-start commit 已成功，则改走 D-07E `end trial`。
- preparation 取消后不会恢复旧候补资格；家庭以后继续等待必须重新满足 D-07B。
- `EnrollmentJourneyWorkflowV1` 在 formalization 成功后已经完成。此后正式离园是
  普通 Enrollment lifecycle maintenance：在当前 owner/policy 下将
  `status=active, participationPhase=formal` 转为 `status=ended`，并完成普通
  Grant/CareGroup downscope。它不重新打开 Enrollment Journey，也不默认创建第二个
  Workflow；复杂异常仍可先使用 WorkItem，只有未来另行注册的业务 Workflow 才能承接。

## Stage G4 Delivery Dependency Model

Stage G4 的交付结构是现有 Phase 0～5 上的执行/验收视图，不改变 D-01～D-07G 产品
语义。Phase 3 被拆成两个不同 owner/failure domain：G4-C 负责通用 Admin Web
运营能力，G4-D 负责 Enrollment Journey 状态、容量、reservation、owner revalidation
与本地事务；二者通过 versioned Workflow projection/command contract 集成，不共享
可由 Web 自行解释的状态。

依赖方向固定为：

```text
G4-0a publication-policy subset -> T-006 G3-D/E

G4-0 per-domain freeze -> G4-A authority/aggregate foundation
G4-A + branch-specific freeze -> G4-B | G4-C | G4-D | G4-E
G4-D projection/commands -> G4-B read-only module + G4-C queue/actions
G4-B + G4-C + G4-D + G4-E -> G4-F joint qualification/handoff
```

G4-0 是 rolling gate：每个 downstream branch 只等待自己的 exact contract/fact/schema
条目，而不是等待全部 register。G4-B/C 在 G4-D 未就绪时不得猜测 Workflow state：
mobile 使用合法 absent/empty，Web 不注册 placeholder Workflow。G4-F 汇合所有必选
能力，但不替代分支内的 negative/integration qualification。

## G4 Implementation Gate and Acceptance Model

实现权限沿 I0 Design/Synthetic、I1 Branch Freeze、I2 T-004 Contract Boundary、
I3 Owner Integration Readiness 和 I4 Joint Conformance 单向推进。一个较高层 PASS
必须精确引用所有较低层 artifact/evidence；source/schema/pin/fixture drift 只使受影响
分支及其上层 evidence 失效，但历史记录 append-only 保留。

I1 允许实现 migration artifact，不允许对 shared/persistent database apply；I3
qualification 只使用 disposable PostgreSQL。I4 必须通过 formal NestJS scenario
service ingress；Fastify evidence 不能成为 T-007 completion proof。所有 capability、
manifest activation、Candidate 和 traffic gate 均位于本任务以外。

G4-F 从各分支消费 versioned handoff，而不是重新推断其 business truth。Mobile/Web
从相同 canonical facts 生成 projection；T-007 的 Workflow projection 是自身 Exit
required，但 T-006 在它 absent 时仍保持合法空态。任何 required path 都不能用
placeholder 或恒定 unavailable 通过；optional path 只有在 default-safe 且不影响
required/safety 时才能记录 limitation。

总体 verdict 固定为 `PASS | PASS_WITH_LIMITATIONS | NO_GO`。Limited pass 只能容纳
optional fail-closed；required、authority/privacy、安全、transaction/replay、
formal ingress、real owner path 或 cleanup 缺口一律 `NO_GO`。合格 verdict 输出
T-007 Beta Profile Handoff，供 T-008 消费；该 handoff 不冻结 Candidate，也不证明
My-Chat native/device 或 traffic readiness。

## Logical Components

- Institution/group/enrollment/grant repositories and services。
- Aggregate policy：从已授权、可聚合的 care facts 生成安全统计。
- Active-role surface policy：角色切换、role-bound route/capability 和 fail-closed guard。
- Institution Admin mobile presenter：园区级事项、班级 cards、班级一日活动、
  今日沟通与关注、家园共育、支持信号和 Workflow projection。
- Class schedule/activity projection：班级有效日程、临时安排、活动 evidence 自动
  落位、待归位和 source freshness。
- Institution business communication owner-read presenter：对精确授权的园区业务
  Message/CareInteraction 返回 Admin read-only body/attachment/change projection。
- Institution support-signal policy/presenter：确定性 source rules、园区绝对
  threshold config、两级投影、stable dedupe、source invalidation 和 body-free 下钻。
- Optional institution attention analyzer：后置、同范围、source-cited、无自动 action。
- Caregiver attendance presenter/action：每日提交时的 AI 推理预览、老师确认与修订。
- `InstitutionAdminWorkbench` presenter：人员/关系、日常运营、家长触达、数字资源、
  知识/RAG、Workflow queue/detail 和审计状态。
- Knowledge policy/presenter：园区内容、authority links、revision、audience、safety
  class、retrieval eligibility 与引用。
- Institution Workflow service：园区管理类型、阶段、业务 eligibility、里程碑和
  role-safe projection。
- Institution commands：最小、显式、幂等、可审计。

## Aggregate Privacy

- 不读取或拼接 family-private AI conversation、未发送草稿或私人聊天 body。
- 园区业务沟通正文只能通过逐请求 owner-read projection 返回，不能复制进 aggregate、
  dashboard cache、日志、搜索或通用 My-Chat transcript。
- 不向小样本 aggregate 暴露可识别的 child/family 细节。
- grant 撤销或 fact redaction 后，后续 projection 必须删除对应贡献。
- support signal 只描述需要关注的工作，不形成 child/teacher/institution score。
- 原始事实与 aggregate 都保留 provenance，但 presenter 只暴露 actor-safe 解释。

## Role and Surface Matrix

| Active role / Surface | Current T-007 capability | Mutation |
| --- | --- | --- |
| `institution_admin` / mobile | 园区级事项、班级卡/详情、园区业务沟通只读投影、支持信号、只读 `InstitutionWorkflowProjection` | none |
| `institution_admin` / Web | `InstitutionAdminWorkbench` 全部已授权管理模块 | explicit Admin commands |
| current CareGroup caregiver / mobile | 每日出勤 AI 推理预览、调整、提交和老师修订 | attendance submit/revise only |
| caregiver / Web | 当前未定义 | none |
| guardian / Web | 当前未定义 | none |
| Lead designation | 不形成独立 Surface 或 capability | none |

My-Chat owns native/Web shell、active-role selection 和通用 session/auth；Nurture owns
role-safe presenter、business policy 和 capability eligibility。非 Admin active role
访问 `InstitutionAdminWorkbench` 必须 fail closed，而不是只隐藏菜单。

## Class-first Admin Mobile Board

### Information hierarchy

```text
Institution Admin mobile
├── 园区级事项
├── 班级列表
│   └── 班级详情
│       ├── 一日活动
│       ├── 今日沟通与关注
│       └── 家园共育
└── 跨班级异常摘要
```

班级卡只表达该班当前状态，不承担绩效比较。园区级汇总可以展示班级数量、出勤提交
状态和待处理数量，但不强行把不同班级映射到同一活动，也不生成综合健康分。

### Class card and detail projection

`InstitutionClassCardProjectionV1` 最小字段：

- safe class label、effective schedule version；
- current activity、next activity 与 temporary-override indicator；
- canonical attendance submission state 与已确认人数；未提交只显示“待老师确认”，
  不返回 Admin-facing AI inference count；
- optional latest-photo preview、latest text presence 和 source timestamp；
- awaiting-response、new-family-feedback 和 institution-action-needed counts；
- actor-safe projection version 与 source watermark。

沟通正文、孩子名单、自动匹配 confidence、原始生物特征和老师级统计不进入卡片。
source timestamp 使用业务记录的 capture/record time 并标明来源，不压缩成
freshness score。数量只表达当前工作状态，不用于班级/老师比较。

`InstitutionClassDayDetailProjectionV1` 在相同 snapshot/actor policy 下展开：

1. effective schedule 与完整 actor-safe 活动照片/文字时间线；
2. 本班待归位记录；
3. 今日沟通与关注的 owner-read 列表/详情；
4. 家园共育触达、反馈与后续状态；
5. 正式出勤提交/修订状态；
6. 仅在 exact purpose 下可用的 child-level evidence/communication drill-down。

“完整”只描述当前 Admin 对该班级/日期已授权的数据深度，不绕过 Grant、source
lifecycle、redaction、retention 或其他 Institution 隔离。

### Class schedule and activity placement

一个班级/日期只使用一个 versioned effective schedule projection，解析优先级为：

1. 当日临时安排；
2. 班级长期覆盖；
3. 园区默认模板。

照片、文字与活动事实只在 exact class/CareGroup scope 内自动落位，顺序为：

1. source 已绑定的 activity ref；
2. 当日临时安排；
3. 班级有效日程与时间窗口；
4. 后置 AI 对内容语义的辅助判断；
5. 无法确定时进入本班 `unplaced`。

活动卡可以展示 actor-safe 图片缩略图、文字摘要、记录数量和 source timestamp。
记录只作为活动证据；无记录、上传延迟或未归位不得被 presenter 转写成“活动未开展”。

### Latest-photo selection

“最新照片”在一个 frozen class-day snapshot 内按以下顺序确定：

1. 当前活动存在显式 `coverMediaRef`，且 source/authority/lifecycle 仍有效；
2. 当前活动中 capture time 最新的合格照片；
3. 本班今天最近一个有照片活动中的最新合格照片；
4. 无合格照片时不返回图片，卡片 fallback 到最新文字或空态。

同一 capture time 使用 server-issued immutable order key 打破平局。照片必须已经进入
本班记录、关联已确认、当前 Admin 可读，且不处于 `review_required`、candidate-only、
withdrawn、redacted、revoked 或 source-invalid 状态。cover/source 被删除、撤权、
更正或重新归属后，presenter 在新 snapshot 内按同一规则重算。UI thumbnail 只是
受保护原图的展示 rendition，不改变 canonical asset，也不得 crop、beautify 或
face-focus。

### Today communication and attention

“今日沟通与关注”默认提供全部园区业务沟通的只读列表/详情，并可按等待家长、老师或
园区回应等 canonical 状态筛选。它不是由老师主动升级形成的子集。

建议的非 canonical `InstitutionBusinessCommunicationProjectionV1` 每次读取至少重新
验证：

- active role=`institution_admin` 和 exact Workspace/Institution；
- exact Enrollment/CareGroup/child scope/thread/source Message；
- original Grant 的 direction、data class 与 institution-supervision purpose；
- 家长发送前可见的渠道 disclosure；
- source/correction/redaction/withdrawal lifecycle 和 current visibility。

projection 可返回当前可见正文、附件、correction head、author side、班级/孩子安全
标签、reply/delivery 状态和 source refs；不得返回 private anchor、raw persistence
id、其他 Institution 关系或 My-Chat Chat transcript。My-Chat 只渲染本次 owner-read
结果，不成为消息正文的第二 canonical owner。

Admin read 与 CareGroup action authority 正交：`institution_admin` 可读不代表可
acknowledge/reply/correct/redact；若同一用户另有有效 caregiver role，必须切换角色
并通过 T-005 exact-CareGroup action policy。

未来 AI attention 只能消费上述同一 authorized projection，输出候选类型、可解释原因
和 source message refs。它不得生成老师/家长/孩子 score、自动发送、自动建 Workflow
或扩大 Admin 可读范围；source correction/redaction/revoke 后必须重新计算或隐藏。

### Home–institution dynamics

“家园共育”优先展示园区或班级向家长进行的理念/知识/活动触达，以及家长对该触达的
反馈和后续状态。无法归属班级的全园触达、家长直达园区信息和园区级反馈留在园区级
区域，不强行挂到某个班级。

## Institution Support Signals

### Sources and classification

`InstitutionSupportSignalProjectionV1` 是 request-composed、noncanonical、
actor-safe projection。一个 signal 必须引用当前可读的 exact source，并属于以下
封闭类别：

1. `attendance_submission_overdue`：超过班级/日期已配置 checkpoint，正式出勤仍未提交；
2. `business_response_overdue`：园区业务沟通超过其明确 response deadline；
3. `review_backlog_threshold`：待归位/待复核内容达到园区配置的绝对 count/window，
   且确实影响当天整理或发布；
4. `authority_or_source_blocked`：Grant、source lifecycle 或数据状态使既有工作无法继续；
5. `work_item_or_workflow_blocked`：当前 WorkItem/Workflow 存在 canonical blocker；
6. `configured_load_threshold`：同一 class/scope 在固定窗口内的当前待处理事项达到
   园区配置的绝对阈值；
7. `ai_attention_candidate`：未来后置 AI 的 source-cited 内容介入候选。

“没有活动照片/文字”本身不属于 signal；记录缺失不能证明活动未开展。负荷规则只看
当前待处理业务状态，不计算老师活跃度、回复速度排名、跨班百分位或历史偏离分。

`action_required` 只映射明确 overdue、authority/source blocker 或 canonical
WorkItem/Workflow blocker。绝对负荷阈值和未来 AI candidate 映射
`attention_suggested`。AI 不拥有级别决定权。

### Policy and lifecycle

园区配置是 versioned `InstitutionSupportSignalPolicy`：

- exact Institution，必要时可按 class/category override；
- signal type、absolute threshold、fixed window、business checkpoint/deadline ref；
- enabled/disabled、effective period 和 policy revision；
- Admin actor、change reason 与 audit。

确定性规则复用已有业务 checkpoint/deadline；不得另造一套隐藏时限。负荷类在没有
显式 policy 时 fail closed 为 disabled，不采用系统猜测默认。每个 signal 使用
`source type + exact source ref + policy revision + window` 的稳定派生身份去重。

Signal 不拥有独立 resolved/closed 真相；每次读取根据 current source/policy 重算。
source 已解决、撤回、纠正、redacted、revoked、失效或移出 scope 时，signal 在新
snapshot 自动消失。若需要保留处理历史，记录的是 Admin 对 source 的真实 action、
WorkItem/Workflow 或 policy revision，不保存“某老师曾被标红”的绩效事件。

### Mobile and Web projection

- Institution 首页最多返回三个跨班信号，按 explicit deadline → business state →
  occurredAt 稳定排序；不使用 hidden relevance/risk score。
- 班级卡只返回 tier、safe reason、current count、deadline/occurredAt 和 opaque
  source ref，不返回沟通正文、孩子名单或个人老师指标。
- 点击后执行 exact owner-read；无权、source drift 或 revoke 返回通用不可用，不
  使用缓存 signal 泄漏内容。
- Mobile 没有 dismiss/ack/escalate command。阅读不改变业务状态。
- Admin Web 可调整 signal policy、查看来源并执行已有 source action；创建
  WorkItem，或启动当前 registry 已注册且业务 eligible 的 Workflow，必须是独立、
  显式、幂等的业务动作。第一增量的普通 signal 不能启动
  `EnrollmentJourneyWorkflowV1`。

未来 `InstitutionAttentionCandidate` 必须通过相同 owner-read、引用和 invalidation
约束，只能提供“建议关注”。provider unavailable、malformed output 或低置信时不
生成 signal，也不影响确定性规则。

## Daily Attendance Closeout

### Semantic separation

- `AttendanceEvidence`：签到、护理/活动记录、当日已确认媒体归属等可解释的输入证据。
- `AttendanceInference`：AI 在老师发起每日提交时生成的非 canonical 建议，状态使用
  “建议在园 / 建议未到园 / 信息不足”等离散语义，不提供伪精确概率。
- `DailyAttendanceSubmission`：当前班级老师明确确认和提交的班级/日期 snapshot。
- `AttendanceFact`：由有效 submission 产生的正式出勤事实。
- `ActivityCoverageProjection`：有业务记录的孩子数量/覆盖率，永远不等同出勤人数。

以上名称表达产品契约，精确 schema 在实现规划阶段冻结。AI inference 可以保留输入
revision、证据 refs、模型/策略版本和生成时间用于审计，但不能自行写入
`AttendanceFact`。

### Submission and correction rules

1. 老师发起当天班级出勤提交时，系统以稳定 source watermark 读取当天 actor-safe
   evidence 并生成 AI inference。
2. 当日对该班级具有有效 CareGroup caregiver assignment 的任一老师可批量接受、
   调整并提交；提交人和逐项修订保留审计。
3. 正式出勤只来自老师的显式 submission；缺少有效老师提交时保持 `unsubmitted`，
   不自动结算。
4. 当日由有效班级老师直接修订；跨日后 Admin 只能 reopen/退回，再由有效班级老师
   修订。
5. Admin 可查看聚合、异常、催办、退回和 reopen，但不能代替老师确认或改写
   `AttendanceFact`。若同一用户同时是 Admin 和老师，必须切换到 caregiver role
   并通过当日 assignment 后操作。

日常未提交/冲突默认进入责任角色 WorkItem，而不是 `InstitutionWorkflow`。只有升级为
跨角色、多阶段且需恢复的异常处理时，才建立对应 Workflow。

## InstitutionAdminWorkbench

当前 Web 只为 active role=`institution_admin` 提供：

1. **人员与关系**：学生、老师、班级、roster/invite、parent confirmation、
   enrollment 和 grant lifecycle。
2. **日常运营**：班级出勤提交状态、记录覆盖、异常、数据 freshness、催办/退回/reopen。
3. **家长触达与沟通**：读取园区业务沟通，并在精确 audience、authority 和 delivery
   contract 下准备或执行园区触达；Admin 读取不自动获得 CareGroup reply 权限。
4. **数字资源**：整理、查看、使用和治理园区已授权的活动/媒体/文档资源。
5. **知识与场景 AI**：知识编辑、来源关联、版本/发布、覆盖可视化、RAG preview 和
   actor-safe usage signals。
6. **责任队列**：普通 WorkItem 与 `InstitutionWorkflow` queue/detail/steps/forms/audit。

Admin Web 权限不等于读取全部 child/family facts。任何 child-level drill-down 仍需
精确 scope、Grant/fact visibility 与 purpose；聚合异常不能作为反查家庭私密正文的
后门。

### Complete activity records in Web

Admin Web 可在 exact Institution/class/date/activity scope 下：

- 新增 institution-authored 照片与文字记录；
- 查看当前授权的完整原图、正文和完整一日时间线；
- 设置/取消可选活动封面；
- 调整 activity placement；
- 添加 institution-authored note，或执行具名、可审计且不扩大 audience 的
  correction/hide action；
- 对疑似错误 child attribution 提出带来源的 correction candidate/WorkItem。

每条记录保留 source type、original actor/role、capture/record time、CareGroup、
activity placement、current child associations、visibility/publication lifecycle、
correction/redaction state 和 revision chain。自动人脸匹配只保留允许的
confirmation/provenance 结果，不在产品或审计 presenter 中保存/展示 embedding。

老师创建的原始正文、媒体、作者和时间不可原地修改。Admin 的 placement/downscope
调整写入 append-only revision，保留 previous value、automatic/teacher confirmation
来源、Admin actor、reason、timestamp 和 supersession relation。Admin-only 不能把
child attribution candidate 改为 confirmed，也不能新增/替换 confirmed attribution
或据此使内容变为 publishable；只有当前 exact CareGroup caregiver 可按 T-006
确认、拒绝或 supersede。Web shell 不复制这些 canonical facts；它通过 Nurture
owner-read/query/action contracts 操作。

## InstitutionWorkflow Boundary

第一实现增量的 `InstitutionWorkflow` registry 只包含
`EnrollmentJourneyWorkflowV1`。Grant change、出勤提交/修订、知识编辑、普通家长
触达、support signal、family-care submit/acknowledge/reply、notification delivery
和 caregiver `PublishProcess` 均不是第二个 Workflow。

Nurture owns Workflow 类型、业务阶段、eligibility、handlers、业务 facts 和 projection
内容。My-Chat / My-Workflow-Base owns 通用 Run/Step/worker/ledger runtime 与
Web/native shell。任何一侧都不得复制另一侧数据库或运行时。

## Enrollment Journey Workflow

### Top-level journey

以下名称先作为产品阶段标签，不是已冻结的 public enum：

```text
inquiry
  → intent_conversation
    → visit_or_consultation?
      → capacity_waitlist?
        → trial_preparation
          → My-Chat identity/binding + pending Enrollment/Grant/CareGroup
            → trial_start (`status=active`, `participationPhase=trial`)
              → trial_in_progress
                → trial_review
                ├─ extend trial
                ├─ end trial
                └─ formal_enrollment_confirmation
                    → formal_enrollment
                      → completed
```

- `inquiry`：记录最少意向事实、来源和 next touchpoint；仍是 local provisional
  subject，不建立正式 Enrollment 或全局 identity。
- `intent_conversation`：记录园区与家庭对时间、班级、照护需求和下一步的业务沟通；
  不为每次 touchpoint 新建 Workflow，也不计算转化/适配分。
- `visit_or_consultation`：可选的到访/面谈 milestone，不自动产生长期孩子档案。
- `capacity_waitlist`：只因目标班级容量不足进入，使用 D-07B
  `waitlistQualifiedAt`、versioned category + category FIFO、review 和 time-limited
  offer 规则。
- `trial_preparation`：确认日期/时段，并完成 Guardian-owned My-Chat Child/Family、
  current binding/association、pending Enrollment/Grant 和 exact CareGroup；开始
  trial 时同一本地事务写入 `status=active, participationPhase=trial`。
- `trial_in_progress`：孩子已经进入普通班级 roster；caregiver 使用与其他孩子相同的
  role-bound mobile、attendance、care facts、media attribution 和 PublishProcess。
- `trial_review`：Admin 使用既有事实决定延长、结束或提出正式方案；AI 只能生成
  带来源 draft，不能判断孩子“是否适合”。结束后如需等待，另行重新取得候补资格。
- `formal_enrollment_confirmation`：向 Guardian 呈现正式入园安排并取得明确确认。
- `formal_enrollment`：按 D-07E 重验 My-Chat currentness，并由 Nurture 单本地事务把
  同一 relationship 的 `participationPhase` 从 `trial` 转为 `formal`，同时转换
  reservation/Grant/CareGroup；失败保持 active trial。成功后按 D-07F 触发 Workflow
  幂等完成，不存在独立 settling stage。

### Inquiry subject and touchpoints

意向期的 provisional subject 使用随机 local ref，只作为本次 Journey 的业务对象。最小
产品字段为：

- preferred/nickname label；
- protected `birthYearMonth` 或 `ageBand`，二者至少一项；
- expected entry date/window、target class type/age band；
- care schedule needs；
- source channel；
- Host-issued opaque contact ref 与 actor-safe label；
- last touchpoint time、next follow-up time 和 current waiting party。

这些字段不形成法律身份、platform Child/Family、Enrollment、Grant 或读取权限。精确
姓名、完整出生日期、健康/过敏、安全联系人等仅在 trial/formal 阶段有明确
purpose、Guardian notice/consent 和 retention policy 后采集。

Touchpoint 分为两条封闭路径：

1. **native business communication**：引用 Nurture canonical Message 和 current
   source lifecycle；正文每次通过 D-04 owner-read 读取，不复制进 Workflow row。
2. **external structured summary**：Admin 记录 channel class、occurredAt、
   participant side、protected summary、family-confirmed needs、institution disclosures、
   next action、dueAt 和 responsible role。它明确标注 `external_summary`，不声称是
   电话/微信的逐字 transcript。

external summary 不接收 raw call recording、聊天截图、聊天 export 或外部平台
participant roster。更正产生新 revision 并 supersede 旧 note，不原地覆盖。若未来
接入经过授权的 external connector，其内容必须成为独立 owner/source contract，
不能静默改用 manual-summary 规则。

AI summary 只能消费当前 actor 可读的 native Message/source，返回逐项 source refs
和 reviewable draft。Admin 确认后以自己的 actor identity 形成 touchpoint note；
AI provenance 保留。无 eligible source、source revoke/redaction、provider failure 或
低置信均不产生 note，也不改变 stage。

Stage advance 是独立 Admin action：必须引用至少一个当前可读 touchpoint，并明确确认
家庭正在继续入园沟通。新的 inquiry、AI summary、due date 或 repeated contact attempt
不能自动推进，也不能把 no-response 解释为低意向评分。

### Capacity waitlist versus waiting state

`capacity_waitlist` 是业务阶段。下列是任何阶段都可能出现的 state dimension：

- waiting on Guardian confirmation/input；
- waiting on exact trial CareGroup caregiver evidence；
- waiting on My-Chat/Nurture owner validation；
- scheduled for an agreed future date；
- blocked by a resolvable authority/data/configuration issue。

这些 state 只表达“当前球在哪一方/什么条件”，不得改变候补顺序、暗示班级满员或
进入容量统计。

#### Qualification and record

无名额时，只有以下条件全部满足才由 Admin 明确进入候补：

1. canonical target class capacity 当前不可用；
2. 家庭明确接受候补；
3. target class 与期望入园日期/窗口已确认；
4. D-07A minimum inquiry data 完整。

该动作生成 `waitlistQualifiedAt`。首次咨询、到访、AI summary、next follow-up 或
provisional record 创建时间都不能替代它。

候补记录至少保留：

- target class/age band；
- expected entry date/window；
- `waitlistQualifiedAt`；
- capacity source/ref 与 policy revision；
- current priority category/basis；
- `nextReviewAt`、last confirmed interest 和 waiting party；
- current offer ref（如存在）与 append-only order/review history。

#### Ordering and privacy

园区 policy 定义少量 priority categories 和稳定 category order；每个 category 内按
`waitlistQualifiedAt` FIFO。同一时间使用 server-issued immutable order key 打破平局。
无 category 配置时所有候补进入同一 category，因此是纯 FIFO。

AI 不选择 category、不排序、不预测接受率。Admin override 是独立、显式 action，
要求 reason，并记录原 category/order、目标 category/order、actor、time 和 current
policy revision。后续 policy revision 如何影响既有 entry 仍需单独 contract，不得
静默重算。

Admin Web 可以读取当前 ordered queue、每条 basis 和 source revision。家庭 projection
只返回 waitlisted status、target class safe label、last review 与 next expected
contact；不返回 exact rank、queue length、其他家庭 category 或可推断小样本的信息。

#### Review and capacity offer

每条 active waitlist entry 必须有 `nextReviewAt`。到期未得到家庭回应时转为
`waiting_on_guardian`，执行园区配置的 reminder/deadline；完成整个期限后才可
expire。家庭明确退出可立即关闭，所有 review/exit evidence 保留。

canonical capacity source 出现空位只生成 Admin task，不自动跳出候补。Admin 在
current policy/snapshot 下选择下一位 eligible entry，发出有 `expiresAt` 的 offer。
Guardian accept 是独立 owner action；成功后 Journey 才进入 `trial_preparation`，
并关闭 waitlist entry、将该 exact capacity 转为有界 trial reservation。本任务中的
“enrollment offer”仅是这一 accepted trial-offer preparation shell，不提供绕过 trial
直接正式入园的旁路。decline/expiry 关闭该 offer 后，Admin 再处理下一位。任何路径
均不自动 mint identity、Grant 或 Enrollment，也不承诺无法保证的入园日期。

### Responsibility and surfaces

- `institution_admin` 对整体 journey accountable，并处理意向、候补、试入园安排/
  复盘、正式方案和 activation 协调。
- Guardian 在 trial 接受、My-Chat Child/Family 选择/创建、binding/Grant 和正式方案
  确认时负责自己的 owner action。
- exact trial CareGroup caregiver 按普通班级规则提交当前授权的照护事实，不读取
  意向商业沟通、候补顺序或 Admin 内部判断。
- My-Chat system owner 只负责 identity/membership/binding currentness evidence；
  Nurture owner 负责 Enrollment/Grant/CareGroup/capacity 本地事务，两者都不代替
  Guardian/Admin 人类决定。
- optional coordinator/Lead 只是 assignment metadata；access 仍取决于 active role
  和 exact policy。

Admin Web 队列区分“需要园区处理、等待家庭、等待 caregiver、等待系统、满班候补、
已阻塞、试入园跟进”。Guardian/Caregiver 使用各自 My-Chat/role-bound mobile
surface 完成 owner action，不因此获得 Admin Web。

Admin mobile 只读显示 safe journey title、当前产品阶段、已完成 milestones、
waiting party、blocker、next step 和 due/next-review time；不显示 prospect contact、
trial health body、完整 Grant、raw Run/Step 或内部判断。

## Workflow Projection

mobile 与 Web 必须从同一 canonical Workflow/business facts 生成 versioned
`InstitutionWorkflowProjection`。最小字段包括：

- opaque `workflowRunRef`、`workflowType`、safe title/summary；
- state、current stage、completed milestones；
- actor-safe blocker、next action、responsible role；
- started/updated/due timestamps 与 projection version；
- 当前角色允许执行的 capability refs（Admin mobile 当前为空）。

`EnrollmentJourneyWorkflowV1` projection 还需安全区分 business stage、
`capacity_waitlist` 与 waiting state，并可投影 trial/activation/completion milestones。
精确字段、union 和 schema version 必须通过下方 contract freeze register 后才能启用；
当前描述不能作为调用方自行拼装 DTO 的许可。

同角色可以看到更深内容，但 role 不是充分权限；读取仍验证 Workspace、Institution、
scope、assignment、Grant/fact visibility 与 purpose。projection 不输出 claim token、
lease、worker internals、raw DB ID、未授权家庭正文或园区内部备注给外部角色。

## Institution Knowledge and RAG

### Content and provenance

园区 Admin 可创建、编辑、发布和撤回以下知识：

- 儿童沟通与发展性理解；
- 日常照护、安全与园区制度；
- 活动方案、观察框架和家长沟通材料；
- 基础医疗、急救、常见健康问题防控与升级指引。

“孩子的心智”只表达特定年龄/情境下可能的反应、需要和沟通方式，不得输出某个孩子
内心状态的确定判断、性格标签、诊断或因果结论。

每个 revision 保留来源身份、编辑/发布者、audience、适用年龄/场景、有效期、review
状态与 source links。园区内容可以原创，也可以关联或改编自权威材料；是否存在权威
链接不改变园区对其内容的编辑权，也不能把园区材料自动升级成权威材料。

### Editing and visualization

Admin Web 提供结构化正文与 metadata 编辑、版本差异、发布/撤回、引用关系和产品内
回答预览。可视化至少覆盖：

- 场景 × 年龄 × audience 的知识覆盖矩阵；
- 情境 → 可能反应 → 沟通/照护方式 → 危险信号 → 来源的关系视图；
- revision、发布状态、来源与待复核材料。

精确 lifecycle 状态名在 contract/schema 阶段冻结；线上产品场景只可检索当前有效、
已发布 revision，draft 仅可用于明确的 Admin 编辑预览。

### Retrieval and answer contract

1. retrieval 前先验证 active role、Institution、audience、purpose、age/scenario、
   revision state、Grant/fact visibility 和 safety class。
2. AI 回答的相关段落/要点必须引用实际检索材料，并显示
   `园区材料 | 权威来源`、标题、revision/date 和可打开的 source excerpt。
3. 复制、导出或用于家长触达的 AI 内容继续保留引用与 AI 辅助 provenance。
4. 园区制度、联系人和内部处理顺序优先使用园区已发布材料；医疗事实、急救动作和
   危险信号优先引用关联的权威材料。
5. 园区材料与权威材料发生实质医疗冲突时，AI 不静默拼接或自行裁决；必须展示冲突、
   对确定性医疗步骤 abstain，并产生内容复核信号。
6. 找不到 eligible source 时明确说明依据不足。RAG 不诊断、不处方、不替代急救或
   医疗人员，也不能自动发布知识或执行出勤/Workflow action。

Nurture owns scenario-local knowledge types、metadata、revision/publish policy、retrieval
eligibility、citation presenter 和 safety routing。My-Chat owns generic knowledge/search/
vector/RAG runtime、model gateway、prompt/model registry、host route 和 telemetry plumbing。
双方通过 pinned owner contract 集成，不复制 provider SDK、向量库或 host runtime。

未成年人信息和医疗健康信息属于敏感个人信息；关联具体孩子的检索必须满足特定目的、
充分必要、严格保护和现有 authority/grant。设计与资格验证参考：

- [中华人民共和国个人信息保护法](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2023/art_f374e8245320413181742e6d1baf4366.html)
- [国家卫生健康委《托育机构质量评估标准》](https://www.nhc.gov.cn/fzs/c100048/202311/57f6f5c484bf40b79d3fe84b590bd791.shtml)
- [WHO: Ethics and governance of AI for health](https://www.who.int/publications/i/item/9789240084759)
- [人工智能生成合成内容标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)

## G4-0 Freeze Protocol and Branch Release

G4-0 按 0A～0G 执行：0A 建立 owner/fact/schema/gate ledger；0B 先交付 T-006
publication-policy 快线；0C 冻结 Authority/Surface；0D、0E、0F 分别冻结 Daily
Operations、Workflow/Enrollment 和 Knowledge/RAG；0G 从首个分支开始滚动审计并
签发 branch Freeze PASS。

每条 freeze record 必须绑定 exact owner/consumer/source pin、fact/projection/candidate
类型、schema version、actor/scope/Grant/purpose predicate、lifecycle/concurrency/
idempotency/replay、default-safe behavior、fixtures/negative tests 和 DB delta plan。
DB delta 只描述 SSOT/migration 需求；G4-0 不执行 apply，也不改变 manifest、
capability、Candidate 或 traffic。

Branch Freeze PASS 只表示该分支的实现输入已经精确，不替代 G1 的 Owner Integration
Readiness 或 Joint Conformance。唯一需要在早期完成 provider/consumer conformance
的快线是 0B，因为 T-006 G3-D/E 会跨任务消费它。0G 最终关闭 G4-0 时，所有必选
分支都必须具有 exact freeze record；optional/deferred 能力也必须明确锁为安全关闭，
不能以“以后再定”为由留给实现者。

## Pre-implementation Contract Freeze Register

T-007 顶层产品决策已收口；以下是实现前必须冻结的 contract/schema。每项都具有明确
owner、启用门和默认安全行为，不能被实现者视为自由设计空间。

| Topic | Decision owner | Enablement gate | Default safe behavior |
| --- | --- | --- | --- |
| active-role / exact Institution Surface | Nurture Surface Policy + My-Chat auth/session owner | T-004 exact Surface contract、active-role evidence、Institution/class/child scope 与 capability negative tests 通过 | role/context/scope 任一缺失或不匹配即 fail closed；不合并多角色权限 |
| 家庭可共享理念/目标范围 | Nurture Product + Privacy | family projection/export schema 与同意 UX 评审通过 | 全部保持 Institution-only，不进入家庭投影、RAG 回答或导出 |
| roster/invite 操作粒度 | Institution Admin Web Product | bulk command、selection、partial-failure 与 audit contract 通过 | 第一增量仅支持单条、显式操作 |
| aggregate 隐私阈值/时间窗 | Nurture Privacy + Institution Product | 小样本、跨窗、撤权/更正/删除 negative fixtures 通过 | 未配置/未批准时不返回可区分 child/family 的 aggregate |
| Admin 业务沟通读取 | Nurture + My-Chat owner-contract owners | versioned interface/digest、disclosure/Grant purpose、private carrier 与负向测试通过 | capability absent/default-off |
| AI attention | Nurture AI/Safety + Privacy | model/policy/review/retention/invalidation qualification 通过 | capability absent/default-off |
| support signal schema/policy | Nurture Institution domain owner | type/category allowlist、stable identity、policy revision 与 Web action tests 通过 | 只保留已冻结确定性规则；未配置负荷规则 disabled |
| T-006 publication policy | Nurture Institution policy owner | timezone/send/cutoff/organize/quiescence schema、effective version/head、provider/consumer conformance 通过 | owner unavailable 或 contract mismatch 时不解析新 schedule；既有 process 保留固化值但 release current policy 失败关闭 |
| attendance facts | Nurture Care domain owner | evidence/inference/submission/fact、watermark、并发修订 contract 通过 | 无有效 caregiver submission 时保持 `unsubmitted` |
| class schedule/activity/revision/attribution | Nurture Institution + Care/Content domain owners | effective schedule、placement precedence、append-only revision/downscope、cover 与 exact-caregiver attribution capability/negative tests 通过 | 不确定 evidence 保留在 exact class 待归位；Admin 不确认 child attribution、不扩大 audience |
| InstitutionWorkflow registry/carrier/projection/command | Nurture Workflow domain + My-Workflow-Base owner | 单一 registry、private carrier、public projection、waiting/stage/milestone union、command/idempotency 与 role-safe negative tests 通过 | Workflow absent/default-off；mobile 返回合法空态，Web 不注册 placeholder |
| waitlist/offer/preparation cancellation | Nurture Enrollment domain owner | DTO、policy revision、offer expiry、reservation、`cancel_trial_preparation` transaction tests 通过 | Workflow 未注册；不自动录取、取消、释放或发下一 offer |
| trial state mapping/start/review/exit | Nurture Enrollment domain owner | `status + participationPhase` migration、transaction、reason 与 family-safe projection tests 通过 | 不新增 `trial` status；无完整 gate 不开始真实照护 |
| formalization/completion | Nurture + My-Chat identity/workflow owners | owner-evidence、expected-version/idempotency、Grant/CareGroup、outbox/event/replay tests 通过 | Workflow absent/default-off；失败保持 active trial + reserved |
| knowledge/RAG lifecycle | Nurture Knowledge/Safety + My-Chat RAG owner | revision/publish、citation、来源冲突复核与 owner contract 通过 | 线上不检索 draft/过期/无 eligible source；医疗冲突 abstain |

Workflow progress 已固定为阶段、里程碑、waiting party、阻塞和下一步；不得制造无业务
依据的百分比。

## Failure Model

未知机构、错误 active role、非 Admin Web 访问、过期 grant、group/assignment mismatch、
跨班 schedule/source、无有效日程、沟通 disclosure/purpose 不满足、source
redaction/revoke、aggregate 样本不足、未提交出勤、无 eligible knowledge revision、
医疗来源冲突、错误候补进入原因、缺少 My-Chat binding/pending Enrollment/Grant、
trial-start 不完整、错误 trial CareGroup、accepted offer 取消后 reservation 未释放、
同一名额重复 reservation、
过期 trial 未延长、错误 `status/participationPhase` 组合、formalization gate 不完整、
owner evidence unavailable/expired、binding drift、expected-version conflict 和
source pin 不匹配均返回稳定的 fail-closed 或明确待处理状态。
