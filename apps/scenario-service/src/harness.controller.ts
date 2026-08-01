import type { IncomingMessage } from "node:http";
import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  HttpCode,
  HttpStatus,
  Header,
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
  HARNESS_QUERY_PATH,
  HARNESS_READ_RESULT_PATH,
  INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH,
  HarnessRequestParseError,
  parseHarnessExecuteRequestV1,
  parseHarnessPrepareRequestV1,
  parseHarnessQueryRequestV1,
  parseHarnessReadResultRequestV1,
  parseInstitutionBusinessCommunicationReadRequestV1,
  type HarnessExecuteResponseV1,
  type HarnessPrepareResponseV1,
  type HarnessQueryResponseV1,
  type InstitutionBusinessCommunicationReadResponseV1,
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

  @Post(HARNESS_QUERY_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(HarnessServiceAuthGuard)
  async query(@Body() body: unknown): Promise<HarnessQueryResponseV1> {
    const engine = this.config.runtime.engine;
    if (!engine) throw new ServiceUnavailableException({ error: "harness_disabled" });
    return engine.query(this.parse(() => parseHarnessQueryRequestV1(body)));
  }

  @Post(HARNESS_READ_RESULT_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(HarnessServiceAuthGuard)
  async readResult(@Body() body: unknown): Promise<HarnessQueryResponseV1> {
    const engine = this.config.runtime.engine;
    if (!engine) throw new ServiceUnavailableException({ error: "harness_disabled" });
    return engine.readResult(this.parse(() => parseHarnessReadResultRequestV1(body)));
  }

  @Post(INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  @UseGuards(HarnessServiceAuthGuard)
  async readInstitutionBusinessCommunication(
    @Body() body: unknown,
  ): Promise<InstitutionBusinessCommunicationReadResponseV1> {
    const engine = this.config.runtime.engine;
    if (!engine) throw new ServiceUnavailableException({ error: "harness_disabled" });
    if (!this.config.runtime.institutionBusinessCommunicationReadEnabled) {
      throw new ServiceUnavailableException({
        error: "institution_business_communication_read_disabled",
      });
    }
    return engine.readInstitutionBusinessCommunication(
      this.parse(() => parseInstitutionBusinessCommunicationReadRequestV1(body)),
    );
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
