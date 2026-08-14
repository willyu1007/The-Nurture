import "reflect-metadata";
import type { Server } from "node:http";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  createBindingOwnerRuntime,
  type BindingOwnerRuntime,
} from "./binding-owner-runtime.js";
import {
  createHarnessRuntime,
  type HarnessRuntime,
} from "./harness-runtime.js";
import type { ScenarioBindingOwnerAuthorizer } from "@the-nurture/scenario/binding-owner";
import {
  loadBindingOwnerServiceAuth,
  loadScenarioServiceConfig,
  type ScenarioServiceConfig,
} from "./config.js";
import { RequestLoggingMiddleware } from "./request-logging.middleware.js";
import { RequestTimeoutInterceptor } from "./request-timeout.interceptor.js";
import { SafeExceptionFilter } from "./safe-exception.filter.js";
import {
  ScenarioStructuredLogger,
  type ScenarioStructuredLogSink,
} from "./structured-logger.js";
import {
  createFamilyGrowthRenditionRuntime,
  type FamilyGrowthRenditionRuntime,
} from "./family-growth-runtime.js";
import type { TeacherReleaseOwnerComposition } from "./teacher-release-owner-composition.js";
import { createTeacherReleaseOwnerComposition } from "./teacher-release-owner-runtime.js";
import {
  createDisabledFamilySharingPrivateRuntime,
  type FamilySharingPrivateRuntime,
} from "./family-sharing-private-runtime.js";
import type { ParentContextPresenterComposition } from "./parent-context-presenter-composition.js";
import {
  createParentContextPresenterComposition,
  type ParentContextPresenterOwnerBindingV1,
} from "./parent-context-presenter-runtime.js";
import type { ParentCommunicationOwnerComposition } from "./parent-communication-owner-composition.js";
import {
  createParentCommunicationOwnerComposition,
  type ParentCommunicationOwnerBindingV1,
} from "./parent-communication-owner-runtime.js";
import type { DirectorPresenterComposition } from "./director-presenter-composition.js";
import {
  createDirectorPresenterComposition,
  type DirectorPresenterOwnerBindingV1,
} from "./director-presenter-runtime.js";
import type { TeacherClassStreamComposition } from "./teacher-class-stream-composition.js";
import {
  createTeacherClassStreamComposition,
  type TeacherClassStreamOwnerBindingV1,
} from "./teacher-class-stream-runtime.js";
import type { TeacherOrganizationOwnerComposition } from "./teacher-organization-owner-composition.js";
import {
  createTeacherOrganizationOwnerComposition,
  type TeacherOrganizationOwnerBindingV1,
} from "./teacher-organization-owner-runtime.js";
import type { TeacherCommunicationOwnerComposition } from "./teacher-communication-owner-composition.js";
import {
  createTeacherCommunicationOwnerComposition,
  type TeacherCommunicationOwnerBindingV1,
} from "./teacher-communication-owner-runtime.js";
import type { TeacherMediaAssociationOwnerComposition } from "./teacher-media-association-owner-composition.js";
import {
  createTeacherMediaAssociationOwnerComposition,
  type TeacherMediaAssociationOwnerBindingV1,
} from "./teacher-media-association-owner-runtime.js";

export type ScenarioServiceApplication = Readonly<{
  app: NestExpressApplication;
  config: ScenarioServiceConfig;
  logger: ScenarioStructuredLogger;
  familyGrowthRendition: FamilyGrowthRenditionRuntime;
}>;

