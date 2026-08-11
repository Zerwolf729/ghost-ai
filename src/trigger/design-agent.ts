import { task } from "@trigger.dev/sdk";
import { z } from "zod";
import { liveblocks } from "@/lib/liveblocks";
import { generateWithFallback } from "@/lib/ai-helper";
import { SHAPE_DEFAULTS, NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

const COLOR_PALETTE = NODE_COLORS.map((c) => c.fill);
const SHAPE_OPTIONS = NODE_SHAPES;

type CanvasShape = (typeof SHAPE_OPTIONS)[number];

const canvasSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string().optional(),
      shape: z.enum(SHAPE_OPTIONS),
      fill: z.string().optional(),
      position: z.object({ x: z.number(), y: z.number() }),
      width: z.number().optional(),
      height: z.number().optional(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string().optional(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
});

function resolveTextColor(fill: string): string {
  const match = NODE_COLORS.find((c) => c.fill.toLowerCase() === fill.toLowerCase());
  return match?.text ?? NODE_COLORS[0].text;
}

function clampFill(fill: string | undefined): string {
  if (!fill) return COLOR_PALETTE[0];
  const m = COLOR_PALETTE.find((c) => c.toLowerCase() === fill.toLowerCase());
  return m ?? COLOR_PALETTE[0];
}

function clampShape(s: string): CanvasShape {
  return SHAPE_OPTIONS.includes(s as CanvasShape) ? (s as CanvasShape) : "rectangle";
}

export const designAgent = task({
  id: "design-agent",
  // Bounded: one run, AI-helper handles primary→fallback internally.
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { prompt: string; roomId: string; userId: string }) => {
    const { prompt, roomId } = payload;

    await liveblocks.broadcastEvent(roomId, {
      type: "AI_STATUS",
      status: "processing",
      text: "Ghost AI is designing your architecture…",
    });

    try {
      const { text } = await generateWithFallback(buildPrompt(prompt), { temperature: 0.7 });

      // Strip markdown fences.
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const object = canvasSchema.parse(JSON.parse(cleaned));

      if (!object.nodes?.length) {
        throw new Error("AI returned empty nodes");
      }

      const seenIds = new Set<string>();
      const flowNodes = object.nodes.map((n) => {
        const shape = clampShape(n.shape);
        const defaults = SHAPE_DEFAULTS[shape];
        const fill = clampFill(n.fill);
        const textColor = resolveTextColor(fill);
        let id = n.id || `${shape}-${seenIds.size}`;
        while (seenIds.has(id)) id = `${id}-${seenIds.size}`;
        seenIds.add(id);
        const label = typeof n.label === "string" && n.label.trim() ? n.label.trim() : id;
        // Validate position — NaN/Infinity guard.
        const rawPos = n.position;
        const px = rawPos && typeof rawPos.x === "number" && Number.isFinite(rawPos.x) ? rawPos.x : 0;
        const py = rawPos && typeof rawPos.y === "number" && Number.isFinite(rawPos.y) ? rawPos.y : 0;
        const labelWidth = label.length * 8 + 32;
        const width = Math.max(labelWidth, n.width ?? defaults.width);
        const height = n.height ?? defaults.height;
        return {
          id,
          type: "canvasNode",
          position: { x: px, y: py },
          width,
          height,
          data: { label, shape, fill, text: textColor },
        };
      });

      const nodeIds = new Set(flowNodes.map((n) => n.id));
      const nodeCenters = new Map<string, { x: number; y: number; w: number; h: number }>();
      for (const fn of flowNodes) {
        nodeCenters.set(fn.id, {
          x: fn.position.x + (fn.width ?? 0) / 2,
          y: fn.position.y + (fn.height ?? 0) / 2,
          w: fn.width ?? 0,
          h: fn.height ?? 0,
        });
      }
      // Source/target handle IDs must match canvas-node-renderer.tsx:
      //   source: "top" | "bottom" | "left" | "right"
      //   target: "top-target" | "bottom-target" | "left-target" | "right-target"
      const pickHandles = (s: string, t: string): { sourceHandle: string; targetHandle: string } => {
        const sc = nodeCenters.get(s);
        const tc = nodeCenters.get(t);
        if (!sc || !tc) return { sourceHandle: "right", targetHandle: "left-target" };
        const dx = tc.x - sc.x;
        const dy = tc.y - sc.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
          return dx >= 0
            ? { sourceHandle: "right", targetHandle: "left-target" }
            : { sourceHandle: "left", targetHandle: "right-target" };
        }
        return dy >= 0
          ? { sourceHandle: "bottom", targetHandle: "top-target" }
          : { sourceHandle: "top", targetHandle: "bottom-target" };
      };
      // Deduplicate edges for the same source/target pair — ONE connector.
      const edgeMap = new Map<string, {
        id: string; source: string; target: string; label: string;
      }>();
      (object.edges ?? [])
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
        .forEach((e, i) => {
          const key = `${e.source}->${e.target}`;
          if (!edgeMap.has(key)) {
            const label = typeof e.label === "string" ? e.label.trim() : "";
            edgeMap.set(key, {
              id: e.id ?? `edge-${i}-${e.source}-${e.target}`,
              source: e.source,
              target: e.target,
              label: label,
            });
          }
        });
      const flowEdges = Array.from(edgeMap.values()).map((e) => {
        const handles = pickHandles(e.source, e.target);
        return {
          id: e.id,
          type: "canvasEdge",
          source: e.source,
          target: e.target,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          data: {
            label: e.label || undefined,
          },
        };
      });

      await liveblocks.broadcastEvent(roomId, { type: "AI_CANVAS_UPDATE", nodes: flowNodes, edges: flowEdges });

      const reply = buildReply(prompt, flowNodes.length, flowNodes.map((n) => n.data.label));
      await liveblocks.broadcastEvent(roomId, { type: "AI_CHAT", message: { id: crypto.randomUUID(), sender: "Ghost AI", content: reply, timestamp: Date.now() } });

      await liveblocks.broadcastEvent(roomId, { type: "AI_STATUS", status: "completed" });
    } catch (error: unknown) {
      console.error("Design agent attempt failed:", error);
      const msg = friendlyErrorSafe(error);
      await liveblocks.broadcastEvent(roomId, { type: "AI_STATUS", status: "failed", message: msg });
      throw new Error(msg);
    }
  },
});

