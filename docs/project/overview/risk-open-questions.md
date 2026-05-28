<!-- INIT:STAGE-A:RISK -->

# Risks and Open Questions

## Conclusions (read first)
- Highest risk areas:
  - 把 `The-Parents` 目标原样搬成脱离 `My-Chat` 的独立产品，导致与宿主 surface/runtime 重复。
  - 育儿画像、阶段约束和活动收益模型过度复杂，首版难以落地。
  - 孕期、产后和儿童健康状态相关建议被误解为医疗诊断、处方或急救替代。
  - 私域家庭/儿童数据公开化、索引或通知时发生越权或过度披露。
  - Chat/mobile/forum/RAG 等共享消费者依赖 nurture-specific 内部事件或私有 API，破坏 scenario 可插拔性。
- Biggest unknowns:
  - P0 workflow 已确认包含：孕期阶段管理、长期目标/家庭养育策略、短期照护/育儿安排、活动比较/活动建模、执行记录与复盘学习；健康状态/基础医疗建议作为横向能力嵌入。
  - 育儿发展约束和活动收益模型的初始依据：规则、家庭自定义、社区信号、专家内容或混合模式。
  - My-Chat 当前 runtime/domain registry 已完成程度会影响 The Nurture 的落地顺序。
  - The Nurture 数据库采用独立库还是 My-Chat 同库独立 schema/table group，需要根据 dashboard、chat summary 和 web console 查询路径决定。
  - 公开社区链路首版是否完整接入，还是只生成 handoff/public-ready draft。
- Decisions needed before build:
  - 确定 P0 内第一条实现顺序和 deterministic journey harness。
  - 确定高敏感画像/风险信号的首版边界。
  - 确定孕期、产后和儿童健康状态相关 workflow 的医疗安全边界。
  - 确定 domain context object 的最小集合和 owner namespace。
  - 确定 handoff 目标：forum、knowledge、notification 中哪些进入首版。

## Open questions (prioritized)

1. Question: P0 workflow 的实施顺序和第一条 deterministic journey 选择什么？
   - Why it matters: P0 范围已确认，但 Stage B 仍需要选择第一条最小闭环，驱动 blueprint、scenario manifest、web 操作台、服务端和测试切片。
   - Owner: User
   - Options: 先孕期阶段管理；先长期目标/家庭策略；先短期照护安排；先活动比较；以“长期目标 -> 短期安排 -> 活动比较 -> 执行复盘”为第一条端到端 journey
   - Decision due: Stage B 前

2. Question: 活动收益模型初始依据是什么？
   - Why it matters: 没有明确来源，建议解释容易变成主观文本。
   - Owner: User
   - Options: 专家/规则；家庭自定义权重；社区评分；历史复盘；混合模式
   - Decision due: Stage B 前

3. Question: 高敏感画像和风险信号首版做到多深？
   - Why it matters: 孕产妇、儿童心理/健康相关推断风险高，必须限制自动化结论。
   - Owner: User
   - Options: 首版不做；只做人工确认提醒；低确定性风险信号；开放自动推断
   - Decision due: Stage B 前

4. Question: 基础医疗建议的首版边界是什么？
   - Why it matters: 用户希望加入健康状态和基础医疗建议，但产品必须避免诊断、处方、剂量和急救替代。
   - Owner: User / Safety owner
   - Options: 只做健康记录和就医问题清单；做非诊断性观察建议；加入就医/复诊提醒；接入人工/专业审核；暂不进入 MVP
   - Decision due: Stage B 前

5. Question: 宝妈/准妈妈作为主用户后，canonical object 最小集合如何调整？
   - Why it matters: 孕期阶段需要母亲/准妈妈对象、孕期状态、产后状态和孩子对象之间的生命周期关系。
   - Owner: User / My-Chat architecture
   - Options: Mother object + child object；family object + mother profile；pregnancy episode object；postpartum episode object；先用 generic canonical object 后续拆分
   - Decision due: Stage B 前

6. Question: The Nurture 是否直接使用 My-Chat 论坛/知识链路？
   - Why it matters: 完整 forum/knowledge handoff 会提升价值，但也扩大隐私、审核和范围。
   - Owner: User
   - Options: 首版只生成 public-ready draft；接入 forum handoff；接入 knowledge candidate；forum + knowledge 都接入
   - Decision due: Stage B 前

7. Question: 家庭/宝妈/孩子/目标/活动等 canonical domain objects 由谁拥有？
   - Why it matters: Workflow base 要求 workflow 只消费 domain context refs，不能直接拥有平台 canonical domain registry。
   - Owner: User / My-Chat architecture
   - Options: My-Chat generic domain registry；新增 parenting domain owner；先用 JSON-schema generic owner 后续拆分
   - Decision due: Stage B 前

8. Question: The Nurture 独立场景数据库与 My-Chat canonical object 的边界怎么划？
   - Why it matters: 用户已确认场景可有独立数据库和画像，但画像必须贴附到 My-Chat 对象，不能替代对象身份。
   - Owner: User / My-Chat architecture
   - Options: 只存 scenario profile 和 workflow facts；存场景事实 + canonical object refs；允许缓存只读 object snapshot；禁止复制 identity owner 字段
   - Decision due: Stage B 前

9. Question: The Nurture 数据库物理布局如何选择？
   - Why it matters: 独立 database 有更清晰的场景所有权，同库 schema/table group 通常对 My-Chat dashboard/chat summary 联查和事务边界更直接。
   - Owner: User / My-Chat architecture
   - Options: 独立 Postgres database；My-Chat 同库独立 schema；My-Chat 同库 `nurture_*` table group；先同库后拆分；先独立库并用 projection 优化 dashboard
   - Decision due: Stage B

