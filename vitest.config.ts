import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  test: {
    include: ["packages/nurture-scenario/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
