import React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

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
 * - Right section: empty for now (extension point for future actions).
 *
 * The bar uses the dark‑only theme tokens defined in `globals.css` via Tailwind
 * utilities (`bg-base`, `border-b`, `border-default`).
 */
export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="flex h-14 items-center justify-between border-b border-default bg-base px-4">
      {/* Left – sidebar toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-elevated"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5 text-primary" />
        ) : (
          <PanelLeftOpen className="h-5 w-5 text-primary" />
        )}
      </button>

      {/* Center – title placeholder */}
      <div className="flex-1 text-center text-primary">
        {/* Add a real title here when needed */}
      </div>

      {/* Right – empty for now */}
      <div className="w-10" />
    </header>
  );
};
