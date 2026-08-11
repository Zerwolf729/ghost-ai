"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useStorage } from "@liveblocks/react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  debounceMs?: number;
  enabled?: boolean;
  onStatusChange?: (status: SaveStatus) => void;
}

interface UseCanvasAutosaveReturn {
  status: SaveStatus;
  saveNow: () => void;
  lastSavedAt: Date | null;
}

export function useCanvasAutosave({
  projectId,
  debounceMs = 3000,
  enabled = true,
  onStatusChange,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Watch storage — use broad selector to detect any change, then access LiveMap inside
  const storage = useStorage((root) => root) as unknown as {
    flow?: {
      nodes?: { toObject?: () => Record<string, unknown>; forEach?: (cb: (node: unknown, key: string) => void) => void };
      edges?: { toObject?: () => Record<string, unknown>; forEach?: (cb: (edge: unknown, key: string) => void) => void };
    };
  };

  // Create stable snapshot keys that change when storage content changes
  // Guard: nodes/edges may not be LiveMap on fresh project (no toObject)
  const storageFingerprint =
    storage?.flow &&
    typeof (storage.flow as { nodes?: { toObject?: () => unknown } }).nodes?.toObject === "function" &&
    typeof (storage.flow as { edges?: { toObject?: () => unknown } }).edges?.toObject === "function"
      ? JSON.stringify({
          nodes: (storage.flow as { nodes: { toObject: () => Record<string, unknown> } }).nodes.toObject(),
          edges: (storage.flow as { edges: { toObject: () => Record<string, unknown> } }).edges.toObject(),
        })
      : null;

  const serialize = useCallback(() => {
    const nodesObj: Record<string, unknown> = {};
    const edgesObj: Record<string, unknown> = {};

    if (storage?.flow) {
      const nodesMap = (storage.flow as { nodes?: { forEach?: (cb: (node: unknown, key: string) => void) => void } }).nodes;
      if (typeof nodesMap?.forEach === "function") {
        nodesMap.forEach((node: unknown, key: string) => {
          const n = node as { toImmutable?: () => unknown };
          nodesObj[key] = n.toImmutable?.() ?? { ...(node as Record<string, unknown>) };
        });
      }

      const edgesMap = (storage.flow as { edges?: { forEach?: (cb: (edge: unknown, key: string) => void) => void } }).edges;
      if (typeof edgesMap?.forEach === "function") {
        edgesMap.forEach((edge: unknown, key: string) => {
          const e = edge as { toImmutable?: () => unknown };
          edgesObj[key] = e.toImmutable?.() ?? { ...(edge as Record<string, unknown>) };
        });
      }
    }

    return { nodes: nodesObj, edges: edgesObj };
  }, [storage]);

  const persist = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    onStatusChange?.("saving");

    try {
      const payload = serialize();
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setStatus("saved");
      setLastSavedAt(new Date());
      onStatusChange?.("saved");
    } catch {
      setStatus("error");
      onStatusChange?.("error");
    } finally {
      savingRef.current = false;
    }
  }, [projectId, serialize, onStatusChange]);

  // Reset to idle after "saved" visible for 2s
  useEffect(() => {
    if (status === "saved") {
      const t = setTimeout(() => {
        setStatus("idle");
        onStatusChange?.("idle");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, onStatusChange]);

  // Debounced autosave on storage change
  useEffect(() => {
    if (!enabled) return;
    if (!storageFingerprint) return;

    const snapshot = serialize();
    const hasContent =
      Object.keys(snapshot.nodes).length > 0 || Object.keys(snapshot.edges).length > 0;
    if (!hasContent) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persist();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storageFingerprint, debounceMs, enabled, persist, serialize]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    persist();
  }, [persist]);

  return { status, saveNow, lastSavedAt };
}