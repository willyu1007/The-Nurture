# Increment 2 Contract — Correction, Withdrawal, and Redaction

## Status and Dependency

本文是 T-005 第二增量的 normative capability contract。通用 invocation/result/error
与 contract identity 由 T-004 exact interface contract ref 提供；本文件只定义
family-care capability 的 target、authority、input、effect、output、cascade 和
delivery invalidation。

三种动作具有不同 target/effect，不得压缩成通用 delete/revoke：

| Capability | Target | Canonical effect | Content visibility |
| --- | --- | --- | --- |
| `correct_family_care_message` | Message | append correction version | 原文与历史保留，最新有效解释为主投影 |
| `withdraw_family_care_request` | family-authored CareItem | `active → closed(family_withdrawn)` | 问题、回复与 Receipt 保留 |
| `redact_family_care_message` | Message | irreversible content erasure + tombstone | 正文/附件/correction versions 不再可读 |

## Exact Author and Current Same-side Reach

`exact author` 永远比较 canonical Message 的 sender Participant，不比较显示名、
CareGroup business label 或客户端 role。`current same-side relationship` 是执行时的
owner-policy predicate：

- family-authored target：同一 Participant 仍是该 Family/ChildCareProcess 的 current
  guardian，并能按 current owner policy 安全解析 target。
- caregiver-authored target：同一 Participant 当前持有该原始
  Enrollment/CareGroup 的 `caregiver | lead_caregiver` operational role，并能按
  current owner policy 安全解析 target。
- 历史 `authoredByRoleAssignmentRef` 只证明当时的审计归属；执行可以使用同一
  Participant 在同 scope 下的新 current RoleAssignment，不要求历史 row 仍 active。

该 predicate 不是 Grant、target ref 或长期授权。correction/withdrawal 还必须满足其
active original-Grant/lifecycle heads；author redaction 不要求 original Grant 仍
active，只要求 exact author、current same-side reach 与 target 尚可解析。该窄权限只
允许移除作者自己的内容，不得恢复正文读取、跨边界投递或任何其他动作。

## Correction

- correction 只允许原 Message 的 exact sender Participant 在 current same-side
  relationship 仍可达时执行。历史 sender RoleAssignment 作为 immutable audit，不要求
  同一 role row 仍 current。CareGroup 是 reply 的业务发送主体，但不授予一个老师
  修改另一位老师具体文字的权限；其他老师仍可追加新的 reply。
- operation input 只含规范化后的 1–2000 字符 protected plain text；target Message、
  author、Enrollment/CareGroup、Grant、current correction head、route 与 command
  identity 均由 prepare 解析。
- correction 追加不可变 version/fact，不覆盖 source Message。presenter 默认显示最新
  有效解释，并在原消息上显示“已更正”；历史按 current actor policy 可展开。
- correction 使用 strict correction-head precondition。两个不同 command 并发更正时
  只有当前 head 的一个 successor 可以提交；另一个返回 stale/current-safe state。
- family source question 只在 response=`awaiting_reply` 时允许同 Item correction。
  response 已为 `responded` 后，任何新增/修正请求创建新 CareItem，并可携带
  `contextContinuationOfItemRef`。
- correction 是新的跨边界内容 effect，拥有独立 Receipt、CommandExecution、
  immutable result 与 ActionDelivery candidate。

```text
CorrectFamilyCareMessageOutputV1
  effect: correction_appended
  messageRef
  correctionRef
  receiptRef
```

`correctionVersion`、canonical Event 与内部 Receipt/Message refs 留在
`CommandExecution.output_refs` 和 current owner-read，不得扩进 T-004
`additionalProperties=false` 的 immutable public result。

## Withdrawal

- withdrawal 的产品 target 是 family-authored CareItem work，而不是 Message。
  用户文案 SHOULD 使用“无需老师继续跟进”/“家长已结束该事项”，避免误解为删除消息。
- `withdraw_family_care_request` 只允许 source question 的 exact sender Participant
  在 current family-side relationship 仍可达时执行；历史 Guardian RoleAssignment
  只作 immutable audit。typed input 为空，prepare 显示“历史仍保留、班级不能继续
  回复”的 effect。
- commit 将 lifecycle 置为 `closed(family_withdrawn)`，解除/关闭 active Attention，
  阻止未来 acknowledge/reply，同时保留 source/reply Message、Receipt、
  delivery/read/acknowledgement 与审计历史。
