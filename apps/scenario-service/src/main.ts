import { createScenarioServiceApplication } from "./application.js";

async function bootstrap(): Promise<void> {
  const { app, config, logger } = await createScenarioServiceApplication();
  app.enableShutdownHooks();
  await app.listen(config.port, "0.0.0.0");
  logger.serviceStarted({
    appEnv: config.appEnv,
    serviceName: config.serviceName,
    port: config.port,
  });
}

bootstrap().catch(() => {
  process.stderr.write(
    `${JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_startup_failed",
    })}\n`,
  );
  process.exitCode = 1;
});
