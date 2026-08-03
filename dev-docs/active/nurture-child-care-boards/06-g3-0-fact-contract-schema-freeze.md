# G3-0 Fact, Contract and Schema Freeze

## Verdict

- Task: T-006
- Date: 2026-08-02
- Verdict: `G3_0_FREEZE_PASS`
- Next checkpoint: G3-A Shared Board Foundation
- Implementation posture at freeze time: board/publish capabilities and schema delta were frozen
  but not implemented or registered. **Superseded 2026-08-02:** all 24 capabilities are registered
  at `1.0.0`, the schema delta is landed and migrated, and the owner read lane is implemented; see
  `03-implementation-notes.md`. The freeze below is unchanged — only this posture line was stale,
  and `assert-g3-0-freeze.mjs` had been asserting the opposite of it.
- Non-effects: no migration, persistent database apply, owner-repository mutation, environment
  value, capability activation, artifact publication, deployment or traffic change

G3-0 freezes the implementation boundary for G3-A through G3-E. It opens G3-A and the
required G3-B1/G3-C1 domain work. It does not qualify a public board capability, a publication
provider, T-007 policy provider/consumer integration or a Beta Profile Handoff.

## Exact Inputs

| Input | Exact identity | G3-0 use |
| --- | --- | --- |
| T-002 owner path | My-Chat `a0195662228a2fc6323b9ea0cd327d3608d8cc17`; My-Workflow-Base `06303e9f404e4ccc0ba3054b763675efe81b5b15` | trusted caller, current authority, child/Enrollment/CareGroup/Grant and transaction boundary |
| T-004/T-005 surface artifact | `nurture.surface-contract@1.8.0`; `sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a` | current envelope, surfaces, presenters, visibility and T-005 direct action |
| T-005 direct interaction | `initiate_caregiver_direct_message@1.0.0` | restricted-content route only; no T-006 wrapper or fallback |
| T-007 policy contract | `nurture.institution-publication-policy@1.0.0` | schedule/organize policy input; implementation and qualification remain pending |
| DB SSOT | `prisma/schema.prisma`; generated context version 2, 60 tables after the landed G3 delta (50 at freeze time) | landed-fact census and future additive migration boundary |

Normative handoffs are
[T-002 M5](../nurture-institution-mode/16-owner-integration-handoff-m5.md),
[T-005 G2 Exit](../../archive/nurture-family-care-conversation/14-g2-exit-qualification-and-beta-handoff.md)
and [T-007 G4-0B](../nurture-institution-surfaces/08-g4-0b-publication-policy-freeze.md).
The T-005 handoff's final Nurture self-pin is `4cd8b8b5…`; that archive-path-only rotation does
not change the exact surface artifact or owner/source population above.

## Canonical Fact Inventory

The board envelope and its modules are derived results. They MUST NOT be persisted as a unified
child-state row or accepted as mutation authority.

| Fact family | Canonical owner / landed source | G3 use | Mutation boundary | Freeze disposition |
| --- | --- | --- | --- | --- |
| family direction | Nurture `NurtureFamilyCharter` / `NurtureFamilyCharterItem` | Guardian direction line | versioned family-strategy capability | reuse; never infer child scope from payload |
| current focus | Nurture `NurtureFocusCycle` / `NurtureFocusGoal` | Guardian current focus; authorized Caregiver context | `update_guardian_current_focus@1.0.0` | extend with explicit goal-to-`ChildCareProcess` scope; unscoped legacy rows are not guessed into child focus |
| daily care | Nurture `NurtureDailyCareLog` | Caregiver child-today and Guardian released activity | `record_caregiver_daily_care@1.0.0`; later correction capability | reuse exact child/process/Enrollment/CareGroup/role heads; `shared` alone does not replace `PublicationRelease` |
| attention | Nurture `NurtureTeacherAttentionItem` plus its source fact | Caregiver work priority | action routes to the source owner's capability | reuse; no generic board-level “resolve everything” write |
| family care | T-005 Message/CareItem/Event/Receipt/CommandExecution | Caregiver family work and Guardian timeline refs | exact T-005 capabilities | reuse `query_caregiver_family_care_work@1.1.0`; no copy or second transcript |
| media asset | Nurture `NurtureMediaAssetRef` | exact original media revision | G3-C media lifecycle capabilities | extend existing model/lifecycle once; do not add a parallel G3 media table |
| child attribution | Nurture `NurtureChildMediaAttribution` | G3-C eligibility and provenance | confirm/reject/supersede capabilities | extend existing model/lifecycle once; no in-place history overwrite |
| capture | Nurture care-content owner; not yet landed | CareGroup internal source batch and stable watermark | `organize_care_capture_batch@1.0.0` | add capture source/batch facts; no family visibility by existence |
| publication process | Nurture/T-006; not yet landed | caregiver shared draft/review/pending/released/cancelled unit | T-006 process capabilities | add; never absorb upload, CareInteraction, ActionDelivery or Workflow state |
| publication release | Nurture/T-006; not yet landed | exact target family-visible effect | `release_publish_process@1.0.0` and post-release safety capabilities | add immutable per-target fact + Receipt; no cross-family transaction |
| institution policy | Nurture/T-007; contract frozen, provider absent | schedule and organize resolution | T-007 owner contract/admin capability | T-006 stores resolved values/head only; never owns policy configuration |
| action delivery | My-Chat | notification/deep link/device fan-out | My-Chat owner APIs | reference only; never a Nurture publication status |

