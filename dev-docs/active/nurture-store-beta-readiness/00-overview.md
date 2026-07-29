# Overview — Store Beta Readiness

## Status

- State: planned
- Task: T-008
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-29
- Next step: 待 T-004 至 T-007 进入 qualification 后，建立 Service Candidate inventory、interface contract/证据清单和 My-Chat companion handoff 模板。

## Goal

在 T-004 至 T-007 完成后，冻结并验证一个独立部署的 Nurture 六 surface Service Candidate，提供 conformance suite、接口兼容性矩阵、integration checklist、默认关闭/回滚证据，并协调 My-Chat companion 通过认证接口完成 TestFlight Internal 与 Google Play Internal 真机验证。

## Scope In

- 精确 source revision / dependency pin / contract version freeze。
- Service Candidate identity/digest、bundle freeze 和 rollback evidence；消费 T-004 interface contract identity。
- manifest、module、public API、presenters、fixtures、DB/migration compatibility 的资格检查。
- 六 surface 全旅程与权限/隐私负例。
- Workflow terminology conformance：`InstitutionWorkflow`、projection、ActionExecution、
  ActionDelivery、CareInteraction 与 PublishProcess 不漂移。
- immutable candidate evidence index。
- My-Chat interface integration checklist、consumer conformance 和 composite validation/回滚说明。
- 外部 companion 任务的输入/输出与验收定义。

## Scope Out

- My-Chat app 代码、auth、native/web shell、EAS/signing 或 store credentials。
- 在 The Nurture 仓库直接创建 App Store / Play Console 构建。
- TestFlight External、Play Closed/Open、生产发布或真实流量授权。
- 未经单独批准的 production migration / capability activation。

## Dependencies and Gates

- T-004、T-005、T-006、T-007 全部达到各自 exit gate。
- T-004 已发布可重复验证的 interface contract identity/version/digest 与 compatibility rules。
- T-002 的 source qualification、identity、authority、receipt 和 traffic gates。
- My-Chat companion 只通过版本化认证接口连接测试环境中部署的精确 Nurture Service Candidate，不采用 Nurture 代码或 bundle。

## Acceptance Criteria

- [ ] 候选 revision、依赖 pins、manifest/API/presenter/fixture 版本唯一且不可变。
- [ ] 六 surface 主旅程、权限负例、revoke/correction/replay 和 fail-closed 检查通过。
- [ ] DB/migration 状态可重复验证，且没有未经授权的生产 apply。
- [ ] interface handoff 使 My-Chat 无需导入 Nurture 代码、读取 ORM/DB 或下载 Candidate bundle 即可接入。
- [ ] capability 默认关闭且有明确回滚路径。
- [ ] My-Chat companion 的双平台内部测试结果被准确引用，不冒充本仓库自身分发能力。
- [ ] Web Workflow 操作与 board projection 在同一 contract/version 上通过；family-care
  action、delivery 和 PublishProcess 未被误分类为 Workflow。

## Next Step

待 T-004 至 T-007 进入 qualification 后，建立 Service Candidate inventory、interface contract/证据清单和 My-Chat companion handoff 模板。
