import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.db.e2e.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
