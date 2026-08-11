"use client";

import React, { createContext, useContext, useState } from "react";
import { AIStatus } from "@/types/tasks";

interface AIStatusContextType {
  status: AIStatus | "idle";
  text?: string;
  setStatus: (status: AIStatus | "idle", text?: string) => void;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

export function AIStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ status: AIStatus | "idle"; text?: string }>({
    status: "idle",
  });

  const setStatus = (status: AIStatus | "idle", text?: string) => {
    setState({ status, text });
  };

  return (
    <AIStatusContext.Provider value={{ ...state, setStatus }}>
      {children}
    </AIStatusContext.Provider>
  );
}

export function useAIStatus() {
  const context = useContext(AIStatusContext);
  if (!context) {
    throw new Error("useAIStatus must be used within AIStatusProvider");
  }
  return context;
}
