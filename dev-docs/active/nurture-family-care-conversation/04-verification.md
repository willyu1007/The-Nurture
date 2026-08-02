# Verification — 家庭与照护者对话能力

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Family-private and shared-thread boundaries separated | PASS |
| 2026-07-30 | T-007 D-04 Admin business-communication read modeled as noncanonical per-request owner-read projection | PASS |
| 2026-07-30 | Admin read scope excludes Guardian private AI, unsent drafts, My-Chat private chat and other Enrollment | PASS |
| 2026-07-30 | Admin read authority kept separate from caregiver/author action authority | PASS |
| 2026-07-30 | Current manifest/module/source implementation remains default-off pending a new protected interface version | PASS |
| 2026-07-30 | Stage G2 split into G2-A Core Loop, G2-B Lifecycle/Admin owner-read and G2-C Caregiver Direct Interaction Bridge | PASS |
| 2026-07-30 | G2-A classified as checkpoint rather than T-005 Exit or cross-step atomic transaction | PASS |
| 2026-07-30 | T-006 `direct_interaction_required` dependency closed by required dedicated G2-C capability; ordinary family question fallback forbidden | PASS |
| 2026-07-30 | Legacy single-status/assignment/single-reply/claimed-Step cutover fixed as read-only, single-writer and no-dual-write | PASS |
| 2026-07-30 | G2 Exit separated from My-Chat native/device completion and kept default-off | PASS |
| 2026-07-30 | G2-C provider qualification separated from T-006 Stage G3-E consumer joint qualification without a completion cycle | PASS |
| 2026-07-29 | Explicit cross-boundary send retained | PASS |
| 2026-07-29 | My-Chat UI/runtime kept out of local scope | PASS |
| 2026-07-29 | No shared cross-role room; guardian/caregiver consume role-specific projections | PASS |
| 2026-07-29 | My-Chat Chat transcript excluded from canonical facts and authorization | PASS |
| 2026-07-29 | Exact Enrollment/original Grant retained across Message, CareItem and Receipt chain | PASS |
| 2026-07-29 | Project governance sync/lint and Markdown whitespace check after decision update | PASS |
| 2026-07-29 | Ordinary Chat, Chat-assisted action and board-direct action separated | PASS |
| 2026-07-29 | Chat/board actions converge on one Capability Harness contract | PASS |
| 2026-07-29 | CareItem creation limited to confirmed relevant capabilities | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after Harness-entry decision | PASS |
| 2026-07-29 | Generic envelope plus capability-specific typed schemas locked | PASS |
| 2026-07-29 | Query lane and Action lane ownership separated | PASS |
| 2026-07-29 | Historical atomic-versus-Workflow dispatch wording recorded | SUPERSEDED |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after Harness contract decision | PASS |
| 2026-07-29 | Five-minute ephemeral, body-free, single-new-effect confirmationRef locked | PASS |
| 2026-07-29 | No persisted prepared business draft/body; execute resubmits typed input and checks bound integrity | PASS |
| 2026-07-29 | Prepare output union and trusted/user/server-resolved input split locked | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after PrepareAction decision | PASS |
| 2026-07-29 | Execute result/disposition/business-outcome separation locked | PASS |
| 2026-07-29 | Stable Nurture command identity and exact replay/drift-conflict rules locked | PASS |
| 2026-07-29 | Increment 1 described as atomic submit/acknowledge/reply | SUPERSEDED — each ActionExecution is atomic; the multi-actor G2-A loop is not one transaction or Workflow |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after ExecuteAction/Increment 1 decision | PASS |
| 2026-07-29 | One structured user gesture per business effect locked | PASS |
| 2026-07-29 | Submit/reply reviewable commit and acknowledge direct commit locked | PASS |
| 2026-07-29 | Technical prepare/execute hidden from user mental model | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after confirmation UX decision | PASS |
| 2026-07-29 | CareItem reply-terminal lifecycle and new-Item continuation locked | SUPERSEDED — teacher replies are appendable; guardian continuation still creates a new Item |
| 2026-07-29 | Context continuation separated from CareItemDependency semantics | PASS |
| 2026-07-29 | Continuation relation prohibited from Grant/authority/owner/SLA/state inheritance | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after continuation-semantics decision | PASS |
| 2026-07-29 | Submit v1 limited to protected 1–2000-character plain text plus optional context continuation | PASS |
| 2026-07-29 | Owner-issued target option separated from operation input and raw IDs | PASS |
| 2026-07-29 | Server-derived classification/routing/authority fields and protected-composer boundary locked | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after submit-input decision | PASS |
| 2026-07-29 | Workflow narrowed to institution management; CareInteraction/ActionExecution/ActionDelivery terms locked | PASS |
| 2026-07-29 | T-002 claimed-Step family-care path classified as default-off compatibility seam | PASS |
| 2026-07-29 | Context strict verification plus project governance sync/lint after terminology consolidation | PASS |
| 2026-07-29 | CareGroup shared responsibility selected; acknowledge actor is audit-only, not exclusive claimant | PASS |
| 2026-07-29 | Same-CareGroup current eligible caregiver reply and expected-version first-winner semantics locked | SUPERSEDED — distinct valid replies may all commit |
| 2026-07-29 | Project governance sync/lint, context strict verification and whitespace check after CareGroup decision | PASS |
| 2026-07-29 | Empty acknowledge input, body-only reply input and prepare-bound expected version locked | PARTIALLY SUPERSEDED — inputs retained; reply now binds replyability heads rather than whole-Item exact version |
| 2026-07-29 | Expected version separated from CommandExecution idempotency identity | PASS |
| 2026-07-29 | Project governance sync/lint, context strict verification and whitespace check after input/precondition decision | PASS |
| 2026-07-29 | CareGroup business sender plus individual executor/audit identity locked | PASS |
| 2026-07-29 | Multi-reply append model, first-reply Attention resolution and no Increment-1 close action locked | PASS |
| 2026-07-29 | Distinct concurrent replies allowed; same-command retry remains exact replay | PASS |
| 2026-07-29 | Context strict verification, project governance sync/lint and whitespace check after multi-reply decision | PASS |
| 2026-07-29 | Immutable committedResult separated from executed/replayed invocation disposition | PASS |
| 2026-07-29 | Acknowledge convergence, reply append output and first/additional response semantics locked | PASS |
| 2026-07-29 | Role-safe stale/current-state disclosure and generic authority-loss denial locked | PASS |
| 2026-07-29 | Low-interruption inline result UX and changed-semantics rereview boundary locked | PASS |
| 2026-07-29 | Project governance lint, Markdown whitespace and superseded-wording scan after result-contract decision | PASS |
| 2026-07-29 | Correction/withdrawal/redaction targets and non-delete semantics locked | PASS |
| 2026-07-29 | Exact-author correction/redaction and CareGroup append-only alternative locked | PASS |
| 2026-07-29 | Family-request-only withdrawal, retained history and Grant-revoke separation locked | PASS |
| 2026-07-29 | Source/reply redaction cascades and reply-redaction no-reopen semantics locked | PASS |
| 2026-07-29 | Pending-notification invalidation and already-sent deep-link owner-reread boundary locked | PASS |
| 2026-07-29 | Context checksums refreshed; strict context verification, project governance lint and Markdown whitespace passed | PASS |
| 2026-07-29 | T-002 landed facts/schema separated from historical target design and mapped to T-005 as REUSE/EXTEND/REPLACE/ADD/HOST_GATED | PASS |
| 2026-07-29 | Full T-004/T-005 contract audit resolved identity, concurrency, result-authority, protected-input, reply-model and role-policy ambiguity | PASS |

