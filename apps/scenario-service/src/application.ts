import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import {
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

export type ScenarioServiceApplication = Readonly<{
  app: NestExpressApplication;
  config: ScenarioServiceConfig;
  logger: ScenarioStructuredLogger;
}>;

export async function createScenarioServiceApplication(input?: {
  config?: ScenarioServiceConfig;
  logSink?: ScenarioStructuredLogSink;
}): Promise<ScenarioServiceApplication> {
  const config = input?.config ?? loadScenarioServiceConfig();
  const logger = new ScenarioStructuredLogger(input?.logSink);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    bodyParser: false,
    logger: false,
  });

  const requestLogging = new RequestLoggingMiddleware(logger);
  app.use(requestLogging.use.bind(requestLogging));
  app.useBodyParser("json", { limit: config.bodyLimitBytes });
  app.useBodyParser("urlencoded", {
    extended: false,
    limit: config.bodyLimitBytes,
  });
  app.useGlobalInterceptors(
    new RequestTimeoutInterceptor(config.requestTimeoutMs),
  );
  app.useGlobalFilters(new SafeExceptionFilter(logger));
  await app.init();

  return { app, config, logger };
}
