import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadScenarioServiceRuntimeSecrets } from "../src/runtime-secrets.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("scenario-service runtime secret files", () => {
  it("loads only allowlisted absolute secret files and removes the file variable", () => {
    const directory = mkdtempSync(join(tmpdir(), "nurture-runtime-secrets-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "NURTURE_INTERNAL_SERVICE_TOKEN");
    writeFileSync(path, `${"x".repeat(32)}\n`);
    const env: NodeJS.ProcessEnv = {
      NURTURE_INTERNAL_SERVICE_TOKEN_FILE: path,
      UNRELATED_SECRET_FILE: path,
    };

    loadScenarioServiceRuntimeSecrets(env);

    expect(env.NURTURE_INTERNAL_SERVICE_TOKEN).toBe("x".repeat(32));
    expect(env.NURTURE_INTERNAL_SERVICE_TOKEN_FILE).toBeUndefined();
    expect(env.UNRELATED_SECRET_FILE).toBe(path);
  });

  it("fails closed when direct and file-backed values are both configured", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://direct.invalid/nurture",
      DATABASE_URL_FILE: "/run/secrets/DATABASE_URL",
    };

    expect(() => loadScenarioServiceRuntimeSecrets(env)).toThrow(
      /Invalid scenario-service secret configuration: DATABASE_URL/,
    );
  });
});