### Authority predicates

- Guardian reads require current family Guardian authority, exact child/family association,
  the original Enrollment/Grant/fact visibility and purpose for every returned fact.
- Caregiver reads and writes require a current `caregiver | lead_caregiver` RoleAssignment whose
  own scope is the exact source CareGroup. An Institution-scoped Lead designation, Admin role,
  membership or same-Institution role is insufficient.
- `child_id`, `family_id`, binding, Enrollment and CareGroup remain routing/policy inputs, never
  standalone permission.
- Every mutation takes an owner-issued opaque target/process ref and current heads. Public typed
  input MUST NOT accept raw child/family/Enrollment/CareGroup/Grant identifiers.

## Surface and Module Topology

The public topology uses one role-specific envelope query and typed module queries. This avoids
both a cross-role super DTO and one oversized query schema that owns unrelated fact lifecycles.

| Layer | Exact capability | Version | Output responsibility |
| --- | --- | --- | --- |
| Guardian envelope | `query_guardian_family_board` | `1.0.0` | `SurfaceEnvelopeV1` module order, counts, opaque item/collection refs, actions and dependency NO-GOs |
| Guardian module | `query_guardian_current_focus` | `1.0.0` | family direction + explicitly child-scoped current-focus cards and provenance |
| Guardian module | `query_guardian_enrollment_activity` | `1.0.0` | paginated released daily-care/growth/media activity for one exact Enrollment target |
| Caregiver envelope | `query_caregiver_teacher_board` | `1.0.0` | `SurfaceEnvelopeV1` for one exact CareGroup, with no Guardian-only fields |
| Caregiver module | `query_caregiver_child_today` | `1.0.0` | child-today daily care + attention references under fact-level policy |
| Caregiver module | `query_caregiver_family_care_work` | existing `1.1.0` | T-005 CareInteraction work; reused without a T-006 compatibility copy |
| Caregiver module | `query_teacher_publish_queue` | `1.0.0` | T-006 draft/review/pending/released summary and exact process refs |

Envelope module kinds and order remain the exact `1.8.0` surface registry values:

- Guardian: `guardian_current_focus`, `guardian_enrollment_activity`, optional
  `institution_workflow_projection`.
- Caregiver: `caregiver_child_today`, `caregiver_family_care_work`,
  `teacher_publish_queue`.

T-003 remains design input rather than an implementation SSOT. Its useful modules map to the
current facts and T-004 module kinds as follows; superseded group-chat/15-second publication
semantics are not adopted.

| T-003 design module | Current module | Canonical sources / boundary |
| --- | --- | --- |
| Guardian “今日一瞥” | `guardian_enrollment_activity` | current authorized `PublicationRelease` refs over daily-care/growth sources; no delivery inference |
| Guardian “当前关注 / 方向行” | `guardian_current_focus` | FamilyCharter plus explicitly child-scoped FocusGoal; family direction and child focus remain distinguishable |
| Guardian “成长线 / 园区日记” | `guardian_enrollment_activity` | one exact Enrollment target, paginated semantic time order, source/provenance filters |
| Guardian “新建关注点 / 记一笔” | module action refs | current eligibility for the focus or family-observation owner; never a snapshot patch |
| Caregiver “今日班级 / 每娃状态” | `caregiver_child_today` | DailyCareLog + TeacherAttentionItem under exact CareGroup and child fact policy |
| Caregiver “收件箱 / 家庭事项” | `caregiver_family_care_work` | existing T-005 CareInteraction query; private family body is not copied into class flow |
| Caregiver “班级流 / 拍照记录” | internal capture lane feeding `teacher_publish_queue` only after organize | CareCapture + stable media ref; raw capture remains CareGroup-internal |
| Caregiver “整理 / 待确认 / 待发送” | `teacher_publish_queue` | PublishProcess, exact saved revision, safety route and per-target release summary |
| Caregiver child/media attribution chips | `caregiver_child_today` or `teacher_publish_queue` action refs | existing media/attribution owner facts and G3-C versioned actions |

