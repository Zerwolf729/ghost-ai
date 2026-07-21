import type { Node, Edge } from "@xyflow/react";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
  "triangle",
  "database",
] as const;

export type Shape = (typeof NODE_SHAPES)[number];

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export type NodeColorPair = (typeof NODE_COLORS)[number];

export const SHAPE_DEFAULTS: Record<Shape, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 160, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 72 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 120 },
  triangle: { width: 140, height: 120 },
  database: { width: 140, height: 100 },
};

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  fill?: string;
  text?: string;
  shape?: Shape;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

export type NodeColorPairAlt = {
  bg: string;
  text: string;
};

export const NODE_COLOR_PALETTE: NodeColorPairAlt[] = [
  { bg: "#00c8d4", text: "#080809" },
  { bg: "#6457f9", text: "#f0f0f4" },
  { bg: "#34d399", text: "#080809" },
  { bg: "#fbbf24", text: "#080809" },
  { bg: "#ff4d4f", text: "#f0f0f4" },
  { bg: "#111114", text: "#f0f0f4" },
  { bg: "#2a2a30", text: "#f0f0f4" },
  { bg: "#1e1e23", text: "#f0f0f4" },
];
