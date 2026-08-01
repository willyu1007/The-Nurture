# Pitfalls — 家庭与照护者对话能力

## Known Guardrails

- 不要把家庭 AI 对话默认视为机构或 caregiver 可见。
- 不要把 Guardian Chat 与 Caregiver Chat 建模为共享聊天室、直接 DM 或共同 transcript。
- 不要用 room membership、presence、typing、host unread 或 My-Chat Chat history 表示 Nurture 权限和回执。
- 不要因两个 surface 消费同一 CareItem 就向双方暴露相同正文、动作或历史。
- 不要把 T-007 D-04 的 Institution Admin 业务沟通只读投影理解为共享 transcript
  或 “Admin 能看本园全部聊天”；它必须逐请求通过 exact scope、Grant、purpose、
  disclosure 与 source lifecycle。
- 不要因为 Admin 能读取园区业务沟通就赋予 acknowledge、reply、correct、withdraw
  或 redact。读取能力与 caregiver/author action authority 是两套独立判定。
- 不要把 Guardian private AI、未发送 composer、My-Chat private chat 或其他
  Enrollment 内容带入 Admin 投影，也不要把投影正文持久化为第二份业务事实。
- 不要让 Enrollment-private Thread 跨机构复用，或让一个机构推断其他 Institution Enrollment 的存在。
- 不要把普通 Chat turn、只读总结或未确认的 action suggestion 自动持久化为 CareItem。
- 不要让 Chat 和看板分别实现发送、授权、幂等、回执或错误语义；它们必须调用同一 Capability Harness。
- 不要因为看板已经提供结构化 target 就跳过执行端 owner-reread、confirmation 或版本校验。
- 不要把通用 Harness 退化成接受任意 JSON 的万能命令；每个 capability 必须有独立的 typed schema、version、policy 与 binding。
- 不要让 `surface_origin` 改变 authority、effect 或 replay identity。
- 不要让 Query lane 或未确认的 `prepareAction` 产生 `CommandExecution` 或业务事实。
- 不要把“不持久化 prepared business draft”误读成禁止 body-free、短期
  `InteractionContext`；后者只保存协议绑定，不能保存正文、成为 timeline 事实或显示
  为待发送。
- 不要把 preview/confirmation、异步、跨 owner、worker、Handoff 或通知当成
  Workflow 分类条件；family-care action 是 `ActionExecution`。
- 不要让 `prepareAction` 重新承担 capability 路由；它只接收已选定的 exact capability/version。
- 不要接受客户端/LLM 提供 Grant、role、policy、data class/direction/purpose、内部 route 或 expected-head 真相。
- 不要把 raw body/PII 放入 `confirmationRef`，也不要把 ref 当成通用对象访问或长期授权凭证。
- 不要保存可枚举的 bare body hash；低熵 protected body 必须使用 secret-keyed
  integrity tag，且 client/LLM 不得提交内部 `protected_content_ref`。
- 不要延长、复活或跨 actor/account/device/surface 搬运五分钟 confirmation context。
- 不要为恢复响应丢失重新 prepare 并创建新 effect；使用相同 command request 的 CommandExecution exact replay。
- 不要让 My-Chat/LLM 自行生成 Nurture business command identity；prepare context 负责稳定绑定。
- 不要把 `already_satisfied` 当作 replay，也不要把 `replayed` 当作新 effect。
- 不要把 replay 时可变化的 reply count、当前权限或 delivery/notification 状态写回
  不可变 committedResult；最新状态必须由 `readResult` 重新读取。
- 不要为 immutable result 再创建平行 `resultRef`/result row；
  `CommandExecution` 是唯一结果 authority，负责持久化 typed result version/payload。
- 不要把另一个老师已经完成 acknowledge 当作错误或 stale；只要其他 fence 仍有效，
  它应低打扰地收敛为 already-satisfied，且不得生成重复 event 或虚假个人归属。
- 不要让不同 reply command 因正文相同或 Item 已 responded 而 already-satisfied；
  reply 是追加内容，只有同一 command identity 才 replay。
- 不要建立第二张 canonical `CareReply` 表；reply Message + ItemEvent + Receipt 是
  canonical facts，`CareReplyV1` 只是 projection。
