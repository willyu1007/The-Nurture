import { type DynamicModule, Module } from "@nestjs/common";
import { BindingOwnerController } from "./binding-owner.controller.js";
import {
  BINDING_OWNER_GUARD_CONFIG,
  type BindingOwnerGuardConfig,
  BindingOwnerServiceAuthGuard,
} from "./binding-owner-service-auth.guard.js";
import { BindingOwnerRuntime } from "./binding-owner-runtime.js";
import {
  HARNESS_GUARD_CONFIG,
  HarnessController,
  HarnessServiceAuthGuard,
  type HarnessGuardConfig,
} from "./harness.controller.js";
import { HarnessRuntime } from "./harness-runtime.js";
import { HealthController } from "./health.controller.js";

@Module({
  controllers: [HealthController, BindingOwnerController, HarnessController],
})
export class AppModule {
  static register(input: {
    bindingOwner: BindingOwnerGuardConfig;
    harness: HarnessGuardConfig;
  }): DynamicModule {
    return {
      module: AppModule,
      providers: [
        {
          provide: BINDING_OWNER_GUARD_CONFIG,
          useValue: Object.freeze({ ...input.bindingOwner }),
        },
        {
          provide: BindingOwnerRuntime,
          useValue: input.bindingOwner.runtime,
        },
        BindingOwnerServiceAuthGuard,
        {
          provide: HARNESS_GUARD_CONFIG,
          useValue: Object.freeze({ ...input.harness }),
        },
        {
          provide: HarnessRuntime,
          useValue: input.harness.runtime,
        },
        HarnessServiceAuthGuard,
      ],
    };
  }
}