## Planned Verification

- State-machine unit tests.
- Repository transaction and concurrency tests.
- Authority reread, revoke and wrong-child negative tests.
- Cross-Enrollment isolation and no-other-Institution-disclosure tests.
- Idempotent send/replay tests.
- Presenter snapshots for guardian and caregiver.
- Ordinary-chat no-side-effect tests, including summary and suggested-but-unconfirmed action.
- Chat/board equivalence tests for the same capability, canonical input, effect, receipt, replay and error class.
- Registry tests proving stable keys use a separate `1.0.0` version, user discovery excludes
  the system-redaction capability, and schema/policy/handler/presenter bindings match the exact
  T-004 contract digest.
- Query-schema tests for guardian multi-Enrollment provenance, caregiver exact-CareGroup
  isolation, role-derived detail projection, closed item unions, unknown-field rejection and
  snapshot-bound pagination.
- Query-lane tests proving no `CommandExecution`, Message, CareItem or Receipt is created.
- Contract tests proving preview is prepare output and confirmation cannot be synthesized by the LLM.
- Prepare union tests for ready/needs-input/denied/unavailable without unauthorized choice disclosure.
- TTL, no-extension/no-reactivation, wrong actor/account/device/surface, wrong bound
  conversation and expired-ref tests.
- Input canonicalization/integrity mismatch, target/original-Grant/authority/head drift and
  fresh reprepare tests.
- Persistence probes proving prepare writes no business draft, protected body, Message,
  CareItem, Receipt or CommandExecution; a permitted body-free short-lived
  `InteractionContext` must remain protocol-only and absent from product projections.
- Protected-input probes proving low-entropy body integrity uses a secret-keyed tag, no bare
  body hash enters storage/logs/telemetry, and client/LLM-supplied
  `protected_content_ref` is rejected.
- Execute transaction tests for confirmation consumption + authority reread + effect/receipt + CommandExecution atomicity.
- Concurrent same-command winner, exact replay, payload drift conflict and intentionally-new-prepare tests.
- Result matrix for committed/not-committed/outcome-unknown, executed/replayed and applied/already-satisfied.
- Error-schema table tests proving every V1 reason code maps to one fixed decision/recovery,
  retryable is emitted only after confirmed no-effect, and unresolved effects use
  outcome-unknown.
- Exact committed-result stability across response-loss replay, with mutable current state and
  delivery status excluded.
- Result-authority tests proving `CommandExecution` stores the immutable typed result
  schema/payload and replay returns its same `commandExecutionRef`; no parallel result row/ref
  may exist.
- Output-schema tests for submit/acknowledge/reply/correction/withdrawal/redaction, including
  required stable refs, closed unions, unknown-field rejection and absence of internal
  protected-content refs.
- Acknowledge concurrent already-satisfied test proving no duplicate event or false individual
  attribution.
- Reply first/additional effect tests proving all distinct commands append and only the first
  reply resolves Attention.
- Reply identity/order tests proving the canonical fact is reply Message + ItemEvent + Receipt,
  `CareReplyV1` is projection-only, and immutable `replyOrderKey` remains stable under
  concurrency and replay without a mutable counter.
- Stale state disclosure tests proving current-state hint is emitted only while the current
  actor remains authorized; authority loss returns no protected state.
