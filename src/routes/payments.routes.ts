/**
 * Payments Routes
 * Handles rent payments management (paiements de loyer)
 */

import { Hono } from 'hono';
import type { Env, CreatePaymentRequest, UpdatePaymentRequest, RentPayment } from '../types';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { validateRequiredFields, isValidDate, isValidAmount, isValidPaymentMethod } from '../utils/validation';

const payments = new Hono<{ Bindings: Env }>();

// All routes require authentication
payments.use('/*', authMiddleware);

/**
 * GET /api/payments
 * List all payments with filters
 */
payments.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const status = c.req.query('status'); // Filter by status
    const tenantId = c.req.query('tenant_id'); // Filter by tenant
    const propertyId = c.req.query('property_id'); // Filter by property
    const month = c.req.query('month'); // Filter by month (YYYY-MM)

    let query = `
      SELECT rp.*, t.full_name as tenant_name, p.name as property_name 
      FROM rent_payments rp 
      LEFT JOIN tenants t ON rp.tenant_id = t.id 
      LEFT JOIN properties p ON rp.property_id = p.id 
      WHERE rp.owner_id = ?
    `;
    const params: any[] = [ownerId];

    if (status) {
      query += ' AND rp.status = ?';
      params.push(status);
    }

    if (tenantId) {
      query += ' AND rp.tenant_id = ?';
      params.push(tenantId);
    }

    if (propertyId) {
      query += ' AND rp.property_id = ?';
      params.push(propertyId);
    }

    if (month) {
      query += ' AND strftime("%Y-%m", rp.due_date) = ?';
      params.push(month);
    }

    query += ' ORDER BY rp.due_date DESC';

    const results = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[payments.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des paiements', 500);
  }
});

/**
 * GET /api/payments/pending
 * Get all pending/late payments
 */
payments.get('/pending', async (c) => {
  try {
    const ownerId = c.get('ownerId');

    const results = await c.env.DB
      .prepare(`
        SELECT 
          rp.*,
          t.full_name as tenant_name,
          t.phone as tenant_phone,
          p.name as property_name,
          CAST((julianday('now') - julianday(rp.due_date)) AS INTEGER) as days_late
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.owner_id = ?
          AND rp.status IN ('pending', 'late')
          AND rp.due_date <= date('now')
        ORDER BY rp.due_date ASC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[payments.pending]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des paiements en attente', 500);
  }
});

/**
 * GET /api/payments/upcoming
 * Get upcoming payments (next 30 days)
 */
payments.get('/upcoming', async (c) => {
  try {
    const ownerId = c.get('ownerId');

    const results = await c.env.DB
      .prepare(`
        SELECT 
          rp.*,
          t.full_name as tenant_name,
          t.phone as tenant_phone,
          p.name as property_name,
          CAST((julianday(rp.due_date) - julianday('now')) AS INTEGER) as days_until_due
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.owner_id = ?
          AND rp.status = 'pending'
          AND rp.due_date > date('now')
          AND rp.due_date <= date('now', '+30 days')
        ORDER BY rp.due_date ASC
      `)
      .bind(ownerId)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[payments.upcoming]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des paiements à venir', 500);
  }
});

/**
 * GET /api/payments/:id
 * Get single payment details
 */
payments.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const payment = await c.env.DB
      .prepare(`
        SELECT rp.*, t.full_name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
               p.name as property_name, p.address as property_address
        FROM rent_payments rp
        LEFT JOIN tenants t ON rp.tenant_id = t.id
        LEFT JOIN properties p ON rp.property_id = p.id
        WHERE rp.id = ? AND rp.owner_id = ?
      `)
      .bind(id, ownerId)
      .first();

    if (!payment) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    return successResponse(c, payment);
  } catch (error) {
    console.error('[payments.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du paiement', 500);
  }
});

/**
 * POST /api/payments
 * Create new payment record
 */
payments.post('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<CreatePaymentRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['tenant_id', 'property_id', 'amount', 'due_date']);
    if (!valid) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, `Champs manquants: ${missing.join(', ')}`, 400);
    }

    // Validate date
    if (!isValidDate(body.due_date)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format date échéance invalide (YYYY-MM-DD)', 400);
    }

    if (body.payment_date && !isValidDate(body.payment_date)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format date paiement invalide (YYYY-MM-DD)', 400);
    }

    // Validate amount
    if (!isValidAmount(body.amount)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Montant invalide', 400);
    }

    // Validate payment method if provided
    if (body.payment_method && !isValidPaymentMethod(body.payment_method)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Méthode de paiement invalide', 400);
    }

    // Check if tenant and property exist and belong to owner
    const tenant = await c.env.DB
      .prepare('SELECT id FROM tenants WHERE id = ? AND owner_id = ?')
      .bind(body.tenant_id, ownerId)
      .first();

    if (!tenant) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire introuvable', 404);
    }

    const property = await c.env.DB
      .prepare('SELECT id FROM properties WHERE id = ? AND owner_id = ?')
      .bind(body.property_id, ownerId)
      .first();

    if (!property) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
    }

    // Determine status based on dates
    let status = 'pending';
    if (body.payment_date) {
      status = 'completed';
    } else if (new Date(body.due_date) < new Date()) {
      status = 'late';
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO rent_payments (owner_id, tenant_id, property_id, amount, payment_date, due_date, payment_method, transaction_id, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        ownerId,
        body.tenant_id,
        body.property_id,
        body.amount,
        body.payment_date || null,
        body.due_date,
        body.payment_method || null,
        body.transaction_id || null,
        status,
        body.notes || null
      )
      .first<RentPayment>();

    return successResponse(c, result, SUCCESS_MESSAGES.CREATED, 201);
  } catch (error) {
    console.error('[payments.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création du paiement', 500);
  }
});

/**
 * PUT /api/payments/:id
 * Update payment (usually to mark as paid)
 */
payments.put('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');
    const body = await c.req.json<UpdatePaymentRequest>();

    // Check if payment exists and belongs to owner
    const existing = await c.env.DB
      .prepare('SELECT id, status FROM rent_payments WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.payment_date !== undefined) { updates.push('payment_date = ?'); values.push(body.payment_date); }
    if (body.payment_method !== undefined) { updates.push('payment_method = ?'); values.push(body.payment_method); }
    if (body.transaction_id !== undefined) { updates.push('transaction_id = ?'); values.push(body.transaction_id); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }

    // If payment_date is set and status not explicitly provided, set status to completed
    if (body.payment_date && !body.status) {
      updates.push('status = ?');
      values.push('completed');
    }

    if (updates.length === 0) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Aucune donnée à mettre à jour', 400);
    }

    values.push(id, ownerId);

    const result = await c.env.DB
      .prepare(`UPDATE rent_payments SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first<RentPayment>();

    return successResponse(c, result, SUCCESS_MESSAGES.UPDATED);
  } catch (error) {
    console.error('[payments.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour du paiement', 500);
  }
});

/**
 * DELETE /api/payments/:id
 * Delete payment record
 */
payments.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const result = await c.env.DB
      .prepare('DELETE FROM rent_payments WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Paiement introuvable', 404);
    }

    return successResponse(c, null, SUCCESS_MESSAGES.DELETED);
  } catch (error) {
    console.error('[payments.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression du paiement', 500);
  }
});

export default payments;
