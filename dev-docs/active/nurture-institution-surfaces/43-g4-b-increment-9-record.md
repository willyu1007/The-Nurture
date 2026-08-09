# G4-B Increment 9 — 0D-5 Support-signal Core and Detail-read Repair

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Commits: `3b9ca9a`, `3ee0b78`
- Effect level: **I1 only**
- 0D-5 status: policy/composition core implemented; exact deterministic
  owner-source adapters remain the next bounded increment

This increment advances 0D-5 without claiming G-03 closed. It also repairs the
quality defects found while reviewing increment 8. No source deadline,
attendance checkpoint, WorkItem state or Workflow state was reimplemented in
the signal layer merely to make the feature look complete.

## Increment-8 quality review and repairs

The review found four must-fix groups.

1. The business-communication list port was documented as body-free but
   returned the single-message raw type, which structurally contained protected
   body envelopes. The exact authorization predicate is now shared internally,
   while explicit presenters return either the exact single-message raw shape
   or a body-unrepresentable list row.
2. Candidate authorization used an unbounded `Promise.all` and current wall
   clock. It now runs in fixed batches of 20 and revalidates role/Grant at the
   request snapshot.
3. `localDate` was interpreted as UTC for captures and communication. The
   repository now resolves one policy-backed Institution-local day and passes
   the same storage key and instant window to every detail reader. Missing
   publication policy fails closed; UTC is never guessed.
4. Communication and child-evidence limits silently truncated after a broad
   class read. Pages now expose `has_more`, and child/direction filters enter
   the candidate query before its bound. Lifecycle reason is preserved in the
   body-free projection.

The old UTC helpers and raw list return type were removed. The data layer also
reuses the domain's one local-day DTO rather than retaining an isomorphic copy.

## 0D-5 core

`InstitutionSupportSignalProjectionV1` now has a framework-free composer and
authority-first service for all seven frozen categories. It provides:

- fixed category-to-tier and category-to-safe-reason mappings;
- exact Workspace/Institution/source checks and source-lifecycle disappearance;
- explicit source-deadline overdue checks, with no invented fallback deadline;
- 0C-5 full-coverage aggregation for the two threshold categories;
- unconfigured load categories disabled by absence;
- stable source-type/source-ref/policy-revision/window dedupe;
- deadline-first ordering with fixed age-band/name fallback, never tier/count;
- AI capped at `attention_suggested` and independent from deterministic facts;
  and
- no dismiss, acknowledge, escalate, WorkItem or Workflow command surface.

The Prisma adapter owns only effective policy reads and delegates source reads
to exact owner adapters. That separation is intentional: the remaining source
adapter increment must reuse attendance, business communication, WorkItem and
Workflow owners rather than query plausible-looking local substitutes.

## Persistence

One additive model and migration were authored:
`NurtureInstitutionSupportSignalPolicy` and
`20260809180000_g4b_institution_support_signal_policy`.

The table records exact Institution, optional class override, closed category,
absolute threshold where applicable, window/checkpoint refs, enablement,
effective period, revision and exact Admin audit actor/reason. Partial unique
indexes keep Institution and class revision streams distinct. The signal
itself has no table.

The migration was reviewed and Prisma-validated but **not applied**. The DB
skill approval gate has no named target or apply approval. Evidence and the
future apply plan are under
[`artifacts/db/0d5-support-signal-policy`](./artifacts/db/0d5-support-signal-policy/01-schema-diff-preview.md).

## Verification

- TypeScript: zero errors.
- Unit: **818/818**, 72 files.
- Targeted data layer: **4/4**, including the repaired class-day owner path and
  mocked policy mapping.
- Full production-DB lane: **347/348**, 36 files. The sole red check is the
  constraint-survival test correctly observing that the four new CHECK
  constraints exist in migration SQL but not in the unapplied local test DB.
- Test routing, persistence boundaries, surface conformance (121/121), G2 Exit
  and G3-0 freeze gates pass. DB context refresh exposed and repaired the G3
  census's previously missing attendance/schedule tables.

The known external My-Chat workflow pin mismatch remains G-09 and was not
adopted.

## Non-effects and next step

No shared/persistent database apply, production source adapter, capability,
contract rotation, activation, deployment or traffic was introduced.

The next bounded increment is to implement the six deterministic exact-owner
source adapters and qualify the authored migration on an explicitly approved
disposable database. Only then may G-03 close and the class/home signal
consumers be wired.
