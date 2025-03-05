/// <reference types="cypress" />
import path from "path";
// Import the LLM bridge service from the package
import { llmBridgeService } from "../llm-bridge";
// Import the centralized configuration
import { loadConfig, VibeConfig } from "../../config/config";

// Create a reference for the runtime config in the browser context
let runtimeConfig: VibeConfig;

/**
 * Register Cypress commands for vibe checks
 * This function should be called from a Cypress support file
 */
export function registerVibeCommands() {
  // Initialize runtime config from the centralized configuration
  runtimeConfig = loadConfig();

  /**
   * Configure global settings for vibe checks
   */
  Cypress.Commands.add("configureVibes", (options) => {
    // Update runtime configuration with provided options
    Object.assign(runtimeConfig, options);

    cy.log(
      `Vibe checks configured with provider: ${runtimeConfig.defaultProvider}, confidence: ${runtimeConfig.evaluation.confidenceThreshold}`
    );

    return cy.wrap(null, { log: false });
  });

  /**
   * Check if an element matches the visual specification using LLM
   */
  Cypress.Commands.add(
    "vibeCheck",
    { prevSubject: "element" },
    (subject, specification, options = {}) => {
      // Create empty element if none provided (fallback)
      if (!subject || subject.length === 0) {
        throw new Error("No element found for vibeCheck");
      }

      // Merge options with runtime config
      const mergedOptions = {
        ...runtimeConfig.evaluation,
        provider: runtimeConfig.defaultProvider,
        ...options,
      };

      // Generate a screenshot name
      const testName = Cypress.currentTest.title
        .replace(/\s+/g, "-")
        .toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const name = options.name ? options.name : "vibe-check";
      const screenshotName = `${testName}-${name}-${timestamp}.png`;

      // Get screenshot directory from Cypress config
      const screenshotDir =
        Cypress.config("screenshotsFolder") || "cypress/screenshots";

      // Use the test file name as the directory, rather than llm-tests
      // This matches where Cypress actually saves the screenshots
      const testFileName = Cypress.spec.name;
      const llmScreenshotDir = path.join(screenshotDir, testFileName);
      const screenshotPath = path.join(llmScreenshotDir, screenshotName);
      let capturedScreenshotPath = screenshotPath; // Create a mutable variable to store the actual path

      // Log the check
      Cypress.log({
        name: "vibeCheck",
        message: `"${specification.substring(0, 40)}${
          specification.length > 40 ? "..." : ""
        }"`,
        consoleProps: () => ({
          Specification: specification,
          Element: subject,
          "Screenshot Path": screenshotPath,
          Provider: mergedOptions.provider,
          "Confidence Threshold": mergedOptions.confidenceThreshold,
        }),
      });

      // Take the screenshot
      cy.wrap(subject, { log: false }).screenshot(
        path.basename(screenshotName, ".png"),
        {
          capture: "viewport",
          overwrite: true,
          onAfterScreenshot(el, props) {
            // Don't use cy.log inside this callback as it creates a promise conflict
            // Store the path for later use instead
            capturedScreenshotPath = props.path;
          },
        }
      );

      // Evaluate the screenshot with the LLM
      return cy.wrap(subject, { log: false }).then(() => {
        // Log screenshot path here instead of in the callback
        cy.log(`Screenshot captured at: ${capturedScreenshotPath}`);

        // Use the actual capturedScreenshotPath directly
        // This should be the actual path where Cypress saved the screenshot
        const actualScreenshotPath = capturedScreenshotPath;

        cy.log(`Evaluating screenshot with ${mergedOptions.provider}...`);

        // Call the LLM bridge service to evaluate the screenshot
        return llmBridgeService
          .evaluateScreenshot(
            actualScreenshotPath,
            specification,
            {
              confidenceThreshold: mergedOptions.confidenceThreshold,
              includeRawResponse: mergedOptions.includeRawResponse,
              maxRetries: mergedOptions.maxRetries,
              modelParameters: mergedOptions.modelParameters,
            },
            mergedOptions.provider
          )
          .then((result) => {
            // Check if the result is a pass or fail
            if (
              result.verdict === "yes" &&
              result.confidence >= mergedOptions.confidenceThreshold
            ) {
              // If passing, just return the subject to allow chaining
              cy.log(
                `✅ Vibe check passed! (confidence: ${result.confidence.toFixed(
                  2
                )})`
              );
              return cy.wrap(subject);
            } else {
              // If failing, throw an error with the reasoning
              const failureMessage = [
                `❌ Vibe check failed!`,
                `Specification: "${specification}"`,
                `Confidence: ${result.confidence.toFixed(2)} (threshold: ${
                  mergedOptions.confidenceThreshold
                })`,
                `Reasoning: ${result.reasoning || "No reasoning provided"}`,
                result.failReason ? `Fail reason: ${result.failReason}` : "",
                result.suggestions && result.suggestions.length > 0
                  ? `Suggestions: ${result.suggestions.join(", ")}`
                  : "",
                `Screenshot path: ${actualScreenshotPath}`,
              ]
                .filter(Boolean)
                .join("\n");

              throw new Error(failureMessage);
            }
          });
      });
    }
  );
}
