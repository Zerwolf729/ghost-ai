import React from "react";
import { X, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  /**
   * Whether the sidebar is visible.
   */
  isOpen: boolean;
  /**
   * Callback invoked when the close button is pressed.
   */
  onClose: () => void;
}

/**
 * Floating left sidebar used in the editor UI.
 *
 * - It overlays the editor canvas without affecting layout.
 * - Slides in from the left when `isOpen` is true.
 * - Contains a header, tab navigation, placeholder content, and a bottom "New Project" button.
 */
export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform bg-surface shadow-lg transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "border-r border-default",
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-default px-4 py-3">
        <h2 className="text-sm font-medium text-primary">Projects</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-elevated"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4 text-primary" />
        </button>
      </header>

      {/* Tabs */}
      <nav className="p-4">
        <Tabs className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="text-primary">My Projects</TabsTrigger>
            <TabsTrigger value="shared" className="text-primary">Shared</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Placeholder content for each tab – simple empty state */}
        <div className="mt-4 text-muted">No projects yet.</div>
      </nav>

      {/* Bottom New Project button */}
      <div className="absolute bottom-0 w-full border-t border-default p-4">
        <Button className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>
    </aside>
  );
};
