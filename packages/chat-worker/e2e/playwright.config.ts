import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
