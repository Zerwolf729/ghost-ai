/**
 * Clerk user lookup helpers.
 * Uses @clerk/nextjs/server for server-side Clerk operations.
 */
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Extract primary email from Clerk user object.
 */
export function getPrimaryEmail(user: any): string | null {
  if (!user?.emailAddresses?.length) return null;
  const primary = user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId);
  return primary?.emailAddress || user.emailAddresses[0]?.emailAddress || null;
}

/**
 * Normalize email to lowercase for consistent comparison.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Fetch Clerk user data by email using @clerk/nextjs/server async client.
 * Returns null if no user found.
 */
export async function getClerkUserByEmail(email: string) {
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: [email],
    });

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error(`Clerk user lookup failed for ${email}:`, error);
    return null;
  }
}

/**
 * Extract display info from email (fallback when Clerk user not available).
 */
export function getDisplayInfo(email: string) {
  const normalized = normalizeEmail(email);
  return {
    email: normalized,
    name: email, // Will show email if no Clerk user data
    avatarUrl: null,
  };
}
