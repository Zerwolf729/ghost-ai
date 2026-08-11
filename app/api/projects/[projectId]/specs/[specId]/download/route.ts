import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
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

    // Verify access
    const hasAccess = await checkProjectAccess(projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify spec belongs to project
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId, projectId },
    });
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }

    // Fetch from Blob
    const blob = await get(spec.filePath, { access: "private" });
    if (!blob) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
      },
    });
  } catch (error) {
    console.error("Download spec error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
