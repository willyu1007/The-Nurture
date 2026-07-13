# Institution Ecology — Roadmap

> 宏观规划：里程碑、范围、依赖、回滚。细节看 `01-plan.md`，边界/接口看 `02-architecture.md`，IB schema 草案看 `06-ib-nurture-schema-spec.md`，IB 决策收敛看 `07-ib-decision-convergence.md`。

## 一句话目标

在不引入独立产品壳的前提下，把 Nurture 扩成以**小孩养育过程**为中心的托育生态：家长（可多个）、老师、机构管理者都是 My-Chat 独立用户；小孩不是 My-Chat 用户；Nurture 负责把这些用户接入同一个小孩的养育过程，并把不同角色映射到各自工作流。

My-Chat 拥有统一账号和场景外壳；Nurture 拥有托育生态图谱，包括家庭、孩子、机构、班级、老师角色、入托、授权、家园沟通、照护记录和媒体归属。

## 已确认的关键决策

| 决策点 | 结论 |
| --- | --- |
| 产品语义 | 机构不是授权，也不只是"模式"；机构是小孩成长过程中的外部环境和组织化照护生态。 |
| 基本单位 | Nurture 的基本单位是 `NurtureChildCareProcess`，不是家庭或班级。 |
| 数据作用域 | 单个 `NurtureChildCareProcess` 是独立 child scope；老师/家长/机构/班级视角都是对一个或多个 child scopes 的再组织。 |
| 用户边界 | 家长、老师、机构管理者都是 My-Chat 独立用户；小孩不是 My-Chat 用户。 |
| 所有权边界 | My-Chat owns account identity and scenario shell; Nurture owns the care ecology graph. |
| 场景角色 | `guardian`、`caregiver`、`lead_caregiver`、`institution_admin` 等角色归 Nurture 维护。 |
| Mobile chat / 看板角色 | My-Chat mobile chat 只做 Nurture 场景入口，不区分角色；Nurture 解析 role/scope/output。mobile 看板可切换 validated role assignment。 |
| 关系归属 | 家庭、机构、班级、老师分配、孩子入托、家园沟通关系归 Nurture canonical。 |
| `ChildLinkGrant` | 改为 Nurture-owned consent object，围绕 `child_care_process` / `enrollment` 控制 data class × direction 的流动。 |
| 老师痛点 | 一个班 10 个小孩会产生 10 个私密沟通线程；老师侧必须聚合成班级 inbox，而不是继续切 10 个群。 |
| `family_to_org` | 第一版定义为家庭沟通事项进入班级工作台：家长消息被结构化成 `NurtureFamilyCareItem`，进入 `class_family_inbox` / `teacher_attention_board`。 |
| Teacher attention | `NurtureTeacherAttentionItem` 物化为可重建 child-scoped projection；`careGroupId` 只是老师看板的组织/查询维度。 |
| 家园消息原文 | 如果消息来自 Nurture 家园沟通入口，`NurtureFamilyCareMessage` 是 canonical；My-Chat 只做 shell/render/notification/deep link。 |
| Grant revoke | `NurtureChildLinkGrant` revoke 是 runtime fence：停止未来投递、退出 active surface/context、阻断 in-flight runtime 继续使用 revoked-grant context，但不抹掉历史动作。 |
| Classification vocabulary | `dataClass` 是系统授权/policy 合约；`category` 是工作流展示分类；机构词汇只能作为映射层。 |
| Message protection | 家园消息 canonical status 只用 `sent` / `redacted` / `failed`；不设 message-level `hidden` / `deleted`；My-Chat 只拿 safe projection。 |
| My-Chat shell metadata | My-Chat 默认即时调用 Nurture render/action API；只有 host delivery 需要时保存 minimal opaque bookkeeping，不持久化 Nurture render envelope。 |
| 首批 capability | `class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution`；teacher mobile 是 surface composition，不是业务 capability。 |
| 机构价值 | 理念传达、资产沉淀与再组织、运营质量管线；老师 mobile 执行减负是落地入口。 |
| 反指标 | 禁止机构排名、跨组儿童排名、对外竞争性看护者评分；机构生态是照护运营系统非市场。 |

