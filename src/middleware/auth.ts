/**
 * Authentication Middleware
 * Handles JWT token verification and owner context injection
 */

import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { Env, JWTPayload, Owner } from '../types';
import { errorResponse, ERROR_CODES } from '../utils/response';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and injects owner data into context
 */
export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { ownerId: number; owner: Omit<Owner, 'password_hash'> } }>(async (c, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        c,
        ERROR_CODES.UNAUTHORIZED,
        'Token d\'authentification manquant. Veuillez vous connecter.',
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const payload = await verify(token, secret) as JWTPayload;

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return errorResponse(
        c,
        ERROR_CODES.TOKEN_EXPIRED,
        'Votre session a expiré. Veuillez vous reconnecter.',
        401
      );
    }

    // Fetch owner data from database
    const owner = await c.env.DB
      .prepare('SELECT id, email, full_name, phone, subscription_tier, subscription_expires_at, created_at, updated_at FROM owners WHERE id = ?')
      .bind(payload.sub)
      .first<Omit<Owner, 'password_hash'>>();

    if (!owner) {
      return errorResponse(
        c,
        ERROR_CODES.UNAUTHORIZED,
        'Utilisateur introuvable. Compte peut-être supprimé.',
        401
      );
    }

    // Check subscription expiration
    if (owner.subscription_expires_at) {
      const expiresAt = new Date(owner.subscription_expires_at);
      if (expiresAt < new Date()) {
        return errorResponse(
          c,
          ERROR_CODES.SUBSCRIPTION_EXPIRED,
          'Votre abonnement a expiré. Veuillez renouveler pour continuer.',
          403
        );
      }
    }

    // Inject owner data into context
    c.set('ownerId', owner.id);
    c.set('owner', owner);

    await next();
  } catch (error: any) {
    console.error('[auth.middleware]', error);
    
    // Handle specific JWT errors
    if (error.name === 'JwtTokenInvalid') {
      return errorResponse(
        c,
        ERROR_CODES.TOKEN_INVALID,
        'Token invalide. Veuillez vous reconnecter.',
        401
      );
    }

    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la vérification de l\'authentification.',
      500
    );
  }
});

/**
 * Optional Auth Middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 * Useful for endpoints that have both authenticated and non-authenticated behavior
 */
export const optionalAuthMiddleware = createMiddleware<{ Bindings: Env; Variables: { ownerId?: number; owner?: Omit<Owner, 'password_hash'> } }>(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      await next();
      return;
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    
    try {
      const payload = await verify(token, secret) as JWTPayload;
      
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token expired, continue without auth
        await next();
        return;
      }

      const owner = await c.env.DB
        .prepare('SELECT id, email, full_name, phone, subscription_tier, subscription_expires_at, created_at, updated_at FROM owners WHERE id = ?')
        .bind(payload.sub)
        .first<Omit<Owner, 'password_hash'>>();

      if (owner) {
        c.set('ownerId', owner.id);
        c.set('owner', owner);
      }
    } catch {
      // Invalid token, continue without auth
    }

    await next();
  } catch (error) {
    console.error('[optionalAuth.middleware]', error);
    await next();
  }
});
