# Architecture — 机构端双 Surface

## Institution Boundary

机构关联、group membership、enrollment 或 scenario binding 只决定路由候选范围。读取事实仍需 actor role、grant、child scope、fact visibility 和用途策略同时通过。

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
  活动/孩子关联。Web 是操作面，canonical 事实仍由 Nurture 持有。
- Admin 不得原地覆盖老师的原始照片/文字、作者或 capture/source time。关联调整、
  园区补充说明、隐藏/更正均追加 revision，保留原始自动匹配结果、调整 actor/reason
  和完整 history；不得保存或展示人脸 embedding。

### D-06 — Support signals without performance scoring

- Support Signal 的语义是“园区可能需要提供支持”，不是异常定责、风险评分、老师
  绩效或 Workflow。
- 第一版包含两类规则：canonical deadline/blocker 驱动的确定性业务状态，以及园区
  显式配置的绝对 count/time-window 负荷阈值。负荷规则未配置时保持 disabled，不
  使用跨班/跨老师比较、历史基线异常检测或隐藏模型分数。
- 产品只展示 `action_required | attention_suggested` 两级，文案为“需要处理 /
  建议关注”。排序仅使用明确 deadline、业务状态和发生时间。
- Mobile 最多突出三个跨班级信号，班级卡只显示 body-free 数量/原因并允许只读
  下钻。阈值配置、来源业务 action 和显式创建 WorkItem/Workflow 位于 Admin Web。
- Signal 是可重建的非 canonical projection。来源解决、撤回、纠正、redaction、
  revoke 或失效后自动消失；不得自动回复、通知他人、创建 action/WorkItem/Workflow
  或沉淀为长期绩效历史。
- `InstitutionAttentionCandidate` 仍是独立、后置、default-off 的内容语义能力；
  它未来只能映射为 `attention_suggested`，不能自行升级为 `action_required`。

### D-07 — One complete enrollment journey Workflow

- 首个实现只注册 `EnrollmentJourneyWorkflowV1`，不同时实现通用 Workflow builder
  或第二个业务 Workflow。
- 顶层旅程覆盖：意向咨询 → 意向沟通 → 可选到访 → 可选满班候补 → 试入园准备 →
  试入园 → 试入园复盘 → 正式入园确认 → identity/Grant/Enrollment activation →
  入园适应期 → 完成。试入园可延长，也可回到满班候补或结束。
- `capacity_waitlist` 只表示目标班级当前满员。等待家长、caregiver、system owner、
  已约定未来日期或 blocker 是 Workflow 当前 waiting/blocking state，不是候补阶段，
  也不得进入候补顺序/容量统计。
- 意向阶段只保留完成旅程所需的最少本地 provisional record 和 touchpoints，不创建
  CRM/营销评分，不 mint/infer My-Chat child/family identity。
- 实际试入园前必须有 Guardian 明确同意。缺少 platform binding 时只允许园区内部、
  有限且短期的试入园事实；向家庭展示照片/文字/记录还需要 current binding 和 Grant。
- 整体 accountable role 是 `institution_admin`。Guardian、exact trial CareGroup
  caregiver 和 system owner 只在各自步骤成为当前 waiting party；Lead/coordinator
  只作内部分工，不增加 authority。
- 正式 Enrollment 激活是旅程 milestone，不是 Workflow 终点；只有园区配置的适应期
  闭环后才完成 Workflow。该阶段不生成孩子适应评分。
- 本次只锁顶层旅程与边界。精确 enum、commands、进入/退出条件、候补顺序、trial
  consent schema、activation transaction 和 settling completion 继续作为 D-07
  深化问题，未锁定前不得实现者自行补全。
- 当前 scenario manifest/module/source 尚未声明该 Workflow；在 exact public
  contract、owner integration、fixture 和 qualification 完成前保持 default-off。

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
- optional latest-photo preview、latest text excerpt 和 source timestamp；
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
  WorkItem/Workflow 必须是独立、显式、幂等的业务动作。

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
- 调整 activity placement 和 confirmed child association；
- 添加 institution-authored note，或执行具名、可审计的 correction/hide action。

每条记录保留 source type、original actor/role、capture/record time、CareGroup、
activity placement、current child associations、visibility/publication lifecycle、
correction/redaction state 和 revision chain。自动人脸匹配只保留允许的
confirmation/provenance 结果，不在产品或审计 presenter 中保存/展示 embedding。

老师创建的原始正文、媒体、作者和时间不可原地修改。Admin 的 placement/association
调整写入 append-only revision，保留 previous value、automatic/teacher confirmation
来源、Admin actor、reason、timestamp 和 supersession relation。Web shell 不复制
这些 canonical facts；它通过 Nurture owner-read/query/action contracts 操作。

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
          → trial_in_progress
            → trial_review
              ├─ extend trial
              ├─ capacity_waitlist
              ├─ end journey
              └─ enrollment_offer
                    → identity_grant_activation
                      → settling_period
                        → completed
