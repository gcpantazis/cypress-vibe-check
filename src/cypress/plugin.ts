import fs from "fs-extra";
import { initializeLLMService } from "../utils/llm-initializer";
import { llmService } from "../utils/llm-service";

// Initialize LLM service only in Node.js context
let llmServiceInitialized = false;
function getLLMService() {
  if (!llmServiceInitialized) {
    try {
      initializeLLMService();
      llmServiceInitialized = true;
    } catch (error) {
      console.warn("Error initializing LLM service:", error);
    }
  }
  return llmService;
}

/**
 * Setup Cypress plugin node events for vibe checks
 * This function should be called inside setupNodeEvents in cypress.config.ts
 *
 * @param on - Cypress plugin events
 * @param config - Cypress plugin config
 * @param options - Optional configuration options
 * @param options.registerCommands - Whether to automatically register commands (defaults to true)
 * @returns The modified Cypress config
 */
export function setupCypressVibeCheck(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
  options: { registerCommands?: boolean } = {}
) {
  // Default options
  const { registerCommands = true } = options;

  // Register tasks for LLM evaluation and filesystem operations
  on("task", {
    // Task to ensure a directory exists
    ensureDir(dirPath) {
      try {
        fs.ensureDirSync(dirPath);
        return null; // Cypress tasks must return null or a serializable value
      } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
        throw new Error(`Failed to create directory: ${dirPath}`);
      }
    },

    // Task to evaluate a screenshot with an LLM
    evaluateScreenshotWithLLM({
      screenshotPath,
      specification,
      options,
      providerName,
    }) {
      // This runs in the Node.js context
      const service = getLLMService();

      // First, ensure the screenshot file exists
      try {
        // Verify file exists before proceeding to avoid errors
        if (!fs.existsSync(screenshotPath)) {
          console.error(`Screenshot file not found at: ${screenshotPath}`);
          return {
            verdict: "no",
            confidence: 0,
            failReason: "Screenshot file not found",
            reasoning: `Screenshot does not exist at path: ${screenshotPath}`,
          };
        }

        return service
          .evaluateScreenshot(
            screenshotPath,
            specification,
            options,
            providerName
          )
          .catch((error) => {
            console.error("Error evaluating screenshot:", error);
            return {
              verdict: "no",
              confidence: 0,
              failReason: "Error communicating with LLM service",
              reasoning: error.message,
            };
          });
      } catch (error: unknown) {
        console.error("Error in evaluateScreenshotWithLLM task:", error);
        return {
          verdict: "no",
          confidence: 0,
          failReason: "Error in screenshot evaluation task",
          reasoning: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });

  // Register commands if requested
  if (registerCommands) {
    // Add instructions to window.Cypress for command registration
    const originalSupportFile = config.supportFile || [];
    const supportFiles = Array.isArray(originalSupportFile)
      ? originalSupportFile
      : [originalSupportFile];

    // Add a flag to config.env to indicate commands should be auto-registered
    config.env = config.env || {};
    config.env.autoRegisterVibeCommands = true;
  }

  return config;
}
