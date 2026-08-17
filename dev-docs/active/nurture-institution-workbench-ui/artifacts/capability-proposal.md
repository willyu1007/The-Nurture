# 能力提案 — 三个零契约模块反推结果

**产出定位**：给后续后端任务的设计输入，不是 build-ready 设计。
每一条都从 B3-1c 锁定的园长动作清单反推，来源可查。

**推导过程**：本提案由 T-013 的设计工作反推得出。推导时画了三份静态 mock
（人员与关系 / 日常运营 / 授权申请），逐区块标注「这个元素需要哪个能力」。
那些 mock 是演示件，只存在于设计者桌面，不是仓库资产；本文件是它们的完整结论，
不依赖 mock 即可阅读。

**契约来源**：

- `dev-docs/active/nurture-institution-mode/09-pilot-readiness.md` B3-1c（机构动作矩阵与其 11 条强制语义）
- `dev-docs/archive/nurture-institution-surfaces/02-architecture.md`（InstitutionAdminWorkbench 六模块、出勤提交与修订规则）
- `docs/context/product/workflow-product-design-contract.md`（Classification Rules、Current Scope、Anti-Metrics、Projection 禁止输出）

**现状基线**：`capability-registry.json` 共 65 个能力，其中 28 个绑定
`institution_workbench`。对这三个模块，grep `grant` / `role` / `group` /
`invit` / `roster` / `staff` / `cohort` / `attendance` **零命中**。

---

## 一、人员与关系（19 个新能力）

拓扑根。另外三个模块都按班级或 enrollment 作用域组织，所以这个模块先做。

### 读

| 能力 | 返回 |
| --- | --- |
| `query_institution_topology` | 班级、容量、当前在园计数、主班覆盖 |
| `query_staff_assignments` | 职务分配与历史 |
| `query_invitation_status` | 邀请的 invited/pending/active/disabled 状态 |
| `query_enrollment_roster` | 按班级的 enrollment `status` + `participationPhase`、起始时间、名额占用 |

`status` 与 `participationPhase` 是两个维度：trial 不是 status 的取值。

### 写

| 分组 | 能力 | 确认级别 |
| --- | --- | --- |
| 园区 | `create_institution_profile` / `update_institution_profile` | strong |
| 园区 | `configure_institution_policy` | strong（需 current policy/version 重校验） |
| 班级 | `create_care_group` / `update_care_group` | strong |
| 班级 | `suspend_care_group` / `close_care_group` | strong；close 不可逆 |
| 人员 | `initiate_participant_invitation` | 双 owner 编排，非单一命令 |
| 人员 | `assign_staff_role` / `revoke_staff_role` | strong（scope/version 重校验） |
| 人员 | `designate_lead_caregiver` | strong（班级职务覆盖重校验） |
| 入托 | `initiate_enrollment` / `change_enrollment_lifecycle` | strong |
| 入托 | `propose_care_group_transfer` / `cancel_care_group_transfer` | strong |
| 入托 | `close_enrollment` | strong，**不可逆，走全屏确认** |
| 范围 | `disable_pilot_cohort` | strong |
| 范围 | `recover_pilot_cohort` | strong，独立命令，重跑 eligibility |

`close_enrollment` 已在 T-013 的 `FULLSCREEN_ACTIONS` 中占位。

### 三个设计判断

1. **状态变更拆成多个命令，不用一个带 status 参数的。** suspend 与 close 的后果披露
   完全不同，close 不可逆。合成一个会让确认框无法针对性披露。
2. **lead 是独立动作，不是 role 的取值。** 契约说它不增加任何
   permission/visibility/capability；做成 role 枚举值会诱导实现方给它加权限。
3. **邀请是编排而非命令。** 园长发起 → My-Chat 拥有邀请/认证/接受 → Nurture 映射
   participant。C-4-1 要求先有独立的 purpose-bound Staff Invitation intent/Execution。
   UI 必须显示「等待对方接受」这个 Nurture 无法推进的状态。

### 禁止边界

