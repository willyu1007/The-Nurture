import "dotenv/config";
import { createNurtureApp } from "./app.js";
import {
  assertDevHostEnvironment,
  DEV_HOST_BIND_ADDRESS,
  loadDevHostPort,
} from "./dev-host-guard.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  assertDevHostEnvironment(process.env.APP_ENV);
  const port = loadDevHostPort(process.env.DEV_HOST_PORT);
  const app = createNurtureApp({
    ...(process.env.NURTURE_BINDING_EVIDENCE_KEY
      ? { bindingEvidenceKey: process.env.NURTURE_BINDING_EVIDENCE_KEY }
      : {}),
  });
  const server = buildServer(app, {
    internalServiceToken: process.env.NURTURE_INTERNAL_SERVICE_TOKEN,
  });
  app.dispatcher.start();
  await server.listen({ port, host: DEV_HOST_BIND_ADDRESS });
  // eslint-disable-next-line no-console
  console.log(`[the-nurture] dev host listening on :${port} (step dispatcher running)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