function friendlyErrorSafe(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("fetch failed") || m.includes("network") || m.includes("econnrefused") || m.includes("enotfound"))
      return "Connection to AI provider failed. Please try again.";
    if (m.includes("timeout") || m.includes("abort"))
      return "AI request timed out. Please try again.";
    if (m.includes("429") || m.includes("rate limit"))
      return "AI provider is busy. Please wait a moment and retry.";
    if (m.includes("503") || m.includes("502") || m.includes("500"))
      return "AI provider is temporarily unavailable. Please try again.";
    if (m.includes("api key") || m.includes("unauthorized") || m.includes("401") || m.includes("403"))
      return "AI configuration error. Please contact support.";
    return err.message.split("\n")[0].slice(0, 200);
  }
  return "Unexpected error while generating design.";
}

function buildPrompt(prompt: string): string {
  const colorList = COLOR_PALETTE.map((c) => '"' + c + '"').join(", ");
  return [
    'You are a senior software architect. Design a real-world production system for: "' + prompt + '"',
    "",
    "Return ONLY a JSON object matching this exact schema:",
    '{',
    '  "nodes": [',
    "    {",
    '      "id": "kebab-case",',
    '      "label": "Component Name",',
    '      "shape": "rectangle",',
    '      "fill": "#1F1F1F",',
    '      "position": { "x": 200, "y": 200 },',
    '      "width": 180,',
    '      "height": 80',
    "    }",
    "  ],",
    '  "edges": [',
    '    { "source": "id", "target": "id", "label": "Reads" }',
    "  ]",
    "}",
    "",
    "RULES (STRICT):",
    "- NO markdown, NO code fences, NO extra text. Output pure JSON only.",
    "- 8-16 nodes for complex systems, 4-8 for simple ones.",
    "- All keys lowercase: id, label, shape, fill, position, width, height, source, target.",
    "- Do NOT end labels with periods.",
    "",
    "SHAPE SEMANTICS:",
    "- rectangle: services, APIs, controllers, workers, queues",
    "- cylinder: databases, caches, message brokers",
    "- hexagon: external APIs, SaaS, third-party systems",
    "- circle: endpoints, entry points, users",
    "- diamond: decisions, conditionals, validations",
    "- pill: async jobs, scheduled tasks",
    "",
    "LAYOUT HIERARCHY (AWS-style architecture):",
    "- y=200 (top): Client / CDN / API Gateway",
    "- y=450 (middle): Core services — branch left and right from gateway",
    "- y=700 (bottom): Databases, caches, external integrations",
    "",
    "SPACING:",
    "- x positions MUST be: 200, 500, 800, 1100, 1400, 1700",
    "- Spread nodes horizontally. NEVER stack all on x=200.",
    "- Group related services in the same row (same y).",
    "- Leave 300px gap between columns.",
    "",
    "SIZING:",
    "- Calculate width from label length: max(chars * 8 + 32, 140). Longer labels get wider nodes.",
    "- height MUST be 80 for all nodes.",
    "- NO truncation — widen node, never clip label.",
    "",
    "COLOR:",
    "- Fill ONLY from: " + colorList,
    "- Do NOT set text color. UI handles it.",
    "",
    "EDGE LABELS:",
    '- Every edge MUST include ONE short label string: "Request", "Response", "Reads", "Writes", "Publishes", "Consumes", "Calls", "Queries", "Authenticates", "Validates", "Receives", "Sends", "Syncs".',
    '- Place label in "label" field of each edge object. Do NOT use "labels" array or list multiple labels for one connector.',
    "",
    "EXAMPLE:",
    '{"nodes":[{"id":"client","label":"Client App","shape":"circle","fill":"#1F1F1F","position":{"x":200,"y":200},"width":160,"height":80},{"id":"cdn","label":"CDN","shape":"hexagon","fill":"#2E1938","position":{"x":500,"y":200},"width":100,"height":80},{"id":"gateway","label":"API Gateway","shape":"pill","fill":"#10233D","position":{"x":800,"y":200},"width":180,"height":80},{"id":"svc-a","label":"User Service","shape":"rectangle","fill":"#331B00","position":{"x":500,"y":450},"width":180,"height":80},{"id":"svc-b","label":"Order Service","shape":"rectangle","fill":"#3C1618","position":{"x":1100,"y":450},"width":180,"height":80},{"id":"cache","label":"Redis Cache","shape":"cylinder","fill":"#062822","position":{"x":500,"y":700},"width":160,"height":80},{"id":"db","label":"PostgreSQL","shape":"cylinder","fill":"#0F2E18","position":{"x":1100,"y":700},"width":180,"height":80}],"edges":[{"source":"client","target":"cdn","label":"Request"},{"source":"cdn","target":"gateway","label":"Request"},{"source":"gateway","target":"svc-a","label":"Routes"},{"source":"gateway","target":"svc-b","label":"Routes"},{"source":"svc-a","target":"cache","label":"Reads"},{"source":"svc-b","target":"cache","label":"Reads"},{"source":"svc-a","target":"db","label":"Queries"},{"source":"svc-b","target":"db","label":"Queries"}]}',
  ].join("\n");
}

function buildReply(prompt: string, nodeCount: number, labels: string[]): string {
  const entry = labels.slice(0, 3).join(", ");
  const gateway = labels.slice(3, 5).join(", ") || "API Gateway";
  const mid = labels.slice(5, Math.max(6, labels.length - 2)).join(", ");
  const data = labels.slice(-2).join(", ");

  return [
    "I designed a system architecture for: " + prompt + ".",
    "",
    "This design includes " + String(nodeCount) + " components organized in clear layers:",
    "",
    "Entry layer: " + entry,
    "Gateway: " + gateway,
    ...(mid ? ["Core services: " + mid] : []),
    "Data layer: " + data,
    "",
    "Architecture follows a top-down flow with separated concerns.",
    "Each layer depends only on the layer below it.",
    "",
    "Let me know if you need me to expand a layer, add resilience patterns, or optimize the topology.",
  ]
    .filter(Boolean)
    .join("\n");
}