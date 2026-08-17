# Pitfalls

## 已解决

- 2026-08-17（Wave 2）：`pnpm test:legacy-host` 首跑 12 个用例 500 全败，
  复跑全绿。原因是共享工作区里另一会话/前一命令触发的
  `build:binding-owner-runtime` dist 重建与测试进程竞争（vitest 经
  node_modules 链接消费包 dist）。判定手法：只有触碰 dev-host 库的路由
  500，仅用生产库的 p4 与无库的 guard 均绿，且 tsx 直连探针 201——
  排除代码回归后复跑即可。
- 2026-08-17（Wave 2）：smoke 的 parent-communication 断言
  `service_unavailable` 其实依赖 CI 注入的 DATABASE_URL 走深层分支，
  本地从来就跑不过。子进程 env 钉 `DATABASE_URL: ""` 后所有 fail-closed
  分支确定化，断言改为 `parent_communication_owner_disabled`。
- 2026-08-17（Wave 2）：`verify:g2-exit-db-census` 是「全新库普查」型
  gate（期望 0 行 active protected storage），本地长期开发库必红；
  只在 CI 的 fresh 库上有意义，不要试图在本地修它。

预先记录的已知约束（非失败，避免踩坑）：

- 不得用「新建 dev host」替代删除——owner-boundary 等价是删除闸的字面要求，
  任何本仓库自建宿主定义上不满足（T-012 归档警告的精神延伸）。
- `assert-vitest-population` 是下限闸；调整测试数量时同步调整下限参数，
  不要让下限高于实际用例数。
- joint 通道共享一次性数据库且使用 serializable 事务；文件并行会触发
  SSI abort，新增 joint 文件必须归入 `vitest.x5.config.ts` 的显式 include
  列表并保持 `fileParallelism: false`。
- 共享工作区有并行会话（T-013 改 `apps/frontend`、registry.yaml 有未提交行）：
  只 path-scoped add 自己的文件，勿卷入他人 WIP。
