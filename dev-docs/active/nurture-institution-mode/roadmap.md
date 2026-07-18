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
| Role / surface entitlement | Guardian 使用 Nurture Chat、家庭看板、家庭网页工作台；caregiver 使用 Nurture Chat、老师看板；institution admin 使用机构看板、机构网页工作台，不通过 Chat 使用 Nurture 机构能力；technical operator 仅使用技术 Admin。所有 surface 仍由 Nurture 解析 role/scope/output。 |
| Guardian action availability | Chat 是通用 AI/interaction 面板；家庭看板负责 current/recent，家庭工作台负责 complete authorized history。提交问题、grant confirm/replacement、revoke、author redaction 三端可达并收敛到 Nurture commands；revoke 不得 web-only。 |
| Caregiver action availability | Chat 与老师看板都能完成 acknowledge/reply；Chat 通过 opaque ref 临时 owner-read 受保护正文且不写入 Chat history；老师看板承担完整授权历史；禁止直接家庭 Chat、批量操作和多 caregiver handoff。 |
| Institution action availability | 机构看板只做安全聚合、告警和导航；机构网页工作台执行强确认的 Nurture 拓扑/配置命令。机构管理员不能代替 Guardian 建立/撤销授权，不能读取家庭正文、执行 caregiver 动作、操作 My-Chat 技术运行时、硬删除事实或进行排名。 |
| Action-key layering | `(scenario_key, action_key)` 是跨 surface 稳定产品意图；`command_key` 是不可变 Nurture Execution 合同；`entrypoint_key`/`handler_key` 分别属于 Workflow 启动和实现绑定；Host Admin action 独立。现有 Run-level `scenario_actions` 不得重解释为领域对象动作。 |
| Technical-operator permissions | 指定的内部平台运维账号仅在精确 Pilot workspace 内读取安全技术证据、reconcile 原 outcome-unknown Step、`replay_failed`/`stop_pending`、请求 owner reevaluation，并按 runbook 只关闭不重启 Pilot。普通 workspace/institution admin 不继承；技术操作员不能直接执行 Nurture 业务命令或编辑状态。 |
| Exact domain-action mapping | Guardian enrollment confirmation、grant confirm/replacement/revoke 分命令；Institution topology 使用显式 create/update/suspend/resume/close keys，不用 upsert/change-state；邀请由 `my_chat.workspace_invitation.create` 与 `nurture.institution.bind_accepted_participant` 跨 owner 接力；Pilot 业务停用复用 care-group suspend/resume。 |
| Domain-action availability/adoption | 使用闭集 safe reason codes 与独立 `explicit`/`strong_authorization` confirmation；Base additive `domain_action_contracts`，声明缺 handler/非法 target-surface-confirmation fatal；Base → My-Chat → Nurture 顺序采用，legacy 保持兼容且 capability 默认关闭。 |
| Cross-surface transition | 当前 entitled surface 能闭环就不强制跳转；复杂 Guardian 历史/授权进入 family workbench，Caregiver 完整工作进入 teacher board，Institution 写意图从只读 board 进入 institution workbench。跳转仅带 generic route class + opaque Nurture continuation，目标端 owner reread，禁止隐式执行动作。 |
| Opaque token protocol | Pilot 仅支持 `clarify`/`submit_action`/`open_notification`，绑定 workspace/participant/purpose/consumer surface；Chat clarification 另绑 conversation hash。TTL 为 5m/5m/7d；clarify 一次消费，submit 与 Execution/业务效果同事务并支持精确 replay，notification open 可重复只读且每次 owner reread；旧 token 不延期或复活。 |
| Notification/deep-link stale handling | Provider/deep link 只带 recipient-bound My-Chat `notification_id` + generic safe copy/route；认证与 exact recipient/workspace 校验后，My-Chat reread Handoff，Nurture open resolver 当前校验并现场签发目标 token。Delivery/open resolver 分离，create/send/open 三时点 reread；Host read 不等于 Nurture read/ack，stale/revoke/redaction/owner outage 只返回当前安全结果。 |
| Draft/result/history continuity | 未提交 text/form/AI draft 只属于 actor + 当前 surface，离开需显式 stay/discard，不跨 surface/device/guardian。Committed result 由 refs-only Execution replay + owner reread 保证，history 在 role-correct destination 当前查询；跳转只带 route class + `current|recent|history`，不得复用 Chat transcript、PublicDraft 或 artifact draft。B3-2 complete。 |
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
| D8 | IIA implementation entry | **X4-A / X4-B / X4-C1 COMPLETE:** claimed-Step replay seeds, My-Chat bridge, and the Nurture handler foundation pass unit and dual-DB regression; exact My-Chat pin is `26f57be`; the handler remains unadvertised and default runtime remains explicit-empty | Separately review and approve X4-C2 manifest, source-adapter, owner-consumer, and development-capability activation |
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
| X5 | All three | Contract drift、crash/race/privacy journeys and pilot-readiness recommendation | X4/N2 | No enablement; unlock a separately authorized Pilot-0 only after PASS |
| Pilot-0 | The-Nurture governance + cross-repo review | Pilot-0-A/B complete; Pilot-0-C C-2 is complete and C-3-0a now locks the account-to-subject reachability spine for an education/nurture product catalog: scenario-owned relationship resolution, generic subject scope, opaque Host discovery, no duplicate Child SSOT, and no implicit identity federation; C-3-0b next | X5 | Readiness only; external traffic NO-GO; no DB, artifact publication, secret, capability, or traffic change |
| Pilot-1..4 | Cross-repo delivery and operations | Isolated environment, allowlisted enablement, recovery rehearsal, bounded observation | Pilot-0 accepted + separate approval | Pilot allowlist only; staging/production/GA remain separately gated |

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
  09-pilot-readiness.md
```

当前阶段为 Pilot-0 readiness：X5、Pilot-0-A/B 和 Pilot-0-C2 已完成。C-3-0a 将 My-Chat 的正式用户业务目录收敛为教育/养育，同时保持 Chat、Workflow、Notification、Forum/Knowledge 等平台能力 subject-neutral。每个 activated business scenario 必须从已认证账号通过 owner-resolved relationship path 得到 `unresolved|single_subject|subject_collection`；Nurture 的实际路径由 Participant、RoleAssignment、Family、CareGroup、Enrollment 和 ChildCareProcess 组成。My-Chat 只聚合 workspace/scenario-bound opaque subject entries，不拥有 Child/relationship SSOT，不把 prospective invitation 当权限，也不推断跨 workspace/scenario 身份。C-3-0b authenticated ingress/trusted principal、后续 Guardian/Caregiver IIB、C-4 Institution IIB、topology/operations 和 Go/No-Go 仍待锁定。Pilot-1..4、live traffic、数据库 apply、ACR 发布、secret 配置、capability activation、staging、production 和 GA 均未授权。
