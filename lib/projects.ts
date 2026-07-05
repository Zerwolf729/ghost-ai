import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export interface ProjectRow {
  id: string;
  name: string;
}

export async function getOwnedProjects(): Promise<ProjectRow[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    });

    return projects.map((p) => ({ id: p.id, name: p.name }));
  } catch (error) {
    console.error('getOwnedProjects error:', error);
    return [];
  }
}

export async function getSharedProjects(): Promise<ProjectRow[]> {
  try {
    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) return [];

    const collaborators = await prisma.projectCollaborator.findMany({
      where: { email: user.emailAddresses[0].emailAddress },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return collaborators
      .map((c) => c.project)
      .filter(Boolean)
      .map((p) => ({ id: p.id, name: p.name }));
  } catch (error) {
    console.error('getSharedProjects error:', error);
    return [];
  }
}
