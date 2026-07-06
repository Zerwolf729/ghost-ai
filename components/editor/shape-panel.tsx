"use client";

import { cn } from "@/lib/utils";
import { Shape } from "@/types/canvas";
import { Circle, Hexagon, Square, Diamond, Pill, Cylinder } from "lucide-react";

interface ShapeButtonProps {
  shape: Shape;
  icon: React.ReactNode;
}

const shapes: ShapeButtonProps[] = [
  { shape: 'rectangle', icon: <Square /> },
  { shape: 'diamond', icon: <Diamond /> },
  { shape: 'circle', icon: <Circle /> },
  { shape: 'pill', icon: <Pill /> },
  { shape: 'cylinder', icon: <Cylinder /> },
  { shape: 'hexagon', icon: <Hexagon /> },
];

export function ShapePanel() {
  const onDragStart = (event: React.DragEvent, shape: Shape) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({
        shape,
        width: shape === 'circle' ? 100 : 150,
        height: 100
    }));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 bg-bg-surface border border-border-default rounded-full shadow-lg">
      {shapes.map(({ shape, icon }) => (
        <button
          key={shape}
          type="button"
          aria-label={`Add ${shape} shape`}
          className="p-3 bg-bg-base hover:bg-bg-elevated rounded-full cursor-grab"
          draggable
          onDragStart={(e) => onDragStart(e, shape)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
