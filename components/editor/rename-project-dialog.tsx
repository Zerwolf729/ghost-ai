"use client";

import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
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

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectName: string;
  projectName: string;
  isLoading: boolean;
  onProjectNameChange: (name: string) => void;
  onRename: () => void;
}

/**
 * Dialog for renaming an existing project.
 *
 * Features:
 * - Project name input prefilled with current name
 * - Current project name shown in the description
 * - Input auto-focuses on open
 * - Enter key submits the form
 * - Loading state during rename
 */
export function RenameProjectDialog({
  open,
  onOpenChange,
  currentProjectName,
  projectName,
  isLoading,
  onProjectNameChange,
  onRename,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select the input when the dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && projectName !== currentProjectName && !isLoading) {
      onRename();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && projectName.trim() && projectName !== currentProjectName && !isLoading) {
      e.preventDefault();
      onRename();
    }
  };

  const hasChanged = projectName.trim() !== currentProjectName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Renaming <span className="font-medium text-text-primary">{currentProjectName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6">
            <div className="space-y-2">
              <label htmlFor="rename-project-name" className="text-sm font-medium text-text-primary">
                New Project Name
              </label>
              <Input
                ref={inputRef}
                id="rename-project-name"
                placeholder="Enter new project name"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full"
              />
            </div>
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
              disabled={!projectName.trim() || !hasChanged || isLoading}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {isLoading ? "Renaming..." : "Rename Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
