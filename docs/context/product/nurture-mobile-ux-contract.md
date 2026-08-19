# Nurture 移动端 UX 契约 v1

> 来源：2026-07 园长共创材料制作过程中的九轮产品设计迭代（任务包
> `dev-docs/active/nurture-uiux-pitch/`，讨论沉淀见其 `02-architecture.md`，
> 视觉基准见其 `artifacts/`：十屏效果图 r4 + 交互演示稿 deck v2.5）。
> 定位：**IIB（机构操作台 + 同意 UX）与移动端实现的设计输入**；六个 surface 是
> Pilot-0-B 锁定表面（Guardian Nurture Chat / family board / family workbench、
> Caregiver Nurture Chat / teacher board、Institution board / workbench）的具象化。
> 上游立场基准：`docs/context/product/workflow-product-design-contract.md`
> （Workflow/Action/Projection 术语、surface ownership 与非诊断红线）。
>
> 分层标记：**[A]** 可直接实现的规格 · **[C]** 依赖未建工程能力 · **[试点]** 假设待验证。

> **Current semantic overrides（2026-07-30）**：
> 本文件是 T-003 设计输入，不是当前实现 SSOT。Guardian/Caregiver 不建立共享聊天室、
> 家园直聊或直接 DM；两侧消费 `CareInteraction` 的角色安全投影。当前产品 Workflow
> 仅指园区管理 `InstitutionWorkflow`：Institution Web workbench 是主要操作面，
> Institution mobile board 可只读投影关键内容与进度。与 T-004～T-008 最新决策冲突时，
> 以 `workflow-product-design-contract.md` 和对应任务包为准。
> 家庭 CareItem 以精确 CareGroup 为业务主体；acknowledge 不表示个人接手。
> 同班当前合格老师可追加多条 CareGroup reply，第一条只解除待回复 Attention，
> 不关闭 Item；个人身份保留为内部审计与可选次级署名。
> 本文件中“待发送气泡撤回”属于 `PublishProcess` 的发布前取消。已发送
> `CareInteraction` 中 correction、family request withdrawal 与 message redaction
> 分别作用于内容解释、事项工作和内容可见性，不得按本文件旧文案合并为“撤回消息”。
> Institution Admin mobile 已改为班级优先：首页为园区级事项、班级列表和跨班级
> 异常摘要，每个班级使用自己的有效日程组织一日活动、今日沟通与关注、家园共育。
> 园区业务沟通可通过逐请求、精确授权的只读投影向 Admin 展示当前正文和附件，但
> 不建立共享 transcript，也不授予老师的回复或作者修改能力。

## 1. 横切原则

1. 同一事实，多端投影：一条记录在家长/老师/机构端呈现不同形态，语义同源。
2. 跨家庭边界的自动化为零：AI 可整理、聚簇、入队（园所侧内部动作，无需确认）；
   内容跨出家庭↔园所边界只发生在"发送时刻"（见 §5.2 两段式发布）。
3. AI 只做整理者：产出永远可编辑、需人确认；不评价孩子、不做诊断（健康一律建议就医）。
4. 状态可见：送达/已读/已确认回执链；每次数据流动留痕。
5. 只有观察与趋势，没有分数与排名：不给孩子打分或互比；对老师无绩效元素（数字只到班级）。
6. UI 内零说明文字：affordance 靠控件表达；解说属于演示/引导层。
7. 文案 voice：平实自然档——普通陈述句、句式长短不一、不堆口语词、不做工整排比。

## 2. Shell 与场景视图（lens）

App = My-Chat（shell 归属不变），Nurture 以**场景视图**接管 shell。**[C：需 My-Chat 侧立项]**

| 视图控制项 | 宝宝视图（Guardian） | 班级视图（Caregiver） | 园所视图（Institution） | 通用视图（My-Chat 原生） |
| --- | --- | --- | --- | --- |
| 进入默认落点 | 看板 | 班级流 | 机构看板 | AI 聊天窗 |
| 抽屉 rail | 看板 · 助手 | 班级流 · 助手 | 看板 · 助手 | 聊天 · 论坛 · 看板 |
| 抽屉中段 | 孩子分组（多孩切换/添加）+ 三视图快捷 | 我的班级 | 园所 | 最近会话 |
| 抽屉底部 | 授权（状态行"N 项生效中"）· 设置 | 设置 | 设置 | 设置 |
| 悬浮元素 | 班级群浮标 | 人类空间浮标 | — | — |
| AI 默认上下文 | 携带孩子 | 携带班级 | 携带园所 | 通用 |

