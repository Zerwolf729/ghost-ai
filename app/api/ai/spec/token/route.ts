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

    // Verify the TaskRun belongs to the user
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun || taskRun.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Issue Trigger.dev public access token scoped to this run, expires in 1 hour
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [runId] } },
      expirationTime: "1h",
    });

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/spec/token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
