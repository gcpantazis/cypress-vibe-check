/**
 * OpenAI provider implementation for the LLM service
 * Uses OpenAI's vision capabilities to evaluate images
 */
import { LLMProviderConfig, LLMResponse, EvaluateOptions } from "../types/llm";
import { BaseLLMProvider } from "./base-provider";
import { ENV_VARS, getApiKey } from "../utils/env";
import fs from "fs";

/**
 * Configuration options specific to the OpenAI provider
 */
export interface OpenAIProviderConfig extends LLMProviderConfig {
  /** Model to use for OpenAI API calls */
  model?: string;
}

/**
 * OpenAI implementation of the LLM provider
 * Uses OpenAI's vision capabilities to evaluate images
 */
export class OpenAIProvider extends BaseLLMProvider {
  /** Default model to use for OpenAI API calls */
  private static readonly DEFAULT_MODEL = "gpt-4o";

  /** Name of this provider */
  protected providerName = "OpenAI";

  /**
   * Creates a new instance of the OpenAI provider
   * @param config Configuration for this provider
   */
  constructor(config: OpenAIProviderConfig) {
    super(config);
  }

  /**
   * Gets the default prompt for evaluating screenshots
   * @returns Default prompt for screenshot evaluation
   */
  protected getSystemPrompt(specification: string): string {
    return `You are a visual UI testing assistant. Analyze the image and determine if it meets the specification.
Use a scale from 0.0 to 1.0 where:
- 1.0 means the UI perfectly matches the specification
- 0.0 means the UI completely fails to match the specification

Format your answer as JSON with these fields:
- confidence: number from 0.0 to 1.0
- reasoning: your step-by-step explanation
- verdict: string, "yes" if the UI matches the specification, "no" if it doesn't

SPECIFICATION:
${specification}

Analyze carefully and be honest about the confidence score.`;
  }

  /**
   * Get image as base64 encoded string
   * @param imagePath Path to the image file
   * @returns Base64 encoded image data
   */
  protected async getImageAsBase64(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.promises.readFile(imagePath);
      return imageBuffer.toString("base64");
    } catch (error) {
      throw new Error(`Failed to read image file: ${error}`);
    }
  }

  /**
   * Validates the OpenAI provider configuration
   * @param config Configuration to validate
   * @returns Validated configuration
   */
  protected validateConfig(config: OpenAIProviderConfig): OpenAIProviderConfig {
    // Call parent validation for common fields
    const validatedConfig = super.validateConfig(
      config
    ) as OpenAIProviderConfig;

    // Set OpenAI-specific defaults
    if (!validatedConfig.model) {
      validatedConfig.model = OpenAIProvider.DEFAULT_MODEL;
    }

    return validatedConfig;
  }

  /**
   * OpenAI-specific implementation for evaluating a screenshot
   * @param screenshotPath Path to the screenshot file
   * @param specification Text specification to evaluate against
   * @param options Additional options for the evaluation
   * @returns Result of the evaluation
   */
  protected async evaluateScreenshotInternal(
    screenshotPath: string,
    specification: string,
    options: EvaluateOptions
  ): Promise<LLMResponse> {
    const config = this.config as OpenAIProviderConfig;
    const systemPrompt = this.getSystemPrompt(specification);
    const base64Image = await this.getImageAsBase64(screenshotPath);

    if (!base64Image) {
      throw new Error(`Could not read screenshot file: ${screenshotPath}`);
    }

    const apiKey = this.config.apiKey || getApiKey(ENV_VARS.OPENAI_API_KEY);
    if (!apiKey) {
      throw new Error(
        "No OpenAI API key provided. Please check your environment variables."
      );
    }

    try {
      // Call the OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.model || OpenAIProvider.DEFAULT_MODEL,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Evaluate if this UI element matches the specification.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1500,
            temperature: 0.2,
            ...(options.modelParameters || {}),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `API request failed with status ${response.status}`;

        if (errorData.error) {
          errorMessage += `: ${JSON.stringify(errorData.error)}`;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      let content = "";

      if (
        responseData &&
        responseData.choices &&
        responseData.choices.length > 0
      ) {
        content =
          responseData.choices[0].message?.content ||
          JSON.stringify(responseData.choices[0]);
      }

      // Try to extract JSON from the response content
      let resultJson: any = {};

      try {
        // Find JSON in the string, in case there's text before or after
        const jsonMatch = content.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[0]) {
          resultJson = JSON.parse(jsonMatch[0]);
        } else {
          resultJson = JSON.parse(content);
        }
      } catch (error) {
        console.error("[OpenAI] Failed to parse response JSON:", error);
        resultJson = {
          confidence: 0,
          reasoning: `Error parsing response: ${content}`,
          verdict: "no",
        };
      }

      if (!("confidence" in resultJson)) {
        console.log("[OpenAI] Could not access response content");
        return {
          confidence: 0,
          reasoning: `Invalid response format: ${JSON.stringify(resultJson)}`,
          verdict: "no",
          rawResponse: options.includeRawResponse ? content : undefined,
        };
      }

      return {
        confidence: resultJson.confidence,
        reasoning: resultJson.reasoning || "No reasoning provided",
        verdict: resultJson.verdict || "no",
        rawResponse: options.includeRawResponse ? content : undefined,
      };
    } catch (error) {
      console.error("[OpenAI] API error:", error);

      // Special handling for authentication errors
      const errorMessage = (error as Error).message || "";
      if (errorMessage.includes("401")) {
        console.error(
          "[OpenAI] Authentication error: Invalid API key. Please check your OPENAI_API_KEY."
        );
      }

      throw error;
    }
  }
}
