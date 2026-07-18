"use client";

import { cn } from "@/lib/utils";
import { Shape } from "@/types/canvas";
import { Circle, Square, Diamond, Cylinder, Hexagon, Triangle, Database } from "lucide-react";

interface ShapeButtonProps {
  shape: Shape;
  icon: React.ReactNode;
}

const shapes: ShapeButtonProps[] = [
  { shape: 'rectangle', icon: <Square /> },
  { shape: 'circle', icon: <Circle /> },
  { shape: 'diamond', icon: <Diamond /> },
  { shape: 'cylinder', icon: <Cylinder /> },
  { shape: 'hexagon', icon: <Hexagon /> },
  { shape: 'triangle', icon: <Triangle /> },
  { shape: 'database', icon: <Database /> },
];

export function ShapePanel({ onDragStart }: { onDragStart?: (shape: Shape, clientX: number, clientY: number) => void }) {
  const handleDragStart = (event: React.DragEvent, shape: Shape) => {
    event.dataTransfer.setData("application/ghost-shape", JSON.stringify({
        shape,
        size: {
            width: shape === 'circle' || shape === 'hexagon' || shape === 'triangle' || shape === 'database' ? 100 : 150,
            height: 100
        }
    }));
    event.dataTransfer.effectAllowed = "copy";
    // suppress default browser drag ghost image
    const img = new window.Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    event.dataTransfer.setDragImage(img, 0, 0);
    onDragStart?.(shape, event.clientX, event.clientY);
  };

  return (
    <div className="absolute bottom-18 left-1/2 translate-x-[-150px] z-50 flex items-center gap-2 p-3 bg-bg-surface border border-border-default rounded-full shadow-lg">
      {shapes.map(({ shape, icon }) => (
        <button
          key={shape}
          type="button"
          aria-label={`Add ${shape} shape`}
          className="p-3 bg-bg-base hover:bg-bg-elevated rounded-full cursor-grab"
          draggable
          onDragStart={(e) => handleDragStart(e, shape)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
