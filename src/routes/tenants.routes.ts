/**
 * Tenants Routes
 * Handles CRUD operations for tenants (locataires)
 */

import { Hono } from 'hono';
import type { Env, CreateTenantRequest, UpdateTenantRequest, Tenant } from '../types';
import { authMiddleware } from '../middleware/auth';
import { checkTenantLimit } from '../middleware/subscription';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { validateRequiredFields, isValidPhone, normalizePhone, isValidDate, sanitizeString, isValidAmount } from '../utils/validation';

const tenants = new Hono<{ Bindings: Env }>();

// All routes require authentication
tenants.use('/*', authMiddleware);

/**
 * GET /api/tenants
 * List all tenants for authenticated owner
 */
tenants.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const status = c.req.query('status'); // Filter by status (active, inactive, evicted)
    const propertyId = c.req.query('property_id'); // Filter by property

    let query = 'SELECT t.*, p.name as property_name FROM tenants t LEFT JOIN properties p ON t.property_id = p.id WHERE t.owner_id = ?';
    const params: any[] = [ownerId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (propertyId) {
      query += ' AND t.property_id = ?';
      params.push(propertyId);
    }

    query += ' ORDER BY t.created_at DESC';

    const results = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[tenants.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des locataires', 500);
  }
});

/**
 * GET /api/tenants/:id
 * Get single tenant details with property and payment info
 */
tenants.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    // Get tenant with property details
    const tenant = await c.env.DB
      .prepare(`
        SELECT t.*, p.name as property_name, p.address as property_address 
        FROM tenants t 
        LEFT JOIN properties p ON t.property_id = p.id 
        WHERE t.id = ? AND t.owner_id = ?
      `)
      .bind(id, ownerId)
      .first();

    if (!tenant) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire introuvable', 404);
    }

    // Get payment history
    const payments = await c.env.DB
      .prepare('SELECT * FROM rent_payments WHERE tenant_id = ? ORDER BY due_date DESC LIMIT 12')
      .bind(id)
      .all();

    return successResponse(c, {
      ...tenant,
      payment_history: payments.results || []
    });
  } catch (error) {
    console.error('[tenants.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération du locataire', 500);
  }
});

/**
 * POST /api/tenants
 * Create new tenant
 */
tenants.post('/', checkTenantLimit, async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<CreateTenantRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['property_id', 'full_name', 'phone', 'move_in_date', 'monthly_rent']);
    if (!valid) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, `Champs manquants: ${missing.join(', ')}`, 400);
    }

    // Validate phone
    if (!isValidPhone(body.phone)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format numéro de téléphone invalide', 400);
    }

    // Validate date
    if (!isValidDate(body.move_in_date)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format date invalide (YYYY-MM-DD)', 400);
    }

    // Validate amount
    if (!isValidAmount(body.monthly_rent)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Montant du loyer invalide', 400);
    }

    // Check if property exists and belongs to owner
    const property = await c.env.DB
      .prepare('SELECT id, status FROM properties WHERE id = ? AND owner_id = ?')
      .bind(body.property_id, ownerId)
      .first();

    if (!property) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Bien immobilier introuvable', 404);
    }

    // Sanitize input
    const data = {
      full_name: sanitizeString(body.full_name),
      phone: normalizePhone(body.phone),
      email: body.email ? sanitizeString(body.email) : null,
      id_card_number: body.id_card_number ? sanitizeString(body.id_card_number) : null,
      move_in_date: body.move_in_date,
      monthly_rent: body.monthly_rent,
      deposit_amount: body.deposit_amount || 0,
      emergency_contact: body.emergency_contact ? sanitizeString(body.emergency_contact) : null,
      notes: body.notes ? sanitizeString(body.notes) : null
    };

    const result = await c.env.DB
      .prepare(`
        INSERT INTO tenants (owner_id, property_id, full_name, phone, email, id_card_number, move_in_date, monthly_rent, deposit_amount, emergency_contact, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        ownerId,
        body.property_id,
        data.full_name,
        data.phone,
        data.email,
        data.id_card_number,
        data.move_in_date,
        data.monthly_rent,
        data.deposit_amount,
        data.emergency_contact,
        data.notes
      )
      .first<Tenant>();

    // Update property status to occupied
    await c.env.DB
      .prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind('occupied', body.property_id)
      .run();

    return successResponse(c, result, SUCCESS_MESSAGES.CREATED, 201);
  } catch (error) {
    console.error('[tenants.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création du locataire', 500);
  }
});

/**
 * PUT /api/tenants/:id
 * Update tenant
 */
tenants.put('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTenantRequest>();

    // Check if tenant exists and belongs to owner
    const existing = await c.env.DB
      .prepare('SELECT id, property_id, status FROM tenants WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire introuvable', 404);
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.full_name !== undefined) { updates.push('full_name = ?'); values.push(sanitizeString(body.full_name)); }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(normalizePhone(body.phone)); }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(sanitizeString(body.email)); }
    if (body.id_card_number !== undefined) { updates.push('id_card_number = ?'); values.push(sanitizeString(body.id_card_number)); }
    if (body.move_in_date !== undefined) { updates.push('move_in_date = ?'); values.push(body.move_in_date); }
    if (body.move_out_date !== undefined) { updates.push('move_out_date = ?'); values.push(body.move_out_date); }
    if (body.monthly_rent !== undefined) { updates.push('monthly_rent = ?'); values.push(body.monthly_rent); }
    if (body.deposit_amount !== undefined) { updates.push('deposit_amount = ?'); values.push(body.deposit_amount); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.emergency_contact !== undefined) { updates.push('emergency_contact = ?'); values.push(sanitizeString(body.emergency_contact)); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(sanitizeString(body.notes)); }

    if (updates.length === 0) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Aucune donnée à mettre à jour', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, ownerId);

    const result = await c.env.DB
      .prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first<Tenant>();

    // If tenant status changed to inactive/evicted, update property status to vacant
    if (body.status && (body.status === 'inactive' || body.status === 'evicted')) {
      await c.env.DB
        .prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind('vacant', existing.property_id)
        .run();
    }

    return successResponse(c, result, SUCCESS_MESSAGES.UPDATED);
  } catch (error) {
    console.error('[tenants.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour du locataire', 500);
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete tenant (soft delete - set status to inactive)
 */
tenants.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    // Check if there are pending payments
    const pendingPayments = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM rent_payments WHERE tenant_id = ? AND status IN (?, ?)')
      .bind(id, 'pending', 'late')
      .first<{ count: number }>();

    if (pendingPayments && pendingPayments.count > 0) {
      return errorResponse(c, ERROR_CODES.FORBIDDEN, `Impossible de supprimer un locataire avec ${pendingPayments.count} paiement(s) en attente`, 403);
    }

    // Get property_id before deletion
    const tenant = await c.env.DB
      .prepare('SELECT property_id FROM tenants WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first<{ property_id: number }>();

    if (!tenant) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire introuvable', 404);
    }

    // Soft delete: set status to inactive instead of hard delete
    const result = await c.env.DB
      .prepare('UPDATE tenants SET status = ?, move_out_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?')
      .bind('inactive', id, ownerId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Locataire introuvable', 404);
    }

    // Update property status to vacant
    await c.env.DB
      .prepare('UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind('vacant', tenant.property_id)
      .run();

    return successResponse(c, null, 'Locataire désactivé avec succès');
  } catch (error) {
    console.error('[tenants.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression du locataire', 500);
  }
});

export default tenants;
