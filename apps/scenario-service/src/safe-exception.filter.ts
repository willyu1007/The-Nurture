import type { IncomingMessage } from "node:http";
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { readScenarioRequestContext } from "./request-logging.middleware.js";
import { ScenarioStructuredLogger } from "./structured-logger.js";

const allowedErrors = new Set([
  "binding_owner_disabled",
  "service_auth_required",
  "invalid_binding_request",
  "invalid_owner_ref",
  "anchor_not_found",
  "anchor_not_current",
  "authorization_replay_conflict",
  "authorization_receipt_inactive",
  "owner_authorization_denied",
  "owner_authorization_unavailable",
]);

type HttpResponse = {
  headersSent?: boolean;
  status(code: number): HttpResponse;
  json(body: Readonly<{ error: string }>): void;
};

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: ScenarioStructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    if (response.headersSent) return;

    const request = context.getRequest<IncomingMessage>();
    const requestContext = readScenarioRequestContext(request);
    const status = exceptionStatus(exception);
    const error = safeError(exception, status);
    if (status >= 500 && error !== "binding_owner_disabled") {
      this.logger.unhandledException(requestContext);
    }
    response.status(status).json({ error });
  }
}

function exceptionStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  if (exception && typeof exception === "object") {
    const candidate = exception as { status?: unknown; statusCode?: unknown };
    for (const value of [candidate.status, candidate.statusCode]) {
      if (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 400 &&
        value <= 599
      ) {
        return value;
      }
    }
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function safeError(exception: unknown, status: number): string {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const candidate = (body as { error?: unknown }).error;
      if (typeof candidate === "string" && allowedErrors.has(candidate)) {
        return candidate;
      }
    }
  }

  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "invalid_request";
    case HttpStatus.UNAUTHORIZED:
      return "service_auth_required";
    case HttpStatus.FORBIDDEN:
      return "forbidden";
    case HttpStatus.NOT_FOUND:
      return "not_found";
    case HttpStatus.REQUEST_TIMEOUT:
      return "request_timeout";
    case HttpStatus.CONFLICT:
      return "conflict";
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return "payload_too_large";
    case HttpStatus.SERVICE_UNAVAILABLE:
      return "service_unavailable";
    default:
      return "internal_error";
  }
}
