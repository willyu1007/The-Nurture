#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOG_SCHEMA = "nurture_scenario_service_log_v1";
const FAMILY_GROWTH_EVENTS = new Set([
  "family_growth_delivery_settled",
  "family_growth_delivery_retry",
  "family_growth_delivery_attention",
  "family_growth_delivery_receipt_conflict",
  "family_growth_delivery_tick_failed",
]);

/**
 * Accepts JSONL and the uncolored `service | { ... }` form produced by Compose.
 * Unknown and malformed lines stay accounted for rather than stopping a ramp read.
 */
export function parseLogText(text) {
  const records = [];
  const input = {
    lines_total: 0,
    blank_lines: 0,
    non_json_lines: 0,
    unknown_lines: 0,
  };

  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "" && text.endsWith("\n")) lines.pop();

  for (const rawLine of lines) {
    input.lines_total += 1;
    const line = rawLine.trim();
    if (!line) {
      input.blank_lines += 1;
      continue;
    }

    const jsonStart = line.indexOf("{");
    if (jsonStart < 0) {
      input.non_json_lines += 1;
      continue;
    }

    let value;
    try {
      value = JSON.parse(line.slice(jsonStart));
    } catch {
      input.non_json_lines += 1;
      continue;
    }

    if (isRecognizedRecord(value)) {
      records.push(value);
    } else {
      input.unknown_lines += 1;
    }
  }

  return {
    records,
    input: {
      ...input,
      recognized_records_total: records.length,
    },
  };
}