- 切换器在抽屉顶部身份区；视图只改默认入口与上下文，**不改权限与数据边界**。
- 多孩在宝宝视图内部切换（视图=场景镜头，非对象实例）。
- Shell 形态：左侧模态抽屉（复用 My-Chat NavDrawer：UpperRail + LowerContext + footer）；
  无底部 tab；顶部栏=汉堡+位置标题；浮标是屏幕上唯一悬浮元素。

## 3. 对话空间模型 [SUPERSEDED DESIGN INPUT]

本节保留视觉设计历史，不得作为 T-005 的产品/授权契约。当前家庭—园区沟通采用
family-private Guardian Chat、authorized Caregiver projection 和 Nurture-owned
Message/CareItem/Event/Receipt 链，不建立下表所述的跨角色共享房间。

| 空间 | 成员 | 性质 | 入口 |
| --- | --- | --- | --- |
| 家庭私域 | 家长们 + AI | 默认不出家庭；AI 整理 | 抽屉"助手"（tab 直达，无会话列表） |
| 家园直聊 | 该家庭家长们 + 班级老师们 | 家↔园正式通道；每家庭一个 | 浮标 |
| 班级群 | 全班家长 + 老师 | 公共空间；用法与微信无区别，家长自由发言 | 浮标 |

**AI 房间 vs 人类房间的形态区分**（安全设计——进错房间 3 秒内可感知）：

| 维度 | AI 房间 | 人类房间 |
| --- | --- | --- |
| 对方形象 | 无头像，✦ 星形记号 | 头像 + 姓名 + 时间 |
| 回复形态 | 左贴边结构块/卡片 + 行动芯片，无气泡 | 经典气泡 |
| 我的消息 | 浅底描边气泡 | 实心深色气泡 |
| 回执 | 无"已读"概念 | 已读回执 |
| 头部 | "仅家庭可见 / 仅你可见"徽章 + 浅背景色差 | 成员行 |

- **待发送卡**：AI 房间内要跨边界的内容渲染为"人类气泡"预览（深色实心）——
  与所在房间形态强反差，出边界内容一眼可辨；确认后才发出。
- 浮标：家长端点开=底部抽屉 segmented（班级群 | 老师们）；老师端点开=顶部头像横轨
  （[群] + 全班孩子铺开，一步直达任一家庭会话，未读角标挂头像）。
- 直聊三个静默升级：已读回执；重要信息自动挂孩子记录（"已记入·今日叮嘱"芯片）；
  发送动作本身即显式跨边界（无额外弹窗）。
- 班级群互动尺度：家长自由发言；AI 仅温和分流个体问题至直聊。**[试点：噪音水平]**

## 4. 家长端表面 [A]

### 4.1 看板三视图（顶部切换：养育 / 成长线 / 园区）

- **养育**（默认，"现在时"快照，不参与时间翻页）：今日一瞥（带日期一句话日结）→
  当前关注 1-3 卡（主卡：起始日期/周次 + 单线周趋势微图 + 多源观察计数；证据可下钻到
  带时间戳原始记录）→ 方向行（理念›长期目标，详情在 web 工作台）→ ＋关注点 / 记一笔。
  重数据与配置归 **family workbench**（移动端仅跳转提示）。
- **成长线**（纵向无限相册流）：月份+入托周数锚；里程碑"第一次"星标卡；大图卡与紧凑行混排，
  点击展开（完整观察+关联关注点+回家怎么接）；筛选芯片（全部/照片/里程碑/园所/家庭）；日历跳转。
- **园区**（一天一页日记本）：日期条横滑翻日 + 日历选择（有记录日带密度点、回到今天）；
  空白日也有页（周末在家/未入园）；在园四格（入园/午睡/三餐/饮水）；动态（仅授权内容）；
  园所通知/食谱/缴费（行政内容只住这里）。
- 交互隐喻：**横向翻"日子"，纵向翻"成长"**。
- 来源徽章：园所（松林绿 tint）/ 家 / 家·祖辈（祖辈仅日常内容，不关联重点事件）。

### 4.2 授权（同意 UX——IIB 核心输入）

抽屉常驻入口带状态行（"N 项生效中"）；授权页=按数据类逐项开关（如 日常与活动记录 /
照片与影像 / 观察与关注点协同）；每次流动有回执；撤回即刻生效并双方留痕。

