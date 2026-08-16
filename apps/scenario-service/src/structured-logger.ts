export type ScenarioRouteClass =
  | "health"
  | "binding_owner"
  | "teacher_class_stream_class_context"
  | "teacher_class_stream_child_strip"
  | "teacher_class_stream_child_day_detail"
  | "teacher_class_stream_schedule"
  | "unknown";
export type ScenarioHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "UNKNOWN";

export type ScenarioCommandSurface =
  | "harness"
  | "teacher_release_owner"
  | "parent_context_presenter"
  | "parent_communication_owner"
  | "parent_communication_extension"
  | "teacher_organization_owner"
  | "teacher_communication_owner"
  | "teacher_media_association_owner"
  | "teacher_assistant_query_owner";

export type ScenarioCommandSettlementOutcome =
  | "executed"
  | "already_satisfied"
  | "reconciled"
  | "refused";

export type ScenarioStructuredLogRecord =
  | Readonly<{
      schema: "nurture_scenario_service_log_v1";
      event: "request_completed";
      request_id: string;
      method: ScenarioHttpMethod;
      route_class: ScenarioRouteClass;
      status_code: number;
      duration_ms: number;
    }>
  | Readonly<{
      schema: "nurture_scenario_service_log_v1";
      event: "unhandled_exception";
      request_id: string;
      route_class: ScenarioRouteClass;
    }>
  | Readonly<{
      schema: "nurture_scenario_service_log_v1";
      event: "request_refused";
      request_id: string;
      route_class: ScenarioRouteClass;
      status_code: number;
      reason_code: string;
    }>
  | Readonly<{
      schema: "nurture_scenario_service_log_v1";
      event: "scenario_service_started";
      app_env: string;
      service_name: string;
      port: number;
    }>
  | Readonly<{
      schema: "nurture_scenario_service_log_v1";
      event: "scenario_service_production_assembly_refused";
      surface: string;
      reason: string;
    }>
  | Readonly<
      {
        schema: "nurture_scenario_service_log_v1";
        event: "scenario_command_settled";
        surface: ScenarioCommandSurface;
        duration_ms: number;
      } & (
        | {
            outcome: Exclude<ScenarioCommandSettlementOutcome, "refused">;
          }
        | {
            outcome: "refused";
            reason_code: string;
          }
      )
    >
  | Readonly<
      {
        schema: "nurture_scenario_service_log_v1";
        event:
          | "family_growth_delivery_settled"
          | "family_growth_delivery_retry"
          | "family_growth_delivery_attention"
          | "family_growth_delivery_receipt_conflict"
          | "family_growth_delivery_tick_failed";
      } & Record<string, string | number>
    >;

export type ScenarioStructuredLogSink = (
  record: ScenarioStructuredLogRecord,
) => void;

const stdoutSink: ScenarioStructuredLogSink = (record) => {
  process.stdout.write(`${JSON.stringify(record)}\n`);
};

export class ScenarioStructuredLogger {
  constructor(private readonly sink: ScenarioStructuredLogSink = stdoutSink) {}

  requestCompleted(input: {
    requestId: string;
    method: ScenarioHttpMethod;
    routeClass: ScenarioRouteClass;
    statusCode: number;
    durationMs: number;
  }): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event: "request_completed",
      request_id: input.requestId,
      method: input.method,
      route_class: input.routeClass,
      status_code: input.statusCode,
      duration_ms: input.durationMs,
    });
  }

  unhandledException(input: {
    requestId: string;
    routeClass: ScenarioRouteClass;
  }): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event: "unhandled_exception",
      request_id: input.requestId,
      route_class: input.routeClass,
    });
  }

  requestRefused(input: {
    requestId: string;
    routeClass: ScenarioRouteClass;
    statusCode: number;
    reasonCode: string;
  }): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event: "request_refused",
      request_id: input.requestId,
      route_class: input.routeClass,
      status_code: input.statusCode,
      reason_code: input.reasonCode,
    });
  }

  scenarioCommandSettled(
    input: {
      surface: ScenarioCommandSurface;
      durationMs: number;
    } & (
      | {
          outcome: Exclude<ScenarioCommandSettlementOutcome, "refused">;
        }
      | {
          outcome: "refused";
          reasonCode: string;
        }
    ),
  ): void {
    const common = {
      schema: "nurture_scenario_service_log_v1" as const,
      event: "scenario_command_settled" as const,
      surface: input.surface,
      duration_ms: input.durationMs,
    };
    this.sink(
      input.outcome === "refused"
        ? {
            ...common,
            outcome: input.outcome,
            reason_code: input.reasonCode,
          }
        : {
            ...common,
            outcome: input.outcome,
          },
    );
  }

  /** T-009 I3b delivery-worker events; fields carry ids and counts only. */
  familyGrowthDelivery(
    event:
      | "family_growth_delivery_settled"
      | "family_growth_delivery_retry"
      | "family_growth_delivery_attention"
      | "family_growth_delivery_receipt_conflict"
      | "family_growth_delivery_tick_failed",
    fields: Record<string, string | number>,
  ): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event,
      ...fields,
    });
  }

  serviceStarted(input: {
    appEnv: string;
    serviceName: string;
    port: number;
  }): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_started",
      app_env: input.appEnv,
      service_name: input.serviceName,
      port: input.port,
    });
  }

  productionAssemblyRefused(input: {
    surface: string;
    reason: string;
  }): void {
    this.sink({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_production_assembly_refused",
      surface: input.surface,
      reason: input.reason,
    });
  }
}