Each typed module result MUST bind contract/capability version, actor/scope, snapshot ref/version,
stable semantic order and `sourceHeads[]`. Each source head identifies an opaque canonical source,
fact version/lifecycle head and visibility/policy head needed to explain freshness. Cursor identity
MUST bind the exact contract, capability, actor, scope, snapshot, order and page size; a cursor is
invalid after relevant source, authority, correction, redaction or Grant drift.

Mutation action refs come from current owner eligibility. The presenter MUST NOT manufacture an
action from role names, module presence or a cached positive result. On commit it invalidates the
affected module/surface/target scopes and rereads the canonical owner.

### Current Workflow-projection compatibility decision

The exact `1.8.0` visibility matrix allows `institution_workflow_projection` on
`guardian_family_board` but explicitly denies it on `caregiver_teacher_board`. The first G3 beta
profile therefore freezes:

- Guardian Workflow projection: optional; absent/empty while the T-007 provider is absent.
- Caregiver Workflow projection: excluded. It MUST NOT be injected by the presenter or hidden in
  another module.

Future Caregiver adoption requires an explicit surface/visibility contract rotation and affected
conformance rerun. This resolves the planning-level MAY without creating a second current contract.

## Exact Dependency Contracts

### T-005 restricted-content route

- Capability: `initiate_caregiver_direct_message@1.0.0` under the exact `1.8.0` artifact.
- Input: closed protected plain text `{ body }`; target selection is the generic invocation's
  owner-issued, actor/workspace-bound, expiring `targetOptionRef`.
- Required heads: `enrollment_lifecycle`, `care_group_authority`, `direct_message_grant` and
  `direct_message_safety`, all at predicate version `1.0.0`.
- Result: `{ messageRef, receiptRef, contentState: "sent" }`; execute also returns the immutable
  CommandExecution ref, logical Receipt, invalidations and replay marker.
- Canonical effect: one encrypted caregiver direct Message + one family-targeted logical Receipt +
  one immutable CommandExecution; no CareItem, ItemEvent, Attention or PublishProcess effect.
- T-006 action context contains only the exact capability ref and owner-issued target option. It
  does not copy the restricted source body or auto-create the CareInteraction.
- `denied`/`unavailable` with `not_authorized`, `target_unavailable`, `dependency_no_go` or
  `contract_mismatch` is a safe blocked projection. T-006 MUST NOT fall back to
  `submit_family_care_question` or batch publication.

### T-007 publication policy

T-006 consumes `nurture.institution-publication-policy@1.0.0` exactly. Required output is
`policyRef`, exact Institution ref, positive version, monotonic `policyHead`, IANA `timeZone`,
release/cutoff local times, organize idle/fallback/quiescence/activity-lease parameters,
automatic-organize enablement and effective range.

Pilot defaults are `17:00`, `19:00`, `600`, `1800`, `60`, `60`, `true`. New processes resolve
server-time `scheduledAt`/`notAfter` and freeze policy/timezone/head/source-watermark values.
Existing processes are never silently moved by a later policy. Missing/invalid/ambiguous policy,
owner unavailable or contract mismatch creates no new schedule/process and fails release closed.

The T-007 contract is frozen, but its repository/provider and provider/consumer qualification are
still absent. G3-D pure-domain work MAY proceed with isolated exact fixtures; a real schedule/release
qualification and G3-E remain blocked until the owner provider is implemented and jointly tested.

## Capability Adoption Set

G3 implementation adopts one registry, with all new keys starting at `1.0.0`:

- G3-A queries listed in the topology plus `update_guardian_current_focus` and
  `record_caregiver_daily_care`.
- G3-B: `organize_care_capture_batch`, `acquire_publish_edit_hold`,
  `renew_publish_edit_hold`, `release_publish_edit_hold`, `save_publish_process_draft`,
  `reschedule_publish_process` and `cancel_publish_process`.
