/**
 * Connection service
 * Handles IRC connection state persistence
 */

import { prisma } from '../config/database.js';
import type { Connection } from '@prisma/client';
import type { IrcAppState } from '@shared/types/index.js';

/**
 * Save connection state for a user
 */
export async function saveConnectionState(
  userId: string,
  connectionData: IrcAppState
): Promise<Connection> {
  const connectionDataJson = JSON.stringify(connectionData);
  return prisma.connection.upsert({
    where: { userId },
    update: { connectionData: connectionDataJson },
    create: { userId, connectionData: connectionDataJson },
  });
}

/**
 * Get stored connection state for a user
 */
export async function getConnectionState(
  userId: string
): Promise<IrcAppState | null> {
  const connection = await prisma.connection.findUnique({
    where: { userId },
  });

  if (!connection) {
    return null;
  }

  try {
    return JSON.parse(connection.connectionData) as IrcAppState;
  } catch {
    return null;
  }
}

/**
 * Delete stored connection state for a user
 */
export async function deleteConnectionState(userId: string): Promise<boolean> {
  try {
    await prisma.connection.delete({
      where: { userId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user has stored connection
 */
export async function hasConnection(userId: string): Promise<boolean> {
  const connection = await prisma.connection.findUnique({
    where: { userId },
    select: { id: true },
  });
  return connection !== null;
}
