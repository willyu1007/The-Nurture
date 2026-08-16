import assert from "node:assert/strict";
import test from "node:test";
import {
  formatHumanSummary,
  main,
  parseLogText,
  summarizeRampMetrics,
} from "./summarize-ramp-metrics.mjs";

test("summarizes emitted provider fields and accounts for unparseable input", () => {
  const parsed = parseLogText([
    `scenario-service | ${JSON.stringify(requestCompleted("request-1", 200, 12))}`,
    JSON.stringify(requestRefused("request-1", "request_timeout")),
    JSON.stringify(requestCompleted("request-2", 408, 64)),
    JSON.stringify(requestRefused(
      "request-2",
      "teacher_class_stream_presenter_disabled",
    )),
    JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "family_growth_delivery_settled",
      eventId: "outbox-1",
      replayed: 1,
    }),
    JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "family_growth_delivery_receipt_conflict",
      eventId: "outbox-2",
      signalIncrement: 1,
    }),
    JSON.stringify(commandSettled("teacher_organization_owner", "executed")),
    JSON.stringify(commandSettled(
      "teacher_organization_owner",
      "already_satisfied",
    )),
    JSON.stringify(commandSettled("teacher_organization_owner", "reconciled")),
    JSON.stringify({
      ...commandSettled("teacher_communication_owner", "refused"),
      reason_code: "command_write_conflict",
    }),
    JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_production_assembly_refused",
      surface: "teacher_organization_owner",
      reason: "missing DATABASE_URL",
    }),
    JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_startup_failed",
      reason: "listen failed",
    }),
    '{"schema":"nurture_scenario_service_log_v1","event":"future_event"}',
    "ordinary startup text",
  ].join("\n") + "\n");

  const summary = summarizeRampMetrics(parsed.records, parsed.input);
  const surface = "teacher_class_stream_class_context";

  assert.deepEqual(parsed.input, {
    lines_total: 14,
    blank_lines: 0,
    non_json_lines: 1,
    unknown_lines: 1,
    recognized_records_total: 12,
  });
  assert.deepEqual(summary.refusals_by_surface[surface], {
    refusals_total: 2,
    reason_codes: {
      request_timeout: { count: 1, share: 0.5 },
      teacher_class_stream_presenter_disabled: { count: 1, share: 0.5 },
    },
  });
  assert.deepEqual(summary.request_latency_and_timeout.by_surface[surface], {
    request_completed_total: 2,
    duration_ms: { min: 12, p50: 12, p95: 64, max: 64 },
    timeout_signals: {
      request_timeout_refusals: 1,
      request_timeout_refusal_rate: 0.5,
      status_408_completions: 1,
    },
  });
  assert.deepEqual(summary.command_ledger_health, {
    command_settlements: {
      source: "scenario_command_settled.outcome",
      settlements_total: 4,
      outcomes: {
        executed: 1,
        already_satisfied: 1,
        reconciled: 1,
        refused: 1,
      },
      replay_hits: 1,
      reconcile_count: 1,
      reconcile_or_replay_rate: 0.5,
      by_surface: {
        teacher_communication_owner: {
          settlements_total: 1,
          outcomes: {
            executed: 0,
            already_satisfied: 0,
            reconciled: 0,
            refused: 1,
          },
          replay_hits: 0,
          reconcile_count: 0,
          reconcile_or_replay_rate: 0,
        },
        teacher_organization_owner: {
          settlements_total: 3,
          outcomes: {
            executed: 1,
            already_satisfied: 1,
            reconciled: 1,
            refused: 0,
          },
          replay_hits: 1,
          reconcile_count: 1,
          reconcile_or_replay_rate: 0.666667,
        },
      },
    },
    command_write_conflict_refusals: {
      source: "scenario_command_settled.reason_code",
      count: 1,
    },
    family_growth_delivery: {
      event_counts: {
        family_growth_delivery_receipt_conflict: 1,
        family_growth_delivery_settled: 1,
      },
      replayed_settlements: {
        source: "family_growth_delivery_settled.replayed",
        observed_records_total: 1,
        count: 1,
      },
    },
  });
  assert.deepEqual(summary.startup_and_assembly_refusals, {
    scenario_service_started_total: 0,
    startup_failures: {
      total: 1,
      reasons: { "listen failed": 1 },
    },
    production_assembly_refusals: {
      teacher_organization_owner: {
        total: 1,
        reasons: { "missing DATABASE_URL": 1 },
      },
    },
    unhandled_exceptions_by_surface: {},
  });
  assert.match(
    formatHumanSummary(summary),
    /reconcile\/replay rate: 50\.0%/,
  );
  assert.doesNotMatch(JSON.stringify(summary), /request-1|request-2|outbox-1|outbox-2/);
});

test("accepts a file argument and emits JSON without a fixture file", () => {
  const output = main(
    ["node", "scripts/summarize-ramp-metrics.mjs", "--json", "ramp.log"],
    (path, encoding) => {
      assert.equal(path, "ramp.log");
      assert.equal(encoding, "utf8");
      return JSON.stringify(requestCompleted("request-3", 200, 5));
    },
  );

  const summary = JSON.parse(output);
  assert.equal(
    summary.request_latency_and_timeout.by_surface
      .teacher_class_stream_class_context.duration_ms.p95,
    5,
  );
});

function requestCompleted(requestId, statusCode, durationMs) {
  return {
    schema: "nurture_scenario_service_log_v1",
    event: "request_completed",
    request_id: requestId,
    method: "POST",
    route_class: "teacher_class_stream_class_context",
    status_code: statusCode,
    duration_ms: durationMs,
  };
}

function requestRefused(requestId, reasonCode) {
  return {
    schema: "nurture_scenario_service_log_v1",
    event: "request_refused",
    request_id: requestId,
    route_class: "teacher_class_stream_class_context",
    status_code: reasonCode === "request_timeout" ? 408 : 503,
    reason_code: reasonCode,
  };
}

function commandSettled(surface, outcome) {
  return {
    schema: "nurture_scenario_service_log_v1",
    event: "scenario_command_settled",
    surface,
    outcome,
    duration_ms: 7,
  };
}
