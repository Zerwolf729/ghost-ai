"use client";

import React from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { SidebarProvider, useSidebar } from "@/components/editor/sidebar-context";
import { cn } from "@/lib/utils";

/**
 * Layout for the /editor route.
 *
 * Wraps pages in SidebarProvider so navbar toggle syncs with sidebar open state.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <EditorLayoutInner>{children}</EditorLayoutInner>
    </SidebarProvider>
  );
}

function EditorLayoutInner({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <>
      <EditorNavbar sidebarOpen={isOpen} onToggleSidebar={toggle} />
      <main
        className={cn(
          "flex-1 min-h-screen bg-base pt-14 transition-all duration-300 ease-in-out",
          isOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        {children}
      </main>
    </>
  );
}
