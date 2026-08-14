import type { IncomingMessage } from "node:http";
import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
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
  "harness_disabled",
  "invalid_harness_request",
  "unknown_capability",
  "institution_business_communication_read_disabled",
  "teacher_release_owner_disabled",
  "parent_context_presenter_disabled",
  "director_presenter_disabled",
  "teacher_class_stream_presenter_disabled",
  "family_sharing_private_disabled",
  "family_sharing_private_auth_failed",
  "family_sharing_private_replay",
  "family_sharing_private_unavailable",
  "invalid_family_sharing_private_request",
  "invalid_teacher_release_owner_request",
  "teacher_release_owner_contract_mismatch",
  "invalid_parent_context_presenter_request",
  "parent_context_presenter_contract_mismatch",
  "invalid_director_presenter_request",
  "director_presenter_contract_mismatch",
  "invalid_teacher_class_stream_request",
  "teacher_class_stream_contract_mismatch",
  "teacher_organization_owner_disabled",
  "invalid_teacher_organization_request",
  "teacher_organization_contract_mismatch",
  "teacher_communication_owner_disabled",
  "invalid_teacher_communication_request",
  "teacher_communication_contract_mismatch",
  // family_growth_transport@1.0.0 §5 — the frozen rendition-exchange taxonomy.
  "service_unauthorized",
  "rendition_ref_invalid",
  "rendition_unavailable",
  "rendition_temporarily_unavailable",
]);

const bodyParserErrorStatuses = new Map<string, number>([
  ["encoding.unsupported", HttpStatus.UNSUPPORTED_MEDIA_TYPE],
  ["charset.unsupported", HttpStatus.UNSUPPORTED_MEDIA_TYPE],
  ["entity.parse.failed", HttpStatus.BAD_REQUEST],
  ["entity.verify.failed", HttpStatus.FORBIDDEN],
  ["request.aborted", HttpStatus.BAD_REQUEST],
  ["request.size.invalid", HttpStatus.BAD_REQUEST],
  ["entity.too.large", HttpStatus.PAYLOAD_TOO_LARGE],
  ["stream.encoding.set", HttpStatus.INTERNAL_SERVER_ERROR],
  ["stream.not.readable", HttpStatus.INTERNAL_SERVER_ERROR],
]);

type HttpResponse = {
  headersSent?: boolean;
  status(code: number): HttpResponse;
  json(body: Readonly<{ error: string }>): void;
};

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ScenarioStructuredLogger)
    private readonly logger: ScenarioStructuredLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    if (response.headersSent) return;

    const request = context.getRequest<IncomingMessage>();
    const requestContext = readScenarioRequestContext(request);
    const status = exceptionStatus(exception);
    const error = safeError(exception, status);
    if (
      (!isOperationalException(exception) || status >= 500) &&
      error !== "binding_owner_disabled" &&
      error !== "harness_disabled" &&
      error !== "institution_business_communication_read_disabled" &&
      error !== "teacher_release_owner_disabled" &&
      error !== "parent_context_presenter_disabled" &&
      error !== "director_presenter_disabled" &&
      error !== "teacher_class_stream_presenter_disabled"
    ) {
      this.logger.unhandledException(requestContext);
    }
    response.status(status).json({ error });
  }
}

function exceptionStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  return bodyParserStatus(exception) ?? HttpStatus.INTERNAL_SERVER_ERROR;
}

function isOperationalException(exception: unknown): boolean {
  return (
    exception instanceof HttpException ||
    bodyParserStatus(exception) !== undefined
  );
}

function bodyParserStatus(exception: unknown): number | undefined {
  if (exception && typeof exception === "object") {
    const type = (exception as { type?: unknown }).type;
    if (typeof type === "string") {
      return bodyParserErrorStatuses.get(type);
    }
  }
  return undefined;
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
    case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
      return "unsupported_media_type";
    case HttpStatus.SERVICE_UNAVAILABLE:
      return "service_unavailable";
    default:
      return "internal_error";
  }
}
