# C30-I3-D Subject Provider and Baseline Presentation Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- Prerequisite: artifact 56
- Runtime source: `cccdc6b3089aef6f440d0061c8de5fd459aa1984`
- Lock-tool source: `5bb260e98670ecae3ca9e42983873c0df5ac3340`
- State: `C30_I3_D_ACCEPTED / I3_E_AUTHORIZED_NEXT`

I3-D is accepted. Nurture now owns the exact
`nurture.child_care_process_v1` provider and
`nurture.child_care_process_overview_v1` presenter semantics already declared
by the generated manifest. No route or production registration was added.

## Owner read boundary

- List, resolve and present first rerun typed Participant binding and current
  Nurture business authority for the exact operation.
- One Serializable DB read then exact-validates the Participant and binding,
  active process-scoped role/time window, active local Child/Process/Family,
  both current anchor associations, associated anchor lifecycle and the exact
  committed pair operation.
- An injected transaction-aware pair-evidence port must revalidate the current
  canonical pair. Its production default adapter always denies; no My-Chat ORM,
  database or runtime is imported.
- Context versions bind all local revisions/timestamps, current role set,
  Participant/binding/authority revisions, pair commit evidence and current
  pair-evidence source/version. A changed input returns `context_changed`.

## Opaque refs and safe presentation

- Subject refs and cursors are bounded AES-256-GCM locators with authenticated
  purpose, Workspace, Participant, target/cursor, version and expiry. Local IDs
  are encrypted rather than base64-encoded, and every use still rereads current
  authority.
- List pagination follows Base's 1..20 bound. The structurally impossible
  one-candidate-with-next-page case returns a safe unavailable result rather
  than emitting an invalid `needs_selection` body.
- The baseline emits exactly the six closed Base block kinds: summary, notice,
  fact group, metric group, item collection and timeline. Copy is fixed,
  display-safe, role-neutral and contains no protected body or raw identity.
- Navigation is display-only and `actions=[]`. The production manifest still
  has `action_offer_policy=none`, zero domain actions and zero protected
  declarations.

## Verification

| Check | Result |
| --- | --- |
| Scenario and DB typecheck | PASS |
| Focused Scenario presentation | PASS — 1 file / 8 tests |
| Focused DB owner matrix | PASS — 1 file / 14 tests |
| Complete Scenario suite | PASS — 55 files / 620 tests |
| Complete DB suite | PASS — 22 files / 239 tests |
| Scenario/DB production build | PASS |
| Exact upstream handoffs | PASS |
| Cumulative adoption lock | PASS — `e40fb649080943a5f39fb59080a2b2c246e353a4707c47ae2ad956fc5e4cb404` |
| Subject/presentation profile | PASS — `76c957978027ef04ae320f4fca71a91714bdcb032e8493c4bbca85c8b986b339` |

The matrix covers opaque ref/cursor bounds, pagination, all six semantic block
kinds, action-free output, wrong Workspace, tamper, expiry, stale context,
durable-origin denial, undeclared presentation, current-role revoke, association
revoke, aggregate drift and production default-deny pair evidence.

## Effect boundary and next gate

No schema/migration, existing database, route, capability, deployment,
activation, I4, C31, T-008, Pilot or traffic operation occurred. Only synthetic
rows in the exact I3 disposable target were used. I3-E is next under the user's
ordered authorization and remains fixture-only with no production action.
