# G2 Exit Qualification and T-005 Beta Profile Handoff

## Verdict

- Task: T-005
- Date: 2026-08-02
- Verdict: `G2_EXIT_PASS`
- Provider state: Nurture-side `qualified`, default-off
- Task state: `done` after this record and governance sync land
- Non-effects: no persistent database apply, secret/config value, Service Candidate,
  artifact publication, deployment, capability activation, native/internal-store
  effect, device validation or traffic authorization

G2-A, G2-B and G2-C are joined into one Exit verdict. This handoff qualifies the
Nurture provider and its public/synthetic consumer contract. It does not claim
T-006 G3-E real-consumer adoption, T-007 consumer adoption, My-Chat native/device
completion, or T-008 Service Candidate readiness.

## Exact Bound Inputs

1. T-004 contract baseline and qualification:
   `nurture.surface-contract@1.7.0` /
   `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`,
   recorded in
   `../nurture-surface-contract-foundation/08-phase-4-synthetic-qualification-and-handoff.md`.
2. T-002 M5 owner handoff: My-Chat
   `a0195662228a2fc6323b9ea0cd327d3608d8cc17` and My-Workflow-Base
   `06303e9f404e4ccc0ba3054b763675efe81b5b15`.
3. G1 Joint Conformance `PASS`, recorded in
   `../nurture-institution-mode/18-g1-joint-conformance-record.md`.
4. Current G2 provider artifact:
   `nurture.surface-contract@1.8.0` /
   `sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a`,
   eleven capabilities and 38 schemas.

The `1.7.0 → 1.8.0` comparison keeps the shared core exactly
`sha256:042272641eb98cb934acfe902259ea93502be92ffa8e95257ddc63abf48c0ae2`;
the six surface slices are unchanged. Therefore the exact-pinned G1 owner/X5
evidence remains valid for the unaffected shared owner path. The added direct
action, three query rotations, affected descriptors/fixtures, formal ingress and
Nurture database behavior were requalified in this Exit run. This is bounded
evidence reuse, not a claim that the old `1.7.0` artifact qualifies new `1.8.0`
capabilities.

## Qualification Topology

The run used three sibling detached worktrees, not the drifting development
siblings:

- My-Chat at `a0195662228a2fc6323b9ea0cd327d3608d8cc17`;
- My-Workflow-Base at `06303e9f404e4ccc0ba3054b763675efe81b5b15`;
- The-Nurture at G2-C checkpoint `ebaa0910d7d0a6a035c5256d5f4e0b6b24256e77`.

Both installed with `pnpm install --frozen-lockfile`. Prisma clients were generated
for pinned My-Chat and both Nurture schemas before aggregate typecheck. The owner
and Nurture pins were then recomputed from their exact file populations:

- Base/My-Chat workflow-contract parity: `8dd53be4…`, 11 files each;
- Base `web_workbench`: `d4642808…`, 59 files;
- My-Chat `x5_joint_api`: `89a61355…`, 169 files;
- My-Chat `wave4_binding_host`: `960afb2c…`, 20 files;
- Nurture scenario self-pin: `0e684436…`, 69 files at the qualified implementation
  checkpoint. Final workflow-context synchronization rotated only this self-pin to
  `a23f0c06…`; archival path-reference synchronization then rotated only the same
  self-pin to final `4cd8b8b5…`. The file population, runtime, owner pins and surface
  artifact did not change.

The formal NestJS Harness and binding-owner suites ran through the pinned
`@my-chat/scenario-integrations` source against freshly migrated disposable
PostgreSQL. Local PostgreSQL has no `vector` extension, so the unaffected two-DB
X5 materialization suite was not duplicated; its exact source population and G1
record were revalidated instead. Shared-core or owner-source drift would invalidate
that reuse and require the full joint suite again.

## Exit Gate Mapping

