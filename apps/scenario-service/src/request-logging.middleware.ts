import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { NestMiddleware } from "@nestjs/common";
import {
  type ScenarioRouteClass,
  ScenarioStructuredLogger,
} from "./structured-logger.js";

const requestContextKey = Symbol("scenario-service-request-context");

export type ScenarioRequestContext = Readonly<{
  requestId: string;
  routeClass: ScenarioRouteClass;
}>;

type RequestWithContext = IncomingMessage & {
  [requestContextKey]?: ScenarioRequestContext;
};

export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: ScenarioStructuredLogger) {}

  use(
    request: RequestWithContext,
    response: ServerResponse,
    next: () => void,
  ): void {
    const startedAt = performance.now();
    const context: ScenarioRequestContext = {
      requestId: randomUUID(),
      routeClass: classifyRoute(request.url),
    };
    request[requestContextKey] = context;
    response.setHeader("x-request-id", context.requestId);
    response.once("finish", () => {
      this.logger.requestCompleted({
        requestId: context.requestId,
        method: request.method ?? "UNKNOWN",
        routeClass: context.routeClass,
        statusCode: response.statusCode,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      });
    });
    next();
  }
}

export function readScenarioRequestContext(
  request: IncomingMessage,
): ScenarioRequestContext {
  return (
    (request as RequestWithContext)[requestContextKey] ?? {
      requestId: "unavailable",
      routeClass: "unknown",
    }
  );
}

function classifyRoute(url: string | undefined): ScenarioRouteClass {
  const path = url?.split("?", 1)[0];
  if (path === "/health") return "health";
  if (path === "/internal/nurture/scenario-binding/authorize") {
    return "binding_owner";
  }
  return "unknown";
}
