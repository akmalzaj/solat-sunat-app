import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm.cmd run preview",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH ||
            (process.platform === "win32" &&
            existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : undefined),
        },
      },
    },
  ],
});
