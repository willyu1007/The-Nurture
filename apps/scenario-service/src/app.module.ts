import { Module } from "@nestjs/common";
import { BindingOwnerDisabledController } from "./binding-owner-disabled.controller.js";
import { HealthController } from "./health.controller.js";

@Module({
  controllers: [HealthController, BindingOwnerDisabledController],
})
export class AppModule {}
