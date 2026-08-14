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
import type { DirectorPresenterComposition } from "./director-presenter-composition.js";
import {
  DIRECTOR_PRESENTER_DRILLDOWN_PATH,
  DIRECTOR_PRESENTER_MATERIALS_PATH,
  DIRECTOR_PRESENTER_OVERVIEW_PATH,
  DirectorPresenterRequestParseError,
  parseDirectorPresenterDrilldownRequestV1,
  parseDirectorPresenterMaterialRequestV1,
  parseDirectorPresenterOverviewRequestV1,
} from "./director-presenter-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const DIRECTOR_PRESENTER_CONFIG = Symbol("DIRECTOR_PRESENTER_CONFIG");

export type DirectorPresenterConfig = Readonly<{
  composition?: DirectorPresenterComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class DirectorPresenterServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(DIRECTOR_PRESENTER_CONFIG)
    private readonly config: DirectorPresenterConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "director_presenter_disabled",
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
@UseGuards(DirectorPresenterServiceAuthGuard)
export class DirectorPresenterController {
  constructor(
    @Inject(DIRECTOR_PRESENTER_CONFIG)
    private readonly config: DirectorPresenterConfig,
  ) {}

  @Post(DIRECTOR_PRESENTER_OVERVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  overview(@Body() body: unknown): Promise<unknown> {
    return this.composition().overview(
      this.parse(() => parseDirectorPresenterOverviewRequestV1(body)),
    );
  }

  @Post(DIRECTOR_PRESENTER_DRILLDOWN_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  drilldown(@Body() body: unknown): Promise<unknown> {
    return this.composition().drilldown(
      this.parse(() => parseDirectorPresenterDrilldownRequestV1(body)),
    );
  }

  @Post(DIRECTOR_PRESENTER_MATERIALS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  materials(@Body() body: unknown): Promise<unknown> {
    return this.composition().materials(
      this.parse(() => parseDirectorPresenterMaterialRequestV1(body)),
    );
  }

  private composition(): DirectorPresenterComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "director_presenter_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof DirectorPresenterRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
