const { defineConfig } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const localPhp = path.join(__dirname, ".tools/php/php.exe");
const php =
  process.env.PHP_BINARY || (fs.existsSync(localPhp) ? `"${localPhp}"` : "php");
module.exports = defineConfig({
  testDir: "./tests/browser",
  outputDir: "./artifacts/test-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/browser-results.json" }],
  ],
  workers: 2,
  timeout: 45000,
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8090",
    channel:
      process.env.PW_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `${php} -S 127.0.0.1:8090 -t app/public scripts/preview-router.php`,
        url: "http://127.0.0.1:8090/uz",
        reuseExistingServer: !process.env.CI,
      },
});
