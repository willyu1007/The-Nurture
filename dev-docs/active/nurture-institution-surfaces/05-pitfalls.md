# Pitfalls — 机构端双 Surface

## Known Guardrails

- 不要把 institution membership 当作读取全部 child/family facts 的权限。
- 不要通过 aggregate 间接泄漏小样本家庭或孩子。
- 不要聚合家庭 AI 私密正文、未发送草稿或 My-Chat 私人聊天；园区业务沟通必须走
  exact owner-read projection，不能成为 ambient aggregate。
- 不要用园区统一时间线覆盖班级独立日程，也不要假设所有班级同时开展同一活动。
- 不要把“未发现活动记录”显示成“活动未开展”，或把记录数量变成老师绩效。
- 不要让生成式/审美 AI 挑“最佳代表照片”。班级卡使用可选显式封面或确定性最新
  合格照片，并对 source revoke/redaction/reassignment 重新计算。
- 不要要求老师为每个活动额外挑封面；封面只是 Web/既有整理流程中的可选能力。
- 不要在班级卡展示沟通正文、孩子名单、AI 出勤推测、匹配 confidence/embedding 或
  freshness/绩效分数；完整数据属于详情/Web 的精确 owner-read。
- 不要因为 Admin Web 能记录完整照片/文字就允许原地改写老师内容、作者或时间。
  placement/child-association/correction/hide 必须追加 revision 并保留来源历史。
- 不要让 My-Chat Web shell 复制照片/文字 canonical facts；完整数据仍由 Nurture
  持有，Web 通过 query/action contract 操作。
- 不要要求老师升级后 Admin 才能查看已明确披露的园区业务沟通。
- 不要把 Admin 的园区业务沟通读取权扩大到家庭私密 AI、草稿、私人聊天、其他
  Institution，或误当成 CareGroup reply/author-change 权限。
- 不要让后置 AI attention 扩大读取范围、保留已 redacted/revoked 摘要、自动回复/
  建 Workflow，或形成情绪/责任/绩效评分。
- 不要让 read-only Admin mobile board 出现隐藏写操作。
- 不要把 Admin mobile 的只读约束误套到 caregiver mobile；老师出勤提交是独立的
  role-bound capability。
- 不要为多角色用户合并 board/Web 权限；必须显式切换 active role。
- 不要把 Lead 当作园区负责人、独立角色或权限捷径。
- 不要让非 Admin 角色进入 `InstitutionAdminWorkbench`，仅隐藏菜单不等于授权。
- 不要把 support signal 设计成排名、绩效或诊断分数。
- 不要使用红黄绿班级状态、跨班/跨老师百分位、历史异常基线或隐藏 AI risk score
  生成 support signal。
- 不要在园区未配置绝对 count/window 时猜测负荷阈值；该类 signal 应保持 disabled。
- 不要让 AI 决定“需要处理”。只有明确 canonical overdue/blocker 可以进入该级别；
  未来 AI candidate 最多是“建议关注”。
- 不要仅因缺少照片/文字生成 support signal；无记录不等于活动未开展。
- 不要把 signal 复制成长期老师/班级“标红”历史；来源解决或失效后投影应自动消失。
- 不要让 mobile signal 卡产生 dismiss/ack/escalate 隐藏写操作，或自动回复、通知、
  创建 WorkItem/Workflow。处理必须在 Web 通过独立 source action 完成。
- 不要把 body、孩子名单或个人老师指标放入园区首页 signal；下钻必须重新 owner-read。
- 不要把“有业务记录的孩子数”当作正式出勤人数。
- 不要让 AI 推理或 Admin 代替当前班级老师确认出勤。
- 不要在跨日修订时绕过 Admin reopen 和老师重新提交，也不要丢失 revision 审计。
- 不要因 T-003 的框架 demo 而虚构尚未确认的机构管理功能。
- 不要因为 capability 异步、跨 owner 或需要通知就把它定义为 Workflow；当前 Workflow
  只指园区管理 `InstitutionWorkflow`。
