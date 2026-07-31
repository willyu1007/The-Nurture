import { describe, expect, it } from "vitest";
import {
  assertDevHostEnvironment,
  DEV_HOST_BIND_ADDRESS,
  loadDevHostPort,
} from "../src/dev-host-guard.js";

describe("dev-host startup guard", () => {
  it("binds only to the loopback interface", () => {
    expect(DEV_HOST_BIND_ADDRESS).toBe("127.0.0.1");
  });

  it("allows only dev and test environments", () => {
    expect(assertDevHostEnvironment(undefined)).toBe("dev");
    expect(assertDevHostEnvironment("DEV")).toBe("dev");
    expect(assertDevHostEnvironment("test")).toBe("test");
    expect(() => assertDevHostEnvironment("staging")).toThrow(/cannot run/);
    expect(() => assertDevHostEnvironment("production")).toThrow(/cannot run/);
  });

  it("uses only the dedicated, bounded dev-host port", () => {
    expect(loadDevHostPort(undefined)).toBe(3001);
    expect(loadDevHostPort("3200")).toBe(3200);
    for (const invalid of ["", "0", "65536", "not-a-port", "3001.5"]) {
      expect(() => loadDevHostPort(invalid)).toThrow(/DEV_HOST_PORT/);
    }
  });
});
