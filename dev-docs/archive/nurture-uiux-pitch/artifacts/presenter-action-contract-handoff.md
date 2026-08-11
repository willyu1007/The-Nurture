# T-003 Presenter / Action Contract Handoff

## Handoff identity

| Field | Value |
| --- | --- |
| Handoff | `nurture.t003.presenter-action-handoff@1.0.0` |
| Sender | The Nurture `T-003` |
| Receiver | My-Chat `T-036` (`mobile-chat-dashboard-uiux`) |
| Status | Delivered by sender on 2026-08-08 |
| Contract | `nurture.surface-contract@1.17.0` |
| Digest | `sha256:d22851d98a55299fb4a90f4ff461f6dbeb7ed3f075669ffb19cccb93018acdf8` |
| Presenter fixture | `teacher-release-presenter-fixture.v1.json` |

This artifact hands the T-003 product intent to T-036 through the current typed
surface contract. It is a receiver mapping aid, not a second API contract. A
contract version or digest rotation invalidates this handoff until it is
requalified against the new exact identity.

## Authority and source order

T-036 must consume sources in this order:

1. Exact generated contract identity in
   `packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.manifest.json`.
2. Surface/presenter/capability registries and their registered schemas under
   `packages/nurture-scenario/contracts/surfaces/v1/source/`.
3. Current product semantics in
   `docs/context/product/workflow-product-design-contract.md`.
4. Current mobile design input in
   `docs/context/product/nurture-mobile-ux-contract.md`.
5. T-003 historical decision notes and mockups as visual discussion material only; the old deck file was
   removed during pre-launch cleanup.

The receiver must never infer fields, actions, authority, navigation or success
from the HTML. It renders owner-projected content and current-eligibility action
references only.

## Six-surface mapping

| Product surface | Exact presenter | Contract content | Receiver rule |
| --- | --- | --- | --- |
| Guardian Nurture Chat | `present_guardian_nurture_chat` | `conversation`; family-care timeline/detail plus currently eligible submit/correct/withdraw/redact actions | Keep the AI/private-family boundary. Cross-owner mutation uses an emitted action reference and confirmation policy; no shared human room is implied. |
| Guardian family board | `present_guardian_family_board` | `board`; `guardian_enrollment_activity`, optional `institution_workflow_projection` | Bind or select an owner-issued exact enrollment target. Do not infer a child/family from labels or IDs shown in the UI. |
| Caregiver Nurture Chat | `present_caregiver_nurture_chat` | `conversation`; exact-CareGroup family-care work/detail and current actions | Render bounded coordination, acknowledgements and replies. An initiation action does not authorize a shared guardian/caregiver room or expose family-private facts. |
| Caregiver teacher board | `present_caregiver_teacher_board` | `board`; ordered modules `caregiver_child_today`, `caregiver_family_care_work`, `teacher_publish_queue` | This is T-036's teacher-dashboard entry. Read the envelope first, then use each module's registered query and only the action refs returned for the current snapshot. |
| Institution board | `present_institution_board` | read-only `board`; support/class/business/workflow projections | No registered capability currently binds to this presenter. Keep it unavailable/limited until an exact owner contract supplies content; do not borrow teacher or workbench actions. |
| Institution workbench | `present_institution_workbench` | `workbench`; institution workflow operations and supporting modules | T-003 supplies only intent and presenter identity. T-007 owns implementation prerequisites and capability availability; T-036 must not implement Web Admin from the pitch HTML. |

All presenters require the stable surface envelope fields: `contract`,
`surfaceKey`, `surfaceVersion`, `state`, `snapshotRef`, `snapshotVersion`,
`generatedAt`, `actorContext`, `contentFamily`, `content`, `actions` and
`dependencyNoGos`; `pageInfo` is optional. Surface states are only `ready`,
`limited`, `needs_setup` and `unavailable`.

## Teacher dashboard thin slice

T-036's first implementation slice is the exact CareGroup teacher board:

```text
present_caregiver_teacher_board@1.0.0
  -> caregiver_child_today
  -> caregiver_family_care_work
  -> teacher_publish_queue
       -> query_teacher_publish_queue@1.0.0
       -> row.actions[] (current eligibility only)
       -> row.familyGrowth[] (display-only delivery/lifecycle projection)
```

The presenter envelope defines module order, state, snapshot and dependency
NO-GOs. `query_teacher_publish_queue@1.0.0` supplies the detailed queue rows.
The handoff fixture was produced through the production presenter harness and
contains only synthetic values and owner-issued opaque refs.

### Display-field mapping

