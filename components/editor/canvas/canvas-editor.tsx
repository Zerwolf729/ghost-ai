"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useMyPresence, useMutation } from "@liveblocks/react";
import { LiveblocksCanvasWrapper } from "./liveblocks-canvas-wrapper";
import { ShapePanel } from "./shape-panel";
import CanvasNodeRenderer from "./canvas-node-renderer";
import { CustomCanvasEdge } from "./custom-canvas-edge";
import { ControlBar } from "./canvas-controls";
import { CanvasTemplate } from "../templates/starter-templates";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { Shape } from "@/types/canvas";
import { Loader2 } from "lucide-react";
import { CollaboratorAvatars } from "./collaborator-avatars";
import { PresenceCursors } from "./presence-cursors";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

const edgeTypes = {
  canvasEdge: CustomCanvasEdge,
};

type PreviewState = {
  shape: Shape;
  width: number;
  height: number;
  x: number;
  y: number;
} | null;

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
      className="fixed pointer-events-none z-[9999]"
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
}: {
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
  projectId: string;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onSaveNowRef?: (fn: () => void) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow({
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const { status, saveNow } = useCanvasAutosave({
    projectId,
    enabled: autosaveEnabled,
    onStatusChange: onSaveStatusChange,
  });

  // Expose saveNow to parent
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
  const { setNodes, setEdges, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

  useKeyboardShortcuts({ zoomIn, zoomOut, undo, redo });

  // Delete key handler — removes selected nodes/edges via Liveblocks storage
  const deleteSelected = useMutation(
    ({ storage }, nodeIds: string[], edgeIds: string[]) => {
      const flow = storage.get("flow");
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");
      nodeIds.forEach((id) => nodesMap.delete(id));
      edgeIds.forEach((id) => edgesMap.delete(id));
    },
    []
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();

      // Convert LiveMaps to arrays for filtering
      const nodesArray = Array.from((nodes as any)?.values?.() ?? []);
      const edgesArray = Array.from((edges as any)?.values?.() ?? []);
      const selectedNodeIds = nodesArray
        .filter((n: any) => n.selected)
        .map((n: any) => n.id);
      const selectedEdgeIds = edgesArray
        .filter((e: any) => e.selected)
        .map((e: any) => e.id);

      if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;
      deleteSelected(selectedNodeIds, selectedEdgeIds);
    },
    [nodes, edges, deleteSelected]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Broadcast cursor position via Liveblocks presence
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: { x: position.x, y: position.y } });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Apply starter template
  useEffect(() => {
    if (importTemplate) {
      const { nodes, edges } = importTemplate;
      setNodes(nodes);
      setEdges(edges);
      clearImportTemplate();
    }
  }, [importTemplate, clearImportTemplate, setNodes, setEdges]);

  // Load saved canvas when room is empty
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoreAttempted = useRef(false);

  useEffect(() => {
    if (restoreAttempted.current) return;
    if (!nodes || !edges) return;
    restoreAttempted.current = true;

    const hasExisting = Array.from(nodes.values()).length > 0;
    if (hasExisting) {
      onSaveStatusChange?.("idle");
      setAutosaveEnabled(true);
      return;
    }

    let cancelled = false;
    setLoadingSaved(true);
    setRestoreError(null);

    fetch(`/api/projects/${projectId}/canvas`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) return null;
          const text = await res.text();
          throw new Error(`Canvas fetch failed: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data || cancelled) return;
        if (data.nodes && Object.keys(data.nodes).length > 0) {
          const convertedNodes = Object.entries(data.nodes).map(
            ([id, n]) => {
              const node = n as any;
              return {
                id,
                type: "canvasNode",
                position: node.position ?? { x: 0, y: 0 },
                data: node.data ?? { label: "" },
              };
            }
          );
          setNodes(convertedNodes);
        }
        if (data.edges && Object.keys(data.edges).length > 0) {
          const convertedEdges = Object.entries(data.edges).map(
            ([id, n]) => {
              const edge = n as any;
              return {
                id,
                type: "canvasEdge",
                source: edge.source ?? "",
                target: edge.target ?? "",
                data: edge.data ?? {},
              };
            }
          );
          setEdges(convertedEdges);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to restore canvas:", err);
          setRestoreError(err.message || "Failed to load saved canvas");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSaved(false);
          setAutosaveEnabled(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // run once when Liveblocks storage is first available
  }, [nodes]);

  // Update ref whenever preview changes
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

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
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: flowPos.x - size.width / 2,
        y: flowPos.y - size.height / 2,
      };

      const newNode = {
        id: `${shape}-${crypto.randomUUID()}`,
        type: "canvasNode",
        position,
        width: size.width,
        height: size.height,
        data: {
          label: "",
          fill: "default",
          shape,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [wrapperRef, setNodes, screenToFlowPosition]
  );

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
    []
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

  if (!nodes) return null;

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }} className="relative">
      {loadingSaved && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-base/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      )}
      <CollaboratorAvatars />
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
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
}: {
  roomId: string;
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
  projectId?: string;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onSaveNowRef?: (fn: () => void) => void;
}) {
  return (
    <LiveblocksCanvasWrapper roomId={roomId}>
      <ReactFlowProvider>
        <CanvasContent
          importTemplate={importTemplate}
          clearImportTemplate={clearImportTemplate}
          projectId={projectId ?? roomId}
          onSaveStatusChange={onSaveStatusChange}
          onSaveNowRef={onSaveNowRef}
        />
      </ReactFlowProvider>
    </LiveblocksCanvasWrapper>
  );
}
