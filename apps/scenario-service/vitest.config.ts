import { defineConfig } from "vitest/config";
import { workspaceResolve } from "../../vitest.workspace.resolve.js";

export default defineConfig({
  resolve: workspaceResolve,
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.db.e2e.test.ts",
    ],
  },
});
