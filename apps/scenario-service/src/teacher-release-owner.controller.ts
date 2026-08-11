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
  UseGuards,
} from "@nestjs/common";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import type {
  TeacherReleaseOwnerComposition,
  TeacherReleaseOwnerResultV3,
} from "./teacher-release-owner-composition.js";
import type {
  TeacherReleaseOwnerConfirmResultV3,
  TeacherReleaseOwnerPrepareResultV3,
  TeacherReleaseOwnerQueryResultV3,
  TeacherReleaseOwnerTargetsResultV3,
} from "./teacher-release-owner-codec.js";
import {
  parseTeacherReleaseOwnerConfirmRequestV3,
  parseTeacherReleaseOwnerPrepareRequestV3,
  parseTeacherReleaseOwnerQueryRequestV3,
  parseTeacherReleaseOwnerTargetsRequestV3,
  TEACHER_RELEASE_OWNER_CONFIRM_PATH,
  TEACHER_RELEASE_OWNER_PREPARE_PATH,
  TEACHER_RELEASE_OWNER_QUERY_PATH,
  TEACHER_RELEASE_OWNER_TARGETS_PATH,
  TeacherReleaseOwnerRequestParseError,
} from "./teacher-release-owner-http.js";

export const TEACHER_RELEASE_OWNER_CONFIG = Symbol(
  "TEACHER_RELEASE_OWNER_CONFIG",
);

export type TeacherReleaseOwnerConfig = Readonly<{
  composition?: TeacherReleaseOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherReleaseOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_RELEASE_OWNER_CONFIG)
    private readonly config: TeacherReleaseOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_release_owner_disabled",
      });
    }
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (
      !this.config.serviceAuth.bearerAuthorized(request.headers.authorization)
    ) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }
    return true;
  }
}

@Controller()
@UseGuards(TeacherReleaseOwnerServiceAuthGuard)
export class TeacherReleaseOwnerController {
  constructor(
    @Inject(TEACHER_RELEASE_OWNER_CONFIG)
    private readonly config: TeacherReleaseOwnerConfig,
  ) {}

  @Post(TEACHER_RELEASE_OWNER_QUERY_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  query(
    @Body() body: unknown,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerQueryResultV3>> {
    return this.composition().query(
      this.parse(() => parseTeacherReleaseOwnerQueryRequestV3(body)),
    );
  }

  @Post(TEACHER_RELEASE_OWNER_TARGETS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  targets(
    @Body() body: unknown,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerTargetsResultV3>> {
    return this.composition().targets(
      this.parse(() => parseTeacherReleaseOwnerTargetsRequestV3(body)),
    );
  }

  @Post(TEACHER_RELEASE_OWNER_PREPARE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  prepare(
    @Body() body: unknown,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerPrepareResultV3>> {
    return this.composition().prepare(
      this.parse(() => parseTeacherReleaseOwnerPrepareRequestV3(body)),
    );
  }

  @Post(TEACHER_RELEASE_OWNER_CONFIRM_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  confirm(
    @Body() body: unknown,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerConfirmResultV3>> {
    return this.composition().confirm(
      this.parse(() => parseTeacherReleaseOwnerConfirmRequestV3(body)),
    );
  }

  private composition(): TeacherReleaseOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_release_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherReleaseOwnerRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
