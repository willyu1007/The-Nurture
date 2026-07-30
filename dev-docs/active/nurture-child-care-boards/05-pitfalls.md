# Pitfalls — 儿童照护双看板

## Known Guardrails

- 不要为两个 board 各建一套不可同步的 child state。
- 不要把“derived snapshot 不是 canonical fact”误解为“看板只能只读”；看板可以原地
  微调，但业务修改必须进入正确的 canonical owner capability。
- 不要直接 patch snapshot/cache 并把客户端 optimistic state 当成已提交事实、权限、
  Receipt 或 ActionDelivery。
- 不要为复用方便创建包含 Guardian/Caregiver 全部字段的跨角色超级 DTO，再依赖
  presenter 隐藏敏感字段。
- 不要让 AI 建议自动进入已发布家庭记录。
- 不要假设每张照片都需要 AI 写一句话；自动 photo-first 路径优先老师原文、语音转写
  和确定性模板，photo-only 没有自由正文也成立。
- 不要在日常自动整理中静默调用 copy provider；只有老师显式请求或独立总结能力才可
  生成 suggestion，且选择采用后才改变 draftRevision。
- 不要让 AI 文案覆盖老师原文、补齐不存在的事实，或把观察改成情绪、动机、性格和
  发展结论；不确定性、否定、引语、数值与 source refs 必须保留。
- 不要因 copy provider 失败、malformed output 或低置信阻塞原文/转写/模板/photo-only
  主路径，也不要保存 chain-of-thought。
- 不要让 classifier、老师或园区设置成为最终 safety tier owner；Nurture
  ContentSafetyPolicy 最终派生 route，硬规则先于模型 signal，园区只能收紧。
- 不要把 direct-interaction-required 塞成第六个 PublishProcess state；它是创建候选前
  或发布前派生的路由/eligibility 结果。
- 不要把磕碰、健康/用药、明显情绪行为事件、身体隐私或证件联系方式混入自动批量
  发布；保留内部来源并让本班老师显式进入 T-005。
- 不要因路由到 T-005 就自动创建 CareInteraction、复制敏感 body 或假设 child/family
  target；T-006 只能输出 owner-issued navigation/action，老师明确选择后由 T-005 owner
  创建。
- 不要假设现有普通 family-question action 能承接 caregiver 发起的健康/用药等敏感
  事项；专用 T-005 capability 未交付或当前不可用时必须安全阻塞，不能降级批量发布。
- 不要在 provider failure、低置信、规则冲突或 policy drift 时默认 ordinary；既有
  draft/pending 必须失去 publish eligibility，但不能发明新 lifecycle state。
- 不要把拍照、录入、上传或 AI 整理成功等同于已经创建家庭发布候选。
- 不要在单次拍照、上传完成或 media ready 后立即启动 30 秒；先进入待整理采集批次，
  只有 manual 或园区策略 trigger 按 stable source watermark 切批并提交普通、高置信
  draft 后才启动。
- 不要让新的拍摄无限重置同一个倒计时，也不要把仍在上传的媒体塞入已切出批次；
  watermark 之后和未稳定内容进入下一批。
- 不要把设备后台 timer 当作整理 trigger；10 分钟静默期与“默认发送前 30 分钟”兜底
  使用服务端时间、园区 timezone 和版本化 policy，且园区可以调整/关闭或切为全手动；
  兜底先标记 due，再通过一分钟 quiescence gate 防止打断正在进行的活动。
- 不要把一分钟无操作实现成新的自动整理 trigger；它只在其他自动 trigger 已 due 时
  判断是否可以切批。正常 10 分钟 idle 不再重复等待，手动“整理”直接绕过。
- 不要让上传进度、缩略图、同步 heartbeat 或 provider job 重置/阻塞 quiescence；
  它只观察本班老师的采集、增删、选择、编辑和短期 capture-activity lease，未稳定
  上传按 watermark 进入下一批。