export function summarizeRampMetrics(records, input = undefined) {
  const refusalReasonsBySurface = new Map();
  const durationsBySurface = new Map();
  const timeoutRefusalsBySurface = new Map();
  const status408BySurface = new Map();
  const observedEvents = new Map();
  const assemblyReasonsBySurface = new Map();
  const startupFailureReasons = new Map();
  const unhandledExceptionsBySurface = new Map();
  const familyGrowthEventCounts = new Map();
  const commandSettlementOutcomes = new Map();
  const commandSettlementOutcomesBySurface = new Map();
  let serviceStartedTotal = 0;
  let replayedSettlementsTotal = 0;
  let replayedFieldRecordsTotal = 0;
  let writeConflictRefusalsTotal = 0;

  for (const record of records) {
    increment(observedEvents, record.event);

    switch (record.event) {
      case "request_completed": {
        append(durationsBySurface, record.route_class, record.duration_ms);
        if (record.status_code === 408) increment(status408BySurface, record.route_class);
        break;
      }
      case "request_refused": {
        incrementNested(refusalReasonsBySurface, record.route_class, record.reason_code);
        if (record.reason_code === "request_timeout") {
          increment(timeoutRefusalsBySurface, record.route_class);
        }
        break;
      }
      case "scenario_command_settled": {
        increment(commandSettlementOutcomes, record.outcome);
        incrementNested(
          commandSettlementOutcomesBySurface,
          record.surface,
          record.outcome,
        );
        if (
          record.outcome === "refused"
          && record.reason_code === "command_write_conflict"
        ) {
          writeConflictRefusalsTotal += 1;
        }
        break;
      }
      case "unhandled_exception":
        increment(unhandledExceptionsBySurface, record.route_class);
        break;
      case "scenario_service_started":
        serviceStartedTotal += 1;
        break;
      case "scenario_service_startup_failed":
        increment(startupFailureReasons, record.reason);
        break;
      case "scenario_service_production_assembly_refused":
        incrementNested(assemblyReasonsBySurface, record.surface, record.reason);
        break;
      case "family_growth_delivery_settled":
        increment(familyGrowthEventCounts, record.event);
        if (typeof record.replayed === "number") {
          replayedFieldRecordsTotal += 1;
          if (record.replayed === 1) replayedSettlementsTotal += 1;
        }
        break;
      default:
        if (FAMILY_GROWTH_EVENTS.has(record.event)) {
          increment(familyGrowthEventCounts, record.event);
        }
    }
  }

  const surfaces = new Set([
    ...refusalReasonsBySurface.keys(),
    ...durationsBySurface.keys(),
    ...timeoutRefusalsBySurface.keys(),
    ...status408BySurface.keys(),
  ]);

  return {
    schema: "nurture_ramp_metrics_summary_v1",
    input: input ?? {
      lines_total: records.length,
      blank_lines: 0,
      non_json_lines: 0,
      unknown_lines: 0,
      recognized_records_total: records.length,
    },
    observed_events: sortedCountObject(observedEvents),
    refusals_by_surface: Object.fromEntries(
      [...surfaces].sort().map((surface) => {
        const reasons = refusalReasonsBySurface.get(surface) ?? new Map();
        const refusalsTotal = sumCounts(reasons);
        return [surface, {
          refusals_total: refusalsTotal,
          reason_codes: Object.fromEntries(
            [...reasons.entries()]
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([reasonCode, count]) => [reasonCode, {
                count,
                share: rate(count, refusalsTotal),
              }]),
          ),
        }];
      }),
    ),
    request_latency_and_timeout: {
      latency_source: "request_completed.duration_ms",
      precision: "integer milliseconds measured until the HTTP response finishes; p50 and p95 use nearest-rank percentiles",
      timeout_rate_definition: "request_refused.reason_code=request_timeout divided by request_completed for the same route_class",
      by_surface: Object.fromEntries(
        [...surfaces].sort().map((surface) => {
          const durations = durationsBySurface.get(surface) ?? [];
          const completionsTotal = durations.length;
          const timeoutRefusals = timeoutRefusalsBySurface.get(surface) ?? 0;
          return [surface, {
            request_completed_total: completionsTotal,
            duration_ms: summarizeDurations(durations),
            timeout_signals: {
              request_timeout_refusals: timeoutRefusals,
              request_timeout_refusal_rate: rate(timeoutRefusals, completionsTotal),
              status_408_completions: status408BySurface.get(surface) ?? 0,
            },
          }];
        }),
      ),
    },
    command_ledger_health: {
      command_settlements: {
        source: "scenario_command_settled.outcome",
        ...summarizeCommandSettlements(commandSettlementOutcomes),
        by_surface: Object.fromEntries(
          [...commandSettlementOutcomesBySurface.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([surface, outcomes]) => [
              surface,
              summarizeCommandSettlements(outcomes),
            ]),
        ),
      },
      command_write_conflict_refusals: {
        source: "scenario_command_settled.reason_code",
        count: writeConflictRefusalsTotal,
      },
      family_growth_delivery: {
        event_counts: sortedCountObject(familyGrowthEventCounts),
        replayed_settlements: {
          source: "family_growth_delivery_settled.replayed",
          observed_records_total: replayedFieldRecordsTotal,
          count: replayedFieldRecordsTotal === 0 ? null : replayedSettlementsTotal,
        },
      },
    },
    startup_and_assembly_refusals: {
      scenario_service_started_total: serviceStartedTotal,
      startup_failures: {
        total: sumCounts(startupFailureReasons),
        reasons: sortedCountObject(startupFailureReasons),
      },
      production_assembly_refusals: Object.fromEntries(
        [...assemblyReasonsBySurface.keys()].sort().map((surface) => {
          const reasons = assemblyReasonsBySurface.get(surface);
          return [surface, {
            total: sumCounts(reasons),
            reasons: sortedCountObject(reasons),
          }];
        }),
      ),
      unhandled_exceptions_by_surface: sortedCountObject(unhandledExceptionsBySurface),
    },
  };
}

