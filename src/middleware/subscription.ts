/**
 * Subscription Limits Middleware
 * Checks subscription tier limits before allowing resource creation
 */

import { createMiddleware } from 'hono/factory';
import type { Env, Owner } from '../types';
import { SUBSCRIPTION_TIERS } from '../types';
import { errorResponse, ERROR_CODES } from '../utils/response';

/**
 * Check if owner can add more properties
 */
export const checkPropertyLimit = createMiddleware<{ 
  Bindings: Env; 
  Variables: { ownerId: number; owner: Omit<Owner, 'password_hash'> } 
}>(async (c, next) => {
  try {
    const owner = c.get('owner');
    const tier = SUBSCRIPTION_TIERS[owner.subscription_tier];

    // Count current properties
    const result = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM properties WHERE owner_id = ?')
      .bind(owner.id)
      .first<{ count: number }>();

    const currentCount = result?.count || 0;

    if (currentCount >= tier.limits.max_properties) {
      return errorResponse(
        c,
        ERROR_CODES.LIMIT_REACHED,
        `Limite atteinte : ${tier.limits.max_properties} biens maximum pour votre plan ${tier.name}. Upgradez votre abonnement pour ajouter plus de biens.`,
        403,
        {
          current: currentCount,
          limit: tier.limits.max_properties,
          tier: owner.subscription_tier
        }
      );
    }

    await next();
  } catch (error) {
    console.error('[subscription.checkPropertyLimit]', error);
    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la vérification des limites d\'abonnement.',
      500
    );
  }
});

/**
 * Check if owner can add more tenants
 */
export const checkTenantLimit = createMiddleware<{ 
  Bindings: Env; 
  Variables: { ownerId: number; owner: Omit<Owner, 'password_hash'> } 
}>(async (c, next) => {
  try {
    const owner = c.get('owner');
    const tier = SUBSCRIPTION_TIERS[owner.subscription_tier];

    // Count current tenants
    const result = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM tenants WHERE owner_id = ? AND status = ?')
      .bind(owner.id, 'active')
      .first<{ count: number }>();

    const currentCount = result?.count || 0;

    if (currentCount >= tier.limits.max_tenants) {
      return errorResponse(
        c,
        ERROR_CODES.LIMIT_REACHED,
        `Limite atteinte : ${tier.limits.max_tenants} locataires actifs maximum pour votre plan ${tier.name}. Upgradez votre abonnement.`,
        403,
        {
          current: currentCount,
          limit: tier.limits.max_tenants,
          tier: owner.subscription_tier
        }
      );
    }

    await next();
  } catch (error) {
    console.error('[subscription.checkTenantLimit]', error);
    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la vérification des limites d\'abonnement.',
      500
    );
  }
});

/**
 * Check if owner can send more notifications this month
 */
export const checkNotificationLimit = createMiddleware<{ 
  Bindings: Env; 
  Variables: { ownerId: number; owner: Omit<Owner, 'password_hash'> } 
}>(async (c, next) => {
  try {
    const owner = c.get('owner');
    const tier = SUBSCRIPTION_TIERS[owner.subscription_tier];

    // Count notifications sent this month
    const result = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE owner_id = ? 
          AND status = 'sent'
          AND strftime('%Y-%m', sent_at) = strftime('%Y-%m', 'now')
      `)
      .bind(owner.id)
      .first<{ count: number }>();

    const currentCount = result?.count || 0;

    if (currentCount >= tier.limits.notifications) {
      return errorResponse(
        c,
        ERROR_CODES.LIMIT_REACHED,
        `Limite atteinte : ${tier.limits.notifications} notifications/mois maximum pour votre plan ${tier.name}. Upgradez votre abonnement.`,
        403,
        {
          current: currentCount,
          limit: tier.limits.notifications,
          tier: owner.subscription_tier
        }
      );
    }

    await next();
  } catch (error) {
    console.error('[subscription.checkNotificationLimit]', error);
    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Erreur lors de la vérification des limites d\'abonnement.',
      500
    );
  }
});

/**
 * Check if feature is available in current subscription
 */
export function checkFeatureAccess(
  owner: Omit<Owner, 'password_hash'>,
  feature: 'reports' | 'advanced_analytics' | 'white_label'
): boolean {
  const tier = SUBSCRIPTION_TIERS[owner.subscription_tier];
  return tier.limits[feature] === true;
}
