import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - utility to merge Tailwind CSS class strings.
 *
 * It first runs `clsx` to handle conditional class names, then merges any Tailwind
 * conflicts (e.g., `p-2 p-4`) using `twMerge` so the later utility wins.
 *
 * Example:
 *   cn("bg-white", condition && "bg-black", "p-2 p-4")
 *   // → "bg-black p-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for the function arguments – compatible with `clsx`.
type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassArray
  | { [key: string]: any };

type ClassArray = ClassValue[];
