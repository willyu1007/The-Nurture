# W4 director Prisma source freeze

Status: accepted for the W4 real-owner increment on 2026-08-15.

This record fixes the only data sources that the
`nurture.director-presenter@1.0.0` Prisma composition may use. It does not
change the published contract, authorize a provider gate, compose a My-Chat
public API/Mobile controller, or create a second director projection store.

## Authority and request binding

Every overview, drilldown, and material open must start from the authenticated
My-Chat user and Workspace routing values, then resolve exactly one active
`NurtureParticipant`, one current institution-scoped `institution_admin`
`NurtureCareRoleAssignment`, and one active `NurtureCareInstitution`.

`context_ref` is echoed and partitions the response cache. It is never parsed
as a Participant, role, Institution, CareGroup, Enrollment, Grant, Family, or
Child identifier. Zero current matches masks access; multiple current
participants, roles, or Institutions return `ambiguous_institution`. Every
deeper read rereads the exact Participant, role, and Institution heads inside
the read transaction.

Owner-issued drilldown, material-collection, item, and pagination refs are
integrity-protected opaque values. No raw Prisma identifier crosses the W4
contract.

## D-O01 through D-O14 source matrix

| Row | Presenter section/operation | Canonical source | W4.1 behavior |
| --- | --- | --- | --- |
| D-O01 | Organization/day header | `NurtureCareInstitution` plus the exact authority heads | Ready after exact authority resolution. |
| D-O02 | Attendance pulse | Active `NurtureEnrollment`, `NurtureDailyAttendanceSubmission`, and `NurtureAttendanceEntry` rows for the requested class-day | A submitted/reopened checkpoint yields a ratio. No checkpoint is `unavailable`, never zero absence. An institution with no active roster is `empty`. |
| D-O03 | Activity pulse | `NurtureActivityPlacement` rows whose canonical state is `placed` for the requested class-day | Ready count or honest empty state; the presenter does not inspect arbitrary capture bodies. |
| D-O04 | Message-response pulse | Current `NurtureFamilyCareItem` response/lifecycle axes in active institution Enrollments | Ready ratio over reply-requiring active items; no staff ranking or message body is exposed. |
| D-O05 | Home-kindergarten flow | Current `NurtureFamilyCareMessage.direction` and exact active Enrollment/CareGroup scope | Ready two-way flow metric; message bodies, attachments, Family ids, and Child ids stay absent. |
| D-O06 | Authorization changes | `NurtureChildLinkGrant` lifecycle/version changes joined through the exact Institution Enrollment | Ready count and class-level drilldown only. Grant content and identifiers stay absent and are reread rather than cached as authority. |
| D-O07 | Philosophy-to-practice insight | No normalized safe philosophy-observation presenter exists. `NurtureCareInstitution.philosophyPayload` is free-form and is not a safe substitute. | `unavailable`; W4 must not invent a focus label or causality from arbitrary JSON. |
| D-O08 | Trend presentation | Seven bounded daily communication counts from `NurtureFamilyCareMessage` in the exact Institution | Ready accessible trend with an explicit seven-day window. |
| D-O09 | Class-load attention | Existing `NurtureInstitutionSupportSignalService` and Prisma exact-owner `configured_load_threshold` path | Reuse the policy and source owners. No parallel threshold, stored signal, or staff judgment is allowed. Missing/malformed policy or source is independently `unavailable`. |
| D-O10 | New family focuses | `NurtureFocusGoalChildScope` joined to current Institution Enrollments and current `NurtureFocusCycle` lifecycle | Ready aggregate/class counts only. Goal payload, family ref, family-private text, and child/family identifiers stay absent. |
| D-O11 | Bounded drilldown | The same D-O02..D-O10 owners, selected by a signed owner ref | Maximum 50 display-safe class/individual rows. Every open reruns authority and exact scope checks; unsupported deeper levels fail closed. |
| D-O12 | Organized materials | No normalized institution protected-display policy plus owner-stream ingress is complete. Storage refs and signed URLs are forbidden. | The overview section is `unavailable`; material opens return `protected_material_denied` after current authority reread. `NurtureMediaAssetRef.storageRefPayload` is never read for W4.1. |
| D-O13 | Institution operation availability | Current product Workflow contract | Always `unavailable` with `web_workbench_required`; action, confirmation, command, and operation refs remain impossible. |
| D-O14 | Empty/partial/stale overview | Request-time composition over the independent sections above | One failed source produces `partial`, not a blank page. Missing is distinct from zero. The provider emits request-time `fresh`; stale/offline snapshot policy remains My-Chat composition work. |

## Layer and query rules

- `@the-nurture/scenario` owns the DB-free presenter service, response types,
  reference semantics, section independence, labels, and overall-state rules.
- `@the-nurture/db` owns Prisma authority and fact repositories. It returns
  canonical facts, bounded rows, and explicit source availability; it does not
  import scenario-service or create a presentation table.
- `scenario-service` keeps the existing service-authenticated routes, schema
  validation, exact request/response binding, and default-false gate.
- Potentially large reads are bounded: drilldown at 50, material pages at 20,
  authority cardinality at two, and trend at seven days.
- Interactive-transaction queries remain sequential. No network or protected
  content call runs inside a Prisma transaction.

## Explicit exclusions

- No Prisma schema or migration change.
- No free-form philosophy/exposure JSON interpretation.
- No raw identifier, storage ref, URL, protected body, or family-private goal
  payload in a W4 response.
- No director-specific cache table, material access ledger, support-signal
  threshold, or authorization fact.
- No provider/consumer activation, deployment, traffic, public API, Mobile
  business rendering, download, or share behavior.

## Exit checks

- The published W4 digest and fixtures remain byte-stable.
- Repository DB context and Prisma schema remain unchanged.
- The task plan names one W4.1 implementation path and no legacy/parallel
  owner composition.
