/**
 * LokoManager - Tenant Portal Routes
 * API endpoints for tenant dashboard access
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import type { Env } from '../types';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { createMiddleware } from 'hono/factory';

const tenantRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// TENANT AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Tenant authentication middleware
 * Verifies tenant JWT token and injects tenant context
 */
const tenantAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { tenantId: number; tenant: any };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, ERROR_CODES.UNAUTHORIZED, 'Token d\'authentification manquant', 401);
  }

  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';

  try {
    const payload = await verify(token, secret) as JWTPayload & { tenant_id: number };
    
    if (!payload.tenant_id) {
      return errorResponse(c, ERROR_CODES.UNAUTHORIZED, 'Token invalide', 401);
    }

    // Fetch tenant details
    const tenant = await c.env.DB.prepare(`
      SELECT id, full_name, email, phone, property_id, monthly_rent, 
             deposit_amount, move_in_date, status, emergency_contact
      FROM tenants 
      WHERE id = ? AND status = 'active'
    `).bind(payload.tenant_id).first();

    if (!tenant) {
      return errorResponse(c, ERROR_CODES.UNAUTHORIZED, 'Locataire non trouvé ou inactif', 401);
    }

    c.set('tenantId', payload.tenant_id);
    c.set('tenant', tenant);

    await next();
  } catch (error) {
    console.error('[tenant.auth.error]', error);
    return errorResponse(c, ERROR_CODES.UNAUTHORIZED, 'Token invalide ou expiré', 401);
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * POST /api/tenant/login
 * Tenant login with phone number and PIN
 */
tenantRoutes.post('/login', async (c) => {
  try {
    const { phone, pin } = await c.req.json();

    if (!phone || !pin) {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'Téléphone et code PIN requis');
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Find tenant by phone
    const tenant = await c.env.DB.prepare(`
      SELECT t.*, p.name as property_name, p.address as property_address,
             o.full_name as owner_name, o.phone as owner_phone, o.email as owner_email
      FROM tenants t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN owners o ON t.owner_id = o.id
      WHERE t.phone LIKE ? AND t.status = 'active'
      LIMIT 1
    `).bind(`%${normalizedPhone}%`).first();

    if (!tenant) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Aucun compte locataire trouvé avec ce numéro', 404);
    }

    // In a real app, verify PIN against stored hash
    // For MVP, we use last 4 digits of phone as PIN
    const expectedPin = normalizedPhone.slice(-4);
    
    if (pin !== expectedPin) {
      return errorResponse(c, ERROR_CODES.UNAUTHORIZED, 'Code PIN incorrect', 401);
    }

    // Generate JWT token
    const secret = c.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const payload = {
      tenant_id: tenant.id,
      phone: tenant.phone,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const token = await sign(payload, secret);

    // Remove sensitive data
    const tenantData = {
      id: tenant.id,
      full_name: tenant.full_name,
      email: tenant.email,
      phone: tenant.phone,
      property_id: tenant.property_id,
      property_name: tenant.property_name,
      property_address: tenant.property_address,
      monthly_rent: tenant.monthly_rent,
      deposit_amount: tenant.deposit_amount,
      move_in_date: tenant.move_in_date,
      status: tenant.status,
      owner_name: tenant.owner_name,
      owner_phone: tenant.owner_phone,
      owner_email: tenant.owner_email
    };

    return successResponse(c, { token, tenant: tenantData }, 'Connexion réussie');
  } catch (error) {
    console.error('[tenant.login.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la connexion');
  }
});

/**
 * GET /api/tenant/me
 * Get current tenant profile
 */
tenantRoutes.get('/me', tenantAuthMiddleware, async (c) => {
  try {
    const tenant = c.get('tenant');
    
    // Get property details
    const property = await c.env.DB.prepare(`
      SELECT p.*, o.full_name as owner_name, o.phone as owner_phone, o.email as owner_email
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE p.id = ?
    `).bind(tenant.property_id).first();

    return successResponse(c, {
      tenant,
      property
    });
  } catch (error) {
    console.error('[tenant.me.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du profil');
  }
});

// ============================================================================
// TENANT DASHBOARD ROUTES
// ============================================================================

/**
 * GET /api/tenant/payments
 * Get tenant payment history
 */
tenantRoutes.get('/payments', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const payments = await c.env.DB.prepare(`
      SELECT rp.*, p.name as property_name
      FROM rent_payments rp
      LEFT JOIN properties p ON rp.property_id = p.id
      WHERE rp.tenant_id = ?
      ORDER BY rp.due_date DESC
    `).bind(tenantId).all();

    // Calculate statistics
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'late') THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_count
      FROM rent_payments
      WHERE tenant_id = ?
    `).bind(tenantId).first();

    return successResponse(c, {
      payments: payments.results || [],
      statistics: stats
    });
  } catch (error) {
    console.error('[tenant.payments.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des paiements');
  }
});

/**
 * GET /api/tenant/notifications
 * Get tenant notifications (payment reminders, announcements)
 */
tenantRoutes.get('/notifications', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const tenant = c.get('tenant');

    // Get upcoming and late payments
    const upcomingPayments = await c.env.DB.prepare(`
      SELECT * FROM rent_payments
      WHERE tenant_id = ? 
        AND status IN ('pending', 'late')
        AND due_date >= date('now')
        AND due_date <= date('now', '+7 days')
      ORDER BY due_date ASC
    `).bind(tenantId).all();

    const latePayments = await c.env.DB.prepare(`
      SELECT *, 
             CAST((julianday('now') - julianday(due_date)) AS INTEGER) as days_late
      FROM rent_payments
      WHERE tenant_id = ? 
        AND status = 'late'
        AND due_date < date('now')
      ORDER BY due_date ASC
    `).bind(tenantId).all();

    // Generate notification objects
    const notifications = [];

    // Late payment notifications
    for (const payment of (latePayments.results || [])) {
      notifications.push({
        id: `late-${payment.id}`,
        type: 'payment_late',
        priority: 'high',
        title: 'Paiement en retard',
        message: `Votre loyer de ${payment.amount.toLocaleString()} FCFA est en retard de ${payment.days_late} jours`,
        date: payment.due_date,
        read: false
      });
    }

    // Upcoming payment notifications
    for (const payment of (upcomingPayments.results || [])) {
      const daysUntil = Math.ceil((new Date(payment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `upcoming-${payment.id}`,
        type: 'payment_upcoming',
        priority: 'medium',
        title: 'Paiement à venir',
        message: `Votre loyer de ${payment.amount.toLocaleString()} FCFA est dû dans ${daysUntil} jour(s)`,
        date: payment.due_date,
        read: false
      });
    }

    // Welcome notification for new tenants
    const moveInDate = new Date(tenant.move_in_date);
    const daysSinceMoveIn = Math.floor((Date.now() - moveInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceMoveIn <= 7) {
      notifications.unshift({
        id: 'welcome',
        type: 'info',
        priority: 'low',
        title: 'Bienvenue dans votre nouveau logement ! 🏠',
        message: `Nous espérons que vous vous sentez bien chez vous. N'hésitez pas à contacter votre propriétaire pour toute question.`,
        date: tenant.move_in_date,
        read: false
      });
    }

    return successResponse(c, {
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('[tenant.notifications.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des notifications');
  }
});

