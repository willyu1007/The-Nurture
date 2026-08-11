import { defineConfig } from "vitest/config";
import { workspaceResolve } from "../../vitest.workspace.resolve.js";

export default defineConfig({
  resolve: workspaceResolve,
  test: {
    include: ["tests/**/*.db.e2e.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
