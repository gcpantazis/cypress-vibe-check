# Cypress Vibe Check

![vibes...](https://github.com/user-attachments/assets/e38820e2-737f-4d0f-9206-969b585adb0d)

LLM-based visual testing for Cypress, using OpenAI and Anthropic to evaluate UI against specifications.

## What is Vibe Check?

Vibe Check lets you test your UI by describing how it should look and behave in natural language. Instead of creating brittle visual snapshots or writing complex assertions, describe what you expect to see, and let an LLM evaluate whether your UI matches the description.

## Installation

```bash
npm install cypress-vibe-check
# or
yarn add cypress-vibe-check
```

## Setup

### 1. Configure Your Environment

Create a `.env` file in your project root with your API keys:

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 2. Integrate with Cypress

Update your Cypress configuration file (`cypress.config.ts|js`):

```typescript
import { defineConfig } from "cypress";
import { setupCypressVibeCheck } from "cypress-vibe-check";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return setupCypressVibeCheck(on, config);
    },
  },
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: false, // Keep LLM test screenshots between runs
});
```

### 3. Register Commands

In your Cypress support file (e.g., `cypress/support/e2e.ts|js`):

```typescript
import { autoRegisterCommands } from "cypress-vibe-check/cypress/autoinit";

autoRegisterCommands();
```

## Usage

Once set up, you can use the `configureVibes` and `vibeCheck` commands in your tests:

```typescript
describe("Vibe Check Demo", () => {
  beforeEach(() => {
    // Configure the vibe checks for all tests
    cy.configureVibes({
      confidenceThreshold: 0.8,
      provider: "openai",
    });

    // Visit the example site
    cy.visit("https://example.cypress.io/commands/actions");
  });

  it("should verify an email input field using vibeCheck", () => {
    cy.get(".action-email")
      .vibeCheck("This is an input field for email address entry");
  });

  it("should verify a button with custom options", () => {
    cy.get(".action-btn").vibeCheck(
      'This is a red button that says "Click to toggle popover"',
      {
        confidenceThreshold: 0.9,
      }
    );
  });

  it("should be able to chain commands after a passing vibeCheck", () => {
    cy.get(".action-email")
      .vibeCheck("This is an input field for entering email addresses")
      // Perform some regular cypress actions and checks.
      .type("test@example.com")
      .should("have.value", "test@example.com");
  });
});
```

## API

### Commands

#### `cy.vibeCheck(specification, options?)`

Evaluates an element against a natural language specification using an LLM.

- `specification`: A string describing what the element should look like
- `options`: (Optional) Configuration options for this specific check
  - `name`: Custom name for the screenshot
  - `provider`: LLM provider to use ('openai' or 'anthropic')
  - `confidenceThreshold`: Minimum confidence level to pass (0-1)
  - `includeRawResponse`: Whether to include raw LLM response in results
  - `maxRetries`: Maximum number of retries on failure
  - `modelParameters`: Additional parameters to pass to the LLM

#### `cy.configureVibes(options)`

Sets global configuration options for all vibe checks in the current test.

- `options`: Configuration options for all vibe checks
  - `provider`: Default LLM provider to use ('openai' or 'anthropic')
  - `confidenceThreshold`: Default minimum confidence level to pass (0-1)
  - `includeRawResponse`: Whether to include raw LLM response in results by default
  - `maxRetries`: Default maximum number of retries on failure
  - `modelParameters`: Default additional parameters to pass to the LLM

### Configuration

The plugin can be configured in your Cypress configuration file:

```typescript
// cypress.config.ts
import { defineConfig } from "cypress";
import { setupCypressVibeCheck } from "cypress-vibe-check";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return setupCypressVibeCheck(on, config, {
        // Optional custom configuration
        defaultProvider: "openai",
        defaultConfidenceThreshold: 0.85,
        // Other options...
      });
    },
  },
  // Other Cypress config...
});
```

## Best Practices

1. **Be Descriptive**: Provide clear, detailed descriptions of what you expect to see.
2. **Focus on Visual Elements**: Describe colors, sizes, positions, and text content.
3. **Set Appropriate Confidence Thresholds**: Adjust based on how strict you want the validation to be.
4. **Use Different Providers**: OpenAI may be better for some tests, while Anthropic may be better for others.

## License

MIT