- 不要把 `committed` 翻译成通知已送达、设备已读或照护者已确认。
- 不要在 `outcome_unknown` 时换 command identity 或重新 prepare；必须先解析原 effect。
- 不要使用通用 `followUpOf` 同时表达交流上下文续接和事项 successor/dependency；两者具有不同的授权、状态与执行语义。
- [SUPERSEDED] “replied terminal Item 不允许第二次 reply”不再是当前规则。老师可在
  同一 CareItem 追加多条班级回复；家长继续提问仍创建新 Item。
- 不要让 `contextContinuationOfItemRef` 授权读取、继承 Grant/owner/SLA/state、改变事项顺序，或触发 `CareItemDependency`。
- 不要让续接 Item 复用源 Item 的 Grant、confirmation 或 command identity；它必须使用当前 authority 与新的业务命令身份。
- 不要因源 Item 后续不可读而级联删除或拒绝新 Item；只抑制关系展示，并按新 Item 自身权限判断。
- 不要把 owner-issued `targetOptionRef` 塞进 operation input，或允许客户端/LLM 用 raw Enrollment/CareGroup ID 替代它。
- 不要允许客户端/LLM 提交 family-care classification、urgency、direction、ack/reply flags、route、safe summary、Grant 或 command identity。
- 不要从 ordinary Chat 自动复制正文到 protected composer，也不要把 protected body 交给 LLM 改写、总结或补全。
- 不要让“机械规范化”改变语义；trim/换行规范化后的 exact text 必须在提交前可见。
- 不要为了快速版本提前加入富文本、附件、批量发送、AI protected draft 或用户自选 priority/category。
- 不要把医疗、用药或紧急内容静默当成普通照护问题发送；必须在业务写入前走安全拒绝/替代流程。
- 不要为了 correction/withdrawal/redaction 把三条原子命令塞进 Workflow
  dispatcher；它们仍是 `ActionExecution`，宿主投递使用 `ActionDelivery`，Grant
  revoke 是独立授权动作。
- 不要把当前 claimed-Step / `workflow_step_complete_v1` compatibility name 解释为
  family-care 产品 Workflow；它保持 default-off，等待上游迁移。
- 不要把 Increment 1 checkpoint 描述成 T-005 final completion；第二增量仍是显式未完成范围。
- 不要把 G2-A 描述成一个跨 submit/acknowledge/reply 的“原子闭环”；只有每个
  ActionExecution 各自事务原子，整个多人闭环不是长事务或 Workflow。
- 不要在 G2-B 未完成 correction/withdrawal/redaction/Admin owner-read，或 G2-C
  未完成 dedicated caregiver direct interaction 时把 T-005 标为 done。
- 不要让 T-006 `direct_interaction_required` 复用普通
  `submit_family_care_question`、复制 sensitive source body、自动创建
  CareInteraction 或降级进入 PublishProcess；G2-C 必须是独立 exact-target
  caregiver-initiated capability。
- 不要在 G2-C exact effect/response/Receipt contract 尚未冻结时发布占位 key 或让
  consumer 猜测 capability name/schema。
- 不要让 legacy single status、personal assignment、single reply slot、raw DTO 或
  claimed-Step 与三轴 Harness 双写同一 G2 row；旧 consumer 只能读取单向 derived
  compatibility projection，歧义旧行必须 quarantine。
- 不要让 T-005 G2-C provider qualification 等待 T-006 整体完成；先用 exact
  synthetic consumer fixture 完成 provider handoff，再由 T-006 G3-E 做真实 consumer
  joint qualification。
- 不要把 prepare/execute 两个技术阶段机械映射成两个页面、两次按钮或通用确认弹窗。
- 不要隐藏 submit/reply 的目标、确切正文或 append effect；第一次回复解除待回复
  Attention 但不关闭事项，这一效果必须可见。
- 不要因为 acknowledge 采用单击 UX 就绕过 prepare、owner-reread、expected version 或 CommandExecution。
- 不要把 acknowledge actor 解释为独占 claimant、assignee 或唯一 reply authority；
  当前工作单元是精确 CareGroup，个人身份只用于审计和真实回复作者归属。
- 不要因为“班级共同承接”放宽到同园区或同角色；reply 仍必须匹配原始
  Enrollment/CareGroup/Grant，并重新验证当前照护资格。
- 不要让 Institution Admin、ThreadParticipant 或同园区关系替代 current exact
  CareGroup 的 `caregiver | lead_caregiver` operational role。
- 不要用新的 replacement Grant 接管既有 Item；每次动作都必须重读该 Item 固化的
  exact original Grant。新续接 Item 才从 current eligibility 选择并固化自己的
  original Grant。