`⛔` 硬删除任何拓扑/职务/enrollment/授权/审计事实 ·
`⛔` 主张或撤销 Guardian 关系 · `⛔` 创建或撤销 Guardian 授权 ·
`⛔` 改环境 capability / Workspace activation / Run/Step/Handoff/Outbox ·
`⛔` 对孩子、班级、老师排名

---

## 二、日常运营（4 个新能力，1 个建议缓做）

**这个模块最容易做错。** 权限链是：AI 推理 → **当班老师确认才成为事实** →
园长只能查看、催办、退回、跨日 reopen。园长**不能代确认，也不能改写 `AttendanceFact`**。

### 读

| 能力 | 返回 |
| --- | --- |
| `query_attendance_submission_status` | 提交状态、提交人、提交时间、人数、source watermark。**只返回提交状态，不返回出勤明细** |
| ~~`query_record_coverage`~~ | **建议先不做**，见下 |

### 写

| 能力 | 语义 |
| --- | --- |
| `remind_attendance_submission` | 催办。生成责任角色 WorkItem，不是 InstitutionWorkflow |
| `reopen_attendance_submission` | 针对**未提交**的过往日期重新打开提交窗口 |
| `return_attendance_submission` | 针对**已提交但有疑点**的记录，打回给老师修订 |

后两个必须分开：语义不同，合成一个会让确认框说不清后果。两者都写 append-only 审计
（操作者、原因、时间），且**都不改写记录内容**——修订仍由有效班级老师完成。

### 核心约束

- **园长没有任何一个能改出勤内容的动作。** 三个写动作全是「把事情推回给有权的人」。
  界面上不能出现任何看起来像「修改出勤」的入口。
- **只读提交状态，不读出勤明细。** 园长要的是「谁没交」。读明细意味着读孩子级事实，
  需要独立的 scope/purpose 校验，不该混在运营视图里。
- **措辞避开绩效暗示。** 用「有疑点」而非「异常」，不按老师聚合，不显示跨班比较。
  契约明确：无记录不等于活动未开展，记录缺口不构成老师绩效。
- 同一用户兼任园长与老师时，必须**切换到 caregiver 角色**并通过当日 assignment
  才能操作。这正是 T-013 角色切换器存在的原因。

### 为什么建议不做 `query_record_coverage`

它离 Anti-Metrics 边界太近：「覆盖率」天然邀请比较，有了这个数就会有人要排序。
而它解决的问题（发现记录缺口）已被「有疑点」覆盖。建议等真实运营反馈证明确有需要再加。

另外「与照护记录不一致」的判定逻辑**尚未定义**。它需要一个园区可配置的绝对阈值规则，
否则就成了隐式 AI 评分——正是契约禁止的。这条规则本身是一个决策，不是实现细节。

---

## 三、授权申请（3 个新能力）—— 建议不做成独立模块

模块名是 `grant_request_management`，但园长**不能管理授权**：B3-1c 禁止创建或撤销
Guardian 授权，coverage 视图也「MUST NOT 提供改授权的手段」。
园长只能**发起请求**，然后**看等待与结果**。

### 能力

| 能力 | 返回/语义 |
| --- | --- |
| `query_grant_coverage` | 每个 enrollment 只返回白名单五字段：scope、direction、system dataClass、version、当前 active/missing/revoked |
| `query_grant_requests` | 请求的当前状态与结果类别（granted/declined/expired/revoked），**无任何原因文字** |
| `initiate_grant_request` | 园长唯一的写动作 |

### 禁止边界

`⛔` 同意正文 · `⛔` 撤销原因文字 · `⛔` 消息正文 · `⛔` 任何改授权的手段 ·
`⛔` 代家长决定

前三条是隐私边界，后两条是权限边界。五条都是契约原文。

### GrantRequest 不是第二个 Workflow —— 它已经在 Enrollment Journey 里

三条证据，从硬到软：

**① 机器契约已经把 grant 焊进 journey。** `start_trial` 与 `propose_formal_enrollment`
的并发 `headBindings` 都含 `grant_head`：