- G3-C1: `confirm_child_media_attribution`, `reject_child_media_attribution` and
  `supersede_child_media_attribution`.
- G3-D: `release_publish_process`, `correct_publication`,
  `remove_publication_target_visibility`, `redact_publication`,
  `detach_publish_process_media` and `discard_media_asset`.

This list reserves semantic identities; G3-0 publishes no placeholder descriptors or handlers.
Each checkpoint adds only implemented keys, rotates the exact surface artifact, and reruns affected
conformance. T-005 `initiate_caregiver_direct_message` is consumed directly and is not duplicated.

### Amendment 2026-08-02 — media lifecycle identities

The original set enumerated capabilities from the fact model, so the two media
lifecycle actions the product mapping already required were never given an
identity: the fact inventory names the `NurtureMediaAssetRef` mutation boundary
as "G3-C media lifecycle capabilities" without listing them. G3-C1 implemented
and tested both domain rules and recorded the gap rather than inventing an
unreserved key. This amendment completes the set:

| Key | Stage boundary |
| --- | --- |
| `detach_publish_process_media` | Removes one media reference from one editable `PublishProcess` composition. It never touches the asset lifecycle, another draft or anything published. |
| `discard_media_asset` | Pre-publication global delete. Legal only while zero `PublicationRelease` has committed anywhere; afterwards the remedy is target visibility removal or redaction. |

Both are pre-publication actions. They are scheduled with G3-D because they
share its per-target release facts and safety-action review, not because they
become post-release capabilities: `discard_media_asset` is exactly the action
that stops being legal once a release commits. The verdict, exact inputs,
authority predicates, surface topology and DB SSOT delta above are unchanged.

### Amendment 2026-08-02 — content safety marker facts

`ContentSafetySourceReadPort` requires the owner to return the deterministic
markers it derived from each exact source. The frozen fact set gave that fact
nowhere to live: `NurtureCareCapture` and `NurtureMediaAssetRef` store protected
content and lifecycle, and `NurtureContentSafetyAssessment` stores the *result*
of a routing decision, not its per-source input. Deriving markers at read time
would mean unsealing bodies inside the owner repository and moving the rule
vocabulary out of the domain, so this amendment adds the missing input fact:

| Column | Required boundary |
| --- | --- |
| `NurtureCareCapture.safety_markers_payload` | stable rule keys derived at intake, while the ingesting path still holds the plaintext; never body, never model prose |
| `NurtureMediaAssetRef.safety_markers_payload` | same vocabulary, derived when the asset is reviewed |

Both are nullable on purpose. `NULL` means "never derived" and is a different
fact from an empty list; the safety port fails closed on the former, so no
pre-existing row is silently routed as ordinary content. Neither column widens
what a public result may carry, and the capability adoption set, exact inputs,
authority predicates and surface topology above are unchanged.

### Amendment 2026-08-02 — command identity and the unanchored safety route

Verifying the B8 prerequisites found four facts the frozen set could not hold.
Each is an input the write lane needs before a command can be written at all, so
they are added here rather than discovered during implementation.

| Change | Why the frozen set could not hold it |
| --- | --- |
| `NurtureContentSafetyAssessment.publish_process_id` becomes nullable, and the row gains `care_group_id` + `organizer_input_revision` | `direct_interaction_required` deliberately creates no publication candidate, so the one route that most needs an audit trail was the only one that could not have a row |
| `NurturePublishProcessRevision.command_request_id_hash` + `@@unique([workspace, process, hash])` | the replay lookup searched `organizer_input_revision` — which carries the assembler's input revision — by command id, so it could never match, and no unique made the replay a row-level no-op |
| `NurturePublicationVisibilityEvent.command_execution_id` + `@@unique([workspace, release, command, kind])` | the append-only lineage could not name the command behind it, unlike both of its closest analogues |
| `NurturePublishProcess.schedule_policy_version` + `schedule_resolved_at` | the T-007 policy version and the resolution instant were being read off `aggregate_version` and `updated_at`, which a reschedule moves — so rescheduling appeared to change both |

Three owner-side facts are added in the same pass, for `must_equal` head
bindings the registry declares and no owner exposed: `hold_version` on the edit
hold, `batch_version` on the capture source, and `draft_revision` on the media
lifecycle facts. A prepare step cannot freeze a head it is never told.