- Presenter interaction snapshots proving applied/already-satisfied/replayed settle inline,
  unchanged-view reprepare is transparent, and only material visible/safety drift interrupts.
- Correction version-chain tests: exact author, strict head race, immutable history, independent
  Receipt/replay and responded-family-question rejection/new-Item path.
- Exact-author policy tests proving identity is sender Participant, a replacement current
  RoleAssignment in the same scope is acceptable, another class member/admin is not, and
  historical role audit never grants authority.
- Withdrawal tests: exact source author, body-free input, retained Message/Reply/Receipt history,
  Attention closure, reply race, already-satisfied and no caregiver-reply/Grant-revoke alias.
- Redaction tests: exact sender Participant plus current same-side relationship versus separate
  system-policy actor, irreversible content/correction erasure, tombstone/audit retention,
  source cascade, reply-local cascade and no Attention reopen.
- Redaction convergence tests proving a fully completed same-target cascade may return
  already-satisfied with existing evidence, while partial/unknown cascade and post-redaction
  correction fail closed.
- Post-revoke author-redaction tests proving any owner-policy exception can remove only the
  author's content and cannot restore body read, delivery, correction, withdrawal or reply.
- Cascade scale tests with more than the repository page size, proving redaction locks/updates to
  closure or commits nothing; a fixed `take` limit may not leave partial visible content.
- ActionDelivery tests proving correction creates a new candidate, withdrawal/redaction skip
  pending candidates, and already-sent push opens through current owner-reread without cached body.
- Proof that Nurture committed is independent from Host/provider delivery, device read and domain acknowledge.
- Increment 1 submit/open → acknowledge → first reply/responded transition, first-only
  Attention resolution and original-Grant tests.
- Multi-reply append tests for one/multiple teachers, repeated same-teacher reply and no explicit close action.
- Context-continuation tests for same ChildCareProcess/Enrollment, readable responded source and body-free reference.
- Negative tests proving a context relation does not inherit Grant/authority/owner/SLA/state/command identity or trigger a `CareItemDependency`.
- New continuation Item tests proving a newly selected current Grant becomes that Item's immutable
  original Grant and a new business command identity is used.
- Presenter tests proving an unreadable source relation is suppressed without invalidating the new Item.
- Submit input boundary tests for empty/whitespace, 1/2000/2001 characters, newline normalization, rich text and attachments.
- Tests proving only body/context continuation are operation input while target uses a current owner-issued option ref.
- Negative tests for client/LLM-supplied Enrollment, CareGroup, Grant, category, urgency, route, safe summary and command identity.
- Protected-composer tests proving ordinary Chat transfers intent only and never copies body or invokes an LLM with protected text.
- Fixed derivation tests for family-care-question/question/today-attention/family-to-org/requires-ack/requires-reply/empty-attachments.
- Safety-gate tests proving medical/medication/emergency input writes no protected committed content, Message, CareItem, Receipt or CommandExecution.
- Chat-card/board-form tests proving exact content/target/effect are visible before one submit/reply CTA.
- Acknowledge one-gesture tests proving no confirmation modal and no Harness bypass.
- Tests proving acknowledge creates no personal assignment and another currently eligible
  caregiver in the same exact CareGroup may reply.
- Cross-CareGroup, stale-role, Institution-admin-only and ThreadParticipant-only negative tests
  plus same-CareGroup current `caregiver | lead_caregiver` concurrent dual-reply positive tests.
- Grant-policy tests proving both direction values accepted by the family-care contract are
  handled explicitly, the exact original Grant is reread, and a newer replacement Grant cannot
  take over authority for an existing Item.
- Input-schema tests rejecting client/LLM CareItem ids, versions, Grant/CareGroup/actor/state fields.
- Two reply prepares/two distinct commands test proving both compatible appends commit;
  lifecycle/authority drift still returns stale/denied.
- Negative test proving natural-language text alone cannot consume confirmation.
- Expired-token unchanged-view transparent reprepare and changed-view forced-rereview tests.
- Contract tests proving family-care ActionExecution reuses CommandExecution, ActionDelivery is
  separately idempotent, and neither creates an InstitutionWorkflow Run/Step.
- Activation-negative tests proving legacy `capture_family_input`, raw command specs,
  claimed-Step/`workflow_step_complete_v1`, single reply slot and caller-supplied authority
  cannot register as the T-005 public Harness path.
- Negative contract tests for shared room membership, direct role DM, shared transcript and host-unread authority.
- Institution Admin owner-read tests for exact Institution/Enrollment/CareGroup/original
  Grant/data class/direction/purpose/disclosure/source-lifecycle matching, including current
  body, attachment and correction/withdrawal/redaction projection.
- Negative Admin-read tests for private AI, unsent composer, My-Chat private chat, another
  Enrollment, revoked Grant, redacted source and stale opaque refs.
- Action-separation tests proving Admin-only cannot acknowledge/reply/correct/withdraw/redact,
  while a multi-role user must switch role and pass the original exact action policy.
- Opaque-ref transient owner-read tests proving protected caregiver bodies are not copied into My-Chat Chat history.
- G2-C contract tests proving a dedicated caregiver-initiated capability uses an
  owner-issued exact child/family target, current exact CareGroup role, org-to-family
  Grant/data class/purpose and an empty protected composer.
- G2-C negative tests proving T-006 cannot copy internal sensitive body, publish an
  unregistered placeholder key, reuse `submit_family_care_question`, auto-create
  CareInteraction or degrade to `PublishProcess`.
