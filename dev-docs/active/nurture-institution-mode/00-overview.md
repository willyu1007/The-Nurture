# Overview — Institution Ecology（机构生态）

## Status

- State: in-progress
- **Phase:** IA/IA.1（已完成）/ IB schema SPEC（已锁定）/ IIA-0 contract preflight（已锁定）/ G0（complete）/ N1 explicit-empty core（complete）/ X4/N2 development activation（complete）/ X5 consumer requalification（native CI clean）/ Wave 4 P2 binding-anchor source candidate（complete, default-deny）/ Pilot-0 readiness（authorized, in-progress）
- **Milestone:** M-002 Institution ecology / Feature F-002 Institution ecology（小孩成长外部环境与组织化照护生态）
- **Updated:** 2026-07-28
- **Owner:** willyu1007
- **Next step:** Return the completed Wave 4 P2 source revision and native CI run `30366195095` to My-Chat/T-030, then resume C30-I0-C scoped T-002/T-003/cloud-deployment separation and C30-I0-D immutable baseline proof. The additive migration remains unapplied outside disposable CI and every consumer remains default-disabled. C30-I1, C31, C4, D implementation, Pilot-0-E, Pilot-1, any persistent database apply, artifact publication, capability activation, and external traffic remain NO-GO.

## Current Cross-Repo Contract Baseline

- My-Workflow-Base ecosystem-policy, workflow-contract, and public
  web-workbench publishing revision:
  `63d47d2ebc6f5062181b721a25182710f7974b17`.
- My-Chat/T-030 accepted coordination baseline:
  `33264981515d75dd9768b720a1d1127cba70cbbe`; N3 dependency revision:
  `53bf92b5c2d2c1d2e7835e34b1ac50337d64f336`.
- Wave 4 P2 consumes the narrower host-binding contract candidate
  `64f4165fe571a46ded094ebf6f771bdea61383d1`. Its owner-verifier input includes
  exact Workspace, acting User, Actor, represented Organization when present,
  idempotency key, typed subject, owner ref/version, purpose, and trace
  context; the returned receipt is Workspace-bound. This pin does not replace
  the broader C30/C35 qualification DAG. The 31-file P2-extended Nurture source
  population is pinned at
  `2a6cd497de67deb34c4650ca47f9f6a26ecc0f0376f1f2ceac53a37f17333d75`.
- On 2026-07-28, T-002 accepted the repo-qualified My-Chat/T-030 scope
  `X-2`, `RB-2`, `RB-3(a)`, `RB-6`, `DB-4(b)`, `ST-2`, `ST-4(c)`, and
  `ST-6(b)`.
- The N3 dependency/source-boundary repair is complete for the T-002 consumer
  leg. The coordinator-owned four-repository qualification run `30343562287`
  passed against exact Base `ed69bbd`, My-Chat `53bf92b`, Education `d44286b`,
  and Nurture `edd7cef`. That exact run remains historical evidence; the
  owner-approved public publishing SSOT repair advances Base and Nurture pins
  and therefore requires a renewed exact qualification run.
  Nurture consumes published
  `@willyu1007/web-workbench@0.7.0`, imports My-Chat only through public
  package exports, pins Base at `63d47d2ebc6f5062181b721a25182710f7974b17`
  and My-Chat at `53bf92b5c2d2c1d2e7835e34b1ac50337d64f336`,
  verifies their byte-identical workflow-contract source at
  `8dd53be4ba392c6eb254c462066d9c7e65b239bc79142911de4ef58faf3da34d`,
  verifies the public Base web-workbench source set as
  `43bb51e21f900067582fd059f79b1cc4bbfd8120ca26f4d7eb586c09bb51509d`,
  verifies the bounded My-Chat X5 source set as
  `78a20458a5f4504ecd0e6f1520b782fa07db826106e03791bc12dd53b7b5ba73`,
  verifies the 25-file Nurture scenario source set as
  `622b74397f470dce81976d9c69dc5d59c3d3f295295d1eec6b38398f6d262ecf`,
  and has zero strict Base consumer-boundary findings. The exact-checkout
  package overrides are verification materialization, not a mutable release
  dependency.
- The repin exposed a real source incompatibility hidden by the previous
  revision/hash-only check: Nurture still compiled against removed
  `DomainContextRef` and legacy `{ kind, id }` references. All live scenario,
  repository, backend, test, replay-seed, and persisted-ref paths now use
  `CanonicalRef { schema_version, namespace, object_type, object_id, version? }`.
  Migration `20260728160000_nurture_canonical_ref_v1` converts durable legacy
  refs and replaces the X4 driver CHECK with the canonical
  `my_chat/workflow_step` constraint.
