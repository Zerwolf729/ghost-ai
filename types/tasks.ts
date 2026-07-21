/**
 * Feed payload for shared AI activity status.
 * Validated before display to ensure correct UI state transitions.
 */

export const AI_STATUS_VALUES = ["started", "completed", "failed"] as const;

export type AIStatus = (typeof AI_STATUS_VALUES)[number];

/** Terminal statuses that clear the active-generation UI */
export const AI_TERMINAL_STATUSES: readonly AIStatus[] = [
  "completed",
  "failed",
];

export interface AIStatusFeedPayload {
  /** Required lifecycle status */
  status: AIStatus;
  /** Optional user-facing message */
  text?: string;
}

export function isValidAIStatus(value: unknown): value is AIStatus {
  return AI_STATUS_VALUES.includes(value as AIStatus);
}

export function isTerminalAIStatus(status: AIStatus): boolean {
  return AI_TERMINAL_STATUSES.includes(status);
}

export function validateAIStatusFeedPayload(
  data: unknown
): data is AIStatusFeedPayload {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  if (!isValidAIStatus(candidate.status)) return false;
  if (candidate.text !== undefined && typeof candidate.text !== "string")
    return false;
  return true;
}
