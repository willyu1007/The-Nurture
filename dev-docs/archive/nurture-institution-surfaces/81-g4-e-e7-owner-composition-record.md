# G4-E E7 Owner Composition Record

## Status

- Date: 2026-08-11
- Task: T-007
- Verdict: `G4_E_E7_FORMAL_INGRESS_BOUND_DEFAULT_OFF /
  PRODUCTION_OWNER_BINDING_PENDING`
- Qualification:
  `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` /
  `sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741`
- Runtime contracts: answer safety `2.0.0`; My-Chat safety owner `2.0.0`;
  complete 13-field service pin.

## Implemented slice

The Nurture module now admits Institution Knowledge owner dependencies only
when the exact adopted Q2 tuple, Q3 qualification tuple, injected owner
`service_pin` and sole decision-rule pin all match. Missing, extra or drifted
fields return the immutable default unavailable dependency set. The superseded
two internal handlers have been removed. The only Nurture entrypoints are the
exact trusted query, prepare and execute handlers declared in the manifest.

My-Chat now provides one default-off E7 composition for the adopted retrieval,
source-consumer, generation and V2 answer-safety owners. It constructs the
service-backed owner through the unified LLM gateway but performs no gateway
call while composing. The composition declares zero feature flags, route
registrations, product bindings, production peer bindings and external
traffic.

The old V1 qualification/provider surface and runnable `/v1` contract layout
were removed. No alias, compatibility decoder or fallback verifier remains.

The shared verified-invocation registry is committed in Base and adopted in
My-Chat. Nurture freezes the exact declaration tuple, fixed Workbench surface,
owner-held command payload and confirmation pair. Direct declaration drift,
current-authority loss and prepared-authority version drift return safe
`unavailable|denied` results before business execution. Missing production
owners keep all three lanes unavailable.

## Verification

- Qualification source/manifest: 7/7 tests; sole `/v2` layout confirmed.
- Current adapter evidence: 15 fixtures, 30 unique attempts;
  `adapter_qualified=true`, `live_qualified=false`, `default_off`.
- Nurture owner/surface/admission plus formal ingress: full 92 files / 996
  tests, scenario typecheck, manifest and 35 focused formal/conformance tests.
- My-Chat owner/provider/runner/composition and adjacent owner regressions:
  53/53 tests; LLM and scenario-integration typechecks; ESLint pass.
- Base/My-Chat/Nurture registry adoption and normalized source pins pass.
  Nurture scenario hash is `b56cb3f1…8017`; adoption hash is
  `b02a27c0…36be`.

## Remaining E7 gate

The contract and registry gap is closed, but E7 activation composition is not
complete. Production implementations are still required for the Nurture
current-authority resolver, durable prepared-command/confirmation owner and
the My-Chat host adapter that creates the d585 canonical retrieval owner. See
[`82`](./82-g4-e-e7-formal-ingress-contract-audit.md). These owners must not be
reconstructed from payload fields.

After that contract slice, the authenticated private transport must preserve
the exact tuple above, remain default-off and pass outage, drift, replay and
authorization tests. It must not add a provider SDK, second prompt registry,
live call, feature activation or traffic.

After that transport binding qualifies, E8 may run Joint Conformance. A real
secret-backed gateway smoke remains a later activation-only gate.
