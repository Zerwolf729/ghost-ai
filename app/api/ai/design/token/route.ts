import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const runId = body.runId as string | undefined;

    if (!runId) {
      return NextResponse.json(
        { error: "Missing required field: runId" },
        { status: 400 }
      );
    }

    // Verify ownership via TaskRun record
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun || taskRun.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate public token scoped to this run
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [runId] } },
    });

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/design/token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}