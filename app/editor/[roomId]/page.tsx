import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProjectIfAccessible } from "@/lib/project-access";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

/**
 * Editor workspace page (server component).
 *
 * - Unauthenticated users redirect to /sign-in
 * - Users without project access see AccessDenied
 * - Non-existent projects also show AccessDenied
 * - Otherwise renders the workspace layout with project context
 */
export default async function EditorWorkspacePage({ params }: EditorWorkspacePageProps) {
  const { roomId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const project = await getProjectIfAccessible(roomId);

  if (!project) {
    return (
      <div className="flex flex-1 min-h-screen bg-base pt-14">
        <AccessDenied />
      </div>
    );
  }

  const isOwner = project.ownerId === userId;

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <EditorWorkspaceClient
      projectId={project.id}
      projectName={project.name}
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
      isOwner={isOwner}
    />
  );
}
