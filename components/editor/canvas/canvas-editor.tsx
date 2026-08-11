"use client";

import { useRef, useState, useCallback, useEffect, useMemo, useLayoutEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useMyPresence, useEventListener } from "@liveblocks/react";
import { AIActivityListener } from "../ai/ai-activity-listener";
import { ShapePanel } from "./shape-panel";
import CanvasNodeRenderer from "./canvas-node-renderer";
import { CustomCanvasEdge } from "./custom-canvas-edge";
import { ControlBar } from "./canvas-controls";
import { CanvasTemplate } from "../templates/starter-templates";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { Shape, NODE_COLORS } from "@/types/canvas";
import { Loader2 } from "lucide-react";
import { PresenceCursors } from "./presence-cursors";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

const edgeTypes = {
  canvasEdge: CustomCanvasEdge,
};

// `data` is always required on React Flow nodes — the hook needs that to
// infer a non-`never` element type. Making `type` required here matches the
// concrete values we always pass ("canvasNode" / "canvasEdge").
interface CanvasNodeSpec {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
}

interface CanvasEdgeSpec {
  id: string;
  type: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data: Record<string, unknown>;
}

type FlowNode = CanvasNodeSpec;
type FlowEdge = CanvasEdgeSpec;

type PreviewState = {
  shape: Shape;
  width: number;
  height: number;
  x: number;
  y: number;
} | null;

const normalizeEdgeData = (data: Record<string, unknown> | undefined) => {
  const label = (data?.label as string | undefined);
  return label && label.trim() ? { label: label.trim() } : {};
};

const normalizeEdgeHandle = (value: unknown, prefix: "source" | "target"): string | null | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const side = value.replace(/-target$/, "");
  const allowed = ["top", "bottom", "left", "right"];
  if (!allowed.includes(side)) return undefined;
  return prefix === "target" ? `${side}-target` : side;
};

// Approximate rendered height of an edge label pill (2px pad + 12px text
// + 2px pad + 1px borders). Spec §3 asks for ~2× this between adjacent
// parallel connector labels.
const LABEL_HEIGHT_PX = 25; // target ~50px gap between adjacent parallel labels
const LABEL_GAP_PX = LABEL_HEIGHT_PX * 2;
// Labels whose natural midpoints fall inside the same cell are treated as
// colliding. Cell is one label-gap tall and reasonably narrow horizontally.
const COLLISION_CELL_X = 120;
const COLLISION_CELL_Y = LABEL_GAP_PX;

/**
 * Deterministic label de-collision.
 *
 * A smoothstep edge renders its label at the midpoint between the source and
 * target anchors. Two different connectors running parallel and close together
 * therefore produce two labels at nearly the same point — they overlap and
 * read as "one connector with two labels", even though each edge owns exactly
 * one label.
 *
 * We bucket every labelled edge by its approximate midpoint cell, then fan the
 * members of each bucket out along the axis perpendicular to their dominant
 * direction, spaced by 2× the label height. Purely a render-time offset: node
 * positions, edge routing, and stored data are untouched, and the result is a
 * pure function of geometry so every client computes the same layout.
 *
 * In addition to the label offset, edges that share the same source→target
 * pair are fan-spread by 50px (path offset) so their connector paths run
 * parallel with ~50px separation instead of overlapping. The two offsets are
 * combined and injected into edge.data in memory (never persisted).
 */
type EdgeOffset = { dx: number; dy: number; pathOffset: number };
const PATH_GAP_PX = 50; // ~50px separation between parallel connector paths

