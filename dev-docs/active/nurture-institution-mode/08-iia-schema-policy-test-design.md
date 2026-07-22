# IIA Schema / Policy / Test Design

## Status

- **Phase:** Pilot-0-C4/Pilot-0-C `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO`; Pilot-0-D `PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING / EXTERNAL_TRAFFIC_NO_GO` at `DR-P0=0 / DR-P1=0 / DR-P2=0`; implementation remains separately unauthorized
- **Updated:** 2026-07-21
- **Scope:** verification projection only in the current task; do not edit `prisma/schema.prisma`, `scenario.manifest.yaml`, handlers, policies, presenters, or tests.
- **Input:** `10-pilot0-c-current-decision-index.md` is the current Pilot-0-C decision/status index; `docs/context/workflow/nurture-scenario-contract.md` is the exact cross-repository contract; `09-pilot-readiness.md` is the detailed decision ledger; `06-ib-nurture-schema-spec.md` is the schema projection and `07-ib-decision-convergence.md` remains historical IB convergence.
- **Next implementation gate:** C-3 implementation remains strict `C30 -> C31 -> C32 -> C33 -> C34 -> C35`. C-4 implementation requires separate authorization, a current qualified immutable C-3 component, and strict `C40 -> C41 -> C42 -> C43 -> C44 -> C45`. D implementation/candidate assembly follows the locked `11-pilot0-d-topology-operations-contract.md` only after separate authorization; Pilot-0-E remains blocked until current C-3/C-4 qualification and complete-candidate evidence exist.

## Pilot-0-D operations conformance projection

D implementation evidence MUST prove, without changing the C-3/C-4 business
contracts:

- a content-addressed undeployed complete candidate that binds exact
  `pilot_topology_operations_source_v1`, canonical static behavior-affecting
  non-secret values, and every controller/resolver revision; current gate
  values, evidence instances/seals, live provisioning specs, E, deployment,
  secrets and results remain outside candidate identity;
- the detached complete-candidate signature is verified from the isolated
  candidate-signing workload/issuer/audience and attests bytes/provenance only;
  builder-signing cannot substitute for E, deploy, stage or activation approval;
  E binds the exact signature digest/key/trust head, and swapped signatures or
  later signer/provenance invalidation make E noncurrent;
- `pilot0_d_candidate_evidence_authorization_v1` and its isolated current
  resolver permit exactly one disposable candidate-bound dual-owner evidence
  environment with `externalProductTrafficCount=0`; terminal false/rows-`[]`, credential
  revocation and teardown precede the signed/current
  `pilot0_d_predeployment_evidence_seal_v1`, and none can target persistent
  Pilot or alias C-3/C-4 evidence. Its row is only
  `candidateKind=complete_pilot_evidence_v1` with profile
  `nurture_institution_complete_pilot_evidence_v1`, current C-3/C-4
  qualification, current D authorization, and an independently signed/current
  `pilot0_d_disposable_deployment_binding_v1`; reject E/Pilot-1/stage authority,
  every cross-kind/profile reuse, and disposable runtime drift at every seam.
  Only the D evidence authority may create/enable the exact authorized row; no
  actor may extend/retarget/re-enable it, while Technical Operator and
  infrastructure hard-stop retain disable-only paths;
- `externalProductTrafficCount` tests MUST increment on every admitted
  product/private-owner/business/Notification/open effect with a represented
  human actor/recipient outside the seven internal accounts or technical
  caller/destination outside the candidate allowlist, and on every excluded
  provider/recipient dispatch attempt. An authenticated request reaching Host
  Nurture route/admission from a non-experiment source session/Workspace/account
  MUST increment even when denied before owner call. Tests MUST keep an
  exact allowlisted Host-to-owner call for an allowlisted internal actor at zero
  while still recording the internal product event. A negative probe from an
  exact internal source account/session with an injected wrong target MUST stay
  at zero only when denied before owner call/effect and MUST independently pass
  the privacy/no-effect assertion. They MUST exclude only audited
  edge-denied unauthenticated scans, health probes, and exact allowlisted
  control-plane/service/KMS/secret/ACR/backup/body-free-telemetry/evidence/
  recovery traffic that cannot enter a Nurture business owner path. Counter
  derivation MUST bind the exact environment/candidate/deployment/Workspace/
  interval, append-only source identities/high-water marks, included/excluded
  event-set digests, and continuity/gap proof. Counter absence, reset, source or
  retention gap, unclassifiable event, interval ambiguity, unaudited exclusion,
  or a nonzero value fails the D
  evidence seal, Pilot-2 readiness seal, and Pilot-4 result;
- `pilot0_traffic_readiness_census_v1` tests MUST require exactly the stable ids
  `TR-P0-1..6`, `TR-P1-1`, `TR-P1-2`, `TR-P1-3a`, and `TR-P1-3b`, each with exact
  candidate/evidence refs and one disposition. E accepts only all P0 plus
  `TR-P1-1|2|3b=closed` and
  `TR-P1-3a-native-external-delivery=accepted_scope_exclusion`, with static/
  registry/network absence proof. Missing, duplicate, renamed, unknown,
  `waived|not_applicable`, accepted exclusion on another id, or native/provider
  capability presence MUST fail before an E `go` decision;
- exact append-only E-decision, deployment-binding, and Pilot-2/Pilot-4
  stage-authorization stores/events/current resolvers reject stale, ambiguous,
  revoked, superseded, drifted, unavailable or wrong-stage state. Activation
  rows bind their exact ids/head digests plus stage prerequisite seals;
- two ECS/two RDS owner boundaries, My-Chat-only public ingress, private Nurture
  owner API, Nurture retention worker, My-Chat-only Redis, default-deny network,
  exact OCI digests, SBOM/provenance, and Alibaba Secrets Manager/KMS custody;
- environment capability plus one exact Workspace activation row, current
  C-3/C-4/E/deployment/stage predicates, and fail-closed current resolver reads
  at every Host admission and owner-call attempt plus each later
  materialize/delivery/retry/open/reconcile effect. Nurture locally verifies the
  persisted bounded Base `ScenarioActivationAdmissionV1` complete-Pilot variant
  only after verifying the separately signed fresh `ScenarioPrivateInvocationV1`
  envelope/nonce; it performs no remote Host/gate read inside the transaction.
  Prove disable-before-admission zero effect,
  admitted-in-flight at-most-one effect, expiry, and store-outage denial;
- `pilot0_institution_provisioning_spec_v1`, its isolated controller/store/
  current resolver, exact bootstrap claim/workload/audience, durable one-effect
  operation, writer-fenced status lookup and permanent closure create the first
  Institution/Admin only after exact Host invitation acceptance/membership.
  Prove stale `claimed` classification can only CAS back to `prepared` for the
  same operation within budget or to terminal `closed_no_effect`; closed never
  reopens. Nurture commit and Host
  `owner_committed + spec consumed + quarantine clear` are owner-separated
  transactions; the latter atomically clears `outcome_unknown`, and response loss permits only status recovery,
  never command rerun based on an unconsumed spec.
  Wrong/concurrent/expired/drifted/replayed/ordinary-admin/operator attempts and
  every substitution with `c4_bootstrap_evidence_*` fail before a second effect;
- bootstrap-admission tests MUST derive the first live row as
  `bootstrapAdmissionMode=bootstrap_only`, permit only the exact bootstrap
  claim/status-recovery lanes, and prove zero ordinary Nurture ingress/read/
  action, Workflow/materialization, delivery, or open calls. Only exact
  same-spec/same-operation `owner_committed + spec consumed + quarantine clear`
  may derive `ordinary_ready`; response loss, `closed_no_effect`, unknown,
  expiry/revoke, ambiguity, or resolver outage remains bootstrap-only and
  fail-closed;
- distinct release/deploy/secret/enable/disable/restore/business credentials,
  Technical Operator disable-only behavior, refs-only recovery and zero direct
  business/database edit;
- body/raw-id/token/claim/secret-free telemetry, `POPS-SEV0/1/2` alerts,
  fail-closed owner/KMS/audit/qualification outages, and terminal recovery
  evidence;
- independent encrypted PITR for both owner databases at `RPO <= 15 minutes /
  RTO <= 4 hours`, disabled isolated restores, restored-row noncurrent denial
  plus audited owner-command convergence to `[]`, external append-only privacy
  ledger head verification/idempotent redaction/source-delete/retention-delete/
  policy-erase replay, forward-only migration/repair, no distributed rollback,
  and the full safe-usable RTO endpoint rather than RDS availability; and
- `pilot2_rehearsal_readiness_seal_v1`, Pilot-3 exact-topology full-disable
  `pilot3_terminal_rehearsal_seal_v1`, and owner-path/no-DB-reset
  `pilot4_observation_baseline_seal_v1`, followed by a fresh Pilot-4
  authorization/row; verify their isolated stage-evidence signer, append-only
  heads/current resolver and invalidation semantics. The Pilot-2 provisioning
  lineage accepts only the exact same-spec/same-operation monotonic sequence:
  issued spec, `prepared(clear)`, `claimed(clear|outcome_unknown)`, a
  writer-fenced within-budget return to `prepared(clear)`, then
  `owner_committed + consumed + quarantine clear`. Every intermediate state
  remains bootstrap-only; `closed_no_effect`, budget bypass, or identity drift
  invalidates the stage. Pilot-3 requires a distinct signed
  fault-plan authorization; only the complete ordered matrix, kill switch,
  recovery census and exact `gates_closed -> final_binding_bound -> plan
  consumed_success -> Pilot-2 stage authority consumed -> terminal seal`
  lineage may succeed. Transition resolution MUST accept an exact partial
  prefix only to append/retrieve the one next effect-decreasing successor:
  `plan consumed_success` may prove only bound stage-authority consumption, and
  the consumed stage head may prove only terminal sealing. Verification
  resolution MAY accept historical issued/consumed heads only through the
  complete append-only chain. Test crash/response loss and exact retry after
  every successor; retry MUST return the existing successor, perform no second
  rotation/consume/seal, and resume only the next missing transition. Expiry,
  revoke, abort, early consume/seal, order gap, duplicate/divergent successor,
  attempted re-enable, unexpected row/deployment/config drift, resolver outage,
  or incomplete execution is non-passing and blocks Pilot-4. Its terminal seal proves the controlled
  rehearsed-binding -> final-binding rotation transition. The Pilot-4 baseline
  must prove the full current Guardian/Admin/Caregiver/Lead/Enrollment/
  Grant/Thread/Institution/Group/surface topology with no operator role or
  database repair. Then require five
  contiguous signed daily observation segments and an independently reviewed
  terminal `pilot4_observation_result_v1`, an uninterrupted
  `[T0,T0+120h)` window whose gates close at Tend, and exactly one terminal-stop
  record for every non-PASS result. Conformance MUST keep `pass` (five passing
  daily seals/no stop), `no_pass` (criterion failure, including a failed full
  segment or Tend terminal failure), and `stopped` (preventive/manual/authority
  withdrawal without criterion failure) disjoint, with `no_pass` priority. The
  terminal daily seal (any failed full-segment seal or the fifth passing seal),
  required terminal-stop evidence, and terminal result alone may use the
  evidence-only two-hour sealing grace,
  the exact seven-question/three-child/four-Guardian surface sample,
  all-or-nothing PASS, and terminal stop/restart rules. An admitted eighth or
  otherwise unplanned Nurture business effect MUST force immediate `no_pass`,
  fail-closed gate shutdown before any new admission, frozen recovery-only
  settlement of its already admitted at-most-once outcome, and terminal-stop evidence;
  a denial before admission with zero owner call/effect MAY be recorded as a
  negative probe and MUST NOT alter or fill the sample.

Pilot-0-D itself is planning evidence only. No implementation or qualification
result is claimed by this projection.

## 1. IIA Target

IIA turns the locked IB contract into an implementation sequence for the first institution ecology slice:

1. Add Nurture-owned care ecology persistence.
2. Add resolvers and policies for participant, role assignment, child scope, grant, and surface role behavior.
3. Add scenario capabilities for `class_family_inbox`, `teacher_attention_board`, `caregiver_daily_care`, and `child_media_attribution`.
4. Add tests proving the locked three-child Pilot teacher workflow, family privacy, grant-gated flow, revoke runtime fence, message redaction, and My-Chat opaque delivery boundary. The historical class-of-ten suite remains an optional scale regression and is not Pilot qualification evidence.

IIA must preserve these locked rules:

- `NurtureChildCareProcess.id` is the independent child scope.
- `NurtureParticipant` is unique per `(workspaceId, myChatUserId)`.
- Guardian and caregiver roles may use role-agnostic Nurture Chat; guardian also uses family board/workbench, caregiver uses teacher board, and institution admin uses institution board/workbench rather than Nurture Chat. My-Chat selects only Nurture and Nurture resolves surface entitlement, role/scope/target/business direction/output.
- Dashboard/board surfaces may switch among validated `NurtureCareRoleAssignment` rows.
- One active `NurtureFamily` exists per `NurtureChildCareProcess` in MVP.
- Main-chat scenario responses and explicit Nurture dashboards use generic realtime render paths; host persistence is limited to opaque optional activation bookkeeping.

## 2. Implementation Slices

| Slice | Name | Purpose | Exit criteria |
| --- | --- | --- | --- |
| IIA-0 | Contract preflight | Confirm manifest/context refs, repository ports, and resolver input DTOs before schema migration. | No live capability enabled; design maps to current module boundaries. |
| IIA-1 | Prisma schema | Add care ecology models/enums and indexes from IB; keep existing P0 family workflow tables intact. | `prisma validate`, migration preview, and refreshed DB context pass. |
| IIA-2 | Repositories/resolvers/policies | Implement typed repository ports, actor resolution, target-scope resolution, grant checks, and fail-closed policy decisions. | Policy unit tests cover positive and negative cases. |
| IIA-3 | Capabilities/handlers/presenters | Wire first institution capabilities and presenters behind manifest entries. | Module validator and registry load pass; no capability leaks Nurture facts into My-Chat host state. |
| IIA-4 | Journey tests | Prove the exact three-child Pilot family-to-org workflow and negative safety/privacy paths; retain class-of-ten only as separate scale regression. | End-to-end scenario tests pass, including revoke/redaction/stale notification cases. |

### 2.1 IIA-0 Contract Decisions

#### IIA-0-C1 Capability Slice

**Status:** LOCKED on 2026-07-08.

**Decision:** First-slice manifest contract includes four separate capability keys:

- `class_family_inbox`
- `teacher_attention_board`
- `caregiver_daily_care`
- `child_media_attribution`

Teacher mobile is a surface composition, not a canonical business capability. It may render these capabilities together as one teacher work surface, but it must not own their business facts, policies, or lifecycles.

Implementation sequencing:

1. Start with `class_family_inbox` + `teacher_attention_board` as the `family_to_org` teacher workload closure.
2. Add `caregiver_daily_care` after inbox/attention can resolve child scope, caregiver scope, grant behavior, and presenter shape.
3. Add `child_media_attribution` after the core teacher work surface can validate caregiver/admin scope and exposure policy.

Rationale:

- `class_family_inbox` validates the real pain: one class has many child-private family threads, while the teacher needs one class workflow.
- `teacher_attention_board` validates child-scoped projection over family-care items, care constraints, daily care logs, and policy-derived attention.
- `caregiver_daily_care` writes new care facts and can feed both `teacher_attention_board` and `org_to_family` sharing.
- `child_media_attribution` is first-slice institution value, but it is not required to prove the minimum `family_to_org` communication loop.
- Keeping capability keys separate avoids one oversized `teacher_mobile_workbench` capability with mixed source-of-truth, policy, and lifecycle semantics.

#### IIA-0-C2 Surface Contract

**Status:** LOCKED on 2026-07-08.

**Decision:** My-Chat surfaces pass entry context, conversation continuity refs, current payload, generic display state, and Nurture-issued opaque scenario tokens only. Nurture is the sole resolver of participant, role assignment, work scope, child scope, grant state, policy decision, current object state, and output.

Ownership split:

- My-Chat owns chat conversation continuity: `hostConversationRef`, `hostTurnId`, message display, host transcript, shell navigation, and whether the user opens an old conversation.
- Nurture owns scenario interaction context: `nurtureInteractionContextId`, pending intent, candidate role/scope refs, clarification state, pending draft/action refs, TTL, and staleness state.
- Nurture owns business memory/facts: family-care threads/messages/items, daily care logs, care constraints, grants, role assignments, child care process state, attention items, and media attribution facts.

Main-chat routing rules, refined by Pilot-0-B3-0:

- Guardian and caregiver Nurture work MAY enter through My-Chat Chat. My-Chat MAY process the current turn to decide whether it belongs to Nurture, but the route decision only selects `scenario=nurture`; it does not resolve the Nurture actor role, work scope, child target, business intent, grant, or propagation direction.
- Institution-admin Nurture work MUST enter through the institution board or institution domain web workbench. General My-Chat Chat remains available to the account but MUST NOT expose Nurture institution-management actions.
- My-Chat SHOULD reuse an explicit Nurture entry, existing conversation-to-scenario binding, or returned Nurture `scenarioToken` before invoking generic intent routing again. Route reuse is a host conversation optimization, not Nurture authorization.
- After Nurture is selected, the existing Surface Contract envelope applies. Nurture independently resolves whether the actor is currently acting as guardian, caregiver, or institution administrator and whether the requested effect is `internal_fact`, `family_to_org`, or `org_to_family`.
- The system invocation direction (`My-Chat -> Nurture -> My-Chat scenario response`) and the Nurture business distribution direction (`family_to_org` / `org_to_family`) are independent concepts and MUST NOT be inferred from each other.

Surface rules, superseded by the exact C-3-0b/c contracts:

- `nurture_chat` enters through the verified private invocation and exact registered product-surface key. Client broad `workspaceId|myChatUserId|surface|clientLocalContext`, trusted role/scope/target, and Host business authorization decisions are rejected; C-3-0c-1/2 provide the only subject/presentation input.
- Family, teacher, and institution boards use their exact registered product-surface key and may request only the locked `current|recent|history`, owner cursor/page, item detail, and owner-issued navigation. Arbitrary filters, sort, selected-tab authority, persisted scenario token, raw role/scope/target/data-class/direction, and local business filtering are forbidden in Pilot-0.
- Notification/deep-link entry carries only the recipient-bound Host Notification id through the generic open route. Delivery ids/dedupe/provider status, raw Handoff/Nurture targets, and scenario tokens do not enter provider payload, client route, or semantic presentation.
- The family domain web workbench is guardian-entitled and the institution domain web workbench is institution-admin-entitled; neither accepts a host-authored Nurture role/scope. The first internal experiment exposes no caregiver domain web workbench. Institution admin is not ambient access to family content or all child facts.
- Host `web_run_workbench` and technical Admin are not Nurture domain workbenches and MUST NOT gain business access through surface naming or routing.

Pilot-0-B3-1a Guardian action refinement:

- Guardian Chat MUST remain the generic My-Chat AI/semantic-presentation harness. Nurture returns the C-3-0c semantic contract and MUST NOT add a Guardian-specific Chat shell or second Chat business lifecycle.
- Existing `timeline_inline`, option, preview, authorization, bottom-sheet, and full-screen components are UI foundations only. The broad mobile `InteractionEnvelope` is not the activated Nurture wire and cannot satisfy C-3-0c renderer conformance without an additive compatible adapter/registry.
- Question submission, grant confirm/replacement, revoke, and author redaction are reachable from Chat, family board, and family workbench. Presentation differs, but every durable effect uses the same Nurture command specification, current resolver/policy checks, and CommandExecution kernel.
- `confirm_family_enrollment` is also reachable from all three Guardian surfaces with strong confirmation. It accepts the current proposed child/family enrollment under Guardian authority and does not implicitly create a grant.
- Natural language, selected surface, dashboard projection, and client state are not authorization. Every confirmation reloads current actor, role, child/family scope, grant, object lifecycle, and expected version before execution.
- Family board is current/recent work scope; family workbench is complete authorized history and complex grant review. Neither owns a parallel message, receipt, grant, or action state.
- Revoke cannot require web-workbench access. Submitted questions cannot be edited in place or hard-deleted; correction/resend uses a new command, while redaction changes current visibility under the existing retention/audit contract.
- `cancel_route` is not declared in Pilot-0 because the immediate logical route has no user-visible pending cancellation window. Tests MUST reject every conditional legacy cancel affordance on Guardian surfaces.
- The Pilot's designated primary/secondary guardian script does not create a `primary_guardian` role or client-side permission rule; action availability always comes from current Nurture facts and policy.

Pilot-0-B3-1b Caregiver action refinement:

- Caregiver Chat remains the generic My-Chat AI/interaction harness, while the teacher board is the complete Nurture work surface. Both MUST close acknowledge/reply without a caregiver domain-workbench fallback.
- Chat timeline and activation payloads remain display-safe. Protected family-question bodies are loaded by opaque ref from Nurture into a transient detail surface after current owner reread and MUST NOT be persisted as My-Chat Chat messages, interaction history, projections, or logs.
- Item open is read-only and does not imply Nurture acknowledgment. Host notification read/unread remains separate. `nurture.family_care.acknowledge_item` requires an explicit current caregiver confirmation and command precondition recheck.
- The later C-3-0e/C-3-3 contract supersedes this checkpoint's original draft allowance. Pilot protected AI is absent/off; a caregiver manually composes in the empty protected editor, and only a caregiver-confirmed `nurture.family_care.reply_item` action may create a named caregiver-authored family-facing message.
- Teacher board MUST include complete owner-paginated authorized open/acknowledged/replied/blocked-or-revoked/redacted-or-suppressed history because no Caregiver domain workbench exists. Pilot-0 uses current/recent/history, owner cursor/page, item detail, and owner-issued navigation. Arbitrary search/sort and compound child/care-group/status/time filters require a later owner query-control contract. Redacted/suppressed rows expose only display-safe state or tombstone metadata, never protected bodies.
- Caregiver-authored replies are immutable after commit. Redaction follows current author/policy checks; in-place edit, automatic reopen, second reply, and correction remain outside Pilot-0 and require a later explicit command contract.
- Direct family Chat, bulk actions, clarification loops, daily-care outcomes, grant/enrollment/topology administration, cross-care-group work, reassignment, and duty handoff are unavailable in the first internal experiment.
- Final acknowledge/reply/redaction commands MUST fail closed after revoke, source redaction, enrollment/role change, item-version conflict, or policy change. A draft or alternate surface is not authorization.

Pilot-0-B3-1c Institution action refinement:

- The institution board MUST remain read-only in the first internal experiment. It exposes only safe topology/readiness/backlog aggregates, unavailable-state categories, and navigation; projection cards do not execute durable Nurture writes.
- The institution domain web workbench is the only Institution surface for authoritative institution/care-group lifecycle, invitation initiation, staff-role, enrollment, lead-caregiver, policy, and scoped business-disablement commands. Every write uses the shared `CommandExecution` kernel with idempotency, expected version, current institution-admin role/scope, target lifecycle, and policy revalidation.
- Adult invitation is coordinated across ownership boundaries: Institution may initiate; My-Chat owns canonical account invitation/authentication/acceptance; Nurture maps the accepted user into participant/role facts. Institution MUST NOT bind raw `myChatUserId` values or accept for another user.
- Institution may initiate enrollment topology but MUST NOT establish/revoke Guardian relationships or create/replace/revoke grants. Family authority confirms the child/family linkage and applicable grant.
- Institution coverage views MAY expose safe enrollment/grant metadata such as scope, direction, system `dataClass`, version, and status. They MUST NOT expose family question/reply bodies, consent/revoke narrative, child-specific care facts, or named caregiver-authored content.
- Suspend/close/disable transitions preserve canonical and audit facts; recovery is a separate revalidated command, not a blind toggle. No Institution surface hard-deletes topology or controls My-Chat capability, allowlist, Workflow Run/Step/Handoff/Outbox, notification, or technical recovery.
- Operational aggregates MUST NOT become child ranking, cross-group comparison, public caregiver scoring, or competitive institution ranking. The synthetic direct-Prisma fixture remains test preparation and cannot substitute for authenticated owner commands.

Pilot-0-B3-1d-0 action-key layering refinement:

- The canonical cross-surface product identity is `(scenario_key, action_key)`. Nurture action keys use stable `snake_case`; the same business intent keeps one key across Chat, role boards, and domain workbenches.
- Nurture `command_key` is the immutable dotted `CommandExecution` contract. Existing keys `nurture.family_care.capture_and_route`, `nurture.family_care.revoke_grant`, `nurture.family_care.acknowledge_item`, `nurture.family_care.reply_item`, `nurture.family_care.redact_message`, and `nurture.family_care.cancel_route` keep their persisted names and MUST NOT be renamed or duplicated to match UI labels.
- Workflow `entrypoint_key` starts a workflow definition; `handler_key` binds implementation. Neither value is the product action identity, and direct entity actions MUST NOT create synthetic Runs solely to fit an entrypoint API.
- Product action key, surface, opaque target ref, expected version, and confirmation state remain untrusted until Nurture re-resolves actor, entitlement, role/scope, grant, policy, lifecycle, and current version.
- Read/search/navigation/selection/AI-draft/preview/detail-open interactions are non-durable and MUST NOT create a `CommandExecution` or fake durable action.
- The existing manifest `action_availability.scenario_actions` contract is Workflow Run/Step-shaped. Message/Grant/Item/Enrollment actions MUST NOT be added there or reinterpret the four legacy scenario-action handlers. Cross-surface domain actions require an additive contract/registry.
- My-Chat Admin recovery actions remain Host-owned and MUST NOT become Nurture action or command keys. B3-1d-1 separately decides their operator entitlement and safe exposure.

Pilot-0-B3-1d-1 technical-operator refinement:

- The technical operator MUST be a named internal My-Chat platform-operations account with exact Pilot-workspace scope. Generic workspace-admin or Nurture institution-admin status alone is insufficient and MUST NOT expose Technical Admin recovery.
- Technical Admin MAY expose safe Run/Step/Handoff/Outbox/notification/audit IDs, states, versions, counts, timestamps, and reason/correlation evidence. It MUST NOT expose protected Nurture bodies, consent narrative, claim/service tokens, or user-bearing raw provider errors.
- The Host operation `reconcile_outcome_unknown_step` maps to the existing Step reconciliation endpoint and preserves the original Step, command identity, driver ref, and snapshot request identities. It cannot construct a substitute Step, Draft, or Handoff.
- Existing `replay_failed` is available only for a replayable failed Handoff; existing `stop_pending` is available only before downstream logical effect. Both require exact workspace, expected version, idempotency, current Handoff state, and owner reread.
- Planned `request_owner_reevaluation` carries host evidence plus opaque refs to Nurture. The Nurture owner service rechecks source/grant/scope/policy/Receipt/Item and decides any deterministic transition; the operator cannot choose business blocked/failed/delivered/cancelled/reissued state.
- The operator MAY execute disable-only emergency shutdown under the approved two-key runbook. Re-enable, workspace addition, or cohort expansion requires a new Go/No-Go and is never an operator convenience action.
- The operator MUST NOT directly invoke Guardian/Caregiver/Institution commands, edit technical or business records, mint provenance, alter refs/payload/purpose/target/expiry, or repair databases/queues outside a separately authorized incident process.
- Every operator write MUST persist actor, workspace, target, operation, expected version, idempotency, correlation/causation/trace, safe reason, before/after version, and Outbox evidence without Nurture bodies or secrets.

Pilot-0-B3-1d-2 exact domain-action refinement:

- Guardian mappings are `confirm_family_enrollment -> nurture.family_care.confirm_enrollment`, `suspend_family_enrollment -> nurture.family_care.suspend_enrollment`, `resume_family_enrollment -> nurture.family_care.resume_enrollment`, `confirm_enrollment_transfer -> nurture.family_care.confirm_enrollment_transfer`, `decline_enrollment_transfer -> nurture.family_care.decline_enrollment_transfer`, `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment`, `exit_guardian_relationship -> nurture.family_care.exit_guardian_relationship`, `update_child_care_stage -> nurture.family_care.update_child_care_stage`, `confirm_child_link_grant -> nurture.family_care.confirm_grant`, and `replace_child_link_grant -> nurture.family_care.replace_grant`; existing `revoke_child_link_grant -> nurture.family_care.revoke_grant` remains unchanged. Family pause/transfer/withdrawal/self-exit/stage actions remain design-only until their owning C-2/C-3 implementation.
- Enrollment confirmation, initial grant confirmation, replacement, and revoke MUST use separate command identities, expected versions, policy checks, and audit events. A changed grant contract requires replacement; a revoked grant is never reactivated.
- Institution mappings use matching explicit action and `nurture.institution.*` command verbs: `create_care_institution`, `update_care_institution`, `create_care_group`, `update_care_group`, `suspend_care_group`, `resume_care_group`, `close_care_group`, `assign_staff_role`, `revoke_staff_role`, `designate_lead_caregiver`, `initiate_enrollment`, `suspend_enrollment`, `resume_enrollment`, `propose_enrollment_transfer`, `cancel_enrollment_transfer`, `close_enrollment`, `update_institution_policy`, and `update_care_group_policy`.
- Generic `upsert_*` and `change_*_state` actions are forbidden. Institution `suspend_enrollment` / `resume_enrollment` apply only to its exact side-owned Enrollment hold; `resume_enrollment` cannot clear a family hold or promise aggregate active. No `pause_institution_enrollment` alias may be introduced. Close is terminal in Pilot-0.
- `initiate_participant_invitation` maps to planned Host command `my_chat.workspace_invitation.create`. My-Chat owns delivery/authentication/acceptance; only after acceptance may an owner callback execute planned `nurture.institution.bind_accepted_participant` with a canonical user ref. The callback is not a surface action and grants no role implicitly.
- Scoped Pilot business disable/recovery uses `suspend_care_group` / `resume_care_group`; no scenario-local Pilot enablement aggregate is added. Environment capability and workspace allowlist remain My-Chat technical gates.
- The new keys are reserved design contracts, not implemented claims. Direct fixture provisioning MAY prepare the internal synthetic institution/group before traffic but MUST NOT substitute for authenticated owner commands once user-operable onboarding begins.

Pilot-0-B3-1d-3 availability and adoption refinement:

- Domain-action `safe_reason_code` is limited to `available`, `not_implemented`, `capability_disabled`, `surface_not_entitled`, `actor_not_entitled`, `scope_unavailable`, `target_unavailable`, `state_not_actionable`, `target_changed`, `enrollment_inactive`, `grant_missing`, `grant_revoked`, `policy_blocked`, `operator_not_authorized`, `technical_state_not_recoverable`, `owner_unavailable`, and `temporarily_unavailable`.
- Nurture owns `safe_label` and optional `safe_help`; My-Chat renders the generic availability/confirmation state without interpreting scenario semantics. Availability is not authorization and every command reruns current resolution/preconditions.
- `confirmation_class` is independent and limited to `explicit` or `strong_authorization`. Confirmation requirements MUST NOT be encoded as reason codes or inferred from surface/action labels.
- Internal participant/role failures map to `actor_not_entitled`; family/child/group/thread reachability maps to `scope_unavailable`; missing/redacted targets map to `target_unavailable`; lifecycle conflicts map to `state_not_actionable`; version conflicts map to `target_changed`; data-class/direction mismatch maps to `policy_blocked`; contention maps to `temporarily_unavailable`.
- `not_implemented` is readiness/dev-only for known actions absent from the active registry. A `domain_action_contracts` declaration without a valid handler is fatal and MUST NOT fall back to runtime `not_implemented`.
- Base adds optional additive `domain_action_contracts` plus separate availability/command/handler contracts. Validators reject duplicate/reserved keys, missing handlers, invalid target/surface/confirmation declarations, and Run-action handler reuse while preserving legacy fixtures.
- My-Chat adopts the exact Base revision and generic routing/renderer/registry with capability off. Nurture adopts only after authenticated handlers, current owner presenters, commands, and wrong-surface/role/scope/version/grant/admin/raw-id/owner-outage/privacy negative tests pass.
- Adoption order is Base -> My-Chat -> Nurture. No simultaneous switch, legacy reinterpretation, or traffic/capability enablement is allowed during contract adoption.

Pilot-0-B3-2a cross-surface transition refinement:

- A transition carries intent/navigation only: generic destination `route_class`, Nurture-issued opaque continuation, and necessary display expiry/bookkeeping. URLs, notification payloads, logs, analytics, and client route state MUST NOT carry raw Nurture object/role/scope ids or token material.
- If the current entitled surface can close the action, navigation SHOULD NOT be required. Guardian complex history/enrollment/grant work targets `family_workbench`; Caregiver full detail/history targets `teacher_board`; Institution writes target `institution_workbench`; technical recovery remains `technical_admin`.
- Transition open is read-only and MUST NOT acknowledge, confirm, submit, cancel, revoke, redact, reissue, retry, or execute a command. The destination owner-rereads current participant, surface entitlement, role, scope, target, grant, policy, lifecycle, expected version, and action availability.
- My-Chat treats route class as generic shell navigation and MUST NOT decode the opaque continuation or synthesize Nurture targets. Changed token binding/entitlement/target/policy returns current safe unavailable/result state and actions, never cached controls or protected detail.
- A command already completed on the source surface is reread at the destination through current Execution/business facts. Navigation neither reruns the command nor enters command identity.
- Transition telemetry is limited to route classes, source/destination surface, safe outcome, latency, and opaque correlation. Transition creates no Nurture business fact and carries no bodies, raw ids, or token values.

Pilot-0-B3-2b opaque-token refinement:

- The Pilot purpose set remains exactly `clarify|submit_action|open_notification`. Generic navigation without one of these purposes carries only route class plus the B3-2d allowlisted `current|recent|history` display mode; `open_notification` MUST NOT become a general object-browser token or business target/filter/cursor carrier.
- Every token binds workspace, current participant, purpose, and the surface where it is consumed/opened. Chat clarification also binds the hashed host conversation. A token issued for one surface MUST NOT be accepted as a cross-surface credential; an intended destination token is issued for that destination.
- Pilot TTL is fixed at five minutes for `clarify`, five minutes for `submit_action`, and seven days for `open_notification`. TTL expiry affects continuation only and MUST NOT transition Message, Receipt, Item, clarification deadline, Grant, Enrollment, or any other business fact.
- A structurally valid clarify answer consumes its context once. Invalid/mismatched input does not consume it; stale current facts return safe blocked/recovery and any further clarification uses a new context/token rather than extending the old row.
- `submit_action` binds action key, opaque target refs, expected versions, prepared schema/hash, immutable refs, and a stable command request id derived from context id + purpose. Token consumption, `CommandExecution`, and the business effect MUST commit atomically. Exact response-loss replay returns the committed Execution; deterministic stale/denied state revokes the context; retryable technical failure leaves the unchanged token active only within TTL.
- `open_notification` stores locator refs only, is reusable/read-only until expiry/revoke, and every open owner-rereads current participant/role/scope/grant/policy/target lifecycle. Open MUST NOT mark a Nurture Receipt read/acknowledged or execute any command.
- Refresh never mutates `expiresAt` or reactivates a consumed/revoked/expired context. Clarification regenerates current candidates, submit reopens/re-presents the action, and notification recovery returns through a current owner view before issuing any new token.
- Scenario tokens never satisfy `strong_authorization`. Internal mismatch/replay/revoke/expiry codes remain server-side and map through the accepted safe availability vocabulary. The Pilot-0-B3-2c section fixes notification transport/open behavior.

Pilot-0-B3-2c notification/deep-link refinement:

- Provider payload and deep link carry only a server-side recipient-bound My-Chat `notification_id`, generic notification-open route, and generic copy that remains safe after revoke/redaction. They MUST NOT carry scenario token, Handoff id, Nurture ref/id, protected body, target/action state, or cached authorization.
- Nurture Notification list DTO exposes only Notification id/type/read state, generic safe copy, and generic deep link. Internal Handoff target id/type and metadata remain server-side and MUST NOT be returned as a client navigation target.
- The generic route is `morethan://notifications/{notification_id}/open`. Authentication and exact Notification `userId + workspaceId` validation happen before Ledger/Nurture access. Wrong user/workspace/id returns the same generic unavailable result and MUST NOT call Nurture.
- After recipient validation, My-Chat marks only the Host Notification read state. Owner-ready, stale, unavailable, or transient owner-outage landing all count as a Host open; none changes Nurture Receipt/Item/Message or creates `CommandExecution`.
- My-Chat rereads an eligible `requested|completed` Handoff, then calls a dedicated Nurture open resolver with the authenticated actor. `stopped|failed` Handoff cannot open or be resurrected. The requested state remains eligible only for the crash window where Notification committed before Handoff completion was recorded.
- Ready open issues a destination-bound `scenarioToken(purpose=open_notification)` after current owner checks. Raw token exists only in the response/client navigation channel; provider payload, URL, durable My-Chat Notification/metadata, logs, analytics, and telemetry MUST NOT store the value. The destination owner-rereads again before protected render/action availability.
- Delivery eligibility and open visibility are different owner operations. Delivery requires current reason to notify; open may route an already acknowledged/replied/closed item to current authorized detail/history. Open MUST NOT reuse delivery's `item.status=open` predicate as a universal visibility rule.
- Owner state is rechecked before Notification creation, before every provider send/retry, and on every open. Pre-send revoke/redaction/cancel or terminal target state yields delivery `skipped`; transient owner failure sends nothing and enters bounded retry; post-send state change cannot recall the OS notification but wins at open.
- Current visible lifecycle change returns current detail/history and current actions, never stale controls. Source redaction/withdrawal/suppression may expose only an owner-approved tombstone. Grant/role/enrollment/scope removal, stopped/failed Handoff, or disabled capability returns no protected token/detail.
- The generic Host response classes are exactly `ready|unavailable|retryable`. Nurture supplies safe label/help/retry; My-Chat MUST NOT interpret grant, redaction, lifecycle, or policy reason semantics. Internal `handoff_unavailable` does not become client domain state.
- Notification list copy may be rendered from the generic durable Host record without a per-row owner call. Opening, retrying, destination rendering, or executing an action always uses current owner state. Repeat/multi-device opens are read-only and may issue separate TTL-bound tokens after current checks.

Pilot-0-B3-2d draft/result/history continuity refinement:

- Pilot continuity guarantees committed Nurture facts/results and current authorized history across surfaces; unfinished bodyful drafts do not cross surface, device, account, participant, or guardian boundaries.
- Unsubmitted manual protected text/form belongs to the creating actor and surface. Any future separately gated AI draft has the same boundary, while Pilot protected AI is absent/off. Same-surface `clarify|submit_action` may use the existing 5-minute context, but a non-empty draft leaving the surface requires explicit stay/discard. Refresh/process loss/cross-device recovery is not guaranteed.
- My-Chat Chat transcript is Host conversation history and MUST NOT reconstruct, resubmit, seed, or authorize a Nurture draft. User-authored Chat text may remain under Host policy; Pilot caregiver protected text is manually composed and ephemeral, and any future separately gated AI draft MUST NOT persist in Chat history.
- Existing My-Chat `PublicDraft`, Workflow artifact draft, and Nurture forum-publication Handoff remain external-publication mechanisms. They MUST NOT store family-care question/reply, grant/enrollment, or Institution-command interaction drafts.
- Committed continuity is Nurture business facts plus refs-only `CommandExecution`. Source result summaries are display-only; response loss returns exact Execution replay; destination surfaces owner-query current facts and MUST NOT rerun the command or introduce `open_result`/generic object tokens.
- Non-notification transition carries only generic `route_class` and optional `view_mode=current|recent|history`. Business target ids, output refs, rows, owner pagination cursors, bodies, expected versions, action availability, and scroll state remain owner/surface-local. Pilot-0 has no arbitrary filter/search control; a future separately contracted query state would also remain owner/surface-local.
- Guardian family board owns current/recent and family workbench owns complete authorized family/grant/enrollment history. Teacher board owns complete authorized caregiver history. Institution board owns safe current aggregates and institution workbench owns authorized topology/configuration command history. Chat, Notification inbox, and Technical Admin are not Nurture business-history stores.
- Unsubmitted drafts are never visible to another guardian/device. Committed Message/Receipt/reply/outcome visibility follows current family relationship/grant/policy. Every Pilot page/detail/action rereads current owner state; any future separately contracted filter also owner-rereads. Redacted/suppressed history exposes only permitted tombstones.
- Round-trip tests MUST cover Guardian Chat -> board/workbench, second guardian visibility, Caregiver Chat -> teacher board, Institution board -> workbench -> board, response loss, concurrent/current-state change, revoke/redaction between surfaces, wrong actor/workspace/surface, reload, and cross-device access without duplicate effects or draft leakage.

Pilot-0-B3-3a first business input/data-envelope refinement:

- The first Pilot accepts only `family_care_question`. The trusted Nurture Pilot adapter fixes `category=question`, `urgency=today_attention`, `route_mode=immediate`, `requires_ack=true`, `requires_reply=true`, and `attachment_refs=[]` before the existing command runner.
- User-facing submission carries only trimmed plain-text question content plus a current Nurture-issued context/confirmation. Participant, role, child process, family, enrollment, care group, thread, grant, target, protected-content ref, source surface, data class, category, urgency, route mode, summary, and acknowledgment/reply flags are owner-derived or trusted-adapter fields, never raw client authority.
- Guardian question and caregiver-confirmed reply text are each 1–2000 Unicode characters after trim. Both remain behind protected content refs. Rich text, attachment, media, URL-bearing storage credential, and batch input are excluded.
- List/attention copy uses deterministic generic safe summary such as `Family question requires caregiver reply`; the summary is not an extract, classification, or AI summary of the protected body. Authorized detail always owner-rereads the protected body.
- Health observation, diagnosis, medication, emergency request, daily-care log, care-constraint change, follow-up workflow, and any other data class are unsupported in the Pilot profile. Recognized or uncertain out-of-profile input fails before the first business write with safe non-diagnostic/non-prescriptive routing; Nurture never silently remaps the input to `family_care_question`.
- Pilot AI cannot read or draft protected text. The empty manual protected composer cannot select/override the fixed classification, create caregiver-confirmed authorship before submit, bypass confirmation, or expand the envelope. The authoritative command values are deterministic.
- The generic schema/command kernel remains broader. Implementation MUST add one strict additive Pilot profile validator at the Nurture boundary and reject every value outside the profile before persistence; the validator MUST NOT fork the canonical Message/Receipt/Item/Execution lifecycle.
- Tests MUST cover exact allowed values, both 1/2000 boundaries, empty/overlong/control-only input, every fixed-field override, non-empty attachment, unsupported data class/category/urgency/route mode/source surface, raw-id/ref injection, unsafe content category, AI-draft-without-confirmation, and exact command replay.

Pilot-0-B3-3b Grant/family-authority/target-scope refinement:

- The complete Pilot question round trip uses one active Grant, not separate directional Grants. The exact fields are current workspace/child process/enrollment, `grantedToScopeType=care_group`, the enrollment's current care-group id, `directions=[family_to_org,org_to_family]`, `dataClasses=[family_care_question]`, and `purposes=[family_care_workflow]`.
- Effective time begins at confirmation. `expiresAt` is required and equals the earlier of 30 days after effectiveness or the exact Pilot workspace allowlist expiry. Expiry never auto-renews or reactivates a row.
- `org_to_family` authorizes only `nurture.family_care.reply_item` for an item created under the same Grant. The direction cannot authorize proactive institution messages, broadcast, daily-care sharing, clarification loops, or another data class.
- Capture persists the original `grantId`; acknowledge and reply must reload and validate that exact Grant. Revoke, expiry, replacement, target/enrollment drift, owner-role loss, or data-class/direction mismatch blocks the old item. A current replacement Grant applies only to new questions.
- At most one active Grant exists for `(workspace, child process, enrollment, care group, family_care_workflow)`. Identical confirmation returns `already_satisfied`. Any scope/direction/data-class/purpose/expiry change uses expected version and one transaction to mark the old Grant `replaced` and create a new active identity. No terminal identity returns to active.
- One designated Guardian performs first confirmation in the test script, but `primary_guardian` is not a role. Any current Guardian in the same active family may author a new question and owner-read committed family-visible question/Receipt/reply facts under the Grant. Only `grantedByParticipantId` may replace/revoke; message redaction remains exact-author only.
- Institution administrator, caregiver, and technical operator cannot create, confirm, replace, revoke, transfer, or directly edit a family Grant. Loss of the Grant owner's current Guardian eligibility blocks new cross-role use and requires a separately confirmed new Grant rather than implicit ownership transfer.
- Implementation MUST remove ambiguous active matching: overlapping active rows are rejected transactionally, repository resolution never relies on `findFirst` ordering among overlaps, and reply cannot switch from the item's original Grant to another current matching row.
- Tests MUST cover exact duplicate, overlapping create race, expected-version replacement race, all changed-definition dimensions, wrong direction/class/purpose/scope/enrollment, expiry/allowlist bound, original-Grant revoke/replace before acknowledge/reply, replacement non-revival, owner versus second-Guardian administration, same-family view, cross-family denial, owner-role loss, and non-family-role denial.

Pilot-0-B3-3c Message/Receipt/Item/Attention lifecycle refinement:

- The success path is exactly `open(v0) -> acknowledged(v1) -> replied(v2)`, implemented by three independently confirmed atomic Nurture commands. CommandExecution, output refs, business facts, and applicable handoff replay seed commit together; any conflict rolls the whole command back.
- Capture atomically writes one `family_authored/family_message/sent` Message, one complete family-to-org `delivered(v0)` Receipt, one `open(v0)` question Item, one `created` ItemEvent, one `active(v0)` TeacherAttention projection, the thread timestamp/version, and Execution. Immediate-only Pilot routing never exposes `pending` or cancel.
- Acknowledge requires current `open(v0)`, exact item version, exact original Grant, current caregiver/care-group/enrollment/thread/policy, and explicit confirmation. The command writes actor/time, `acknowledged(v1)`, an `acknowledged` event, and source Receipt `delivered(v0) -> acknowledged(v1)`. Attention stays active. No Message, reply Receipt, or implicit notification is created.
- Reply requires current `acknowledged(v1)`, exact version/original Grant, current caregiver scope, and explicit caregiver confirmation. The transaction writes one `caregiver_confirmed/caregiver_reply/sent` protected Message linked to Item/event, one org-to-family `delivered(v0)` Receipt targeted to the family, `replied(v2)`, the `replied` event, thread update, and Attention `active(v0) -> resolved(v1)`. The source Receipt remains acknowledged.
- Reply from `open`, `waiting_for_family`, or any other state is blocked. The current general implementation acceptance of `open|acknowledged|waiting_for_family` must narrow at both precondition and persistence predicates for the Pilot.
- `replied` is terminal-for-Pilot. No `closed`, `followed_up`, `waiting_for_family`, clarification, reopen, second reply, in-place edit, or continue-chat action follows. A correction/supplement creates a new `family_care_question`, command identity, Message, Receipt, Item, and Attention path. `suppressed` remains available only for B3-3d safety behavior.
- Receipt `delivered` means the current authorized logical target Nurture surface can owner-read the source after commit. Provider/device delivery, My-Chat Handoff/Outbox state, OS notification display, and Host read/unread are separate. Teacher/family Item/detail/notification open remains read-only and never writes Nurture `read`; only explicit acknowledge changes the source Receipt.
- Family presenters compose `sent -> caregiver acknowledged -> replied` from current Message/Receipt/Item facts. They do not expose internal status tuples or infer caregiver response from Host notification state. Both current same-family Guardians may owner-read the committed reply under B3-3b.
- Tests MUST assert every atomic fact set/version/event/ref, rollback at each write conflict, no attention resolution on acknowledge, no reply from open/waiting, no second reply/close/follow-up, source Receipt remains acknowledged after reply, reply Receipt remains delivered after open, Host/provider failure independence, and current owner-read family visibility without copied lifecycle state.

Pilot-0-B3-3d replay, revoke, redaction, and failure/privacy refinement:

- Each command uses a stable `commandRequestId` and canonical payload hash. Exact identity/input replay returns the original `CommandExecution` and output refs; identity reuse with different input fails before a business write. Response loss at capture, acknowledge, or reply cannot create a second Message, Receipt, ItemEvent, version, Attention, or output set. A genuinely new question uses a new identity, body ref, and route attempt.
- If Nurture committed but the worker lost the response, only the original durable claimed My-Chat Step may reclaim and replay the seed. Same-Step reclaim may finish one materialization; wrong-Step replay is denied and cannot create a second Handoff.
- Every execute, retry, presenter read, notification eligibility check, and notification open validates the original `grantId` and current role/family/enrollment/care-group/policy. Before capture, invalid Grant creates no fact. After capture and before acknowledge, invalidation suppresses the Item/active Attention and blocks acknowledge/reply. After acknowledge and before reply, the acknowledgment audit remains but the Item is suppressed and reply is blocked. After reply, the Item becomes a suppressed audit state without restoring workflow actions.
- A linked `pending` Receipt becomes `blocked(grant_revoked)`; `delivered|read|acknowledged` becomes `revoked_after_delivery(grant_revoked)`. Messages, Executions, and ItemEvents remain retained. Resolved Attention remains a resolved audit shell with no protected body/action; active Attention becomes suppressed. Expiry, replacement, Grant-owner role loss, enrollment/care-group drift, and policy disable use equivalent fail-closed behavior.
- Audit-shell retention is not receiver authorization. The original author may owner-read an unredacted Message only while the same-side role/family relationship remains current. A cross-role receiver loses protected-body access after Grant invalidation and sees only an allowed tombstone. Same-family Guardians may retain family-side access to the family submission; the caregiver cannot. A caregiver may retain author-side audit of their own reply; the family receiver cannot. Author-role loss removes author-side access as well.
- Guardian source redaction requires exact authorship and expected version, removes the body/protected ref, terminalizes the source Receipt as `revoked_after_delivery(source_redacted)`, suppresses the dependent Item and active Attention, and blocks caregiver read/acknowledge/reply. A previously committed caregiver reply remains a distinct unredacted author fact, but the question renders as a tombstone.
- Caregiver reply redaction removes the reply body/ref, terminalizes the reply Receipt as `revoked_after_delivery(source_redacted)`, and renders a family-side tombstone. The source question/source Receipt, terminal replied Item, resolved Attention, Execution, and events retain audit state. Reply redaction does not suppress or reopen the source Item and cannot permit another reply. No redacted Message can be unredacted.
- Immediate routing exposes no Pilot `cancel_route`. Calling cancel after logical delivery returns `route_already_visible` with no mutation. Post-submit withdrawal is represented by author redaction or Grant-owner revoke; cancel, redaction, and revoke remain separate operations and audit reasons.
- A precommit Nurture failure writes no business fact and retries the same command identity. Postcommit response loss replays the original Execution. Step/Handoff/Outbox failure leaves Nurture facts intact for same-Step recovery. Provider failure leaves Receipt state unchanged and uses Outbox retry/dead-letter. Owner API outage sends no notification and serves no cached body. Stale version/action performs no write and requests refresh. Wrong actor/workspace/family/child returns generic unavailable without existence disclosure. Capability/allowlist shutdown blocks new writes/activation but retains committed facts.
- Technical Admin may inspect refs-only evidence, reconcile an outcome-unknown original Step, replay/stop eligible Handoffs, request owner reevaluation, and disable the gate. Admin cannot edit Receipt/Item/Message, undo redaction, restore/replace Grant authority, synthesize provenance, or mark acknowledge/reply.
- Notification delivery is rechecked before each send. A pending notification after revoke/redaction is skipped; an OS notification already displayed cannot be retracted, but every open owner-rereads and returns only current content, allowed tombstone, or generic unavailable/retryable state. Host read/unread never changes Nurture lifecycle, and stale tokens/buttons/cache cannot revive access or actions.
- Tests MUST separate same-side author from cross-role receiver visibility after revoke, assert reply redaction leaves the source Item replied, cover exact/different-payload replay and wrong-Step denial, and jointly exercise owner outage, provider retry/dead-letter, stale notification, and kill switch. Current revoke/redaction repositories use `take: 100`; implementation MUST loop within the same transaction until closure or fail the transaction on overflow so no partially fenced fact set can commit.

Pilot-0-B3-4 representative-journey coverage refinement:

- Coverage uses four evidence layers rather than every possible E2E permutation. Contract/conformance tests exhaust all allowed and denied action/surface cells; Nurture domain/DB tests prove transaction, version, Grant, Receipt, Item, Attention, revoke, and redaction rules; two-database joint tests prove claimed-Step replay, Handoff/Outbox, notification owner reread, technical failures, and persistence privacy; rendered-surface tests prove Chat, role board/workbench, notification, and Technical Admin behavior.
- The three synthetic child scopes retain three independent families and seven logical accounts. Four independent question journeys are required: Family-1 primary Guardian submits through Chat, the lead Caregiver acknowledges in Caregiver Chat and replies on teacher board, and the second Guardian opens Family board/workbench history; Family-2 submits on Family board, the Caregiver acknowledges on teacher board and replies in Caregiver Chat, and the Guardian reads in Family workbench; Family-3 submits in Family workbench, the Caregiver acknowledges/replies on teacher board, and the Guardian opens the family result from Notification; Family-1 second Guardian submits a separate question and the Caregiver acknowledges/replies in Chat before that Guardian performs source-redaction validation. These journeys cover every Guardian write surface and all four `Chat|teacher_board` acknowledge/reply pairings without adding a fourth child.
- Every question uses an independent command identity and one canonical Nurture fact path. Surface transitions and opens never execute a command; drafts remain source-surface-local; committed results owner-reread across authorized surfaces; cross-family actors receive no target/existence/content signal.
- The Institution strand is distinct: institution board shows safe readiness/coverage/backlog aggregates and routes writes to the workbench; My-Chat invitation acceptance precedes Nurture participant/role binding; enrollment initiation remains separate from Guardian confirmation and Grant; board reread never exposes family bodies. Business cohort disable/recovery is separate from the My-Chat kill switch and cannot revive revoked/redacted/terminal facts.
- The Technical Operator strand remains refs-only: reconcile the original outcome-unknown Step, replay/stop eligible Handoffs, observe provider retry/dead-letter, request owner reevaluation, and perform disable-only shutdown. Operator tests deny body reads, Receipt/Item mutation, Grant restoration, redaction reversal, and business acknowledge/reply.
- The negative matrix covers wrong workspace/family/child/role/care-group/surface and raw-ref injection; exact/different-payload replay, wrong-Step, stale/concurrent versions, reply-before-ack, and second reply; Grant invalidation before capture, before acknowledge, before reply, and after reply plus expiry/replacement/role/enrollment/group/policy drift; source/reply redaction; draft/reload/cross-device/stale-token continuity; provider/owner/runtime failure; kill switch; and zero protected/claim/internal material in My-Chat persistence, Handoff, Outbox, Notification, logs, and telemetry.
- Every action/surface matrix cell maps to deterministic allow/deny evidence, while only representative boundary combinations require full joint/surface E2E. High-risk joint journeys run successfully three consecutive times with one business effect and at most one Handoff per question. CI may seed synthetic topology for kernel tests, but direct Prisma writes do not satisfy final authenticated onboarding evidence; Pilot-0-C owns that closure.
- B3-4 exit also requires author/receiver post-revoke tests, atomic revoke/redaction cascades beyond the current `take: 100` limit, all four caregiver surface pairings, second-Guardian same-family/cross-family boundaries, Institution/Operator body denial, and automated contract/DB/joint/surface evidence plus a final manual rendered journey record. Capability and workspace allowlist remain disabled throughout readiness decisions.

Pilot-0-C0 authenticated ingress and first-Institution bootstrap refinement:

- My-Chat authenticated shell is the only public Guardian/Caregiver/Institution/Notification ingress. Clients do not call Nurture owner or command routes directly. My-Chat authenticates the canonical user/workspace, validates the generic surface/route, carries idempotency and Nurture-issued opaque context, and renders typed owner/action results without interpreting business role/scope/state.
- Nurture owner/action services are private service-to-service boundaries. Every read/action re-resolves Nurture participant, eligible role, work/child scope, target, original Grant, policy, lifecycle, expected version, and presenter/action state. Raw client ids, claimed roles, work scopes, Grant fields, availability results, or business state are rejected. The current dev-host workflow/project API is not a Pilot artifact or public fallback.
- The internal experiment has no self-service Institution signup and no ambient workspace-admin bootstrap. One versioned provisioning specification binds the exact allowlisted workspace, scenario, Institution definition, initial Institution Admin My-Chat identity, and expiry. Pre-D C-4 evidence uses only a disposable synthetic specification generated/signed/stored/custodied/revoked/destroyed by `c4_bootstrap_evidence_controller` under issuer `my-chat.c4-bootstrap-evidence` and audience `my-chat.c4-bootstrap-evidence.v1`; Pilot-0-D separately owns the real Pilot specification. Target, store, issuer, audience, and credential substitution MUST fail.
- The provisioning specification is control-plane input, not a B3-2 `clarify|submit_action|open_notification` scenario token, URL/deep-link value, client payload, or reusable role credential. The initial Admin must authenticate and accept the matching My-Chat invitation before Nurture bootstrap can execute.
- One idempotent Nurture transaction creates or returns the exact Institution, Participant, first Institution Admin role assignment, and audit/Execution result. Exact replay returns the original refs; another user/workspace/scenario/institution definition, payload hash drift, expiry, second consumption, or already-closed bootstrap fails before a second effect.
- After success, bootstrap is permanently closed. Ordinary adult invitation, accepted-user participant binding, and staff-role assignment use the C-1/B3-1d-2 flow and cannot invoke bootstrap. Technical Operator may observe safe technical outcome evidence but cannot author/change the provisioning specification, select another business identity, invoke/reopen bootstrap, or directly edit created business facts.
- Contract/DB/joint/surface tests MUST cover matching Host invitation issue, exact Admin authentication/acceptance/membership and current accepted-evidence reread before bootstrap; unauthenticated acceptance; wrong user/workspace/scenario; expired/reused/drifted specification; concurrent exact claim; exact response-loss recovery through the bound operation/status lane; ordinary workspace admin; Institution Admin self-claim; Technical Operator mutation/reopen; raw-client role/scope injection; direct Nurture route access; dev-host exposure; pre-D versus D spec-store/issuer/audience/target isolation; and one exact successful fact/audit set with no protected body or secret in Host persistence/telemetry.

Pilot-0-C1 CareGroup and staff-onboarding refinement:

- C-1a uses existing `NurtureCareGroup` as the sole class aggregate. Institution workbench executes explicit create/update/pause/resume/archive commands with expected version and current Institution Admin policy; Institution board only rereads safe status/readiness/navigation. Pilot exposes no hard-delete or generic state-upsert action.
- C-1a family-invitation readiness is derived on every display/action from active Institution and CareGroup, exactly one current eligible operational Caregiver, exactly one Lead designation bound to that exact role episode, required policy completion, and environment/workspace business gates. Zero/multiple Caregivers, zero/multiple Leads, and wrong binding fail closed. Readiness is not another CareGroup lifecycle/status row, Host projection, or cached authorization result. Pilot has one human Caregiver/Lead pair across the Workspace cohort and no backup, simultaneous cross-Group, or multi-caregiver action concurrency.
- C-1b Institution Admin initiates a Staff Invitation from the workbench. My-Chat owns recipient contact delivery, authentication, invitation acceptance, and workspace membership. Nurture may retain an opaque Host invitation ref and safe intended Institution/CareGroup display context, but no raw contact/identity selector or protected family data.
- C-1c accepted canonical identity binds or reuses one workspace `NurtureParticipant` without a business role. Institution Admin then performs a separate strongly confirmed `assign_staff_role` command for exact `caregiver + care_group` scope and a distinct Lead designation. Invitation issue/acceptance, Host membership, Participant binding, Caregiver assignment, and Lead designation each have independent idempotency/audit/version evidence.
- C-1d Teacher-board/Chat access requires current Host membership, Participant, exact active RoleAssignment, active Institution/CareGroup, and current policy. Invitation intent, Participant presence, general workspace membership, Institution Admin status, or a role in another group grants no caregiver access. Suspend/revoke/expiry/Host loss/group pause/archive/scope drift fails closed immediately.
- C-1d offboarding retains Participant, invitation/acceptance, authorship, Messages, Events, Executions, and other independently valid scopes. Reinviting the same canonical user reuses the Participant but requires a new/current RoleAssignment and never reactivates a terminal role. Pilot forbids Institution Admin/Caregiver overlap and activates no backup teacher.
- C-1e Enrollment Invitation send remains unavailable until current derived readiness passes. A CareGroup may exist and be configured before staffing, but no family onboarding or protected family-care work can bypass missing Lead/policy readiness. Group pause/archive blocks new invitations; any treatment of existing Enrollment work remains governed by current revoke/policy/runtime-fence rules rather than deletion.
- Tests MUST cover group-name/version concurrency, wrong Institution Admin scope, board-write denial, direct/generic state mutation denial, no-delete, missing/expired/revoked Lead, policy/gate/group/institution inactive cases, Staff Invitation exact replay/drift/expiry/revoke, accepted-user Participant uniqueness, assignment-before-acceptance denial, wrong-group role, distinct Lead designation, Host membership loss, role suspend/revoke/reinvite, another-role preservation, Admin/Caregiver overlap denial, and Enrollment Invitation readiness transition without protected data leakage.

Pilot-0-C2a no-existing-profile and roster-entry refinement:

- `NurtureInstitutionRosterEntry` is a future Nurture-owned, Institution/CareGroup-local intake aggregate for an expected child whose Guardian may not yet use My-Chat/Nurture. It is not currently implemented and MUST NOT be simulated by overloading `NurtureChild`, `NurtureEnrollment`, a Host invitation, or an arbitrary JSON field.
- Institution workbench may create/correct a minimal roster entry with an institution-local label and optional institution-provenance age/birth prefill. Invitation send still rechecks C-1 readiness. Raw recipient contact, account/auth state, and delivery acceptance remain My-Chat-owned.
- The entry establishes no platform Child/Family identity, binding, anchor/association, local Child/Process/Family, Participant, Guardian role, Enrollment, Grant, thread, Message, Receipt, care fact, or content authority. It stores no platform ids/candidates. Institution prefill is visibly unverified and cannot seed either owner.
- After exact Host Enrollment-invitation acceptance, the adult explicitly creates/selects a current platform Child/Family pair, then uses the typed-anchor/binding-resolution/local-association saga or explicitly selects an already current dual-owner local association. The saga reuses existing typed endpoints and adds only missing bindings. An authority-free or unbound local relationship is forbidden. Name/birth/contact/media/roster matching, Institution identity creation, and raw linking are forbidden; exact current platform identity reuse is allowed while local dossier portability remains disabled.
- Roster-to-child linkage is written only with Guardian-confirmed Enrollment or its exact replay, never merely because a candidate was displayed or selected.
- Enrollment and Grant are later, separate strongly confirmed commands. An ignored, declined, expired, wrong-recipient, wrong-workspace, or revoked invitation cannot create or activate them and cannot make the roster entry operational for protected child work.
- Pilot journey admission requires every participating Guardian to finish authenticated signup plus minimum child/process/profile confirmation before J1-J4. Institution-only full child operations for non-participating families are excluded and require a separate future contract.
- Tests MUST cover create/correct replay/version conflict, wrong Institution/Admin/Group, send-before-readiness, raw-contact/platform-id/anchor leakage, unverified prefill with zero identity seeding, the three JI3 journeys/scopes plus separate conformance of all four binding-resolution branches, empty-anchor and partial-binding recovery, exact current local selection, candidate-without-roster-link, fuzzy/raw/cross-workspace dossier denial, ignored/declined/expired/wrong-recipient invitation, zero protected effects before confirmation, separate Enrollment/Grant confirmation, and retained local audit.

Pilot-0-C2b-1 first-Guardian refinement:

- My-Chat MUST authenticate the exact current Enrollment Invitation recipient and complete exact Host acceptance before this Pilot relationship path. Nurture MUST reject unauthenticated, unaccepted, wrong-recipient, wrong-workspace, expired/revoked invitation, and raw identity/role/scope claims before first business write. Invitation acceptance remains evidence for entry, not relationship authority.
- The prospective Guardian MUST strongly confirm a relationship declaration, a freshly entered Nurture-local care label/constraints, longitudinal-profile/privacy meaning, and the fact that later current Guardians may see family-visible facts. No Institution prefill or platform name is copied/defaulted into the local record. The confirmation is a product assertion, not legal verification.
- Current platform pair/binding evidence and the exact anchor-resolution branch MUST precede the Nurture write. Participant binding/reuse, new or resolved local Child/ChildCareProcess/Family, first Guardian RoleAssignment, both associations, and CommandExecution/result refs MUST commit in one Nurture transaction. Exact command replay returns original refs; payload/binding-head drift conflicts; partial or authority-free creation is forbidden.
- Existing-profile selection MUST owner-resolve through a current same-workspace Guardian role. Institution prefill, name/birth/contact match, raw object id, Enrollment Invitation recipient status, and a claimed relationship label cannot grant selection.
- `primary_guardian` MUST NOT be added. `father|mother|other_guardian` relationship/display metadata MUST NOT alter Guardian policy, Grant ownership, author rights, or Co-Guardian rights.
- Pilot topology uses Family-1 first-Guardian establishment followed by one later Co-Guardian Invitation; Family-2 and Family-3 retain one Guardian each. Production legal/evidence verification remains a separately approved sensitive-data capability.
- Tests MUST cover both-binding reuse, Family-binding reuse/new Child, Child-binding reuse/new Family, both-new, conflicting existing binding quarantine, empty-bound reuse, exact replay/payload drift, operation deadline/`outcome_unknown|confirmed_no_effect`, reservation quota/retirement, transaction rollback at every local row boundary, complete association graph constraints, participant reuse, duplicate active Guardian uniqueness, wrong/expired/revoked invitation, wrong actor/workspace, confirmation omission, Institution assertion denial, existing-child non-Guardian denial, current-Guardian selection, no-primary equality, relationship-label permission equality, no implicit Enrollment/Grant, and presenter copy that does not claim legal verification. Status-lookup tests MUST pin `ScenarioIdentityOperationStatusLookupV1`, caller `my-chat-identity-recovery`, issuer `my-chat.identity-recovery`, audience `nurture.identity-recovery.v1`, operation `scenario_identity_operation_status_lookup_v1`, endpoint `POST /private/v1/identity-operations/status:lookup`, isolated request/response trust, fresh nonce, and exact strict request/result codec revisions. They MUST reject unknown/missing/duplicate/null/cross-variant fields; prove method/path/request-signature/nonce/frozen-field failure has zero resolver/fence call; prove My-Chat validates the raw platform pair/membership/binding heads but transmits only the non-reversible keyed Host-identity digest, Nurture anchor refs, and frozen technical hashes; assert no raw platform/binding ids cross the endpoint; validate exact body-free `committed|confirmed_no_effect|unknown` result shapes plus result request-nonce hash/key id/signature; reject a swapped, unsigned, or revoked-signer result; require terminal attempts plus deadline/skew plus writer-fenced Execution/association absence for no-effect; keep inflight/timeout/outage/ambiguity unknown; and prove zero business/protected/mutation capability.

Pilot-0-C2b-2 Co-Guardian Invitation refinement:

- Issue MUST require the inviter to be both a current Nurture Guardian for the exact Family/ChildCareProcess and a current My-Chat Family member with Host permission to invite that exact recipient. Nurture owns invitation intent/scope/policy; My-Chat owns raw contact/delivery/auth/acceptance and Workspace/Family membership. Institution/Caregiver/Operator issue or proxy acceptance fails closed.
- Host acceptance creates or exact-replays the recipient's Workspace and exact Family memberships first but grants no Nurture authority. Nurture intent state remains the sole business-role acceptance fence; stale Host delivered/accepted/provider state MUST NOT override Nurture cancel/revoke/expiry/current-policy denial.
- Issue persists no recipient Participant/role/history/Grant authority or new child/family facts. The Nurture intent carries only bounded safe metadata and opaque Host correlation; relationship label remains recipient-confirmed display metadata, not authorization.
- Acceptance MUST authenticate the exact recipient and rerun inviter Nurture role plus Host Family-invite authority, family/process lifecycle, invitation state/expiry/version, exact current Workspace/Family memberships, recipient uniqueness, and Pilot topology predicates. Inviter revoke after issue, concurrent cancellation/acceptance, duplicate recipient role, and cohort drift use first-commit-wins/current-state denial.
- Participant bind/reuse, second Guardian RoleAssignment, invitation consumption, and `CommandExecution` result/audit MUST commit atomically. Exact response-loss replay returns original refs; changed payload conflicts and cannot create a second role.
- Host membership and Nurture role use separate stable operation ids and exact replay. Membership commit followed by Nurture denial/response loss resumes only the same role operation and grants no product access meanwhile. Exact inviter MAY cancel before Host acceptance; after either owner commits, cancellation never compensates that owner's fact. Later role self-exit or membership/role revoke does not mutate the other owner; C-2b-4 owns Nurture relationship exit.
- Pilot configuration permits exactly one Co-Guardian acceptance for Family-1 and none for Family-2/Family-3. Tests MUST prove this exact topology without adding a global two-Guardian constraint or implying a reusable product maximum.
- Tests MUST cover current Nurture Guardian plus Host Family-invite authority, no-primary behavior, wrong-family/process/scope, Institution/Caregiver/Operator denial, raw-contact persistence probe, exact/different-payload issue replay, wrong/expired/revoked/consumed recipient acceptance, membership-commit/role-fail, role-commit/response-loss, cancellation before/after each owner commit, stale Host accepted/provider state against Nurture denial, inviter revoke, membership revoke, role self-exit, cancel/accept race, Participant reuse, duplicate role, atomic local rollback, either-fact-alone denial, no pre-accept history/Grant access, no implicit Enrollment/new child, exact `2 + 1 + 1` Pilot gate, and absence of a Schema cardinality cap.

Pilot-0-C2b-3 Guardian rights/history refinement:

- Before second-role commit, every family profile/history/action query MUST deny without leaking existence. After commit, both current Guardians resolve the same base family action set; join order and relationship label MUST NOT affect policy.
- Current owner queries MAY return eligible committed facts created before Co-Guardian acceptance, but MUST recheck current role/Family, Enrollment, original Grant for cross-role bodies, redaction, retention, and policy. Queries MUST NOT clone rows, create a per-Guardian history projection, or emit historical notifications.
- Both current Guardians MAY author new eligible questions under the active Grant and read currently allowed same-family committed facts. Exact author alone may redact a Message. Grant replace/revoke remains limited to the persisted `grantedByParticipantId`; acceptance cannot transfer ownership.
- Family-originated body access and cross-role reply access MUST use their distinct B3-3d fences. Grant revoke/replacement/expiry removes receiver-side caregiver/institution bodies even for a current Co-Guardian; same-family membership cannot revive a redacted source or reply.
- Drafts and active interaction contexts remain actor/surface-bound. The second Guardian MUST NOT read the first Guardian's unsubmitted manual protected draft, any future separately gated AI draft, scenario token, or `NurtureInteractionContext`; Pilot protected AI remains absent/off.
- Tests MUST cover pre-accept denial/post-accept current access, pre-join committed family history, original-Grant caregiver reply visibility, Grant revoke/replacement after join, family-source and caregiver-reply redaction, own-versus-other author redaction, Grant-owner versus Co-Guardian administration, equal label/order permission, cross-family denial, no draft/context sharing, no row duplication/backfill notification, and no arbitrary profile-edit authority.

Pilot-0-C2b-4 Guardian self-exit refinement:

- Only the exact current Guardian may request their own exit. Strong confirmation binds actor, Family/ChildCareProcess, exact RoleAssignment, expected version, consequence summary, and stable command identity. Peer Guardian, original inviter, Institution, Caregiver, Operator, raw-id, and service-principal removal attempts MUST fail closed.
- Policy MUST deny exit when the actor is the last current Guardian. The command cannot create an authority-free child/family aggregate and cannot infer transfer to another account.
- Role revoke, cancellation of pending invitation intents issued by the actor, revocation of active Grants owned by the actor, dependent Receipt/Item/Attention/body cascades, and `CommandExecution` result/audit MUST commit atomically. Grants owned by another current Guardian remain unchanged.
- After commit, every owner read/action and stale Notification/deep-link open MUST deny the exiting actor. Author/audit refs and business facts remain, but current-role loss removes body access; remaining Guardians receive no reassigned authorship or Grant ownership.
- Host account/workspace loss MUST deny access without mutating Nurture role/Grant state. Host restoration cannot reactivate a terminal role. Rejoin requires a new invitation/RoleAssignment; old Grant/role identities stay terminal.
- Pilot runs the Family-1 second-Guardian self-exit probe after J1-J4 or other required dual-Guardian evidence, preserving the main `2 + 1 + 1` topology during representative journeys.
- Tests MUST cover exact replay/payload drift, last-Guardian denial, self versus peer/inviter/Institution/Caregiver/Operator, stale role version, concurrent self-exit/action, actor-owned versus other-owned Grant, cascade completeness beyond current batch limits, atomic rollback, post-exit own/history/draft/action denial, stale notification, Host loss/restore, new-invitation rejoin with terminal old identities, retained audit/no reassignment, and absence of forced-dispute/admin DB paths.

Pilot-0-C2c-1 Enrollment Invitation issue refinement:

- Issue MUST resolve a current Institution Admin from authenticated My-Chat identity and rerun C-1 invitation readiness plus exact current unlinked RosterEntry policy. Client role/scope/ids, Institution board writes, Caregiver/Guardian/Operator, missing Lead/policy, inactive topology, and disabled Pilot gates fail before first business write.
- Nurture invitation intent MUST bind exact workspace/Institution/CareGroup/RosterEntry/issuer/opaque Host recipient binding/expiry/version/payload hash and enforce at most one effective pending intent per RosterEntry. Exact replay returns original refs; changed dimensions conflict.
- My-Chat raw contact/provider/auth/membership/Host acceptance state MUST remain outside Nurture. Host accepted/delivered state is identity/delivery evidence only and MUST NOT override current Nurture intent denial.
- Issue MUST have zero Participant/Guardian/Child/Process/Family/Enrollment/Grant/roster-link/thread/Message/Receipt/teacher-child effects. Presenter output MUST expose only allowlisted safe invitation display and mark Institution prefill unverified.
- Three Pilot RosterEntries MUST receive three distinct Enrollment Invitation intents. The Family-1 Co-Guardian Invitation MUST use a distinct type/identity/policy path and cannot consume or mutate the Enrollment Invitation intent.
- Tests MUST cover exact replay/payload drift, concurrent duplicate issue, one-effective-pending uniqueness, wrong Institution/Admin/Group/RosterEntry/workspace/recipient binding, linked/stale RosterEntry, readiness and gate loss, raw-contact/persistence/log probes, stale Host accepted state, display allowlist/unverified provenance, zero business side effects, three-intent topology, and cross-kind Co-Guardian confusion denial.

Pilot-0-C2c-2 acceptance/child-branch refinement:

- Host acceptance MUST bind the exact recipient but MUST NOT consume the Nurture intent or authorize a child. Nurture reruns current intent, recipient/workspace, Institution/CareGroup readiness, RosterEntry, Pilot gate, and policy before returning any branch.
- Current same-workspace Guardians MUST receive owner-resolved safe candidates and explicitly choose a Nurture opaque option even when exactly one candidate exists. Raw id, Host-selected child, Institution prefill, name/birth/contact fuzzy/global match, wrong-family candidate, and stale option MUST fail without existence leakage.
- A recipient with no eligible Guardian role MUST, after exact Host acceptance, use the C-2b-1 owner-ordered saga: explicitly create/select the platform Child/Family pair, reuse/add the exact typed bindings in one Host transaction, then create or resolve the local relationship, first Guardian and both associations in one Nurture transaction. Exact operation replay returns the same owner refs; the Enrollment intent remains pending and unchanged.
- A non-Guardian cannot select another Guardian's existing process. The flow MUST direct to Co-Guardian Invitation without merging, copying, or auto-linking profiles.
- Pending existing-child selection MUST live only in bounded `NurtureInteractionContext`; context expiry/revoke/participant or invitation drift requires fresh owner resolution. No RosterEntry/invitation long-lived child ref may appear before C-2d.
- Before C-2d, owner and DB tests MUST prove no Roster link/Enrollment/Grant/thread/teacher fact/invitation consumption. A separately committed workspace-local relationship remains after invite cancel/expiry but exposes no Institution data.
- Tests MUST cover wrong recipient/workspace, stale/revoked invitation/readiness, zero/one/multiple local-candidate branches, mandatory single-candidate confirmation, opaque option replay/drift, existing non-Guardian denial, Co-Guardian redirect, independent platform/local identity-establishment replay and response loss, abandonment after local relationship creation, InteractionContext expiry, and no pre-Enrollment linkage. The three Pilot scopes MUST prove Family-1 existing-platform/no-local at acceptance; Family-2 existing-platform/no-local at acceptance followed by local commit, response-loss/exact recovery, fresh still-pending continuation, and explicit current-local selection; and Family-3 product-new-after-invitation. Every prerequisite uses a real application path without an invitation-free same-workspace Nurture entry, fourth child, or fixture-only shortcut.

Pilot-0-C2c-3 invitation lifecycle refinement:

- Tests and policies MUST treat `pending|consumed|cancelled|superseded` as stored states and expiry as `now >= expiresAt`; an expired pending row MUST fail without a sweeper. Pilot TTL is exactly 168 hours with boundary tests immediately before/at/after expiry.
- Current exact-Institution Admin cancellation and exact-recipient decline MUST use separate actor/reason evidence but the same terminal no-continuation guarantee. Wrong Institution/Admin, Caregiver, Operator, other recipient, stale version, and terminal intent attempts fail closed.
- Reissue MUST atomically supersede the old pending intent and create one new intent with new identities/expiry/hash/Host binding and immutable lineage. Correction cannot mutate recipient/CareGroup/RosterEntry or extend expiry in place.
- Provider retry of the same Host invitation MUST retain the same business intent; business reissue MUST not reuse Host acceptance or replay identity. Stale provider/client state against cancel/decline/expire/supersede/consume MUST fail.
- Readiness loss MUST derive blocked while keeping the stored lifecycle unchanged; recovery before expiry MAY resume after full current revalidation. Expiry or another terminal lifecycle still wins.
- Invitation-bound InteractionContext MUST become unusable after cancel/decline/expire/supersede or binding drift. Independently committed platform/local relationship facts remain with no Institution linkage.
- Expected-version first-commit-wins tests MUST cover cancel versus C-2d consume, decline versus consume, supersede versus accept/context use, concurrent reissue, and duplicate issue. Only C-2d may write consumed; exact replay returns original outcome.
- Tests MUST cover 168-hour boundaries, no-sweeper expiry, actor-specific cancel/decline, exact replay/payload drift, immutable reissue lineage, provider retry separation, readiness block/recovery, context invalidation, retained audit/no deletion, three ordinary paths, one cancel/reissue race, and one expiry/stale-open probe without cohort growth.

Pilot-0-C2c-4 confirmation-ready result refinement:

- The accepted child branch MUST return `ready_for_enrollment_confirmation`, not enrolled/success wording. Presenter tests MUST allow only Institution/CareGroup, Guardian-confirmed child display, invitation expiry, privacy consequence, and explicit no-implicit-Grant text; raw ids, Host bindings, policy internals, and unverified profile fields are forbidden.
- Nurture MUST issue a five-minute `submit_action` context bounded earlier by invitation expiry and bound to exact invitation/participant/ChildCareProcess/Institution/CareGroup/RosterEntry/surface/action/expected versions/canonical hash. Raw-id replacement, cross-workspace/participant/surface/action reuse, payload drift, and context extension MUST fail.
- Chat, family board, and family workbench MUST converge on `confirm_family_enrollment`; all three rerun pending/not-expired invitation, exact recipient/current Guardian, roster, readiness/policy, conflicting Enrollment, and expected-version checks on render and submit.
- Existing local-association selection MUST remain context-only; independently confirmed platform/local family facts MAY remain durable but have no Institution link. Context expiry/consume/revoke, terminal invitation, readiness loss, or binding/association version drift returns safe unavailable/refresh and requires fresh dual-owner resolution.
- C-2c-4 owner/DB/outbox tests MUST prove zero Enrollment, RosterEntry-child link, Grant, thread, teacher-visible child fact, notification, Workflow Handoff, and invitation consumption. C-2d is the only strong-confirmation commit boundary.
- Tests MUST cover same-result replay, stale cached confirmation, all terminal invitation states, readiness loss/recovery, the five-minute/invitation-expiry minimum boundary, wrong surface/device/account reuse, no cross-surface draft transfer, and all three Guardian entry surfaces without cohort growth.

Pilot-0-C2d-1 atomic Enrollment refinement:

- `confirm_family_enrollment` MUST require strong confirmation by the exact invitation recipient who remains a current Guardian. Tests MUST reject another Guardian, inviter/Admin/Caregiver/Operator/service identity, client-authored ids/scope/role, wrong surface/account/workspace, and a copied or altered context.
- The command MUST reload every invitation/context/recipient/Guardian/ChildCareProcess/Family/RosterEntry/Institution/CareGroup/Lead/policy/Pilot/conflicting-Enrollment/version precondition before the first write. A stale cached authorization result cannot substitute.
- Context consumption, stable CommandExecution, exact Enrollment creation, canonical roster link, exact invitation consumption with Enrollment correlation, and audit/result refs MUST commit in one Nurture transaction. Fault injection after every write boundary MUST roll back all effects.
- Exact committed replay and response loss MUST return the same Execution/Enrollment/roster/invitation result. Payload/context/hash drift and concurrent stale confirmation MUST conflict without a second Enrollment or overwrite.
- Tests MUST prove zero implicit Grant, family-content teacher access, or client/provider authority. Initial status/time/lifecycle/uniqueness assertions wait for C-2d-2; thread assertions wait for C-2d-3; presenter/Handoff assertions wait for C-2d-4.

Pilot-0-C2d-2 Enrollment lifecycle and concurrency refinement:

- Confirmation MUST create `active` with a database-issued transaction `joinedAt`. Tests MUST reject pending/client status, client/Host/Institution timestamp, backdated/future time, in-place time edit, and any scheduled-start implication.
- Effective uniqueness MUST treat pending/active/paused as current-conflicting for one workspace/ChildCareProcess/Institution across CareGroups. Tests MUST allow separately scoped current Enrollments at different Institutions and prove no access or Grant sharing.
- Same-Institution same-group new command MUST return safe `already_enrolled`; exact stable replay MUST return the original Execution/result. Same-Institution different-group, occupied RosterEntry, changed invitation/context, and stale version MUST return deterministic conflict without mutation.
- Concurrent same/different invitation and roster-link tests MUST prove first-commit-wins through database uniqueness and expected versions. Losing invitation remains pending/unconsumed, losing RosterEntry remains unlinked, and no context/Execution success or partial effect survives.
- Paused MUST still block another same-Institution Enrollment. Ended/withdrawn MUST reject reactivation; re-entry MUST use new roster/invitation/Enrollment identities. Deleted MUST be unavailable as a Pilot transition or uniqueness/audit bypass.
- C-2d-2 tests MUST NOT infer pause/resume/end/withdraw/transfer actor authority; C-2f owns those commands. Thread creation remains C-2d-3 and result/Handoff remains C-2d-4.

Pilot-0-C2d-3 private Thread timing refinement:

- Enrollment commit tests MUST prove zero Thread/ThreadParticipant. Institution/Caregiver owner presenters before Grant MUST expose only allowlisted roster membership, Guardian-confirmed safe child label, Enrollment status, and joinedAt; family/profile/contact/Grant/thread/message/body existence MUST remain absent.
- First active-Grant confirmation MUST atomically create the exact active enrollment-private Thread plus Grant/Execution/audit refs. Fault injection and races MUST leave neither Grant-only nor Thread-only state, and uniqueness MUST prevent a second active Thread for the same workspace/process/family/Enrollment.
- Different Institution Enrollment MUST resolve a different Thread. Exact Grant replay and replacement MUST reuse the same Thread id with no history copy; first Message MUST reject missing Thread rather than lazily create one.
- Exact Thread existence/scope/lifecycle MUST fail closed when unavailable. ThreadParticipant rows are not authorization: missing projection MUST allow an otherwise fully current actor, while active/stale/forged/cross-scope projection MUST fail to grant or preserve access when role, Enrollment/CareGroup, original/current Grant, policy, source lifecycle, or redaction denies. Raw thread/participant ids and another Institution's Thread MUST not leak existence or content.
- Revoke/expiry/replacement MUST retain the Thread/audit identity while current owner reads/actions fail closed as required. A replacement or later Grant MUST NOT revive content invalidated by the original Grant.
- Ended/withdrawn Enrollment and re-entry tests MUST prove the old Thread is not migrated or reused and the new Thread appears only with the new Enrollment's first active Grant. C-2f still owns close/archive transitions; C-2d-4 owns result/Handoff.

Pilot-0-C2d-4 Enrollment result, recovery, and Handoff refinement:

- Success MUST return `enrollment_confirmed` backed by stable CommandExecution refs. Presenter tests MUST allow only safe child label, Institution, CareGroup, current status, joinedAt, and no-Grant/no-private-communication copy; raw/internal/Host/family/contact/profile fields, Thread/Grant refs or internal lifecycle fields, and protected content MUST be absent.
- `review_family_care_grant` MUST remain a route affordance with no command/token authority. Tests MUST prove fresh owner resolution before the existing `confirm_child_link_grant` action and reject route/action aliasing, old context reuse, raw ids, and client-authored availability.
- Exact replay and response loss MUST return one Execution/business effect while owner-rereading current Enrollment. Later lifecycle/role/workspace changes MUST produce current result or safe unavailable/tombstone rather than cached active confirmation.
- Consumed-invitation recovery before/at/after the former expiry MUST preserve the committed Enrollment result for the exact currently authorized owner and MUST deny wrong recipient/Guardian/workspace without existence leakage. Expiry remains authoritative only for unconsumed continuation.
- Faults after business commit in presenter/client/network/provider MUST leave Enrollment/roster/invitation/context unchanged and MUST NOT compensate, delete, reopen, or duplicate. Pre-commit fault injection retains C-2d-1 atomic rollback behavior.
- CommandExecution MUST contain schema-valid explicit `handoffRequestSnapshotsPayload=[]`. DB/outbox/worker tests MUST prove zero activation seed, Handoff, Outbox event, notification, and deep link for Enrollment confirmation; Institution surfaces discover the update only through owner reread.
- Contract tests MUST reject a future Enrollment notification added implicitly to the same Pilot command. Any later versioned action/Handoff requires durable claimed-Step provenance and separate acceptance, and delivery cannot affect Enrollment success.

Pilot-0-C2e-0 ThreadParticipant authority refinement:

- Guardian and Caregiver tests MUST derive permission from current Host/Nurture identity, Participant/RoleAssignment, exact Enrollment/CareGroup, exact current or original Grant, exact Thread/source lifecycle, policy, and redaction. Stored participant projection MUST NOT be an independent allow or deny predicate.
- Positive evidence MUST cover a valid actor with an exact active Thread and no ThreadParticipant row. Both family input and caregiver Item action remain eligible when every authoritative predicate passes.
- Negative evidence MUST cover an active participant row after role revoke/suspend, Grant revoke/expiry/replacement, Enrollment/CareGroup drift, policy disablement, source redaction, and Thread terminalization; every case fails closed through the authoritative predicate.
- Forged participant/role/scope rows, raw ids, another Institution's row, and cached active projection MUST NOT reveal existence or create authority. Hidden/inactive projection may alter list presentation but cannot change business eligibility.
- First-Grant fault and concurrency tests MUST NOT require participant fan-out. Optional read/subscription/display projection may be written only after owner authorization, and projection write failure cannot leave Grant/Thread business authorization partially represented.

Pilot-0-C2e-1 Grant review and confirming-Guardian refinement:

- Actor tests MUST allow either current exact-family Guardian to review and first-confirm while rejecting Enrollment-recipient-only or join-order hierarchy. Institution Admin, Caregiver, Operator, service identity, non-Guardian family member, wrong Family/Child/workspace actor, and stale/revoked/suspended role MUST fail without existence leakage or effects.
- The first committed confirmation MUST establish the exact confirmer as sole owner. Another Guardian may use/inspect current scope but cannot replace/revoke; exact replay and a new `already_satisfied` command MUST preserve the first owner. C-2e-2 supplies database first-commit evidence.
- Presenter tests across Chat, family board, and family workbench MUST expose the same mandatory safe facts: child label, Institution/CareGroup, bidirectional question-workflow scope, current eligible users, bounded duration, owner/non-transfer consequence, revoke/retention behavior, and exclusions. Tests MUST reject missing mandatory consequence copy and raw ids/internal enum/policy/hash/unverified child data.
- Confirmation tests MUST require an authenticated current session, fresh Nurture owner resolution, and explicit `authorization_gate`. Natural-language/LLM agreement, page open, navigation, preview, Enrollment confirmation, default-selected control, and client-authored confirmation state MUST NOT execute the command. No extra Pilot password/OTP/biometric flow is inferred.
- `submit_action` tests MUST prove five-minute exact workspace/participant/role/family/process/Enrollment/Institution/CareGroup/action/profile-hash/version/surface binding; opaque-context-plus-explicit-confirmation-only input; and denial for account/Guardian/surface/device copy, expiry, consume/revoke, payload/target/profile/expiry injection, or any binding/policy/allowlist drift.
- Pre-submit tests MUST prove zero Grant/Thread/Execution/protected-content/Handoff/notification/cross-role effect. Existing exact active state suppresses a create affordance; a racing confirmation returns safe current/`already_satisfied` semantics without owner transfer. Atomic write/time/expiry/uniqueness assertions remain C-2e-2.

Pilot-0-C2e-2 atomic Grant/Thread test refinement:

- Schema/migration tests prove the raw active Grant partial unique index, canonical singleton Pilot purpose, array normalization/no duplicates, missing-owner Restrict FK repair, and existing active Thread partial uniqueness. Preflight fixtures cover duplicate active Grant identity, orphan owner, pending/deleted/future-active rows, and refusal to auto-merge or auto-select an owner.
- Transaction fault injection stops after every planned write: context consume, elapsed-row terminalization, Grant insert, Thread insert/reuse resolution, CommandExecution, audit/result refs. Every injected failure rolls back all writes and leaves no partial authority. No external service/provider call and no Prisma type crosses the scenario domain boundary.
- Replay tests prove exact command/response-loss replay returns one original Execution and business effect. Two Guardians with distinct command ids and contexts race the same business identity: one commits `applied`, the other rereads after a known retry and commits `already_satisfied`; owner and expiry remain the winner's values.
- Known serialization, deadlock, Grant partial-unique, and Thread partial-unique races receive bounded whole-transaction retry with fresh reads. Retry exhaustion returns `command_busy`. Unknown unique/integrity errors remain technical and cannot be converted to `already_satisfied`.
- Time tests use database transaction time and cover `effectiveFrom`, both sides of `[effectiveFrom, expiresAt)`, the exact 30-day boundary, earlier allowlist expiry, allowlist closing during submit, no rolling extension on same-definition, elapsed active-row terminalization plus fresh identity, and no expiry-worker dependency.
- State-matrix tests cover exact replay; exact active same-definition; terminal history only; active definition mismatch; target/Enrollment drift; multiple matching active rows; pending/deleted/future-active/missing lifecycle timestamps; role/policy/Enrollment/allowlist invalidation; active owner ineligibility; no historical Thread; exact active Thread reuse; and terminal/mismatched/cross-Institution Thread reconciliation.
- Applied and `already_satisfied` results reference the exact Grant/Thread. C-2e-2 creates no ThreadParticipant, Message, Receipt, Item, Attention, Handoff, Outbox, notification, or deep link. Result presentation/recovery and explicit-empty Handoff remain C-2e-3; replace/revoke/owner loss remain C-2e-4.

Pilot-0-C2e-3 Grant result/recovery test refinement:

- Command tests cover all four response combinations: `executed/applied`, `replayed/applied`, `executed/already_satisfied`, and `replayed/already_satisfied`. Each Execution stores exactly the versioned Grant/Thread refs, and a second Guardian's convergent Execution preserves that actor for audit without changing or impersonating the Grant owner.
- Presenter tests use `family_care_grant_current` and cover `activated|already_active|processed_but_unavailable` crossed with `owner|family_user|none`. Active safe output includes only child label, Institution/CareGroup, scope, effective/expiry times, and current actions. Raw account/Participant/role/Grant/Thread/Execution ids, policy/hash, and internal reasons are rejected from client/route/transcript/notification/analytics output.
- Response-loss tests prove Execution lookup precedes consumed/expired context classification, exact retry needs no second confirmation, and replay returns one business effect. Exact replay after Grant expiry/revoke/replacement or caller authority loss retains immutable Execution but renders only the currently entitled state or generic unavailable.
- Missing-command-identity tests route to ordinary current-state presentation and prove no probe command, `open_result` token, raw output ref, automatic resubmission, or second confirmation is created. Wrong caller/workspace/surface cannot distinguish missing Execution from inaccessible Execution.
- Context/failure tests prove deterministic drift invalidates the context without Execution/business success; retryable contention/transaction/transport/owner-read failure leaves the original context usable only within TTL; presenter failure after commit never compensates Grant/Thread/Execution.
- Schema/command tests require `handoffRequestSnapshotsPayload=[]` and null driver for applied, already-satisfied, and exact replay. Grant confirmation creates no Step/Handoff/Outbox/notification/deep link/teacher-visible state/Message/Receipt/Item/Attention/ThreadParticipant and makes no remote provider call.
- Surface tests prove owner versus family-user action availability and require question creation to start a separate draft/preview/context/confirmation/command. Grant result rendering cannot create protected content or auto-navigate into a hidden action.

Pilot-0-C2e-4a Grant replacement test refinement:

- Actor/presenter tests allow only the exact current owner Guardian and deny another Guardian, inviter/Enrollment confirmer, Institution Admin, Caregiver, Operator, service actor, wrong family/process/workspace, stale role, and owner-ineligible actor. All three Guardian surfaces show the same old/new delta, expiry, old-work-stop, retention, unchanged-owner, and no-revival consequences.
- Context tests enforce five-minute exact actor/role/process/Enrollment/current CareGroup/old Grant version/new canonical profile/surface binding, opaque-context-plus-explicit-confirmation input, and rejection of copied context, raw ids, client expiry/profile/owner injection, or any policy/allowlist/version drift.
- Schema/migration tests cover nullable unique Restrict `supersedesGrantId`, old `replacedAt`/`replacedByParticipantId`, no mirrored old-row replacement id, same workspace/process/Enrollment/owner lineage, one direct successor, and preflight rejection of duplicate/broken/cyclic/cross-scope history without auto-repair.
- Transaction fault injection covers context consume, old status/audit/version update, successor insert, Thread reuse, every old-work fence, and Execution. Every fault rolls back old/new/lineage/fence/Execution; committed success has one database time for old `replacedAt` and new `effectiveFrom` and no active overlap/gap.
- Outcome tests cover exact replay; exact same-definition `already_satisfied` without renewal; valid replacement; terminal/deleted/missing old Grant; owner ineligibility; topology drift; replace-versus-revoke; two different replacement commands; known unique/serialization retry; unknown lineage/integrity failure; and response loss.
- Old-object tests prove every Message/Receipt/Item/Attention retains old `grantId`, fails current cross-role access/action immediately, and cannot be revived by successor Grant or reused Thread. C-2e-4d supplies complete cascade-to-closure assertions.
- Execution tests require exactly terminal-old/new-active/Thread output refs, explicit empty snapshots, null driver, no Step/Handoff/Outbox/notification/deep link/protected object, and no remote call in the transaction.

Pilot-0-C2e-4b owner-initiated revoke test refinement:

- Actor/surface tests allow only the exact active Grant owner who remains a current exact-Family Guardian and deny another Guardian, Institution Admin, Caregiver, Operator, service actor, raw-id caller, wrong family/process/workspace, stale role, and owner-ineligible actor. Chat may present confirmation but natural language, LLM intent, navigation, and default controls cannot execute.
- All three Guardian surfaces show the same immediate-stop, retained-audit, already-seen-information, irreversible, and fresh-authorization consequences. Five-minute context tests enforce exact actor/role/process/Enrollment/current CareGroup/Grant version/action/surface binding, explicit confirmation, and denial of copied/expired/consumed/drifted context or client actor/reason/time/version injection.
- Persistence tests require database transaction time, exact resolved revoke actor, fixed `user_revoked` Grant reason, downstream `grant_revoked`, and one version increment. Arbitrary reason text or client audit fields are rejected and internal codes/raw refs do not reach presenter, route, transcript, notification, or analytics payloads.
- Transaction fault injection covers context consume, Grant transition/audit/version, every dependent-fence stage, and Execution. Every fault rolls back the whole unit; C-2e-4d adds loop-to-closure/overflow and bounded-summary coverage. Tests explicitly reject the current `take: 100` partial commit and incomplete dependent-ref output pattern.
- Outcome tests cover exact applied replay; new eligible same-Grant revoke as `already_satisfied` without audit rewrite; replaced/expired/deleted/missing/scope-drift states; current-owner loss; revoke/revoke, revoke/replace, and question/revoke races; known serialization retry; response loss; and unknown integrity failure.
- Fresh-authorization tests prove the revoked row is never edited/reactivated/replaced, any current equal Guardian may later complete a full new confirmation and become the new Grant owner, and the new Grant/reused Thread applies only to future work and never revives revoked-Grant Message/Receipt/Item/Attention.
- Execution tests require exactly terminal Grant/Thread refs, explicit empty snapshots, null driver, no per-dependent output refs, and no Step/Handoff/Outbox/notification/deep link/protected object or remote call. Owner-reread tests skip unsent delivery after revoke and render only a permitted tombstone/unavailable state when an already displayed notification is opened.

Pilot-0-C2e-4c Grant-owner loss test refinement:

- Schema/migration tests cover additive Restrict `grantedByRoleAssignmentId`, new/Pilot-active non-null enforcement, participant/Guardian/scope/time consistency, and exact audit-backed backfill. Missing, duplicate, conflicting, wrong-participant, wrong-scope, or time-incompatible candidates must block activation/manual-reconcile without heuristic selection.
- Resolver tests require the exact stored role id, participant, Guardian type, scope reach, active status, effective window, policy, and non-deletion. Rejoin through a new RoleAssignment for the same Participant, a forged current row, a current peer role, or a cached role result cannot satisfy old-Grant owner eligibility.
- Host tests prove account disablement, workspace-membership loss, and owner-service failure deny the affected user's ingress/presenter/action/stale open without writing Nurture RoleAssignment/Grant or globally revoking another actor's access. Host restore requires complete reread and cannot restore a terminal Nurture role or Grant.
- Suspension tests prove the exact suspended/temporarily ineffective role blocks every original-Grant read/action/delivery with no Grant terminalization, transfer, or peer fresh-confirm bypass. Only an independently authorized resume of the same exact role row may restore eligibility; C-2e-4c exposes no suspend/resume action.
- Terminal tests cover revoked, expired, deleted, and effective-end exact roles. Authorization blocks before reconciliation, a new role row never revives old work, no peer inherits owner, and last-Guardian/forced-removal/custody/authority-reassignment cases remain unavailable outside Pilot.
- Self-exit fault injection proves exact role revoke, pending actor-issued invitation cancellation, actor-owned active Grant `owner_self_exit` revoke, every dependent fence, and one Execution are atomic. Grants owned by another Guardian, retained authorship/audit, and the no-last-Guardian rule remain unchanged.
- Nurture-local reconciliation tests prove stable owner-loss identity, `owner_role_ended`, database time, nullable non-inferred actor, exact replay, immediate pre-reconcile fence, complete transaction rollback, and no dependence on My-Chat Step/Handoff/Outbox. Reconciler and fresh confirmation races converge without double terminalization.
- Fresh-confirm tests require another current exact-Family Guardian and full review/context/confirmation. The transaction may terminalize an unreconciled old active Grant, then creates a new independent Grant bound to the new participant/role, reuses Thread only as container, emits exactly new Grant/Thread refs, stores no `supersedesGrantId`, and never revives old work. Host loss or role suspension cannot enter this path.
- Concurrency tests cover self-exit versus question/revoke/replace, terminal role end versus action, reconciler versus fresh confirmation, Host loss/restore versus action, role-version drift, Grant-version drift, and deterministic role-before-Grant-before-Thread/dependent lock ordering. Exact replay retains immutable receipt while presenters return current safe state.
- All owner-loss/recovery outcomes require explicit empty snapshots, null driver, no Step/Handoff/Outbox/notification/deep link/protected object, and no remote call inside the Nurture transaction. C-2e-4d supplies exhaustive loop-to-closure and bounded cascade evidence.

Pilot-0-C2e-4d dependent cascade closure test refinement:

- Classification tests cross permanent Grant revoke/replacement/expiry/terminal-owner-loss and source/reply redaction against temporary Host loss, exact-role suspension, owner outage, and policy/Institution/CareGroup unavailability. Only permanent cases may mutate cascade state; every case must fail closed immediately while temporary recovery preserves resumable business lifecycle.
- Schema/migration tests cover typed `NurtureInteractionContextDependency`, exactly-one raw CHECK, Restrict FKs, workspace/type uniqueness/indexes, multi-candidate rows, atomic context issuance, and activation denial for protected contexts whose JSON refs lack complete typed dependencies. JSON scanning cannot be a fallback.
- Grant cascade matrices cover active/consumed/revoked contexts; every Receipt status and retry control; every Item status; active/no clarification; every Attention status; Thread summary; Message/audit retention; and body-derived payload scrubbing. Status, version, reason, time retention, tombstone, and forbidden-field assertions are exact.
- Redaction matrices independently cover Guardian source before/after acknowledge/reply and Caregiver reply after delivery. Source redaction suppresses its workflow but retains an independent reply body under its author's current policy; reply redaction affects only reply-side facts and cannot suppress/reopen the source Item, alter source Receipt, or enable another reply.
- Transaction tests use root-first and Grant-before-Message lock order, deterministic primary-key keyset batches, one Serializable transaction, no `SKIP LOCKED`, no intermediate commit, and root revalidation by every dependent writer. Concurrent insert/action versus cascade must either precede and be included or follow terminal root and fail before write.
- Cardinality tests cover zero, one, batch-minus-one, exact batch, batch-plus-one, more than 100, exact hard cap, and hard-cap-plus-one rows for every dependent type and mixed totals. Cap overflow fails before root mutation; no row, audit, Execution, output, or prefix effect commits.
- Fault injection after root lock, count, every batch/type transition, clarification event, projection scrub, closure query, audit, and Execution proves whole-transaction rollback. Final root-specific `NOT EXISTS` assertions reject any eligible survivor or phantom and exact replay creates no second transition/event/audit.
- `NurtureLifecycleCascadeAudit` tests require unique root/version/cause identity, canonical schema/count payload, deterministic closure hash, database completion time, indexed Restrict owning-Execution FK with one Execution allowed to own multiple root audits, and no body/token/dependent refs/account-device targets/Host state. Existing exact CommandExecution output refs remain byte-for-byte semantically bounded.
- Persistence/privacy tests search Message, Item, Attention, Thread summary, context state, Receipt metadata/driver, events, audit payload, logs, traces, metrics, replay seed, Handoff/Outbox, Notification, and Admin evidence for body, body-derived summary, attachments, token, raw account/device, or hidden target leakage after each cascade branch.
- Joint Host tests prove immutable old seeds remain same-Step-only and refs-only; post-invalidation materialization/consumer/provider retry stops on owner reread; unsent Notification is skipped; already shown OS Notification opens to current tombstone/unavailable; owner outage sends nothing; Admin only sees bounded evidence and cannot edit/close business facts.
- C-2e completion requires all prior C-2e-0 through C-2e-4d matrices plus removal of `take: 100`, sliced dependent refs, JSON-only discovery, and incomplete projection handling. No product implementation result is claimed until schema, kernel, repositories, surfaces, joint tests, and migration evidence exist.

Pilot-0-C2f-0 Enrollment lifecycle and actor-boundary test refinement:

- Status tests MUST classify `active|paused` as current and uniqueness-conflicting, legacy `pending` as conflict-bearing but not Pilot-creatable, `ended|withdrawn` as terminal/non-reactivatable, and `deleted` as unavailable for Pilot commands, uniqueness bypass, retention erasure, or re-entry.
- Actor tests MUST separate current exact-Family Guardian family-side restriction/withdrawal eligibility from exact-scope active Institution Admin institution-side restriction/end/transfer-proposal eligibility. Caregiver, Lead Caregiver, Technical Operator, service identity, natural-language/AI inference, raw ids, Host membership, and ambient administration MUST have zero topology authority.
- Pause classification tests MUST deny Enrollment-dependent cross-role reads/actions/delivery/new Grant while preserving nonterminal Enrollment/Grant/Thread/content/audit facts and producing no permanent C-2e cascade mutation. Recovery tests wait for C-2f-1 but MUST preserve the invariant that one side cannot release the other side's restriction.
- Multi-side tests MUST prove aggregate `paused` is not resume authority and that independently attributable family/institution restrictions can coexist. C-2f-1 MUST cover cross-side release denial, stale versions, concurrent pause/resume, and terminal-transition races before any action is implemented.
- Terminal classification tests MUST require old-Enrollment Grant/dependent closure for withdrawal, Institution end, and completed transfer while rejecting terminal reactivation. Exact status/reason/transaction behavior remains C-2f-2/C-2f-3 and cannot be inferred from C-2f-0 alone.
- Transfer boundary tests MUST reject in-place `careGroupId` edit, old Enrollment reuse, and movement/revival of RosterEntry, Grant, Thread, Message, Receipt, Item, Attention, context, or Handoff authority. The target relationship requires a new Enrollment and later fresh Grant/Thread authorization.
- Cross-Institution tests MUST prove pause/end/withdraw/transfer/policy/Grant effects in one Institution neither mutate nor grant access in another current Institution relationship. Cross-workspace tests MUST reject fuzzy/global/raw-link matching and every automatic profile/Enrollment/Grant/Thread/content/audit migration despite a shared My-Chat adult identity.
- C-2f-0 documentation evidence MUST NOT claim a schema migration, action key, transaction, result, Handoff, notification, provider, or runtime implementation. The `Pilot-0-C2f-1 Enrollment pause/resume test refinement` section owns pause/resume planning; C-2f-2 through C-2f-5 own the remaining executable details.

Pilot-0-C2f-1 Enrollment pause/resume test refinement:

- Schema/migration tests MUST cover `NurtureEnrollmentPauseHold` side/lifecycle enums, same-workspace Restrict refs, fixed side-compatible reasons, actor/role/Execution/time field checks, partial active uniqueness per Enrollment/side, released immutability, reserved closed state, and absence of free text/expiry/protected or Host/provider data. Existing rows cannot be guessed into holds; activation preflight fails on aggregate inconsistencies.
- Aggregate tests MUST prove no hold means active, either/both holds means paused, every hold transition increments Enrollment version, and status/hold mismatch fails closed without user-command auto-repair. Reads/actions MUST resolve holds rather than trust status or a cached presenter.
- Authority tests MUST cover every current Guardian and Institution Admin, another same-side eligible actor releasing, immutable place/release audit, wrong side, wrong Family/Institution/workspace, inactive/stale role, Caregiver/Lead/Operator/service/AI/Host/raw-id denial, and no Technical Admin release when a side lacks an eligible actor.
- Action-contract tests MUST require the two distinct family mappings and reuse the locked Institution mappings. Every surface/registry/manifest/handler check MUST reject `pause_institution_enrollment`, generic state changes, family/institution key aliasing, and any interpretation of Institution resume as global active.
- Confirmation tests MUST cover all three Guardian surfaces and Institution workbench, exact five-minute context binding, fixed consequence hash, side/status/reason/client injection, copied account/surface/device context, stale Enrollment/hold/role/policy versions, and natural-language non-authority. Copy assertions include retained history, non-recall, blocked two-way access, continuing Grant clock, other-side independence, and conditional resume.
- Transaction tests MUST lock context/role then Enrollment then holds, use database time, recompute aggregate, consume context, and commit audit/Execution atomically. Fault injection at every stage leaves no hold/status/version/context/audit/Execution partial effect and makes no remote call.
- Replay/concurrency tests MUST cover exact replay, fresh same-side already-satisfied with no audit rewrite, same-side pause/pause and resume/resume, different-side pause/pause from one version, pause/resume, release with other hold active, and stale consequence review. First commit wins; every stale loser refreshes/reconfirms and only then may both holds coexist.
- Lifecycle races MUST cover pause/resume versus end/withdraw/transfer, Grant create/replace/expiry, question capture, acknowledge, reply, redaction, provider retry, notification open, role loss, policy/CareGroup/Institution pause, and capability disable. Terminal Enrollment never resumes; writer-before-pause is immediately fenced, writer-after-pause rejects, and upper-scope recovery never releases a hold.
- Persistence/privacy tests MUST prove pause changes no Grant/Thread/Message/Receipt/Item/Attention/context lifecycle or body projection, creates no cascade, freezes/extends no clock, rewrites no immutable seed, and emits no bulk replay. During pause cross-role bodies/actions/delivery remain unavailable; after all holds clear only complete current owner reread may restore still-valid objects.
- C-2f-1 documentation evidence MUST remain planning-only. C-2f-2 owns transfer, C-2f-3 terminal exit/re-entry, and C-2f-5 exact result/Handoff/notification semantics.

Pilot-0-C2f-2 same-Institution CareGroup transfer test refinement:

- Intent schema/migration tests MUST cover exact source version/source+target Group/Institution/Admin binding, seven-day derived expiry, fixed safe reason/hash, lifecycle/actor/time/Execution checks, one effective pending source intent, replay/new-target conflict, and absence of raw contact/free text/protected/Host/provider data. No Enrollment Invitation fallback or reopened terminal intent is allowed.
- Action/surface tests MUST cover Institution workbench propose/cancel, read-only Institution board, all Guardian surfaces confirm/decline, any current Guardian first-commit behavior, and Caregiver/Lead/Operator/service/AI/raw-id denial. Registry tests reject direct `transfer_enrollment`, reuse of `initiate_enrollment`/`close_enrollment`, and command aliases.
- Preconditions MUST cover active source Enrollment, zero holds at proposal/confirmation, hold/version drift, same Institution/different Groups, active source Group as the sole positive transfer-out case, paused/archived source Group denial for proposal/review/open/confirm/decline with cancel-only cleanup, target active readiness/Lead/policy/gates/capacity, wrong/deleted scope, pending conflict, duplicate current Enrollment, and cross-Institution denial.
- Roster/schema tests MUST cover additive exact `Enrollment.rosterEntryId`, target creation only on confirmation, no target row on cancel/decline/expiry/fault, source canonical `status=closed + terminalReason=enrollment_transferred` history, current family-safe target label, no institution prefill copy, unique binding, and activation/manual-reconciliation behavior for missing or ambiguous legacy evidence. `transferred` as a separate Roster status MUST fail because C-4-2 supersedes that historical shorthand.
- Enrollment lineage tests MUST cover unique one-way `predecessorEnrollmentId` plus `continuityKind=care_group_transfer`, all-null/all-present constraints, no mirrored successor or parallel `supersedesEnrollmentId`, same workspace/process/Institution, different Groups, one successor across continuity kinds, no cycle, broken/ambiguous lineage rejection, old `ended + care_group_transfer`, new active identity, and equal database `leftAt/joinedAt` without overlap/gap. C-2f-3c supersedes the unimplemented transfer-only field name before schema work.
- Confirmation-context tests MUST bind actor/role/family/process/intent/source version/Groups/action/surface/consequence hash and assert complete old closure, retained/non-recall history, target safe roster, no content/Grant/Thread carryover, irreversibility, five-minute expiry, copied-context denial, and every client field injection.
- Transaction/fault tests MUST use context/Guardian/Enrollment/intent/Groups/holds/roster/ordered Grant/Thread/root-first lock order, C-2e hard-cap preflight, one database time, complete old Grant/dependent closure, old Thread/roster archive, target roster/new Enrollment, consumed intent, lineage/audit/Execution, and no remote call. C-2f-3b supersedes the earlier Intent-first wording. Every fault/overflow/closure survivor rolls back all effects.
- Closure/privacy tests MUST prove topology invalidation is not peer voluntary revoke, terminates every effective old Grant, preserves immutable body-free audit and allowed history, ends old caregiver current reach, and never copies/retargets Message/Receipt/Item/Attention/Thread/context/Handoff/notification/DailyCareLog/media/policy/Grant into the target Group.
- Race/recovery tests MUST cover duplicate/different proposals, cancel/confirm, confirm/decline, two Guardians, pause/proposal/confirm, transfer/end/withdraw, transfer/new work, target readiness/capacity drift, duplicate successor, exact replay, response loss, stale notification/open, hard-cap overflow, and no partial old-ended/new-missing or new-active/old-authority-live state.
- C-2f-2 remains planning-only. C-2f-3 owns permanent exit/re-entry, while C-2f-5 owns exact transfer result refs, proposal delivery, presenters, notifications, and Handoff behavior.

Pilot-0-C2f-3a permanent Enrollment action/authority test refinement:

- Registry/surface tests MUST require `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment` on Guardian Chat/board/workbench and the existing `close_enrollment -> nurture.institution.close_enrollment` on Institution workbench only. Institution board is read-only. Tests reject generic `end_enrollment`, aliases, cross-mapping, and reuse of initiate/pause/resume/transfer commands.
- Guardian authority tests MUST allow every current exact-Family Guardian independently and deny Grant-owner-only, invitation-recipient, first/join-order, relationship label, invented primary, unanimous/other-Guardian countersign, wrong Family/process/workspace, stale role, Institution/Caregiver/Lead/Operator/service/Host/AI/raw-id authority. Two Guardians prepared from one version must yield one terminal decision without actor/reason overwrite.
- Institution authority tests MUST allow any current exact-scope Institution Admin independently and deny Guardian countersign as a prerequisite, Caregiver/Lead/Operator/service/Host/raw-id callers, wrong Institution/group/workspace, and ambient workspace administration. Institution end cannot impersonate family withdrawal, and family withdrawal cannot choose Institution end.
- Status/reason tests MUST map family withdrawal only to `withdrawn + family_withdrawn`, Institution service end only to `ended + institution_service_ended`, and transfer only to `ended + care_group_transfer`. Free text, dispute/health/fee narrative, client status/reason/time/actor/audit injection, terminal reason rewrite, and terminal resume/reactivation are rejected.
- Confirmation tests MUST cover five-minute exact actor/role/owner-scope/process/Enrollment/version/action/surface/consequence binding on every entitled surface. Mandatory copy includes immediate permanent end, old Grant/work closure, retained non-recall history, notification non-recall/current stale open, no resume, and fresh re-entry. Natural language, navigation, copied context, or peer notification/acknowledgment cannot commit.
- Source-state tests MUST allow `active|paused` and reject pending/ended/withdrawn/deleted. Active holds cannot veto terminal intent or require cross-side release; terminal semantics close holds as system effects and never write `released` or a peer release actor. C-2f-3b owns exact hold/Grant/Thread transaction and fault evidence.
- Planning-boundary tests MUST prove C-2f-3a changes no schema/source/runtime/manifest/database or traffic, claims no exact closure/result implementation, and leaves atomic terminal closure to C-2f-3b, fresh re-entry to C-2f-3c, and presenter/notification/Handoff behavior to C-2f-5.

Pilot-0-C2f-3b atomic terminal-closure test refinement:

- Schema/migration tests MUST cover Enrollment terminal reason/actor Participant/RoleAssignment/unique Execution/time consistency; Hold closed time/Execution with null release audit; topology Grant causes with null `revokedByParticipantId`; TransferIntent `invalidated(source_enrollment_terminal)` audit; typed Enrollment context dependency; Thread/roster noncurrent states; all Restrict/workspace/scope checks; and exact-evidence activation preflight without heuristic backfill.
- Lock-order conformance MUST prove every topology and Enrollment-dependent writer uses context/actor then Enrollment before Hold/TransferIntent/roster/Grant/Thread/dependents. Transfer/end, transfer/pause, terminal/Grant, and terminal/work deadlock probes MUST reject the superseded Intent-first order and show bounded whole-transaction retry only for known database races.
- Grant classification tests MUST cover zero/one/multiple status-active rows, current effective versus expiry-at/before database `T`, every existing terminal status, different owners, malformed overlap, and mixed roots. Effective rows receive the exact topology cause with null revoke actor; elapsed rows converge as expiry; terminal rows never rewrite; no active row survives.
- Context/intent/hold tests MUST cover the command context consume, every other Enrollment-dependent context revoke, JSON-only dependency activation failure, zero/one/two active holds, released/closed history, pending and every terminal TransferIntent state, and exact system closure audit. Tests reject peer release/cancel/decline actor fiction or reopening.
- Transaction/cardinality tests MUST cover zero, one, batch boundaries, more than 100, exact aggregate hard cap, and over-cap totals across every Grant/root/dependent type. Preflight precedes root mutation; one database time applies to Enrollment/holds/intents/Grants/Thread/roster/audits/Execution; final zero-survivor assertions cover every actionable context/retry/Item/clarification/Attention/projection.
- Fault injection after replay lookup, every lock/classification/count, context consume, Enrollment write, each hold/intent/Grant/batch transition, Thread/roster closure, audit, Execution, and every postcondition MUST roll back all rows. Phantom, unknown integrity defect, cap overflow, or survivor returns no success and triggers Pilot stop/manual reconciliation without asynchronous or prefix repair.
- Replay/concurrency tests MUST cover exact response loss, fresh same-cause `already_satisfied` without terminal audit rewrite or false actor claim, different-cause current conflict, two Guardians, Guardian versus Institution, pause/resume/transfer, Grant create/replace/revoke/expiry, capture/ack/reply/redaction, dependent insert, provider retry, and stale notification open. Writer-first is included; terminal-first blocks before later business fact.
- Persistence/privacy tests MUST prove Message/care/media/authorship/retention/audit preservation, immediate cross-role protected denial, no body/ref leakage in bounded audit/telemetry, no RoleAssignment/Institution/Group/other-Enrollment mutation, no My-Chat technical ledger rewrite, null topology Grant revoke actor, and no remote/provider/Handoff commit dependency.
- Planning-boundary tests MUST prove C-2f-3b changes no schema/source/runtime/manifest/database/traffic, leaves fresh re-entry/provenance/history to C-2f-3c, and leaves exact output refs/presenter/notification/Handoff/delivery to C-2f-5.

Pilot-0-C2f-3c fresh re-entry and retained-history test refinement:

- Action/surface tests MUST require historical-Enrollment `initiate_enrollment -> nurture.institution.initiate_enrollment` on Institution workbench and exact-recipient `confirm_family_enrollment -> nurture.family_care.confirm_enrollment` on all Guardian surfaces. Institution board stays read-only. Tests reject `reactivate|reopen|reenroll`, old invitation reuse, Caregiver/Lead/Operator/service/Host/AI/raw-id action, automatic return, and new business aliases.
- Identity tests MUST prove Child/ChildCareProcess/Family/current Guardian reuse alongside new RosterEntry, Enrollment Invitation, context, CommandExecution, Enrollment, later Grant, and later Thread identities. Old Enrollment/roster/invitation/Grant/Thread/work/audit rows remain immutable and bound to the old episode; no copy, relink, migration, or reactivation is allowed.
- Unified-lineage schema tests MUST cover nullable unique Restrict `predecessorEnrollmentId`, `continuityKind=care_group_transfer|fresh_reentry`, all-null/all-present, initial-null, transfer and re-entry cases, exactly one predecessor/successor across both kinds, no old mirror, no parallel `supersedesEnrollmentId|reenteredFromEnrollmentId`, no branch/cycle, and same-workspace/process/Institution constraints. Migration/preflight MUST fail on ambiguous or conflicting legacy lineage rather than infer or backfill by time.
- Re-entry invitation tests MUST bind exact terminal predecessor/version, `fresh_reentry`, fresh unlinked roster, same-Institution target Group, exact Host recipient, canonical hash, and seven-day lifecycle. At most one effective pending invitation per predecessor is allowed; reissue/cancel/decline/expiry, target correction, provider retry, stale Host acceptance, and two fresh rosters cannot overlap or rewrite lineage.
- Predecessor tests MUST accept only a fully C-2f-3b-closed `family_withdrawn|institution_service_ended` terminal leaf with no successor and no current same-Institution Enrollment. Tests reject transfer-ended source, pending/active/paused/deleted, closure survivor, missing roster/Thread evidence, another Institution/workspace/process, multiple disconnected candidates, fuzzy/name/contact/latest-time choice, and generic invitation provenance bypass.
- Guardian-resolution tests MUST allow any exact invited recipient who remains a current Guardian of the predecessor process, regardless of prior inviter/confirmer/terminal actor/Grant owner/join order/relationship label. Re-entry presents only the exact old process for explicit confirmation. Another child, the C-2b-1 platform/local identity-establishment branch, non-Guardian recipient, stale/exited Guardian, copied token, wrong account/surface/workspace, and raw profile id MUST fail without existence leakage.
- Target tests MUST allow the same or another ready CareGroup within the same active Institution and reject inactive/unready/full/policy-blocked target, stale Lead/gates, cross-Institution target, and attempts to reinterpret an already terminal old Enrollment as transfer. Cross-Institution/next-stage behavior remains absent pending C-2f-4.
- Transaction/fault tests MUST use replay/context/current-Guardian then predecessor-Enrollment-first ordering before Institution/target Group/invitation/fresh roster/lineage uniqueness, one database time, and all current rereads. The commit atomically consumes context/invitation, creates one active new Enrollment with `joinedAt > predecessor.leftAt`, writes lineage, links roster, and stores audit/Execution. Fault injection at every lock/read/write/postcondition MUST leave no partial successor, roster link, consume, audit, or Execution and MUST never mutate the old episode or call a remote service.
- Replay/concurrency tests MUST cover exact response loss, duplicate command, two Guardians, two Institution Admins, same/different target Groups, generic versus re-entry invitation, concurrent reissue/cancel/confirm, another successor, and a new current Enrollment. One predecessor gets at most one successor; losers remain unconsumed/current-conflicting without false `already_enrolled`, duplicate lineage, or partial effect.
- History presenter tests MUST separate old/new episodes and allow only safe child label, Institution, Group, joined/left dates, terminal class, and historical/current classification. Exact terminal actor, raw ids, free text, Grant/Thread existence, and protected refs remain absent. Another Institution's history MUST be absent from every Institution-local view; the later C-2f-4-2 family longitudinal presenter may aggregate only the locked safe summaries under current Family ownership. Audit access remains separately scoped.
- Protected-history tests MUST apply current Family/role, original Grant, exact authorship, redaction, retention, and policy to every old episode read. Eligible Guardians may retain allowed family-side history and eligible Caregiver authors only allowed same-side author history; old cross-role bodies stay tombstoned. New Caregiver, Grant, Thread, Host membership, route, notification, provider retry, replay, or technical recovery MUST NOT revive, merge, backfill, or deliver old facts.
- Planning-boundary tests MUST prove C-2f-3c changes no schema/source/runtime/manifest/database/traffic, corrects the readiness summary from C-2f-3a/3b to C-2f-3c, leaves cross-scope portability to C-2f-4, and leaves exact result refs/presenter route/notification/Handoff/delivery to C-2f-5.

Pilot-0-C2f-4-0 next-stage and cross-scope classification test refinement:

- Scope-classification tests MUST prove one same-workspace/current-Family-resolved ChildCareProcess can remain longitudinal while stage episodes and Institution-local Enrollments have separate identities, owners, lifecycles, and authorization predicates. Tests MUST distinguish the My-Chat global platform Child/Family identity from the Nurture workspace-local Child/Process/Family dossier and reject either an Institution-owned longitudinal profile or treating platform identity as local authorization.
- Same-Institution routing tests MUST keep active CareGroup movement on C-2f-2 and terminal return on C-2f-3c. Cross-Institution cases MUST reject `care_group_transfer|fresh_reentry`, `predecessorEnrollmentId`, reused invitation/roster/Enrollment, and every transfer/reactivation alias.
- Different-Institution onboarding tests MUST require ordinary fresh roster/invitation/exact current-Guardian confirmation/Execution/Enrollment against the exact family-selected Child/Process. Tests MUST allow independent current Enrollments at two Institutions and prove the new confirmation cannot mutate, auto-end, pause, or withdraw the old relationship.
- Isolation tests MUST prove no Grant, Thread, Message, Receipt, Item, Attention, context, roster, role, policy, notification, Handoff, protected history, or existence signal carries between Institutions. Each Institution presenter and command MUST owner-reread only its own Enrollment and independently authorized facts.
- Stage-independence tests MUST prove a next-stage change keeps Child/Process and does not create, move, pause, terminate, or reactivate Enrollment. Institution observation, roster, age/birthday, client value, and AI inference MUST NOT commit stage state. Exact StageEpisode schema/authority/transition tests remain C-2f-4-1.
- Composition tests MUST treat stage change plus new-Institution enrollment as two separately authorized, independently replayable transactions. Both commit orders, one-success/one-failure, retry, response loss, and stale reread MUST produce no distributed rollback, implicit consent, or partial authority carryover.
- Cross-workspace tests MUST allow exact current typed platform binding reuse while denying raw-id linking, PII/fuzzy/global inference, automatic local-association reuse, dossier discovery/export/import/migration, authority carryover, and possible-match disclosure for same adult account, child name, birth fact, contact, media, family relation, or roster. A fresh target-workspace local association may be established only through the locked current-owner saga; scenario-data transfer remains unavailable in Pilot.
- Future-protocol boundary tests MUST prove C-2f-4-0 does not add an export/import object, transfer token, global identifier, action key, handler, or migration. Any future protocol remains separately versioned, consented, allowlisted, owner-reread, expiring, replay-safe, audited, non-authority-bearing, and outside this checkpoint.
- Planning-boundary tests MUST prove C-2f-4-0 changes no schema/source/runtime/manifest/database/traffic; C-2f-4-1/2/3 now lock versioned stage facts and exact Guardian lifecycle, cross-Institution privacy, and future-protocol detail, while C-2f-5 retains exact result/presenter/notification/Handoff/delivery.

Pilot-0-C2f-4-1 stage fact, authority, and lifecycle test refinement:

- StageEpisode schema tests MUST cover versioned catalog/coarse/optional fine keys, current/closed status, unique nullable predecessor, fixed transition/terminal classes, all-null/all-present close fields, exact Guardian/RoleAssignment/Execution Restrict refs, same workspace/process, one current row, one successor, acyclic linear history, database-time ordering, and no Host/Institution/free-text/medical/provider fields.
- Catalog tests MUST accept the locked eight coarse product keys and catalog-compatible allowlisted fine keys, preserve the required fine distinctions, and reject free-form, unknown-version, reinterpreted-version, incompatible coarse/fine, Institution/classroom/Enrollment-state, diagnostic, and client-display-only keys.
- Actor/surface/action tests MUST allow any current exact-Family Guardian through `update_child_care_stage -> nurture.family_care.update_child_care_stage` on Chat, family board, and family workbench. Tests MUST reject primary/first/unanimous/Grant-owner/invitation-recipient hierarchy, stale/exited Guardian, Institution Admin, Caregiver/Lead/Operator/service/Host/AI/raw-id caller, every alias, and copied cross-user/surface/workspace context.
- Confirmation tests MUST bind the exact actor/role/Family/Process, Process and current Episode ids/versions or explicit unset state, catalog/key tuple, operation, action/surface, five-minute expiry, and canonical consequence hash. Copy MUST show old/new or clear, retained history, non-diagnostic meaning, and no Enrollment/Institution effect. Clients cannot author identity/version/time/transition/lineage/audit fields.
- Lifecycle tests MUST cover unset staying unset, first `initial`, same-key `already_satisfied`, normal change, current correction, explicit clear, and set-after-clear. Change/correction MUST atomically close one current leaf and create one successor at database `T`; clear closes without successor; later set links the cleared leaf. Closed rows never reopen and no operation mutates a noncurrent historical row.
- Projection tests MUST prove `currentStageKey` equals the current Episode coarse key or null and updates in the same transaction with Process version. Missing/duplicate current Episode, key/version mismatch, broken lineage, or projection divergence MUST fail closed and enter owner reconciliation; command reads and policy MUST NOT authorize from projection alone.
- Migration/preflight tests MUST quarantine every non-null legacy `currentStageKey` lacking exact Guardian/Execution Episode provenance and MUST reject backfill from profile snapshot, age/birthDate, pregnancy output, context material, roster, Institution evidence, name, time, or inferred latest row. Null legacy state remains a valid unset process.
- Transaction/fault tests MUST use replay/context/Guardian/Family/Process/current-Episode/predecessor ordering, current owner/catalog rereads, one database time, context consume, close/create/projection/version/audit/Execution atomicity, and fault injection at every boundary. Every fault leaves no partial close, successor, projection, version, audit, or Execution and invokes no Enrollment/Host effect.
- Replay/concurrency tests MUST cover response loss, exact duplicate, same-stage fresh duplicate, two Guardians, change/change, change/correct, change/clear, correction/clear, set-after-clear, and process lifecycle races. First commit wins; stale losers refresh/reconfirm; no branch, double current, false actor, duplicate audit, or silent overwrite occurs.
- No-inference tests MUST prove age passage, birthDate, Institution roster or observation, Caregiver action, AI suggestion, pregnancy-stage result, schedule, and policy change create no StageEpisode or projection update. `evaluate_pregnancy_stage` remains guidance-only and non-authoritative.
- Downstream-boundary tests MUST preserve old artifact/material stage snapshots, mark staleness only through each owner's policy, and prove stage change creates/mutates no Enrollment, transfer, withdrawal, Grant, Thread, Institution visibility, Host seed, Handoff, Outbox, notification, or deep link.
- Planning-boundary tests MUST prove C-2f-4-1 changes no schema/source/runtime/manifest/database/traffic, keeps family/Institution visibility and multi-Institution concurrency under the separately locked C-2f-4-2 contract, keeps the future cross-workspace protocol boundary under the separately locked C-2f-4-3 contract, and leaves exact result/presenter/notification/Handoff/delivery to C-2f-5.

Pilot-0-C2f-4-2 same-workspace multi-Institution visibility and concurrency test refinement:

- Family-presenter tests MUST begin with a current exact-Family Guardian and exact ChildCareProcess, aggregate the StageEpisode timeline plus safe Enrollment episode summaries across Institutions, and expose only safe child label, Institution, Group, joined/left times, current/historical class, status, and terminal class. Tests reject stale/exited Guardian, another Family/process/workspace, terminal actor, raw ids, free text, internal audit, Grant/Thread/protected refs, and copied cached rows.
- Family protected-history tests MUST re-evaluate every original Enrollment/Grant/role/authorship/redaction/retention/policy boundary independently. Tests MUST prove that aggregation cannot merge Threads, share a Grant, move content, revive cross-role bodies, authorize one episode from another, or create a cross-Institution projection.
- Institution repository-query tests MUST require workspace plus exact current Institution and authorized CareGroup predicates before row materialization. Static/spy/integration evidence MUST reject query-all-by-process followed by in-memory controller/service/presenter filtering, missing Institution predicate, ambient workspace admin, cached role, raw-process lookup, and guessed Group scope.
- Institution actor/output tests MUST allow exact Institution Admin safe own-Institution current/history roster and Enrollment summaries plus allowlisted Grant coverage metadata; allow Caregiver/Lead only current assigned Groups and separately Grant-authorized work; and restrict Technical Operator to refs-only evidence. Stage, family timeline, other Groups/Institutions, protected bodies, and relationship graph remain denied.
- Noninterference tests MUST vary another Institution's absent/pending/current/paused/terminal Enrollment, Group, stage, Grant, and content while asserting identical Institution-local list rows, counts/totals, pagination, sort, conflicts, duplicate classification, empty/error/unavailable copy, response timing class, logs/metrics, and route-token shape. No stable Child/Process id or comparable cross-Institution opaque token may escape.
- Stage-visibility tests MUST prove Enrollment/roster alone exposes no StageEpisode, currentStageKey, coarse/fine key, history, stage-derived label, or stage-change signal. The Pilot registry MUST contain no `child_development_stage` or equivalent dataClass, and `family_care_question` Grant MUST NOT imply stage permission.
- Uniqueness/concurrency tests MUST enforce one current-conflicting Enrollment per workspace/process/Institution while allowing simultaneous current Enrollments at different Institutions. Concurrent A/B onboarding, pause/resume, transfer, withdraw/end, Grant, and policy changes MUST affect only the exact Institution. Shared locking may serialize but cannot produce cross-Institution conflict, mutation, disclosure, compensation, or combined Execution.
- Dependency tests MUST prove Enrollment commands bind/reread current Family ownership, Process lifecycle, target invitation/roster/Institution/Group/Enrollment, and consequence-relevant versions but do not treat an unrelated StageEpisode/currentStageKey-only change as topology drift. Actual Family-owner or Process lifecycle change fails closed for every Institution without revealing another Institution cause.
- Composition tests MUST run stage update before/after/concurrently with different-Institution Enrollment and prove both independent commit orders, response loss, one-side failure, and retry. No stage snapshot/visibility, Enrollment rollback, distributed transaction, cross-effect idempotency key, or implicit consent is allowed.
- Stale-read tests MUST owner-reread every family/Institution list/detail/action/deep-link. One stale/failed family episode segment becomes generic unavailable without cached substitution or reason/existence leakage, while independently current episodes remain renderable. Institution cached data never authorizes or fills a current denial.
- Cross-scope denial tests MUST map another Institution raw id/token, removed role, and target mismatch to the generic unavailable/permission-safe class before sensitive lifecycle lookup. Error bodies, logs, metrics, trace attributes, and pagination MUST NOT disclose another Institution or child match.
- Planning-boundary tests MUST prove C-2f-4-2 changes no schema/source/runtime/manifest/database/traffic, adds no dataClass/action/route/shared projection, keeps future cross-workspace behavior under the separately locked C-2f-4-3 boundary, and leaves exact result/presenter route/notification/Handoff/delivery to C-2f-5.

Pilot-0-C2f-4-3 cross-workspace identity-reuse and scenario-data-portability test refinement:

- Identity-reuse tests MUST allow one exact current My-Chat Child/Family pair to establish a fresh target-workspace Nurture association after full target authorization. They MUST prove the same anchor can map into W1 and W2 without any product API revealing the other association, count, existence, dossier, or authority.
- Matching tests MUST deny same-adult-, name-, birth-, contact-, roster-, media-, relationship-, client-, and raw-id-based association. Only the current typed binding pair and exact workspace association qualify. Wrong/missing/stale/revoked/superseded/ambiguous binding, wrong anchor kind/version, missing/duplicate mapping, owner outage, and pair mismatch return generic unavailable with no side channel.
- Target-local tests MUST prove source RoleAssignment, Enrollment, Grant, Thread, content, history, StageEpisode, profile, policy, and audit visibility do not copy or become defaults. Existing current target association is explicitly reused; no automatic dossier merge, duplicate local aggregate, or cross-workspace list/search is allowed.
- Platform-field tests MUST prove the withdrawn copy-and-reconfirm `displayName|birthDate` payload and portability ledger/token are absent. `NurtureChild.displayName` is an independently Guardian-entered local care label with no platform-source version or synchronization; `birthDate` remains null for activated bound rows. Platform rename cannot silently rewrite the local label, while platform archive/delete/restore changes current routing eligibility without deleting Nurture facts. Raw platform ids, anchors, birth fact, and source-dossier values remain absent from Nurture client/presenter/Handoff/Outbox/provider/log/trace/metric/analytics/search/vector bodies, and cache/search/export residual probes cover every lifecycle transition.
- Lifecycle tests MUST distinguish global binding revoke from one workspace association/Enrollment close. Global revoke fences all routes without rewriting local facts; local close affects only that workspace and does not mutate global binding. My-Chat Family membership revoke and Nurture Guardian self-exit also remain independent, while Pilot read requires both current.
- Merge/split tests MUST cover a target with no anchor, the same anchor, and a different anchor. Only exact same-anchor replay may recover; different-anchor or ambiguous evidence quarantines for owner reconciliation. No automatic follow, rebind, local-id rewrite, profile merge, Technical Operator edit, or cross-owner mutation is permitted.
- Future-protocol absence tests MUST prove no scenario-data export/import action, body snapshot, portability route/token/capability/ledger, Handoff declaration, provider body, or executable runtime path exists. Any later data transfer is separately versioned/consented and cannot carry authority.
- Planning-boundary tests MUST prove C-2f-4-3 changes no schema implementation/source/runtime/manifest/database/traffic and creates no current transfer action/route/token/capability. `platform_child_family_identity_source_v1` and C-4-5 remain the implementation authority.

Pilot-0-C2f-5 lifecycle result, recovery, presenter, and Host-effect test refinement:

- Result-vocabulary tests MUST prove persisted `businessOutcome` is exactly `applied|already_satisfied`, response-only `disposition` is exactly `executed|replayed`, and current presenter classification is exactly `changed|already_current|processed_but_unavailable`. A duplicate/replay actor MUST NOT be described as the performer, owner, approver, or joint consenter of the original effect.
- Exact-ref codec tests MUST version and compare pause/resume Hold refs, transfer Intent/source-target Enrollment/Roster refs, terminal Enrollment/historical Roster ref, re-entry Enrollment/Roster/Invitation refs, and stage Process/Episode refs against the C-2f-5 matrix. They MUST reject Grant/Thread/Hold collections, Message/Receipt/Item/Attention, cascade dependent refs, audit refs, unknown types, duplicate/conflicting refs, raw ids in presentation, and noncanonical order/hash.
- Ref-privacy tests MUST prove output refs never appear in client response envelopes, URL/query/route state, Host Chat transcript, Notification, Handoff, Outbox body, provider payload, logs, traces, analytics, metrics, support exports, or Technical Admin query dimensions. There MUST be no `open_result` token, result-by-ref endpoint, raw filter, or cross-surface cached result.
- Presenter tests MUST cover `enrollment_lifecycle_current`, `enrollment_transfer_current`, `enrollment_confirmed`, and `child_care_stage_current` across Chat, Family board/workbench, Institution board/workbench, Notification, and Technical Admin. Every presenter MUST authenticate, resolve current role/scope/source/policy/redaction, use the surface allowlist, and return generic unavailable rather than cached/historical authority when the current owner read is denied.
- Route tests MUST allow only generic `route_class` plus `view_mode=current|recent|history`; destination state MUST contain no business/output ref, old action/result, filter, body, or context. Every destination MUST reread current owner facts before display/action.
- Recovery-order tests MUST look up stable `commandRequestId` before rejecting an already consumed/expired context, then verify Execution identity, canonical input hash, caller binding, and original-Step provenance. Exact replay MUST return original outcome/refs with `disposition=replayed` and then current presentation. Changed input/caller/workspace/Step MUST conflict without another business write.
- Response-loss/fault tests MUST inject loss after Nurture commit and before presenter, worker response, Step completion, Handoff materialization, Outbox dispatch, and provider receipt. The same durable Step MUST reclaim and complete at most once; wrong-Step replay MUST fail; committed Nurture facts MUST never be compensated, deleted, reopened, or rewritten. Losing the command id MUST expose only an ordinary current presenter and MUST NOT create a probe Execution.
- Precommit-denial tests MUST prove deterministic policy/context/provenance denial writes no Execution. Retryable local transaction/owner failures may retry only within the original five-minute context; expiry forces a new current-state interaction rather than replay by guessed refs.
- Legacy-Handoff tests MUST pin existing `user_attention` to purpose `user_attention` and source types `family_care_message|child_link_receipt|family_care_item`. Any Enrollment/transfer/stage source, new purpose, or reinterpretation under this key MUST fail validation.
- Future additive-contract tests MUST reserve `guardian_relationship_attention` only for purposes `review_enrollment_transfer|enrollment_relationship_changed` and source types `enrollment|enrollment_transfer_intent|guardian_role_assignment`. They MUST prove no current manifest/registry/capability advertises it and capability remains default-off until cross-repo additive adoption and conformance pass.
- Host-effect matrix tests MUST prove pause/resume, transfer cancel/decline/confirm, fresh re-entry confirmation, every stage mutation, and portability produce explicit `[]` or no current command as specified. Transfer proposal targets every current exact-Family Guardian RoleAssignment; family withdrawal targets only other current Guardians; Institution end targets all current Guardians; initial/re-entry invitation remains the existing Host Invitation path. No completion or stage notification is allowed.
- Recipient snapshot tests MUST use exactly one stable cohort-level request/draft key per business effect/purpose/source when any exact RoleAssignment is eligible at business commit. The owner-owned cohort contains the complete commit-time RoleAssignment set; its canonical set hash enters the draft key, while My-Chat alone derives stable per-recipient candidate/link identities beneath the one resulting Handoff. Later-added Guardians MUST NOT receive old events; removed/suspended/exited recipients MUST stop on current reread. Zero eligible recipients MUST persist `[]`. Exact replay MUST return the byte-equivalent snapshot/cohort, and changed recipient set/source/expiry MUST conflict rather than mutate history.
- Expiry tests MUST cap transfer-review Handoff at the TransferIntent expiry and relationship-termination attention at seven days plus the earlier Pilot allowlist expiry. Database time, not client or provider time, decides eligibility.
- Driver tests for every non-empty-capable path MUST require a persisted and currently claimed original My-Chat Step before the first Nurture write. Missing trusted provenance MUST fail before commit. Same-Step reclaim MAY finish once; wrong-Step, raw claim-token persistence/logging, after-the-fact seed invention, Admin draft construction, and recipient/source/expiry substitution MUST fail.
- Notification privacy tests MUST permit only generic durable copy plus `notification_id`. They MUST reject child/Institution names, relationship state, body, target, action state, business/output ref, token, or Nurture context in provider payload/logs. Wrong user/workspace/Notification id MUST return generic unavailable before any Nurture call.
- Send/open tests MUST enforce My-Chat exact recipient/workspace/Notification and eligible Handoff validation, then current Child binding, Family binding, exact `FamilyChildMembership`, and exact adult Family membership reread before the Nurture call. Nurture MUST resolve both exact workspace associations and reread Participant, recipient RoleAssignment, Message/Receipt/Item, Grant, Enrollment, Thread, CareGroup, Institution, policy, source, and destination before destination-bound `open_notification` and final destination reread. Provider delivery and Host read/unread MUST NOT mark a Nurture transfer/Enrollment/read/ack outcome. Tests independently revoke Child binding, Family binding, pair membership, adult membership, Child association, and Family association and prove respectively child-only, family-all-children, pair-only, adult-only, and workspace-local fencing with generic unavailable and no sibling-child/cross-workspace existence leak.
- Planning-boundary tests MUST prove C-2f-5 changes only task documentation. Presenter names and `guardian_relationship_attention` key/purposes/source types remain future design contracts; no manifest, registry, contract package, source, schema, migration, route, capability, database, environment, provider, or traffic change is present. C-2f is complete only as planning; C-3/C-4 operational IIB evidence remains open.

Pilot-0-C3-0a Account–Subject reachability test refinement:

- Catalog tests MUST distinguish activated user-facing education/nurture business scenarios from subject-neutral My-Chat infrastructure. Chat, Workflow, Notification, Forum/Knowledge, delivery, and Technical Admin MUST NOT acquire synthetic child refs merely because the product catalog is narrowed.
- Shared-contract tests MUST use generic `subject` and MUST reject Base/My-Chat imports or fields tied to `NurtureChild`, `NurtureChildCareProcess`, local Family, CareGroup, Enrollment, or other scenario-owned identity. Product copy may say child without changing the subject type. My-Chat's separately owned platform Child/Family and scenario-binding contract MUST remain distinct from the local Nurture subject and cannot carry Nurture authority.
- Entry tests MUST begin from the authenticated My-Chat account/workspace and scenario registration. Client-supplied user, Participant, RoleAssignment, subject, Family, ChildCareProcess, CareGroup, Enrollment, Institution, or relationship type MUST NOT select, reveal, or authorize a subject context.
- Guardian-path tests MUST require current My-Chat Child+Family bindings, exact `FamilyChildMembership` and adult Family membership, typed current anchors/workspace associations, and the current exact Participant, Guardian RoleAssignment, child-scoped Family, and ChildCareProcess. Caregiver-path tests MUST require the current bound/associated subject plus exact current operational `caregiver + scopeType=care_group` RoleAssignment, selected CareGroup, and eligible Enrollments. Either owner path alone MUST deny. Institution-path shapes remain contract-negative in C-3; Technical Operator and ordinary workspace admin receive no business subject context.
- Scope-kind tests MUST cover `unresolved|single_subject|subject_collection`. Unresolved candidates MUST be owner-returned, bounded, display-safe, and actionless until clarification. Single subject MUST bind one process. Collection membership MUST be filtered in the owner repository and MUST NOT confer bulk write, shared Grant, cross-child action, or another collection's existence.
- Multi-child tests MUST cover zero, one, and several current subjects for one Guardian; one platform Family with multiple children and per-child local Role/Grant isolation; one Family with two platform members but only one Nurture Guardian and the inverse; one Caregiver collection across all three Pilot child scopes; and Institution collections without protected family content. Current relationships in both owners, not account history or UI selection, determine membership.
- Prospective tests MUST prove an Enrollment/Guardian/Staff invitation exposes only its existing minimum invitation allowlist. Acceptance, institution roster prefill, same-adult account, name, birth fact, contact, or copied opaque context MUST NOT yield established subject discovery before the separately authorized onboarding commit.
- Provider tests MUST require versioned scenario ownership, list current reachable contexts, and resolve/recheck exact opaque context. My-Chat MAY organize entry by its current protected platform Child identity, but responses carry only workspace/scenario-bound opaque context, scope kind, display-safe owner copy, route class, and freshness/version evidence. Raw platform/local ids, anchors, profile bodies, protected relationship metadata, action authority, and client-authored membership MUST fail codec/privacy validation.
- Host-boundary tests MUST prove live dual-owner resolution and no second canonical Subject/account-subject authorization table. Platform Child/Family/binding rows MUST NOT be accepted as cached Nurture authorization. Any refs-only index remains non-authoritative and cannot be inferred from Notification, Chat history, analytics, workflow refs, contacts, or recent subjects.
- Reread tests MUST cover initial render, candidate selection, detail/history, action preparation, submit, result, notification open, retry, and response-loss recovery. Role/Family/Process/CareGroup/Enrollment/policy/lifecycle changes at every seam MUST remove or block current context without cached substitution or existence leakage.
- Isolation tests MUST allow only exact current platform identity correlation and deny PII/fuzzy same-child inference, cross-workspace local-dossier list/count/existence, automatic merge/rebind, raw linking, authority/content portability, child-account impersonation, and context forwarding. Same anchor mapped into W1/W2 MUST not expose either association to the other; wrong workspace must be noninterfering. Platform ids, anchors, and subject handles MUST be absent from URL, durable Chat, Handoff/Outbox, Notification/provider, logs/traces/metrics, analytics/search/vector, and Technical Admin relationship queries.
- Planning-boundary tests MUST prove C-3-0a changes task documentation only. No schema, Host index, contract package, manifest field, subject provider, route, handler, UI, runtime, database, environment, capability, or traffic change exists. C-3-0b retains authenticated ingress/trusted-principal wire decisions and C-3-0c retains exact provider/presentation types.

Pilot-0-C3-0b-0 trusted-principal test refinement:

- Public-boundary tests MUST prove browser/mobile/Chat clients can reach Nurture business capability only through authenticated My-Chat routes. Raw Nurture presenter, owner, resolver, provider, command, dev-host, and internal service endpoints MUST be absent or reject public/end-user credentials.
- Dual-proof tests MUST independently vary the My-Chat workload credential and represented adult principal. Missing/wrong service caller, audience, scenario, contract version, account, human actor, workspace, or route provenance MUST fail closed. A valid service identity without a valid adult MUST NOT resolve a Participant or execute a business action.
- Principal-allowlist tests MUST allow only opaque account/human-actor/workspace refs, scenario/surface provenance, request/correlation evidence, principal origin, and version at the Host trust layer. Participant, RoleAssignment, role, Subject, Family, ChildCareProcess, Institution, CareGroup, Enrollment, Grant, policy, target availability, or command authority in the principal MUST fail codec validation.
- Identity-chain tests MUST bind Nurture Participant by exact workspace plus canonical account ref. Host actor ref is audit provenance only. Ordinary subject-aware zero Participant returns generic unavailable; duplicate/mismatched Participant is a fail-closed data defect; neither case may fall back to actor id, email/contact, account history, another workspace, or client selection. The sole exact-invitation prospective exception remains C-3-0b-3-owned and cannot become an ordinary fallback.
- Workspace tests MUST treat client selection as untrusted until My-Chat proves the exact current context. Missing/ambiguous/forbidden workspace, membership loss, default-workspace drift, cross-workspace token/context, and Nurture Participant-history inference MUST fail before subject presentation or action.
- Surface tests MUST derive scenario/surface provenance from an allowed server route/registration, reject client body/header substitution, and prove that a valid surface alone grants no Participant role, Subject access, or action. Same action on a disallowed but authentic surface remains unavailable after owner resolution.
- Client-echo tests MAY carry action key, owner-issued opaque target/token, expected version, confirmation, form/Chat input, and idempotency only as untrusted values. Structured role/scope/subject/relationship/Grant/policy fields MUST be rejected, while natural-language role/id claims MUST be ignored as authority and sent only through ordinary intent parsing.
- Invitation tests MUST keep Host invitation authentication/acceptance outside ordinary membership-required subject ingress. Exact recipient acceptance may establish Host membership, but cannot create Nurture role/Subject authority; ordinary ingress starts only after current Host establishment and then applies the separately authorized prospective onboarding contract.
- Variant classification tests MUST reserve interactive session, durable Run actor, notification recipient-open, C-0 provisioning, and Technical Operator as distinct paths. Worker/service/operator identity MUST NOT impersonate a Guardian/Caregiver/Institution actor; exact path mechanics remain C-3-0b-3.
- Secret tests MUST prove bearer/session, internal service, claim, scenario, invitation, and provider credentials are absent from Nurture facts, CommandExecution payloads, logs, analytics, traces, metrics, Handoff/Outbox, Notification, and error bodies.
- Compatibility tests MUST pin current optional `actor_id` and workspace-optional Nurture envelope behavior to legacy/pre-activation fixtures. A vNext activated fixture MUST require the additive principal/workspace path; validators MUST NOT silently tighten or reinterpret legacy manifests before explicit Base/My-Chat adoption.
- Planning-boundary tests MUST prove C-3-0b-0 changes task documentation only. Exact public route/session/workspace behavior remains C-3-0b-1, private DTO names remain C-3-0b-2, variants remain C-3-0b-3, and denial/audit/adoption evidence remains C-3-0b-4. No contract, manifest, source, schema, route, runtime, secret, environment, capability, provider, database, or traffic change exists.

Pilot-0-C3-0b-1 public context/session/workspace test refinement:

- Context-mode tests MUST cover exactly `platform_general|workspace_business|invitation_acceptance`. General mode MUST produce no Nurture principal/call, business mode MUST require exact current workspace gates, and invitation mode MUST authenticate the exact recipient without requiring pre-existing target membership or granting ordinary business access.
- Storage-semantics tests MUST permit a general Chat thread to be physically partitioned under a personal workspace while proving that partition cannot authorize workspace-private Knowledge, scenario routing, Nurture lookup, Subject listing, Notification recovery, or business history. Storage and business workspace identifiers being equal MUST NOT collapse the modes.
- General-Q&A tests MUST allow generic non-personalized education/nurture guidance and MUST deny private family/child/teacher/Institution/workflow lookup from text, LLM classification, recent context, account history, a sole membership, or a cached Subject. No existence distinction may leak.
- Transition tests MUST require explicit user confirmation from general mode even with one eligible workspace. Several eligible workspaces MUST require selection. Transition MUST create/enter a workspace-scoped conversation and default to the current confirmed trigger intent only; prior messages, attachments, searches, summaries, tokens, and inferred profile data MUST remain behind unless separately selected and allowed.
- Workspace-source tests MUST accept server-owned resource binding, explicit shell selection, or sole active membership only on an explicitly business-scoped route. Existing thread/Notification/Run/business-resource binding MUST win; header/body/shell mismatch, personal default, recent workspace, another tab's selection, Nurture inference, and cross-workspace token MUST fail before owner call.
- Gate-order tests MUST prove authentication/user/human actor -> exact workspace -> active workspace/membership -> environment capability -> scenario registration -> workspace allowlist/Pilot cohort -> server surface -> principal -> Nurture owner resolution. Every injected failure before principal creation MUST yield zero Nurture calls and no business/existence evidence.
- Session tests MUST cover expired/revoked bearer, account disablement, human-actor invalidation, workspace/membership loss, reauthentication, concurrent tab workspace switch, prepared action, scenario token, and response/result recovery. Reauthentication MAY restore current presentation after full reread but MUST NOT auto-submit, revive, or move an old action/context.
- Invitation-preview tests MUST require authenticated exact recipient and current purpose/workspace/scenario-bound Host invitation before minimum safe copy. Unauthenticated opens reveal only sign-in guidance; wrong user, expiry, revoke, consume, drift, guessed ref, and copied link return generic unavailable without target details or Nurture call.
- Invitation-acceptance tests MUST require explicit accept, one Host transaction, exact replay, first-commit-wins concurrency, stable membership result, and no Nurture Participant/role/Subject/action effect. A post-accept Nurture continuation MUST be separate/idempotent; denial/outage cannot roll back membership, and response loss cannot duplicate either owner effect.
- Gate-separation tests MUST prove Nurture capability/cohort disable can block continuation without editing Host invitation/membership. Pilot workspace isolation MUST be verified; non-isolated rollout remains blocked until generic workspace-content entitlement review.
- Public-state tests MUST cover `sign_in_required|account_context_not_ready|workspace_selection_required|workspace_unavailable|scenario_unavailable|access_changed|unavailable` and reject leakage of internal workspace existence, membership role, capability/allowlist/cohort reason, invitation state, Participant/role/Subject/Grant/policy reason, stack, token, or raw id.
- Current-gap tests MUST record that My-Chat still defaults omitted workspace to personal and has no adult Workspace Invitation model/acceptance route; Agent Invitation MUST fail any conformance attempt for this role. These observations are implementation blockers, not expected Pilot behavior.
- Planning-boundary tests MUST prove C-3-0b-1 changes task documentation only. Private service/principal wire semantics remain C-3-0b-2, exact path variants remain C-3-0b-3, and client-echo/denial/audit/adoption evidence remains C-3-0b-4. No contract, invitation model, manifest, source, schema, route, runtime, secret, environment, capability, provider, database, or traffic change exists.

Pilot-0-C3-0b-2 private caller/principal test refinement:

- Dual-proof cross-product tests MUST cover valid/invalid/missing service caller against valid/invalid/missing signed envelope. A caller credential alone, assertion alone, caller-binding mismatch, audience mismatch, or verifier outage MUST produce zero Participant/resolver/policy/command calls.
- Caller-origin tests MUST accept only `my-chat-api + interactive_session` and `my-chat-workflow-worker + durable_run_actor` in the initial matrix. Browser/mobile, provider, arbitrary worker, Technical Operator, C-0 provisioning, Nurture self-call, and cross-origin substitution MUST fail before owner resolution; C-3-0b-3 later supplies exact special-path fixtures.
- Principal codec tests MUST require exact version/kind and exact My-Chat User, Actor, Workspace refs plus the two allowed origins. Missing/null/unknown/duplicate keys, wrong namespace/type, unsafe/control/oversized ids, PII, membership/role, Participant/Subject/Grant/policy/target/action, credential, or surface fields MUST be rejected.
- Host-construction tests MUST reread active User, human Actor ownership, exact Workspace/membership, capability, scenario registration, cohort/allowlist, and server route/surface before signing. Actor/account mismatch, non-human Actor, queue-authored actor/workspace, stale membership, invitation-only state, and personal/default workspace MUST mint no envelope.
- Participant-binding tests MUST use Workspace plus User only and require exactly one active result. Host Actor remains provenance; zero/duplicate/mismatched Participant cannot fall back to Actor, `business_actor_ref`, email/contact, another workspace, history, cache, invitation, or token. Activated C3 domain commands MUST use the resolved Participant as business actor. Migration tests in C-3-0d MUST prove that the polymorphic legacy `business_actor_ref` column is not silently reinterpreted and that any additive typed/versioned actor representation preserves historical family-core and institution evidence.
- Signature/body-binding tests MUST alter each of raw body, payload, contract hash, issuer/audience, caller, User/Actor/Workspace, endpoint, method, scenario, surface, operation, request id, times, and nonce independently and prove verification fails. Parsing/reserialization cannot replace exact raw-body verification.
- Freshness tests MUST cover the 60-second maximum, 30-second skew boundary, future issuance, expiry, delayed worker queue, and retry minting. An accepted invocation may finish after expiry, but an expired envelope cannot start or be refreshed without current Host reread.
- Replay-store tests MUST atomically accept one issuer/audience/caller-bound nonce hash across concurrent replicas and reject every duplicate before owner calls. Store outage fails closed; only hash/expiry persist; no raw nonce, signature, principal, or payload enters replay state.
- Retry separation tests MUST keep logical request and command identity stable while using a fresh nonce/signature. Mutation response loss MUST recover one CommandExecution; payload drift conflicts. Read retry MUST owner-reread current state and respect revoke/redaction rather than return a cached response.
- Workflow tests MUST cover same-Step reclaim with rotating claim/nonce evidence, exact CommandExecution replay, wrong-Step denial, expired lease/reclaim, and response loss. Claim token MUST remain separate from principal, request, nonce, command id, persistence, and logs.
- Caller-key tests MUST pin separate service and invocation key domains, exact ES256/header/type/`kid`, environment audience, trusted key source, and revoked set. `none`, alternate algorithm, wildcard/missing audience, `jku`/`x5u`/embedded key, unknown/critical header, try-all unknown key, cross-environment key, and owner-read token reuse MUST fail.
- Rotation tests MUST prepublish next key, wait for propagation, switch signer, accept previous/current during at least the 15-minute operational overlap, retire previous safely, and immediately deny an emergency-revoked key/caller. Old CommandExecution recovery through a fresh legal envelope MUST still work.
- Disposable C-3 evidence-authenticator tests MAY cover one separate high-entropy static caller credential mapped to an exact evidence environment/audience/subject, current/next rotation, and network source. No environment may enable both static and workload-token authenticators or fallback between them; `NURTURE_INTERNAL_SERVICE_TOKEN` remains legacy owner-read-only. Complete-Pilot conformance MUST reject every static bearer credential and require workload-bound mTLS plus the signed invocation envelope.
- Layer-order tests MUST prove body/network guard -> caller auth -> detached signature -> strict envelope codec -> cross-field/freshness/contract checks -> nonce -> operation codec -> verified context -> Participant -> owner. Every fault injection records the last reached seam and zero later calls.
- Codec-bound tests MUST enforce exact top-level/nested keys, normalized UTC time, 64-character lowercase contract hash, bounded body/depth/strings/arrays/refs, prototype-pollution rejection, closed surface/operation registration, and equality for repeated authority fields. Operation input remains untrusted until its own codec and owner policy pass.
- Construction tests MUST make `VerifiedScenarioInvocationV1` unavailable to general routes/handlers/fixtures except through the verifier factory. Domain services MUST be unit-testable without HTTP/JWS/credentials and MUST receive no raw transport object.
- Persistence/log tests MUST prove credentials, signature, nonce, raw envelope/principal/payload, key material, session/invitation/scenario/claim token, email/contact, and owner candidate details are absent from facts, CommandExecution, replay state beyond nonce hash/expiry, logs, traces, metrics, Handoff/Outbox, Notification, analytics, and errors. Safe provenance fields cannot affect policy.
- Additive conformance tests MUST keep legacy fixtures compiling while making a `trusted_scenario_invocation_v1` manifest fatal when Host capability, caller authenticator, signer/verifier, exact contract hash, nonce store, or vNext route is absent. Activated validation failure MUST NOT call optional `actor_id`, inferred/default workspace, broad `client_surface`, legacy handler, or alternate authenticator.
- Current-gap tests MUST detect that Base/My-Chat lack the new types/capability, current Nurture accepts optional identity metadata, current service auth covers one owner-read route, no shared nonce/key verifier exists, and `business_actor_ref` stores My-Chat/system refs in legacy family-core but Participant ids in institution commands. These gaps MUST remain blockers rather than expected Pilot behavior.
- Planning-boundary tests MUST prove C-3-0b-2 changes task documentation only. No contract package, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changes. C-3-0b-3 path variants and C-3-0b-4 client-echo/denial/audit/adoption evidence are specified in the following refinements.

Pilot-0-C3-0b-3 ingress-variant test refinement:

- Ingress-codec tests MUST accept exactly the versioned `product_surface|host_transition|workflow_runtime` categories and the Nurture registered keys. Unknown category/key, duplicate/extra key, device label, `web_run_workbench`, `technical_admin`, broad `client_surface`, legacy event kind, and category/key mismatch MUST fail before application dispatch.
- Registry tests MUST prove Base validates reusable structure/categories, the Nurture manifest registers exact keys plus allowed operations, and My-Chat maps server routes without client override. Missing registration, duplicate key, incompatible operation, or activated route/hash drift MUST be fatal rather than runtime fallback.
- Caller matrix tests MUST accept API/interactive only for product/transition and worker/durable only for `workflow_worker`. Every API/durable, worker/interactive, worker/product, worker/transition, API/runtime, browser/provider/operator/provisioner, cross-environment, and unregistered operation combination MUST perform zero Participant/business calls.
- Product-surface tests MUST cover the four registered C-3 keys `nurture_chat|family_board|family_workbench|teacher_board` and MUST prove `institution_board|institution_workbench` are absent from the C-3 manifest, route registry, presenter registry, and candidate. General Chat cannot produce `nurture_chat` without explicit business transition; Institution-only role through Chat, wrong role/surface, client surface injection, and product-key switching MUST remain unavailable after current owner resolution without granting a role.
- Convergence tests MUST prove entitled Chat/board/workbench variants invoke the same canonical owner presenter/command and preserve one business identity. Presentation differences MUST NOT duplicate effects, create parallel state machines, or permit cross-surface token/replay substitution.
- Notification tests MUST cover unauthenticated sign-in, wrong recipient/workspace/id, provider/deep-link tampering, Host read versus Nurture state separation, current Handoff reread, read-only `notification_open`, Nurture-selected destination, fresh destination-bound locator, fresh product invocation, repeat/multi-device open, session loss, stale/revoked/redacted/withdrawn target, and owner outage. No open may implicitly acknowledge/reply/submit.
- Durable tests MUST rebuild User/Actor/workspace from persisted Run evidence, reread membership/gates, use only `workflow_worker`, require an explicitly durable-enabled operation, and validate the separately claimed original Step. Same-Step response-loss replay with new claim/nonce/signature returns one Execution; wrong-Step/Run, queue-authored identity, UI-surface impersonation, and cross-ingress replay fail.
- Driver-leak tests MUST prove claim token remains signed transient operation input only and never enters Principal/request/nonce/command identity, facts, CommandExecution, Handoff/Outbox, logs, traces, metrics, or error bodies.
- Invitation-separation tests MUST prove preview/accept/membership commits in My-Chat with zero Nurture business effect, and only a separately confirmed `invitation_continuation` invokes the prospective application service. Ordinary zero-Participant product/notification/durable paths fail closed; only an exact current invitation-bound registered onboarding operation may atomically create/reuse Participant.
- Prospective tests MUST cover minimum pre-commit allowlist, wrong recipient/workspace/invitation/purpose, expiry/revoke/consume/drift, absent/current/duplicate Participant, transaction rollback, exact replay, changed payload conflict, Host-commit/Nurture-failure independence, no pre-commit Subject/history leakage, and a fresh ordinary invocation after commit. No generic find-or-create fallback may exist.
- Provisioning tests MUST require the separate spec/caller/audience/endpoint/verifier/gate, exact accepted initial Admin evidence, fixed canonical bootstrap payload, idempotent replay, one-time permanent closure, and no ordinary endpoint/principal/surface. Wrong/drifted/expired/reused/concurrent spec and Institution Admin/Technical Operator authoring or reopen MUST fail before writes.
- Operator tests MUST keep ordinary technical recovery in My-Chat and allow only the separate `request_owner_reevaluation` boundary to reach Nurture. Operator is audit-only, never Participant/business actor; arbitrary business payload/result selection, protected content, ordinary endpoint/principal/surface, direct facts edit, and owner-read token reuse MUST fail.
- Execution-status ingress tests MUST accept only the dedicated `my-chat-execution-recovery` caller, `my-chat.recovery` issuer, `nurture.execution-recovery.v1` audience, fixed endpoint, and `scenario_execution_status_lookup_v1` operation. Ordinary API/worker principals, Notification/owner-recovery/provisioning/activation credentials, changed frozen admission/request/command/Run/Step provenance, unknown/revoked key, nonce replay, or fallback MUST fail before Participant/application dispatch. This lookup may bypass an inactive row only for status classification and MUST perform zero Participant/policy/business-command/presenter/protected-read/candidate/delivery/open calls.
- Cross-path replay tests MUST hold original caller/origin/ingress/operation and declared surface/token/Step preconditions. Notification, invitation, durable, provisioning, and owner recovery cannot recover or upgrade one another's request or CommandExecution after any validation/policy/availability failure.
- Layering tests MUST enforce public route -> Host auth/controller -> ingress orchestration/signer -> private verifier/controller -> variant application service -> domain resolver/policy/command -> repository. Routes/controllers MUST contain no business query or role/scope decision; domain services MUST receive no HTTP/JWS/credential object.
- Compatibility/current-gap tests MUST preserve legacy fixtures while proving optional Host metadata, broad surfaces, current event kinds, static owner-read token, incomplete Notification/onboarding, absent special endpoints, and polymorphic `business_actor_ref` do not satisfy activation. C-3-0d remains responsible for typed persisted actor evidence.
- Planning-boundary tests MUST prove C-3-0b-3 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, runtime, secret, environment, capability, provider, database, or traffic change exists. C-3-0b-4 client echo, denial, audit, adoption, and negative closure evidence is specified in the following refinement.

Pilot-0-C3-0b-4 client, denial, audit, and adoption test refinement:

- Client-echo codec tests MUST accept each exact `chat_text|view_query|clarification_answer|action_prepare|action_submit` variant at its declared bounds and the optional normalized display hints. Unknown discriminants/fields, oversize text/pages/collections, invalid locale/timezone/cursor/token/confirmation/version, attachments, free-form nested objects, and variant-field mixing MUST fail before Host signing or owner calls.
- Authority-injection tests MUST reject client identity/workspace/Participant/role/Subject/scope/target-authority/Grant/policy/lifecycle, ingress/caller/origin, contract/signature/request evidence, Notification/Handoff/Invitation/Run/Step/driver/claim refs, command identity, and strong-auth claims. The same cases MUST remain untrusted after a valid signature; exact-body integrity cannot upgrade any echo field.
- Host-only substitution tests MUST prove canonical User/Actor/Workspace, current membership/gates, registered route/ingress, caller/origin, request evidence, durable refs, server-established request/driver inputs, and authentication-assurance evidence come only from the verified Host path. A client may echo `client_mutation_id`, but cannot choose `command_request_id`; confirmation alone never satisfies Host authentication assurance or Nurture business authorization.
- Owner-only resolution tests MUST prove Participant/RoleAssignment/role, Subject/Family/Process, Institution/CareGroup/Enrollment, Grant/direction/data class, target/policy/lifecycle/action availability, candidates, and relationship path are freshly Nurture-derived. Canonical business-effect identity/hash/replay MUST be validated under the registered operation/driver contract rather than inferred from client or Host authority. Host or historical audit injection, stale token context, and changed owner facts MUST fail closed or return the current typed owner result.
- Command-boundary tests MUST distinguish `client_mutation_id`, Host request/driver inputs, Host authentication-assurance evidence, Nurture canonical effect identity/hash/replay, and the owner strong-authorization decision. C-3-0b MUST NOT activate either direct-empty or claimed-Step command derivation before C-3-0d locks both exact rules and their cross-path negative fixtures.
- Public-mapping tests MUST cover HTTP 400/401/403/404/409/429/503 and HTTP 200 typed Nurture denial/clarification/target-changed outcomes. Guessed versus mismatched resources and known unavailable workspace/scenario cases MUST be existence-noninterfering; established-resource access loss alone may use 403. Same command identity plus changed payload MUST return `request_conflict` without a second effect.
- Disclosure tests MUST allow only the closed safe state/reason/rule/retry vocabulary and an opaque Host `support_ref`. They MUST reject stacks, verifier stages, internal error/reason codes, raw provider/database messages, signatures, key/caller detail, raw identifiers, request/correlation/trace ids used as support refs, owner candidates outside the safe schema, and protected body fragments.
- Audit-schema tests MUST prove Host and Nurture retain only their owned evidence. Nurture Host provenance is hashed and business actor is the applicable Participant; logs/traces/metrics expose only low-cardinality dimensions. Exact request/response bodies, family content, secrets, credentials, raw transport material, claim tokens, protected identifiers, and provider/database errors MUST be absent from every audit/telemetry sink.
- Retention tests MUST expire nonce hashes by five minutes, traces by seven days, logs by fourteen days, ordinary ingress security audit and deidentified aggregates by ninety days, and provisioning/operator/owner-recovery audit by 365 days. Early/late boundary tests, deletion retry, legal-hold separation, and proof that protected business content follows its independent P1/C-3-0e policy are required.
- Audit-access tests MUST enforce exact workspace scope, approved purpose, time-bounded grant, least privilege, and audit-of-audit. Cross-workspace, expired, unpurposed, broad export, protected-body access, and operator self-approval MUST fail. Provisioning/owner-recovery audit unavailability MUST stop the operation; read/denial asynchronous sink outage MUST alert and expose a bounded measurable gap.
- Transaction tests MUST keep the business mutation and CommandExecution in one Nurture transaction without a remote audit dependency. Response loss or asynchronous audit retry MUST not duplicate the business effect, and audit failure MUST not become authority to compensate or edit an already committed fact.
- Adoption tests MUST pin one exact Base revision/hash across Base, My-Chat, and Nurture; validate the same ingress/echo/operation registry; preserve legacy fixtures pre-activation; and reject missing capability, incompatible hash, unknown key, partial adoption, verifier mismatch, or alternate special-path wiring. Activated operations MUST have one vNext path and no fallback to optional actor/workspace, broad surfaces, static owner-read auth, legacy handlers, or another authenticator.
- Rollback tests MUST prove capability/allowlist disablement stops new vNext ingress without rewriting Nurture facts, deleting CommandExecution, changing owner lifecycle, or re-enabling legacy inference. Re-enable uses the same pinned contract and current owner reread.
- Current-gap tests MUST detect optional Nurture workspace, broad surface and free-form structured/form/display objects, legacy event kinds, My-Chat normal `client_surface`, optional workflow actor, free-form internal error details, absent `ScenarioClientEchoV1`/public mapper/support ref/audit retention/conformance, and missing special private endpoints. These remain implementation blockers rather than accepted Pilot behavior.
- Planning-boundary tests MUST prove C-3-0b-4 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, runtime, audit sink, secret, environment, capability, provider, database, or traffic change exists. C-3-0b is planning-complete; C-3-0c subject-aware presentation is next.

Pilot-0-C3-0c-0 presentation pipeline and ownership test refinement:

- Layering tests MUST enforce verified Host invocation -> Nurture subject/owner resolver -> Nurture semantic presenter -> My-Chat generic surface adapter/renderer. Base and My-Chat code MUST perform zero Nurture repository query, role/scope/policy inference, internal-code translation, or action-availability decision.
- Base-neutrality tests MUST reject every Nurture domain type/name/ref, scenario safe reason/action key, renderer, persistence rule, runtime dependency, and database concern from reusable provider/presentation foundations.
- Owner-semantic tests MUST prove Nurture alone derives current relationship, scope, target, lifecycle, Grant, policy, safe disclosure, semantic state, and action availability. Raw Host/client refs, renderer choice, prior presentation, another surface, and AI output cannot add, remove, or broaden any owner field/action.
- Surface-convergence tests MUST exercise the four C-3 Nurture surfaces—Chat, family board/workbench, and teacher board—against one owner presenter, while neutral Host fixtures exercise the reusable Institution-compatible renderer families without Nurture routes/presenters. Eligible subset/layout changes are allowed only when owner-declared; facts, safe reason, target state, token, action key, and lifecycle MUST remain one canonical owner result rather than per-surface state machines. Neutral fixture output MUST NOT count as C-4 product evidence.
- Chat-AI tests MUST constrain narration/tool context to current display-safe semantic output plus generic Host state. Hidden candidate/domain objects, protected content, internal reason/policy metadata, stale conversation summaries, and prior tool output MUST be absent. Prompt injection, natural-language role claims, and model-generated action proposals MUST NOT create a candidate, disclosure, confirmation, or action absent from the structured owner result.
- Renderer tests MUST prove generic components perform structural compatibility, accessibility, layout, navigation, and device adaptation only. Unknown/incompatible structures fail safely; renderers cannot query owner state, widen copy, translate internal codes, fabricate actions, or fall back to another surface/legacy presenter.
- Non-authority tests MUST rerun Host gates and Nurture relationship/policy/lifecycle checks at render, refresh, selection, navigation, prepare, submit, retry, result recovery, and Notification destination. A previous semantic or rendered response cannot satisfy any later authorization/command precondition.
- Persistence-negative tests MUST inspect Chat history, dashboard/cache/search/analytics, Notification, Handoff/Outbox, artifact drafts, logs, traces, metrics, and offline storage for rendered trees, candidates, raw Subject/domain ids, relationship paths, role/Grant/policy results, protected bodies, owner tokens, action availability, and inferred state. C-3-0c-3 permits only the exact content-free Host shell; every other unclassified field remains absent until C-3-0e explicitly permits a narrower protected/draft/offline channel.
- Outage/staleness tests MUST cover provider failure, owner database failure, stale/revoked opaque context, relationship loss, Grant/policy/lifecycle drift, renderer-version mismatch, and cross-surface reopening. All cases fail closed or return the current safe state without cached presentation, hidden detail, or more permissive renderer fallback.
- Current-gap tests MUST detect existing broad Workflow surfaces, synthetic presenters/artifact drafts, Nurture `institution-surfaces`, absent subject-provider/presentation types, absent renderer conformance, and absent persistence classification. Legacy scaffold output cannot satisfy activation.
- Planning-boundary tests MUST prove C-3-0c-0 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic change exists. The C-3-0c-1 section locks the subject-provider wire.

Pilot-0-C3-0c-1 subject-provider wire test design:

- Codec tests MUST cover exact `list_subject_contexts` and `resolve_subject_context` inputs, provider version, unknown/duplicate/null fields, nested-object smuggling, cursor/ref/version length bounds, malformed timestamps, page-size default 10, maximum 20, and rejection above 20.
- Type/conformance tests MUST prove `ScenarioSubjectContextRefV1` is opaque and structurally distinct from `DomainContextRef`; raw `namespace|object_type|object_id|canonical_ref` data cannot enter the new DTO. Base fixtures contain no Nurture object, role, reason, or action name.
- Result tests MUST cover one context -> `resolved`, multiple contexts -> bounded `needs_selection`, zero contexts -> `unavailable`, current established meaning drift -> `context_changed`, and collection reachability -> one `subject_collection` option with no member expansion or exact count.
- Resolution tests MUST cover same-ref retry, fresh ref issuance after successful resolve, refusal to extend the old ref, opaque `known_context_version`, stale version, expiry, revoke, redaction, lifecycle/policy drift, owner deletion, and provider/database outage. An opaque context version MUST NOT be accepted as a mutation expected version or correlated across options/refs.
- Isolation tests MUST cover cross-User, cross-Participant, cross-Workspace, cross-scenario, cross-provider, forged, guessed, truncated, reordered, and replayed-after-expiry refs. All existence-sensitive cases produce indistinguishable `unavailable`; internal owner/ref/decode detail never crosses.
- Privacy tests MUST allow only ref, generic scope/route class, owner-safe label/disambiguation slots, opaque version, and issue/expiry metadata. Tests MUST reject raw/canonical ids, profile/birth/stage/health/media/avatar data, Guardian/Caregiver lists, Enrollment/Grant/relationship path, role/policy/action availability, collection members/counts, protected bodies, and stable correlation keys.
- Selection tests MUST prove My-Chat cannot sort, rank, merge, filter, search, infer, or auto-select candidates from labels, counts, raw refs, surfaces, history, or cache. Same-name disambiguation is minimal owner-produced safe copy; My-Chat cannot assemble the copy.
- Authority tests MUST prove a valid ref grants no relationship, action, direct CommandExecution, replay, cross-surface, or offline authority. Every surface transition repeats Host gates and owner resolve; every action prepare/submit repeats owner resolution and requires the later C-3-0d action context.
- Freshness tests MUST prove a subject ref expires by 30 minutes, a cursor expires by 5 minutes, a page never exceeds 20 options, and provider/database outage uses generic HTTP `503` without cached-context fallback.
- Persistence-negative tests MUST inspect Chat history, board/workbench cache, search, analytics, Notification, Handoff/Outbox, logs, traces, metrics, and offline storage. C-3-0c-3 classifies list results, candidates, raw refs, safe labels, owner context, and inferred cross-ref correlation as ephemeral or forbidden Host copies; none may persist.
- Planning-boundary tests MUST prove C-3-0c-1 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic change exists. The C-3-0c-2 section locks semantic presentation.

Pilot-0-C3-0c-2 semantic-presentation test design:

- Operation/codec tests MUST cover `present_subject_context`, version/key/ref/query exactness, manifest-registered presentation keys, `current|recent|history`, opaque `presentation_item_ref`, cursor/page bounds, unknown/duplicate/null fields, nested-object smuggling, and forbidden surface/role/raw-target/action/command/submit fields.
- Result tests MUST cover `ready|empty|context_changed|unavailable` and reject `partial|not_modified|error|needs_selection` aliases. Command outcome/replay/result fields cannot enter the presentation result. Provider/database outage remains HTTP `503` and cannot yield a cached/partial owner presentation.
- Safe-copy tests MUST cover normalized BCP-47 locale, plain-text bounds, Unicode/control handling, every B3 registered safe reason, owner-produced message/help, generic retry class, and My-Chat verbatim rendering. Markdown, HTML, URLs, unresolved localization params, unregistered/internal codes, stacks, policy/provider/database text, and Host translation dictionaries MUST fail.
- Reason-refinement tests MUST prove `not_implemented` is absent from Pilot user output; provider/database outage cannot use HTTP-200 `owner_unavailable`; an available offer carries no user-facing unavailable reason; and My-Chat cannot map `reason_code` or `action_key` into broader copy.
- Block-union tests MUST cover the exact fields of `summary|notice|fact_group|metric_group|item_collection|timeline`, response-local block/fact/metric/item/entry keys, all generic tones, `allowed|display_only` narration, bounded rows/entries, safe badges/timestamps, collection/timeline cursors, and opaque item refs. Recursive blocks, arbitrary records/extensions, raw/canonical ids, command/audit refs, forms/drafts, protected bodies, attachments/media bytes, and renderer primitives MUST fail.
- Item-ref tests MUST cover current detail read, principal/Workspace/scenario/subject/presentation/item/version binding, five-minute expiry, wrong-key substitution, cross-ref comparison, current revoke/redaction/policy drift, and strict non-equivalence to action target/submit/offline authority.
- Anti-Metrics tests MUST reject rank, score, cross-scope comparison, competitive trend, caregiver/child/institution performance fields, and renderer inference. Entitled aggregate counts may appear only as current owner-produced metric values.
- Navigation tests MUST cover registered route class, optional view mode/continuation ref, explicit priority/narration, read-only open, current owner reread, stale ref, wrong principal/workspace/scenario/surface, and absence of URL/raw target/action/confirmation/CommandExecution or implicit durable effect.
- Available-action tests MUST require an active registered domain-action contract, real handler, exact action key, safe label/help, bound opaque target ref, optional opaque version, exact confirmation class, explicit priority/tone/narration, and five-minute expiry. Prepare and submit MUST still rerun owner authorization.
- Unavailable-action tests MUST cover safe disclosure versus omission. Entitled known actions may return an owner reason with no target/version; actor/target/existence-sensitive actions MUST be absent. My-Chat cannot infer hidden actions or convert omission into a disabled control.
- Action-negative tests MUST reject Run-level `WorkflowActionAvailability` reuse, raw `target_type|target_id`, `command_key`, `handler_key`, `serverAction`, client params, arbitrary extensions, submit/claim token, CommandExecution identity/result, and action-key-derived priority/tone/confirmation.
- Bounds tests MUST enforce 64 KiB UTF-8 total, 20 blocks, 20 fact/metric/item/timeline entries per block/page, 8 navigation offers, 8 actions, label 80, title 120, summary/body 500, help 240, and five-minute cursor/item/continuation/action-target expiry at codec and owner-result construction.
- AI-projection tests MUST include only `narration=allowed` safe text and strip every ref, version, reason/action code, cursor, target, hidden action, and display-only field. Prompt injection and model output cannot create new facts, blocks, reasons, actions, confirmation, or submit behavior.
- Current-gap tests MUST detect Base Run-level/raw-target action availability, My-Chat broad `params|extensions|serverAction` interaction fields, Nurture id-shaped pseudo-opaque refs/ad-hoc safe strings, and absent shared semantic-presentation codecs. Existing scaffold cannot satisfy activation.
- Planning-boundary tests MUST prove C-3-0c-2 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic change exists.

Pilot-0-C3-0c-3 renderer/persistence test design:

- Surface-registry tests MUST cover the four registered C-3 product surfaces and their Chat semantic panel, role-board, or domain-workbench family. Guardian/Caregiver Chat role resolution remains owner-side and Teacher board has complete owner-paginated history. Separate neutral Host fixtures MUST cover all three generic renderer families, including read-only role-board action rejection; those fixtures MUST NOT register Nurture Institution keys/routes/presenters or count as C-4 evidence.
- Renderer-structure tests MUST cover all six block kinds across every compatible family, preserve block/row/entry/order/copy/locale/tone/badge/timestamp/offer priority, and permit layout reflow only. Sort, merge, omission, relabel, translation, summarization, semantic inference, synthetic actions, and timestamp-lifecycle inference MUST fail.
- Compatibility tests MUST reject unknown schema/version/block/field, over-bound output, missing renderer capability, and wrong-surface actions as a whole-presentation failure. Partial rendering, silently dropping an offer, switching to another surface profile, and fallback to broad mobile `InteractionEnvelope`, Workflow dashboard, or legacy Nurture surfaces MUST fail.
- History/query tests MUST prove `current|recent|history`, owner cursor/page, item detail, and owner-issued navigation can reach every current authorized row without copying history. Arbitrary text search, renderer-owned sort, compound business filters, local filtering, and encoding filters through route/presentation/continuation/analytics MUST be absent from Pilot-0. A future filter/search path requires a separate owner query-control contract.
- Persistence-class tests MUST classify every field as `owner_canonical`, `ephemeral_presentation`, `durable_host_shell`, or `forbidden_host_copy`. Unknown/unclassified fields MUST fail conformance and activation rather than inherit a permissive default.
- Owner-canonical tests MUST prove Nurture business facts/lifecycle/CommandExecution/history remain owner-durable and are never reconstructed from Host shell, Chat, renderer, cache, Notification, Handoff/Outbox, analytics, or AI output.
- Ephemeral tests MUST inspect process/foreground memory lifecycle for every subject/presentation result, safe text/reason, block/offer, ref/version/cursor, AI projection, selection/scroll/expanded state, and render tree. Every value MUST disappear on background/lock, sign-out, Workspace/account/thread/surface/process/renderer change and MUST be absent from all durable Host destinations.
- Durable-shell tests MUST allow only Host conversation/turn/page, canonical Workspace, scenario, registered product surface/presentation key/route/view mode, renderer-contract version, Host timestamps, and generic rehydration state. Raw owner facts/content/target/policy/authority and unregistered metadata MUST fail. Reopening a semantic Chat turn MUST owner-reread and never replay old copy/narration.
- Forbidden-copy/leakage tests MUST scan Chat history, board/workbench cache, search, analytics, Notification, Handoff/Outbox, logs, traces, metrics, crash evidence, URLs/navigation history, client persistence, and offline storage for protected body/media/draft, raw id, relationship/role/Grant/policy result, tokens/credentials, action target/version, cursor, candidates, presentation copy, and inferred state.
- Ref-storage tests MUST prove the subject ref can exist only in protected server transient state until its 30-minute TTL and five-minute item/cursor/continuation/action refs only in response/foreground memory. Expiry, background, process loss, and cross-surface navigation cannot recover or extend the values.
- Freshness tests MUST cover the exact 60-second foreground lease, shorter-ref expiry, boundary timing, known invalidation before lease end, immediate content/control clearing, foreground resume/focus, refresh, navigation, pagination, detail, action prepare/result, retry, and Notification destination. Every seam repeats Host gates and owner read.
- Stale/failure tests MUST cover revoke, redaction, policy/lifecycle drift, provider/owner/database outage, renderer drift, app background, process loss, and network retry. No stale-while-revalidate, content-behind-spinner, cached/legacy/more-permissive/offline fallback, or optimistic Nurture lifecycle/count/badge/action/reason mutation is allowed.
- Accessibility tests MUST cover owner locale and text direction, semantic reading/order/roles, label-value announcements, non-color/icon-only meaning, accessible names/roles/states, focus/keyboard order, touch targets, font scaling, reduced motion, screen reader behavior, and generic polite transition announcements. `critical` cannot infer assertive/emergency semantics; omitted/display-only data cannot enter assistive output.
- Observability tests MUST allow only body-free low-cardinality surface/schema/version/outcome/refresh/latency/count dimensions and reject safe copy, high-cardinality presentation keys, block/item keys, refs/versions/cursors, role/Grant/policy, target existence, or presentation content.
- Current-gap tests MUST detect broad Chat envelope fields, durable semantic Chat-message ambiguity, raw Workflow dashboard action/target/reason branching, absent role boards/workbenches, partial accessibility, absent renderer registry/freshness/invalidation/persistence allowlist/leakage scanner, and absent activated Nurture semantic presenter.
- Planning-boundary tests MUST prove C-3-0c-3 changes task/governance documentation only. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic change exists. The following C-3-0c-4 test design now locks conformance/adoption evidence.

Pilot-0-C3-0c-4 conformance and adoption test design:

- Capability tests MUST prove `scenario_subject_presentation_v1` is one atomic Host gate covering provider, presentation, renderer compatibility, freshness, and persistence protection; it requires `trusted_scenario_invocation_v1`. Provider-only, presenter-only, renderer-only, persistence-guard-only, or trusted-ingress-missing combinations MUST fail. Before C-3-0d adoption, any non-empty action-offer output MUST fail activation/runtime conformance.
- Additive-manifest tests MUST preserve legacy manifests with no behavior change and exercise a complete vNext provider/presentation declaration. Any missing, duplicate, unknown, malformed, or cross-referenced provider, operation, presentation, surface, view mode, route class, safe reason, action key, per-surface action policy, Host support, or capability MUST fail. Any C-3 declaration of `institution_board|institution_workbench`, any action on the neutral read-only role-board fixture, and one operation registered in both legacy and vNext paths MUST fail.
- Source-identity tests MUST keep the current handoff hashes historical and introduce a separately named `scenario_interface_source_v1`. Base and My-Chat MUST produce the same normalized hash over the declared C-3 contract/codec/manifest/validator source set. Nurture MUST pin the exact Base and My-Chat revisions/hash. Tests MUST reject stale, mixed, omitted, renamed, path-dependent, alias-dependent, or partially copied source sets.
- Scenario-identity tests MUST hash the Nurture canonical manifest plus real provider/presenter/operation registry and reject declaration-without-implementation, implementation-without-declaration, changed key, alternate handler, or pre-activation-only implementation. Host-identity tests MUST record a distinct My-Chat renderer conformance revision and reject any attempt to substitute the shared source hash or Scenario module hash for renderer evidence.
- Adoption-order tests MUST prove Base publishes first, My-Chat explicitly adopts the exact revision, Nurture adopts the exact My-Chat dependency, and joint conformance runs before any allowlist. A local pnpm `file:` link without exact checkout/materialization evidence MUST fail. Capability and workspace allowlist MUST remain absent/false after C-3-0c planning and throughout partial adoption.
- Projection tests MUST compare one canonical Nurture manifest with a mechanically derived disabled-capability projection. Only expected gated declarations may disappear. Hand-edited second manifests, changed retained fields/order semantics/handler bindings, alternate provider/presenter registries, or an accidental legacy activation path MUST fail.
- Base conformance MUST include legacy/vNext compilation, strict input/result codecs, every C-3-0c bound and unknown-field negative, validator fatal matrix, normalized source-hash portability, and a neutrality scan excluding Nurture names, runtime, UI, persistence, schema, and database logic.
- My-Chat conformance MUST include four registered C-3 product surfaces by six semantic block kinds plus neutral fixtures for all three renderer families, complete compatible renderer coverage, read-only role-board action rejection, explicit absence of both C-4 Institution keys, owner order/copy/tone preservation, freshness and invalidation clearing, accessibility/device/locale/focus coverage, all Host persistence destinations, content-free Chat rehydration, capability-off, legacy unchanged, and no partial/alternate fallback. Neutral fixture results MUST NOT be reported as Nurture C-4 evidence.
- Nurture conformance MUST include every list/resolve/present result, wrong principal/Workspace/scenario/provider/ref/version, expiry/revoke/redaction/policy/lifecycle/outage, exact privacy allowlist, collection non-expansion, safe copy/reasons, route/action disclosure, AI projection, real manifest-registry backing, and zero raw id/protected body/Host persistence.
- Joint conformance MUST cover exact revisions and all three named identity classes, mixed-revision and registry/renderer drift, public -> signed private -> current provider -> semantic presenter -> generic renderer, renderer incompatibility, 60-second stale boundary, ref expiry, revoke/redaction, owner/provider outage, cross-surface reread, zero cache/legacy/offline fallback, and capability/allowlist rollback without fact rewrite.
- Planning-exit tests MUST report C-3-0c as design/evidence-specification complete but implementation/adoption/enablement incomplete. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed. The now-locked C-3-0d defines action execution and C-3-0e defines complete-IIB adoption evidence; actual implementation remains open.

Pilot-0-C3-0d action execution and recovery test design:

- Contract/capability tests MUST require one `ScenarioDomainActionContractV1` entry per active `(scenario_key, action_key)` with exact input schema, target-ref class, confirmation, surface set, handler, command contract, and `nurture_direct_empty_v1|workflow_claimed_step_v1` driver. `scenario_domain_action_execution_v1` MUST require both trusted ingress and subject presentation. Missing/duplicate/unknown keys, handlers, commands, schemas, surfaces, drivers, dependencies, or partial prepare/submit/direct/claimed enablement MUST fail without legacy fallback.
- Prepare tests MUST re-resolve current Host principal and Nurture Participant/role/subject/target/policy/version, issue only a five-minute submit context, and create zero Execution/business/Step/Handoff/Outbox/Notification/provider effects. Extra client authority fields, body outside the registered schema, raw ids, driver/command/Step claims, expired target refs, and cross-surface/workspace/principal replay MUST fail before context issue. Protected draft/body persistence assertions remain C-3-0e.
- Submit-codec tests MUST allow only submit token, exact confirmation, and bounded `client_mutation_id`. They MUST reject repeated action/target/version/input, client command identity, Participant/role/scope/policy, driver, Step, Handoff draft, snapshot, claim, authentication-assurance, or arbitrary metadata. Strong actions MUST require current Host assurance plus owner context and explicit confirmation, and tests MUST prove Host assurance alone grants no Nurture authority.
- Static-driver tests MUST prove one action uses the same driver on every entitled surface and for zero/one/many recipients, applied/already-satisfied, executed/replayed, and provider healthy/down states. Any runtime switch from claimed to direct or direct to claimed MUST fail. Direct actions MUST persist `[]`/null driver and create no Run/Step/Handoff/Outbox/Notification. Non-empty-capable actions MUST remain claimed even when their current snapshots are `[]`.
- Claimed-binding tests MUST persist one content-free original Step in a non-claimable `awaiting_scenario_binding` state before Nurture binding, bind one active context immutably to the exact Step, and only then make that Step claimable. Exact rebind MUST be idempotent; another Step, changed action/actor/workspace/context, unpublished or nonexistent Step, and claim-before-bind MUST fail. Binding MUST consume no context, commit no business fact, create no snapshot, and extend no TTL.
- Step privacy tests MUST permit only Host identity/provenance, scenario/action/handler/contract, technical status/version, and safe request correlation. Raw submit token, target/version, Nurture input/body/context id, claim token, authentication credential, draft/snapshot, business ref, and inferred state MUST be absent from Step storage, queue payload, Handoff, Outbox, logs, traces, metrics, crash evidence, and Admin views.
- Crash-window tests MUST cover Step persisted before bind, bind response lost, bound before claim publication, claim/lease loss, Nurture commit before worker response, `complete_step` commit before response, Handoff/Outbox/provider failure, and cleanup after context expiry. Unbound Steps remain non-claimable and stop safely; bound Steps recover from exact Step binding without a raw token; post-commit same-Step recovery completes once without compensation or a substitute Step.
- Expiry tests MUST prove binding does not extend the five-minute context. First business attempt after expiry commits nothing and requires a new context and Step. A commit before expiry remains exactly replayable after expiry because Execution lookup precedes context rejection. Retryable precommit failures may retry only inside the original window; deterministic denials revoke/invalidate current preparation and create no Execution.
- Identity tests MUST reproduce the direct and claimed canonical derivations, prove only Nurture constructs them, and reject inclusion or substitution of surface, client mutation, nonce, trace/correlation, claim token, expected Step version, lease, attempt, or presenter state. Payload-hash tests MUST cover command version, typed Participant, owner scope/target/version, canonical input, context, driver, and original Step and reject any changed immutable input/caller/Step.
- Typed-actor migration tests MUST add versioned `nurture_participant` evidence plus a Restrict Participant FK for activated C3 rows, preserve existing polymorphic `business_actor_ref` bytes/meaning, and reject global reinterpretation, backfill inference, Host Actor substitution, null/duplicate Participant, service/operator/provisioning impersonation, cross-workspace Participant, and actor deletion that violates retained audit. Host provenance MUST remain separately named and non-authoritative.
- Transaction tests MUST fault every direct and claimed boundary and prove context consumption, business facts, Execution, audit/output refs, and snapshots commit together or not at all. Claimed tests additionally require current original-Step claim before the first business write. A standalone context-consume commit, remote call inside the transaction, business fact without Execution, Execution without effect, consumed context without Execution, or snapshot invented after commit MUST fail; consumed-without-Execution is an integrity incident.
- Driver-matrix tests MUST require claimed-Step for `submit_family_care_question`, `reply_family_care_item`, `propose_enrollment_transfer`, `withdraw_family_enrollment`, and `close_enrollment`. The last three MUST remain unavailable until `guardian_relationship_attention` is actually adopted. Direct-empty tests cover acknowledge/redaction, confirmation, pause/resume, transfer cancel/decline/confirm, Guardian self-exit, stage, Grant, and ordinary Institution topology/staff/policy actions. Tests MUST reject Pilot `cancel_family_care_route`, reply-as-direct, self-exit attention/claimed substitution, `initiate_enrollment` activation before C-1/C-4 jointly classify business commit plus Host Invitation delivery/recovery, invitation/Handoff substitution, C-0/operator/portability registration, and any third generic driver.
- Replay-seed tests MUST return byte-equivalent snapshots only for the original Step exact replay. A different newly authorized Step that resolves `already_satisfied` MUST store `[]` and MUST NOT copy, obtain, replay, rematerialize, or resend the original seed. Zero recipients MUST store `[]`; recipient/source/expiry mutation under the original Step MUST conflict. Same-Step reclaim may rotate only transient claim/version evidence.
- Result tests MUST keep persisted `applied|already_satisfied`, response-only `executed|replayed`, and current presenter `changed|already_current|processed_but_unavailable` distinct. Direct submit returns completed only after commit. Claimed submit consistently returns Host accepted/processing after binding/scheduling and later current completion; latency cannot change its public mode. A replay cannot describe the retrying actor as original performer, approver, owner, or joint consenter.
- Recovery tests MUST cover direct response loss via token/context Execution lookup, lost direct identity falling back only to current presentation, claimed response loss via original Step, wrong-Step denial, changed-payload conflict, presenter owner loss, and outcome-unknown reconciliation. Presenter/worker/Handoff/Outbox/Notification/provider failure MUST preserve the committed fact and MUST NOT create compensation, probe Execution, replacement seed, stale body, or alternate handler.
- Adoption tests MUST introduce a separately named `scenario_domain_action_source_v1`, keep it distinct from `scenario_interface_source_v1` and historical workflow hashes, and require exact Base -> My-Chat -> Nurture revisions plus joint registry/driver/handler/capability parity. Base neutrality, My-Chat dispatch/binding/privacy, Nurture owner/identity/transaction/snapshot, mixed-version denial, canonical/projection equivalence, capability-off, empty allowlist, rollback, and no legacy fallback MUST all pass before activation.
- Planning-exit tests MUST report C-3-0d as design/evidence-specification complete but implementation/adoption/enablement incomplete. No contract package, source hash, manifest declaration, handler, typed actor field/FK, InteractionContext binding, Step state, schema, migration, route, runtime, capability, database, secret, provider, environment, allowlist, or traffic changed. C-3-0e below closes protected interaction and complete-adoption planning without claiming implementation.

Pilot-0-C3-0e protected-interaction test design:

- Capability tests MUST prove `scenario_protected_interaction_v1` atomically requires trusted ingress, presentation, and action execution. Write-only/read-only/erase-only/single-surface/privacy-guard-only combinations, missing KMS/cleanup/restore fence, `plain_text_dev`, copying a composer-accepted body into ordinary Chat/`PublicDraft`, synthetic refs, partial adoption, legacy fallback, or a non-empty Workspace allowlist by default MUST fail.
- Codec tests MUST accept only normalized trimmed 1–2000-character plain text and `attachment_refs=[]`, bind keyed integrity to the exact accepted bytes, and reject unknown fields, rich text/HTML/media/batch, prohibited control input, bare body hashes, and health/medication/emergency/diagnostic/prescriptive content.
- Storage tests MUST prove one `NurtureProtectedContent` object moves `prepared -> committed -> erased`, uses per-content AES-256-GCM plus KMS-wrapped DEK, has exact typed owner/context/unique Message binding, and never persists plaintext. Activated Message body stays null. Item detail/summary, Receipt, Attention, InteractionContext, Execution/output/snapshot, Handoff, Outbox, Notification, audit, and every Host table remain body-free.
- Atomic/fault tests MUST cover prepare/context commit, prepare response loss/duplicate orphan cleanup, edit/new-context invalidation, direct and claimed command rollback, one-content/one-Message uniqueness, same-Step replay, deterministic denial, response unknown, redaction concurrent with read, expiry, retention, and KMS/provider outage. A rolled-back business command cannot mark content committed; a committed effect remains recoverable without resending its body.
- Owner-read tests MUST cover `ready|tombstone|context_changed|unavailable`, forged/expired/cross-principal/workspace/surface/subject refs, changed Participant/role/Enrollment/CareGroup/Grant/source/lifecycle/policy, author versus other-role history, redaction, retention expiry, and owner outage. Ready responses MUST be no-store and clear within 60 seconds or on invalidation/background/lock/logout/context change; no stale/cache/offline body is returned.
- Draft tests MUST prove the protected composer starts empty, shows the pre-entry private-detail warning, and that only its current-surface process memory may contain the protected body. No automatic copy, summary, reconstruction, or one-click promotion from ordinary Chat is allowed. Scans MUST prove the composer body is absent from Chat messages, `ContentRevision`, `PublicDraft`, artifacts, local/session storage, IndexedDB, Service Worker, URL/history, browser cache, clipboard automation, crash state, notification, search, analytics, logs, traces, metrics, APM, dead letter, and Admin/support output. A separate mistaken-input test MUST show that private text manually authored in ordinary Chat follows My-Chat transcript/provider/deletion policy, receives no false zero-retention claim, and never enters Nurture body preparation. `stay|discard_and_navigate`, foreground clearing, direct-completed clearing, claimed-accepted clearing, deterministic-denial editing, and response-unknown result recovery MUST preserve the exact boundary.
- AI tests MUST prove `scenario_protected_ai_draft_v1` is absent/off for Pilot-0 and that display-safe narration receives no protected body. Future-capability fixtures MUST require explicit assist, approved zero-retention/no-training provider, minimum prompt, no Chat history/memory/RAG/search/cache/evaluation persistence, content-free telemetry, current authorization before call/submit, adult confirmation, and manual fallback without a business effect.
- Retention/restore tests MUST expire prepare authority at five minutes, remove its wrapped key by 15 minutes, crypto-erase committed bodies at 30 days or earlier redaction/source deletion, retain only body-free Pilot evidence for 365 days, keep AI prompt/output at zero durable retention, cap encrypted backups at 30 days, and replay the erasure ledger before restored reads. Grant revoke MUST stop newly unauthorized access without silently changing author-retention semantics.
- Adoption tests MUST distinguish historical workflow hashes, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, `scenario_protected_interaction_source_v1`, Nurture module/storage-crypto revision, My-Chat renderer/protected-runtime revision, retention-policy revision, exact commits, KMS class, and Workspace allowlist. Mixed identity, mutable `file:` dependency, generic `contract_hash`, manifest/runtime drift, scaffold substitution, or rollback to legacy behavior MUST fail.
- Planning-exit tests MUST report C-3-0 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No contract package, source hash, manifest, source, schema, migration, KMS key, route, UI, renderer, runtime, cache, capability, provider, database, environment, allowlist, or traffic changed. Actual adoption is delivered through C-3-1..5; C-3-1 Guardian family communication is next.

Pilot-0-C3-1 Guardian family-communication test design:

- Entry-integrity tests MUST compose one non-persisted Guardian entry from exactly one source Message/Receipt, one Item, the required ordered Events/Attention, zero-or-one reply Message/Receipt, and one original Grant. Missing/duplicate/cross-Thread/cross-Grant/cross-workspace relations, more than one reply, broken Receipt direction, or status/event contradiction MUST return generic unavailable plus body-free integrity evidence and MUST NOT render a partial entry or mutate on read.
- Orthogonal-state tests MUST cover every legal `progress`, `entry_lifecycle`, question visibility, and reply visibility combination. Source redaction/revoke after acknowledge/reply MUST preserve the highest complete progress; reply redaction MUST leave terminal replied progress and resolved Attention; `Item.status=suppressed` MUST NOT be treated as a fourth product progress or erase history.
- Query tests MUST prove current and recent are mutually exclusive, current contains only current-episode sent/acknowledged work, recent contains terminal/suppressed rows from the prior 30 days, and workbench history reaches every currently authorized shell within the fixed 365-day source-entry window while separating Institution/Enrollment episodes. Chat MUST cap at five with no cursor; board/workbench pages MUST cap at 20; keyset cursor/ref MUST bind principal/Workspace/subject/presentation/view/version and expire within five minutes. Offset, arbitrary search/sort/filter, raw ids, local filtering, and cross-surface cursor replay MUST fail.
- Body-free presentation tests MUST inspect every list/detail/Chat narration/Host shell for body, body-derived title/summary, protected ref, raw author/business id, original Grant, internal Item/Receipt tuple/reason, action authority, and hidden filters. Question and reply MUST use independent protected reads and cover available/tombstone/unavailable combinations, including different 30-day expiries based on each Message's own creation time.
- Surface tests MUST prove one Nurture presenter/action/protected-read path across Guardian Chat, Family board, and Family workbench. Chat may explain and show at most five body-free current/recent entries, board owns current/recent and detail, and workbench owns complete owner-paginated history. Layout changes MUST NOT alter facts, availability, command, visibility, copy meaning, or policy. Complete history in Chat/board and body persistence in any surface MUST fail.
- Composer tests MUST open an empty process-local protected editor and MUST reject automatic/one-click movement of ordinary Chat text. For text accepted by that composer, Chat/`ContentRevision`, legacy `editable_preview`, `InteractionEnvelope`, `PublicDraft`, artifact drafts, semantic blocks, local/session storage, IndexedDB, Service Worker, URL/history, logs/APM/cache/crash/Notification MUST contain no copy. Separately assert that an ordinary user-authored Chat turn remains governed by My-Chat retention and is never treated as a Nurture draft/body or silently transferred. `scenario_protected_ai_draft_v1` MUST remain absent/off and AI MUST receive no question/reply composer body.
- Prepare/profile tests MUST accept only normalized 1–2000-character plain text through the no-capture route and owner-derive the fixed question profile plus generic body-free summary. Client Participant/role/Family/Child/Enrollment/Group/Thread/Grant, data class/category/urgency/route/summary/source/attachment, synthetic ref, or wider legacy profile MUST fail before a business write. Prepare creates only one five-minute encrypted object/context and returns no body.
- Claimed-submit tests MUST prove explicit confirmation, content-free Step creation, immutable binding before claimability, stable accepted/processing, draft clearing only after accepted, atomic protected-content/source graph/Execution/snapshot commit, and owner-reread-only `sent`. Prepare loss, bind loss, worker loss, complete-step loss, context expiry, same-Step reclaim, wrong/new-Step denial, and response recovery MUST create at most one effect and never resend or persist the body.
- Dual-Guardian tests MUST prove both current same-family Guardians independently submit/read canonical entries, neither shares drafts or edits/redacts the other's Message, and Grant ownership does not create primary question authority. A second Guardian joining cannot reconstruct a draft or become historical author; role/family exit removes body access; a later independently authorized new role may restore current family-side retained access and the exact Participant's author-redaction right but never old Role/Grant/cross-role receiver authority; cross-family/child/workspace actors receive no existence signal.
- Original-Grant tests MUST bind every entry to one original Grant and reject `findFirst`/current replacement selection at read, prepare, bind, execute, history, caregiver action, retry, and reopen. Revoke/expiry/replacement/terminal owner role/Enrollment transfer blocks cross-role work. Both current same-family Guardians may still read the eligible family source, while caregiver-reply receiver access tombstones. A new Grant/Enrollment/Thread/role MUST NOT revive or adopt the old entry.
- Redaction tests MUST require exact source sender Participant, current Guardian reach to the same Family/ChildCareProcess, expected Message version, explicit confirmation, and direct-empty execution without requiring the historical sender RoleAssignment/original Grant/Enrollment to remain active. Source redaction MUST crypto-erase, terminalize source Receipt, suppress Item/active Attention, block later caregiver action, preserve progress, and retain an independently authorized reply. Caregiver reply redaction is observation-only in C-3-1 and MUST NOT reopen/suppress the source Item.
- Race/fault tests MUST cover redaction versus acknowledge/reply, redaction versus revoke, retention erasure versus redaction, role/Grant/Enrollment/policy changes at every read/prepare/bind/execute/reopen seam, KMS/owner/provider outage, stale refs/versions, Serializable retries, and final closure assertions. Redaction first blocks the later action; business action first preserves progress before redaction. Partial `take:100` cascade, read-time repair, cached fallback, duplicate Execution, or partial graph commit MUST fail.
- Retention tests MUST expire each body 30 days from its own Message creation and remove the Guardian product entry exactly 365 days from source creation regardless of later reply/event. A later reply may outlive a question body but cannot extend product history. Temporary hold/suspension/outage MUST create no permanent suppression; it fences only the affected dependent cross-role path, while family-owned Stage, safe episode shells, and otherwise authorized family-side facts remain independently visible.
- Adoption tests MUST prove `C31-I0` consumes the completed `C30-I4` baseline; C31 adds only Guardian-specific fixtures/composition/owner behavior and does not recreate shared sources, generic Host runtime, typed actor/KMS baseline, or a second registry. They MUST also prove canonical manifest generation, bidirectional manifest/registry/handler parity, exact consumed source/runtime/storage identities, ordered C31 nodes, isolated harness-only capability composition, empty persistent allowlist, and no fallback. Historical `capture_family_input`, broad Run requirements, manual preactivation filters, `internal_api`, synthetic refs, hard ThreadParticipant authorization, and mutable `file:|link:` dependencies MUST NOT satisfy or alias C-3-1.
- Planning-exit tests MUST report C-3-1 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No contract package, source, manifest/generated artifact, handler, schema, migration, KMS key, route, UI, renderer, runtime, cache, capability, allowlist, database, provider, environment, or traffic changed. The following C-3-2 test design closes Guardian relationship/authority planning; C-3-5 owns default-off activation-control qualification and Pilot-2 alone owns non-empty activation.

Pilot-0-C3-2 Guardian relationship/authority test design:

- Composition tests MUST build `guardian_relationship_authority_v1` from one Nurture owner query boundary over independent RoleAssignment, Enrollment/Hold/TransferIntent, Grant, and StageEpisode roots. A subject-wide current Enrollment/Grant, persisted relationship summary, Host merge, multi-presenter client join, wire `partial`, duplicated lifecycle, or action target issued before fresh exact-root detail MUST fail.
- Surface/query tests MUST prove identical owner semantics and action contracts across Guardian Chat, Family board, and Family workbench. Chat caps current/action-needed output at five; board owns current/recent; workbench owner-paginates every retained authorized relationship/Enrollment/Grant/Stage fact by episode. History MUST NOT inherit C-3-1's 365-day communication cutoff. Cross-surface navigation carries only route/view intent and MUST reject item/action/context/output refs.
- Multi-Institution tests MUST cover zero/one/several current Enrollments for one Process, exact episode action targets, independent holds/transfers/Grants/policy, unavailable entitled segment degradation, non-entitled episode omission, count/timing/error/token noninterference, and no Stage disclosure to Institution/Caregiver. One episode lifecycle or version MUST NOT mutate, authorize, or hide another.
- Invitation tests MUST cover exact `establish_first_guardian_relationship`, Co-Guardian issue/accept/cancel, and Enrollment-invitation decline operations in the dedicated Host shell/prospective lane. Tests MUST cover raw-contact ownership/leakage, non-deliverable shell -> Nurture commit -> activation, every response-loss seam, exact recipient/inviter, expiry/cancel/accept races, zero-Participant prospective exception, Participant reuse, role uniqueness, provider-state non-authority, and denial of domain-action/Handoff/C-0/operator/generic-Participant fallback. They MUST also prove `workspace-local relationship committed -> still-pending Enrollment invitation declined -> platform/binding/association/Child/Process/Family/Participant/Guardian facts retained -> no Roster link/Enrollment/Grant/Thread`, including decline-versus-Enrollment-consume first-commit-wins.
- Self-exit tests MUST exercise `exit_guardian_relationship -> nurture.family_care.exit_guardian_relationship` from all three Guardian surfaces with strong/direct-empty behavior, exact role/version, last-Guardian denial, two simultaneous exits, exit versus Co-Guardian accept/cancel and Grant/action, complete actor-issued-intent/actor-owned-Grant/dependent rollback, other-owner Grant preservation, explicit `[]`, and zero peer/Institution/Operator removal or relationship attention.
- Enrollment tests MUST cover exact-recipient initial/fresh confirmation; equal-Guardian family Hold place/release; independent Institution Hold; transfer review/confirm/decline; family withdrawal; re-entry identity/history; active/paused/terminal states; all required consequence fields; direct-empty versus always-claimed withdrawal; zero/one peer snapshots; owner-reread-only final display; and every stale/race/transaction-fault path.
- Grant tests MUST cover first-committer owner, racing second Guardian `already_active` without ownership language, exact Participant+Role owner replace/revoke, server-offered fixed replacement delta, no free-form profile/renewal, suspension versus terminal role loss, fresh future-only Grant, exhaustive candidate classification under database time, uniqueness/lineage, no `findFirst`, no ThreadParticipant authority, complete cascade, and zero old-work revival.
- Stage tests MUST cover unset/set/change/correct/clear/set-after-clear, owner navigation/item selection followed by a separately issued bound action target, all catalog coarse/fine classes, item-ref non-authority, no raw/free-form stage input, strong/direct-empty execution, equal-Guardian races, database time/lineage/projection consistency, no age/AI/pregnancy/Institution inference, zero Enrollment/Grant effect, and retained longitudinal history.
- Authorization/result tests MUST require current Host recent-auth policy plus current Nurture actor/Role/subject/root/policy/version/consequence and explicit confirmation for every ordinary C-3-2 write. They MUST reject natural-language or AI confirmation, surface-specific downgrade, stale assurance/context, cross-account/device/surface/episode reuse, raw ids, and missing mandatory consequence copy. Tests MUST preserve `applied|already_satisfied`, `executed|replayed`, and `changed|already_current|processed_but_unavailable` layers without attributing a replay/duplicate caller as original performer/owner.
- Relationship-attention tests MUST keep `guardian_relationship_attention` distinct from `user_attention`, permit only the locked purposes/sources, implement only withdrawal producer evidence in C-3-2, exclude the actor, capture recipient RoleAssignment at commit, retain claimed driver with `[]`, require same-Step byte-equivalent replay, and reject wrong-Step/after-the-fact/Admin seeds. Transfer-proposal/Institution-close producers remain C-4; Notification/provider/open remains C-3-4.
- Adoption tests MUST pin historical Workflow hash, interface/action source identities, Scenario module, Host renderer, Nurture relationship schema/command revision, and relationship-attention contract/consumer revision independently. They MUST prove canonical manifest/generated projection/provider/presenter/action/handler/invitation/Handoff parity, mixed-revision rejection, immutable dependency materialization, isolated harness-only composition, capability off, empty allowlist, rollback, and no alias/fallback through `capture_family_input`, Run action, `internal_api`, static owner token, Handoff-id deep link, manual filters, or mutable local dependencies.
- Planning-exit tests MUST report C-3-2 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No contract/source, invitation subsystem, manifest, handler, schema, migration, route, UI, renderer, runtime, Handoff consumer, capability, allowlist, database, provider, environment, or traffic changed. C-3-3 is next; C-3-5 owns default-off qualification and Pilot-2 alone owns non-empty activation.

Pilot-0-C3-3 Caregiver operational test design:

- Root/integrity tests MUST construct `caregiver_family_care_work_v1` from one Item-root complete graph and prove that Attention is only a unique typed queue index. Missing/duplicate/cross-Workspace/Thread/Enrollment/Grant source Message, source Receipt, Item/Event, Attention, reply Message, or reply Receipt MUST make the complete response unavailable and emit body-free integrity evidence. Attention action targets, `findFirst`, partial rendering, silent omission of an entitled corrupt row, and read-time repair MUST fail.
- Authority tests MUST require one exact current care-group `caregiver` RoleAssignment plus the separately valid Lead designation and exact selected CareGroup collection. Institution Admin, `lead_caregiver` alias without operational role, Guardian, Operator, service, general Workspace admin, Institution/Enrollment scope, wrong group, raw id, and ThreadParticipant-only actors MUST be denied. Zero or more than one eligible operational Caregiver MUST fail the Pilot protected read/action gate without adding a global one-Caregiver schema constraint.
- Query tests MUST cover three child scopes in one CareGroup; current open/acknowledged plus active Attention; mutually exclusive recent 30-day terminal/suppressed results; teacher-board history through every authorized shell inside the fixed 365-day source window; Chat cap five/no cursor; board page 20; opaque cursor/item expiry; stable owner ordering; database-time/Workspace-zone “today”; and episode separation. Client `on_date`, raw date/child/group/status filter, arbitrary search/sort, offset, local filtering, multi-select, bulk action, and cross-group aggregation MUST fail.
- Presentation/privacy tests MUST inspect every collection/detail/Chat narration/Host shell for body/body-derived copy, Guardian/family structure, Stage, raw ids/refs/versions, original Grant, internal status/reason, and hidden action state. Unauthorized rows MUST disappear before materialization without count/timing/tombstone leaks. Complete Caregiver history means body-free 365-day product history, not indefinite body retention.
- Protected-read tests MUST cover `open` only for the exact sole current `scopeType=care_group` operational Caregiver and `acknowledged|replied` only for the stored claimant Participant + same current RoleAssignment; ready/tombstone/context-changed/unavailable; original Grant, current Enrollment under the CareGroup, Hold, Institution, policy, source redaction, 30-day retention, KMS/owner outage, and current-version drift. Temporary same-row fence denies and may recover; terminal old-role loss followed by a new sole RoleAssignment MUST still deny protected question content. Institution/Enrollment-scoped roles, peer roles, Admin, Lead-alone, and ThreadParticipant deny. Ready body MUST be no-store, clear within 60 seconds/background/lock/logout/surface/item/Workspace change, and never enter Chat AI/history, semantic presentation, Item/Attention, route, browser/PWA/offline/cache/search, export/print automation, logs/APM/crash, Step/Handoff/Outbox/Notification, or another surface.
- AI tests MUST prove `scenario_protected_ai_draft_v1` is absent/off, the model receives only body-free owner narration, and both question view and empty reply composer remain outside model context. No protected prefill, summary, translation, classification, prompt, generated reply, Chat transfer, `PublicDraft`, or artifact draft is permitted.
- Acknowledge tests MUST fix `confirmation_class=explicit` and `nurture_direct_empty_v1`; reject natural-language, implicit open/Host/Notification read, and recent-auth step-up as command substitution; require the complete open graph/original Grant/current sole actor/versions; and atomically assert Item/Receipt/Event/claim/Execution/explicit `[]` while Attention stays byte-for-byte active and no reply/Step/Handoff/Notification is created. Exact replay, fresh duplicate, stale version, and every write-point rollback MUST preserve original attribution.
- Work-claim tests MUST bind `ackedByParticipantId`, `ackedByRoleAssignmentId`, and assigned role to the same exact operational role. Reply across Chat/teacher board by that claim is allowed; another/new role, Institution, or Operator takeover is denied. Temporary same-role/Host/Hold/policy fence preserves acknowledged/active facts and requires fresh prepare after recovery. Terminal claimant role retains body-free staffing-review work with no suppression/reassignment. An unclaimed open Item may be acknowledged by a later sole current role.
- Reply tests MUST fix `confirmation_class=explicit` and `workflow_claimed_step_v1`, accept only exact acknowledged claimant, and reject open/waiting/replied/suppressed, zero/multiple actors, second reply, another role, and driver downgrade. Manual composer/profile tests cover normalized 1–2000-character plain text, empty/overlong/forbidden control/attachment/health/media/AI inputs, separate question/draft buffers, five-minute encrypted prepare, content-free Step binding, accepted-only clearing, no reload/device/surface recovery, and no body resend.
- Reply transaction tests MUST use only Item original Grant and atomically prove one reply protected content/Message/Event/Receipt, Item replied, source Receipt unchanged, Thread advance, Attention active-to-resolved, typed Execution/audience, and one stable snapshot. Fault every write/commit seam; same-Step replay is byte-equivalent, wrong/new Step or changed input cannot claim the seed, and zero recipient remains claimed with `[]`.
- Audience/origin tests MUST preserve the exact existing `user_attention` key/purpose/source types, add a Host-derived versioned domain-action producer origin, and reject client origin, direction-only inference, legacy `capture_family_input` alias, false entrypoint, or new handoff key. One reply/Handoff may fan out to the typed commit-time Guardian RoleAssignment cohort intersected with current eligibility. Test Family-1 two recipients, late join without backfill, departed role denial, same adult/new role denial, zero cohort, materializer response loss, and no live Notification/provider/deep-link in the C-3-3 harness.
- Redaction tests MUST reuse `redact_family_care_message`, explicit/direct-empty, exact sender Participant plus same current original operational RoleAssignment and current original Group reach. Another/new role, Admin, Operator, client reason/raw id, and unredact aliases fail. Original Grant/Enrollment terminal does not block exact-author cleanup. Transaction must erase only reply content/contexts/Receipt, retain source Message/Receipt/replied Item/Event/resolved Attention, store explicit `[]`, and never reopen/suppress the Item, create Handoff, or permit a second reply.
- Retention/fence tests MUST cover independent 30-day question/reply clocks and the 365-day source-entry shell. Pre-reply question expiry permanently suppresses unfinished Item/active Attention; reply expiry only tombstones reply visibility. Temporary role/Hold/policy/owner failure creates no persistent mutation. Permanent original-Grant/Enrollment/source roots close the complete graph. Terminal claimant staff loss creates a staffing blocker without takeover. Redaction and retention may each retain distinct idempotent audit meaning.
- Race tests MUST cover acknowledge/acknowledge; acknowledge against source redaction, retention, Grant revoke/replace/expiry, Enrollment terminal, hold, role loss, and policy; reply/reply; reply against every permanent/current fence and context expiry; reply commit/reply redaction; reply redaction/retention/revoke; zero/one/multiple actor drift; same/wrong Step; and response loss. Validate deterministic lock order, database time, Serializable retry, exact versions, final cardinality/zero-survivor assertions, and no `take:100` partial closure.
- UX tests MUST cover only `ready|empty|context_changed|unavailable`, with generic transport outage separate. Loading/invalidation clears old body/action before fetch; empty requires a proven exact zero-row query; stale ref/cursor/action refreshes; malformed graph and wrong principal/scope are indistinguishable unavailable; tombstones are body-free; no optimistic state, stale-while-revalidate, offline/cache, legacy internal-API, synthetic-ref, or wider-surface fallback exists.
- Adoption tests MUST prove `C33-I0..I7`, exact Base -> My-Chat -> Nurture order, versioned action-origin contract, canonical manifest/generated/implementation parity, separately pinned interface/action/protected sources, Scenario module, Host renderer/protected runtime, Nurture schema-command/attention graph, action-origin/user-attention, crypto/retention/KMS, and exact commits. Historical Workflow hashes remain immutable evidence only. Mixed revisions, mutable local dependency, manual registry filter, active legacy twin, nonempty persistent allowlist, or capability enablement before C-3-5 qualification and separate Pilot-2 authorization MUST fail.
- Joint tests MUST run all four Caregiver Chat/teacher-board acknowledge/reply surface pairings across the three child scopes, including the dual-Guardian reply audience, at least three times each. Each journey has at most one business effect and logical Handoff; provider/open is stubbed as a body-free delivery plan because C-3-4 owns real Notification continuity. Cross-role/privacy/fault/kill-switch evidence cannot claim activation or qualification by itself.
- Planning-exit tests MUST report C-3-3 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No contract/source hash, generated artifact, manifest declaration, handler, schema, migration, KMS key, route, UI, renderer, runtime, Handoff/Notification consumer, capability, allowlist, database, provider, environment, or traffic changed. C-3-4 continuity is specified below; C-3-5 is the only default-off qualification gate and Pilot-2 remains the only non-empty activation gate.

Pilot-0-C3-4 continuity and Notification test design:

- Source/validator tests MUST keep `scenario_notification_continuity_source_v1` separate from interface/action/protected/historical hashes; require `scenario_notification_continuity_v1` plus Handoff/trusted-ingress/presentation dependencies; validate exact Handoff/purpose/resolver/route/view/surface bindings for both attention keys; and reject partial, duplicate, unknown, mixed-hash, mutable-local, or legacy-alias declarations.
- Route tests MUST distinguish product `nurture_chat|family_board|family_workbench|teacher_board` from subject-context `subject_detail|subject_collection` and legacy `teacher_attention_board`. Every ordinary Guardian/Caregiver transition carries only registered route + `current|recent|history`, with absent continuation/item/action/context/result/output/Step/Handoff refs. Test question -> teacher current, reply -> family recent, withdrawal -> family workbench history, C-4-only transfer fixture -> family workbench current, and teacher-board acknowledge -> `nurture_chat/current` with a fresh owner query/selection of the claimant's acknowledged Item.
- Draft tests MUST cover non-empty composer navigation and Notification tap with exact `stay|discard_and_navigate`; staying performs zero mark-read/owner calls, discarding clears plaintext/view before navigation and best-effort revokes prepared content. Background/lock/logout/account/Workspace/subject, external/uncontrolled surface replacement, capability/reload/crash clears without recovery, while user-controlled surface navigation cannot bypass the draft guard. Ordinary Chat transcript, `PublicDraft`, artifact, browser/PWA storage, and another device/surface MUST receive no copy of the composer body; ordinary user-authored Chat intent remains governed separately by My-Chat policy.
- Result tests MUST fault direct and claimed actions before/after prepare, Step persistence, binding, scheduling, Nurture commit, `complete_step`, and response delivery. Direct recovers one Execution; claimed recovers the original Step/Execution/Handoff; wrong/new Step and changed body fail. Host persistence is content-free, claimed progress remains canonical `accepted -> completed`, and every destination obtains current owner presentation without `open_result`, output ref, or duplicate command.
- Recipient/materialization tests MUST prove immutable commit cohort -> current exact Nurture eligibility -> current Host membership/gate. Cover zero/one/two recipients, duplicate/ambiguous account or Participant paths, late join, departure, same Participant/new role, temporary same-row suspension/recovery, horizon expiry, actor exclusion, and no Admin/Lead/ThreadParticipant authority. Persist the complete candidate-set/intent hash and exact `WorkflowNotificationMaterializationCandidate.materialization_status=pending|materialized|skipped` row per commit candidate; one Handoff may yield two typed recipient links/Notifications but never a second seed/Handoff.
- Typed-link tests MUST enforce unique Notification, workspace-bound foreign keys and unique `(workspace, Handoff, recipient, continuity key)`; immutable opaque binding/open horizon/contract/source/manifest-allowlist/generic-copy/canonical-intent hashes; and one local Notification/link/delivery/Outbox/candidate transition transaction. Same identity with changed plan or intent is an integrity conflict. Existing rows MUST carry explicit `legacy_target_v0`, vNext rows `workflow_handoff_continuity_v1`; discriminator backfill is explicit, link/target/type heuristics are forbidden, and neither kind may fallback.
- Handoff tests MUST cover command-time cohort zero -> snapshots `[]`/no Handoff; existing plan all terminally skipped/zero materialized -> stopped; partial materialized plus terminal skipped -> completed; any temporary/owner pending candidate -> requested; horizon settlement; plan/hash defect -> failed; and response loss at every candidate/link/receipt seam. `requested` opens only through an already committed exact-recipient typed link; arbitrary requested id and stopped/failed Handoff deny. A skipped candidate never backfills after recovery. Cross-database revoke between owner read and Notification commit may leave only a generic row, while send/open/destination checks MUST block content/action.
- Delivery tests MUST require `WorkflowNotificationDelivery.delivery_status=pending|leased|retry_wait|sent|skipped|dead_letter`, typed-link/Handoff/Host/owner reread immediately before every provider call; permanent stop -> delivery-status skipped/no provider; known temporary same-role fence or owner outage -> bounded retry/no provider until recovery/horizon; terminal skipped -> no later backfill; lease expiry -> same-delivery reclaim; backoff/dead-letter; provider terminal/retryable/unknown; stable per-target request key; zero/one/many device targets; no late-device backfill; and duplicate generic push without duplicate logical/business state. Candidate `materialization_status` and delivery `delivery_status` MUST remain independently transitioned and MUST NOT map to one another despite sharing the `skipped` literal.
- Provider/privacy tests MUST scan Notification DTO, typed link, metadata, Outbox, queue, provider payload, deep link, route/history, logs, traces, metrics, APM, crash/support export, PWA/cache, and push-token handling. Public/provider carriage is Notification id + generic copy + exact notification-open link only. Handoff/target/reason/route/token, Nurture refs/ids/status/action, bodies/body-derived copy, identities, and raw device tokens MUST be absent.
- Open-order tests MUST use `POST /workflow-notifications/{notification_id}/open`: protected draft guard; sign-in retaining id only; global exact recipient lookup; explicit same-user Workspace switch; exact membership/gate; idempotent Host read plus typed-link load; Handoff reread; signed current human `notification_open`; owner open; in-memory Notification-id/token navigation; destination second Host/Handoff/Nurture owner read. Notification id remains Host evidence and only the token enters the strict Nurture echo. Wrong user/Workspace/id/source MUST prove zero Handoff/Nurture calls.
- Open-result tests MUST allow only ready route/view/raw token/expiry or generic unavailable/retryable. Token storage is hash-only with typed dependencies and is absent from URL/storage/log/provider/Notification. Repeated/multi-device opens issue fresh current tokens; token/process/native-web loss restarts by Notification id; open never mutates Receipt/Item/Message/Execution or performs acknowledge/reply/action.
- Current-visibility tests MUST separate historical recipient episode, owner-safe shell, protected body, and action. Cover acknowledged/replied/closed history; source/Grant/redaction/retention tombstone; terminal role/new-role/rejoin denial; temporary same-row recovery; Enrollment/subject reach; policy/capability/allowlist; owner/DB/KMS/verifier outage; token/Handoff/open-horizon expiry; open/revoke races; and destination invalidation after token issue. No stale control/body or state inference is allowed.
- Offline/retention tests MUST prove generic OS/in-memory shell only, no durable offline scenario inbox/open/read/token/body/action, non-sliding seven-day open horizon, five-minute destination refs, 60-second protected view, generic Notification archive/removal by 90 days, fourteen-day operational attempt detail, ninety-day de-identified metrics, and no extension of Nurture business/protected retention.
- Adoption tests MUST prove `C34-I0..I8`, Base -> My-Chat -> Nurture order, exact source/commit/candidate-plan/source-kind/schema/runtime/route/resolver/provider/privacy/retention pins, the My-Chat signed owner-read caller/signer/authenticator/key-domain/nonce and Nurture verifier pair, canonical/generated manifest parity, capability false, allowlist empty, zero openable legacy Nurture rows, rollback, no static bearer/Handoff-id/generic-target/legacy-presenter fallback, and only contract-negative C-4 producer fixtures.
- Joint tests MUST run both `user_attention` directions and the C-3-2 withdrawal `guardian_relationship_attention` across three child scopes, all relevant Guardian/Caregiver surfaces, two Guardians, one Caregiver, wrong actor/Workspace/device, all crash/race seams, and leakage inventory. C-3-4 may claim isolated default-off continuity evidence only; complete C-3-2 authority, rendered J1-J4 component evidence, positive-only gate implementation, and rollback qualification remain C-3-5, while persistent enablement remains Pilot-2.
- Planning-exit tests MUST report C-3-4 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No contract/source, manifest, schema, migration, route, UI, runtime, link, resolver, token, provider policy, capability, allowlist, database, environment, or traffic changed. C-3-5 is next and C-4 remains the Institution producer/surface owner.

Pilot-0-C3-5 default-off qualification and C-3 exit test design:

- Prerequisite tests MUST prove the strict `C30-I0..I4 -> C31-I0..I5 -> C32-I0..I6 -> C33-I0..I7 -> C34-I0..I8 -> C35-I0..I10` DAG. C30 is the sole shared baseline owner; C31 consumes C30 and MUST NOT recreate interface/action/protected sources, generic Host runtime, typed actor/KMS baseline, or an alternate registry. Each later node consumes immutable evidence refs and has separately attributable inputs/outputs even when nodes land in one ordered release series. `C35-I0` requires C34-I8; C35 convergence including activation/qualification control precedes the single `C35-I4` dependency freeze and `C35-I5` assembly. A changed upstream commit/hash/schema/route/test-plan artifact after freeze invalidates all dependent C35 results. Missing implementation, open `QR-P0/QR-P1`, dirty candidate source, mutable `file:|link:` dependency, legacy alias/fallback, or partial capability is a candidate rejection.
- Base convergence tests MUST prove one additive package revision consumes all earlier neutral C-3 source/codecs/validators while keeping historical and six named public source hashes distinct. `platform_child_family_identity_source_v1` MUST separately bind the completed My-Chat owner contract/schema/migrations/runtime/APIs, Nurture anchors/associations, and joint conformance; the schema-only `db22de6` target MUST fail adoption. `scenario_activation_admission_source_v1` owns exact admission/recovery/evidence/qualification wire contracts. My-Chat and Nurture MUST pin exact sources rather than local equivalent DTOs and separately prove canonical/generated/registry parity, identity/binding/anchor/mapping schema and migrations, pair recovery, admission persistence/issuer/verifier/status lookup, evidence/qualification authorities, signer/nonce, renderer/protected/action/Notification/provider/KMS/retention identities, and no dev-host/runtime ownership leak.
- Candidate-manifest tests MUST canonicalize and hash `c3_component_candidate_manifest_v1` into `component_candidate_id` from exact source commits/locks including `platform_child_family_identity_source_v1`, activation-admission source, source/manifest/module, executable/SBOM/provenance, both schemas/migrations, identity/binding/anchor/association and route/provider/admission registries, admission/evidence/qualification/KMS/signing/retention/gate/topology/test identities—excluding authorization instances, execution results, evidence index, qualification event/envelope id, lifecycle, and approval. Branch/tag/CI-green/single-hash/mutable-URL identities fail. Every result first binds that id; the later evidence index binds the id. After I0–I9, a body-free prequalification seal binds that evidence index, final false/empty census, limitations, and C-4 negative inventory without claiming a result. Only after verifying the pre-seal may the qualification controller sign `c3_component_qualification_v1` and compute a distinct `qualification_envelope_id`. Evidence cannot write back into candidate-pinned source or merge from another build, post-test rebuild, or changed configuration.
- Qualification-event tests MUST allow only the separately keyed `c3_qualification_controller` to sign both `c3_component_qualification_v1` and `c3_component_qualification_event_v1` under distinct schema/audience labels in the same isolated qualification trust domain. The event binds exact schema/id, qualification profile, candidate, qualification envelope where applicable, evidence/final-census digests, `verifying|qualified_default_off|rejected|invalidated|superseded`, predecessor id/hash, body-free reason, database time, issuer/audience/key, and signature. Chains MUST be partitioned by `(qualification_profile, component_candidate_id)` with one unique current head. The controller first CAS-appends a deterministic signed `verifying` genesis with `predecessor=NULL` and id bound to candidate/profile/pre-seal, then signs the envelope and CAS-appends `qualified_default_off|rejected` against that exact head. Crash after genesis MUST resolve unqualified; exact same pre-seal retry reuses genesis and resumes, while changed evidence/pre-seal conflicts and may only produce a rejected child. Exact same deterministic event request replays, and any stale predecessor creates no second head. Controller credential/trust/key/revocation domains MUST be distinct from invocation, Notification, evidence activation, Pilot activation, and Technical Operator. Tests MUST accept only empty -> `verifying`, `verifying -> qualified_default_off|rejected`, `qualified_default_off -> invalidated|superseded`, `rejected -> superseded`, and `invalidated -> superseded`; `superseded` is terminal and no second genesis or same-candidate return to `verifying|qualified_default_off` is allowed. Tests MUST reject self-qualification by CI/repository/service/business actors, unknown/revoked signer, wrong issuer/audience, changed digest, missing/duplicate/divergent predecessor, broken chain, stale envelope, mutable overwrite, concurrent qualify/invalidate stale-head writes, and store/verifier outage. The current-state resolver MUST return unqualified on any ambiguity. A newly discovered unresolved risk rejects/invalidates the same candidate; Technical Operator may disable/request invalidation but cannot sign it. Only a tuple-changing fix/configuration change creates a new component candidate and dependency-aware rerun. C-4 plus Pilot-0-D may produce a new complete Pilot candidate; Pilot-0-E's signed decision references it and MUST NOT participate in the identity it reviews.
- Activation-schema tests MUST enforce positive-only exact Workspace/scenario/profile plus typed `candidate_kind`, `release_candidate_id`, nested C-3 component, nullable `c4CompositeCandidateId`, `deployment_binding_id`, candidate-kind-specific authority, active interval/database time, one-current-row uniqueness, version/audit/disable evidence, and forbidden business/content fields. Database and codec negatives MUST require C3 rows to keep the C4 id null and C4-composite/D-complete-evidence/live-complete rows to bind the exact nonnull id; missing, extra, stale, or mismatched C4 ids deny. For `c3_component_v1`, accept only current `c3_evidence_run_authorization_v1` signed by `evidence_release_controller` with issuer `my-chat.evidence-release`, audience `my-chat.c3-evidence-activation.v1`, isolated trust/revocation domain, and exact disposable environment/component/deployment/synthetic Workspace/interval/activate-deactivate operation binding; assert zero qualification/E resolver calls. The My-Chat append-only authorization store/current resolver MUST fail closed on unknown/revoked signer, verifier/store outage, expiry, supersede/revoke, duplicate head, scope/runtime mismatch, Pilot/staging/production target, cross-kind use, or external-traffic scope. For `complete_pilot_evidence_v1`, require exact profile `nurture_institution_complete_pilot_evidence_v1`, complete candidate, current C-3/C-4 qualification, current D evidence authorization, current isolated `pilot0_d_disposable_deployment_binding_v1`, disposable environment/Workspace, and zero external recipient/traffic; assert zero E/Pilot-1/stage resolver and reject C-3/C-4/Pilot authority substitution. For `complete_pilot_v1`, require exact profile `nurture_institution_complete_pilot_v1`, the candidate referenced by E, exact nested C-3/C-4 ids, Pilot-1's exact deployment binding, exact E and stage id/head digests plus prerequisite seals, and independent current C-3/C-4 qualification, E, deployment, and stage resolver results. Future qualification/E references in disposable proof, component-only or C4-invalid Pilot activation, either qualification invalidated/ambiguous/outage, deployment drift, absent/disabled/expired/duplicate/mismatched/unknown/unreadable rows, and generic default-enabled/environment-only flags MUST deny.
- Gate-matrix tests MUST evaluate the full conjunction of environment bundle, exact active release/deployment row, the candidate-kind-specific current authority predicate, running complete artifact/configuration hashes, Host membership/gates, and signed current Nurture cohort/owner policy for normal business ingress/read/action/replay and delivery/open. Normal `complete_step` MUST instead validate current local environment/row/release/deployment/runtime hashes plus original claimed Step/draft and make no remote owner call. Step/Handoff provenance MUST freeze the admission hash plus admitted candidate/release/deployment/profile/row/source/recovery-runtime identities. Only the dedicated signed exact-original status lane may classify committed/no-effect/unknown without an active row or unexpired admission; it cannot execute business, recompute audience, create candidates, enqueue/send, open, present/read protected content, or disclose content. An incompatible new runtime quarantines/alerts and cannot reinterpret old provenance. Cached presence and a store outage required by the current seam cannot authorize.
- Admission-schema tests MUST require the exact Base `ScenarioActivationAdmissionV1` with random id/hash, exact Workspace/scenario/profile/row version, release/deployment/runtime, actor, request/command/optional Step hashes, issue/expiry, and safe audit. Host gate-read plus admission persistence/issuance is the technical admission point. Content, business target/result, Participant/role/policy, transport caller/route/operation, attempt-start/deadline, raw transport nonce/signature/claim/credential, local equivalent DTO, and reuse across another request/command/Step MUST fail. A fresh signed `ScenarioPrivateInvocationV1` MUST instead bind caller/route/operation, exact admission hash, attempt-start database time, single-use nonce, and bounded owner-transaction deadline; Nurture verifies/consumes it before the exact admission.
- Admission-race tests MUST keep three layers distinct: the fresh signed private invocation's transport nonce is independently consumed before every owner call; the persisted admission assertion proves the earlier Host gate-read; and the Nurture fenced `CommandExecution + business effect` transaction is owner commit. Duplicate transport nonce proves zero Participant/resolver/owner calls; precommit rollback does not restore nonce; a pre-expiry retry uses fresh nonce/signature with the same exact admission and command identity; and an admitted disable race yields at most one CommandExecution. Disable before Host admission proves zero owner call/fact. A transport attempt already in flight may fail closed or commit once, but disablement cannot mint a fresh attempt that creates a previously uncommitted effect. Tests MUST NOT assert wall-clock deletion and Nurture commit are atomically ordered or couple transport-nonce lifecycle to the business transaction.
- Admission-status tests MUST exercise `ScenarioExecutionStatusLookupV1` only through caller `my-chat-execution-recovery`, issuer `my-chat.recovery`, audience `nurture.execution-recovery.v1`, the fixed endpoint/operation, independent credential/signing/verifier/revocation registry, and fresh nonce. Exact caller/credential/signature/issuer/audience/endpoint/codec/nonce and frozen Workspace/admission/request/command/principal/optional Run/Step/driver binding MUST be verified before any status resolver or writer fence. Unknown/revoked signer, malformed/replayed request, or any frozen-binding mismatch returns one generic transport deny/unavailable response and asserts zero status/fence/application call; My-Chat keeps the work locally `outcome_unknown/quarantined`. Only an authenticated exact-bound request may use the writer fence and return `committed|confirmed_no_effect|unknown`. `confirmed_no_effect` requires expired admission plus skew/transaction deadline, terminal issued attempts, acquired fence, and absent Execution. For a valid request only, one absent read, owner/store outage, lock timeout, possible in-flight work, or compatible-evidence ambiguity remains protocol `unknown`. Assert zero Participant/role/subject/Grant/policy/presenter/protected-read/business-command/Step-mint/audience/candidate/delivery/open calls. Direct committed display MUST require current session/membership/Workspace and original request ownership or return `processed_but_unavailable`; claimed committed recovery MUST retain the original Run actor/Step. Under disablement, only committed/no-effect may obtain a short same-Step frozen-runtime technical recovery claim; assert that the claim can call local `complete_step|fail_step` but cannot invoke a scenario command, mint/rebind a Step, change draft/admission, or escape the disabled lane. Cover issued-before-send, nonce-consumed-before-transaction, transaction rollback, commit-before-response-loss, and admission before/at/after expiry for both claimed and direct drivers.
- Admission-expiry tests MUST prove an uncommitted expired admission cannot start work; after confirmed no-effect, a new attempt requires a full current gate, remaining retry budget, and new admission bound to the same original Step/command rather than a new Step or rebinding. Committed response-loss recovery uses fresh transport evidence and original admission hash only as provenance whether active, disabled, expired, or after signer/row rotation; exact same-Step/direct request recovers the existing Execution/seed, wrong-Step and new-admission rebinding fail, and no business effect repeats.
- Gate-authority tests MUST reserve creation of one exact fresh Pilot row for `pilot_release_controller` under the matching current stage authorization, limit that controller and Technical Operator to exact disable/removal afterward, and deny extension, retarget, re-enable, or Guardian/Caregiver/Institution Admin/service/worker enablement. Any changed interval/target/resume requires a new authorization and fresh row. A separately approved disposable activation MUST use `c3_evidence_run_authorization_v1` from `evidence_release_controller` through the same production activation command/path, bound to one evidence environment/C-3 component/disposable deployment/synthetic Workspace/short interval, with no direct DB/test bypass or Pilot target authority. Tests pin the Base contract plus My-Chat controller/store/issuer/audience/trust/revocation/verifier/current-resolver revisions and reject an unpinned/local envelope. Teardown runs the authorized deactivate operation, revokes the authorization, destroys the credential, proves the resolver inactive, and leaves every environment switch false, active rows empty, no hidden release/evidence bypass, and no external route/traffic.
- Migration tests MUST use separate My-Chat/Nurture production-shaped databases and exclude dev-host tables. Cover fresh apply, supported old-baseline upgrade, SSOT diff, ordered checksums, boundary scans, disposable backup/restore/forward repair, gate-table constraints, and same-path isolated KMS persistence without secret/key leakage. Pilot-topology restore and cloud secret custody remain Pilot-1/3.
- Evidence-layer tests MUST map every deterministic test id to one candidate across L0 integrity, L1 contract/action-surface, L2 owner domain/DB, L3 two-database joint, L4 rendered authenticated UI, L5 safe manual, L6 three-run privacy/fault, and L7 rollback/closure. No lower layer may substitute for a required higher-layer result.
- Guardian-authority tests MUST separately cover C-3-2 invitation/relationship/self-exit, Enrollment confirmation/hold/transfer-consumer/withdrawal, Grant confirm/replace/revoke, Stage set/change/correct/clear, strong-confirmation/denial, current/recent/history across all Guardian surfaces, and family-withdrawal Notification/open. J1-J4 communication evidence cannot satisfy these rows.
- J1-J4 tests MUST use the exact three-family/four-Guardian/one-Caregiver topology, distinct identities/sessions/browser profiles, and one API/worker/web/mobile/Nurture candidate. They MUST assert the exact paths: J1 Chat/current -> Caregiver Chat/current acknowledge -> teacher_board/current reply -> Notification -> family_board/recent -> navigation -> family_workbench/history; J2 family_board/current -> teacher_board/current acknowledge -> Chat/current fresh selection/reply -> family_workbench/history -> Caregiver Chat/recent reply redaction; J3 family_workbench/current -> teacher_board/current acknowledge+reply -> Notification -> family_board/recent with response/provider loss; J4 Chat/current -> Caregiver Chat/current acknowledge/reply -> other Guardian family_board/recent owner reread -> exact author Chat/recent source redaction. J1 MUST materialize separate G1 and G2 candidate/Notification rows from the one reply Handoff, select G2 for the rendered open, and prove later G1 delivery/open creates no second business seed, Execution, Step, or Handoff. Same-family/cross-family behavior passes and J1/J4 use different commands/Steps/namespaces.
- Rendered/manual tests MUST cover generic Chat plus structured cards/forms, family/teacher boards, family workbench, mobile Notification/deep link, web reauthentication, loading/empty/error/permission/current refresh, accessibility, locale/font scaling, and stale-content clearing. Native-to-web MUST carry Notification id only; global exact-recipient lookup derives the target Workspace, a different current Workspace requires explicit same-user switch/confirmation, and only then may the server re-establish membership/gates, load typed link/Handoff, and owner-reread. Workspace/Handoff/token never enter the route or transfer. At least one complete J1 and J2/J3/J4 differentiated checkpoints are recorded with capture-time protected-region exclusion/masking, no unmasked intermediate write, observer attestation, and privacy scans over temporary recording/tool caches.
- Setup-boundary tests MUST label synthetic topology/Prisma as setup-only. C-4 prerequisite setup may create Institution/CareGroup/exact staff-role, canonical My-Chat account/session, and one correlated trio: pending My-Chat Host invitation shell + pending Nurture EnrollmentInvitation intent + unlinked RosterEntry. It MUST NOT pre-create accepted invitee membership, Participant, Guardian RoleAssignment, accepted Enrollment, Grant, or Thread. Host invitation acceptance, platform/anchor/binding resolution, workspace-local first-Guardian relationship establishment, Enrollment confirmation with roster linkage, and then qualifying Grant/Thread MUST arise in that order through real authenticated C-3 paths. A pending transfer proposal may seed only the C-3 consumer negative/continuity case. Direct Grant/Thread/accepted-Enrollment setup is limited to isolated domain/negative tests and cannot count as joint/rendered evidence. Institution board/workbench, staff/enrollment/transfer/service-close producers, and Institution disable stay absent/negative. C-3 family-withdrawal relationship attention is real; a transfer-review fixture proves only the consumer contract.
- High-risk tests MUST run response-loss/same-Step, wrong-Step/scope, Grant/revoke/redaction/retention/role-episode, candidate settlement, provider/dead-letter/Admin, stale/open/destination, KMS/erasure, and both kill-switch orders three consecutive fresh namespaces with no retry or candidate/config change. Assert one business effect, at most one Handoff, no skipped backfill, and zero unauthorized disclosure.
- Kill-switch tests MUST cover gate loss around admission issuance/send, transport-nonce consumption, owner transaction rollback/commit/response loss, and every Step/Handoff/plan/candidate/provider/open seam for claimed and direct drivers. Unknown remains quarantined with no fresh business attempt. Confirmed-no-effect fails the claimed Step with `scenario_disabled_no_effect` and no Handoff/Outbox or closes direct-empty as `unavailable(no_effect)` with no Step/Handoff. Committed direct-empty returns only original body-free result/`processed_but_unavailable`. Committed claimed recovery proves five cases: explicit-empty snapshots complete with no Handoff; non-empty seed/no Handoff/plan atomically completes the Step plus creates one body-free stopped Handoff with zero Outbox/candidate/audience call; Handoff/no plan stops; plan/zero materialized skips pending candidates and stops; partial materialization skips the remainder and completes under C-3-4. Every send/open/destination is disabled, no audience is recomputed, Nurture facts are unchanged after their at-most-once commit, generic OS push is not claimed recalled, and re-enable does not backfill.
- Privacy tests MUST scan both databases and every Step/Handoff/candidate/link/Outbox/queue/provider/deep-link/DTO/Chat/cache/PWA/observability/crash/support/screenshot/backup destination for bodies, body-derived copy, raw refs/tokens/device secrets, claim material, credentials/signatures/nonces, identities, and policy detail. KMS integration tests cover envelope/keyed integrity, rotation, outage, wrong version, retention erasure, and restore erasure replay on the production application path.
- Qualification tests MUST require the strict C30/C31/C32/C33/C34 DAG; completed C35-I0–I9 plus the I10 prequalification seal; deterministic predecessor-free signed `verifying` genesis CAS; controller-signed qualification envelope; terminal child CAS; and current resolver result `qualified_default_off` before I10 success exits. Crash after genesis, exact retry, changed pre-seal rejection, duplicate genesis, stale-head race, and resolver outage MUST be covered. The gate also requires zero open `QR-P0/QR-P1`, one exact component candidate, complete C-3-2 plus J1-J4 evidence, B3 matrix, three-run proof, safe manual record, rollback, every environment activation-bundle switch false, active Workspace rows `[]`, and no external traffic. Success may output only `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING / EXTERNAL_TRAFFIC_NO_GO`; C-4, Pilot-0-D/E, Pilot-1, Pilot-2, staging, production, and GA remain unproven.
- Planning-exit tests MUST report C-3-5 and C-3 as `DESIGN COMPLETE / IMPLEMENTATION OPEN`. No source/package, manifest, candidate artifact, schema, migration, KMS/signing material, route, UI, runtime, evidence run, gate row, capability, allowlist, database, environment, provider, secret, or traffic changed. C-4 design discussion is open; implementation remains unauthorized.

Pilot-0-C4-0 scope/composition test projection:

- Actor-path tests MUST require current Host membership, one exact Participant, one current effective `institution_admin + scopeType=institution` RoleAssignment, a typed exact Institution relation, and active Institution state. Generic workspace admin, Caregiver, Lead designation, Technical Admin, `system_operator`, service/AI identity, permission override, raw id, unknown scope, deleted scope, and zero/multiple matching paths MUST deny before any Institution query or count.
- Query-shape tests MUST prove every board/workbench repository query starts from the authorized Institution predicate. Workspace-wide load/filter, cross-Institution count/existence leakage, unbounded count/page, stable raw object refs, and a distinguishable wrong-Institution error MUST fail.
- Surface tests MUST register only `institution_board/current` and `institution_workbench/current|history` for C-4. Board durable actions, Institution Chat, C-3 product-key reuse, neutral-fixture substitution, and legacy `class_family_inbox|teacher_attention_board|institution-surfaces.ts` fallback MUST fail.
- Presentation tests MUST enforce the `institution_operations_v1` safe allowlist. Board output is bounded group/readiness/invitation/staff/Enrollment/Grant-coverage/backlog/staffing totals and MUST NOT claim anonymity for the three-child cohort. Workbench output may add exact authorized topology, institution-local roster label, Enrollment/role/invitation history, Grant-safe metadata, and body-free cases. Protected body/summary/draft, Guardian/contact/profile, canonical child/family identity, Grant narrative/revoke reason, another Institution signal, Host contact, policy payload, runtime/claim/credential/provider detail, ranking, trend, ratio, or per-child workflow breakdown MUST fail.
- Composition tests MUST keep the content-addressed C-3 fragment/artifact/source hashes/migration ledger/candidate/qualification immutable and compose only the separate `nurture.institution.iib.v1` fragment. Unknown or duplicate fragment, key collision, C-3 redeclaration, legacy alias, missing dependency, changed nested hash, invalid order, partial fragment, handler mismatch, migration checksum/order drift, or unpinned current-working-tree rebuild MUST fail.
- Candidate-identity tests MUST enforce `C3 component -> C4 extension -> C4 composite -> D complete candidate -> E decision -> Pilot-1 deployment -> Pilot-2 active row`. C-3/C4 qualification envelope/event/result, evidence-run authorization instance, D topology/operations, E decision, deployment, active row, mutable environment, or post-assembly evidence in an earlier candidate identity MUST fail.
- Evidence-authority tests MUST accept `candidate_kind=c4_composite_v1` only with profile `nurture_institution_composite_evidence_v1`, current nested C-3 qualification, and a current exact `c4_evidence_run_authorization_v1` for the disposable environment/composite/deployment/synthetic Workspace/interval/activate-deactivate scope. JI1 additionally requires the separately signed, single-business-effect, exact-bound `c4_bootstrap_evidence_authorization_v1`; it is not an activation authority or Pilot-0-D provisioning spec. C-3 profile, a D-owned complete-Pilot profile, wrong candidate kind, C-3/Pilot/D/E authority, cross-kind/controller reuse, external/Pilot/staging/production target, expired/revoked/superseded authorization, store/verifier ambiguity, or missing teardown MUST fail. Exit requires environment switches false, active Workspace rows `[]`, both evidence authorities consumed/revoked as applicable, every bootstrap operation in `committed|closed_no_effect` with `quarantineState=clear`, destroyed synthetic spec/credentials, normal and recovery resolvers inactive, and no traffic.
- Planning-boundary tests MUST report C-4-0 `LOCKED / IMPLEMENTATION UNAUTHORIZED`, C-4-1 next, and zero source/package/manifest/schema/migration/route/presenter/action/runtime/candidate/controller/database/environment/capability/allowlist/provider/secret/traffic changes.

Pilot-0-C4-1 topology/policy/staff test projection:

- Active-action tests MUST allow only typed Institution display update; CareGroup create/update/suspend/resume/close; Institution policy revision; CareGroup policy binding; exact Caregiver assignment; exact Lead designation; and Caregiver-role revoke from `institution_workbench`. `create_care_institution`, Admin-role mutation, `system_operator`, generic role/scope/permission update, arbitrary JSON patch, upsert/change-state alias, Institution Chat, board write, and undeclared planned keys MUST fail validation or remain absent.
- Topology tests MUST require opaque owner target, expected versions, strong authorization, exact Admin/Institution scope, database time, typed canonical payload, and one CommandExecution. Update cannot change parent/status; suspend creates zero cascade/TTL change; resume cannot override Host gates or persist readiness; exact replay is stable; changed payload conflicts; stale versions refresh.
- Group-close tests MUST map only to `archived` and lock the complete dependent census. Every nonzero current Enrollment, active/unlinked RosterEntry, effective Staff/Enrollment Invitation, pending TransferIntent, active Caregiver/Lead, or unresolved current work MUST deny. Concurrent dependent insert, cap/count/hash mismatch, store failure, hidden cascade, bulk notification, `deleted`, or implicit Enrollment/Grant/role closure MUST roll back.
- Policy tests MUST use immutable allowlisted Institution revisions and exact group bindings. Unknown profile/schema/payload, mutable overwrite, arbitrary JSON/permission, free-form group override, stale predecessor/binding, cross-Institution revision, more than one effective binding, or policy update that extends Grant/content/invitation/context/notification lifetime MUST fail. Readiness MUST be derived from topology, exactly one eligible operational Caregiver plus exactly one Lead bound to it, policy, and current gates; zero/multiple Caregiver, zero/multiple Lead, mismatched binding, and resolver outage deny without a second persisted status.
- Invitation-saga tests MUST prove `pending_owner_binding` Host shell -> Nurture StaffInvitationIntent/Execution -> same shell deliverable/Outbox -> provider -> exact Host acceptance/membership -> signed invitation continuation -> Participant bind/reuse/intent consume -> separate Admin role assignment. Cover both `new_workspace_member` and `existing_current_member`: the latter requires current-membership reread, recipient reauthentication, and explicit new-purpose acknowledgement, while `already_member` alone cannot accept/consume. Raw contact stays Host-only. No Workflow Step/Handoff/domain-action driver, callback business actor, implicit role/Lead, or provider-authoritative state is allowed.
- Invitation lifecycle tests MUST cover one effective pending, seven-day derived expiry, cancel/consume/reissue first-commit-wins, one-way supersede lineage, exact replay, every response-loss seam, changed shell/recipient/Institution/Group/purpose/expiry/payload, owner denial before delivery, provider retry versus business reissue, acceptance after cancel/expiry, membership retained after Nurture denial, store/owner/provider outage, wrong callback signer/audience/nonce/binding, and terminal non-reopen.
- Staff-role tests MUST require one consumed exact Staff Invitation and create only `caregiver + scopeType=care_group`, typed Group relation, null permission override, and unique Restrict `sourceStaffInvitationIntentId`. One intent may create only one role identity; exact replay returns it, target/payload drift conflicts, and terminal role never releases the intent for reuse. Under the Pilot profile the assignment transaction MUST lock target Group, accepted Participant, and complete Workspace/scenario Pilot operational-role census and require zero other eligible human Caregiver across all Participants and Groups. Two Admins/two invitations racing to assign the same participant across Groups or different Participants anywhere in the cohort yield one role and one deterministic loser. The reusable schema has no global uniqueness claim. Assignment before acceptance, role/scope drift, Admin/Caregiver overlap, active `system_operator`, duplicate/second-group Caregiver, another Group/Institution, raw Participant id, and generic permission payload MUST fail.
- Lead tests MUST require a distinct exact-group `lead_caregiver` RoleAssignment with `leadForCaregiverRoleAssignmentId` pointing to a different exact same-Participant/same-Group current Caregiver row; a self-loop fails. Lead without operational role grants zero teacher access. Same-target replay may be `already_satisfied`; replacement atomically terminalizes old and creates new; zero Lead is not ready; more than one is integrity denial; `findFirst`, Group field, policy JSON, invitation label, first-staff inference, or Host role cannot determine Lead.
- Offboarding tests MUST terminalize exact Caregiver plus bound Lead while preserving Participant, Host membership, invitation history, authorship, Execution, audit, and another independent scope. Role revoke remains available under group pause and cannot be blocked by acknowledged work. C-3 owner checks deny immediately; staffing review is derived. Database-time elapsed `endsAt` denies current authority without a sweep; assign/re-invite atomically and idempotently persists terminalization of an elapsed status-active Caregiver plus bound Lead before uniqueness evaluation. Cover expiry/reinvite/Lead-replacement races. Same-user re-invite creates a new role/Lead episode with no old-claim body/read/reply/redact/complete authority. Temporary Host/policy/group/nonterminal role fences create no revoke/re-invite/closure.
- Pause/transfer tests MUST prove Pilot proposal, Guardian review/open, confirm, and decline require an active source Group. Paused/archived source permits only the explicit cancel/cleanup actions; the earlier reusable transfer-out allowance cannot activate through fallback.
- Planning-boundary tests MUST report C-4-1 `LOCKED / IMPLEMENTATION UNAUTHORIZED`, C-4-2 next, and no source/package/fragment/schema/migration/policy/intent/route/action/runtime/database/environment/capability/allowlist/provider/secret/traffic effect.

Pilot-0-C4-2 roster/Enrollment Invitation test projection:

- Roster tests MUST allow only workbench create/correct/close and enforce canonical `status=active|linked|closed` plus `terminalReason=NULL|manual_unlinked_close|unverified_intake_retention_expired|enrollment_withdrawn|institution_service_ended|enrollment_transferred`. Create/correct stores only exact scope, bounded local label, unverified allowlisted prefill, immutable 30-day personal-data expiry, version/audit. Link occurs only in the exact C-3 Enrollment transaction. Manual/retention close requires no link; only the owning Enrollment terminal transaction may write the other three reasons while retaining exact link evidence. Separate `withdrawn|ended|transferred` status values, reason/status mismatch, correction after link, close with effective invitation/context/Enrollment, reopen/delete/merge/move/generic status, fuzzy/global profile match, and board/Chat writes MUST fail.
- Privacy tests MUST prove RosterEntry/Intent has no raw contact, Host user/acceptance, My-Chat Child/Family id, stewardship/membership/binding, anchor/association candidate, local Child/Process/Family profile, Guardian identity, verified profile, Grant/Thread, health/media/care narrative, or protected body. Institution actor, prefill, contact, roster, media, or label MUST NOT reserve an anchor, mint/select a platform pair, or seed a local profile. Invitation linkage uses intent lineage; mutable Host ref and cross-entry deduplication authority fail. Status-aware constraints, 30-day absolute unverified retention, terminal seven-day acceleration, manual-close erasure, no-extension reissue, link-time prefill clearing, 365-day label de-identification, backup/restore erasure, and no cache/export/log/fixture revival remain mandatory.
- Coordination tests MUST prove non-deliverable Host shell -> Nurture EnrollmentInvitationIntent/Execution -> same shell deliverable/Outbox -> exact Host acceptance/membership -> signed C-3 invitation continuation. Institution keys are identity-invitation operations, recipient decline remains C-3, and no Workflow Run/Step/Handoff or ordinary action driver carries identity or business authority.
- Intent tests MUST enforce exact Roster/recipient/shell/Admin/Institution/Group binding, one effective pending, seven-day database expiry, `pending|consumed|cancelled|superseded`, one-way supersede lineage, exact replay, payload drift conflict, and expected-version first-commit-wins across cancel/decline/reissue/consume. Provider resend MUST retain the same intent; business reissue MUST create fresh identities.
- Acceptance tests MUST prove Host membership is retained but grants no Nurture scope when owner continuation denies. Host acceptance and provider delivery do not consume the Enrollment intent. Family continuation MUST cover both-binding reuse, Family-reuse/new-Child, Child-reuse/new-Family, both-new, current-local resolution, and conflicting-existing quarantine. It MUST use current stewardship/membership/`FamilyChildMembership`, reserve only missing typed anchors, commit every missing binding in one My-Chat transaction, then use one Nurture local aggregate+association transaction. Anchor-only, binding-only, membership-only, partial commit from the current operation, wrong pair/kind/version/workspace, invalid association graph, changed payload, owner outage, and ambiguity MUST deny. Empty bound anchors remain invisible/reusable/quota-bounded; deterministic status recovery converges the same operation and local aggregate. Independently confirmed platform/local facts survive later decline; no raw id/fuzzy match is allowed.
- Enrollment-boundary tests MUST prove only exact recipient C-3 confirmation after the current binding pair and workspace associations atomically consumes context/intent, creates active Enrollment, and links RosterEntry. Faults leave no partial effect; replay is exact; no Grant/Thread is created. The Pilot topology is exactly three RosterEntries/intents, three platform Child/Family pairs, three typed anchor pairs, three workspace-local child/family associations, and three family-confirmed Enrollments. Family-1 Co-Guardian separately requires current My-Chat Family membership plus current Nurture Guardian role; either fact alone denies.
- Re-entry tests MUST require fresh Roster/shell/intent/context/Enrollment and bind only an exact same-Institution terminal lineage leaf. Transfer-ended rows with successors, generic invitation history discovery, old identity reuse, and predecessor on ordinary first/different-Institution entry MUST fail. Later Grant/Thread are fresh and no old content/claim/notification authority revives.
- Planning-boundary tests MUST report C-4-2 `LOCKED / IMPLEMENTATION UNAUTHORIZED`, C-4-3 next, and no source/package/fragment/schema/migration/roster/invitation/route/action/runtime/database/environment/capability/allowlist/provider/secret/traffic effect.

Pilot-0-C4-3 Institution Enrollment/relationship-attention test projection:

- Action/surface tests MUST allow only workbench `suspend_enrollment`, `resume_enrollment`, `propose_enrollment_transfer`, `cancel_enrollment_transfer`, `close_enrollment`, and C-4-2 `initiate_enrollment`. Board/Chat, Caregiver/Lead/Operator/service/AI/raw-id, generic status/end/transfer/reactivate aliases, opposite-side countersignature, and driver substitution MUST fail.
- Hold tests MUST reuse C-2f institution-side Hold and cover zero/family/institution/both Hold combinations, shared same-side place/release, cross-side denial, aggregate/version mismatch, replay/already-satisfied, terminal and writer races, no cascade/clock extension/notification, and upper-gate non-override.
- Transfer-proposal tests MUST require active unheld source Enrollment, active source CareGroup, different ready same-Institution target, version/capacity/policy/exact-one-Caregiver-and-Lead readiness, one effective seven-day Intent, and a durably claimed original Step before commit. Paused/archived source proposal, review/open, confirm, and decline MUST deny; cancel remains the narrow cleanup action. The same transaction stores Intent/Execution and exactly one cohort-level immutable draft containing the exact commit-time Guardian RoleAssignment set; zero recipients stores `[]`. One business effect materializes at most one Handoff, while My-Chat derives stable per-recipient candidates under it. Response loss, same-Step reclaim, wrong-Step denial, duplicate/partial candidate materialization, and no late backfill are mandatory.
- Transfer lifecycle tests MUST cover Admin cancel versus Guardian confirm/decline, pause/close/withdraw/new work, target drift, exact replay, and atomic old-ended/new-active cutover with fresh target Roster and no Grant/Thread/content carryover. Cancel/decline/confirm MUST emit `[]`; an old proposal Notification owner-rereads current state without becoming authority.
- Service-close tests MUST allow active or paused exact Enrollment, require strong Institution confirmation and claimed Step, map only to `ended + institution_service_ended`, and execute the complete bounded Enrollment-rooted zero-survivor closure. Every Hold/Intent/Roster/Grant/Thread/context/Receipt/Item/Attention cardinality, fault/overflow/phantom/race, replay, and retained-history boundary MUST pass without Guardian countersignature or remote compensation.
- Relationship-attention tests MUST keep `guardian_relationship_attention` separate from `user_attention`; allow only `review_enrollment_transfer` from exact TransferIntent/source Enrollment to `family_workbench/current` and `enrollment_relationship_changed` from terminal Enrollment to `family_workbench/history`. Unknown purpose/source/destination, source widening, protected copy, child/Institution/Group/name/reason/ref disclosure, and active-Enrollment/Grant requirement for terminal history MUST fail.
- Recipient/open tests MUST freeze commit-time exact Guardian RoleAssignment episodes; reject late join, exited/suspended/renewed role, wrong user/workspace/Notification, stale/expired source, binding drift, owner/provider outage, and ambiguous resolver. DTO/provider/deep link carries Notification id only; transfer expiry is bounded by Intent and terminal update by seven-day/allowlist cutoff; current owner reread governs every send/open.
- Re-entry tests MUST reuse C-4-2 identity-invitation coordination from one exact terminal lineage leaf. Notification/history cannot authorize re-entry; C-3 confirmation creates fresh Roster/Enrollment with `[]`, and Grant/Thread remain later fresh facts. Different-Institution entry has no continuity edge.
- Planning-boundary tests MUST report C-4-3 `LOCKED / IMPLEMENTATION UNAUTHORIZED`, C-4-4 next, and no contract/source/fragment/schema/migration/Step/Handoff/Notification/route/action/runtime/database/environment/capability/allowlist/provider/secret/traffic effect.

Pilot-0-C4-4 staffing closure/safe-continuity test projection:

- Derivation tests MUST require acknowledged/unreplied Item, active Attention, exact matching claimant Participant plus typed claimant/assigned Caregiver role episode, and authoritative terminal role; elapsed `endsAt` counts at database time without a sweep, while nonterminal suspension does not. A temporary fence alone MUST NOT create a case. Once the claimant is terminal, Group pause and zero/family/institution/both Holds MUST NOT erase the derived case; active Institution/current Admin/owner-policy/technical gates still govern presentation/action. Open/unclaimed, replied/closed/expired/suppressed/redacted/topology-terminal, missing/ambiguous graph, wrong Group, and new role episode MUST not produce an actionable case.
- Query/presentation tests MUST prove predicate-first exact Institution access and bounded pagination. Board shows group-level counts only. Workbench shows opaque ref, local roster/Group labels, fixed state/consequence, age bucket, and action; question/reply/summary/detail, Guardian/family/contact, claimant identity, raw refs, urgency/safety, policy, runtime, and cross-Institution existence MUST fail privacy scans.
- Action tests MUST allow only exact Admin workbench `close_staffing_blocked_family_care_item` with five-minute strong confirmation and original claimed Step. Board/Chat/Caregiver/Lead/Operator/service/AI/raw-id, generic/bulk close, reassignment, reopen, reply-on-behalf, claimant edit, and driver downgrade MUST fail.
- Transaction tests MUST atomically write acknowledged -> closed, typed `claimant_role_ended_unfulfilled`, closed time/Execution, one closed Event, active -> resolved Attention with the same typed resolution reason and exact Execution, and immutable snapshots while leaving source Receipt acknowledged at commit and historical claim refs intact. The C-4 extension validator/adapter MUST accept only this complete no-reply graph and preserve immutable C-3 `replied <-> resolved`. Any Message/reply/family Receipt/care fact/Grant/Thread/assignment mutation, partial write, body cache, or use of suppressed semantics MUST fail.
- Race tests MUST cover terminal-role versus reply, closure versus redaction/Grant invalidation/Enrollment terminal/expiry/another close, exact replay versus fresh already-satisfied, same-user re-invite, and every fault/phantom/version seam. Existing permanent cascade first yields no staffing seed; staffing close first preserves Item/Event/Execution operational audit while later privacy work converges source Receipt/body/context/current projections and leaves resolved Attention body-free/non-actionable.
- Contract tests MUST add only separate `family_care_status_attention/family_care_operational_closure/family_care_item -> family_board/recent`. Any widening/reuse of `user_attention` or `guardian_relationship_attention`, C-3 candidate/hash change, unknown source/purpose/destination, protected copy, or missing extension-composition dependency MUST fail.
- Audience/recovery tests MUST cover zero/one/two commit-time Guardian roles, one owner-selected cohort-level draft with no Admin notification toggle, at most one Handoff per business effect, and stable per-recipient candidate keys `(Handoff, recipient RoleAssignment, continuity key)`. Cover claimed-Step before commit, response loss, same-Step reclaim, wrong-Step denial, duplicate/partial candidate materialization, late/new-role no backfill, expiry, owner/provider outage, dead-letter/Admin owner-only recovery, and no business compensation. Staffing close may commit under the narrow paused/Hold cleanup exception, but create and every send/retry MUST recheck exact recipient and Family/Process, active Institution/CareGroup, active nonterminal Enrollment with zero family/institution Hold, exact current/effective original Grant, retained/unredacted source, policy, Handoff/source, expiry, and gates. Grant revoke/expiry/replacement/owner-role terminal loss; Enrollment non-active/terminal/Hold; Institution/Group non-active; redaction/retention; binding/gate loss MUST terminally skip without OS push. Already-sent open rechecks the same matrix: pause/Hold is unavailable and may fresh-open after recovery only inside the original horizon; permanent loss permits only current closed shell/tombstone/unavailable.
- Family/teacher tests MUST render only generic `acknowledged + terminal/closed` family status, preserve independently authorized original family question/tombstone, hide staff identity/reason and fabricated reply, deny new Caregiver takeover/body/action, and permit at most an authorized body-free terminal group shell. Notification/provider/deep link carries id and generic copy only.
- Disable/accessibility tests MUST cover the cross-product `terminal claimant × CareGroup paused × family/institution/both Holds`: with active Institution and all other owner/policy/technical preconditions, effect-decreasing closure remains allowed and releases no Hold; inactive Institution, owner/policy outage, or technical gate denial blocks. Cover both disable orders and committed recovery with no delivery backfill; and verify bounded loading/empty/current-changed/unavailable/permission/retry states, keyboard/screen-reader confirmation, locale/font scaling, stale clearing, and body-free evidence capture.
- Planning-boundary tests MUST report C-4-4 `LOCKED / IMPLEMENTATION UNAUTHORIZED`, C-4-5 next, and no contract/source/fragment/schema/migration/Item/Event/Attention/Step/Handoff/Notification/route/action/runtime/database/environment/capability/allowlist/provider/secret/traffic effect.

Pilot-0-C4-5 cumulative adoption/evidence/qualification test projection:

- DAG tests MUST enforce a current qualified C-3 component that includes exact `platform_child_family_identity_source_v1`, then strict `C40 -> C41 -> C42 -> C43 -> C44 -> C45`. The observed My-Chat `db22de6` schema-only target, design documents, old X5/C-3 evidence, partial nodes, parallel adoption, skipped gates, mutable source, failed-test-only rerun, manual DB repair, and waiver MUST not advance state.
- Base/My-Chat/Nurture adoption tests MUST independently hash the exact thirteen C-4 ids plus every nested public C-3 source, including `platform_child_family_identity_source_v1`. `scenario_identity_invitation_coordination_source_v1` and `my_chat_identity_invitation_runtime_source_v1` MUST additionally bind the Roster-only-to-parent-bound saga and pair recovery; `nurture_institution_domain_source_v1` MUST deny any Institution-created platform/local identity path. The workflow-runtime source includes exact evidence-profile content and the evidence-authority source includes bootstrap custody/recovery. Inventing a fourteenth C-4 identity-source substitute, D complete-Pilot profile in C-4 inputs, historical/schema-only relabeling, omission/merging, undifferentiated hash, local `file:` evidence, mixed versions, generated drift, or legacy/C-3 fallback MUST fail.
- Candidate tests MUST distinguish C-4 extension and composite identities, consume the content-addressed C-3 artifact, bind deterministic recipe/order/artifact/migration/source hashes plus the exact normalized `nurture_institution_composite_evidence_v1` profile revision/content, and exclude evidence authorization/results, qualification, D/E, deployment, activation rows, environment values, provider, and traffic. Any post-freeze input change produces a new candidate and reruns affected gates. Pilot-0-D alone locks the separate complete-Pilot profile id/version into its complete candidate.
- Evidence-authority tests MUST accept only profile `nurture_institution_composite_evidence_v1` plus current exact `c4_evidence_run_authorization_v1` signed by `c4_evidence_release_controller` with issuer `my-chat.c4-evidence-release`, audience `my-chat.c4-evidence-activation.v1`, and isolated trust for one disposable composite/deployment/environment/synthetic Workspace/interval/activate-deactivate scope, plus current nested C-3 qualification. Assert exact schema/version/id/version/candidate-kind/composite/environment-class/deployment/Workspace/scenario/profile/interval/operation/issuer/audience/key/signature fields, unique current stored head, credential lineage, and runtime binding. A C-3 profile, inferred profile, fallback, or the separately D-locked complete-Pilot profile MUST fail. JI1 additionally requires a current single-business-effect `c4_bootstrap_evidence_authorization_v1` signed only by `c4_bootstrap_evidence_controller` with issuer `my-chat.c4-bootstrap-evidence`, audience `my-chat.c4-bootstrap-evidence.v1`, exact schema/id/version/composite/environment/deployment/synthetic Admin+Workspace/disposable-spec+payload+production-handler/interval/operation/issuer/audience/key/signature binding, and only `bootstrap_exact_synthetic_institution`. Test the controller's exclusive synthetic-spec ownership and non-aliasing with D's real Pilot spec. Host MUST atomically claim—not consume—one deterministic `C4BootstrapEvidenceOperationV1`; exact accepted-invitation/membership, request/command, spec, handler, principal, payload, and budget bindings are immutable. Every initial/bounded retry call MUST use fresh `C4BootstrapEvidenceClaimV1` from caller `my-chat-c4-bootstrap-evidence`, issuer `my-chat.c4-bootstrap-evidence`, audience `nurture.c4-bootstrap-evidence-claim.v1`, isolated route/verifier/nonce, and the exact stored operation/frozen hashes; wrong/replayed/cross-handler claims fail before the command fence. Test crash before call, claim-before-send, C0 commit-before-response loss, exact committed-result recovery, confirmed-no-effect bounded same-operation retry, unknown quarantine, expiry/revoke during claim, wrong binding, concurrent exact/different replay, and zero second business effect. Only `C4BootstrapExecutionStatusLookupV1` caller `my-chat-c4-bootstrap-recovery`, issuer `my-chat.c4-bootstrap-recovery`, audience `nurture.c4-bootstrap-recovery.v1`, isolated trust/fresh nonce may classify `committed|confirmed_no_effect|unknown`; it performs no business command. Committed closes/consumes, confirmed-no-effect may retry only the same current budgeted operation, unknown remains quarantined, and exact post-consume replay retrieves only original refs. Absent/expired/wrong-principal/spec/handler/Workspace, Pilot-0-D/Pilot/staging/production/activation/external scope, cross-kind/controller/store/key reuse, resolver ambiguity, or incomplete teardown MUST fail.
- Bootstrap-recovery linearization tests MUST require every initial/bounded retry claim issuance and immediate pre-dispatch check to reread current claimed authorization, accepted-invitation identity, exact Admin session/principal reauthentication, and Workspace membership/version. Membership revoke between claim preparation and dispatch or before retry permits only status lookup; an already dispatched valid attempt may commit once only inside its deadline. `confirmed_no_effect` MUST wait until all issued attempts are terminal and latest claim expiry plus skew and owner-transaction deadline have elapsed, acquire the same deterministic fence as the C0 writer, and prove the exact CommandExecution absent under that fence. Lock timeout, owner/store outage, possible in-flight work, compatible ambiguity, or one absent read MUST return `unknown`; no accepted writer may commit after confirmed no-effect. Operation status is only `claimed|committed|closed_no_effect`; separate versioned `quarantineState=clear|outcome_unknown` and `quarantineReason=status_unavailable|lock_timeout|possible_inflight|evidence_ambiguous` record ambiguity. Unknown blocks new claim/effect, evidence seal, and destructive teardown until a later lookup resolves. JI1 success MUST be `committed` with `quarantineState=clear`; negative fault runs MUST converge to `committed|closed_no_effect` with `quarantineState=clear` before C44/C45.
- Layer tests MUST require L0 integrity, L1 exhaustive conformance, L2 owner domain/DB, L3 two-database joint, L4 authenticated rendered, L5 sanitized manual, L6 three-run high-risk, and L7 rollback/closure evidence. A lower layer cannot substitute for a higher layer, direct DB setup cannot qualify a rendered journey, and every row binds one candidate/fixture/run identity.
- Journey tests MUST start every JI from a fresh isolated namespace and one blank fixture containing only disposable candidate/environment/deployment, adult accounts/sessions, synthetic Workspace, and controller prerequisites—no platform Child/Family/stewardship/membership/binding, anchor/association, or Nurture business facts. JI3 creates Family-1 and Family-2 platform pairs through real parent-owned My-Chat paths before their Institution invitations; both have no local association at acceptance. Family-1 establishes its local relationship once. Family-2 establishes it after acceptance, loses the response, exact-recovers the same result, discards/expires only the short-lived continuation context while leaving the Enrollment invitation pending, then starts a fresh continuation and explicitly selects the now-current local association. Family-3 creates both platform and local identities after acceptance. JI3 ends with exactly three platform pairs, three anchor pairs, three local child/family associations, three Enrollments, and Guardian `2+1+1`; Family-1 separately proves My-Chat membership is not Nurture role. JI4–JI8 rerun the full real prefix in fresh namespaces. Direct DB setup and invitation-free local-profile construction cannot qualify.
- High-risk tests MUST pass invitation, roster, Enrollment, anchor/binding/membership/mapping, identity-operation terminal/unknown recovery, global-revoke/local-close, merge-conflict, role, staffing, Step/Handoff, provider/open, privacy/retention/KMS/restore, source/hash/manifest/route/migration drift, stable-id/anchor leakage, and both disable orders in three consecutive fresh namespaces without retry/candidate/config change. Assert all four legal binding-resolution branches and conflicting-existing quarantine; exact association Workspace/Child/Process/Family constraints; empty-bound invisibility/reuse/quota and never-bound retirement; writer-fenced `committed|confirmed_no_effect|unknown`; no replacement while unknown; independently Guardian-entered local label with no platform-name/birth cache residue; anchor/binding/stewardship/membership/id-only denial; one Family/multiple-child isolation; Child-binding versus Family-binding versus pair-membership versus adult-membership revoke scope; same anchor W1/W2 noninterference; wrong workspace no count/existence leak; partial-operation/local-response-loss exact recovery; no auto-merge; one identity/local aggregate per operation; one business effect; at most one Handoff per claimed effect; no unauthorized content; no backfill; and complete teardown.
- Qualification tests MUST allow only `c4_qualification_controller` with issuer `my-chat.c4-qualification` to sign `c4_composite_qualification_v1` for `my-chat.c4-qualification-envelope.v1` and `c4_composite_qualification_event_v1` for `my-chat.c4-qualification-event.v1`. Seal completed evidence/final census/limitations first. Assert the envelope's exact schema/version/deterministic id/profile/composite/nested-C3 current digest/pre-seal/evidence/L0–L7/final-census/rollback/limitations/result/database-time/issuer/audience/key/signature fields and exclusion of event/deployment/D/E/activation/environment/protected data. Partition the unique-head chain by `(pilot0_c4_institution_iib_v1,c4_composite_candidate_id)`; assert every event schema/id/profile/candidate/envelope/result/predecessor/digest/reason/database-time/issuer/audience/key/signature field; CAS-append deterministic signed predecessor-free `verifying`; sign the exact envelope; CAS-append `qualified_default_off|rejected`; and require current resolver acceptance. Genesis crash/retry, changed pre-seal, duplicate/divergent head, stale predecessor, invalidation/supersession, wrong signer/issuer/audience/schema, key/store/verifier outage, nested C-3 invalidation, and ambiguity MUST fail closed without restoring a candidate.
- Exit tests MUST require every switch false, active Workspace rows `[]`, activation-evidence and bootstrap-evidence authorities consumed/revoked, JI1 bootstrap `committed` with `quarantineState=clear`, every negative bootstrap operation in `committed|closed_no_effect` with `quarantineState=clear`, activation/bootstrap-normal/bootstrap-recovery resolvers inactive, synthetic spec and credentials/environment destroyed, zero external traffic, zero `QR-P0/QR-P1`, and exact current C-3/C4 qualification resolvers. An unresolved unknown cannot enter a pre-seal or exit. Under the later locked D contract, success may emit only `C4_QUALIFIED_DEFAULT_OFF / PILOT0_D_DESIGN_LOCKED / COMPLETE_PILOT_CANDIDATE_PENDING / EXTERNAL_TRAFFIC_NO_GO`; D implementation, candidate assembly, E, ACR, Pilot-1/2, staging, production, GA, and traffic remain unproven.
- Planning-boundary tests MUST report Pilot-0-C4/Pilot-0-C as `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL_TRAFFIC_NO-GO` and Pilot-0-D as `PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING / EXTERNAL_TRAFFIC_NO_GO` only with the recorded `DR-P0=0 / DR-P1=0 / DR-P2=0` rereviews plus passing context/governance/pin gates. They MUST report every implementation/candidate/E/Pilot-1 effect as separately unauthorized and prove zero C30-C45/candidate/qualification/product-source/schema/runtime/database/environment/capability/traffic effect from this decision work.

Multi-turn behavior:

- Same-conversation turns may reuse a short-lived `NurtureInteractionContext` to recover pending intent, candidate targets, and clarification state.
- `NurtureInteractionContext` is an interaction cache, not an authorization result. It must expire and may become stale when role, grant, object, message, item, or child scope state changes.
- If the user opens an old My-Chat conversation, My-Chat may pass `hostConversationRef` and a Nurture-issued continuation token if it still has one; Nurture may try to restore pending context, but must classify it as current, stale, revoked/closed/redacted, ambiguous, or unsafe before continuing.
- If the user starts a new conversation later, My-Chat does not need to pass old chat context. Nurture may recover candidates from enabled Nurture source adapters, such as nonterminal family-care items, current attention items, and active family threads, then ask clarification when multiple targets are plausible.
- Every render, action, and write must re-resolve participant, role assignment, child scope, grant state, policy, and current object state. Conversation refs and interaction context can restore intent, but cannot skip resolver or policy.

#### IIA-0-C3 Workflow-Mediated Family Conversation Contract

**Status:** LOCKED on 2026-07-10.

**Decision:** Different Nurture roles do not communicate through a direct role-to-role chat channel. Family and institution inputs enter Nurture workflows, and Nurture distributes audience-specific messages from workflow facts. The family experience remains conversation-shaped and child-private; the teacher experience remains workflow-shaped and class-aggregated.

Product surfaces:

- Family surface: one child-private conversation timeline that can include free-text/attachment family input, receipts, clarification requests, caregiver-confirmed responses, care outcomes, and daily-care summaries. Multiple authorized guardians/caregivers may participate, but the surface is organized around one `childCareProcessId`, not an unrestricted cross-role room.
- Teacher surface: `class_family_inbox`, attention board, and child-scoped work details. Teachers acknowledge, accept, request clarification, record outcomes, close items, and record daily care through workflow actions; teachers are not required to monitor or reply inside ten direct chat rooms.
- My-Chat main chat: provides one role-agnostic adult entry point, decides whether to invoke Nurture, carries the Surface Contract envelope, and renders the structured Nurture scenario response. My-Chat does not infer a Nurture role or propagation direction.
- My-Chat scenario dashboard/board: is already bound to Nurture and renders generic Nurture presenter output for the validated role/work scope. It requires no Nurture-specific host business handling and no handoff merely to display committed content.
- My-Chat activation surfaces: notification, push, unread/badge, notification center, and deep link consume optional opaque activation handoffs. My-Chat does not become the communication source of truth.

Canonical and projection rules:

- Family-authored input is persisted as `NurtureFamilyCareMessage` and becomes workflow input; it is not directly delivered into a teacher chat inbox.
- `NurtureFamilyCareItem`, `NurtureFamilyCareItemEvent`, and `NurtureDailyCareLog` remain the source of truth for teacher work state and care outcomes.
- A family-facing workflow response is persisted as a canonical `NurtureFamilyCareMessage` linked to its source item/event/log. The message is the communication record, but it must not become the source of truth for item/log state.
- The family timeline is a presenter projection over canonical messages plus safe receipt/outcome state. It may look like a one-to-one/group conversation, but every cross-role message is mediated by Nurture workflow and policy.

Authorship and trust rules:

- Family-authored content is attributed to the actual guardian participant.
- Content shown as authored by a named caregiver MUST come from a caregiver-confirmed workflow action. The later C-3-0e decision supersedes the earlier AI-draft allowance for Pilot-0: protected AI is OFF, the caregiver manually composes in the protected composer, and AI cannot read, draft, or publish the body.
- Deterministic system/institution status messages MUST be labeled as system/institution output and MUST NOT impersonate a caregiver.
- Routine items use structured actions plus an optional short caregiver note. `family_care_question` may allow a fuller caregiver-confirmed response. Clarification requests should use structured fields/options with an optional short explanation.
- Every family-facing workflow message MUST be traceable to its source family input, item/event, daily-care log, or explicit human confirmation action.

Write and delivery boundary:

- A teacher command does not directly append arbitrary text to a family thread. It first validates and commits the Nurture business transition.
- The Nurture transaction MUST atomically persist the business mutation, item/log event, family-facing canonical message/visibility, and Nurture idempotency/receipt facts required for retry and audit. When the target Nurture surface is readable at commit, the logical receipt may be `delivered` immediately.
- Main-chat feedback returns through the structured scenario response, and dashboard/board visibility returns through Nurture presenters; neither uses a handoff as the normal result path.
- Optional My-Chat-owned activation delivery occurs after the Nurture transaction through an idempotent handoff with opaque refs. A push/notification/deep-link failure must not erase or downgrade the committed Nurture work fact, family conversation record, visibility, or logical receipt.
- Cross-role distribution and every later deep-link render MUST re-check current grant/runtime fence, role/scope, message lifecycle, and exposure policy. A blocked future delivery leaves an auditable Nurture receipt/event rather than silently disappearing.

Verification implications:

- Tests MUST prove that family input creates workflow work instead of a direct teacher chat delivery; teacher actions create traceable family-facing messages; system text cannot impersonate a caregiver; and one class work surface serves the exact three Pilot child-private family timelines. A ten-timeline run is separate non-qualifying scale coverage.
- Tests MUST prove Nurture work/message persistence is independent from My-Chat notification success, and retry/replay cannot duplicate a workflow action or family-facing message.

#### IIA-0-R1 Resolver Output Consumers

**Status:** LOCKED on 2026-07-08.

**Decision:** Resolver output is a Nurture-internal context contract. My-Chat must not consume `participantId`, `roleAssignmentId`, `childCareProcessId`, `policySeed`, or other resolved Nurture refs for business decisions. My-Chat receives only the final scenario response produced by Nurture presenters.

Primary consumers:

- Capability handler / scenario orchestrator: routes `resolved`, `needs_clarification`, and `blocked` resolver results into the next Nurture step.
- Policy engine: consumes resolved actor/scope/object refs plus `policySeed` to produce structured allow/deny/redaction decisions.
- Query/projection services: constrain reads to the resolved child, family, care group, institution, thread, item, log, or media scope.
- Command / workflow action services: use resolved context as a write candidate, then require policy and write preconditions before mutating state or triggering workflow.
- Presenter: combines resolved context, policy decision, query/command result, and safe UI state into the response returned to the My-Chat shell.
- Interaction context manager: stores short-lived pending intent, candidates, clarification state, or draft/action refs for multi-turn Nurture interactions.

Boundary rules:

- Resolver output does not directly authorize writes. Writes must pass policy and command-specific preconditions.
- Resolver output is not a host API contract. My-Chat can pass opaque refs and receive rendered scenario responses, but it must not branch on Nurture internal ids or policy seeds.
- Resolver output normalizes untrusted My-Chat hints once for Nurture internals, so downstream Nurture modules do not repeat host-hint parsing.
- `needs_clarification` and `blocked` are first-class outputs, not errors. They are consumed by presenters and interaction context management to produce safe next states.

#### IIA-0-R2 Resolver Context Shape

**Status:** semantic contract locked on 2026-07-09; persistence carrier locked on 2026-07-12.

**Decision:** Resolver output is organized into three context layers: `actor`, `workScope`, and `target`. `childCareProcessId` is required for child-specific action/write contexts, but it is not required for every resolved teacher or institution collection work surface.

Context layers:

- `actor`: the current My-Chat user as a Nurture participant, plus the resolved or selected `roleAssignmentId`, `roleKind`, role assignment status, and role scope.
- `workScope`: the current Nurture work surface scope, such as `child_process`, `family`, `care_group`, or `institution`.
- `target`: the optional concrete object being acted on or displayed, such as a thread, message, item, daily care log, media asset, media attribution, grant, enrollment, or child care process.

Scope rules:

- `resolved` means actor and work scope are resolved. It does not always mean a child target is selected.
- Teacher board and class inbox entry may resolve to `care_group` work scope first. The downstream query must constrain child rows through active enrollment, role scope, and policy.
- Institution admin surfaces may resolve to `institution` or `care_group` work scope first. Institution admin is still not ambient access to all child details.
- Child-specific writes, replies, shares, daily logs, receipts, workflow events, and media attribution confirmation require a concrete `childCareProcessId` before command execution.
- Target object resolution must include current lifecycle state such as `active`, `closed`, `redacted`, `stale`, or `unavailable`.

Result states:

- `resolved`: actor and work scope are usable by Nurture internals; target may be absent for collection surfaces.
- `needs_clarification`: resolver found multiple plausible roles, child scopes, targets, or memory matches; presenter should ask a safe clarification and interaction context may store candidates.
- `blocked`: resolver cannot produce a usable context because participant, role, scope, object, grant/runtime fence, or lifecycle state fails closed.

#### IIA-0-R3 Resolver Input Envelope

**Status:** LOCKED on 2026-07-09.

**Decision:** Resolver input is a host invocation envelope, not a Nurture business-context envelope. My-Chat provides authenticated caller identity, surface, conversation continuity refs, current payload, generic display state, Nurture-issued opaque scenario tokens, and idempotency keys. My-Chat does not provide target, work scope, role assignment, grant, data class, direction, or policy facts.

Trusted host facts:

- `myChatUserId`: the authenticated My-Chat user.
- `workspaceId`: optional host-adapter fact when available; mobile client code should not be required to know it.
- `scenarioKey`, `surface`, `hostRequestId`, `submittedAt`, `locale`, `timeZone`: request and shell facts. These facts guide routing and presentation but do not grant Nurture scope.

Allowed host-provided inputs:

- `conversation`: `hostConversationRef`, `hostTurnId`, and `previousTurnRef` for chat continuity only.
- `event`: one of `chat_message`, `surface_open`, `scenario_token_event`, `form_submit`, or `notification_open`.
- `payload`: current text, structured payload, form data, and host attachment refs.
- `scenarioToken`: opaque token generated by Nurture. MVP supports only `clarify`, `submit_action`, and `open_notification`.
- `displayState`: generic shell state such as selected tab, filters, sort, pagination, and client-local context.
- `idempotency`: `hostRequestId`, `clientMutationId`, and `attemptKey` for duplicate suppression.

Forbidden host-provided business inputs:

- `targetRef`
- `workScopeHint`
- `selectedRoleAssignmentId`
- `childCareProcessId`
- `familyId`
- `careGroupId`
- `institutionId`
- `grantId`
- `dataClass`
- `direction`
- `policyDecision`
- `canView` / `canWrite`

Scenario token rules:

- Scenario tokens are issued by Nurture and are opaque to My-Chat.
- My-Chat may hold and return the token in bounded surface/client interaction state but must not inspect, modify, or branch on the token contents. Notification delivery never durably stores raw token material.
- MVP tokens are opaque Nurture DB handles, not signed business payloads.
- MVP supports `clarify`, `submit_action`, and `open_notification` only. `select_scope` is folded into `clarify`; `continue` uses `hostConversationRef` + `NurtureInteractionContext`; `resume_draft` is post-MVP.
- The token record may reference candidate role, work scope, target, pending action, delivery, or clarification refs, but those refs become usable only after Nurture resolves and validates them.
- Tokens must store purpose, issuer/audience, expiry, state, and enough replay/idempotency metadata for Nurture to reject stale or mismatched usage.
- Token resolution never bypasses participant, role, work scope, child scope, grant/runtime fence, policy, or object lifecycle checks.

#### IIA-0-R4 Ambiguity Handling

**Status:** LOCKED on 2026-07-09.

**Decision:** Resolver ambiguity handling uses typed candidates and deterministic precedence. Resolver may auto-resolve only when the candidate is unique, current, reachable, and safe for the requested invocation. Ambiguous role, work scope, target, intent, or memory matches return `needs_clarification`; revoked, forbidden, redacted, stale-unsafe, or scope-invalid cases return `blocked`.

Ambiguity types:

- `role`: the same My-Chat user has multiple active Nurture roles.
- `work_scope`: the participant can access multiple children, families, care groups, or institutions.
- `target`: the current input may refer to multiple threads, messages, items, logs, media assets, attributions, grants, or enrollments.
- `intent`: the current payload maps to multiple business intents, such as one-day care note versus long-term care constraint.
- `memory`: business memory retrieval returns multiple plausible recent contexts.

Candidate precedence:

1. Valid `scenarioToken` that belongs to the current user, surface, purpose, and invocation.
2. Active `NurtureInteractionContext` for the same conversation and non-stale pending intent.
3. Explicit payload semantics, such as child nickname, class label, date, item keyword, or structured form field.
4. Surface defaults, such as only one accessible child, one teacher care group, or one admin institution.
5. Nurture business memory through enabled source adapters, such as a nonterminal family-care item, current attention item, or active family thread.

Auto-resolution rules:

- Actor must resolve to one active participant.
- Role and work scope must be legal for the surface and invocation.
- Child-specific action/write must resolve one `childCareProcessId`.
- Target, when present, must be unique, reachable, current, and lifecycle-compatible.
- Grant/runtime fence and policy precheck must not have a known blocker.
- There must not be multiple plausible candidates in the same deterministic match class.

Clarification rules:

- Return `needs_clarification` when multiple safe candidates remain or when intent is under-specified.
- Do not expose internal ids in clarification prompts or options.
- Store candidate refs only in Nurture-owned interaction context or Nurture-issued tokens.
- My-Chat may ask the user only by rendering the structured interaction request produced by Nurture.

Blocked rules:

- Return `blocked` when no active participant exists, token ownership/purpose/surface fails, role is revoked, scope is unreachable, target is redacted/unavailable, enrollment/grant/runtime fence blocks the action, or continuing would require expanding permissions.
- Do not downgrade forbidden, revoked, or redacted states into clarification.

#### IIA-0-R5 Structured Clarification Interaction

**Status:** LOCKED on 2026-07-09.

**Decision:** `needs_clarification` must return a structured My-Chat interaction request, not a long prose answer. Nurture owns the business question, candidate generation, safe labels, validation rules, option tokens, and continuation token. My-Chat renders generic choice/form/input primitives and returns opaque option tokens or form values.

Clarification response shape:

```text
type: needs_clarification

scenarioToken:
  token
  purpose: clarify
  expiresAt

interaction:
  kind: single_choice | multi_choice | confirm_cancel | form | text_input | date_time | attachment_picker
  title?
  description?        # optional and short
  options?:
    optionToken
    label
    description?
  fields?:
    fieldKey
    label
    type: text | textarea | number | date | time | select | multi_select | boolean
    required?
    options?:
      optionToken
      label

safeState:
  reasonCode
  canSkip?
```

Interaction rules:

- My-Chat renders the structure but must not generate business candidates or interpret option tokens.
- Options and fields must use safe short labels, such as child display name, class display name, or human-readable item summary.
- Options must not include `childCareProcessId`, `roleAssignmentId`, `itemId`, or other Nurture business ids.
- User responses return `scenarioToken` plus `optionToken`, field values, attachments, or free text.
- Nurture resolves the response, rechecks participant, role, scope, grant/runtime fence, policy, object lifecycle, and command preconditions, then continues or returns another structured clarification/blocked state.

#### IIA-0-R6 Scenario Token MVP TTL and Staleness

**Status:** LOCKED on 2026-07-09.

**Decision:** Scenario token MVP is an opaque Nurture DB handle with limited purposes: `clarify`, `submit_action`, and `open_notification`. Token TTL/staleness must be robust enough for resolver safety, but MVP must avoid building a general-purpose token platform.

MVP token record:

```text
id
workspaceId
participantId
purpose: clarify | submit_action | open_notification
surface
tokenHash
tokenHashVersion: 1
hostConversationRefHash?
payloadSchemaVersion
statePayload
status: active | consumed | revoked
expiresAt
consumedAt?
revokedAt?
version
createdAt
updatedAt
```

- One row is the complete Nurture-local carrier for one issued token; MVP adds no separate scenario-token table.
- Raw token, raw host conversation id, and raw My-Chat invocation/command ids are not persisted. Token and optional conversation bindings use namespaced hashes.
- `statePayload` is validated by `purpose + payloadSchemaVersion`; it is not arbitrary cross-purpose JSON.

MVP classification:

- `current`: token exists, is active, unexpired, and matches user, purpose, surface, and optional conversation constraints.
- `expired`: persisted status may still be `active`, but token is past `expiresAt`; no status-migration job is required.
- `recoverable`: token cannot be used directly, but Nurture can safely regenerate candidates or a new clarification from current business facts.
- `blocked`: token is missing, consumed, revoked, mismatched, replayed, or points to a now-forbidden/revoked/redacted/closed context.

Persisted lifecycle versus resolver classification:

- Persist only `active`, `consumed`, and `revoked`. Expiry is derived from required `expiresAt`; `current`, `expired`, `recoverable`, and `blocked` are resolver response classes, not database states.
- Valid `clarify` and `submit_action` use optimistic `version` to consume an active context. If clarification continues, Nurture creates a new context/token rather than mutating the consumed candidate set into a new interaction.
- `open_notification` is reusable and is not consumed by a read; it remains bounded by expiry, revoke, participant binding, and current owner checks.
- A multi-turn `submit_action` derives its stable B2 `commandRequestId` from internal context id + purpose. A consumed token with an exact committed Execution may return replay safely; direct single-turn commands continue to reuse `invocationRequestId` where appropriate.

Purpose payload rules:

- `clarify`: pending intent, complete candidate paths, and hashed option-token mappings to candidate refs.
- `submit_action`: command key, target refs, expected versions, prepared action schema/hash, and immutable content/attachment refs.
- `open_notification`: Nurture locator refs for the current source/Receipt/Item/Message.
- No purpose payload stores bodies, target-account/device lists, cached authorization decisions, model output copies, or host retry/attempt state.

Purpose rules:

- `clarify`: short TTL; may return a new structured clarification when expired or recoverable.
- `submit_action`: short TTL; one-time or idempotency-bound. Expired, consumed, or changed-state submissions should usually return `blocked` or require reopening the action.
- `open_notification`: longer TTL; token is a locator only. Opening always rechecks delivery/object state and may return current content, updated/unavailable state, structured clarification, or `blocked`.

Responsibility split:

- My-Workflow-Base MAY define a reusable opaque continuation field, generic structured-interaction request/response shape, workspace/actor/purpose/TTL/replay/revalidation invariants, and cross-scenario conformance tests. It MUST NOT own a central token service, shared token table, scenario candidate payload, or authorization decision.
- My-Chat renders generic choice, form, confirm, text/date/attachment input, and unavailable/retry primitives, then returns `scenarioToken`, `optionToken`, and field values unchanged. It MUST NOT inspect token purpose, decode candidates, derive target refs, or branch on scenario policy.
- Nurture owns `NurtureInteractionContext` persistence, purpose-specific TTL/consume/recovery policy, candidate/action/notification refs, participant/scope/target bindings, current-state revalidation, command binding, and safe presenter output.
- Ordinary new chat turns use resolver/business-memory recovery. Ordinary Nurture dashboard reads use the explicit scenario surface and presenter. A token is issued only when clarification, a prepared action, or a notification target must survive a request boundary; it is not a general Nurture object-access token.
- Education may later bind the same protocol to student/assignment/grade actions and ERP to organization/document/approval actions, but those scenarios own different tables, payloads, authorization, TTL values, and recovery rules.
- MVP implements the contract locally in Nurture. Hash/TTL/consume/revoke mechanics MAY move to a shared scenario SDK only after a second scenario proves the same behavior. Extraction never moves scenario persistence or business policy into My-Chat/My-Workflow-Base.

MVP staleness implementation:

- Do not implement full object version vectors in MVP.
- Resolve the token record, load referenced Nurture objects, and query current participant, role, scope, grant/runtime fence, target lifecycle, policy, and command preconditions.
- Use current-state checks to decide `current`, `recoverable`, or `blocked`.
- `recoverable` should be conservative in MVP and mainly used for `clarify` and safe notification recovery. `submit_action` should fail closed unless a command-specific idempotency rule explicitly allows retry.

Post-MVP:

- Signed payload tokens.
- Full object version vectors.
- General `continue`, `select_scope`, and `resume_draft` token purposes.
- Long-lived draft recovery and cross-device continuation.
- Detailed stale reason taxonomy beyond MVP resolver/presenter needs.

#### IIA-0-R7 Business Memory Retrieval

**Status:** LOCKED on 2026-07-10.

**Decision:** Implement business memory retrieval as a thin reusable scenario-resolver kernel plus Nurture-owned source and policy adapters. Business memory retrieval is a bounded query over current Nurture canonical facts; it is not My-Chat transcript memory, a generic AI/vector memory platform, an authorization result, or a command trigger.

Architecture and reuse:

- The host-neutral kernel owns candidate merge/deduplication, deterministic ordering, ambiguity decisions, and the generic `resolved` / `needs_clarification` / `blocked` result flow.
- Nurture adapters own canonical-fact queries, participant/role/scope/enrollment/grant/lifecycle filtering, policy prechecks, Nurture intent compatibility, and safe clarification presentation.
- My-Chat continues to provide only the host invocation envelope and render the final scenario response. My-Chat must not run source adapters or interpret candidate refs.
- The generic contract is implemented locally in Nurture first. Extraction into My-Workflow-Base or a shared scenario SDK requires a second scenario to prove the same contract; R7 does not add a premature cross-repository runtime dependency.
- `NurtureInteractionContext` remains the higher-precedence source for short-lived same-conversation continuity. Business memory primarily supports new conversations, expired interaction context, and explicit continuation language.

Retrieval source registry:

| Source class | MVP objects | Resolver role |
| --- | --- | --- |
| Eligibility facts | `NurtureParticipant`, role assignment, child care process, enrollment, grant; thread participant only as a non-authorizing listing locator | Authoritative facts filter candidates. ThreadParticipant may narrow an already-authorized listing projection but can never grant or deny read/write authority, create/rank a candidate, or replace current Role/Enrollment/Grant policy. |
| Work candidates | `NurtureFamilyCareItem`, `NurtureTeacherAttentionItem`, `NurtureFamilyCareThread` | Produce complete role/scope/target/intent resolution-path candidates. |
| Retrieval evidence | message metadata, item/attention/thread safe summaries, category, data class, date, current payload semantics | Explain or match a candidate; do not become an independent target by default. |

MVP source adapters:

- For the Pilot `family_care_question` capability, the later C-3 contract supersedes the original R7 shorthand. `family_care_item` current candidates are exactly nonterminal `open|acknowledged` items that remain current and reachable. `replied|suppressed` are terminal and may appear only through the current owner presenter's `recent|history` views. `followed_up|waiting_for_family|continue|second_reply` are unregistered and MUST NOT be returned as current candidates or actions. A future capability may add a separately versioned source profile but cannot silently widen this one.
- `teacher_attention_item`: query current `active` attention items. If an attention item has an actionable backing source, normalize and deduplicate to that backing target rather than returning both objects as separate work candidates.
- `family_care_thread`: for this Pilot capability, an active thread may locate/read the current Item shell or history context only; it MUST NOT advertise continuation, follow-up, or reply for a terminal Item. `NurtureFamilyCareMessage` does not receive a standalone MVP source adapter; body-free metadata may locate the exact thread/item, and any safe summary is constant/generic rather than body-derived. A Message becomes a target only when the current invocation explicitly identifies that message under its own action contract.
- `NurtureDailyCareLog` and `NurtureChildMediaAttribution` adapters are registered when their corresponding capability increment is implemented. Stable care constraints/profile facts remain eligibility/context evidence unless a capability defines an explicit actionable object.

Reusable internal candidate contract:

```text
ResolutionCandidate
  candidateKey
  actorBindingRef
  scopeRef
    kind
    id
  targetRef?
    objectType
    objectId
    lifecycleState
  intentKey
  sourceKey
  stateClass: actionable | active_context | recent_context
  matchClass: exact_entities | exact_topic_or_date | explicit_continuation | weak_recent_context
  evidenceCodes[]
  occurredAt?
  dedupeKey
```

Candidate rules:

- One candidate MUST describe one complete actor-binding -> scope -> optional child/target -> intent path. Resolver MUST NOT independently rank fragments and later combine a role from one candidate with a target from another.
- The reusable kernel must not hardcode `childCareProcessId`, `careGroupId`, or Nurture object types. Nurture adapters specialize `actorBindingRef`, `scopeRef`, and `targetRef` with Nurture refs.
- Candidates are transient Nurture-internal values. `candidateKey` and business refs must not leave Nurture; clarification uses opaque option tokens backed by interaction context/scenario token state.
- Safe labels are loaded by the Nurture presenter after policy checks. Candidate evidence must not become a shortcut for exposing raw message content or sensitive facts.

Deterministic ranking and ambiguity:

1. Nurture adapters MUST hard-filter current participant, role assignment, reachable scope, child process, enrollment, grant/runtime fence, target lifecycle, and policy precheck before candidates enter the kernel.
2. Candidate intent and capability MUST be compatible with the current invocation.
3. Rank `matchClass` as `exact_entities` -> `exact_topic_or_date` -> `explicit_continuation` -> `weak_recent_context`.
4. Within the same match class, rank `stateClass` as `actionable` -> `active_context` -> `recent_context`.
5. Source-specific lifecycle state and `occurredAt` may order otherwise equivalent candidates for presentation.
6. Stable ids MAY make presentation order repeatable, but MUST NOT turn a semantic tie into an auto-resolved candidate.
7. `weak_recent_context` MUST NOT auto-resolve. Recency alone, urgency, priority, or due time MUST NOT select a role/child/target unless the current invocation explicitly asks for that dimension.
8. Resolver may auto-resolve only one unique, current, reachable, safe, intent-compatible candidate. Multiple plausible candidates return structured `needs_clarification`.

Cost and complexity gates:

- MVP MUST NOT add a business-memory table, vector database, embedding pipeline, generic rule DSL, Redis dependency, or candidate cache.
- Retrieval MUST reuse current canonical tables and indexed fields through bounded source queries. Source queries MAY run in parallel.
- Retrieval MUST NOT add a dedicated model call. If current-input intent interpretation already exists, source adapters MAY reuse its typed output; deterministic selection cannot depend on a model confidence score.
- Candidates are not persisted except for the minimum refs already required by `NurtureInteractionContext` or scenario-token clarification state.
- Per-source, aggregate-candidate, and rendered-option limits are configurable runtime limits, not schema invariants. If plausible candidates exceed the safe rendered-option limit, Nurture asks for a discriminating child/date/topic field instead of silently truncating candidates.

Verification implications:

- Kernel tests MUST be table-driven and cover merge/deduplication, ranking, semantic ties, `weak_recent_context`, stable ordering, and limit-driven narrowing.
- Adapter tests MUST prove eligibility facts only filter, revoked/unreachable/redacted sources never become candidates, attention backing targets deduplicate, messages remain evidence by default, and no extra model/storage dependency is required.

#### IIA-0 Cross-Cutting Model Execution and Cost Posture

**Status:** LOCKED on 2026-07-11.

Current product priority is usability and reliability. Cost is an architectural dimension to observe and preserve optimization options for, not an MVP command gate.

- IIA MUST NOT introduce fixed per-turn model-call, token, or monetary limits that reject normal Nurture work or reduce correctness merely to meet a cost quota.
- Runtime deadlines, cancellation, recursion/loop protection, and overload controls MAY bound execution for reliability. Those controls are not product cost budgets.
- My-Chat owns generic conversation continuity and transport refs. Nurture owns scenario context assembly, child-scoped business memory, derived summaries, pending interaction state, and model-purpose decisions.
- Nurture context packs and derived memory MUST be purpose/scope/version aware. Authorization and Execute-time preconditions MUST NOT rely on a cached context pack.
- Infrastructure retry, command replay, handoff retry, and physical recipient/device fan-out MUST NOT accidentally repeat completed model work. A repeated invocation is valid only when the semantic work unit or its relevant input/context/model/prompt version changed.
- One source action MAY legitimately require multiple model rounds or multiple child-specific semantic artifacts. Architecture MUST trace those invocations to the turn, command/run, purpose, context refs/versions, model/prompt version, latency, and token usage so later optimization is evidence-driven.
- Scenario output SHOULD be structured for My-Chat rendering. A separate model call MUST NOT be required merely to convert the same accepted scenario result into chat, mobile, form, or notification transport shapes.
- Model choice, context compression, cache policy, and invocation reuse MUST remain replaceable runtime policies. MVP does not require a generic cache, vector, or memory platform before measured usage justifies one.

This decision does not expand R7. Resolver recovery remains deterministic and has no dedicated model call, cache dependency, vector pipeline, or generic memory store. The cost-aware model/runtime concern begins only after resolver output enters scenario context assembly and capability processing.

#### IIA-0-R8 Command Write Preconditions

**Status:** LOCKED on 2026-07-12 after B1, B2, and B3 closure.

Command write preconditions are the authoritative submit-time checks after resolver and policy prechecks. R8 separates internal business-fact writes from cross-role distribution, uses a prepare/execute flow, and requires current-state checks inside the Nurture transaction. The R8-B1 through R8-B3 sections close the durable handoff, command execution, routing/clarification, lifecycle, and recovery blockers.

Command effect classes:

| Effect class | Meaning | Example |
| --- | --- | --- |
| `internal_fact` | Writes Nurture-owned work/care facts without automatically exposing them to another role. | Record daily care; confirm internal media attribution. |
| `cross_role_distribution` | Distributes an existing Nurture fact across role workflows. | Route family input to institution; share daily care to family. |
| `composite_workflow_action` | Atomically changes a Nurture workflow fact and creates the required canonical message/distribution intent. | Acknowledge an item; request clarification; answer a family question. |

The effect class describes writes, not authorization. Each command must declare explicit source-access and distribution grant dependencies. For example, acknowledging a family-derived item is an internal item transition but still depends on the current `family_to_org` grant/runtime fence.

Prepare/execute boundary:

```text
Prepare
  resolver -> payload validation -> policy precheck
  -> immutable action payload/hash -> submit_action token

Execute
  token/idempotency validation -> resolver + policy
  -> begin Nurture transaction
  -> reload actor/scope/enrollment/grant/target/version
  -> common guards -> command-specific transition guards
  -> persist mutation + event + canonical message/visibility + logical receipt
  -> commit -> structured scenario response
             + optional opaque/idempotent My-Chat activation handoff
```

`ready` is an internal transaction-time precondition result and must never be cached as authorization. Business preconditions, persisted business outcome, and response replay disposition are separate contracts:

```text
PreconditionDecision:
  ready | invalid | blocked | conflict

CommandBusinessOutcome:
  applied | already_satisfied

CommandResponseDisposition:
  executed | replayed
```

- `replayed` means the same idempotency identity and payload already committed; it is a response disposition, not a persisted business outcome.
- `already_satisfied` means another valid command already produced the requested business state.
- `conflict` means current object/version state requires refresh or a new prepare/confirmation flow.
- `needs_clarification` is not a command outcome. Actor/scope/target ambiguity returns to resolver; a long-running family clarification is a separate durable business workflow.

Original robustness blockers (contractually closed by B1-B3; implementation gates remain in the later R8 sections):

1. **R8-B1 durable host activation handoff:** Committed Nurture content is returned through scenario response/presenter paths and does not depend on a handoff for visibility. When a command also requests a My-Chat-owned notification, unread/badge, or deep link, a crash after Nurture commit but before My-Chat outbox acceptance can still lose that activation request. B1 requires an at-least-once, idempotent host activation handoff; cross-database exactly-once is not an MVP goal.
2. **R8-B2 durable command idempotency and concurrency:** Grant-receipt uniqueness covers only distribution. Internal item/log/media commands require a shared Nurture command-execution record or equivalent durable uniqueness, payload-hash mismatch rejection, result replay, and enforced `aggregateVersion`/conditional update behavior.
3. **R8-B3 durable routing and family clarification state:** Family input needs a visible routing lifecycle distinct from canonical message lifecycle. Teacher clarification may span hours/days and cannot live in `NurtureInteractionContext`; item status/event or a dedicated clarification object must represent pending/answered/expired/cancelled state and correlation.

R8-B1 current host evidence:

- My-Chat `workflow-contracts` already defines `HandoffRequestInput`, `HandoffReceiptInput`, `WorkflowHandoffResult`, `workflow.handoff.requested`, `workflow.handoff.receipt_recorded`, and refs-only/no-body event payloads.
- My-Chat `workflow-runtime` already exposes `WorkflowHandoffService`, `HandoffLedgerRepository`, public handoff route metadata, the internal receipt route, and `WorkflowRuntimePort.complete_step(...event_drafts)` for same-host-transaction workflow event persistence.
- My-Chat does not yet contain a concrete handoff-ledger repository implementation, and `@my-chat/outbox` does not yet register `workflow.handoff.*` event types. The current runtime is a contract/service shell, not a complete durable B1 path.
- The current Nurture `create_handoff` adapter returns a synthetic requested result, and `createNurtureScenarioModule` injects only `WorkflowRuntimePort`. B1 therefore requires a host-owned durable handoff port/implementation before institution delivery can be production-ready.

R8-B1-A logical delivery ownership is locked, with the initial-pending rule corrected by B1-B:

- Nurture MUST use `NurtureChildLinkReceipt` as the durable logical distribution lifecycle; MVP does not add a separate `NurtureDistributionIntent` table or a Nurture-owned generic handoff/outbox runtime.
- The source business fact/message/visibility and its logical receipt(s) MUST commit in one Nurture transaction. If the target Nurture surface is readable at commit, the receipt MAY be created/finalized directly as `delivered`.
- `pending` is reserved for incomplete Nurture-owned release work such as confirmation, review, scheduled publication, redaction, or target resolution; it MUST NOT wait on My-Chat activation acceptance or physical delivery.
- A receipt represents one logical target scope such as a family or care group. My-Chat owns account/device/channel fan-out and physical delivery receipts.
- Nurture receipt states remain business-facing (`pending`, `delivered`, `read`, `acknowledged`, `blocked`, `failed`, `revoked_after_delivery`) and MUST NOT mirror My-Chat handoff acceptance, queue, retry, or notification-channel states.
- My-Chat Handoff Ledger and Notification may retain canonical receipt refs and transport correlation, but they do not decide whether the Nurture distribution should exist.
- My-Chat activation failure does not change the Nurture receipt state.

R8-B1-B ingress/result/activation ownership remains locked, with surface entitlement refined by Pilot-0-B3-0:

- My-Chat Chat is a role-agnostic Nurture entry only for Chat-entitled guardian/caregiver roles. Institution-admin Nurture work enters through institution board/workbench. My-Chat selects the scenario; Nurture resolves surface entitlement, actor role, work scope, target, business intent, and propagation direction.
- A read/clarification turn returns a structured Nurture scenario response. A confirmed write uses the durable Prepare/Execute command path, then returns command/result refs plus scenario response.
- Nurture dashboard/board content is read through generic scenario presenter contracts and does not require `workflow.handoff.*`.
- Handoff is reserved for optional host activation capabilities such as notification, push, unread/badge, notification center, and deep link. Business distribution direction and activation-handoff direction are independent.
- B1-C must define the typed activation draft and host transaction that materializes My-Chat Handoff Ledger + outbox without allowing a scenario handler to author `workflow.handoff.*` directly.

R8-B1-C1 activation source authority is locked:

- An activation handoff MUST reference the existing canonical source owner. A normal Nurture message, item, care log, notice, or logical receipt MUST use a Nurture `DomainContextRef`; it MUST NOT be copied into a Workflow Artifact merely to satisfy a handoff input type.
- A Workflow Artifact remains appropriate when the artifact itself has independent workflow meaning and lifecycle, such as a generated report/summary that needs preview, approval, exposure-level control, publication, or knowledge handoff.
- A handoff MAY reference both an actual Workflow Artifact and Nurture context refs. For example, a weekly-care-summary artifact identifies what the user should inspect while a `NurtureChildLinkReceipt` context ref identifies the logical target/release relationship.
- My-Chat persists only the host handoff and opaque refs. Its activation consumer MUST reread Nurture for current source lifecycle, authorization/runtime fence, target account resolution, display-safe activation content, and deep-link presentation.
- My-Workflow-Base `HandoffManifest` currently declares only `source_artifact_types`. The reusable contract SHOULD add optional `source_context_ref_types` entries (`namespace` + `object_type`) and validate draft refs against the declared artifact/context source types.
- Nurture institution activation initially needs context-source declarations for `child_link_receipt`, `family_care_message`, and `family_care_item`; later care-log/notice source types must be added only with their capability increments.
- B1-C2 must converge the generic snapshot/draft key and replay contract before B1-C3 locks host transaction materialization.

R8-B1-C2 generic handoff snapshot and replay contract is locked:

```ts
type ScenarioHandoffRequestSnapshot = {
  requestId: string;
  handoffKey: string;
  requestedPurpose: string;
  sourceContextRefs?: DomainContextRef[];
  sourceArtifactRefs?: CanonicalRef[];
  expiresAt?: string;
};

type WorkflowHandoffDraft = {
  draft_key: string;
  handoff_key: string;
  requested_purpose: string;
  source_context_refs?: DomainContextRef[];
  source_refs?: CanonicalRef[];
  expected_versions?: Record<string, number>;
  expires_at?: string;
};
```

Snapshot ownership and persistence:

- `ScenarioHandoffRequestSnapshot` is a shared contract shape, not a shared database table. Each scenario MUST persist its snapshot(s) in the same scenario-owner transaction as the command result that requested the handoff.
- Nurture stores the bounded snapshot list in required `handoffRequestSnapshotsPayload` JSON on the same immutable `NurtureCommandExecution` row, with required `handoffSnapshotSchemaVersion=1`. MVP does not add normalized child rows or a standalone activation/handoff table because snapshots have no independent lifecycle/query authority; My-Chat Handoff Ledger owns operational lookup after materialization.
- A committed command result MUST preserve both a non-empty snapshot list and an explicit empty list. Replay MUST NOT recalculate whether a handoff should exist from current policy, model output, cache, or current UI state.
- The snapshot contains refs/versions and routing intent only. It MUST NOT contain source body, target-account lists, devices, channels, generated notification copy, current authorization decisions, or host retry state.
- The array is command-spec bounded, request IDs are unique within the array, and storage order is canonical by request ID. Generated request IDs are persisted outputs and not array-position identities.

Durable-driver blocking invariant:

- Persistence in the Nurture database makes a replay seed durable but does not notify or wake My-Chat. Every command that may commit a non-empty snapshot array MUST be invoked only after My-Chat durably creates and claims the driving Workflow Step.
- My-Chat Workflow Runtime supplies a service-authenticated transient driver context; end-user payloads cannot author any field:

```ts
type ScenarioCommandDriverContext = {
  driverRef: DomainContextRef; // my-chat/workflow_step
  contractHash: string;
  capabilityKey: string;
  entrypointKey: string;
  claimToken: string;
  expectedStepVersion: number;
};
```

- Nurture validates the service principal, workspace/scenario, workflow-step ref shape, and capability/entrypoint compatibility before the transaction. It trusts the authenticated host runtime's claim attestation and does not make a synchronous owner-read callback into My-Chat or interpret host lease/retry states.
- Execution persists only `handoffDriverRef` as non-authorizing provenance. Claim token/version are transient and MUST NOT enter the Nurture database, command hash, snapshot JSON, logs, traces, metrics, or presenter output. Contract/capability binding remains canonical on the My-Chat Run/Step.
- Requested activation with no driver returns uncommitted `invalid(reason=missing_durable_handoff_driver)`; wrong service/ref/type/binding returns `invalid(reason=invalid_durable_handoff_driver)`. No business mutation, snapshot, Execution, or command-identity consumption occurs; My-Chat creates/repairs and claims the Step, then retries with the same command identity.
- Nurture MUST NOT silently replace requested activation with `[]`. A deliberate command with no activation intent may use the direct fast path and commits explicit `[]`.
- If Nurture commits and the response is lost, the already-existing Step remains the durable recovery owner. It replays the same command identity, receives the exact stored JSON, and retries host `complete_step` materialization. No polling/scanner, Nurture transport outbox, Redis recovery record, or central Saga is introduced.

Exclusive recovery ownership:

- Trusted replay may return non-empty snapshots only when the current internal caller presents the exact `driverRef` stored on Execution. User-facing replay never receives activation snapshots.
- The same Step may be reclaimed with a new claim token and Step version after lease expiry; Step identity remains unchanged. My-Chat `complete_step` performs final claim/lease/version validation.
- Another Step cannot take over, read, or materialize the Execution snapshots. One original Step may still own multiple bounded child commands emitted by its registered handler.
- Admin reconciliation operates the original Step. If that canonical Step is missing/corrupt, recovery is manual host-data repair; MVP does not define replacement-Step transfer.
- Once a Handoff is materialized, technical retry uses its Handoff Ledger identity. A user/business resend creates a new command, Step, request ID, and snapshot rather than reusing the original Execution.
- Claim expiry after Nurture commit reclaims the same Step and B2-replays. Cancellation never deletes the Step; if the business commit won the race, original-Step reconciliation preserves the Nurture result and current cancel/expiry/grant/source gates determine stopped versus completed host activation.

Manifest and host enrichment:

- The reusable `HandoffManifest` SHOULD add a stable `handoff_key`. A scenario snapshot stores `handoffKey` + `requestedPurpose`; it does not copy `handoff_type`, `downstream_owner`, or `policy_key` into the scenario database.
- My-Chat MUST resolve `handoff_type`, `downstream_owner`, `policy_key`, allowed source types, and receipt requirement from the workflow run's pinned `contractHash + handoffKey`. Current manifest drift MUST NOT reinterpret a committed snapshot.
- `WorkflowHandoffDraft.draft_key` is the persisted scenario `requestId`, scoped by My-Chat uniqueness to `(workspaceId, scenarioKey, draftKey)`. Host materialization computes a canonical draft hash over the resolved declaration, purpose, source refs/versions, and expiry; trace/correlation/worker-attempt fields are excluded.

Replay and resend semantics:

- Infrastructure retry and command replay MUST return the same `requestId` and same snapshot fields. Same key + same canonical hash reuses the existing handoff; same key + different hash is `idempotency_conflict`.
- A user-visible explicit resend/remind action is a new scenario command and MUST create a new `requestId`. Host queue/provider retry reuses the existing request/handoff and MUST NOT create a new scenario snapshot.
- Current source lifecycle, authorization, policy, target membership, and expiry are rechecked before downstream effect. Those checks MAY block a historical request but MUST NOT invent a request absent from the committed snapshot.
- For a command targeting multiple independent logical scopes, each receipt/target uses a separate snapshot/request ID. Ordering changes during replay MUST NOT change identity; IDs are persisted, not derived from array position.

Generic-pipeline boundary:

- The same snapshot/draft/ledger/receipt pipeline MAY route from any scenario to a My-Chat host capability or another registered scenario. Cross-scenario consumers reread the canonical source owner, execute their own policy, persist their own canonical result, and return a receipt; they do not receive bodyful outbox payloads or direct database access.
- Nurture-specific objects (`NurtureChildLinkReceipt`, child process, grants, family/care-group direction) remain outside the shared contract. Nurture narrows the generic snapshot to `handoffKey=user_attention` and `requestedPurpose=user_attention` for the first institution activation path.
- This is a thin cross-owner handoff contract, not a generic business Saga engine. It does not own scenario transactions, business compensation, role resolution, content generation, memory/context, or scenario authorization.

Verification implications:

- Tests MUST cover same-command replay, explicit empty snapshots, bounded/versioned JSON validation, request-ID uniqueness/stable ordering, persist+claim ordering, missing/forged/wrong-service/wrong-type/binding-mismatch rejection before commit, claim-secret non-persistence/logging, exact original-Step replay, same-Step re-claim with changed token/version, wrong-Step denial, cancellation/claim-expiry races, direct-empty versus host-first-non-empty paths, same-key/hash duplicate, same-key/different-hash conflict, manifest drift under pinned contract hash, explicit resend with a new request ID, per-target stable IDs independent of array order, expiry, current-policy blocking, and refs-only payloads.
- The R8-B1-C3 section locks My-Chat `complete_step` materialization, transaction atomicity, partial duplicate handling, bounded batch behavior, and returned canonical handoff refs.

R8-B1-C3 host transaction materialization is locked:

```ts
type WorkflowStepHandlerResult = {
  output_refs: CanonicalRef[];
  context_bindings?: ContextBindingDraft[];
  artifact_drafts?: WorkflowArtifactDraft[];
  handoff_drafts?: WorkflowHandoffDraft[];
  event_drafts?: OutboxEventDraft[];
};

type MaterializedHandoff = {
  draft_key: string;
  handoff_ref: CanonicalRef;
  disposition: "created" | "existing";
};
```

`WorkflowRuntimePort.complete_step` MUST accept `claim_token`, `expected_version`, and optional `handoff_drafts`; its durable result MUST return deterministic `materialized_handoffs` in addition to step output refs.

Implementation readiness gate:

- Current My-Chat `WorkflowRuntimePort.complete_step` does not yet accept `handoff_drafts` or return `materialized_handoffs`, and the current worker does not pass them. The Handoff Ledger repository is currently an interface shell without discovered concrete Postgres persistence; Nurture's current adapter completion is synthetic.
- Until My-Workflow-Base contract updates, My-Chat ledger/materializer/outbox persistence, and crash/replay tests land, Nurture manifest/command specs MUST NOT enable any path that emits a non-empty handoff snapshot array. Empty-snapshot business paths remain independently implementable.

Pre-transaction validation:

- My-Chat MUST load the workflow run's pinned manifest by `contractHash`, validate each `handoff_key`, purpose, allowed artifact/context source type, ref/version shape, expiry shape, and bounded draft count, then compute the canonical Draft hash.
- Static validation and hash normalization MUST occur before the host DB transaction. My-Chat MUST NOT perform a remote Nurture read inside the host transaction; current Nurture lifecycle/grant/target/presenter checks occur at downstream consumption.
- Scenario-provided `output_refs` MUST NOT contain `workflow_handoff` refs. Only the host Handoff Ledger materializer may create/append canonical handoff refs.

Host transaction:

```text
complete_step transaction
  -> exact completion-command replay lookup
  -> lock workflow step
  -> validate claim token / lease / expected version
  -> persist context bindings and artifact drafts
  -> resolve each handoff declaration from contractHash + handoffKey
  -> create or reuse Handoff Ledger records
  -> append workflow.handoff.requested outbox for newly created handoffs
  -> append canonical handoff refs to persisted step outputs
  -> mark step completed
  -> append workflow.step.completed outbox
  -> persist completion result/mapping
  -> commit
```

- Step completion, newly created Handoff Ledger records, standard step/handoff outbox events, output refs, and completion replay result MUST commit atomically in one My-Chat Postgres transaction. Queue/provider dispatch begins only after commit.
- `workflow.handoff.*` events MUST be produced by the Handoff Ledger Service; `workflow.step.*` events MUST be produced by the Workflow Step Ledger/Runtime. Scenario `event_drafts` are limited to registered scenario-internal events.
- The current Nurture handler-generated `workflow.handoff.requested` and `workflow.step.*` drafts remain scaffold behavior and must be removed when the host materializer is implemented.

Idempotency and lease ordering:

- `complete_step` has its own stable completion idempotency key and canonical completion-payload hash, independent from each handoff Draft key/hash.
- If an earlier identical `complete_step` transaction committed but its response was lost, same key + same hash MUST return the persisted Step result, materialized handoff mapping, and outbox IDs even if the original lease has since expired.
- Therefore exact committed replay lookup occurs before first-time lease validation. If no replay exists, first-time completion MUST require the current claim token/lease and expected aggregate version. Same completion key + different hash is conflict.
- If no transaction committed and the lease expires, a new claim/attempt may complete the step. Scenario command replay returns the same handoff request IDs, so per-draft idempotency still reuses any handoffs created by another valid reconciliation path.

Mixed duplicate/new and conflict semantics:

- Within one bounded batch, same Draft key + same hash reuses the existing handoff and emits no new `workflow.handoff.requested`; a new key creates a handoff and one standard event.
- A batch may contain both `existing` and `created` results. The persisted/returned mapping MUST include every Draft, deterministically ordered by `draft_key`; `outbox_event_ids` include only events newly created by the transaction.
- Any same-key/different-hash conflict aborts the current host transaction, including its new handoffs and step completion. Handoffs committed by earlier transactions remain unchanged.
- Invalid manifest/source/ref shape and oversized batches MUST fail before the transaction. Workflow planning/Prepare MUST split operations into declared child/bounded-chunk steps before Nurture commits an unsupported number of snapshots.

Boundaries and dependency:

- The transaction provides atomicity only inside My-Chat. It does not make the preceding Nurture transaction part of a distributed transaction; B2 command replay closes the Nurture-commit-to-host-completion crash window.
- My-Chat still needs a concrete transaction-aware Handoff Ledger repository/service, registered `workflow.handoff.*` outbox types, completion replay persistence, and worker wiring. No queue, provider, Nurture API, or other remote call is allowed inside the transaction.

Verification implications:

- Tests MUST cover all-created, all-existing, mixed existing/new, one conflicting Draft, invalid declaration/source type, oversized preflight rejection, transaction rollback, response-loss exact replay after lease expiry, stale first-time claim rejection, deterministic mapping order, host-only standard events, and post-commit-only dispatch.
- B1-D must next converge failure classes, dead-letter/reconciliation ownership, cancellation after Nurture commit, stale/expired activation behavior, and manual replay boundaries.

R8-B1-D1 minimal Handoff failure taxonomy is locked:

```ts
type WorkflowHandoffStatus =
  | "requested"
  | "completed"
  | "stopped"
  | "failed";

type HandoffMaterializationDisposition =
  | "created"
  | "existing";
```

Status semantics:

| Status | Meaning | Automatic action |
| --- | --- | --- |
| `requested` | The logical request remains valid; waiting, in-flight processing, and automatic retry are attempt details. | Continue bounded automatic retry where applicable. |
| `completed` | The downstream logical effect completed. Channel-level partial outcomes do not change this if the required logical activation exists. | None. |
| `stopped` | Cancellation, expiry, source lifecycle, policy, authorization, or target state means the effect must not continue. | No retry; a changed business intent requires a new scenario command/request ID. |
| `failed` | Technical retries are exhausted and the request requires operator review. | No automatic retry; controlled technical replay may return it to `requested`. |

Boundary rules:

- Detailed network timeouts, provider errors, invalid device tokens, worker lease expiry, queue unavailability, attempt counts, retry backoff, and dead-letter transitions belong to outbox/downstream attempt records and evidence. They MUST NOT expand the canonical Handoff status enum while automatic recovery remains possible.
- `created` / `existing` is a materialization disposition, not a Handoff lifecycle status. The existing base `duplicate` result status SHOULD be removed in favor of this disposition.
- Downstream `accepted` MAY remain a receipt/event indicating that a consumer obtained processing responsibility, but MVP Handoff canonical state remains `requested` until `completed`, `stopped`, or `failed`.
- Existing `rejected` and `invalidated` outcomes converge to canonical `stopped` plus a safe reason code because both are terminal, non-automatic-retry outcomes. Detailed historical receipt/evidence events MAY preserve whether the downstream rejected the request or the source/request was later invalidated.
- Manifest/hash/ref contract defects and idempotency conflicts occur before Handoff creation or host transaction commit. They move the Workflow Step to `manual_review_required`; they are not Handoff `failed` records.

Reason-code groups stay small and extensible:

```text
stopped:
  workflow_cancelled
  activation_expired
  source_redacted
  grant_revoked
  policy_blocked
  target_unavailable

failed:
  dispatch_exhausted
  owner_unavailable_exhausted
  downstream_timeout_exhausted
  provider_exhausted
```

- A reason code selects diagnostics/runbook behavior inside the already-decided treatment class; it MUST NOT create a new lifecycle branch by itself.
- If My-Chat notification center/unread state is successfully created but one optional push/device channel is unavailable, the logical Handoff MAY be `completed`; channel failure remains attempt telemetry.
- Cancellation/in-flight races resolve to `stopped` if the downstream effect has not occurred or `completed` if it already occurred. MVP does not add `cancel_pending`, `cancelled_after_accept`, or similar Handoff statuses.
- Nurture business receipts may retain richer domain-specific states such as `revoked_after_delivery`; those states MUST NOT be copied into the generic Handoff lifecycle.

Verification implications:

- Tests MUST prove transient attempt failures leave Handoff `requested`, successful logical activation reaches `completed`, business/policy/lifecycle stops reach `stopped`, exhausted technical failures reach `failed`, technical replay is the only `failed -> requested` path, and contract defects fail the Step before Handoff creation.
- B1-D2 must lock Step reconciliation, same-Handoff technical replay, and new-business resend as three distinct recovery commands.

R8-B1-D2 recovery-command boundaries are locked:

| Recovery command | Trigger | Identity reused | Allowed effect |
| --- | --- | --- | --- |
| Step reconciliation | Nurture may have committed but the My-Chat Step lacks a committed completion result. | Original scenario command idempotency identity and persisted snapshot request IDs. | Re-read/replay the exact scenario command result, then retry host `complete_step`; do not invent snapshots. |
| Handoff technical replay | A Handoff exists in `failed` due to a replayable exhausted technical reason. | Existing Handoff ID and scenario request ID. | Recheck current source/expiry/policy, transition `failed -> requested` with expected version, and emit a new aggregate-version requested event/attempt. |
| Business resend/remind | A user or scenario explicitly requests a new reminder, or corrected content needs a new activation. | None; create a new scenario command, snapshot request ID, and Handoff. | Perform the new business intent under current Nurture policy. |

- Step reconciliation MUST invoke Nurture with the original command idempotency identity. If Nurture committed, B2 returns the same `NurtureCommandExecution` result and snapshots; if it did not commit, the normal command rules determine whether execution may proceed.
- Reconciliation MUST use the original persisted `handoffDriverRef`; a new claim token/version for that same Step is allowed, but a different Step ref cannot retrieve the snapshots or substitute a new Draft.
- A Step whose retry budget is exhausted after a possible external Nurture commit MUST enter `manual_review_required`, not a state that asserts no side effect occurred. The operator may trigger reconciliation but may not construct a replacement activation Draft manually.
- Handoff technical replay is allowed only for safe replayable `failed` reasons, uses optimistic aggregate version, preserves source refs/purpose/request ID, and re-runs current downstream gates. It MUST NOT modify expiry, target, policy, or payload.
- `stopped` and `completed` Handoffs cannot be technically replayed. A changed business intent after stop/completion requires a new scenario command/request ID.
- Before replaying an ambiguous downstream timeout where the effect may have completed but its receipt was lost, My-Chat MUST query/reconcile downstream by Handoff idempotency identity before reissuing the effect.

R8-B1-D3 cancellation, expiry, and in-flight races are locked:

- Cancellation before Nurture commit prevents the business command and creates no snapshot/Handoff.
- Cancellation after Nurture commit cannot erase the Nurture result. Host Step reconciliation still records the committed result. The handoff declaration MUST define `cancel_behavior`; institution `user_attention` uses `invalidate_if_pending`.
- If cancellation/expiry is observed before Handoff downstream dispatch, host materialization/reconciliation preserves an auditable Handoff as `stopped` with a safe reason and emits no requested effect dispatch.
- A `requested` Handoff may transition to `stopped` using expected version before downstream claim/effect. The consumer MUST reread current Handoff state and Nurture gate immediately before its irreversible logical/provider effect.
- Once an effect is in flight, cancellation is best effort. The terminal result is `stopped` if the effect did not occur or `completed` if it already occurred; MVP adds no intermediate cancellation statuses and cannot promise to retract a sent push.
- Generic workflow cancellation does not redact/revoke Nurture content. Content withdrawal requires a Nurture business command; later deep-link opens always re-resolve current Nurture lifecycle and authorization.
- Expired Handoffs are `stopped` and cannot be Admin-replayed by extending expiry. A new reminder requires a new scenario command/request ID.
- Source version drift is resolved by the canonical owner into current, safely superseded, redacted, revoked, or unavailable. The declared handoff policy decides whether the latest authorized representation is usable; My-Chat does not infer this from version numbers alone.

R8-B1-D4 dead-letter, Admin, and observability boundaries are locked:

- My-Chat Outbox owns dispatch retry/dead-letter. The downstream owner owns provider/task attempt retry/dead-letter. My-Chat Handoff Ledger owns the aggregate `requested/completed/stopped/failed` result and safe reason code.
- Nurture owns no transport DLQ and MUST NOT poll My-Chat queues. It exposes idempotent CommandExecution result/source reread needed by host reconciliation.
- Retry exhaustion transitions the Handoff to `failed` in a durable owner transaction with the dead-letter/evidence ref. Automatic retries then stop.
- My-Chat Admin MAY inspect safe refs/reason codes, trigger Step reconciliation, technically replay a replayable `failed` Handoff, invalidate a still-pending request, and mark an exhausted request as no longer retryable.
- Admin MUST NOT edit source refs, purpose, target, policy, expiry, or payload; bypass grants; resurrect redacted/revoked/expired sources; convert an old Handoff into a new business reminder; or expose Nurture body content by default.
- Minimum operational signals are Handoff age by status, completion latency, attempts by downstream, dead-letter count, stopped/failed reason count, reconciliation/replay count, and receipt timeout count. Metrics/logs carry IDs and reason codes, not Nurture bodies.
- My-Chat Admin correlation follows run -> step -> completion key -> draft/request key -> Handoff -> outbox/attempt/receipt -> canonical source refs. Cross-database inspection uses owner APIs, not direct joins.

Verification implications:

- Tests MUST cover the three recovery commands, possible-post-commit Step exhaustion, downstream effect/receipt ambiguity, replayable versus non-replayable failure, cancel before/after Nurture commit, cancellation before claim and in-flight, expiry, source supersession/redaction, dead-letter ownership, Admin allow/deny actions, refs-only observability, and no Nurture transport polling.
- B1 is contractually closed after D1-D4. R8 convergence proceeds to B2 durable command idempotency/concurrency, which supplies the concrete Nurture command replay record required by B1.

R8-B2-A1 Nurture-wide command-kernel scope is locked:

- `NurtureCommandExecution` is a Nurture-wide authoritative-write primitive, not an institution-only record. It covers family long-term strategy/value cultivation, short-term care planning, family-rule trials/checkpoints/reviews, activity comparison/evidence, execution review/profile updates, and institution ecology messages/items/logs/media/grants/redaction/resend commands whenever those operations mutate Nurture canonical state.
- The inclusion rule is behavioral: if retrying an operation could duplicate, repeat, overwrite, or inconsistently advance Nurture canonical data, the operation MUST execute through the Nurture command kernel.
- Pure resolver/query/presenter work, dashboard reads, unconfirmed Prepare/clarification, LLM-only drafting, and host-only Workflow Artifact/Step/Handoff/Outbox writes do not create `NurtureCommandExecution`.
- The model and repository contracts MUST remain scope-neutral. `careGroupId`, `enrollmentId`, `institutionId`, and `childCareProcessId` cannot be globally required columns; family/project-scoped long-term commands may not have institution or child scope. Commands use a stable `commandScope`, actor refs, optional primary scope, optional child process, and typed target refs.

Representative command scopes include:

```text
family_strategy.calibrate
care_plan.generate
family_rule_trial.record_checkpoint
execution_review.record
family_care_message.publish
daily_care_log.record
media_attribution.confirm
child_link_grant.revoke
```

- B2 remains scenario-owned. My-Chat Workflow Step idempotency protects host runtime state but cannot prove whether an independent Nurture transaction committed. My-Workflow-Base MAY later reuse the semantic pattern, but B2 does not create a central cross-scenario command-execution table.
- IIA implementation MUST build one shared Nurture command schema/repository/runner, adopt it first for institution commands, and migrate at least one existing family-core write command (for example `family_strategy.calibrate` or `family_rule_trial.record_checkpoint`) in the same verification increment to prove the kernel is not institution-specific.
- IIA does not require a one-shot refactor of every existing handler. Remaining family/short-term commands may migrate capability by capability, but all production write-enabled Nurture authoritative commands MUST use the shared kernel before GA; two permanent idempotency mechanisms are forbidden.
- B2-A2 must converge `NurtureCommandExecution` persistence semantics, which outcomes consume an idempotency identity, and the relationship between stored business outcome and replay response disposition.

R8-B2-A2 committed execution and response semantics are locked:

```ts
type NurtureCommandBusinessOutcome =
  | "applied"
  | "already_satisfied";

type NurtureCommandResponseDisposition =
  | "executed"
  | "replayed";

type NurtureCommandResponse = {
  disposition: NurtureCommandResponseDisposition;
  businessOutcome: NurtureCommandBusinessOutcome;
  executionRef: DomainContextRef;
  outputRefs: DomainContextRef[];
};
```

Persistence semantics:

- A visible `NurtureCommandExecution` row means the logical command completed and committed in Nurture. It is an immutable command receipt/result, not an attempt log or queue state.
- The Execution MUST commit in the same Nurture transaction as every mutation, event, receipt, output ref, and handoff-request snapshot. Rollback leaves no visible Execution and no business effect.
- Persisted business outcome is only `applied` or command-spec-authorized `already_satisfied`. `processing`, `retrying`, `invalid`, `blocked`, `conflict`, and internal error are not committed Execution outcomes.
- `already_satisfied` means a different valid command already established a state that this specific command contract declares convergent. The shared runner MUST NOT infer it from equal-looking payloads. Append commands such as daily-care recording do not deduplicate different command identities merely because content matches.
- `invalid`, `blocked`, `conflict`, and rolled-back/internal-error attempts do not consume the idempotency identity. Security-denied/evidence logging and rate limiting are separate concerns; a repaired precondition may be retried after a new Prepare.

Response and replay semantics:

- `executed` / `replayed` describes how the current response was obtained and is never persisted as a mutation of the original Execution. The database preserves the original `businessOutcome`.
- A same-key/same-payload replay performs no business mutation and returns the immutable original result. A replay of an original `already_satisfied` result returns `disposition=replayed` and `businessOutcome=already_satisfied`.
- The earlier `already_applied` combined value is superseded. Replay disposition and business outcome MUST remain separate in services, presenters, tests, and API contracts.
- A committed Execution is immutable: host handoff state, provider retry, corrected content, revoke/redaction, or explicit resend MUST NOT rewrite its output refs/result/snapshots. Later business changes create new commands/executions.

Replay authorization:

- The Execution proves that the logical write must not run again; it does not grant permanent visibility to the stored output.
- A user-facing replay MUST verify caller identity compatibility and current presentation visibility before returning output details. If access was revoked, it returns only a safe processed/unavailable response without body or inaccessible target disclosure.
- A trusted internal Step-reconciliation purpose MAY retrieve the immutable result/snapshots needed to finish B1 under service policy, but it cannot create new business effects or expand the original result.

Verification implications:

- Tests MUST cover executed/applied, replayed/applied, executed/already-satisfied, replayed/already-satisfied, append-command non-convergence, rollback with no Execution, blocked/conflict retry without consumed identity, immutable stored result, user replay after revocation, and trusted reconciliation replay.
- B2-B must converge the generic scenario-command responsibility boundary, idempotency scope/key ownership, canonical payload-hash contents/versioning, same-key/different-hash conflict, and sensitive key storage.

R8-B2-B1 generic Scenario Command Pipeline boundary is locked:

```ts
type ScenarioCommandEnvelope<T> = {
  scenarioKey: string;
  workspaceId: string;
  invocationRequestId: string;
  commandRequestId: string;
  commandScope: string;
  commandContractVersion: number;
  actorRef: string;
  payload: T;
};

type ScenarioCommandResponse<R> = {
  disposition: "executed" | "replayed";
  businessOutcome: "applied" | "already_satisfied";
  result: R;
};
```

Shared contract versus local persistence:

- My-Workflow-Base MAY define the generic envelope, logical identity/hash semantics, response dimensions, repository/service conformance shape, and shared test contract. It MUST NOT own a central cross-scenario command-execution table or scenario business transaction.
- My-Chat owns scenario selection/routing, authenticated host identity, stable idempotency-key transport, retry/correlation, and Workflow Step orchestration. It does not resolve scenario role/scope/target, canonicalize scenario business payloads, decide state transitions/`already_satisfied`, or store scenario CommandExecution as business truth.
- Each scenario persists its own `<Scenario>CommandExecution` in the same database transaction as its canonical mutation. Nurture implements `NurtureCommandExecution`; another scenario implements its own local execution record under the same behavioral contract.
- Central persistence is forbidden because it would separate the execution receipt from the scenario mutation and recreate the cross-database atomicity gap B2 is intended to close.

Identity and host mapping:

- The logical generic uniqueness namespace is `(scenarioKey, workspaceId, commandRequestId)`. In a scenario-local database/table the scenario key is implicit, so Nurture may enforce `(workspaceId, commandRequestIdHash)`.
- Existing `WorkflowCommandMeta.idempotency_key` is the generic host transport field from which a stable `invocationRequestId` can be mapped. When one invocation maps to one scenario command, the `commandRequestId` SHOULD reuse that value unchanged/opaque.
- If one invocation intentionally fans into multiple independently committed scenario commands, orchestration MUST derive stable child request IDs from the parent identity plus a declared child scope/command key. Multiple effects committed in one atomic command MUST NOT be mistaken for independent commands merely because they affect multiple rows or targets.
- My-Chat must not regenerate the scenario request ID on worker retry. A user-visible new business action/resend gets a new scenario command identity.

Hash responsibility split:

- The shared layer provides a versioned canonicalization/hash interface and same-key/same-hash versus same-key/different-hash behavior. It does not define one universal business DTO.
- Each scenario command contract supplies its schema-validated canonical DTO, effect-bearing fields, target refs/expected versions, set-versus-ordered-array semantics, and command-specific convergence rules.
- This shared contract is not a command router, business rules DSL, authorization engine, LLM orchestration layer, or central audit product.

Cross-scenario behavior:

- A handoff from Scenario A to Scenario B does not reuse Scenario A's execution row. Scenario B derives/receives a stable downstream command request identity and commits its own local CommandExecution with its own canonical mutation, then returns the handoff receipt.
- Shared conformance tests MUST prove host pass-through/retry stability while scenario tests prove local transaction atomicity and command-specific hash/state semantics.
- The R8-B2-B2a section locks invocation/command/process/effect identity and the concrete `commandRequestId` lifecycle. B2-B2b then locks Nurture uniqueness/hash storage and canonical payload-hash field inclusion/exclusion/versioning; B2-C is the next concurrency/result-storage decision.

R8-B2-B2a invocation/command identity lifecycle is locked:

```ts
type ScenarioCommandIdentity = {
  invocationRequestId: string;
  commandRequestId: string;
  commandKey: string;
  originInvocationRequestId: string;
  parentCommandRequestId?: string;
};
```

Four identity layers:

| Identity | Meaning | Owner/lifetime |
| --- | --- | --- |
| `invocationRequestId` | One stable inbound invocation, including its transport/worker retries | Entry owner creates it; My-Chat interaction/client IDs, API idempotency keys, Workflow Step keys, and stable job/event IDs map here |
| `commandRequestId` | One independently atomic and replayable scenario state change | Scenario binds/interprets it; persists through Prepare/clarification until first committed result |
| process/aggregate ref | The long-lived domain object or workflow being changed | Scenario domain, for example `NurtureChildCareProcess`; never replaced by a command ID |
| effect key/ref | A child row, receipt, task, artifact, or other command effect | Owning domain uses it for effect-level uniqueness; it is not a second command unless it has an independent commit/retry boundary |

Lifecycle and derivation:

- The current entry owner MUST supply a stable `invocationRequestId`. My-Chat maps message/form/action client identity into it and preserves it on infrastructure retry; it does not decide whether a Nurture command exists.
- Nurture binds a `commandRequestId` only after it identifies a potential command. A read-only answer or unresolved non-command interaction has no command execution identity.
- One invocation + one atomic command SHOULD use `commandRequestId = invocationRequestId`. This is semantic reuse, not a claim that invocation and command mean the same thing.
- If one invocation produces several independently committed/retried commands, Nurture/orchestration derives each child ID deterministically from the parent invocation/command identity plus a stable declared `commandKey`/target key. Independent commands cannot share an ID.
- If one command transaction writes many recipients, rows, receipts, handoff snapshots, or tasks, those are effects under one command identity. They keep their own domain/effect keys but do not receive child command IDs solely because their count is greater than one.
- Prepare/clarification MAY bind a command ID before Execution exists. The Nurture `scenarioToken` carries that ID across later invocations; those invocations get new invocation IDs while the pending command ID remains stable.
- A command identity ends at its first committed `NurtureCommandExecution`. Later approval, correction, redaction, resend, reminder, repeated append, or other new state transition MUST use a new command ID, even when it belongs to the same process/aggregate.
- An abandoned/expired Prepare consumes no Execution identity. A concurrent final confirmation race uses the same command ID: the first committed canonical hash wins; exact repeat replays and a different finalized command conflicts.

Cross-scenario validation:

- Education assignment publication may create many recipient rows in one transaction and therefore remains one publish command with many effects. Per-image submission uploads can be independent commands because each image has its own retry/commit boundary. Grading and feedback release are later commands over the same assignment/submission process.
- ERP payment `submit`, `approve`, and `confirm` are separate commands, actors, authorization checks, and expected-version transitions over one `PaymentDoc` process. Voucher posting may atomically create multiple downstream work items as effects; acting on each work item later creates a new command.
- These cases prove that target/effect count does not determine command count. Atomic commit and independent replay are the decision rule.

Nurture application:

- A direct one-child daily-care write normally reuses its invocation ID as command ID.
- A class input committed per child or bounded chunk derives stable child/chunk command IDs; a genuinely atomic class command retains one command ID.
- A family-care message plus its receipt/event/handoff snapshots remains one command when committed together. Explicit resend/remind is a later command.
- Nurture execution persistence MUST retain the command identity and its origin lineage in non-sensitive normalized/hash form; B2-B2b will lock exact columns, hash namespace/version, and canonical payload fields.

Required tests:

- one invocation/no command, one invocation/one command with value reuse, one invocation/many same-transaction effects, one invocation/multiple independently committed child commands, and multiple invocations/one pending command before commit;
- new command after prior commit on the same process, deterministic child-ID retry, exact final-confirmation replay, and same pending ID with different finalized command conflict;
- Education-style atomic recipient fan-out and ERP-style multi-transition process conformance fixtures in the shared contract suite, without importing either domain vocabulary into the generic runtime.

R8-B2-B2b key/hash/storage contract is locked:

```ts
type NurtureCommandExecutionIdentityFields = {
  workspaceId: string;
  commandRequestIdHash: string;
  originInvocationRequestIdHash: string;
  parentCommandRequestIdHash?: string;
  requestIdentityHashVersion: 1;
  commandKey: string;
  commandContractVersion: number;
  payloadHash: string;
  payloadCanonicalizationVersion: 1;
};
```

ID validation and storage:

- Raw `invocationRequestId` and `commandRequestId` values MUST be opaque bounded ASCII identifiers accepted by the shared contract, using the production shape `^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$`. Human prose, request bodies, email/phone/name values, or other PII-bearing strings are forbidden as IDs.
- Nurture MUST NOT persist raw invocation/command IDs in `NurtureCommandExecution`, audit metadata, logs, or outbox payloads. It stores lowercase 64-character SHA-256 hex values and safe execution/correlation refs only.
- Version 1 command identity hashing is `sha256(utf8("nurture.command-request.v1\0" + workspaceId + "\0" + normalizedCommandRequestId))`, where `\0` denotes one NUL separator byte. Invocation lineage uses a separate `nurture.invocation-request.v1` namespace; parent command hashes reuse the command namespace.
- Nurture enforces `UNIQUE(workspaceId, commandRequestIdHash)`. `commandKey`, target, process/aggregate ref, actor, and payload hash MUST NOT be added to that uniqueness key; reusing one ID for a different business command is a conflict, not a second valid row.
- Namespaced SHA-256 is sufficient only while IDs remain opaque/high-entropy system identities under the validation rule. If a future integration must accept arbitrary/low-entropy external keys, it must introduce a new keyed-HMAC identity-hash version rather than weakening v1 or persisting raw values.

Canonical payload fingerprint:

- A command specification first schema-validates and normalizes its semantic request DTO, including explicit null/omission policy, decimal/date representation, set sorting/deduplication, ordered-array preservation, and immutable ref/version/checksum shape. The shared layer then applies versioned canonical JSON serialization and SHA-256.
- Version 1 payload hashing is domain-separated as `sha256(utf8("nurture.command-payload.v1\0" + canonicalJson))`, with the same single NUL separator convention.
- Every Execution stores `commandContractVersion` and `payloadCanonicalizationVersion`. Replaying an existing ID uses its stored versions; canonicalizers required by an execution inside the supported replay-retention window cannot be removed.

The semantic fingerprint MUST include:

- `commandKey`/scope and `commandContractVersion`;
- authenticated actor ref plus effective Nurture role/scope refs used to submit the command;
- resolved target/process refs and every expected aggregate/object version that constrains the write;
- normalized effect-bearing business payload, including semantic set/order distinctions;
- immutable attachment/content refs plus version/checksum; finalized AI-generated content itself or an immutable content ref + version/hash when it becomes business data;
- requested distribution/activation intent when it changes committed receipts/handoff snapshots/effects;
- client/business `occurredAt` only when the command contract treats that time as canonical business input.

The semantic fingerprint MUST exclude:

- invocation/command IDs, parent IDs, conversation/turn/correlation/causation/trace IDs;
- worker attempt, retry count, lease, deadline, queue, network, and transport fields;
- client surface, render/display state, locale-only presentation fields, and My-Chat shell metadata;
- server-generated execution/event/outbox/artifact IDs, `createdAt`, processing time, and delivery/provider results;
- model provider, model/prompt/cache/token/cost telemetry when it does not alter the finalized business payload;
- current dynamic authorization, grant status, target lifecycle state, or other database state read during Execute. These remain deterministic preconditions and replay-visibility checks, not request identity.

Lookup, replay, and conflict behavior:

| Existing execution | Incoming payload | Result |
| --- | --- | --- |
| none | valid | Run current preconditions and attempt one transaction; identity is consumed only if Execution + effects commit |
| same key hash | same canonical payload hash | Return immutable Execution with `disposition=replayed`; do not rerun mutation/model/remote work |
| same key hash | different canonical payload hash, command/version, actor/scope, target, or expected version | Return `idempotency_conflict`; disclose no inaccessible target/body details |
| different key hash | same payload | Treat as a new command; command spec alone may return committed `already_satisfied` |
| no committed Execution after invalid/blocked/conflict/error | corrected request using same ID | ID remains unconsumed and may execute; first successful commit establishes the immutable hash |
| concurrent different requests using one ID | both initially see none | Unique constraint/transaction winner commits; loser reloads and returns replay only on exact hash, otherwise conflict |

Required B2-B2b tests:

- ID shape/length rejection, raw-ID non-persistence/log redaction, workspace-separated hashes, namespace/version separation, and unique-key conflict across command keys/targets;
- canonical object-key stability, explicit null/omission behavior, decimal/date normalization, unordered-set equivalence, ordered-array difference, attachment/content version changes, and finalized AI-content changes;
- exclusion stability for trace/retry/surface/model telemetry and generated timestamps/IDs;
- same-key/same-hash replay, same-key/different-hash conflict, same-payload/new-key behavior, unconsumed failed attempt correction, and concurrent first-commit-wins;
- replay across a supported command/canonicalizer deployment version and a gate preventing removal of still-retained canonicalizers.

The following R8-B2-C simplified MVP execution/concurrency/result contract is the legacy pre-C3 baseline. Its `businessActorRef` remains historical bytes only and MUST NOT be used by an activated C-3 path:

```ts
type NurtureCommandExecution = {
  id: string;
  workspaceId: string;
  commandRequestIdHash: string;
  originInvocationRequestIdHash: string;
  parentCommandRequestIdHash?: string;
  requestIdentityHashVersion: 1;
  commandKey: string;
  commandContractVersion: number;
  payloadHash: string;
  payloadCanonicalizationVersion: 1;
  businessActorRef?: string; // legacy rows only
  businessActorSchemaVersion?: 1; // required for activated C-3
  businessActorKind?: "nurture_participant"; // required for activated C-3
  businessActorParticipantId?: string; // required Restrict FK for activated C-3
  hostPrincipalProvenanceSchemaVersion?: 1; // required, separately named technical provenance
  hostPrincipalProvenanceHash?: string; // required, body-free; never the business actor
  businessOutcome: "applied" | "already_satisfied";
  outputRefs: DomainContextRef[];
  handoffSnapshotSchemaVersion: 1;
  handoffRequestSnapshotsPayload: ScenarioHandoffRequestSnapshot[];
  handoffDriverRef?: DomainContextRef;
  committedAt: string;
};

type NurtureCommandSpec<Input, Result> = {
  commandKey: string;
  contractVersion: number;
  canonicalize(input: Input): unknown;
  checkPreconditions(tx: NurtureTransaction, input: Input): Promise<CommandDecision>;
  apply(tx: NurtureTransaction, input: Input): Promise<Result>;
  toOutputRefs(result: Result): DomainContextRef[];
};
```

MVP ownership and scope:

- IIA implements one Nurture-owned database Execution table/repository/runner plus command specifications. It does not build a standalone idempotency service or a central/shared execution database.
- For legacy pre-C3 rows only, `businessActorRef` preserves its historical domain-actor bytes and meaning. Every activated C-3 write instead requires the exact typed trio `businessActorSchemaVersion=1`, `businessActorKind=nurture_participant`, and Restrict-FK `businessActorParticipantId`, plus separately named `hostPrincipalProvenanceSchemaVersion=1` and body-free `hostPrincipalProvenanceHash`. C-3 code MUST NOT read/write `businessActorRef`. My-Chat User/Actor provenance is technical evidence only; worker, recovery, Notification, provisioning, service, and Technical Operator identities can never populate the Participant actor field.
- Execution stores immutable outcome, bounded refs-only `outputRefs`, required versioned handoff snapshot JSON, and conditional driver provenance. It stores no message/attachment body, full scenario response, current visibility decision, provider response, model output copy, or mutable host state. Existing canonical Nurture objects remain content/business truth; the Execution JSON is only activation replay truth.
- IIA does not delete Execution rows. Partitioning, archival, compact tombstone jobs, and configurable retention are deferred until volume evidence and product/legal retention rules exist. Deletion MUST NOT be introduced later without preserving duplicate-prevention semantics.

Execution algorithm:

1. Authenticate the caller/service context, validate workspace access and ID shape, schema-validate the command, normalize its semantic DTO, and compute identity/payload hashes outside the transaction. Model calls, attachment upload, remote owner reads, and other remote work have already produced immutable refs and cannot run in the transaction.
2. Perform an authorized fast lookup by `(workspaceId, commandRequestIdHash)`. If Execution exists, compare the stored command/version/payload hash and return exact replay or safe `idempotency_conflict`; user output still passes current visibility/presenter checks.
3. If missing, begin one short Nurture Postgres transaction and call `pg_try_advisory_xact_lock` with a deterministic signed 64-bit key derived from the already namespaced workspace + command hash. Failure returns internal retryable `command_busy`; it writes no Execution/effect and retries later with the same command identity using bounded backoff.
4. After acquiring the lock, re-read Execution inside the transaction. A waiter/retry that now finds the winner returns replay/conflict without executing the command specification.
5. Re-read and validate current business actor, role/scope, target, grant dependencies, lifecycle states, and expected versions. These checks are deterministic and transaction-local.
6. Run command-specific conditional updates/inserts. State-machine mutations use expected aggregate/object version plus expected lifecycle state. Append effects use stable effect IDs/keys and do not invent a shared aggregate lock when the command contract does not require one.
7. For multi-object invariants, read/lock rows in stable `(objectType, objectId)` order. Class/batch work remains per child or bounded chunk so transactions and `outputRefs` remain bounded.
8. Validate the bounded/versioned handoff snapshot array. Non-empty requires the prevalidated service-authenticated Workflow Step driver; missing/invalid driver rolls back with no Execution/effect. Persist business effects, local receipts/events, snapshot JSON/driver provenance, and final immutable Execution in the same transaction. Execution is written only after a successful command result is available, but the command advisory lock serializes same-ID contenders until commit/rollback.
9. Commit, then dispatch remote host/provider work. A response lost after commit is recovered by fast replay. A rollback leaves no Execution and no business effect.

Concurrency semantics:

- Same command identity: command advisory serialization + double Execution lookup yields one committed result. Exact duplicates replay; different canonical payloads conflict.
- Different command identities on one target: command locks do not serialize them. Expected-version/state predicates select the winner; the loser may commit `already_satisfied` only when its command specification explicitly declares the observed state convergent, otherwise it returns an uncommitted business conflict.
- Advisory-key collision can only serialize unrelated commands temporarily; it cannot merge identities because replay still uses the full 256-bit persisted hash and workspace uniqueness.
- Lock acquisition, database serialization, deadlock, and transient connection failures are retryable technical outcomes handled by bounded caller/worker retry with the same command identity. IIA does not add a generic automatic transaction-retry state machine.
- Lock order is command identity first, then command-spec target rows in stable order. Remote calls and unbounded batch loops are forbidden while locks are held.

Replay and result behavior:

- Fast replay is allowed only after basic caller/service authentication and workspace boundary checks; it must not become an execution-existence oracle for unauthorized callers.
- User-facing replay resolves stored output refs through current Nurture authorization, redaction, grant, and presenter rules. Inaccessible/redacted output returns safe processed/unavailable state without body or target disclosure.
- Trusted Workflow Step/B1 reconciliation may read immutable output refs and handoff-request snapshots under an explicit service purpose. It cannot mutate the Execution, replace `businessActorRef`, or expand effects.
- `outputRefs` are contract-validated, bodyless, immutable as an Execution result, and bounded by each command specification. Later corrections/redactions append new domain actions and do not rewrite the old Execution.

Required B2-C tests:

- fast exact replay and same-key/different-hash conflict without advisory-lock acquisition;
- two same-key concurrent transactions with one applied Execution and one replay, plus different-payload contender conflict;
- advisory-lock busy -> no write -> bounded same-ID retry; rollback releases lock and leaves no Execution/effect;
- two different command IDs racing one expected target version, including explicit convergent `already_satisfied` and non-convergent conflict cases;
- stable multi-object lock order, bounded child/chunk batch behavior, response-lost-after-commit replay, and no remote/model call inside the transaction;
- technical service-principal retry preserving `businessActorRef`, unauthorized replay non-disclosure, replay after grant/access/redaction change, and trusted reconciliation refs-only access;
- schema/serialization tests proving Execution is immutable, bodyless, unique by workspace + command hash, and retained without an IIA deletion path.

B2 closure:

- B2-A1/A2, B2-B1, B2-B2a/B2-B2b, and B2-C now define one implementable Nurture-wide command kernel with a thin reusable behavioral contract.
- Deferred items are not IIA blockers: HMAC identity version, partition/archive/tombstone jobs, multi-database implementations, Redis/distributed locks, generic reservation/attempt/processing tables, generic rules/lock DSLs, and a universal transaction retry engine.
- Historical sequencing note: B3 durable family-input routing/clarification was the next blocker at this point and is now closed by B3-A/B/C1/C2a-e plus D-054/D-057 refinements.

R8-B3-A durable routing/clarification ownership is locked:

- IIA MUST NOT add `NurtureFamilyCareRouting`, `NurtureFamilyCareClarification`, or a generic routing/clarification platform. Their proposed state duplicates existing Receipt and Item/Event authorities.
- `NurtureFamilyCareMessage` owns canonical content/lifecycle only. `NurtureChildLinkReceipt(direction=family_to_org)` is the durable visible routing lifecycle from that source to one logical institution/care-group target. `NurtureFamilyCareItem` is the resulting teacher-work aggregate; `NurtureFamilyCareItemEvent` is its append-only action and clarification history.
- `NurtureInteractionContext` and `scenarioToken(purpose=clarify)` continue to own only short resolver ambiguity before or during the current interaction. They cannot represent a family response awaited for hours/days.

Receipt refinement:

```ts
type FamilyToOrgReceiptRouteFields = {
  sourceType: "family_care_message";
  sourceId: string;
  routingAttemptKey: string;
  direction: "family_to_org";
  grantId?: string;
  dataClass?: string;
  targetScopeType?: "care_group" | "enrollment" | "institution";
  targetScopeId?: string;
};
```

- The source family-message command persists the canonical message plus a stable logical receipt in the same B2 transaction. If current grant/data-class/target resolution and item creation are complete in that command, the receipt may start as `delivered`; otherwise it starts `pending`.
- `pending` may temporarily omit grant/data-class/target fields because B1 already defines unresolved target/release work as pending. This supersedes the IB table's unconditional required flags for those fields.
- `delivered`, `read`, and `acknowledged` require complete route fields, current matching grant/enrollment/scope, and a teacher target surface that can read the resulting item. My-Chat activation is irrelevant to this transition.
- `blocked`/`failed` preserve safely resolved route fields and a safe reason code but may remain partial. They cannot expose an inaccessible institution/care-group target to the family presenter.
- Receipt identity is `UNIQUE(workspaceId, direction, sourceType, sourceId, routingAttemptKey)`. Nullable grant/data-class/target fields are not identity. Infrastructure retry reuses the key; a deliberate independent target route derives a new stable key.

Long-running teacher clarification — historical/future reusable R8-B3-A vocabulary only; explicitly excluded from the C-3 Pilot profile and its implementation/qualification:

- Add `waiting_for_family` to `NurtureFamilyCareItem.status` and an optimistic `version` required by B2.
- A caregiver-confirmed `request_clarification` command atomically transitions `open|acknowledged -> waiting_for_family`, appends `clarification_requested`, writes the family-facing message and `org_to_family` receipt, and returns optional activation snapshot refs.
- The clarification-request event stores the related family-facing message ref. AI/system draft text cannot be attributed to a named caregiver until that action is confirmed.
- A later family-authored response message identifies the item through a valid scenario token or resolver/business-memory recovery. Its B2 command atomically writes the message and `family_to_org` receipt, transitions `waiting_for_family -> open`, appends `clarification_received`, and correlates to the request event.
- `clarification_expired` and `clarification_cancelled` close the active wait cycle and normally return the item to `open` for teacher decision; they do not silently close the underlying item. The item itself may separately expire/close under its command policy.
- Multiple rounds are represented by repeated correlated ItemEvents. `linkedReplyMessageId` is only a latest-reply convenience ref; events are the history. A dedicated clarification aggregate is deferred until simultaneous questions, partial field answers, per-guardian answers, independent SLA/assignment, or clarification-specific reporting is proven necessary.

Future capability tests (not C-3 gates):

- message and pending/delivered receipt atomicity, stable receipt routing key replay, pending nullable route fields, and delivered/read/acknowledged completeness constraints;
- blocked/failed partial-route non-disclosure, grant revoke fences, and My-Chat activation failure independence;
- request clarification atomic item/event/message/receipt transition, family response correlation from same/new conversation, repeated clarification rounds, expiry/cancel returning teacher attention, and concurrent stale item-version rejection;
- no new Routing/Clarification model or duplicate lifecycle in schema/runtime contracts.

B3-A leaves pending-receipt driving/recovery to the R8-B3-B section, which closes the boundary through direct atomic delivery or host-first durable Run/Step and explicitly rejects a Nurture transport outbox/global pending scanner.

R8-B3-B host-first durable driver and recovery contract is locked:

- IIA MUST NOT add `listPendingScenarioWork`, a cross-scenario polling registry, a Nurture transport outbox/worker, or reuse host activation Handoff as Nurture-internal routing. Current My-Workflow-Base/My-Chat already own durable Workflow Run/Step, claim/lease, retry, and worker dispatch; B3 reuses that runtime.
- A simple family input whose participant/child/data-class/target/grant and bounded classification are already resolved MAY execute one B2 command that atomically commits `NurtureFamilyCareMessage` + `NurtureFamilyCareItem` + `NurtureChildLinkReceipt(status=delivered)` + events/Execution without a Workflow Run only when activation intent is absent and the Execution stores explicit `handoffRequestSnapshotsPayload=[]`.
- If that otherwise-synchronous route requests notification, unread/badge, notification-center, deep-link, or any other durable host activation, My-Chat MUST create the lightweight durable Run/Step before invoking Nurture. Business routing remains synchronous, but the host Step is required to eliminate orphan replay seeds.
- Any route that requires asynchronous AI/attachment work, institution review, delayed release, or another independently retryable step MUST be host-first: the My-Chat Workflow Run and driving Step are durably created before a Nurture command may commit a pending receipt.

Host ingress and canonical ownership:

- My-Chat persists the host `ChatMessage` with its client-message idempotency identity as generic conversation continuity. For a Nurture-bound family input, Nurture resolver receives the authenticated invocation/body plus an opaque versioned host message ref.
- Resolver may return read-only output, structured short clarification, blocked, a simple immediate command, or a generic workflow-start instruction naming only the registered Nurture capability/entrypoint and opaque scenario refs. My-Chat does not infer family role, child, data class, grant, target, or route topology.
- When workflow start is selected, My-Chat atomically creates the Run/Steps under the pinned manifest/contract before capture. The worker queue carries host/Nurture refs and workflow identity only, never the family message body.
- The capture handler uses an authorized owner adapter to read the current host message ref, then a B2 command writes the Nurture canonical child-scoped message and receipt. After capture, route/classification steps read Nurture refs; My-Chat ChatMessage remains host conversation input, not Nurture business truth or policy/query state.
- My-Chat redaction/unavailability before first capture causes safe retry/blocked/manual recovery according to current source state. Nurture redaction/lifecycle owns the copied canonical message after capture; later host lifecycle changes do not silently rewrite it.

Pending-driver contract:

```ts
type NurtureReceiptPendingDriver = {
  pendingReason:
    | "workflow_processing"
    | "awaiting_confirmation"
    | "scheduled_release";
  driverType:
    | "workflow_step"
    | "item_action"
    | "scheduled_step";
  driverRef: DomainContextRef;
  nextActionAt?: string;
};
```

- `status=pending` requires a contract-valid driver mapping: workflow processing -> already-existing host Workflow Step; awaiting confirmation -> current Nurture Item/action ref; scheduled release -> durable delayed/scheduled host Step plus `nextActionAt`.
- Driver refs are opaque provenance/continuation refs, not authorization. Every resume reloads current participant/role/scope/enrollment/grant/target/source lifecycle and B2 command preconditions.
- Receipt retains driver provenance after terminal transition for correlation, but no driver is considered active once status is delivered/read/acknowledged/blocked/failed/revoked-after-delivery.
- Receipt MUST NOT store worker id, claim token, lease, queue job id, attempt count, retry timestamp, DLQ state, or provider status. Those remain host Workflow Step/worker evidence.
- `waiting_for_family` is Item state driven by a future family action, not a continuously pending worker. Manual-review items are visible teacher work and may already have a delivered receipt; they do not remain logically undelivered merely because a human has not acted.

Crash/recovery matrix:

| Failure point | Durable recovery |
| --- | --- |
| before Run creation | No Nurture pending receipt exists; My-Chat `clientMessageId` replay restarts resolver/start safely |
| after Run creation, before capture | Existing host Step remains claimable/retryable |
| after Nurture capture commit, before host Step completion | Same Step command identity replays B2 capture result, then completes Step |
| during route/classification before Nurture commit | Host Step retries with same stable command identity; no partial Nurture route effect |
| after route commit, before host Step completion | B2 route result replay completes the host Step without duplicate Item/Receipt transition |
| optional notification failure | B1 host activation recovery only; delivered Receipt and Item remain valid |

Shared-base and implementation gaps:

- No new pending-work API is required. My-Workflow-Base only needs a conformance invariant that pending scenario business state has an already-durable driver or a canonical user/action wait object.
- My-Chat must expose an authorized owner-read adapter for a versioned host ChatMessage ref and wire Nurture resolver workflow-start output to existing `start_run`/pinned Step topology. This is host integration work, not Nurture business-state ownership.
- Workflow Step reconciliation already defined by B1/B2 handles the cross-database completion gap. A command that creates an asynchronous pending receipt outside a registered durable Run/Step must fail validation.

Required B3-B tests:

- simple atomic direct-delivery path creates no Run/pending state; async path proves host Run/Step exists before pending Receipt commit;
- queue payload/body inspection proves refs-only transport while capture owner-read copies the host message into Nurture canonical storage;
- each crash-matrix point converges through Step retry + B2 replay without duplicate message/item/receipt or orphan pending state;
- pending driver type/reason/ref/nextAction completeness, current-state revalidation, and prohibition of queue/lease/attempt/DLQ fields in Receipt;
- waiting-for-family consumes no worker lease, manual-review item remains delivered/visible, and optional activation failure remains independent;
- contract/schema scans prove no Nurture outbox/worker, Handoff misuse, `listPendingScenarioWork`, or generic polling platform.

The R8-B3-C1 section locks status ownership inside Nurture. B3-C2a-d lock revoke/redaction/cancel/clarification transitions for pending receipts and waiting items; B3-C2e then closes technical exhaustion and Admin recovery.

R8-B3-C1 lifecycle-status ownership boundary is locked:

| Layer | Status owner | Contract examples |
| --- | --- | --- |
| Host technical execution | My-Chat Workflow Runtime | Workflow Run/Step claim, waiting, retry, completion, failure, manual review |
| Host activation | My-Chat Handoff | `requested`, `completed`, `stopped`, `failed` under B1 |
| Reusable command protocol | Scenario Command Contract | response `executed/replayed`; committed outcome `applied/already_satisfied` under B2 |
| Logical care distribution | Nurture | `NurtureChildLinkReceiptStatus` + Nurture reason codes |
| Teacher/family work | Nurture | `NurtureFamilyCareItemStatus` + ItemEvent types |
| Short resolver continuation | Nurture | InteractionContext/scenario-token purpose and staleness states |

Shared-base limits:

- My-Workflow-Base MAY define behavioral invariants: nonterminal scenario business work has a durable driver or canonical user/action continuation; host Step terminality does not directly mutate scenario business state; cross-database recovery is idempotent; transport is refs-only; and scenario owner rereads current authorization/lifecycle before action.
- My-Workflow-Base MUST NOT define generic `delivered`, `read`, `acknowledged`, `waiting_for_family`, `revoked_after_delivery`, `expired`, `cancelled`, `blocked`, or scenario reason-code semantics. Similar words in another scenario do not imply the same business meaning.
- The base MUST NOT define a universal business `DriverType` enum. Nurture may locally use `workflow_step`, `item_action`, and `scheduled_step` because those values describe its own continuation policy; another scenario may choose different driver categories while still using opaque `DomainContextRef` values.
- IIA does not add a normalized cross-scenario lifecycle class for analytics or host branching. If later observability needs one, it must be a scenario-declared projection and cannot become business authority.

Consumption boundary:

- My-Chat MUST NOT branch on Nurture business values, for example `if receipt.status == blocked`. It may branch only on its own Run/Step/Handoff state or on generic structured UI/action payloads produced by Nurture.
- Nurture presenter maps current Receipt/Item/Event state into safe scenario responses, options, forms, badges, or unavailable states. My-Chat renders those primitives without interpreting the underlying status.
- My-Chat Technical Admin may inspect safe host evidence and opaque Nurture refs, then request owner reevaluation. Nurture owner recovery decides business convergence; the technical operator cannot directly execute business cancel/failure/reissue or edit Nurture status.

Conformance tests:

- shared tests verify durable-driver presence, refs-only payloads, retry/replay stability, no host direct scenario mutation, and owner revalidation;
- Nurture tests alone verify Receipt/Item/Event enums, reason codes, transition legality, presenter mapping, revoke/redaction behavior, and manual recovery commands;
- schema/manifest scans fail if Nurture business statuses are added to My-Workflow-Base/My-Chat generic runtime contracts or if host code branches on them.

B3-C2a-d define the Nurture-specific transition matrix for revoke, source redaction, pre-delivery cancel, post-delivery withdrawal, and clarification expiry/cancel. B3-C2e will complete technical exhaustion and Admin recovery. None of these decisions alter the shared pipeline state machine.

R8-B3-C2a-d Nurture revoke/redaction/cancel/clarification transitions are locked:

Grant revoke:

| Current Nurture state | Revoke result |
| --- | --- |
| Receipt `pending` | `blocked(reason=grant_revoked)` |
| Receipt `delivered/read/acknowledged` | `revoked_after_delivery(reason=grant_revoked)`; retain historical timestamps |
| Receipt `blocked/failed/revoked_after_delivery` | Idempotently unchanged |
| Active grant-dependent Item | `suppressed(reason=grant_revoked)` + suppression event |
| Item `waiting_for_family` | Append correlated `clarification_cancelled(grant_revoked)`, then suppress |
| Item already `closed/expired/suppressed` | Keep historical workflow status; current grant fence still denies content/action access |

- Grant revoke stops future access, actions, pending routing, stale token/deep-link submission, context reuse, and activation. It does not change `NurtureFamilyCareMessage.status` to redacted or claim to recall human memory.
- The revoke command atomically revokes the grant and updates bounded active dependent receipts/items for the child scope. If historical projections converge later, all owner reads/actions still fail closed immediately against the current grant.
- Institution/My-Chat Admin cannot reactivate a revoked family grant. A future relationship creates a new grant identity.

Source redaction:

- Redaction makes source Message body/attachments unavailable, records redaction actor/reason/time, and preserves an audit shell.
- Pending receipts become `blocked(source_redacted)`; delivered/read/acknowledged receipts become `revoked_after_delivery(source_redacted)` without erasing historical timestamps.
- Active source-derived Items become `suppressed(source_redacted)`. `detail` and direct attachment refs become unavailable; `summary` becomes a fixed safe placeholder or is otherwise withheld by the owner presenter. Closed/expired Items retain workflow history but expose only an unavailable shell.
- Source-derived AI classifications/candidates/context projections are invalidated. My-Chat stops pending activation and old deep links reread unavailable owner state; already-sent provider copies cannot be claimed as physically recalled.
- Redaction does not mechanically delete a separately confirmed canonical care fact with its own authority/lifecycle. Unconfirmed source-derived candidates are invalidated; confirmed facts require their own correction/revoke/retention command and lose access to the redacted source body.

Cancel, withdraw, correction, and resend:

```text
cancel_route     = pre-delivery route cancellation
withdraw_item    = post-delivery stop-future-work action
redact_message   = source readability removal
correct_message  = append-only correction
```

- `cancel_route` transitions `pending -> blocked(user_cancelled_before_delivery)` using expected Receipt version. It suppresses any not-yet-visible Item, commits before asking the host to stop its Step, and does not redact the family Message.
- Once Receipt is delivered/read/acknowledged, cancellation cannot rewrite it as unserved. `withdraw_item` closes current Item work with `ItemEvent(reason=family_withdrawn)` while Receipt remains historical. Content removal uses redaction instead.
- Correction appends a new Message and ItemEvent/Item relationship; it never overwrites the original body. A deliberate resend/re-route is a new B2 command and new `routingAttemptKey`; technical retry retains the old key and blocked receipts do not reopen.
- Cancel-versus-route races use Receipt version/state: cancel winner blocks route; delivery winner makes `cancel_route` conflict and presenter offers withdraw/redact/correct actions.
- Caregivers may cancel their own clarification request (`waiting_for_family -> open` + correlated event) but cannot cancel/redact the family-authored source. My-Chat Admin cannot directly execute any of these Nurture transitions.

Clarification deadline/cancel:

```ts
type ActiveItemClarification = {
  activeClarificationRequestEventId: string;
  waitingForFamilySince: string;
  waitingForFamilyUntil?: string;
  clarificationExpiryDriverRef?: DomainContextRef;
};
```

- Token TTL affects only continuation entry and never changes Item business state. Nurture may recover the current wait through Item/business memory and issue a new safe token.
- A clarification business deadline is optional and distinct from Item `expiresAt`. If present, My-Chat creates the delayed Step before the request command commits the wait and opaque expiry driver ref.
- Expiry command requires matching `waiting_for_family`, active request event, and Item version. If the Item remains valid it appends `clarification_expired`, clears active wait fields, and returns Item to `open`/teacher attention. If Item business validity also ended, it appends the event and transitions Item to `expired`.
- Teacher cancellation appends `clarification_cancelled`, clears the active cycle, and returns a still-valid Item to `open`. The already-delivered clarification Message/Receipt remain historical.
- Family-response versus expiry/cancel is first-commit-wins through active event + version. A later scheduled command returns committed `already_satisfied`.
- Late family response is not discarded or interpreted as consent. It is stored as a family Message and routed under current grant/policy; it may append correlated `clarification_received` with `late=true`, keep/reopen teacher attention where valid, but cannot revive an expired Item or bypass revoke/redaction.

Required B3-C2a-d tests:

- revoke matrix, immediate read/write fence, bounded suppression convergence, waiting clarification cancellation, retained delivery timestamps, and new-grant-not-reactivation;
- redaction body/attachment/derived-display removal, receipt revocation, deep-link/cache invalidation, and independent confirmed-fact boundary;
- pre-delivery cancel versus route race, post-delivery withdrawal, correction append-only lineage, technical retry versus user resend key identity, and no host direct transition;
- token expiry non-effect, optional deadline host-first driver, response/expiry/cancel race, Item versus clarification expiry distinction, late response handling, and no inferred consent.

R8-B3-C2e technical exhaustion and Admin recovery are locked:

| Condition | Host state | Nurture Receipt result |
| --- | --- | --- |
| Automatic technical retry continues | Step retry/attempt state | Keep `pending(workflow_processing)`; same driver/command/routing identity |
| Host retry budget exhausted | Step `manual_review_required` with evidence ref | Keep `pending`; host exhaustion alone cannot assert business failure |
| Re-evaluation finds grant/source/scope/policy termination | Host may remain manual review until reconciliation completes | `blocked` with the existing specific business reason |
| Re-evaluation finds route already committed | Step reconciliation/B2 replay | Keep delivered/read/acknowledged; never overwrite with failure |
| Re-evaluation finds recovery still possible | Admin or trusted reconciliation may retry | Keep `pending` and original identity while it remains the same technical attempt |
| Owner-authorized recovery is exhausted while business prerequisites remain valid | Exhausted/manual-review evidence retained by host | `failed(technical_recovery_exhausted)` |

Owner commands and guards:

- `reevaluate_route` reloads the current Receipt, source, grant, scope, target, Item, policy, and host evidence ref. It may converge to an existing state, return a safe recovery action, or perform a Nurture-owned blocked transition; My-Chat cannot decide the result.
- `fail_route` is the only MVP command that commits Receipt `failed`. It requires trusted service/Admin purpose, immutable exhausted/manual-review evidence ref, expected Receipt version, current `pending` state, and execute-time owner policy. The host evidence proves technical exhaustion but does not authorize the business transition.
- If delivery committed before `fail_route`, current-state/version guards plus B2 replay return `already_satisfied` or conflict. The command cannot rewrite delivered history.
- `failed` is terminal and never transitions back to pending. A deliberate recovery uses `reissue_route`: My-Chat creates a new durable Run/Step first, then Nurture uses a new command identity, `routingAttemptKey`, and Receipt with `retryOfReceiptId` pointing to the failed row.
- Technical retry before failure is not reissue: it preserves the original Step, command identity, routing key, and Receipt. This prevents duplicate items/messages while preserving a complete failure/recovery history.

Admin and presentation boundary:

- Pilot-0-B3-1d-1 refinement: My-Chat Technical Admin may inspect safe attempts/evidence and opaque refs, reconcile the original outcome-unknown Step, replay/stop an eligible Handoff, and request `reevaluate_route` through owner recovery. The earlier direct Admin permission for `reissue_route` or `cancel_route` is superseded; a currently entitled business actor or Nurture owner recovery service decides business cancel/failure/resend under current policy.
- My-Chat Admin cannot directly set `failed/blocked/delivered`, edit grant/dataClass/target/source refs, bypass revoke/redaction/current policy, or claim a logical delivery occurred.
- Nurture presenters map pending/manual-review/failed state into safe delayed, under-review, failed, or recovery-action UI without exposing inaccessible targets or raw host error details.
- MVP adds only `technical_recovery_exhausted` as a Receipt failed reason. Detailed provider/worker/DB errors and attempt evidence remain under the host Step; deterministic business termination continues to use existing `blocked` reasons.

Required B3-C2e tests:

- retry/exhaustion does not mirror Step state into Receipt, and optional activation failure remains irrelevant;
- manual review plus `reevaluate_route` covers blocker, already-delivered, still-recoverable, and irrecoverable branches;
- `fail_route` authorization/evidence/version guards and delivery-versus-failure race converge without history rewrite;
- failed terminality, pre-failure same-key retry, post-failure new Run/command/routing key/Receipt, and valid `retryOfReceiptId` lineage;
- Admin allow/deny actions, safe presenter output, minimal failed reason taxonomy, and host-only technical details.

R8 closure:

- B1, B2, and B3-A/B/C1/C2a-e are locked; no R8 blocker remains.
- The earlier `grantRequirement?` refinement is already resolved by the command-level `grantDependencies[]` contract and execute-time rechecks.
- AI classification/drafting, attachment upload, owner reads, and other remote work are already outside the B2-C DB transaction; Execute consumes immutable refs/hash and current local policy only.
- IIA-0 may now proceed to a contract-closure scan and design-to-implementation mapping without adding another routing, attempt, recovery, or generic business-lifecycle aggregate.

Implementation constraints retained after closure:

- Commit class/batch operations per child or bounded chunk so one child failure does not roll back unrelated child scopes.
- Ensure safe user states do not disclose inaccessible target existence; My-Chat receives only presenter output.

Typical-scenario compatibility:

| Scenario | Current assessment | Required condition |
| --- | --- | --- |
| Family sends a care-day note | Covered by B3-A/B contract; IIA implementation pending | Distinguish message accepted by Nurture from routed/delivered to teacher workflow. |
| Two teachers acknowledge concurrently | Covered by B2 contract; IIA implementation pending | Durable idempotency plus aggregate-version/conditional transition. |
| Teacher requests family clarification | Covered by B3-A/B/C2a-d contract; IIA implementation pending | Durable clarification correlation, waiting, expiry/cancel, and late-response behavior. |
| Record daily care without sharing | Compatible | Internal record and `org_to_family` share remain separate commands. |
| Confirm media without family exposure | Compatible | Internal confirmation and publish/exposure remain separate commands. |
| Grant revoked before submit/retry | Compatible by contract | Execute/retry rechecks source and distribution grant dependencies. |
| Mobile offline duplicate submit | Covered by B2 contract; IIA implementation pending | Same key/same payload replays result; same key/different payload blocks. |
| Crash after Nurture commit | Covered by B1/B2/B3-B contracts; IIA implementation pending | Scenario response/presenter can recover committed content; route Step and optional host activation must reconcile idempotently. |
| Correct already-shared care fact | Extensible | Append corrected fact/message/receipt; do not overwrite historical communication. |

## 3. Schema Design

### 3.1 Model Groups

| Group | Models | Required invariant |
| --- | --- | --- |
| Command reliability | `NurtureCommandExecution` | Every authoritative Nurture write uses one shared scenario-owned command kernel; host workflow idempotency does not replace Nurture transaction replay. |
| Interaction continuation | `NurtureInteractionContext` | Scenario tokens remain short-lived Nurture-local handles; persisted lifecycle is separate from resolver staleness/recovery outcomes and never authorizes by itself. |
| Core identity and binding | `NurtureParticipant`, `NurtureChildBindingAnchor`, `NurtureFamilyBindingAnchor`, workspace associations, `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily` | Adult login maps by `myChatUserId`; My-Chat owns platform Child/Family and bindings; typed anchors are body/authority-free; care facts resolve to workspace-local `childCareProcessId`; one active family per child care process. |
| Institution topology | `NurtureCareInstitution`, `NurtureCareGroup`, `NurtureEnrollment`, `NurtureCareRoleAssignment` | Teacher/admin access comes from role assignment + scope, not My-Chat account role. |
| Grant and receipt | `NurtureChildLinkGrant`, `NurtureChildLinkReceipt` | Delivered/read/acknowledged cross-role state requires active matching grant, direction, data class, enrollment, and scope; pending/blocked/failed may preserve partial resolution under B3-A. |
| Family care communication | `NurtureFamilyCareThread`, `NurtureFamilyCareThreadParticipant`, `NurtureFamilyCareMessage`, `NurtureFamilyCareItem`, `NurtureFamilyCareItemEvent` | Raw message body and item workflow state are Nurture canonical; My-Chat receives only realtime projection or opaque delivery refs. |
| Care facts and projections | `NurtureDailyCareLog`, `NurtureTeacherAttentionItem` | Daily care and attention items are child-scoped. `careGroupId` is a teacher workflow dimension only. |
| Media attribution | `NurtureMediaAssetRef`, `NurtureChildMediaAttribution` | Recognition creates candidates only; family-visible child album views require teacher confirmation and exposure policy. |

### 3.2 Enum Groups

IIA should add stable enums instead of stringly typed policy values where the values are already locked:

- Role/scope: `NurtureCareRole`, `NurtureCareScopeType`, `NurtureCareRoleAssignmentStatus`.
- Lifecycle: `NurtureParticipantStatus`, `NurtureChildStatus`, `NurtureChildCareProcessStatus`, `NurtureFamilyStatus`, `NurtureEnrollmentStatus`.
- Grant: `NurtureChildLinkGrantStatus`, `NurtureGrantDirection`, `NurtureGrantDataClass`, `NurtureGrantReceiptStatus`.
- Communication: `NurtureFamilyCareThreadStatus`, `NurtureFamilyCareMessageStatus`, `NurtureFamilyCareItemStatus`, `NurtureFamilyCareItemPriority`.
- Interaction continuation: `NurtureInteractionPurpose`, `NurtureInteractionContextStatus` (`active|consumed|revoked`).
- Care and media: `NurtureDailyCareLogStatus`, `NurtureTeacherAttentionItemStatus`, `NurtureMediaAssetStatus`, `NurtureMediaAttributionStatus`.

Use a mapping layer for institution-local labels. Do not let institution vocabulary create new grant/policy `dataClass` values in MVP.

### 3.3 Required Constraints

IIA implementation must enforce these constraints in repository logic and, where Prisma/Postgres can express them safely, in DB indexes:

- Active participant mapping: one active `NurtureParticipant` per `(workspaceId, myChatUserId)`.
- Active family mapping: one active `NurtureFamily` per `(workspaceId, childCareProcessId)`.
- Active role assignment candidate: one active `(workspaceId, participantId, role, scopeType, scopeId)`.
- Active enrollment candidate: one active `(workspaceId, childCareProcessId, institutionId, careGroupId)`.
- Family thread candidate: one active private `NurtureFamilyCareThread` per `(workspaceId, childCareProcessId, familyId, enrollmentId)`.
- Child-specific facts: message/item/log/attention/media attribution writes must include `childCareProcessId`.
- Grant receipt/routing idempotency: one receipt per `(workspaceId, direction, sourceType, sourceId, routingAttemptKey)`; nullable grant/data-class/target fields are resolved state, not identity.
- Interaction token identity: one context per `(workspaceId, tokenHash)`; raw token is absent, expiry derives from `expiresAt`, and participant/conversation lookup indexes include status + expiry.

If Prisma cannot express a partial active uniqueness requirement directly, IIA should document the DB migration SQL or enforce the invariant in repository transactions with an explicit test.

### 3.4 Existing P0 Table Coexistence

Current Prisma already contains P0 family workflow tables such as profile snapshots, family charter, context material, workflow project/capture/review, and workflow ledger tables. IIA should add institution ecology models alongside them. Do not rewrite P0 tables as part of IIA unless a migration plan is explicitly approved.

## 4. Resolver and Policy Design

### 4.1 Resolver Inputs

All policy checks should normalize through one actor-context resolver. The resolver input is limited to host invocation facts, current payload, generic display state, and Nurture-issued opaque tokens:

```text
host:
  myChatUserId
  workspaceId?
  scenarioKey
  surface
  hostRequestId
  submittedAt?
  locale?
  timeZone?

conversation?:
  hostConversationRef?
  hostTurnId?
  previousTurnRef?

event:
  kind: chat_message | surface_open | scenario_token_event | form_submit | notification_open

payload?:
  text?
  structuredPayload?
  formData?
  attachmentRefs?

scenarioToken?:
  token
  purpose: clarify | submit_action | open_notification

displayState?:
  selectedViewKey?
  filters?
  sort?
  pagination?
  clientLocalContext?

idempotency?:
  hostRequestId?
  clientMutationId?
  attemptKey?
```

Resolver inputs must not include host-authored `targetRef`, `workScopeHint`, `selectedRoleAssignmentId`, `childCareProcessId`, `careGroupId`, `institutionId`, `grantId`, `dataClass`, `direction`, or policy decisions. If a rendered Nurture UI needs to resume a target/action/scope, Nurture must issue a `scenarioToken` and resolve it on the next call.

Resolver result shape:

```text
status: resolved | needs_clarification | blocked

actor:
  participantId
  myChatUserId

role:
  roleAssignmentId?
  roleKind?
  scopeType?
  scopeId?

workScope:
  kind: child_process | family | care_group | institution
  childCareProcessId?
  familyId?
  careGroupId?
  institutionId?
  enrollmentId?

target?:
  objectType
  objectId
  childCareProcessId?
  lifecycleState

continuity:
  nurtureInteractionContextId?
  pendingIntent?
  clarificationState?

clarification?:
  scenarioToken?
  interactionKind?
  reasonCode?
  optionCount?
  fieldCount?

policySeed:
  dataClass?
  direction?
  actionKey
  decisionReasonCode?
```

Resolver output consumers:

- The output is consumed by Nurture capability handlers, policy, query/projection services, command/workflow action services, presenters, and interaction context management.
- The output is not consumed directly by My-Chat and is not a write authorization result.
- Every render, action, and write uses resolver output as normalized context, then applies policy and object-current-state checks before returning data or mutating state.
- Child-specific writes must have `childCareProcessId` either in `workScope` or `target`; collection surfaces may resolve to `care_group` or `institution` first and let policy-scoped queries fetch child rows.

### 4.2 Surface Rules

The former aliases `mobile_chat|mobile_dashboard|admin_board|web_workbench|notification_deeplink` are legacy pre-C3 labels and MUST NOT appear in an activated C-3 manifest, route/presenter registry, candidate, or qualification evidence. The exact C-3 product surfaces are `nurture_chat|family_board|family_workbench|teacher_board`. `notification_open|invitation_continuation` are Host transitions rather than product surfaces; `institution_board|institution_workbench` stay absent until C-4.

- `nurture_chat`: My-Chat selects only Nurture; Nurture resolves role/scope/target and opens the protected composer before requesting business body/detail.
- `family_board|family_workbench`: current exact-Family Guardian owner reads/actions only; the Host passes no trusted role/scope/policy state.
- `teacher_board`: current exact operational Caregiver owner read/action only; Lead designation and Institution Admin are not substitutes.
- `notification_open|invitation_continuation`: use their dedicated signed Host-transition contracts and always re-resolve current owner state; they never become client surfaces or authority.

### 4.3 Policy Predicates

The pre-C3 policy table is superseded. Activated C-3 uses only the following versioned predicates; ThreadParticipant may narrow an already-authorized listing projection but never grants or denies authority.

| Policy | Allow when | Fail-closed reasons |
| --- | --- | --- |
| `nurture.can_view_child_care_process_v1` | Current exact-Family Guardian, or current exact operational `caregiver` RoleAssignment with `scopeType=care_group`; a current Enrollment under that CareGroup and current Grant/policy establish child reach. Institution/Enrollment-scoped roles, Admin, Lead-alone, and ThreadParticipant deny. | `participant_missing`, `role_missing`, `scope_mismatch`, `grant_invalid`, `child_not_visible`. |
| `nurture.can_write_family_care_message_v1` | Guardian capture has current family/original-Grant authority; Caregiver reply is the exact current `scopeType=care_group` operational RoleAssignment that owns the acknowledged Item claim and original Grant. Thread status is only an object precondition. | `thread_inactive`, `role_revoked`, `claim_mismatch`, `grant_invalid`, `item_not_replyable`. |
| `nurture.can_receive_family_context_v1` | Exact current operational role is `caregiver + scopeType=care_group`; Enrollment is child reach beneath that CareGroup, not role scope. `open` permits only the exact sole current eligible role. `acknowledged|replied` permits only the stored claimant Participant + same current RoleAssignment. Temporary same-row fences deny until recovery; terminal loss, new/peer role, Institution/Enrollment-scoped role, Admin, Lead-alone, or ThreadParticipant deny. Original active `family_to_org` Grant/data class remains required. | `grant_missing`, `grant_revoked`, `data_class_mismatch`, `enrollment_inactive`, `role_missing`, `claim_mismatch`, `role_episode_changed`. |
| `nurture.can_share_to_family_v1` | Exact acknowledged claimant on the same current operational `caregiver + scopeType=care_group` RoleAssignment, current original `org_to_family` Grant/data class, current Enrollment under that CareGroup, and replyable Item version. Institution/Enrollment-scoped role, Admin, Lead-alone, peer/new Caregiver, and ThreadParticipant deny. | `grant_invalid`, `claim_mismatch`, `role_mismatch`, `item_not_replyable`. |
| `nurture.caregiver_scope_v1` | Exact operational `caregiver` RoleAssignment has `scopeType=care_group`; the target child has a current Enrollment under that CareGroup. Institution/Enrollment-scoped roles deny and Lead is metadata only. | `care_group_mismatch`, `enrollment_inactive`, `role_missing`. |
| `nurture.can_confirm_media_attribution` | Future separately versioned capability, outside C-3 qualification and never usable as family-message authority. | `capability_unavailable`. |

Policies should return structured decisions, not booleans only, so handlers can write receipts, item events, audit shells, and safe UI states.

## 5. Capability Design

Teacher mobile is the primary execution surface for first-slice institution ecology. Teacher mobile composes the capabilities in the following list, but each capability remains independently declared, authorized, tested, and evolved.

Implementation order is not the same as capability membership. IIA includes all four first-slice capabilities in the manifest contract, while implementation starts with the `class_family_inbox` + `teacher_attention_board` closure.

### 5.1 `class_family_inbox`

Entrypoint: `open_class_family_inbox`.

Reads:

- Exact current operational `caregiver` RoleAssignment with `scopeType=care_group`; Institution/Enrollment-scoped roles are invalid for the C-3 Pilot.
- Active enrollments in the care group.
- `NurtureFamilyCareItem` rows for those child scopes.

Writes for the C-3 Pilot profile:

- Explicit acknowledge appends only the exact acknowledge event/state transition and claim evidence.
- Exact acknowledged claimant may submit one protected manual reply; the reply writes one family Message/Receipt and makes the Item terminal `replied`.
- System revoke/redaction/privacy fences may suppress; assign, snooze, clarification, follow-up, close/reopen, second reply, and AI draft are unregistered.

Pilot tests MUST prove that one teacher sees one inbox for the exact three child-private threads without cross-family message visibility. The historical ten-thread test may remain as non-qualifying scale coverage.

### 5.2 `teacher_attention_board`

Entrypoint: `open_today_attention_board`.

Reads a materialized, rebuildable `NurtureTeacherAttentionItem` projection grouped by `careGroupId`, but every row must include `childCareProcessId`.

Tests must prove that source changes in messages, care constraints, daily care logs, grant state, or redaction update/hide the projection without changing source facts.

### 5.3 `caregiver_daily_care`

Entrypoint: `record_daily_care_log`.

Writes operational care observations such as meal, nap, mood, activity, hygiene, and non-diagnostic health observations. Health-related entries must remain operational and must not produce diagnosis, treatment, medication dosage advice, or emergency replacement guidance.

Tests must prove caregiver scope, child scope, grant-gated family sharing, and health-safety refusal/escalation behavior.

### 5.4 `child_media_attribution`

Entrypoint: `classify_child_media_assets`.

Writes candidate `NurtureChildMediaAttribution` rows from reference images and class assets. Family-visible views require teacher/admin confirmation plus exposure policy checks.

Tests must prove candidate-only recognition, confirmation gate, rejected/corrected attribution lifecycle, revoke/exit exposure stop, and no direct host/public publication.

## 6. Test Contract

The IIA Test Contract defines what implementation must prove before a capability is considered correct. It is not only a list of test files. It is the executable acceptance boundary for the locked IB semantics.

### 6.1 Required Semantics

Implementation tests must prove these semantics:

- My-Chat mobile chat does not select a Nurture role. Nurture resolves role, scope, and output from participant state and target context.
- Dashboard, teacher board, admin board, and web workbench may return a Nurture-issued `scenarioToken`, but My-Chat must not author `selectedRoleAssignmentId`, `targetRef`, or work scope refs. Nurture resolves and validates ownership, status, and scope before use.
- Ambiguous role, work scope, target, intent, or memory matches return `needs_clarification` with typed candidates unless the case is forbidden, revoked, redacted, stale-unsafe, or scope-invalid.
- `needs_clarification` returns a structured My-Chat interaction request with opaque `scenarioToken` and option tokens, not long prose or Nurture business ids.
- Scenario token MVP supports only `clarify`, `submit_action`, and `open_notification`; token use never authorizes by itself and always rechecks current Nurture state.
- A `NurtureChildCareProcess` has exactly one active `NurtureFamily` in MVP.
- Child-specific facts cannot be written without `childCareProcessId`.
- A teacher sees one class inbox over the exact three Pilot child-private family threads, without cross-family message visibility; the separate class-of-ten fixture is scale-only.
- A teacher workflow action can distribute a family-facing message only to the target child's private family timeline; it cannot write to another family or bypass item/event/log traceability.
- `NurtureChildLinkGrant` revoke blocks future delivery, pending outbox, retry/replay, cached context pack reuse, stale notification actions, and opened-before-revoke submit.
- `NurtureFamilyCareMessage` lifecycle remains `sent` / `redacted` / `failed`; projection suppression does not mutate message status.
- My-Chat does not persist Nurture render envelopes. Old notifications and deep links must re-resolve through Nurture.
- Media recognition creates candidate attribution only; child/family-visible views require confirmation and exposure policy.

### 6.2 Test Layers

| Layer | Test file target | Required cases |
| --- | --- | --- |
| Schema/repository | `packages/nurture-scenario/tests/institution/schema-invariants.test.ts` | active participant uniqueness, one active family per child process, child-scoped fact writes require `childCareProcessId`, active role assignment uniqueness, grant receipt idempotency. |
| Resolver/policy | `packages/nurture-scenario/tests/institution/policies.test.ts` | mobile chat role-agnostic ingress, scenario token classification, source-adapter eligibility filtering, candidate merge/dedupe/ranking/ties/limits, ambiguity -> structured clarification, caregiver scope, guardian access, admin exposure limits, fail-closed reason codes. |
| Family inbox | `packages/nurture-scenario/tests/institution/class-family-inbox.test.ts` | exact three-child Pilot private timelines and negative boundaries; the existing class-of-ten cases are scale-only and cannot reintroduce clarification/follow-up/close aliases into the C-3/C4 profile. |
| Grant/runtime fence | `packages/nurture-scenario/tests/institution/grant-runtime-fence.test.ts` | revoke blocks new delivery, pending outbox, retry/replay, cached context pack, stale notification, opened-before-revoke submit. |
| Message lifecycle | `packages/nurture-scenario/tests/institution/message-lifecycle.test.ts` | `sent` / `redacted` / `failed`, no message-level `hidden` / `deleted`, redacted body/attachments unavailable, projection suppression separate. |
| Daily care | `packages/nurture-scenario/tests/institution/daily-care.test.ts` | caregiver quick record, group/batch record with child scopes, org-to-family sharing through grant, health boundary. |
| Media | `packages/nurture-scenario/tests/institution/media-attribution.test.ts` | candidate attribution, confirmation, rejection/correction, family exposure policy, revoke/exit exposure stop. |
| Manifest/conformance | existing conformance tests plus institution additions | capability keys, resolver refs, policy keys, artifact types, handoffs, event payload policy. |
| Journey | C-3/C4 joint harness; historical `packages/nurture-scenario/tests/institution/institution-class-of-10.journey.test.ts` remains scale-only | Exact three-child/`2 + 1 + 1` Guardian topology, one operational Caregiver, separate Lead designation, real owner paths, and the locked C-3/C4 journey matrices. |

### 6.3 Required Fixture Shape

The canonical Pilot fixture MUST include:

- One `workspaceId`.
- One institution.
- One care group.
- Three `NurtureChildCareProcess` records.
- Three active `NurtureFamily` records, one per child care process.
- Three active `NurtureEnrollment` records into the same care group.
- Three private `NurtureFamilyCareThread` records.
- One operational `caregiver + scopeType=care_group` RoleAssignment and one explicit exact-group Lead designation for the same Participant; Lead alone grants no teacher access.
- Four Guardian participants distributed exactly `2 + 1 + 1`; no Institution Admin/Caregiver or Guardian/Caregiver role overlap enters Pilot evidence.
- Active and revoked `NurtureChildLinkGrant` records covering `family_to_org` and `org_to_family`.
- Pilot family-care messages use only the locked `family_care_question` profile; daily-care, constraint, clarification, and follow-up inputs remain non-activatable for the Pilot communication journey.
- At least one redacted message, one suppressed projection, one stale notification/deep link ref, and one candidate media attribution.

### 6.4 Structured Decision Requirements

Policy and resolver tests must assert structured decisions, not only boolean results.

Expected decision shape:

```text
allowed
reasonCode
resolvedRefs
auditPayload
safeUserState
```

Required fail-closed reason codes:

- `participant_missing`
- `role_missing`
- `role_revoked`
- `scope_mismatch`
- `care_group_mismatch`
- `child_not_visible`
- `thread_inactive`
- `family_thread_missing`
- `grant_missing`
- `grant_revoked`
- `data_class_mismatch`
- `enrollment_inactive`
- `message_redacted`
- `stale_deeplink`
- `token_expired`
- `token_replayed`
- `token_mismatch`
- `token_revoked`
- `asset_scope_mismatch`
- `child_not_enrolled`
- `exposure_policy_missing`
- `health_safety_boundary`

### 6.5 Non-Pass Conditions

These outcomes are explicit failures even if the happy path appears to work:

- A teacher can render another family's private message body from class inbox data.
- A family input is delivered into a direct teacher chat inbox instead of entering the Nurture item/workflow pipeline.
- A teacher must monitor ten direct family chat rooms, or a teacher command appends arbitrary text to a family timeline without a source action/item/event/log.
- AI/system/institution-generated copy is displayed as if a named caregiver personally authored or confirmed it.
- My-Chat notification failure erases, rolls back, or becomes the source of truth for a committed Nurture work fact or family-facing canonical message.
- A child-specific care fact can be created with only `careGroupId`, `familyId`, or `participantId`, without `childCareProcessId`.
- My-Chat host state stores or reuses long-lived `safeSummary`, `safeBody`, `urgency`, `requiresAction`, or other Nurture render-envelope fields as canonical state.
- A revoked grant only hides UI while outbox, retry, replay, cached context, or submit actions still use revoked context.
- A redacted message remains readable through raw body, direct attachment URL, cached presenter output, or stale notification copy.
- `NurtureTeacherAttentionItem` becomes a class-owned fact without `childCareProcessId`.
- Media recognition directly publishes to family-visible albums without teacher/admin confirmation and exposure policy.
- Dashboard role switching accepts a host-authored `selectedRoleAssignmentId`, or trusts a scenario token without rechecking participant ownership, role status, and scope.
- Mobile chat chooses the broadest available role instead of asking clarification or returning safe scenario-level output when target context is ambiguous.
- Resolver auto-selects one child, class, role, or item when multiple plausible candidates remain in the same deterministic match class.
- Resolver uses recency, urgency, priority, due time, model confidence, or stable id alone to eliminate a business ambiguity.
- Retrieval silently truncates plausible candidates and auto-selects from the retained top subset instead of asking for a discriminating child/date/topic field.
- Clarification is returned as long prose that My-Chat must interpret instead of a structured interaction request.
- Clarification options expose Nurture business ids or require My-Chat to understand child, role, item, grant, or policy semantics.
- Scenario token is treated as authorization and skips resolver, policy, grant/runtime fence, object lifecycle, or command precondition checks.
- MVP token implementation introduces signed business payloads, full object version vectors, or post-MVP token purposes before the DB-handle MVP is proven.
- Expired or consumed `submit_action` token can still mutate state without reopening/revalidating the action.

## 7. Implementation Verification Commands

These commands are expected after code/schema work begins:

```bash
pnpm typecheck
pnpm test
pnpm test:db
node .ai/scripts/ctl-db-ssot.mjs sync-to-context
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

IIA implementation should run DB mutation commands only after the schema diff/migration plan is reviewed.

## 8. Acceptance Criteria

- A fresh reader can derive the first institution schema migration from `06-ib-nurture-schema-spec.md` plus this IIA design.
- Every first-slice child-specific model has a required `childCareProcessId`.
- Policies return structured fail-closed decisions and do not rely on My-Chat account roles.
- My-Chat mobile chat remains scenario ingress; Nurture owns role/scope/output resolution.
- Dashboard role switching uses Nurture-issued `scenarioToken` and revalidates ownership, status, and scope.
- Ambiguous resolver cases return structured clarification or blocked states; My-Chat renders generic choice/form/input primitives only.
- Scenario token MVP is an opaque Nurture DB handle with only `clarify`, `submit_action`, and `open_notification` purposes.
- One class with the exact three Pilot child scopes has three child-private family timelines and one teacher class inbox; family inputs and teacher actions are connected only through Nurture workflow-mediated distribution. Class-of-ten evidence remains scale-only.
- Named caregiver messages require caregiver-confirmed actions and source trace refs; system/institution messages remain explicitly attributed.
- Nurture work/message persistence remains valid when My-Chat notification delivery fails or retries.
- Grant revoke stops future delivery and active work context without deleting historical actions.
- Redaction and projection suppression remain separate.
- Media recognition creates candidates only; teacher/admin confirmation and exposure policy control child/family views.
- My-Chat host delivery persists only opaque delivery bookkeeping.