```
start_trial               [workflow_head, enrollment_head, grant_head, reservation_head, …]
propose_formal_enrollment [workflow_head, enrollment_head, grant_head, reservation_head, …]
```

授权的建立已经在 journey 的事务里发生。它不是待接入的第二个流程，是 journey 正在操作的
一个 head。这条是冻结的契约，不是文字推理。

**② 架构文档直接点名。** `02-architecture.md` 的 InstitutionWorkflow Boundary：
「第一实现增量的 `InstitutionWorkflow` registry 只包含 `EnrollmentJourneyWorkflowV1`。
**Grant change**、出勤提交/修订、知识编辑…**均不是第二个 Workflow**。」

**③ Grant 的状态是实体生命周期，不是流程阶段。**
`NurtureChildLinkGrantStatus` 有六个取值（`pending / active / revoked / expired /
replaced / deleted`），但对照 Enrollment 就清楚了：Enrollment 既有实体状态
（`status` + `participationPhase`）**又有**独立的 `EnrollmentJourneyWorkflowV1`，
两者分开。Grant 只有实体生命周期，从未有人定义过它的阶段、里程碑或阻塞。
这不是遗漏，是它本来就不需要。

### Current Scope 不是 Workflow 类型清单

`workflow-product-design-contract.md` 的 Current Scope 列出四条：roster intake／邀请／
入托确认、Institution Enrollment 管理、GrantRequest、后续园区配置或审批流程。

**前两条全都在 `EnrollmentJourneyWorkflowV1` 一个类型里面。** 所以这是「哪些业务领域算
园区管理流程」的范围清单，不是「存在几个 Workflow 类型」。GrantRequest 与它们并列，
恰恰说明它同样在**这一个** Workflow 之内——而 `grant_head` 的绑定证明它已经在了。

早期版本的本提案曾把这里报为「契约自相矛盾、需 owner 裁决」。那是误读：
把范围清单当成了类型清单。Classification Rules 与 Current Scope 之间没有冲突。

### 建议的落地形态

拆开园长实际会遇到的三种情况：

| 场景 | 归属 | 需要什么 |
| --- | --- | --- |
| 新入托时建立授权 | **已在 journey 内**（`trial_preparation` → `start_trial`） | 无需新增 |
| 授权被撤销或过期 | 家长侧动作，园长是受影响方 | 只读 coverage |
| 政策变更导致 `replaced` | Nurture 提 delta、家长决定 | 只读 coverage |

园长在这三种里只有一个写动作，且已被 journey 覆盖。**唯一真实缺口**是：
enrollment 已存在但授权缺失或过期时，园长如何重新发起。

因此建议：

1. 不新建 Workflow 类型，不新建模块。`initiate_grant_request` 是一个挂在入托关系上的
   `ActionExecution`，只服务「补发起」这一种情况。
2. coverage 做成入托关系详情里的只读区块。
3. `grant_request_management` 从 surface registry 的 `orderedContentKinds` 移除——
   **8 个模块变 7 个**。这是契约变更，需要单独决策。

### 仍未决的小问题：缺授权的可发现性

只读 coverage 按 enrollment 组织。14 个 enrollment 里有 2 个缺授权，园长怎么发现？

- **靠概览台的待办**（T-013 已有机制）：「N 个 enrollment 缺授权」作为一条 attention row。
  零新界面，且缺授权会 fail-closed 阻塞家园沟通，本就是「需要处理」级别的信号。
- 或在人员与关系里加一个「仅看缺授权」筛选视图。

建议前者：复用已跑通的两级规则。

---

## 四、两份模块分解不一致

本提案早期版本称「`02-architecture.md` 把 grant lifecycle 同时写在人员与关系和授权申请里」。
**那是错的**：`02-architecture.md` 只提了一次（在人员与关系内），而且它根本没有「授权申请」
这个模块。真正的问题不是文档内重复，是**两份分解彼此不一致**。

