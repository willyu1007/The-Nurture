import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runWithLocalEnvironment } from "./run-with-local-env.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

test("loads runtime env before .env.local before .env", async (context) => {
  const cwd = await mkdtemp(path.join(tmpdir(), "nurture-local-env-"));
  context.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(path.join(cwd, ".env.local"), "LOCAL_ONLY=local\nSHARED=local\n");
  await writeFile(path.join(cwd, ".env"), "BASE_ONLY=base\nSHARED=base\n");

  const probe = "process.stdout.write(JSON.stringify({local:process.env.LOCAL_ONLY,base:process.env.BASE_ONLY,shared:process.env.SHARED}))";
  const result = runWithLocalEnvironment([process.execPath, "-e", probe], {
    cwd,
    env: { PATH: process.env.PATH, SHARED: "runtime" },
    stdio: "pipe",
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), { local: "local", base: "base", shared: "runtime" });
});

test("rejects an empty command", () => {
  assert.throws(() => runWithLocalEnvironment([], { cwd: scriptDirectory }), /Expected a command/);
});
