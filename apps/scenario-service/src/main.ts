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
      const prisma = productionAssembly.prisma ?? createPrismaClient();
      const workerOwnsPrisma = productionAssembly.prisma === undefined;
      const worker = new FamilyGrowthDeliveryWorker({
        outbox: new PrismaFamilyGrowthOutboxPort(prisma),
        transport: createFamilyGrowthHttpTransport({ config: deliveryConfig }),
        log: (event, fields) =>
          logger.familyGrowthDelivery(event, fields),
      });
      worker.start();
      app.getHttpServer().once("close", () => {
        worker.stop();
        if (workerOwnsPrisma) void prisma.$disconnect();
      });
    }
    app.getHttpServer().once("close", () => {
      void productionAssembly.disconnect();
    });
  } catch (error) {
    await productionAssembly.disconnect();
    throw error;
  }
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({
      schema: "nurture_scenario_service_log_v1",
      event: "scenario_service_startup_failed",
      reason: error instanceof Error ? error.message : String(error),
    })}\n`,
  );
  process.exitCode = 1;
});