| A：`nurture-mobile-ux-contract.md`（已注册 context 契约）<br>+ `02-architecture.md`（T-007 归档） | B：surface registry（冻结机器契约） |
| --- | --- |
| 人员与关系（**含 enrollment 与 grant lifecycle**） | `people_operations` |
| 日常运营 | `daily_operations` |
| 家长触达 | `communication_review` |
| **数字资源** | *（无对应 contentKind）* |
| 园区知识／RAG | `knowledge_management` |
| 流程队列 | `institution_workflow_queue` |
| *（无）* | `hub` |
| *（无）* | `insight` |
| *（含在人员与关系内）* | **`grant_request_management`**（被单独提出） |

三处差异，性质各不相同：

**① `grant_request_management` 被从人员与关系里单独提了出来。**
第三节的证据（`grant_head` 已绑在 journey 命令内、`02-architecture.md` 明写 Grant change
不是第二个 Workflow）指向把它合并回去——**恰好回到 A 的分法**。
两条独立路径得出同一结论，是相互印证。

**② `数字资源` 在 B 里消失了，而且没有任何能力支撑。**
A 侧对它有实质描述（整理／查看／治理已授权的活动、媒体、文档资源；
`02-architecture.md` 的 "Complete activity records in Web" 一整节讲 Admin 可新增园区来源
照片文字、看完整原图、设活动封面、调整落位、提 correction candidate）。
但在 B 侧：无 contentKind，且 workbench 绑定的 28 个能力里**零个**媒体相关——
全部 6 个媒体能力（`confirm_child_media_attribution`、`organize_care_capture_batch`、
`discard_media_asset` 等）都绑在 `caregiver_teacher_board` 上。
**这需要一个决策：是有意砍掉了，还是在冻结 registry 时漏了？**

**③ `hub` 与 `insight` 是 B 新增的。** 这两个是合理的新增（概览与洞察），
A 没有不代表冲突。

### 建议

- ① 按第三节执行：移除 `grant_request_management`，coverage 回到人员与关系。
- ② 单独决策。若确认砍掉，`nurture-mobile-ux-contract.md` 的「首批包含…数字资源…」
  一句需要同步更正——那是已注册的 context 契约，不能放着与冻结 registry 不一致。
- ③ 无需动作。

---

## 五、整体风险

1. **本提案是按 B3-1c 的动作清单反推的，不是产品需求调研。** 真实园长是否需要在 Web 上做
   班级 CRUD，尚未验证——试点只有 1 个园区、3 个班级、14 个孩子。
   其中相当一部分能力在试点期可能是多余的。
2. **试点规模让聚合视图近乎无意义。** 日常运营整个模块可能应该推迟到试点之后。
3. **T-013 踩过同类错误**：Record 的「意向信息」facet 是按「契约允许记录哪些字段」
   推的，结果没有任何能力能读出来。**「允许存」不等于「有能力读」。**
   本提案的每一条都应该在实现前再对一次能力注册表，而不是信这份文档。

---

## 六、建议的实施顺序

| 顺序 | 内容 | 性质 |
| --- | --- | --- |
| 1 | 确认移除 `grant_request_management` contentKind | 决策；归类本身已由证据定论 |
| 2 | 裁决 `数字资源` 是砍掉还是补回（见第四节 ②） | 决策；砍掉则需同步更正 mobile UX 契约 |
| 3 | 人员与关系的**读**能力（4 个） | 拓扑根，其余模块的作用域来源 |
| 4 | 人员与关系的**写**能力，按试点实际需要裁剪 | 19 个里试点可能只需 5–6 个 |
| 5 | 日常运营（4 个） | 依赖 3 |
| 6 | 授权 coverage 只读 + 概览台缺授权待办 | 唯一剩下的授权相关工作 |

第 1、2 条是决策不是代码，可以立刻做。第 4 条的裁剪需要真实园长参与。

建议第 4 步只做 **4 个读能力 + `initiate_enrollment` + `close_enrollment`**，
其余 13 个等真实使用反馈。
