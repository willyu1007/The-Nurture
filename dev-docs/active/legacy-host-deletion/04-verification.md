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

- [ ] scenario-service e2e 全绿（两组路由 + security-boundary 断言翻转）
- [ ] `pnpm test:legacy-host` 全绿（对应路由与测试移除后，population 下限同步）
- [ ] reseal pins 通过

## Wave 3

- [ ] `pnpm test:x5` 全绿（四条 joint 旅程）

## Wave 4（删除闸销项）

- [ ] 条件 1：02-architecture 审计表每行的处置落地（等价覆盖 / 搬迁 / 陪葬）
- [ ] 条件 2：CI/bootstrap 无 legacy 依赖（typecheck / db:generate:all / CI job）
- [ ] 条件 3：README Verify 全清单在删除后通过
