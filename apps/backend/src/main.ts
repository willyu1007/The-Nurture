import "dotenv/config";
import { createNurtureApp } from "./app.js";
import { buildServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3001);

async function main(): Promise<void> {
  const app = createNurtureApp();
  const server = buildServer(app);
  app.dispatcher.start();
  await server.listen({ port: PORT, host: "0.0.0.0" });
  // eslint-disable-next-line no-console
  console.log(`[the-nurture] dev host listening on :${PORT} (step dispatcher running)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
