import type { IncomingMessage } from "node:http";
import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Inject,
  Injectable,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
  ConflictException,
  Req,
  Res,
} from "@nestjs/common";
import {
  NURTURE_FAMILY_SHARING_PRIVATE_PATH,
  NurtureInvocationVerificationError,
  type NurtureDetachedRequestSignatureV1,
} from "@the-nurture/scenario";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  FAMILY_SHARING_PRIVATE_REQUEST_SIGNATURE_HEADER,
  FAMILY_SHARING_PRIVATE_RESPONSE_SIGNATURE_HEADER,
  FAMILY_SHARING_PRIVATE_SERVICE_SUBJECT_HEADER,
  FamilySharingPrivateContractError,
  type FamilySharingPrivateRuntime,
} from "./family-sharing-private-runtime.js";

export const FAMILY_SHARING_PRIVATE_CONFIG = Symbol("FAMILY_SHARING_PRIVATE_CONFIG");

export type FamilySharingPrivateConfig = Readonly<{
  runtime: FamilySharingPrivateRuntime;
  serviceAuth: BindingOwnerServiceAuth;
}>;

type PrivateResponse = {
  status(code: number): PrivateResponse;
  setHeader(name: string, value: string): void;
  send(body: Buffer): void;
};

@Injectable()
export class FamilySharingPrivateServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(FAMILY_SHARING_PRIVATE_CONFIG)
    private readonly config: FamilySharingPrivateConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const response = context.switchToHttp().getResponse<PrivateResponse>();
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Pragma", "no-cache");
    if (!this.config.runtime.engine || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "family_sharing_private_disabled",
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
export class FamilySharingPrivateController {
  constructor(
    @Inject(FAMILY_SHARING_PRIVATE_CONFIG)
    private readonly config: FamilySharingPrivateConfig,
  ) {}

  @Post(NURTURE_FAMILY_SHARING_PRIVATE_PATH)
  @UseGuards(FamilySharingPrivateServiceAuthGuard)
  async invoke(
    @Body() body: unknown,
    @Req() request: IncomingMessage,
    @Res() response: PrivateResponse,
  ): Promise<void> {
    const engine = this.config.runtime.engine;
    if (!engine) {
      throw new ServiceUnavailableException({
        error: "family_sharing_private_disabled",
      });
    }
    try {
      const result = await engine.invoke({
        invocation: body,
        signature: decodeSignature(
          request.headers[FAMILY_SHARING_PRIVATE_REQUEST_SIGNATURE_HEADER],
        ),
        transportCredentialSubject: singleHeader(
          request.headers[FAMILY_SHARING_PRIVATE_SERVICE_SUBJECT_HEADER],
        ),
      });
      response.status(result.status);
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Pragma", "no-cache");
      response.setHeader(
        FAMILY_SHARING_PRIVATE_RESPONSE_SIGNATURE_HEADER,
        Buffer.from(JSON.stringify(result.response_signature), "utf8").toString(
          "base64url",
        ),
      );
      response.send(result.body);
    } catch (error) {
      throw mapPrivateError(error);
    }
  }
}

function decodeSignature(value: string | string[] | undefined): NurtureDetachedRequestSignatureV1 {
  const encoded = singleHeader(value);
  if (!encoded || !/^[A-Za-z0-9_-]{1,4096}$/u.test(encoded)) {
    throw new UnauthorizedException({ error: "family_sharing_private_auth_failed" });
  }
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as
      NurtureDetachedRequestSignatureV1;
  } catch {
    throw new UnauthorizedException({ error: "family_sharing_private_auth_failed" });
  }
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function mapPrivateError(error: unknown): Error {
  if (error instanceof NurtureInvocationVerificationError) {
    if (error.code === "nonce_replayed") {
      return new ConflictException({ error: "family_sharing_private_replay" });
    }
    if (error.phase === "contract") {
      return new BadRequestException({ error: "invalid_family_sharing_private_request" });
    }
    return new UnauthorizedException({ error: "family_sharing_private_auth_failed" });
  }
  if (error instanceof FamilySharingPrivateContractError) {
    return error.code === "output_invalid"
      ? new ServiceUnavailableException({ error: "family_sharing_private_unavailable" })
      : new BadRequestException({ error: "invalid_family_sharing_private_request" });
  }
  if (
    error instanceof UnauthorizedException ||
    error instanceof BadRequestException ||
    error instanceof ConflictException ||
    error instanceof ServiceUnavailableException
  ) return error;
  return new ServiceUnavailableException({ error: "family_sharing_private_unavailable" });
}
