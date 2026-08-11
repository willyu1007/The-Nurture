import { defineConfig } from "vitest/config";
import { workspaceResolve } from "./vitest.workspace.resolve.js";

export default defineConfig({
  resolve: workspaceResolve,
  test: {
    include: ["packages/nurture-scenario/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
