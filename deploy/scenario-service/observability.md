# Scenario-service ramp observability

The Nurture provider can produce a bounded ramp-window aggregate without a metrics service. The aggregate reports provider refusal-code distribution, HTTP response duration, timeout signals, family-growth delivery replay evidence, and startup or assembly refusals. Save the aggregate with the immutable release identity; do not retain raw logs as release evidence.

## Collect and summarize one window

Collect only scenario-service stdout from a deliberate window after the selected My-Chat surface gate opens. Preserve line order and avoid merged output from unrelated workloads. Compose output and raw JSONL both work because the summarizer accepts a text prefix before the JSON object.

```sh
node scripts/summarize-ramp-metrics.mjs scenario-service-ramp.log
node scripts/summarize-ramp-metrics.mjs --json scenario-service-ramp.log > ramp-metrics.json
kubectl logs deploy/scenario-service --since=15m | node scripts/summarize-ramp-metrics.mjs
```

The first command prints a compact human table. `--json` produces the release-evidence aggregate. Unknown JSON and non-JSON lines remain counted in `input`; investigate unexpected counts before accepting the window. The command never prints request IDs, outbox IDs, request bodies, or bearer values.

`request_completed.duration_ms` is the provider’s only latency field. The request middleware rounds the elapsed time through HTTP response finish to integer milliseconds; the summary uses nearest-rank p50 and p95. `request_timeout` refusal rate is `request_refused.reason_code=request_timeout / request_completed` for each `route_class`. The table also keeps HTTP 408 completions separate, so an incomplete window cannot silently turn a missing refusal record into a zero timeout rate.

## Gate reading by wave

| Gate metric | Provider aggregate | Wave checklist reading |
| --- | --- | --- |
| Reason-code distribution | `refusals_by_surface` reports each `request_refused.reason_code` count and share within the surface’s refusals. | Every refusal must match the adopted surface contract. A new, unsafe, or unexpectedly concentrated reason code blocks the next allowlist or percentage step. |
| Reconcile/replay rate | `family_growth_delivery_settled.replayed` counts receipt replays when the worker emitted that field; receipt-conflict, retry, attention, and tick-failed events remain visible. `request_refused.reason_code=command_write_conflict` is counted when present. | Wave 3 requires command-ledger reconcile rate, `already_satisfied` replay hits, and `command_write_conflict` count. The current provider logs do **not** emit command-ledger `already_satisfied` or `reconcile_same_command` outcomes, so a command-ledger reconcile/replay rate is not derivable yet. Treat that as a rehearsal-prep gap, not as zero. |
| Timeout rate | Per route class, the summary reports `request_timeout` refusals divided by completed requests, HTTP 408 count, and duration p50/p95/max. | Wave 1’s initial canary target is zero timeout signals and p95 below the configured deadline. A non-zero rate or rising tail latency holds the wave while the request path and gate state are checked. |

The maintained gray-release checklist defines the wave order and the Wave 3 command metrics in [the gray-release readiness assessment](../../dev-docs/active/nurture-cross-repo-contract-supply/artifacts/gray-release-readiness-v1.md). Use that checklist for go/no-go; the summarizer supplies evidence rather than a rollout decision.

My-Chat already emits structured `surfaceRequestCompleted` telemetry from the nurture-bff ramp plane. Later rehearsal work can join those consumer events to this provider aggregate by surface and observation window, giving both halves of each gate metric without changing this script.

## Verify the tool

Run the focused parser and aggregation test before using a changed copy of the tool:

```sh
node --test scripts/summarize-ramp-metrics.test.mjs
node .ai/scripts/lint-docs.mjs
```

The test uses inline synthetic JSONL, including Compose-prefixed, unknown, and non-JSON lines. Documentation lint must complete without errors.
