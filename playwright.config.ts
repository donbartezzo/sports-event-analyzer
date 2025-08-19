import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Use dedicated e2e scripts to enforce stable port/host
    // In CI prefer a built preview server for faster and more reliable startup
    command: process.env.CI ? "npm run preview:e2e" : "npm run dev:e2e",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: process.env.CI ? 120_000 : 90_000,
    env: { E2E: "1", NODE_ENV: process.env.CI ? "production" : "development" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