/**
 * POST /api/tenant/contact
 * Send message to property owner
 */
tenantRoutes.post('/contact', tenantAuthMiddleware, async (c) => {
  try {
    const { subject, message } = await c.req.json();
    const tenant = c.get('tenant');

    if (!subject || !message) {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'Sujet et message requis');
    }

    // In a real app, this would:
    // 1. Send email/SMS to owner
    // 2. Store message in database
    // 3. Create notification for owner
    
    // For MVP, we just log and confirm
    console.log('[tenant.contact]', {
      tenant_id: tenant.id,
      tenant_name: tenant.full_name,
      property_id: tenant.property_id,
      subject,
      message
    });

    return successResponse(c, {
      sent: true,
      message: 'Votre message a été envoyé au propriétaire'
    }, SUCCESS_MESSAGES.CREATED);
  } catch (error) {
    console.error('[tenant.contact.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de l\'envoi du message');
  }
});

/**
 * GET /api/tenant/dashboard
 * Get tenant dashboard summary
 */
tenantRoutes.get('/dashboard', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const tenant = c.get('tenant');

    // Get property details
    const property = await c.env.DB.prepare(`
      SELECT * FROM properties WHERE id = ?
    `).bind(tenant.property_id).first();

    // Get payment statistics
    const paymentStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'late') THEN amount ELSE 0 END), 0) as amount_due,
        COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_count
      FROM rent_payments
      WHERE tenant_id = ?
    `).bind(tenantId).first();

    // Get next payment
    const nextPayment = await c.env.DB.prepare(`
      SELECT * FROM rent_payments
      WHERE tenant_id = ? AND status IN ('pending', 'late')
      ORDER BY due_date ASC
      LIMIT 1
    `).bind(tenantId).first();

    // Get recent payments
    const recentPayments = await c.env.DB.prepare(`
      SELECT * FROM rent_payments
      WHERE tenant_id = ?
      ORDER BY due_date DESC
      LIMIT 5
    `).bind(tenantId).all();

    return successResponse(c, {
      tenant,
      property,
      payment_stats: paymentStats,
      next_payment: nextPayment,
      recent_payments: recentPayments.results || []
    });
  } catch (error) {
    console.error('[tenant.dashboard.error]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du tableau de bord');
  }
});

// ============================================================================
// TENANT PAYMENT METHODS
// ============================================================================

/**
 * GET /api/tenant/payment-methods
 * List tenant payment methods
 */
tenantRoutes.get('/payment-methods', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    
    const { results } = await c.env.DB
      .prepare('SELECT * FROM tenant_payment_methods WHERE tenant_id = ? ORDER BY is_default DESC, created_at DESC')
      .bind(tenantId)
      .all();
    
    return successResponse(c, results);
  } catch (error: any) {
    console.error('[tenant.payment-methods.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des moyens de paiement');
  }
});

/**
 * POST /api/tenant/payment-methods
 * Create tenant payment method
 */
tenantRoutes.post('/payment-methods', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    
    // Validation
    if (!body.type || !['orange_money', 'mtn_money', 'moov_money', 'wave', 'bank_transfer'].includes(body.type)) {
      return errorResponse(c, ERROR_CODES.VALIDATION_ERROR, 'Type de paiement invalide');
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE tenant_payment_methods SET is_default = 0 WHERE tenant_id = ?')
        .bind(tenantId)
        .run();
    }
    
    // Insert new payment method
    const result = await c.env.DB
      .prepare(`
        INSERT INTO tenant_payment_methods (
          tenant_id, type, phone_number, account_name, bank_name, account_number, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        tenantId,
        body.type,
        body.phone_number || null,
        body.account_name || null,
        body.bank_name || null,
        body.account_number || null,
        body.is_default ? 1 : 0
      )
      .first();
    
    return successResponse(c, result, SUCCESS_MESSAGES.CREATED);
  } catch (error: any) {
    console.error('[tenant.payment-methods.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création du moyen de paiement');
  }
});

