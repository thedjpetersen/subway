/**
 * Authentication middleware
 * Handles session-based authentication
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import type { AuthenticatedUser } from '@shared/types/index.js';

/** Extended request type with authenticated user */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware that requires authentication
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.signedCookies.sessionid as string | undefined;

  if (!sessionId) {
    res.status(401).json({ status: 'error', error: 'Not authenticated' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { sessionId },
      select: { id: true, username: true, sessionId: true },
    });

    if (!user || !user.sessionId) {
      res.clearCookie('sessionid');
      res.status(401).json({ status: 'error', error: 'Session expired' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      sessionId: user.sessionId,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that optionally attaches user if authenticated
 * Does not require authentication, but will attach user if session is valid
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.signedCookies.sessionid as string | undefined;

  if (!sessionId) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { sessionId },
      select: { id: true, username: true, sessionId: true },
    });

    if (user && user.sessionId) {
      req.user = {
        id: user.id,
        username: user.username,
        sessionId: user.sessionId,
      };
    }
    next();
  } catch (error) {
    // Don't fail on auth errors for optional auth
    console.error('Optional auth error:', error);
    next();
  }
}

/**
 * Get user from session ID (for Socket.IO authentication)
 */
export async function getUserFromSession(
  sessionId: string
): Promise<AuthenticatedUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { sessionId },
      select: { id: true, username: true, sessionId: true },
    });

    if (!user || !user.sessionId) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      sessionId: user.sessionId,
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}
