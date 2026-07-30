# T-002 Fact/Schema → T-005 Gap Inventory

## Purpose and Evidence Boundary

本文件把 T-002 已存在的事实、Prisma SSOT 和当前 source behavior 与 T-005
产品契约逐项对齐。它是 T-005 的实施输入，不是 schema migration，也不把 T-002
历史设计目标误报为已实现能力。

事实优先级：

1. `prisma/schema.prisma`：当前数据库 SSOT。
2. `packages/nurture-scenario/src/domain/institution/family-care-*.ts` 与
   `packages/nurture-db/src/repositories/family-care-*.ts`：当前命令、查询和事务行为。
3. `packages/nurture-scenario/scenario.manifest.yaml`、
   `packages/nurture-scenario/src/module.ts` 和 API context：当前可注册/可调用边界。
4. T-002 `06-ib-nurture-schema-spec.md`：设计和历史决策证据；其中标记为
   implementation-open 或已被 T-005 supersede 的内容不是 landed schema/source。

盘点基线为 2026-07-29 `main`。状态含义：

- `REUSE`：当前事实和语义可直接作为 T-005 基础。
- `EXTEND`：当前对象可保留，但必须增加字段、约束、端口或结果语义。
- `REPLACE_SEMANTICS`：历史字段可迁移保留，T-005 新路径不得继续依赖其旧含义。
- `ADD`：当前 SSOT/source 不存在，需要新增。
- `HOST_GATED`：Nurture 可定义接口，但完整交付依赖 My-Chat owner/runtime。
- `ACTIVATION_NO_GO`：可以做 synthetic contract work，但不能据此启用真实流量。

## Executive Conclusion

T-002 已提供可复用的正确性骨架：Enrollment/CareGroup/Grant、Message、CareItem、
ItemEvent、Receipt、Attention、InteractionContext、CommandExecution，以及同一
Prisma transaction 内的 effect + receipt + execution。它还已有 exact replay、
source redaction、Grant revoke 和 caregiver inbox/attention owner-read 的实现。

T-005 不是重建这套骨架。主要差距集中在四处：

1. 当前没有 T-004/T-005 定义的公开 Capability Harness 或六-surface contract。
2. CareItem 仍是单一 status、个人字段和单 reply slot，不能表达班级共同承接和多回复。
3. 当前命令 DTO 接受 raw ids、分类、Grant/route 派生字段，并使用 whole-Item
   version；不满足 typed business input、owner-issued target 和 capability-specific
   precondition。
4. correction、family request withdrawal、typed committed result、context continuation
   与完整 ActionDelivery invalidation 尚未落地。
5. T-006 已要求一个 dedicated caregiver-initiated direct-interaction capability，
   但 T-005 当前 registry 只有 family-to-org question 与对既有 Item 的 reply；普通
   question 还会拒绝健康/用药/紧急输入，不能作为反向或降级路径。

此外，legacy single status、personal assignment、single reply slot 与新三轴模型之间
尚无明确 single-writer cutover。G2 实现前必须冻结“新 row 只由 Harness 写、旧 consumer
只读单向派生、歧义旧行 quarantine”的规则，禁止 dual-write。

因此 T-005 应在既有事务/幂等内核上增量迁移，不 fork 一个新的聊天或工作流 runtime。

## Fact and Runtime Gap Matrix