## 5. 老师端表面 [A]

### 5.1 班级工作台（班级视图落点）

自上而下：顶部栏（汉堡 + 班级·出勤 + "整理"手动触发按钮）→ 孩子头像条（状态点=有叮嘱）→
**今日日程条**（时间芯片横排，当前项高亮，点开展开全天；日程项来自 Web 端活动模板下发，
并作为 AI 整理的场景归类来源）→ **孩子今日面板**（点头像原地展开：概况四格 / 今日叮嘱 /
今日笔记=按孩过滤的流投影 / 关注标签 + 补记）→ 班级流（类群聊图文流）→ 输入条 + 拍照 FAB。

采集范式：**发了就走**——老师把照片/文字/语音直接发进班级流（与微信群行为一致）；
老师点“整理”可立即按 stable watermark 切批；自动整理可由 10 分钟班级采集静默或发送
窗口前兜底触发。兜底触发必须先通过默认 60 秒、园区可配 30 秒～3 分钟的班级用户操作
quiescence gate；手动整理绕过该 gate。后台上传/缩略图/provider 进度不是用户操作，
不能无限阻塞切批。语音一律转写为文字，**系统不保留音频形态**。

### 5.2 两段式发布（核心交互契约）

```
原始内容入流 → 明确 trigger 切出稳定批次 → 整理成卡（30s 快捷调整，触碰/编辑即停）
            → 【已整理 · 待发送】停在目标会话
            → 发送时刻：定时批量（Pilot 默认 17:00，机构可配）/ 手动"现在发送" / 取消
            → 送达家长（回执链开始）
```

此处“取消”仅取消仍未跨边界的待发送 PublishProcess 内容，不是已发送
CareInteraction 的 `withdraw_family_care_request` 或 Message redaction。

- 30 秒结束 = 入待发队列（园所侧内部动作，未跨边界且不等于发布）；跨边界只发生在发送时刻：
  手动发=显式确认；定时发=显式配置的常设策略。
- 待发送态以灰虚线气泡停在**目标会话内**（老师可在收件人语境下审、删、补一句、即发）；
  班级流顶部有队列汇总行（"今天 17:00 统一发出 · N 条"）；离园前提醒扫一眼。
- 快捷调整内触碰候选或取得 edit hold 会暂停自动入队；进入待发送后仍可持续编辑、
  调整目标/媒体/时间或取消，直到 release commit 真正发生。
- 低置信（待关联）/敏感类（情绪低落、磕碰、健康）**永不自动**：待关联内容只进班级档案、
  进不了家庭时间线；园所可整体切"全手动"。
- **只有 AI 整理内容走队列**：老师亲手输入的消息永远即时发出。
- 关联宝宝三源：照片识别 / 文字语音点名 / 活动上下文；头像区发布前可编辑（防错分发）。
  发布后没有 5 分钟/24 小时快捷修改窗；低频安全修正使用 versioned
  correction/replacement/visibility-removal/redaction capability，不得覆盖 T-005
  已锁定的 CareInteraction correction/withdrawal/redaction 契约。
- 合照双路由：1-2 主角→对应家庭；群像→班级群/相册；AI 预判可改；机构可配更严政策。**[试点：政策]**
- 落点可见：发出后内容真实出现在对应会话；状态行"查看"跳转定位。
- 默认参数（**[试点]** 均可配）：快捷调整 30s；采集静默 10 分钟；自动触发
  quiescence 60s（范围 30s～3 分钟）；Pilot 定时发送 17:00；发送前兜底整理 lead time
  30 分钟。参数不改变 authority、idempotency、发布事务或 source-watermark 语义。

## 6. Institution Admin 表面

- **角色边界**：mobile board 与 Web workbench 都绑定显式 active role；多角色用户
  必须切换角色。当前只定义 `institution_admin` Web 操作台。Lead 是 Admin 指定的
  内部分工标识，不增加 permission、visibility、capability 或独立 Surface。
- **移动首页（只读）**：以班级为顶层入口，园区层只保留园区级事项、班级列表和
  跨班级异常摘要，不用一条统一时间线假设全部班级同步活动。禁止按老师、孩子、班级
  或园区评分/排名。
