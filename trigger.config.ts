import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  /**
   * Find your project ref in the Trigger.dev dashboard under Project Settings.
   * It looks like: proj_xxxxxxxxxxxxxxxxxx
   * Set it here or via TRIGGER_PROJECT_ID env var.
   */
  project: "proj_jycltmmkruccaqfbyhao",
  runtime: "node",
  logLevel: "log",
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 2000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  maxDuration: 300,
});
