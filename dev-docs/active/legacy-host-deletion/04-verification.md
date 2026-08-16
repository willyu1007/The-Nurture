# Verification

按波次记录每次验证的命令与结果。删除闸三条件的最终销项也记录在此。

## Wave 1

- [ ] `pnpm test:unit` 全绿（新增 presenter L4 / manifest 收敛 / handler 同构用例）
- [ ] `pnpm test:db` 全绿（新增项目仓库隔离 / 时间线 / 画像投影用例）

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
