import { loadConfig } from "../config/config";
import { llmService, LLMService } from "./llm-service";

/**
 * Initialize the LLM service with the configuration
 * @returns The initialized LLM service
 */
export function initializeLLMService(): LLMService {
  const config = loadConfig();

  // Register providers from the configuration
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    llmService.registerProvider(
      name,
      {
        type: providerConfig.type,
        config: providerConfig.config,
      },
      name === config.defaultProvider
    );
  }

  return llmService;
}
