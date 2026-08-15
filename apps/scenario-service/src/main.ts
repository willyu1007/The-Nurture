import { createPrismaClient, PrismaFamilyGrowthOutboxPort } from "@the-nurture/db";
import { createScenarioServiceApplication } from "./application.js";
import {
  createFamilyGrowthHttpTransport,
  FamilyGrowthDeliveryWorker,
} from "./family-growth-delivery.worker.js";
import { loadFamilyGrowthDeliveryConfig } from "./family-growth-runtime.js";
import {
  loadBindingOwnerServiceAuth,
  loadScenarioServiceConfig,
} from "./config.js";
import { createScenarioServiceProductionAssembly } from "./production-assembly.js";
import { loadScenarioServiceRuntimeSecrets } from "./runtime-secrets.js";

async function bootstrap(): Promise<void> {
  loadScenarioServiceRuntimeSecrets();
  const config = loadScenarioServiceConfig();
  const bindingOwnerServiceAuth = loadBindingOwnerServiceAuth();
  const productionAssembly = createScenarioServiceProductionAssembly({
    config,
    serviceAuth: bindingOwnerServiceAuth,
  });

  try {
    const { app, logger } = await createScenarioServiceApplication({
      config,
      bindingOwnerServiceAuth,
      ...productionAssembly.bindings,
    });
    app.enableShutdownHooks();
    app.getHttpServer().once("close", () => {
      void productionAssembly.disconnect();
    });
    await app.listen(config.port, "0.0.0.0");
    logger.serviceStarted({
      appEnv: config.appEnv,
      serviceName: config.serviceName,
      port: config.port,
    });

    // T-009 I3b: the outbox delivery worker runs only when both delivery keys
    // are configured (family_growth_transport@1.0.0 §1 — absence = off).
    const deliveryConfig = loadFamilyGrowthDeliveryConfig();
    if (deliveryConfig) {
      const prisma = createPrismaClient();
      const worker = new FamilyGrowthDeliveryWorker({
        outbox: new PrismaFamilyGrowthOutboxPort(prisma),
        transport: createFamilyGrowthHttpTransport({ config: deliveryConfig }),
        log: (event, fields) =>
          logger.familyGrowthDelivery(
            event as Parameters<typeof logger.familyGrowthDelivery>[0],
            Object.fromEntries(
              Object.entries(fields).filter(
                (entry): entry is [string, string | number] =>
                  typeof entry[1] === "string" || typeof entry[1] === "number",
              ),
            ),
          ),
      });
      worker.start();
      app.getHttpServer().once("close", () => {
        worker.stop();
        void prisma.$disconnect();
      });
    }
  } catch (error) {
    await productionAssembly.disconnect();
    throw error;
  }
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