function computeLabelOffsets(
  edges: readonly FlowEdge[],
  nodes: readonly FlowNode[],
): Record<string, EdgeOffset> {
  const centers = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const w = typeof n.width === "number" && n.width > 0 ? n.width : 140;
    const h = typeof n.height === "number" && n.height > 0 ? n.height : 80;
    centers.set(n.id, { x: n.position.x + w / 2, y: n.position.y + h / 2 });
  }

  type Entry = { id: string; mx: number; my: number; vertical: boolean; src: string; tgt: string };
  const buckets = new Map<string, Entry[]>();

  for (const e of edges) {
    // Only labelled edges can collide visually.
    const label = e.data?.label;
    if (typeof label !== "string" || !label.trim()) continue;
    const s = centers.get(e.source);
    const t = centers.get(e.target);
    if (!s || !t) continue;

    const mx = (s.x + t.x) / 2;
    const my = (s.y + t.y) / 2;
    // Dominant direction of the connector. A mostly-vertical connector gets
    // its labels spread horizontally, and vice versa, so the offset never
    // pushes a label along the line it is annotating.
    const vertical = Math.abs(t.y - s.y) >= Math.abs(t.x - s.x);

    const cell = `${Math.round(mx / COLLISION_CELL_X)}:${Math.round(my / COLLISION_CELL_Y)}:${vertical ? "v" : "h"}`;
    const list = buckets.get(cell);
    if (list) list.push({ id: e.id, mx, my, vertical, src: e.source, tgt: e.target });
    else buckets.set(cell, [{ id: e.id, mx, my, vertical, src: e.source, tgt: e.target }]);
  }

  // Path separation: group edges by their source→target pair. Any pair with
  // more than one edge is a set of parallel connectors — fan them apart by
  // 50px perpendicular to their dominant direction so paths don't overlap.
  const pairGroups = new Map<string, { id: string; vertical: boolean; mx: number; my: number }[]>();
  for (const members of buckets.values()) {
    for (const m of members) {
      const key = `${m.src}->${m.tgt}`;
      const list = pairGroups.get(key);
      if (list) list.push({ id: m.id, vertical: m.vertical, mx: m.mx, my: m.my });
      else pairGroups.set(key, [{ id: m.id, vertical: m.vertical, mx: m.mx, my: m.my }]);
    }
  }

  const offsets: Record<string, EdgeOffset> = {};

  // 1. Path fan-out for parallel connectors (50px separation).
  for (const members of pairGroups.values()) {
    if (members.length < 2) continue;
    members.sort((a, b) => a.mx - b.mx || a.my - b.my || a.id.localeCompare(b.id));
    const center = (members.length - 1) / 2;
    members.forEach((m, i) => {
      const shift = (i - center) * PATH_GAP_PX;
      offsets[m.id] = {
        dx: 0,
        dy: 0,
        pathOffset: m.vertical ? shift : shift, // sign applied by renderer per orientation
      };
    });
  }

  // 2. Label de-collision (keep existing fan-out for label readability).
  for (const members of buckets.values()) {
    if (members.length < 2) continue;
    members.sort((a, b) => a.mx - b.mx || a.my - b.my || a.id.localeCompare(b.id));
    const center = (members.length - 1) / 2;
    members.forEach((m, i) => {
      const shift = (i - center) * LABEL_GAP_PX;
      const existing = offsets[m.id] ?? { dx: 0, dy: 0, pathOffset: 0 };
      if (m.vertical) existing.dx = shift;
      else existing.dy = shift;
      offsets[m.id] = existing;
    });
  }

  return offsets;
}

function ShapeDragPreview({
  shape,
  width,
  height,
  x,
  y,
}: {
  shape: Shape;
  width: number;
  height: number;
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed pointer-events-none z-9999"
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: 0.7,
        transform: "translate(-50%, -50%)",
      }}
    >
      {shape === "rectangle" && (
        <div className="h-full w-full rounded-md bg-bg-surface border-2 border-accent-primary flex items-center justify-center">
          <div className="text-xs font-bold text-text-primary">Rect</div>
        </div>
      )}
      {shape === "circle" && (
        <div className="h-full w-full rounded-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center">
          <div className="text-xs font-bold text-text-primary">O</div>
        </div>
      )}
      {shape === "pill" && (
        <div className="h-full w-full rounded-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center">
          <div className="text-xs font-bold text-text-primary">Pill</div>
        </div>
      )}
      {shape === "diamond" && (
        <div
          className="h-full w-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center"
          style={{ clipPath: `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` }}
        >
          <div className="text-xs font-bold text-text-primary transform -rotate-45">&#x25B2;</div>
        </div>
      )}
      {shape === "hexagon" && (
        <div
          className="h-full w-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center"
          style={{
            clipPath: `polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`,
          }}
        >
          <div className="text-xs font-bold text-text-primary">H</div>
        </div>
      )}
      {shape === "cylinder" && (
        <div className="h-full w-full rounded-[2rem] bg-bg-surface border-2 border-accent-primary flex items-center justify-center">
          <div className="text-xs font-bold text-text-primary">C</div>
        </div>
      )}
      {shape === "triangle" && (
        <div
          className="h-full w-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center"
          style={{ clipPath: `polygon(50% 0%, 100% 100%, 0% 100%)` }}
        >
          <div className="text-xs font-bold text-text-primary transform -rotate-90">▲</div>
        </div>
      )}
      {shape === "database" && (
        <div className="h-full w-full bg-bg-surface border-2 border-accent-primary flex items-center justify-center">
          <div className="text-xs font-bold text-text-primary">DB</div>
        </div>
      )}
    </div>
  );
}

