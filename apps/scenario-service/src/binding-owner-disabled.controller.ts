import {
  Controller,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { BindingOwnerServiceAuthGuard } from "./binding-owner-service-auth.guard.js";

@Controller()
export class BindingOwnerDisabledController {
  @Post("/internal/nurture/scenario-binding/authorize")
  @UseGuards(BindingOwnerServiceAuthGuard)
  authorize(): never {
    throw new ServiceUnavailableException({
      error: "binding_owner_disabled",
    });
  }
}
