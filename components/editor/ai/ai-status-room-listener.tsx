import { useEventListener } from "@liveblocks/react";
import { useEffect } from "react";

export function AIStatusRoomListener({ onReset }: { onReset: (msg?: string) => void }) {
  useEventListener(({ event }) => {
    const ev = event as unknown as { type?: unknown; status?: unknown; text?: unknown; message?: unknown };
    if (ev.type !== "AI_STATUS" || typeof ev.status !== "string") return;
    if (ev.status === "completed" || ev.status === "failed") {
      const errMsg = typeof ev.text === "string" ? ev.text : (typeof ev.message === "string" ? ev.message : "AI run failed");
      onReset(ev.status === "failed" ? errMsg : undefined);
    }
  });
  return null;
}
