"use client";

import { NODE_COLOR_PALETTE } from "@/types/canvas";

export function ColorToolbar({ onColorSelect, activeColor, onMouseDown }: { onColorSelect: (bg: string, text: string) => void, activeColor: string, onMouseDown?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 flex gap-1 p-1 bg-[#111114] border border-[#2a2a30] rounded-full shadow-lg"
      onMouseDown={onMouseDown}
    >
      {NODE_COLOR_PALETTE.map(({ bg, text }) => (
        <button
          key={bg}
          className={`w-6 h-6 rounded-full border border-[#2a2a30] transition-all duration-200 hover:scale-110 hover:shadow-md ${activeColor === bg ? 'ring-2 ring-offset-2 ring-[#00c8d4] scale-105' : ''}`}
          style={{
            backgroundColor: bg,
            boxShadow: activeColor === bg ? `0 0 8px ${text}40` : 'none'
          }}
          onClick={(e) => { e.stopPropagation(); onColorSelect(bg, text); }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            const button = e.currentTarget;
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = `0 0 12px ${text}60`;
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            const button = e.currentTarget;
            button.style.transform = activeColor === bg ? 'scale(1.05)' : 'scale(1)';
            button.style.boxShadow = activeColor === bg ? `0 0 8px ${text}40` : 'none';
          }}
        />
      ))}
    </div>
  );
}