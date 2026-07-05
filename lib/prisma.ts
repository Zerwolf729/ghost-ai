import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL ?? '';

function createPrismaClient(): PrismaClient {
  // Accelerate: prisma+postgres:// connection string
  if (databaseUrl.startsWith('prisma+postgres://')) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    }).$extends(withAccelerate()) as unknown as PrismaClient;
  }

  // Direct: @prisma/adapter-pg over a pg pool
  const adapter = new PrismaPg(new Pool({ connectionString: databaseUrl }));
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
