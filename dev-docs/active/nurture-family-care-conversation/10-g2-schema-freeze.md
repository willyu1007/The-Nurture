# G2-0 Schema Freeze — 三轴 CareItem、Single-writer Cutover 与 G2-C Exact Contract

## Outcome

- Task: T-005
- Slice: Stage G2 sequencing 第 1–2 步(G2-10):采用 T-004 exact contract pin;
  冻结三轴 schema、legacy single-writer cutover、旧行 ambiguity inventory 规则与
  G2-C dedicated capability exact contract
- Frozen: 2026-08-01(G2-C 载体模式经 owner 决策确认)
- Result: `G2_SCHEMA_FREEZE_LOCKED / HARNESS_IMPLEMENTATION_OPEN /
  ACTIVATION_NO_GO`
- 效力:本文件是 G2 schema/migration/Harness 实现的 normative SSOT。实现与
  qualification 必须逐条引用;偏离本冻结需要 supersede 记录,不得静默漂移。
  本冻结不 apply 任何持久化数据库、不注册 handler、不改 capability digest、
  不产生激活或流量效果。

## Adopted Contract Inputs(第 1 步)

- T-004 exact contract pin:`nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`。
  G1 Joint Conformance 判定 **PASS**
  (`../nurture-institution-mode/18-g1-joint-conformance-record.md`),
  protected T-005 implementation 已开放。
- T-002 owner path pins:My-Chat
  `a0195662228a2fc6323b9ea0cd327d3608d8cc17` / Base
  `06303e9f404e4ccc0ba3054b763675efe81b5b15`
  (M5 handoff,G1 已联合验证)。
- 本任务 normative 输入:`06-t002-fact-schema-gap.md`(现状盘点)、
  `07-increment-2-change-contract.md`、`08-increment-1-submit-ux-contract.md`、
  `09-capability-query-contract.md`、`02-architecture.md`。
- Prisma SSOT 基线:`prisma/schema.prisma` @ main `f39f694`。
- 失效语义:T-004 root digest、T-002 pins 或上列 normative 文档的实质变更
  supersede 本冻结的受影响部分;shared-core 漂移时按 G1-07 语义整体重跑。

## Frozen Three-axis Schema Delta(additive;最终命名在此冻结)

以下 delta 全部 additive,不删列、不改现有列类型。migration 只允许在
disposable PostgreSQL author/replay;persistent apply 保持 NO-GO。

### D1 — 新枚举

```text
NurtureFamilyCareAcknowledgementState { pending, acknowledged }
NurtureFamilyCareResponseState        { awaiting_reply, responded, not_applicable }
NurtureFamilyCareLifecycleState       { active, closed, suppressed }
NurtureFamilyCareLifecycleReason      { family_withdrawn, grant_revoked,
                                        source_redacted, expired }
NurtureFamilyCareWriterContract       { legacy_v1, legacy_migrated_v1,
                                        harness_g2_v1 }
```

- `not_applicable` 仅供无回复义务的行(见 G2-C;family question 永不使用)。
- `lifecycleReason` 可空;仅 `closed | suppressed` 时允许非空。

### D2 — `NurtureFamilyCareItem` 新列

```text
writerContract              NurtureFamilyCareWriterContract  @default(legacy_v1)
acknowledgementState        NurtureFamilyCareAcknowledgementState @default(pending)
acknowledgementHead         Int @default(0)
responseState               NurtureFamilyCareResponseState   @default(awaiting_reply)
responseHead                Int @default(0)
lifecycleState              NurtureFamilyCareLifecycleState  @default(active)
lifecycleReason             NurtureFamilyCareLifecycleReason?
lifecycleHead               Int @default(0)
ackedByRoleAssignmentId     String?   (typed FK -> NurtureCareRoleAssignment)
contextContinuationOfItemId String?   (self-FK, 同 workspace)
```

- 三个 `*Head` 是独立并发 head:acknowledge 只冻结 acknowledgementHead,
  reply 只冻结 lifecycle/authority 相关 heads;旧 `version` 列不再作为新路径
  reply CAS(见 cutover C5)。
