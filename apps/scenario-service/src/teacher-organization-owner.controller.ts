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
import type { TeacherOrganizationOwnerComposition } from "./teacher-organization-owner-composition.js";
import {
  TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
  TEACHER_ORGANIZATION_OWNER_FEED_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
  TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
  TeacherOrganizationRequestParseError,
  parseTeacherOrganizationClassNoteRequestV1,
  parseTeacherOrganizationFeedRequestV1,
  parseTeacherOrganizationOrganizationRequestV1,
  parseTeacherOrganizationOrganizeRequestV1,
  parseTeacherOrganizationQueueAdmissionRequestV1,
  parseTeacherOrganizationSupplementRequestV1,
} from "./teacher-organization-owner-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const TEACHER_ORGANIZATION_OWNER_CONFIG = Symbol(
  "TEACHER_ORGANIZATION_OWNER_CONFIG",
);

export type TeacherOrganizationOwnerConfig = Readonly<{
  composition?: TeacherOrganizationOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherOrganizationOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_ORGANIZATION_OWNER_CONFIG)
    private readonly config: TeacherOrganizationOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_organization_owner_disabled",
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
@UseGuards(TeacherOrganizationOwnerServiceAuthGuard)
export class TeacherOrganizationOwnerController {
  constructor(
    @Inject(TEACHER_ORGANIZATION_OWNER_CONFIG)
    private readonly config: TeacherOrganizationOwnerConfig,
  ) {}

  @Post(TEACHER_ORGANIZATION_OWNER_FEED_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  feed(@Body() body: unknown): Promise<unknown> {
    return this.composition().feed(
      this.parse(() => parseTeacherOrganizationFeedRequestV1(body)),
    );
  }

  @Post(TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  organization(@Body() body: unknown): Promise<unknown> {
    return this.composition().organization(
      this.parse(() => parseTeacherOrganizationOrganizationRequestV1(body)),
    );
  }

  @Post(TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  organize(@Body() body: unknown): Promise<unknown> {
    return this.composition().organize(
      this.parse(() => parseTeacherOrganizationOrganizeRequestV1(body)),
    );
  }

  @Post(TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  supplement(@Body() body: unknown): Promise<unknown> {
    return this.composition().supplement(
      this.parse(() => parseTeacherOrganizationSupplementRequestV1(body)),
    );
  }

  @Post(TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  classNote(@Body() body: unknown): Promise<unknown> {
    return this.composition().classNote(
      this.parse(() => parseTeacherOrganizationClassNoteRequestV1(body)),
    );
  }

  @Post(TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  queueAdmission(@Body() body: unknown): Promise<unknown> {
    return this.composition().queueAdmission(
      this.parse(() => parseTeacherOrganizationQueueAdmissionRequestV1(body)),
    );
  }

  private composition(): TeacherOrganizationOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_organization_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherOrganizationRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
