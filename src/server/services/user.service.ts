/**
 * User service
 * Handles user registration, authentication, and profile management
 */

import { prisma } from '../config/database.js';
import { hashPassword, verifyPassword, generateSessionId } from '../utils/crypto.js';
import { env } from '../config/env.js';
import type { User } from '@prisma/client';

export interface CreateUserData {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: Pick<User, 'id' | 'username' | 'sessionId'>;
  error?: string;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<User | null> {
  // Check if username already exists
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existing) {
    return null;
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
    },
  });

  return user;
}

/**
 * Authenticate a user with username and password
 */
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return { success: false, error: 'Wrong password' };
  }

  // Generate new session ID
  const sessionId = generateSessionId();

  // Update user with new session
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { sessionId },
    select: { id: true, username: true, sessionId: true },
  });

  return { success: true, user: updatedUser };
}

/**
 * Logout a user by clearing their session
 */
export async function logoutUser(sessionId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { sessionId },
      data: { sessionId: null },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user by session ID
 */
export async function getUserBySession(
  sessionId: string
): Promise<Pick<User, 'id' | 'username' | 'sessionId'> | null> {
  return prisma.user.findUnique({
    where: { sessionId },
    select: { id: true, username: true, sessionId: true },
  });
}

/**
 * Get user by ID
 */
export async function getUserById(
  id: string
): Promise<Pick<User, 'id' | 'username'> | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true },
  });
}

/**
 * Check if a user has an existing connection stored
 */
export async function hasStoredConnection(userId: string): Promise<boolean> {
  const connection = await prisma.connection.findUnique({
    where: { userId },
  });
  return connection !== null;
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions() {
  return {
    maxAge: env.SESSION_MAX_AGE,
    expires: new Date(Date.now() + env.SESSION_MAX_AGE),
    httpOnly: true,
    signed: true,
  };
}
