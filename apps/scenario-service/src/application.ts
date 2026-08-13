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
