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
