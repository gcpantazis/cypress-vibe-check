/// <reference types="cypress" />
/// <reference path="../../index.d.ts" />

/**
 * This file exports all the Cypress commands and ensures type definitions are correctly loaded.
 * It should be imported and called by the user in their cypress/support/e2e.ts or cypress/support/commands.ts file.
 */

import { registerVibeCommands } from "./commands/screenshot-commands";
import { llmBridgeService } from "./llm-bridge";

export { registerVibeCommands, llmBridgeService };
