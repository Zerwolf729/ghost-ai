"use client";

import { useState } from "react";
import { useSidebar } from "./sidebar-context";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectShareDialog } from "./project-share-dialog";
import { BaseCanvas } from "./base-canvas";
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
 * CSS Grid layout using template areas:
 *
 *   "header header header"
 *   "left   main   right"
 *
 * Left sidebar slides in/out via grid column width. Right sidebar always visible.
 * Canvas fills center.
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

      <div
        className="grid h-screen w-screen overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          gridTemplateColumns: sidebarOpen ? "256px 1fr 288px" : "0px 1fr 288px",
          gridTemplateRows: "auto 1fr",
          gridTemplateAreas: `"header header header"
"left   main   right"`,
        }}
      >
        {/* Header */}
        <header style={{ gridArea: "header" }}>
          <EditorNavbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
            projectName={projectName}
            onOpenShare={() => setShareDialogOpen(true)}
            isOwner={isOwner}
          />
        </header>

        {/* Left sidebar */}
        <aside
          className="relative overflow-hidden"
          style={{ gridArea: "left" }}
        >
          <ProjectSidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
            ownedProjects={initialOwnedProjects}
            sharedProjects={initialSharedProjects}
            activeProjectId={projectId}
          />
        </aside>

        {/* Canvas */}
        <main className="relative bg-bg-subtle overflow-hidden" style={{ gridArea: "main" }}>
          <BaseCanvas roomId={projectId} />
        </main>

        {/* Right sidebar */}
        <aside
          className="flex flex-col border-l border-border-default bg-bg-surface overflow-hidden"
          style={{ gridArea: "right" }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3 shrink-0">
            <div className="size-2 rounded-full bg-accent-ai" />
            <h3 className="text-sm font-medium text-text-primary">AI Assistant</h3>
          </div>

          {/* Messages area (placeholder) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-bg-elevated px-3 py-2 text-xs text-text-secondary">
                Hello! I can help you design your floor plan. Try asking me to add rooms, resize elements, or suggest layouts.
              </div>
              <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-accent-primary-dim px-3 py-2 text-xs text-text-primary">
                Add a bedroom
              </div>
            </div>
          </div>

          {/* Chat input */}
          <div className="border-t border-border-default p-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated px-3 py-2">
              <input
                type="text"
                placeholder="Ask AI..."
                className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted outline-none"
                disabled
              />
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-lg bg-accent-ai text-white disabled:opacity-40"
                disabled
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </aside>
      </div>

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