The migration backfills both new NOT NULL columns from the process each existing
row already points at, and aborts on a row that cannot supply one — the gate
fired on 19 rows in a disposable database before the tables were recreated.

`NurturePublicationRelease` deliberately gains **no** version column. Its
visibility transitions are monotone and the new event-level unique already makes
a replay a no-op, so a version would buy a concurrency case that does not exist.
The capability adoption set, exact inputs, authority predicates and surface
topology above are unchanged.

### Amendment 2026-08-03 — the instant a pre-release cancel happened

`cancel_publish_process` is idempotent, and its frozen result requires
`cancelledAt` on both the fresh and the repeated answer. `NurturePublishProcess`
recorded only the *state*, so the repeat had no fact to answer from. The obvious
substitute, `updated_at`, is wrong: anything else touching the row moves it, so
a repeat would report a cancel at a moment it did not happen.

| Column | Required boundary |
| --- | --- |
| `NurturePublishProcess.cancelled_at` | the instant the pre-release cancel committed; present exactly while the process is `cancelled` |

Nullable on purpose — only a cancelled process has the fact — and paired with
`ck_nurture_publish_process_cancelled`, which refuses a cancelled row without
it. Nothing in a legacy cancelled row, or anything related to it, records the
instant, so the migration's census aborts on such a row rather than backfilling
one. The capability adoption set, exact inputs, authority predicates and surface
topology above are unchanged.

### Amendment 2026-08-03 — the draft save binds the client's observed revision

Locked decision D-08 requires every save to bind `expectedDraftRevision` and
makes head drift an explicit conflict. The frozen save input
(`title`/`segments`, additionalProperties: false) gave the client no channel to
state the revision its buffer was composed against — so the implementation froze
the owner's own current head, the drift check compared the server to itself, and
a concurrent save silently last-write-won. The check existed; the value it
exists to protect could not reach it.

| Change | Boundary |
| --- | --- |
| `save_publish_process_draft` input gains required `expectedDraftRevision` (integer, ≥ 0) | the revision the CLIENT observed; `0` means "no saved revision yet". The owner conflicts on mismatch. It is business input, not transport metadata: server-issued heads, refs and identities remain forbidden in typed input |

The surface artifact rotates additively to `nurture.surface-contract@1.14.0` /
`sha256:d03559e5c5624947bba0bc9b9f2671ddff187baf56f5f3d61d6ccb33a3fec24c`; the
shared core and every other capability slice are unchanged, and the capability
stays at `1.0.0` — it has never been activated and has no consumer. The
capability adoption set, exact inputs, authority predicates and surface topology
above are unchanged.

## DB SSOT Delta

All persisted changes originate in `prisma/schema.prisma` through the DB SSOT workflow. No JSON
payload below may replace the required scope, authority, revision or relation columns.

### Reuse without a second fact source

- Authority: ChildCareProcess, Family, CareGroup, Enrollment, RoleAssignment, Grant.
- Care facts: FamilyCharter, FocusCycle/Goal, DailyCareLog, TeacherAttentionItem.
- Cross-boundary spine: ChildLinkReceipt and CommandExecution.
- CareInteraction: all T-005 tables and three-axis lifecycle stay untouched by T-006.

### Extend in place

| Existing type | Frozen delta |
| --- | --- |
| `NurtureFocusGoal` | explicit many-to-many child scope through `NurtureFocusGoalChildScope`; no child inference from `goalPayload` |
| `NurtureMediaAssetRef` | immutable media revision/head and lifecycle `preparing/ready/unavailable/discarded/redacted`; legacy `active/hidden/deleted` must be migrated once with an evidence-backed mapping, not retained as a G3 compatibility branch |
| `NurtureChildMediaAttribution` | immutable revision/supersession link and lifecycle `candidate/confirmed/rejected/superseded`; preserve source/evidence and never overwrite confirmed history |
| `NurtureGrantDataClass` | add `child_growth_record`; each publish content unit has one audience data class (`daily_care_log` or `child_growth_record`), otherwise split the process |
| `NurtureChildLinkReceiptSourceType` | add `publication_release` |

The media migration mapping requires a pre-migration row census. Ambiguous legacy `hidden/deleted`
rows fail the migration gate and are not guessed into `discarded/redacted/superseded`.

### Additive T-006 facts

