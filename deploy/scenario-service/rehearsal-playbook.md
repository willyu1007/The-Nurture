# Staging joint rehearsal playbook

Run this playbook once activation authorization, the staging deployments, and
the My-Chat nurture-bff wiring/control plane have landed. It is a staging-only
G8 rehearsal, not a rollout procedure: it proves the real network, bearer,
gate, and latency boundaries that the frozen fixtures cannot prove. Do not
enable a production gate, widen an allowlist, or treat a rehearsal pass as
production activation authority.

The fixture files are immutable test inputs. This playbook does not modify
`packages/nurture-scenario/contracts/*/v1*/` or create staging fixture data.

## 1. Preconditions

The rehearsal lead MUST record one release identity before opening a surface:
the deployed Nurture image digest or revision, the deployed My-Chat revision,
the adopted contract key/version/digest, the staging environment, the
rehearsal tenant, the window start, and the two rollback operators. Never put
a bearer value, request body, raw subject identifier, or secret-manager value
in that record.

All of the following MUST be true before the first request.

- Explicit activation authorization is on record. Both Nurture
  scenario-service and My-Chat are deployed to staging, healthy, and pinned
  to the release identity. The staging DB migration baseline is flat.
- Each Nurture provider gate is `true` only while its surface is being
  rehearsed on staging; all other Nurture provider gates remain `false`.
  The current gate-to-surface mapping is in
  [config-manifest.md](config-manifest.md):

  | Surface | Nurture staging gate |
  | --- | --- |
  | W2 parent context | `NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED` |
  | W3 parent communication v1 | `NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED` |
  | W4 director | `NURTURE_DIRECTOR_PRESENTER_ENABLED` |
  | W6 teacher class stream | `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED` |
  | W7 teacher organization | `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` |
  | W8 teacher communication | `NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED` |
  | W10 teacher assistant query | `NURTURE_TEACHER_ASSISTANT_QUERY_OWNER_ENABLED` |
  | W9 teacher media association | `NURTURE_TEACHER_MEDIA_ASSOCIATION_OWNER_ENABLED` |
  | W11 parent communication extension | `NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` |

- The My-Chat nurture-bff equivalent surface gate is on only for the same
  surface, and its family/org allowlist contains only the rehearsal tenant.
  No percentage ramp is used for G8. The bff's selected client must carry the
  adopted exact contract pin; the gate and allowlist are routing controls, not
  authority for Nurture facts.
- `NURTURE_INTERNAL_SERVICE_TOKEN` has been issued and injected into the two
  workload identities exactly as described in
  [token-runbook.md](token-runbook.md). Confirm only matching
  secret-manager references/version metadata and successful configured-route
  authentication; do not inspect, print, or copy the value. Required owner
  bindings, database access, and the other runtime prerequisites for the
  selected gate are complete, otherwise the provider correctly stays closed.
- The rehearsal tenant has a safe, disposable staging data graph capable of
  expressing each selected fixture scenario. The frozen fixture refs and
  timestamps are contract examples, not an existing staging seed mechanism.
  Provisioning equivalent staging facts is **manual until a harness exists**;
  do not change a fixture to accommodate staging data.
- Run the parser check for the evidence tool before collecting the first
  window:

  ```sh
  node --test scripts/summarize-ramp-metrics.test.mjs
  ```

The maintained release order and the G8 acceptance item are in
[gray-release-readiness-v1.md](../../dev-docs/active/nurture-cross-repo-contract-supply/artifacts/gray-release-readiness-v1.md):
G8 is green only when the rehearsal is green and refusal codes have been
matched to the contracts line by line.

## 2. Fixture replay

For every row below, first run its repository validator. That validator is the
existing tool that proves the frozen artifact, schemas, digest, positive and
negative fixtures. `pnpm verify:surface-conformance` is also useful synthetic
qualification, but it explicitly does not claim real-owner or joint-host
conformance. `pnpm verify:owner-integration` drives real local HTTP plus real
PostgreSQL evidence; it is not a remote-staging runner.

There is no checked-in harness that sends any of these fixtures to a remote
host, provisions their data, or compares a remote response. Therefore the
replay in the last column is **manual until a harness exists**. Drive it
through the real, tenant-allowlisted My-Chat nurture-bff surface, not by
calling Nurture with a bearer from an ad-hoc client. For each frozen scenario,
use equivalent staging facts; compare the returned status, response shape,
contract pin, masking/unavailable semantics, reason code, and command
disposition to the fixture and owner contract. Values that are necessarily
staging-specific (opaque refs, timestamps, generated confirmation refs, and
request IDs) need semantic rather than byte-for-byte comparison. Capture the
comparison in the operator record without payloads or secrets.

