# Capability Registry and Query Contract V1

## Capability Identity

capability identity 由 stable `capabilityKey` 与独立 `capabilityVersion=1.0.0` 组成；
key 不携带 `_v1` 后缀。V1 registry 是封闭集合：

- query：`query_guardian_family_care_timeline`、
  `query_caregiver_family_care_work`、`query_family_care_item`。
- Increment 1 action：`submit_family_care_question`、
  `acknowledge_family_care_item`、`reply_family_care_item`。
- Increment 2 author action：`correct_family_care_message`、
  `withdraw_family_care_request`、`redact_family_care_message`。
- internal system action：`policy_redact_family_care_message`；它不进入普通用户
  discovery candidate。

新增、删除、改义、改变 typed schema/policy/handler/presenter binding 必须生成新的
capability version 和 T-004 interface contract digest；客户端不能靠 key 后缀猜版本。

## Query Invariants

- `query` 在 current actor/role/scope/policy 下读取 capability-specific safe facts，
  不产生业务写入或 `CommandExecution`。
- 所有输出使用 T-004 exact contract ref、snapshot/page/cursor envelope；T-005 不复制
  generic query envelope。
- cursor 绑定 contract、actor/scope、query、sort、snapshot 和 expiry；漂移时返回
  refresh/rebase，不拼接不同 snapshot。
- `readResult` 根据 canonical refs 与当前 owner state 重新生成 role-safe result
  projection；不从 Chat transcript 或设备缓存恢复业务结果。
- ordinary Chat 可以把 query 结果交给 My-Chat LLM 总结；Nurture 只返回过滤后的事实与
  provenance，不拥有模型调用。

## Shared Referenced Types

以下是 T-005-owned schema refs，必须进入 T-004 interface artifact set；它们不是
Prisma shape：

```text
SnapshotPageInfoV1
  nextCursor?
  hasMore

AuthorizedProtectedContentV1
  body: ProtectedPlainText

RoleSafeFamilyCareStateV1
  acknowledgementState: pending | acknowledged
  responseState: awaiting_reply | responded
  lifecycle: active | closed | suppressed

RoleSafeReceiptV1
  receiptRef
  direction: family_to_org | org_to_family
  logicalStatus: pending | delivered | read | acknowledged | failed
      | blocked | revoked_after_delivery
  occurredAt

RoleSafeFamilyCareProvenanceV1
  enrollmentRef
  sourceLabel
  direction: family_to_org | org_to_family

RoleSafeFamilyCareMessageV1
  kind: source_question | caregiver_reply | correction_notice
      | redaction_tombstone
  messageRef
  authoredAs: family | care_group
  occurredAt
  content?: AuthorizedProtectedContentV1

RoleSafeAttentionV1
  state: active | resolved | suppressed
  reasonLabel?

RoleSafeContinuationV1
  sourceItemRef
  label

CapabilityActionRefV1
  capabilityKey
  capabilityVersion
  targetOptionRef
  availability: available | already_satisfied
```

- `content` 与 continuation 只在 current owner policy 允许时出现；字段省略不能被解释
  为 target 存在或不存在的证明。
- `sourceLabel`、`reasonLabel` 是服务端生成的 display-safe 文案，不包含 raw identity、
  Grant、policy 或另一 Institution 信息。
- Receipt 只表达 Nurture logical state；provider/device delivery/read 不进入
  `logicalStatus`。
- `targetOptionRef` 是短期 owner-issued locator，不是 authority，也不是 raw object id。

## Guardian Timeline Output

```text
GuardianFamilyCareTimelineOutputV1
  items: GuardianFamilyCareTimelineItemV1[]
  pageInfo: SnapshotPageInfoV1

GuardianFamilyCareTimelineItemV1
  kind: source_question | caregiver_reply | correction_notice
      | withdrawal_notice | redaction_tombstone | receipt_status
  itemRef
  careItemRef
  enrollmentRef
  sourceLabel
  occurredAt
  content?: AuthorizedProtectedContentV1
  state: RoleSafeFamilyCareStateV1
  receipt?: RoleSafeReceiptV1
  contextContinuation?: RoleSafeContinuationV1
```

- timeline 可以聚合多个 current-readable Enrollment，但每个 item 必须保留 opaque
  Enrollment provenance 和 display-safe source label；不能把冲突来源合并为单一权威事实。
- `content` 只在 current family-side owner policy 允许且 item 未 redacted 时出现；
  internal protected-content ref 永不返回。
- source relation 后续不可读时，`contextContinuation` 整体省略，不泄漏源是否存在。

## Caregiver Work Output

```text
CaregiverFamilyCareWorkOutputV1
  careGroupRef
  items: CaregiverFamilyCareWorkItemV1[]
  pageInfo: SnapshotPageInfoV1

CaregiverFamilyCareWorkItemV1
  careItemRef
  childSafeLabel
  sourceSafeSummary
  acknowledgementState: pending | acknowledged
  responseState: awaiting_reply | responded
  lifecycle: active | closed | suppressed
  attentionState: active | resolved | suppressed
  createdAt
  lastActivityAt
  actions: CapabilityActionRefV1[]
```

- 输出限定 exact current CareGroup/current operational role；不得出现其他
  Institution/Enrollment 的存在、计数、名称或状态。
- work list 只返回 safe summary。受保护 source/reply body 通过 detail query 的
  current owner-read 返回，不进入列表、notification 或 Chat transcript。
- `actions` 只含当前可发现 capability/version 与 owner-issued target ref；它不是
  authority，execute 仍重新读取 current policy/heads。

## Role-specific Item Detail Output

```text
FamilyCareItemDetailOutputV1
  projectionRole: guardian | caregiver
  careItemRef
  provenance: RoleSafeFamilyCareProvenanceV1
  progress: CareItemProgressV1
  messages: RoleSafeFamilyCareMessageV1[]
  receipts: RoleSafeReceiptV1[]
  attention?: RoleSafeAttentionV1
  contextContinuation?: RoleSafeContinuationV1
  actions: CapabilityActionRefV1[]
```

- query target 必须是 owner-issued opaque Item ref，不接受 raw CareItem id。
- `projectionRole` 是服务端根据 current actor 决定的封闭 union；客户端不能请求另一
  角色投影。
- messages 按 current visibility 返回 question、reply、correction marker 或 redaction
  tombstone。可见正文可内联为 authorized protected content；内部 content ref、
  original Grant、policy/version、另一角色 private transcript 和 host room state
  永不返回。
- detail 的 progress/receipt/attention/actions 来自同一 snapshot；mutation 后 consumer
  按 invalidation scopes 重新 query/readResult。
