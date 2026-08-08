# G4-0C-4 Surface Envelope & Communication Owner-read — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-4, parallel with 0C-3 after 0C-2
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.surface-contract@1.18.0` /
  `sha256:be84bb23a4842083f7832389b4eb27a47fadd6169729aecd34b6f5daf939e3c0`
- Capability: `query_institution_communication_review@1.0.0`, slice
  `sha256:b88fa7e9…`
- Consumes: `nurture.institution-scope@1.0.0`
  ([`12-g4-0c-2-institution-scope-freeze.md`](./12-g4-0c-2-institution-scope-freeze.md))
- Verdict: `G4_0C_4_FREEZE_PASS`
- Releases: the workbench's first content module
- **This unit rotated the contract.** Unlike 0C-1 through 0C-3, it changed
  published artifacts. Non-effects still hold: no handler, no schema apply, no
  migration, no manifest capability enablement, no deployment, activation or
  traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Provider of the underlying owner-read | Nurture / T-005 G2-B | `nurture.institution-business-communication-owner-read@1.0.0` / `sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921` |
| Surface contract | T-004 | rotated `1.17.0` → `1.18.0` by this unit |
| Owner path | T-002 | current-pin per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Consumer | `institution_workbench` `communication_review` module | — |

The T-005 interface is consumed **unchanged**. Its digest is unrotated, its
`actions: []` and `action_authority: none` are preserved, and this unit adds no
second reader. What it adds is the surface binding that makes the existing
private-service lane reachable as a public capability.

## 2. Fact, projection and candidate boundaries

**Canonical fact:** the family-care message and its lifecycle, owned by T-005.
0C-4 introduces no new persisted fact.

**Derived projection:** `QueryInstitutionCommunicationReviewV1.result` — a
paged, role-safe view over `InstitutionBusinessCommunicationProjectionV1`.

**Not permitted:** any Admin write path. This is a read capability whose
`actions` array is schema-constrained to `maxItems: 0` with `items: false`, so
an action cannot be added without a visible contract rotation.

## 3. Frozen shape and what rotated

The capability descriptor freezes:

- `executionClass: query`, `deliveryClass: none`, `confirmationPolicy: none`;
- `supportedRoles: ["institution_admin"]` — the single change that would turn
  an Admin owner-read into a caregiver- or guardian-reachable surface;
- head bindings `institution_scope` (predicate
  `current_institution_admin_scope@1.0.0`, from 0C-2) and `source_visibility`
  (`current_board_fact_visibility@1.0.0`, reused from T-006);
- presenter binding `institution_workbench` → `present_institution_workbench`,
  and no other surface;
- eligibility policy resolving to `binding_owner_repository` plus the new
  `institution_communication_repository`, which is **`owner_integration`**
  gated — a `contract_boundary` gate would let a synthetic double stand in for
  the real owner path.

The result shape carries `messageRef`, `occurredAt`, `businessScope`
(enrollment/careGroup/institution refs, `dataClass`, `direction`,
`purpose: family_care_workflow`, `adminSupervision: pre_send_disclosed`),
`author` (side/role), `changeState`, optional `content.body`, `attachments`
and the empty `actions`. Every object is `additionalProperties: false`, and no
`childId`, `familyId` or My-Chat user id appears anywhere in the artifact.

`content` is optional on purpose: a redacted message has no body, and its
absence is the contract's way of saying so rather than an empty string.

### Additive rotation — evidence preserved

`sharedCoreHash` is **unchanged** at
`sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d`.
Per `compatibility-policy.json`, `additiveNewSlice` is
`preserve_existing_slice_evidence`, so every T-005 and T-006 capability slice
keeps its qualification. `verify:g2-exit-contract` and `verify:g3-0-freeze`
both pass unchanged across the rotation, which is the mechanical proof.

Four registries and two fixture schemas moved with it: the capability, schema
and port registries, the conformance case list, and the closed capability-key
enums in `selection-cases.schema.json` and `journey-script.schema.json`. Those
last two are worth naming — they are closed enums, so a new capability is
rejected until it is admitted deliberately.

## 4. Predicate

0C-4 adds no authority level. It **binds** the chain 0C-1 and 0C-2 froze to a
surface:

```text
active role → institution scope → [this capability]
```

Reads resolve through `institutionRef` from `InstitutionScopeContextV1`. Three
surface authority rules are closed here:

- **`business_channel_disclosed_before_send`** — enforced by T-005's closed
  `institutionAdminDisclosureAuthorizes` predicate, which requires
  `schema_version === 1`, `disclosed === true`, exact institution, enrolment
  and care-group match, and membership of the expected direction, data class
  and purpose. Missing, legacy or partially shaped snapshots deny. 0C-4 does
  not reimplement it.
- **`current_source_lifecycle`** — the `source_visibility` head; a redacted or
  suppressed source is projected as `changeState`, never as body.
- **`admin_read_never_grants_care_group_action`** — the empty `actions` array,
  schema-enforced.

Child-level content remains behind 0C-3: this capability reads
institution-scoped business communication, and any drill-down to a child fact
is a different read with its own purpose requirement.

## 5. Lifecycle, versioning and concurrency

- Paged query over a snapshot, using the shared `moduleBinding` and
  `snapshotPageInfo` — a page resumes only under the same contract,
  capability, actor, scope, order and page size.
- Authority is reread per request, inheriting 0C-1 and 0C-2.
- No command, no idempotency key, no outbox, no replay.
- The capability is registered but **not enabled**: nothing in the scenario
  manifest activates it, and the `t007_institution_workbench` dependency gate
  remains unsatisfied, so the surface's legal state is still `unavailable`.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Institution scope unresolved | inherit 0C-2's deny |
| Role other than `institution_admin` | filtered out as `role_unsupported` before eligibility |
| Disclosure snapshot missing, legacy or partial | deny `not_authorized` (T-005 predicate) |
| Protected content unavailable | `unavailable` with `protected_content_unavailable` |
| Source redacted | item present with `changeState.content = "redacted"`, no body |
| Contract or capability version mismatch | deny `contract_mismatch` |
| Owner unavailable | deny `unavailable`; never cached |

## 7. Fixtures and gates

Conformance case `institution-communication-review-contract` covers
`capability:query_institution_communication_review` through
`packages/nurture-scenario/tests/surface-contract/phase-4-institution-communication-review.test.ts`.
It asserts contract-level properties only — descriptor, schema and wiring —
because 0C is a freeze stage and a test claiming handler behaviour would be
asserting implementation evidence the I1 gate has not opened.

The properties it pins are the ones a later implementation could violate while
still building green: an added action, a widened role, a leaked child or
family identity, a re-derived scope, an opened object.

Selection fixtures place the capability in `filteredOut` with
`role_unsupported` for both the guardian and caregiver filtering cases, which
keeps the partition complete and proves the role restriction at fixture level.

## 8. Schema delta

**None — `REUSE`.** The reader consumes T-005's existing tables through the
existing repository. `institution_communication_repository` is a **port**
registration, not a table.

No migration is authored, planned or applied.

## Exit

`G4_0C_4_FREEZE_PASS` releases the workbench's first content module for
implementation once I1 opens. It does not enable the capability, satisfy
`t007_institution_workbench`, open G4-C, or authorize schema apply,
activation, deployment or traffic.

Because this unit rotated the published contract, the rotation must be carried
into the T-007 Exit evidence and any consumer pin that cites `1.17.0`.
