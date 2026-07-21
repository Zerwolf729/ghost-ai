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
  const storage = useStorage((root) => root) as any;

  // Create stable snapshot keys that change when storage content changes
  const storageFingerprint = storage?.flow
    ? JSON.stringify({
        nodes: storage.flow.nodes.toObject(),
        edges: storage.flow.edges.toObject(),
      })
    : null;

  const serialize = useCallback(() => {
    const nodesObj: Record<string, unknown> = {};
    const edgesObj: Record<string, unknown> = {};

    if (storage?.flow) {
      const nodesMap = storage.flow.nodes;
      nodesMap.forEach((node: any, key: string) => {
        nodesObj[key] = node.toImmutable?.() ?? { ...node };
      });

      const edgesMap = storage.flow.edges;
      edgesMap.forEach((edge: any, key: string) => {
        edgesObj[key] = edge.toImmutable?.() ?? { ...(edge) };
      });
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

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persist();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageFingerprint, debounceMs, enabled, persist]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    persist();
  }, [persist]);

  return { status, saveNow, lastSavedAt };
}