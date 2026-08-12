import { createOpenAI } from "@ai-sdk/openai";

// Lazy provider: defer process.env read to call-time.
// Trigger.dev bundles/eval modules at build time where env vars are empty.
// Creating the provider at import time captures apiKey: undefined → SDK falls
// back to default OpenAI provider → LoadAPIKeyError at runtime.
let _openRouter: ReturnType<typeof createOpenAI> | null = null;

export function getOpenRouter() {
  // DEBUG: Verify runtime env var
  console.log("DEBUG: OPENROUTER_API_KEY presence in runtime:", !!process.env.OPENROUTER_API_KEY, "length:", process.env.OPENROUTER_API_KEY?.length);

  if (!_openRouter) {
    _openRouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return _openRouter;
}