/**
 * PUT /api/tenant/payment-methods/:id
 * Update tenant payment method
 */
tenantRoutes.put('/payment-methods/:id', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Check ownership
    const existing = await c.env.DB
      .prepare('SELECT * FROM tenant_payment_methods WHERE id = ? AND tenant_id = ?')
      .bind(id, tenantId)
      .first();
    
    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Moyen de paiement introuvable');
    }
    
    // If setting as default, unset other defaults
    if (body.is_default) {
      await c.env.DB
        .prepare('UPDATE tenant_payment_methods SET is_default = 0 WHERE tenant_id = ? AND id != ?')
        .bind(tenantId, id)
        .run();
    }
    
    // Update
    const updates = [];
    const values = [];
    
    if (body.type !== undefined) {
      updates.push('type = ?');
      values.push(body.type);
    }
    if (body.phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(body.phone_number || null);
    }
    if (body.account_name !== undefined) {
      updates.push('account_name = ?');
      values.push(body.account_name || null);
    }
    if (body.bank_name !== undefined) {
      updates.push('bank_name = ?');
      values.push(body.bank_name || null);
    }
    if (body.account_number !== undefined) {
      updates.push('account_number = ?');
      values.push(body.account_number || null);
    }
    if (body.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(body.is_default ? 1 : 0);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, tenantId);
    
    const result = await c.env.DB
      .prepare(`UPDATE tenant_payment_methods SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ? RETURNING *`)
      .bind(...values)
      .first();
    
    return successResponse(c, result);
  } catch (error: any) {
    console.error('[tenant.payment-methods.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour');
  }
});

/**
 * DELETE /api/tenant/payment-methods/:id
 * Delete tenant payment method
 */
tenantRoutes.delete('/payment-methods/:id', tenantAuthMiddleware, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    
    const result = await c.env.DB
      .prepare('DELETE FROM tenant_payment_methods WHERE id = ? AND tenant_id = ?')
      .bind(id, tenantId)
      .run();
    
    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Moyen de paiement introuvable');
    }
    
    return successResponse(c, { message: 'Moyen de paiement supprimé' });
  } catch (error: any) {
    console.error('[tenant.payment-methods.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression');
  }
});

export default tenantRoutes;
