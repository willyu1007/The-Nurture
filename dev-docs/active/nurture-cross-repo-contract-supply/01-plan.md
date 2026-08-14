# T-011 execution plan

## Workstream order

1. W1 freezes the additive guardian-decision callback design.
2. W2 publishes the parent-context presenter and closes exact-pin adoption.
3. W3 publishes the parent-communication owner and advances it in qualified,
   independently reversible increments.
4. W4 publishes the director presenter after W2/W3 contract supply.
5. W5 hardens the shared settlement surfaces before callback implementation.

## W3 increments

### W3.0 — Contract and dormant vertical

- Publish `nurture.parent-communication-owner@1.0.0` with closed schemas,
  conformance fixtures and response validation.
- Mount four service-authenticated routes behind a default-false provider gate.
- Adopt the exact key/version/digest in My-Chat T-039 behind an independent
  default-false consumer gate.
- Keep protected media unavailable until a private stream and proxy exist.

Exit: complete on 2026-08-14. Contract and dormant consumer are exact-pin
qualified; no live owner ports, deployment or activation are claimed.

### W3.1 — Real local owner ports and controlled qualification

1. Reuse the existing family-care thread, message, item, receipt,
   InteractionContext and CommandExecution owners; create no parallel facts.
2. Add a current-context selection port whose output is routing input only,
   then reread the exact Nurture Participant, Guardian role, association,
   Enrollment, CareGroup, thread membership, grant, purpose and lifecycle on
   every operation.
3. Implement minimized summary and explicit bounded teacher detail over the
   canonical family-care rows. Keep `class_group` unavailable in P0 and keep
   protected media access unavailable.
4. Implement prepare with no business effect and confirm through the existing
   command runner, advisory lock, InteractionContext single-consume token and
   family-care transaction. Exact replay must return the original public
   message/receipt refs; ambiguous commit must reconcile with the same command.
5. Implement a bounded latest-generation async boundary, compose the complete
   binding only when explicitly supplied, and keep the environment gate false.
6. Qualify real PostgreSQL commit/replay/revocation/rollback behavior, the four
   real routes, cross-repo conformance, package gates and process smoke.

Acceptance:

- no Prisma import outside `@the-nurture/db`;
- no caller identity, context ref or platform child/family identity becomes
  Nurture authorization;
- no second message writer, confirmation ledger or command ledger exists;
- prepare writes only expiring owner-held confirmation state;
- confirm writes the existing message/item/event/receipt/attention facts and
  CommandExecution atomically, and consumes confirmation in the same
  transaction;
- all reads are bounded and detail-only fields never enter summary;
- provider and consumer remain default-off after qualification;
- deployment, activation, protected-media streaming and device evidence remain
  explicit later gates.

Rollback: remove the W3.1 binding factory and ports or leave the provider gate
false. Existing family-care facts and the published `1.0.0` contract remain
unchanged.

Exit: complete on 2026-08-14. The local owner closed loop is qualified on a
fresh 42-migration disposable database; both repository gates remain false and
W3.2 remains separately authorized work.

### W3.2 — Deployment qualification and controlled activation

- Supply the deployed current-context carrier and secrets through approved
  environment workflows.
- Qualify the private service path with My-Chat, then native and accessibility
  behavior.
- Change gates only under a separate rollout decision.

W3.2 is not authorized by the W3.1 implementation request.

## W4 — Read-only director presenter

1. Publish `nurture.director-presenter@1.0.0` with sectioned overview,
   bounded drilldown and protected-material read operations covering D-O01
   through D-O14.
2. Reread current Nurture institution role, association, purpose and protected
   display policy for every overview, drilldown and material open. Host
   workspace/user/context remains routing only.
3. Preserve the current product SSOT: Institution Mobile is read-only. D-O13
   reports `web_workbench_required`; no action, confirmation or command ref is
   admitted.
4. Mount service-authenticated private routes behind a default-false provider
   gate that additionally requires complete authority/owner ports.
5. Supply closed schemas, conformance fixtures, runtime response enforcement
   and an exact-pin My-Chat private consumer. Public API/Mobile composition and
   real owner ports stay in later owner/consumer increments.

Exit: complete on 2026-08-14 at digest
`sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9`.
All provider/consumer behavior remains dormant; no Candidate, deployment,
activation, traffic or device claim was created.

## W6+ — Teacher-side supply extension (2026-08-14)

Owner decision: after G5-A, the main supply effort targets the remaining
teacher-side contract gaps (26 Contract-blocked rows in My-Chat's T-039
matrix, minus the two My-Chat-owned rows). The production schedule, batch
composition, reuse map, exclusions and ordering rationale are frozen in
`artifacts/w6-teacher-supply-schedule.md`:

- W6 `nurture.teacher-class-stream-presenter@1.0.0` — read core
  (T-S03, T-F01, T-F03, T-F04, T-F06, T-F07).
- W7 `nurture.teacher-organization-owner@1.0.0` — feed/proposal/lane reads
  plus organize/supplement/class-note/queue-admission actions.
- W8 `nurture.teacher-communication-owner@1.0.0` — target rail, membership,
  timeline, staged withdrawal, manual text send, unread summary.
- W9 media association (association-only before the reserved media ingress
  exists).
- W10 teacher assistant queries (missing-record handoff, weekly draft).
- W11 `nurture.parent-communication-owner@1.1.0` additive extensions
  (P-H05 redaction prepare, P-H06 delivery receipts).

Every batch replicates the W4 skeleton plus the W3.1 real-owner step in the
same wave, ships default-off with exact digest pins and conformance
fixtures, chains its validator into `verify:formal-ingress-contract`,
produces a standalone digest-pin handoff artifact, and triggers the My-Chat
sanitized fixture-snapshot refresh duty. `P-G03`/`P-H03` are routed to
My-Chat; `T-C08` waits on product decision I-Q1; voice input and media
upload ingress are explicitly out of first versions.

## Post-schedule — gray-release readiness tracks (2026-08-15)

With the W6-W11 schedule closed and the T-039 matrix free of
contract-blocked rows, the forward plan targets a complete gray release.
The joint assessment, gap list (G1-G9), three parallel tracks and
risk-ascending ramp order are frozen in
`artifacts/gray-release-readiness-v1.md`. Summary:

- Only the activation spine is serial (authorization → staging deployment →
  joint rehearsal → per-surface ramp). Production assembly (a gate-guarded
  binding factory for `main.ts`), the My-Chat wiring/ramp-control/UI track
  and the remaining contract supply (director composition layer, media
  ingress, W1 callback runtime, stragglers) are authorization-independent
  and run in parallel now.
- Ramp order is risk-ascending: read-only presenters (W2/W6) → director
  reads (W4) → teacher commands (W7/W8/W10) → media association (W9) →
  parent redaction extension (W11, smallest allowlist, longest observation).
- Activation, deployment and traffic still require the explicit
  authorization gate; nothing in this plan changes the default-off posture.
