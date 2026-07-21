"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./projects/project-sidebar";
import { ProjectShareDialog } from "./projects/project-share-dialog";
import { BaseCanvas } from "./canvas/canvas-editor";
import { StarterTemplatesModal } from "./templates/starter-templates-modal";
import { AISidebar } from "./ai/ai-sidebar";
import { CanvasTemplate } from "./templates/starter-templates";
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveNowRef = useRef<(() => void) | null>(null);

  const handleSaveNow = useCallback(() => {
    saveNowRef.current?.();
  }, []);

  // Reset template import
  const handleImportTemplate = useCallback((template: CanvasTemplate) => {
    setImportTemplate(template);
  }, []);

  // Reset template import after applied
  const handleClearTemplate = useCallback(() => {
    setImportTemplate(null);
  }, []);

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
        saveStatus={saveStatus}
        onSaveNow={handleSaveNow}
        isWorkspace
      />

      <div className="relative h-screen w-screen overflow-hidden pt-14">
        {/* Canvas - full width, flush with background */}
        <main className="relative h-full w-full overflow-hidden">
          <BaseCanvas
            roomId={projectId}
            importTemplate={importTemplate}
            clearImportTemplate={handleClearTemplate}
            projectId={projectId}
            onSaveStatusChange={setSaveStatus}
            onSaveNowRef={(fn) => (saveNowRef.current = fn)}
          />
        </main>

        {/* Left sidebar - overlay panel */}
        <aside
          className={cn(
            "fixed left-0 top-14 z-30 h-[calc(100vh-56px)] w-64 border-r border-border-default bg-bg-surface/95 backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-300",
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

        {/* Right sidebar - AI chat */}
        <AISidebar isOpen={rightSidebarOpen} onClose={toggleRightSidebar} />
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
