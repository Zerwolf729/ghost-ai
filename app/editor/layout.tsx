"use client";
import React, { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { cn } from "@/lib/utils";

/**
 * Layout for the /editor route.
 *
 * - Renders the top navigation bar (`EditorNavbar`).
 * - Renders the integrated project sidebar (`ProjectSidebar`) below the navbar.
 * - Manages the open/close state shared between the two components.
 * - Wraps the page content (`children`).
 * - Shifts main content right when the desktop sidebar is open.
 */
export default function EditorLayout({

  // added debug

  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  // Deterministic close handler for the sidebar
  const closeSidebar = () => {
  console.log('closeSidebar called');
  setSidebarOpen(false);
};

  return (
    <>
      {/* Top navigation bar */}
      <EditorNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* Integrated workspace sidebar */}
      <ProjectSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 min-h-screen bg-base pt-14 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0",
        )}
      >
        {children}
      </main>
    </>
  );
}
