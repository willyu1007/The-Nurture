import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { NurtureScenarioBindingError } from "@the-nurture/scenario/binding-owner";
import {
  formatScenarioBindingAuthorizeResponse,
  parseScenarioBindingAuthorizeBody,
  SCENARIO_BINDING_ERROR_STATUS,
  SCENARIO_BINDING_OWNER_PATH,
  type ScenarioBindingAuthorizeResponse,
} from "@the-nurture/scenario/binding-owner-http";
import {
  BINDING_OWNER_GUARD_CONFIG,
  type BindingOwnerGuardConfig,
  BindingOwnerServiceAuthGuard,
} from "./binding-owner-service-auth.guard.js";

@Controller()
export class BindingOwnerController {
  constructor(
    @Inject(BINDING_OWNER_GUARD_CONFIG)
    private readonly config: BindingOwnerGuardConfig,
  ) {}

  @Post(SCENARIO_BINDING_OWNER_PATH)
  @HttpCode(HttpStatus.OK)
  @UseGuards(BindingOwnerServiceAuthGuard)
  async authorize(
    @Body() body: unknown,
  ): Promise<ScenarioBindingAuthorizeResponse> {
    const authorizer = this.config.runtime.authorizer;
    if (!authorizer) {
      throw new ServiceUnavailableException({
        error: "binding_owner_disabled",
      });
    }

    try {
      const receipt = await authorizer.authorize(
        parseScenarioBindingAuthorizeBody(body),
      );
      return formatScenarioBindingAuthorizeResponse(receipt);
    } catch (error) {
      if (error instanceof NurtureScenarioBindingError) {
        throw new HttpException(
          { error: error.code },
          SCENARIO_BINDING_ERROR_STATUS[error.code],
        );
      }
      throw new InternalServerErrorException({
        error: "owner_authorization_unavailable",
      });
    }
  }
}
