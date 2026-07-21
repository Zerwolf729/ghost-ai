"use client";

import { CanvasNode, CanvasEdge, Shape, NODE_COLORS } from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

function node(
  id: string,
  label: string,
  shape: Shape,
  colorIndex: number,
  x: number,
  y: number
): CanvasNode {
  const color = NODE_COLORS[colorIndex % NODE_COLORS.length];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, fill: color.fill, text: color.text, shape },
    style: { width: 160, height: 80 },
  };
}

function edge(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    ...(label !== undefined ? { data: { label } } : {}),
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "Distributed microservices with API gateway and service discovery",
    nodes: [
      node("ms-1", "API Gateway", "rectangle", 1, 100, 100),
      node("ms-2", "Auth Service", "circle", 2, 320, 100),
      node("ms-3", "User Service", "rectangle", 3, 540, 100),
      node("ms-4", "Postgres DB", "cylinder", 0, 320, 240),
      node("ms-5", "Redis Cache", "cylinder", 6, 540, 240),
      node("ms-6", "Payment Svc", "diamond", 4, 760, 100),
    ],
    edges: [
      edge("ms-e1", "ms-1", "ms-2", "HTTP"),
      edge("ms-e2", "ms-1", "ms-3", "HTTP"),
      edge("ms-e3", "ms-2", "ms-4", "TCP"),
      edge("ms-e4", "ms-3", "ms-5", "TCP"),
      edge("ms-e5", "ms-5", "ms-6", "GRPC"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD Pipeline",
    description: "Build, test, and deployment automation workflow",
    nodes: [
      node("ci-1", "Git Push", "rectangle", 0, 100, 100),
      node("ci-2", "GitHub Actions", "hexagon", 2, 320, 100),
      node("ci-3", "Build App", "rectangle", 1, 540, 100),
      node("ci-4", "Unit Tests", "pill", 3, 760, 100),
      node("ci-5", "Docker Build", "cylinder", 4, 540, 260),
      node("ci-6", "Deploy", "diamond", 6, 760, 260),
    ],
    edges: [
      edge("ci-e1", "ci-1", "ci-2"),
      edge("ci-e2", "ci-2", "ci-3", "trigger"),
      edge("ci-e3", "ci-3", "ci-4"),
      edge("ci-e4", "ci-4", "ci-5", "success"),
      edge("ci-e5", "ci-5", "ci-6", "image ready"),
    ],
  },
  {
    id: "eventdriven",
    name: "Event-Driven System",
    description: "Reactive system using message queues for microservices",
    nodes: [
      node("ed-1", "HTTP Service", "rectangle", 1, 100, 100),
      node("ed-2", "Kafka Broker", "hexagon", 0, 320, 100),
      node("ed-3", "Order Service", "diamond", 2, 540, 100),
      node("ed-4", "Inventory", "rectangle", 6, 320, 260),
      node("ed-5", "Notifications", "pill", 3, 540, 260),
    ],
    edges: [
      edge("ed-e1", "ed-1", "ed-2", "publish"),
      edge("ed-e2", "ed-2", "ed-3", "consume"),
      edge("ed-e3", "ed-2", "ed-4", "consume"),
      edge("ed-e4", "ed-2", "ed-5", "consume"),
      edge("ed-e5", "ed-3", "ed-4"),
    ],
  },
];
