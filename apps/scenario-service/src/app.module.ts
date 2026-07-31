import { type DynamicModule, Module } from "@nestjs/common";
import { BindingOwnerDisabledController } from "./binding-owner-disabled.controller.js";
import {
  BINDING_OWNER_GUARD_CONFIG,
  type BindingOwnerGuardConfig,
  BindingOwnerServiceAuthGuard,
} from "./binding-owner-service-auth.guard.js";
import { HealthController } from "./health.controller.js";

@Module({
  controllers: [HealthController, BindingOwnerDisabledController],
})
export class AppModule {
  static register(
    bindingOwnerGuardConfig: BindingOwnerGuardConfig,
  ): DynamicModule {
    return {
      module: AppModule,
      providers: [
        {
          provide: BINDING_OWNER_GUARD_CONFIG,
          useValue: Object.freeze({ ...bindingOwnerGuardConfig }),
        },
        BindingOwnerServiceAuthGuard,
      ],
    };
  }
}