- 不要在 Increment 1 隐式实现个人转交；未来 assignment/transfer 必须使用独立契约。
- 不要把 capability concurrency heads 放进 acknowledge/reply 业务 input，或接受
  客户端/LLM 自报；它必须由 prepare 解析并冻结进 confirmation precondition。
- 不要让 reply 对整个 CareItem 使用严格版本 CAS；其他合法回复是兼容 append，
  不应制造虚假 stale。closed/suppressed/authority drift 仍必须失败关闭。
- 不要用可变 reply counter 或未定义的“稳定 sequence”作为顺序事实；使用
  server-issued immutable `replyOrderKey`，并在 exact replay 中返回同一值。
- 不要用 command/idempotency identity 代替 capability precondition；exact replay
  与 lifecycle/authority safety 是不同契约。
- 不要把多位老师的不同 reply command 去重成一条；只对同一 command identity 重放。
- 不要把自然语言“好的/发吧”作为可由 LLM 自行判定的业务 confirmation。
- 不要在 fresh prepare 发现可见语义变化后沿用旧手势执行；必须重新展示并获得新手势。
- 不要用 modal、全局错误 toast 或 Harness/CommandExecution 技术文案打断已经成功、
  already-satisfied、replayed 或语义未变的 transparent reprepare；默认原位收敛。
- 不要为了低打扰隐藏真实的内容、目标、可见 effect 或权限后果变化；这些变化必须
  中止执行并要求 refresh/reprepare/rereview。
- 不要让“已关联孩子”替代发送与读取授权。
- 不要在事务外先校验 authority、再无保护地写入消息。
- 不要把设备端 read 状态当作 canonical receipt。
- 不要静默覆盖已发送内容；更正、撤回和 redaction 必须有追加式证据。
- 不要把 correction、withdrawal、redaction 压缩成通用“删除/撤回消息”：
  correction 作用于内容解释，withdrawal 作用于 CareItem 工作，redaction 作用于内容可见性。
- 不要因为 CareGroup 是业务发送主体就允许一位老师修改/更正/redact 另一位老师的具体
  作者文字；其他老师只能追加新的班级 reply。
- 不要要求 exact author 的历史 RoleAssignment row 仍 current。内容权利绑定
  sender Participant；执行时另外验证 current same-side relationship。管理员
  policy redaction 必须是独立 system capability，不能伪装作者操作。
- 不要在 response 已 responded 后用 correction 改写原家长问题；创建新的续接 Item。
- 不要让 withdrawal 删除问题/回复/Receipt，或把 Grant revoke、caregiver reply
  redaction 伪装成“家长结束事项”。
- 不要把 redaction 实现为物理删除或 `deleted`，也不要级联删除独立作者的回复；
  保留 tombstone/audit，并按 source/reply 各自 cascade。
- 不要用固定 `take` 上限提交部分 redaction cascade；必须分页锁定并循环至闭包，
  使用等价集合更新，或整笔失败。
- 不要因唯一可见 reply 被 redaction 就暗中重开原 Attention；Item 保持可追加，
  replacement reply 使用新的 command。
- 不要宣称已发 push 被 withdrawal/redaction 召回；pending candidate 可跳过，
  已发通知打开时必须 owner-reread 当前 tombstone/closed state。
- 不要让 AI 文案构成诊断、处方或紧急建议。

## Resolved Pitfalls

以下按实现阶段持续追加已解决问题；这里不是当前 blocker 清单。

## G2 实施期的已解决教训(2026-08-01)

以下都是 G2-A 实施中真实发生并已修复的问题,记录成因以免重犯。

- **冻结文档写了约束不等于代码有约束。** cutover C6/C8 明确"新 G2 行唯一
  writer 是三轴 Harness",但三个 legacy 变更器的 where 子句里根本没有
  `writerContract` 过滤,legacy acknowledge 可以写 harness 行(改 legacy
  status 而三轴不动,行自相矛盾)。凡是冻结文档里的安全属性,必须同时落成
  **机械约束 + 负向测试**,并把对应 AC 的"检查类别"真正实现——只分配类别
  不实现,等于没有。
- **作用域放大是最隐蔽的越权。** guardian 的 `scopeType=enrollment` 角色被
  当成"整个 child-care process"来解析,导致同一孩子在另一机构的内容进入
  timeline。教训:把角色 scope 归一化成更粗的键(process/family)之前,先
  确认那是**收窄**还是**放大**;测试要覆盖每一种 scopeType,而不是只用最
  常见的一种。
