import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, specId } = await params;

    const hasAccess = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId, projectId },
      select: { id: true, filePath: true },
    });
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }

    // `get` returns null when the object is missing, and a discriminated
    // union otherwise: `stream` is only non-null on statusCode 200.
    // Bypass the CDN cache so a spec read immediately after generation
    // doesn't hit a stale/absent cache entry.
    const result = await get(spec.filePath, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      console.error("Spec blob unavailable", {
        specId: spec.id,
        statusCode: result?.statusCode ?? "null",
      });
      return NextResponse.json({ error: "Spec file not found in storage" }, { status: 404 });
    }

    const text = await new Response(result.stream).text();
    return NextResponse.json({ id: spec.id, content: text });
  } catch (error) {
    console.error("GET spec content error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to read spec: ${error.message.split("\n")[0].slice(0, 200)}`
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, specId } = await params;

    const hasAccess = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId, projectId },
      select: { id: true, filePath: true },
    });
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }

    // Remove blob file. `del` accepts a full URL or pathname. Log but do not fail
    // the whole request if the blob is already gone or unreachable — the metadata
    // record is still deleted below. Throws on malformed URLs only.
    try {
      await del(spec.filePath);
    } catch (blobErr) {
      console.warn("DELETE spec: blob removal failed (continuing):", spec.id, blobErr);
    }

    try {
      await prisma.projectSpec.delete({ where: { id: specId } });
    } catch (dbErr) {
      // Race: spec was already deleted → signal the caller rather than 500.
      console.error("DELETE spec: metadata deletion failed:", spec.id, dbErr);
      return NextResponse.json(
        { error: dbErr instanceof Error && dbErr.message.includes("Record to delete does not exist")
          ? "Spec already deleted"
          : "Failed to delete spec metadata" },
        { status: 409 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE spec error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
