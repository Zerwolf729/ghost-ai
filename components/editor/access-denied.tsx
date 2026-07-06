import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Access denied page shown when user tries to access a project they don't have permission for.
 *
 * - Centered layout
 * - Lock icon
 * - Short message
 * - Link back to /editor
 */
export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-bg-subtle">
          <Lock className="w-8 h-8 text-text-muted" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
          <p className="text-text-secondary">
            You don't have permission to access this project.
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
