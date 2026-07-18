"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, NodeResizer, NodeToolbar } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import type { CanvasNode, Shape } from "@/types/canvas";
import { NODE_COLOR_PALETTE } from "@/types/canvas";

const DEFAULT_BG = NODE_COLOR_PALETTE[0].bg;
const DEFAULT_TEXT = NODE_COLOR_PALETTE[0].text;
const BORDER_REST = "rgba(255,255,255,0.1)";
const BORDER_SELECTED = "rgba(255,255,255,0.35)";
const RESIZER_COLOR = "rgba(255,255,255,0.3)";

const MIN_WIDTH = 60;
const MIN_HEIGHT = 40;

const HANDLE_CLS =
  "!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base opacity-0 transition-opacity group-hover/node:opacity-100 group-[.selected]/node:opacity-100";

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.2)",
};

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: RESIZER_COLOR,
  borderWidth: 1,
};

// --- SVG Shape Renderers ---

function SvgDiamond({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,0 100,50 50,100 0,50" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function SvgHexagon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function SvgCylinder({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="0" y="15" width="100" height="70" fill={fill} />
      <line x1="0" y1="15" x2="0" y2="85" stroke={stroke} strokeWidth="1.5" />
      <line x1="100" y1="15" x2="100" y2="85" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="85" rx="50" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="15" rx="50" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function SvgTriangle({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,5 95,95 5,95" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SvgDatabase({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <ellipse cx="50" cy="20" rx="40" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <rect x="10" y="20" width="80" height="60" fill={fill} />
      <line x1="10" y1="20" x2="10" y2="80" stroke={stroke} strokeWidth="1.5" />
      <line x1="90" y1="20" x2="90" y2="80" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="80" rx="40" ry="15" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

// --- Shape helpers ---

function isSvgShape(shape: Shape): boolean {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder" || shape === "triangle" || shape === "database";
}

function cssBorderRadius(shape: Shape): string {
  if (shape === "pill") return "9999px";
  if (shape === "circle") return "50%";
  return "12px";
}

// --- Color Swatch ---

function ColorSwatch({
  pair,
  isActive,
  onSelect,
}: {
  pair: (typeof NODE_COLOR_PALETTE)[number];
  isActive: boolean;
  onSelect: (bg: string, text: string) => void;
}) {
  return (
    <button
      className="nodrag nopan"
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: pair.bg,
        border: isActive ? `2px solid ${pair.text}` : "2px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        flexShrink: 0,
        outline: "none",
        transition: "box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 5px 2px ${pair.text}55`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(pair.bg, pair.text);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

// --- Main component ---

type LiveNodeData = LiveObject<{
  data: LiveObject<{ label: string; color?: string; textColor?: string; shape?: Shape }>;
}>;

export default function CanvasNodeRenderer(props: any) {
  const { id, data, selected } = props;
  const fill = data.color ?? DEFAULT_BG;
  const textColor = data.textColor ?? DEFAULT_TEXT;
  const shape = data.shape ?? "rectangle";
  const stroke = selected ? BORDER_SELECTED : BORDER_REST;
  const isSvg = isSvgShape(shape);

  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  // Update label in Liveblocks storage
  const updateNodeLabel = useMutation(
    ({ storage }, newLabel: string) => {
      const node = storage.get("flow").get("nodes").get(id);
      if (!node) return;
      (node as unknown as LiveNodeData).get("data").set("label", newLabel);
    },
    [id]
  );

  // Update color in Liveblocks storage
  const updateNodeColor = useMutation(
    ({ storage }, colorBg: string, colorText: string) => {
      const node = storage.get("flow").get("nodes").get(id);
      if (!node) return;
      const liveData = (node as unknown as LiveNodeData).get("data");
      liveData.set("color", colorBg);
      liveData.set("textColor", colorText);
    },
    [id]
  );

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const commitEdit = useCallback(() => {
    const value = editRef.current?.textContent ?? "";
    setIsEditing(false);
    updateNodeLabel(value);
  }, [updateNodeLabel]);

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.key === "Escape" || e.key === "Enter") {
        commitEdit();
      }
    },
    [commitEdit]
  );

  // Auto-focus contentEditable when editing starts
  useEffect(() => {
    if (!isEditing || !editRef.current) return;
    const el = editRef.current;
    el.textContent = data.label ?? "";
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Label content — hidden while editing, shown otherwise
  const labelContent = (
    <span
      className={isSvg ? "relative z-10 truncate px-3" : "truncate px-3"}
      style={{ color: textColor, visibility: isEditing ? "hidden" : "visible" }}
    >
      {data.label || <span style={{ opacity: 0.35 }}>Label</span>}
    </span>
  );

  return (
    <div
      className="group/node relative flex items-center justify-center text-sm font-medium"
      style={{ width: "100%", height: "100%" }}
      onDoubleClick={startEditing}
    >
      {/* Resize handles */}
      <NodeResizer
        isVisible={selected ?? false}
        color={RESIZER_COLOR}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />

      {/* Color toolbar */}
      <NodeToolbar isVisible={selected ?? false} position={Position.Top}>
        <div className="nodrag nopan flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/95 px-2.5 py-1.5 shadow-xl backdrop-blur-xl">
          {NODE_COLOR_PALETTE.map((pair) => (
            <ColorSwatch
              key={pair.bg}
              pair={pair}
              isActive={pair.bg === fill}
              onSelect={updateNodeColor}
            />
          ))}
        </div>
      </NodeToolbar>

      {/* SVG shapes (diamond, hexagon, cylinder, triangle, database) */}
      {isSvg ? (
        <>
          <div className="absolute inset-0">
            {shape === "diamond" && <SvgDiamond fill={fill} stroke={stroke} />}
            {shape === "hexagon" && <SvgHexagon fill={fill} stroke={stroke} />}
            {shape === "cylinder" && <SvgCylinder fill={fill} stroke={stroke} />}
            {shape === "triangle" && <SvgTriangle fill={fill} stroke={stroke} />}
            {shape === "database" && <SvgDatabase fill={fill} stroke={stroke} />}
          </div>
          {labelContent}
        </>
      ) : (
        /* HTML shapes (rectangle, circle, pill, triangle, database) */
        <div
          style={{
            background: fill,
            borderRadius: cssBorderRadius(shape),
            border: `1px solid ${stroke}`,
            width: "100%",
            height: "100%",
          }}
          className="flex items-center justify-center"
        >
          {labelContent}
        </div>
      )}

      {/* Edit overlay — contentEditable for text editing */}
      {isEditing && (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center text-center text-sm font-medium outline-none cursor-text"
          style={{ color: textColor, wordBreak: "break-word", padding: "0 12px" }}
          onBlur={commitEdit}
          onKeyDown={handleTextKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}

      {/* Connector handles — visible on hover or selected */}
      <Handle id="top" type="source" position={Position.Top} className={HANDLE_CLS} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={HANDLE_CLS} />
      <Handle id="left" type="source" position={Position.Left} className={HANDLE_CLS} />
      <Handle id="right" type="source" position={Position.Right} className={HANDLE_CLS} />
    </div>
  );
}
