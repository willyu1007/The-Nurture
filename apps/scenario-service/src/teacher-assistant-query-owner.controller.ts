import type { IncomingMessage } from "node:http";
import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { TeacherAssistantQueryOwnerComposition } from "./teacher-assistant-query-owner-composition.js";
import {
  TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
  TeacherAssistantQueryRequestParseError,
  parseTeacherAssistantQueryMissingRecordsRequestV1,
  parseTeacherAssistantQueryWeeklyDraftRequestV1,
  parseTeacherAssistantQueryWeeklySourceRequestV1,
} from "./teacher-assistant-query-owner-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const TEACHER_ASSISTANT_QUERY_OWNER_CONFIG = Symbol(
  "TEACHER_ASSISTANT_QUERY_OWNER_CONFIG",
);

export type TeacherAssistantQueryOwnerConfig = Readonly<{
  composition?: TeacherAssistantQueryOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherAssistantQueryOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_ASSISTANT_QUERY_OWNER_CONFIG)
    private readonly config: TeacherAssistantQueryOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_assistant_query_owner_disabled",
      });
    }
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!this.config.serviceAuth.bearerAuthorized(request.headers.authorization)) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }
    return true;
  }
}

@Controller()
@UseFilters(PrivateResponseExceptionFilter)
@UseGuards(TeacherAssistantQueryOwnerServiceAuthGuard)
export class TeacherAssistantQueryOwnerController {
  constructor(
    @Inject(TEACHER_ASSISTANT_QUERY_OWNER_CONFIG)
    private readonly config: TeacherAssistantQueryOwnerConfig,
  ) {}

  @Post(TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  missingRecords(@Body() body: unknown): Promise<unknown> {
    return this.composition().missingRecords(
      this.parse(() => parseTeacherAssistantQueryMissingRecordsRequestV1(body)),
    );
  }

  @Post(TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  weeklySource(@Body() body: unknown): Promise<unknown> {
    return this.composition().weeklySource(
      this.parse(() => parseTeacherAssistantQueryWeeklySourceRequestV1(body)),
    );
  }

  @Post(TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  weeklyDraft(@Body() body: unknown): Promise<unknown> {
    return this.composition().weeklyDraft(
      this.parse(() => parseTeacherAssistantQueryWeeklyDraftRequestV1(body)),
    );
  }

  private composition(): TeacherAssistantQueryOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_assistant_query_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherAssistantQueryRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
