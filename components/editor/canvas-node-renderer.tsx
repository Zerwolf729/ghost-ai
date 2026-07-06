"use client";

import { Node, NodeProps } from "@xyflow/react";
import { CanvasNodeData } from "@/types/canvas";

export function CanvasNodeRenderer({ data }: NodeProps<Node<CanvasNodeData>>) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-primary text-center">
      <div className="text-sm font-bold">{data.label || "Untitled"}</div>
    </div>
  );
}
