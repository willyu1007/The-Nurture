# G4-D I2-B — Enrollment Journey Surface Adapters

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input artifact: `nurture.surface-contract@1.19.0` /
  `sha256:6f67d49ca303ad627b6644857a16dde7626cc944bf8c065f09629039025f738e`
- Verdict: `G4_D_I2_B_SURFACE_ADAPTER_QUALIFIED`
- Effect boundary: synthetic public handler/presenter composition only

## Implemented boundary

- Added one exact adapter for the three I2-A queries and all 21 I1 commands.
  Public operation DTOs are validated before owner resolution; Workspace,
  actor/role assignment, owner snapshots, protected carriers, private refs and
  expected heads come only from the injected trusted binding port.
- Action DTOs require and queries forbid `confirmationRef`. The command
  executor port receives the opaque ref so I3 can verify and consume the exact
  input/target/head binding in the same transaction as the I1 effect.
- Each command maps to its existing I1 `NurtureCommandSpec`; no command,
  lifecycle, deadline, blocker or persistence path was duplicated.
- Institution and Guardian role/surface combinations are enforced before an I1
  command executor is called. Mixed actions bind their actor from the explicit
  business choice plus the current active role.
- Query and command internal keys reject cross-lane capabilities. Returned
  query/command Workflow Run identity is matched as a complete canonical tuple;
  target or scope drift fails unavailable.
- Presenters convert the My-Chat Workflow Run ref to an opaque public ref,
  remove private Nurture Workflow/entity refs, seal Admin waitlist targets and
  keep the Guardian waitlist rank/category/policy-free.

## Default-off composition

- The scenario module registers one query and one command adapter key. Their
  default dependencies always return `enrollment_journey_runtime_unavailable`.
- The composed adapter request/response is an internal module bridge around the
  public business DTOs, not a second formal Surface invocation or error
  envelope. I3 owns the single mapping from formal scenario-service ingress.
- The canonical manifest declares the same adapter pair under chat, mobile and
  Web surface composition with `enablement_policy: disabled`; it does not add a
  second legacy Workflow capability or a production route.
- All 24 Surface Contract descriptors retain the unqualified
  `t007_enrollment_journey_runtime` owner-integration gate.
- No scenario-service route, My-Chat owner adapter, Prisma/DB operation,
  activation, deployment or traffic was added. Those remain I3/I4 work.

## Qualification

- The dedicated adapter suite covers request trust-boundary rejection, all 21
  command-to-spec bindings, protected/owner/head mapping, role/surface denial,
  canonical result drift, three role-safe query presenters, cross-lane
  rejection and fail-closed module/manifest composition.
- Qualification passes the dedicated 14/14 suite, full unit 901/901, root
  typecheck, Surface Contract tooling 5/5 plus 130/130 tests, and all routing,
  persistence, port, ingress, G2 and G3 structural gates.
- Full verification evidence is recorded in [`04-verification.md`](./04-verification.md).

## Quality review and cleanup

- Moved trusted-context validation ahead of owner binding resolution and froze
  every default dependency object so the canonical module cannot be enabled by
  mutation.
- Made sealed Admin journey targets carry their exact private waitlist entry
  identity/head as server-only option input. Added full query/command canonical
  drift, six mixed-role branches and invalid-trusted-context negatives.
- Removed the internal adapter barrel export. The formal public interface
  remains the Surface Contract; I3 alone will own its ingress/error mapping.
- Kept the 24-key inventory in one exact contract suite. Historical selection,
  typed-result, factory and formal-ingress censuses now derive the group from
  the unique runtime gate instead of maintaining four more lists.
- Replaced source-string assertions with module/manifest behavior assertions.
  No implementation file was deleted: the three source schemas, deterministic
  artifact, adapter, dedicated tests and records each remain an SSOT or direct
  qualification input; no temporary fixture, compatibility branch or duplicate
  runtime remains.

## Next gate

I3 may implement the authenticated prospective-contact/native-source/current-
owner binding port and command executor on an approved disposable target after
G-09 adoption. It must not weaken the existing runtime dependency gate or use
caller-supplied trusted fields.
