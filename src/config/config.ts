import { LLMProviderConfig, LLMProviderType } from "../types/llm";

/**
 * Unified configuration for the visual testing framework
 */
export interface VibeConfig {
  /** Default LLM provider to use */
  defaultProvider: string;

  /** Configuration for all providers */
  providers: {
    [name: string]: {
      /** Type of the provider */
      type: LLMProviderType;

      /** Configuration for the provider */
      config: LLMProviderConfig;
    };
  };

  /** Default evaluation options */
  evaluation: {
    /** Default confidence threshold (0-1) */
    confidenceThreshold: number;

    /** Whether to include raw LLM responses in the results */
    includeRawResponse: boolean;

    /** Maximum number of retries for LLM calls */
    maxRetries: number;

    /** Additional model parameters to pass to the LLM */
    modelParameters: Record<string, any>;
  };
}

/**
 * Default configuration for the framework
 * This can be overridden by environment variables, Cypress config, or per-check options
 */
export const defaultConfig: VibeConfig = {
  defaultProvider: "openai",
  providers: {
    openai: {
      type: "openai",
      config: {
        apiKey: process.env.OPENAI_API_KEY || "",
        defaultConfidenceThreshold: 0.6,
      },
    },
    anthropic: {
      type: "anthropic",
      config: {
        apiKey: process.env.ANTHROPIC_API_KEY || "",
        defaultConfidenceThreshold: 0.6,
      },
    },
  },
  evaluation: {
    confidenceThreshold: 0.8,
    includeRawResponse: false,
    maxRetries: 2,
    modelParameters: {},
  },
};

/**
 * Load configuration from environment variables and Cypress config
 * @returns Unified configuration for the visual testing framework
 */
export function loadConfig(): VibeConfig {
  // Start with the default config
  const config = { ...defaultConfig };

  // Override with environment variables
  if (process.env.VIBE_DEFAULT_PROVIDER) {
    config.defaultProvider = process.env.VIBE_DEFAULT_PROVIDER;
  }

  if (process.env.OPENAI_API_KEY) {
    config.providers.openai.config.apiKey = process.env.OPENAI_API_KEY;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    config.providers.anthropic.config.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  // Try to get Cypress configuration
  try {
    // In browser context (Cypress tests)
    if (typeof Cypress !== "undefined") {
      const cypressVibeConfig = Cypress.env("vibe") || {};

      // Override with any settings from Cypress config
      if (cypressVibeConfig.defaultProvider) {
        config.defaultProvider = cypressVibeConfig.defaultProvider;
      }

      if (cypressVibeConfig.defaultConfidenceThreshold !== undefined) {
        config.evaluation.confidenceThreshold =
          cypressVibeConfig.defaultConfidenceThreshold;
      }

      if (cypressVibeConfig.includeRawResponse !== undefined) {
        config.evaluation.includeRawResponse =
          cypressVibeConfig.includeRawResponse;
      }

      if (cypressVibeConfig.maxRetries !== undefined) {
        config.evaluation.maxRetries = cypressVibeConfig.maxRetries;
      }

      if (cypressVibeConfig.modelParameters) {
        config.evaluation.modelParameters = {
          ...config.evaluation.modelParameters,
          ...cypressVibeConfig.modelParameters,
        };
      }

      if (cypressVibeConfig.providers) {
        // Merge provider configs
        for (const [name, providerConfig] of Object.entries(
          cypressVibeConfig.providers
        )) {
          if (typeof providerConfig === "object") {
            config.providers[name] = {
              ...config.providers[name],
              ...(providerConfig as any),
              config: {
                ...(config.providers[name]?.config || {}),
                ...((providerConfig as any).config || {}),
              },
            };
          }
        }
      }
    }
    // In Node.js context (Cypress plugin)
    else {
      const cypress = (global as any).Cypress;

      if (cypress && cypress.config) {
        const vibeConfig = cypress.config("vibe") as
          | Partial<VibeConfig>
          | undefined;

        if (vibeConfig) {
          // Merge with our config
          if (vibeConfig.defaultProvider) {
            config.defaultProvider = vibeConfig.defaultProvider;
          }

          if (vibeConfig.providers) {
            // Merge provider configs
            for (const [name, providerConfig] of Object.entries(
              vibeConfig.providers
            )) {
              config.providers[name] = {
                ...config.providers[name],
                ...providerConfig,
                config: {
                  ...(config.providers[name]?.config || {}),
                  ...(providerConfig.config || {}),
                },
              };
            }
          }

          if (vibeConfig.evaluation) {
            config.evaluation = {
              ...config.evaluation,
              ...vibeConfig.evaluation,
            };
          }
        }
      }
    }
  } catch (e) {
    // Ignore errors when accessing Cypress config
    console.warn("Error accessing Cypress configuration:", e);
  }

  return config;
}