- DB CHECK(migration SQL):`writerContract='harness_g2_v1'` 的行必须
  `source_message_id IS NOT NULL AND enrollment_id IS NOT NULL AND
  grant_id IS NOT NULL`(complete-graph 最低行内保证);跨行 complete-graph
  (Item↔Message↔Enrollment↔CareGroup↔original Grant 一致性、continuation 同
  workspace/同 ChildCareProcess/同 Enrollment)由事务内 validator 与迁移期
  assert 脚本机械证明。
- `contextContinuationOfItemRef` 语义按 02-architecture:body-free、仅展示/
  总结,不继承 Grant/authority/owner/SLA/状态,不进入 idempotency。

### D3 — `NurtureFamilyCareMessage` 新列与枚举扩展

```text
enrollmentId   String?                (typed FK; G2 行必填)
careGroupId    String?                (typed FK; G2 行必填)
direction      NurtureGrantDirection? (G2 行必填)
writerContract NurtureFamilyCareWriterContract @default(legacy_v1)
replyOrderKey  String?                @map("reply_order_key")
```

- `NurtureFamilyCareMessageKind` 增值:`caregiver_direct_message`(G2-C)。
  09 号文档 projection 层的 `source_question | correction_notice |
  redaction_tombstone` 是投影 kind,由 `family_message`、correction 表与
  redaction 状态派生,不新增 Prisma kind。
- `replyOrderKey`:server-issued、immutable,格式
  `<epochMicros(DB commit clock)>-<messageId>`;仅
  `messageKind=caregiver_reply` 必填。migration SQL 建 partial unique index
  `(workspace_id, source_item_id, reply_order_key) WHERE
  message_kind='caregiver_reply'`。可由 `createdAt + id` 机械重建校验,
  不使用 mutable reply counter。

### D4 — 新表 `NurtureFamilyCareMessageCorrection`

```text
id, workspaceId
messageId                String  (FK -> NurtureFamilyCareMessage, Restrict)
correctionVersion        Int     (strict head; unique (workspaceId, messageId,
                                  correctionVersion))
authorParticipantId      String  (FK; exact author audit)
authorRoleAssignmentId   String  (FK; immutable audit, 不要求仍 current)
bodyStorageMode          NurtureFamilyCareMessageBodyStorageMode
bodyProtectionPayload    Json?   (encrypted envelope, 见 D6)
status                   { active, redacted }(新枚举
                          NurtureFamilyCareCorrectionStatus)
commandExecutionId       String? (owning CommandExecution)
receiptId                String? (correction Receipt binding)
createdAt
```

- append-only:不 UPDATE 历史版本正文;redaction 时置 `status=redacted` 并
  清除 payload(tombstone 保留)。
- strict correction-head:下一版本必须 `correctionVersion = 当前最大 + 1`,
  由 unique 约束 + 事务内 reread 保证;并发更正只有一个 successor 提交。

### D5 — 新表 `NurtureFamilyCareCascadeAudit`

```text
id, workspaceId
rootMessageId       String   (FK; cascade 根)
cascadeScope        { source_question, reply_local }(新枚举)
closureState        { complete, failed }(新枚举;不存在部分成功的持久值)
affectedRefsPayload Json     (body-free refs: 被抑制 Item/Attention/correction
                              versions/Receipt terminalizations)
commandExecutionId  String
createdAt
```

- 07 号文档的 `cascadeAuditRef` 指向本表行。cascade 必须分页锁定循环至闭包
  或整笔失败;固定 `take` 截断后部分提交是原子性失败,qualification 必须拒绝。

### D6 — Encrypted protected content(行内,不建第二张 content 表)

- 决策:复用 `NurtureFamilyCareMessage` / correction 表的
  `bodyStorageMode=encrypted` + `bodyProtectionPayload`,不新建平行 content
  aggregate(遵守 06 号"Reuse without a parallel aggregate")。
