# G4-D Increment 2 — Workflow / Inquiry / Touchpoint Carrier

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input: G4-D increment 1 ([`57`](./57-g4-d-increment-1-record.md))
- Verdict: `G4_D_INCREMENT_2_DB_QUALIFIED`
- Database effect: one exact local disposable target was created, qualified and
  destroyed; no shared or persistent database was touched

## Implemented slice

- Added six closed command specs over the existing command kernel:
  `start_enrollment_inquiry`, `record_external_touchpoint`,
  `confirm_native_touchpoint_note`, `confirm_intent_conversation`,
  `record_or_skip_visit` and `close_inquiry`.
- Added a private repository/query port and a body-free projection service for
  the future `query_institution_workflow` consumer.
- Added Prisma adapters inside the same serializable
  `NurtureCommandExecution` transaction. Head updates use compare-and-set;
  transition finalization links the immutable command execution in that same
  transaction.
- Added four Prisma carrier tables and the versioned migration
  `20260810030000_g4d_enrollment_journey_inquiry`.
- Added production-DB qualification cases for exact replay, the explicit
  inquiry path, body-free query output, immutable transitions, age-fact XOR and
  workflow deletion rejection. They are typechecked but not executed without a
  new exact disposable target approval.

## Quality repairs

The increment began with a review of increment 1 and repaired the following:

- projection admission now binds exact Workspace, Institution and current
  Institution Admin scope and rejects unsupported surfaces;
- snapshots reject extra/body-bearing fields and noncanonical instants/refs;
- milestone prerequisites, stage regression and terminal combinations now fail
  closed;
- skipping an optional visit no longer invents a `visit_recorded` milestone;
- owner-safe labels and verification instants are excluded from request
  identity, so re-resolving the same exact owner ref cannot break replay;
- all exported command validators reject null/malformed runtime input;
- query composition returns only the body-free projection, never the private
  workflow ref or inquiry/contact facts;
- the test-routing census was advanced once, in its existing SSOT, for the two
  new unit files and one new production-DB file.

The final quality pass additionally repaired persistence and result-contract
gaps:

- replaced the derived workflow-ref hash with the exact canonical Run
  `object_id`, constrained it equal to the JSON ref and made it unique per
  Workspace;
- made canonical refs/protected envelopes exact-key carriers and made missing
  shapes fail SQL checks instead of yielding admissible `NULL`;
- mirrored milestone prerequisites, lifecycle/stage/terminal combinations,
  command-specific changes, no re-addition and cumulative transition
  reconstruction into PostgreSQL, then added a deferred one-head/one-transition
  invariant;
- bound touchpoint/transition writes to the exact active Institution Admin and
  bound transition finalization to the exact command scope/actor/Institution;
- closed the responsible-role vocabulary and mapped apply-time write races to
  conflict/blocked decisions rather than a generic technical error;
- removed private inquiry/touchpoint refs from command output, retaining only
  local workflow and immutable transition refs.
- rechecked exact actor/workspace/Institution/workflow owner facts at the
  command boundary and rejected pre-source owner verification or correction
  occurrence times.

## Ownership and safety boundary

- My-Chat still owns shared workflow Run/Step/runtime/outbox and contact
  identity. The carrier stores only opaque canonical refs.
- Real prospective-contact and native business-message owner adapters remain
  I3 work. The current owner snapshots are internal prepared command facts, not
  caller-authoritative public inputs.
- External summaries store only the existing protected-content envelope; no
  transcript, attachment, raw phone/WeChat/email/account or full birth date is
  accepted.
- No new deadline, blocker lifecycle, AI candidate, workflow outbox,
  projection table or `NurtureWorkflowProject` path exists.
- The canonical scenario manifest and module remain unchanged. No caller,
  capability, deployment, activation or traffic is added.

## Verification

| Check | Result |
| --- | --- |
| Targeted workflow + command tests | PASS — 27/27, 2 files |
| Full unit lane | PASS — 869/869, 78 files |
| Scenario / DB package typecheck | PASS |
| Direct root `tsc --noEmit` | PASS, including DB qualification tests |
| Prisma format / validate / generate | PASS |
| Static Prisma enum/table diff | PASS |
| Persistence / port / formal ingress / test routing | PASS |
| G2 DB census / G3 no-board-row census / C30 default-off | PASS |
| Nurture exact-runtime self-pin | PASS — `fdb2f9d9…`, 239 files |
| C30-I3 local source lock | PASS — `695630d` / `273abb78…` |
| External My-Chat pin | KNOWN RED — expected `567b96c`, observed `05e8331`; no adoption |
| Database feature suite | PASS — SQLite; optional Convex checks skipped |
| Task docs / project state / governance | PASS |
| Manifest/module and legacy-carrier absence | PASS |
| DB context refresh / diff whitespace | PASS |
| PostgreSQL migration apply | PASS — all 30 migrations on an empty disposable target |
| Targeted PostgreSQL suite | PASS — 3/3 |
| Full PostgreSQL DB lane | PASS — 380/380, 41 files |
| Migration status / datasource-to-SSOT drift | PASS — current / zero difference |
| Disposable cleanup | PASS — zero sessions, target destroyed and absent |

Detailed DB gate evidence is under
[`artifacts/db/0e1-enrollment-journey-inquiry`](./artifacts/db/0e1-enrollment-journey-inquiry/00-connection-check.md).

## Next gate

G4-D increment 3 may now implement the frozen
waitlist/policy/offer/reservation/preparation slice. Its schema is authored from
the repo Prisma SSOT and remains non-operational until its own disposable-DB
qualification and consumer/capability release gates pass.
