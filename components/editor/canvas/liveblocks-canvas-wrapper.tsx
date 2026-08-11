"use client";

import { LiveMap, LiveObject } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";
import { ReactNode } from "react";

export function LiveblocksRoomWrapper({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary fallback={<div>Error connecting to canvas</div>}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, thinking: false }}
          initialStorage={{
            flow: new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            }),
          }}
        >
          {children}
        </RoomProvider>
      </LiveblocksProvider>
    </ErrorBoundary>
  );
}
