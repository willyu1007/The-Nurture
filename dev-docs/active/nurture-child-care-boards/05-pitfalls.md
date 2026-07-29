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
- 不要把拍照、录入、上传或 AI 整理成功等同于已经创建家庭发布候选。
- 不要让 `PublishProcess` 吸收设备上传、provider job、CareInteraction、
  ActionDelivery 或 InstitutionWorkflow 的状态。
- 不要把 `published` 展示成通知、provider 或设备已经送达。
- 不要把拍照成功等同于媒体已授权、已归属或已发布。
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
