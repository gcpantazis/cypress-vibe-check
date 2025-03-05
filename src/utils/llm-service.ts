import {
  LLMProvider,
  LLMProviderConfig,
  LLMProviderType,
  LLMResponse,
  EvaluateOptions,
} from "../types/llm";
import { createLLMProvider } from "../providers";

/**
 * Service class for managing LLM providers and evaluations
 */
export class LLMService {
  /** Map of provider instances by name */
  private providers: Map<string, LLMProvider> = new Map();

  /** Default provider to use when none is specified */
  private defaultProvider: string | null = null;

  /**
   * Register an LLM provider with the service
   * @param name Unique name for the provider
   * @param provider Provider instance or provider type and config
   * @param makeDefault Whether to make this the default provider
   * @returns The registered provider instance
   */
  registerProvider(
    name: string,
    provider:
      | LLMProvider
      | { type: LLMProviderType; config: LLMProviderConfig },
    makeDefault = false
  ): LLMProvider {
    let providerInstance: LLMProvider;

    // If we were given a provider instance, use it directly
    if ("evaluateScreenshot" in provider) {
      providerInstance = provider;
    } else {
      // Otherwise, create a new provider of the specified type
      providerInstance = createLLMProvider(provider.type, provider.config);
    }

    // Register the provider
    this.providers.set(name, providerInstance);

    // Set as default if requested or if it's the first provider
    if (makeDefault || this.defaultProvider === null) {
      this.defaultProvider = name;
    }

    return providerInstance;
  }

  /**
   * Set the default provider to use when none is specified
   * @param name Name of the provider to set as default
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" is not registered`);
    }

    this.defaultProvider = name;
  }

  /**
   * Get a provider by name, or the default provider if none is specified
   * @param name Name of the provider to get
   * @returns The provider instance
   */
  getProvider(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;

    if (!providerName) {
      throw new Error("No provider specified and no default provider is set");
    }

    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" is not registered`);
    }

    return provider;
  }

  /**
   * Evaluate a screenshot against a specification using the specified provider
   * @param screenshotPath Path to the screenshot to evaluate
   * @param specification Specification text to evaluate against
   * @param options Evaluation options
   * @param providerName Name of the provider to use, or the default if not specified
   * @returns LLM response
   */
  async evaluateScreenshot(
    screenshotPath: string,
    specification: string,
    options: EvaluateOptions = {},
    providerName?: string
  ): Promise<LLMResponse> {
    const provider = this.getProvider(providerName);
    return provider.evaluateScreenshot(screenshotPath, specification, options);
  }
}

// Create and export a singleton instance
export const llmService = new LLMService();
