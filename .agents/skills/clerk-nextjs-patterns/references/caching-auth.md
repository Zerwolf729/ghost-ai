# Caching with Auth

**CRITICAL**: Cache keys MUST include userId/orgId to prevent data leaking between users.

## User-Scoped Cache

```typescript
import { auth } from '@clerk/nextjs/server';
import { cacheTag } from 'next/cache';

async function getCachedUserData(userId: string) {
  'use cache';

  cacheTag(`user-${userId}`);

  return getUserData(userId);
}

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not signed in</div>;
  }

  const userData = await getCachedUserData(userId);

  return <div>{userData.name}</div>;
}
```

## Revalidate After Updates

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidateTag } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  await db.users.update({
    where: { id: userId },
    data: {
      name: formData.get('name') as string,
    },
  });

  revalidateTag(`user-${userId}`);
}
```

## Org-Scoped Cache

```typescript
import { auth } from '@clerk/nextjs/server';
import { cacheTag } from 'next/cache';

async function getCachedOrgData(orgId: string) {
  'use cache';

  cacheTag(`org-${orgId}`);

  return db.orgData.findMany({
    where: {
      organizationId: orgId,
    },
  });
}

export default async function OrgPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization selected</div>;
  }

  const orgData = await getCachedOrgData(orgId);

  return <div>{JSON.stringify(orgData)}</div>;
}
```

## Notes

- Always include `userId` or `orgId` in cache tags.
- Never cache authentication state itself.
- Use `revalidateTag()` after mutations.
- Avoid sharing cached data across users or organizations.