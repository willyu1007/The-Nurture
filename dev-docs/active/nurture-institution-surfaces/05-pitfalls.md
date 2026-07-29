# Pitfalls — 机构端双 Surface

## Known Guardrails

- 不要把 institution membership 当作读取全部 child/family facts 的权限。
- 不要通过 aggregate 间接泄漏小样本家庭或孩子。
- 不要聚合家庭 AI 私密正文或未显式发送的内容。
- 不要让 read-only mobile board 出现隐藏写操作。
- 不要把 support signal 设计成排名、绩效或诊断分数。
- 不要因 T-003 的框架 demo 而虚构尚未确认的机构管理功能。
- 不要因为 capability 异步、跨 owner 或需要通知就把它定义为 Workflow；当前 Workflow
  只指园区管理 `InstitutionWorkflow`。
- 不要让 mobile board 拥有或修改 Workflow；它只消费 role-safe projection。
- 不要把相同 institution role 当作读取完整 Workflow 的充分权限。
- 不要用无业务依据的百分比冒充进度；优先展示阶段、里程碑、阻塞和下一步。

## Resolved Pitfalls

当前尚未进入实现阶段。实际问题解决后补充完整历史。
