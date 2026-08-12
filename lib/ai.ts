import { createOpenAI } from "@ai-sdk/openai";

// Lazy provider: defer process.env read to call-time.
// Trigger.dev bundles/eval modules at build time where env vars are empty.
// Creating the provider at import time captures apiKey: undefined → SDK falls
// back to default OpenAI provider → LoadAPIKeyError at runtime.
let _openRouter: ReturnType<typeof createOpenAI> | null = null;

export function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Fail fast with clear message. Prevents confusing OpenAI fallback error.
    throw new Error(
      "OPENROUTER_API_KEY is missing in the runtime environment. " +
        "Set it in the Trigger.dev dashboard under Environment Variables."
    );
  }

  if (!_openRouter) {
    _openRouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return _openRouter;
}
