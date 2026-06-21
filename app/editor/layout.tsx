"use client";

import React, { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ProjectDialogsProvider, useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { cn } from "@/lib/utils";

/**
 * Internal layout component that consumes the project dialogs context.
 */
function EditorLayoutContent({ children }: { children: React.ReactNode }) {
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => {
    console.log("closeSidebar called");
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Top navigation bar */}
      <EditorNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* Integrated workspace sidebar */}
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={openCreate}
        onRename={openRename}
        onDelete={openDelete}
      />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 min-h-screen bg-base pt-14 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        {children}
      </main>

      {/* Project dialogs */}
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

/**
 * Layout for the /editor route.
 *
 * Provides project dialog context and manages the overall editor structure:
 * - Renders the top navigation bar
 * - Renders the integrated project sidebar with dialog handlers
 * - Wraps the page content
 * - Renders all project dialogs (Create, Rename, Delete)
 * - Manages project state with mock data (via provider)
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectDialogsProvider>
      <EditorLayoutContent>{children}</EditorLayoutContent>
    </ProjectDialogsProvider>
  );
}