| Area | T-002 current fact/schema/source | T-005 target | Status | Required implementation consequence |
| --- | --- | --- | --- | --- |
| Enrollment / CareGroup | `NurtureEnrollment` 精确绑定 Institution + CareGroup；Item 有 `enrollmentId` / `careGroupId` | 工作责任固定到提交时的精确 Enrollment + CareGroup | `REUSE` | 保留对象；新 action 必须直接 reread exact original scope，不接受 raw client ids |
| Grant | `NurtureChildLinkGrant` 支持 direction、data class、purpose、lifecycle 和 original `grantId` | 所有跨边界读写绑定 original Grant；新 Grant 不复活旧 Item | `EXTEND` | 当前 reply 会另找任意 current org-to-family Grant；改为校验 Item 固定的同一 original Grant 同时允许所需方向 |
| Receipt | `NurtureChildLinkReceipt` 已区分逻辑 delivered/read/acknowledged 与设备投递，并支持 revoke/redaction terminalization | 每个 effect 有稳定逻辑 Receipt；ActionDelivery 独立 | `REUSE` | 保留 Receipt；命名中明确 `sourceReceiptRef` / `replyReceiptRef`，不得把 provider 状态写回 |
| Thread | Thread/participant/last-read 已存在；当前 query/command 把 active membership 作为 allow 条件 | Thread 仅是 Enrollment-private 路由/历史容器，不是共享房间或 authority | `REPLACE_SEMANTICS` | 新 owner policy 不得用 ThreadParticipant 授权；可保留其索引/显示用途，migration 不把 membership 变成产品 room |
| Message | Message 已有 exact sender、role audit、kind、Grant、protected scaffold、sent/redacted/failed 和 tombstone 字段 | source/reply 都是 canonical Message；exact author、correction chain、redaction | `EXTEND` | 增加 direct original Enrollment/CareGroup/direction trace 或强约束关系；author authority 以 sender Participant + current same-side relationship 判定，不要求历史 role row 仍 current |
| Protected body | 当前命令接收 caller-supplied `protected_content_ref`；Message 使用 `bodyProtectionPayload` scaffold；实际 encrypted protected-content aggregate 未落地 | public logical input 是 1–2000 字符 protected plain text；prepare 不持久化正文，execute 原子加密提交 | `ADD` | 增加 no-store protected ingress/content write port 与 encrypted persistence；client/LLM 不得提交 internal content ref；InteractionContext 只存 keyed input integrity tag |
| CareItem status | 单 enum `open|acknowledged|waiting_for_family|replied|...` | acknowledgement、response、lifecycle 三个正交轴 | `REPLACE_SEMANTICS` | 增加三轴字段和 lifecycle reason/head；旧 `status` 只作 migration/legacy compatibility，T-005 command/presenter 不依赖旧 terminal `replied` |
| Personal assignment | Item 有 `assignedToRoleAssignmentId`、`ackedByParticipantId`；T-002 历史设计曾把 acknowledge 当 claim | exact CareGroup 共同承接；ack actor 仅审计 | `REPLACE_SEMANTICS` | 新路径不写 assignment；补 typed `ackedByRoleAssignmentId`/event actor relation；旧 assignment 字段只读迁移，不授予 reply |
| Reply identity | caregiver reply 是 `NurtureFamilyCareMessage(messageKind=caregiver_reply)` + ItemEvent + Receipt；Item 只有 `linkedReplyMessageId` | 同一 Item 有 append-only reply collection | `EXTEND` | 不新增重复 canonical `CareReply` 表；以 reply Message 为 canonical reply，`CareReplyV1` 仅为 typed projection；废弃 single-slot authority |
| Reply ordering | Message/Event 有 `createdAt` 和 UUID，无 per-Item numeric sequence | 并发回复稳定排序，replay 返回同一顺序键 | `EXTEND` | 使用 immutable server-issued `replyOrderKey`（至少绑定 DB commit time + Message id）并持久化/可重建；不得用 mutable reply counter 做事实源 |
| Acknowledge concurrency | source 先 exact Item version，再判断 already satisfied；并发旧 version 会 conflict | 第二个合法 ack 收敛为 `already_satisfied`，不伪造 actor | `REPLACE_SEMANTICS` | ack precondition 增加 declared postcondition convergence：仅 acknowledgement 头变为 acknowledged 时返回已有 event/receipt；其他 lifecycle/authority 漂移仍 stale/denied |
| Reply concurrency | whole Item version CAS，写 `status=replied`，只允许首条 reply | append-compatible；其他合法 reply 不使 confirmation stale | `REPLACE_SEMANTICS` | repository 锁定 append guard/lifecycle heads，插入独立 Message/Event/Receipt；只对首次 response transition/Attention resolve 做一次条件更新 |
| Caregiver eligibility | 当前 source 允许 caregiver、lead_caregiver、institution_admin，且接受 Institution/Enrollment scope | 仅 exact CareGroup 的 current operational caregiver/lead caregiver；Admin label 不等于 caregiver authority | `REPLACE_SEMANTICS` | 新 policy 显式允许 caregiver/lead_caregiver；institution_admin 只有另有 operational caregiver role 时才可执行 |
| Context continuation | 无 typed Item self-reference | 新 family question 可选 body-free `contextContinuationOfItemRef`，只用于展示/总结 | `ADD` | 增加 typed same-workspace Item relation或独立 relation row；不继承 Grant/state/SLA/command identity；owner-read 时不可读则隐藏 |
| Correction | Event enum 有 `corrected`，但没有 Message correction row/head/command/receipt | exact-author append-only correction version，strict correction head | `ADD` | 新增 correction fact/table、head version、protected content、Receipt 和 command；source question responded 后拒绝同 Item correction |
| Withdrawal | 仅有 pending route cancel 和 Grant revoke；没有 post-delivery family Item withdrawal | exact source author 将 Item closed(`family_withdrawn`)，保留 content/Receipt | `ADD` | 新增 Item lifecycle reason + withdrawal event/command；不改变已完成逻辑 Receipt；与 Grant revoke/redaction 分离 |
| Author redaction | 已有 exact sender+historical role、expected Message version、source/reply 不同 cascade | exact Participant author + current same-side reach；empty business input；system redaction 独立 | `EXTEND` | 按 `07-increment-2-change-contract.md` 的 family/CareGroup owner-policy predicate 执行；author action 不接受 client reason；system capability 使用独立 actor/reason；不要求原 author RoleAssignment row仍 active |
| Redaction cascade | source suppresses Item/Attention，reply 本地；Receipt terminalization 已有 | 还需 correction-chain erasure、context invalidation、pending delivery invalidation | `EXTEND` | 加 typed dependency/cascade audit；修复当前 `take:100` 无 loop-to-closure 的部分完成风险；My-Chat pending candidate 由 owner reread 跳过 |
| Attention | source-typed Attention 已存在；reply 会 resolve active rows，source redaction会 suppress | 第一条 reply 只 resolve 一次；后续 reply unchanged；reply redaction不 reopen | `EXTEND` | 增加/约束单一 active source projection、resolution reason/evidence；first-response transition 与 reply commit 同事务 |
| InteractionContext | 有 body-free hashed token、purpose、surface、expiry、consume/revoke/version | 5 分钟 confirmationRef，绑定 capability/target/actor/scope/input integrity/preconditions/stable command identity | `EXTEND` | 复用表概念；增加 typed dependency/confirmation payload contract；可持久化 body-free context，但不创建 prepared business draft 或正文副本 |
| CommandExecution | 已有 stable hash identity、payload hash、businessOutcome、output refs、same-transaction commit 和 exact replay | immutable typed committedResult、recovery/outcome_unknown、role-safe readResult | `EXTEND` | 增加 result schema version + body-free committed result payload/invalidation scopes；separate status/reconcile path；typed Participant actor/provenance仍需落地 |
| Current command input | submit/reply/ack DTO 包含 actor/role/raw object ids、expected version、direction、safe summary、classification/route fields | capability-specific input 只含业务字段；target/heads/authority/command identity是 Harness context | `REPLACE_SEMANTICS` | 保留 legacy specs default-off；新增 versioned T-005 specs/adapters，server resolve all trusted fields，不复用当前 DTO 作为 public schema |
| Query / presenter | 已有 caregiver class inbox/attention safe summary read；没有 guardian timeline、caregiver detail/readResult 或六-surface envelope | role-safe guardian/caregiver projection、pagination、current action availability | `EXTEND` | 新增 capability query/presenter；opaque refs须 owner-issued/short-lived，不能用可猜的 `nurture:item:{id}` 作为产品 ref |
| Capability/API | manifest 只有 legacy Workflow entrypoints 和两个 institution GET；除 legacy capture 外，其余 family-care specs只被 tests直接调用 | T-004 catalog + query/prepare/execute/readResult private API | `ADD` | 在 T-004 pin 后增加 additive domain-action API/registry；不得把 family-care actions塞回 Workflow Run/Step manifest |
| ActionDelivery | submit 有 default-off `workflow_step_complete_v1` user_attention seam；reply/correction 等无完整公开 delivery contract | My-Chat 独立幂等 materialize，send/open 都 owner-reread | `HOST_GATED` | Nurture返回 stable refs/invalidation scopes；My-Chat companion 实现 candidate/notification/deep-link；legacy claimed-Step 不可作为 activation 证据 |
| Safety gate | 当前 family input验证结构和 allowlisted枚举，不读取 protected body做医疗/用药/紧急拒绝 | unsupported/safety-gated input 在任何业务事实前失败 | `ADD` | 增加 protected、no-log、deterministic policy port和明确 alternate-process result；不把正文交给普通 Chat LLM |
| Caregiver direct interaction | 无 dedicated caregiver-initiated protected capability；现有 family question direction/role/safety contract 不匹配 | T-006 `direct_interaction_required` 只导航到独立 exact-target capability，打开 empty protected composer | `ADD` / `HOST_GATED` | Phase 0 冻结 exact key/effect/response/Receipt；T-006 不复制 source body、不自动创建 interaction；能力缺失时安全阻塞 |

