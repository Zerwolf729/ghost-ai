"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";
import { ReactNode } from "react";

export function LiveblocksCanvasWrapper({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary fallback={<div>Error connecting to canvas</div>}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <ClientSideSuspense fallback={<div>Loading canvas...</div>}>
            {children}
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </ErrorBoundary>
  );
}
