import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  test: {
    include: [
      "packages/nurture-db/tests/x5-joint-acceptance.integration.test.ts",
      "packages/nurture-db/tests/t009-family-growth-joint.integration.test.ts",
      "packages/nurture-db/tests/t007-institution-knowledge-e8-joint.integration.test.ts",
      "packages/nurture-db/tests/t007-workflow-run-settlement-joint.integration.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
    // The joint files share the two disposable databases and use serializable
    // transactions; parallel files trigger spurious SSI aborts (same rationale
    // as vitest.db.config.ts).
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    setupFiles: ["dotenv/config"],
  },
});
