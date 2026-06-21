"use client";

import { createContext, useContext, useState } from "react";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

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
  handleCreateProject: () => void;
  handleRenameProject: () => void;
  handleDeleteProject: () => void;
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
}

// Initial mock project data
const INITIAL_OWNED_PROJECTS = [
  { id: "1", name: "E-commerce Platform" },
  { id: "2", name: "Mobile Banking App" },
  { id: "3", name: "Social Media Dashboard" },
];

const INITIAL_SHARED_PROJECTS = [
  { id: "4", name: "Analytics Service" },
  { id: "5", name: "Payment Gateway" },
];

/**
 * Provider for project dialogs state and project data.
 * Manages both dialog state and mock project data, providing full functionality
 * for create, rename, and delete operations that update the project list.
 */
export function ProjectDialogsProvider({ children }: ProjectDialogsProviderProps) {
  // Project state management
  const [ownedProjects, setOwnedProjects] = useState(INITIAL_OWNED_PROJECTS);
  const [sharedProjects] = useState(INITIAL_SHARED_PROJECTS);

  // Callback for when a project is created
  const handleCreateSuccess = (project: { name: string; slug: string }) => {
    const newProject = {
      id: String(Date.now()), // Generate unique ID
      name: project.name,
    };
    setOwnedProjects((prev) => [...prev, newProject]);
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

  // Use the dialog hook with callbacks
  const dialogState = useProjectDialogs({
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
