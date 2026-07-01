"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";

interface ProjectRow {
  id: string;
  name: string;
}

type DialogType = "none" | "create" | "rename" | "delete";

interface UseProjectDialogsOptions {
  onCreateSuccess?: (project: { name: string; slug: string }) => void;
  onRenameSuccess?: (projectId: string, newName: string) => void;
  onDeleteSuccess?: (projectId: string) => void;
}

interface UseProjectDialogsReturn {
  // Dialog state
  activeDialog: DialogType;
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;

  // Form state
  projectName: string;
  slug: string;

  // Loading state
  isLoading: boolean;

  // Selected project (for rename/delete)
  selectedProject: ProjectRow | null;

  // Actions
  openCreate: () => void;
  openRename: (project: ProjectRow) => void;
  openDelete: (project: ProjectRow) => void;
  closeDialog: () => void;

  setProjectName: (name: string) => void;
  setIsLoading: (loading: boolean) => void;

  // Handlers (to be wired to actual API calls later)
  handleCreateProject: () => void;
  handleRenameProject: () => void;
  handleDeleteProject: () => void;
}

/**
 * Hook to manage project dialog state, form state, and loading state.
 *
 * This hook manages:
 * - Which dialog is currently open (create, rename, delete, or none)
 * - Form state for project name and slug
 * - Loading state during operations
 * - The currently selected project for rename/delete operations
 * - Success callbacks for when operations complete
 */
export function useProjectDialogs(options?: UseProjectDialogsOptions): UseProjectDialogsReturn {
  const [activeDialog, setActiveDialog] = useState<DialogType>("none");
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);

  // Ref to track pending timeout for cleanup
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeout
  const clearPendingTimeout = useCallback(() => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  // Generate slug from project name
  const slug = useMemo(() => {
    return projectName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [projectName]);

  // Open create dialog
  const openCreate = useCallback(() => {
    setProjectName("");
    setSelectedProject(null);
    setActiveDialog("create");
  }, []);

  // Open rename dialog
  const openRename = useCallback((project: ProjectRow) => {
    setProjectName(project.name);
    setSelectedProject(project);
    setActiveDialog("rename");
  }, []);

  // Open delete dialog
  const openDelete = useCallback((project: ProjectRow) => {
    setSelectedProject(project);
    setActiveDialog("delete");
  }, []);

  // Close any open dialog
  const closeDialog = useCallback(() => {
    clearPendingTimeout();
    setActiveDialog("none");
    setProjectName("");
    setSelectedProject(null);
    setIsLoading(false);
  }, [clearPendingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPendingTimeout();
  }, [clearPendingTimeout]);

  // Handle create project (mock implementation with callback)
  const handleCreateProject = useCallback(() => {
    if (!projectName.trim()) return;
    if (!slug) return;

    setIsLoading(true);

    // Mock API call
    clearPendingTimeout();
    pendingTimeoutRef.current = setTimeout(() => {
      options?.onCreateSuccess?.({ name: projectName, slug });
      setIsLoading(false);
      closeDialog();
      pendingTimeoutRef.current = null;
    }, 1000);
  }, [projectName, slug, closeDialog, options, clearPendingTimeout]);

  // Handle rename project (mock implementation with callback)
  const handleRenameProject = useCallback(() => {
    if (!projectName.trim() || !selectedProject) return;

    setIsLoading(true);

    // Mock API call
    clearPendingTimeout();
    pendingTimeoutRef.current = setTimeout(() => {
      options?.onRenameSuccess?.(selectedProject.id, projectName);
      setIsLoading(false);
      closeDialog();
      pendingTimeoutRef.current = null;
    }, 1000);
  }, [projectName, selectedProject, closeDialog, options, clearPendingTimeout]);

  // Handle delete project (mock implementation with callback)
  const handleDeleteProject = useCallback(() => {
    if (!selectedProject) return;

    setIsLoading(true);

    // Mock API call
    clearPendingTimeout();
    pendingTimeoutRef.current = setTimeout(() => {
      options?.onDeleteSuccess?.(selectedProject.id);
      setIsLoading(false);
      closeDialog();
      pendingTimeoutRef.current = null;
    }, 1000);
  }, [selectedProject, closeDialog, options, clearPendingTimeout]);

  return {
    // Dialog state
    activeDialog,
    isCreateOpen: activeDialog === "create",
    isRenameOpen: activeDialog === "rename",
    isDeleteOpen: activeDialog === "delete",

    // Form state
    projectName,
    slug,

    // Loading state
    isLoading,

    // Selected project
    selectedProject,

    // Actions
    openCreate,
    openRename,
    openDelete,
    closeDialog,

    setProjectName,
    setIsLoading,

    // Handlers
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  };
}
