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
import type { ParentCommunicationExtensionComposition } from "./parent-communication-extension-composition.js";
import {
  PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
  ParentCommunicationExtensionRequestParseError,
  parseParentCommunicationDeliveryReceiptRequestV1,
  parseParentCommunicationRedactRequestV1,
  parseParentCommunicationRedactionPreviewRequestV1,
} from "./parent-communication-extension-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";
import {
  ParentContextSelectionHeaderParseError,
  parseParentContextSelectionHeaderV1,
} from "./parent-context-selection-http.js";

export const PARENT_COMMUNICATION_EXTENSION_CONFIG = Symbol(
  "PARENT_COMMUNICATION_EXTENSION_CONFIG",
);

export type ParentCommunicationExtensionConfig = Readonly<{
  composition?: ParentCommunicationExtensionComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class ParentCommunicationExtensionServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(PARENT_COMMUNICATION_EXTENSION_CONFIG)
    private readonly config: ParentCommunicationExtensionConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "parent_communication_extension_disabled",
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
@UseGuards(ParentCommunicationExtensionServiceAuthGuard)
export class ParentCommunicationExtensionController {
  constructor(
    @Inject(PARENT_COMMUNICATION_EXTENSION_CONFIG)
    private readonly config: ParentCommunicationExtensionConfig,
  ) {}

  @Post(PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  redactionPreview(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationRedactionPreviewRequestV1(body));
    return this.composition().redactionPreview(
      request,
      this.selection(httpRequest, request),
    );
  }

  @Post(PARENT_COMMUNICATION_EXTENSION_REDACT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  redact(@Body() body: unknown, @Req() httpRequest: IncomingMessage): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationRedactRequestV1(body));
    return this.composition().redact(request, this.selection(httpRequest, request));
  }

  @Post(PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  deliveryReceipt(
    @Body() body: unknown,
    @Req() httpRequest: IncomingMessage,
  ): Promise<unknown> {
    const request = this.parse(() => parseParentCommunicationDeliveryReceiptRequestV1(body));
    return this.composition().deliveryReceipt(
      request,
      this.selection(httpRequest, request),
    );
  }

  private composition(): ParentCommunicationExtensionComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "parent_communication_extension_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (
        error instanceof ParentCommunicationExtensionRequestParseError
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
