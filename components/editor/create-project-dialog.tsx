"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  slug: string;
  isLoading: boolean;
  onProjectNameChange: (name: string) => void;
  onCreate: () => Promise<void>;
}

/**
 * Dialog for creating a new project.
 *
 * Features:
 * - Project name input with auto-focus
 * - Live slug preview that updates as the user types
 * - Enter key submits the form
 * - Loading state during creation
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
  projectName,
  slug,
  isLoading,
  onProjectNameChange,
  onCreate,
}: CreateProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && !isLoading) {
      onCreate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && projectName.trim() && !isLoading) {
      e.preventDefault();
      onCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start a new architecture workspace. Give your project a descriptive name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium text-text-primary">
                Project Name
              </label>
              <Input
                ref={inputRef}
                id="project-name"
                placeholder="e.g., E-commerce Platform"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Live slug preview */}
            {projectName.trim() && (
              <div className="space-y-1.5 rounded-xl border border-border-default bg-bg-subtle p-3">
                <p className="text-xs font-medium text-text-secondary">Project URL</p>
                <p className="text-sm font-mono text-text-primary">
                  /editor/<span className="text-accent-primary">{slug || "..."}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!projectName.trim() || isLoading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
