# Increment 1 Contract — Submit Input and Confirmation UX

## Status and Dependency

本文是 T-005 第一增量的 protected submit-input 与用户确认 normative contract。
通用 prepare/execute envelope、confirmation identity 和 result/error union 由 T-004
exact interface contract ref 提供。

本文对应 Stage G2-A 的 Guardian-initiated ordinary family-care question，不覆盖
G2-C caregiver-initiated direct interaction。后者必须使用独立 versioned capability、
org-to-family authority/purpose 和 exact target contract；不得反向复用本文 schema。

## SubmitFamilyCareQuestion Input V1

第一增量只开放一个 family-to-org 问题 capability。它的逻辑 operation input 是封闭类型：

```text
SubmitFamilyCareQuestionInputV1
  body: ProtectedPlainText<trimmed, 1..2000>
  contextContinuationOfItemRef?: OpaqueCareItemRef
```

- `body` 是 public logical product field，但必须经 protected composer/no-store ingress
  传输。client/LLM 不提交 current source 中的 `protected_content_ref`；execute 在
  Nurture transaction 内创建/绑定 encrypted protected content，再把 internal ref
  交给 persistence adapter。不得把 raw body 放入 ordinary Chat payload、Chat
  transcript、`confirmationRef`、日志、Receipt、CommandExecution 或 body-free
  presenter。
- canonicalization 只做首尾空白、换行形式等确定性机械规范化；不允许 LLM 改写、
  总结或补全 protected body。用户在 commit gesture 前看到的 exact normalized text
  就是将提交的正文。
- `contextContinuationOfItemRef` 遵守 architecture 中的 context-only 约束，不改变
  分类、目标、授权、优先级或 lifecycle。

目标选择与 operation input 分离：

- `targetOptionRef` 是 Nurture 在 `needs_input` 中签发的 owner-issued、actor-safe、
  opaque prepare target option，不是 raw Enrollment/CareGroup ID。
- 多个 eligible Enrollment 时用户必须选择；只有一个当前 eligible target 且
  capability policy 允许时，Nurture 才可确定性绑定。
- execute 重新解析 option/current default，并 reread current Participant、
  Enrollment、Grant、scope、policy 和 expected heads；option ref 本身不授权。

Nurture 固定或推导以下字段，客户端与 LLM 不得提交：

- `dataClass=family_care_question`
- `category=question`
- `urgency=today_attention`
- `direction=family_to_org`
- `requiresAck=true`、`requiresReply=true`
- `attachmentRefs=[]`
- author/current Participant、ChildCareProcess、Enrollment、CareGroup、提交时从 current
  eligibility 选定并固化为 source authority 的 original bidirectional Grant、
  purpose/route、body-free safe summary、expected heads、receipt refs 与 business
  command identity

第一增量明确不支持 rich text、附件/媒体、批量发送、用户选择
category/urgency/route、AI protected draft，以及医疗、用药或紧急事项。普通 Chat
只能识别 intent 并打开空的受保护 composer，不得自动复制 Chat 原文。
unsupported/safety-gated 输入在任何 Message、CareItem、Receipt、protected committed
content 或 CommandExecution 产生前，以安全的 `unavailable`/alternate-process 结果
失败；不得静默降级为普通问题。

## Confirmation UX Contract

确认按用户可见 effect 定义，不按后端调用次数定义。技术上的
`prepareAction → executeAction` 默认只对应一次结构化、effect-labeled 用户手势。

- `submit`：Chat 的 action card 或看板 form/detail 必须先显示 canonical normalized
  content、safe target label 和 expected effect；一个“发送给 {target}”CTA 同时构成
  confirmation 与 execute trigger，不要求通用二次弹窗。
- `reply`：reply composer/card 必须显示确切回复、家庭/孩子 safe target 和“以班级
  身份发送回复”的 append effect；第一条回复会解除待回复提醒，但不关闭事项。一个
  CTA 提交，不要求二次弹窗。
- `acknowledge`：没有新正文，使用一次“确认收到”direct gesture；该效果表示班级已
  收到，不承诺“由我跟进”。实现仍走相同 Harness/owner-reread/CommandExecution，
  不因单击 UX 建立旁路。
- 普通自然语言、“好的”“发吧”等文本不能由 LLM 单独解释为 confirmation；最终
  effect 必须绑定结构化 UI gesture 与 exact confirmation context。
- Harness、confirmationRef、Grant、command identity 和 CareItem 内部状态不作为
  用户心智模型；UI 只表达目标、内容、效果与当前结果。

额外可见步骤只在两类情况出现：

- 多个 eligible Enrollment 或其他必要字段存在真实歧义，用户必须选择。
- reprepare 发现 content、target、effect、authority-visible consequence 或当前状态
  变化，必须重新呈现并等待新的手势。

五分钟 token 单纯过期时，如果当前 UI 展示的 canonical content/target/effect 与
fresh prepare 完全一致，可以在同一 CTA gesture 中透明 reprepare + execute；任何
差异都中止执行。此优化不延长/复活旧 token，也不放宽 owner-reread。