```

- `inquiry`：记录最少意向事实、来源和 next touchpoint；仍是 local provisional
  subject，不建立正式 Enrollment 或全局 identity。
- `intent_conversation`：记录园区与家庭对时间、班级、照护需求和下一步的业务沟通；
  不为每次 touchpoint 新建 Workflow，也不计算转化/适配分。
- `visit_or_consultation`：可选的到访/面谈 milestone，不自动产生长期孩子档案。
- `capacity_waitlist`：只因目标班级容量不足进入。保留目标 class/age band、expected
  entry date、enteredAt、capacity basis 和 next review；具体排序与优先政策未锁定。
- `trial_preparation`：确认日期/时段、trial CareGroup、必要安全事实、Guardian
  consent 和试入园期间的数据/可见范围。
- `trial_in_progress`：caregiver 在既有 role-bound mobile/action 中记录照护事实；
  Workflow 只引用授权 source refs，不复制内容，也不创建 caregiver Web。
- `trial_review`：Admin 汇总家庭反馈与授权 caregiver evidence，由人决定延长、
  候补、结束或发出正式方案；AI 只能整理，不能判断孩子“是否适合”。
- `enrollment_offer`：向 Guardian 呈现完整入园安排和待确认授权。
- `identity_grant_activation`：完成 current My-Chat identity/binding、Nurture
  association、Guardian Grant、Enrollment 和 CareGroup activation gates。
- `settling_period`：Enrollment 已 active，但 Workflow 继续收集配置周期内的必要
  家园/照护反馈和未解决事项交接；完成不等于适应评分。

### Capacity waitlist versus waiting state

`capacity_waitlist` 是业务阶段。下列是任何阶段都可能出现的 state dimension：

- waiting on Guardian confirmation/input；
- waiting on exact trial CareGroup caregiver evidence；
- waiting on My-Chat/Nurture owner validation；
- scheduled for an agreed future date；
- blocked by a resolvable authority/data/configuration issue。

这些 state 只表达“当前球在哪一方/什么条件”，不得改变候补顺序、暗示班级满员或
进入容量统计。无名额时由 Admin 明确进入候补；有名额后也由 Admin 按后续政策明确
恢复旅程，不自动承诺日期。

### Responsibility and surfaces

- `institution_admin` 对整体 journey accountable，并处理意向、候补、试入园安排/
  复盘、正式方案和 activation 协调。
- Guardian 在试入园同意、身份授权、Grant 和正式方案确认时负责自己的 owner action。
- exact trial CareGroup caregiver 只提交当前授权的试入园照护事实/可选 summary，
  不读取意向商业沟通或 Admin 内部判断。
- system owner 负责 identity/binding/Grant/activation 的 owner validation，不代替
  人类业务决定。
- optional coordinator/Lead 只是 assignment metadata；access 仍取决于 active role
  和 exact policy。

Admin Web 队列区分“需要园区处理、等待家庭、等待 caregiver、等待系统、满班候补、
已阻塞、适应期跟进”。Guardian/Caregiver 使用各自 My-Chat/role-bound mobile
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
`capacity_waitlist` 与 waiting state，并可投影 trial/activation/settling milestones。
精确字段、union 和 schema version 在 D-07 深化后冻结；当前描述不能作为调用方自行
拼装 DTO 的许可。

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
- [国家卫生健康委《托育机构质量评估标准》](https://www.nhc.gov.cn/wjw/s9502/202311/753dabfc9c2c4108910674500a000d59/files/1746698276823_22121.pdf)
- [WHO: Ethics and governance of AI for health](https://www.who.int/publications/i/item/9789240084759)
- [人工智能生成合成内容标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)

## Open Product Decisions

- 哪些理念/目标是家庭可选择共享、哪些仅机构配置。
- roster/invite 是否需要批量操作；默认不纳入首轮。
- `InstitutionBusinessCommunicationProjectionV1`、渠道 disclosure、Grant purpose 和
  parent-direct-to-institution Message 的精确 schema。
- 后置 `InstitutionAttentionCandidate` 的模型/策略、review、retention 与 activation gate。
- D-07 意向最少字段、touchpoint lifecycle 和非 CRM 边界。
- `capacity_waitlist` 名额、排序、优先政策、复核和恢复规则。
- 试入园 Guardian consent、临时 provisional data、caregiver evidence/summary 和
  retention/publish boundary。
- 试入园复盘、延长/结束/offer 的人类决定和 reason/audit。
- Guardian confirmation、binding、Grant、Enrollment/CareGroup activation 的精确顺序。
- settling period 长度、反馈、未解决事项交接和 completion gate。
- 知识 revision/publish lifecycle、来源冲突复核和 RAG owner contract 的精确 schema。
- Workflow progress 使用阶段/里程碑/下一步，不默认制造无业务依据的百分比。

## Failure Model

未知机构、错误 active role、非 Admin Web 访问、过期 grant、group/assignment mismatch、
跨班 schedule/source、无有效日程、沟通 disclosure/purpose 不满足、source
redaction/revoke、aggregate 样本不足、未提交出勤、无 eligible knowledge revision、
医疗来源冲突、错误候补进入原因、缺少试入园 consent/binding/Grant、错误 trial
CareGroup、activation gate 不完整和 source pin 不匹配均返回稳定的 fail-closed 或
明确待处理状态。
