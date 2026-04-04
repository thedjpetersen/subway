/**
 * Route aggregator
 * Combines all route modules
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import appRoutes from './app.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Mount route modules
router.use('/', authRoutes);
router.use('/', appRoutes);

export default router;