## Target Schema Delta

### Reuse without a parallel aggregate

- `NurtureEnrollment`、`NurtureCareGroup`、`NurtureChildLinkGrant`。
- `NurtureChildLinkReceipt`，继续作为 Nurture logical delivery/read/ack fact。
- `NurtureFamilyCareMessage`，同时作为 source question 与 caregiver reply 的 canonical
  content fact。
- `NurtureFamilyCareItemEvent` 和 `NurtureTeacherAttentionItem` 的 append/audit/index
  角色。
- `NurtureInteractionContext` 与 `NurtureCommandExecution` 的事务/幂等概念。

`CareReplyV1` 是由一个 caregiver-reply Message、对应 ItemEvent、Receipt 和 author
audit 组成的 typed projection，不新增第二份 reply canonical store。

### Required Item migration

T-005 新路径至少需要下列正交字段/约束；最终命名由 schema migration 任务冻结：

```text
acknowledgementState: pending | acknowledged
responseState: awaiting_reply | responded
lifecycle: active | closed | suppressed
lifecycleReason?: family_withdrawn | grant_revoked | source_redacted | ...
acknowledgementHead
responseHead
lifecycleHead
contextContinuationOfItemId?
ackedByParticipantId?
ackedByRoleAssignmentId?
```

- `assignedToRoleAssignmentId` 与 `linkedReplyMessageId` 可以为旧行保留，但 T-005
  不读取它们作为 owner、reply authority 或 unique reply slot。
