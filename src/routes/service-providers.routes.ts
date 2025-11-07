/**
 * Service Providers Routes
 * Handles service providers/artisans management (artisans/fournisseurs)
 */

import { Hono } from 'hono';
import type { Env, CreateServiceProviderRequest, ServiceProvider } from '../types';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse, ERROR_CODES, SUCCESS_MESSAGES } from '../utils/response';
import { validateRequiredFields, isValidPhone, normalizePhone, sanitizeString } from '../utils/validation';

const serviceProviders = new Hono<{ Bindings: Env }>();

// All routes require authentication
serviceProviders.use('/*', authMiddleware);

/**
 * GET /api/service-providers
 * List all service providers
 */
serviceProviders.get('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const specialty = c.req.query('specialty'); // Filter by specialty

    let query = 'SELECT * FROM service_providers WHERE owner_id = ?';
    const params: any[] = [ownerId];

    if (specialty) {
      query += ' AND specialty LIKE ?';
      params.push(`%${specialty}%`);
    }

    query += ' ORDER BY rating DESC, name ASC';

    const results = await c.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    return successResponse(c, results.results || []);
  } catch (error) {
    console.error('[service-providers.list]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération des artisans', 500);
  }
});

/**
 * GET /api/service-providers/:id
 * Get single service provider details
 */
serviceProviders.get('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const provider = await c.env.DB
      .prepare('SELECT * FROM service_providers WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!provider) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Artisan introuvable', 404);
    }

    // Get expenses associated with this provider
    const expenses = await c.env.DB
      .prepare(`
        SELECT e.*, p.name as property_name
        FROM expenses e
        LEFT JOIN properties p ON e.property_id = p.id
        WHERE e.owner_id = ? AND e.paid_to = ?
        ORDER BY e.expense_date DESC
        LIMIT 10
      `)
      .bind(ownerId, provider.name)
      .all();

    return successResponse(c, {
      ...provider,
      recent_work: expenses.results || []
    });
  } catch (error) {
    console.error('[service-providers.get]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la récupération de l\'artisan', 500);
  }
});

/**
 * POST /api/service-providers
 * Create new service provider
 */
serviceProviders.post('/', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const body = await c.req.json<CreateServiceProviderRequest>();

    // Validate required fields
    const { valid, missing } = validateRequiredFields(body, ['name', 'phone', 'specialty']);
    if (!valid) {
      return errorResponse(c, ERROR_CODES.MISSING_FIELDS, `Champs manquants: ${missing.join(', ')}`, 400);
    }

    // Validate phone
    if (!isValidPhone(body.phone)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Format numéro de téléphone invalide', 400);
    }

    // Validate rating if provided
    if (body.rating !== undefined && (body.rating < 0 || body.rating > 5)) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Note invalide (0-5)', 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO service_providers (owner_id, name, phone, specialty, rating, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        ownerId,
        sanitizeString(body.name),
        normalizePhone(body.phone),
        sanitizeString(body.specialty),
        body.rating || 0,
        body.notes ? sanitizeString(body.notes) : null
      )
      .first<ServiceProvider>();

    return successResponse(c, result, SUCCESS_MESSAGES.CREATED, 201);
  } catch (error) {
    console.error('[service-providers.create]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la création de l\'artisan', 500);
  }
});

/**
 * PUT /api/service-providers/:id
 * Update service provider
 */
serviceProviders.put('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<CreateServiceProviderRequest>>();

    // Check if provider exists and belongs to owner
    const existing = await c.env.DB
      .prepare('SELECT id FROM service_providers WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .first();

    if (!existing) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Artisan introuvable', 404);
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(sanitizeString(body.name)); }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(normalizePhone(body.phone)); }
    if (body.specialty !== undefined) { updates.push('specialty = ?'); values.push(sanitizeString(body.specialty)); }
    if (body.rating !== undefined) { updates.push('rating = ?'); values.push(body.rating); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(sanitizeString(body.notes)); }

    if (updates.length === 0) {
      return errorResponse(c, ERROR_CODES.INVALID_INPUT, 'Aucune donnée à mettre à jour', 400);
    }

    values.push(id, ownerId);

    const result = await c.env.DB
      .prepare(`UPDATE service_providers SET ${updates.join(', ')} WHERE id = ? AND owner_id = ? RETURNING *`)
      .bind(...values)
      .first<ServiceProvider>();

    return successResponse(c, result, SUCCESS_MESSAGES.UPDATED);
  } catch (error) {
    console.error('[service-providers.update]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la mise à jour de l\'artisan', 500);
  }
});

/**
 * DELETE /api/service-providers/:id
 * Delete service provider
 */
serviceProviders.delete('/:id', async (c) => {
  try {
    const ownerId = c.get('ownerId');
    const id = c.req.param('id');

    const result = await c.env.DB
      .prepare('DELETE FROM service_providers WHERE id = ? AND owner_id = ?')
      .bind(id, ownerId)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse(c, ERROR_CODES.NOT_FOUND, 'Artisan introuvable', 404);
    }

    return successResponse(c, null, SUCCESS_MESSAGES.DELETED);
  } catch (error) {
    console.error('[service-providers.delete]', error);
    return errorResponse(c, ERROR_CODES.INTERNAL_ERROR, 'Erreur lors de la suppression de l\'artisan', 500);
  }
});

export default serviceProviders;
