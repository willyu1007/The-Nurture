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
import { MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER } from "@the-nurture/scenario";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { ParentCommunicationOwnerComposition } from "./parent-communication-owner-composition.js";
import {
  PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
  PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH,
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
  ParentCommunicationOwnerRequestParseError,
  parseParentCommunicationDetailRequestV1,
  parseParentCommunicationMediaAccessRequestV1,
  parseParentCommunicationSendTextRequestV1,
  parseParentCommunicationSummaryRequestV1,
} from "./parent-communication-owner-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";
import {
  ParentContextSelectionHeaderParseError,
  parseParentContextSelectionHeaderV1,
} from "./parent-context-selection-http.js";

export const PARENT_COMMUNICATION_OWNER_CONFIG = Symbol(
  "PARENT_COMMUNICATION_OWNER_CONFIG",
);

export type ParentCommunicationOwnerConfig = Readonly<{
  composition?: ParentCommunicationOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class ParentCommunicationOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(PARENT_COMMUNICATION_OWNER_CONFIG)
    private readonly config: ParentCommunicationOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "parent_communication_owner_disabled",
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
@UseGuards(ParentCommunicationOwnerServiceAuthGuard)
export class ParentCommunicationOwnerController {
  constructor(
    @Inject(PARENT_COMMUNICATION_OWNER_CONFIG)
    private readonly config: ParentCommunicationOwnerConfig,
  ) {}

  @Post(PARENT_COMMUNICATION_OWNER_SUMMARY_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  summary(@Body() body: unknown, @Req() httpRequest: IncomingMessage): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationSummaryRequestV1(body));
    return this.composition().summary(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_COMMUNICATION_OWNER_DETAIL_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  detail(@Body() body: unknown, @Req() httpRequest: IncomingMessage): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationDetailRequestV1(body));
    return this.composition().detail(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  mediaAccess(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationMediaAccessRequestV1(body));
    return this.composition().mediaAccess(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  sendText(@Body() body: unknown, @Req() httpRequest: IncomingMessage): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationSendTextRequestV1(body));
    return this.composition().sendText(request, this.selection(httpRequest, request));
  }

  private composition(): ParentCommunicationOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "parent_communication_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (
        error instanceof ParentCommunicationOwnerRequestParseError
        || error instanceof ParentContextSelectionHeaderParseError
      ) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }

  private selection(
    httpRequest: IncomingMessage,
    identity: Parameters<typeof parseParentContextSelectionHeaderV1>[1],
  ) {
    return this.parse(() => parseParentContextSelectionHeaderV1(
      httpRequest.headers[MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER],
      identity,
    ));
  }
}