- **班级卡（只读）**：展示当前/下一活动、正式出勤提交状态、最新合格照片、最新
  文字、source timestamp 和待回应/新反馈/待处理数量；不展示沟通正文、孩子名单、
  AI 出勤推测、匹配 confidence 或 freshness/绩效分数。照片优先使用有效的可选活动
  封面，否则按当前活动最新 → 本班今日最近活动的确定性规则选择；待复核、归属不明、
  withdrawn/redacted/revoked/invalid 内容排除。系统不以审美/生成式 AI 挑图，也不
  crop、beautify 或 face-focus。
- **班级详情（只读）**：每班独立展示有效日程、一日活动、今日沟通与关注、家园共育、
  正式出勤状态和 actor-safe `InstitutionWorkflowProjection`。日程解析顺序为
  当日临时安排 → 班级覆盖 → 园区默认，并保留 effective date/version。孩子级
  下钻只用于明确的沟通、出勤或活动证据核对 purpose，不形成可任意浏览的全量档案。
- **活动证据落位**：照片、文字和活动记录只在精确班级内，依次按显式 activity ref、
  当日临时安排、班级日程/时间和后置 AI 语义辅助落位；无法确定时保留为班级内
  “待归位”。无记录不等于活动未开展，也不构成老师绩效。
- **今日沟通与关注**：Admin 不需要老师主动升级即可查看发送前已披露监督的园区业务
  沟通。读取通过非 canonical、逐请求组合的
  `InstitutionBusinessCommunicationProjectionV1`，每次重新校验精确 Institution /
  Enrollment / CareGroup / original Grant / data class / direction / purpose /
  source lifecycle。可见当前正文、附件与 correction/withdrawal/redaction 状态；
  Guardian private AI、未发送草稿、My-Chat private chat 和其他 Enrollment 排除。
  该投影不授予 acknowledge/reply/correct/withdraw/redact。
- **支持信号**：只表示园区可能需要提供支持，不是异常定责或绩效。第一版从明确
  deadline/blocker 和园区显式配置的 absolute count/time-window 规则派生；未配置的
  负荷规则保持 disabled，不做跨班/跨老师比较、历史异常基线或隐藏 AI score。产品只
  显示“需要处理 / 建议关注”两级；只有 canonical overdue/blocker 可进入前者。
  园区首页最多突出三个跨班信号，班级卡只显示 body-free 数量/原因并通过 exact
  owner-read 下钻。Mobile 不提供 dismiss/ack/escalate；Admin Web 配置 policy、
  查看来源并执行独立 source action。来源解决/撤回/纠正/redaction/revoke 后信号
  自动消失，不自动回复、通知、创建 WorkItem/Workflow 或形成长期标红历史。Web 仅可
  显式创建 WorkItem，或启动当前 registry 已注册且 eligible 的 Workflow；普通 signal
  不能启动 Enrollment Journey。
- **AI 关注候选（后置）**：只在上述同一 owner-read 范围内，以来源引用突出可能需要
  介入的沟通；不自动行动、诊断、归责或评分，最多映射为“建议关注”，不能自行升级
  为“需要处理”。
- **首个园区 Workflow**：第一实现增量只选择
  `EnrollmentJourneyWorkflowV1`，顶层覆盖意向咨询/沟通、可选到访、可选满班候补、
  试入园前 identity/binding 与 pending Enrollment/Grant/CareGroup、普通试入园
  适应/复盘、formal Enrollment 和完成。`capacity_waitlist` 只表示
  目标班级满员；等待 Guardian、caregiver、system owner、未来日期或 blocker 是
  waiting/blocking state，不进入
  候补顺序或容量统计。意向/候补期允许最少 local provisional data，但实际试入园前
  必须完成 Guardian-authorized My-Chat Child/Family、current binding、Nurture
  association、pending Enrollment/Grant 与 exact CareGroup assignment。
  试入园本身就是适应期；需要继续观察时在正式激活前显式延长 trial。正式激活把
  同一关系的 `participationPhase` 从 `trial` 转为 `formal`，`status` 继续为
  `active`；确认成功后 Workflow 幂等完成，不增加 post-activation settling、额外
  反馈表或人工完成门。现有 `NurtureEnrollmentStatus` 不新增 `trial`；精确 DTO/
  transition/migration 由 T-007 freeze register 冻结后才可启用。