| T-036 UI element | Contract field | Constraint |
| --- | --- | --- |
| Queue filters/counts | `counts.{draft,needs_review,pending_release,released,cancelled}` | Queue-wide census, not the current page count. |
| Row identity | `processRef` | Opaque; never parse or reconstruct it. |
| Source status | `state` | One of the five publish-process states above. Do not replace partial target results with a single “published” label. |
| Safe title | `title` | Display-safe source title; no archive metadata. |
| Type and revision | `dataClass`, `revision` | `daily_care_log` or `child_growth_record`; revision is current source revision. |
| Target summary | `targetSummary.total`, `targetSummary.released` | Derived summary only; authority and outcomes stay per target. |
| Timing | `occurredAt`, optional `scheduledAt` | `scheduledAt` exists only after T-007 policy resolves a real send window. |
| Editing status | `editHoldActive` | Display state only; acquire/renew/release actions still require returned eligibility. |
| Allowed controls | `actions[]` | Render by `capabilityKey`, exact version and availability. Never derive an action from role or row state. |
| Delivery per target | `familyGrowth[].targetRef/state` | Display-only, opaque target. State: `delivering`, `applied`, `pending_guardian_confirmation`, `duplicate`, `tombstoned`, `rejected`, `conflict` or `outcome_unknown`. |
| Lifecycle overlay | optional `familyGrowth[].lifecycle` | `correction_appended`, `target_removed` or `redacted`; render beside delivery state, with no family archive data. |
| Pagination | `pageInfo.hasMore/nextCursor` | Cursor is snapshot-bound and opaque; refresh on drift. |

### Action mapping

The exhaustive capability set and schemas live in
`source/capabilities/capability-registry.json`; the receiver must not maintain a
hand-copied enum. For the teacher release flow, the relevant groups are:

- Read: `query_caregiver_teacher_board@1.0.0`,
  `query_caregiver_child_today@1.0.0`,
  `query_caregiver_family_care_work@1.1.0`,
  `query_teacher_publish_queue@1.0.0`.
- Capture/draft: `record_caregiver_daily_care@1.0.0`,
  `organize_care_capture_batch@1.0.0`,
  `save_publish_process_draft@1.0.0` and media-attribution/edit-hold actions.
- Release: `release_publish_process@1.0.0`; target policy is
  `owner_option_required`, and T-007 publication-policy joint conformance is a
  dependency gate.
- Follow-up: `reschedule_publish_process@1.0.0`,
  `correct_publication@1.0.0`,
  `remove_publication_target_visibility@1.0.0`,
  `redact_publication@1.0.0`, media detach/discard and process cancellation.

Buttons are projections of `actions[]`, not a static product matrix. A missing
action is unavailable even when a row looks eligible. `availability` is only
`available`, `already_satisfied` or `needs_input`; confirmation behavior comes
from the capability descriptor.

## Success and receipt language

- A Nurture source commit may be described as `来源已提交，正在投递`.
- Only `applied` or an exact `duplicate` receipt may close delivery as success.
- `outcome_unknown` requires lookup/reconciliation under the same identity; it
  must never offer a blind new release.
- Mixed target outcomes remain per-target and partial. One failure does not
  roll back an already applied sibling target.
- Lifecycle is append-only. Corrections do not overwrite the prior release or
  receipt, and redaction must not restore cached media.

## Superseded demo semantics

The following T-003 historical demo semantics are not implementation input:

- guardian/caregiver shared human rooms, class-group chat or direct-message UX;
- countdown/automatic family publication or any role-derived release button;
- teacher access to family archive, growth-material organization or cultivation;
- “老师确认接手” as personal ownership, or one reply closing a CareGroup item;
- use of “Workflow” for anything other than `InstitutionWorkflow`;
- institution write controls invented from the Web workbench mockup.

## Receiver acceptance checklist

- [ ] Admit only the exact contract key/version/digest above.
- [ ] Map the teacher board envelope and detailed queue fixture without adding
  fields or archive vocabulary.
- [ ] Render actions only from current response descriptors and preserve
  confirmation/target policies.
- [ ] Show `limited` plus `dependencyNoGos` when T-007 publication policy is
  unresolved; do not fabricate `scheduledAt`.
- [ ] Keep source commit, family-growth delivery receipt and lifecycle overlay
  visually distinct.
- [ ] Re-run receiver conformance after either repository rotates the contract.

Receiver adoption and component freeze remain T-036 work. T-003 is complete once
this sender-owned, exact-version handoff is landed; it does not depend on writing
into the receiver's currently conflicted worktree.
