import React from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Share2,
  MessageSquare,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  /**
   * Whether the sidebar is currently open. Determines which icon to show.
   */
  sidebarOpen: boolean;
  /**
   * Callback to toggle the sidebar open state.
   */
  onToggleSidebar: () => void;
  /**
   * Project name to display in the center.
   */
  projectName?: string;
  /**
   * Callback when share button is clicked.
   */
  onOpenShare?: () => void;
  /**
   * Whether current user is the project owner.
   */
  isOwner?: boolean;
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
  sidebarOpen,
  onToggleSidebar,
  projectName,
  onOpenShare,
  isOwner,
}) => {
  return (
    <header className="fixed top-0 right-0 left-0 flex h-14 items-center justify-between border-b border-default bg-base px-4 z-40">      
      {/* Left – sidebar toggle */}
      {sidebarOpen ? (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-elevated"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="h-5 w-5 text-primary" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-elevated"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-primary" />
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
        {/* Share button */}
        {onOpenShare && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenShare}
            className="h-10 w-10 hover:bg-elevated"
            aria-label="Share project"
          >
            <Share2 className="h-5 w-5 text-text-secondary" />
          </Button>
        )}

        {/* AI sidebar toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-elevated"
          aria-label="Toggle AI sidebar"
          disabled
        >
          <MessageSquare className="h-5 w-5 text-text-secondary" />
        </button>

        {/* User menu */}
        <UserButton />
      </div>
    </header>
  );
};