- **意向数据与沟通**：inquiry 默认只记录孩子称呼、出生月份或年龄段、期望入园
  时间、目标班型/年龄段、照护时间需求、来源渠道、Host-owned opaque contact ref、
  安全 label 和 last/next touchpoint；法定姓名和完整出生日期留到有明确 purpose/
  consent 的后续阶段。raw phone/WeChat/email/account identity 不进入 Nurture。
  native 园区业务沟通通过 canonical source owner-read；external phone/WeChat 只记
  Admin structured summary、channel/time、confirmed needs 和 next action，不保存或
  伪装 transcript。AI 仅从当前授权、可引用的 native source 生成待 Admin 确认的摘要
  candidate，不生成意向/适配/转化评分，也不自动推进 `inquiry`。
- **满班候补**：只有目标班级已满、家庭明确接受候补、目标班级和最少意向数据确认
  后才生成 `waitlistQualifiedAt`；首次咨询不预占资格。园区使用版本化 priority
  category，同类按资格时间 FIFO；未配置 category 时为纯 FIFO，AI 不参与排序。
  Admin 调整顺序必须显式、说明原因并保留 append-only history。家庭只看自身状态、
  目标班级和复核/联系时间，不显示精确名次、队列长度或排序依据。每条候补必须有
  `nextReviewAt`；未回复进入 `waiting_on_guardian` 并按配置 reminder/deadline
  处理，一次未回复不自动删除。空位只生成 Admin task，由 Admin 发出限时 offer；
  Guardian 明确接受前不自动创建 identity、Grant 或 Enrollment。
- **试入园身份与状态**：provisional subject 只存在于意向/到访/候补。真实试入园前，
  Guardian 必须创建/选择并授权 My-Chat Child/Family，完成 current binding、
  Nurture association、pending Enrollment/Grant 和 exact CareGroup assignment。
  trial-start commit 原子写入 `status=active, participationPhase=trial`。
  进入班级后与其他孩子共用普通 roster、attendance、care facts、照片自动关联、
  board、family publication 和 PublishProcess；不建立 TrialChild、独立
  trial consent/media/attendance/retention pipeline 或 caregiver Surface。phase
  不授予权限。当天真实照护和出勤计入安全人数；正式在园统计只计算
  `status=active && participationPhase=formal`，转正式不复制孩子或历史事实。
- **试入园复盘**：家庭接受 trial offer 后关闭原 waitlist entry，并为 exact class
  建立有 `trialStartsAt`、`trialEndsAt`、`reviewAt <= trialEndsAt` 的单一 capacity
  reservation。review 到期只生成 Admin task/signal；不自动延长、录取、结束、释放
  名额或联系下一位，超过 endsAt 继续试入园必须先显式延长。复盘复用已有出勤、
  照护、普通观察和家园沟通，不要求老师填写 trial 评分表；AI 只提供带引用 draft。
  Admin 只可延长、提出待 Guardian 接受的正式入园、或结束并释放名额；正式方案
  等待期间继续占位。结束后继续等待需重新取得 D-07B qualification 和新的
  `waitlistQualifiedAt`，不自动恢复旧名次。trial-start 前 Guardian 撤回由
  `cancel_trial_preparation` 关闭 preparation shell 并释放 reservation；trial 已开始
  后改走 end-trial。
- **转正式与退出**：正式激活必须先有 Guardian 对 current proposal 的明确接受，再由
  My-Chat 重验 Child/Family membership 与 scenario binding currentness。Nurture 在
  一个 expected-version/idempotent local transaction 中同时完成 Enrollment
  `participationPhase: trial → formal`（`status` 保持 `active`）、
  reservation→active occupancy、Grant/CareGroup 更新；跨 owner
  不宣称 distributed transaction。owner unavailable、binding drift、evidence expiry
  或本地失败时保持 `active trial + reserved`，Workflow 显示 `waiting_on_system`，
  所有 Surface 只在 commit 后显示 formal。end trial 是可在 My-Chat outage 下执行的
  本地降权事务：同时将 `status` 转为 `ended`、结束 CareGroup/trial Grant、释放
  reservation，之后只
  创建 Admin task。退出不删除 My-Chat identity/binding、Nurture association 或历史
  care facts，未来访问/发布停止，历史沿用 T-006 lifecycle。Workflow 完成后的正式
  离园是普通 Enrollment maintenance，不重新打开 Journey。
