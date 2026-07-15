export type NurtureWorkflowTelemetryLogger = {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
};

export type NurtureWorkflowMetricSink = {
  increment(name: string, labels: Record<string, string>, value?: number): void;
  observe(name: string, value: number, labels: Record<string, string>): void;
};

type NurtureWorkflowTelemetryClock = {
  nowMs?: () => number;
};

/** Activation wiring must expose at least one operational telemetry sink. */
export type NurtureInstitutionWorkflowTelemetry =
  | (NurtureWorkflowTelemetryClock & {
      logger: NurtureWorkflowTelemetryLogger;
      metrics?: NurtureWorkflowMetricSink;
    })
  | (NurtureWorkflowTelemetryClock & {
      logger?: NurtureWorkflowTelemetryLogger;
      metrics: NurtureWorkflowMetricSink;
    });

export type NurtureCommandTelemetryOutcome =
  | "completed"
  | "replayed"
  | "retry_requested"
  | "manual_review_required"
  | "failed";

export function emitNurtureCommandTelemetry(input: {
  commandKey: "nurture.family_care.capture_and_route";
  outcome: NurtureCommandTelemetryOutcome;
  contextRefCount: number;
  llmCallCount: number;
  cacheHitCount: number;
  startedAtMs: number;
  finishedAtMs: number;
  errorClass?: string;
  telemetry?: NurtureInstitutionWorkflowTelemetry;
}): void {
  const durationMs = Math.max(0, input.finishedAtMs - input.startedAtMs);
  const labels = {
    command_key: input.commandKey,
    outcome: input.outcome,
  };
  input.telemetry?.metrics?.observe(
    "nurture_command_duration_ms",
    durationMs,
    labels,
  );
  input.telemetry?.metrics?.observe(
    "nurture_command_context_ref_count",
    input.contextRefCount,
    labels,
  );
  input.telemetry?.metrics?.increment(
    "nurture_command_llm_calls_total",
    labels,
    input.llmCallCount,
  );
  input.telemetry?.metrics?.increment(
    "nurture_command_cache_hits_total",
    labels,
    input.cacheHitCount,
  );
  if (input.outcome === "replayed") {
    input.telemetry?.metrics?.increment(
      "nurture_command_replay_total",
      labels,
    );
  }

  const context = {
    component: "nurture_command",
    command_key: input.commandKey,
    outcome: input.outcome,
    duration_ms: durationMs,
    context_ref_count: input.contextRefCount,
    llm_call_count: input.llmCallCount,
    cache_hit_count: input.cacheHitCount,
    error_class: input.errorClass,
  };
  if (input.outcome === "failed") {
    input.telemetry?.logger?.error("Nurture command failed.", context);
  } else if (
    input.outcome === "retry_requested" ||
    input.outcome === "manual_review_required"
  ) {
    input.telemetry?.logger?.warn("Nurture command did not complete.", context);
  } else {
    input.telemetry?.logger?.info("Nurture command completed.", context);
  }
}