| Model | Required boundary |
| --- | --- |
| `NurtureFocusGoalChildScope` | exact Goal ↔ ChildCareProcess association with workspace and version/provenance |
| `NurtureCareCapture` | CareGroup-internal stable text/transcript/media source; protected content and immutable source head |
| `NurtureCareCaptureBatch` | collecting/cut/organized/cancelled batch, trigger identity, source watermark, policy/quiescence evidence |
| `NurturePublishProcess` | exact CareGroup, one data class/purpose, five-state lifecycle, current/frozen revision and resolved schedule heads |
| `NurturePublishProcessRevision` | append-only protected content/source/media composition and exact revision; no target-specific hidden body |
| `NurturePublishProcessTarget` | internal resolved child/process/Enrollment/family/original-Grant target behind an opaque public ref |
| `NurturePublishEditHold` | one expiring coordination hold per process; not authority, owner or process state |
| `NurtureContentSafetyAssessment` | append-only policy/rule/model/source heads and route; no sensitive body or chain-of-thought |
| `NurturePublicationRelease` | immutable target-specific committed effect bound to frozen revision, exact authority and Receipt |
| `NurturePublicationVisibilityEvent` | append-only correction/removal/redaction/replacement lineage; never deletes Receipt/audit |

T-007 owns the future policy persistence model. T-006 stores only the resolved contract values and
head on a process; it MUST NOT create a duplicate policy table.

## Required and Optional Profile

| Lane | First beta profile | Failure posture |
| --- | --- | --- |
| G3-B1 deterministic assembler | required | no copy provider still produces source-faithful/photo-only draft |
| G3-B2 AI copy | optional, absent initially | no placeholder; provider failure cannot block B1 |
| G3-C1 manual attribution/exposure | required | unresolved media remains `needs_review` |
| G3-C2 `ClassScopedFaceMatch` | optional/default-off | manual C1 path remains complete; no biometric processing |
| Guardian Workflow projection | optional/absent-empty | core Guardian board remains available |
| Caregiver Workflow projection | excluded by exact `1.8.0` | future use requires contract rotation |

## Acceptance-to-Check Mapping

Each G3-0 requirement has one mechanical check class. `pnpm verify:g3-0-freeze` emits the named
census groups and fails on exact-pin, source-contract, surface-visibility, DB inventory or
placeholder drift.

| Acceptance ID | Requirement | Check class | Mechanical target |
| --- | --- | --- | --- |
| `T006-AC-001` | landed focus/daily-care/attention/media/authority facts match DB context | `evidence_census` | `facts` census |
| `T006-AC-002` | no persisted board child-state aggregate or unimplemented T-006 schema/registry placeholder exists | `lint_static` | `absence` census |
| `T006-AC-003` | exact Guardian/Caregiver surface, presenter and ordered module contract is pinned | `lint_static` | `surfaces` check |
| `T006-AC-004` | two-level envelope/module query identities and current T-005 query reuse are unique | `lint_static` | `topology` check |
| `T006-AC-005` | exact T-005 direct action, heads, typed result and safe unavailable behavior are pinned | `lint_static` | `t005` check |
| `T006-AC-006` | exact T-007 policy identity, fields, defaults and freeze behavior are pinned | `lint_static` | `t007` check |
| `T006-AC-007` | media/attribution/publication schema uses one-owner lifecycle and explicit migration delta | `evidence_census` | `schema_delta` check |
| `T006-AC-008` | Caregiver Workflow projection remains denied/excluded under `1.8.0` | `negative_case` | `caregiver_workflow_denied` check |
| `T006-AC-009` | B1/C1 are required while B2/C2 and Workflow modules cannot become implicit gates | `lint_static` | `profile` check |
| `T006-AC-010` | G3-A is open while T-007 provider qualification and G3-E stay gated | `evidence_census` | `stage_gates` check |

## Stage Release

- **OPEN:** G3-A shared read pipeline, role-specific queries/presenters and synthetic fixtures.
- **OPEN:** G3-B1/G3-C1 pure domain, policy and schema implementation through their own
  checkpoint migrations/tests.
- **CONDITIONAL:** G3-D pure-domain state/release logic may use exact isolated fixtures, but real
  policy-backed scheduling/release remains dependency-unavailable.
- **BLOCKED:** G3-C2 activation, T-007 real provider/consumer qualification and G3-E joint Beta
  Profile Handoff.
- **OUT OF SCOPE:** persistent DB apply, capability activation, Candidate, native/device work,
  deployment and traffic.
