# Architecture — Store Beta Readiness

## Candidate Composition

一个合格候选至少包含：

- Nurture source revision。
- My-Workflow-Base / My-Chat owner contract revision 或 artifact hash。
- scenario manifest 和 public module contract。
- presenter/view-model contract versions。
- DB schema/migration state。
- fixture dataset version。
- conformance suite revision 与 evidence index。

T-008 owns Service Candidate identifier/digest、canonical bundle composition、freeze、qualification 与 rollback。它消费 T-004 已发布的 interface contract identity；不会把 Candidate ID 反向写入普通业务请求或 Nurture authorization。

## Trust Boundary

The Nurture 的证据证明领域能力、权限、持久化、接口和 presenter 契约。My-Chat 的证据证明接口集成、native/web rendering、auth、device capability、build/signing 和 store distribution。My-Chat 不采用 Nurture 代码或 Candidate bundle；两侧证据通过 composite validation binding 连接，不能相互代替。

## Conformance Interface

My-Chat companion 应能：

- 启动受控 scenario consumer。
- 装载合成 fixture 或调用受控 seed contract。
- 通过公共 query/command 完成六 surface 旅程。
- 对照稳定 view-model 与错误码。
- 在缺 pin、错 pin、无 grant、撤权和离线/重试条件下验证 fail closed / recovery。

不得：

- 直连 Nurture DB。
- import Nurture ORM。
- 从 PII 生成 canonical identity。
- 用 mock 成功代替 Nurture receipt。

## Compatibility Matrix

矩阵至少记录：

- Nurture Service Candidate ↔ Base/My-Chat owner contract dependencies。
- Nurture Service Candidate ↔ interface contract version/digest。
- My-Chat backend/app build ↔ interface contract version/digest。
- iOS build/version ↔ test environment/Nurture Service Candidate binding。
- Android build/version ↔ test environment/Nurture Service Candidate binding。
- fixture/evidence revision ↔ Nurture Service Candidate。

## Rollback Boundary

- Nurture：保持 gate off、回退/部署前一个已验证 Service Candidate，或发布修复候选。
- My-Chat：回退到与前一个服务候选兼容的 backend/app build，停止分发或撤回测试 build。
- 数据库：只有单独批准的 repo-SSOT migration 才能 apply；不得以 beta 紧迫性跳过。

## Completion Semantics

T-008 完成表示“一组精确的 My-Chat build、Nurture Service Candidate、interface contract digest 与测试环境绑定已通过本地 qualification 和双平台内部真机验证”，不表示 external beta、生产上架或 Pilot 流量获准。
