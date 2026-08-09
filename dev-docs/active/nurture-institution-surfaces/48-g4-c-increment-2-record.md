# G4-C Increment 2 — Capture Intake and Attribution Correction

## Verdict

- Date: 2026-08-09
- Task: T-007
- Implements: G-05 automatic capture placement and 0D-4 attribution
  correction candidate at I1
- Contract: `nurture.child-attribution-authority@1.0.0`
- Migration: `20260810010000_g4c_attribution_correction_candidate`
- Implementation revisions: `ee58c2d`, `ef2d63c`; local lock refresh `806e782`
- Verdict: **I1 PASS; G-04 and G-05 closed**
- Non-effects: no shared/persistent database apply, production caller,
  capability registration, contract rotation, deployment, activation or
  traffic.

## Capture intake

An already-persisted `NurtureCareCapture` now invokes the deterministic
automatic placement pass at intake. The source adapter derives the exact class,
Institution-local date and minute from the stored capture and the existing
publication-policy timezone owner. The consumer reuses the existing schedule
service and placement repository, including the storage-time predicate that
prevents a stale automatic pass from overwriting an Admin decision.

No caller supplies a class, date, deadline or placement decision. Missing
source, timezone policy or schedule remains explicit unavailable/skipped
behavior, and replay converges through the existing no-op/write fence.

## Attribution correction candidate

An Institution Admin may append a sourced report against one exact immutable
`NurtureChildMediaAttribution` revision. The owner resolves the class from that
revision's media asset, resolves the explicitly selected current Admin role
through the canonical 0C chain and rechecks both inside the Serializable
command transaction.

The report is non-canonical and append-only. The report has no status, head,
expiry, deadline, resolution, proposed-child or publishability field and changes no
attribution row and no exposure payload. A current caregiver or lead caregiver
of the exact class may read the report; any canonical confirm/reject/supersede action
continues through T-006's existing caregiver-only attribution owner. A
dual-role participant acting under the caregiver assignment cannot inherit the
Admin append capability.

PostgreSQL enforces non-empty bounded reason, contract/hash shape,
same-Workspace source/actor composition and update/delete rejection. The
command ledger and candidate request hash make exact replay append once.

## Quality review repairs

1. Fresh scenario runtime values are loaded from the source-backed package root
   rather than a stale checked-in `dist/harness` artifact.
2. The pure decision layer now reasserts both source attribution and explicit
   role-assignment identity returned by the owner adapter.
3. Six pre-existing physical FK names are declared in Prisma, removing
   rename-only schema drift without changing database constraints.
4. The initial transient DB connection failure was isolated: G2-A passed three
   consecutive runs and the full DB lane then passed independently.

No alternate intake path, mutable candidate lifecycle, signal-local blocker or
new deadline state was retained.

## Qualification

- Scenario and DB package typechecks: PASS.
- Full unit lane: 842/842 across 76 files.
- G-05 plus 0D-4 exact-owner DB lane: 7/7 across 2 files.
- Full production-DB lane: 377/377 across 40 files.
- Clean disposable deploy: 29/29 migrations; final status up to date.
- Datasource-to-Prisma diff: no difference.
- Test routing: 143 files; unit 76, production DB 40, dev host 11, scenario
  service 14, X5 joint 2.
- C30 default-off census: unchanged.
- Local locks: C30 source revision `ef2d63c`, hash `201047da…`; Nurture exact
  runtime `aaef3952…` over 235 files.
- External My-Chat workflow pin: attributed FAIL — expected `567b96c`, observed
  `05e8331`; no cross-repository adoption was performed.
- Exact disposable target: zero sessions, destroyed and confirmed absent.

Evidence:
[`artifacts/db/0d4-attribution-correction`](./artifacts/db/0d4-attribution-correction/04-post-verify.md).

## Exit

G-04 and G-05 are closed at I1. The next unfinished product branches are 0E
Workflow/Enrollment Journey freeze and 0F Knowledge/RAG freeze. G-03's missing
canonical blocker remains an external owner gate and is not replaced by local
state.
