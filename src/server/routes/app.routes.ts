/**
 * Application routes
 * Handles main page rendering and connection restoration
 */

import { Router } from 'express';
import type { Response } from 'express';
import { validateBody } from '../middleware/validation.js';
import {
  optionalAuth,
  asyncHandler,
  type AuthenticatedRequest,
} from '../middleware/index.js';
import { getSettings, defaultSettings } from '../services/settings.service.js';
import { RestoreConnectionRequestSchema, type RenderContext } from '@shared/types/index.js';

// Server settings (will be replaced with proper config later)
const hasDefaultServers = false;

const router = Router();

/**
 * GET /
 * Render main application page
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let settings = defaultSettings;
    let userContext: RenderContext['user'] = false;

    if (req.user) {
      settings = await getSettings(req.user.id);
      userContext = {
        id: req.user.id,
        username: req.user.username,
      };
    }

    const context: RenderContext = {
      user: userContext,
      default_servers: hasDefaultServers,
      settings: JSON.stringify(settings),
    };

    res.render('index.ejs', context);
  })
);

/**
 * POST /restore_connection
 * Restore user's IRC connection after page reload
 * Note: The actual connection restoration is handled via Socket.IO
 */
router.post(
  '/restore_connection',
  optionalAuth,
  validateBody(RestoreConnectionRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ status: 'error', error: 'Not authenticated' });
      return;
    }

    // The socket restoration is handled by the socket handler
    // This endpoint just validates the user is authenticated
    res.json({ status: 'success', username: req.user.username });
  })
);

export default router;
