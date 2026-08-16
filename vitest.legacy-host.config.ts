import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  test: {
    include: ["apps/backend/**/*.e2e.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 20000,
    setupFiles: ["dotenv/config"],
    fileParallelism: false,
  },
});
