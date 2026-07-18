import React from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Share2,
  MessageSquare,
  Library,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  projectName?: string;
  onOpenShare?: () => void;
  isOwner?: boolean;
  onOpenStarterTemplates?: () => void;
}

/**
 * Fixed‑height top navigation bar used on every editor screen.
 *
 * - Left section: a button that toggles the project sidebar (shows `PanelLeftOpen`
 *   when the sidebar is closed and `PanelLeftClose` when it is open).
 * - Center section: project name or placeholder.
 * - Right section: share button, AI sidebar toggle, and Clerk `UserButton`.
 *
 * The bar uses the dark‑only theme tokens defined in `globals.css` via Tailwind
 * utilities (`bg-base`, `border-b`, `border-default`).
 */
export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightSidebarOpen,
  onToggleRightSidebar,
  projectName,
  onOpenShare,
  isOwner, // eslint-disable-line @typescript-eslint/no-unused-vars
  onOpenStarterTemplates,
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
          projectName ? "flex-1 max-w-[calc(100%-10rem)]" : "flex-1",
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

        {/* User menu */}
        <UserButton />
      </div>
    </header>
  );
};
