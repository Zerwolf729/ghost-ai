"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { ConnectionMode } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { LiveblocksCanvasWrapper } from "./liveblocks-canvas-wrapper";
import { ShapePanel } from "./shape-panel";
import CanvasNodeRenderer from "./CanvasNodeRenderer";
import { CustomCanvasEdge } from "./custom-canvas-edge";
import { ControlBar } from "./control-bar";
import { CanvasTemplate } from "./starter-templates";
import { Shape } from "@/types/canvas";

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
}: {
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow({
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const [preview, setPreview] = useState<PreviewState>(null);
  const previewRef = useRef<PreviewState>(null);
  const { setNodes, setEdges } = useReactFlow();

  // Store reactFlow instance ref for keyboard shortcuts
  const reactFlowInstanceRef = useRef<any>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditable =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest('[contenteditable="true"]') !== null;

      if (isEditable) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomIn({ duration: 200 });
      } else if (event.key === "-") {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomOut({ duration: 200 });
      } else if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "y") {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Apply starter template
  useEffect(() => {
    if (importTemplate) {
      const { nodes, edges } = importTemplate;
      setNodes(nodes);
      setEdges(edges);
      clearImportTemplate();
    }
  }, [importTemplate, clearImportTemplate, setNodes, setEdges]);

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

      const payload = JSON.parse(raw);
      const shape = payload.shape as Shape;
      const size = payload.size ?? { width: 150, height: 100 };

      const flowInstance = reactFlowInstanceRef.current;
      if (!flowInstance) return;

      const center = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: center.x - size.width / 2,
        y: center.y - size.height / 2,
      };

      const newNode = {
        id: `${shape}-${crypto.randomUUID()}`,
        type: "canvasNode",
        position,
        width: size.width,
        height: size.height,
        data: {
          label: "",
          color: "default",
          shape,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [wrapperRef, setNodes]
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
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
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
        fitView
        connectionMode={ConnectionMode.Loose}
        isValidConnection={() => true}
        connectOnClick
        snapGrid={[20, 20]}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        onConnect={onConnect}
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
}: {
  roomId: string;
  importTemplate: CanvasTemplate | null;
  clearImportTemplate: () => void;
}) {
  return (
    <LiveblocksCanvasWrapper roomId={roomId}>
      <ReactFlowProvider>
        <CanvasContent
          importTemplate={importTemplate}
          clearImportTemplate={clearImportTemplate}
        />
      </ReactFlowProvider>
    </LiveblocksCanvasWrapper>
  );
}
