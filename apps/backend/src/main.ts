import "dotenv/config";
import { createNurtureApp } from "./app.js";
import { assertDevHostEnvironment, DEV_HOST_BIND_ADDRESS } from "./dev-host-guard.js";
import { buildServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3001);

async function main(): Promise<void> {
  assertDevHostEnvironment(process.env.APP_ENV);
  const app = createNurtureApp();
  const server = buildServer(app);
  app.dispatcher.start();
  await server.listen({ port: PORT, host: DEV_HOST_BIND_ADDRESS });
  // eslint-disable-next-line no-console
  console.log(`[the-nurture] dev host listening on :${PORT} (step dispatcher running)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