- 不要在第一增量注册多个园区 Workflow；当前只选择完整的
  `EnrollmentJourneyWorkflowV1`，其他事项继续使用 Action/WorkItem/projection。
- 不要把所有等待泛化成“等待期”。`capacity_waitlist` 只表示目标班级满员；等待
  Guardian/caregiver/system、未来日期或 blocker 是独立 state。
- 不要让候补阶段演变成家庭价值、转化概率或孩子适配排序；AI 不决定候补顺序或
  试入园结果。
- 不要在意向阶段 mint/infer My-Chat child/family identity，或把 provisional record
  当成 Enrollment、binding、Grant 或读取权限。
- 不要在缺少 Guardian trial consent 时开始试入园，或在没有 current binding/Grant
  时把试入园照片/文字投影给家庭。
- 不要为了 Workflow 给 caregiver 创建 Admin Web；老师继续在 exact trial CareGroup
  的 role-bound mobile/action 中记录，Workflow 只引用授权事实。
- 不要在 Enrollment 激活时自动结束 journey。适应期是后续业务阶段，但不得生成
  孩子适应评分。
- 不要把当前顶层阶段标签误作已冻结 public enum/schema；六组 D-07 细节未收敛前
  implementation activation 保持 NO-GO。
- 不要让 Admin mobile board 拥有或修改 Workflow；它只消费 role-safe projection。
- 不要把相同 institution role 当作读取完整 Workflow 的充分权限。
- 不要用无业务依据的百分比冒充进度；优先展示阶段、里程碑、阻塞和下一步。
- 不要因为园区材料被 AI 引用就把它显示成权威医疗来源。
- 不要在园区材料与权威材料发生医疗冲突时由模型静默拼接或自行裁决。
- 不要让 draft、已撤回/过期材料或未授权 child facts 进入线上 RAG。
- 不要让 RAG 发布知识、确认出勤、执行 Workflow、诊断、处方或替代急救。

## Resolved Pitfalls

### 2026-07-30 — 出勤覆盖率被误读为正式出勤

- Symptom：最初讨论可能把“当天有几个孩子存在业务记录”直接呈现为出勤。
- Root cause：混合了运营覆盖 projection、AI inference 和 canonical attendance。
- What was tried：以记录数量自动生成出勤结果。
- Fix：记录覆盖单独展示；AI 仅在每日提交时推理，当前班级老师明确提交后才形成
  正式出勤，Admin 只负责监督/reopen。
- Prevention：schema、presenter 和测试均须使用不同类型，禁止覆盖率字段进入
  attendance write path。

### 2026-07-30 — 将来源可信度错误等同于园区编辑权限

- Symptom：初始建议限制园区编辑医疗正文，与园区知识自主编辑需求冲突。
- Root cause：把“权威来源身份”和“园区内容编辑权”合并成一个 policy。
- What was tried：只允许园区选择不可变的权威医疗基线。
- Fix：园区 Admin 可编辑/发布医疗知识并关联权威来源；RAG 明确显示来源身份，医疗
  冲突时 abstain 并进入复核。
- Prevention：知识 revision 必须分别建模 author/publisher、source provenance、
  safety class 和 retrieval/citation policy。

### 2026-07-30 — 将老师升级误作 Admin 沟通可见性条件

- Symptom：最初把“老师明确升级”作为园区管理者查看班级家园沟通的前置条件。
- Root cause：没有区分从发送前即披露的园区业务沟通与家庭私密/个人聊天。
- What was tried：Admin 默认只看状态，老师升级后才可读正文。
- Fix：园区业务渠道从发送前明确 Admin 监督读取用途；Admin 可在 exact
  Institution/Enrollment/CareGroup/Grant/purpose 下只读，无需老师升级。家庭私域
  继续不可见。
- Prevention：消息/投影必须携带 channel class、disclosure、purpose 和 source
  lifecycle；Admin read 与 CareGroup action authority 分别测试。