10. Question: Dashboard 首版覆盖哪些 surface？
   - Why it matters: My-Chat 已有 chat dashboard summary、mobile dashboard cards、web run workbench；The Nurture 还需要深度 web 操作台，二者职责不能混淆。
   - Owner: User
   - Options: 只接入 shared dashboard cards；shared dashboard + web run workbench；shared dashboard + The Nurture web console；三者都进入 MVP
   - Decision due: Stage B 前

11. Question: Calendar/todo 在首版如何处理？
   - Why it matters: 双向同步会显著增加集成复杂度和失败模式。
   - Owner: User
   - Options: 内部 schedule artifact；单向导出；轻量提醒；第三方双向同步后置
   - Decision due: Stage B 或首个实现任务前

## Risks

- Risk: 场景边界膨胀为脱离 My-Chat 的完整育儿产品。
  - Impact: 与 My-Chat 重复建设，初始化无法形成清晰接入边界。
  - Likelihood: High
  - Mitigation: Stage B 明确“可独立 web/server/db，但必须在 My-Chat framework 和 workflow contract 内运行”。
  - Trigger: 蓝图开始定义绕过 My-Chat 对象、权限、handoff、标准事件的产品面。

- Risk: 场景画像替代平台 canonical object。
  - Impact: 同一孩子/家庭跨场景无法共享，权限和数据生命周期失控。
  - Likelihood: High
  - Mitigation: 画像表必须包含 canonical object ref、scenario key、profile version 和 evidence refs；对象身份仍归 My-Chat。
  - Trigger: The Nurture 创建自己的 child/user/family identity 并让其他场景无法引用。

- Risk: Dashboard 查询被独立场景数据库拖慢或形成跨库强耦合。
  - Impact: My-Chat chat/mobile/web dashboard 无法稳定展示 run 状态和 action availability。
  - Likelihood: Medium
  - Mitigation: Stage B 基于 dashboard 查询路径决定同库 schema、table group、projection 或独立库 + read model；shared dashboard 只消费 safe presenter output。
  - Trigger: dashboard 每次展示都需要跨库读取私密场景表或实时计算复杂画像。

- Risk: 活动收益模型缺乏可验证依据。
  - Impact: 建议不可解释，用户信任低，测试无法稳定。
  - Likelihood: High
  - Mitigation: 首版采用规则 + 家庭权重 + 有限历史复盘的透明混合模式，并保留人工确认。
  - Trigger: 需求要求高确定性活动评分但没有来源和证据。

- Risk: 高敏感儿童画像被过度结构化或自动推断。
  - Impact: 隐私、误导和合规风险上升。
  - Likelihood: Medium
  - Mitigation: 首版限制为非诊断性提醒，risk_signal 不进入常规总分，不自动公开。
  - Trigger: 系统输出心理/健康诊断式语言或高确定性结论。

- Risk: 孕产妇或儿童健康建议越过基础信息边界。
  - Impact: 用户可能延误就医或误用建议，产品风险显著上升。
  - Likelihood: High
  - Mitigation: 默认输出健康信息整理、观察建议、问题清单、就医/复诊提示；高风险症状升级到专业医生/急救提示；禁止诊断、处方、剂量和“无需就医”。
  - Trigger: workflow 对症状给出确定疾病名称、药物剂量、检查替代或急救处理。

- Risk: Handoff 泄露私域正文。
  - Impact: 家庭/儿童数据进入论坛、知识库、搜索、通知或 outbox。
  - Likelihood: Medium
  - Mitigation: Handoff/outbox refs-only；public-ready draft 由下游 owner reread、脱敏、确认和审核。
  - Trigger: 事件 payload 或 handoff payload 包含原始聊天、复盘正文、prompt/provider payload。

- Risk: Shared consumers 依赖场景内部 API/事件。
  - Impact: 新场景不可插拔，My-Chat workflow 架构回退为场景耦合。
  - Likelihood: Medium
  - Mitigation: Chat/mobile/forum/RAG/notification 只消费 standard workflow API/events/presenters。
  - Trigger: dashboard 或 worker 订阅 `nurture.*` internal events 作为产品逻辑必要条件。

- Risk: My-Chat host runtime 尚未完全可用。
  - Impact: The Nurture 无法直接运行，只能先产出 contract/module scaffold。
  - Likelihood: Medium
  - Mitigation: 初始化产物先以 contracts、manifest、journey harness 和 adapter skeleton 为目标，依赖宿主实现逐步接线。
  - Trigger: `packages/workflow-runtime` repository/controller/worker 仍是接口或 shell。

## Assumptions register (optional)
- Assumption: The Nurture 是 My-Chat 的 scenario module，而不是独立产品仓库。
  - Validation plan: Stage B 蓝图允许独立 web/server/db，但必须记录 My-Chat framework 接入点和 canonical object attachment。
- Assumption: My-Workflow-Base 的 v0 contract 是接入标准。
  - Validation plan: Stage B 产物必须能映射到 manifest、handler registry、surface adapters、handoff 和 journey harness。
- Assumption: 家庭愿意输入有限结构化信息以换取更可解释的建议。
  - Validation plan: 第一条 journey 将 start requirements 控制在必要字段，并记录完成率。

## Verification
- All unresolved items from other docs are consolidated here.
