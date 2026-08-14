# W6+ Teacher-side Supply Schedule (2026-08-14)

Owner decision (2026-08-14 session): after G5-A Candidate Freeze, the main
supply effort moves to the teacher-side contract gaps so the deployment/device
waiting period converts into consumer-unblocking progress. This artifact is
the production schedule for that decision. Execution truth stays in this
task's 00-04 documents; My-Chat row truth stays in its
`dev-docs/active/mobile-uiux-delivery/07-contract-readiness-matrix.md`.

## Input basis

- My-Chat matrix recount (2026-08-14, direct extraction): 26 rows have
  Contract axis `blocked`. Composition: 13 class-stream (`T-F01..T-F09`,
  `T-F11`, `T-F14..T-F16`), 2 teacher shell (`T-S03`, `T-S04`), 5 teacher
  communication (`T-C02`, `T-C03`, `T-C04`, `T-C07`, `T-C09`), 2 teacher
  assistant (`T-H02`, `T-H04`), 3 parent assistant (`P-H03`, `P-H05`,
  `P-H06`), 1 milestone (`P-G03`). `T-F10`, `T-C05`, `T-C08`, `T-H01`,
  `T-H03` are `partial`, not blocked; `T-F12`, `T-F13`, `T-C06` are already
  contract-ready/live on the pinned teacher-release owner.
- Ownership corrections: `P-G03` (milestone marker on the admitted
  GrowthMaterial archive read) and `P-H03` (family-growth admission receipt)
  are **My-Chat-owned** facts; they are routed to the My-Chat backlog and are
  not Nurture supply.
- Nurture already owns the canonical models these rows need. The
  `caregiver_teacher_board` surface binds 27 frozen capabilities (including
  `query_caregiver_teacher_board@1.0.0`, `query_caregiver_child_today@1.0.0`,
  `query_teacher_publish_queue@1.0.0`, `record_caregiver_daily_care@1.0.0`,
  `organize_care_capture_batch@1.0.0`, the publish-process family and the
  media-attribution family), with harness read models under
  `packages/nurture-scenario/src/harness/` and Prisma ports under
  `packages/nurture-db/src/repositories/`. The supply gap is presenter/action
  exposure through versioned private owner contracts, not new canonical
  modelling.
- Supply pattern: replicate the W4 skeleton (4 contract files, 5 runtime
  files, 2 test lanes, digest literal in 4 places, env-contract 5-file set,
  gate-script registration) and take the W3.1 real-Prisma owner step in the
  same wave instead of deferring it. Full checklist: 02-architecture plus the
  W4 dissection recorded in 03-implementation-notes (2026-08-14 entry).

## Batches

Every batch ships default-off, service-authenticated, current-authority
rereading, with closed schemas, conformance fixtures, a hard-pinned validator
chained into `verify:formal-ingress-contract`, runtime response enforcement,
unit + scenario-service e2e lanes, a standalone digest-pin handoff artifact
(W2 precedent), and the My-Chat sanitized fixture-snapshot refresh duty
(`My-Chat packages/scenario-integrations/fixtures/nurture/SNAPSHOT.json`).

