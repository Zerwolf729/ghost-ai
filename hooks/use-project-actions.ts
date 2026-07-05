"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProjectRow {
  id: string;
  name: string;
}

type DialogType = "none" | "create" | "rename" | "delete";

interface UseProjectActionsOptions {
  onCreateSuccess?: (project: { name: string; slug: string }) => void;
  onRenameSuccess?: (projectId: string, newName: string) => void;
  onDeleteSuccess?: (projectId: string) => void;
}

interface UseProjectActionsReturn {
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

  // Handlers (real API calls)
  handleCreateProject: () => Promise<void>;
  handleRenameProject: () => Promise<void>;
  handleDeleteProject: () => Promise<void>;
}

/**
 * Hook to manage project dialog state, form state, and real API mutations.
 */
export function useProjectActions(options?: UseProjectActionsOptions): UseProjectActionsReturn {
  const router = useRouter();
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

  // Generate a short unique suffix (4 random chars)
  const generateSuffix = useCallback((): string => {
    return Math.random().toString(36).substring(2, 6);
  }, []);

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

  // Handle create project (real API call)
  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) return;
    if (!slug) return;

    setIsLoading(true);

    try {
      const suffix = generateSuffix();
      const roomId = `${slug}-${suffix}`;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: "" }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const project = await response.json();
      options?.onCreateSuccess?.({ name: projectName, slug: roomId });

      // Navigate to the new workspace
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error("Create project error:", error);
      // TODO: show error to user
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  }, [projectName, slug, closeDialog, options, router, generateSuffix]);

  // Handle rename project (real API call)
  const handleRenameProject = useCallback(async () => {
    if (!projectName.trim() || !selectedProject) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) throw new Error("Failed to rename project");

      const updated = await response.json();
      options?.onRenameSuccess?.(updated.id, updated.name);
    } catch (error) {
      console.error("Rename project error:", error);
      // TODO: show error to user
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  }, [projectName, selectedProject, closeDialog, options]);

  // Handle delete project (real API call)
  const handleDeleteProject = useCallback(async () => {
    if (!selectedProject) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      options?.onDeleteSuccess?.(selectedProject.id);

      // Redirect to /editor if deleting the active workspace
      // This assumes we know the active project ID; for now, just refresh
      // In a real implementation, we'd check if selectedProject.id matches the current route
    } catch (error) {
      console.error("Delete project error:", error);
      // TODO: show error to user
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  }, [selectedProject, closeDialog, options]);

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
