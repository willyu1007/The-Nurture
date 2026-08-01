import { describe, expect, it } from "vitest";
import {
  loadBindingOwnerServiceAuth,
  loadScenarioServiceConfig,
} from "../src/config.js";

describe("scenario-service configuration", () => {
  it("loads env-contract defaults without owner secrets", () => {
    expect(loadScenarioServiceConfig({})).toEqual({
      appEnv: "dev",
      serviceName: "the-nurture",
      port: 8000,
      bodyLimitBytes: 65_536,
      requestTimeoutMs: 5_000,
      institutionBusinessCommunicationReadEnabled: false,
    });
  });

  it.each([
    [{ APP_ENV: "test" }, "APP_ENV"],
    [{ SERVICE_NAME: "The Nurture" }, "SERVICE_NAME"],
    [{ PORT: "0" }, "PORT"],
    [{ PORT: "65536" }, "PORT"],
    [{ PORT: "not-a-port" }, "PORT"],
    [
      { NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED: "TRUE" },
      "NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED",
    ],
  ])("fails fast for invalid non-secret config", (env, field) => {
    expect(() => loadScenarioServiceConfig(env)).toThrow(
      `Invalid scenario-service configuration: ${field}`,
    );
  });

  it("loads the protected Admin owner-read gate only from an exact true literal", () => {
    expect(
      loadScenarioServiceConfig({
        NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED: "true",
      }).institutionBusinessCommunicationReadEnabled,
    ).toBe(true);
  });

  it("does not expose optional owner secrets through the config object", () => {
    const config = loadScenarioServiceConfig({
      NURTURE_BINDING_EVIDENCE_KEY: "evidence-secret-marker",
      NURTURE_INTERNAL_SERVICE_TOKEN: "service-secret-marker",
    });
    expect(JSON.stringify(config)).not.toContain("secret-marker");
  });

  it("loads service auth separately without exposing the token", () => {
    const serviceAuth = loadBindingOwnerServiceAuth({
      NURTURE_INTERNAL_SERVICE_TOKEN: "service-secret-marker",
    });

    expect(serviceAuth.configured).toBe(true);
    expect(
      serviceAuth.bearerAuthorized("Bearer service-secret-marker"),
    ).toBe(true);
    expect(JSON.stringify(serviceAuth)).not.toContain("secret-marker");
  });
});
