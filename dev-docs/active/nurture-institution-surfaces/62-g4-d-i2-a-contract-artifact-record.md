# G4-D I2-A — Enrollment Journey Public Wire Artifact

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input: completed and DB-qualified private I1 chain
  ([`57`](./57-g4-d-increment-1-record.md)–[`61`](./61-g4-d-increment-5-record.md))
- Verdict: `G4_D_I2_A_CONTRACT_QUALIFIED`
- Artifact: `nurture.surface-contract@1.19.0` /
  `sha256:6f67d49ca303ad627b6644857a16dde7626cc944bf8c065f09629039025f738e`
- Manifest digest:
  `sha256:2acbeb9535f80fb8d37e2e2058796f2180d729384e9676dab5212364cac1b410`
- Effect boundary: source schemas/descriptors, deterministic artifact and
  synthetic contract qualification only

## Implemented boundary

- Added three public queries: Institution workflow projection, bounded Admin
  capacity waitlist and family-safe Guardian waitlist status.
- Added one descriptor for each of the 21 completed I1 commands. Command
  descriptors remain separate so role, presenter, confirmation strength and
  concurrency heads cannot drift behind a generic transition API.
- Kept source compact with three aggregate schema files and shared identical
  input/result shapes. The generated manifest expands the descriptors by
  design; it is deterministic output, not a second authoring path.
- Public inputs carry only business decisions and owner-issued option refs.
  Workspace, actor role assignment, owner snapshots/evidence, the private
  Nurture Workflow ref, expected repository heads and derived lifecycle/state
  remain server-side prepare bindings.
- The public action result exposes the My-Chat-owned opaque Workflow Run ref,
  exact committed head and the frozen I1 stage/waiting/pending/milestone
  vocabulary. Its effect is closed to the exact 21-command inventory.

## Surface and authority boundary

- `institution_board` consumes the two Institution queries and remains
  `actionProjection: none` with an empty write set.
- `institution_workbench` consumes Institution queries and Admin/mixed actions.
- Guardian chat/board consume only the rank-free family status query and
  Guardian/mixed waitlist, offer, preparation and formalization actions.
- Caregiver chat/board receive no Enrollment Journey capability.
- The family result contains no entry/order/category/policy/local Workflow
  identity. Admin ordering retains a sealed journey target option instead of
  projecting the private Workflow ref.

## Default-off proof

- Every one of the 24 descriptors requires both the completed
  `t007_enrollment_journey_i1` contract boundary and the unqualified
  `t007_enrollment_journey_runtime` owner-integration gate.
- Port policy reuses the existing exact binding owner and one Nurture
  Enrollment Journey repository. Native touchpoint confirmation additionally
  reuses the existing Institution communication owner-read port.
- `scenario.manifest.yaml` and `src/module.ts` remain unchanged and contain no
  `EnrollmentJourneyWorkflowV1` registration. No handler, presenter runtime,
  real owner adapter, DB connection/migration/apply, deployment, activation or
  traffic was added.

## Qualification

- Exact artifact rebuild: PASS, 58 capabilities / 6 surfaces; shared core hash
  remains `sha256:7bd8a82d…`.
- I2-A contract suite: PASS, including inventory, default-off dependency,
  role/surface separation, public-input privacy, rank-free Guardian result,
  prepared-head concurrency and manifest/module absence.
- Schema compilation and negative contract validation: PASS.
- Full Surface Contract conformance, TypeScript and repository structural gates
  are recorded in [`04-verification.md`](./04-verification.md).
- External My-Chat pin remains the known G-09 red gate; I2-A does not adopt or
  qualify that checkout.

## Next gate

I2-B may implement the public handler/presenter adapters and default-off
module/manifest composition against these exact DTOs. It must retain the
runtime NO-GO and cannot claim a real owner path. I3/I4 remain responsible for
authenticated My-Chat owner/private ingress and joint replay/negative/mobile-
Web head conformance.
