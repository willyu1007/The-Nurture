import assert from "node:assert/strict";
import test from "node:test";
import {
  parseLogText,
  summarizeGrayW6,
} from "./summarize-gray-w6.mjs";

test("summarizes W6 provider and host logs without retaining identifiers", () => {
  const provider = [
    providerRefusal("request-a", "request_timeout"),
    providerCompletion(
      "request-a",
      "teacher_class_stream_class_context",
      503,
      42,
    ),
    providerCompletion(
      "request-b",
      "teacher_class_stream_schedule",
      200,
      8,
    ),
  ];
  const host = [
    hostCompletion("class_context_query", "unavailable", 44, "owner_timeout"),
    hostCompletion("class_stream_query", "unavailable", 45, "temporarily_unavailable"),
    hostCompletion("child_day_detail_query", "ready", 20),
    hostCompletion("child_detail_query", "ready", 24),
  ];

  const summary = summarizeGrayW6(provider, host);

  assert.equal(summary.provider.requests_total, 2);
  assert.deepEqual(summary.provider.reasons, { request_timeout: 1 });
  assert.equal(summary.provider.duration_ms_p95, 42);
  assert.equal(summary.host.owner_calls_total, 2);
  assert.equal(summary.host.composite_requests_total, 2);
  assert.equal(summary.host.owner_timeout_rate, 0.5);
  assert.deepEqual(summary.host.composite_outcomes, {
    ready: 1,
    unavailable: 1,
  });
  assert.deepEqual(summary.reconciliation, {
    mode: "not_applicable_read_only",
    commands_total: 0,
    reconciled_total: 0,
    mismatches_total: 0,
  });
  assert.doesNotMatch(JSON.stringify(summary), /request-a|request-b/);
});

test("accepts Docker Compose prefixes and reports ignored lines", () => {
  const parsed = parseLogText([
    `scenario-1 | ${JSON.stringify(providerCompletion(
      "request-a",
      "teacher_class_stream_child_strip",
      200,
      7,
    ))}`,
    "scenario-1 | ordinary startup text",
  ].join("\n"));

  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.ignoredLines, 1);
});

function providerCompletion(requestId, routeClass, statusCode, durationMs) {
  return {
    schema: "nurture_scenario_service_log_v1",
    event: "request_completed",
    request_id: requestId,
    method: "POST",
    route_class: routeClass,
    status_code: statusCode,
    duration_ms: durationMs,
  };
}

function providerRefusal(requestId, reasonCode) {
  return {
    schema: "nurture_scenario_service_log_v1",
    event: "request_refused",
    request_id: requestId,
    route_class: "teacher_class_stream_class_context",
    status_code: 503,
    reason_code: reasonCode,
  };
}

function hostCompletion(operation, outcome, durationMs, reasonCode) {
  return {
    schema: "my_chat_nurture_ramp_log_v1",
    event: "surface_request_completed",
    surface: "teacher_class_stream",
    operation,
    outcome,
    ...(reasonCode ? { reason_code: reasonCode } : {}),
    duration_ms: durationMs,
  };
}
