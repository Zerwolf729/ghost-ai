import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Get Clerk user info for an email.
 */
async function getClerkUserByEmail(email: string) {
  try {
    const users = await clerkClient.users.getUserList({ emailAddress: [email] });
    return users.length > 0 ? users[0] : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/projects/:projectId/collaborators
 * List all collaborators for a project.
 * Accessible to owner and collaborators.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if user is owner or collaborator
    const isOwner = project.ownerId === userId;

    const collaboratorEmails = await prisma.projectCollaborator.findMany({
      where: { projectId },
      select: { email: true, createdAt: true },
    });

    // If user is not owner and not a collaborator, deny access
    if (!isOwner) {
      const currentUserData = await currentUser();
      const userHasAccess = collaboratorEmails.some(
        (c) => c.email === currentUserData?.emailAddresses?.[0]?.emailAddress
      );

      if (!userHasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Enrich collaborator emails with Clerk user data
    const enrichedCollaborators = await Promise.all(
      collaboratorEmails.map(async (c) => {
        const clerkUser = await getClerkUserByEmail(c.email);
        return {
          email: c.email,
          joinedAt: c.createdAt,
          name: clerkUser
            ? clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.username || c.email
            : c.email,
          avatarUrl: clerkUser?.imageUrl || null,
        };
      })
    );

    return NextResponse.json({
      collaborators: enrichedCollaborators,
      isOwner,
    });
  } catch (error) {
    console.error('GET collaborators error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects/:projectId/collaborators
 * Invite a collaborator by email.
 * Only accessible to project owner.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check project exists and user is owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already a collaborator
    const existing = await prisma.projectCollaborator.findFirst({
      where: { projectId, email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already a collaborator' }, { status: 409 });
    }

    // Add collaborator
    await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/:projectId/collaborators
 * Remove a collaborator by email.
 * Only accessible to project owner.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check project exists and user is owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove collaborator
    await prisma.projectCollaborator.deleteMany({
      where: { projectId, email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
