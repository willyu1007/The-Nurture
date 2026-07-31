export type ScenarioServiceEnvironment = "dev" | "staging" | "prod";

export type ScenarioServiceConfig = Readonly<{
  appEnv: ScenarioServiceEnvironment;
  serviceName: string;
  port: number;
  bodyLimitBytes: number;
  requestTimeoutMs: number;
}>;

const DEFAULT_SERVICE_NAME = "the-nurture";
const DEFAULT_PORT = 8000;
const BODY_LIMIT_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 5_000;
const serviceNamePattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function loadScenarioServiceConfig(
  env: NodeJS.ProcessEnv = process.env,
): ScenarioServiceConfig {
  const appEnv = parseEnvironment(env.APP_ENV);
  const serviceName = env.SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
  if (!serviceNamePattern.test(serviceName)) {
    throw invalidConfiguration("SERVICE_NAME");
  }

  return Object.freeze({
    appEnv,
    serviceName,
    port: parsePort(env.PORT),
    bodyLimitBytes: BODY_LIMIT_BYTES,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  });
}

function parseEnvironment(value: string | undefined): ScenarioServiceEnvironment {
  const candidate = value ?? "dev";
  if (candidate !== "dev" && candidate !== "staging" && candidate !== "prod") {
    throw invalidConfiguration("APP_ENV");
  }
  return candidate;
}

function parsePort(value: string | undefined): number {
  const candidate = value ?? String(DEFAULT_PORT);
  if (!/^[0-9]+$/.test(candidate)) {
    throw invalidConfiguration("PORT");
  }
  const parsed = Number(candidate);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw invalidConfiguration("PORT");
  }
  return parsed;
}

function invalidConfiguration(field: string): Error {
  return new Error(`Invalid scenario-service configuration: ${field}`);
}
