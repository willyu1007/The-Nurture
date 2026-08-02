# G2-A Checkpoint Record — Core CareInteraction Loop

## Outcome

- Task: T-005
- Slice: Stage G2-A checkpoint(01-plan `G2-A — Core CareInteraction Loop
  Checkpoint` 清单资格化;G2-10 第 4 步)
- Executed: 2026-08-01(本地,disposable PostgreSQL,运行后销毁)
- Result: `G2A_CHECKPOINT_PASS / INCREMENT2_PENDING / G2C_PENDING /
  T005_EXIT_NOT_CLAIMED`
- 效力:G2-A 是可演示、可资格化的中间 checkpoint,不是 T-005 final Exit。
  correction/withdrawal/redaction(Increment 2)、G2-C direct-interaction
  bridge、`InstitutionBusinessCommunicationProjectionV1` 与最终 G2 Exit
  Qualification(经 formal ingress + real pinned owner path 的联合资格化)
  全部明确未完成。所有 capability/consumer 保持 default-off,无 discovery
  发布、无 T-004 digest 变更、无持久化 DB/secret/激活/流量。

## Bound Inputs

- G2-0 schema freeze:`10-g2-schema-freeze.md`(三轴 delta、cutover C1–C8、
  G2-C Message-only 决策、AC `T005-AC-001..022`)。
- G1 三类输入:T-004 exact `nurture.surface-contract@1.7.0` /
  `sha256:b7691a81…`(每单元经 `pnpm verify:surface-conformance` 重证
  digest 不变)、T-002 M5 owner pins(My-Chat `a019566` / Base `06303e9`)、
  G1 Joint Conformance PASS
  (`../nurture-institution-mode/18-g1-joint-conformance-record.md`)。
- 实现证据提交链(全部含逐单元验证):`f167079`(G2-0 freeze)→
  `6eb1dee`(三轴 migration)→ `6baa192`(Harness kernel/protected
  content)→ `217564c`(submit 纵切)→ `c55b451`(ack/reply 纵切)→
  `2435f1e`(formal ingress 挂载)→ `d3e2dc0`(query lane)→ 本记录
  随 checkpoint 缺口测试提交。

## Checklist Mapping(01-plan G2-A 清单 → 机械证据)

| 清单项 | 证据 |
| --- | --- |
| 三个 action 同一 Harness/CommandExecution contract | HTTP 全链路 e2e(`harness.db.e2e.test.ts`:submit→ack→reply 经同一 prepare/execute 路由与 runner)+ 三个纵切集成套件 |
| ack actor 仅审计、班级共同承接、同班他人可回复 | `g2-item-actions`:`ackedBy*` 审计、`assignedToRoleAssignmentId` 恒 NULL、A ack 后 B reply、reply 不要求 replier=acknowledger |
| 跨 CareGroup、过期角色、非照护者、Admin 不能借"园区/同角色"获权 | `g2a-checkpoint`:authority matrix(cross-group caregiver、endsAt 过期、guardian-as-caregiver 全 denied 零写入)+ `g2-item-actions`(Admin-only、伪造 ref) |
| 两名同班照护者并发 reply 均提交、immutable `replyOrderKey` 排序 | `g2a-checkpoint`:真并发 `Promise.all`(SSI 可重试收敛)→ 双 applied、orderKey 严格有序、responseHead=1、Attention 恰一次 resolve |
| 同一 command retry 只 exact replay 一条 | `g2-item-actions` replay 用例 + `g2a-checkpoint` duplicate click(并发双击 → {executed, replayed},恰一条 reply) |
| 第一条 reply 解除待回复 Attention、后续不重复、Item 保持 active/appendable | `g2-item-actions` first/additional 用例;Increment 1 无显式 close action |
| 家长继续提问创建新 Item;continuation 不影响授权/状态/依赖 | `g2-submit`:continuation 资格(responded 前 denied)、新 Item 新 grant/command identity、关联仅展示 |
| happy path / duplicate click / concurrent execute / response loss / stale Grant / outcome-unknown safety | happy(三纵切+HTTP loop);duplicate/concurrent(`g2a-checkpoint`);response loss = committed exact replay(HTTP loop consumed-ref replay);stale Grant at execute(`g2a-checkpoint` revoke→blocked 零写入);outcome-unknown:ingress 不产生 unknown——事务 rollback 即确定 not_committed,响应丢失由同 command replay 恢复(kernel 语义,HTTP loop 证明) |
| Chat/Board 等价 | `g2a-checkpoint`:两 surface 全流程 canonical 效果字段级同构 + 拒绝类别一致;跨 surface confirmation 复用被 kernel 拒(`harness-confirmation` 套件) |
| 泄漏 census | `g2a-checkpoint`:workspace 级七表 dump 零命中(两侧明文、confirmation token、`protected_content_ref`);query 层 raw id 不出、revoke content fence、redaction tombstone(`g2-query-lane`) |
| Increment 2 / G2-C 未完成不宣称 Exit | 本记录 Outcome 栏 + 00-overview 状态行 |

