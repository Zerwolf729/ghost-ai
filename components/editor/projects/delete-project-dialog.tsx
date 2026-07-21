"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  isLoading: boolean;
  onDelete: () => Promise<void>;
}

/**
 * Dialog for deleting a project.
 *
 * Features:
 * - Destructive confirmation only (no input required)
 * - Shows the project name being deleted
 * - Confirm button uses destructive styling
 * - Loading state during deletion
 */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  isLoading,
  onDelete,
}: DeleteProjectDialogProps) {
  const handleDelete = () => {
    if (!isLoading) {
      onDelete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-text-primary">{projectName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-6">
          <div className="rounded-xl border border-state-error/20 bg-state-error/5 p-4">
            <p className="text-sm text-text-secondary">
              This action cannot be undone. All project data, including the canvas and generated
              specs, will be permanently deleted.
            </p>
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="gap-2 bg-state-error hover:bg-state-error/90"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
