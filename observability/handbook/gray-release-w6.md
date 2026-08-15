# W6 gray-release observability

## Decision

W6 uses bounded JSON logs plus an offline aggregate during restricted staging. It does not introduce a metrics server, tracing backend or high-cardinality labels. The registered metric names describe the aggregate contract that a later collector may export.

## Log sources

The provider emits `nurture_scenario_service_log_v1`:

- `request_completed` supplies a W6 route class, status and duration;
- `request_refused` supplies the same request correlation plus a safe reason code;
- raw URLs, bearer values, bodies, My-Chat user IDs, organization IDs, class IDs and child IDs are excluded.

The host emits `my_chat_nurture_ramp_log_v1/surface_request_completed`:

- one event per owner call with operation, outcome, safe reason and duration;
- one `class_stream_query` or `child_detail_query` event for the relevant
  composite BFF outcome;
- `owner_timeout` distinguishes the configured transport deadline from other temporary failures.

## G7 aggregate

Run `node scripts/summarize-gray-w6.mjs --provider <provider.log> --host <host.log>` against JSONL or uncolored Compose logs. The output includes:

- request and outcome counts by bounded operation;
- refusal/failure reason distribution;
- p95 duration;
- exact owner timeout rate;
- composite outcome distribution;
- command reconciliation fixed to `not_applicable_read_only` with zero commands.

Do not retain or attach raw container logs as release evidence. Keep only the aggregate and the immutable release identity. An ignored-line count above the expected non-JSON startup chatter requires inspection before accepting the sample.

## Initial staging gate

For the three class-stream plus three child-detail request pairs:

- provider failed outcomes: `0`;
- host failed outcomes: `0`;
- owner timeout rate: `0`;
- composite ready results: at least `6`;
- p95 owner/composite duration: below the configured `5000 ms` deadline;
- reconciliation: `not_applicable_read_only`, all counts `0`.

These values are release checks for the initial canary, not a production SLO. Adopt a tighter latency threshold only after representative staging samples exist.

## Containment

Set the W6 provider and consumer gate to false through the human-run staging Compose procedure. The one-minute containment clock starts at incident declaration and ends when the canary API returns the disabled/unavailable boundary. Keep database state intact; W6 is read-only and gate-off is safer than migration rollback.

Escalate immediately for secret material in logs, an enabled non-W6 surface, any command/reconciliation event attributed to W6, persistent provider 5xx outcomes, or a gate-off duration above one minute.
