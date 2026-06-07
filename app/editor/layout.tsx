"use client";
import React, { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

/**
 * Layout for the /editor route.
 *
 * - Renders the top navigation bar (`EditorNavbar`).
 * - Renders the floating project sidebar (`ProjectSidebar`).
 * - Manages the open/close state shared between the two components.
 * - Wraps the page content (`children`).
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>
      {/* Top navigation bar */}
      <EditorNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* Floating project sidebar */}
      <ProjectSidebar isOpen={sidebarOpen} onClose={toggleSidebar} />

      {/* Main content area */}
      <main className="flex-1 pt-14 min-h-screen bg-base">
        {children}
      </main>
    </>
  );
}
