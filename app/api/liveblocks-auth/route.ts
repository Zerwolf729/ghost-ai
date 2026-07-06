import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { liveblocks, getCursorColor } from "@/lib/liveblocks";
import { checkProjectAccess } from "@/lib/project-access";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();

  if (!room || typeof room !== "string") {
    return new NextResponse("Room ID is required", { status: 400 });
  }

  // Verify project access
  const hasAccess = await checkProjectAccess(room);
  if (!hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Identify user
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous";
  const avatar = user.imageUrl || "";
  const cursorColor = getCursorColor(userId);

  // Prepare session
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name,
      avatar,
      cursorColor,
    },
  });

  // Authorize user for room
  session.allow(room, session.READ_WRITE);

  // Authorize session
  const { status, body } = await session.authorize();

  return new NextResponse(body, { status });
}
