# Verification

## 2026-08-08 — Pre-launch deck cleanup

- `artifacts/nurture-deck-v1.html` 已删除；artifact 目录只保留设计过程 mockup、正式
  presenter/action handoff 与 schema-valid teacher fixture。
- 全仓引用扫描确认没有文档继续把被删 deck 描述为当前正式 artifact 或实现入口；历史验证记录
  明确标注为“删除前证据”。
- Task docs lint、project governance lint 与 `git diff --check` 在清理后重新执行并通过。

## 2026-08-08 — Presenter/action handoff

- Exact identity: generated manifest reports `nurture.surface-contract@1.17.0`, digest
  `sha256:d22851d98a55299fb4a90f4ff461f6dbeb7ed3f075669ffb19cccb93018acdf8`,
  33 capabilities and 6 surfaces.
- Registry trace: all six product surfaces map one-to-one to their presenter binding; teacher board order is
  `caregiver_child_today` → `caregiver_family_care_work` → `teacher_publish_queue`.
- Fixture trace: `teacher-release-presenter-fixture.v1.json` is deterministic output from the production
  `queryTeacherPublishQueue` harness against the exact contract pin; schema validation and focused presenter tests pass.
- Provider evidence: T-009 verification records the real DB/provider projection, receipt join, lifecycle precedence,
  no-family-archive scan and joint My-Chat suite as PASS. The handoff therefore maps proven provider states rather
  than inventing UI-only delivery states.
- Receiver safety: My-Chat T-036 was inspected read-only; its dirty/conflicted worktree was not modified. The
  sender artifact is self-contained and receiver adoption is explicitly separate.
- Deck limitation: the in-app browser security policy rejects direct `file://` navigation, so the old deck's
  final keyboard/touch interaction pass was not repeated. The file was subsequently deleted in pre-launch cleanup;
  this closed design-artifact limitation does not weaken the typed handoff or reopen T-003.
- Closing verification:
  - standalone teacher-release fixture validates against
    `schema:nurture.query-teacher-publish-queue-result@1`;
  - `pnpm verify:surface-contract` and `pnpm verify:surface-contract-schemas`: PASS;
  - focused board/queue presenter tests: 2 files, 23 tests PASS;
  - `pnpm verify:surface-conformance`: 11 files, 109 tests PASS; 16 cases cover 48/48 slices;
  - task-doc lint and `git diff --check`: PASS.

## 2026-07-30 — 删除前的历史证据

- 当时静态复核 `artifacts/nurture-deck-v1.html`：共 9 个 `.slide`
  section，页码初始化为 `01 / 09`，与当前 mobile UX contract 和 overview 的 9 页
  口径一致。该文件已于 2026-08-08 的 pre-launch cleanup 中删除。
- 2026-07-21 记录中的“Phase C v1（deck 12 页）”属于当时的历史组装状态，不再代表
  后来的 9 页 artifact。删除前没有完成最终键盘/触控实链核验；文件现已主动清理，
  该历史验证缺口已关闭且不阻塞任何 contract baseline。

## 2026-07-21

- 样板 2/3 的 deck 骨架（1280×720 缩放舞台、左右翻页、键盘/触控、居中修复）已在浏览器
  实测：翻页/缩放/居中正常；角色与时间线切换、卡片展开交互实测可用。
- Phase C v1（deck 12 页）：浏览器 pane 全会话故障（navigate 300s 超时），无法本地实测；
  骨架（缩放居中/翻页/进度条）与切换/展开交互复用样板 2/3 已实测通过的同款代码模式；
  新增的读条动画、翻日、房间/视图切换为纯 DOM 操作，待用户在 artifact 实链试用确认。