| Batch | Contract identity | Rows served | Reuses | Notes |
| --- | --- | --- | --- | --- |
| **W6 class-stream read core** | `nurture.teacher-class-stream-presenter@1.0.0` | `T-S03` class selector, `T-F01` class/day header, `T-F03` child strip, `T-F04` child daily detail, `T-F06`/`T-F07` schedule strips; likely also closes `T-H01`'s missing context presenter | `caregiver-board-queries` scope/child-today ports, `care_group_role`/`enrollment` facts, `daily_care_log`/`care_interaction_item`/`teacher_attention_item` heads, class-day schedule models | Read-only; highest row count, lowest design risk; per-field freshness/source per ASYNC-06; text alternatives for badges |
| **W7 organization loop** | `nurture.teacher-organization-owner@1.0.0` (P0 reads, then P1 actions in-wave) | `T-F08` raw feed, `T-F09` proposal, `T-F11` ordered lane, `T-F02` organize/replay action, `T-F05` supplement write, `T-F15` class-note write (text only), plus the `T-F10` queue-admission action gap | `organize_care_capture_batch@1.0.0`, `care-capture` read/transaction ports, `publish-queue-admission`, `record_caregiver_daily_care@1.0.0` | Owner-persisted lane state (client timers are never truth); idempotent start/resume; prepare/confirm + same-command replay for writes |
| **W8 teacher communication owner** | `nurture.teacher-communication-owner@1.0.0` | `T-C02` target rail, `T-C03` membership, `T-C04` timeline, `T-C07` staged withdrawal, `T-C09` manual send (text only), `T-S04` unread/target summary; assess `T-C05` staged-item DTO gap here | W3 `parent-communication-owner` schema shapes, summary/detail split, `send_text_exchange` union, actor-scoped HMAC idempotency; IR-C01..C07 gate list re-run for the teacher actor | `class_group` send stays explicitly unavailable (P0 rule) absent a separate decision; staged vs sent withdrawal lifecycles kept distinct |
| **W9 media association** | scope at design: association-only first | `T-F14` unassociated media + association commit; `T-F16` Nurture half (upload+association) | `confirm/reject/supersede_child_media_attribution@1.0.0`, `discard_media_asset@1.0.0`, `media-attribution` ports | Upload/stream ingress remains reserved (`reserved_not_mounted` / `content_unavailable` rule); no ready shape without an executable ingress |
| **W10 teacher assistant queries** | naming at design | `T-H02` missing-record query + typed handoff, `T-H04` weekly-summary draft (agent-labelled, review-first) | class-stream reads from W6; generation boundary stays engine-ready, no direct provider calls | Handoff target rereads authority and writes nothing |
| **W11 parent communication extensions** | `nurture.parent-communication-owner@1.1.0` (additive) | `P-H05` redaction preview/prepare, `P-H06` delivery receipt states | W3 owner + W1 callback design's reconciliation semantics | Additive version; frozen 1.0.0 artifact is not mutated |

## Routed out / gated

- `P-G03`, `P-H03` → My-Chat backlog (owner facts live in My-Chat
  family-growth admission); tracked in its T-039 matrix, not here.
- `T-C08` scheduled delivery → blocked on product decision I-Q1 (My-Chat
  `06-mobile-surface-inventory.md`). Working assumption until decided:
  explicit teacher confirmation, no auto-send; no scheduling contract is
  designed under this schedule.
- Voice input (`T-C09`/`T-F15` mention text/voice) → text-only in first
  versions, matching the parent-side precedent that removed voice pending a
  separately approved capture/upload/permission/accessibility contract.
- Media upload ingress (part of `T-F16`) → depends on the reserved private
  media stream ingress plus My-Chat proxy; only association over existing
  assets ships before that ingress exists.

## Ordering rationale

W6 first: most rows, pure reads over existing models, unlocks the teacher
shell skeleton and the largest `fixture-planned/blocked/blocked` cluster.
W7 completes the daily class-stream loop teachers actually work in. W8 is
the biggest UX completion and can lift W3 shapes nearly wholesale. W9/W10
carry the residual design risk (media ingress, generation boundary). W11 is
parent-side polish after the teacher push. Batches are serial by default;
a batch is a commit-worthy key node only after its full gate list passes.

## Standing constraints (from 05-pitfalls and repo rules)

Listener-free e2e HTTP injection; controller-scoped exception filters with
explicit `@Inject` tokens; read vs command admissibility derived separately;
`AT TIME ZONE 'UTC'` for raw SQL dates with non-UTC lane coverage; every
command on a broader idempotency namespace binds actor scope in its canonical
payload with a negative cross-actor replay test; package root exports route
types to `src` and runtime to `dist`; no route additions to
`scenario.manifest.yaml` for private owner contracts (governed by
`assert-formal-ingress-contract.mjs`); cross-repo closure claims require the
field-by-field consumer census.
