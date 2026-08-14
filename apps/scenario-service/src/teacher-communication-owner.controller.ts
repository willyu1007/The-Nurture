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
import type { TeacherCommunicationOwnerComposition } from "./teacher-communication-owner-composition.js";
import {
  TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
  TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
  TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
  TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
  TeacherCommunicationRequestParseError,
  parseTeacherCommunicationMarkReadRequestV1,
  parseTeacherCommunicationMembershipRequestV1,
  parseTeacherCommunicationSendTextRequestV1,
  parseTeacherCommunicationTargetsRequestV1,
  parseTeacherCommunicationTimelineRequestV1,
  parseTeacherCommunicationWithdrawStagedRequestV1,
} from "./teacher-communication-owner-http.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";

export const TEACHER_COMMUNICATION_OWNER_CONFIG = Symbol(
  "TEACHER_COMMUNICATION_OWNER_CONFIG",
);

export type TeacherCommunicationOwnerConfig = Readonly<{
  composition?: TeacherCommunicationOwnerComposition;
  serviceAuth: BindingOwnerServiceAuth;
}>;

@Injectable()
export class TeacherCommunicationOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(TEACHER_COMMUNICATION_OWNER_CONFIG)
    private readonly config: TeacherCommunicationOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.composition || !this.config.serviceAuth.configured) {
      throw new ServiceUnavailableException({
        error: "teacher_communication_owner_disabled",
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
@UseGuards(TeacherCommunicationOwnerServiceAuthGuard)
export class TeacherCommunicationOwnerController {
  constructor(
    @Inject(TEACHER_COMMUNICATION_OWNER_CONFIG)
    private readonly config: TeacherCommunicationOwnerConfig,
  ) {}

  @Post(TEACHER_COMMUNICATION_OWNER_TARGETS_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  targets(@Body() body: unknown): Promise<unknown> {
    return this.composition().targets(
      this.parse(() => parseTeacherCommunicationTargetsRequestV1(body)),
    );
  }

  @Post(TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  membership(@Body() body: unknown): Promise<unknown> {
    return this.composition().membership(
      this.parse(() => parseTeacherCommunicationMembershipRequestV1(body)),
    );
  }

  @Post(TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  timeline(@Body() body: unknown): Promise<unknown> {
    return this.composition().timeline(
      this.parse(() => parseTeacherCommunicationTimelineRequestV1(body)),
    );
  }

  @Post(TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  sendText(@Body() body: unknown): Promise<unknown> {
    return this.composition().sendText(
      this.parse(() => parseTeacherCommunicationSendTextRequestV1(body)),
    );
  }

  @Post(TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  withdrawStaged(@Body() body: unknown): Promise<unknown> {
    return this.composition().withdrawStaged(
      this.parse(() => parseTeacherCommunicationWithdrawStagedRequestV1(body)),
    );
  }

  @Post(TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH)
  @HttpCode(HttpStatus.OK)
  @Header("Cache-Control", "private, no-store")
  @Header("Pragma", "no-cache")
  markRead(@Body() body: unknown): Promise<unknown> {
    return this.composition().markRead(
      this.parse(() => parseTeacherCommunicationMarkReadRequestV1(body)),
    );
  }

  private composition(): TeacherCommunicationOwnerComposition {
    const composition = this.config.composition;
    if (!composition) {
      throw new ServiceUnavailableException({
        error: "teacher_communication_owner_disabled",
      });
    }
    return composition;
  }

  private parse<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      if (error instanceof TeacherCommunicationRequestParseError) {
        throw new BadRequestException({ error: error.code });
      }
      throw error;
    }
  }
}
