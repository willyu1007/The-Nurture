# Overview — Institution Ecology（机构生态）

## Status

- State: in-progress
- **Phase:** IA/IA.1（已完成）/ IB schema SPEC（已锁定）/ IIA-0 contract preflight（已锁定）/ G0（complete）/ N1 explicit-empty core（complete）/ X4/N2 development activation（complete）/ X5 joint acceptance（complete）/ Pilot-0 readiness（authorized, in-progress）
- **Milestone:** M-002 Institution ecology / Feature F-002 Institution ecology（小孩成长外部环境与组织化照护生态）
- **Updated:** 2026-07-18
- **Owner:** willyu1007
- **Next step:** Continue Pilot-0-C2f-5 result, recovery, surfaces, and Handoff after C-2f-4-3 locked the future cross-workspace protocol boundary. Pilot cross-workspace use remains `NO-GO`; any later v1 is a versioned, same-My-Chat-adult, Guardian-initiated and target-reconfirmed copy into fresh target-local Child/Process/Family/Guardian identities, never identity federation or authority transfer. The only initial data allowlist is Guardian-confirmed child `displayName` plus separately selected optional `birthDate`; StageEpisode/history, Institution relationships, protected work, media/health, contacts, raw ids, and technical state are excluded. A seven-day target-bound opaque Intent and five-minute final confirmation must owner-reread both scopes; Nurture owns future business snapshot/consumption/idempotency while My-Chat owns account authentication and refs-only delivery. Pending revoke/expiry/redaction fails closed, exact replay creates one target result, and a consumed import cannot be remotely deleted from the source. Existing target profiles are neither matched nor merged. C-2f-5 retains exact result/notification/Handoff semantics. Operational IIB, topology/operations, and final Go/No-Go remain open. Pilot-1 through Pilot-4, database apply, ACR publication, secret configuration, capability activation, external traffic, staging, production, and GA remain closed until separate approval.

## Current Cross-Repo Contract Baseline

