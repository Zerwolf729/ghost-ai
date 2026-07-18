"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectShareDialog } from "./project-share-dialog";
import { BaseCanvas } from "./base-canvas";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { CanvasTemplate } from "./starter-templates";
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
 * Layout: navbar fixed top (56px). Below: canvas fills viewport.
 * Left sidebar overlays on top of canvas (z-index). Right sidebar pinned right.
 * Both sidebars start below navbar.
 */
export function EditorWorkspaceClient({
  projectId,
  projectName,
  initialOwnedProjects,
  initialSharedProjects,
  isOwner,
}: EditorWorkspaceClientProps) {
  const { isLeftOpen: leftSidebarOpen, isRightOpen: rightSidebarOpen, toggleLeft: toggleLeftSidebar, toggleRight: toggleRightSidebar } = useSidebar();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [importTemplate, setImportTemplate] = useState<CanvasTemplate | null>(null);

  const handleImportTemplate = (template: CanvasTemplate) => {
    setImportTemplate(template);
  };

  return (
    <>
      {/* Navbar - fixed top */}
      <EditorNavbar
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={toggleLeftSidebar}
        rightSidebarOpen={rightSidebarOpen}
        onToggleRightSidebar={toggleRightSidebar}
        projectName={projectName}
        onOpenShare={() => setShareDialogOpen(true)}
        onOpenStarterTemplates={() => setTemplateModalOpen(true)}
        isOwner={isOwner}
      />

      <div className="relative h-screen w-screen overflow-hidden pt-14">
        {/* Left sidebar - overlay panel */}
        <aside
          className={cn(
            "fixed left-0 top-14 z-30 h-[calc(100vh-56px)] w-64 border-r border-border-default bg-bg-surface overflow-hidden transition-all duration-300",
            leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ProjectSidebar
            isOpen={leftSidebarOpen}
            onClose={toggleLeftSidebar}
            ownedProjects={initialOwnedProjects}
            sharedProjects={initialSharedProjects}
            activeProjectId={projectId}
          />
        </aside>

        {/* Canvas - full width always */}
        <main className="relative h-full w-full bg-bg-subtle overflow-hidden">
          <BaseCanvas
            roomId={projectId}
            importTemplate={importTemplate}
            clearImportTemplate={() => setImportTemplate(null)}
          />
        </main>

        {/* Right sidebar - fixed right */}
        <aside
          className={cn(
            "fixed right-0 top-14 z-30 h-[calc(100vh-56px)] flex flex-col bg-bg-surface overflow-hidden transition-all duration-300",
            rightSidebarOpen ? "w-72 border-l border-border-default" : "w-0"
          )}
        >
          {rightSidebarOpen && (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-2 border-b border-border-default px-4 py-3 shrink-0 bg-bg-surface">
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
              <div className="border-t border-border-default p-3 shrink-0 bg-bg-surface">
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
            </>
          )}
        </aside>
      </div>

      {/* Mobile backdrop */}
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-bg-base/70 backdrop-blur-sm md:hidden"
          onClick={toggleLeftSidebar}
          aria-hidden="true"
        />
      )}

      {/* Share dialog */}
      <ProjectShareDialog
        projectId={projectId}
        projectName={projectName}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        isOwner={isOwner}
      />

      {/* Starter Templates modal */}
      <StarterTemplatesModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        onImport={handleImportTemplate}
      />
    </>
  );
}
