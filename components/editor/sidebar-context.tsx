"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextValue {
  isLeftOpen: boolean;
  isRightOpen: boolean;
  toggleLeft: () => void;
  closeLeft: () => void;
  toggleRight: () => void;
  closeRight: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const toggleLeft = () => setIsLeftOpen((prev) => !prev);
  const closeLeft = () => setIsLeftOpen(false);
  const toggleRight = () => setIsRightOpen((prev) => !prev);
  const closeRight = () => setIsRightOpen(false);

  return (
    <SidebarContext.Provider value={{ isLeftOpen, isRightOpen, toggleLeft, closeLeft, toggleRight, closeRight }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
