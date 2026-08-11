"use client";

import { useEventListener } from "@liveblocks/react";
import { useAIStatus } from "./ai-status-context";
import { AI_STATUS_VALUES, type AIStatus } from "@/types/tasks";

/**
 * Must be rendered inside a Liveblocks RoomProvider.
 * Listens for AI_STATUS broadcast events and syncs to shared AIStatusContext
 * so the sidebar can display status outside the room.
 */
export function AIActivityListener() {
  const { setStatus } = useAIStatus();

  useEventListener(({ event }) => {
    const ev = event as unknown as { type?: unknown; status?: unknown; text?: unknown };
    if (ev.type !== "AI_STATUS") return;
    if (typeof ev.status !== "string") return;
    if (!AI_STATUS_VALUES.includes(ev.status as AIStatus) && ev.status !== "idle") return;
    setStatus(ev.status as AIStatus, typeof ev.text === "string" ? ev.text : undefined);
  });

  return null;
}
