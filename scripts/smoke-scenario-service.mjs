#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const port = await reservePort();
const child = spawn(
  process.execPath,
  [path.join(repoRoot, "apps/scenario-service/dist/main.js")],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      APP_ENV: "dev",
      SERVICE_NAME: "the-nurture",
      PORT: String(port),
      NURTURE_BINDING_EVIDENCE_KEY: "",
      NURTURE_INTERNAL_SERVICE_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let stdout = "";
let stderr = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdout += chunk;
});
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl, child);
  const health = await fetch(`${baseUrl}/health`);
  await assertResponse(health, 200, { ok: true });

  const disabled = await fetch(
    `${baseUrl}/internal/nurture/scenario-binding/authorize`,
    { method: "POST" },
  );
  await assertResponse(disabled, 503, {
    error: "binding_owner_disabled",
  });

  const legacy = await fetch(
    `${baseUrl}/internal/nurture/activation/user-attention/resolve`,
    { method: "POST" },
  );
  await assertResponse(legacy, 404, { error: "not_found" });

  process.stdout.write(
    `[ok] scenario-service build/start/health port=${port} binding-owner=disabled legacy-route=absent\n`,
  );
} catch (error) {
  process.stderr.write(`${String(error)}\n${stdout}${stderr}`);
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function reservePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Unable to reserve a scenario-service smoke port.");
  }
  const selected = address.port;
  server.close();
  await once(server, "close");
  return selected;
}

async function waitForHealth(baseUrl, processHandle) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(
        `Scenario service exited before health check: ${processHandle.exitCode}`,
      );
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.status === 200) return;
    } catch {
      // The listener may not be ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for scenario-service health.");
}

async function assertResponse(response, expectedStatus, expectedBody) {
  const body = await response.json();
  if (
    response.status !== expectedStatus ||
    JSON.stringify(body) !== JSON.stringify(expectedBody)
  ) {
    throw new Error(
      `Unexpected response: ${response.status} ${JSON.stringify(body)}`,
    );
  }
}
