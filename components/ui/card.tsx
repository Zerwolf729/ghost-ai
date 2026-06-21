import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Simple Card component that respects dark theme.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "dark:bg-card-dark dark:border-gray-700",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";