export function formatHumanSummary(summary) {
  const lines = [
    "Nurture ramp metrics",
    `Input: ${summary.input.recognized_records_total} recognized structured record(s); ${summary.input.unknown_lines} unknown JSON line(s); ${summary.input.non_json_lines} non-JSON line(s); ${summary.input.blank_lines} blank line(s).`,
    `Latency source: ${summary.request_latency_and_timeout.latency_source}; ${summary.request_latency_and_timeout.precision}.`,
  ];

  lines.push("", "Refusal reason-code distribution");
  const refusalRows = Object.entries(summary.refusals_by_surface).flatMap(
    ([surface, values]) => {
      const reasons = Object.entries(values.reason_codes);
      if (reasons.length === 0) return [[surface, 0, "(none)", 0, "n/a"]];
      return reasons.map(([reasonCode, metrics]) => [
        surface,
        values.refusals_total,
        reasonCode,
        metrics.count,
        formatShare(metrics.share),
      ]);
    },
  );
  lines.push(renderTable(
    ["surface", "refusals", "reason code", "count", "share"],
    refusalRows.length === 0 ? [["(none)", 0, "", 0, "n/a"]] : refusalRows,
  ));

  lines.push("", "Request latency and timeout signals");
  const latencyRows = Object.entries(
    summary.request_latency_and_timeout.by_surface,
  ).map(([surface, metrics]) => [
    surface,
    metrics.request_completed_total,
    formatDuration(metrics.duration_ms.p50),
    formatDuration(metrics.duration_ms.p95),
    formatDuration(metrics.duration_ms.max),
    metrics.timeout_signals.request_timeout_refusals,
    formatShare(metrics.timeout_signals.request_timeout_refusal_rate),
    metrics.timeout_signals.status_408_completions,
  ]);
  lines.push(renderTable(
    ["surface", "completed", "p50 ms", "p95 ms", "max ms", "timeout refusals", "timeout rate", "408 completions"],
    latencyRows.length === 0
      ? [["(no request_completed duration records)", 0, "n/a", "n/a", "n/a", 0, "n/a", 0]]
      : latencyRows,
  ));
  lines.push(`Timeout rate: ${summary.request_latency_and_timeout.timeout_rate_definition}.`);

  const ledger = summary.command_ledger_health;
  lines.push("", "Command-ledger and delivery health");
  const settlements = ledger.command_settlements;
  lines.push(
    `Command settlements: ${settlements.settlements_total}; replay/already-satisfied: ${settlements.replay_hits}; reconciliation signals: ${settlements.reconcile_count}; reconcile/replay rate: ${formatShare(settlements.reconcile_or_replay_rate)}.`,
    `Command write-conflict refusals: ${ledger.command_write_conflict_refusals.count} (${ledger.command_write_conflict_refusals.source}).`,
  );
  const commandRows = Object.entries(settlements.by_surface)
    .map(([surface, metrics]) => [
      surface,
      metrics.settlements_total,
      metrics.replay_hits,
      metrics.reconcile_count,
      metrics.outcomes.refused,
      formatShare(metrics.reconcile_or_replay_rate),
    ]);
  lines.push(renderTable(
    ["command surface", "settlements", "replay/already", "reconcile", "refused", "reconcile/replay rate"],
    commandRows.length === 0
      ? [["(none)", 0, 0, 0, 0, "n/a"]]
      : commandRows,
  ));
  const familyGrowthRows = Object.entries(ledger.family_growth_delivery.event_counts)
    .map(([event, count]) => [event, count]);
  lines.push(renderTable(
    ["family-growth delivery event", "count"],
    familyGrowthRows.length === 0 ? [["(none)", 0]] : familyGrowthRows,
  ));
  const replayed = ledger.family_growth_delivery.replayed_settlements;
  lines.push(
    `Family-growth replayed settlements: ${formatNullableCount(replayed.count)} of ${replayed.observed_records_total} observed ${replayed.source} field(s).`,
  );

  const startup = summary.startup_and_assembly_refusals;
  lines.push("", "Startup and production-assembly refusals");
  lines.push(
    `Service-started events: ${startup.scenario_service_started_total}; startup-failed events: ${startup.startup_failures.total}.`,
  );
  const startupRows = Object.entries(startup.startup_failures.reasons)
    .map(([reason, count]) => ["startup_failed", reason, count]);
  const assemblyRows = Object.entries(startup.production_assembly_refusals)
    .flatMap(([surface, values]) => Object.entries(values.reasons)
      .map(([reason, count]) => [surface, reason, count]));
  lines.push(renderTable(
    ["surface", "reason", "count"],
    [...startupRows, ...assemblyRows].length === 0
      ? [["(none)", "", 0]]
      : [...startupRows, ...assemblyRows],
  ));

  return `${lines.join("\n")}\n`;
}

