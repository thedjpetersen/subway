/**
 * Authentication routes
 * Handles login, logout endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { validateBody } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, type AuthenticatedRequest } from '../middleware/index.js';
import {
  loginUser,
  logoutUser,
  getSessionCookieOptions,
  hasStoredConnection,
} from '../services/user.service.js';
import { LoginRequestSchema } from '@shared/types/index.js';
import type { LoginResponse, LogoutResponse } from '@shared/types/index.js';

const router = Router();

/**
 * POST /login
 * Authenticate user and create session
 */
router.post(
  '/login',
  authLimiter,
  validateBody(LoginRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { username, password } = req.body;

    const result = await loginUser(username, password);

    if (!result.success || !result.user) {
      const response: LoginResponse = {
        status: 'error',
        error: result.error ?? 'Login failed',
      };
      res.status(401).json(response);
      return;
    }

    // Check if user has stored connection
    const hasConnection = await hasStoredConnection(result.user.id);

    // Set session cookie
    res.cookie('sessionid', result.user.sessionId, getSessionCookieOptions());

    const response: LoginResponse = {
      status: 'success',
      username: result.user.username,
      has_connection: hasConnection,
    };
    res.json(response);
  })
);

/**
 * POST /logout
 * Clear user session
 */
router.post(
  '/logout',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sessionId = req.signedCookies.sessionid as string | undefined;

    if (sessionId) {
      await logoutUser(sessionId);
    }

    res.clearCookie('sessionid');

    const response: LogoutResponse = { success: true };
    res.json(response);
  })
);

export default router;
