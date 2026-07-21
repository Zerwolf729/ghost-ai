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

  const rightSidebar = (
    <aside
      className={cn(
        "fixed right-0 top-14 z-30 h-[calc(100vh-56px)] flex flex-col bg-bg-surface overflow-hidden transition-all duration-300",
        isRightOpen ? "w-72 border-l border-border-default" : "w-0"
      )}
    >
      {isRightOpen && (
        <>
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3 shrink-0">
            <div className="size-2 rounded-full bg-accent-ai" />
            <h3 className="text-sm font-medium text-text-primary">AI Assistant</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-bg-elevated px-3 py-2 text-xs text-text-secondary">
                Hello! I can help you design your floor plan. Try asking me to add rooms, resize elements, or suggest layouts.
              </div>
              <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-accent-primary-dim px-3 py-2 text-xs text-text-primary">
                Add a bedroom
              </div>
            </div>
          </div>
          <div className="border-t border-border-default p-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated px-3 py-2">
              <input
                type="text"
                placeholder="Ask AI..."
                className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted outline-none"
                disabled
              />
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-lg bg-accent-ai text-white disabled:opacity-40"
                disabled
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );

  return (
    <>
      <EditorNavbar
        leftSidebarOpen={isLeftOpen}
        onToggleLeftSidebar={toggleLeft}
        rightSidebarOpen={isRightOpen}
        onToggleRightSidebar={toggleRight}
        isWorkspace={false}
      />
      <main className="relative h-screen w-screen overflow-hidden pt-14">
        {leftSidebar}
        {children}
        {rightSidebar}
      </main>
    </>
  );
}
