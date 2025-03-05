import fs from "fs-extra";
import {
  EvaluateOptions,
  LLMProvider,
  LLMProviderConfig,
  LLMResponse,
} from "../types/llm";

// Check if we're in a browser environment (Cypress) or Node.js
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * Abstract base class for all LLM providers
 * Handles common functionality like error handling, retries, and configuration
 */
export abstract class BaseLLMProvider implements LLMProvider {
  /** Configuration options for the provider */
  protected config: LLMProviderConfig;

  /** Name of this provider for logging/identification */
  protected abstract providerName: string;

  /**
   * Creates a new instance of the BaseLLMProvider
   * @param config Configuration options
   */
  constructor(config: LLMProviderConfig) {
    this.config = this.validateConfig(config);
  }

  /**
   * Validates the provider configuration and sets defaults
   * @param config Configuration to validate
   * @returns Validated configuration with defaults applied
   */
  protected validateConfig(config: LLMProviderConfig): LLMProviderConfig {
    // Create a new config object to avoid modifying the input
    const validatedConfig: LLMProviderConfig = { ...config };

    // Check for API key or environment variable
    if (!validatedConfig.apiKey && validatedConfig.apiKeyEnvVar) {
      validatedConfig.apiKey = process.env[validatedConfig.apiKeyEnvVar] || "";
    }

    if (!validatedConfig.apiKey) {
      console.warn(
        `[${this.providerName}] No API key provided. Set config.apiKey or config.apiKeyEnvVar.`
      );
    }

    // Set default values
    validatedConfig.defaultConfidenceThreshold =
      validatedConfig.defaultConfidenceThreshold || 0.8;
    validatedConfig.defaultMaxRetries = validatedConfig.defaultMaxRetries || 3;
    validatedConfig.temperature = validatedConfig.temperature || 0.3;

    return validatedConfig;
  }

  /**
   * Evaluates a screenshot against a specification using the LLM
   * Includes retry logic and error handling
   * @param screenshotPath Path to screenshot file
   * @param specification Specification text to evaluate against
   * @param options Evaluation options
   * @returns LLM response
   */
  async evaluateScreenshot(
    screenshotPath: string,
    specification: string,
    options?: EvaluateOptions
  ): Promise<LLMResponse> {
    // In browser environments, we need to use Cypress to check if the file exists
    if (isBrowser) {
      // We assume the file exists since Cypress would have already created it
      // If there's a problem, it will be caught during the actual evaluation
    } else {
      // In Node.js environments, we can check if the file exists
      if (!(await fs.pathExists(screenshotPath))) {
        throw new Error(`Screenshot does not exist at path: ${screenshotPath}`);
      }
    }

    // Merge options with defaults
    const mergedOptions: EvaluateOptions = {
      confidenceThreshold: this.config.defaultConfidenceThreshold,
      maxRetries: this.config.defaultMaxRetries,
      ...options,
    };

    let lastError: Error | null = null;

    // Attempt with retries
    for (
      let attempt = 1;
      attempt <= (mergedOptions.maxRetries || 1);
      attempt++
    ) {
      try {
        // Log the attempt if not the first
        if (attempt > 1) {
          console.log(
            `[${this.providerName}] Retry attempt ${attempt}/${mergedOptions.maxRetries}`
          );
        }

        // Call the provider-specific implementation
        const result = await this.evaluateScreenshotInternal(
          screenshotPath,
          specification,
          mergedOptions
        );

        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[${this.providerName}] Error (attempt ${attempt}/${mergedOptions.maxRetries}):`,
          error
        );

        // No more retries, rethrow the error
        if (attempt >= (mergedOptions.maxRetries || 1)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }

    // This should never happen due to the throw in the loop, but TypeScript doesn't know that
    throw (
      lastError ||
      new Error(`Unknown error evaluating screenshot with ${this.providerName}`)
    );
  }

  /**
   * Provider-specific implementation for evaluating a screenshot
   * @param screenshotPath Path to screenshot file
   * @param specification Specification text to evaluate against
   * @param options Evaluation options
   * @returns LLM response
   */
  protected abstract evaluateScreenshotInternal(
    screenshotPath: string,
    specification: string,
    options: EvaluateOptions
  ): Promise<LLMResponse>;

  /**
   * Utility function to read a file as base64
   * @param filePath Path to the file
   * @returns Base64 encoded file content
   */
  protected async getImageAsBase64(filePath: string): Promise<string> {
    if (isBrowser) {
      // In browser (Cypress) context, use Cypress to read the file
      // This is a placeholder - actual implementation would need to use Cypress commands
      // which can't be called directly here
      // Instead, we'll log a message and expect the content to be passed in
      console.log(
        `[${this.providerName}] Reading file in browser context: ${filePath}`
      );
      return ""; // This will be overridden by actual implementation in Cypress
    } else {
      // In Node.js context, use fs-extra
      const imageBuffer = await fs.readFile(filePath);
      return imageBuffer.toString("base64");
    }
  }

  /**
   * Utility function to create a standardized system prompt
   * @param specification Specification text
   * @returns System prompt text
   */
  protected getSystemPrompt(specification: string): string {
    return `
You are an expert UI evaluator. You will be given a screenshot of a UI element and a specification.
Your task is to determine if the UI element in the screenshot matches the given specification.

Specification:
${specification}

Evaluate only what is visible in the screenshot. Be precise and objective in your analysis.
Focus on visual appearance, layout, text content, and interactive elements that are visible.

Respond with a JSON object in the following format:
{
  "verdict": "yes" or "no", // Does the UI match the specification?
  "confidence": 0.0 to 1.0, // How confident are you in your verdict?
  "failReason": "string", // If verdict is "no", explain why it fails (omit if verdict is "yes")
  "reasoning": "string", // Your detailed reasoning behind the decision
  "suggestions": ["string"], // Optional list of suggestions for improvement (omit if none)
}

Maintain a high bar for quality and accuracy in your evaluation.
    `.trim();
  }
}