- G2-C health/safety tests proving only human-authored factual communication is accepted,
  AI diagnostic/prescriptive copy is absent and emergency handling is never replaced by
  Nurture messaging.
- Legacy cutover tests proving new G2 rows have one Harness writer, legacy handlers cannot
  mutate them, compatibility projection is one-way/read-only and ambiguous old rows
  quarantine instead of guessed backfill.
- Black-box end-to-end journey through public scenario contract.
- Non-diagnostic health-language review.

## Documentation Verification

| Date | Command / check | Result |
| --- | --- | --- |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| 2026-07-29 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS |
| 2026-07-29 | Relative Markdown link and duplicate-heading checks across T-004/T-005 | PASS |
| 2026-07-29 | `git diff --check` | PASS |
| 2026-07-30 | T-007 D-04 Institution Admin owner-read presenter addendum: governance lint, strict context verification and `git diff --check` | PASS |
| 2026-07-30 | Stage G2 A/B/C, G2-C cross-task dependency and legacy single-writer consistency scan across T-005/T-006/T-008 and project hub | PASS |
| 2026-07-30 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` then `lint --check` | PASS |
| 2026-07-30 | `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-family-care-conversation --check-anchors` | PASS; 10/10 files, no errors or warnings |
| 2026-07-30 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` and `git diff --check` | PASS |
| 2026-07-30 | Stage G2-C provider / T-006 G3-E consumer no-cycle cross-task review | PASS |

## Required Evidence

记录精确 Nurture/Base/My-Chat pins、命令、测试数据版本和结果。不得用手工数据库修改或 UI mock 代替 receipt、authority 与 replay 证据。

## G2-0 Schema Freeze — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | G1 Joint Conformance PASS 引用有效(`18-g1-joint-conformance-record.md`,T-004 `1.7.0`/`b7691a81…`,My-Chat `a019566`,Base `06303e9`) | PASS |
| 2026-08-01 | 三轴 delta 与 `06-t002-fact-schema-gap.md` Target Schema Delta 逐项对齐(字段命名冻结,全部 additive) | PASS |
| 2026-08-01 | cutover matrix 覆盖 06/02 号文档列举的全部 legacy 元素(status/assignment/linked-reply/ThreadParticipant/CAS/raw DTO/claimed-Step/双写) | PASS |
| 2026-08-01 | 旧行 inventory 判定表对现有 `NurtureFamilyCareItemStatus` 八个枚举值逐一给出迁移或 quarantine 结论 | PASS |
| 2026-08-01 | G2-C 载体决策(Message-only)经 owner 确认;与 02 号"不反向套用三轴状态机"、06 号"不 fork 平行 aggregate"一致 | PASS |
| 2026-08-01 | G2-C 冻结满足 09 号约束:rotation 前不发布 key、T-006 只显示安全阻塞、不复用 family-question schema | PASS |
| 2026-08-01 | freeze 范畴 AC 映射 `T005-AC-001..022` 每条恰好一类机械检查 | PASS |
| 2026-08-01 | `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-family-care-conversation --check-anchors --strict` | PASS |
| 2026-08-01 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` | PASS |
| 2026-08-01 | 效果边界:无 schema apply、migration、handler、digest、数据库、secret、激活或流量变更 | PASS |

## G2 三轴 schema migration — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | `prisma validate` + migration replay(disposable PostgreSQL 5435,tmpfs,运行后销毁) | PASS |
| 2026-08-01 | 新三轴约束集成测试 `g2-three-axis-schema.integration.test.ts` | PASS 8/8(complete-graph、lifecycle-reason、protected-body、scope、reply-order CHECK;reply-order partial unique;correction strict head;legacy 默认不可信) |
| 2026-08-01 | production-db 全套 + population | PASS 46/46(floor 收紧 38→46) |
| 2026-08-01 | unit 全套 | PASS 250/250 |
| 2026-08-01 | scenario-service 套件 + DB journey + typecheck:db | PASS 42/42 + 6/6 |
| 2026-08-01 | dev-host 全套(独立库 deploy 后) | PASS 26/26 |
| 2026-08-01 | `pnpm verify:surface-conformance` | PASS;digest 不变 `1.7.0`/`b7691a81…`(领域 union 扩值不在 T-004 artifact 集内) |
| 2026-08-01 | root `pnpm typecheck` | PASS 0 errors(本地 sibling 编译;pinned CI 仍是权威) |
| 2026-08-01 | `verify:test-routing` / `verify:persistence-boundaries` / `db:assert-boundary` | PASS;54 files(production-db 6);boundary 50 tables / 83 enums;`docs/context/db/schema.json` 已刷新 |
| 2026-08-01 | self-pin 重算(schema.prisma + 两个领域文件在 pin 集内) | `nurtureScenario.contractSha256` → `07f1aeb0…`(54 files,验证器自身算法);完整 pin verify 由 pinned-checkout CI 权威执行 |
| 2026-08-01 | 效果边界 | PASS:无持久化 DB apply、无 handler/digest/capability/secret/激活/流量变更;wave4 约束名漂移已从 migration 剔除并记录 |

## Harness kernel 与 protected-content boundary — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | unit 全套(新增 harness 组合器/payload/integrity/envelope 套件) | PASS 265/265(文件 28→29) |
| 2026-08-01 | 事务集成:同事务单次消费、exact replay 不再消费、consumed 拒新 effect、integrity 漂移零消费后原 ref 可恢复、过期 reprepare conflict、跨 actor blocked | PASS 5/5(disposable PostgreSQL 5435,tmpfs,运行后销毁) |
| 2026-08-01 | AES-256-GCM port:round-trip、随机 iv、防篡改/错 key/错 keyRef fail closed、弱 key/超长明文拒绝 | PASS 4/4 |
| 2026-08-01 | production-db 全套 + population | PASS 55/55(floor 46→55;`vitest.db.config` 关闭文件并行修复 Serializable SSI 假冲突) |
| 2026-08-01 | scenario-service 42/42;dev-host 26/26;boundary 50 tables/83 enums | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance` | PASS;digest 不变 `1.7.0`/`b7691a81…` |
| 2026-08-01 | root `pnpm typecheck` / `verify:test-routing`(57 files:29/8/11/8/1) | PASS |
| 2026-08-01 | self-pin 重算(kernel/repositories/index 在 pin 集) | `nurtureScenario.contractSha256` → `2902efd5…`(54 files);pinned-checkout CI 权威 |
| 2026-08-01 | 效果边界 | PASS:无路由/OpenAPI/env 契约变更(留 ingress 单元)、无持久化 DB、无 capability/digest/secret/激活/流量;key material 注入式,缺失即 default-off |

