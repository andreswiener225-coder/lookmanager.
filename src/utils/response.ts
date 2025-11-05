/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */

import type { Context } from 'hono';
import type { APIResponse } from '../types';

/**
 * Success response helper
 */
export function successResponse<T>(
  c: Context,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  const response: APIResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  return c.json(response, statusCode);
}

/**
 * Error response helper
 */
export function errorResponse(
  c: Context,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
) {
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
  return c.json(response, statusCode);
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  LIMIT_REACHED: 'LIMIT_REACHED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_INPUT: 'INVALID_INPUT',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
} as const;

/**
 * Common success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Créé avec succès',
  UPDATED: 'Mis à jour avec succès',
  DELETED: 'Supprimé avec succès',
  SENT: 'Envoyé avec succès',
  PROCESSED: 'Traité avec succès'
} as const;
