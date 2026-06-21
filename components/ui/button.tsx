import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Optional icon component from lucide-react
   */
  Icon?: LucideIcon;
  /**
   * Button variant
   */
  variant?: "default" | "outline" | "destructive";
  /**
   * Button size
   */
  size?: "default" | "lg";
  /**
   * Text label for the button
   */
  children: React.ReactNode;
}

/**
 * A styled button component that respects the project's dark theme.
 * Supports variants (default, outline, destructive) and sizes (default, lg).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, Icon, variant = "default", size = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "default" && "bg-accent-primary text-text-primary hover:bg-accent-primary/90",
          variant === "outline" && "border border-border-default bg-transparent hover:bg-bg-subtle text-text-primary",
          variant === "destructive" && "bg-state-error text-text-primary hover:bg-state-error/90",
          // Sizes
          size === "default" && "h-9 px-4 py-2",
          size === "lg" && "h-11 px-6 py-3",
          className,
        )}
        {...props}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
