# Verification — 家庭与照护者对话能力

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Family-private and shared-thread boundaries separated | PASS |
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
| 2026-07-29 | No persisted prepared draft; execute resubmits and hashes typed input | PASS |
| 2026-07-29 | Prepare output union and trusted/user/server-resolved input split locked | PASS |
| 2026-07-29 | Governance sync/lint, task resume and whitespace check after PrepareAction decision | PASS |
| 2026-07-29 | Execute result/disposition/business-outcome separation locked | PASS |
| 2026-07-29 | Stable Nurture command identity and exact replay/drift-conflict rules locked | PASS |
| 2026-07-29 | Increment 1 limited to atomic submit/acknowledge/reply | PASS |
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

## Planned Verification

- State-machine unit tests.
- Repository transaction and concurrency tests.
- Authority reread, revoke and wrong-child negative tests.
- Cross-Enrollment isolation and no-other-Institution-disclosure tests.
- Idempotent send/replay tests.
- Presenter snapshots for guardian and caregiver.
- Ordinary-chat no-side-effect tests, including summary and suggested-but-unconfirmed action.
- Chat/board equivalence tests for the same capability, canonical input, effect, receipt, replay and error class.
- Query-lane tests proving no `CommandExecution`, Message, CareItem or Receipt is created.
- Contract tests proving preview is prepare output and confirmation cannot be synthesized by the LLM.
- Prepare union tests for ready/needs-input/denied/unavailable without unauthorized choice disclosure.
- TTL, no-extension/no-reactivation, wrong actor/account/device/surface, wrong conversation hash and expired-ref tests.
- Input canonicalization/hash mismatch, target/Grant/authority/version drift and fresh reprepare tests.
- Persistence probes proving no prepared draft, protected body, Message, CareItem, Receipt or CommandExecution is written by prepare.
- Execute transaction tests for confirmation consumption + authority reread + effect/receipt + CommandExecution atomicity.
- Concurrent same-command winner, exact replay, payload drift conflict and intentionally-new-prepare tests.
- Result matrix for committed/not-committed/outcome-unknown, executed/replayed and applied/already-satisfied.
- Exact committed-result stability across response-loss replay, with mutable current state and
  delivery status excluded.
- Acknowledge concurrent already-satisfied test proving no duplicate event or false individual
  attribution.
- Reply first/additional effect tests proving all distinct commands append and only the first
  reply resolves Attention.
- Stale state disclosure tests proving current-state hint is emitted only while the current
  actor remains authorized; authority loss returns no protected state.
- Presenter interaction snapshots proving applied/already-satisfied/replayed settle inline,
  unchanged-view reprepare is transparent, and only material visible/safety drift interrupts.
- Correction version-chain tests: exact author, strict head race, immutable history, independent
  Receipt/replay and responded-family-question rejection/new-Item path.
- Withdrawal tests: exact source author, body-free input, retained Message/Reply/Receipt history,
  Attention closure, reply race, already-satisfied and no caregiver-reply/Grant-revoke alias.
- Redaction tests: exact author versus system-policy actor, irreversible content/correction
  erasure, tombstone/audit retention, source cascade, reply-local cascade and no Attention reopen.
- ActionDelivery tests proving correction creates a new candidate, withdrawal/redaction skip
  pending candidates, and already-sent push opens through current owner-reread without cached body.
- Proof that Nurture committed is independent from Host/provider delivery, device read and domain acknowledge.
- Increment 1 submit/open → acknowledge → first reply/responded transition, first-only
  Attention resolution and original-Grant tests.
- Multi-reply append tests for one/multiple teachers, repeated same-teacher reply and no explicit close action.
- Context-continuation tests for same ChildCareProcess/Enrollment, readable responded source and body-free reference.
- Negative tests proving a context relation does not inherit Grant/authority/owner/SLA/state/command identity or trigger a `CareItemDependency`.
- New continuation Item tests proving current Grant and a new business command identity are used.
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
- Cross-CareGroup, stale-role and Institution-admin negative tests plus same-CareGroup
  concurrent dual-reply positive tests.
- Input-schema tests rejecting client/LLM CareItem ids, versions, Grant/CareGroup/actor/state fields.
- Two reply prepares/two distinct commands test proving both compatible appends commit;
  lifecycle/authority drift still returns stale/denied.
- Negative test proving natural-language text alone cannot consume confirmation.
- Expired-token unchanged-view transparent reprepare and changed-view forced-rereview tests.
- Contract tests proving family-care ActionExecution reuses CommandExecution, ActionDelivery is
  separately idempotent, and neither creates an InstitutionWorkflow Run/Step.
- Negative contract tests for shared room membership, direct role DM, shared transcript and host-unread authority.
- Opaque-ref transient owner-read tests proving protected caregiver bodies are not copied into My-Chat Chat history.
- Black-box end-to-end journey through public scenario contract.
- Non-diagnostic health-language review.

## Required Evidence

记录精确 Nurture/Base/My-Chat pins、命令、测试数据版本和结果。不得用手工数据库修改或 UI mock 代替 receipt、authority 与 replay 证据。