- source Message、Item、Enrollment、CareGroup 和 original Grant 的关系必须可由 FK/
  uniqueness/complete-graph validator 机械证明。
- context continuation 是 body-free typed relation；source 不可读时仅隐藏 projection。
- reply collection 由 Message/Event 事实派生；`replyCount` 不作为 authorization 或
  concurrency head。

### Single-writer cutover

- 新 G2 Item/Message/Receipt/Execution 只由 T-004 exact contract 下的三轴 Harness
  path 写入。
- legacy handler 不写新 rows；legacy `status`、assignment 和 linked-reply 字段不参与
  authority/concurrency/replay。
- 旧 consumer 如需过渡显示，只能从三轴 state、canonical reply Message collection
  和 Receipt 单向派生 read-only compatibility projection；不得回写或双写。
- 旧行 backfill 只接受 mechanically provable mapping。claimant、Grant、reply owner、
  lifecycle 或 old terminal state 有歧义时 inventory/quarantine，不猜测。
- claimed-Step/raw DTO/ThreadParticipant path 继续 default-off，不得作为 G2 evidence
  或 fallback。

### Required additions

- append-only `NurtureFamilyCareMessageCorrection`（或同等单一 correction fact）：
  source Message FK、strict head/version、exact author audit、protected content、createdAt、
  owning CommandExecution 和 Receipt binding。
- typed InteractionContext dependencies，至少覆盖 target Item/Message、Grant、
  Enrollment、policy/lifecycle heads 与 capability/version。
- body-free immutable CommandExecution result payload：
  `resultSchemaVersion`、business outcome、capability output、receipt refs 和
  invalidation scopes。它与 `commandExecutionRef` 共用一份 authority，不再创建冗余
  `resultRef` 表。
- protected content write/erase boundary；正文不进入 InteractionContext、
  CommandExecution payload、Receipt、log、trace 或 body-free presenter。
