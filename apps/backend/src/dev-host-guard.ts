const ALLOWED_DEV_HOST_ENVIRONMENTS = new Set(["dev", "test"]);

export const DEV_HOST_BIND_ADDRESS = "127.0.0.1";

/**
 * The backend app is an unauthenticated local/test harness, never a deployable
 * product service. Fail before constructing database clients outside dev/test.
 */
export const assertDevHostEnvironment = (value: string | undefined): "dev" | "test" => {
  const environment = (value ?? "dev").trim().toLowerCase();
  if (!ALLOWED_DEV_HOST_ENVIRONMENTS.has(environment)) {
    throw new Error(`The Nurture dev host cannot run with APP_ENV=${environment || "<empty>"}`);
  }
  return environment as "dev" | "test";
};