- 不要把 capture-activity lease 变成个人 claim、业务 authority、PublishProcess state
  或长期锁；它只延迟自动切批并必须短 TTL 失效。
- 不要把 30 秒超时等同于发布、Receipt 或 AI 获得授权；它只把普通、高置信候选移入
  待发送队列，产品文案也不得写成“30 秒后发布”。
- 不要在用户正在编辑或存在未保存 revision 时让 scheduler 发布旧版本。
- 不要增加 5 分钟/24 小时发布后复查窗口、老师待办或持续内容运营义务；低频
  correction/visibility removal/replacement/redaction 能力不需要快捷窗口。
- 不要把允许少量可纠正错误解释为跨家庭隐私豁免、敏感内容自动发布或教师质量评分。
- 不要让 `PublishProcess` 吸收设备上传、provider job、CareInteraction、
  ActionDelivery 或 InstitutionWorkflow 的状态。
- 不要把 `published` 展示成通知、provider 或设备已经送达。
- 不要因为多个家庭目标而给老师复制多张相同编辑卡片；共享内容只维护一个
  `PublishProcess` revision。
- 不要把一个多家庭 UI 批次实现成跨家庭全有或全无事务；每个
  `PublicationRelease` 必须独立授权、提交、回执和重试。
- 不要在共享 revision 内隐藏 target-specific 正文或 media 组合；内容不同就拆分
  `PublishProcess`。
- 不要用 process 级“已发布给 N 个家庭”汇总代替逐目标 authority、Receipt 或明确的
  partial result。
- 不要把 needs_review 变成每条普通内容都必须经过的审核关卡；它只承接低置信、归属
  不明确或 D-15 可修正灰区。direct-interaction-required 不能借 needs_review 回到
  批量发布。
- 不要为 scheduled、sending、failed、delivered、corrected 或 partially_released
  扩张 `PublishProcess` 主状态；分别使用属性、execution、逐目标结果、ActionDelivery、
  后续事实或派生 summary。
- 不要在首个 target release commit 后继续修改共享 revision、退回 draft 或整体
  cancel；未提交目标只能按冻结版本重试。
- 不要把 released+partial 的“未按时发送”当成重新编辑原卡片的入口；若正文、媒体组合
  或目标语义需要变化，创建新的 `PublishProcess`/replacement。
- 不要在零目标成功时把 process 标成 released，也不要在部分成功时只显示笼统的
  “已发布”而隐藏未发送目标。
- 不要给 T-006 增加 Lead review gate，也不要把 Lead designation、Institution Admin、
  园区成员或 system operator 当成班级内容 authority；Lead 留给园区运营管理。
- 不要把 process 创建者变成 owner、claimant 或唯一 reviewer；同一 exact CareGroup
  的当前本班老师共同处理，个人身份只保留审计和可选署名。
- 不要因为园区级异常需要运营处理就把 InstitutionWorkflow 或 Lead 审批塞进
  PublishProcess；通过 T-007 独立边界处理。
- 不要把 T-006 publication correction 与 T-005 exact-author Message correction
  混为一条 capability；班级共同责任不能越权改写另一位作者的 CareInteraction Message。
- 不要把 My-Chat local working buffer、saving 状态或设备时间戳当成 canonical draft
  或可发布 revision；发布只绑定 Nurture 已提交的 exact draftRevision。
- 不要用 last-write-wins 静默覆盖另一位老师的修改；expectedDraftRevision drift 必须
  conflict/rebase。
- 不要把短期 edit hold 解释成个人认领、内容 owner、业务 authority 或新的
  PublishProcess state；它只协调单一编辑者并暂停 scheduler。
- 不要允许设备离线修改、取消或声称暂停已经 pending_release 的内容；没有在线 hold
  就无法可靠阻止服务端发送。
- 不要在 saving/failed、hold active 或未保存本地变更存在时从旧 snapshot 推断发布
  内容；scheduler 只能采用 owner-reread 后的已保存 revision。
