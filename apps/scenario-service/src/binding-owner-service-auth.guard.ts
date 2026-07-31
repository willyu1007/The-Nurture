import type { IncomingMessage } from "node:http";
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";

export const BINDING_OWNER_GUARD_CONFIG = Symbol(
  "BINDING_OWNER_GUARD_CONFIG",
);

export type BindingOwnerGuardConfig = Readonly<{
  authorizerAvailable: boolean;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class BindingOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(BINDING_OWNER_GUARD_CONFIG)
    private readonly config: BindingOwnerGuardConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      !this.config.authorizerAvailable ||
      !this.config.serviceAuth.configured
    ) {
      throw new ServiceUnavailableException({
        error: "binding_owner_disabled",
      });
    }

    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (
      !this.config.serviceAuth.bearerAuthorized(
        request.headers.authorization,
      )
    ) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }

    return true;
  }
}
