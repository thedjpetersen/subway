/**
 * Message service
 * Handles message logging and history retrieval
 */

import { prisma } from '../config/database.js';
import type { Message } from '@prisma/client';

export interface MessageData {
  server: string;
  from: string;
  to: string;
  type: string;
  text?: string;
  attributes?: Record<string, unknown>;
}

/** Map of server -> channel -> userId for message logging */
const loggers: Map<string, Map<string, string>> = new Map();

/**
 * Set up logging for a channel
 */
export function setChannelLogger(
  server: string,
  channel: string,
  userId: string
): void {
  if (!loggers.has(server)) {
    loggers.set(server, new Map());
  }
  loggers.get(server)!.set(channel, userId);
}

/**
 * Remove logging for a channel
 */
export function removeChannelLogger(server: string, channel: string): void {
  loggers.get(server)?.delete(channel);
}

/**
 * Get the user ID responsible for logging a channel
 */
function getLoggerForChannel(
  server: string,
  channel: string,
  fromNick: string,
  defaultUserId: string
): string {
  const serverLoggers = loggers.get(server);
  if (!serverLoggers) {
    return defaultUserId;
  }

  // For private messages, create a consistent key
  if (!channel.startsWith('#')) {
    const pmKey = [channel, fromNick].sort().join('#');
    return serverLoggers.get(pmKey) ?? defaultUserId;
  }

  return serverLoggers.get(channel) ?? defaultUserId;
}

/**
 * Log a message to the database
 */
export async function logMessage(
  data: MessageData,
  userId: string
): Promise<Message | null> {
  // Don't log status messages
  if (data.to.replace('#', '') === 'status') {
    return null;
  }

  // Determine the target channel for logging
  let targetChannel = data.to;
  if (!data.to.startsWith('#')) {
    // Private message - create consistent key
    targetChannel = [data.to, data.from].sort().join('#');
  }

  const loggerUserId = getLoggerForChannel(
    data.server,
    targetChannel,
    data.from,
    userId
  );

  // Only log if this user is responsible
  if (loggerUserId !== userId) {
    return null;
  }

  try {
    const message = await prisma.message.create({
      data: {
        server: data.server,
        from: data.from,
        to: targetChannel,
        type: data.type,
        text: data.text ?? null,
        attributes: data.attributes ? JSON.stringify(data.attributes) : null,
        userId,
      },
    });
    return message;
  } catch (error) {
    console.error('Error logging message:', error);
    return null;
  }
}

/**
 * Load message history for a channel
 */
export async function loadHistory(
  userId: string,
  server: string,
  channel: string,
  beforeTimestamp: Date,
  limit = 25
): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      userId,
      server,
      to: channel,
      timestamp: { lt: beforeTimestamp },
    },
    orderBy: { id: 'desc' },
    take: limit,
  });
}

/**
 * Get recent messages for a channel
 */
export async function getRecentMessages(
  userId: string,
  server: string,
  channel: string,
  limit = 50
): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      userId,
      server,
      to: channel,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}
