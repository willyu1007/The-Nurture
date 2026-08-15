#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const providerOperations = new Map([
  ["teacher_class_stream_class_context", "class_context_query"],
  ["teacher_class_stream_child_strip", "child_strip_query"],
  ["teacher_class_stream_child_day_detail", "child_day_detail_query"],
  ["teacher_class_stream_schedule", "schedule_query"],
]);

export function summarizeGrayW6(providerRecords, hostRecords) {
  const refusals = new Map(
    providerRecords
      .filter(isProviderRefusal)
      .map((record) => [record.request_id, record]),
  );
  const providerSamples = providerRecords
    .filter(isProviderCompletion)
    .flatMap((record) => {
      const operation = providerOperations.get(record.route_class);
      if (!operation) return [];
      const refusal = refusals.get(record.request_id);
      return [{
        operation,
        outcome: providerOutcome(record.status_code),
        reasonCode: refusal?.reason_code ?? "none",
        durationMs: record.duration_ms,
      }];
    });
  const hostSamples = hostRecords
    .filter(isHostSample)
    .map((record) => ({
      operation: record.operation,
      outcome: record.outcome,
      reasonCode: record.reason_code ?? "none",
      durationMs: record.duration_ms,
    }));
  const ownerSamples = hostSamples.filter(
    (sample) => sample.operation !== "class_stream_query",
  );
  const compositeSamples = hostSamples.filter(
    (sample) => sample.operation === "class_stream_query",
  );

  return {
    schema: "nurture_gray_w6_summary_v1",
    surface: "teacher_class_stream",
    provider: summarizeSamples(providerSamples),
    host: {
      ...summarizeSamples(hostSamples),
      owner_calls_total: ownerSamples.length,
      composite_requests_total: compositeSamples.length,
      owner_timeout_rate: rate(
        ownerSamples.filter((sample) => sample.reasonCode === "owner_timeout").length,
        ownerSamples.length,
      ),
      composite_outcomes: countBy(compositeSamples, (sample) => sample.outcome),
    },
    reconciliation: {
      mode: "not_applicable_read_only",
      commands_total: 0,
      reconciled_total: 0,
      mismatches_total: 0,
    },
  };
}

export function parseLogText(text) {
  const records = [];
  let ignoredLines = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const jsonStart = line.indexOf("{");
    if (jsonStart < 0) {
      ignoredLines += 1;
      continue;
    }
    try {
      const value = JSON.parse(line.slice(jsonStart));
      if (isRecord(value)) records.push(value);
      else ignoredLines += 1;
    } catch {
      ignoredLines += 1;
    }
  }
  return { records, ignoredLines };
}

function summarizeSamples(samples) {
  return {
    requests_total: samples.length,
    outcomes: countBy(samples, (sample) => sample.outcome),
    reasons: countBy(
      samples.filter((sample) => sample.reasonCode !== "none"),
      (sample) => sample.reasonCode,
    ),
    duration_ms_p95: percentile(samples.map((sample) => sample.durationMs), 0.95),
    by_operation: Object.fromEntries(
      [...new Set(samples.map((sample) => sample.operation))]
        .sort()
        .map((operation) => {
          const selected = samples.filter((sample) => sample.operation === operation);
          return [operation, {
            requests_total: selected.length,
            outcomes: countBy(selected, (sample) => sample.outcome),
            reasons: countBy(
              selected.filter((sample) => sample.reasonCode !== "none"),
              (sample) => sample.reasonCode,
            ),
            duration_ms_p95: percentile(
              selected.map((sample) => sample.durationMs),
              0.95,
            ),
          }];
        }),
    ),
  };
}

function countBy(values, keyOf) {
  const counts = new Map();
  for (const value of values) {
    const key = keyOf(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) =>
    left.localeCompare(right)));
}

function percentile(values, quantile) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? null;
}

function rate(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
}

function providerOutcome(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return "ready";
  if (statusCode < 500) return "refused";
  return "failed";
}

function isProviderCompletion(value) {
  return isRecord(value)
    && value.schema === "nurture_scenario_service_log_v1"
    && value.event === "request_completed"
    && typeof value.request_id === "string"
    && typeof value.route_class === "string"
    && typeof value.status_code === "number"
    && typeof value.duration_ms === "number";
}

function isProviderRefusal(value) {
  return isRecord(value)
    && value.schema === "nurture_scenario_service_log_v1"
    && value.event === "request_refused"
    && typeof value.request_id === "string"
    && typeof value.reason_code === "string";
}

function isHostSample(value) {
  return isRecord(value)
    && value.schema === "my_chat_nurture_ramp_log_v1"
    && value.event === "surface_request_completed"
    && value.surface === "teacher_class_stream"
    && typeof value.operation === "string"
    && typeof value.outcome === "string"
    && typeof value.duration_ms === "number"
    && (value.reason_code === undefined || typeof value.reason_code === "string");
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function usage() {
  return [
    "Usage:",
    "  node scripts/summarize-gray-w6.mjs --provider <provider.log> --host <host.log>",
    "",
    "The inputs may be JSONL or uncolored Docker Compose logs. Output contains", 
    "aggregate counts and latency only; identifiers and request bodies are omitted.",
  ].join("\n");
}

function parseArgs(argv) {
  const paths = {};
  for (let index = 2; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if ((flag !== "--provider" && flag !== "--host") || !value) {
      throw new Error(usage());
    }
    paths[flag.slice(2)] = value;
  }
  if (!paths.provider || !paths.host) throw new Error(usage());
  return paths;
}

function main() {
  const paths = parseArgs(process.argv);
  const provider = parseLogText(readFileSync(paths.provider, "utf8"));
  const host = parseLogText(readFileSync(paths.host, "utf8"));
  const summary = summarizeGrayW6(provider.records, host.records);
  process.stdout.write(`${JSON.stringify({
    ...summary,
    input: {
      provider_records: provider.records.length,
      provider_ignored_lines: provider.ignoredLines,
      host_records: host.records.length,
      host_ignored_lines: host.ignoredLines,
    },
  }, null, 2)}\n`);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