| Rehearsal order | Surface and frozen fixture layout | Existing validator | Real-service replay |
| --- | --- | --- | --- |
| Wave 1 | W6 teacher class stream — `contracts/teacher-class-stream/v1/conformance-fixtures.json` | `pnpm verify:teacher-class-stream-contract` | Manually replay class-context, child-strip, child-day-detail, and schedule scenarios against the real bff path. Confirm ready, masked, `temporarily_unavailable`, and `request_invalid` outcomes as applicable. |
| Wave 1b, only when its owner ports are complete | W2 parent context — `contracts/parent-context-presenter/v1/conformance-fixtures.json` | `pnpm verify:parent-context-presenter-contract` | Manually replay day, daily-care, activity, notice/confirmation, and freshness scenarios. Confirm scope-loss masking and the confirmation single-use behavior. |
| Separately authorized; the readiness assessment assigns no ramp wave to this base surface | W3 parent communication v1 — `contracts/parent-communication-owner/v1/conformance-fixtures.json` | `pnpm verify:parent-communication-owner-contract` | Manually replay summary, detail, protected-media access, and text prepare/confirm scenarios only if its independent provider/bff gates and production binding are ready. This does not grant W3 a gray-release order. |
| Wave 2, once My-Chat C1/director composition is available | W4 director presenter — `contracts/director-presenter/v1/conformance-fixtures.json` | `pnpm verify:director-presenter-contract` | Manually replay overview, drilldown, and protected-material pages, including the masked and `mobile_action_forbidden` scenarios. No action may be admitted. |
| Wave 3 | W7 teacher organization — `contracts/teacher-organization-owner/v1/conformance-fixtures.json` | `pnpm verify:teacher-organization-owner-contract` | Manually replay feed, organization, organize, supplement, class-note, and queue-admission scenarios. Use only disposable class facts. |
| Wave 3 | W8 teacher communication — `contracts/teacher-communication-owner/v1/conformance-fixtures.json` | `pnpm verify:teacher-communication-owner-contract` | Manually replay targets, membership, timeline, send, staged withdrawal, and mark-read scenarios. Do not send to a real family. |
| Wave 3 | W10 teacher assistant query — `contracts/teacher-assistant-query-owner/v1/conformance-fixtures.json` | `pnpm verify:teacher-assistant-query-owner-contract` | Manually replay missing-records, weekly-source, and weekly-draft scenarios. The owner result is deterministic facts/draft state, not a model invocation. |
| Wave 4 | W9 teacher media association — `contracts/teacher-media-association-owner/v1/conformance-fixtures.json` | `pnpm verify:teacher-media-association-owner-contract` | Manually replay unassociated, association, associate, and discard scenarios using disposable existing media assets; do not upload bytes. |
| Wave 5 | W11 parent communication extension — `contracts/parent-communication-owner/v1-1/conformance-fixtures.json` | `pnpm verify:parent-communication-extension-contract` | Manually replay redaction preview/commit and delivery-receipt scenarios. Use a disposable author-owned message: redaction is irreversible even on staging. |

Run `pnpm verify:formal-ingress-contract` once before the first replay if the
whole W2–W11 set is in scope; it chains the nine exact validator scripts above
and the formal-ingress assertion. It is a preflight, not evidence that a
remote request was replayed. W3 is deliberately called out separately because
the current gray-readiness table does not place its base v1 surface in the
risk-ascending ramp order.

For each row, open only that Nurture gate and the matching tenant-restricted
bff gate, replay all frozen positive and negative scenarios, then close both
gates before moving to the next row. A required negative such as
`disabled_gate` or `service_auth_missing` is a contract scenario; run the
transport/gate drills below rather than weakening the ordinary fixture replay.

## 3. Fault injection

Use a disposable rehearsal request and record its bff-visible outcome, the
provider HTTP status/error when one exists, and the aggregate evidence named
below. Do not kill pods, rotate a live shared secret in place, or introduce a
fault for a tenant outside the rehearsal allowlist. None of the repository
tools installs a staging proxy rule, drops an upstream response, or replays a
remote fixture, so every induction in this section is **manual until a
harness exists**.

