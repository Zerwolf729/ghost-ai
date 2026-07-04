import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";
import { EditorHomeClient } from "@/components/editor/editor-home-client";

/**
 * Editor home page (server component).
 *
 * Fetches owned and shared projects server-side and passes them to the client.
 * No client-side fetching for initial load.
 */
export default async function EditorHomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <EditorHomeClient
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
    />
  );
}
