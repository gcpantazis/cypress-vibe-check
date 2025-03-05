// This file exports the type definitions for Cypress commands

// We're declaring a module augmentation for Cypress
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Configure global settings for vibe checks
       * @param options Configuration options for vibe checks
       * @example cy.configureVibes({ provider: 'anthropic', confidenceThreshold: 0.75 })
       */
      configureVibes(options: {
        provider?: "openai" | "anthropic";
        confidenceThreshold?: number;
        includeRawResponse?: boolean;
        maxRetries?: number;
        modelParameters?: Record<string, any>;
      }): Chainable<null>;

      /**
       * Check if an element matches the visual specification using LLM
       * @param specification Text specification to evaluate the element against
       * @param options Optional configuration for this specific check
       * @example cy.get('.button').vibeCheck('A prominent blue button with white text saying "Submit"')
       */
      vibeCheck(
        specification: string,
        options?: {
          name?: string;
          provider?: "openai" | "anthropic";
          confidenceThreshold?: number;
          includeRawResponse?: boolean;
          maxRetries?: number;
          modelParameters?: Record<string, any>;
        }
      ): Chainable<Subject>;
    }
  }
}

// We need this empty export to make this a module
export {};
