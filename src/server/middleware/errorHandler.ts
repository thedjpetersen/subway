/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */

import type { Request, Response, NextFunction } from 'express';
import { isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Extended Error with status code */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create an operational error (expected errors that we can handle)
 */
export function createError(
  message: string,
  statusCode = 500
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Global error handler middleware
 * Must be registered after all other middleware and routes
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;

  // Log error details
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    isOperational: err.isOperational,
  });

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    error: isProduction() && statusCode === 500
      ? 'Internal server error'
      : err.message,
    ...(isProduction() ? {} : { stack: err.stack }),
  });
}

/**
 * Handler for 404 Not Found
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = createError(`Not Found: ${req.originalUrl}`, 404);
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