- bounded cascade audit/loop-to-closure 机制，防止 revoke/redaction 在 100 行截断后
  部分提交。

## Capability and Concurrency Mapping

| Capability | Public business input | Target/precondition | Commit effect |
| --- | --- | --- | --- |
| `submit_family_care_question` | `body`, optional `contextContinuationOfItemRef` | owner-issued target option；current Family/Enrollment/CareGroup/original Grant | source Message + Receipt + active Item + created Event + Attention + Execution |
| `acknowledge_family_care_item` | `{}` | exact acknowledgement head + lifecycle/authority heads；declared acknowledged convergence | one acknowledgement Event; source Receipt acknowledged; no personal assignment |
| `reply_family_care_item` | `body` | append-compatible reply collection + frozen lifecycle/authority heads | reply Message + Event + Receipt；first-only response/Attention transition |
| `correct_family_care_message` | `body` | strict correction head + exact author/current same-side reach；family source must still await reply | correction version + Receipt + update delivery candidate |
| `withdraw_family_care_request` | `{}` | active family-authored Item + exact source author/current family reach | lifecycle closed(`family_withdrawn`) + Event + Attention closure；Receipt unchanged |
| `redact_family_care_message` | `{}` | exact Message/redaction head + exact author/current same-side reach | encrypted content/corrections erased + tombstone + scoped cascade |
| dedicated caregiver direct interaction（exact key 在 Phase 0 冻结） | caregiver-authored protected plain text；不含 raw source/target/Grant | owner-issued exact child/family target；current CareGroup caregiver；org-to-family Grant/data class/purpose/safety heads | canonical effect、family response expectation、Receipt 与 change lifecycle 在 G2-C contract 冻结；不得复用 family-question Item semantics |

`policy_redact_family_care_message` 是单独的 system capability，原因由服务端产生，
不能与 author redaction 共用 actor 或 business input。

## Implementation Order

1. **T-004 contract pin**：冻结 descriptor、contract identity、surface envelope、
   invocation/result/error 和 concurrency-head schema。
2. **Schema migration and cutover**：三轴 Item、typed original-scope relations、reply order、
   context continuation、correction、typed context dependencies、immutable result 和
   cascade audit；冻结 single writer/read-only compatibility，迁移前报告旧行歧义，
   不猜测。
3. **Harness ingress**：实现 authenticated `query/prepareAction/executeAction/readResult`；
   body-free InteractionContext、owner-issued target refs、keyed input integrity、稳定
   Nurture command identity和 status/reconcile。
4. **Increment 1 commands**：在既有 CommandExecution transaction kernel 上实现
   submit/acknowledge/reply，并删除新路径对 ThreadParticipant、institution_admin、
   raw ids、whole-Item reply CAS、single reply slot 的依赖。
5. **Increment 1 presenters/qualification**：Guardian timeline、Caregiver work、
   Chat/board equivalence、多 Enrollment isolation、并发 reply、response-loss replay。
6. **Increment 2 commands**：correction、withdrawal、author/system redaction 和完整
   cascade/delivery invalidation。
7. **G2-C direct interaction**：冻结并实现 dedicated caregiver-initiated exact-target
   capability；验证 T-006 owner-issued action、安全阻塞、empty protected composer、
   non-diagnostic factual communication 和 no-source-copy。
8. **G2 Exit qualification**：formal NestJS ingress + real owner path 上联合验证 G2-A/
   B/C、legacy no-dual-write、privacy/leakage 和 final false/empty，并形成 T-005
   Beta Profile Handoff。
9. **Host companion + activation**：My-Chat ActionDelivery、notification/deep-link、
   native rendering 与 TestFlight/Play composite validation；在 T-002 owner pins 和
   qualification 完成前保持 default-off。

## Activation Statement

当前 landed schema/source 只能证明 T-002 的局部 transaction/domain foundation。
它不能证明 T-005 Harness、三轴 Item、多回复、第二增量、G2-C direct interaction、
My-Chat delivery 或六-surface 产品已实现。T-005 可以据本清单继续 contract/schema
implementation，但真实 owner path、claimed-Step replacement、Host delivery 和 traffic
仍是 `ACTIVATION_NO_GO`。G2-A/B/C 与 final qualification 全部通过前，T-005 不得转为
done。
