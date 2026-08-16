# Pitfalls

（已解决的失败与死胡同记录；建立时为空。）

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