- **Web 操作台**：当前仅 `InstitutionAdminWorkbench` 可用，是
  `InstitutionWorkflow` 的主要操作面。首批包含人员与关系、日常运营、家长触达、
  数字资源、园区知识/RAG 与流程队列。出勤由 AI 在每日提交时提供推理，当前班级
  老师确认后才成为正式事实；Admin 可查看、催办、退回或跨日 reopen，不能代确认。
  园区编辑的知识可关联权威来源，产品内 AI 回答应提供来源引用。Admin 可新增园区
  来源照片/文字、查看完整原图/正文、设置可选封面、调整活动落位并执行 downscope
  hide；Admin 对 child attribution 只能提出 correction candidate/WorkItem，由
  exact CareGroup caregiver 确认。老师原始内容、作者和时间不可原地覆盖，调整必须
  保留原始自动匹配、操作者、原因及完整 revision history。完整事实仍由 Nurture
  持有，Web 不复制第二份 canonical 数据。

## 7. 设计系统 [A]

- 品牌：全线 morethan tokens——mobile 与 `My-Chat apps/mobile theme-tokens.ts` 一致
  （cream #F5F2EA / paper / sand / navy #283E68 / orange #E1703C primary / 暖墨 ink），
  web 用 workbench kit。**松林绿 #2C5F55 为 Nurture 场景语义色**（园所来源徽章等），不作主色。
- 构图：卡片只留焦点对象（每屏至多一两个）；分区靠组间留白 ≥2× 组内 + 小节标题 +
  sand 分组面板，不靠描边；每屏一个强调色面；8pt 栅格。
- 手写内联 SVG 必须显式尺寸（无尺寸默认 300×150，已踩坑）。

## 7b. 交互范式提炼（mobile paradigms 候选）

> 定位：从十屏设计中提炼的**场景无关**交互范式——性质对标
> `My-Workflow-Base/templates/web-workbench/PARADIGMS.md`（Hub/List/Insight + 铁律），
> 但属移动端/chat-shell 生态。**最终归宿应是 My-Chat 侧的 "mobile paradigms" 文档**
> （已在 My-Chat 任务体系留立项线索）；在此先钉住词汇表，防止实现期各自发明。
> 铁律句式与 web-workbench 同构：让错误的结构难以做出来。

| 范式 | 定义 | 铁律 |
| --- | --- | --- |
| AI 房间 / 人类房间 | 对话界面按对方是谁分两种形态 | AI 无气泡（✦ 结构块+行动芯片）、无头像、无已读；人类经典气泡+回执。形态即身份，进错房间 3 秒可感知 |
| 跨界预览卡 | 要离开私域的内容，长成目的地的样子 | 出边界内容渲染为"人类气泡"预览 + 显式动作；永不静默跨界 |
| 读条卡（快捷调整窗） | 系统将执行可撤销内部推进的标准形态 | 卡片 + 流失进度条 + 触碰即停；30 秒后只进入待发送，不跨边界发布 |
| 暂存气泡（两段式） | AI 产出停在目的地会话里的未发送态 | 灰虚线气泡 + 定时标签 + 现在发送/撤回；自动化永不跨边界，跨界=发送时刻；人工消息永远即时 |
| 状态行 | 生命周期的一行收缩态 | 可跳转定位（"查看›"）；状态用生活语言，不用工单语言 |
| 浮标 + 底部抽屉 | "第二空间"的唯一悬浮入口 | 抽屉=找功能，浮标=找人；抽屉头部按对象数选形态（≤2 segmented，多对象头像横轨一步直达） |
| 日记本翻页 | 按日数据的时间导航 | 日期条横滑 + 日历密度点 + 空白日也有页；横向翻日子，纵向翻成长；快照视图不参与翻页 |
| 原地展开面板 | 芯片条/头像条的就地下钻 | 点开原地展开、再点收起，不跳页；状态点的答案必须在展开里 |
| 场景视图（lens） | 场景对 shell 的接管 | 只改默认落点/rail/悬浮/上下文，不改权限与数据边界 |

**半通用组件**（换词即迁移）：关注点卡（tinted 卡+周趋势微条+证据下钻，目标/OKR 型场景通用）、
相册流（混合密度时间线+周期锚+里程碑星标+来源徽章，纵向成长记录通用）、来源徽章体系
（provenance 芯片+场景语义色）、行动芯片（AI 回复携带可改选动作，确认后生效）、
"已记入"归档芯片（对话内容挂档案的可感知时刻）、时间芯片条（当前项高亮日程横条）。

