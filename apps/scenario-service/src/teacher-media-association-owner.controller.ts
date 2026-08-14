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
import type { TeacherMediaAssociationOwnerComposition } from "./teacher-media-association-owner-composition.js";
import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
  TeacherMediaAssociationRequestParseError,
  parseTeacherMediaAssociationAssociateRequestV1,
  parseTeacherMediaAssociationAssociationRequestV1,
  parseTeacherMediaAssociationDiscardRequestV1,
  parseTeacherMediaAssociationUnassociatedRequestV1,
} from "./teacher-media-association-owner-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG = Symbol(
  "TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG",
);

export type TeacherMediaAssociationOwnerConfig = Readonly<{
  composition?: TeacherMediaAssociationOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherMediaAssociationOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG)
    private readonly config: TeacherMediaAssociationOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_media_association_owner_disabled",
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
@UseGuards(TeacherMediaAssociationOwnerServiceAuthGuard)
export class TeacherMediaAssociationOwnerController {
  constructor(
    @Inject(TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG)
    private readonly config: TeacherMediaAssociationOwnerConfig,
  ) {}

  @Post(TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  unassociated(@Body() body: unknown): Promise<unknown> {
    return this.composition().unassociated(
      this.parse(() => parseTeacherMediaAssociationUnassociatedRequestV1(body)),
    );
  }

  @Post(TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  association(@Body() body: unknown): Promise<unknown> {
    return this.composition().association(
      this.parse(() => parseTeacherMediaAssociationAssociationRequestV1(body)),
    );
  }

  @Post(TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  associate(@Body() body: unknown): Promise<unknown> {
    return this.composition().associate(
      this.parse(() => parseTeacherMediaAssociationAssociateRequestV1(body)),
    );
  }

  @Post(TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  discard(@Body() body: unknown): Promise<unknown> {
    return this.composition().discard(
      this.parse(() => parseTeacherMediaAssociationDiscardRequestV1(body)),
    );
  }

  private composition(): TeacherMediaAssociationOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_media_association_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherMediaAssociationRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
