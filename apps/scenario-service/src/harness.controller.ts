import type { IncomingMessage } from "node:http";
import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type { HarnessRuntime } from "./harness-runtime.js";
import {
  HARNESS_EXECUTE_PATH,
  HARNESS_PREPARE_PATH,
  HarnessRequestParseError,
  parseHarnessExecuteRequestV1,
  parseHarnessPrepareRequestV1,
  type HarnessExecuteResponseV1,
  type HarnessPrepareResponseV1,
} from "./harness-http.js";

export const HARNESS_GUARD_CONFIG = Symbol("HARNESS_GUARD_CONFIG");

export type HarnessGuardConfig = Readonly<{
  runtime: HarnessRuntime;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class HarnessServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(HARNESS_GUARD_CONFIG)
    private readonly config: HarnessGuardConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.runtime.engine || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({ error: "harness_disabled" });
    }
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!this.config.serviceAuth.bearerAuthorized(request.headers.authorization)) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }
    return true;
  }
}

@Controller()
export class HarnessController {
  constructor(
    @Inject(HARNESS_GUARD_CONFIG)
    private readonly config: HarnessGuardConfig,
  ) {}

  @Post(HARNESS_PREPARE_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(HarnessServiceAuthGuard)
  async prepare(@Body() body: unknown): Promise<HarnessPrepareResponseV1> {
    const engine = this.config.runtime.engine;
    if (!engine) throw new ServiceUnavailableException({ error: "harness_disabled" });
    return engine.prepare(this.parse(() => parseHarnessPrepareRequestV1(body)));
  }

  @Post(HARNESS_EXECUTE_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(HarnessServiceAuthGuard)
  async execute(@Body() body: unknown): Promise<HarnessExecuteResponseV1> {
    const engine = this.config.runtime.engine;
    if (!engine) throw new ServiceUnavailableException({ error: "harness_disabled" });
    return engine.execute(this.parse(() => parseHarnessExecuteRequestV1(body)));
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof HarnessRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
