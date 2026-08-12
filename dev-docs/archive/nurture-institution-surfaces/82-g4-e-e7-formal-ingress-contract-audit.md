# G4-E E7 Formal Ingress Contract Audit And Resolution

## Status

- Date: 2026-08-11
- Task: T-007
- Verdict: `G4_E_E7_FORMAL_INGRESS_BOUND_DEFAULT_OFF /
  PRODUCTION_OWNER_BINDING_PENDING`
- Runtime posture: default-off; no HTTP route, credential, deployment, live
  provider call, feature flag or traffic was added.

## Outcome

The original audit correctly rejected passing signature, credential or
authorization claims through ordinary `internal_api_handlers`. That contract
gap is now closed through one committed cross-repository chain:

1. My-Workflow-Base `6740871` adds the dedicated verified-invocation registry,
   sanitized handler envelope and exact manifest/registry validation;
   `536638a` seals its source lock.
2. My-Chat `4960f47` adopts the registry, `a57e1ae` and `2a2bb3c` seal the
   source/adoption locks, and `d585ada` provides the canonical-principal
   retrieval owner that keeps `PermissionContext` inside My-Chat.
3. Nurture `42d0858` adopts the registry for C30, `9a39d42` freezes the
   Institution Knowledge two-stage contract, `6d7d526` binds query/prepare/
   execute, and `4e61335` closes the review findings. `306fe16` seals the final
   hashes.

The old `nurture.internal.query_institution_knowledge` and
`nurture.internal.execute_institution_knowledge` track is absent from runtime
composition. The disabled Web Workbench mapping names only the three formal
endpoint keys. Direct registry calls recheck scenario, method, endpoint,
operation, schema version, ingress and principal origin before any owner call.

## Frozen authorization and command rules

- The verified principal is transport identity, not Nurture business
  authority. A Nurture resolver must use the declared operation, capability
  and opaque target option to resolve the current Participant, Institution and
  exact `institution_admin` role; ambiguity or drift is denied.
- Prepare resolves current authority and passes it to an owner that freezes the
  typed command under a caller idempotency key. Execute accepts only the owner-
  issued `commandRequestId + confirmationRef` pair and never accepts a new
  target, payload, surface or authority claim.
- Execute re-resolves current authority and compares workspace, participant,
  Institution, role assignment, surface and authority version before business
  binding. Revocation or version drift fails closed.
- `web_run_workbench` is derived from the one disabled formal surface mapping,
  never from request input.
- Preview does not require a My-Chat retrieval owner. The effectful answer path
  obtains that owner only from the verified principal after confirmed-command
  consumption.

## Remaining activation blockers

The module ports are intentionally optional and the default module returns
`unavailable`. Before E8 and before any activation, implement and jointly test:

1. a Nurture current-authority owner that resolves Participant and explicit
   Institution/role scope, including multi-role ambiguity;
2. a durable prepared-command ledger with deduplication, expiry, atomic
   consume, exact replay, response-loss and confirmation-reuse rules;
3. a My-Chat Host adapter that creates the `d585ada` canonical retrieval owner
   and registers the existing signed private transport without a public route;
4. real Base dispatcher → Nurture authority → My-Chat retrieval conformance,
   including revocation between calls and proof that `PermissionContext` never
   crosses into Nurture.

`live_qualified=false` remains a separate activation-only gateway smoke. It is
not required for default-off implementation or E8 preparation.

## Verification

```powershell
pnpm test
pnpm --filter @the-nurture/scenario typecheck
pnpm verify:test-routing
pnpm verify:c30-i3-default-off
pnpm verify:c30-i3-owner-adoption
node scripts/verify-workflow-contract-pin.mjs
```

Expected current results: 92 unit files / 996 tests; scenario typecheck and
manifest pass; 164 test files are routed; exactly six trusted handlers are
declared with zero positive application route registrations; adoption hash
`b02a27c03bddcebc2d0aee14e5fc121f672d50db2c2f986f3a17d67299c236be`;
Nurture scenario hash
`b56cb3f17a20fd67f1798a0fc64b677a1f1f5656daecf402828137d317d88017`.

`pnpm verify:c30-i3-upstream` additionally requires every pinned sibling
worktree to be clean. It currently stops on unrelated My-Chat cloud-deployment
documentation changes; the exact committed revision and source-hash checks
above pass and those unrelated files were not modified.
