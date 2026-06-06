import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Optional icon component from lucide-react
   */
  Icon?: LucideIcon;
  /**
   * Text label for the button
   */
  children: React.ReactNode;
}

/**
 * A styled button component that respects the project's dark theme.
 * It uses the `cn` helper to merge Tailwind classes.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, Icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "dark:bg-primary-dark dark:text-primary-foreground-dark dark:hover:bg-primary-dark/90",
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
