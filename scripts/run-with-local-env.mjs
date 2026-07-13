#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export function loadLocalEnvironment(cwd = process.cwd(), processEnv = process.env) {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(cwd, filename);
    if (existsSync(envPath)) config({ path: envPath, processEnv, override: false });
  }
  return processEnv;
}

export function runWithLocalEnvironment(argv, options = {}) {
  const [command, ...args] = argv;
  if (!command) throw new Error("Expected a command after run-with-local-env.mjs");
  const cwd = options.cwd ?? process.cwd();
  const env = loadLocalEnvironment(cwd, { ...(options.env ?? process.env) });
  const executable = process.platform === "win32" && command === "pnpm" ? "pnpm.cmd" : command;
  const result = spawnSync(executable, args, { cwd, env, stdio: options.stdio ?? "inherit", encoding: options.encoding });
  if (result.error) throw result.error;
  return result;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = runWithLocalEnvironment(process.argv.slice(2));
    process.exitCode = result.status ?? 1;
  } catch (error) {
    process.stderr.write(`[run-with-local-env] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
