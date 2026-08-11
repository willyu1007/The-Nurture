# Pitfalls

## do-not-repeat

- 手写内联 SVG 必须显式 `width`/`height`（或被 CSS 选择器覆盖）：无尺寸的 SVG 默认 300×150，
  曾把聊天输入条撑爆并顶飞消息（r3 ⑧）。新增图标时逐个检查尺寸来源。

- 历史 deck 调试中，浏览器 pane 的 file:// 预览是静态快照：会缓存旧文件（改名/加查询串也可能不刷新）、
  `position:fixed` 全屏布局截图异常、无障碍树不可读、偶发 navigate 300s 超时。
  若以后重新制作演示 artifact，交互与最终视觉验证应以发布实链为准；临时预览文件用完即删。
- `transform:scale` 不改变布局盒尺寸：居中固定画幅舞台需用"holder 按缩放后尺寸占位 +
  stage 从左上角 scale"模式，直接 grid 居中会溢出。
- CSS counter 跨多个容器会重置编号：拆段的步骤序列需显式 `counter-reset:s N`。
- 面向园长的材料里不可出现开发向词汇（代码名、"低保真"等）与具体人名——生成文案时从源头避免，
  不要事后清理。
- "接地气"文案的坑：堆口语词（说死/盘子/搭把手/念叨）+ 工整排比 = 典型 AI 腔，用户一眼识破。
  自然感来自平实陈述句、句式长短不一、少修辞；宁可平淡，不要表演式亲切。
- 跨仓交接前先读 receiver worktree 状态。若接收仓存在未解决冲突，不要为了“留下接收记录”混写
  对方变更；在 sender repo 落 exact-version、自包含 artifact，并把 adoption 明确留给 receiver task。
- 未上线阶段不要为已 supersede 的可执行 demo 建立长期维护负担。关键决策写入 contract/docs 后，
  删除容易被误用的旧 deck；保留历史文字记录即可。
