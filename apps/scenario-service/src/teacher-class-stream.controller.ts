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
import type { TeacherClassStreamComposition } from "./teacher-class-stream-composition.js";
import {
  TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
  TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
  TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
  TEACHER_CLASS_STREAM_SCHEDULE_PATH,
  TeacherClassStreamRequestParseError,
  parseTeacherClassStreamChildDayDetailRequestV1,
  parseTeacherClassStreamChildStripRequestV1,
  parseTeacherClassStreamClassContextRequestV1,
  parseTeacherClassStreamScheduleRequestV1,
} from "./teacher-class-stream-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const TEACHER_CLASS_STREAM_CONFIG = Symbol("TEACHER_CLASS_STREAM_CONFIG");

export type TeacherClassStreamConfig = Readonly<{
  composition?: TeacherClassStreamComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherClassStreamServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_CLASS_STREAM_CONFIG)
    private readonly config: TeacherClassStreamConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_class_stream_presenter_disabled",
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
@UseGuards(TeacherClassStreamServiceAuthGuard)
export class TeacherClassStreamController {
  constructor(
    @Inject(TEACHER_CLASS_STREAM_CONFIG)
    private readonly config: TeacherClassStreamConfig,
  ) {}

  @Post(TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  classContext(@Body() body: unknown): Promise<unknown> {
    return this.composition().classContext(
      this.parse(() => parseTeacherClassStreamClassContextRequestV1(body)),
    );
  }

  @Post(TEACHER_CLASS_STREAM_CHILD_STRIP_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  childStrip(@Body() body: unknown): Promise<unknown> {
    return this.composition().childStrip(
      this.parse(() => parseTeacherClassStreamChildStripRequestV1(body)),
    );
  }

  @Post(TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  childDayDetail(@Body() body: unknown): Promise<unknown> {
    return this.composition().childDayDetail(
      this.parse(() => parseTeacherClassStreamChildDayDetailRequestV1(body)),
    );
  }

  @Post(TEACHER_CLASS_STREAM_SCHEDULE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  schedule(@Body() body: unknown): Promise<unknown> {
    return this.composition().schedule(
      this.parse(() => parseTeacherClassStreamScheduleRequestV1(body)),
    );
  }

  private composition(): TeacherClassStreamComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_class_stream_presenter_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherClassStreamRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