- **自己写的测试会掩盖自己的 bug。** 续接流程在 query 侧发签名 ref、在
  submit 侧按裸 id 解析,照文档走必然失败;但集成测试直接传
  `sourceItem.id`,于是一路绿。教训:测试要走**对外契约给出的那个值**,不
  要图省事从内部状态取 id。
- **"诚实的错误分类"不能一刀切。** 为实现 `outcome_unknown` 而把所有事务
  异常都改成不可知,反而让确定性守卫失败(必定回滚)也变成"结果不明",比
  原状更糟——测试立刻暴露了它。正确切分:**operation 内部抛错 = 确定回滚**,
  **事务外壳失败 = 不可知**,驱动明确报告的写冲突(P2034/40001)算确定回滚。
- **加了 schema 列不等于有 writer。** D7 的 `resultSchemaVersion` /
  `committedResultPayload` 在 migration 里建好后长期无人写入,reply 算出的
  `replyOrderKey` / first-vs-additional / attention 结果被直接丢弃。schema
  delta 落地后要立刻回头确认"谁写、谁读",否则冻结契约只剩形状。
- **commit message 与记录里的断言也要有证据。** 声称"query 零
  CommandExecution""raw id 不出"时,前者当时无断言、后者与 keyed ref 的实
  现不符。写进记录的每一句保证,要么有机械检查,要么改成实话。
- **固定 `take` 上限的级联是原子性缺陷,不是性能取舍。** revoke 级联沿用
  T-002 的 `take:100`,超出部分静默不处理却照常提交(冻结 D5 早已点名)。
  已改为分页循环至闭包、超界整笔失败。

## G2-B 实施期的已解决教训(2026-08-01)

- **生成 client 也会形成“假类型错误”。** 症状：G2-B 首次类型检查声称 Prisma
  中连既有 G2-A 字段都不存在。根因：migration/schema 已落地，但本地 generated
  client 仍是旧快照。尝试直接改业务类型会扩大错误；实际只运行
  `prisma generate`（无 DB 连接/apply）即恢复。预防：schema/migration 已存在而
  generated types 大面积缺旧字段时，先校验 client 生成时间与 schema hash。
- **FK 指向本次 Execution 时，不能把审计补写放到事务后。** 症状：correction /
  cascade audit 需要 non-null Execution FK，但 domain effect 发生时 Execution 尚未
  create。根因是 kernel 缺少 transaction-local finalization seam。尝试允许 nullable
  或事后 patch 都会制造部分提交窗口；修复为 `afterExecutionCreated`，在同一事务内
  create Execution 后绑定 correction/audit，失败则整笔回滚。预防：遇到“本次
  Execution FK”先画清事务内写入顺序，不用最终一致性代替原子性。
- **清理看似未使用的 cascade 常量会破坏旧路径。** 症状：全套构建报
  `CASCADE_MAX_PAGES` 未定义。根因是只检查了新 redaction 循环，漏看同文件旧
  grant-revoke 两处仍用该上限作为“达到即抛错回滚”的安全界。修复是恢复常量并
  区分注释：旧路径有高上限但绝不部分提交；G2-B redaction 无固定页数、直接闭包。
  预防：机械删除常量前必须 `rg` 全文件引用，尤其同仓库多代路径共存时。
- **源码测试通过不代表 built export 能启动。** 症状：TS/Vitest 全绿，正式
  scenario-service smoke 却因 Node 尝试加载 package root 的 `src/index.ts` 报未知
  `.ts` 扩展。根因：新 HTTP 模块从 package root 导入运行时常量，而该 package 的
  built runtime contract 是 `./harness` 条件导出。修复为统一从
  `@the-nurture/scenario/harness` 导入并重建产物。预防：新增跨 package runtime
  import 后必须跑 built-artifact smoke，不只跑源码测试。
- **live sibling 不是 frozen pin。** 症状：Nurture 包级检查全部通过，但 aggregate
  typecheck 被 My-Chat 当前分支自己的 `AuditAction` 漂移阻断，live pin verifier 也
  看到 Base 已从 `06303e9` 移到 `8649e0e`。根因是本地 sibling 工作副本继续开发，
  不是 W0 固定物化。未修改/重置 sibling；本 checkpoint 使用包级检查、surface
  exact digest 和 W0 pinned evidence。预防：联合资格化必须物化 pinned detached
  checkout，live sibling 只能作便利开发输入，不能冒充 adoption evidence。
