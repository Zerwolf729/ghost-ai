import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProjectIfAccessible } from "@/lib/project-access";
import type { generateSpec } from "@/src/trigger/generate-spec";

const chatMessageSchema = z.object({
  id: z.string().optional(),
  sender: z.string().optional(),
  content: z.string().optional(),
  timestamp: z.number().optional(),
});

const canvasNodeSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  data: z.object({
    label: z.string().optional(),
    fill: z.string().optional(),
    text: z.string().optional(),
    shape: z.string().optional(),
  }).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const canvasEdgeSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  target: z.string().optional(),
  data: z.object({ label: z.string().optional() }).optional(),
});

const requestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).default([]),
  nodes: z.array(canvasNodeSchema).default([]),
  edges: z.array(canvasEdgeSchema).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { roomId, chatHistory, nodes, edges } = parsed.data;

    // Resolve project access from roomId (never trust client-supplied projectId).
    // The Liveblocks room id IS the project id in this app.
    const project = await getProjectIfAccessible(roomId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trigger the generate-spec task
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory: chatHistory ?? [],
      nodes: nodes ?? [],
      edges: edges ?? [],
    });

    // Save TaskRun record for ownership/access control
    const taskRun = await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId,
      },
    });

    return NextResponse.json({ runId: taskRun.runId }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai/spec error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
