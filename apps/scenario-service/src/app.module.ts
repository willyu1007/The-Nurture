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
import {
  DIRECTOR_PRESENTER_CONFIG,
  DirectorPresenterController,
  type DirectorPresenterConfig,
  DirectorPresenterServiceAuthGuard,
} from "./director-presenter.controller.js";
import {
  TEACHER_CLASS_STREAM_CONFIG,
  TeacherClassStreamController,
  type TeacherClassStreamConfig,
  TeacherClassStreamServiceAuthGuard,
} from "./teacher-class-stream.controller.js";
import {
  TEACHER_ORGANIZATION_OWNER_CONFIG,
  TeacherOrganizationOwnerController,
  type TeacherOrganizationOwnerConfig,
  TeacherOrganizationOwnerServiceAuthGuard,
} from "./teacher-organization-owner.controller.js";
import {
  TEACHER_COMMUNICATION_OWNER_CONFIG,
  TeacherCommunicationOwnerController,
  type TeacherCommunicationOwnerConfig,
  TeacherCommunicationOwnerServiceAuthGuard,
} from "./teacher-communication-owner.controller.js";
import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG,
  TeacherMediaAssociationOwnerController,
  type TeacherMediaAssociationOwnerConfig,
  TeacherMediaAssociationOwnerServiceAuthGuard,
} from "./teacher-media-association-owner.controller.js";
import {
  TEACHER_ASSISTANT_QUERY_OWNER_CONFIG,
  TeacherAssistantQueryOwnerController,
  type TeacherAssistantQueryOwnerConfig,
  TeacherAssistantQueryOwnerServiceAuthGuard,
} from "./teacher-assistant-query-owner.controller.js";
import {
  PARENT_COMMUNICATION_EXTENSION_CONFIG,
  ParentCommunicationExtensionController,
  type ParentCommunicationExtensionConfig,
  ParentCommunicationExtensionServiceAuthGuard,
} from "./parent-communication-extension.controller.js";
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
    DirectorPresenterController,
    TeacherClassStreamController,
    TeacherOrganizationOwnerController,
    TeacherCommunicationOwnerController,
    TeacherMediaAssociationOwnerController,
    TeacherAssistantQueryOwnerController,
    ParentCommunicationExtensionController,
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
    directorPresenter?: DirectorPresenterConfig;
    teacherClassStream?: TeacherClassStreamConfig;
    teacherOrganizationOwner?: TeacherOrganizationOwnerConfig;
    teacherCommunicationOwner?: TeacherCommunicationOwnerConfig;
    teacherMediaAssociationOwner?: TeacherMediaAssociationOwnerConfig;
    teacherAssistantQueryOwner?: TeacherAssistantQueryOwnerConfig;
    parentCommunicationExtension?: ParentCommunicationExtensionConfig;
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
          provide: DIRECTOR_PRESENTER_CONFIG,
          useValue: Object.freeze({
            ...(input.directorPresenter ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        DirectorPresenterServiceAuthGuard,
        {
          provide: TEACHER_CLASS_STREAM_CONFIG,
          useValue: Object.freeze({
            ...(input.teacherClassStream ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        TeacherClassStreamServiceAuthGuard,
        {
          provide: TEACHER_ORGANIZATION_OWNER_CONFIG,
          useValue: Object.freeze({
            ...(input.teacherOrganizationOwner ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        TeacherOrganizationOwnerServiceAuthGuard,
        {
          provide: TEACHER_COMMUNICATION_OWNER_CONFIG,
          useValue: Object.freeze({
            ...(input.teacherCommunicationOwner ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        TeacherCommunicationOwnerServiceAuthGuard,
        {
          provide: TEACHER_MEDIA_ASSOCIATION_OWNER_CONFIG,
          useValue: Object.freeze({
            ...(input.teacherMediaAssociationOwner ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        TeacherMediaAssociationOwnerServiceAuthGuard,
        {
          provide: TEACHER_ASSISTANT_QUERY_OWNER_CONFIG,
          useValue: Object.freeze({
            ...(input.teacherAssistantQueryOwner ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        TeacherAssistantQueryOwnerServiceAuthGuard,
        {
          provide: PARENT_COMMUNICATION_EXTENSION_CONFIG,
          useValue: Object.freeze({
            ...(input.parentCommunicationExtension ?? {
              serviceAuth: input.parentContextPresenter.serviceAuth,
            }),
          }),
        },
        ParentCommunicationExtensionServiceAuthGuard,
        {
          provide: FAMILY_SHARING_PRIVATE_CONFIG,
          useValue: Object.freeze({ ...input.familySharingPrivate }),
        },
        FamilySharingPrivateServiceAuthGuard,
      ],
    };
  }
}