## submit_family_care_question 纵切 — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | 纵切集成 6/6:happy path(encrypted body round-trip、明文零泄漏、三轴 + 派生 status、Receipt/Attention/Event、exact replay)、多 Enrollment needs_input + owner-issued ref(伪造拒绝)、safety-gated unavailable 零业务事实、revoked grant denied、integrity 漂移零消费后恢复、continuation 资格/关联 | PASS(disposable PostgreSQL 5435,tmpfs,运行后销毁) |
| 2026-08-01 | production-db 全套 + population | PASS 61/61(floor 55→61,文件 8→9) |
| 2026-08-01 | unit 265/265;scenario-service 42/42;dev-host 26/26;routing 58 files(29/9/11/8/1) | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance` | PASS;digest 不变 `1.7.0`/`b7691a81…` |
| 2026-08-01 | root `pnpm typecheck` | PASS |
| 2026-08-01 | self-pin 重算(family-care-transaction/command.transaction/index 在 pin 集) | `nurtureScenario.contractSha256` → `28f25d38…`(54 files) |
| 2026-08-01 | 效果边界 | PASS:无路由/OpenAPI/env 变更、无持久化 DB、无 capability/digest/secret/激活/流量;capability 未进 discovery,keys 注入式 default-off |

## acknowledge/reply 纵切 — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | 纵切集成 6/6:class 收敛 acknowledge(单 event、审计不伪造)、非 caregiver/伪造 ref denied、append-compatible 双回复(first resolve Attention、replyOrderKey 有序、encrypted round-trip)、exact replay 不追加、lifecycle 漂移 stale 零写入、response 轴移动不失效 ack confirmation | PASS(disposable PostgreSQL 5435,tmpfs,运行后销毁) |
| 2026-08-01 | production-db 全套 + population | PASS 67/67(floor 61→67,文件 9→10) |
| 2026-08-01 | unit 265/265;scenario-service 42/42;dev-host 26/26;routing 59 files(29/10/11/8/1) | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance` | PASS;digest 不变 `1.7.0`/`b7691a81…` |
| 2026-08-01 | root `pnpm typecheck` | PASS |
| 2026-08-01 | self-pin 重算 | `nurtureScenario.contractSha256` → `d11792bf…`(54 files) |
| 2026-08-01 | 效果边界 | PASS:无路由/OpenAPI/env 变更、无持久化 DB、无 discovery 发布、无 capability/secret/激活/流量 |

## Harness formal ingress — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | 进程内 e2e:disabled 503、bearer 401、封闭 shell 400、unknown capability 400、prepare/execute 引擎分发 | PASS 4/4(scenario-service 套件 46/46) |
| 2026-08-01 | 真实 PG HTTP 全链路:submit→acknowledge→reply committed、exact replay(consumed ref 仍返回原结果)、响应无 raw id、密文落库明文零泄漏、consumed 复用 → `confirmation_replayed`/refresh | PASS 2/2(scenario-service db 8/8;disposable PG,运行后销毁) |
| 2026-08-01 | `pnpm verify:formal-ingress-contract` | PASS `routes=4 owner-fields=8 harness-execute-fields=8` |
| 2026-08-01 | OpenAPI quality strict + api-index generate/verify | PASS(checksum 33e7dce5…) |
| 2026-08-01 | env 契约 validate + 生成物刷新(两个 optional secret key) | PASS |
| 2026-08-01 | smoke(built artifact) | PASS `binding-owner=disabled harness=disabled legacy-route=absent` |
| 2026-08-01 | production-db 67/67;unit 265/265;dev-host 26/26;routing 61 files(29/10/11/10/1);port topology | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance` | PASS;digest 不变 `1.7.0`/`b7691a81…` |
| 2026-08-01 | root `pnpm typecheck` | PASS |
| 2026-08-01 | self-pin 重算 | `nurtureScenario.contractSha256` → `e221e1cf…`(57 files) |
| 2026-08-01 | 效果边界 | PASS:additive 路由,default-off(keys 缺失即 503);无持久化 DB、无 discovery 发布、无 secret 值、无激活/流量 |

## Query lane 与 role-safe presenters — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | query-lane 域层集成:keyed cursor 分页 + 伪造/跨 actor/过期 `refresh_required`、role-reach 拒绝(detail denied、陌生 caregiver 空列表)、revoke 后 caregiver content 遮蔽而 guardian 恒可读、redaction tombstone 无 content | PASS 5/5(disposable PG,运行后销毁) |
| 2026-08-01 | HTTP e2e 扩展:timeline 双向 body owner-read、work actions availability(ack already_satisfied)、detail(caregiver,replyCount)、readResult(guardian projection)、display refs 32-hex 不可逆 + careItemRef keyed 格式 | PASS(scenario-service db 8/8) |
| 2026-08-01 | `pnpm verify:formal-ingress-contract` | PASS `routes=6 owner-fields=8 harness-execute-fields=8` |
| 2026-08-01 | OpenAPI quality strict + api-index generate;context touch 后 strict verify | PASS |
| 2026-08-01 | production-db 72/72(floor 67→72,文件 10→11);unit 265/265;dev-host 26/26;routing 62 files(29/11/11/10/1);scenario-service 46/46 | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance`;root typecheck;smoke | PASS;digest 不变 `1.7.0`/`b7691a81…`;smoke 三重 disabled 不变 |
| 2026-08-01 | self-pin 重算 | `nurtureScenario.contractSha256` → `197618fb…`(57 files) |
| 2026-08-01 | 效果边界 | PASS:additive 只读路由;query 零写入零 CommandExecution;无持久化 DB/secret/激活/流量 |

