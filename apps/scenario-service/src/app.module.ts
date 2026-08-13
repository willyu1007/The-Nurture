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
import {
  FAMILY_GROWTH_RENDITION_RUNTIME,
  FamilyGrowthRenditionAuthGuard,
  FamilyGrowthRenditionController,
} from "./family-growth-rendition.controller.js";
import type { FamilyGrowthRenditionRuntime } from "./family-growth-runtime.js";
import {
  TEACHER_RELEASE_OWNER_CONFIG,
  TeacherReleaseOwnerController,
  type TeacherReleaseOwnerConfig,
  TeacherReleaseOwnerServiceAuthGuard,
} from "./teacher-release-owner.controller.js";
import {
  FAMILY_SHARING_PRIVATE_CONFIG,
  FamilySharingPrivateController,
  FamilySharingPrivateServiceAuthGuard,
  type FamilySharingPrivateConfig,
} from "./family-sharing-private.controller.js";
import { PrivateResponseExceptionFilter } from "./private-response-exception.filter.js";
import {
  PARENT_CONTEXT_PRESENTER_CONFIG,
  ParentContextPresenterController,
  type ParentContextPresenterConfig,
  ParentContextPresenterServiceAuthGuard,
} from "./parent-context-presenter.controller.js";
import {
  PARENT_COMMUNICATION_OWNER_CONFIG,
  ParentCommunicationOwnerController,
  type ParentCommunicationOwnerConfig,
  ParentCommunicationOwnerServiceAuthGuard,
} from "./parent-communication-owner.controller.js";
import { SafeExceptionFilter } from "./safe-exception.filter.js";
import { ScenarioStructuredLogger } from "./structured-logger.js";

@Module({
  controllers: [
    HealthController,
    BindingOwnerController,
    HarnessController,
    FamilyGrowthRenditionController,
    TeacherReleaseOwnerController,
    ParentContextPresenterController,
    ParentCommunicationOwnerController,
    FamilySharingPrivateController,
  ],
})
export class AppModule {
  static register(input: {
    logger: ScenarioStructuredLogger;
    bindingOwner: BindingOwnerGuardConfig;
    harness: HarnessGuardConfig;
    familyGrowthRendition: FamilyGrowthRenditionRuntime;
    teacherReleaseOwner: TeacherReleaseOwnerConfig;
    parentContextPresenter: ParentContextPresenterConfig;
    parentCommunicationOwner?: ParentCommunicationOwnerConfig;
    familySharingPrivate: FamilySharingPrivateConfig;
  }): DynamicModule {
    return {
      module: AppModule,
      providers: [
        {
          provide: ScenarioStructuredLogger,
          useValue: input.logger,
        },
        SafeExceptionFilter,
        PrivateResponseExceptionFilter,
        {
          provide: FAMILY_GROWTH_RENDITION_RUNTIME,
          useValue: input.familyGrowthRendition,
        },
        FamilyGrowthRenditionAuthGuard,
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
        {
          provide: TEACHER_RELEASE_OWNER_CONFIG,
          useValue: Object.freeze({ ...input.teacherReleaseOwner }),
        },
        TeacherReleaseOwnerServiceAuthGuard,
        {
          provide: PARENT_CONTEXT_PRESENTER_CONFIG,
          useValue: Object.freeze({ ...input.parentContextPresenter }),
        },
        ParentContextPresenterServiceAuthGuard,
        {
          provide: PARENT_COMMUNICATION_OWNER_CONFIG,
          useValue: Object.freeze({
            ...(input.parentCommunicationOwner ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        ParentCommunicationOwnerServiceAuthGuard,
        {
          provide: FAMILY_SHARING_PRIVATE_CONFIG,
          useValue: Object.freeze({ ...input.familySharingPrivate }),
        },
        FamilySharingPrivateServiceAuthGuard,
      ],
    };
  }
}
