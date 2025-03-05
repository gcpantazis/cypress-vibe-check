/// <reference types="cypress" />
import { registerVibeCommands } from "./commands";

/**
 * Attempts to auto-register commands if the env flag is set
 * This function will be called in the browser context
 */
export function autoRegisterCommands(): void {
  // Only execute this in browser context where Cypress is defined
  if (typeof Cypress !== "undefined") {
    if (Cypress.env("autoRegisterVibeCommands")) {
      registerVibeCommands();
      Cypress.log({
        name: "Vibe Check",
        message: "🎭 Vibe Check commands auto-registered",
      });
    }
  }
}