## G2-A checkpoint 资格化 — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | checkpoint 缺口套件:authority matrix(跨组/过期/guardian 冒充)、真并发双 reply(order/attention/response 轴)、duplicate click 收敛、execute 时点 grant 撤销 fail closed、Chat/Board canonical+拒绝等价、workspace 泄漏 census | PASS 6/6(disposable PG,运行后销毁) |
| 2026-08-01 | production-db 78/78(floor 72→78,文件 11→12);unit 265/265;scenario-service 46/46 + db 8/8;dev-host 26/26;routing 63 files(29/12/11/10/1) | PASS |
| 2026-08-01 | `pnpm verify:surface-conformance`;root typecheck | PASS;digest 不变 `1.7.0`/`b7691a81…` |
| 2026-08-01 | checkpoint 记录 | `11-g2a-checkpoint-record.md`:清单逐项映射、AC 续编 `T005-AC-023..035`、边界(非 final Exit)明示 |
| 2026-08-01 | 效果边界 | PASS:仅测试/守卫/文档;self-pin 未动;无 DB/secret/digest/激活/流量 |

## 实施质量自查修复 — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | legacy 单写入面隔离(T005-AC-007):legacy ack/reply/redact 打 G2 行全部 not_committed 零写入;legacy 行仍可驱动;grant revoke 对 G2 行推进 lifecycle 轴 | PASS 5/5(新增套件) |
| 2026-08-01 | grant revoke 级联改为循环至闭包(超界整笔失败),消除 `take:100` 部分提交(冻结 D5) | PASS(既有 x5/family-care 套件不回归) |
| 2026-08-01 | `readResult` 改按 command identity + actor 归属校验,不再接受 raw id;跨 actor / 未知 command 均 denied | PASS(HTTP e2e 8/8) |
| 2026-08-01 | 分页改用扫描源记录:不可投影行被跳过但 hasMore/cursor 不受影响 | PASS(新增"孤儿行"用例) |
| 2026-08-01 | query lane 零写入零 CommandExecution(六表前后计数比对) | PASS(此前仅构造保证,现有断言) |
| 2026-08-01 | acknowledge 证据缺失 fail closed;crypto 具名导入;并发/双击测试重试上限断言 | PASS |
| 2026-08-01 | production-db 85/85(floor 78→85,文件 12→13);unit 265/265;scenario-service 46/46 + db 8/8;dev-host 26/26;routing 64 files | PASS |
| 2026-08-01 | OpenAPI strict + api-index + ingress 守卫 `routes=6`;digest 不变 `1.7.0`/`b7691a81…`;typecheck;smoke 三重 disabled | PASS |
| 2026-08-01 | self-pin 重算 | `nurtureScenario.contractSha256` → `05f449da…`(57 files) |

## Codex 独立评审修复 — 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | enrollment 作用域 guardian 不得读到同一孩子在其他机构的内容(timeline 无泄漏 + detail denied) | PASS(新增回归;修复前会泄漏) |
| 2026-08-01 | grant 谓词:status + direction + data class + purpose 四项齐备才授权(submit/ack/reply/内容 fence) | PASS(既有负向套件全绿) |
| 2026-08-01 | 续接 ref 走签名解析:裸 id 被拒、签名 ref 可用 | PASS(g2-submit 套件) |
| 2026-08-01 | 三态结果:operation 内抛错/驱动写冲突 → 确定 not_committed;事务外壳失败 → outcome_unknown + reconcile_same_command | PASS(kernel 单测新增两例) |
| 2026-08-01 | committed result 落库并在 replay 原样返回(三个 capability 均填充) | PASS |
| 2026-08-01 | cursor 绑定 snapshot;caregiver work 精确 CareGroup + `careGroupRef`;续接可读性实算 | PASS |
| 2026-08-01 | production-db 86/86(floor 85→86);unit 265/265;scenario-service 46/46 + db 8/8;dev-host 26/26;routing 64 files | PASS |
| 2026-08-01 | digest 不变 `1.7.0`/`b7691a81…`;ingress 守卫 `routes=6`;typecheck;smoke 三重 disabled;self-pin → `b2c53eb7…` | PASS |
| 2026-08-01 | x5 联合套件 | NOT RUN(需 pinned My-Chat + pgvector 物化);受影响的 revoke 路径由 family-care 与 legacy-cutover 套件覆盖,CI 权威 |

