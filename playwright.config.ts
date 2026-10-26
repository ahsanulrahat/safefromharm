import { defineConfig, devices } from "@playwright/test";
import { requirePlaywrightDatabaseTarget } from "./src/lib/playwright-target";

// The full-flow spec creates and removes participant rows. Require a
// deliberately supplied isolated database before starting either app or tests.
process.env.DATABASE_URL = requirePlaywrightDatabaseTarget(
  process.env.PLAYWRIGHT_E2E_DATABASE_URL,
  process.env.PLAYWRIGHT_E2E_DATABASE_HOST,
);
if (process.env.PLAYWRIGHT_E2E_DIRECT_URL) {
  process.env.DIRECT_URL = process.env.PLAYWRIGHT_E2E_DIRECT_URL;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1",
        url: "http://127.0.0.1:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