function isRecognizedRecord(value) {
  if (!isRecord(value) || value.schema !== LOG_SCHEMA || typeof value.event !== "string") {
    return false;
  }

  switch (value.event) {
    case "request_completed":
      return hasString(value, "request_id")
        && hasString(value, "method")
        && hasString(value, "route_class")
        && hasNumber(value, "status_code")
        && hasNumber(value, "duration_ms");
    case "request_refused":
      return hasString(value, "request_id")
        && hasString(value, "route_class")
        && hasNumber(value, "status_code")
        && hasString(value, "reason_code");
    case "unhandled_exception":
      return hasString(value, "request_id") && hasString(value, "route_class");
    case "scenario_service_started":
      return hasString(value, "app_env")
        && hasString(value, "service_name")
        && hasNumber(value, "port");
    case "scenario_service_startup_failed":
      return hasString(value, "reason");
    case "scenario_service_production_assembly_refused":
      return hasString(value, "surface") && hasString(value, "reason");
    case "scenario_command_settled":
      return hasString(value, "surface")
        && hasNumber(value, "duration_ms")
        && ["executed", "already_satisfied", "reconciled", "refused"].includes(
          value.outcome,
        )
        && (value.outcome !== "refused" || hasString(value, "reason_code"));
    default:
      return FAMILY_GROWTH_EVENTS.has(value.event);
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasString(record, key) {
  return typeof record[key] === "string";
}

function hasNumber(record, key) {
  return typeof record[key] === "number" && Number.isFinite(record[key]);
}

function increment(counts, key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function append(values, key, value) {
  const current = values.get(key);
  if (current) {
    current.push(value);
  } else {
    values.set(key, [value]);
  }
}

function incrementNested(counts, outerKey, innerKey) {
  const nested = counts.get(outerKey) ?? new Map();
  increment(nested, innerKey);
  counts.set(outerKey, nested);
}

function sumCounts(counts) {
  return [...counts.values()].reduce((total, count) => total + count, 0);
}

function sortedCountObject(counts) {
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) =>
    String(left).localeCompare(String(right))));
}

function summarizeDurations(durations) {
  if (durations.length === 0) {
    return { min: null, p50: null, p95: null, max: null };
  }
  const sorted = [...durations].sort((left, right) => left - right);
  return {
    min: sorted[0],
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted.at(-1),
  };
}

function summarizeCommandSettlements(outcomes) {
  const executed = outcomes.get("executed") ?? 0;
  const replayHits = outcomes.get("already_satisfied") ?? 0;
  const reconcileCount = outcomes.get("reconciled") ?? 0;
  const refused = outcomes.get("refused") ?? 0;
  const settlementsTotal = executed + replayHits + reconcileCount + refused;
  return {
    settlements_total: settlementsTotal,
    outcomes: {
      executed,
      already_satisfied: replayHits,
      reconciled: reconcileCount,
      refused,
    },
    replay_hits: replayHits,
    reconcile_count: reconcileCount,
    reconcile_or_replay_rate: rate(
      replayHits + reconcileCount,
      settlementsTotal,
    ),
  };
}

function percentile(sortedValues, quantile) {
  return sortedValues[Math.max(0, Math.ceil(sortedValues.length * quantile) - 1)] ?? null;
}

function rate(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
}

function formatShare(value) {
  return value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function formatDuration(value) {
  return value === null ? "n/a" : String(value);
}

function formatNullableCount(value) {
  return value === null ? "not observed" : String(value);
}

function renderTable(headers, rows) {
  const normalizedRows = rows.map((row) => row.map(formatCell));
  const normalizedHeaders = headers.map(formatCell);
  const widths = normalizedHeaders.map((header, index) => Math.max(
    header.length,
    ...normalizedRows.map((row) => row[index].length),
  ));
  const renderRow = (row) => row.map((cell, index) =>
    cell.padEnd(widths[index])).join("  ");
  return [
    renderRow(normalizedHeaders),
    widths.map((width) => "-".repeat(width)).join("  "),
    ...normalizedRows.map(renderRow),
  ].join("\n");
}

function formatCell(value) {
  return String(value).replaceAll(/[\r\n|]/g, " ");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/summarize-ramp-metrics.mjs [--json] [log-file]",
    "",
    "Read nurture_scenario_service_log_v1 JSONL from log-file or stdin.",
    "Compose-prefixed JSON lines are accepted. Unknown and non-JSON lines are reported.",
  ].join("\n");
}

export function parseArgs(argv) {
  let json = false;
  let inputPath;
  for (const argument of argv.slice(2)) {
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument.startsWith("-") || inputPath !== undefined) {
      throw new Error(usage());
    }
    inputPath = argument;
  }
  return { json, inputPath };
}

export function main(argv = process.argv, readFile = readFileSync) {
  const { json, inputPath } = parseArgs(argv);
  const text = inputPath === undefined || inputPath === "-"
    ? readFile(0, "utf8")
    : readFile(inputPath, "utf8");
  const parsed = parseLogText(text);
  const summary = summarizeRampMetrics(parsed.records, parsed.input);
  return json ? `${JSON.stringify(summary, null, 2)}\n` : formatHumanSummary(summary);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(main());
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
