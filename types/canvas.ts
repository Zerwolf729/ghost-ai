export type Shape = 'rectangle' | 'diamond' | 'circle' | 'pill' | 'cylinder' | 'hexagon' | 'triangle' | 'database';

export type CanvasNodeData = {
  label: string;
  color: string;
  shape: Shape;
  textColor?: string;
} & Record<string, unknown>;

export type NodeColorPair = {
  bg: string;
  text: string;
};

export const NODE_COLOR_PALETTE: NodeColorPair[] = [
  { bg: '#00c8d4', text: '#080809' }, // primary cyan on dark background
  { bg: '#6457f9', text: '#f0f0f4' }, // purple on light
  { bg: '#34d399', text: '#080809' }, // green on dark
  { bg: '#fbbf24', text: '#080809' }, // yellow/gold on dark
  { bg: '#ff4d4f', text: '#f0f0f4' }, // red on light
  { bg: '#111114', text: '#f0f0f4' }, // dark on light
  { bg: '#2a2a30', text: '#f0f0f4' }, // gray on light
  { bg: '#1e1e23', text: '#f0f0f4' }, // dark gray on light
];

export type CanvasNode = {
  id: string;
  type: 'canvasNode';
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data: CanvasNodeData;
  style?: {
    width?: number;
    height?: number;
  };
};

export type CanvasEdge = {
  id: string;
  type: 'canvasEdge';
  source: string;
  target: string;
  label?: string;
  data?: Record<string, unknown>;
};
