import React from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Share2,
  MessageSquare,
  Library,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorNavbarProps {
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  projectName?: string;
  onOpenShare?: () => void;
  isOwner?: boolean;
  onOpenStarterTemplates?: () => void;
  saveStatus?: SaveStatus;
  onSaveNow?: () => void;
  isWorkspace?: boolean;
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightSidebarOpen,
  onToggleRightSidebar,
  projectName,
  onOpenShare,
  isOwner,
  onOpenStarterTemplates,
  saveStatus = "idle",
  onSaveNow,
  isWorkspace = false,
}) => {
  return (
    <header className="fixed top-0 right-0 left-0 flex h-14 items-center justify-between border-b border-border-default bg-bg-surface px-4 z-40">
      {/* Left – sidebar toggle */}
      {leftSidebarOpen ? (
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-subtle"
          aria-label="Close left sidebar"
        >
          <PanelLeftClose className="h-5 w-5 text-text-primary" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-subtle"
          aria-label="Open left sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-text-primary" />
        </button>
      )}

      {/* Center – project name */}
      <div
        className={cn(
          "text-center min-w-0 px-4",
          projectName ? "flex-1 max-w-[calc(100%-10rem)]" : "flex-1"
        )}
      >
        {projectName ? (
          <span className="text-sm font-medium text-text-primary truncate block">
            {projectName}
          </span>
        ) : null}
      </div>

      {/* Right – actions and user menu */}
      <div className="flex items-center gap-2">
        {/* Starter Templates button */}
        {onOpenStarterTemplates && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenStarterTemplates}
            className="h-10 w-10 hover:bg-bg-subtle"
            aria-label="Import starter template"
          >
            <Library className="h-5 w-5 text-text-secondary" />
          </Button>
        )}

        {/* Save button - only in workspace */}
        {isWorkspace && (
          <button
            type="button"
            onClick={onSaveNow}
            className="flex h-10 items-center gap-1.5 rounded-md px-2 hover:bg-bg-subtle"
            aria-label={`Save status: ${saveStatus}`}
            title={`Canvas ${saveStatus}`}
          >
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
                <span className="text-xs text-text-muted">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-xs text-text-muted">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-error" />
                <span className="text-xs text-error">Error</span>
              </>
            )}
            {saveStatus === "idle" && (
              <>
                <Save className="h-4 w-4 text-text-secondary" />
                <span className="text-xs text-text-muted">Save</span>
              </>
            )}
          </button>
        )}

        {/* Share button */}
        {onOpenShare && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenShare}
            className="h-10 w-10 hover:bg-bg-subtle"
            aria-label="Share project"
          >
            <Share2 className="h-5 w-5 text-text-secondary" />
          </Button>
        )}

        {/* AI sidebar toggle */}
        <button
          type="button"
          onClick={onToggleRightSidebar}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-subtle",
            rightSidebarOpen ? "bg-bg-subtle" : ""
          )}
          aria-label="Toggle AI sidebar"
        >
          <MessageSquare className="h-5 w-5 text-text-secondary" />
        </button>

        {/* User menu - conditionally shown based on workspace context */}
        {!isWorkspace && <UserButton />}
      </div>
    </header>
  );
};