function CanvasContent({
  importTemplate,
  clearImportTemplate,
  projectId,
  onSaveStatusChange,
  onSaveNowRef,
  onCanvasChange,
}: {
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
  projectId: string;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onSaveNowRef?: (fn: () => void) => void;
  onCanvasChange?: (nodes: unknown[], edges: unknown[]) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onDelete,
  } = useLiveblocksFlow<FlowNode, FlowEdge>({
    nodes: { initial: [] },
    edges: { initial: [] },
  });
  const { getNodes, getEdges } = useReactFlow();

  const { saveNow } = useCanvasAutosave({
    projectId,
    enabled: true,
    onStatusChange: onSaveStatusChange,
  });

  useEffect(() => {
    onSaveNowRef?.(saveNow);
  }, [saveNow, onSaveNowRef]);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [, updateMyPresence] = useMyPresence();

  const [preview, setPreview] = useState<PreviewState>(null);
  const previewRef = useRef<PreviewState>(null);
  const { zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

  useLayoutEffect(() => {
    onCanvasChange?.(nodes ?? [], edges ?? []);
  }, [nodes, edges, onCanvasChange]);

  // ── ALL storage mutations route through onNodesChange / onEdgesChange ──
  // Liveblocks' own applyNodeChanges wraps new nodes via toLiveblocksInternalNode,
  // which attaches the `setLocal` method React Flow's mutation pipeline requires.
  // Raw `new LiveObject({...})` omits that method and crashes React Flow on the
  // next drag/resize/select with "node.setLocal is not a function".
  const addNode = useCallback(
    (node: CanvasNodeSpec) => {
      onNodesChange([{ type: "add", item: { ...node, type: "canvasNode" } }]);
    },
    [onNodesChange],
  );

  const addNodesAndEdges = useCallback(
    (params: { nodes: CanvasNodeSpec[]; edges: CanvasEdgeSpec[] }) => {
      if (params.nodes.length) {
        onNodesChange(params.nodes.map((n) => ({ type: "add", item: { ...n, type: "canvasNode" } })));
      }
      if (params.edges.length) {
        onEdgesChange(params.edges.map((e) => ({ type: "add", item: { ...e, type: "canvasEdge" } })));
      }
    },
    [onNodesChange, onEdgesChange],
  );

  const resetCanvas = useCallback(
    (params: { nodes: CanvasNodeSpec[]; edges: CanvasEdgeSpec[] }) => {
      // Safe guard: only run if nodes/edges loaded
      if (!nodes || !edges) return;

      // Clear existing first, then add new. Both paths go through Liveblocks'
      // change handlers so every stored node is a proper internal node.
      if (nodes.length) onNodesChange(nodes.map((n) => ({ type: "remove", id: n.id })));
      if (edges.length) onEdgesChange(edges.map((e) => ({ type: "remove", id: e.id })));
      if (params.nodes.length) {
        onNodesChange(params.nodes.map((n) => ({ type: "add", item: { ...n, type: "canvasNode" } })));
      }
      if (params.edges.length) {
        onEdgesChange(params.edges.map((e) => ({ type: "add", item: { ...e, type: "canvasEdge" } })));
      }
    },
    [onNodesChange, onEdgesChange, nodes, edges],
  );

  // Listen for AI canvas update events broadcast by design-agent
  useEventListener(({ event }) => {
    const ev = event as unknown as { type: string; nodes?: unknown[]; edges?: unknown[] };
    if (ev.type !== "AI_CANVAS_UPDATE") return;

    const { nodes: aiNodes, edges: aiEdges } = ev;

    // Storage may not be loaded yet — nothing to reconcile against.
    if (!nodes || !edges) return;

    const existingNodeIds = new Set(nodes.map((n) => n.id));
    const existingEdgeIds = new Set(edges.map((e) => e.id));
    // Connector identity for label purposes is the source→target pair, not the
    // generated edge id. A second AI run emits fresh ids for the same pair; a
    // pure id check would let both through and render two labels stacked on
    // top of each other at the same midpoint.
    const existingEdgePairs = new Set(
      (edges as { source?: string; target?: string }[]).map(
        (e) => `${e.source}->${e.target}`,
      ),
    );

    if (!Array.isArray(aiNodes) || aiNodes.length === 0) {
      // Edges only — validate against existing nodes
      if (Array.isArray(aiEdges) && aiEdges.length) {
        const seenPairs = new Set<string>();
        const validEdges: CanvasEdgeSpec[] = [];
        for (const rawEdge of aiEdges) {
          if (!rawEdge || typeof rawEdge !== "object") continue;
          const e = rawEdge as Record<string, unknown>;
          if (
            typeof e.id !== "string" ||
            typeof e.source !== "string" ||
            typeof e.target !== "string"
          ) continue;
          if (!existingNodeIds.has(e.source) || !existingNodeIds.has(e.target)) continue;
          if (existingEdgeIds.has(e.id)) continue;
          const pair = `${e.source}->${e.target}`;
          if (existingEdgePairs.has(pair) || seenPairs.has(pair)) continue;
          seenPairs.add(pair);
          validEdges.push({
            id: e.id,
            type: "canvasEdge",
            source: e.source,
            target: e.target,
            sourceHandle: normalizeEdgeHandle(e.sourceHandle, "source"),
            targetHandle: normalizeEdgeHandle(e.targetHandle, "target"),
            data: normalizeEdgeData(e.data as Record<string, unknown> | undefined),
          });
        }
        addNodesAndEdges({ nodes: [], edges: validEdges });
      }
      return;
    }

    // Nodes present — normalize and insert
    const normalizedNodes: CanvasNodeSpec[] = aiNodes
      .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
      .map((n) => {
        const pos = n.position;
        const hasValidPos =
          pos && typeof pos === "object" &&
          typeof (pos as { x?: unknown }).x === "number" &&
          typeof (pos as { y?: unknown }).y === "number";
        const position = hasValidPos
          ? (pos as { x: number; y: number })
          : {
              x: typeof n.x === "number" ? (n.x as number) : 0,
              y: typeof n.y === "number" ? (n.y as number) : 0,
            };
        const rawData = n.data as Record<string, unknown> | undefined;
        return {
          id: typeof n.id === "string" ? n.id : crypto.randomUUID(),
          type: "canvasNode",
          position,
          data:
            rawData ??
            (typeof n.label === "string" ? { label: n.label } : { label: "" }),
          ...(typeof n.width === "number" ? { width: n.width } : {}),
          ...(typeof n.height === "number" ? { height: n.height } : {}),
        };
      });

    const newOnlyNodes = normalizedNodes.filter((n) => !existingNodeIds.has(n.id));
    const incomingNodeIds = new Set(normalizedNodes.map((n) => n.id));

    // Same pair-dedup rule as the edges-only branch: one connector per
    // source→target pair. A repeated pair must never create a second edge —
    // two edges on the same pair render two labels stacked at the same
    // midpoint and read as "one connector with two labels".
    const seenPairs = new Set<string>();
    const validEdges: CanvasEdgeSpec[] = [];
    if (Array.isArray(aiEdges) && aiEdges.length) {
      for (const rawEdge of aiEdges) {
        if (!rawEdge || typeof rawEdge !== "object") continue;
        const e = rawEdge as Record<string, unknown>;
        if (
          typeof e.id !== "string" ||
          typeof e.source !== "string" ||
          typeof e.target !== "string") continue;
        if (!incomingNodeIds.has(e.source) && !existingNodeIds.has(e.source)) continue;
        if (!incomingNodeIds.has(e.target) && !existingNodeIds.has(e.target)) continue;
        if (existingEdgeIds.has(e.id)) continue;
        const pair = `${e.source}->${e.target}`;
        if (existingEdgePairs.has(pair) || seenPairs.has(pair)) continue;
        seenPairs.add(pair);
        validEdges.push({
          id: e.id,
          type: "canvasEdge",
          source: e.source,
          target: e.target,
          sourceHandle: normalizeEdgeHandle(e.sourceHandle, "source"),
          targetHandle: normalizeEdgeHandle(e.targetHandle, "target"),
          data: normalizeEdgeData(e.data as Record<string, unknown> | undefined),
        });
      }
    }

    addNodesAndEdges({ nodes: newOnlyNodes, edges: validEdges });
  });

  // Delete handler: collects selected node+edge IDs, routes deletion through
  // Liveblocks-backed onDelete so removal syncs across collaborators. Skip if
  // nothing selected — prevents accidental deletion of unrelated objects.
  const handleDeleteSelected = useCallback(() => {
    const sel = getNodes()
      .filter((n) => (n as { selected?: boolean }).selected) as FlowNode[];
    const selEdges = getEdges()
      .filter((e) => (e as { selected?: boolean }).selected) as FlowEdge[];
    if (sel.length || selEdges.length) {
      onDelete({ nodes: sel, edges: selEdges });
    }
  }, [getNodes, getEdges, onDelete]);

  useKeyboardShortcuts({ zoomIn, zoomOut, undo, redo, onDelete: handleDeleteSelected });

  // Broadcast cursor position via Liveblocks presence
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: { x: position.x, y: position.y } });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Apply starter template atomically
  useEffect(() => {
    if (importTemplate) {
      resetCanvas({
        nodes: importTemplate.nodes as CanvasNodeSpec[],
        edges: importTemplate.edges as CanvasEdgeSpec[],
      });
      clearImportTemplate();
    }
  }, [importTemplate, clearImportTemplate, resetCanvas]);

  // Deterministic canvas restore lifecycle.
  // Runs ONCE per projectId via useLayoutEffect. Fetches saved canvas from API;
  // abort + ignore stale results when switching projects.
  const [doneProjectId, setDoneProjectId] = useState<string | null>(null);
  const loadingSaved = doneProjectId !== projectId;
  const fetchControllerRef = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    fetch(`/api/projects/${projectId}/canvas`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) return null; // empty canvas is valid
          const text = await res.text();
          throw new Error(`Canvas fetch failed: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const convertedNodes =
          data?.nodes && Object.keys(data.nodes).length > 0
            ? Object.entries(data.nodes).map(([id, n]) => {
                const node = n as { position?: { x: number; y: number }; data?: Record<string, unknown> };
                return {
                  id,
                  type: "canvasNode",
                  position: node.position ?? { x: 0, y: 0 },
                  data: node.data ?? { label: "" },
                };
              })
            : [];
        const convertedEdges =
          data?.edges && Object.keys(data.edges).length > 0
            ? Object.entries(data.edges).map(([id, n]) => {
                const edge = n as { source?: string; target?: string; data?: Record<string, unknown> };
                return {
                  id,
                  type: "canvasEdge",
                  source: edge.source ?? "",
                  target: edge.target ?? "",
                  data: edge.data ?? {},
                };
              })
            : [];
        resetCanvas({ nodes: convertedNodes, edges: convertedEdges });
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Failed to restore canvas:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDoneProjectId(projectId);
          onSaveStatusChange?.("idle");
        }
      });

    return () => controller.abort();
  }, [projectId, resetCanvas, onSaveStatusChange]);

  // Update ref whenever preview changes
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const onConnect = useCallback(
    (connection: { source: string; target: string; sourceHandle: string | null; targetHandle: string | null }) => {
      if (!connection.source || !connection.target) return;
      const edgeId = `edge-${connection.source}-${connection.target}-${crypto.randomUUID().slice(0, 5)}`;
      onEdgesChange([
        {
          type: "add",
          item: {
            id: edgeId,
            type: "canvasEdge",
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle ?? null,
            targetHandle: connection.targetHandle ?? null,
            data: {},
          },
        },
      ]);
    },
    [onEdgesChange],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setPreview(null);

      const raw = event.dataTransfer.getData("application/ghost-shape");
      if (!raw || !wrapperRef.current) return;

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const shape = payload.shape as Shape;
      const size = payload.size ?? { width: 150, height: 100 };

      // Convert screen position to flow position; center node on cursor
      // Account for the +20 Y offset in dragStart preview
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY - 20,
      });
      const position = {
        x: flowPos.x - size.width / 2,
        y: flowPos.y - size.height / 2,
      };

      const newNode: CanvasNodeSpec = {
        id: `${shape}-${crypto.randomUUID()}`,
        type: "canvasNode",
        position,
        width: size.width,
        height: size.height,
        data: {
          label: "",
          fill: NODE_COLORS[0].fill,
          text: NODE_COLORS[0].text,
          shape,
        },
      };

      addNode(newNode);
    },
    [wrapperRef, addNode, screenToFlowPosition],
  );

  // Deletion is handled by <ReactFlow onDelete>, wired to the Liveblocks-backed
  // onDelete mutation. Nodes and edges from every source (manual, template, AI)
  // live in the same storage map, so all of them delete identically and the
  // removal syncs to collaborators.

  const handleDragStart = useCallback(
    (shape: Shape, clientX: number, clientY: number) => {
      setPreview({
        shape,
        width: shape === "circle" ? 100 : 150,
        height: 100,
        x: clientX,
        y: clientY + 20,
      });
    },
    [],
  );

  // track global drag to move preview with cursor
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const p = previewRef.current;
      if (!p) return;
      setPreview({ ...p, x: e.clientX, y: e.clientY + 20 });
    };
    const onDragEnd = () => setPreview(null);

    window.addEventListener("drag", onMouseMove);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      window.removeEventListener("drag", onMouseMove);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  // Ensure every node has a valid position object before ReactFlow adopts it
  const safeNodes = useMemo(() => {
    const raw = (nodes ?? []) as Array<{ position?: { x: number; y: number } }>;
    return raw.map((n) => {
      const pos = n.position;
      if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
        return { ...n, position: { x: 0, y: 0 } };
      }
      return n;
    }) as typeof nodes;
  }, [nodes]);

  // Per-edge label offsets that de-collide adjacent/parallel connector labels.
  // Pure function of current geometry, injected as a render-only field on
  // edge.data — never written back to Liveblocks storage.
  const safeEdges = useMemo(() => {
    const list = (edges ?? []) as FlowEdge[];
    if (!list.length) return edges;
    const offsets = computeLabelOffsets(list, (safeNodes ?? []) as FlowNode[]);
    if (!Object.keys(offsets).length) return edges;
    return list.map((e) => {
      const off = offsets[e.id];
      return off ? { ...e, data: { ...e.data, labelOffset: off } } : e;
    }) as typeof edges;
  }, [edges, safeNodes]);

  if (!nodes) return null;

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }} className="relative">
      {loadingSaved && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-base/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      )}
      <AIActivityListener />
      <PresenceCursors />
      {preview && (
        <ShapeDragPreview
          shape={preview.shape}
          width={preview.width}
          height={preview.height}
          x={preview.x}
          y={preview.y}
        />
      )}
      <ReactFlow
        nodes={safeNodes as typeof nodes}
        edges={safeEdges as typeof edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={{
          type: "canvasEdge",
          animated: false,
          data: { persistent: true },
        }}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={() => true}
        connectOnClick
        snapGrid={[20, 20]}
        onConnect={onConnect}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[2]}
        selectionMode={SelectionMode.Full}
      >
        <svg>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12.5"
              markerHeight="12.5"
              viewBox="-0 -5 10 10"
              refX="10"
              refY="0"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,-5L10,0L0,5" fill="#505060" />
            </marker>
          </defs>
        </svg>
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <ControlBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <ShapePanel onDragStart={handleDragStart} />
    </div>
  );
}

export function BaseCanvas({
  roomId,
  importTemplate,
  clearImportTemplate,
  projectId,
  onSaveStatusChange,
  onSaveNowRef,
  onCanvasChange,
}: {
  roomId: string;
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
  projectId?: string;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onSaveNowRef?: (fn: () => void) => void;
  onCanvasChange?: (nodes: unknown[], edges: unknown[]) => void;
}) {
  return (
    <ReactFlowProvider>
      <CanvasContent
        importTemplate={importTemplate}
        clearImportTemplate={clearImportTemplate}
        projectId={projectId ?? roomId}
        onSaveStatusChange={onSaveStatusChange}
        onSaveNowRef={onSaveNowRef}
        onCanvasChange={onCanvasChange}
      />
    </ReactFlowProvider>
  );
}
