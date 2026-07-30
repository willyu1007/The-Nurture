# Plan — 六个核心 Surface 的产品契约基座

## Phase 0 — Discovery and Gate Reconciliation

- 读取 workflow、product、DB context contract，以及 scenario manifest/module 的当前公共边界。
- 盘点现有 `capability_key`、entrypoint、handler registry、typed command 与 surface presenter，确认可复用的 discovery/dispatch 基础。
- 将 T-002 的已完成能力、未完成 blocker 和不可越过的授权条件映射到六个 surface。
- 输出“复用 / 扩展 / 待上游解锁”差距表，并把工作项分为 contract-parallel、owner-integration-gated、activation-gated。

验收：

- 不以设计稿或路由存在推断权限。
- 每个待实现项都有 owner、source of truth 与 gate。
- synthetic owner fixture 与真实 owner contract 的来源、可用范围和禁止路径可以机械区分。

## Phase 1 — Capability, Surface and Visibility Contract

- 定义六个 surface 的 actor、workspace、scope、read/write 与敏感度矩阵。
- 定义 `CapabilityDescriptorV1` 的最小 engine-ready 字段：stable key/version、
  domain/execution/delivery 三轴、intent keys、typed input/result/error schema refs、
  target/confirmation/concurrency policy、eligibility policy key/version、handler binding、
  presenter bindings、invalidation scope kinds 与 dependency gates。
- 锁定 queries/commands 按 capability 组织、presenters 按 surface 组织的单向依赖。
- 定义 `SurfaceEnvelopeV1`：exact contract ref、surface/version、state、snapshot、
  actor-safe context、content family、typed content、actions、page info、dependency NO-GO；
  再按 Conversation timeline、Board semantic modules、Workbench Hub/List/Insight
  三类 content family 建立强类型内容联合。
- 定义同一事实如何投影给 guardian、caregiver、institution，而不复制事实所有权。
- 定义 identity binding、Family/Guardian、多个 Institution Enrollment/CareGroup、per-Enrollment GrantRequest/Grant 四个独立就绪轴，不使用单一状态枚举代替 authority 判断。
- 定义 `ready | limited | needs_setup | unavailable` surface state，并保持 module/action eligibility 独立计算。
- 定义 Guardian Chat 的跨授权来源聚合查询、目标已绑定动作卡，以及家庭看板的 per-Enrollment 目标选择和命令边界。
- 锁定空态、加载、失败、权限不足、已撤回与已更正的语义。

验收：

- 任意 view-model 字段都能追溯到 Nurture-owned fact 或明确的 My-Chat opaque identity / policy input。
- institution 聚合不能读取家庭私密正文。
- T-007 D-04 的园区业务沟通不是 ambient aggregate：定义一个 request-time、
  versioned Admin read-only projection，绑定 exact Institution/Enrollment/CareGroup、
  original Grant/data class/purpose、渠道 disclosure 与 source lifecycle。
- 明确 Admin protected read 不授予 CareGroup action authority；当前 manifest/source
  在新 owner-read contract 和 qualification 完成前保持 default-off。
- capability descriptor 只描述可发现性，不复制或弱化真正的授权 policy。
- content family 只表达产品语义，不携带任意视觉组件树、像素布局或 host navigation。
- 单机构试点路径可确定性收敛到唯一 Enrollment，但多机构时不得由 LLM 静默选择写入目标。
- descriptor 的 supported role/eligibility metadata 只用于发现；它不能替代执行时
  current owner/policy reread。
- 初始 envelope 的所有 required content 来自同一 snapshot；后续 module/item cursor
  绑定 actor/scope/contract/snapshot，过期或状态前移时返回 refresh/rebase，不拼接不一致视图。

## Phase 2 — Typed Capability and Presenter Contract

- 版本化 capability-first queries、commands、events/receipts、errors 与 pagination。
- 冻结 `InterfaceContractRefV1` 的 wire 形状、artifact-set canonicalization 与 digest：
  discovery、surface/query/action response 必须返回 exact key/version/digest，invocation
  必须声明 expected exact ref。
- 定义 presenter 输出的稳定字段、可选字段和兼容性策略。
- 定义 Nurture-owned semantic order、module/item kinds、actions 与 invalidation scopes；My-Chat 保留响应式布局和组件实现权。
- 定义 deterministic eligibility result 与通用 invocation envelope；不实现 LLM provider、语义检索或跨 Scenario router。
- 将 capability-specific business input 与 generic target/concurrency/idempotency
  metadata 分离；concurrency heads 不进入业务 schema。
