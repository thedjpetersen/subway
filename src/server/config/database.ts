/**
 * Prisma database client configuration
 * Provides a singleton instance of the Prisma client
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env.js';

// Create a single Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment() ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

// Prevent multiple instances during hot reloading in development
if (isDevelopment()) {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
