"use client";

import { useReactFlow } from "@xyflow/react";

interface ControlBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function ControlBar({ canUndo, canRedo, onUndo, onRedo }: ControlBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-[400px] z-20 flex items-center gap-3 rounded-full bg-[#111114] border border-[#2a2a30] px-3 py-2 shadow-lg">
      {/* Zoom controls group */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="w-8 h-8 rounded-full bg-[#1e1e23] hover:bg-[#2a2a30] text-[#f0f0f4] flex items-center justify-center transition-colors"
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H5V11H19V13Z"/>
          </svg>
        </button>

        <button
          onClick={() => fitView({ duration: 200, maxZoom: 1.5 })}
          className="w-8 h-8 rounded-full bg-[#1e1e23] hover:bg-[#2a2a30] text-[#f0f0f4] flex items-center justify-center transition-colors"
          title="Fit view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4,11H12V19H4V11M6,13V17H10V13H6M14,13V17H18V13H14M12,5V9H14V7H16V9H18V5H14V7H12V5M6,5V9H10V5H6Z"/>
          </svg>
        </button>

        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="w-8 h-8 rounded-full bg-[#1e1e23] hover:bg-[#2a2a30] text-[#f0f0f4] flex items-center justify-center transition-colors"
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[#2a2a30]" />

      {/* History controls group */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${canUndo ? 'bg-[#1e1e23] hover:bg-[#2a2a30] text-[#f0f0f4] cursor-pointer' : 'bg-[#1e1e23]/50 text-[#505060] cursor-not-allowed opacity-50'}`}
          title="Undo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H9L6.4,13.4C7.45,12.5 9.85,12 12.5,12C16.4,12 20,15.6 20,19.5V22H21.5V19.5C21.5,15.6 17.9,12 14.5,12C14.2,12 13.9,12.1 13.5,12.2L9,7L12.5,8Z"/>
          </svg>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${canRedo ? 'bg-[#1e1e23] hover:bg-[#2a2a30] text-[#f0f0f4] cursor-pointer' : 'bg-[#1e1e23]/50 text-[#505060] cursor-not-allowed opacity-50'}`}
          title="Redo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.5,16C8.15,16 4.55,14.6 2.6,13.4L2,17V8H9L12.6,10.6C11.55,11.5 9.15,12 6.5,12C2.6,12 2,15.6 2,19.5V22H3.5V19.5C3.5,15.6 7.1,12 11.5,12C11.8,12 12.1,12.1 12.4,12.2L19,7L15.5,8L11.5,16Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}