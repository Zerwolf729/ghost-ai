"use client";

import React, { createContext, useContext, useState } from "react";
import { useProjectActions } from "@/hooks/use-project-actions";

interface ProjectRow {
  id: string;
  name: string;
}

interface ProjectDialogsContextValue {
  // Dialog state
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;

  // Form state
  projectName: string;
  slug: string;

  // Loading state
  isLoading: boolean;

  // Selected project
  selectedProject: ProjectRow | null;

  // Project data
  ownedProjects: ProjectRow[];
  sharedProjects: ProjectRow[];

  // Actions
  openCreate: () => void;
  openRename: (project: ProjectRow) => void;
  openDelete: (project: ProjectRow) => void;
  closeDialog: () => void;

  setProjectName: (name: string) => void;

  // Handlers
  handleCreateProject: () => Promise<void>;
  handleRenameProject: () => Promise<void>;
  handleDeleteProject: () => Promise<void>;
}

const ProjectDialogsContext = createContext<ProjectDialogsContextValue | undefined>(undefined);

/**
 * Hook to access project dialogs context.
 * Must be used within a ProjectDialogsProvider.
 */
export function useProjectDialogsContext() {
  const context = useContext(ProjectDialogsContext);
  if (!context) {
    throw new Error("useProjectDialogsContext must be used within a ProjectDialogsProvider");
  }
  return context;
}

interface ProjectDialogsProviderProps {
  children: React.ReactNode;
  initialOwnedProjects: ProjectRow[];
  initialSharedProjects: ProjectRow[];
}

/**
 * Provider for project dialogs state and real project data.
 *
 * Receives initial owned/shared projects (fetched server-side) and wires
 * dialog state to real API mutations via useProjectActions.
 */
export function ProjectDialogsProvider({
  children,
  initialOwnedProjects,
  initialSharedProjects,
}: ProjectDialogsProviderProps) {
  const [ownedProjects, setOwnedProjects] = useState<ProjectRow[]>(initialOwnedProjects);
  const [sharedProjects] = useState<ProjectRow[]>(initialSharedProjects);

  // Callback for when a project is created
  const handleCreateSuccess = (project: { name: string; slug: string }) => {
    // Navigation handled by hook; optimistic state not needed since we navigate away
  };

  // Callback for when a project is renamed
  const handleRenameSuccess = (projectId: string, newName: string) => {
    setOwnedProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
    );
  };

  // Callback for when a project is deleted
  const handleDeleteSuccess = (projectId: string) => {
    setOwnedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  // Use the actions hook with callbacks
  const dialogState = useProjectActions({
    onCreateSuccess: handleCreateSuccess,
    onRenameSuccess: handleRenameSuccess,
    onDeleteSuccess: handleDeleteSuccess,
  });

  const contextValue: ProjectDialogsContextValue = {
    ...dialogState,
    ownedProjects,
    sharedProjects,
  };

  return (
    <ProjectDialogsContext.Provider value={contextValue}>
      {children}
    </ProjectDialogsContext.Provider>
  );
}
