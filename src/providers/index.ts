// Export the LLM provider interfaces
export * from "../types/llm";

// Export the base provider
export * from "./base-provider";

// Export the specific providers
export * from "./anthropic-provider";
export * from "./openai-provider";

// Export a factory function for creating providers
import { LLMProviderConfig, LLMProviderType } from "../types/llm";
import { ENV_VARS } from "../utils/env";
import {
  AnthropicProvider,
  AnthropicProviderConfig,
} from "./anthropic-provider";
import { OpenAIProvider, OpenAIProviderConfig } from "./openai-provider";

/**
 * Factory function to create an LLM provider instance based on the type
 * @param type The type of LLM provider to create
 * @param config Configuration for the LLM provider
 * @returns An LLM provider instance
 */
export function createLLMProvider(
  type: LLMProviderType,
  config: LLMProviderConfig
) {
  // Apply environment variables to config if not explicitly provided
  const enhancedConfig = { ...config };

  // Set API keys from environment if not provided in config
  if (!enhancedConfig.apiKey) {
    switch (type) {
      case "anthropic":
        enhancedConfig.apiKeyEnvVar = ENV_VARS.ANTHROPIC_API_KEY;
        break;
      case "openai":
        enhancedConfig.apiKeyEnvVar = ENV_VARS.OPENAI_API_KEY;
        break;
    }
  }

  switch (type) {
    case "anthropic":
      return new AnthropicProvider(enhancedConfig as AnthropicProviderConfig);
    case "openai":
      return new OpenAIProvider(enhancedConfig as OpenAIProviderConfig);
    case "custom":
      // For custom providers, the caller should handle instantiation directly
      throw new Error(
        "Custom providers should be instantiated directly, not through the factory"
      );
    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }
}
