/**
 * Rate limiting middleware
 * Protects against brute force and DoS attacks
 */

import rateLimit from 'express-rate-limit';

/** General API rate limiter */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { status: 'error', error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter rate limiter for authentication endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { status: 'error', error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

/** Socket connection rate limiter (custom implementation) */
const socketRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkSocketRateLimit(
  ip: string,
  limit = 30,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = socketRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    socketRateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/** Clean up expired rate limit records (call periodically) */
export function cleanupSocketRateLimits(): void {
  const now = Date.now();
  for (const [ip, record] of socketRateLimitMap.entries()) {
    if (now > record.resetTime) {
      socketRateLimitMap.delete(ip);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupSocketRateLimits, 5 * 60 * 1000);
