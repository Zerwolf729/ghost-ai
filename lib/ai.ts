import { createOpenAI } from "@ai-sdk/openai";

export const openRouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_AI_API_KEY,
});
