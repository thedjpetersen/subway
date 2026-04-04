/**
 * HTTP API type definitions
 * Defines request/response types for REST endpoints
 */

import { z } from 'zod';

// ============================================
// REQUEST VALIDATION SCHEMAS
// ============================================

export const LoginRequestSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128),
  socketid: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RestoreConnectionRequestSchema = z.object({
  socketid: z.string(),
});
export type RestoreConnectionRequest = z.infer<typeof RestoreConnectionRequestSchema>;

// ============================================
// RESPONSE TYPES
// ============================================

export interface LoginSuccessResponse {
  status: 'success';
  username: string;
  has_connection: boolean;
}

export interface LoginErrorResponse {
  status: 'error';
  error: string;
}

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export interface LogoutResponse {
  success: boolean;
}

export interface ErrorResponse {
  status: 'error';
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================
// VIEW CONTEXT TYPES
// ============================================

export interface UserContext {
  id: string;
  username: string;
}

export interface RenderContext {
  user: UserContext | false;
  default_servers: boolean;
  settings: string;
}

// ============================================
// AUTHENTICATED REQUEST
// ============================================

export interface AuthenticatedUser {
  id: string;
  username: string;
  sessionId: string;
}
