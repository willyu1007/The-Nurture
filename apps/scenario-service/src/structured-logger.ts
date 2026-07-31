export type ScenarioRouteClass = "health" | "binding_owner" | "unknown";
export type ScenarioHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "UNKNOWN";

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
      event: "scenario_service_started";
      app_env: string;
      service_name: string;
      port: number;
    }>;

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
}
