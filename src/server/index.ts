/**
 * Subway IRC Client - Server Entry Point
 * Modern TypeScript implementation
 */

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { env, isDevelopment, disconnectDatabase } from './config/index.js';
import { errorHandler, notFoundHandler, apiLimiter } from './middleware/index.js';
import routes from './routes/index.js';
import { initializeSocket, closeAllConnections } from './socket/index.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function startServer(): Promise<void> {
  try {
    logger.info('Starting Subway IRC Client...', { env: env.NODE_ENV });

    // Create Express app
    const app = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: isDevelopment() ? false : undefined,
    }));
    app.use(cors());

    // Rate limiting
    app.use(apiLimiter);

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Cookie parsing with secret
    app.use(cookieParser(env.COOKIE_SECRET));

    // Favicon handler (prevents 404 spam in logs)
    app.get('/favicon.ico', (_req, res) => res.status(204).end());

    // Static files (legacy - from tmp directory)
    app.use(express.static(path.join(rootDir, 'tmp')));

    // View engine (EJS)
    app.set('views', path.join(rootDir, 'tmp'));
    app.engine('ejs', (await import('ejs')).renderFile);
    app.set('view engine', 'ejs');

    // API routes
    app.use('/', routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = initializeSocket(httpServer);
    logger.info('Socket.IO initialized');

    // Start listening
    httpServer.listen(env.PORT, () => {
      logger.info(`Subway IRC client listening on port ${env.PORT}`, {
        port: env.PORT,
        env: env.NODE_ENV,
      });
    });

    // Graceful shutdown
    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        logger.info('Force shutdown requested');
        process.exit(1);
      }
      isShuttingDown = true;
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Force exit after 5 seconds if graceful shutdown fails
      const forceExitTimeout = setTimeout(() => {
        logger.warn('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 5000);

      try {
        // Close all IRC connections first (these keep the process alive)
        closeAllConnections();
        logger.info('IRC connections closed');

        // Close Socket.IO connections
        io.close();
        logger.info('Socket.IO closed');

        // Close HTTP server
        httpServer.close();
        logger.info('HTTP server closed');

        // Disconnect database
        await disconnectDatabase();
        logger.info('Database disconnected');

        clearTimeout(forceExitTimeout);
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        clearTimeout(forceExitTimeout);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
