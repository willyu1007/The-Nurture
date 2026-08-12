# G4-E Q3 Service-backed Safety Qualification Decision

## Status

- Date: 2026-08-11
- Task: T-007
- Verdict: `G4_E_Q3_SINGLE_TRACK_V2_CONTRACT_PASS /
  ADAPTER_QUALIFIED / LIVE_QUALIFICATION_ACTIVATION_GATE /
  DEFAULT_OFF`
- Normative machine contract:
  `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` /
  `sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741`
- Canonical layout:
  `packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/`
- Bound answer-safety contract:
  `nurture.institution-knowledge-answer-safety@2.0.0`
- Effect of this record: documentation and planning synchronization only; the
  machine contract was rotated separately. This record does not change a
  provider, credential, route, model call, database, activation or traffic.

## Decision

T-007 Q3 uses a service-backed structured safety decision owned by My-Chat and
invoked through its single model gateway. Qwen, Bailian or another approved
service MAY implement that decision. This qualification makes no claim about
provider-weight verification or bitwise-identical remote model output.

The speed-oriented decision changes the assurance mechanism, not the safety
behavior. The adapter MUST retain:

- an explicit model or deployment version rather than a moving alias;
- an immutable prompt id/version;
- a versioned strict structured-output schema with closed keys and enums;
- request, source-conflict and generated-draft safety decisions;
- fail-closed mapping for timeout, refusal, malformed output, unsupported input
  and transport failure;
- all 15 existing positive, unsafe, conflict, draft and unavailable regression
  fixtures;
- default-off composition until the named qualification level passes.

Nurture continues to own the decision vocabulary, fixtures, abstention and
presentation semantics. My-Chat owns the service adapter, gateway invocation,
prompt/model selection, telemetry and canonical safety ledger. Nurture MUST NOT
import a provider SDK or create a second gateway/prompt registry.

The current normative gate is the generated qualification contract at `2.1.0`
and the exact digest recorded above. It requires all gateway, provider, model,
deployment and immutable prompt pins plus exact owner-contract and answer-
safety-contract identities, strict structured JSON, independent invocation
evidence and request/response digests across all 15 fixtures. Its current
verifier may issue at most `adapter_qualified`.

## Two qualification levels

| Level | Required evidence | What it permits | What it does not prove |
| --- | --- | --- | --- |
| `adapter_qualified` | Real adapter serialization/parser/fail-closed code; no-secret synthetic transport tests; all 15 fixtures against the pinned model/deployment and prompt identities | Closes the current Q3 implementation gate and permits default-off E7 owner binding plus E8 joint conformance | No real provider request, credential readiness, service availability or traffic readiness |
| `live_qualified` | The same pinned adapter completes a real secret-backed request through the configured My-Chat gateway and passes a bounded activation smoke | Allows a separately authorized feature-flag/traffic activation decision | Production approval, unrestricted rollout or a guarantee of bitwise-repeatable model output |

`live_qualified` is not required to complete E7/E8 when the capability remains
disabled. It MUST pass before any Q3 feature flag or traffic is enabled. A mock,
stub or copied fixture response is never live evidence.

## Structured service acceptance boundary

The adapter is admitted at `adapter_qualified` only when it:

1. calls the existing My-Chat gateway rather than a direct provider SDK;
2. records an exact adapter version, gateway profile, model/deployment version,
   prompt id/version and output-schema version;
3. prevents free-form provider prose from crossing the owner boundary;
4. validates the complete status/reason/conflict vocabulary and rejects extra,
   missing or contradictory fields;
5. maps all transport/parser/provider failures to `unavailable`;
6. runs every one of the 15 fixtures through the real adapter code, including
   its serialization and parser, even when the transport is synthetic;
7. preserves the existing default-off and canonical-ledger boundaries.

Raw generic moderation labels are insufficient unless the service adapter
converts them into the closed Nurture decision through the pinned prompt/schema
and the full regression suite passes. Hand-written fixture answers, moving
model aliases and unvalidated model self-rating remain inadmissible.

## Explicit non-claims

This policy does not claim:

- bitwise deterministic output from a remote model;
- access to or verification of provider model weights;
- that `adapter_qualified` evidence contains a live provider invocation;
- that `live_qualified` alone authorizes deployment or production traffic.

Behavioral stability is established by strict schema validation, bounded
normalization, the 15 fixtures, failure-path coverage and the default-off gate.
Provider behavior may still change operationally, which is why activation has
its own live smoke and rollback gate.

## Single-track authority

The sole normative machine contract is `2.1.0` in `/v2` at the digest above;
no `/v1` files or fallback verifier remain. All prior qualification identities,
layouts and evidence are invalid/non-current; their audit history remains in
Git history only.

## Current state

- My-Chat already provides Q2 owners and generation replay through `942bd00`;
  its V2 safety owner/runner now emits the complete current tuple.
- Prior adapter evidence is invalid/non-current and is not a current gate.
- Current V2 evidence passes all 15 fixtures with 30 unique invocation ids
  against the exact `2.1.0` digest and 13-pin tuple. Q3 is
  `ADAPTER_QUALIFIED` and its implementation gate is closed.
- No live provider smoke has run, so `live_qualified=false` remains the
  activation gate.
- E7/E8 and all related capabilities remain default-off.
- Strict task-doc lint passes 137/137 with zero warnings; project-governance lint
  and `git diff --check` pass for this policy synchronization.

## Current 2.1 qualification evidence

From the My-Chat checkout, the V2 runner generated the gitignored candidate at
`.ai/.tmp/tests/nurture-institution-knowledge-safety/candidate-evidence.json`.
The file was not copied into Nurture or committed. Nurture verified it with:

```powershell
node scripts/institution-knowledge-safety/qualification-core.mjs --evidence D:\Else\My-Chat\.ai\.tmp\tests\nurture-institution-knowledge-safety\candidate-evidence.json
```

| Evidence field | Qualified value |
| --- | --- |
| Qualification | `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` / `sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741` |
| Result | `adapter_qualified=true`; `live_qualified=false`; `default_off`; `bitwise_determinism=false` |
| Evidence mode | `adapter_recorded` |
| Gateway | `my-chat-llm-gateway@1.0.0` |
| Provider / API | `aliyun-bailian` / `dashscope-compatible-api-v1` |
| Model / deployment | `qwen-plus-2025-12-01@2025-12-01` / `aliyun-bailian-cn-qwen-plus-2025-12-01` |
| Prompt | `nurture-institution-knowledge-safety@1` |
| Owner contract | `my-chat.nurture-institution-knowledge-answer-safety-owner@2.0.0` |
| Answer-safety contract | `nurture.institution-knowledge-answer-safety@2.0.0` |
| Regression | 15 fixtures × 2 attempts = 30 unique invocation ids |

This is current real-adapter evidence over recorded/synthetic transport. It
closes Q3 for default-off E7/E8 but is not a live provider-call receipt.

## Next gate

E7's exact owner admission and default-off host composition now pass in
[`81`](./81-g4-e-e7-owner-composition-record.md). The follow-up audit
[`82`](./82-g4-e-e7-formal-ingress-contract-audit.md) found that the remaining
gate begins with a typed verified-invocation/authorization-context contract and
command confirmation model, followed by authenticated private transport. E8
then follows without traffic. Before any later
activation, run the separate secret-backed smoke and record `live_qualified`
without including credentials, raw private text or provider secrets.
