import React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface EditorNavbarProps {
  /**
   * Whether the sidebar is currently open. Determines which icon to show.
   */
  sidebarOpen: boolean;
  /**
   * Callback to toggle the sidebar open state.
   */
  onToggleSidebar: () => void;
}

/**
 * Fixed‑height top navigation bar used on every editor screen.
 *
 * - Left section: a button that toggles the project sidebar (shows `PanelLeftOpen`
 *   when the sidebar is closed and `PanelLeftClose` when it is open).
 * - Center section: placeholder for a title or breadcrumbs.
 * - Right section: Clerk `UserButton` for profile settings and logout.
 *
 * The bar uses the dark‑only theme tokens defined in `globals.css` via Tailwind
 * utilities (`bg-base`, `border-b`, `border-default`).
 */
export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="fixed top-0 right-0 left-0 flex h-14 items-center justify-between border-b border-default bg-base px-4 z-40">
      {/* Left – sidebar toggle */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-elevated"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-primary" />
        </button>
      )}

      {/* Center – title placeholder */}
      <div className="flex-1 text-center text-primary">
        {/* Add a real title here when needed */}
      </div>

      {/* Right – user menu */}
      <div className="flex items-center">
        <UserButton />
      </div>
    </header>
  );
};
