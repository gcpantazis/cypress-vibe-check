// 1. setupCypressVibeCheck - used in cypress.config.ts
export { setupCypressVibeCheck } from "./cypress/plugin";

// 2. autoRegisterCommands - used in cypress/support/e2e.ts
export { autoRegisterCommands } from "./cypress/autoinit";

// 3. Export only the types needed for the public interface
export type { VibeConfig } from "./config/config";
