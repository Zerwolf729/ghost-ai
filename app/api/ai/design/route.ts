import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import type { designAgent } from "@/src/trigger/design-agent";

const MAX_TRIGGER_RETRIES = 3;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const prompt = body.prompt as string | undefined;
    const roomId = body.roomId as string | undefined;
    const projectId = body.projectId as string | undefined;

    if (!prompt || !roomId || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, roomId, projectId" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trigger the design task with retry — transient network blips during
    // trigger should not surface to the user as "Internal server error".
    let handle;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_TRIGGER_RETRIES; attempt++) {
      try {
        handle = await tasks.trigger<typeof designAgent>("design-agent", {
          prompt,
          roomId,
          userId,
        });
        break;
      } catch (err) {
        lastErr = err;
        console.warn(
          `POST /api/ai/design trigger attempt ${attempt} failed:`,
          err
        );
        if (attempt < MAX_TRIGGER_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
        }
      }
    }

    if (!handle) {
      console.error("POST /api/ai/design failed after retries:", lastErr);
      return NextResponse.json(
        { error: "Failed to start AI run. Please try again." },
        { status: 502 }
      );
    }

    // Create TaskRun record
    const taskRun = await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });

    return NextResponse.json({ runId: taskRun.runId }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai/design error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}