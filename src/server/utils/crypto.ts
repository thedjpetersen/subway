/**
 * Cryptographic utilities
 * Password hashing and session token generation
 */

import bcrypt from 'bcrypt';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure session ID
 * Combines UUID v1 (time-based) and v4 (random) for high entropy
 */
export function generateSessionId(): string {
  return `${uuidv1()}${uuidv4()}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${Date.now()}-${uuidv4().slice(0, 8)}`;
}
