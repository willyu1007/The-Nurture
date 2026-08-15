import { readFileSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeSecretNames = [
  "DATABASE_URL",
  "NURTURE_BINDING_EVIDENCE_KEY",
  "NURTURE_INTERNAL_SERVICE_TOKEN",
  "NURTURE_HARNESS_INTEGRITY_KEY",
  "NURTURE_PROTECTED_CONTENT_KEY",
  "FAMILY_GROWTH_EVENTS_SERVICE_TOKEN",
  "FAMILY_GROWTH_RENDITION_SERVICE_TOKEN",
  "FAMILY_GROWTH_RENDITION_SERVICE_TOKEN_PREVIOUS",
] as const;

/** Resolves only explicitly allowlisted *_FILE variables before configuration
 * is parsed. Secret values never appear in Compose metadata or log output. */
export function loadScenarioServiceRuntimeSecrets(
  env: NodeJS.ProcessEnv = process.env,
): void {
  for (const name of runtimeSecretNames) {
    loadSecretFile(env, name);
  }
}

function loadSecretFile(
  env: NodeJS.ProcessEnv,
  name: (typeof runtimeSecretNames)[number],
): void {
  const fileVariable = `${name}_FILE`;
  const filePath = env[fileVariable];
  if (!filePath) return;
  if (env[name]) throw invalidSecretConfiguration(name);
  if (!isAbsolute(filePath)) throw invalidSecretConfiguration(fileVariable);

  const stat = statSync(filePath);
  if (!stat.isFile() || stat.size === 0 || stat.size > 65_536) {
    throw invalidSecretConfiguration(fileVariable);
  }
  const value = readFileSync(filePath, "utf8").replace(/\r?\n$/, "");
  if (!value || value.includes("\0")) {
    throw invalidSecretConfiguration(fileVariable);
  }
  env[name] = value;
  delete env[fileVariable];
}

function invalidSecretConfiguration(field: string): Error {
  return new Error(`Invalid scenario-service secret configuration: ${field}`);
}

async function runConfiguredCommand(): Promise<void> {
  loadScenarioServiceRuntimeSecrets();
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    throw new Error("No runtime-secret command was provided.");
  }
  const child = spawn(command, args, {
    env: process.env,
    stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(signal, () => child.kill(signal));
  }
  await new Promise<void>((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("exit", (code, signal) => {
      if (signal) {
        rejectPromise(new Error(`Runtime-secret command exited on ${signal}.`));
        return;
      }
      if (code === 0) resolvePromise();
      else rejectPromise(
        new Error(`Runtime-secret command exited with code ${code ?? "unknown"}.`),
      );
    });
  });
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  runConfiguredCommand().catch((error: unknown) => {
    process.stderr.write(
      `[runtime-secrets] ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
