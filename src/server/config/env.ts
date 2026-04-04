/**
 * Environment configuration with Zod validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('3000'),

  DATABASE_URL: z.string().default('file:./subway.db'),

  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET must be at least 32 characters')
    .default(() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('COOKIE_SECRET must be set in production');
      }
      return 'development-only-secret-change-in-production';
    }),

  BCRYPT_ROUNDS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(10).max(14))
    .default('12'),

  SESSION_MAX_AGE: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('86400000'), // 24 hours

  DEBUG_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('Invalid environment configuration:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';
