import * as React from "react";
import { cn } from "@/lib/utils";

export type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Simple scrollable container that respects dark theme.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border bg-background p-2 overflow-auto",
        "dark:bg-background-dark dark:border-gray-700",
        className,
      )}
      {...props}
    />
  ),
);

ScrollArea.displayName = "ScrollArea";
