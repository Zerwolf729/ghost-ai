import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put, get, head, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canvasJson = await request.json();

    // Delete previous blob if exists to avoid orphaned files
    if (project.canvasJsonPath) {
      try {
        const existing = await head(project.canvasJsonPath);
        if (existing) await del(project.canvasJsonPath);
      } catch {
        // old blob may have expired or been deleted; ignore
      }
    }

    const blob = await put(`canvas-${projectId}.json`, JSON.stringify(canvasJson), {
      access: "private",
      contentType: "application/json",
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("PUT canvas error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check access: owner or collaborator
    if (project.ownerId !== userId) {
      // TODO: also check project collaborators table
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project.canvasJsonPath) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const result = await get(project.canvasJsonPath, {
      access: "private",
    });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Failed to fetch canvas" }, { status: 500 });
    }

    const response = new Response(result.stream);
    const canvasJson = await response.json();
    return NextResponse.json(canvasJson);
  } catch (error) {
    console.error("GET canvas error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}