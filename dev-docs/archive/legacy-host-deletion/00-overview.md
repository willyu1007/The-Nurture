# T-014 Legacy host deletion

## Archive record

- State: archived
- Completed and archived: 2026-08-17
- Goal: satisfy the T-012 deletion gate and delete `apps/backend`
  (the legacy Fastify workflow harness).

## Final outcome

- All four waves completed on 2026-08-17, plus the Wave 3 follow-up
  (P0 handlers standard-event strip, landed by a parallel session at
  `27d754d`).
- Wave 1 pushed scenario semantics down to owner layers (nurture-db /
  nurture-scenario tests). Wave 2 migrated the user-attention and
  growth-record contribution owner routes into the scenario-service with
  unchanged wire semantics; the x5 joint acceptance now drives My-Chat's
  HTTP source against the real ingress. Wave 3 pinned host-runtime truth
  on the real My-Chat kernel (`t014-host-runtime-joint`): approval pause
  works verbatim; artifact/context materialization and scenario event
  drafts fail closed as `workflow_step_materialization_requires_future_kernel`
  / `workflow_handoff_event_draft_not_supported` until My-Chat ships step
  materialization. Wave 4 deleted the harness (55 files), its CI lane,
  env vocabulary, and guards — the guards now assert absence.
- Deletion-gate conditions 1–3 are itemized as satisfied in
  `04-verification.md`. The artifact legs' equivalence was interpreted,
  by owner decision, as "gap pinned by joint tests + business semantics
  covered by unit/db lanes".
- Known caveat: the Wave 4 content landed inside commit `5b23d98`
  (a reseal-titled commit) due to a hook rejection swallowed by a
  pipeline; see `05-pitfalls.md`. Content is correct and Task-tagged.

## Durable boundaries

- Host workflow runtime ownership remains with My-Chat; local evidence
  runs in the x5 joint lane on real My-Chat source.
- `apps/backend` must never return (`assert-persistence-boundaries`);
  the retired `DEV_HOST_*` / `NURTURE_BACKEND_URL` env vocabulary must
  never return (`assert-port-topology`); no tests may live under
  `apps/backend` (`assert-test-routing`).
- Reopening the artifact-leg journeys is My-Chat future-kernel work
  (step materialization), tracked by the two fail-closed joint pins that
  will flip when the kernel ships.
