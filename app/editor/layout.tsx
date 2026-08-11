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
  const { isLeftOpen, toggleLeft, isRightOpen, toggleRight } = useSidebar();

  const leftSidebar = (
    <aside
      className="fixed left-0 top-14 z-30 h-[calc(100vh-56px)] w-64 border-r border-border-default bg-bg-surface overflow-hidden transition-transform duration-300"
      style={{ transform: isLeftOpen ? "translateX(0)" : "translateX(-100%)" }}
    />
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden pt-14">
      {leftSidebar}
      {children}
    </main>
  );
}
