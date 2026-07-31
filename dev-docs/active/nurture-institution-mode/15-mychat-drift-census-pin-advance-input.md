# My-Chat Drift Census — Pin-Advance Decision Input

## Outcome

- Task: T-002
- Slice: read-only My-Chat drift census, `f00b868` → `96d96d0`
- Completed: 2026-07-31
- Result: `WIRE_CONTRACT_UNCHANGED / PIN_ADVANCE_RECOMMENDED / NO_ADOPTION`

This census is decision input for a future declared pin advance. It changes no
pin, code, schema, capability, environment, secret, activation or traffic
state. The sibling My-Chat checkout remains non-authoritative; all consumers
remain default-disabled; Owner Integration and protected T-005～T-007
integration remain NO-GO until Joint Conformance.

## Method

- Replicated the `sha256-path-content-v1` algorithm from
  `scripts/verify-workflow-contract-pin.mjs` offline over git objects
  (`git ls-tree` / `git cat-file blob`); neither checkout was mutated.
- Sanity check: at exact `f00b868` the recomputed hashes are byte-identical to
  both pinned values in `docs/project/integrations/my-chat-workflow-contract.json`
  (`x5_joint_api` `901fd406…`, `wave4_binding_host` `ae223127…`), proving the
  replication is faithful before any comparison.
- Census head: `96d96d0` (2026-07-31). The later `96d96d0..5ce8d51` delta is
  documentation plus root dependency-override housekeeping with zero drift in
  either pinned population, so the census values remain current at `5ce8d51`.

## Findings — `x5_joint_api` (165 → 169 files, hash changed)

Recomputed hash at `96d96d0`: `89a613555cab5bb1934c31b239b8d24b6f6a2ae14b0ff3e45b41542956dcca35`.

| Change | Files | Character |
| --- | --- | --- |
| Added | `packages/scenario-integrations/src/education-binding-owner.ts` + test | Education scenario leg (R2b), parallel to Nurture |
| Added | `packages/db/src/child-birth-date-repository.ts` + test | ST-5 issuing-surface persistence |
| Modified | `packages/db/src/index.ts`, `packages/scenario-integrations/src/index.ts` | Additive re-export lines only |

No Nurture-consumed file in this population was modified.
`packages/scenario-integrations/src/nurture-binding-owner.ts` is byte-identical.

## Findings — `wave4_binding_host` (15 → 17 files, hash changed)

Recomputed hash at `96d96d0`: `33ebe5d9517e2d5ba38b780e1a055c6aa055fb7898ed78f6897cc96535273a04`.

| Change | Files | Character |
| --- | --- | --- |
| Unchanged | `child-identity.controller.ts` / `.dto.ts` / `.service.ts` / `.validation.ts`, `scenario-binding-repository.ts`, `prisma/schema.prisma`, both pinned migrations | Entire inbound wire surface and DB shape: zero drift |
| Modified | `child-identity.module.ts`, `tokens.ts`, `packages/domain/child-identity/index.ts` | DI wiring and additive symbols/exports for ST-5 |
| Added | `packages/domain/child-identity/derived-age-stage.ts` + test | ST-5 domain logic |

## Wire-Contract Verdict — Binding-Owner Leg: UNCHANGED

1. The only My-Chat export the Nurture formal-ingress journey consumes
   (`createNurtureBindingOwnerHttpSource`, imported by
   `apps/scenario-service/tests/binding-owner.db.e2e.test.ts`) is
   byte-identical between the two revisions.
2. R2a moved the env factory from `nurture-owner.resolver.ts` into the new
   `scenario-owner-resolver.registry.ts`; the resolver class itself is
   unchanged and the registry explicitly keeps the P7 `nurture_http`
   configuration working unchanged (same env keys
   `SCENARIO_BINDING_OWNER_RESOLVER` / `NURTURE_OWNER_BASE_URL` /
   `NURTURE_INTERNAL_SERVICE_TOKEN`; the selector merely became list-valued).
3. The Nurture repository has zero references to the moved factory or those
   env keys, so a pin advance requires no Nurture code change on this leg.

## New Finding — the ST-5 Derived-Read Leg Postdates the Current Pin

Nurture `main` now carries the ST-5 derived age/stage read client
(merge `0077264`, client `7476396`, evidence in `03-implementation-notes.md`).
Its owner-side issuing surface (`child-birth-date.controller.ts`,
`derived-age-stage.ts`, landed at My-Chat `cd82d71`) does not exist at
`f00b868`, and the recorded joint live read ran against a My-Chat state that
includes ST-5. The current `f00b868` pin therefore no longer covers everything
Nurture consumes: a declared pin advance is required for coherence, not merely
preferred. Until the advance, the derived-read leg stays default-off
(`MY_CHAT_INTERNAL_BASE_URL` absent) and its evidence remains provisional.

## Pin Coverage Gap

`apps/api/src/child-identity/nurture-owner.resolver.ts` existed at `f00b868`
but is not in the `wave4_binding_host` population (the pin lists six named
files in that directory), so its R2a modification was invisible to pin
verification; the new `scenario-owner-resolver.registry.ts` is likewise
outside. The census caught this only because the controller/dto were
independently unchanged. The next pin advance SHOULD add the resolver, the
registry and the ST-5 issuing-surface files consumed by the derived-read leg
to the pinned populations.

## Recommendation

Adopt option B — a declared pin advance, not a floating repin:

1. The My-Chat lane declares a P8-style handoff cut (a committed revision;
   working-tree artifacts such as the in-progress side-channel test are
   excluded until committed).
2. The advance closes the coverage gap above and recomputes both source-set
   hashes at the cut (census reference values at `96d96d0` are listed above;
   the declared cut governs).
3. Renewed owner qualification for the binding-owner leg is expected to be a
   green rerun, since every wire file is byte-identical; the derived-read leg
   enters the pinned scope for the first time.
4. Sequencing per the controlled single mainline: T-004 Phase 3 proceeds now
   (My-Chat-independent); the pin advance lands before M5; M5 runs exactly
   once against the advanced pin; Joint Conformance binds to the same pin.

## Non-effects

This census performed read-only git-object inspection plus hash recomputation
in a session scratchpad. No repository file outside this documentation set, no
pin value, no schema/migration, no capability, no environment, no secret, no
deployment and no traffic state changed.
