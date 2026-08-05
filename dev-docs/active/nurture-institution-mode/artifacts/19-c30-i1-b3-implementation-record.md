# C30-I1-B3 Current-Owner and Status Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: I1-B3 only
- Result: `I1_B3_IMPLEMENTED / LOCALLY_VERIFIED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_ACCEPTED / I1_B1_B2_B3_COMPLETE`
- Next state: `I1_B4_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `I1_C_BLOCKED / C30_I2_NO_GO / C30_I3_NO_GO / C30_I4_NO_GO`

The Base-only I1-B3 source is complete. It closes the Scenario-private evidence
and status body shapes without claiming that any owner lookup, writer fence or
recovery decision exists at runtime.

## Exact source checkpoint

| Repository | Branch | Commit | Parent | Worktree state |
| --- | --- | --- | --- | --- |
| My-Workflow-Base | `codex/T-002-c30-i0-base` | `edbcd747eb50106b8f4967c3cb03b5480cbebc7f` | B2 `445c23649c5177f6d10ebcb1456b8191ea928fb4` | Clean after commit |

Commit subject:

```text
feat(contracts): add current owner status bodies
```

The existing I1-A source lock remains `bd69d1988e0d066dad586f16d839c6ff7f67e2c9`
and intentionally does not claim the B1-B3 source population. I1-B4 owns the
cumulative build/conformance/source-lock closure.

## Implemented surface

I1-B3 adds:

- `ScenarioCurrentOwnerBindingPairEvidenceV1`;
- `ScenarioIdentityOperationStatusLookupRequestV1`;
- closed `ScenarioIdentityOperationStatusLookupResultV1` variants;
- `committed|confirmed_no_effect|unknown` statuses;
- allowlisted `unknown` reasons:
  `lock_timeout|possible_inflight|owner_unavailable|compatible_evidence_ambiguous`;
- strict evidence/request/result and request/result exchange assertions;
- three JSON Schemas, typed/JSON fixtures and conformance tests.

Both private inputs require exactly two distinct, sorted
`ScenarioOwnerBindingRefV1` entries. The status exchange proves operation and
Scenario command identity parity. Every result variant rejects the fields owned by
the other variants.

## I1-A composition and security boundary

- Current evidence and status request are only operation-specific inputs inside
  `ScenarioPrivateInvocationV1`.
- Workspace/scenario/operation routing, caller/issuer/audience, validity window and
  nonce remain solely in I1-A. Credentials, key ids and signatures remain detached.
- B3 inputs reject raw canonical object, platform binding/head, membership, PII,
  role/policy/Grant, protected body and duplicated transport fields.
- B2 Host-internal pair bodies cannot pass B3 Scenario-private codecs.
- `request_nonce_hash` is body-only response correlation. Linking it to the I1-A
  request nonce and authenticating the response remain later transport duties.

## Writer-fence truth boundary

- `unknown` is a nonterminal quarantine shape and MUST NOT be treated as
  `confirmed_no_effect` or replacement-work authority.
- Base validates status structure, canonical check time, reason allowlist and
  evidence-hash shape only.
- Base does not prove terminal attempts, deadline/skew, lock acquisition,
  `CommandExecution` absence, association absence, owner availability or database
  truth. Those are I2/I3 runtime obligations.

## Verification evidence

| Check | Result | Notes |
| --- | --- | --- |
| Contract source typecheck | PASS | Workflow-contract source passes `tsc --noEmit`. |
| Source-mapped fixture typecheck | PASS | Seven fixture files compile against current source exports without generating `dist`. |
| Schema package | PASS | All 23 Schemas compile and evidence/request/all three result fixtures execute twice deterministically. |
| Strict three-state execution | PASS | `committed`, `confirmed_no_effect`, `unknown` and all four unknown reasons pass; mixed variants, bad reasons and noncanonical times fail. |
| Runtime codec/exchange | PASS | Pair ordering, operation/command parity, variant field closure and malformed body negatives execute through an in-memory no-output harness. |
| I1-A composition | PASS | I1-A accepts the request only as opaque `operation.input`; the B3 codec independently rejects a duplicated nested nonce. |
| Exposure boundary | PASS | Raw canonical/binding/membership and transport fields fail; B2 Host-internal bodies fail B3 private codecs. |
| Repository boundaries | PASS | Canonical-ref lint, consumer boundary, contract/doc alignment, semantic-lint wrapper, diff/secret scan and test syntax checks pass. |
| Context/governance/docs | PASS | Context checksum `ae0dcf183fb7222fd662077943bc99466862c3e3572cc7c78ea66e45e0fba9df`; strict Context/project-state/governance checks, T-002 query and 415-file document/anchor lint pass. |

The standard built-package conformance command remains deferred because no build
was requested. Generated `dist`, full package tests, cumulative exposure audit,
deterministic build and exact source-lock verification are I1-B4 responsibilities.

## Freeze-label repair

The scope-freeze wire-family headings called current evidence “B3” and status
lookup “B4”, while the authoritative ordered implementation units assigned both
to I1-B3 and reserved I1-B4 for cumulative verification/source lock. Artifact 16
now labels them B3a/B3b. No wire, field or authorization changed.

## Unchanged surfaces

- no Base runtime, Scenario starter, dependency, package version, generated `dist`
  or source lock;
- no My-Chat/Nurture source, manifest/module, Prisma/schema/migration, route,
  signer, registry, database, writer fence or capability;
- no C30-I2, deployment, activation, T-007/T-008, Pilot or traffic.

## Rollback and next gate

Rollback B3 by reverting Base commit
`edbcd747eb50106b8f4967c3cb03b5480cbebc7f`; B1/B2 can remain independently. No
runtime, consumer, database or source-lock compensation exists.

The only eligible next implementation decision is a separate authorization for
`I1-B4`: cumulative Schema/codec/exposure verification, full Base qualification
and the exact source-lock seal. It must not start I1-C or C30-I2.

Post-B3 checkpoint: the user later authorized and completed I1-B4 at Base lock
commit `9a1586597a2eabd2876ad39e02c90491373595d0`, recorded in
`20-c30-i1-b4-qualification-record.md`. This does not change the B3 source result.
