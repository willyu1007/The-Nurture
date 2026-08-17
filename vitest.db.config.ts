import { defineConfig } from "vitest/config";
import { workspaceResolve } from "./vitest.workspace.resolve.js";

export default defineConfig({
  resolve: workspaceResolve,
  test: {
    include: ["packages/nurture-db/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/x5-joint-acceptance.integration.test.ts",
      "**/t009-family-growth-joint.integration.test.ts",
      "**/t007-institution-knowledge-e8-joint.integration.test.ts",
      "**/t007-workflow-run-settlement-joint.integration.test.ts",
      "**/t010-family-sharing-joint.integration.test.ts",
      "**/t014-host-runtime-joint.integration.test.ts",
    ],
    // The suite shares one disposable database and the command kernel runs
    // Serializable transactions; parallel files trigger SSI false conflicts.
    fileParallelism: false,
    testTimeout: 20000,
    setupFiles: ["dotenv/config"],
  },
});
