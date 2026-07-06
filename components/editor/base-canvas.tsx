"use client";

import { useCallback, useRef } from "react";
import { ReactFlow, MiniMap, Background, BackgroundVariant, NodeTypes, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { LiveblocksCanvasWrapper } from "./liveblocks-canvas-wrapper";
import { ShapePanel } from "./shape-panel";
import { CanvasNodeRenderer } from "./canvas-node-renderer";
import { CanvasNodeData, Shape } from "@/types/canvas";

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

function CanvasContent({ roomId }: { roomId: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes } = useLiveblocksFlow({
    nodes: [],
    edges: [],
  });

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const data = JSON.parse(event.dataTransfer.getData("application/reactflow"));
    if (!wrapperRef.current) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
    };

    const newNode = {
      id: `${data.shape}-${Date.now()}`,
      type: 'canvasNode',
      position,
      data: { label: "", color: "default", shape: data.shape as Shape },
    };

    setNodes([...nodes, newNode]);
  }, [nodes, setNodes]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

export function BaseCanvas({ roomId }: { roomId: string }) {
  return (
    <LiveblocksCanvasWrapper roomId={roomId}>
      <ReactFlowProvider>
        <CanvasContent roomId={roomId} />
      </ReactFlowProvider>
    </LiveblocksCanvasWrapper>
  );
}