- capability descriptor 声明 `exact_state | lifecycle_authority | append_compatible`
  summary class，并用 `headBindings[]` 逐项声明 `must_equal | must_satisfy |
  compatible_append | convergent_postcondition`；prepare 把相应 heads、精确 target、
  actor/scope、受保护输入所需的 keyed integrity tag、expiry 与 stable command identity
  绑定进 opaque confirmation。
- 通过 versioned policy/repository ports 隔离未完成的 T-002 owner runtime；不实现 identity、Grant 或 authenticated principal fallback。
- 把宿主展示需求翻译为协议，不在本仓库实现宿主 UI。

验收：

- 黑盒客户端不依赖 Prisma、内部表名或私有 runtime。
- 写操作均有 authority source、idempotency 与 receipt 语义。
- 参考呈现可以替换为 My-Chat renderer，而不修改 capability 或领域契约。
- 缺少真实 owner adapter 时，capability 保持 default-off，并返回明确 dependency NO-GO，而不是退化为 synthetic runtime。
- exact-state action 只有在 descriptor 声明的 convergent postcondition 已满足且其他
  lifecycle/authority heads 仍有效时，才可返回 `already_satisfied`；其他 version
  漂移必须 stale。
- compatibility 检查以 exact digest 为 admission，optional additive change 仍生成新
  digest/version；consumer 不使用版本范围或 `latest`。

## Phase 3 — Fixtures and Cross-role Journey

- 建立最小合成家庭、孩子、照护者、班级和机构数据集；至少包含一个 bound ChildCareProcess 的两个隔离 Institution Enrollment，以及单机构试点 profile。
- 建立一个版本化 synthetic world，但为每条 Journey 生成独立、可重复的初始状态。
- 固定 Journey Portfolio：
  - GJ-1 家庭关注流向照护者。
  - GJ-2 照护日常流向家庭。
  - GJ-3 多源事实沉淀为成长连续性。
  - GJ-4 入托、家长确认与授权建立。
  - GJ-5 机构理念流向日常支持。
  - RJ-1 撤权、纠正与恢复。
- 为后续 T-005 至 T-008 提供按 Journey 分离的 fixture、输入、预期快照、receipts 和最高风险拒绝路径。
- 增加 capability selection fixtures：候选过滤、正确选择、需要澄清、需要确认与不可用。

验收：

- fixture 不含真实 PII。
- 同一事实的多角色投影一致，且跨边界内容只有在显式发送后出现；任何机构都不能推断另一机构的存在或状态。
- 每条 Journey 可独立重跑，不从另一条 Journey 的可变数据库结果继承状态。
- Portfolio 覆盖六个 surface；完整 role/action 组合由 conformance matrix 而非 Journey 脚本承担。

## Phase 4 — Contract Qualification

- 运行 schema/context、type、unit、contract 与 fixture determinism 检查。
- 验证 catalog → eligibility → typed handler → surface presenter 的确定性链路，不要求共享 LLM 引擎存在。
- 记录 breaking-change policy、consumer adoption checklist 与准确 pin 方法。
- 分别出具 synthetic contract qualification 与真实 owner-integration readiness；前者通过不能替代后者。
- 输出供 T-008 使用的 interface contract identity/version/digest 与 compatibility handoff；Service Candidate identifier、bundle freeze 和 composite validation record 不在 T-004 实现。
- 输出机器可验证的 `SurfaceContractV1` artifact set：descriptor registry、surface
  schemas、invocation/result/error schemas、policy/schema refs、fixture manifest 与
  conformance manifest；这些 artifact 的规范内容共同生成 interface digest。

验收：

- 形成可供后续任务消费的版本化基线。
- 形成 engine-ready 而非 engine-complete 的交付；未来共享引擎可以消费 descriptor，但不成为 T-004 完成条件。
- T-004 可以在 T-002 runtime 未完成时完成 contract baseline，但不能宣称真实 binding、Enrollment/Grant、authenticated path、notification 或 traffic 已通过。
- interface contract 变化按 compatibility 规则版本化，不存在 mutable `latest`、浮动 contract 或原地覆盖；T-004 不因 Service Candidate ID 格式尚未确定而 blocked。
- 所有 T-002 未满足门禁继续显示为 NO-GO，而非被本任务“补齐”。
- descriptor registry、surface schemas、invocation/result/error schemas 与 fixture/
  conformance manifests 对同一 contract ref 双向一致；任一引用缺失、重复或 digest
  不一致均 qualification fail。
