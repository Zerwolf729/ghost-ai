import { generateText } from "ai";
import { openRouter } from "@/lib/ai";

/**
 * Canonical OpenRouter model IDs — DO NOT CHANGE.
 * Primary: cohere/north-mini-code:free
 * Fallback: inclusionai/ling-3.0-tiny:free
 */
export const PRIMARY_MODEL = openRouter("cohere/north-mini-code:free");
export const FALLBACK_MODEL = openRouter("inclusionai/ling-3.0-tiny:free");

/** Per-model attempt timeout — fail fast, fall back, never hang. */
const AI_TIMEOUT_MS = 60_000;

/** Classify user-facing error without leaking stack/API internals. */
export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("fetch failed") || m.includes("network") || m.includes("econnrefused") || m.includes("enotfound"))
      return "Connection to AI provider failed. Retrying automatically…";
    if (m.includes("timeout") || m.includes("abort"))
      return "AI request timed out. Please try again.";
    if (m.includes("429") || m.includes("rate limit"))
      return "AI provider is busy. Please wait a moment and retry.";
    if (m.includes("503") || m.includes("502") || m.includes("500"))
      return "AI provider is temporarily unavailable. Retrying…";
    if (m.includes("api key") || m.includes("unauthorized") || m.includes("401") || m.includes("403"))
      return "AI configuration error. Please contact support.";
    return err.message.split("\n")[0].slice(0, 200);
  }
  return "Unexpected error while generating design.";
}

/**
 * Generate text with primary → fallback failover.
 * One attempt per model. No recursive retry. No retry storm.
 */
export async function generateWithFallback(
  prompt: string,
  options: { temperature?: number } = {}
): Promise<{ text: string; model: string }> {
  const temperature = options.temperature ?? 0.7;

  // Primary attempt
  const primaryController = new AbortController();
  const primaryTimer = setTimeout(() => primaryController.abort(), AI_TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model: PRIMARY_MODEL,
      prompt,
      temperature,
      abortSignal: primaryController.signal,
    });
    if (!text || !text.trim()) throw new Error("Primary model returned empty output");
    return { text, model: "cohere/north-mini-code:free" };
  } catch (err) {
    console.warn("Primary AI model failed, trying fallback:", err);
    // Fallback attempt
    const fallbackController = new AbortController();
    const fallbackTimer = setTimeout(() => fallbackController.abort(), AI_TIMEOUT_MS);
    try {
      const { text } = await generateText({
        model: FALLBACK_MODEL,
        prompt,
        temperature,
        abortSignal: fallbackController.signal,
      });
      if (!text || !text.trim()) throw new Error("Fallback model returned empty output");
      return { text, model: "inclusionai/ling-3.0-tiny:free" };
    } catch (fallbackErr) {
      console.error("Both AI models failed:", fallbackErr);
      throw new Error(friendlyError(fallbackErr));
    } finally {
      clearTimeout(fallbackTimer);
    }
  } finally {
    clearTimeout(primaryTimer);
  }
}
