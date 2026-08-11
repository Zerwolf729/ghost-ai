"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react";
import { useUser } from "@clerk/nextjs";
import type { ChatMessage } from "@/types/tasks";

interface ChatContextValue {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  broadcastMessage: (message: ChatMessage) => void;
  isWorking: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * A no-op provider for pages that don't need Liveblocks chat.
 * The home page renders AISidebar without a RoomProvider.
 */
export function LocalChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "Guest",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const broadcastMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, broadcastMessage, isWorking: false }}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Liveblocks-backed chat provider for workspace pages.
 * Receives RoomProvider from LiveblocksRoomWrapper.
 */
export function LiveblocksChatProvider({ children }: { children: React.ReactNode }) {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const broadcast = useBroadcastEvent();
  const { user } = useUser();
  const senderName = user?.firstName ?? user?.username ?? "You";
  const isWorking = false;

  // Listen for AI_CHAT events from other users
  useEventListener(({ event }) => {
    const ev = event as unknown as Record<string, unknown>;
    if (ev.type !== "AI_CHAT") return;
    const msg: unknown = ev.message;
    if (!msg || typeof msg !== "object") return;
    const m = msg as Record<string, unknown>;
    if (
      typeof m.id === "string" &&
      typeof m.sender === "string" &&
      typeof m.content === "string" &&
      typeof m.timestamp === "number"
    ) {
      const incoming: ChatMessage = {
        id: m.id,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      };
      setLocalMessages((prev) => {
        if (prev.some((p) => p.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    }
  });

  const sendMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: senderName,
        content,
        timestamp: Date.now(),
      };
      broadcast({ type: "AI_CHAT", message: msg } as never);
      setLocalMessages((prev) => [...prev, msg]);
    },
    [broadcast, senderName]
  );

  const broadcastMessage = useCallback(
    (message: ChatMessage) => {
      broadcast({ type: "AI_CHAT", message } as never);
      setLocalMessages((prev) => [...prev, message]);
    },
    [broadcast]
  );

  return (
    <ChatContext.Provider value={{ messages: localMessages, sendMessage, broadcastMessage, isWorking }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}