export async function createScenarioServiceApplication(input?: {
  config?: ScenarioServiceConfig;
  logSink?: ScenarioStructuredLogSink;
  bindingOwnerAuthorizer?: ScenarioBindingOwnerAuthorizer;
  bindingOwnerRuntime?: BindingOwnerRuntime;
  bindingOwnerServiceAuth?: BindingOwnerServiceAuth;
  harnessRuntime?: HarnessRuntime;
  familyGrowthRendition?: FamilyGrowthRenditionRuntime;
  teacherReleaseOwnerComposition?: TeacherReleaseOwnerComposition;
  parentContextPresenterComposition?: ParentContextPresenterComposition;
  parentContextPresenterOwnerBinding?: ParentContextPresenterOwnerBindingV1;
  parentCommunicationOwnerComposition?: ParentCommunicationOwnerComposition;
  parentCommunicationOwnerBinding?: ParentCommunicationOwnerBindingV1;
  directorPresenterComposition?: DirectorPresenterComposition;
  directorPresenterOwnerBinding?: DirectorPresenterOwnerBindingV1;
  teacherClassStreamComposition?: TeacherClassStreamComposition;
  teacherClassStreamOwnerBinding?: TeacherClassStreamOwnerBindingV1;
  teacherOrganizationOwnerComposition?: TeacherOrganizationOwnerComposition;
  teacherOrganizationOwnerBinding?: TeacherOrganizationOwnerBindingV1;
  teacherCommunicationOwnerComposition?: TeacherCommunicationOwnerComposition;
  teacherCommunicationOwnerBinding?: TeacherCommunicationOwnerBindingV1;
  teacherMediaAssociationOwnerComposition?: TeacherMediaAssociationOwnerComposition;
  teacherMediaAssociationOwnerBinding?: TeacherMediaAssociationOwnerBindingV1;
  familySharingPrivateRuntime?: FamilySharingPrivateRuntime;
}): Promise<ScenarioServiceApplication> {
  const config = input?.config ?? loadScenarioServiceConfig();
  const logger = new ScenarioStructuredLogger(input?.logSink);
  const bindingOwnerServiceAuth =
    input?.bindingOwnerServiceAuth ?? loadBindingOwnerServiceAuth();
  const bindingOwnerRuntime =
    input?.bindingOwnerRuntime ??
    createBindingOwnerRuntime({
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.bindingOwnerAuthorizer
        ? { authorizer: input.bindingOwnerAuthorizer }
        : {}),
    });
  const harnessRuntime =
    input?.harnessRuntime ??
    createHarnessRuntime({
      serviceAuth: bindingOwnerServiceAuth,
      institutionBusinessCommunicationReadEnabled:
        config.institutionBusinessCommunicationReadEnabled,
    });
  const familyGrowthRendition =
    input?.familyGrowthRendition ?? createFamilyGrowthRenditionRuntime();
  const teacherReleaseOwnerComposition =
    input?.teacherReleaseOwnerComposition ??
    createTeacherReleaseOwnerComposition({
      enabled: config.teacherReleaseOwnerEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      harnessRuntime,
    });
  const parentContextPresenterComposition =
    input?.parentContextPresenterComposition
    ?? createParentContextPresenterComposition({
      enabled: config.parentContextPresenterEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.parentContextPresenterOwnerBinding
        ? { ownerBinding: input.parentContextPresenterOwnerBinding }
        : {}),
    });
  const parentCommunicationOwnerComposition =
    input?.parentCommunicationOwnerComposition
    ?? createParentCommunicationOwnerComposition({
      enabled: config.parentCommunicationOwnerEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.parentCommunicationOwnerBinding
        ? { ownerBinding: input.parentCommunicationOwnerBinding }
        : {}),
    });
  const directorPresenterComposition =
    input?.directorPresenterComposition
    ?? createDirectorPresenterComposition({
      enabled: config.directorPresenterEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.directorPresenterOwnerBinding
        ? { ownerBinding: input.directorPresenterOwnerBinding }
        : {}),
    });
  const teacherClassStreamComposition =
    input?.teacherClassStreamComposition
    ?? createTeacherClassStreamComposition({
      enabled: config.teacherClassStreamPresenterEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.teacherClassStreamOwnerBinding
        ? { ownerBinding: input.teacherClassStreamOwnerBinding }
        : {}),
    });
  const teacherOrganizationOwnerComposition =
    input?.teacherOrganizationOwnerComposition
    ?? createTeacherOrganizationOwnerComposition({
      enabled: config.teacherOrganizationOwnerEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.teacherOrganizationOwnerBinding
        ? { ownerBinding: input.teacherOrganizationOwnerBinding }
        : {}),
    });
  const teacherCommunicationOwnerComposition =
    input?.teacherCommunicationOwnerComposition
    ?? createTeacherCommunicationOwnerComposition({
      enabled: config.teacherCommunicationOwnerEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.teacherCommunicationOwnerBinding
        ? { ownerBinding: input.teacherCommunicationOwnerBinding }
        : {}),
    });
  const teacherMediaAssociationOwnerComposition =
    input?.teacherMediaAssociationOwnerComposition
    ?? createTeacherMediaAssociationOwnerComposition({
      enabled: config.teacherMediaAssociationOwnerEnabled,
      serviceAuth: bindingOwnerServiceAuth,
      ...(input?.teacherMediaAssociationOwnerBinding
        ? { ownerBinding: input.teacherMediaAssociationOwnerBinding }
        : {}),
    });
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register({
      logger,
      bindingOwner: {
        runtime: bindingOwnerRuntime,
        serviceAuth: bindingOwnerServiceAuth,
      },
      harness: {
        runtime: harnessRuntime,
        serviceAuth: bindingOwnerServiceAuth,
      },
      familyGrowthRendition,
      teacherReleaseOwner: {
        composition: teacherReleaseOwnerComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      parentContextPresenter: {
        composition: parentContextPresenterComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      parentCommunicationOwner: {
        composition: parentCommunicationOwnerComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      directorPresenter: {
        composition: directorPresenterComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      teacherClassStream: {
        composition: teacherClassStreamComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      teacherOrganizationOwner: {
        composition: teacherOrganizationOwnerComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      teacherCommunicationOwner: {
        composition: teacherCommunicationOwnerComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      teacherMediaAssociationOwner: {
        composition: teacherMediaAssociationOwnerComposition,
        serviceAuth: bindingOwnerServiceAuth,
      },
      familySharingPrivate: {
        runtime:
          input?.familySharingPrivateRuntime ??
          createDisabledFamilySharingPrivateRuntime(),
        serviceAuth: bindingOwnerServiceAuth,
      },
    }),
    {
      abortOnError: false,
      bodyParser: false,
      logger: false,
    },
  );

  app.disable("x-powered-by");
  const requestLogging = new RequestLoggingMiddleware(logger);
  app.use(requestLogging.use.bind(requestLogging));
  app.useBodyParser("json", { limit: config.bodyLimitBytes });
  app.useGlobalInterceptors(
    new RequestTimeoutInterceptor(config.requestTimeoutMs),
  );
  app.useGlobalFilters(new SafeExceptionFilter(logger));
  await app.init();

  const server = app.getHttpServer() as Server;
  server.requestTimeout = config.requestTimeoutMs;
  server.headersTimeout = config.requestTimeoutMs;

  return { app, config, logger, familyGrowthRendition };
}
