import { defineConfig } from "cypress";
import { setupCypressVibeCheck } from "./src";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return setupCypressVibeCheck(on, config);
    },
  },
  // Configure screenshots
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: false, // Keep LLM test screenshots between runs
});
