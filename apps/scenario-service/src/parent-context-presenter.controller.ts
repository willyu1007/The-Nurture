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
  Req,
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
  MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER,
  ParentContextPresenterRequestParseError,
  parseParentContextPresenterActivityDetailRequestV1,
  parseParentContextPresenterDailyCareRequestV1,
  parseParentContextPresenterDayRequestV1,
  parseParentContextPresenterFreshnessAttendanceRequestV1,
  parseParentContextPresenterNoticeRequestV1,
  parseParentContextSelectionV1,
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
  day(@Body() body: unknown, @Req() httpRequest: IncomingMessage): Promise<unknown> {
    const request = this.parse(() => parseParentContextPresenterDayRequestV1(body));
    return this.composition().day(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  dailyCare(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() => parseParentContextPresenterDailyCareRequestV1(body));
    return this.composition().dailyCare(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  activityDetail(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() =>
      parseParentContextPresenterActivityDetailRequestV1(body)
    );
    return this.composition().activityDetail(
      request,
      this.selection(httpRequest, request),
    );
  }

  @Post(PARENT_CONTEXT_PRESENTER_NOTICES_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  notices(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() => parseParentContextPresenterNoticeRequestV1(body));
    return this.composition().notices(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  freshnessAttendance(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() =>
      parseParentContextPresenterFreshnessAttendanceRequestV1(body)
    );
    return this.composition().freshnessAttendance(
      request,
      this.selection(httpRequest, request),
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

  private selection(
    httpRequest: IncomingMessage,
    identity: Parameters<typeof parseParentContextSelectionV1>[1],
  ) {
    return this.parse(() =>
      parseParentContextSelectionV1(
        httpRequest.headers[MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER],
        identity,
      )
    );
  }
}
