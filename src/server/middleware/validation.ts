/**
 * Input validation middleware
 * Uses Zod for schema validation
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory for validating request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory for validating query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          error: 'Invalid query parameters',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validates socket event payload
 * Returns the parsed data or null if validation fails
 */
export function validateSocketPayload<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Socket payload validation failed:', result.error.errors);
    return null;
  }
  return result.data;
}

/**
 * Creates a validated socket event handler
 */
export function createValidatedHandler<T>(
  schema: ZodSchema<T>,
  handler: (data: T) => void | Promise<void>
) {
  return (data: unknown): void => {
    const validatedData = validateSocketPayload(schema, data);
    if (validatedData !== null) {
      void handler(validatedData);
    }
  };
}
