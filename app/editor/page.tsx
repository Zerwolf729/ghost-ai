"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";

/**
 * Editor home screen.
 *
 * Shows a centered prompt to create a new project or open an existing one from the sidebar.
 * Clicking "New Project" opens the Create Project dialog.
 */
export default function EditorPage() {
  const { openCreate } = useProjectDialogsContext();
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col items-center text-center space-y-6 max-w-xl px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-text-primary whitespace-nowrap">
            Create a project or open an existing one
          </h1>
          <p className="text-text-secondary">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
        </div>

        <Button onClick={openCreate} className="gap-2" size="lg">
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </div>
    </div>
  );
}
