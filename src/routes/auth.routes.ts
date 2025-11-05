/**
 * Authentication Routes
 * Handles registration, login, and password management
 */

import { Hono } from 'hono';
import type { Env, RegisterRequest, LoginRequest } from '../types';
import { 
  registerOwner, 
  loginOwner, 
  changePassword, 
  resetPassword, 
  isEmailAvailable 
} from '../services/auth.service';
import { 
  successResponse, 
  errorResponse, 
  ERROR_CODES, 
  SUCCESS_MESSAGES 
} from '../utils/response';
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizePhone,
  validateRequiredFields,
  sanitizeString
} from '../utils/validation';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/register
 * Register new owner account
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<RegisterRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, [
      'email',
      'password',
      'full_name',
      'phone'
    ]);

    if (!valid) {
      return errorResponse(
        c,
        ERROR_CODES.MISSING_FIELDS,
        `Champs manquants : ${missing.join(', ')}`,
        400
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Format email invalide',
        400
      );
    }

    // Check email availability
    const emailAvailable = await isEmailAvailable(c.env.DB, body.email.toLowerCase());
    if (!emailAvailable) {
      return errorResponse(
        c,
        ERROR_CODES.ALREADY_EXISTS,
        'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.',
        409
      );
    }

    // Validate password strength
    if (!isValidPassword(body.password)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Mot de passe trop faible. Minimum 8 caractères avec au moins une lettre et un chiffre.',
        400
      );
    }

    // Validate phone
    if (!isValidPhone(body.phone)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Format numéro de téléphone invalide',
        400
      );
    }

    // Sanitize and normalize input
    const data: RegisterRequest = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      full_name: sanitizeString(body.full_name),
      phone: normalizePhone(body.phone)
    };

    // Register owner
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const result = await registerOwner(c.env.DB, jwtSecret, data);

    return successResponse(
      c,
      result,
      'Compte créé avec succès ! Bienvenue sur LokoManager.',
      201
    );
  } catch (error: any) {
    console.error('[auth.register]', error);

    // Handle unique constraint violation (email already exists)
    if (error.message?.includes('UNIQUE constraint failed')) {
      return errorResponse(
        c,
        ERROR_CODES.ALREADY_EXISTS,
        'Cet email est déjà utilisé.',
        409
      );
    }

    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la création du compte. Veuillez réessayer.',
      500
    );
  }
});

/**
 * POST /api/auth/login
 * Login existing owner
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['email', 'password']);

    if (!valid) {
      return errorResponse(
        c,
        ERROR_CODES.MISSING_FIELDS,
        `Champs manquants : ${missing.join(', ')}`,
        400
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Format email invalide',
        400
      );
    }

    // Normalize email
    const data: LoginRequest = {
      email: body.email.toLowerCase().trim(),
      password: body.password
    };

    // Attempt login
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const result = await loginOwner(c.env.DB, jwtSecret, data);

    return successResponse(
      c,
      result,
      'Connexion réussie ! Bienvenue.'
    );
  } catch (error: any) {
    console.error('[auth.login]', error);

    if (error.message === 'INVALID_CREDENTIALS') {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Email ou mot de passe incorrect.',
        401
      );
    }

    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la connexion. Veuillez réessayer.',
      500
    );
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated owner
 */
auth.post('/change-password', authMiddleware, async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<{ old_password: string; new_password: string }>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['old_password', 'new_password']);

    if (!valid) {
      return errorResponse(
        c,
        ERROR_CODES.MISSING_FIELDS,
        `Champs manquants : ${missing.join(', ')}`,
        400
      );
    }

    // Validate new password strength
    if (!isValidPassword(body.new_password)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Nouveau mot de passe trop faible. Minimum 8 caractères avec au moins une lettre et un chiffre.',
        400
      );
    }

    // Change password
    await changePassword(c.env.DB, ownerId, body.old_password, body.new_password);

    return successResponse(
      c,
      null,
      'Mot de passe modifié avec succès.'
    );
  } catch (error: any) {
    console.error('[auth.change-password]', error);

    if (error.message === 'INVALID_PASSWORD') {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Ancien mot de passe incorrect.',
        401
      );
    }

    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors du changement de mot de passe.',
      500
    );
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password (for forgot password flow)
 * ⚠️ In production, this should require email verification first
 */
auth.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json<{ email: string; new_password: string }>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['email', 'new_password']);

    if (!valid) {
      return errorResponse(
        c,
        ERROR_CODES.MISSING_FIELDS,
        `Champs manquants : ${missing.join(', ')}`,
        400
      );
    }

    // Validate email
    if (!isValidEmail(body.email)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Format email invalide',
        400
      );
    }

    // Validate new password
    if (!isValidPassword(body.new_password)) {
      return errorResponse(
        c,
        ERROR_CODES.INVALID_INPUT,
        'Mot de passe trop faible.',
        400
      );
    }

    // Reset password
    await resetPassword(c.env.DB, body.email.toLowerCase().trim(), body.new_password);

    return successResponse(
      c,
      null,
      'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    );
  } catch (error: any) {
    console.error('[auth.reset-password]', error);

    // Don't reveal if email exists (security)
    return successResponse(
      c,
      null,
      'Si cet email existe, un lien de réinitialisation a été envoyé.'
    );
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated owner info
 */
auth.get('/me', authMiddleware, async (c) => {
  const owner = c.get('owner');
  return successResponse(c, owner);
});

export default auth;
