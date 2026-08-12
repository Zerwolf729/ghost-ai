import { generateText } from "ai";
import { getOpenRouter } from "@/lib/ai";

/**
 * Canonical OpenRouter model IDs — DO NOT CHANGE.
 * Primary: cohere/north-mini-code:free
 * Fallback: inclusionai/ling-3.0-tiny:free
 */
export const PRIMARY_MODEL_ID = "cohere/north-mini-code:free";
const FALLBACK_MODEL_ID = "inclusionai/ling-3.0-tiny:free";

/** Per-model attempt timeout — fail fast, fall back, never hang. */
const AI_TIMEOUT_MS = 150_000;

function logAiError(model: string, stage: 'primary' | 'fallback', err: unknown, startTime: number) {
  const duration = Date.now() - startTime;
  const isError = err instanceof Error;

  // Safely extract properties without casting to any
  const errorObj = isError ? err : {} as Record<string, unknown>;
  const getProp = (key: string): unknown => {
    try {
      const val = (errorObj as Record<string, unknown>)[key];
      if (val !== undefined && val !== null && val !== '') return val;
    } catch { void 0; }
    return null;
  };

  console.error(`[AI] ${stage}:failure model=${model} durationMs=${duration}`, {
    errorName: isError ? err.name : 'UnknownError',
    errorMessage: isError ? err.message : String(err),
    isAbort: isError && err.name === 'AbortError',
    statusCode: getProp('responseStatus') ?? getProp('statusCode') ?? null,
    provider: getProp('provider') ?? null,
    reason: getProp('cause') !== null ? String(getProp('cause')) : null,
  });
}

/** Classify user-facing error without leaking stack/API internals. */
export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return "AI request timed out. Please try again.";

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
  const openRouter = getOpenRouter();
  const primaryModel = openRouter(PRIMARY_MODEL_ID);
  const fallbackModel = openRouter(FALLBACK_MODEL_ID);

  const startTime = Date.now();

  // Primary attempt
  const primaryController = new AbortController();
  const primaryTimer = setTimeout(() => primaryController.abort(), AI_TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model: primaryModel,
      prompt,
      temperature,
      abortSignal: primaryController.signal,
    });
    if (!text || !text.trim()) throw new Error("Primary model returned empty output");
    console.log(`[AI] primary:success model=${PRIMARY_MODEL_ID} durationMs=${Date.now() - startTime}`);
    return { text, model: PRIMARY_MODEL_ID };
  } catch (err) {
    logAiError(PRIMARY_MODEL_ID, 'primary', err, startTime);

    // Fallback attempt
    const fallbackStartTime = Date.now();
    const fallbackController = new AbortController();
    const fallbackTimer = setTimeout(() => fallbackController.abort(), AI_TIMEOUT_MS);
    try {
      const { text } = await generateText({
        model: fallbackModel,
        prompt,
        temperature,
        abortSignal: fallbackController.signal,
      });
      if (!text || !text.trim()) throw new Error("Fallback model returned empty output");
      console.log(`[AI] fallback:success model=${FALLBACK_MODEL_ID} durationMs=${Date.now() - fallbackStartTime}`);
      return { text, model: FALLBACK_MODEL_ID };
    } catch (fallbackErr) {
      logAiError(FALLBACK_MODEL_ID, 'fallback', fallbackErr, fallbackStartTime);
      throw new Error(friendlyError(fallbackErr));
    } finally {
      clearTimeout(fallbackTimer);
    }
  } finally {
    clearTimeout(primaryTimer);
  }
}