**Nurture 专属模块**（组件树 checklist，不抽象）：今日一瞥 / 方向行 / 在园四格 /
孩子今日面板（概况+叮嘱+笔记+关注）/ 授权数据类开关页 / 班级流 / 队列汇总行。

> **2026-08-19 边界落定（T-046 dashboard-grammar）**：范式之外，看板的**页面语法**
> 也有了归宿——My-Chat 侧 `docs/context/ui/mobile-dashboard-grammar.md`。分工一句话：
> **壳出语法，场景出文章**。阅读结构（区块标题、单区块降级、下钻默认形态）、操作习惯
> （T-036 异步语义、通知至多一个次级动作）、通用元素（状态视图、区块标题、新鲜度提示）
> 归壳；哪些区块存在、按什么顺序、装什么数据，仍由本契约 §4.1/§5.1/§6 规定，并以
> My-Chat 仓内的类型化组件表达——**不是**运行时下发结构，卡片 DSL 仍被禁止。
> 上表"半通用组件"是该语法层的候选清单：收编走两个真实消费者 + 去名词化两道门；
> 来源徽章体系已于同日评审并因单一消费者而**暂缓**，仍留在候选位。

## 8. 工程依赖清单 [C]

| 依赖 | 说明 | 现有衔接点 |
| --- | --- | --- |
| AI 整理管线 | 时间窗/活动包聚簇、关联宝宝三源、置信门控、敏感类兜底 | T-002 iia-resolver-contract（远不止） |
| 调度 | 手动/静默/发送前兜底整理触发、quiescence gate、定时批量发送（Pilot 17:00） | worker/outbox |
| 回执链 | 送达/已读/已确认跨端一致 | message lifecycle 有 receipt/redaction，需扩展"已读" |
| 日程↔活动模板 | 班级日程 schema、理念→活动下发、整理归类钩子 | cohort_care_plan（未建） |
| 场景视图机制 | shell 接管（落点/rail/悬浮/上下文） | My-Chat 跨仓立项（scenario-token 铺垫） |
| 语音转写 | ASR + 转写文字为唯一数据形态 | My-Chat composer/asr |

## 9. 待验证假设（试点清单）[试点]

快捷调整 30s 手感；Pilot 17:00 与园区自定义批次时点的家长接收体验；10 分钟静默、
60 秒 quiescence 与老师真实采集/“整理”触发节奏；
班级群放开发言后的噪音；家长通知疲劳与推送分级规则；合照肖像政策；园长移动看板的数字选择；
共创五问（记录耗时/理念落地卡点/家长最难答问题/合照政策/园长三数字）。

## 10. 版本

- v1（2026-07-23）：基线 = deck v2.5 + 效果图 r4；九轮决策全录于任务包 02-architecture.md。
- v1.1（2026-07-30）：同步 T-007 D-01～D-07，机构端改为 role-bound、
  Institution-Admin-only Web 与班级优先 mobile，加入精确授权的园区业务沟通只读
  投影，固定确定性最新照片、完整 Web 照片/文字记录、append-only 关联修订，以及
  两级、非绩效、绝对阈值驱动的 support signals；首个 Workflow 只选择从意向到
  试入园适应/复盘、正式激活和完成的 Enrollment Journey，将满班候补与普通
  waiting state 分离，并以
  D-07A 固定最少 inquiry data、Host contact owner 和 external-summary 边界，以
  D-07B 固定候补资格、policy/FIFO 排序、家庭可见性、复核和限时 offer 边界，以
  D-07C 固定 My-Chat-bound 普通试入园照护、trial lifecycle 标签和统计边界，以
  D-07D 固定单名额 reservation、Admin 三结果复盘和不恢复旧候补名次的边界，以
  D-07E 固定 My-Chat currentness 重验、Nurture 本地原子转换与安全 exit 边界，
  以 D-07F 明确 trial 即适应期、activation success 后直接幂等完成 Workflow。
- v1.2（2026-07-30）：同步 T-006 已锁定的 30 秒快捷调整、10 分钟采集静默、
  60 秒 quiescence、Pilot 17:00 发送与发布前持续可编辑语义；同步 T-007 package
  closeout 的 Admin activity/child-attribution authority、Enrollment
  `status + participationPhase`、`cancel_trial_preparation`、普通 formal offboarding
  和 contract freeze register。
- 变更流程：先在任务包记录讨论与拍板，再更新本契约并 `ctl-context touch`。