- `bodyProtectionPayload` 封闭 envelope 契约(payload schema v1):
  `{ algVersion, keyRef, ciphertext, integrityTag }`;不存明文、不存可枚举
  bare body hash。G2 行 `body` 明文列恒 NULL,`plain_text_dev` 模式对
  `writerContract=harness_g2_v1` 行禁止(DB CHECK)。
- no-store protected ingress 冻结为 domain port
  `ProtectedContentWritePort`:execute 事务内加密、持久化并绑定
  Message/Correction;client/LLM 提交的 `protected_content_ref` 一律拒绝;
  prepare 阶段只在 InteractionContext 保存 secret-keyed integrity tag。

### D7 — `NurtureCommandExecution` 新列(immutable committed result)

```text
resultSchemaVersion    Int?   (G2 行必填)
committedResultPayload Json?  (body-free: business outcome、capability typed
                               output、receipt refs、invalidation scopes)
```

- `commandExecutionRef` 即 committed-result authority;不建第二个 result
  table/ref;replay 返回持久化 payload,不重算历史业务结果。
- 受保护正文、raw identity、claim/confirmation token 不得进入该 payload。

### D8 — `NurtureInteractionContext`(表结构不变;payload 契约升版)

- 列不变;冻结 `payloadSchemaVersion=2` 的 typed confirmation payload 契约,
  `statePayload` 必须且仅含:capability key/version、stable business command
  identity、owner-issued target refs(Item/Message/Enrollment/Grant)、
  capability-specific concurrency heads、keyed canonical-input integrity tag、
  surface binding、issued/expires 证据。TTL 固定五分钟,不延长、不复活、
  不跨 actor/account/device/surface,新 effect 单次消费。
- `NurtureInteractionPurpose` 增值:`prepare_action`(G2 Harness prepare;
  现有 `submit_action` 语义保留给 legacy 路径)。

### D9 — `NurtureGrantDataClass` 增值

- 增 `direct_care_communication`(G2-C 专用 org-to-family data class)。
  普通 family question 继续使用 `family_care_question`,二者不得互换。

## Frozen Single-writer Cutover Matrix(C1–C8)

| # | Legacy 元素 | Disposition |
| --- | --- | --- |
| C1 | `NurtureFamilyCareItem.status`(单枚举) | 对 G2 行降级为 derived read-only 兼容列:Harness 在同一事务内按固定映射单向维护(active+pending→`open`;active+acknowledged+awaiting_reply→`acknowledged`;active+responded→`replied`;closed→`closed`;suppressed→`suppressed`),仅供旧 consumer 读取;不参与新路径 authority/concurrency/replay;legacy handler 不得写 G2 行 |
| C2 | `assignedToRoleAssignmentId` | G2 行恒 NULL;不构成 claim/assignment/reply authority;旧行只读保留 |
| C3 | `linkedReplyMessageId` | G2 行恒 NULL;reply collection 由 `messageKind=caregiver_reply` Message + Event + Receipt 派生;single reply slot 语义废止 |
| C4 | ThreadParticipant authority | 授权判定禁用(binding 负向已在 T-002 单测);行保留仅作路由/last-read 显示输入 |
| C5 | whole-Item `version` CAS | G2 行不再作为 reply/ack precondition;三轴 heads 取代;`version` 继续递增仅作审计/legacy 读兼容 |
| C6 | raw command DTO(`familyInputRouteSpec` 等 legacy specs) | 对 G2 行 default-off;仅 migration/read 证据;不得注册为 T-005 public capability |
| C7 | claimed-Step / `workflow_step_complete_v1` seam | 维持 default-off compatibility seam;不是 G2 写入面或 qualification 证据 |
| C8 | 双写 | 禁止:新 G2 行唯一 writer 是 T-004 exact contract 下的三轴 Harness path;legacy 读投影单向派生,不回写 |

## Frozen Legacy-row Ambiguity Inventory Rules

旧行 backfill 只接受机械可证明映射,判定表(逐行、封闭):

