import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Simple Tabs container component.
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex space-x-2",
        "dark:text-white",
        className,
      )}
      {...props}
    />
  ),
);

Tabs.displayName = "Tabs";