| Exit requirement | Evidence | Result |
| --- | --- | --- |
| Clean rebuild of three-axis schema, reply collection, protected content, typed result and cascade | frozen installs, Prisma generation, all six migrations from empty DB, aggregate/package typechecks, built service smoke | PASS |
| Formal ingress plus real pinned owner path | exact pin verifier; scenario-service DB suite uses the pinned My-Chat integration package and real NestJS HTTP routes | PASS |
| Chat/Board equivalence and ordinary-chat separation | G2 checkpoint equivalence/leakage tests plus 56/56 surface-contract cases | PASS |
| Transaction, concurrency, replay, response loss and cascade | production DB 86/86; formal DB 22/22, including 105+105 cascade closure | PASS |
| Cross-family/group/institution/Admin/stale Grant/role/contract negatives | G2-A/B/C named negative matrices and formal owner-path denial suite | PASS |
| Single writer and no guessed migration | legacy cutover 5/5; migration only declares `legacy_migrated_v1` and never rewrites rows; database census has no migrated rows | PASS |
| Default false/empty and no side effects | exact environment/static guard, built smoke, disposable DB destruction and final database-name census | PASS |
| Exact handoff with bounded claims | this record | PASS |

## Mechanical Results

| Check | Result |
| --- | --- |
| `pnpm verify:workflow-contract-pin` in exact detached topology | PASS; both owner revisions/hashes, three source pins and Nurture 69-file implementation self-pin; final archive-path-only self-pin `4cd8b8b5…` reverified separately |
| `pnpm typecheck` after owner/Nurture Prisma generation | PASS |
| `pnpm test:unit` | PASS; 29 files / 268 tests |
| `pnpm --filter @the-nurture/scenario-service test` | PASS; 8 files / 49 tests |
| `pnpm test:db` on fresh PostgreSQL | PASS; 13 files / 86 tests |
| `pnpm test:scenario-service:db` on fresh PostgreSQL | PASS; 2 files / 22 tests; Harness 16/16 and binding owner 6/6 |
| `pnpm test:dev-host` on isolated production/dev-host databases | PASS; 11 files / 26 tests |
| `pnpm verify:surface-conformance` | PASS; 56/56, 38 schemas, 11 capabilities, 26/26 slices, 7 negatives |
| `pnpm verify:formal-ingress-contract` | PASS; 7 routes and 8 action keys |
| built `pnpm smoke:scenario-service` | PASS; `binding-owner=disabled harness=disabled legacy-route=absent` |
| `pnpm verify:g2-exit-contract` | PASS; exact `1.8.0`, unchanged G1 core, exact pins, default-off gates, no legacy activation |
| `pnpm verify:g2-exit-db-census` | PASS; items `harness=53/legacy=11`, messages `harness=73/legacy=12`, violations 0 |
| disposable effect boundary | PASS; final `pg_database` census contains no `the_nurture_g2_exit*` database |

The database census distinguishes active protected rows from erased tombstones:
all non-redacted Harness messages are `body=null`, `encrypted`, with a protection
payload; all redacted Harness messages are `body=null`, `redacted`, with the payload
erased. Item/message scope axes and reply-order violations are zero.

## Quality Review and Remediation

The Exit review found and resolved three qualification-quality issues:

1. Initial ad-hoc census queries used plural table names and then grouped an
   aggregate concatenation. Both failed after the test suites had passed and their
   traps still destroyed the databases. The retained census uses Prisma parameterized
   raw queries with actual Prisma `@@map` names.
2. A naive “every Harness row must have encrypted payload” query flagged six rows.
   They were correct redacted tombstones. The retained guard now separately requires
   encrypted payloads for non-redacted rows and complete payload erasure for redacted
   rows.
3. CI checked values from the pin file but did not recompute exact owner/self-pin file
   populations. `verify:workflow-contract-pin` is now part of the pinned-source CI job;
   the G2 contract and DB census guards are also CI-enforced.

No product implementation defect, dual writer, plaintext leak, guessed migration or
owner-boundary violation remained after review.

## Beta Profile Handoff

T-005 hands off the following provider identity only:

- exact surface root `nurture.surface-contract@1.8.0` with the digest above;
- three query capabilities at `1.1.0` and eight action capabilities at `1.0.0`;
- formal private `prepare/execute/query/readResult` ingress and provider-only
  Institution business-communication owner-read;
- Nurture-owned Message/CareItem/Event/Receipt/CommandExecution semantics and
  role-safe projections;
- default-off environment and pre-activation scenario posture.

T-006 G3-E MUST adopt the exact direct-interaction capability and rerun real-consumer
joint qualification. T-007 MUST separately adopt the Institution owner-read interface.
Any interface digest, shared-core hash, owner revision/source hash, self-pin population,
database schema, protected-content rule or default-off posture drift invalidates the
affected handoff. T-008 alone owns Candidate freeze, deployment binding and native/device
beta qualification.
