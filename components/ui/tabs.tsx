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

/**
 * TabsList – container for tab triggers.
 */
export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn("inline-flex border-b border-default", className)}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

/**
 * TabsTrigger – individual tab button.
 */
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => (
    <button
      ref={ref}
      data-value={value}
      role="tab"
      className={cn(
        "px-3 py-2 text-sm font-medium",
        "text-primary",
        "border-b-2 border-transparent",
        "hover:text-primary hover:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

// TabsContent – container for a tab's panel content
export const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tabpanel"
      className={cn("p-4", className)}
      {...props}
    />
  ),
);
TabsContent.displayName = "TabsContent";
