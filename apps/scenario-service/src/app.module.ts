import { type DynamicModule, Module } from "@nestjs/common";
import { BindingOwnerController } from "./binding-owner.controller.js";
import {
  BINDING_OWNER_GUARD_CONFIG,
  type BindingOwnerGuardConfig,
  BindingOwnerServiceAuthGuard,
} from "./binding-owner-service-auth.guard.js";
import { BindingOwnerRuntime } from "./binding-owner-runtime.js";
import { HealthController } from "./health.controller.js";

@Module({
  controllers: [HealthController, BindingOwnerController],
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
        {
          provide: BindingOwnerRuntime,
          useValue: bindingOwnerGuardConfig.runtime,
        },
        BindingOwnerServiceAuthGuard,
      ],
    };
  }
}
