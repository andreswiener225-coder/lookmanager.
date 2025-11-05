/**
 * Authentication Service
 * Handles user registration, login, and password management
 */

import { hash, compare } from 'bcryptjs';
import { sign } from 'hono/jwt';
import type { Env, Owner, JWTPayload, RegisterRequest, LoginRequest, AuthResponse } from '../types';

const SALT_ROUNDS = 10;
const JWT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Register new owner
 */
export async function registerOwner(
  db: D1Database,
  jwtSecret: string,
  data: RegisterRequest
): Promise<AuthResponse> {
  // Hash password
  const passwordHash = await hash(data.password, SALT_ROUNDS);

  // Insert owner into database
  const result = await db
    .prepare(`
      INSERT INTO owners (email, password_hash, full_name, phone, subscription_tier, subscription_expires_at)
      VALUES (?, ?, ?, ?, 'free', NULL)
      RETURNING id, email, full_name, phone, subscription_tier, subscription_expires_at, created_at, updated_at
    `)
    .bind(data.email, passwordHash, data.full_name, data.phone)
    .first<Omit<Owner, 'password_hash'>>();

  if (!result) {
    throw new Error('Failed to create owner');
  }

  // Generate JWT token
  const token = await generateJWT(result, jwtSecret);

  return {
    token,
    owner: result
  };
}

/**
 * Login owner
 */
export async function loginOwner(
  db: D1Database,
  jwtSecret: string,
  data: LoginRequest
): Promise<AuthResponse> {
  // Find owner by email
  const owner = await db
    .prepare('SELECT * FROM owners WHERE email = ?')
    .bind(data.email)
    .first<Owner>();

  if (!owner) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Verify password
  const isValid = await compare(data.password, owner.password_hash);

  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Generate JWT token
  const token = await generateJWT(owner, jwtSecret);

  // Remove password_hash from response
  const { password_hash, ...ownerData } = owner;

  return {
    token,
    owner: ownerData
  };
}

/**
 * Generate JWT token
 */
export async function generateJWT(
  owner: Omit<Owner, 'password_hash'>,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: JWTPayload = {
    sub: owner.id,
    email: owner.email,
    tier: owner.subscription_tier,
    iat: now,
    exp: now + JWT_EXPIRY
  };

  return await sign(payload, secret);
}

/**
 * Change owner password
 */
export async function changePassword(
  db: D1Database,
  ownerId: number,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  // Get current password hash
  const owner = await db
    .prepare('SELECT password_hash FROM owners WHERE id = ?')
    .bind(ownerId)
    .first<{ password_hash: string }>();

  if (!owner) {
    throw new Error('Owner not found');
  }

  // Verify old password
  const isValid = await compare(oldPassword, owner.password_hash);

  if (!isValid) {
    throw new Error('INVALID_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await hash(newPassword, SALT_ROUNDS);

  // Update password
  await db
    .prepare('UPDATE owners SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newPasswordHash, ownerId)
    .run();
}

/**
 * Reset password (for forgot password flow)
 * In production, this would be called after email verification
 */
export async function resetPassword(
  db: D1Database,
  email: string,
  newPassword: string
): Promise<void> {
  // Hash new password
  const passwordHash = await hash(newPassword, SALT_ROUNDS);

  // Update password
  const result = await db
    .prepare('UPDATE owners SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?')
    .bind(passwordHash, email)
    .run();

  if (result.meta.changes === 0) {
    throw new Error('Owner not found');
  }
}

/**
 * Verify email uniqueness
 */
export async function isEmailAvailable(
  db: D1Database,
  email: string
): Promise<boolean> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM owners WHERE email = ?')
    .bind(email)
    .first<{ count: number }>();

  return (result?.count || 0) === 0;
}