- The Fastify-to-NestJS transition, port migration, API-index repair, and
  governance cleanup remain open. The current native-cloud CI repair changes
  no schema, migration, default-off activation, environment, provider,
  staging/production state, or traffic.
- My-Workflow-Base merged revision: `acba4e792c85131c19e63e08a5f671133c481c57`.
- My-Chat X1 adoption revision: `2c783675de896b93cf1157b7d1c7ae9e3051150e`.
- My-Chat X3 delivery revision: `4d40d81cceaa5eee84134729900cc3f5c2e15547` (`packages/workflow-contracts` remains byte-identical to the X1 revision).
- My-Chat X4-B runtime implementation revision: `a9685d538ddc320df2dd4ee68a0a65e004f446a0`.
- My-Chat X4-B final delivery and exact dependency revision: `26f57be9aaee9d20be1a6d83db28f37b8e7fe466`; its `packages/` tree is byte-identical to the implementation revision.
- My-Chat X4-C2/N2 development-activation revision: `d47929d12e1a3368a99fa24757732988e5072e1e`.
- My-Chat X5 implementation revision: `0ad5b5753332d5f547968e98735c02bd55476121`; merged through PR #3, advanced by the dependency-security repair in PR #4, and finalized by the CI delivery-gate layering repair in PR #5 at pinned main revision `a1b5e64c84c9865e34abb7068be10352cf42c949`. Neither delivery repair changes workflow-contract content.
- Nurture X4-C1 live-handler implementation revision: `2398d98d8860e5f90e6c365e652f40043ce8d82d`.
- Base/My-Chat logical workflow-contract source hash: `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- The current path-content and logical-source hashes predate C-3 identity binding, trusted ingress, subject presentation, domain-action execution, protected interaction, Notification continuity, and activation/qualification governance. They remain historical handoff evidence only. Future C-3 implementation MUST add separately named `platform_child_family_identity_source_v1`, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, `scenario_protected_interaction_source_v1`, `scenario_notification_continuity_source_v1`, and `scenario_activation_admission_source_v1` adoption source sets. The identity source separately binds completed My-Chat owner schema/migrations/runtime/APIs, Nurture typed anchors/workspace associations, and joint recovery/revoke/merge/privacy conformance. Every Scenario, Host, storage, relationship, delivery, admission, evidence, and qualification identity remains independently pinned.
- Future C-4 adoption likewise MUST independently hash the locked thirteen-set registry: `scenario_extension_composition_source_v1`, `scenario_identity_invitation_coordination_source_v1`, `nurture_institution_domain_source_v1`, `nurture_institution_schema_source_v1`, `nurture_institution_manifest_source_v1`, `my_chat_institution_surface_source_v1`, `my_chat_identity_invitation_runtime_source_v1`, `my_chat_institution_workflow_runtime_source_v1`, `user_attention_binding_source_v1`, `guardian_relationship_attention_binding_source_v1`, `family_care_status_attention_binding_source_v1`, `c4_evidence_authority_source_v1`, and `c4_qualification_authority_source_v1`, plus exact public C-3 dependencies. These are design targets only; no source set currently exists or is adopted.
- Current activation posture: the canonical vNext manifest and explicit activation factory are available only to the reviewed development composition. The default/static module and Nurture dev host remain pre-activation; My-Chat staging and production gates remain false.
- Historical X5 scenario source pin: `e976c235962c827367d1c13dcc603a0d315fdac118daf03f00a3df85e153d193`. The same 25-file population now hashes to `e92582d9b710e62f087d92549e1e473a9a22d64b9ad0d058eb010c8c46a67d35` because its registered Nurture context contract incorporates the locked identity boundary, opaque binding chain, My-Chat owner API minimum contract, and exact private owner-evidence carrier allowlist; no product source in the population changed. Base/My-Chat workflow-contract content remains unchanged, and the My-Chat revision remains pinned to `a1b5e64c84c9865e34abb7068be10352cf42c949`, not live schema-only `db22de6`.

## Goal

把 The Nurture 从"纯家庭工作流"扩成**围绕小孩养育过程的多角色托育生态**。Nurture 的基本单位不是家庭，也不是班级，而是
`NurtureChildCareProcess`：家长（可多个）加入某个小孩的养育过程，老师/看护者把某个小孩的养育过程并入自己的班级日常工作流，
机构管理者治理这些过程如何被组织化执行。

机构生态可以提供小孩在外部环境中的日常照顾数据，也可以在受控边界下接收家长诉求，从而帮助老师更好地照顾小孩。
要让这套生态跑起来，产品必须同时服务机构和老师：帮助机构把教育/照护理念传达到执行层，
把照片、记录、活动、观察等数字资产沉淀并重新组织，并通过工作流管线提升运营质量、复盘能力和 AI 精确辅助。
`ChildLinkGrant` 是家庭生态与机构生态之间的数据流动机制，不是机构生态本身。

技术实现上，My-Chat 统一承载成人用户账号、受保护的平台 Child/Family identity 及 stewardship/membership/scenario binding、场景入口、mobile/web shell、通知、deep link 和共享 runtime；Nurture 通过无 PII/无权限的 typed anchor 与 workspace association 连接这些平台 identity，并拥有托育生态图谱和业务事实：
participant、role assignment、family、child、child care process、institution、care group、enrollment、grant、家园沟通、照护记录和媒体归属。
Nurture 不拥有 My-Chat account/auth 语义，但拥有场景下的业务身份、角色关系和数据处理。

Schema 作用域上，`NurtureChildCareProcess` 是独立 child scope。所有作用于具体孩子的照护事实都必须带 `childCareProcessId`；老师、家长、机构和班级视角只是按 `careGroupId`、`familyId`、`participantId`、`enrollmentId` 等维度对 child scopes 进行再组织。

## Scope In（MUST）

- Nurture-owned care ecology graph：`NurtureParticipant`、`NurtureChild`、`NurtureChildCareProcess`、`NurtureCareRoleAssignment`、`NurtureFamily`、`NurtureCareInstitution`、`NurtureCareGroup`、`NurtureEnrollment`、`NurtureChildLinkGrant`。
- Platform/local identity boundary：My-Chat owns protected Child/Family identity and binding lifecycle；Nurture owns typed body-free anchors and exact workspace-local associations；binding/anchor never becomes business authority。
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

1. C-3/C-4 的晚到身份边界漂移已采用 typed Child/Family anchor + exact workspace association 单轨修复；旧 direct local binding、Institution provisional profile、copy-and-reconfirm 与“无平台 Child”口径已撤回。
2. 修复后的产品、domain/security/privacy 与跨仓治理终审均已达到 `DR-P0=0 / DR-P1=0 / DR-P2=0`；流量门禁另记为 `TR-P0/TR-P1`，C-4/Pilot-0-C 现为 `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO`。
3. C40 只能在 completed/qualified `platform_child_family_identity_source_v1` 已进入当前 C-3 component 后开始；`db22de6` 不满足该门禁，既有 workflow pin 不做伪升级。
4. Pilot-0-D 的产品/运营、发布治理、安全/可靠性三路独立评估与累计复审均已闭环；D-0..D-7 为 `DR-P0=0 / DR-P1=0 / DR-P2=0`。
5. C-3/C4/D implementation、candidate assembly、Pilot-0-E、Pilot-1..4、DB apply、artifact/ACR、secret、capability/allowlist 和 external traffic 均保持关闭；D 设计锁定不产生运行效果。

## 关键链接

- 架构/边界/数据/桥/分阶段：`02-architecture.md`
- IB schema SPEC：`06-ib-nurture-schema-spec.md`
- IB decision convergence：`07-ib-decision-convergence.md`
- IIA schema/policy/test design：`08-iia-schema-policy-test-design.md`
- Pilot-0-C 当前决策索引：`10-pilot0-c-current-decision-index.md`
- Pilot-0-D 拓扑/运营合同：`11-pilot0-d-topology-operations-contract.md`
- Pilot-0 readiness 详细决策账本：`09-pilot-readiness.md`
- 阶段计划与退出标准：`01-plan.md`
- 里程碑视图：`roadmap.md`
- 立场基准：`docs/context/product/workflow-product-design-contract.md`（Standing Boundary / Anti-Metrics）
- 家庭模式 MVP：`dev-docs/active/nurture-mvp/`
- My-Chat 教育域参考范式：`/Volumes/DataDisk/Project/My-Chat/prisma/schema.prisma`
- 实现/讨论记录：`03-implementation-notes.md`
- 验证记录：`04-verification.md`
- 踩坑记录：`05-pitfalls.md`
