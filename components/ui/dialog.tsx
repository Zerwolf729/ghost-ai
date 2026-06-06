import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Simple Dialog container component.
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border bg-background p-4 shadow-lg",
        "dark:bg-background-dark dark:border-gray-700",
        className,
      )}
      {...props}
    />
  ),
);

Dialog.displayName = "Dialog";
