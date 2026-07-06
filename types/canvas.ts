export type Shape = 'rectangle' | 'diamond' | 'circle' | 'pill' | 'cylinder' | 'hexagon';

export type CanvasNodeData = {
  label: string;
  color: string;
  shape: Shape;
};

export type CanvasNode = {
  id: string;
  type: 'canvasNode';
  position: { x: number; y: number };
  data: CanvasNodeData;
};

export type CanvasEdge = {
  id: string;
  type: 'canvasEdge';
  source: string;
  target: string;
};
