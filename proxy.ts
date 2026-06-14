// Updated Clerk authentication proxy for Next.js 16 (Node.js runtime)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that should remain public (no authentication required)
const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

/**
 * Clerk authentication proxy.
 *
 * - Public routes: sign‑in and sign‑up pages (environment variables are used by Clerk).
 * - All other routes are protected – unauthenticated users are redirected to sign‑in.
 */
export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    // `auth.protect` is async in newer Clerk versions; we must await it.
    await auth.protect();
  }
});

// Next.js matcher configuration. This mirrors the default from Clerk docs and ensures
// the proxy runs for app routes, API routes, and Clerk internal routes while skipping
// static assets and Next.js internals.
export const config = {
  matcher: [
    // Skip Next.js internals & static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk‑specific front‑end API routes
    "/__clerk/(.*)"
  ]
};
