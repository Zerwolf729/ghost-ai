import { schemaTask, metadata, logger } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { liveblocks } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/ai";

const model = openRouter("cohere/north-mini-code:free");

// ── Schemas ──────────────────────────────────────────────────────────────

const canvasNodeSchema = z.object({
  id: z.string().nullish(),
  type: z.string().nullish(),
  position: z.object({ x: z.number(), y: z.number() }).nullish(),
  data: z
    .object({
      label: z.string().nullish(),
      fill: z.string().nullish(),
      text: z.string().nullish(),
      shape: z.string().nullish(),
    })
    .nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
}).nullable();

const canvasEdgeSchema = z.object({
  id: z.string().nullish(),
  type: z.string().nullish(),
  source: z.string().nullish(),
  target: z.string().nullish(),
  data: z.object({ label: z.string().nullish() }).nullish(),
}).nullable();

const chatMessageSchema = z.object({
  id: z.string().nullish(),
  sender: z.string().nullish(),
  content: z.string().nullish(),
  timestamp: z.number().nullish(),
});

const generateSpecSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).default([]),
  nodes: z.array(canvasNodeSchema).default([]),
  edges: z.array(canvasEdgeSchema).default([]),
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** Extract a plain label string from heterogeneous AI/node payloads. */
function extractNodeLabel(data: unknown): string {
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (typeof rec.label === "string" && rec.label.trim()) return rec.label.trim();
    if (typeof rec.text === "string" && rec.text.trim()) return rec.text.trim();
  }
  return "";
}

/**
 * Compact the canvas into a tiny, label-only representation the model needs
 * to write a technical spec. Avoids dumping full React Flow LiveObject
 * payloads (position data, fill colors, internal Liveblocks fields) that
 * bloat prompt tokens without helping the architecture writeup.
 */
function compactCanvas(
  nodes: unknown,
): { name: string; label: string; shape?: string }[] {
  if (!Array.isArray(nodes)) return [];

  const compacted: { name: string; label: string; shape?: string }[] = [];

  for (const n of nodes) {
    if (!n || typeof n !== "object") continue;
    const node = n as Record<string, unknown>;
    const data = node.data;
    const label = extractNodeLabel(data);
    // Use the first 8 chars of the node id as a stable short name,
    // or fall back to the label.
    const rawId = typeof node.id === "string" ? node.id : "";
    const name = (rawId.length >= 8 ? rawId.slice(0, 8) : label) || `node-${compacted.length}`;
    compacted.push({
      name,
      label: label || name,
      shape: typeof data === "object" && data !== null && typeof (data as Record<string, unknown>).shape === "string" ? (data as Record<string, unknown>).shape as string : undefined,
    });
  }

  return compacted;
}

function compactEdges(
  edges: unknown,
): { source: string; target: string; label: string }[] {
  if (!Array.isArray(edges)) return [];

  const seen = new Set<string>();
  const result: { source: string; target: string; label: string }[] = [];

  for (const e of edges) {
    if (!e || typeof e !== "object") continue;
    const edge = e as Record<string, unknown>;
    if (typeof edge.source !== "string" || typeof edge.target !== "string") continue;
    const key = `${edge.source}->${edge.target}`;
    if (seen.has(key)) continue; // dedupe parallel edges — one label per connector
    seen.add(key);
    const data = edge.data;
    const label =
      typeof data === "object" && data !== null && typeof (data as Record<string, unknown>).label === "string"
        ? ((data as Record<string, unknown>).label as string).trim()
        : "";
    result.push({ source: edge.source, target: edge.target, label });
  }

  return result;
}

/**
 * Cap chat history to the most recent 30 messages and normalize to
 * {sender, content} pairs — strips timestamps and ids that don't help.
 */
function compactChat(
  history: unknown,
): { sender: string; content: string }[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((m): m is z.infer<typeof chatMessageSchema> => !!m && typeof m === "object")
    .slice(-30)
    .map((m) => {
      const msg = m as z.infer<typeof chatMessageSchema>;
      return {
        sender: typeof msg.sender === "string" ? msg.sender : "Unknown",
        content: typeof msg.content === "string" ? msg.content : "",
      };
    })
    .filter((m) => m.content.length > 0);
}

