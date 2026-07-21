// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import { LiveMap, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      isThinking: boolean;
    };

    // This is defensively typed for the camera. The runtime
    // "flow" node collection treats keys as sequential in the writable,
    // so LiveList is still efficiently compatible with the typed forEach/get
    // access used by the mutations across canvas-node-renderer.tsx and
    // custom-canvas-edge.tsx.
    Storage: {
      flow: LiveObject<{
        nodes: LiveMap<string, LiveObject<{
          data: LiveObject<{
            label: string;
            fill?: string;
            text?: string;
            shape?: string;
          }>;
        }>>;
        edges: LiveMap<string, LiveObject<{
          data: LiveObject<{
            label?: string;
          }>;
        }>>;
      }>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        cursorColor: string;
      };
    };

    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