## Acceptance-to-Check Mapping 续编(G2-A 范畴;ID 自此稳定)

| AC ID | 条目(摘要) | 检查类别 |
| --- | --- | --- |
| T005-AC-023 | 三 action 收敛同一 Harness/CommandExecution contract | integration test |
| T005-AC-024 | acknowledge 仅审计归属;无个人 assignment;班级共同承接 | integration test |
| T005-AC-025 | 跨组/过期角色/非照护者/Admin-only/guardian 冒充全 fail closed | negative case |
| T005-AC-026 | 并发独立 reply 均提交且 `replyOrderKey` immutable 有序 | integration test |
| T005-AC-027 | 同 command retry 精确重放,不追加第二条 | integration test |
| T005-AC-028 | duplicate click 收敛为一次 effect + exact replay | integration test |
| T005-AC-029 | 首条 reply 解除 Attention、后续 unchanged、Item appendable | integration test |
| T005-AC-030 | continuation 不继承 Grant/authority/state/SLA/幂等身份 | negative case |
| T005-AC-031 | prepare 后 Grant 撤销 → execute fail closed 零写入 | negative case |
| T005-AC-032 | Chat/Board canonical effect 与拒绝等价;surface 不入 authority/replay identity | integration test |
| T005-AC-033 | workspace 级泄漏 census:明文/confirmation token/内部 ref 零出现 | evidence census |
| T005-AC-034 | query 投影 role-safe:raw id 不出、revoke content fence、tombstone、keyed cursor | integration test |
| T005-AC-035 | success/already-satisfied/replay 原位低打扰收敛(UI 侧无二次弹窗) | design_note(结果语义已机械化:`already_satisfied`/`replayed` 判定;UI 呈现属 My-Chat 消费约定) |

已分配 ID 不可变更或复用;G2-B/G2-C/Exit 冻结时继续编号。

## Evidence Summary(checkpoint 运行时全套)

- 新增 checkpoint 缺口套件 6/6(authority matrix、真并发、duplicate click、
  stale grant at execute、surface equivalence、leakage census)。
- production-db 78/78(floor 72→78,文件 11→12);unit 265/265;
  scenario-service 46/46 + db 8/8;dev-host 26/26;routing 63 files
  (29/12/11/10/1);root typecheck clean。
- `pnpm verify:surface-conformance`:digest 不变 `1.7.0`/`b7691a81…`;
  formal-ingress 守卫 `routes=6`;smoke 三重 disabled。
- self-pin 维持 `197618fb…`(本单元仅测试/守卫/文档变更,pin 集未动)。

## Boundary and Next

- 本 checkpoint 不是 G2 Exit Qualification:最终 Exit 仍须按 01-plan 在
  formal NestJS ingress + real pinned owner path 上运行联合 suite
  (含 x5 侧 ActionDelivery 衔接)并引用 G1 三类输入。
- 下一主线:Increment 2(correction / withdrawal / redaction,
  `07-increment-2-change-contract.md` 为 normative)→ G2-B(含
  `InstitutionBusinessCommunicationProjectionV1` owner-read)→ G2-C
  (Message-only 契约已冻结,digest rotation 随下一 pin action)。

## Follow-ups Found After This Record (2026-08-01 自查)

本记录发布后的实施质量自查(opus-5,覆盖 `f167079..f343eb1`)发现并已修复
下列问题;checkpoint 结论不变,但这些修复是其证据基础的一部分:

- 冻结 C6/C8 的 single-writer 属性此前**没有机械保证**:三个 legacy 变更器
  可写 harness 行。已加 `writerContract` 前置并以新套件兑现
  `T005-AC-007`(此前该 AC 有检查类别、无实现)。
- grant revoke 级联对 harness 行漏推 lifecycle 轴,且两处固定 `take:100`
  存在冻结 D5 点名的部分提交风险。已改为闭包循环 + 三轴同步。
- `readResult` 曾接受调用方 raw item id;已改为按 command identity 解析并
  校验执行归属。
- 分页在过滤不可投影行时可能提前终止;已改为按扫描源记录分页。
- query lane「零 CommandExecution」此前无断言(记录与 commit 均已声明),
  现已补齐。

结论层面的补记:六个 G2 capability 与 09 号 shared referenced types 尚未
进入 T-004 interface digest。这不影响 G2-A checkpoint(default-off、未发布
discovery),但属 **G2 Exit 前置债务**,与 G2-C 的 digest rotation 同批在
下一个 pin action 处理。