- 不要让 pending-release 内容再次逐条审批，也不要给“现在发送”增加重复确认弹窗；
  explicit tap 和完整发布门禁已经构成确认边界。
- 不要使用设备时钟、UI 批次或 notification quiet hours 判断 Nurture 发布时间；
  scheduledAt/notAfter 由园区 timezone 与服务端时钟解释。
- 不要让园区默认时段变化静默移动已有卡片，也不要在 19:00 cutoff 后深夜发送、自动
  顺延第二天或丢弃内容；保持真实状态并显示 missed-send attention。
- 不要在 scheduler 中静默选择另一位老师替代失效 authorizing RoleAssignment；需要
  当前本班老师重新处理。
- 不要对 authority/policy/target/media rejection 盲目重试，也不要为
  outcome-unknown 创建新 command；先以原 identity reconcile。
- 不要把 upload completed、media ready、attribution confirmed 与 published 压成一个
  状态；三个 owner 轴分别解释。
- 不要把 ready 当成 publishable；群像中任一清晰可见孩子未确认或不允许目标 audience
  查看时必须 needs_review，并通过纠正、整图移除、目标调整或拆分解决。
- 不要 crop、blur、美化或生成供发布使用的视觉变体；发布始终绑定 exact unchanged
  original-media revision。
- 不要把通用 LLM 的识别猜测当作孩子归属。首轮自动确认只允许专用、版本化
  `ClassScopedFaceMatch` 在当前 exact CareGroup、授权头像 reference set 和高置信
  quality/top-1/margin 门禁内执行。
- 不要为提高 recall 降低阈值、跨到全园/其他班/离园历史库或启用跨照片
  `history_match`；不确定结果进入 needs_review，只让老师处理异常。
- 不要把 raw child/family ID、姓名、家庭关系、原始人脸或可逆模板交给 matcher/
  普通日志；使用 owner-issued opaque refs，reference template 按班级/用途加密隔离，
  临时照片 embedding 匹配后删除。
- 不要在专门告知、单独同意/监护人同意、PIPIA、retention、撤回、processor contract
  或正式隐私评审缺失时启用人脸匹配；园区开关不能覆盖逐孩子/逐目的授权。
- 不要原地覆盖 media ref 或已确认 attribution；使用 exact revision 和 superseding
  fact。
- 不要把“从卡片删除”实现成全局删除，也不要在已有 committed release 后 discard
  asset；发布后使用 target removal/redaction。
- 不要让产品“删除”硬删 Receipt、CommandExecution 或审计，也不要宣称召回已查看/
  下载媒体或已发通知；storage GC 另受引用与 retention/privacy policy 控制。
- 不要把拍照成功等同于媒体已授权、已归属或已发布。
- 不要把 My-Chat 本地缓存、文件路径或上传进度当成 Nurture canonical media fact 或
  authority；logout/撤权/owner-reread denial 后不能继续展示受保护缓存。
- 不要展示其他孩子、家庭或 class draft 的内容。
- 不要使用“评分”“排名”“风险等级”等竞争性或诊断性表达。
- 不要在 publish 事务外生成孤立 receipt。
- 不要把 `PublishProcess` 因为包含多个状态或异步发送就叫作 Workflow。
- 不要让 board 直接读取/修改 Workflow Run/Step；只能消费 role-safe projection 并调用
  versioned capability。
- 不要把“角色相同”当成 Workflow projection 的充分权限。
- 不要把 teacher-board acknowledge actor 投影成独占负责人；班级共同责任不等于
  同园区共享权限，action 仍绑定原始精确 CareGroup。
- 不要把第一条班级回复当成 unique/terminal reply；同班合法回复是追加集合，
  但只有第一条解除待回复 Attention。

## Resolved Pitfalls

当前尚未进入实现阶段。问题解决后记录 symptom、root cause、attempts、fix 和 prevention。