## x5 联合套件复跑(评审修复后)— 2026-08-01

| Date | Check | Result |
| --- | --- | --- |
| 2026-08-01 | pinned 物化:My-Chat `a019566` / Base `06303e9` detached worktree(sibling working copy 未触碰,用后移除) | PASS |
| 2026-08-01 | `verify-workflow-contract-pin`:parity `8dd53be4…`、`x5_joint_api` `89a61355…`(169 files)、`wave4_binding_host` `960afb2c…`(20 files)、self-pin `b2c53eb7…`(57 files) | PASS(与已推 pin 一致) |
| 2026-08-01 | disposable pgvector PG(127.0.0.1:5437,tmpfs):`x5_my_chat` 走 pinned My-Chat 迁移、`x5_nurture` 与 `nurture_dev_host` 走 Nurture 迁移;运行后连同 worktree 一并销毁 | PASS |
| 2026-08-01 | `pnpm test:x5` | PASS 4/4(M5 acceptance + 三条 G1 joint negatives);覆盖本轮改动的 revoke 级联(闭包循环 + 三轴同步)与 kernel 三态,无回归 |

## G2-B lifecycle + Institution Admin owner-read — 2026-08-01

| Check | Result |
| --- | --- |
| first scenario/DB/service typecheck | Initial FAIL: local generated Prisma client was stale and did not contain already-migrated G2 fields; `pnpm exec prisma generate --schema prisma/schema.prisma` refreshed only generated client code (no DB connection/apply), then all three package checks passed |
| `pnpm test:unit` | PASS 29 files / 266 tests |
| `pnpm test:db` on clean disposable migrated PostgreSQL | PASS 13 files / 86 tests |
| `pnpm --filter @the-nurture/scenario-service test` | PASS 8 files / 49 tests; includes exact boolean config, protected route default-off, bearer/parser/controller boundary |
| `pnpm test:scenario-service:db` final run | PASS 2 files / 17 tests; `harness.db.e2e` 11/11 includes correction race/replay, withdrawal convergence/history, author/policy redaction, 105+105 closure, reply-local behavior and Admin exact owner-read matrix |
| `pnpm test:dev-host` | PASS 11 files / 26 tests |
| package typechecks: scenario / DB / scenario-service / scenario-service DB | PASS |
| root `pnpm typecheck` | EXTERNAL BLOCK: sibling My-Chat current worktree fails its own `AuditAction` union at `packages/db/src/growth-record-repository.ts:646`; no Nurture package diagnostic remains |
| `pnpm verify:surface-conformance` | PASS; exact shared interface remains `nurture.surface-contract@1.7.0` / `sha256:b7691a81…`, schemas 37, slices 25/25, negatives 7, synthetic qualification 56/56 |
| `pnpm verify:formal-ingress-contract` | PASS `routes=7 owner-fields=8 harness-actions=7 harness-execute-fields=8 institution-owner-read-fields=5` |
| OpenAPI/API index generate + strict verify; context touch + strict verify | PASS; API index 7 endpoints, checksum `6e80c340…`; context checksums current |
| env-contract validate/generate + environment suite | PASS; additive bool default `false`, no values/secret change, generated example/docs/context refreshed |
| `verify:test-routing` / `verify:persistence-boundaries` / `verify:port-topology` | PASS; 64 files = 29 unit / 13 production DB / 11 dev-host / 10 scenario-service / 1 x5; persistence isolation and ports unchanged |
| `pnpm verify:workflow-contract-pin` on live siblings | EXTERNAL BLOCK: current Base checkout is `8649e0e`, not frozen `06303e9`; W0 exact-pin evidence remains authoritative and no sibling checkout was changed |
| built scenario-service smoke | Initial FAIL after source passed because `harness-http` imported the package root whose runtime export points to TS; fixed to the built `@the-nurture/scenario/harness` subpath. Final PASS: health, binding-owner disabled, Harness disabled, legacy route absent |
| env/governance/diff | PASS: environment suite, `sync --apply`, governance lint and `git diff --check` |
| documentation lint | PASS strict + anchor checks: task bundle 18/18, context 8/8, docs 16/16; 0 errors / 0 warnings |
| disposable database effect boundary | PASS: no persistent DB apply; every temporary PostgreSQL was stopped and moved to Trash after the run |

Checkpoint evidence and stable AC IDs `T005-AC-036..049` are recorded in
`12-g2b-checkpoint-record.md`. Provider interface pin:
`nurture.institution-business-communication-owner-read@1.0.0` /
`sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`.
The environment gate remains default `false`; no consumer adoption,
activation or traffic is claimed.

## G2-B quality remediation and requalification — 2026-08-02