| Fault | Staging induction | Required result | Ramp-metrics evidence |
| --- | --- | --- | --- |
| Timeout | Have the staging edge/proxy owner apply a one-request delay for the rehearsal tenant that exceeds the My-Chat bff deadline. To test the provider deadline specifically, use an authorized test-only delay inside the provider request path; no checked-in switch creates that delay. | A provider-side deadline returns HTTP 408 with `{ "error": "request_timeout" }` and logs `request_refused.reason_code=request_timeout`. A bff/client-side timeout or a proxy delay after Nurture completed has no owner-contract response to compare; it must be recorded as transport failure, never fabricated as an owner refusal. | The isolated window MUST show the 408 completion, `request_timeout` refusal, and the timeout-rate/duration fields. A non-zero timeout rate is a hold/abort result for the wave. |
| Disconnect | Have the staging edge/proxy owner accept one request, forward it upstream, then close the client connection before returning the upstream response. Do not use a pod kill as a substitute. | If the aborted request reaches Nurture body parsing, its safe HTTP refusal is 400 `invalid_request`; if the disconnect is after the request was accepted, the client may receive no HTTP result. The owner contracts do not invent a disconnect payload. | The summarizer has no disconnect event and cannot prove client observation. Save its aggregate for the window and mark the disconnected request/result manually in the operator record; investigate unexpected `input`/unknown lines or unhandled exceptions. |
| Wrong or expired bearer | Have the My-Chat staging operator temporarily configure a dedicated, rehearsal-tenant bff canary with a deliberately wrong bearer, then remove it. For an "expired" credential, follow the token runbook's staging rotation/revocation drill and use only the retired secret version. The current opaque `NURTURE_INTERNAL_SERVICE_TOKEN` verifier has no intrinsic expiry claim, so do not claim a JWT-expiry test exists. | The private route returns HTTP 401 `{ "error": "service_auth_required" }`; this exercises the contracts' `service_auth_missing` negative boundary without disclosing a bearer. Wrong and retired bearers have the same externally safe denial. | The aggregate MUST contain one 401 completion and `request_refused.reason_code=service_auth_required`, with no secret material. |
| Gate off mid-flight | Start a disposable request through the enabled tenant gate, then have the staging deployment/config operator apply the selected `NURTURE_*_ENABLED=false` gate-off and close the matching bff gate. Send a new request only after the revised staging workload is ready. | The current in-flight request may finish on its old revision; the contracts do not promise cancellation. Every post-cutover request MUST fail closed with HTTP 503 and the surface-specific error below. This is the implementation of the contracts' `disabled_gate` negative. | The post-cutover window MUST contain a 503 completion and the matching `request_refused.reason_code`; record elapsed incident-declaration-to-gate-off time and require under one minute. |

The surface-specific disabled errors are `parent_context_presenter_disabled`,
`parent_communication_owner_disabled`, `director_presenter_disabled`,
`teacher_class_stream_presenter_disabled`, `teacher_organization_owner_disabled`,
`teacher_communication_owner_disabled`, `teacher_assistant_query_owner_disabled`,
`teacher_media_association_owner_disabled`, and
`parent_communication_extension_disabled`. The exact error is intentionally
surface-specific; `service_unavailable` is not a substitute when the gate
code is available.

### Command duplicate and ambiguous-commit drills

Run these only for the selected command surface and only against disposable
facts. First complete the normal command. For the duplicate check, resubmit
the exact logical effect through the bff as the contract requires. For the
ambiguous-commit check, use the one-shot response drop described above after
the upstream command has been accepted, then retry **the same**
`command_request_id`; a new command is never recovery. A proxy drop creates
client-observed ambiguity and need not deliver an `outcome_unknown` payload.
It passes only when the exact replay converges to the recorded, non-duplicated
outcome. If the owner does return `outcome_unknown`, the stated reason/recovery
is mandatory.

