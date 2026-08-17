# Verification

按波次记录每次验证的命令与结果。删除闸三条件的最终销项也记录在此。

## Wave 1

- [x] 2026-08-17 `pnpm verify:test-routing` → `[ok] files=212 unit=105
  production-db=61 legacy-host=11 scenario-service=30 x5-joint=5`
- [x] 2026-08-17 `pnpm test:unit` → 105 files / 1146 passed（下限 1133）
- [x] 2026-08-17 `pnpm test:db` → 61 files / 510 passed（下限 499）
- 注：presenter L4 / manifest 收敛 / 投影 handler 层三项为既有覆盖，
  未新增用例（见 01-plan Wave 1 结果）。

## Wave 2

- [x] 2026-08-17 `pnpm --filter @the-nurture/scenario-service typecheck` 通过
- [x] 2026-08-17 `pnpm --filter @the-nurture/scenario-service test` → 213 passed
  （+4 user-attention；security-boundary 断言翻转后全绿）
- [x] 2026-08-17 scenario-service db lane（run-with-local-env）→ 4 files /
  73 passed（+5 growth-record）
- [x] 2026-08-17 `pnpm test:legacy-host` → 18 passed（首跑 12 败为与并行
  dist 重建的瞬态竞争，复跑即绿，见 05-pitfalls）
- [x] 2026-08-17 `pnpm test:x5` → 5 files / 37 passed（两只一次性库：
  nurture_x5 @ docker:5433，my_chat_x5 @ 原生 5432 带 pgvector；
  x5-joint-acceptance 已打 scenario-service 真实 ingress）
- [x] 2026-08-17 scenario-service build + `node scripts/smoke-scenario-service.mjs`
  → `[ok] ... user-attention=disabled growth-record-contribution=disabled`
- [x] 2026-08-17 根 `pnpm typecheck` 通过；`verify:test-routing` →
  legacy-host=9 scenario-service=32；`verify:g2-exit-contract` /
  `verify:persistence-boundaries` / `verify:port-topology` /
  `verify:family-growth-outbox-invariants` / `verify:c30-i3-default-off` 全 [ok]
- [x] 2026-08-17 `verify:c30-i3-owner-adoption` 在批次提交后重封
- 环境性红（非本批引入，记录）：`verify:workflow-contract-pin` 因共享
  sibling My-Chat 已推进（4cd58f8 > 钉 8cbdc30）本地必红，CI 用钉住检出
  不受影响；`verify:g2-exit-db-census` 是全新库普查，本地长期库有历史
  protected 行必红。

## Wave 3

- [x] 2026-08-17 `pnpm test:x5` 全绿 → 6 files / 40 passed（新增
  `t014-host-runtime-joint` 3 用例；双库配方见 03-implementation-notes）
- [x] 2026-08-17 `pnpm verify:test-routing` → files=213 x5-joint=6
- [x] 2026-08-17 根 `pnpm typecheck` 通过
- 注：四条旅程的产物腿被真 kernel 的物化缺口挡住，等价目标据实改为
  「缺口显式钉住」，见 01-plan Wave 3 结果。

## Wave 4（删除闸销项）

- [ ] 条件 1：02-architecture 审计表每行的处置落地（等价覆盖 / 搬迁 / 陪葬）
- [ ] 条件 2：CI/bootstrap 无 legacy 依赖（typecheck / db:generate:all / CI job）
- [ ] 条件 3：README Verify 全清单在删除后通过
