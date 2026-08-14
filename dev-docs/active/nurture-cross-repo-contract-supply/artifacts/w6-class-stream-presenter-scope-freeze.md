# W6 Scope Freeze — nurture.teacher-class-stream-presenter@1.0.0

Frozen 2026-08-14 under the W6-W11 teacher-side supply schedule
(`w6-teacher-supply-schedule.md`). This freeze fixes the W6 contract surface,
authority model, port set, negative matrix and implementation order. Changes
after this point follow the append-only correction convention.

## Interface identity

- Key/version: `nurture.teacher-class-stream-presenter@1.0.0`
- Kind: `private_owner_presenter` (W4 file-artifact style)
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `query_caregiver_teacher_board@1.0.0`, `query_caregiver_child_today@1.0.0`
- Transport: POST, JSON, service bearer, `Cache-Control: private, no-store`
- Env gate: `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED` (optional,
  non-secret, default false); composition additionally requires the service
  token and complete authority/owner ports (fail-closed factory, W4 rule)
- Safe reason codes: `teacher_class_stream_presenter_disabled`,
  `invalid_teacher_class_stream_request`,
  `teacher_class_stream_contract_mismatch`

## Operations and consumer rows

Base path `/internal/nurture/teacher-class-stream/v1/`:

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `class_context_query` | `class-context` | T-S03, T-F01, T-H01 context gap | Authorized class list for the current caregiver (opaque `class_ref` + display-safe label + selectable flag), resolved current selection, class/day header for the requested `local_date` (label, local date, effective-schedule version head, publication-policy availability) |
| `child_strip_query` | `child-strip` | T-F03 | Bounded per-child strip cards: opaque `child_ref`, safe label, attention summary (count + highest priority + text alternative string), last-activity instant |
| `child_day_detail_query` | `child-day-detail` | T-F04, T-F05 handoff context | One child's day: arrival state (explicit `unknown` allowed), daily-care entries (meal/nap/mood/activity/health_observation), family-instruction summaries (safe copy, source refs), observation entries, focus link head; every section carries freshness (`generated_at`, source head) |
| `schedule_query` | `schedule` | T-F06, T-F07 | Effective class-day schedule resolved over the three canonical layers (institution template, class template, day override): slots with label/start/end, current-slot marker, completion/placement state where owned, curriculum-focus relations; absent facts stay explicitly `unknown` |

All four are reads. No operation admits or returns an action executor; write
paths belong to W7. Where a row's UI offers an action (for example T-F05), the
detail response may carry `owner_action_ref` availability descriptors in the
established `OwnerActionRef` shape, never an executable command.

## Authority model

- Host supplies routing only: `workspace_id`, `my_chat_user_id`,
  `host_request_id`, `context_ref`, plus operation inputs (`local_date`,
  `class_ref`, `child_ref`, `cursor?`). Forbidden request fields (fatal):
  `participant_id`, `role`, `care_group_id`, `child_id`, `institution_id`,
  `purpose`, `enrollment_id`, `grant_id`.
- Every operation rereads current authority through a
  `TeacherClassStreamAuthorityResolverV1` port: workspace + user resolve to
  the current Participant and their live `caregiver`/`lead_caregiver`
  RoleAssignments; an Institution Admin role, same-institution other-class
  role, guardian relationship or stale assignment resolves `closed`.
- `class_ref`/`child_ref` are integrity-keyed opaque refs bound to
  workspace+participant scope (board-projection ref discipline). A ref from
  another scope, class or a revoked assignment fails closed
  (`not_authorized`), never leaks whether the target exists.
- Responses carry the established binding envelope: contract
  key/version/digest, capability refs, actor (role + `care_group` scope ref),
  snapshot head, source heads, and a digest-partitioned cache identity with
  `resolved_at <= generated_at < expires_at` lifetime ordering (W4 rule).
- Drift: cursored reads bind snapshot version + drift head; a moved head
  returns `refresh_required` (no partial mixed-version page).

## Port set (implemented in-wave, W3.1 style)

- `TeacherClassStreamAuthorityResolverV1` — resolve or closed.
- `TeacherClassStreamOwnerV1` — `classContext` / `childStrip` /
  `childDayDetail` / `schedule`, each `{ request, authority }`.
- Real composition in `packages/nurture-db`:
  `createPrismaTeacherClassStreamBinding(...)` reusing
  `PrismaCaregiverBoardReadPort` reads where they exist and adding narrow new
  reads for the class list (current RoleAssignments), effective schedule
  (template layers + day override + placements) and day-detail assembly.
  Domain logic stays DB-free in
  `packages/nurture-scenario/src/teacher-class-stream-*.ts`; repositories
  return domain shapes (no Prisma types across the boundary).

## Negative matrix (fixture-backed, minimum)

`not_authorized` (institution admin / other-class caregiver / guardian /
revoked mid-window), `stale_context_ref`, cross-scope `class_ref`,
cross-class `child_ref`, invalid `local_date`, `refresh_required` on drift,
disabled gate, missing service auth, forbidden request field, hidden-payload
rejection in empty/unavailable sections, contract-digest mismatch, oversized
page request. Every code path returns the safe reason-code union; guard
errors flow through the controller-scoped private response filter with
explicit `@Inject` tokens (05-pitfalls).

## Implementation order (each step verified before the next)

1. **W6-1 contract artifact**: owner-contract JSON + conformance fixtures +
   hard-pinned `validate-contract.mjs` + README; digest literal minted and
   spread to its four homes; `verify:teacher-class-stream-contract` chained
   into `verify:formal-ingress-contract`.
2. **W6-2 runtime**: controller/http/composition/runtime/response-validator
   五件套 + config flag + safe-exception codes + listener-free e2e suite +
   config negative tests; default-off proven.
3. **W6-3 real owner ports**: scenario domain service + nurture-db
   composition/repositories + unit lane + production-DB lane (UTC discipline
   for `local_date`; non-UTC session coverage).
4. **W6-4 registration**: env contract 5-file set, context registry refresh,
   test-routing census, candidate fixture list, project governance sync,
   full verification battery (typecheck, unit, scenario-service, targeted DB,
   formal ingress, surface contract, port topology, persistence boundaries,
   `git diff --check`).
5. **W6-5 handoff**: standalone digest-pin artifact (W2 precedent) +
   My-Chat sanitized snapshot refresh duty + T-039 matrix row updates on the
   consumer side (dormant strict client remains My-Chat-owned work).

## Explicitly out of W6

Writes of any kind (W7), unread/communication facts (W8), media association
(W9), assistant queries (W10), voice, scheduling policy (I-Q1), any
activation, durable apply, deployment, device or traffic claim. The frozen
G5-A Candidate is untouched; W6 lands on mainline for a future candidate
under its own gates.