- 已 withdrawal 的同等 command/新 command 可收敛为 `already_satisfied`。并发 reply
  与 withdrawal 按事务顺序决定：reply 先提交则保留并随后关闭；withdrawal 先提交则
  reply stale。
- caregiver reply 不提供 withdrawal；需要调整使用 correction，需要内容移除使用
  redaction。Grant revoke 改变访问授权，也不得复用 withdrawal capability/state。

```text
WithdrawFamilyCareRequestOutputV1
  effect: request_withdrawn
  careItemRef
  receiptRef
```

`closed(family_withdrawn)`、withdrawal Event 与 Attention effect 是 canonical
state/audit facts；public timeline 通过 `withdrawal_notice + lifecycle=closed` 呈现，
不把这些内部字段追加到冻结 result schema。

## Redaction

- `redact_family_care_message` 使用 empty typed input、exact Message/version/author
  precondition 与一次明确的不可逆 effect-labeled confirmation。
- author redaction 只允许 exact sender Participant + current same-side relationship；
  typed business input 为空，reason 由服务端产生。policy/safety/admin redaction 使用
  独立 system actor/capability 和 server-owned reason，不能伪装成作者操作。
  `policy_redact_family_care_message` 的 typed input 必须是闭合对象
  `{ policyDecisionRef }`；该 owner-issued opaque evidence 绑定 workspace、system
  Participant、Message 与 current Message/policy head。prepare/execute 均重新验证
  当前 system role、evidence binding 和 head；confirmation 只保存数值
  `policy_decision` concurrency head 与 keyed input-integrity tag，不缓存授权决定。
- commit 使正文、附件和该 Message 的 correction versions 对普通 reader 不可恢复，
  保留 Message tombstone、redaction reason、Receipt、Event、Execution 与审计 refs。
  `deleted` 不是领域状态，物理删除属于 retention/legal mechanism。
- author redaction 声明 `contentState=redacted` convergent postcondition：另一合法命令
  已完成同一 target 的完整 cascade 时可返回 `already_satisfied` 并引用既有
  redaction event/audit；如果 cascade 未完成、author/scope 不匹配或状态不可证明，
  必须 fail closed，不能把部分删除当成功。redacted Message 不再接受 correction。
- source question redaction 原子 suppress 依赖 Item 与 active Attention，阻止未来
  acknowledge/reply，并让派生 summary/detail 不可见。已有 caregiver replies 是独立
  作者事实，不自动 redaction，但只能在各自 current policy 下呈现并关联安全 tombstone。
- caregiver reply redaction 只移除该 reply/correction chain，terminalize/更新对应
  Receipt；source question、其他 replies 与 CareItem appendability 保持。它不把
  responseState 改回 awaiting_reply，也不重开原 waiting Attention；班级可追加新 reply。

```text
RedactFamilyCareMessageOutputV1(author)
  effect: content_redacted
  messageRef
  tombstoneRef

PolicyRedactFamilyCareMessageOutputV1(system policy)
  effect: policy_content_redacted
  messageRef
  tombstoneRef
  auditEventRef
```

`tombstoneRef` 指向已转成 tombstone 的 canonical Message 的独立 display-only
opaque identity；`auditEventRef` 指向真实完成的 cascade audit。不得伪造不存在的
redaction Event，cascade scope/affected refs 继续由内部 audit 与 owner-read 提供。

## Delivery and Low-interruption Projection

- correction 产生新内容，因此可以创建一次正常的 update ActionDelivery candidate。
- withdrawal/redaction 提交后，尚未 materialize/send 的相关 notification candidate
  必须在 owner reread 时跳过；已经送达 provider/device 的通知不能声明召回。
- stale notification/deep-link open 必须重新读取 Nurture current projection，显示
  body-free “事项已结束”或“内容已移除”，不得展示缓存正文。
- applied/already-satisfied/replayed 原位更新 timeline/card，不显示技术状态。redaction
  虽不可逆，也只需要一次清楚的 confirmation sheet；不追加通用第二次确认。
- source/reply redaction cascade MUST 分页锁定并循环至闭包，或使用等价的数据库级
  集合更新；固定 `take` 上限后提交部分 cascade 属于原子性失败，必须阻止 activation。
