"use client";

import React, { useState } from "react";
import { useSidebar } from "./sidebar-context";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectShareDialog } from "./project-share-dialog";
import { cn } from "@/lib/utils";
import type { ProjectRow } from "@/lib/projects";

interface EditorWorkspaceClientProps {
  projectId: string;
  projectName: string;
  initialOwnedProjects: ProjectRow[];
  initialSharedProjects: ProjectRow[];
  isOwner: boolean;
}

/**
 * Client wrapper for editor workspace.
 *
 * Full-viewport workspace layout with:
 * - top navbar showing project name
 * - navbar actions: share button and AI sidebar toggle
 * - existing ProjectSidebar on the left
 * - current room highlighted in sidebar
 * - central canvas placeholder with dark background and centered message
 * - right sidebar placeholder for future AI chat
 */
export function EditorWorkspaceClient({
  projectId,
  projectName,
  initialOwnedProjects,
  initialSharedProjects,
  isOwner,
}: EditorWorkspaceClientProps) {
  const { isOpen: sidebarOpen, close: closeSidebar, toggle: toggleSidebar } = useSidebar();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-bg-base/70 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Navbar with project name and actions */}
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        projectName={projectName}
        onOpenShare={() => setShareDialogOpen(true)}
        isOwner={isOwner}
      />

      {/* Left sidebar */}
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        ownedProjects={initialOwnedProjects}
        sharedProjects={initialSharedProjects}
        activeProjectId={projectId}
      />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 min-h-screen bg-base pt-14 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* Central canvas area */}
          <div className="flex-1 flex items-center justify-center bg-bg-subtle">
            <div className="flex flex-col items-center text-center space-y-4 px-4">
              <h2 className="text-lg font-medium text-text-secondary">Canvas</h2>
              <p className="text-sm text-text-muted max-w-sm">
                Canvas logic coming soon. This is the workspace for {projectName}.
              </p>
            </div>
          </div>

          {/* Right sidebar placeholder for AI chat */}
          <aside className="w-80 shrink-0 border-l border-border-default bg-bg-surface hidden lg:block">
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center text-center space-y-2 px-4">
                <h3 className="text-sm font-medium text-text-secondary">AI Sidebar</h3>
                <p className="text-xs text-text-muted">Coming soon</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Share dialog */}
      <ProjectShareDialog
        projectId={projectId}
        projectName={projectName}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        isOwner={isOwner}
      />
    </>
  );
}
