import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Integration tests run against a live local Supabase stack
 * (`pnpm db:start && pnpm db:reset`). They are skipped automatically
 * when SUPABASE_TEST_URL is not set — see tests/integration/helpers.ts.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Integration tests share one database; run serially for determinism.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