// ── Task ───────────────────────────────────────────────────────────────────

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecSchema,
  run: async (payload, { ctx }) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    metadata.set("projectId", projectId).set("roomId", roomId).set("status", "running");

    // Structured payload-shape logging — types/counts only, never content.
    // This is what surfaced `compactChat.map is not a function`: a payload
    // whose chatHistory arrived as a non-array after transport.
    logger.info("spec:start", {
      projectId,
      roomId,
      attempt: ctx.attempt.number,
      chatHistoryType: Array.isArray(chatHistory) ? "array" : typeof chatHistory,
      chatHistoryCount: Array.isArray(chatHistory) ? chatHistory.length : 0,
      nodesType: Array.isArray(nodes) ? "array" : typeof nodes,
      nodeCount: Array.isArray(nodes) ? nodes.length : 0,
      edgesType: Array.isArray(edges) ? "array" : typeof edges,
      edgeCount: Array.isArray(edges) ? edges.length : 0,
    });

    try {
      // Notify room that spec generation started
      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        status: "processing",
        operation: "spec",
        text: "Generating technical specification...",
      });

      const compactNodes = compactCanvas(nodes);
      const compactEdgesData = compactEdges(edges);
      const compactChatData = compactChat(chatHistory);

      // Build compact prompt
      const nodesStr = compactNodes
        .map((n) => `- ${n.name}: ${n.label}${n.shape ? ` [${n.shape}]` : ""}`)
        .join("\n");

      const edgesStr = compactEdgesData
        .map((e) => `- ${e.source} -> ${e.target}${e.label ? `: ${e.label}` : ""}`)
        .join("\n");

      const chatStr = compactChatData
        .map((m) => `${m.sender}: ${m.content}`)
        .join("\n");

      const prompt = `You are a senior system architect. Generate a detailed technical specification in Markdown based on the following compact architecture.

## Components
${nodesStr || "(no components)"}

## Connections
${edgesStr || "(no connections)"}

## Discussion Context
${chatStr || "(no discussion)"}

Produce a Markdown technical spec with these sections:
# Title
## Overview
## Architecture Components
## Data Flow
## Security Considerations
## Recommendations

Keep each section concrete and grounded in the provided components and connections. Return only the Markdown spec — no extra commentary.`;

      logger.info("spec:ai-start", { projectId, promptChars: prompt.length });

      const { text } = await generateText({
        model,
        prompt,
        temperature: 0.7,
      });

      if (!text || !text.trim()) {
        // Empty model output is a controlled failure, not a silent success.
        throw new Error("AI returned an empty specification");
      }

      logger.info("spec:ai-complete", { projectId, specLength: text.length });
      metadata.set("specLength", text.length);

      // Persist spec to Vercel Blob.
      // Key is derived from the RUN id (stable across retry attempts) so a
      // retried attempt overwrites its own object instead of leaving orphans.
      const blobKey = `specs/${projectId}/${ctx.run.id}.md`;
      logger.info("spec:blob-start", { projectId, blobKey });

      const blob = await put(blobKey, text, {
        access: "private",
        contentType: "text/markdown",
        allowOverwrite: true,
      });

      logger.info("spec:blob-complete", { projectId, blobUrl: blob.url });

      // Idempotent persistence: a retry of the same run must not create a
      // second ProjectSpec row. filePath is deterministic per run, so an
      // existing row for this URL means this step already succeeded.
      logger.info("spec:db-start", { projectId });
      const existing = await prisma.projectSpec.findFirst({
        where: { projectId, filePath: blob.url },
        select: { id: true },
      });
      if (!existing) {
        await prisma.projectSpec.create({
          data: { projectId, filePath: blob.url },
        });
      }
      logger.info("spec:db-complete", { projectId, reused: Boolean(existing) });

      metadata.set("status", "completed");

      // Definitive completion signal — emitted ONLY after persistence succeeds.
      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        status: "completed",
        operation: "spec",
        text: "Specification generated successfully",
      });

      return text;
    } catch (error) {
      metadata.set("status", "failed");
      logger.error("Spec generation failed", { projectId, roomId, error });

      const friendly =
        error instanceof Error
          ? error.message.split("\n")[0].slice(0, 200)
          : "Failed to generate specification";

      await liveblocks.broadcastEvent(roomId, {
        type: "AI_STATUS",
        status: "failed",
        operation: "spec",
        message: friendly,
      });

      throw error;
    }
  },
});
