import { Liveblocks } from "@liveblocks/node";

const API_KEY = process.env.LIVEBLOCKS_SECRET_KEY;

if (!API_KEY) {
  throw new Error("Missing LIVEBLOCKS_SECRET_KEY environment variable");
}

export const liveblocks = new Liveblocks({
  secret: API_KEY,
});

/**
 * Deterministically map a user ID to a consistent color from a fixed palette.
 */
export function getCursorColor(userId: string): string {
  const colors = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800",
    "#FF5722"
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