## Roadmap 讨论队列（2026-07-13）

| ID | 议题 | 当前默认结论 | 需要讨论的问题 |
| --- | --- | --- | --- |
| D1 | 核心对象 | **LOCKED:** `NurtureChildCareProcess` 是中心且是独立 child scope；所有 child-specific facts 必须解析到 `childCareProcessId` | IIA schema implementation |
| D2 | My-Chat/Nurture 边界 | **LOCKED:** My-Chat 只拥有 account/shell/runtime；Nurture 拥有托育业务事实；main-chat scenario response 与 explicit scenario dashboard 是正常结果面，只有 host activation 保存 opaque bookkeeping | B1-C activation handoff contract |
| D3 | 场景角色 | **LOCKED:** 家长/老师/机构管理者都从 My-Chat main chat 进入；My-Chat 只选择 scenario，`NurtureParticipant` 按 `(workspaceId, myChatUserId)` 唯一且由 Nurture 解析角色/作用域/业务方向；看板可切换 validated role assignment | 只有明确 persona 合规要求时才加 role-assignment persona layer |
| D4 | `family_to_org` 最小闭环 | **LOCKED:** 家长侧是 child-private conversation timeline；老师侧是 class workflow；家庭输入和老师动作都由 Nurture workflow 转成 audience-specific messages，不存在直接 role-to-role chat | Message/action schema implementation |
| D5 | `ChildLinkGrant` | Nurture-owned；绑定 child process + enrollment + data classes + directions；revoke 是 runtime fence，未来流动立即停止，active context 退出，历史记录 limited/auditable | 数字化保留窗口和法律文案 |
| D6 | 首批 capability | **LOCKED:** 四个 capability key 分开；teacher mobile 只是 surface composition；实现先做 `class_family_inbox` + `teacher_attention_board` | Done |
| D7 | Nurture DB / shell boundary | Nurture 保存家园沟通原文和任务化处理状态；grant/policy 用系统 `dataClass`，机构词汇只做映射；My-Chat 默认即时处理，只在 delivery 需要时保存 opaque bookkeeping | Host notification/delivery contract review |
| D8 | IIA implementation entry | **IN PROGRESS:** N1 is implementing additive schema, `NurtureCommandExecution`, `NurtureInteractionContext`, fail-closed resolver/policy, inbox and attention with explicit `[]`; non-empty activation remains gated on host ledger/materializer | Complete N1 quality gates without enabling activation |
| D9 | 第二增量 | `cohort_care_plan` / `developmental_observation` 后置 | 是否有必须提前进入 first slice 的机构管理功能 |
| D10 | 反指标 | 无排名、无交易、无竞争性评分 | 机构运营报表和绩效评分边界如何写硬 |

## 里程碑

| # | 里程碑 | 产出 | 退出标准 |
| --- | --- | --- | --- |
| IA | 设计 & 治理登记（本仓） | 设计包 + M-002/F-002/T-002 登记 | governance lint + context verify 绿；现有测试不受影响。 |
| IA.1 | 边界与 family_to_org 对齐（本仓） | My-Chat account/shell 与 Nurture care ecology graph 边界；班级 inbox 设计 | `00-overview.md`、`02-architecture.md`、`roadmap.md`、context contract 已同步。 |
| IB | Nurture care ecology canonical（本仓） | `06-ib-nurture-schema-spec.md` + `07-ib-decision-convergence.md`：schema SPEC 和 7 个 implementation defaults | IB-D0 through IB-D7 locked；不接 live manifest。 |
| IIA | 场景契约 + 数据 + 逻辑（本仓） | `08-iia-schema-policy-test-design.md` + manifest 接线 + Nurture 数据模型 + 首批 capability + policies + presenters | 先过 IIA-0 contract preflight；再过 validator/registry；grant 门禁、caregiver scope、inbox 处理测试绿。 |
| IIB | 操作台 + 同意 UX（本仓） | 机构/老师 mobile 工作台 + 家长同意/撤销/沟通 UX | 机构全旅程手动演示通过。 |
| III | 生态飞轮（双仓） | 机构运营价值 → 家长参与 → 家庭生态激活 + 归因 | 端到端演示；机构/老师有直接价值；无排名无交易。 |