| Command surface | Duplicate-submit convergence | Ambiguous-commit expectation |
| --- | --- | --- |
| W2 notice confirmation | A repeated consumed confirmation is `not_committed` with `confirmation_replayed`; this contract does not call that `already_satisfied`. | `outcome_unknown` uses `confirmation_outcome_unknown` and `reconcile_same_command`; retry only the original command. |
| W3 text send | Exact same-command replay returns the recorded committed message with `execution_disposition: replayed`, not a second message. | `outcome_unknown` has `send_outcome_unknown` and `reconcile_same_command`. |
| W7 organization | Use queue admission for the semantic duplicate: a completed result converges as committed `disposition: already_satisfied`; exact command replay is also non-mutating. | An `outcome_unknown` result must require exact same-command reconciliation; no new intent is valid recovery. |
| W8 communication | Use mark-read at the already-advanced cursor: committed `disposition: already_satisfied`; send/withdraw exact replays remain non-mutating. | An `outcome_unknown` result must require exact same-command reconciliation. |
| W10 assistant weekly draft | Submit a second command for the same class/week: committed `disposition: already_satisfied` with the same process reference. | An `outcome_unknown` result must require exact same-command reconciliation. |
| W9 media association | Repeat an already-applied association: committed `disposition: already_satisfied`; exact replay must not create a second association. | An `outcome_unknown` result must require exact same-command reconciliation. |
| W11 redaction | A new command after the disposable message is redacted converges as committed `disposition: already_satisfied`; an exact replay has `execution_disposition: replayed`. | `outcome_unknown` has `redact_outcome_unknown` and `reconcile_same_command`; never create a substitute command. |

The command-ledger outcome is not currently emitted by the provider's ramp
logs. The summarizer therefore cannot calculate the Wave 3
`already_satisfied` or reconcile rate; its absence is a rehearsal-prep gap,
not zero. Record the sanitized bff result/disposition alongside the aggregate
and do not infer command convergence from HTTP 200 alone. Each command drill
belongs in that surface's one log window: the aggregate must show its HTTP
completion and no unexpected `command_write_conflict` refusal, while the
manual bff record proves the disposition/recovery that the summarizer cannot
emit.

## 4. Evidence

Create one deliberate, non-overlapping provider-log window per surface: start
collecting immediately before its single gate opens, stop after fixture replay
and all applicable fault drills finish, then close the gate. This isolation is
required because current provider route classification is specific to W6;
other surface routes may aggregate as `unknown`. Do not claim that a shared
window proves per-surface metrics.

For each window, run the existing summarizer against only
scenario-service stdout. The following is the supported JSON evidence form;
replace the placeholder release identity and surface with recorded values.

```sh
node scripts/summarize-ramp-metrics.mjs --json scenario-service-ramp.log > ramp-metrics.<release-identity>.<surface>.json
```

The temporary input log MUST contain only the deliberate window and MUST be
discarded after the aggregate is validated; raw logs are not release evidence.
Archive the resulting aggregate with the release identity, surface/wave,
contract pin, staging tenant label, gate/allowlist state, window start/end,
and the sanitized manual comparison record. The aggregate must be reviewed
for its `input` count, refusal distribution, HTTP status distribution,
duration p50/p95/max, timeout signals, and any family-growth events. It must
not contain request IDs, bodies, outbox IDs, or bearer values.

Map every archived surface window to the unchecked G8 checklist line in
[gray-release-readiness-v1.md](../../dev-docs/active/nurture-cross-repo-contract-supply/artifacts/gray-release-readiness-v1.md):
"G8 rehearsal green, refusal codes matched to the contracts line by line."
The final G8 record is complete only when all in-scope surface aggregates and
manual remote-fixture comparisons are attached to the same release identity.

## 5. Abort criteria and rollback

Abort the current surface immediately if any prerequisite is false; a static
validator or adopted pin fails; the real response differs from the frozen
contract in status, required field, masking, reason code, or command
disposition; a required refusal is absent or unexpectedly different; a
duplicate creates another effect; an ambiguous command cannot reconcile with
the same command ID; the aggregate contains an unexplained error/unknown
input; a timeout signal is non-zero; or either service's gate cannot be
closed within one minute. For W11, any redaction outside the explicitly
disposable author-owned staging message is an immediate abort.

Rollback is gate off, not token rotation: first close the matching My-Chat
nurture-bff surface gate and remove the rehearsal tenant from its allowlist,
then deploy/apply the selected Nurture provider gate as `false` and verify the
surface-specific 503 disabled error. Keep other provider gates false. This is
the containment path in [token-runbook.md](token-runbook.md). Do not delete
or compensate committed ledger entries to make the rehearsal look clean;
exact replay must converge after reopening, and W11 redactions are
contractually irreversible. Preserve only the sanitized aggregate and
operator record, keep the gate off, and require a new explicit authorization
before another rehearsal attempt.
