import type { IncomingMessage } from "node:http";
import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import {
  PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
  TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
  TEACHER_RELEASE_OWNER_CONFIRM_PATH,
} from "@the-nurture/scenario";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { HARNESS_EXECUTE_PATH } from "./harness-http.js";
import {
  type ScenarioCommandSettlementOutcome,
  type ScenarioCommandSurface,
  ScenarioStructuredLogger,
} from "./structured-logger.js";

const COMMAND_SURFACE_BY_PATH = new Map<string, ScenarioCommandSurface>([
  [HARNESS_EXECUTE_PATH, "harness"],
  [TEACHER_RELEASE_OWNER_CONFIRM_PATH, "teacher_release_owner"],
  [PARENT_CONTEXT_PRESENTER_NOTICES_PATH, "parent_context_presenter"],
  [PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH, "parent_communication_owner"],
  [
    PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
    "parent_communication_extension",
  ],
  [TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH, "teacher_organization_owner"],
  [TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH, "teacher_organization_owner"],
  [TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH, "teacher_organization_owner"],
  [
    TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
    "teacher_organization_owner",
  ],
  [TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH, "teacher_communication_owner"],
  [
    TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
    "teacher_communication_owner",
  ],
  [TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH, "teacher_communication_owner"],
  [
    TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
    "teacher_media_association_owner",
  ],
  [
    TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
    "teacher_media_association_owner",
  ],
  [
    TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
    "teacher_assistant_query_owner",
  ],
]);

type CommandSettlement =
  | Readonly<{
      outcome: Exclude<ScenarioCommandSettlementOutcome, "refused">;
    }>
  | Readonly<{
      outcome: "refused";
      reasonCode: string;
    }>;

/** Emits one body-free operational event for each settled command response. */
export class ScenarioCommandSettlementInterceptor implements NestInterceptor {
  constructor(private readonly logger: ScenarioStructuredLogger) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const surface = commandSurface(request.url);
    if (!surface) return next.handle();

    const startedAt = performance.now();
    return next.handle().pipe(
      tap((response: unknown) => {
        const settlement = classifySettlement(response);
        if (!settlement) return;
        const durationMs = Math.max(
          0,
          Math.round(performance.now() - startedAt),
        );
        this.logger.scenarioCommandSettled(
          settlement.outcome === "refused"
            ? {
                surface,
                outcome: settlement.outcome,
                reasonCode: settlement.reasonCode,
                durationMs,
              }
            : {
                surface,
                outcome: settlement.outcome,
                durationMs,
              },
        );
      }),
    );
  }
}

function commandSurface(
  url: string | undefined,
): ScenarioCommandSurface | undefined {
  return COMMAND_SURFACE_BY_PATH.get(url?.split("?", 1)[0] ?? "");
}

function classifySettlement(value: unknown): CommandSettlement | undefined {
  if (!isRecord(value)) return undefined;
  if (
    value.status === "outcome_unknown" &&
    value.recovery === "reconcile_same_command"
  ) {
    return { outcome: "reconciled" };
  }
  if (value.status === "not_committed" && typeof value.reason_code === "string") {
    return { outcome: "refused", reasonCode: value.reason_code };
  }
  if (value.status !== "committed") return undefined;

  const executionDisposition =
    value.execution_disposition === "executed" ||
    value.execution_disposition === "replayed"
      ? value.execution_disposition
      : value.executed === "executed" || value.executed === "replayed"
        ? value.executed
        : undefined;
  if (!executionDisposition) return undefined;
  return {
    outcome:
      executionDisposition === "replayed" ||
      value.business_outcome === "already_satisfied" ||
      value.disposition === "already_satisfied"
        ? "already_satisfied"
        : "executed",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