## Cross-Repo Implementation Ladder

| ID | Owner repo | Increment | Dependency | Enablement |
| --- | --- | --- | --- | --- |
| X0 | My-Workflow-Base | vNext additive handoff/driver/host-capability contract、templates、conformance | Locked IIA design | No runtime |
| X1 | My-Chat | Adopt contract/types/validator/worker pass-through | X0 | Capability disabled；legacy paths compile |
| X2 | My-Chat | Concrete Postgres Step claim/complete/fail + completion replay + runtime injection | X1 | No non-empty Nurture activation |
| X3 | My-Chat | Handoff Ledger + atomic materializer + outbox + Admin recovery | X2 | Dev capability only |
| N1 | The-Nurture | Schema/CommandExecution/InteractionContext/runner/inbox/attention + family-core migration | X1；parallel with X2/X3 | Explicit snapshot `[]` only |
| X4/N2 | My-Chat + The-Nurture | Claimed driver、non-empty snapshot、manifest context source、`user_attention` reread consumer | X3 + N1 | Behind capability gate |
| X5 | All three | Contract drift、crash/race/privacy journeys and pilot enablement | X4/N2 | Enable only after PASS |

Hard gates:

- Nurture does not import/run My-Workflow-Base；Base is template contract, My-Chat is the actual package/runtime owner。
- Existing My-Chat `workflow-runtime` task remains historical scaffold scope；concrete persistence uses a new `workflow-handoff-materialization` task。
- N1 can proceed before X3 only with explicit empty snapshot arrays；non-empty activation requires X2/X3 host capability and exact claimed-Step ownership。
- Contract migration is additive first；legacy manifests warn，activation-enabled manifests fail without `handoff_key`、context source declarations and host capability。
- Rollback disables capability/manifest activation；it never rewrites committed Nurture business facts or requires distributed database rollback。

## 主要风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| My-Chat account 与 Nurture participant 混淆 | 高 | 只用 My-Chat 做登录主体；Nurture 解释角色、关系和权限。 |
| 家庭私域被老师环境式读取 | 高 | `family_to_org` 只投递明确 data class，不开放家庭画像检索。 |
| 十个群压垮老师 | 高 | 老师侧只看班级 inbox、今日看板和 child-scoped work detail；Nurture 把 workflow action 分发为家庭侧消息，老师不进入 direct family chat。 |
| 儿童数据曝光半径过大 | 高 | 授权按 child process / enrollment / care group；所有跨角色流动留 receipt。 |
| 价值观漂移到排名/市场 | 中 | 硬反指标；运营质量复盘不等于公开排名或绩效竞争。 |
| 同意撤销/数据保留语义 | 中 | 上线前定 revoke + 保留窗口；fail-closed。 |

## 回滚策略

- IA/IA.1 全是文档+治理登记，可逆（删 bundle + 回退 registry/context contract）。
- IIA 接线增量：未完成 Nurture care ecology schema 和 My-Chat shell integration contract 前不启用 live manifest。
- 授权与跨角色流动 fail-closed：grant 缺失、撤销或 data class 不匹配即停止流动。

## 依赖

- My-Chat 必须提供稳定 account identity、scenario shell、mobile/web render、notification/deep link、shared workflow runtime。
- Nurture 必须提供 care ecology canonical schema、resolver、policy、receipt 和安全边界。
- 家庭生态（M-001）仍应先验证核心价值；机构生态叠加时以小孩养育过程为统一中心。

## 文档包状态

```text
dev-docs/active/nurture-institution-mode/
  roadmap.md
  00-overview.md
  01-plan.md
  02-architecture.md
  03-implementation-notes.md
  04-verification.md
  05-pitfalls.md
  06-ib-nurture-schema-spec.md
  07-ib-decision-convergence.md
  08-iia-schema-policy-test-design.md
```

当前阶段进入 IIA design-only；未改 live manifest、源码或数据库 schema。