| 旧 `status` | 机械迁移条件 | 三轴结果(writerContract→`legacy_migrated_v1`) |
| --- | --- | --- |
| `open` | 恒可 | pending / awaiting_reply / active |
| `acknowledged` | `ackedAt` 与 `ackedByParticipantId` 同时非空 | acknowledged / awaiting_reply / active |
| `replied` | `linkedReplyMessageId` 指向存在且 `messageKind=caregiver_reply` 的同 workspace Message | (按 `ackedAt` 判 ack 轴)/ responded / active |
| `closed` | 上两行条件按字段可判 | (按上)/(按 linkedReply)/ closed,reason NULL |
| `expired` | 恒可 | (按上)/(按上)/ closed,reason `expired` |
| `suppressed` | 存在对应 redaction event 或 `suppressionReason` 可映射 `source_redacted` | (按上)/(按上)/ suppressed,reason `source_redacted` |

Quarantine(writerContract 保持 `legacy_v1`,三轴不回填、不可信,新路径拒绝
操作该行,不猜测、不自动 merge):

- `waiting_for_family` / `followed_up`(clarification 流,三轴不表达);
- `linkedReplyMessageId` 悬空或指向非 reply kind;
- `ackedAt`/`ackedByParticipantId` 不一致(单空);
- 跨边界行 `grantId` 为 NULL 或 Grant 与 Item 的 Enrollment 不一致;
- `suppressed` 而 suppression 证据不可映射。

inventory 报告在 migration 实现时随 disposable PostgreSQL replay 生成并入
qualification 证据;quarantine 行数不阻塞 G2-A,但必须逐类列账。

## Frozen G2-C Exact Capability Contract(owner 决策:Message-only,2026-08-01)

- 载体决策:**Message-only**。G2-C 直发沟通只创建 canonical Message + 逻辑
  Receipt + CommandExecution;**不创建 CareItem**、不创建 Attention,家庭侧
  无 acknowledge/reply 义务(response expectation = 无义务;delivered/read
  Receipt 即家庭侧状态面)。G2-A family-authored 三轴状态机不被反向套用。
- `capabilityKey = initiate_caregiver_direct_message`,
  `capabilityVersion = 1.0.0`。进入 T-004 interface digest 的 rotation 与
  Wave4 import-closure scoping 同批在下一个 pin action 执行;rotation +
  qualification 完成前,V1 discovery 不发布该 key,T-006 只显示安全阻塞
  (与 09 号文档一致)。
- typed input:
  `InitiateCaregiverDirectMessageInputV1 { body: ProtectedPlainText<trimmed,1..2000> }`;
  target 走 prepare 阶段 owner-issued `targetOptionRef`(exact child/family),
  不进入 operation input;raw source/target/Grant 字段一律拒绝。
- authority:initiator 必须是 exact Enrollment/CareGroup 的 current
  `caregiver | lead_caregiver`;execute 重读 org-to-family original Grant、
  `dataClass=direct_care_communication`、purpose、current relationship 与
  safety policy heads;Institution Admin、同园区、ThreadParticipant、T-006
  risk result 均不授权。
- canonical effect(一个 Nurture transaction):canonical Message
  (`messageKind=caregiver_direct_message`、`direction=org_to_family`、
  `writerContract=harness_g2_v1`、绑定 exact Enrollment/CareGroup/original
  Grant、encrypted body)+ 逻辑 Receipt(delivered/read;无 acknowledge
  义务)+ CommandExecution(immutable result)。
- typed output:
  `InitiateCaregiverDirectMessageOutputV1 { messageRef, receiptRef,
  contentState: sent }`。
- family-side projection:guardian timeline 显示该消息与 read receipt;家庭
  回应通过新 `submit_family_care_question`(新 Item;首版不建立 continuation
  关联,因 continuation 源必须是 Item)。
- correction / redaction:适用于该 Message(exact author = 发送 caregiver;
  current same-side reach 按 07 号文档 caregiver-authored predicate);
  withdrawal 不适用(无 family-authored Item)。redaction cascade scope =
  `reply_local` 等价的 message-local。
