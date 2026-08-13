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
import type { ParentContextPresenterComposition } from "./parent-context-presenter-composition.js";
import {
  PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH,
  PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH,
  PARENT_CONTEXT_PRESENTER_DAY_PATH,
  PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH,
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
  ParentContextPresenterRequestParseError,
  parseParentContextPresenterActivityDetailRequestV1,
  parseParentContextPresenterDailyCareRequestV1,
  parseParentContextPresenterDayRequestV1,
  parseParentContextPresenterFreshnessAttendanceRequestV1,
  parseParentContextPresenterNoticeRequestV1,
} from "./parent-context-presenter-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const PARENT_CONTEXT_PRESENTER_CONFIG = Symbol(
  "PARENT_CONTEXT_PRESENTER_CONFIG",
);

export type ParentContextPresenterConfig = Readonly<{
  composition?: ParentContextPresenterComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class ParentContextPresenterServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(PARENT_CONTEXT_PRESENTER_CONFIG)
    private readonly config: ParentContextPresenterConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "parent_context_presenter_disabled",
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
@UseGuards(ParentContextPresenterServiceAuthGuard)
export class ParentContextPresenterController {
  constructor(
    @Inject(PARENT_CONTEXT_PRESENTER_CONFIG)
    private readonly config: ParentContextPresenterConfig,
  ) {}

  @Post(PARENT_CONTEXT_PRESENTER_DAY_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  day(@Body() body: unknown): Promise<unknown> {
    return this.composition().day(
      this.parse(() => parseParentContextPresenterDayRequestV1(body)),
    );
  }

  @Post(PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  dailyCare(@Body() body: unknown): Promise<unknown> {
    return this.composition().dailyCare(
      this.parse(() => parseParentContextPresenterDailyCareRequestV1(body)),
    );
  }

  @Post(PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  activityDetail(@Body() body: unknown): Promise<unknown> {
    return this.composition().activityDetail(
      this.parse(() => parseParentContextPresenterActivityDetailRequestV1(body)),
    );
  }

  @Post(PARENT_CONTEXT_PRESENTER_NOTICES_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  notices(@Body() body: unknown): Promise<unknown> {
    return this.composition().notices(
      this.parse(() => parseParentContextPresenterNoticeRequestV1(body)),
    );
  }

  @Post(PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  freshnessAttendance(@Body() body: unknown): Promise<unknown> {
    return this.composition().freshnessAttendance(
      this.parse(() =>
        parseParentContextPresenterFreshnessAttendanceRequestV1(body)
      ),
    );
  }

  private composition(): ParentContextPresenterComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "parent_context_presenter_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof ParentContextPresenterRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
