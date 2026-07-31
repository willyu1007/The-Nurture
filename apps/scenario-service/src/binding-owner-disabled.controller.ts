import {
  Controller,
  Post,
  ServiceUnavailableException,
} from "@nestjs/common";

@Controller()
export class BindingOwnerDisabledController {
  @Post("/internal/nurture/scenario-binding/authorize")
  authorize(): never {
    throw new ServiceUnavailableException({
      error: "binding_owner_disabled",
    });
  }
}