- ActionDelivery invalidation:correction 产生 update candidate;redaction 后
  未发送候选 owner-reread 跳过;已送达通知 open 时重读当前状态。
- 安全边界:正文由 caregiver 人工填写;不自动复制 T-006 source/AI 文案/
  附件;事实性健康/事件沟通保持非诊断、非处方、非紧急替代;拒绝路径不创建
  CareInteraction。

## Acceptance-to-Check Mapping(freeze 范畴;ID 自此稳定)

| AC ID | 条目(摘要) | 检查类别 |
| --- | --- | --- |
| T005-AC-001 | CareItem 三轴正交状态(ack/response/lifecycle)且新路径不依赖 legacy `status` | integration test |
| T005-AC-002 | 第一条 reply 置 responded 并解除待回复 Attention,Item 保持 active/appendable | integration test |
| T005-AC-003 | acknowledge 不创建个人 claim/assignment;actor 仅审计 | integration test + negative case |
| T005-AC-004 | reply 仅限 exact CareGroup current caregiver/lead_caregiver;Admin/ThreadParticipant/同园区不授权 | negative case |
| T005-AC-005 | 并发合法 reply 均提交;`replyOrderKey` immutable、同 command replay 返回同一键 | integration test |
| T005-AC-006 | `CareReplyV1` 是 projection,无第二张 canonical reply 表 | lint/static(schema census) |
| T005-AC-007 | 新 G2 行唯一 writer 为三轴 Harness;legacy handler 对 G2 行 default-off | negative case + evidence census |
| T005-AC-008 | legacy 读兼容仅由 canonical state 单向派生,禁止 dual-write | integration test + lint/static |
| T005-AC-009 | 歧义旧行 quarantine 不猜测;inventory 逐类列账 | evidence census |
| T005-AC-010 | complete-graph:G2 行 sourceMessage/Enrollment/CareGroup/original Grant 机械一致 | lint/static(migration assert)+ integration test |
| T005-AC-011 | continuation 仅同 ChildCareProcess/同 Enrollment/responded 且当前可读的源 Item;不继承 authority/state/SLA | negative case |
| T005-AC-012 | prepare 不持久化 business draft/正文;InteractionContext body-free 且只存 keyed integrity tag | integration test + negative case |
| T005-AC-013 | `confirmationRef` 五分钟、单次新 effect、不跨 actor/surface/device/account | negative case |
| T005-AC-014 | committed result immutable:`commandExecutionRef` 唯一 authority,replay 不重算 | integration test |
| T005-AC-015 | 受保护正文不进入 InteractionContext/CommandExecution payload/Receipt/log/presenter | negative case(leakage scan) |
| T005-AC-016 | G2 行明文 `body` 恒 NULL、`plain_text_dev` 禁止、encrypted envelope 封闭 | lint/static(DB CHECK)+ negative case |
| T005-AC-017 | redaction cascade loop-to-closure 或整笔失败;`closureState` 无部分成功值 | integration test + negative case |
| T005-AC-018 | G2-C 不创建 CareItem/Attention;家庭侧无 ack/reply 义务 | conformance fixture + integration test |
| T005-AC-019 | G2-C initiator/target/Grant/data-class/safety 负向全 fail closed | negative case |
| T005-AC-020 | G2-C 未进 digest/未资格化时 T-006 只显示安全阻塞 | conformance fixture |
| T005-AC-021 | correction strict head:并发更正仅一个 successor 提交 | integration test |
| T005-AC-022 | withdrawal 仅 family-authored Item;caregiver 路径与 G2-C 不暴露该 capability | negative case |

映射按 stage 摊销:G2-A/B/C 与 Exit 各自 freeze 时继续编号;已分配 ID 不可
变更或复用。fixture 侧使用 T-004 conformance manifest 的 `acceptanceRefs`
字段回链。

## Non-effects

规划/契约冻结。无 schema apply、无 migration 执行、无 handler 注册、无
capability/digest 变更(G2-C digest rotation 留待下一 pin action)、无
数据库/secret/deployment/activation/traffic 效果;所有 consumer 保持
default-off。
