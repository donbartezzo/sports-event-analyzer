// CommonJS Playwright config to avoid ESM loader issues in environments running older Node.
// Ensure TS test files are loadable by Node via esbuild-register.
try {
  require('esbuild-register/dist/node').register({ target: 'es2020' });
} catch (_) {
  // If not installed, Playwright may still handle TS; we add as safety net.
}
// Prefer using Node >= 18.19.0. This file is a compatibility fallback.

const { devices } = require("@playwright/test");

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts$/,
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
    env: { E2E: '1', NODE_ENV: process.env.CI ? 'production' : 'development' },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
};
