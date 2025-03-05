/**
 * API validation tool for testing LLM providers
 * This script tests the connection to configured LLM providers
 *
 * Usage:
 *   npm run validate-api
 *   # or
 *   ts-node src/tools/validate-api.ts
 */

import path from "path";
import fs from "fs-extra";
import { AnthropicProvider } from "../providers/anthropic-provider";
import { OpenAIProvider } from "../providers/openai-provider";
import { ENV_VARS, getApiKey, validateEnv } from "../utils/env";

// Check environment variables
validateEnv();

// Path to the test image
const TEST_IMAGE_PATH = path.resolve(
  process.cwd(),
  "test-assets",
  "sample-button.png"
);

/**
 * Ensure test image exists
 */
async function ensureTestImage() {
  const testDirPath = path.dirname(TEST_IMAGE_PATH);

  // Create test-assets directory if it doesn't exist
  if (!fs.existsSync(testDirPath)) {
    await fs.mkdir(testDirPath, { recursive: true });
  }

  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log("Creating test image...");
    // Create a blank test image - this is just a placeholder
    // In a real scenario, you'd use a more meaningful test image
    await fs.writeFile(TEST_IMAGE_PATH, "Test Image");
  }
}

/**
 * Test Anthropic API connection
 */
async function testAnthropic() {
  console.log("\n--- Testing Anthropic API ---");
  const apiKey = getApiKey(ENV_VARS.ANTHROPIC_API_KEY);

  if (!apiKey) {
    console.log("❌ No Anthropic API key found. Skipping Anthropic test.");
    return false;
  }

  try {
    console.log("Initializing Anthropic provider...");
    const provider = new AnthropicProvider({
      apiKey,
    });

    console.log("Sending test request to Anthropic API...");
    await provider.evaluateScreenshot(
      TEST_IMAGE_PATH,
      "A test image for API validation",
      { includeRawResponse: false }
    );

    console.log("✅ Anthropic API test successful!");
    return true;
  } catch (error: any) {
    console.error("❌ Anthropic API test failed:", error.message);
    return false;
  }
}

/**
 * Test OpenAI API connection
 */
async function testOpenAI() {
  console.log("\n--- Testing OpenAI API ---");
  const apiKey = getApiKey(ENV_VARS.OPENAI_API_KEY);

  if (!apiKey) {
    console.log("❌ No OpenAI API key found. Skipping OpenAI test.");
    return false;
  }

  try {
    console.log("Initializing OpenAI provider...");
    const provider = new OpenAIProvider({
      apiKey,
    });

    console.log("Sending test request to OpenAI API...");
    await provider.evaluateScreenshot(
      TEST_IMAGE_PATH,
      "A test image for API validation",
      { includeRawResponse: false }
    );

    console.log("✅ OpenAI API test successful!");
    return true;
  } catch (error: any) {
    console.error("❌ OpenAI API test failed:", error.message);
    return false;
  }
}

/**
 * Main function - run all tests
 */
async function main() {
  console.log("===== API Validation Tool =====");
  console.log("Testing connection to LLM providers...");

  // Ensure we have a test image
  await ensureTestImage();

  // Test Anthropic API
  const anthropicSuccess = await testAnthropic();

  // Test OpenAI API
  const openaiSuccess = await testOpenAI();

  // Summary
  console.log("\n===== Test Results =====");
  console.log(
    `Anthropic API: ${anthropicSuccess ? "✅ Connected" : "❌ Failed"}`
  );
  console.log(`OpenAI API: ${openaiSuccess ? "✅ Connected" : "❌ Failed"}`);

  if (!anthropicSuccess && !openaiSuccess) {
    console.error(
      "❌ No API connections successful. Please check your API keys and network connection."
    );
    process.exit(1);
  }

  console.log("✅ API validation completed.");
  process.exit(0);
}

// Run the tool
main().catch((error) => {
  console.error("Error running API validation tool:", error);
  process.exit(1);
});
