import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Styled textarea component respecting dark mode.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-sm",
        "dark:bg-background-dark dark:border-gray-700",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
