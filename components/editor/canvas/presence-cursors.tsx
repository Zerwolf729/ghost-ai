"use client";

import { useRef } from "react";
import { useOthers } from "@liveblocks/react";
import { useReactFlow, useViewport } from "@xyflow/react";

export function PresenceCursors() {
  const containerRef = useRef<HTMLDivElement>(null);
  const others = useOthers();
  const { flowToScreenPosition } = useReactFlow();
  useViewport();

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {others.map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor || !containerRef.current) return null;

        const rect = containerRef.current.getBoundingClientRect();
        const screen = flowToScreenPosition(cursor);
        const x = screen.x - rect.left;
        const y = screen.y - rect.top;
        const color = other.info?.cursorColor ?? "#888888";
        const name = other.info?.name ?? "Anonymous";

        return (
          <div
            key={other.connectionId}
            className="absolute z-50"
            style={{ left: x, top: y }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L14 8.5L8 10.5L5.5 17L1 1Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ background: color, whiteSpace: "nowrap" }}
            >
              {other.presence.isThinking && (
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-white/80" />
              )}
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
