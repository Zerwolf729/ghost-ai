import { useRealtimeRun as useTriggerRealtimeRun } from "@trigger.dev/react-hooks";
import type { AnyTask } from "@trigger.dev/core/v3";
import type { RealtimeRun } from "@trigger.dev/core/v3";

/** Statuses we surface to the UI. */
export type RunStatus = "idle" | "running" | "completed" | "failed";

/**
 * Subscribes to a Trigger.dev task run via the realtime stream.
 *
 * - `runId` and `accessToken` (a public token) are both required before subscribing.
 * - Returns `isActive` = run is in a non-terminal, started state.
 * - `onComplete` fires when the run settles.
 * - Scope: read `status` column only, no payload/output, to keep bandwidth minimal.
 */
export function useRealtimeRun<TTask extends AnyTask = AnyTask>(
  runId?: string,
  accessToken?: string,
  onComplete?: (run: RealtimeRun<TTask>, err?: Error) => void
): { isActive: boolean; status: RunStatus; stop: () => void } {
  const enabled = Boolean(runId && accessToken);

  const { run, stop } = useTriggerRealtimeRun(runId ?? "", {
    accessToken,
    enabled,
    skipColumns: ["payload", "output"],
    onComplete: onComplete as (run: RealtimeRun<AnyTask>, err?: Error) => void,
  });

  // When the subscription is disabled (runId cleared after the run settled),
  // the underlying hook keeps its last `run` snapshot — often still EXECUTING,
  // because the agent broadcasts its own completion event before the Trigger
  // run itself transitions to COMPLETED. Reporting that stale snapshot pins
  // `isActive` to true forever and leaves the sidebar stuck on
  // "AI run in progress...". Not subscribed => idle.
  const status: RunStatus = enabled && run
    ? (() => {
        const s = run.status;
        if (
          s === "EXECUTING" ||
          s === "QUEUED" ||
          s === "DEQUEUED" ||
          s === "WAITING" ||
          s === "DELAYED"
        )
          return "running";
        if (s === "COMPLETED") return "completed";
        if (s === "FAILED" || s === "CRASHED" || s === "SYSTEM_FAILURE" || s === "TIMED_OUT")
          return "failed";
        return "idle";
      })()
    : "idle";

  const isActive = status === "running";

  return { isActive, status, stop };
}