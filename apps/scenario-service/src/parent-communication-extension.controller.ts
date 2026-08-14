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
  redactionPreview(@Body() body: unknown): Promise<unknown> {
    return this.composition().redactionPreview(
      this.parse(() => parseParentCommunicationRedactionPreviewRequestV1(body)),
    );
  }

  @Post(PARENT_COMMUNICATION_EXTENSION_REDACT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  redact(@Body() body: unknown): Promise<unknown> {
    return this.composition().redact(
      this.parse(() => parseParentCommunicationRedactRequestV1(body)),
    );
  }

  @Post(PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  deliveryReceipt(@Body() body: unknown): Promise<unknown> {
    return this.composition().deliveryReceipt(
      this.parse(() => parseParentCommunicationDeliveryReceiptRequestV1(body)),
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
      if (error instanceof ParentCommunicationExtensionRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
