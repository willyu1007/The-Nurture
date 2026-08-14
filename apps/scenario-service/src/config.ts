import {
  createBindingOwnerServiceAuth,
  type BindingOwnerServiceAuth,
} from "./binding-owner-service-auth.js";

export type ScenarioServiceEnvironment = "dev" | "staging" | "prod";

export type ScenarioServiceConfig = Readonly<{
  appEnv: ScenarioServiceEnvironment;
  serviceName: string;
  port: number;
  bodyLimitBytes: number;
  requestTimeoutMs: number;
  institutionBusinessCommunicationReadEnabled: boolean;
  teacherReleaseOwnerEnabled: boolean;
  parentContextPresenterEnabled: boolean;
  parentCommunicationOwnerEnabled: boolean;
  directorPresenterEnabled: boolean;
  teacherClassStreamPresenterEnabled: boolean;
  teacherOrganizationOwnerEnabled: boolean;
  teacherCommunicationOwnerEnabled: boolean;
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
    institutionBusinessCommunicationReadEnabled: parseBoolean(
      env.NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED,
      "NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED",
    ),
    teacherReleaseOwnerEnabled: parseBoolean(
      env.NURTURE_TEACHER_RELEASE_OWNER_ENABLED,
      "NURTURE_TEACHER_RELEASE_OWNER_ENABLED",
    ),
    parentContextPresenterEnabled: parseBoolean(
      env.NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED,
      "NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED",
    ),
    parentCommunicationOwnerEnabled: parseBoolean(
      env.NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED,
      "NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED",
    ),
    directorPresenterEnabled: parseBoolean(
      env.NURTURE_DIRECTOR_PRESENTER_ENABLED,
      "NURTURE_DIRECTOR_PRESENTER_ENABLED",
    ),
    teacherClassStreamPresenterEnabled: parseBoolean(
      env.NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED,
      "NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED",
    ),
    teacherOrganizationOwnerEnabled: parseBoolean(
      env.NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED,
      "NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED",
    ),
    teacherCommunicationOwnerEnabled: parseBoolean(
      env.NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED,
      "NURTURE_TEACHER_COMMUNICATION_OWNER_ENABLED",
    ),
  });
}

export function loadBindingOwnerServiceAuth(
  env: NodeJS.ProcessEnv = process.env,
): BindingOwnerServiceAuth {
  return createBindingOwnerServiceAuth(
    env.NURTURE_INTERNAL_SERVICE_TOKEN,
  );
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

function parseBoolean(value: string | undefined, field: string): boolean {
  if (value === undefined || value === "false") return false;
  if (value === "true") return true;
  throw invalidConfiguration(field);
}

function invalidConfiguration(field: string): Error {
  return new Error(`Invalid scenario-service configuration: ${field}`);
}
