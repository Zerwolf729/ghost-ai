/**
 * Clerk user lookup helpers.
 * Uses Clerk Backend API to enrich emails with display names and avatars.
 */

import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Fetch Clerk user data by email.
 * Returns null if no user found.
 */
export async function getClerkUserByEmail(email: string) {
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error(`Clerk user lookup failed for ${email}:`, error);
    return null;
  }
}

/**
 * Batch fetch Clerk user data for multiple emails.
 * Returns map of email -> user data.
 */
export async function getClerkUsersByEmails(emails: string[]) {
  const result: Record<string, any> = {};

  for (const email of emails) {
    const user = await getClerkUserByEmail(email);
    if (user) {
      result[email] = user;
    }
  }

  return result;
}

/**
 * Extract display info from Clerk user or email.
 */
export function getDisplayInfo(email: string, clerkUser: any | null) {
  if (!clerkUser) {
    return {
      name: email,
      avatarUrl: null,
    };
  }

  return {
    name: clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.username || email,
    avatarUrl: clerkUser.imageUrl,
  };
}
