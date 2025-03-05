/**
 * This file provides a bridge between the Cypress browser environment
 * and the LLM service.
 */

import { EvaluateOptions, LLMResponse } from "../types/llm";

/**
 * Browser-compatible LLM evaluation service
 * This is a simplified version that uses Cypress tasks to delegate to Node.js
 */
class LLMBridgeService {
  /**
   * Evaluate a screenshot against a specification
   * @param screenshotPath Path to the screenshot file
   * @param specification Text specification to evaluate against
   * @param options Evaluation options
   * @param providerName Optional provider name
   * @returns Promise with LLM response
   */
  evaluateScreenshot(
    screenshotPath: string,
    specification: string,
    options: EvaluateOptions = {},
    providerName?: string
  ): Cypress.Chainable<LLMResponse> {
    cy.log(`[LLM Bridge] Evaluating screenshot: ${screenshotPath}`);
    cy.log(`[LLM Bridge] Specification: ${specification}`);

    // Use Cypress task to run the evaluation in Node.js
    // Simply returning the task command which is already a Cypress.Chainable
    return cy.task<LLMResponse>("evaluateScreenshotWithLLM", {
      screenshotPath,
      specification,
      options,
      providerName,
    });
  }
}

// Create and export singleton instance
export const llmBridgeService = new LLMBridgeService();
