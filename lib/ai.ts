import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Lazy provider: defer process.env read to call-time.
// Trigger.dev bundles/eval modules at build time where env vars are empty.
// Creating the provider at import time captures apiKey: undefined → SDK falls
// back to default OpenAI provider → LoadAPIKeyError at runtime.
let _openRouter: ReturnType<typeof createOpenAICompatible> | null = null;

function requireOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  // Safe runtime diagnostic — NEVER log the key itself.
  console.log("[AI] Provider configuration diagnostic:", {
    hasOpenRouterApiKey: !!apiKey,
    apiKeyLength: apiKey?.length ?? 0,
    baseURL: "https://openrouter.ai/api/v1",
  });

  if (!apiKey) {
    // Fail fast with clear message. Prevents confusing OpenAI fallback error.
    throw new Error(
      "OPENROUTER_API_KEY is missing in the Trigger.dev runtime environment. " +
        "Set it in the Trigger.dev dashboard under Environment Variables."
    );
  }

  return apiKey;
}

export function getOpenRouter() {
  if (!_openRouter) {
    const apiKey = requireOpenRouterApiKey();
    _openRouter = createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return _openRouter;
}
