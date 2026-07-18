"use client";

import React from "react";
import { ProjectSidebar } from "./project-sidebar";
import { CreateProjectDialog } from "./create-project-dialog";
import { RenameProjectDialog } from "./rename-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectDialogsProvider, useProjectDialogsContext } from "./project-dialogs-provider";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import type { ProjectRow } from "@/lib/projects";

interface EditorHomeClientProps {
  initialOwnedProjects: ProjectRow[];
  initialSharedProjects: ProjectRow[];
}

export function EditorHomeClient({
  initialOwnedProjects,
  initialSharedProjects,
}: EditorHomeClientProps) {
  return (
    <ProjectDialogsProvider
      initialOwnedProjects={initialOwnedProjects}
      initialSharedProjects={initialSharedProjects}
    >
      <EditorHomeContent />
    </ProjectDialogsProvider>
  );
}

function EditorHomeContent() {
  const { isLeftOpen: sidebarOpen, closeLeft: closeSidebar } = useSidebar();
  const {
    ownedProjects,
    sharedProjects,
    selectedProject,
    isCreateOpen,
    isRenameOpen,
    isDeleteOpen,
    projectName,
    slug,
    isLoading,
    setProjectName,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  } = useProjectDialogsContext();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-bg-base/70 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />

      <main
        className="relative h-[calc(100vh-56px)] w-screen overflow-hidden pt-14"
      >
        <div className="flex items-center justify-center h-full w-full px-4">
          <div className="flex flex-col items-center text-center space-y-6 max-w-xl w-full">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-text-primary whitespace-nowrap">
                Create a project or open an existing one
              </h1>
              <p className="text-text-secondary">
                Start a new architecture workspace, or choose a project from the sidebar.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New Project
            </button>
          </div>
        </div>
      </main>

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={(open) => !open && closeDialog()}
        projectName={projectName}
        slug={slug}
        isLoading={isLoading}
        onProjectNameChange={setProjectName}
        onCreate={handleCreateProject}
      />
      <RenameProjectDialog
        open={isRenameOpen}
        onOpenChange={(open) => !open && closeDialog()}
        currentProjectName={selectedProject?.name || ""}
        projectName={projectName}
        isLoading={isLoading}
        onProjectNameChange={setProjectName}
        onRename={handleRenameProject}
      />
      <DeleteProjectDialog
        open={isDeleteOpen}
        onOpenChange={(open) => !open && closeDialog()}
        projectName={selectedProject?.name || ""}
        isLoading={isLoading}
        onDelete={handleDeleteProject}
      />
    </>
  );
}
