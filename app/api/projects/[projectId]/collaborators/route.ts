import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserIdentity } from '@/lib/project-access';

/**
 * Helper to normalize email to lowercase.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
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

    // If user is not owner, check if they are a collaborator
    if (!isOwner) {
      const { primaryEmail: userPrimaryEmail } = await getCurrentUserIdentity();

      if (!userPrimaryEmail) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const normalizedUserEmail = normalizeEmail(userPrimaryEmail);
      const userHasAccess = collaboratorEmails.some(
        (c) => normalizeEmail(c.email) === normalizedUserEmail
      );

      if (!userHasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Enrich collaborator emails with Clerk user data
    // Note: Clerk user lookup requires @clerk/clerk-sdk-node for backend
    // For now, return emails only - frontend can display name or email
    const enrichedCollaborators = collaboratorEmails.map((c) => ({
      email: c.email,
      joinedAt: c.createdAt,
      name: c.email, // Will be enriched client-side if Clerk user found
      avatarUrl: null,
    }));

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

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Check if already a collaborator
    const existing = await prisma.projectCollaborator.findFirst({
      where: { projectId, email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already a collaborator' }, { status: 409 });
    }

    // Add collaborator with normalized email
    await prisma.projectCollaborator.create({
      data: {
        projectId,
        email: normalizedEmail,
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

    // Normalize email for removal
    const normalizedEmail = normalizeEmail(email);

    // Remove collaborator
    await prisma.projectCollaborator.deleteMany({
      where: { projectId, email: normalizedEmail },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