- My-Workflow-Base merged revision: `acba4e792c85131c19e63e08a5f671133c481c57`.
- My-Chat X1 adoption revision: `2c783675de896b93cf1157b7d1c7ae9e3051150e`.
- My-Chat X3 delivery revision: `4d40d81cceaa5eee84134729900cc3f5c2e15547` (`packages/workflow-contracts` remains byte-identical to the X1 revision).
- My-Chat X4-B runtime implementation revision: `a9685d538ddc320df2dd4ee68a0a65e004f446a0`.
- My-Chat X4-B final delivery and exact dependency revision: `26f57be9aaee9d20be1a6d83db28f37b8e7fe466`; its `packages/` tree is byte-identical to the implementation revision.
- My-Chat X4-C2/N2 development-activation revision: `d47929d12e1a3368a99fa24757732988e5072e1e`.
- My-Chat X5 implementation revision: `0ad5b5753332d5f547968e98735c02bd55476121`; merged through PR #3, advanced by the dependency-security repair in PR #4, and finalized by the CI delivery-gate layering repair in PR #5 at pinned main revision `a1b5e64c84c9865e34abb7068be10352cf42c949`. Neither delivery repair changes workflow-contract content.
- Nurture X4-C1 live-handler implementation revision: `2398d98d8860e5f90e6c365e652f40043ce8d82d`.
- Base/My-Chat logical workflow-contract source hash: `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- Current activation posture: the canonical vNext manifest and explicit activation factory are available only to the reviewed development composition. The default/static module and Nurture dev host remain pre-activation; My-Chat staging and production gates remain false.
- Final X5 scenario source pin: `e976c235962c827367d1c13dcc603a0d315fdac118daf03f00a3df85e153d193` over 25 activation-critical host, manifest, handler/source/policy/command/transaction/module, owner-read, and Nurture repository files. X5 expanded the population after the joint test exposed an unpinned handoff-normalization seam and now requires at least one telemetry sink in the activation-only composition. Base/My-Chat contract content remains unchanged and the exact My-Chat X5 revision is pinned above.

## Goal

把 The Nurture 从"纯家庭工作流"扩成**围绕小孩养育过程的多角色托育生态**。Nurture 的基本单位不是家庭，也不是班级，而是
`NurtureChildCareProcess`：家长（可多个）加入某个小孩的养育过程，老师/看护者把某个小孩的养育过程并入自己的班级日常工作流，
机构管理者治理这些过程如何被组织化执行。

机构生态可以提供小孩在外部环境中的日常照顾数据，也可以在受控边界下接收家长诉求，从而帮助老师更好地照顾小孩。
要让这套生态跑起来，产品必须同时服务机构和老师：帮助机构把教育/照护理念传达到执行层，
把照片、记录、活动、观察等数字资产沉淀并重新组织，并通过工作流管线提升运营质量、复盘能力和 AI 精确辅助。
`ChildLinkGrant` 是家庭生态与机构生态之间的数据流动机制，不是机构生态本身。

技术实现上，My-Chat 统一承载成人用户账号、场景入口、mobile/web shell、通知、deep link 和共享 runtime；Nurture 拥有托育生态图谱和业务事实：
participant、role assignment、family、child、child care process、institution、care group、enrollment、grant、家园沟通、照护记录和媒体归属。
Nurture 不拥有 My-Chat account/auth 语义，但拥有场景下的业务身份、角色关系和数据处理。

Schema 作用域上，`NurtureChildCareProcess` 是独立 child scope。所有作用于具体孩子的照护事实都必须带 `childCareProcessId`；老师、家长、机构和班级视角只是按 `careGroupId`、`familyId`、`participantId`、`enrollmentId` 等维度对 child scopes 进行再组织。

## Scope In（MUST）

- Nurture-owned care ecology graph：`NurtureParticipant`、`NurtureChild`、`NurtureChildCareProcess`、`NurtureCareRoleAssignment`、`NurtureFamily`、`NurtureCareInstitution`、`NurtureCareGroup`、`NurtureEnrollment`、`NurtureChildLinkGrant`。
- Child-scope-first schema：所有 child-specific care facts、消息、事项、日志、授权、receipt、媒体归属都必须解析到 `childCareProcessId`；care group / institution 只作为组织和查询维度。
- 家园沟通 canonical：`NurtureFamilyCareThread`、`NurtureFamilyCareMessage`、`NurtureFamilyCareItem`。
- My-Chat account/shell integration：`my_chat_user_id` 映射、mobile/web shell、notification、deep link、共享 workflow runtime。
- 首批机构侧 capability：`class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution`；teacher mobile 是 surface composition，不是业务 capability；`cohort_care_plan`、`developmental_observation` 可后置。
- `family_to_org` 最小闭环：家长在单个小孩私密会话中的输入被结构化为班级 inbox 事项；老师通过统一工作流处理，Nurture 再把回执、澄清、确认答复和照护结果分发回该小孩家庭时间线。
- `ChildLinkGrant`（Nurture-owned）：围绕 `child_care_process` / `enrollment` 控制 data class × direction 的显式流动、撤销和 receipt。

## Scope Out / Non-Goals（OUT）

- 不做机构排名、跨组儿童排名、对外竞争性看护者绩效评分（撞产品契约 Anti-Metrics）。
- 不做帮机构扩市场的 marketplace / 竞价 / 撮合交易。
- 不让 The Nurture 拥有 My-Chat account/auth/session；Nurture 只引用 My-Chat user。
- 不把 Nurture 托育业务对象写成 My-Chat canonical account/role 语义。
- 不做看护者对家庭私域画像的环境式直读（跨域只走 grant-gated handoff）。
- 不把 My-Chat mobile/chat shell 当成 Nurture 家园沟通事实源；家庭输入、workflow 状态、确认答复、结果和家庭侧 canonical message 都归 Nurture。
- 不在 Nurture care ecology schema/contract 就绪前接 live manifest（IIA 才接线，避免破坏 conformance）。
- 不改医疗安全红线（看护者仅运营性照护，非诊断/处方/急救替代）。

## 依赖与门禁

- **当前门禁**：My-Chat 必须提供 account identity、scenario shell、mobile/web render、notification/deep link 和 runtime contract；Nurture 必须提供 care ecology canonical schema 与 resolver contract。
- 机构生态在设计（IA/IA.1）之后不能越过 IB 推进；IB 先做 Nurture-owned 数据模型和 My-Chat shell integration contract。
- 家庭生态（M-001）仍应先验证核心价值，但家长/老师/机构管理者都作为 My-Chat 用户进入 Nurture 场景；小孩不是 My-Chat 用户。

## 当前讨论议程

1. Review IB schema SPEC：`06-ib-nurture-schema-spec.md` 中的 `child_care_process`、participant/role、family、institution、care group、enrollment、grant、thread/message/item。
2. Review IB decision convergence：`07-ib-decision-convergence.md` 中的 child scope baseline、participant identity / surface role resolution、family cardinality、attention projection、grant revoke retention、classification vocabulary、message protection、My-Chat shell envelope。
3. `class_family_inbox` 的 MVP：十个小孩私密线程如何聚合成一个班级老师 inbox。
4. `family_to_org` data classes：`care_day_note`、`care_constraint_update`、`family_care_question`、`family_follow_up_request` 的字段、有效期和处理状态。
5. `ChildLinkGrant` 的 MVP 默认范围、receipt、撤销和保留语义。
6. My-Chat shell integration：mobile/web 如何即时渲染 Nurture-owned thread/item，notification/deep link 只保存哪些 opaque delivery bookkeeping。
7. 首批 capability 是否锁定为 `class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution`。

## 关键链接

- 架构/边界/数据/桥/分阶段：`02-architecture.md`
- IB schema SPEC：`06-ib-nurture-schema-spec.md`
- IB decision convergence：`07-ib-decision-convergence.md`
- IIA schema/policy/test design：`08-iia-schema-policy-test-design.md`
- Pilot-0 readiness review：`09-pilot-readiness.md`
- 阶段计划与退出标准：`01-plan.md`
- 里程碑视图：`roadmap.md`
- 立场基准：`docs/context/product/workflow-product-design-contract.md`（Standing Boundary / Anti-Metrics）
- 家庭模式 MVP：`dev-docs/active/nurture-mvp/`
- My-Chat 教育域参考范式：`/Volumes/DataDisk/Project/My-Chat/prisma/schema.prisma`
- 实现/讨论记录：`03-implementation-notes.md`
- 验证记录：`04-verification.md`
- 踩坑记录：`05-pitfalls.md`