| Check | Result |
| --- | --- |
| `pnpm test:unit` | PASS 29 files / 268 tests; includes finalizer rollback/no-Execution and policy-head-only confirmation-state guards |
| `pnpm --filter @the-nurture/scenario-service test` | PASS 8 files / 49 tests |
| production DB suite on freshly migrated temporary PostgreSQL | PASS 13 files / 86 tests |
| scenario-service DB suite on the same disposable schema | PASS 2 files / 17 tests; Harness lifecycle file 11/11 validates exact G2-B result shapes, policy input/current-head binding, correction Receipt FK projection and withdrawal notice |
| `pnpm test:dev-host` equivalent with isolated production + dev-host temporary DBs | Initial invocation had no `.env` and failed only on missing `DATABASE_URL`; rerun with explicit temporary URLs PASS 11 files / 26 tests |
| scenario / DB / scenario-service / DB-aware typechecks | PASS |
| root `pnpm typecheck` | EXTERNAL BLOCK unchanged: live sibling My-Chat rejects its own `growth_record_family_chat_reference_set` `AuditAction`; no Nurture diagnostic |
| `pnpm verify:surface-conformance` | PASS; exact `nurture.surface-contract@1.7.0` remains `sha256:b7691a81…`; 37 schemas, 25/25 slices, 7 negatives, 56/56 synthetic tests |
| formal ingress / persistence / port topology / test routing | PASS; routes 7, persistence isolated, ports unchanged, 64 routed test files |
| built scenario-service smoke | PASS; health available, binding owner/Harness disabled, legacy route absent |
| docs strict anchors + governance lint | PASS; task bundle 18/18, 0 errors / 0 warnings; project lint PASS |
| Nurture self-pin | PASS local recomputation with verifier algorithm: 57 files, `f7d618bdc09acd203b3350a616fe0565a6ac17ae9d4dd3f64c77bae7b35e9bb8` |
| temporary DB effect boundary | PASS; every explicitly named `nurture_codex_t005_*` database was dropped on exit; final census empty |

No Prisma schema/migration, T-004 artifact, environment value, secret, activation or
traffic changed. The two initial missing-environment runs executed no valid DB suite and
are retained here as command-entry lessons; all authoritative reruns used isolated,
freshly materialized schemas and passed.

## G2-C provider qualification and quality remediation — 2026-08-02

| Check | Result |
| --- | --- |
| `pnpm test:unit` | PASS 29 files / 268 tests |
| `pnpm --filter @the-nurture/scenario-service test` | PASS 8 files / 49 tests |
| production DB suite on a freshly migrated disposable PostgreSQL | PASS 13 files / 86 tests |
| scenario-service DB suite on a freshly migrated disposable PostgreSQL | PASS 2 files / 22 tests; Harness 16/16, including direct happy/replay/lifecycle, safety/authority negatives, exact-Grant replacement denial, stale-head rollback and Grant-revoke reread |
| dual-database dev-host isolation suite | PASS 11 files / 26 tests on separate freshly migrated Nurture and workflow-dev-host databases |
| scenario / DB / scenario-service typechecks | PASS |
| `pnpm verify:surface-conformance` | PASS; exact `nurture.surface-contract@1.8.0` / `sha256:4fe91e13…`; 38 schemas, 11 capabilities, 26/26 slices, 7 negatives, 56/56 synthetic tests |
| `pnpm verify:formal-ingress-contract` | PASS; 7 routes, 8 action keys |
| OpenAPI/API index/context strict verify | PASS; 7 endpoints; final source checksum `f3995b30…` matches query `1.1.0` contract |
| Nurture self-pin | PASS; expanded exact implementation population 69 files / `0e684436…`; no floating Base/My-Chat repin |
| protected persistence / port topology / test routing / diff checks | PASS |
| temporary DB effect boundary | PASS; every explicit `the_nurture_g2c_*` database was dropped on exit |
| root aggregate `pnpm typecheck` | EXTERNAL OWNER GATE; local packages pass, but the current sibling My-Chat checkout has an unrelated `growth_record_family_chat_reference_set` / `AuditAction` compile error |
| live `verify:workflow-contract-pin` | EXTERNAL OWNER GATE; verifier correctly rejects current Base `8649e0e` against frozen `06303e9`; no sibling mutation or floating repin |

Checkpoint evidence and stable AC IDs `T005-AC-050..059` are recorded in
`13-g2c-checkpoint-record.md`. The provider is qualified but consumer adoption,
cross-owner G2 Exit evidence, deployment, activation and traffic remain unclaimed.

## G2 Exit Qualification — 2026-08-02

| Check | Result |
| --- | --- |
| exact detached owner/self-pin verification | PASS; Base/My-Chat `8dd53be4…`, three owner source pins, Nurture checkpoint 69 files / `0e684436…` |
| clean frozen install + Prisma generation + aggregate typecheck | PASS; owner client generation requires an explicit test-only `DATABASE_URL`, no apply |
| unit / scenario-service | PASS; 268 / 49 |
| production / formal scenario-service DB | PASS; 86 / 22 on fresh disposable PostgreSQL |
| dev-host dual DB | PASS; 26 tests on isolated fresh schemas |
| surface/formal/persistence/port/routing/built smoke | PASS; surface 56/56, routes 7/actions 8, smoke default-off |
| `verify:g2-exit-contract` | PASS; exact `1.8.0`, shared core `042272…`, 11 capabilities, exact pins, gates false, legacy activation absent |
| `verify:g2-exit-db-census` | PASS; items 53 Harness / 11 legacy, messages 73 Harness / 12 legacy, all five violation classes zero |
| final false/empty | PASS; no committed gate values, no secret/Candidate/activation/traffic; no `the_nurture_g2_exit*` database remains |
| review | PASS after qualification-command fixes and CI exact-pin enforcement; no product defect remains |
| final context/self-pin sync | PASS; workflow context semantic drift removed; 69-file self-pin `a23f0c069dbd335c4c0b2befec5443bf9e151595ea0b6dfd8c95ae7f99173141` |

Authoritative verdict and bounded G1 evidence reuse are recorded in
`14-g2-exit-qualification-and-beta-handoff.md`. T-006/T-007 adoption and T-008
Candidate/native/device qualification remain outside this verdict.
