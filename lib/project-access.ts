import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * Get current Clerk user identity: userId and primary email.
 */
export async function getCurrentUserIdentity() {
  const { userId } = await auth();
  const user = await currentUser();

  const primaryEmail = user?.emailAddresses?.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress;

  return {
    userId: userId || null,
    primaryEmail: primaryEmail || null,
  };
}

/**
 * Check if current user has access to a project (as owner or collaborator).
 */
export async function checkProjectAccess(projectId: string): Promise<boolean> {
  const { userId, primaryEmail } = await getCurrentUserIdentity();

  if (!userId && !primaryEmail) {
    return false;
  }

  // Check if user is the owner
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (project?.ownerId === userId) {
    return true;
  }

  // Check if user is a collaborator (normalize email)
  if (primaryEmail) {
    const normalizedEmail = primaryEmail.toLowerCase().trim();

    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        email: normalizedEmail,
      },
    });

    if (collaborator) {
      return true;
    }
  }

  return false;
}

/**
 * Get project by ID if user has access.
 */
export async function getProjectIfAccessible(projectId: string) {
  const hasAccess = await checkProjectAccess(projectId);

  if (!hasAccess) {
    return null;
  }

  return prisma.project.findUnique({
    where: { id: projectId },
  });
}

/**
 * Check if project exists.
 */
export async function projectExists(projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  return !!project;
}
